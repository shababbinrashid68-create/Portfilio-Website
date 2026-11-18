window.__motion = true;
(function () {
  'use strict';

  const INTRO = true;

  var docEl = document.documentElement;
  var hasMotion = docEl.classList.contains('motion');

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

  var lenis = null;

  function lockScroll() {
    if (lenis) {
      lenis.stop();
    } else {
      docEl.style.overflow = 'hidden';
    }
  }

  function unlockScroll() {
    if (lenis) {
      lenis.start();
    } else {
      docEl.style.overflow = '';
    }
  }

  function headerOffset() {
    var header = document.querySelector('.site-header');
    var h = header ? header.getBoundingClientRect().height : 0;
    return -(h + 16);
  }

  function focusTarget(el) {
    if (!el) return;
    if (!el.matches('a[href], button, input, select, textarea, [tabindex]')) {
      el.setAttribute('tabindex', '-1');
    }
    el.focus({ preventScroll: true });
  }

  function initLenis() {
    if (!docEl.classList.contains('motion') || typeof window.Lenis !== 'function') return;

    lenis = new Lenis({ lerp: 0.085 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;

    // Nested horizontal scrollers keep native trackpad scrolling.
    document.querySelectorAll('.mrr-table-wrap, .sql-block').forEach(function (el) {
      el.setAttribute('data-lenis-prevent', '');
    });
    document.querySelectorAll('main *').forEach(function (el) {
      var ox = getComputedStyle(el).overflowX;
      if (ox === 'auto' || ox === 'scroll') {
        el.setAttribute('data-lenis-prevent', '');
      }
    });

    // Same-page anchor links, the skip link and "Back to top".
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;

      var url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;

      var skip = document.querySelector('.skip-link');

      if (url.hash === '#top' || a.hasAttribute('data-back-to-top')) {
        e.preventDefault();
        lenis.scrollTo(0, {
          duration: 1.6,
          onComplete: function () { focusTarget(skip); }
        });
        history.pushState(null, '', url.hash);
        return;
      }

      var target;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (err) { target = null; }
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target, {
        offset: headerOffset(),
        onComplete: function () { focusTarget(target); }
      });
      history.pushState(null, '', url.hash);
    });

    // Arriving from another page with a hash: land below the header.
    if (location.hash && location.hash.length > 1) {
      var initial = null;
      try { initial = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (err) {}
      if (initial) {
        requestAnimationFrame(function () {
          lenis.scrollTo(initial, { offset: headerOffset(), immediate: true, force: true });
        });
      }
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
    lockScroll();

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

      unlockScroll();
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
    var hLabel = ch.querySelector('.hero-ch-label');
    var follower = ch.querySelector('.hero-ch-follower');
    var textBlocks = hero.querySelectorAll('.hero-name, .hero-line, .hero-sub, .hero-intro, .link-row, a, button');
    var pendingRaf = null;
    var lastX = 0;
    var lastY = 0;
    var hideFollower = false;
    var hideLabel = false;

    function checkTextProximity(clientX, clientY) {
      var fw = follower.offsetWidth || 140;
      var fh = follower.offsetHeight || 120;
      var pad = 28;
      var fLeft = clientX - fw * 0.5 - pad;
      var fRight = clientX + fw * 0.5 + pad;
      var fTop = clientY - fh * 0.62 - pad;
      var fBottom = clientY + fh * 0.38 + pad;

      var nearText = false;
      var labelOverText = false;

      for (var i = 0; i < textBlocks.length; i++) {
        var r = textBlocks[i].getBoundingClientRect();
        if (fRight >= r.left && fLeft <= r.right && fBottom >= r.top && fTop <= r.bottom) {
          nearText = true;
        }
        if (clientY >= r.top - 12 && clientY <= r.bottom + 24) {
          labelOverText = true;
        }
      }
      hideFollower = nearText;
      hideLabel = labelOverText;
    }

    function updatePositions() {
      pendingRaf = null;
      vLine.style.transform = 'translateX(' + lastX + 'px)';
      hLine.style.transform = 'translateY(' + lastY + 'px)';
      follower.style.transform = 'translate(' + lastX + 'px, ' + lastY + 'px) translate(-50%, -62%)';
      follower.classList.toggle('is-hidden', hideFollower);
      if (hLabel) {
        hLabel.classList.toggle('is-hidden', hideLabel);
      }
    }

    hero.addEventListener('pointerenter', function (e) {
      if (!heroStarted) return;
      if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      if (!matchMedia('(min-width: 54rem)').matches) return;
      var rect = hero.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      checkTextProximity(e.clientX, e.clientY);
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
      checkTextProximity(e.clientX, e.clientY);
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

  function initMobileMenu() {
    var header = document.querySelector('.site-header');
    var nav = document.querySelector('.site-nav');
    if (!header || !nav) return;

    docEl.classList.add('menu-js');

    var btn = document.createElement('button');
    btn.className = 'menu-btn';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'site-menu');
    btn.innerHTML =
      '<span class="sr-only">Menu</span>' +
      '<span class="menu-bar" aria-hidden="true"></span>' +
      '<span class="menu-bar" aria-hidden="true"></span>';

    header.appendChild(btn);

    var menu = document.createElement('nav');
    menu.id = 'site-menu';
    menu.setAttribute('aria-label', 'Mobile');
    var ulClone = nav.querySelector('ul').cloneNode(true);
    menu.appendChild(ulClone);
    document.body.appendChild(menu);

    var mainEl = document.querySelector('main');
    var footerEl = document.querySelector('.site-footer');
    var csNavEl = document.querySelector('.cs-nav');
    var skipEl = document.querySelector('.skip-link');
    var siteTitleEl = header.querySelector('.site-title');
    var menuLinks = Array.prototype.slice.call(menu.querySelectorAll('a'));

    function setInert(state) {
      [mainEl, footerEl, csNavEl, skipEl, siteTitleEl].forEach(function (el) {
        if (!el) return;
        if (state) {
          el.setAttribute('inert', '');
          el.inert = true;
        } else {
          el.removeAttribute('inert');
          el.inert = false;
        }
      });
    }

    function openMenu() {
      btn.setAttribute('aria-expanded', 'true');
      menu.classList.add('is-open');
      lockScroll();
      setInert(true);
      if (menuLinks[0]) {
        menuLinks[0].focus();
      }
    }

    function closeMenu(returnFocus) {
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      unlockScroll();
      setInert(false);
      if (returnFocus !== false) {
        btn.focus();
      }
    }

    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    menuLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu(false);
      });
    });

    window.addEventListener('keydown', function (e) {
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu(true);
        return;
      }
      if (e.key === 'Tab') {
        var focusables = [btn].concat(menuLinks);
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    var mqDesktop = matchMedia('(min-width: 42rem)');
    if (mqDesktop.addEventListener) {
      mqDesktop.addEventListener('change', function (e) {
        if (e.matches) closeMenu(false);
      });
    }
  }

  function init() {
    initLenis();
    initMobileMenu();
    if (!hasMotion) return;
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
