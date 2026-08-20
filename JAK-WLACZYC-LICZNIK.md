# Jak włączyć licznik wejść

Licznik jest już wbudowany w stronę i przetestowany. **Nie działa tylko
dlatego, że brakuje jednego numeru**, którego nie mogłem założyć za Ciebie —
wymaga zalogowania na Twoje konto Google.

Całość zajmuje około dziesięciu minut. Nic nie trzeba instalować.

---

## Krok 1 — załóż darmowe konto Analytics

1. Wejdź na **analytics.google.com** i zaloguj się swoim kontem Google.
2. Kliknij **Rozpocznij pomiar** (albo *Administracja → Utwórz → Usługa*).
3. **Nazwa usługi:** wpisz `Dental Park`.
4. **Strefa czasowa:** Polska. **Waluta:** złoty polski.
5. Odpowiedz na pytania o branżę i wielkość firmy — wybierz *Opieka zdrowotna*
   i najmniejszą wielkość. To tylko podpowiedzi, nic z tego nie wynika.
6. Zaakceptuj warunki.

## Krok 2 — wskaż stronę

1. Na pytanie „Zacznij zbierać dane" wybierz **Sieć** (nie aplikację).
2. **Adres URL witryny:** `www.dentalpark.kie.pl`
3. **Nazwa strumienia:** `Strona główna`
4. Kliknij **Utwórz strumień**.

## Krok 3 — skopiuj numer

Po utworzeniu strumienia zobaczysz **identyfikator pomiaru**. Wygląda tak:

```
G-ABCD123XYZ
```

Skopiuj go. To jedyna rzecz, której potrzebuję.

## Krok 4 — wklej go do jednego pliku

Otwórz plik **`analityka.js`** w zwykłym notatniku. W siódmej linijce od góry
znajdziesz:

```js
const POMIAR_ID = "";
```

Wklej numer między cudzysłowy:

```js
const POMIAR_ID = "G-ABCD123XYZ";
```

Zapisz plik. **To wszystko** — nic więcej nie trzeba zmieniać.

---

## Skąd wiadomo, że działa

Wejdź na stronę. Na dole pojawi się **pasek z pytaniem o zgodę** — to znak,
że licznik jest włączony. Kliknij „Zgadzam się".

Potem w Analytics wejdź w **Raporty → Czas rzeczywisty**. Powinieneś zobaczyć
siebie jako jednego użytkownika, w ciągu kilkunastu sekund.

Jeśli po minucie nadal jest pusto:

| Objaw | Przyczyna |
|---|---|
| Nie ma paska zgody | Numer wklejony w złe miejsce albo z literówką. Musi zaczynać się od `G-` |
| Pasek jest, ale w Analytics pusto | Odśwież stronę i kliknij „Zgadzam się" jeszcze raz |
| Wcześniej kliknąłeś „Nie licz mnie" | Twoja przeglądarka pamięta tę odpowiedź przez rok. Otwórz stronę w oknie prywatnym |

---

## Co zobaczysz w raportach

Zwykłe odsłony liczą się same. Dodatkowo mierzone są trzy rzeczy, które
w gabinecie faktycznie coś znaczą:

| Nazwa zdarzenia | Co oznacza |
|---|---|
| `klik_telefon` | Ktoś kliknął w numer telefonu. **To jest najważniejsza liczba na całej stronie** — dla gabinetu telefon jest główną drogą rejestracji |
| `klik_dojazd` | Ktoś otworzył mapę z trasą do gabinetu |
| `formularz_wyslany` | Ktoś wysłał formularz kontaktowy |

Przy każdym kliknięciu w telefon zapisuje się też **miejsce**, z którego padł:
pasek na górze, stopka, pasek na telefonie, kafelki kontaktu albo strona
zespołu. Dzięki temu po miesiącu widać, gdzie ten numer naprawdę działa.

Znajdziesz je w **Raporty → Zaangażowanie → Zdarzenia**.

---

## Dwie rzeczy warte wiedzy

**Pasek zgody nie jest ozdobą.** Analytics zapisuje ciasteczka, a na to trzeba
mieć zgodę, zanim się je zapisze — nie po fakcie. Dlatego skrypt Google
wczytuje się dopiero po kliknięciu „Zgadzam się". Sprawdziłem to pomiarem:
przed zgodą strona nie wysyła do Google ani jednego zapytania.

**Dopóki numer nie jest wpisany, strona zachowuje się jak dziś** — żadnego
paska, żadnych ciasteczek, żadnego kontaktu z Google. Można ją spokojnie
pokazywać klientowi przed włączeniem licznika.

---

## Warto zrobić przy okazji

W tym samym miejscu co Analytics załóż też **Google Search Console**
(search.google.com/search-console). Analytics mówi, ilu ludzi weszło.
Search Console mówi, **czego szukali w Google** — a tego nie pokaże żadne
inne narzędzie.

Weryfikacja przez rekord DNS obejmuje od razu wszystkie warianty adresu.
Audyt wskazuje oba te konta jako pierwsze zadanie całego planu: bez nich
nie widać, czy pozostała praca przynosi efekt.
