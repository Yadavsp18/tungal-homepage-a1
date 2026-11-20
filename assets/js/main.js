/* ==========================================================================
   Tungal homepage interactions. Vanilla JS + GSAP/ScrollTrigger where it helps.
   Every module guards for missing markup and respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';
  var D = window.TUNGAL || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------- photos */
  function injectPhotos() {
    var photos = D.photos || {};
    $$('[data-photo]').forEach(function (slot, i) {
      var p = photos[slot.getAttribute('data-photo')];
      if (!p || !p.src) return;
      var img = new Image();
      img.className = 'photo';
      img.alt = p.alt || '';
      img.decoding = 'async';
      if (!slot.closest('.hero__slide.is-active')) img.loading = 'lazy';
      if (p.srcset) img.srcset = p.srcset;
      if (p.sizes) img.sizes = p.sizes;
      img.onerror = function () { img.remove(); };
      img.src = p.src;
      slot.appendChild(img);
      var mono = slot.querySelector('.director__monogram');
      if (mono) img.onload = function () { mono.hidden = true; };
    });
  }

  /* ---------------------------------------------------------- header */
  function header() {
    var el = $('[data-header]');
    if (!el) return;
    var last = window.scrollY;
    var hero = $('[data-hero]');
    function onScroll() {
      var y = window.scrollY;
      var threshold = hero ? Math.max(40, hero.offsetHeight - 120) : 40;
      el.classList.toggle('is-solid', y > threshold);
      var goingDown = y > last + 4, goingUp = y < last - 4;
      if (goingDown && y > 400 && !document.body.classList.contains('menu-open')) el.classList.add('is-hidden');
      if (goingUp || y < 200) el.classList.remove('is-hidden');
      last = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('focusin', function () { el.classList.remove('is-hidden'); });
    onScroll();

    // current-section highlight
    var links = $$('.primary-nav a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var a = map[e.target.id];
          if (!a) return;
          if (e.isIntersecting) {
            links.forEach(function (l) { l.removeAttribute('aria-current'); });
            a.setAttribute('aria-current', 'true');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  /* ---------------------------------------------------------- mobile menu */
  function mobileMenu() {
    var btn = $('[data-menu-toggle]'), menu = $('[data-mobile-menu]');
    if (!btn || !menu) return;
    var label = btn.querySelector('.sr-only');
    function focusables() { return [btn].concat($$('a, button', menu)); }
    function open() {
      menu.hidden = false;
      document.body.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
      label.textContent = 'Close menu';
      if (hasGsap && !reduced) {
        gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: .3 });
        gsap.fromTo($$('.mobile-menu__links li, .mobile-menu .btn', menu), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .05, ease: 'power3.out' });
      }
      var first = $('a', menu); if (first) first.focus();
    }
    function close(returnFocus) {
      menu.hidden = true;
      document.body.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
      label.textContent = 'Open menu';
      if (returnFocus !== false) btn.focus();
    }
    btn.addEventListener('click', function () { btn.getAttribute('aria-expanded') === 'true' ? close() : open(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        var f = focusables(), i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1180 && !menu.hidden) close(false); });
  }

  /* ---------------------------------------------------------- hero carousel */
  function hero() {
    var root = $('[data-hero]');
    if (!root) return;
    var slides = $$('[data-slide]', root), dots = $$('[data-goto]', root), pauseBtn = $('[data-hero-pause]', root);
    var idx = 0, timer = null, interval = D.heroInterval || 7000, paused = reduced, hovering = false;
    root.style.setProperty('--hero-interval', interval + 'ms');
    if (reduced) { root.classList.add('no-autoplay', 'is-paused'); pauseBtn.setAttribute('aria-label', 'Play slideshow'); }

    function go(n, user) {
      n = (n + slides.length) % slides.length;
      slides[idx].classList.remove('is-active');
      slides[idx].setAttribute('aria-hidden', 'true');
      dots[idx].classList.remove('is-active'); dots[idx].removeAttribute('aria-current');
      idx = n;
      // restart progress bar animation
      var bar = dots[idx].querySelector('.hero__dot-bar span');
      bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)'; void bar.offsetWidth; bar.style.transition = ''; bar.style.transform = '';
      slides[idx].classList.add('is-active');
      slides[idx].removeAttribute('aria-hidden');
      dots[idx].classList.add('is-active'); dots[idx].setAttribute('aria-current', 'true');
      $$('img[loading="lazy"]', slides[idx]).forEach(function (img) { img.loading = 'eager'; });
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (paused || hovering || document.hidden) return;
      timer = setTimeout(function () { go(idx + 1); }, interval);
    }
    function setPaused(p) {
      paused = p;
      root.classList.toggle('is-paused', p);
      pauseBtn.setAttribute('aria-label', p ? 'Play slideshow' : 'Pause slideshow');
      if (!p) go(idx); else clearTimeout(timer);
    }
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i, true); }); });
    pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(idx + 1, true); }
      if (e.key === 'ArrowLeft') { go(idx - 1, true); }
    });
    root.addEventListener('focusin', function () { hovering = true; clearTimeout(timer); });
    root.addEventListener('focusout', function () { hovering = false; schedule(); });
    // touch swipe
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1), true);
      x0 = null;
    });
    document.addEventListener('visibilitychange', schedule);
    // stop autoplay when hero is off screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { hovering = !en[0].isIntersecting; schedule(); }).observe(root);
    }
    schedule();

    if (hasGsap && !reduced && window.ScrollTrigger) {
      gsap.to('.hero__slides', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  /* ---------------------------------------------------------- reveal on scroll */
  function reveals() {
    var items = $$('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (e, i) {
        e.target.style.transitionDelay = Math.min(i * 80, 400) + 'ms';
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------- legacy: seal, counters, divider */
  function legacy() {
    var counters = $$('[data-count]');
    function runCounter(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (reduced || !hasGsap) { el.textContent = target; return; }
      var o = { v: 0 };
      gsap.to(o, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { runCounter(e.target); io.unobserve(e.target); } });
      }, { threshold: .6 });
      counters.forEach(function (c) { io.observe(c); });
    }
    if (!hasGsap || reduced || !window.ScrollTrigger) return;
    var seal = $('[data-spin]');
    if (seal) gsap.fromTo(seal, { rotate: -25 }, { rotate: 25, ease: 'none', scrollTrigger: { trigger: '.legacy', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('[data-draw]').forEach(function (p) {
      var len = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: p.closest('section'), start: 'top 95%', end: 'top 40%', scrub: true } });
    });
    $$('.pathway__art > img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -3 }, { yPercent: 3, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------------------------------------------------------- campus tabs */
  function campusTabs() {
    var root = $('[data-tabs]');
    if (!root) return;
    var tabs = $$('[role="tab"]', root), indicator = $('.campus-tabs__indicator', root);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (on) {
          if (panel.hidden) {
            panel.hidden = false;
            if (!reduced) { panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering'); }
          }
        } else panel.hidden = true;
      });
      if (indicator) indicator.style.transform = 'translateX(' + (tabs.indexOf(tab) * 100) + '%)';
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n], true); }
      });
    });
    // programme chips deep-link into a campus
    $$('[data-campus-link]').forEach(function (a) {
      a.addEventListener('click', function () {
        var t = root.querySelector('[data-tab="' + a.getAttribute('data-campus-link') + '"]');
        if (t) select(t);
      });
    });
    var m = location.hash.match(/^#campus-(\w+)/);
    if (m) { var t = root.querySelector('[data-tab="' + m[1] + '"]'); if (t) { select(t); document.getElementById('campuses').scrollIntoView(); } }
  }

  /* ---------------------------------------------------------- accordion */
  function accordion() {
    var root = $('[data-accordion]');
    if (!root) return;
    var big = $('[data-why-num]');
    $$('button[aria-controls]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        $$('button[aria-controls]', root).forEach(function (b) {
          b.setAttribute('aria-expanded', 'false');
          document.getElementById(b.getAttribute('aria-controls')).hidden = true;
        });
        if (!open) {
          btn.setAttribute('aria-expanded', 'true');
          document.getElementById(btn.getAttribute('aria-controls')).hidden = false;
          if (big) {
            big.textContent = btn.getAttribute('data-index');
            if (hasGsap && !reduced) gsap.fromTo(big, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'power3.out' });
          }
        }
      });
    });
  }

  /* ---------------------------------------------------------- magnetic CTAs */
  function magnetic() {
    if (!finePointer || reduced || !hasGsap) return;
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .4, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: .4, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * .18);
        yTo((e.clientY - (r.top + r.height / 2)) * .3);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------------------------------------------------------- data-driven sections */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dataSections() {
    var ach = D.achievements || [];
    var box = $('[data-achievements]');
    if (box && ach.length) {
      box.innerHTML = ach.map(function (a) {
        return '<article class="award is-in"><span class="award__kicker">' + esc(a.kicker) + '</span>' +
          (a.value ? '<span class="award__value">' + esc(a.value) + '</span>' : '') +
          '<h3>' + esc(a.title) + '</h3><p>' + esc(a.text) + '</p></article>';
      }).join('');
    }
    var t = D.testimonials || [];
    var voices = $('[data-voices]');
    if (voices && t.length) {
      var card = voices.querySelector('.voices__card');
      card.outerHTML = '<div class="voices__quotes">' + t.map(function (q) {
        return '<figure class="quote-card"><blockquote><p>“' + esc(q.quote) + '”</p></blockquote><figcaption><strong>' + esc(q.name) + '</strong><br>' + esc(q.role) + '</figcaption></figure>';
      }).join('') + '</div>';
      var title = $('#voices-title'); if (title) title.innerHTML = 'What families <em>say about Tungal.</em>';
    }
    var lines = $('[data-contact-lines]');
    if (lines) lines.innerHTML = (D.contact || []).map(function (c) {
      return '<li>' + esc(c.label) + ': ' + (c.href ? '<a href="' + esc(c.href) + '">' + esc(c.value) + '</a>' : esc(c.value)) + '</li>';
    }).join('');
    var social = $('[data-social]');
    if (social) social.innerHTML = (D.social || []).map(function (s) {
      return '<li><a href="' + esc(s.href) + '" rel="noopener" target="_blank">' + esc(s.label) + '</a></li>';
    }).join('');
    var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------- enquiry form */
  function enquiry() {
    var form = $('[data-enquiry]');
    if (!form) return;
    var campus = $('[data-campus-select]', form), prog = $('[data-programme-select]', form);
    var hostelField = $('[data-hostel-field]', form), status = $('[data-form-status]', form);
    var P = D.programmes || {};

    function fillProgrammes() {
      var list = P[campus.value] || [];
      prog.innerHTML = '<option value="">' + (campus.value ? 'Select a programme' : 'Choose a campus first') + '</option>' +
        list.map(function (p) { return '<option value="' + esc(p.value) + '">' + esc(p.label) + '</option>'; }).join('');
      prog.disabled = !list.length;
      updateHostel();
    }
    function updateHostel() {
      var ok = (D.hostel && D.hostel[campus.value] || []).indexOf(prog.value) !== -1;
      hostelField.hidden = !ok;
      if (!ok) { var cb = $('input', hostelField); if (cb) cb.checked = false; }
    }
    campus.addEventListener('change', fillProgrammes);
    prog.addEventListener('change', updateHostel);

    // "Share your story" and campus chips can preselect the form
    $$('[data-campus-link]').forEach(function (a) {
      a.addEventListener('click', function () { campus.value = a.getAttribute('data-campus-link'); fillProgrammes(); });
    });

    var phone = $('#f-phone', form);
    phone.addEventListener('input', function () {
      var v = phone.value.replace(/\D/g, '');
      if (v.length > 10 && v.indexOf('91') === 0) v = v.slice(2);
      phone.value = v.slice(0, 10);
    });

    var rules = {
      'f-student': function (v) { return v.trim().length >= 2 || "Please enter the student's name."; },
      'f-parent': function (v) { return v.trim().length >= 2 || "Please enter the parent or guardian's name."; },
      'f-phone': function (v) { return /^[6-9]\d{9}$/.test(v) || 'Please enter a valid 10-digit mobile number.'; },
      'f-email': function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Please enter a valid email address.'; },
      'f-campus': function (v) { return !!v || 'Please choose a campus.'; },
      'f-programme': function (v) { return !!v || 'Please choose a programme.'; },
      'f-consent': function (v, el) { return el.checked || 'Please confirm we may contact you.'; }
    };
    function check(id) {
      var el = document.getElementById(id), err = document.getElementById(id + '-err');
      var r = rules[id](el.value, el);
      var bad = r !== true;
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) { err.textContent = r; err.hidden = false; el.setAttribute('aria-describedby', id + '-err'); }
      else { err.textContent = ''; err.hidden = true; el.removeAttribute('aria-describedby'); }
      return !bad;
    }
    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid')) check(id); });
      el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') check(id); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (id) { if (!check(id) && !firstBad) firstBad = document.getElementById(id); });
      if (firstBad) {
        status.className = 'enquiry__status is-error';
        status.textContent = 'Please check the highlighted fields.';
        firstBad.focus();
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      status.className = 'enquiry__status';
      status.textContent = 'Sending your enquiry…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r; })
        .then(function () {
          status.className = 'enquiry__status is-success';
          status.textContent = 'Thank you. Your enquiry has been sent, and the campus office will be in touch.';
          form.reset(); fillProgrammes();
        })
        .catch(function () {
          status.className = 'enquiry__status is-error';
          status.textContent = 'We could not send your enquiry just now. Please try again in a moment.';
        })
        .then(function () { btn.disabled = false; });
    });
    fillProgrammes();
  }


  /* ---------------------------------------------------------- v2: split-word headlines */
  function splitWords() {
    $$('.hero__title').forEach(function (title) {
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span'); w.className = 'w';
              var inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
              w.appendChild(inner); frag.appendChild(w);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      })(title);
    });
  }

  /* ---------------------------------------------------------- v2: marquee that reacts to scroll */
  function marquee() {
    var root = $('[data-marquee-root]'), track = $('[data-marquee]');
    if (!root || !track || reduced) return;
    if (!hasGsap) { track.classList.add('is-css'); return; }
    var x = 0, dir = 1, base = 60, boost = 0, hover = 0, visible = true, lastY = window.scrollY;
    var group = track.querySelector('.marquee__group');
    var gw = group.getBoundingClientRect().width;
    window.addEventListener('resize', function () { gw = group.getBoundingClientRect().width; });
    var skewTo = gsap.quickTo(track, 'skewX', { duration: .6, ease: 'power3' });
    var hoverTween = function (v) { gsap.to({ v: hover }, { v: v, duration: .5, onUpdate: function () { hover = this.targets()[0].v; } }); };
    root.addEventListener('pointerenter', function () { hoverTween(1); });
    root.addEventListener('pointerleave', function () { hoverTween(0); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(root);
    window.addEventListener('scroll', function () {
      var dy = window.scrollY - lastY; lastY = window.scrollY;
      if (Math.abs(dy) < 1 || Math.abs(dy) > 250) return;   // ignore jumps from anchor links
      dir = dy > 0 ? 1 : -1;
      boost = Math.min(boost + Math.abs(dy) * 6, 520);
      skewTo(gsap.utils.clamp(-6, 6, -dy * .12));
    }, { passive: true });
    gsap.ticker.add(function (t, dt) {
      if (!visible || !gw) return;
      boost *= Math.pow(.9, dt / 16.7);
      if (boost < 8) skewTo(0);
      x -= dir * (base + boost) * (1 - hover * .85) * dt / 1000;
      if (x <= -gw) x += gw; else if (x > 0) x -= gw;
      gsap.set(track, { x: x });
    });
  }

  /* ---------------------------------------------------------- v2: spotlight cards */
  function spotlight() {
    if (!finePointer) return;
    $$('[data-spotlight]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------------------------------------------------------- v2: scroll progress + image reveals */
  function progressAndReveals() {
    var bar = $('[data-scroll-progress]');
    if (bar) {
      var upd = function () { var h = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + Math.min(1, window.scrollY / Math.max(1, h)) + ')'; };
      window.addEventListener('scroll', upd, { passive: true }); upd();
    }
    var imgs = $$('.reveal-img');
    if (reduced || !('IntersectionObserver' in window)) { imgs.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: .2 });
    imgs.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------- v2: horizontal pinned gallery (desktop) */
  function pinnedGallery() {
    var pin = $('[data-gallery-pin]'), gal = $('[data-gallery]'), hint = $('[data-life-hint]');
    if (!pin || !gal || reduced || !hasGsap || !window.ScrollTrigger) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1025px)', function () {
      gal.classList.add('is-h'); pin.classList.add('is-pinned'); if (hint) hint.hidden = false;
      var dist = function () { return Math.max(0, gal.scrollWidth - window.innerWidth); };
      var tw = gsap.to(gal, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: pin, start: 'center center', end: function () { return '+=' + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 } });
      $$('.gallery__item .photo-img', gal).forEach(function (img) {
        gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.gallery__item'), containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () { gal.classList.remove('is-h'); pin.classList.remove('is-pinned'); gsap.set(gal, { clearProps: 'x' }); if (hint) hint.hidden = true; };
    });
  }

  /* ---------------------------------------------------------- floating UI */
  function floating() {
    var top = $('[data-to-top]'), ring = $('[data-progress]'), cta = $('[data-mobile-cta]');
    var hero = $('[data-hero]'), adm = $('#admissions');
    var C = 132, admVisible = false;
    if ('IntersectionObserver' in window && adm) {
      new IntersectionObserver(function (en) { admVisible = en[0].isIntersecting; tick(); }, { threshold: .05 }).observe(adm);
    }
    function tick() {
      var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      var past = y > (hero ? hero.offsetHeight * .8 : 600);
      if (top) top.classList.toggle('is-visible', past);
      if (ring) ring.style.strokeDashoffset = String(C - C * Math.min(1, y / Math.max(1, h)));
      if (cta) cta.classList.toggle('is-visible', past && !admVisible && !document.body.classList.contains('menu-open'));
    }
    window.addEventListener('scroll', tick, { passive: true });
    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var skip = $('.brand'); if (skip) skip.focus({ preventScroll: true });
    });
    tick();
  }

  splitWords();
  injectPhotos();
  header();
  mobileMenu();
  hero();
  reveals();
  legacy();
  campusTabs();
  accordion();
  magnetic();
  dataSections();
  enquiry();
  floating();
  marquee();
  spotlight();
  progressAndReveals();
  pinnedGallery();
})();
