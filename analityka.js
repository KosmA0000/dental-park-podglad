/* ============================================================
   LICZNIK WEJŚĆ — Google Analytics 4

   ┌────────────────────────────────────────────────────────┐
   │  JEDYNA RZECZ DO ZMIANY JEST W LINII PONIŻEJ.          │
   │  Wklej identyfikatory z Google Analytics, każdy w "".   │
   │  Wyglądają tak: G-ABCD123XYZ                            │
   │  Można wpisać jeden albo kilka — po przecinku.          │
   │  Instrukcja krok po kroku: JAK-WLACZYC-LICZNIK.md      │
   └────────────────────────────────────────────────────────┘ */

const POMIAR_ID = [
  "G-2J2C9ZQ5S2",     // gabinet
  // "G-YYYYYYYYYY",  ← drugi numer: odkomentuj i wklej, gdy będzie
];

/* ------------------------------------------------------------
   Poniżej nie trzeba już nic ruszać.

   Jak to działa i dlaczego tak:

   Dopóki lista `POMIAR_ID` jest pusta, ten plik NIE ROBI NIC — nie wczytuje
   skryptów Google, nie zapisuje ciasteczek, nie pokazuje paska zgody.
   Strona zachowuje się dokładnie tak jak dziś. Dzięki temu można ją
   spokojnie pokazywać, zanim licznik zostanie włączony.

   Po wpisaniu identyfikatora pojawia się pasek pytający o zgodę.
   Analytics rusza DOPIERO po kliknięciu „Zgadzam się" — nie wcześniej.
   To nie jest nadgorliwość: Analytics zapisuje ciasteczka, a na te trzeba
   mieć zgodę, zanim się je ustawi. Odpowiedź pacjenta pamiętamy rok.

   Mierzone są trzy rzeczy, które w gabinecie faktycznie coś znaczą:
     • klik w numer telefonu  → zdarzenie `klik_telefon`
     • klik w „Dojazd"        → zdarzenie `klik_dojazd`
     • wysłanie formularza    → zdarzenie `formularz_wyslany`

   Zwykłe odsłony strony liczą się same.

   Kilka identyfikatorów naraz: GA4 pozwala wysłać te same dane do wielu
   usług jednocześnie — wystarczy wywołać `gtag("config", ...)` dla każdej.
   Każda dostaje komplet, nikt nie widzi połowy obrazu. Skrypt Google
   wczytuje się przy tym raz, dla pierwszego identyfikatora z listy.
   ------------------------------------------------------------ */
