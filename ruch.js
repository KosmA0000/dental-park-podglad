/* ============================================================
   DentalPark — system ruchu (GSAP)

   Jeden plik na całą stronę. Wszystko, co się rusza, rusza się stąd:
   nie ma drugiego systemu w CSS (żadnych @keyframes, żadnego
   animation-timeline) i nie ma ruchu rozsypanego po podstronach.

   Kolejność sekcji w pliku = kolejność na stronie. To nie kosmetyka:
   ScrollTrigger odświeża się w kolejności tworzenia, a odświeżanie
   „nie po kolei" jest błędem nr 6 z gsap.com/resources/st-mistakes.

     0. Rejestracja, krzywa firmowa, ScrollSmoother
     1. HERO — scroll odpala film, film blokuje scroll
     2. Pasek nawigacji: postęp, zwarcie, hover
     3. Odsłanianie treści (SplitText + batch)
     4. Pas w ruchu (reaguje na prędkość przewijania)
     5. Fakty — liczby dochodzą do wartości
     6. Zespół — kadry
     7. Galeria — karuzela zdjęć (coverflow) + lupa (Flip)
    7b. Znaczki, karty wyboru, kafle oferty, siatka kart
     8. Półka oferty — grzbiety z wysuwanym opisem
     9. Grafik tygodnia — kolumny dni, filtr po lekarzu
    10. Formularz — mikroreakcje
    11. Finał — mgła i kreska
   11b. Podstrony — pas tytułowy, indeks, kroki, porównanie przed/po
    12. Drobne: przyciski przyciągane kursorem
    13. Odświeżenia (fonty, obrazy)

   Wszystko chodzi wewnątrz gsap.matchMedia(): przy
   prefers-reduced-motion cały ruch jest wycofywany jedną instrukcją,
   a strona zostaje kompletna i statyczna.
   ============================================================ */
