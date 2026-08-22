/* ============================================================
   o-nas.js — kropki pod suwakami sekcji „O nas".
   Plansze przewijają się palcem i tak; kropki dokładają skok
   i pokazują, na której planszy się stoi. Bez tego pliku
   sekcja zostaje sprawna, tylko bez kropek.
   ============================================================ */
(function () {
  'use strict';

  document.querySelectorAll('[data-suwak]').forEach(function (suwak) {
    var tor = suwak.querySelector('.on-tor');
    var kropki = suwak.querySelector('.on-kropki');
    if (!tor || !kropki) return;

    var slajdy = Array.prototype.slice.call(tor.children);
    if (slajdy.length < 2) return;

    // Kropki powstają dopiero tutaj: bez JS byłyby przyciskami,
    // które niczego nie robią.
    var przyciski = slajdy.map(function (slajd, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Plansza ' + (i + 1) + ' z ' + slajdy.length);
      b.addEventListener('click', function () {
        tor.scrollTo({ left: slajd.offsetLeft - tor.offsetLeft, behavior: 'smooth' });
      });
      kropki.appendChild(b);
      return b;
    });

    function zaznacz() {
      var srodek = tor.scrollLeft + tor.clientWidth / 2;
      var aktywny = 0;
      slajdy.forEach(function (slajd, i) {
        var lewo = slajd.offsetLeft - tor.offsetLeft;
        if (srodek >= lewo) aktywny = i;
      });
      przyciski.forEach(function (b, i) {
        b.setAttribute('aria-current', i === aktywny ? 'true' : 'false');
      });
    }

    var czeka = false;
    tor.addEventListener('scroll', function () {
      if (czeka) return;
      czeka = true;
      requestAnimationFrame(function () { czeka = false; zaznacz(); });
    }, { passive: true });

    zaznacz();
  });
})();
