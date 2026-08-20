/* ============================================================
   KONTO PACJENTA — spójna ścieżka wersji pokazowej
   ============================================================

   Logowanie, pamięć sesji i strażnik panelu. Dzięki temu trzy podstrony
   zachowują się jak jedna całość: nie da się wejść do panelu bez
   zalogowania, a wylogowanie odsyła tam, skąd się przyszło.

   UWAGA — to NIE jest zabezpieczenie. Dane logowania stoją niżej
   otwartym tekstem, w pliku, który przeglądarka pobiera na każde
   wejście: każdy, kto otworzy źródło strony, je zobaczy. Sprawdzenie
   po stronie przeglądarki da się obejść jedną linijką w konsoli.
   Tak wygląda makieta, która ma płynnie działać na pokazie, i tylko
   tym jest. W wersji z prawdziwymi kontami hasła sprawdza serwer,
   trzyma je w postaci skrótu (bcrypt/argon2), a przeglądarka nie
   dostaje ich nigdy.
   ============================================================ */
(function () {
  "use strict";

  /* Dane pokazowe — patrz ostrzeżenie wyżej. */
  var LOGIN = "KosmaLabuz";
  var HASLO = "cycki";

  /* Panel wita człowieka, nie nazwę konta: „Dzień dobry, KosmaLabuz”
     brzmi jak komunikat systemu. Imię idzie do powitania, pełne dane
     do kartoteki. */
  var IMIE = "Kosma";
  var PELNE = "Kosma Łabuz";

  var KLUCZ = "dentalpark-konto";

  function zalogowany() {
    try {
      return JSON.parse(sessionStorage.getItem(KLUCZ) || "null");
    } catch (e) {
      return null;
    }
  }

  function zapisz(kto, imie, pelne) {
    try {
      sessionStorage.setItem(KLUCZ, JSON.stringify({
        kto: kto, imie: imie || kto, pelne: pelne || kto, kiedy: Date.now()
      }));
    } catch (e) { /* tryb prywatny — zostaje sama ścieżka bez pamięci */ }
  }

  function wyczysc() {
    try { sessionStorage.removeItem(KLUCZ); } catch (e) { /* nic */ }
  }

  /* ---------- 1. STRAŻNIK PANELU ----------
     Panel bez zalogowania nie ma czego pokazywać, a pusta strona
     z cudzymi wizytami byłaby myląca. Odsyłamy na logowanie i wracamy
     tam, skąd przyszliśmy. */
  if (document.body.dataset.wymagaKonta !== undefined) {
    if (!zalogowany()) {
      var wroc = location.pathname.split("/").pop() || "panel.html";
      location.replace("logowanie.html?wroc=" + encodeURIComponent(wroc));
      return;
    }
    var dane = zalogowany();
    document.querySelectorAll("[data-kto]").forEach(function (el) {
      el.textContent = el.dataset.kto === "pelne" ? (dane.pelne || dane.kto) : (dane.imie || dane.kto);
    });
  }

  /* ---------- 2. WYLOGOWANIE ---------- */
  document.querySelectorAll("[data-wyloguj]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      wyczysc();
      location.href = "logowanie.html";
    });
  });

  /* ---------- 3. LOGOWANIE ---------- */
  var formLog = document.querySelector("[data-logowanie]");
  if (formLog) {
    /* Ktoś już zalogowany nie ma po co wypełniać formularza drugi raz. */
    if (zalogowany()) {
      var znak = formLog.querySelector("[data-juz]");
      if (znak) znak.hidden = false;
    }

    formLog.addEventListener("submit", function (e) {
      e.preventDefault();
      var login = formLog.querySelector("#l-login").value.trim();
      var haslo = formLog.querySelector("#l-haslo").value;
      var blad = formLog.querySelector("[data-blad]");

      if (login.toLowerCase() !== LOGIN.toLowerCase() || haslo !== HASLO) {
        blad.hidden = false;
        blad.textContent = "Nieprawidłowy login lub hasło. W wersji pokazowej działa jedno konto — dane są wypisane pod formularzem.";
        formLog.querySelector("#l-haslo").focus();
        return;
      }

      blad.hidden = true;
      zapisz(LOGIN, IMIE, PELNE);
      var wroc = new URLSearchParams(location.search).get("wroc");
      location.href = (wroc === "rezerwacja.html") ? "rezerwacja.html" : "panel.html";
    });
  }

  /* ---------- 4. ZAKŁADANIE KONTA ----------
     W wersji pokazowej konto powstaje od ręki, żeby dało się przejść
     całą drogę bez czekania na potwierdzenie z rejestracji. */
  var formRej = document.querySelector("[data-rejestracja]");
  if (formRej) {
    formRej.addEventListener("submit", function (e) {
      e.preventDefault();
      var imie = formRej.querySelector("#r-imie").value.trim();
      if (!formRej.checkValidity()) { formRej.reportValidity(); return; }
      /* Przy zakładaniu konta imię bierzemy z pierwszego członu, bo tak
         wita się człowieka: „Dzień dobry, Anno”, nie „Anno Kowalska”. */
      zapisz(imie || LOGIN, (imie || IMIE).split(" ")[0], imie || PELNE);
      location.href = "panel.html";
    });
  }

  /* ---------- 5. ŚLAD ZALOGOWANIA W PASKU ----------
     Ikona konta prowadzi do panelu, jeśli ktoś jest zalogowany —
     inaczej odsyłałaby na logowanie kogoś, kto już się zalogował. */
  if (zalogowany()) {
    document.querySelectorAll('.masthead__konto[href="logowanie.html"]').forEach(function (el) {
      el.setAttribute("href", "panel.html");
    });
  }
})();