(() => {
  "use strict";

  const IDENTYFIKATORY = (Array.isArray(POMIAR_ID) ? POMIAR_ID : [POMIAR_ID])
    .filter((x) => typeof x === "string" && /^G-[A-Z0-9]+$/i.test(x.trim()))
    .map((x) => x.trim());
  if (!IDENTYFIKATORY.length) return;

  const KLUCZ = "dentalpark-zgoda-pomiar";
  const ROK = 365 * 24 * 60 * 60 * 1000;

  function zapamietaj(odpowiedz) {
    try {
      localStorage.setItem(KLUCZ, JSON.stringify({ odpowiedz, kiedy: Date.now() }));
    } catch (e) { /* tryb prywatny — trudno, spytamy następnym razem */ }
  }

  function pamietana() {
    try {
      const zapis = JSON.parse(localStorage.getItem(KLUCZ) || "null");
      if (!zapis || Date.now() - zapis.kiedy > ROK) return null;
      return zapis.odpowiedz;
    } catch (e) { return null; }
  }

  /* ---------- właściwy pomiar ---------- */
  function wlaczPomiar() {
    if (window.gtag) return;

    const skrypt = document.createElement("script");
    skrypt.async = true;
    skrypt.src = "https://www.googletagmanager.com/gtag/js?id=" + IDENTYFIKATORY[0];
    document.head.appendChild(skrypt);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag("js", new Date());
    /* Każdy identyfikator z listy dostaje ten sam komplet zdarzeń. */
    IDENTYFIKATORY.forEach((id) => gtag("config", id, { anonymize_ip: true }));

    podepnijZdarzenia();
  }

  /* ---------- co liczymy ---------- */
  function podepnijZdarzenia() {
    /* Jeden nasłuch na całą stronę zamiast nasłuchu na każdym odnośniku:
       telefon pojawia się w pasku, w stopce, w kafelkach i w pasku
       mobilnym, a część z nich powstaje dopiero w trakcie działania
       strony. Nasłuch na dokumencie łapie wszystkie, także te przyszłe. */
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a");
      if (!a || !window.gtag) return;

      const cel = a.getAttribute("href") || "";

      if (cel.startsWith("tel:")) {
        gtag("event", "klik_telefon", {
          numer: cel.replace("tel:", ""),
          miejsce: gdzieStoi(a),
        });
      } else if (cel.includes("google.com/maps")) {
        gtag("event", "klik_dojazd", { miejsce: gdzieStoi(a) });
      }
    });

    document.addEventListener("submit", (e) => {
      if (!window.gtag) return;
      if (e.target && e.target.classList.contains("formularz")) {
        gtag("event", "formularz_wyslany", { strona: location.pathname });
      }
    });
  }

  /* Nazwa miejsca, z którego padł klik — żeby w raporcie było widać,
     czy pacjenci dzwonią z paska u góry, ze stopki, czy z paska na
     telefonie. Bez tego wiadomo tylko „ktoś kliknął". */
  function gdzieStoi(el) {
    if (el.closest(".pasek-akcji")) return "pasek na telefonie";
    if (el.closest(".masthead")) return "pasek na gorze";
    if (el.closest(".footer")) return "stopka";
    if (el.closest(".kontakt-kafle")) return "kafelki kontaktu";
    if (el.closest(".lekarz")) return "strona zespolu";
    return "tresc strony";
  }

  /* ---------- pasek zgody ---------- */
  function pokazPasek() {
    const pasek = document.createElement("div");
    pasek.className = "zgoda-pasek";
    pasek.setAttribute("role", "dialog");
    pasek.setAttribute("aria-label", "Zgoda na pomiar odwiedzin");
    pasek.innerHTML =
      '<p class="zgoda-pasek__tekst">Liczymy odwiedziny, żeby wiedzieć, które informacje są dla pacjentów ważne. ' +
      'Nie zbieramy danych o zdrowiu i nie przekazujemy niczego dalej. ' +
      '<a href="polityka-prywatnosci.html">Polityka prywatności</a></p>' +
      '<div class="zgoda-pasek__akcje">' +
      '<button type="button" class="btn btn--magnes" data-zgoda="tak">Zgadzam się</button>' +
      '<button type="button" class="zgoda-pasek__nie" data-zgoda="nie">Nie licz mnie</button>' +
      "</div>";

    /* Pasek lezy na tresci (`position: fixed`), wiec strona musi oddac
       mu tyle miejsca u dolu, ile on zajmuje — inaczej przyciski pod
       nim widac, ale nie da sie w nie trafic. Wysokosc mierzymy, bo
       zalezy od szerokosci okna: na telefonie pasek lamie sie na kilka
       wierszy. */
    const zmierz = () => {
      document.documentElement.style.setProperty(
        "--zgoda-wysokosc", pasek.offsetHeight + "px");
    };
    const posprzataj = () => {
      pasek.remove();
      document.documentElement.classList.remove("zgoda-widoczna");
      document.documentElement.style.removeProperty("--zgoda-wysokosc");
      window.removeEventListener("resize", zmierz);
    };

    pasek.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-zgoda]");
      if (!btn) return;
      const tak = btn.dataset.zgoda === "tak";
      zapamietaj(tak);
      posprzataj();
      if (tak) wlaczPomiar();
    });

    document.body.appendChild(pasek);

    /* Dopiero teraz — przed wstawieniem do dokumentu `offsetHeight`
       jest zerem, a strona oddalaby paskowi zero miejsca. */
    document.documentElement.classList.add("zgoda-widoczna");
    zmierz();
    window.addEventListener("resize", zmierz);
  }

  const odpowiedz = pamietana();
  if (odpowiedz === true) wlaczPomiar();
  else if (odpowiedz === null) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", pokazPasek, { once: true });
    } else {
      pokazPasek();
    }
  }
})();
