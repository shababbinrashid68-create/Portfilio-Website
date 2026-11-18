window.__motion = true;
(function () {
  'use strict';

  var docEl = document.documentElement;
  if (!docEl.classList.contains('motion')) return;

  var heroStarted = false;
  function startHeroEntrance() {
    if (heroStarted) return;
    heroStarted = true;
    var hero = document.querySelector('.hero');
    if (hero) {
      requestAnimationFrame(function () {
        hero.classList.add('is-in');
      });
    }
  }

  function initLineReveals() {
    var csHead = document.querySelector('.cs-head');
    if (csHead) {
      requestAnimationFrame(function () {
        csHead.classList.add('is-in');
      });
    }

    var h2s = document.querySelectorAll('main h2');
    var io = 'IntersectionObserver' in window
      ? new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' })
      : null;

    h2s.forEach(function (h2) {
      if (h2.children.length > 0) return;
      var text = h2.textContent;
      h2.textContent = '';
      var outer = document.createElement('span');
      outer.className = 'reveal-line';
      var inner = document.createElement('span');
      inner.textContent = text;
      outer.appendChild(inner);
      h2.appendChild(outer);

      if (io) {
        io.observe(h2);
      } else {
        h2.classList.add('is-in');
      }
    });
  }

  function init() {
    initLineReveals();
    startHeroEntrance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
