========================================================================
PROMPTY DO GRAFIK PARKU — instrukcja
========================================================================

CO TO JEST
Pięć plików tekstowych. Każdy zawiera gotowy prompt do wklejenia jeden
do jednego. Nic nie trzeba dopisywać ani sklejać.

KOLEJNOSC — to jest wazne
1. Wygeneruj najpierw 01-alejka.txt.
2. Przy KAZDYM kolejnym pliku (02–05) dolacz wygenerowana alejke jako
   obraz referencyjny i dopisz na koncu promptu jedno zdanie:

   Match the style, palette, brush texture and level of detail of the
   reference image exactly.

   Bez tego dostaniesz piec obrazkow w pieciu roznych stylach.

CZY OBRAZY MAJA BYC CIAGLE
Tak, i to jest w promptach zalatwione — ale inaczej, niz moglo sie
wydawac. Alejka (01) i trawa (02) sa KAFELKOWANE PIONOWO: gorna krawedz
pasuje do dolnej, wiec kolejna kopia jest doslownie kontynuacja
poprzedniej i alejka moze biec bez konca, po dowolnie dlugiej krzywej.
Jeden dlugi obraz calej alejki bylby bez sensu: krzywa jest inna na
kazdej podstronie (chirurgia ma 4 akapity, implanty 8) i inna na kazdej
szerokosci okna, wiec staly obraz i tak trzeba by rozciagac.
Cien lisci (05) kafelkuje sie w OBIE strony, bo pokrywa cala sekcje.
Kamienie (03) i liscie (04) to celowo elementy luzem — kazdy wycinam
osobno i puszczam z inna predkoscia przewijania. To one daja glebie.

JESLI GENERATOR NIE ZWROCI PRZEZROCZYSTOSCI
Poproś o jednolite tlo magenta #FF00FF zamiast przezroczystego i przyslij
tak jak jest. Wytne je do kanalu alfa lokalnie (ffmpeg, colorkey) —
jedna komenda na plik.

GDZIE WRZUCIC GOTOWE PLIKI
park/img/park/  (obok tego katalogu z promptami)
Nazwy plikow sa podane w naglowku kazdego promptu i musza sie zgadzac.
========================================================================
