# Prompty — Ząbek

Jeden plik = jeden prompt. Otwierasz, zaznaczasz wszystko, kopiujesz,
wklejasz do generatora. Nic nie dopisujesz.

## Dlaczego każdy prompt jest tak długi

Generator nie pamięta poprzedniego obrazu. Żeby Ząbek wyglądał wszędzie tak
samo, opis postaci i stylu jest w każdym pliku **powtórzony dosłownie, znak
w znak** — różni się wyłącznie akapit `SCENE`. Nie skracaj tych bloków:
to one trzymają postać razem.

Prompty nie wymieniają żadnej marki — opisują cechy stylu (grube zaokrąglone
bryły, duża głowa, krótkie kończyny, płaskie wypełnienia, dwoje oczu-kropek).
Opis cech daje powtarzalny wynik, nazwa marki daje loterię.

| Plik z promptem | Proporcje | Gotowy obraz zapisz jako |
|---|---|---|
| `01-arkusz-postaci-zabek.txt` | 16:9 | `arkusz-postaci.png` |
| `02-zabek-wita-kolko-przy-naglowku-sekcji.txt` | 1:1 | `zabek-wita.png` |
| `03-krok-1-wiek-okolo-trzech-lat.txt` | 1:1 | `krok-1.png` |
| `04-krok-2-wybierz-dobry-dzien.txt` | 1:1 | `krok-2.png` |
| `05-krok-3-nie-mow-nie-boj-sie.txt` | 1:1 | `krok-3.png` |
| `06-krok-4-pierwsza-wizyta-to-zwiedzanie.txt` | 1:1 | `krok-4.png` |
| `07-krok-5-wez-szczoteczke.txt` | 1:1 | `krok-5.png` |
| `08-przewodnik-powitanie.txt` | 1:1 | `przewodnik-wita.png` |
| `09-przewodnik-wskazuje-w-dol.txt` | 1:1 | `przewodnik-dalej.png` |
| `10-przewodnik-z-telefonem.txt` | 1:1 | `przewodnik-telefon.png` |
| `11-przewodnik-pod-drzewem.txt` | 16:9 | `przewodnik-drzewo.png` |

## Ile tej maskotki

Rysunek ma pokazać to, co mówi tekst obok — i nic ponadto. Dlatego sceny są
celowo ubogie: nie ma miarek wzrostu, słońc ani foteli dentystycznych dostawianych
po to, żeby coś się działo. Pozę niesie sama postać; rekwizyt pojawia się tylko
tam, gdzie naprawdę coś znaczy — lusterko i szczoteczka, bo o nich jest tekst.

Maskotka występuje **w jednym miejscu serwisu**: w sekcji dla rodzica na
`dobre-rady.html`. Reszta strony zostaje spokojna. Jeśli po obejrzeniu grafik
uznasz, że chcesz jej więcej, są do tego prompty `08`–`11` — ale to świadoma
decyzja, nie domyślny krok.

## Kolejność

Zacznij od `01` — arkusz postaci. Zobaczysz na nim pięć ujęć naraz, więc od razu
widać, czy postać trzyma się kupy. Jeśli generator przyjmuje obraz referencyjny,
podawaj wynik z `01` przy kolejnych — będzie jeszcze równiej.

Pliki `08`–`11` to osobna decyzja: Ząbek jako przewodnik po **całej** witrynie.
Obejrzyj najpierw `02`–`07` i dopiero potem zdecyduj — reszta serwisu jest
spokojna i maskotka wszędzie może to rozbić. Te cztery mają mieć **przezroczyste
tło** (PNG), żeby dało się je położyć na zielonych i kremowych sekcjach.

## Jeśli coś wyjdzie nie tak

| Objaw | Co dopisać na końcu prompta |
|---|---|
| postać ma palce | `The hands are simple mittens with no separate fingers.` |
| pojawiły się obrysy | `Absolutely no outlines or contour lines around any shape.` |
| ząb wygląda jak kły | `The crown is a wide rounded molar, not a pointed fang.` |
| kolory uciekły | `Do not use any color outside the listed palette, especially no bright green.` |
| za dużo szczegółów | `Reduce every element to its simplest rounded shape.` |

## Paleta — nie zmieniaj jej

| Rola | Hex |
|---|---|
| korpus zęba, tło jasne | `#FBFAF5` |
| głęboka zieleń (fartuch, oczy) | `#1A3631` |
| mosiądz (kołnierz, guzik) | `#8A6F39` |
| szałwia (cienie) | `#AEBFAE` |
| róż (policzki) | `#D8A9A0` |
| krem (tło grafik) | `#F6F5EF` |

## Gdy pliki będą gotowe

Wrzuć je do `img/zabek/` pod nazwami z tabeli. Miejsca w kodzie są gotowe —
kafelki kroków mają atrybut `data-rysunek`, a dopóki pliku nie ma, kafelek
pokazuje sam numer i nic nie wygląda na zepsute. Powiedz słowo, podepnę je
i sprawdzę na obu szerokościach.
