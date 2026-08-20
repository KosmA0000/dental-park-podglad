# SEO — co zrobione, co zablokowane, co czeka na decyzję

Dotyczy nowej wersji witryny w katalogu `park/`.
Podstawa: pakiet `SEO dental park/dentalpark-seo` (9 plików) + audyt uzupełniający
wykonany na nowej wersji 20.08.2026.

---

## 1. Wykonane

### Faza 1 — fundament techniczny

| Zadanie | Co zrobiono |
|---|---|
| 1.2 canonical | `<link rel="canonical">` z `https://www.dentalpark.kie.pl/…` na 12 podstronach |
| 1.4 robots.txt | `park/robots.txt` — dostęp dla botów AI (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Applebot), deklaracja sitemapy |
| 1.5 sitemap.xml | `park/sitemap.xml` — 12 adresów, bez szkieletów i bez 404 |
| 1.6 strona 404 | `park/404.html` — logotyp, menu, telefon jako link, drogi powrotu, `noindex` |
| 1.8 favicon | `favicon.svg` + `apple-touch-icon.png` |

Spełnione już przez przebudowę, bez zmian: **1.1** (viewport i responsywność — brak przepełnienia przy 390 px), **1.7** (`prototype.js` nie istnieje), **1.9** (przebudowa to wariant B z audytu).

### Faza 3 — on-page i dane strukturalne

