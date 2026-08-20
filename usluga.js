/**
 * Podstrony usług — wzbogacenie już istniejącej treści.
 *
 * Nic tu nie dopisuje ani nie skraca tekstu. Każde zdanie, które było w HTML,
 * zostaje w tym samym miejscu i w tej samej kolejności — skrypt jedynie
 * nadaje mu formę. Z wyłączonym JavaScriptem strona czyta się w całości,
 * tak jak dotąd; to jest warunek, nie uprzejmość.
 *
 * Co robi:
 *   1. Buduje boczny indeks ze śródtytułów i zaznacza, w którym miejscu
 *      strony jesteś.
 *   2. Wyprowadza pierwsze zdanie akapitu otwierającego przed resztę — tam
 *      siedzi definicja zabiegu, dziś zakopana w ścianie tekstu.
 *   3. Zamienia listy na wiersze z własnym rytmem wejścia.
 *   4. Dokłada pasek postępu czytania.
 *
 * Zero zależności. Zero nasłuchu na `scroll` — wszystko na IntersectionObserver.
 */
(() => {
  const proza = document.querySelector("main .prose");
  if (!proza) return;

  const spokoj = matchMedia("(prefers-reduced-motion: reduce)");

  /* ======================================================================
     1. PIERWSZE ZDANIE NA PROWADZENIE
     Akapity na tych stronach potrafią mieć tysiąc kilkaset znaków, a pierwsze
     zdanie jest zwykle definicją: "Leczenie kanałowe pod mikroskopem pozwala
     wykonywać zabiegi w sposób bardziej precyzyjny...". Wyciągamy je na wierzch
     jako osobny wiersz — te same słowa, ta sama kolejność, inny stopień pisma.
     ====================================================================== */
  const pierwszy = proza.querySelector("p");
  /* Tylko przy ścianie tekstu. Krótki akapit rozbity na dwie części wygląda
     jak pomyłka składu, a nie jak decyzja. */
  if (pierwszy && pierwszy.textContent.trim().length > 420) {
    /* Granica zdania: kropka, wykrzyknik lub pytajnik, po których idzie spacja
       i wielka litera. Skróty typu "np." nie kończą zdania małą literą, więc
       ten warunek je omija. */
    const tekst = pierwszy.innerHTML;
    const m = tekst.match(/^(.+?[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/);
    if (m && m[1].length > 40 && m[1].length < 320) {
      const reszta = tekst.slice(m[0].length);
      pierwszy.innerHTML =
        '<span class="prose__otwarcie">' + m[1] + "</span>" + reszta;
    }
  }

  /* ======================================================================
     2. INDEKS ŚRÓDTYTUŁÓW
     Odpowiada na dwa pytania naraz: co jest na tej stronie i gdzie teraz
     jestem. Bez niego czytelnik szukający jednej rzeczy musi przewinąć
     wszystko.
     ====================================================================== */
  /* PRÓBOWANE, WYCOFANE: boczny indeks śródtytułów.
     Na tych stronach „śródtytuł" to najczęściej nie jest tytuł sekcji,
     tylko początek zdania zakończony dwukropkiem: „Wykorzystanie mikroskopu
     przez stomatologa pozwala na:". Spis zbudowany z takich zdań czyta się
     jak lista urwanych myśli, a na stronach z jednym śródtytułem nie miał
     nawet czego spisywać. Zamiast reguły „pokaż, jeśli akurat pasuje"
     — nie ma go wcale. Kolumna z treścią zaczyna się przez to wszędzie
     w tym samym miejscu, bez sztucznej szyny po lewej. */

  /* ======================================================================
     3. LISTY JAKO WIERSZE
     ====================================================================== */
  const listy = [...proza.querySelectorAll("ul")];
  for (const ul of listy) {
    /* JEDNA forma dla wszystkich wyliczeń zabiegów i usług na całej stronie.
       Wcześniej były dwie — krótkie pozycje szły jako karty, długie jako
       numerowane kroki — i ta sama rzecz (lista zabiegów) wyglądała inaczej
       w narkozie niż w leczeniu kanałowym. Różna forma dla tego samego typu
       treści czyta się jako różny typ treści, więc zostaje jedna: wiersze
       na szynie, bez myślników i bez numerów. Numer sugerowałby kolejność,
       a te zabiegi nie są po kolei. */
    ul.classList.add("zabiegi");
    /* Pozycje kończą się przecinkami i kropką, bo w liście punktowanej były
       częścią jednego zdania. W wierszu ogon interpunkcyjny wygląda jak
       literówka — słowa zostają, znak schodzi. */
    for (const li of ul.children) {
      li.innerHTML = li.innerHTML.replace(/[\s,;.]+$/, "");
    }
  }

  /* ======================================================================
     3b. ZABIEGI W RAMCE
     Nagłówek „Stomatolog pod narkozą może przeprowadzić takie zabiegi jak:"
     i lista pod nim to jeden przystanek, nie dwa: nagłówek bez listy nic nie
     znaczy, a lista bez nagłówka nie wiadomo czego dotyczy. Wcześniej stały
     luzem na tle sekcji, przez co zabiegi wyglądały jak wyliczenie po
     myślnikach zawieszone obok treści. Teraz idą razem w jedną ramkę — na
     stronach z parkiem taką samą, jaką mają kafelki z akapitami, więc lista
     staje się kolejnym przystankiem przy alejce.
     ====================================================================== */
  const wPark = !!proza.closest(".park") || proza.classList.contains("park");
  for (const ul of listy) {
    /* Lista, ktora JUZ stoi w ramce, nie dostaje drugiej. Ramki sa dzis
       wpisane wprost w znaczniki (zeby nie bylo przesuniec ukladu po
       wczytaniu) i bez tego warunku skrypt zawijal je po raz drugi:
       ramka w ramce zwezala sie do 46% z 46%, czyli 161 px na telefonie,
       a pozycje listy wychodzily poza nia. Przy okazji kazda nadmiarowa
       ramka dokladala punkt do trasy alejki i lamala jej gladkosc. */
    if (ul.closest(".park__kamien--lista, .blok-lista")) continue;
    const poprz = ul.previousElementSibling;
    if (!poprz) continue;
    /* Zapowiedz listy nie zawsze jest srodtytulem: w ofercie to zdanie
       „Specjalizujemy sie w stomatologii z zakresu :” siedzace w kafelku.
       Lista dolacza wtedy do tego kafelka. Bez tego zostawala goła miedzy
       kafelkami — a goły <ul> nie ma szerokosci maksymalnej, wiec jego
       ramki szly przez cala kolumne i przecinaly alejke. */
    if (poprz.classList.contains("park__kamien")) {
      poprz.classList.add("park__kamien--lista");
      poprz.appendChild(ul);
      continue;
    }
    if (!/^H[2-4]$/.test(poprz.tagName)) continue;
    const ramka = document.createElement("div");
    ramka.className = wPark ? "park__kamien park__kamien--lista" : "blok-lista";
    poprz.parentNode.insertBefore(ramka, poprz);
    ramka.appendChild(poprz);
    ramka.appendChild(ul);
  }

  /* Strony z jednym–dwoma akapitami (leczenie kanałowe, narkoza) zostawiały
     pustą prawą połowę ekranu: jeden wysoki kafelek po lewej i nic obok.
     Przy tak małej liczbie przystanków park przechodzi na dwie kolumny,
     więc listy zabiegów stają po prawej stronie akapitu zamiast pod nim. */
  const park = proza.classList.contains("park") ? proza : proza.closest(".park");
  if (park) {
    const kafelki = [...park.querySelectorAll(":scope > .park__kamien")];
    if (kafelki.length > 1 && kafelki.length <= 3) {
      park.classList.add("park--rzadki");
      /* Druga kolumna dostaje własny pojemnik. Wcześniej pierwszy kafelek
         rozciągał się na `span 99` wierszy siatki, żeby przytrzymać lewą
         stronę — a siatka posłusznie tworzyła 99 wierszy i pod sekcją
         zostawało kilka ekranów pustki. Pojemnik załatwia to samo bez
         rozciągania czegokolwiek. */
      const kolumna = document.createElement("div");
      kolumna.className = "park__kolumna";
      kafelki[0].after(kolumna);
      kafelki.slice(1).forEach((k) => kolumna.appendChild(k));
    }
  }

  /* ======================================================================
     4. ODSŁONIĘCIE — przeniesione do ruch.js
     Wiersze list wchodziły tu przez klasy i transition z usluga.css, a
     pasek postępu przez `animation-timeline: scroll()`. Oba były drugim
     systemem ruchu obok GSAP-a, na tych samych elementach. Ruch listy
     robi teraz ruch.js (sekcja „PODSTRONY"), pasek postępu jest jeden na
     całą stronę i siedzi w nagłówku. Ten plik zajmuje się wyłącznie
     formą treści: zdaniem otwierającym, indeksem i klasami wierszy.
     ====================================================================== */
})();
