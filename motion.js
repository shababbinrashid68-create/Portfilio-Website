window.__motion = true;
(function () {
  'use strict';

  const INTRO = true;

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

  function initIntro() {
    var isHome = !!document.querySelector('.hero');
    var seen = false;
    try {
      seen = sessionStorage.getItem('sbr-intro') !== null;
    } catch (e) {
      seen = false;
    }

    if (!INTRO || !isHome || seen || !docEl.classList.contains('motion')) {
      startHeroEntrance();
      return;
    }

    var loader = document.createElement('div');
    loader.className = 'intro-loader';
    loader.setAttribute('aria-hidden', 'true');

    var lettersHtml = 'SHABAB'.split('').map(function (ch, idx) {
      return '<span class="intro-char-mask"><span class="intro-char" style="--i:' + idx + '">' + ch + '</span></span>';
    }).join('');

    loader.innerHTML =
      '<div class="intro-top">' +
        '<span>Shabab Bin Rashid</span>' +
        '<span>Business Analyst, Dhaka</span>' +
      '</div>' +
      '<div class="intro-center">' + lettersHtml + '</div>' +
      '<div class="intro-bottom-wrap">' +
        '<div class="intro-bottom">' +
          '<span class="intro-loading-label">Loading portfolio</span>' +
          '<span class="intro-counter">000</span>' +
        '</div>' +
        '<div class="intro-track"><div class="intro-fill"></div></div>' +
      '</div>';

    document.body.insertBefore(loader, document.body.firstChild);
    docEl.style.overflow = 'hidden';

    var counterEl = loader.querySelector('.intro-counter');
    var fillEl = loader.querySelector('.intro-fill');
    var tEnter = null;
    var tExit = null;
    var tLeave = null;
    var tRemove = null;
    var rafId = null;
    var finishedToLeave = false;

    function setProgress(val) {
      var clamped = Math.max(0, Math.min(100, Math.round(val)));
      counterEl.textContent = String(clamped).padStart(3, '0');
      fillEl.style.transform = 'scaleX(' + (clamped / 100) + ')';
    }

    function cleanupSkipListeners() {
      window.removeEventListener('click', skipIntro);
      window.removeEventListener('keydown', skipIntro);
      window.removeEventListener('wheel', skipIntro);
    }

    function triggerLeave() {
      if (finishedToLeave) return;
      finishedToLeave = true;
      cleanupSkipListeners();
      if (tEnter) clearTimeout(tEnter);
      if (tExit) clearTimeout(tExit);
      if (tLeave) clearTimeout(tLeave);
      if (rafId) cancelAnimationFrame(rafId);

      setProgress(100);
      try {
        sessionStorage.setItem('sbr-intro', '1');
      } catch (e) {}

      docEl.style.overflow = '';
      loader.classList.add('is-exit');
      loader.classList.add('is-leaving');
      startHeroEntrance();

      tRemove = setTimeout(function () {
        try {
          sessionStorage.setItem('sbr-intro', '1');
        } catch (e) {}
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 900);
    }

    function skipIntro() {
      triggerLeave();
    }

    window.addEventListener('click', skipIntro, { passive: true });
    window.addEventListener('keydown', skipIntro);
    window.addEventListener('wheel', skipIntro, { passive: true });

    var startTime = performance.now();

    tEnter = setTimeout(function () {
      loader.classList.add('is-enter');
    }, 120);

    function tick(now) {
      if (finishedToLeave) return;
      var elapsed = now - startTime;
      if (elapsed >= 300) {
        var p = Math.min(1, (elapsed - 300) / 900);
        var eased = 1 - Math.pow(1 - p, 3);
        setProgress(eased * 100);
      }
      if (elapsed < 1200) {
        rafId = requestAnimationFrame(tick);
      } else {
        setProgress(100);
      }
    }
    rafId = requestAnimationFrame(tick);

    tExit = setTimeout(function () {
      loader.classList.add('is-exit');
    }, 1350);

    tLeave = setTimeout(function () {
      triggerLeave();
    }, 1600);
  }

  function initHeroCrosshair() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (!matchMedia('(min-width: 54rem)').matches) return;

    var ch = document.createElement('div');
    ch.className = 'hero-crosshair';
    ch.setAttribute('aria-hidden', 'true');
    ch.innerHTML =
      '<div class="hero-ch-v"></div>' +
      '<div class="hero-ch-h"><span class="hero-ch-label">Business Analyst</span></div>' +
      '<div class="hero-ch-follower">' +
        '<img src="shabab-bin-rashid.jpg" alt="" decoding="async">' +
        '<span class="hero-ch-caption">Data-driven</span>' +
      '</div>';

    hero.appendChild(ch);

    var vLine = ch.querySelector('.hero-ch-v');
    var hLine = ch.querySelector('.hero-ch-h');
    var follower = ch.querySelector('.hero-ch-follower');
    var pendingRaf = null;
    var lastX = 0;
    var lastY = 0;
    var overInteractive = false;

    function updatePositions() {
      pendingRaf = null;
      vLine.style.transform = 'translateX(' + lastX + 'px)';
      hLine.style.transform = 'translateY(' + lastY + 'px)';
      follower.style.transform = 'translate(' + lastX + 'px, ' + lastY + 'px) translate(-50%, -62%)';
      follower.classList.toggle('is-hidden', overInteractive);
    }

    hero.addEventListener('pointerenter', function (e) {
      if (!heroStarted) return;
      if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      if (!matchMedia('(min-width: 54rem)').matches) return;
      var rect = hero.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      overInteractive = !!(e.target && e.target.closest && e.target.closest('a, button'));
      updatePositions();
      ch.classList.add('is-visible');
    });

    hero.addEventListener('pointermove', function (e) {
      if (!heroStarted) return;
      if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      if (!matchMedia('(min-width: 54rem)').matches) {
        ch.classList.remove('is-visible');
        return;
      }
      var rect = hero.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      overInteractive = !!(e.target && e.target.closest && e.target.closest('a, button'));
      if (!ch.classList.contains('is-visible')) {
        ch.classList.add('is-visible');
      }
      if (!pendingRaf) {
        pendingRaf = requestAnimationFrame(updatePositions);
      }
    });

    hero.addEventListener('pointerleave', function () {
      ch.classList.remove('is-visible');
    });
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
    initHeroCrosshair();
    initIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