| Zadanie | Co zrobiono |
|---|---|
| 3.1 tytuły i opisy | 11 podstron: tytuły **50–54 znaki** (było 101–144), opisy **135–148** (było 140–329). Usunięty `<meta name="Keywords">` |
| 3.2 nagłówki | Jeden H1 na stronę, hierarchia **bez przeskoków** na 16 podstronach. H1 z frazą główną i miastem (było „Oferta", „Implanty", „Dobre rady") |
| 3.3 schema | 17 bloków JSON-LD: `Dentist` + `WebSite` + `WebPage` na głównej, `Service` ×6, `BreadcrumbList` ×10 |
| 3.4 okruszki | `<nav class="crumb">` z listą — widoczny odpowiednik `BreadcrumbList` |
| 3.5 Open Graph | Pełny zestaw `og:*` + `twitter:card` + obraz 1200×630 (`img/og-dental-park-kielce.jpg`) |
| 3.6 alt | Spełnione przez przebudowę: 0 braków na 77 obrazach |
| 3.7 obrazy | **17,7 MB JPG → 2,2 MB WebP (−88%)**, 56 plików. `width` i `height` na wszystkich 77 obrazach |

### Faza 4 — treść

| Zadanie | Co zrobiono |
|---|---|
| 4.5 błędy językowe | „pozwala na rekonstrukcje" → „rekonstrukcję"; „Implant są wykonane" → „Implant to wykonana z tytanu śruba"; usunięty błędny przecinek |
| 4.6 linkowanie | Linki kontekstowe w zdaniach na 5 podstronach usług. Anchor „więcej »" wzbogacony o nazwę usługi dla czytnika ekranu i wyszukiwarki |

### Faza 5 — konwersja

| Zadanie | Co zrobiono |
|---|---|
| 5.2 pasek mobilny | Przyklejony pasek „Zadzwoń · Dojazd · Umów wizytę" poniżej 62 rem — tam, gdzie numer z paska nawigacji jest ukryty |
| 5.4 godziny | Godziny **gabinetu** (pon.–pt. 9:00–19:00, sob. 9:00–15:00) w stopce na 12 podstronach i w kafelku na stronie kontaktu |
| 5.6 formularz | Zgoda RODO z nazwą administratora, deklaracja czasu odpowiedzi, pola „Czego dotyczy wizyta" i „Preferowany termin" |
| 5.7 polityka prywatności | `polityka-prywatnosci.html` + link w stopce. Treść oparta na **pomiarze**: strona nie ustawia ciasteczek, nie ma analityki, jedyne połączenie zewnętrzne to fonty Google |
| NAP | Adres wg wzorca z `08-LOCAL-GBP`: „ul. Jana i Jędrzeja Śniadeckich 7, 25-366 Kielce" — identycznie w stopce, na stronie kontaktu i w danych strukturalnych |

---

## 2. Audyt uzupełniający — co znalazł tylko na nowej wersji

Stary audyt tego znaleźć nie mógł, bo dotyczyły rzeczy, których stara strona nie miała.

| Znalezione | Pomiar przed | Po naprawie |
|---|---|---|
| **Film hero blokował pierwsze malowanie.** `preload="auto"` ściągał 1,9 MB, zanim strona się narysowała — mimo że film rusza dopiero po geście | LCP **2804 ms** (telefon, próg 2500) | LCP **452 ms** (−84%) |
| **Przesunięcia układu z przebudowy DOM.** `usluga.js` dokładał klasy list i ramki kafelków po pierwszym malowaniu | CLS **0,062** | CLS **0** na wszystkich stronach |
| **H1 jako pojedyncze słowo** na 3 podstronach, na 2 zdanie z poprzedniego serwisu | „Oferta", „Implanty" | „Usługi stomatologiczne w Kielcach", „Implanty zębów w Kielcach" |
| **Anchor „więcej »"** powtórzony 12× bez informacji, dokąd prowadzi | 12× identyczny | + nazwa usługi dla czytnika i wyszukiwarki |

Zmierzone i **poprawne bez zmian** (to są mocne strony nowej wersji):

- **Pełne SSR.** Bez JavaScriptu: 798 słów na stronie głównej, 24 nagłówki, 26 obrazów, JSON-LD w źródle, **zero schowanych elementów**. Boty AI czytają treść bez renderowania.
- **CLS 0** na wszystkich stronach, **LCP 128–472 ms**.
- Alt na wszystkich 77 obrazach.
- Jeden H1 na podstronę, hierarchia bez przeskoków.
- Telefon jako `tel:` — 4–7 linków na podstronę.

### Wynik kontroli

`node _seo-kontrola.mjs` → **16 podstron, zero usterek**. Sprawdza: jeden H1, `lang=pl`,
długość tytułu i opisu, canonical, Open Graph, brak duplikatów tytułów i opisów,
`noindex` na szkieletach, brak szkieletów w mapie witryny, deklaracja sitemapy w robots.

---

## 3. Zablokowane brakiem danych — miejsce już zrobione

Trzy strony stoją gotowe strukturalnie. Mają `noindex`, nie ma ich w mapie witryny
i nie prowadzi do nich żaden link — **pusta strona w indeksie szkodzi bardziej niż jej brak**.
Wypełnienie polega na wklejeniu tekstu w gotowe sekcje.

### `cennik.html` — 12 sekcji
Największa pojedyncza luka biznesowa. Zapytanie „Dental Park Kielce cennik" jest
podpowiadane przez Google i prowadzi dziś do **innej firmy o tej samej nazwie**.

**Do zebrania:** widełki od–do dla każdej grupy zabiegów (diagnostyka, zachowawcza,
endodoncja, chirurgia, implantologia, protetyka, estetyczna, narkoza), data
aktualizacji cennika, nazwisko lekarza zatwierdzającego.

### `zespol.html` — 7 sekcji
Fundament E-E-A-T. Stomatologia to YMYL — Google stosuje tu najwyższy próg.

**Do zebrania dla każdego z 4 lekarzy:** numer PWZ, uczelnia i rok dyplomu, zakres
zabiegów, **nazwy** ukończonych kursów (dziś strona mówi „liczne kursy" i nie wymienia
ani jednego), dni przyjęć. Plus: marka mikroskopu, marka systemu implantologicznego
z okresem gwarancji.

### `opinie.html` — 5 sekcji
Warunek konieczny, żeby legalnie użyć `aggregateRating` w danych strukturalnych —
Google wymaga, żeby ocena była widoczna dla użytkownika na tej samej stronie.

**Do zebrania:** aktualna ocena i liczba opinii z datą odczytu, 3–4 pełne cytaty
z publicznych opinii Google (format: imię i pierwsza litera nazwiska).

### Rozbudowa 6 podstron usług
Nowa wersja jest **krótsza od starej**: narkoza 216 słów (stara 293), implanty 394
(stara 428). Brief celuje w 800–1500. Konspekty sekcja po sekcji: `07-BRIEFY-TRESCI.md`.

**Do zebrania:** przebieg zabiegów krok po kroku, czasy gojenia, przeciwwskazania,
zalecenia po zabiegu, odpowiedzi na pytania pacjentów z `06-SLOWA-KLUCZOWE.md`.

### Po wypełnieniu — trzy ruchy na stronę
1. Usunąć `<meta name="robots" content="noindex, follow">`.
2. Dopisać adres do `sitemap.xml`.
3. Dodać link w menu i w stopce.

---

## 4. Czeka na Twoją decyzję

| Sprawa | Dlaczego pytam |
|---|---|
| **H1 na stronie głównej** | Jest „Piękny i zdrowy uśmiech". Brief chce „Dentysta w Kielcach – gabinet stomatologiczny Dental Park". To nagłówek hero, nośnik całego pierwszego ekranu — podmiana to decyzja projektowa, nie techniczna. Fraza „dentysta Kielce" jest w tytule i w opisie meta |
| **NIP i REGON w stopce** | Audyt (§8 konwersji) wskazuje je jako sygnał wiarygodności. W polityce prywatności ich nie ma — administrator jest identyfikowalny przez nazwę, adres, telefon i e-mail. Podaj numery, dopiszę |
| **Adresy URL nowej wersji** | Nowe nazwy plików (`implanty.html`) różnią się od zaindeksowanych (`/uslugi-stomatologiczne/implanty-zebow.html`). Przygotowałem komplet przekierowań 301 w `przekierowania-301.txt`. Alternatywa: zachować stare adresy w nowej wersji |
| **Oryginalne pliki JPG** | 19 MB nieużywanych plików źródłowych zostało w `park/img/`. Nic ich nie wskazuje. Można je usunąć przed wdrożeniem albo zostawić jako kopię |
| **GA4** | Bez identyfikatora usługi (`G-XXXXXXX`) nie da się wstawić pomiaru. To zadanie 0.1 i **bloker całego planu** — bez niego nie widać efektu żadnej pozostałej pracy |

---

## 5. Poza kodem — do zrobienia po stronie gabinetu

Kolejność i uzasadnienia: `02-PLAN-DZIALANIA.md`.

**Serwer/hosting** (`przekierowania-301.txt`): jeden skok 301 na `https://www.dentalpark.kie.pl`,
`error_page 404 /404.html`, nagłówki bezpieczeństwa, `Cache-Control` bez `no-store`.

**Wizytówka Google (faza 2)** — audyt nazywa to kanałem o najwyższym zwrocie w całym
projekcie: usunąć dwie zduplikowane wizytówki, uzupełnić kategorie i usługi, dodać
20–30 zdjęć, uruchomić stały proces zbierania opinii (cel: przerwa nigdy dłuższa niż
18 dni).

**Katalogi (faza 6)**: przejąć profile w ZnanyLekarz (błędny kod pocztowy 25-365 zamiast
25-366), Booksy, Bing Places.

---

## 6. Bramki

```
node sprawdz.mjs --wszystkie   BRAMKA: przeszła          (wyjątki, konsola, 404, GSAP, telefon 390 px)
node _seo-kontrola.mjs         16 podstron, zero usterek  (metadane, schema, noindex, sitemap)
node _cwv.mjs                  LCP 128–472 ms, CLS 0      (pomiar na telefonie 390 px)
node _bezjs.mjs                zero schowanych elementów  (treść bez JavaScriptu)
node _hero.mjs                 HERO: ok                   (film, blokada, powrót)
node _karuzela.mjs             KARUZELA: ok
node _kar-akcja.mjs            AKCJE: wszystko dziala
node _lupa.mjs                 LUPA: ok
node _kursor.mjs               wszedzie strzalka
node _szer3.mjs                brak przepełnienia na 390 px
```