(() => {
  "use strict";
  if (typeof gsap === "undefined") return;   // brak biblioteki: strona zostaje statyczna

  const html = document.documentElement;
  html.classList.add("js-ruch");

  /* ==========================================================
     0. REJESTRACJA
     Rejestrujemy tylko to, co faktycznie się wczytało — podstrony
     biorą mniejszy zestaw wtyczek niż strona główna.
     ========================================================== */
  const wtyczki = [
    window.ScrollTrigger, window.ScrollSmoother, window.ScrollToPlugin,
    window.Observer, window.SplitText, window.DrawSVGPlugin,
    window.CustomEase, window.Flip, window.MotionPathPlugin,
    window.Draggable, window.InertiaPlugin, window.ScrambleTextPlugin,
    window.CustomWiggle, window.EasePack,
  ].filter(Boolean);
  gsap.registerPlugin(...wtyczki);

  const ma = (n) => typeof window[n] !== "undefined";

  /* Krzywa firmowa. Jedna na całą stronę — ruch ma być rozpoznawalny,
     a nie za każdym razem inny. Szybki start, długie dojście: tak
     zachowuje się woda, która jest motywem tej strony. */
  if (ma("CustomEase")) {
    CustomEase.create("park", ".16,.84,.24,1");
    CustomEase.create("parkOut", ".7,0,.84,0");
  }
  gsap.defaults({ ease: ma("CustomEase") ? "park" : "power3.out", duration: 0.9 });

  /* Strona zawsze startuje od pierwszej klatki filmu. Bez tego
     przeglądarka przywraca pozycję z poprzedniej wizyty i mechanika
     hero (gest → film → blokada) odpalałaby się w środku strony. */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ...i ZAWSZE od hero, także gdy w adresie siedzi kotwica.
     Zapamiętane w karcie `#o-nas` działało tak: przeglądarka skakała po
     kotwicy w środek strony, ScrollSmoother — który startuje od zera —
     ściągał widok z powrotem na hero, i oba szarpały się o tę samą pozycję.
     Zmierzone: kadr hero skakał między `0..900` a `-1101..-201`. Kiedy
     wygrywała kotwica, film w ogóle nie ruszał.
     Odnośniki wewnętrzne kotwicy w adresie nie zapisują (klik jest
     przechwytywany i przewijany GSAP-em), więc kotwica na stronie głównej
     to zawsze ślad po poprzedniej wizycie — można ją zdjąć bez straty.
     Robimy to PRZED utworzeniem ScrollSmoothera, żeby nie miał z czym
     walczyć. */
  if (document.querySelector(".hero") && location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
    scrollTo(0, 0);
  }

  const spokoj = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- ScrollSmoother ----------
     Gładkie przewijanie + efekty data-speed / data-lag. Dzięki temu
     paralaksa siedzi w znacznikach, a nie w dwudziestu tweenach. */
  let smoother = null;
  if (ma("ScrollSmoother") && document.getElementById("smooth-wrapper") && !spokoj.matches) {
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.1,
      effects: true,
      /* Telefon zostaje na przewijaniu systemowym: wygładzanie dotyku
         kosztuje więcej, niż daje, i psuje pasek adresu. */
      smoothTouch: 0,
      ignoreMobileResize: true,
    });
  }

  /* Jedno miejsce na „przewiń do". Ze ScrollSmootherem trzeba jego
     metody; bez niego zwykły ScrollToPlugin. */
  function przewinDo(cel, czas = 1.3) {
    if (smoother) {
      gsap.to(smoother, {
        scrollTop: smoother.offset(cel, "top top"),
        duration: czas,
        ease: "power2.inOut",
      });
    } else if (ma("ScrollToPlugin")) {
      gsap.to(window, { scrollTo: { y: cel, offsetY: 0 }, duration: czas, ease: "power2.inOut" });
    } else {
      cel.scrollIntoView({ behavior: "auto" });
    }
  }

  /* Odnośniki w obrębie strony jadą przez GSAP: CSS-owe scroll-behavior
     jest wyłączone (rozjeżdża pomiary ScrollTriggera), a ScrollSmoother
     nie przejmuje kliknięć w kotwice sam z siebie. */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const cel = document.querySelector(a.getAttribute("href"));
    if (!cel) return;
    e.preventDefault();
    przewinDo(cel, 1.1);
  });

  /* PRÓBOWANE, WYCOFANE: pełnoekranowa kurtyna na czas rozbijania
     nagłówków przez SplitText. Zasłona była zdejmowana tweenem, czyli
     zależała od tego, czy chodzi rAF — a rAF nie chodzi w karcie
     otwartej w tle. Strona wczytana w tle stała czarna do momentu
     przejścia na nią. Mrugnięcia i tak nie ma: nagłówki są schowane
     regułą `.js-ruch [data-rozbij]`, a tę dokłada pierwsza linia tego
     pliku. Zasłona nie miała czego zasłaniać, a mogła zasłonić wszystko. */

  /* ==========================================================
     RESZTA — wewnątrz matchMedia
     ========================================================== */
  const mm = gsap.matchMedia();

  mm.add(
    {
      ruch: "(prefers-reduced-motion: no-preference)",
      spokoj: "(prefers-reduced-motion: reduce)",
      duzy: "(min-width: 62rem)",
      maly: "(max-width: 61.99rem)",
    },
    (ctx) => {
      const { ruch, duzy } = ctx.conditions;

      /* --------------------------------------------------------
         Wersja spokojna: nic się nie rusza, wszystko widoczne.
         -------------------------------------------------------- */
      if (!ruch) {
        gsap.set("[data-rozbij]", { visibility: "visible" });
        odsloniecieBezRuchu();
        return;
      }

      /* ======================================================
         1. HERO — scroll odpala film, film blokuje scroll
         Ustalenie, którego pilnujemy co do słowa:
           • film NIE startuje sam,
           • pierwszy gest przewijania go uruchamia,
           • przez cały film strona stoi,
           • wyjście: menu u góry (jest poza kontenerem przewijania,
             więc klik działa) albo Escape,
           • po ostatniej klatce blokada puszcza, kolumna z treścią
             ZOSTAJE na płaskiej zieleni, a strona czeka na pacjenta —
             sama nie zjeżdża.
         ====================================================== */
      const hero = document.querySelector(".hero");
      const wideo = document.querySelector(".hero__media");
      const licznik = document.querySelector(".hero__film");
      let blokada = null;
      let filmSzedl = false;

      if (hero) {
        const wejscie = gsap.timeline({ delay: 0.15 });

        /* Kadr wchodzi z lekkim zbliżeniem — te 3 procent robią
           różnicę między „obrazkiem" a „ujęciem". */
        wejscie
          .from(".hero__bg", { scale: 1.08, duration: 2.2, ease: "power2.out" }, 0);

        const linieH1 = rozbijNaLinie(document.querySelector(".hero h1"));
        if (linieH1) {
          wejscie.from(linieH1, {
            yPercent: 115, duration: 1.25, stagger: 0.11, ease: "park",
          }, 0.35);
        }
        wejscie.from([".hero .eyebrow", ".hero .lead", ".hero .btn-row", ".hero__meta"], {
          y: 22, autoAlpha: 0, duration: 1, stagger: 0.09,
        }, 0.5);

        if (wideo) {
          wideo.pause();
          wideo.currentTime = 0;

          /* Film waży ok. 2 MB i rusza dopiero po geście, a przy
             `preload="auto"` przeglądarka ściągała go PRZED pierwszym
             malowaniem. Zmierzone na telefonie: LCP 2804 ms przy progu 2500,
             z czego 1945 kB to samo wideo. Znacznik ma teraz `preload="none"`,
             a wczytywanie startuje dopiero, kiedy strona jest gotowa i
             przeglądarka ma wolną chwilę — do pierwszego gestu i tak zostaje
             więcej czasu niż potrzeba, a plakat trzyma kadr od początku. */
          const dociagnij = () => { try { wideo.load(); } catch (e) { /* nic */ } };
          const pozniej = () => (window.requestIdleCallback || setTimeout)(dociagnij, { timeout: 2000 });
          if (document.readyState === "complete") pozniej();
          else addEventListener("load", pozniej, { once: true });

          const pasekFilmu = licznik ? licznik.querySelector("i") : null;
          const ustawPasek = pasekFilmu ? gsap.quickSetter(pasekFilmu, "scaleX") : null;
          const tykaj = () => {
            if (!wideo.duration) return;
            ustawPasek && ustawPasek(Math.min(1, wideo.currentTime / wideo.duration));
          };

          /* Wyjście z filmu. Jedna funkcja na wszystkie drogi:
             koniec filmu, Escape, brak pliku. */
          const koniecFilmu = () => {
            if (!filmSzedl) return;
            filmSzedl = false;
            try { sessionStorage.setItem("dentalpark-film", String(Date.now())); } catch (e) { /* tryb prywatny */ }
            gsap.ticker.remove(tykaj);
            html.classList.remove("film-gra");
            if (blokada) { blokada.kill(); blokada = null; }
            document.removeEventListener("keydown", klawisze, true);
            if (smoother) smoother.paused(false);
            licznik && gsap.to(licznik, { autoAlpha: 0, duration: 0.5 });

            /* Strona NIE zjeżdża sama. Po filmie kolumna z treścią stoi
               na płaskiej zieleni — jest co czytać i co kliknąć, i to jest
               cała podpowiedź, jaką hero daje. */
          };

          function klawisze(e) {
            if (e.key === "Escape") { koniecFilmu(); return; }
            /* Klawiatura też przewija — w czasie filmu nie może. */
            if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"].includes(e.key)) {
              e.preventDefault();
            }
          }

          const start = () => {
            if (filmSzedl || wideo.ended) return;
            filmSzedl = true;
            html.classList.add("film-gra");

            /* Blokada. Dwa zamki, bo jeden nie wystarcza:
               ScrollSmoother.paused() zatrzymuje silnik wygładzania,
               a Observer z preventDefault zabiera kółku i palcowi
               samo zdarzenie. allowClicks: true zostawia klikanie —
               menu u góry musi działać, to jedyne wyjście. */
            if (smoother) smoother.paused(true);
            if (ma("Observer")) {
              blokada = Observer.create({
                target: window,
                type: "wheel,touch,pointer",
                preventDefault: true,
                allowClicks: true,
                onEnable: (self) => self.scrollY(0),
              });
            }
            document.addEventListener("keydown", klawisze, true);

            /* Film leci dwa i pół raza szybciej. Blokada przewijania trwa
               dokładnie tyle, co film, więc to ona jest tu ceną: przy pełnej
               prędkości pacjent stał ~7,5 s, teraz ~3 s. `defaultPlaybackRate`
               ustawione razem z `playbackRate`, bo część przeglądarek zeruje
               samo `playbackRate` przy ponownym starcie odtwarzania. */
            wideo.defaultPlaybackRate = 2.5;
            wideo.playbackRate = 2.5;
            wideo.play().catch(() => koniecFilmu());
            gsap.ticker.add(tykaj);

            const tl = gsap.timeline();
            licznik && tl.to(licznik, { autoAlpha: 1, duration: 0.6 }, 0.2);

            /* Kolumna z treścią ZOSTAJE na ekranie do końca filmu.
               Wcześniej gasła razem z zanurzeniem kamery i po ostatniej
               klatce zostawał pusty zielony prostokąt — nic do czytania,
               nic do kliknięcia. Teraz płaska zieleń jest tłem dla tekstu,
               a nie zamiast niego. Kontrast to wytrzymuje: #fbfaf5 na
               #1a3631 daje 11,7:1, więc przyciemniacz jest wtedy zbędny
               i schodzi (jego gradient na jednolitym tle rysowałby się
               jako ciemniejsza plama). */
            /* Przyciemniacz schodzi dopiero razem z zanurzeniem i przez
               ponad trzy sekundy — wcześniej gasł w 1,6 s w połowie filmu
               i widać było moment, w którym kadr „się rozjaśnia". Ostatnia
               klatka jest płaską zielenią, więc na końcu nie ma czego
               przyciemniać: tekst ma tam kontrast 11,7:1 sam z siebie. */
            tl.to(".hero__scrim", { autoAlpha: 0, duration: 3.2, ease: "power1.inOut" }, 4.4);
            /* Zamiast zniknięcia — dosunięcie: pod wodą kolumna wychodzi
               na środek kadru, bo nie konkuruje już z drzewem po prawej. */
            tl.to(".hero__inner", { y: -18, duration: 2, ease: "power1.inOut" }, 4.4);
          };

          /* Gest, który odpala film.
             Czujka MUSI przechwytywać zdarzenie (preventDefault), a nie
             tylko go słuchać. Wersja słuchająca nie działała: kółko
             najpierw przewijało stronę, a callback wchodził po nim —
             warunek „czy stoję na górze" widział już 300 px i film nie
             startował nigdy (zmierzone: probuj=1, start=0). Teraz
             pierwszy gest nie przewija niczego, jego jedynym skutkiem
             jest uruchomienie filmu. allowClicks: true zostawia
             klikanie, czyli menu u góry. */
          let uzbrojona = true;
          let czujka = null;

          const odpal = () => {
            if (!uzbrojona) return;
            uzbrojona = false;
            if (czujka) { czujka.kill(); czujka = null; }
            document.removeEventListener("keydown", gestKlawiszem, true);
            start();
          };

          /* Klawiatura przewija tak samo jak kółko, więc odpala tak samo. */
          function gestKlawiszem(e) {
            if (["ArrowDown", "PageDown", " ", "Spacebar", "End"].includes(e.key)) {
              e.preventDefault();
              odpal();
            }
          }

          /* Film nie do odtworzenia (brak pliku, odmowa przeglądarki):
             czujka schodzi i strona przewija się normalnie. Blokada nie
             może przeżyć filmu, którego nie ma. */
          const rozbrojenie = () => {
            uzbrojona = false;
            if (czujka) { czujka.kill(); czujka = null; }
            document.removeEventListener("keydown", gestKlawiszem, true);
          };

          /* Film jest wydarzeniem pierwszego wejścia, nie opłatą przy każdym
             kliknięciu w menu. Powrót na stronę główną w tej samej sesji
             pokazuje od razu ostatnią klatkę — płaską zieleń z tekstem —
             i nie blokuje przewijania. Pamięć sesji, nie ciasteczko: nowa
             wizyta następnego dnia znów dostaje film. */
          /* Zapis ma termin waznosci, bo telefon nie zamyka kart. Na
             komputerze pamiec sesji ginie razem z zakladka i „jedna wizyta”
             znaczy to, co powinna. Na telefonie ta sama zakladka potrafi
             zyc tygodniami — bez terminu pacjent, ktory wrocil po miesiacu,
             nie zobaczylby filmu nigdy wiecej. Pol godziny: przejscie
             miedzy podstronami to wciaz ta sama wizyta, powrot nazajutrz
             juz nie. */
          const OBEJRZANY = "dentalpark-film";
          const WAZNOSC = 30 * 60 * 1000;
          let widziany = false;
          try {
            const kiedy = Number(sessionStorage.getItem(OBEJRZANY));
            widziany = kiedy > 0 && Date.now() - kiedy < WAZNOSC;
            /* Zapis odswieza sie przy kazdym wejsciu na strone glowna, wiec
               termin liczy sie od ostatniego ruchu, nie od samego filmu. */
            if (widziany) sessionStorage.setItem(OBEJRZANY, String(Date.now()));
          } catch (e) { widziany = false; }

          if (widziany) {
            /* Film nie leci drugi raz w tej samej sesji — ale hero zostaje
               OBRAZEM. Wcześniej stawało na ostatniej klatce, a ostatnia
               klatka to płaska zieleń: po powrocie na stronę główną hero
               wyglądało jak pusty prostokąt i czytało się jako awaria, a nie
               jako decyzja. Pierwsza klatka — drzewo nad wodą — jest tym
               samym kadrem, który widzi ktoś wchodzący pierwszy raz.
               Zanurzenie na ostatnią klatkę zostaje tam, gdzie ma sens:
               zaraz PO filmie, w tej samej odsłonie strony. */
            const pierwszaKlatka = () => {
              if (!wideo.duration) return;
              wideo.currentTime = 0;
            };
            if (wideo.readyState >= 1) pierwszaKlatka();
            else wideo.addEventListener("loadedmetadata", pierwszaKlatka, { once: true });
          } else if (ma("Observer")) {
            czujka = Observer.create({
              target: window,
              type: "wheel,touch,pointer",
              preventDefault: true,
              allowClicks: true,
              tolerance: 6,
              onDown: odpal,
              onUp: odpal,
            });
            document.addEventListener("keydown", gestKlawiszem, true);
          }
          wideo.addEventListener("error", rozbrojenie);

          wideo.addEventListener("ended", () => koniecFilmu());
          /* Gdyby przeglądarka nie doszła do „ended" (utrata kontekstu,
             zawieszony dekoder), kończymy na ostatniej dziesiątej sekundy. */
          wideo.addEventListener("timeupdate", () => {
            if (filmSzedl && wideo.duration && wideo.currentTime >= wideo.duration - 0.08) {
              koniecFilmu();
            }
          });
        }
      }

      /* ======================================================
         2. PASEK NAWIGACJI
         ====================================================== */
      const pasek = document.querySelector(".masthead");
      const postep = document.querySelector(".masthead__postep i");

      if (postep) {
        gsap.fromTo(postep, { scaleX: 0 }, {
          scaleX: 1, ease: "none",
          scrollTrigger: {
            trigger: "#smooth-content",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
            refreshPriority: -10,   // liczy się jako pierwszy, obejmuje cały dokument
          },
        });
      }

      /* Zwarcie paska: nad filmem przezroczysty, niżej z tłem. */
      if (pasek) {
        const kotwica = document.querySelector(".hero") || document.querySelector("main");
        ScrollTrigger.create({
          trigger: kotwica,
          start: () => (document.querySelector(".hero") ? "bottom top+=80" : "top top-=40"),
          end: "max",
          onToggle: (self) => pasek.classList.toggle("masthead--zwarty", self.isActive),
        });
      }

      /* Hover w menu: etykieta wyjeżdża w górę, jej kopia wjeżdża od
         dołu. Kopia powstaje raz, przy wczytaniu. */
      document.querySelectorAll(".nav a").forEach((a) => {
        const org = a.querySelector("span");
        if (!org) return;
        const kopia = org.cloneNode(true);
        kopia.setAttribute("aria-hidden", "true");
        a.appendChild(kopia);
        gsap.set(kopia, { position: "absolute", left: 0, top: 0, yPercent: 110 });
        const tl = gsap.timeline({ paused: true, defaults: { duration: 0.42, ease: "power2.inOut" } })
          .to(org, { yPercent: -110 }, 0)
          .to(kopia, { yPercent: 0 }, 0);
        a.addEventListener("pointerenter", () => tl.play());
        a.addEventListener("pointerleave", () => tl.reverse());
        a.addEventListener("focus", () => tl.play());
        a.addEventListener("blur", () => tl.reverse());
      });

      /* PRÓBOWANE, WYCOFANE: rozwijany spis sekcji w pasku. Działał, ale
         w pasku stały już logo, pięć pozycji menu, telefon i przycisk
         wizyty — szósty element robił z niego panel sterowania. Na stronie
         o ośmiu sekcjach przewinięcie jest szybsze niż otwarcie listy. */

      /* Menu na wąskim ekranie. Panel leży poza kontenerem przewijania,
         więc działa także wtedy, gdy przewijanie jest zablokowane (film
         w hero). Na czas otwarcia blokujemy przewijanie tła — inaczej
         strona jeździ pod panelem. */
      const menuBtn = document.querySelector(".menu-btn");
      const menuPanel = document.getElementById("menu-mobilne");
      if (menuBtn && menuPanel) {
        const kreski = menuBtn.querySelectorAll(".menu-btn__kreski i");
        const pozycje = menuPanel.querySelectorAll(".menu-panel__spis a");
        let otwarte = false;

        gsap.set(menuPanel, { autoAlpha: 0, yPercent: -3 });
        gsap.set(pozycje, { autoAlpha: 0, y: 18 });

        const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
          .to(menuPanel, { autoAlpha: 1, yPercent: 0, duration: 0.45 }, 0)
          .to(pozycje, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06 }, 0.1)
          .to(menuPanel.querySelector(".menu-panel__stopka"), { autoAlpha: 1, duration: 0.4 }, 0.25)
          /* Dwie kreski składają się w krzyżyk — ten sam element, inny stan. */
          .to(kreski[0], { rotate: 45, y: 3, duration: 0.35 }, 0)
          .to(kreski[1], { rotate: -45, y: -3, duration: 0.35 }, 0);

        const przelacz = (stan) => {
          otwarte = stan;
          menuBtn.setAttribute("aria-expanded", String(stan));
          if (stan) {
            menuPanel.hidden = false;
            tl.play();
            if (smoother) smoother.paused(true);
          } else {
            tl.reverse().eventCallback("onReverseComplete", () => { menuPanel.hidden = true; });
            if (smoother && !document.documentElement.classList.contains("film-gra")) smoother.paused(false);
          }
        };

        menuBtn.addEventListener("click", () => przelacz(!otwarte));
        menuPanel.addEventListener("click", (e) => { if (e.target.closest("a")) przelacz(false); });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && otwarte) przelacz(false); });
      }

      /* ======================================================
         3. ODSŁANIANIE TREŚCI
         Nagłówki wierszami (SplitText z maską), reszta zbiorczo
         przez ScrollTrigger.batch — jedno wejście na grupę
         elementów, które trafiły w kadr w tej samej chwili.
         ====================================================== */
      document.querySelectorAll("[data-rozbij]").forEach((el) => {
        if (el.closest(".hero")) return;      // hero prowadzi czas, nie scroll
        const linie = rozbijNaLinie(el);
        if (!linie) return;
        gsap.from(linie, {
          yPercent: 118,
          duration: 1.15,
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      /* Nadtytuły „przesypują się" w swoje słowo. Drobiazg, ale to on
         sprawia, że wejście w sekcję ma dźwięk. */
      if (ma("ScrambleTextPlugin")) {
        document.querySelectorAll(".eyebrow").forEach((el) => {
          if (el.closest(".hero")) return;
          const docelowy = el.textContent;
          gsap.to(el, {
            duration: 1.1,
            scrambleText: { text: docelowy, chars: "·—/|\\", speed: 0.5, revealDelay: 0.15 },
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });
      }

      /* Zbiorcze wejście dla wszystkiego, co nie jest nagłówkiem. */
      const doOdsloniecia = gsap.utils.toArray([
        ".prose > *", "section .lead", ".wrap > .btn-row", ".contact-list > *",
        ".field", "form .btn", ".footer__grid > div", ".footer__seo p",
      /* Formularze konta sa wylaczone z tego wejscia. Reszta strony to
         tresc do czytania i moze sie odslaniac w miare przewijania, ale
         logowanie jest jedynym powodem, dla ktorego ktos tam wchodzi:
         puste ramki zamiast pol przy pierwszym spojrzeniu czytaja sie
         jako awaria, a nie jako animacja, ktora zaraz przyjdzie. */
      ]).filter((el) => !el.closest(".hero") && !el.closest(".konto-karta"));

      gsap.set(doOdsloniecia, { y: 26, autoAlpha: 0 });
      ScrollTrigger.batch(doOdsloniecia, {
        start: "top 90%",
        once: true,
        interval: 0.12,
        batchMax: 6,
        onEnter: (grupa) => gsap.to(grupa, {
          y: 0, autoAlpha: 1, duration: 1, stagger: 0.08, overwrite: true,
        }),
      });

      /* ======================================================
         5. FAKTY — liczby dochodzą do wartości
         ====================================================== */
      document.querySelectorAll("[data-licznik]").forEach((el) => {
        const cel = Number(el.dataset.licznik);
        if (!Number.isFinite(cel)) return;
        const od = cel > 100 ? cel - 24 : 0;      // rok liczymy od bliska, sztuki od zera
        const stan = { v: od };
        el.textContent = String(od);
        gsap.to(stan, {
          v: cel,
          duration: 2.2,
          ease: "power3.out",
          snap: { v: 1 },
          onUpdate: () => (el.textContent = String(Math.round(stan.v))),
          scrollTrigger: { trigger: ".facts", start: "top 85%", once: true },
        });
      });

      /* Wejście paska: kolumny wjeżdżają jedna po drugiej.
         Pasek faktów jest tylko na stronie głównej — bez tego warunku
         GSAP na każdej podstronie wypisywał „target not found". */
      if (document.querySelector(".facts-band .fact")) {
      const wyzwalaczFaktow = { trigger: ".facts", start: "top 85%", once: true };
      gsap.from(".facts-band .fact", {
        autoAlpha: 0, y: 64, duration: 1.1, stagger: 0.14, ease: "power3.out",
        scrollTrigger: wyzwalaczFaktow,
      });
      /* Same liczby były ledwo widoczne: licznik dochodził do wartości,
         ale cyfra stała w miejscu, więc z boku wyglądało to jak zwykły
         napis. Teraz liczba OSIADA — schodzi ze skali i z bursztynu do
         głębi dokładnie tak długo, jak długo idzie licznik. Bierze to
         każde `dt`, także „RTG": jedna forma dla całego rzędu, inaczej
         trzy pola żyją, a czwarte stoi. Kolory podane wprost, bo GSAP
         nie interpoluje zmiennych CSS. */
      gsap.fromTo(".facts-band dt",
        { scale: 1.22, color: "#8a6f39", transformOrigin: "0% 100%" },
        { scale: 1, color: "#1a3631", duration: 2.2, stagger: 0.14,
          ease: "power3.out", clearProps: "transform,color",
          scrollTrigger: wyzwalaczFaktow });
      }

      /* ======================================================
         6. ZESPÓŁ
         ====================================================== */
      const osoby = gsap.utils.toArray(".team .person");
      if (osoby.length) {
        gsap.from(osoby, {
          autoAlpha: 0, y: 44, duration: 1.1, stagger: 0.08,
          scrollTrigger: { trigger: ".team", start: "top 82%", once: true },
        });
        if (duzy) {
          osoby.forEach((os) => {
            const kadr = os.querySelector(".person__media");
            const rola = os.querySelector(".person__role");
            const tl = gsap.timeline({ paused: true })
              .to(kadr, { scale: 1.06, duration: 0.7, ease: "power2.out" }, 0)
              .to(rola, { color: "var(--deep)", duration: 0.5 }, 0);
            os.addEventListener("pointerenter", () => tl.play());
            os.addEventListener("pointerleave", () => tl.reverse());
          });
        }
      }

      /* ======================================================
         7. GALERIA — lupa
         Kadr, w który klikasz, sam rośnie do pełnego rozmiaru
         (Flip), więc widać, skąd wyszedł i gdzie wróci.
         ====================================================== */
      gsap.utils.toArray("[data-lupa]").forEach(zbudujLupeSiatki);

      /* Karuzele zdjęć — zespół, gabinety, kadry z zabiegów, galeria.
         Bez podziału na „duży ekran" i resztę: coverflow działa palcem
         tak samo jak myszą, więc telefon dostaje go w całości. */
      gsap.utils.toArray("[data-karuzela]").forEach(zbudujKaruzele);

      gsap.utils.toArray(".gallery__kadr").forEach((kadr) => {
        const img = kadr.querySelector("img");
        gsap.from(kadr, {
          autoAlpha: 0, y: 40, duration: 1,
          scrollTrigger: { trigger: kadr, start: "top 92%", once: true },
        });
        if (!duzy) return;
        kadr.addEventListener("pointerenter", () => gsap.to(img, { scale: 1.07, duration: 0.8 }));
        kadr.addEventListener("pointerleave", () => gsap.to(img, { scale: 1, duration: 0.8 }));
      });

      /* ======================================================
         7b. NOWE SKŁADNIKI PREZENTACJI
         Znaczki, karty wyboru, kafle oferty ze zdjęciem i siatka kart
         w pełnej galerii. Ruch jest tu dopiskiem do formy, nie zamiast
         niej: każdy z tych składników czyta się także bez animacji.
         ====================================================== */

      /* Znaczki wskakują po kolei, jak wyliczenie wypowiadane na głos. */
      gsap.utils.toArray(".znaczki").forEach((lista) => {
        gsap.from(lista.children, {
          autoAlpha: 0, y: 12, scale: 0.94, duration: 0.55, stagger: 0.07,
          scrollTrigger: { trigger: lista, start: "top 92%", once: true },
        });
      });

      /* Karty wyboru: wejście parami i podniesienie przy najechaniu. */
      gsap.utils.toArray(".wybor").forEach((lista) => {
        gsap.from(lista.children, {
          autoAlpha: 0, y: 26, duration: 0.8, stagger: 0.09,
          scrollTrigger: { trigger: lista, start: "top 90%", once: true },
        });
      });
      gsap.utils.toArray(".wybor__karta").forEach((karta) => {
        const nr = karta.querySelector(".wybor__nr");
        const tl = gsap.timeline({ paused: true, defaults: { duration: 0.4 } })
          .to(karta, { y: -6, borderColor: "var(--brass)" }, 0)
          .to(nr, { x: 4, color: "var(--deep)" }, 0);
        karta.addEventListener("pointerenter", () => tl.play());
        karta.addEventListener("pointerleave", () => tl.reverse());
        karta.addEventListener("focus", () => tl.play());
        karta.addEventListener("blur", () => tl.reverse());
      });

      /* Kafle oferty: wejście po kolei i podniesienie przy najechaniu.
         Bez zdjęcia — nośnikiem jest numer i typografia, więc to one
         się ruszają. */
      gsap.utils.toArray(".card--type").forEach((kafel) => {
        const nr = kafel.querySelector(".card__index");
        const wiecej = kafel.querySelector(".card__more");
        gsap.from(kafel, {
          autoAlpha: 0, y: 30, duration: 0.9,
          scrollTrigger: { trigger: kafel, start: "top 90%", once: true },
        });
        if (!duzy) return;
        const tl = gsap.timeline({ paused: true, defaults: { duration: 0.45 } })
          .to(kafel, { y: -8, borderColor: "var(--brass)" }, 0);
        if (nr) tl.to(nr, { x: 4, color: "var(--deep)" }, 0);
        if (wiecej) tl.to(wiecej, { x: 6 }, 0);
        kafel.addEventListener("pointerenter", () => tl.play());
        kafel.addEventListener("pointerleave", () => tl.reverse());
      });

      /* ======================================================
         HASŁO — PODGLĄD
         Hasło wpisywane w ciemno na telefonie to najczęstsza przyczyna
         nieudanego logowania: literowka jest niewidoczna, aż do odmowy.
         Przycisk odkrywa je na życzenie i sam mówi, w którym jest stanie.
         ====================================================== */
      document.querySelectorAll("[data-pokaz]").forEach((btn) => {
        const pole = document.getElementById(btn.dataset.pokaz);
        if (!pole) return;
        btn.addEventListener("click", () => {
          const jawne = pole.type === "text";
          pole.type = jawne ? "password" : "text";
          btn.textContent = jawne ? "pokaż" : "ukryj";
          btn.setAttribute("aria-label", jawne ? "Pokaż hasło" : "Ukryj hasło");
          pole.focus();
        });
      });

      /* ======================================================
         ADRES E-MAIL — KLIKNIĘCIE KOPIUJE
         `mailto:` działa tylko u kogoś, kto ma ustawiony program pocztowy.
         Na Windowsie bez Outlooka to nie jest reguła, tylko wyjątek — reszta
         klika i nie dzieje się nic, bez żadnego sygnału. Dlatego przy okazji
         kliknięcia adres ląduje w schowku, a przycisk mówi o tym wprost.
         Odnośnik zostaje `mailto:` — kto ma program pocztowy, dostaje
         dodatkowo okno nowej wiadomości.
         ====================================================== */
      gsap.utils.toArray('a[href^="mailto:"].akcja').forEach((el) => {
        el.addEventListener("click", () => {
          const adres = el.getAttribute("href").replace("mailto:", "");
          if (!navigator.clipboard) return;
          navigator.clipboard.writeText(adres).then(() => {
            if (el.querySelector(".akcja__potwierdzenie")) return;
            const znak = document.createElement("span");
            znak.className = "akcja__potwierdzenie";
            znak.textContent = "Adres skopiowany";
            el.classList.add("akcja--skopiowane");
            el.appendChild(znak);
            gsap.fromTo(znak, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.3 });
            gsap.to(znak, { autoAlpha: 0, duration: 0.4, delay: 2.2,
              onComplete: () => znak.remove() });
          }).catch(() => { /* schowek zablokowany — zostaje samo mailto */ });
        });
      });

      /* ======================================================
         OPINIE — STRZAŁKI DO TORU
         Sam tor przesuwa się natywnie (`scroll-snap`), więc działa bez
         tego kodu: palcem, kółkiem i klawiaturą. Strzałki dokładają tylko
         wygody na myszy i pokazują, że jest co przesuwać — bez nich pasek
         kafelków bywa brany za ucięty układ.
         ====================================================== */
      gsap.utils.toArray("[data-opinie-tor]").forEach((tor) => {
        const ster = tor.parentElement.querySelector(".opinie__ster");
        if (!ster) return;
        const karty = gsap.utils.toArray(":scope > .opinia", tor);
        const licznik = ster.querySelector(".karuzela__licznik b");
        if (!karty.length) return;

        /* Strzałki mają sens tylko wtedy, gdy jest co przesuwać. Przy
           szerokim oknie wszystkie kafelki mieszczą się naraz i sterowanie
           obiecuje ruch, którego nie ma — więc wtedy znika. Na węższym
           ekranie tor się przewija i strzałki wracają same. */
        const ocenSter = () => { ster.hidden = tor.scrollWidth <= tor.clientWidth + 1; };
        ocenSter();
        new ResizeObserver(ocenSter).observe(tor);

        const teraz = () => {
          /* Widoczna jest ta karta, której lewa krawędź jest najbliżej
             lewej krawędzi toru — to samo kryterium, którym `scroll-snap`
             wybiera, gdzie się zatrzymać. */
          const t = tor.getBoundingClientRect().left;
          let naj = 0, d = Infinity;
          karty.forEach((k, i) => {
            const odl = Math.abs(k.getBoundingClientRect().left - t);
            if (odl < d) { d = odl; naj = i; }
          });
          return naj;
        };

        const pokaz = () => { licznik.textContent = String(teraz() + 1); };
        tor.addEventListener("scroll", () => {
          clearTimeout(tor.__czekaj);
          tor.__czekaj = setTimeout(pokaz, 120);
        }, { passive: true });

        ster.addEventListener("click", (e) => {
          const btn = e.target.closest("[data-opinie]");
          if (!btn) return;
          const cel = Math.min(karty.length - 1, Math.max(0, teraz() + Number(btn.dataset.opinie)));
          tor.scrollTo({ left: karty[cel].offsetLeft - tor.offsetLeft, behavior: "smooth" });
        });
      });

      /* ======================================================
         MAPA NA ŻĄDANIE
         Osadzona mapa Google łączy się z serwerami Google przy KAŻDYM
         wejściu na stronę — także u osób, które map nigdy nie otworzą.
         Tutaj ramka powstaje dopiero po kliknięciu: do tego czasu strona
         nie wysyła nic na zewnątrz i nie ciągnie kilkuset kilobajtów.
         ====================================================== */
      gsap.utils.toArray("[data-mapa]").forEach((mapa) => {
        const przycisk = mapa.querySelector(".mapa__wlacz");
        if (!przycisk) return;
        przycisk.addEventListener("click", () => {
          const ramka = document.createElement("iframe");
          ramka.src = mapa.dataset.osadzenie;
          ramka.loading = "lazy";
          ramka.title = "Mapa dojazdu do Dental Park w Kielcach";
          ramka.referrerPolicy = "no-referrer-when-downgrade";
          ramka.allowFullscreen = true;
          mapa.replaceChildren(ramka);
        }, { once: true });
      });

      /* Park: akapity oferty jako kamienie spięte ścieżką. */
      const park = document.querySelector("[data-park]");
      if (park) zbudujPark(park);

      /* Ścieżka oferty na podstronach zabiegów. */
      const trasa = document.querySelector("[data-trasa]");
      if (trasa) zbudujTrase(trasa);

      /* Porównania przed / po (podstrona stomatologii estetycznej). */
      gsap.utils.toArray("[data-porownanie]").forEach(zbudujPorownanie);

      /* ======================================================
         8. PÓŁKA OFERTY
         ====================================================== */
      const polka = document.querySelector("[data-polka]");
      if (polka) zbudujPolke(polka);

      /* ======================================================
         9. GRAFIK TYGODNIA
         Kolumny dni wyrastają od dołu, dyżury wskakują w nie po
         kolei. Potem grafik jest narzędziem: najechanie na nazwisko
         zostawia na wierzchu tylko dyżury tej osoby, najechanie na
         kolumnę podnosi cały dzień.
         ====================================================== */
      const grafik = document.querySelector("[data-grafik]");
      if (grafik) zbudujGrafik(grafik, duzy);

      /* ======================================================
         10. FORMULARZ — mikroreakcje
         ====================================================== */
      document.querySelectorAll(".field input, .field textarea").forEach((pole) => {
        const etykieta = pole.closest(".field").querySelector("label");
        pole.addEventListener("focus", () => {
          gsap.to(pole, { borderColor: "var(--deep)", duration: 0.3 });
          gsap.to(etykieta, { color: "var(--deep)", x: 3, duration: 0.3 });
        });
        pole.addEventListener("blur", () => {
          gsap.to(pole, { borderColor: "var(--line)", duration: 0.4 });
          gsap.to(etykieta, { color: "var(--moss)", x: 0, duration: 0.4 });
        });
      });

      /* ======================================================
         11. FINAŁ — mgła i kreska
         ====================================================== */
      const mgla1 = document.querySelector(".finale__mgla-1");
      const mgla2 = document.querySelector(".finale__mgla-2");
      if (mgla1) {
        gsap.to(mgla1, { xPercent: -12, yPercent: 8, scale: 1.15, duration: 26,
          repeat: -1, yoyo: true, ease: "sine.inOut" });
      }
      if (mgla2) {
        gsap.to(mgla2, { xPercent: 14, yPercent: -6, scale: 1.2, duration: 32,
          repeat: -1, yoyo: true, ease: "sine.inOut" });
      }
      const kreska = document.querySelector(".finale__kreska path");
      if (kreska && ma("DrawSVGPlugin")) {
        gsap.fromTo(kreska, { drawSVG: "0% 0%" }, {
          drawSVG: "0% 100%", ease: "none",
          scrollTrigger: { trigger: ".finale", start: "top 70%", end: "center center", scrub: 0.6 },
        });
      }
      /* Sekcja finałowa dojeżdża z lekkim uniesieniem treści. */
      if (document.querySelector(".finale__inner")) {
        gsap.from(".finale__inner", {
          y: 60, autoAlpha: 0, duration: 1.2,
          scrollTrigger: { trigger: ".finale", start: "top 75%", once: true },
        });
      }

      /* ======================================================
         11b. PODSTRONY
         Podstrony mają własne składniki: okruszek, pas tytułowy,
         boczny indeks śródtytułów i listy przerobione na wiersze.
         Wszystkie budowane są przez usluga.js (dlatego ten plik
         wczytuje się po nim), a ruch dostają tu — nie w usluga.css,
         gdzie stał drugi system animacji na tych samych elementach.
         ====================================================== */

      /* Okruszek i pas tytułowy: wejście od razu, bez czekania na scroll —
         są nad zgięciem, więc scroll nie miałby czego mierzyć. */
      const pasTytulowy = document.querySelector(".usluga-pas");
      if (pasTytulowy) {
        /* BEZ opóźnienia i bez rozbiegu. Przy `delay: 0.1` plus start
           tytułu na 0,15 s pierwsza ćwierć sekundy po wejściu na podstronę
           pokazywała pusty zielony pas — ekran, który nie był ani poprzednią
           stroną, ani docelową. Tytuł ma ruszać w tej samej klatce, w której
           strona się rysuje. */
        const tl = gsap.timeline();
        const okruszek = pasTytulowy.querySelector(".crumb");
        okruszek && tl.from(okruszek, { autoAlpha: 0, x: -14, duration: 0.5 }, 0);
        const naglowki = pasTytulowy.querySelectorAll("[data-rozbij]");
        naglowki.forEach((el, i) => {
          const linie = rozbijNaLinie(el);
          if (linie) tl.from(linie, { yPercent: 115, duration: 0.8, stagger: 0.06 }, i * 0.08);
        });
      }

      /* Wiersze list. Każda lista ma własny licznik, więc opóźnienie nie
         narasta przez całą stronę (przy dziesięciu punktach ostatni wchodziłby
         pół sekundy po dojściu do kadru). */
      gsap.utils.toArray(".usluga-wiersze").forEach((ul) => {
        gsap.from(ul.children, {
          autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.055,
          scrollTrigger: { trigger: ul, start: "top 88%", once: true },
        });
      });

      /* Znacznik na szynie listy zabiegów. Jedzie w dół razem z czytelnikiem
         i zapala wiersz, przy którym akurat stoi — lista przestaje być
         statyczna, a pacjent widzi, gdzie jest, bez czytania od nowa. */
      gsap.utils.toArray("ul.zabiegi").forEach((ul) => {
        const wiersze = gsap.utils.toArray("li", ul);
        if (wiersze.length < 2) return;

        const znacznik = document.createElement("i");
        znacznik.className = "zabiegi__znacznik";
        znacznik.setAttribute("aria-hidden", "true");
        ul.appendChild(znacznik);

        const zapal = (postep) => {
          const nr = gsap.utils.clamp(0, wiersze.length - 1,
            Math.round(postep * (wiersze.length - 1)));
          wiersze.forEach((li, i) => li.classList.toggle("jest-tu", i === nr));
        };

        if (duzy) {
          wiersze.forEach((li) => {
            const tl = gsap.timeline({ paused: true })
              .to(li, { x: 6, duration: 0.35, ease: "power2.out" });
            li.addEventListener("pointerenter", () => tl.play());
            li.addEventListener("pointerleave", () => tl.reverse());
          });
        }

        gsap.fromTo(znacznik,
          { y: () => wiersze[0].offsetTop + wiersze[0].offsetHeight / 2 },
          {
            y: () => {
              const ost = wiersze[wiersze.length - 1];
              return ost.offsetTop + ost.offsetHeight / 2;
            },
            ease: "none",
            immediateRender: true,
            scrollTrigger: {
              trigger: ul,
              /* Zakres dobrany tak, żeby znacznik przechodził całą listę
                 mniej więcej wtedy, kiedy lista przechodzi przez środek
                 ekranu — czyli wtedy, kiedy się ją czyta. */
              start: "top 78%",
              end: "bottom 45%",
              scrub: 0.4,
              invalidateOnRefresh: true,
              onUpdate: (self) => zapal(self.progress),
            },
          });
      });

      /* Zdanie otwierające dostaje osobne wejście — jest wyciągane przed
         resztę akapitu właśnie po to, żeby je zauważyć. */
      const otwarcie = document.querySelector(".prose__otwarcie");
      if (otwarcie) {
        gsap.from(otwarcie, {
          autoAlpha: 0, y: 16, duration: 1,
          scrollTrigger: { trigger: otwarcie, start: "top 92%", once: true },
        });
      }

      /* ======================================================
         11c. WŁASNY KURSOR I DŹWIĘK KLIKNIĘCIA
         ====================================================== */
      if (matchMedia("(pointer: fine)").matches) dzwiekKlikniecia();

      /* ======================================================
         12. PRZYCISKI PRZYCIĄGANE KURSOREM
         quickTo, nie gsap.to na każdym ruchu myszy — jeden tween
         na właściwość zamiast setek nowych (gsap-performance).
         ====================================================== */
      if (duzy) {
        document.querySelectorAll(".btn--magnes").forEach((btn) => {
          const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
          const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
          btn.addEventListener("pointermove", (e) => {
            const r = btn.getBoundingClientRect();
            xTo(gsap.utils.clamp(-8, 8, (e.clientX - (r.left + r.width / 2)) * 0.35));
            yTo(gsap.utils.clamp(-6, 6, (e.clientY - (r.top + r.height / 2)) * 0.35));
          });
          btn.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
        });
      }

      return () => {
        /* matchMedia sam wycofuje tweeny i ScrollTriggery; tu tylko to,
           co dopisaliśmy do DOM albo do dokumentu. */
        html.classList.remove("film-gra");
        if (blokada) { blokada.kill(); blokada = null; }
        if (smoother) smoother.paused(false);
      };
    }
  );

  /* ==========================================================
     13. ODŚWIEŻENIA
     Fonty i zdjęcia zmieniają wysokość dokumentu po tym, jak
     ScrollTrigger policzył pozycje. Bez odświeżenia wyzwalacze
     stoją w złych miejscach (błąd nr 7 z listy mistakes).
     ========================================================== */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  addEventListener("load", () => ScrollTrigger.refresh());

  /* ==========================================================
     POMOCNIKI
     ========================================================== */

  /** Rozbija nagłówek na wiersze w maskach i zwraca tablicę wierszy.
   *  autoSplit + onSplit: po doczytaniu fontu wiersze łamią się
   *  inaczej, więc SplitText musi rozbić element od nowa. */
  function rozbijNaLinie(el) {
    if (!el || !ma("SplitText")) {
      el && gsap.set(el, { visibility: "visible" });
      return null;
    }
    const split = SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "linia",
      autoSplit: true,
    });
    gsap.set(el, { visibility: "visible" });
    return split.lines;
  }

  /** Wersja bez ruchu: pokaż wszystko, co normalnie wchodzi. */
  function odsloniecieBezRuchu() {
    gsap.set([
      ".prose > *", "section .lead", ".wrap > .btn-row", ".contact-list > *",
      ".field", ".team .person", ".gallery__kadr", ".finale__inner",
    ], { clearProps: "all", autoAlpha: 1 });
    const kal = document.querySelector(".kal-blok");
    if (kal) kal.dataset.stan = "gotowy";
  }

  /** LUPA — jedna na całą stronę.
   *
   *  Klik w kadr rozwija go na cały ekran (Flip), klik albo Escape odsyła
   *  na miejsce. Zdjęcie jest to samo: przenosimy węzeł, nie robimy kopii,
   *  więc przeglądarka nie wczytuje drugiej kopii pliku i nie ma wersji
   *  „małej" i „dużej", które mogłyby się rozjechać.
   *
   *  Powstaje przy pierwszym użyciu, bo używają jej dwa komponenty
   *  (karuzela zdjęć i siatka galerii) i obie muszą trafić w ten sam element. */
  let lupaGotowa = null;

  function lupa() {
    if (lupaGotowa) return lupaGotowa;

    const el = document.createElement("div");
    el.className = "lupa";
    const strzalkaLupy = (kier, etykieta, d) =>
      '<button class="lupa__strzalka lupa__strzalka--' + (kier < 0 ? "wstecz" : "dalej") +
      '" type="button" data-lupa-kier="' + kier + '" aria-label="' + etykieta + '">' +
      '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg></button>";
    el.innerHTML =
      '<button class="lupa__zamknij" type="button">Zamknij</button>' +
      strzalkaLupy(-1, "Poprzednie zdjęcie", "M10 3 L5 8 L10 13") +
      '<div class="lupa__kadr"></div>' +
      strzalkaLupy(1, "Następne zdjęcie", "M6 3 L11 8 L6 13");
    document.body.appendChild(el);
    const kadr = el.querySelector(".lupa__kadr");
    const zamknijBtn = el.querySelector(".lupa__zamknij");
    const strzalki = gsap.utils.toArray(".lupa__strzalka", el);

    let otwarte = null;   // { img, gniazdo, przedtem, dalej }

    /* `dalej` to funkcja, którą podaje ten, kto lupę otworzył: dostaje
       kierunek i oddaje następne zdjęcie. Lupa nie wie, skąd ono jest ani
       w jakiej kolejności — dzięki temu karuzela może przy okazji przełożyć
       swój pierścień, żeby po zamknięciu stać na tym samym kadrze. */
    function otworz(img, dalej) {
      if (otwarte || !img) return;
      const gniazdo = img.parentElement;
      const przedtem = img.nextSibling;
      const stan = ma("Flip") ? Flip.getState(img) : null;
      kadr.appendChild(img);
      el.classList.add("lupa--otwarta");
      gsap.to(el, { autoAlpha: 1, duration: 0.4 });
      if (stan) Flip.from(stan, { duration: 0.7, ease: "power2.inOut", absolute: true, scale: false });
      otwarte = { img, gniazdo, przedtem, dalej: dalej || null };
      strzalki.forEach((s) => { s.hidden = !dalej; });
      document.addEventListener("keydown", naKlawisz);
      zamknijBtn.focus();
    }

    /* Przekładanie BEZ zamykania: zdjęcie wraca na swoje miejsce, następne
       wchodzi na jego. Zamknięcie i otwarcie od nowa dawało pełny Flip
       w obie strony przy każdej strzałce — dwa przeloty przez pół ekranu
       zamiast jednego przejścia. */
    function przeloz(kier) {
      if (!otwarte || !otwarte.dalej) return;
      const nastepny = otwarte.dalej(kier);
      if (!nastepny || nastepny === otwarte.img) return;
      const { img, gniazdo, przedtem, dalej } = otwarte;
      gniazdo.insertBefore(img, przedtem);
      const g2 = nastepny.parentElement;
      const p2 = nastepny.nextSibling;
      kadr.appendChild(nastepny);
      gsap.fromTo(nastepny,
        { autoAlpha: 0, x: kier * 48 },
        { autoAlpha: 1, x: 0, duration: 0.45, ease: "power2.out" });
      otwarte = { img: nastepny, gniazdo: g2, przedtem: p2, dalej };
    }

    function zamknij() {
      if (!otwarte) return;
      const { img, gniazdo, przedtem } = otwarte;
      const stan = ma("Flip") ? Flip.getState(img) : null;
      /* Wraca dokładnie tam, gdzie był — w talii kolejność kart znaczy,
         która jest na wierzchu, więc dopisanie na koniec przetasowałoby stos. */
      gniazdo.insertBefore(img, przedtem);
      if (stan) Flip.from(stan, { duration: 0.6, ease: "power2.inOut", absolute: true, scale: false });
      gsap.to(el, {
        autoAlpha: 0, duration: 0.4,
        onComplete: () => el.classList.remove("lupa--otwarta"),
      });
      otwarte = null;
      strzalki.forEach((s) => { s.hidden = true; });
      document.removeEventListener("keydown", naKlawisz);
    }

    function naKlawisz(e) {
      if (e.key === "Escape") { zamknij(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); przeloz(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); przeloz(1); }
    }

    zamknijBtn.addEventListener("click", zamknij);
    el.addEventListener("click", (e) => {
      const s = e.target.closest("[data-lupa-kier]");
      if (s) { przeloz(Number(s.dataset.lupaKier)); return; }
      if (e.target === el || e.target === kadr) zamknij();
    });

    lupaGotowa = { otworz, zamknij };
    return lupaGotowa;
  }

  function otworzWLupie(img, dalej) { if (img) lupa().otworz(img, dalej); }

  /** Siatka zdjęć z lupą — tam, gdzie kadrów jest za dużo na talię. */
  function zbudujLupeSiatki(galeria) {
    galeria.addEventListener("click", (e) => {
      const img = e.target.closest("img");
      if (img && galeria.contains(img)) otworzWLupie(img);
    });
  }

  /** Karuzela zdjęć — coverflow.
   *
   *  JEDEN stan: `stan.pozycja` — ułamkowy numer karty stojącej na środku.
   *  Przesunięcie, obrót, głębia, krycie i kolejność w stosie liczą się
   *  z niej przy każdej klatce, więc nie ma drugiej liczby, która mogłaby
   *  się z nią rozjechać.
   *
   *  Zapętlenie polega wyłącznie na zawinięciu odległości do krótszej
   *  strony obiegu. Żadnych klonów w znacznikach, żadnego przestawiania
   *  węzłów — galeria z dwudziestoma zdjęciami ma w kodzie dwadzieścia
   *  elementów, nie sześćdziesiąt.
   *
   *  Animowana jest ta jedna liczba (GSAP), a karty są tylko jej odczytem
   *  — style ustawiamy prosto na elementach. Osobny tween na każdej karcie
   *  przy każdym ruchu palca to dwadzieścia systemów ruchu na tej samej
   *  właściwości, a dwa zawsze kończą się skokiem.
   *
   *  Bez skryptu (i przy prefers-reduced-motion, bo wtedy cała ta gałąź
   *  nie startuje) w znacznikach zostaje siatka zdjęć — kompletna,
   *  klikalna, tylko bez głębi.
   */
  function zbudujKaruzele(kar) {
    const scena = kar.querySelector(".karuzela__scena");
    const tor = kar.querySelector(".karuzela__tor");
    if (!scena || !tor) return;
    const karty = gsap.utils.toArray(".karuzela__karta", tor);
    const ile = karty.length;
    if (!ile) return;

    /* Pokrętła. Odchylenie i cofnięcie DOTYCZĄ PIERWSZEGO SĄSIADA —
       dalsze dostają je przez `odległość^OPAD`, a nie razy odległość.
       Przy rampie liniowej druga karta stała już prawie bokiem. */
    const OBROT = 44;      // stopnie odchylenia pierwszego sąsiada
    const GLEBIA = 0.6;    // jak głęboko cofa się pierwszy sąsiad (× szerokość karty)
    const OPAD = 0.56;     // wykładnik odległości; poniżej 1 rampa słabnie z oddaleniem
    const GASNIE = 0.1;    // ubytek krycia na każdy krok od środka
    const LUZ = 0.05;      // odstęp między kartami (× szerokość karty)
    const KANT = 82;       // maksymalne odchylenie — karta nigdy nie staje tyłem

    const stan = { pozycja: 0 };
    let szerokosc = 0;
    /* Dokąd zmierza bieżące dojście. Odliczanie od `stan.pozycja` gubiłoby
       klawisz wciśnięty w locie: zaokrąglenie jeszcze nie zdążyło się ruszyć. */
    let cel = 0;

    const naKarte = (p) => ((Math.round(p) % ile) + ile) % ile;

    function rysuj() {
      if (!szerokosc) return;
      const skok = szerokosc * (1 + LUZ);
      const p = stan.pozycja;

      for (let i = 0; i < ile; i++) {
        /* Odległość zawinięta do krótszej strony pierścienia — na tym
           polega całe zapętlenie. */
        let odsun = (((i - p) % ile) + ile) % ile;
        if (odsun > ile / 2) odsun -= ile;

        const dystans = Math.abs(odsun);
        const rampa = Math.pow(dystans, OPAD);
        const kat = Math.min(OBROT * rampa, KANT) * Math.sign(odsun);
        const karta = karty[i];

        karta.style.transform =
          "translateX(calc(-50% + " + (odsun * skok).toFixed(2) + "px)) " +
          "translateZ(" + (-GLEBIA * szerokosc * rampa).toFixed(2) + "px) " +
          "rotateY(" + (-kat).toFixed(2) + "deg)";

        /* Karta przeskakuje na drugą stronę pierścienia dokładnie na pół
           obiegu, więc do tego czasu musi zgasnąć — inaczej skok widać. */
        const brzeg = Math.min(1, Math.max(0, ile / 2 - dystans));
        karta.style.opacity = String(Math.max(0, 1 - GASNIE * dystans) * brzeg);
        karta.style.zIndex = String(100 - Math.round(dystans));
      }
    }

    /* ---- podpis i licznik ---------------------------------------- */
    /* Podpis bierzemy z `alt` zdjęcia, więc nie ma drugiego miejsca,
       w którym trzeba go poprawiać. „Nazwisko — Funkcja" rozpada się na
       dwie linie; podpis bez myślnika zostaje jedną. */
    const dane = karty.map((k) => {
      const img = k.querySelector("img");
      const czesci = (img ? img.getAttribute("alt") || "" : "").split("—");
      return { img, kto: (czesci[0] || "").trim(), rola: (czesci[1] || "").trim() };
    });

    const chceOpis = kar.hasAttribute("data-karuzela-opis");
    let opisKto = null, opisRola = null;
    if (chceOpis) {
      const opis = document.createElement("p");
      opis.className = "karuzela__opis";
      opis.setAttribute("aria-live", "polite");
      opis.innerHTML = "<b></b><span></span>";
      kar.appendChild(opis);
      opisKto = opis.querySelector("b");
      opisRola = opis.querySelector("span");
    }

    const ster = document.createElement("div");
    ster.className = "karuzela__ster";
    const strzalka = (kierunek, etykieta, d) =>
      '<button class="karuzela__btn" type="button" data-kf="' + kierunek + '" aria-label="' + etykieta + '">' +
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">' +
      '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg></button>";
    ster.innerHTML =
      strzalka("-1", "Poprzednie zdjęcie", "M10 3 L5 8 L10 13") +
      '<p class="karuzela__licznik"' + (chceOpis ? "" : ' aria-live="polite"') +
      "><b>1</b> / <span>" + ile + "</span></p>" +
      strzalka("1", "Następne zdjęcie", "M6 3 L11 8 L6 13");
    /* Ster idzie zaraz za sceną, przed podpisem — kolejność czytania
       jest ta sama, co kolejność patrzenia. */
    scena.after(ster);
    const licznikNr = ster.querySelector(".karuzela__licznik b");

    /* Panel z opisami — używa go strona zespołu: pod karuzelą stoi sześć
       gotowych opisów, a widoczny jest ten, którego zdjęcie akurat stoi na
       środku. Bez skryptu widać wszystkie, więc wyszukiwarka i czytnik
       ekranu dostają komplet niezależnie od tego, czy karuzela ruszy. */
    const panel = kar.getAttribute("data-karuzela-panel");
    const opisy = panel ? gsap.utils.toArray(panel + " > [data-osoba]") : [];
    if (opisy.length) kar.classList.add("karuzela--z-panelem");

    let pokazany = -1;
    function pokazPodpis(nr) {
      if (nr === pokazany) return;
      pokazany = nr;
      licznikNr.textContent = String(nr + 1);
      opisy.forEach((el, i) => {
        const teraz = i === nr;
        el.classList.toggle("lekarz--widoczny", teraz);
        el.setAttribute("aria-hidden", teraz ? "false" : "true");
      });
      if (!opisKto) return;
      opisKto.textContent = dane[nr].kto;
      opisRola.textContent = dane[nr].rola;
    }

    /* ---- przekładanie -------------------------------------------- */
    function jedzDo(nowy) {
      cel = nowy;
      pokazPodpis(naKarte(nowy));
      gsap.to(stan, {
        pozycja: nowy,
        duration: 0.7,
        ease: "power3.out",
        overwrite: true,
        onUpdate: rysuj,
      });
    }
    const przesun = (o) => jedzDo(Math.round(cel) + o);
    /* Krótszą stroną pierścienia, zamiast rozwijać cały obieg. */
    const doKarty = (i) => jedzDo(i + Math.round((cel - i) / ile) * ile);

    /* ---- przeciąganie -------------------------------------------- */
    let ciag = null;
    let przeciagniete = false;

    scena.addEventListener("pointerdown", (e) => {
      gsap.killTweensOf(stan);
      scena.setPointerCapture(e.pointerId);
      cel = stan.pozycja;
      ciag = { id: e.pointerId, x: e.clientX, poz: stan.pozycja, v: 0, t: performance.now() };
      przeciagniete = false;
    });

    scena.addEventListener("pointermove", (e) => {
      if (!ciag || ciag.id !== e.pointerId) return;
      const skok = szerokosc * (1 + LUZ);
      if (!skok) return;
      const teraz = performance.now();
      const przed = stan.pozycja;
      stan.pozycja = ciag.poz - (e.clientX - ciag.x) / skok;
      /* Kart na sekundę — z tego liczy się rzut po puszczeniu. */
      ciag.v = ((stan.pozycja - przed) / Math.max(teraz - ciag.t, 1)) * 1000;
      ciag.t = teraz;
      if (Math.abs(e.clientX - ciag.x) > 4) przeciagniete = true;
      rysuj();
      pokazPodpis(naKarte(stan.pozycja));
    });

    const koniecCiagu = (e) => {
      if (!ciag || ciag.id !== e.pointerId) return;
      const v = ciag.v;
      ciag = null;
      /* Rzut niesie dalej, ale najwyżej o dwie karty: dłuższy przelot
         gubi miejsce, w którym się było. */
      const niesie = Math.max(-2, Math.min(2, v * 0.18));
      jedzDo(Math.round(stan.pozycja + niesie));
    };
    scena.addEventListener("pointerup", koniecCiagu);
    scena.addEventListener("pointercancel", koniecCiagu);

    /* ---- klik i klawiatura --------------------------------------- */
    /* Karta z boku najpierw jedzie na środek, dopiero środkowa otwiera się
       na cały ekran. Klik w przekrzywioną miniaturę „na pełny kadr" trafiał
       w coś, czego i tak nie było widać. */
    /* Nasłuch siedzi na SCENIE, nie na kartach — z dwóch powodów naraz.
       Po pierwsze przechwycony wskaźnik (`setPointerCapture`) przenosi
       zdarzenie `click` na element, który przechwycił, więc do karty nigdy
       by nie doszło. Po drugie trafienia w kartę nie da się oddać
       przeglądarce: przy `rotateY` z perspektywą Chrome trafia tylko
       w kartę środkową, a `elementFromPoint` nad obróconą zwraca pojemnik.
       Szukamy więc po prostokątach, biorąc tę najbliżej środka pierścienia
       — czyli tę, która leży na wierzchu. */
    function kartaPod(x, y) {
      let znaleziona = -1, najwyzej = -1;
      for (let i = 0; i < ile; i++) {
        const k = karty[i];
        if (+k.style.opacity < 0.05) continue;
        const r = k.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
        const z = Number(k.style.zIndex) || 0;
        if (z > najwyzej) { najwyzej = z; znaleziona = i; }
      }
      return znaleziona;
    }
    scena.addEventListener("click", (e) => {
      if (przeciagniete) return;
      const i = kartaPod(e.clientX, e.clientY);
      if (i < 0) return;
      if (naKarte(stan.pozycja) === i) otworzWSwoim(i);
      else doKarty(i);
    });

    /* Tabulator zatrzymuje się na scenie, nie na każdej karcie: karty
       z drugiej strony pierścienia mają krycie 0, a fokus na niewidzialnym
       zdjęciu to fokus, który zniknął. */
    /* W lupie strzałki przekładają TĘ SAMĄ karuzelę, więc po zamknięciu
       pierścień stoi na zdjęciu, które było oglądane — a nie na tym,
       od którego się zaczęło. */
    function otworzWSwoim(i) {
      doKarty(i);
      otworzWLupie(dane[i].img, (kier) => {
        przesun(kier);
        return dane[naKarte(cel)].img;
      });
    }

    scena.tabIndex = 0;
    scena.setAttribute("role", "group");
    scena.setAttribute("aria-roledescription", "karuzela zdjęć");
    scena.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); przesun(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); przesun(1); }
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        otworzWSwoim(naKarte(stan.pozycja));
      }
    });
    ster.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-kf]");
      if (btn) przesun(Number(btn.dataset.kf));
    });

    /* ---- wymiar ---------------------------------------------------- */
    /* Szerokość karty niesie skok, głębię i perspektywę, więc jest jedyną
       rzeczą wartą mierzenia — i tylko wtedy, gdy pudełko naprawdę się
       zmieni. */
    kar.classList.add("karuzela--gra");
    const zmierz = () => {
      const w = karty[0].offsetWidth;
      if (!w || w === szerokosc) return;
      szerokosc = w;
      rysuj();
    };
    zmierz();
    new ResizeObserver(zmierz).observe(scena);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(zmierz);
    pokazPodpis(0);

    /* Wejście: karuzela pojawia się przy dojściu do kadru, jak reszta
       sekcji — ale rysunek 3D zostaje nietknięty, bo animujemy pojemnik. */
    gsap.from(scena, {
      autoAlpha: 0, y: 24, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: kar, start: "top 82%", once: true },
    });
  }

  /** Grafik tygodnia: wejście kolumn i dyżurów, potem obsługa dwóch
   *  kierunków czytania — po lekarzu i po dniu.
   *
   *  Dwa poziomy zaznaczenia, jak w każdym narzędziu, w którym można
   *  „popatrzeć" i „ustawić": podglad idzie spod kursora albo fokusu
   *  i ma pierwszeństwo, wybor jest utrwalony kliknięciem. Bez tego
   *  rozdziału zdjęcie kursora z ekranu kasowałoby wybór. */
  function zbudujGrafik(grafik, duzy) {
    const bloki = gsap.utils.toArray(".grafik__blok", grafik);
    const przyciski = gsap.utils.toArray(".grafik__osoba-btn", grafik);
    const dni = gsap.utils.toArray(".grafik__dzien", grafik);
    const slupy = gsap.utils.toArray(".grafik__slup", grafik);

    /* ---------- wejście ---------- */
    const tl = gsap.timeline({
      scrollTrigger: { trigger: grafik, start: "top 78%", once: true },
    });
    tl.from(".grafik__osoba", { autoAlpha: 0, x: -18, duration: 0.7, stagger: 0.07 }, 0)
      .from(".grafik__os li", { autoAlpha: 0, duration: 0.5, stagger: 0.04 }, 0.1)
      .from(".grafik__nazwa", { autoAlpha: 0, y: -10, duration: 0.5, stagger: 0.05 }, 0.15)
      /* Kolumny wyrastają od dołu: scaleY, nie height — height liczy
         układ na każdej klatce, scaleY idzie po kompozytorze. */
      .from(slupy, { scaleY: 0, duration: 0.9, stagger: 0.06, ease: "power3.out" }, 0.2)
      .from(bloki, { autoAlpha: 0, yPercent: 12, duration: 0.6, stagger: 0.05 }, 0.75);

    /* ---------- dzisiaj i „teraz" ---------- */
    /* getDay(): 1 = poniedziałek … 6 = sobota — ta sama numeracja, co
       data-d w znacznikach. Niedziela (0) nie ma kolumny. */
    const teraz = new Date();
    const dzisNr = teraz.getDay();
    const kolumnaDzis = dni.find((d) => d.dataset.d === String(dzisNr));
    if (kolumnaDzis) {
      kolumnaDzis.classList.add("grafik__dzien--dzis");
      const OD = 8, DO = 20;
      const h = teraz.getHours() + teraz.getMinutes() / 60;
      if (h > OD && h < DO) {
        const kreska = document.createElement("div");
        kreska.className = "grafik__teraz";
        kreska.style.top = ((h - OD) / (DO - OD)) * 100 + "%";
        kolumnaDzis.querySelector(".grafik__slup").appendChild(kreska);
        tl.from(kreska, { scaleX: 0, autoAlpha: 0, duration: 0.8, transformOrigin: "0 50%" }, 1.2);
        /* Puls: jedyny element strony, który ma prawo migać — pokazuje
           bieżącą godzinę, więc ruch jest tu treścią. */
        gsap.to(kreska, {
          opacity: 0.45, duration: 1.6, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2,
        });
      }
    }

    /* ---------- podświetlanie ---------- */
    let wybor = null;     // utrwalony kliknięciem
    let podglad = null;   // przelotny, spod kursora albo fokusu

    function rysuj() {
      const kto = podglad || wybor;
      przyciski.forEach((b) => {
        const jego = kto && b.dataset.l === kto;
        b.classList.toggle("grafik__osoba-btn--wybrany", !!jego);
        b.setAttribute("aria-pressed", String(wybor === b.dataset.l));
      });
      bloki.forEach((blok) => {
        const jego = kto && blok.dataset.l === kto;
        blok.classList.toggle("grafik__blok--wybrany", !!jego);
        gsap.to(blok, {
          autoAlpha: kto && !jego ? 0.22 : 1,
          scale: jego ? 1.04 : 1,
          duration: 0.45,
          overwrite: "auto",
        });
      });
    }

    przyciski.forEach((b) => {
      const l = b.dataset.l;
      b.addEventListener("pointerenter", () => { podglad = l; rysuj(); });
      b.addEventListener("pointerleave", () => { podglad = null; rysuj(); });
      b.addEventListener("focus", () => { podglad = l; rysuj(); });
      b.addEventListener("blur", () => { podglad = null; rysuj(); });
      b.addEventListener("click", () => {
        wybor = wybor === l ? null : l;
        podglad = null;
        rysuj();
      });
    });

    /* Czytanie w drugą stronę: najechanie na dyżur pokazuje, kto go ma —
       podświetleniem w kolumnie lekarzy i podpowiedzią przy samym dyżurze.
       Nazwisko nie mieści się w pigułce, więc pokazuje się dopiero na
       żądanie; jego pełna wersja i pełne godziny są w .grafik__vh. */
    const opis = document.createElement("div");
    opis.className = "grafik__opis";
    opis.setAttribute("aria-hidden", "true");
    opis.innerHTML = "<b></b><span></span>";
    grafik.appendChild(opis);
    const opisKto = opis.querySelector("b");
    const opisCzas = opis.querySelector("span");

    /* Palec nie ma „najechania”. `pointerenter` odpala się dopiero przy
       dotknięciu, a `pointerleave` — przy dotknięciu czegokolwiek innego,
       więc na telefonie podpowiedź migala i znikala w pół gestu. Na ekranie
       dotykowym dyżur otwiera się więc kliknięciem i tak samo zamyka. */
    const dotyk = matchMedia("(hover: none), (pointer: coarse)").matches;
    let otwarty = null;

    bloki.forEach((blok) => {
      const pelne = (blok.querySelector(".grafik__vh") || {}).textContent || "";
      const [kto, czas] = pelne.split(",");
      const pokaz = () => {
        podglad = blok.dataset.l;
        rysuj();
        opisKto.textContent = (kto || "").trim();
        opisCzas.textContent = (czas || "").trim();
        /* Podpowiedź staje nad KOLUMNĄ DNIA, nie nad samą pigułką.
           Wcześniej jechała za górną krawędzią dyżuru — a ta bywa wysoko
           w kolumnie, więc napis lądował daleko nad kalendarzem. Punkt
           odniesienia to cała kolumna razem z nazwą dnia, więc pigułka
           staje NAD nazwą, zamiast ją zasłaniać.

           (Osobno, w grafik.css: `.grafik` dostała `position: relative`.
           Bez tego te współrzędne — liczone względem `.grafik` — trafiały
           w zupełnie inny układ odniesienia i podpowiedź lądowała kilkaset
           pikseli nad kalendarzem.) */
        const dzien = blok.closest(".grafik__dzien");
        const slup = dzien.querySelector(".grafik__slup");
        const r = dzien.getBoundingClientRect();
        const rs = slup.getBoundingClientRect();
        const g = grafik.getBoundingClientRect();
        const x = rs.left - g.left + rs.width / 2;
        const y = r.top - g.top - 8;
        gsap.set(opis, { x, y: y + 6, xPercent: -50, yPercent: -100 });
        gsap.to(opis, { autoAlpha: 1, y, duration: 0.3, overwrite: true });
      };
      const schowaj = () => {
        podglad = null;
        rysuj();
        gsap.to(opis, { autoAlpha: 0, duration: 0.25, overwrite: true });
      };

      if (dotyk) {
        blok.addEventListener("click", (e) => {
          e.stopPropagation();
          if (otwarty === blok) { otwarty = null; schowaj(); return; }
          otwarty = blok;
          pokaz();
        });
      } else {
        blok.addEventListener("pointerenter", pokaz);
        blok.addEventListener("pointerleave", schowaj);
      }
    });

    /* Dotknięcie poza dyżurem zamyka podpowiedź — inaczej zostawałaby na
       ekranie aż do trafienia palcem w kolejną pigułkę. */
    if (dotyk) {
      document.addEventListener("click", (e) => {
        if (!otwarty || e.target.closest(".grafik__blok")) return;
        otwarty = null;
        podglad = null;
        rysuj();
        gsap.to(opis, { autoAlpha: 0, duration: 0.25, overwrite: true });
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wybor) { wybor = null; podglad = null; rysuj(); }
    });

    /* ---------- cały dzień ---------- */
    if (!duzy) return;
    dni.forEach((dzien) => {
      const slup = dzien.querySelector(".grafik__slup");
      const nazwa = dzien.querySelector(".grafik__nazwa");
      const tlD = gsap.timeline({ paused: true, defaults: { duration: 0.45 } })
        .to(slup, { y: -8, scale: 1.015 }, 0)
        .to(nazwa, { color: "var(--brass)" }, 0);
      dzien.addEventListener("pointerenter", () => tlD.play());
      dzien.addEventListener("pointerleave", () => tlD.reverse());
    });
  }

  /** Park: kamienie i ścieżka między nimi.
   *
   *  Ścieżka NIE jest wpisana w znaczniki — powstaje z faktycznych pozycji
   *  kamieni. Inaczej przy każdej zmianie szerokości okna (albo długości
   *  akapitu) biegłaby obok nich zamiast przez nie. Przeliczenie jest
   *  podpięte pod `refreshInit` ScrollTriggera, czyli pod ten sam moment,
   *  w którym on sam mierzy stronę.
   *
   *  Kształt: prosty odcinek między kamieniami z zaokrąglonym zakrętem
   *  (kwadratowa krzywa Béziera w punkcie zwrotnym). Catmull-Rom przez
   *  wszystkie punkty próbowany i odrzucony — przy dwóch kamieniach obok
   *  siebie robił pętlę wychodzącą poza kolumnę. */
  function zbudujPark(park) {
    /* Wszystkie kafelki, nie tylko te z akapitami: ramki z listami zabiegów
       też stoją przy alejce i też trzeba je omijać. */
    const kamienie = gsap.utils.toArray(".park__kamien", park);
    const svg = park.querySelector(".park__sciezka");
    const warstwy = svg ? gsap.utils.toArray("path", svg) : [];
    const linia = svg && svg.querySelector(".park__linia");
    if (!linia || kamienie.length < 2) return;

    let znacznik = null;
    if (ma("MotionPathPlugin")) {
      znacznik = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      znacznik.setAttribute("r", 4);
      znacznik.setAttribute("fill", "var(--brass)");
      svg.appendChild(znacznik);
    }

    function przelicz() {
      const r = park.getBoundingClientRect();
      const W = Math.round(r.width);
      const H = Math.round(r.height);
      if (!W || !H) return;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      const szer = parseFloat(getComputedStyle(park).getPropertyValue("--alejka")) || 40;
      const luz = szer / 2 + 14;      // pół szerokości alejki plus oddech

      /* Alejka biegnie KORYTARZEM MIĘDZY kolumnami, nie przez środki
         kafelków. Prowadzenie jej przez środki wyglądało dobrze na szkicu,
         ale w rzeczywistości przechodziła po tekście: zmierzone 94 punkty
         trasy w obrysie kafelków na jednej tylko podstronie. Teraz każdy
         kafelek daje punkt trasy przy swojej WEWNĘTRZNEJ krawędzi,
         odsunięty o pół szerokości alejki — więc alejka mija kafelek,
         zamiast go przecinać. */
      const punkty = kamienie.map((k) => {
        const kr = k.getBoundingClientRect();
        const srodekKafelka = kr.left + kr.width / 2 - r.left;
        const poLewej = srodekKafelka < W / 2;
        const x = poLewej
          ? kr.right - r.left + luz
          : kr.left - r.left - luz;
        return {
          x: gsap.utils.clamp(luz, W - luz, x),
          y: kr.top - r.top + kr.height / 2,
        };
      }).sort((a, b) => a.y - b.y);

      /* Krzywa przez punkty: wyjście w dół, wejście z góry, zakręt na
         wysokości między nimi. Catmull-Rom przez wszystkie punkty
         próbowany i odrzucony — przy dwóch kafelkach blisko siebie robił
         pętlę wychodzącą poza kolumnę. */
      let d = "";
      punkty.forEach((p, i) => {
        if (i === 0) { d = `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`; return; }
        const poprz = punkty[i - 1];
        const ys = (poprz.y + p.y) / 2;
        d += ` C ${poprz.x.toFixed(1)} ${ys.toFixed(1)}, ${p.x.toFixed(1)} ${ys.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      });
      warstwy.forEach((w) => w.setAttribute("d", d));
    }

    przelicz();
    ScrollTrigger.addEventListener("refreshInit", przelicz);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(przelicz);

    if (ma("DrawSVGPlugin")) {
      /* Alejka powstaje pod stopami: trawa wyprzedza nawierzchnię o ułamek,
         więc krawędź wyprzedza wypełnienie tak jak przy wydeptywanej ścieżce. */
      gsap.fromTo(warstwy, { drawSVG: "0% 0%" }, {
        drawSVG: "0% 100%", ease: "none", stagger: 0.04,
        scrollTrigger: { trigger: park, start: "top 78%", end: "bottom 72%", scrub: 0.6 },
      });
    }
    if (znacznik) {
      gsap.to(znacznik, {
        ease: "none",
        motionPath: { path: linia, align: linia, alignOrigin: [0.5, 0.5] },
        scrollTrigger: { trigger: park, start: "top 78%", end: "bottom 72%", scrub: 0.6 },
      });
    }

    /* Kafelek wchodzi z tej strony, po której leży. */
    kamienie.forEach((k, i) => {
      gsap.from(k, {
        autoAlpha: 0,
        y: 18,
        duration: 0.8,
        scrollTrigger: { trigger: k, start: "top 88%", once: true },
      });
    });
  }

  /** Ścieżka oferty: rysowana kreska, przystanki i przejście w bok.
   *
   *  Gest poziomy (kółko w bok, przesunięcie palcem) prowadzi do sąsiedniej
   *  podstrony. To DODATEK, nie jedyne wyjście — te same przejścia mają
   *  przyciski „poprzedni/następny przystanek" i same przystanki, więc bez
   *  gestu ani bez JS nic nie ginie. Dlatego gest nie blokuje zdarzenia:
   *  pionowe przewijanie strony zostaje nietknięte. */
  function zbudujTrase(trasa) {
    const linia = trasa.querySelector(".trasa__linia path");
    const stopy = gsap.utils.toArray(".trasa__stop", trasa);

    if (linia && ma("DrawSVGPlugin")) {
      gsap.fromTo(linia, { drawSVG: "0% 0%" }, {
        drawSVG: "0% 100%", ease: "none",
        scrollTrigger: { trigger: trasa, start: "top 88%", end: "center 65%", scrub: 0.5 },
      });
    }
    gsap.from(stopy, {
      autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.07,
      scrollTrigger: { trigger: trasa, start: "top 85%", once: true },
    });

    /* Przystanek, na którym stoimy, pulsuje raz przy wejściu — to jedyny
       sposób, żeby na sześciu identycznych kropkach zauważyć swoją. */
    const tu = trasa.querySelector(".trasa__stop--tu .trasa__kropka");
    if (tu) {
      gsap.fromTo(tu, { scale: 0.6 }, {
        scale: 1, duration: 0.9, ease: "elastic.out(1, 0.5)",
        scrollTrigger: { trigger: trasa, start: "top 85%", once: true },
      });
    }

    const poprz = trasa.querySelector('[rel="prev"]');
    const nast = trasa.querySelector('[rel="next"]');

    /* Strzałki przy krawędziach ekranu. Trasa stoi na górze strony, więc
       w połowie czytania pacjent już jej nie widzi i nie wie, że sąsiednie
       zabiegi są na wyciągnięcie ręki. Strzałki są przypięte do kadru
       (position: fixed), czyli jadą razem z przewijaniem, a najechanie
       wysuwa nazwę zabiegu, do którego prowadzą — żeby klik nie był
       skokiem w ciemno. Na wąskim ekranie ich nie ma: zabierałyby pas
       treści, a trasa u góry i tak jest o kciuk stąd. */
    const zrobStrzalke = (odnosnik, strona) => {
      if (!odnosnik) return null;
      const el = document.createElement("a");
      el.className = "skok skok--" + strona;
      el.href = odnosnik.getAttribute("href");
      const nazwa = odnosnik.querySelector("span").lastChild.textContent.trim();
      el.setAttribute("aria-label", (strona === "lewo" ? "Poprzednia oferta: " : "Następna oferta: ") + nazwa);
      const znak = strona === "lewo" ? "M10 3 L5 8 L10 13" : "M6 3 L11 8 L6 13";
      el.innerHTML =
        '<span class="skok__kolo"><svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path d="' + znak + '" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg></span>' +
        '<span class="skok__nazwa"><small>' + (strona === "lewo" ? "Poprzednia" : "Następna") + '</small>' + nazwa + '</span>';
      document.body.appendChild(el);

      const etykieta = el.querySelector(".skok__nazwa");
      gsap.set(etykieta, { autoAlpha: 0, x: strona === "lewo" ? -10 : 10 });
      const tl = gsap.timeline({ paused: true, defaults: { duration: 0.35 } })
        .to(etykieta, { autoAlpha: 1, x: 0 }, 0)
        .to(el.querySelector(".skok__kolo"), { backgroundColor: "var(--deep)", color: "var(--paper)", scale: 1.08 }, 0);
      el.addEventListener("pointerenter", () => tl.play());
      el.addEventListener("pointerleave", () => tl.reverse());
      el.addEventListener("focus", () => tl.play());
      el.addEventListener("blur", () => tl.reverse());
      el.addEventListener("click", (e) => {
        e.preventDefault();
        idz(odnosnik, strona === "lewo" ? -1 : 1);
      });
      return el;
    };

    let jedzie = false;
    const idz = (odnosnik, kierunek) => {
      if (jedzie || !odnosnik) return;
      jedzie = true;
      /* Strona odjeżdża w stronę gestu — przejście mówi, w którą stronę
         idziemy po ofercie. */
      gsap.to("#smooth-content", {
        xPercent: kierunek * -4,
        autoAlpha: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => { location.href = odnosnik.getAttribute("href"); },
      });
    };

    if (duzyEkran()) {
      const strzalki = [zrobStrzalke(poprz, "lewo"), zrobStrzalke(nast, "prawo")].filter(Boolean);
      /* Wejście dopiero po zjechaniu z góry: na pierwszym ekranie trasa
         jest widoczna i strzałki byłyby powtórzeniem. */
      gsap.set(strzalki, { autoAlpha: 0, scale: 0.9 });
      ScrollTrigger.create({
        start: "top -200",
        end: "max",
        onToggle: (self) => gsap.to(strzalki, {
          autoAlpha: self.isActive ? 1 : 0,
          scale: self.isActive ? 1 : 0.9,
          duration: 0.4,
        }),
      });
    }

    if (!ma("Observer")) return;

    Observer.create({
      target: window,
      type: "wheel,touch",
      lockAxis: true,
      tolerance: 90,
      /* wheelSpeed: -1 sprowadza kółko i palec do jednego kierunku.
         Bez tego jedno i drugie znaczy co innego: przesunięcie palca
         w lewo przesuwa treść w lewo (czyli „dalej"), a kółko w bok
         o dodatnie deltaX to przewijanie w prawo — Observer melduje je
         jako przeciwne strony i trasa szła raz w tę, raz w tamtą. */
      wheelSpeed: -1,
      onLeft: () => idz(nast, 1),    // gest „dalej po trasie"
      onRight: () => idz(poprz, -1),
    });
  }

  /** Porównanie przed / po: górny kadr jest przycinany zmienną --x,
   *  uchwyt tę zmienną ustawia. Przeciąganie idzie przez Draggable
   *  (rozdziela klik od gestu i sam ogarnia pointer capture), klawiatura
   *  przez strzałki — to jest suwak, więc ma zachowywać się jak suwak.
   *
   *  Przycinamy clip-path, a nie szerokość: zmiana szerokości przelicza
   *  układ na każdej klatce i przy trzech parach zdjęć widać zacinanie. */
  function zbudujPorownanie(figura) {
    const kadr = figura.querySelector(".porownanie__kadr");
    const uchwyt = figura.querySelector(".porownanie__uchwyt");
    if (!kadr || !uchwyt) return;

    const ustaw = (proc) => {
      const p = gsap.utils.clamp(0, 100, proc);
      gsap.set(kadr, { "--x": p + "%" });
      uchwyt.setAttribute("aria-valuenow", Math.round(p));
      return p;
    };

    if (ma("Draggable")) {
      Draggable.create(uchwyt, {
        type: "x",
        cursor: "ew-resize",
        trigger: kadr,          // chwytać można cały kadr, nie tylko łapkę
        onPress() { gsap.killTweensOf(kadr); },
        onDrag() {
          const r = kadr.getBoundingClientRect();
          ustaw(((this.pointerX - r.left) / r.width) * 100);
          /* Uchwyt jedzie zmienną --x, więc własne przesunięcie
             Draggable trzeba wyzerować — inaczej dodaje się drugi raz. */
          gsap.set(uchwyt, { x: 0 });
        },
      });
    }

    /* Klawiatura: strzałki po 4%, Home/End na krańce. */
    uchwyt.addEventListener("keydown", (e) => {
      const teraz = Number(uchwyt.getAttribute("aria-valuenow")) || 50;
      let cel = null;
      if (e.key === "ArrowLeft") cel = teraz - 4;
      if (e.key === "ArrowRight") cel = teraz + 4;
      if (e.key === "Home") cel = 0;
      if (e.key === "End") cel = 100;
      if (cel === null) return;
      e.preventDefault();
      gsap.to(kadr, {
        "--x": gsap.utils.clamp(0, 100, cel) + "%",
        duration: 0.25,
        ease: "power2.out",
        onUpdate: () => uchwyt.setAttribute("aria-valuenow", Math.round(gsap.getProperty(kadr, "--x"))),
      });
    });

    /* Wejście: suwak sam pokazuje, że da się go ruszyć — przejeżdża raz
       przez kadr i wraca na środek. Bez tego nikt nie wie, że to suwak. */
    gsap.fromTo(kadr, { "--x": "50%" }, {
      keyframes: [
        { "--x": "86%", duration: 0.9, ease: "power2.inOut" },
        { "--x": "18%", duration: 1.1, ease: "power2.inOut" },
        { "--x": "50%", duration: 0.9, ease: "power2.inOut" },
      ],
      scrollTrigger: { trigger: figura, start: "top 72%", once: true },
    });
  }

  /** Półka: sześć grzbietów, z których wysuwa się opis.
   *
   *  Wysokość opisu mierzymy raz i zapisujemy, zamiast tweenować
   *  `height: "auto"` przy każdym najechaniu — pomiar w trakcie ruchu
   *  to wymuszony reflow na każdej klatce, a przy sześciu wierszach
   *  widać to jako zacinanie. */
  function zbudujPolke(polka) {
    const ksiazki = gsap.utils.toArray(".polka__ksiazka", polka);

    /* Wejście: książki stają na półce po kolei.
       Bez ruchu w poziomie — stan wyjściowy `x: 40` jest przecież
       nakładany od razu przy tworzeniu tweenu, więc na telefonie sześć
       wierszy stało 40 px za prawą krawędzią i przeglądarka rozciągała
       układ z 390 do 410 px, zmniejszając całą stronę. Pion nie ma tego
       problemu, bo dokument i tak przewija się w pionie. */
    gsap.from(ksiazki, {
      autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.08,
      scrollTrigger: { trigger: polka, start: "top 82%", once: true },
    });

    ksiazki.forEach((ksiazka) => {
      const grzbiet = ksiazka.querySelector(".polka__grzbiet");
      const opis = ksiazka.querySelector(".polka__opis");
      const tresc = opis ? opis.firstElementChild : null;
      const nazwa = ksiazka.querySelector(".polka__nazwa");
      const znak = ksiazka.querySelector(".polka__znak");
      const nr = ksiazka.querySelector(".polka__nr");
      if (!grzbiet) return;

      /* „Wysunięcie książki" robi treść wiersza, nie cały wiersz.
         Przesuwanie całego .polka__grzbiet wypychało go poza kolumnę
         (i poza ekran telefonu); przesunięcie numeru i treści daje ten
         sam gest, a wiersz zostaje w swoich granicach. */
      const tl = gsap.timeline({ paused: true, defaults: { duration: 0.5 } })
        .to([nr, ksiazka.querySelector(".polka__tresc")], { x: 14 }, 0)
        .to(nazwa, { color: "var(--brass)" }, 0);
      if (znak) tl.to(znak, { autoAlpha: 1, borderColor: "var(--brass)", color: "var(--brass)" }, 0);
      if (nr) tl.to(nr, { color: "var(--deep)" }, 0);
      if (opis && tresc) {
        /* offsetHeight liczony raz, przy budowie — potem tylko odtwarzany. */
        const docelowa = tresc.offsetHeight;
        tl.to(opis, { height: docelowa, duration: 0.55, ease: "power2.out" }, 0);
        /* Stan wyjściowy jawnie, potem `to` — nie `from`.
           Z `from` w spauzowanej osi czasu opis otwierał się PUSTY: przy
           powtórnym przejściu matchMedia drugi `from` zapamiętywał jako
           wartość docelową to, co pierwszy już ustawił (autoAlpha 0), więc
           tween szedł z zera do zera. To jest błąd nr 2 z listy
           gsap.com/resources/st-mistakes — dwa `from` na tej samej
           właściwości tego samego elementu. */
        gsap.set(tresc, { autoAlpha: 0, y: 8 });
        tl.to(tresc, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.08);
        /* Zmiana szerokości okna zmienia łamanie opisu, więc pomiar
           trzeba powtórzyć — inaczej opis zostaje przycięty. */
        ScrollTrigger.addEventListener("refreshInit", () => {
          if (tl.progress() === 0) {
            gsap.set(opis, { height: "auto" });
            const nowa = opis.offsetHeight;
            gsap.set(opis, { height: 0 });
            tl.getChildren().forEach((t) => {
              if (t.targets()[0] === opis) t.vars.height = nowa;
            });
            tl.invalidate();
          }
        });
      }
      /* Krawędź grzbietu grubieje — pseudoelementu GSAP nie ruszy, więc
         robi to zmienna CSS ustawiana tweenem na samym grzbiecie. */
      tl.to(grzbiet, { "--grzbiet": 1, duration: 0.5 }, 0);

      const otworz = () => tl.play();
      const zamknij = () => tl.reverse();
      grzbiet.addEventListener("pointerenter", otworz);
      grzbiet.addEventListener("pointerleave", zamknij);
      grzbiet.addEventListener("focus", otworz);
      grzbiet.addEventListener("blur", zamknij);
    });
  }
  /** Czy jest miejsce na elementy przy krawędziach kadru. */
  function duzyEkran() { return matchMedia("(min-width: 62rem)").matches; }

  /** Dźwięk kliknięcia.
   *
   *  Sam wygląd kursora robi CSS (jeden `cursor: url(...)` z wektorem
   *  strzałki — patrz ruch.css). Skryptowy „follower" z pierścieniem
   *  jeżdżącym za myszą został wycofany: dublował to, co przeglądarka i
   *  tak rysuje za darmo, wymagał ukrycia systemowego kursora i przy
   *  szybkim ruchu myszy zawsze był o klatkę z tyłu.
   *
   *  Dźwięk generujemy w przeglądarce (WebAudio) zamiast wozić plik:
   *  jedno niskie uderzenie, 150 Hz schodzące do 90. Wysokie „klik" przy
   *  każdym kliknięciu męczy po minucie; niskie „tok" czyta się jak
   *  domknięcie, nie jak alarm. */
  function dzwiekKlikniecia() {
    let audio = null;
    /* AudioContext wolno stworzyć dopiero przy geście użytkownika —
       inaczej przeglądarka i tak go uśpi. Kliknięcie jest gestem. */
    /* Dźwięk tylko wtedy, gdy pod kursorem naprawdę coś jest do kliknięcia.
       „Tok" przy kliknięciu w pusty akapit brzmi jak awaria, nie jak
       potwierdzenie. */
    const KLIKALNE = 'a, button, [role="button"], summary, .karuzela__karta, .karuzela__scena, .grafik__osoba-btn, .zabiegi > li, .wybor__karta, .polka__grzbiet, .porownanie__uchwyt';
    addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      if (!e.target.closest || !e.target.closest(KLIKALNE)) return;
      try {
        if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === "suspended") audio.resume();
        const t = audio.currentTime;

        const ton = audio.createOscillator();
        ton.type = "sine";
        ton.frequency.setValueAtTime(150, t);
        ton.frequency.exponentialRampToValueAtTime(90, t + 0.09);

        /* Krótkie stuknięcie daje dźwiękowi krawędź — sam sinus przy tej
           wysokości brzmi jak buczenie, a nie jak kliknięcie. */
        const stuk = audio.createOscillator();
        stuk.type = "triangle";
        stuk.frequency.setValueAtTime(320, t);

        const gTon = audio.createGain();
        gTon.gain.setValueAtTime(0.0001, t);
        gTon.gain.exponentialRampToValueAtTime(0.08, t + 0.005);
        gTon.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);

        const gStuk = audio.createGain();
        gStuk.gain.setValueAtTime(0.0001, t);
        gStuk.gain.exponentialRampToValueAtTime(0.03, t + 0.003);
        gStuk.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

        ton.connect(gTon).connect(audio.destination);
        stuk.connect(gStuk).connect(audio.destination);
        ton.start(t); ton.stop(t + 0.16);
        stuk.start(t); stuk.stop(t + 0.05);
      } catch (err) {
        /* Brak WebAudio albo odmowa przeglądarki: strona działa dalej,
           tylko cicho. Dźwięk nie może być warunkiem klikania. */
      }
    }, { passive: true });
  }

})();
