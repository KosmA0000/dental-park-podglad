/* ============================================================
   REZERWACJA WIZYTY — wersja pokazowa
   ============================================================

   Za tą stroną nie ma serwera. Terminy nie są pobierane z grafiku
   gabinetu ani nigdzie zapisywane, a opłata nie jest pobierana —
   pasek u góry mówi o tym pacjentowi wprost, zanim cokolwiek kliknie.

   Zajętość terminów wyliczamy z samej daty, a nie losujemy. Losowanie
   dawałoby inny kalendarz przy każdym odświeżeniu: pacjent, który
   wrócił do zakładki, widziałby, że jego termin zniknął. Ten sam dzień
   daje więc zawsze ten sam obraz.

   Stany terminu — takie same w kalendarzu i na liście godzin:
     • wolny  — biały
     • czeka  — piaskowy; ktoś go trzyma, ale jeszcze nie potwierdził
     • zajęty — zielony; rezerwacja potwierdzona
   ============================================================ */
(function () {
  "use strict";

  var korzen = document.querySelector("[data-rezerwacja]");
  if (!korzen) return;

  var DNI = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];
  var MIESIACE = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
                  "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
  var MIESIACE_M = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
                    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

  /* Godziny przyjęć — te same, co w stopce i w grafiku zespołu. Ostatni
     termin musi się zmieścić przed zamknięciem, więc lista kończy się
     pół godziny wcześniej. */
  var GODZINY = {
    powszedni: { od: 9, do: 18.5 },
    sobota:    { od: 9, do: 14.5 }
  };

  var dzisiaj = new Date();
  dzisiaj.setHours(0, 0, 0, 0);

  var pokazywany = new Date(dzisiaj.getFullYear(), dzisiaj.getMonth(), 1);
  var wybranyDzien = null;
  var wybranaGodzina = null;

  /* ---------- zajętość ----------
     Powtarzalny rozsiew: ta sama data zawsze daje ten sam wynik.
     W wersji z serwerem to jedyne miejsce do wymiany — reszta strony
     nie wie, skąd stany pochodzą. */
  /* Math.imul, nie zwykłe mnożenie: iloczyn dużej daty przez stałą
     mieszającą przekracza zakres, w którym liczby są jeszcze dokładne,
     i młodsze bity się zerują. Wynik wychodził wtedy prawie zawsze ten
     sam — kalendarz był świecąco pusty. */
  function ziarno(rok, mies, dzien, minuty) {
    var x = (rok * 10000 + (mies + 1) * 100 + dzien) * 1440 + (minuty || 0);
    x = Math.imul(x ^ (x >>> 15), 2246822507);
    x = Math.imul(x ^ (x >>> 13), 3266489909);
    return ((x ^ (x >>> 16)) >>> 0) % 100;
  }

  /* Dzień bywa zajęty w całości — urlop, zabieg na kilka godzin, dzień
     wyjazdowy. Bez tego kalendarz nigdy nie pokazałby dnia zielonego,
     bo szansa, że wszystkie dwadzieścia terminów wypadnie zajętych,
     jest znikoma. */
  function stanCalegoDnia(d) {
    var z = ziarno(d.getFullYear(), d.getMonth(), d.getDate(), 0);
    if (z < 12) return "zajety";
    if (z < 20) return "czeka";
    return null;
  }

  function stanGodziny(d, godzina) {
    var caly = stanCalegoDnia(d);
    if (caly) return caly;
    var z = ziarno(d.getFullYear(), d.getMonth(), d.getDate(), Math.round(godzina * 60));
    if (z < 38) return "zajety";
    if (z < 55) return "czeka";
    return "wolny";
  }

  function godzinyDnia(d) {
    var dzienTyg = (d.getDay() + 6) % 7;
    if (dzienTyg === 6) return [];
    var zakres = dzienTyg === 5 ? GODZINY.sobota : GODZINY.powszedni;
    var lista = [];
    for (var g = zakres.od; g <= zakres.do; g += 0.5) {
      lista.push({ wartosc: g, stan: stanGodziny(d, g) });
    }
    return lista;
  }

  function opisGodziny(g) {
    return Math.floor(g) + ":" + (g % 1 ? "30" : "00");
  }

  /* Dzień jest wolny, jeśli ma choć jeden wolny termin. */
  function stanDnia(d) {
    var g = godzinyDnia(d);
    if (!g.length) return "zamkniete";
    if (g.some(function (x) { return x.stan === "wolny"; })) return "wolny";
    if (g.some(function (x) { return x.stan === "czeka"; })) return "czeka";
    return "zajety";
  }

  function nazwaDnia(d) { return DNI[(d.getDay() + 6) % 7]; }

  function dataSlownie(d) {
    return d.getDate() + " " + MIESIACE[d.getMonth()] + " " + d.getFullYear();
  }

  function klucz(d) {
    return [d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")].join("-");
  }

  /* ---------- kalendarz ---------- */
  var siatka = korzen.querySelector("[data-siatka]");
  var etykietaMiesiaca = korzen.querySelector("[data-miesiac]");
  var wstecz = korzen.querySelector("[data-miesiac-krok=\"-1\"]");
  var naprzod = korzen.querySelector("[data-miesiac-krok=\"1\"]");

  function rysujKalendarz() {
    etykietaMiesiaca.textContent = MIESIACE_M[pokazywany.getMonth()] + " " + pokazywany.getFullYear();
    siatka.textContent = "";

    var pierwszy = new Date(pokazywany.getFullYear(), pokazywany.getMonth(), 1);
    var przesuniecie = (pierwszy.getDay() + 6) % 7;
    var ile = new Date(pokazywany.getFullYear(), pokazywany.getMonth() + 1, 0).getDate();

    for (var i = 0; i < przesuniecie; i++) {
      var puste = document.createElement("span");
      puste.className = "dzien dzien--pusty";
      siatka.appendChild(puste);
    }

    for (var n = 1; n <= ile; n++) {
      var d = new Date(pokazywany.getFullYear(), pokazywany.getMonth(), n);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dzien";
      btn.dataset.dzien = klucz(d);

      var minelo = d < dzisiaj;
      var stan = stanDnia(d);
      var podpis = "wolne";

      if (stan === "zamkniete") {
        podpis = "zamknięte";
      } else if (stan === "czeka") {
        btn.classList.add("dzien--czeka");
        podpis = "czeka";
      } else if (stan === "zajety") {
        btn.classList.add("dzien--zajety");
        podpis = "zajęte";
      }

      if (minelo || stan === "zamkniete" || stan === "zajety") btn.disabled = true;
      if (minelo) podpis = "";

      var liczba = document.createElement("span");
      liczba.textContent = String(n);
      var stanEl = document.createElement("span");
      stanEl.className = "dzien__stan";
      stanEl.textContent = podpis;
      btn.appendChild(liczba);
      btn.appendChild(stanEl);

      btn.setAttribute("aria-label", n + " " + MIESIACE[d.getMonth()] + ", " + nazwaDnia(d) +
        (podpis ? " — " + podpis : " — termin minął"));

      if (wybranyDzien && btn.dataset.dzien === wybranyDzien) btn.classList.add("dzien--wybrany");
      siatka.appendChild(btn);
    }

    /* Wstecz tylko do bieżącego miesiąca — w przeszłość nikt się nie umówi. */
    wstecz.disabled = pokazywany.getFullYear() === dzisiaj.getFullYear() &&
                      pokazywany.getMonth() === dzisiaj.getMonth();
  }

  /* ---------- godziny wybranego dnia ---------- */
  var panelGodzin = korzen.querySelector("[data-godziny]");
  var naglowekGodzin = korzen.querySelector("[data-godziny-naglowek]");
  var opisGodzin = korzen.querySelector("[data-godziny-opis]");

  function rysujGodziny() {
    panelGodzin.textContent = "";
    if (!wybranyDzien) {
      naglowekGodzin.textContent = "Wybierz dzień";
      opisGodzin.textContent = "Godziny pokażą się po kliknięciu w kalendarz.";
      return;
    }

    var d = new Date(wybranyDzien + "T00:00:00");
    naglowekGodzin.textContent = d.getDate() + " " + MIESIACE[d.getMonth()];
    opisGodzin.textContent = nazwaDnia(d) + ", wizyta trwa około 30 minut.";

    godzinyDnia(d).forEach(function (poz) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "godzina";
      btn.dataset.godzina = String(poz.wartosc);

      var podpis = "wolny";
      if (poz.stan === "czeka") {
        btn.classList.add("godzina--czeka");
        btn.disabled = true;
        podpis = "czeka";
      }
      if (poz.stan === "zajety") {
        btn.classList.add("godzina--zajeta");
        btn.disabled = true;
        podpis = "zajęty";
      }
      if (wybranaGodzina === poz.wartosc) btn.classList.add("godzina--wybrana");

      var czas = document.createElement("span");
      czas.textContent = opisGodziny(poz.wartosc);
      var stanEl = document.createElement("span");
      stanEl.className = "godzina__stan";
      stanEl.textContent = podpis;
      btn.appendChild(czas);
      btn.appendChild(stanEl);
      btn.setAttribute("aria-label", opisGodziny(poz.wartosc) + " — " + podpis);

      li.appendChild(btn);
      panelGodzin.appendChild(li);
    });
  }

  /* ---------- kroki ---------- */
  var kroki = Array.prototype.slice.call(korzen.querySelectorAll(".krok"));
  var znaczniki = Array.prototype.slice.call(korzen.querySelectorAll(".kroki li"));

  function pokazKrok(nr) {
    kroki.forEach(function (k, i) { k.hidden = i !== nr; });
    znaczniki.forEach(function (z, i) {
      z.dataset.stan = i === nr ? "teraz" : (i < nr ? "zrobione" : "przed");
    });
  }

  var dalej1 = korzen.querySelector("[data-dalej=\"1\"]");

  function odswiezDalej() {
    dalej1.disabled = !(wybranyDzien && wybranaGodzina !== null);
    var info = korzen.querySelector("[data-wybrany-termin]");
    if (!info) return;
    if (dalej1.disabled) {
      info.textContent = "Nie wybrano jeszcze terminu.";
      return;
    }
    var d = new Date(wybranyDzien + "T00:00:00");
    info.textContent = "Wybrany termin: " + nazwaDnia(d) + ", " + dataSlownie(d) +
      ", godz. " + opisGodziny(wybranaGodzina) + ".";
  }

  /* ---------- zdarzenia ---------- */
  siatka.addEventListener("click", function (e) {
    var btn = e.target.closest(".dzien");
    if (!btn || btn.disabled) return;
    wybranyDzien = btn.dataset.dzien;
    wybranaGodzina = null;
    rysujKalendarz();
    rysujGodziny();
    odswiezDalej();
  });

  panelGodzin.addEventListener("click", function (e) {
    var btn = e.target.closest(".godzina");
    if (!btn || btn.disabled) return;
    wybranaGodzina = Number(btn.dataset.godzina);
    rysujGodziny();
    odswiezDalej();
  });

  [wstecz, naprzod].forEach(function (btn) {
    btn.addEventListener("click", function () {
      pokazywany = new Date(pokazywany.getFullYear(),
                            pokazywany.getMonth() + Number(btn.dataset.miesiacKrok), 1);
      rysujKalendarz();
    });
  });

  korzen.querySelectorAll("[data-dalej]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var nr = Number(btn.dataset.dalej);
      /* Krok drugi wypuszcza dalej tylko z kompletem danych — tych samych
         reguł pilnuje przeglądarka przy wysyłce formularza. */
      if (nr === 2) {
        var pola = korzen.querySelectorAll("#krok-dane [required]");
        for (var i = 0; i < pola.length; i++) {
          if (!pola[i].checkValidity()) { pola[i].reportValidity(); return; }
        }
        wypelnijPodsumowanie();
      }
      pokazKrok(nr);
    });
  });

  korzen.querySelectorAll("[data-wstecz]").forEach(function (btn) {
    btn.addEventListener("click", function () { pokazKrok(Number(btn.dataset.wstecz)); });
  });

  /* ---------- podsumowanie ---------- */
  function wypelnijPodsumowanie() {
    var d = new Date(wybranyDzien + "T00:00:00");
    var wybor = korzen.querySelector("#z-zabieg");

    function ustaw(nazwa, tekst) {
      var el = korzen.querySelector("[data-pole=\"" + nazwa + "\"]");
      if (el) el.textContent = tekst;
    }

    ustaw("termin", nazwaDnia(d) + ", " + dataSlownie(d) + ", godz. " + opisGodziny(wybranaGodzina));
    ustaw("zabieg", wybor.options[wybor.selectedIndex].text);
    ustaw("imie", korzen.querySelector("#z-imie").value.trim());
    ustaw("telefon", korzen.querySelector("#z-tel").value.trim());
    ustaw("mail", korzen.querySelector("#z-mail").value.trim());

    /* Ostatnia chwila na bezkosztowe odwołanie: doba przed wizytą.
       Liczymy ją i wypisujemy wprost, bo „24 godziny wcześniej” każdy
       liczy inaczej, a od tego zależą pieniądze. */
    var granica = new Date(d);
    granica.setHours(Math.floor(wybranaGodzina), (wybranaGodzina % 1) * 60, 0, 0);
    granica.setDate(granica.getDate() - 1);

    /* Termin bliżej niż doba: granica zwrotu już minęła, więc obiecywanie
       go byłoby kłamstwem. Pacjent musi to wiedzieć PRZED wpłatą, a nie
       przy próbie odwołania. */
    var zaPozno = granica <= new Date();
    var pole = korzen.querySelector("[data-pole=\"granica\"]");
    var ostrzezenie = korzen.querySelector("[data-blisko]");
    if (ostrzezenie) ostrzezenie.hidden = !zaPozno;
    if (pole && pole.closest("li")) pole.closest("li").hidden = zaPozno;

    ustaw("granica", nazwaDnia(granica) + ", " + granica.getDate() + " " +
                     MIESIACE[granica.getMonth()] + ", godz. " + opisGodziny(wybranaGodzina));
  }

  /* Formularz nie ma dokąd iść — w wersji pokazowej pokazujemy sam
     ostatni krok. */
  var formularz = korzen.querySelector("form");
  if (formularz) {
    formularz.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  rysujKalendarz();
  rysujGodziny();
  odswiezDalej();
  pokazKrok(0);
})();
