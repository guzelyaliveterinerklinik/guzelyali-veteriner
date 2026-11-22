/* Güzelyalı Veteriner Kliniği: small enhancements. The site works without this file. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var lang = doc.lang === 'en' ? 'en' : 'tr';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var T = {
    tr: {
      open: function (close) { return 'Şu an açık · ' + close + '’a kadar'; },
      opensToday: function (t) { return 'Şu an kapalı · Bugün ' + t + '’da açılıyor'; },
      opensOn: function (day, t) { return 'Şu an kapalı · ' + day + ' ' + t + '’da açılıyor'; },
      today: 'Bugün',
      days: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
      menuOpen: 'Menüyü aç', menuClose: 'Menüyü kapat',
      greet: 'Merhaba, randevu almak istiyorum.',
      name: 'Adım', pet: 'Hayvanım', svc: 'Hizmet', note: 'Not',
    },
    en: {
      open: function (close) { return 'Open now · until ' + close; },
      opensToday: function (t) { return 'Closed now · opens today at ' + t; },
      opensOn: function (day, t) { return 'Closed now · opens ' + day + ' at ' + t; },
      today: 'Today',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      menuOpen: 'Open menu', menuClose: 'Close menu',
      greet: 'Hello, I would like to book an appointment.',
      name: 'Name', pet: 'Pet', svc: 'Service', note: 'Note',
    },
  }[lang];

  /* ---------- open now (clinic time, Europe/Istanbul) ---------- */
  // Opening hours come from the page (<html data-hours>), set in the admin panel: one entry per day, Sunday first.
  var HOURS = [];
  try { HOURS = JSON.parse(doc.getAttribute('data-hours') || '[]'); } catch (e) {}
  var toMin = function (t) { var p = String(t).split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1] || 0, 10); };
  function clinicNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; };
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      return { day: day, min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function updateOpen() {
    var now = clinicNow();
    var today = HOURS[now.day];
    var isOpen = !!today && now.min >= toMin(today[0]) && now.min < toMin(today[1]);
    var text = '';
    if (isOpen) text = T.open(today[1]);
    else if (today && now.min < toMin(today[0])) text = T.opensToday(today[0]);
    else {
      for (var k = 1; k <= 7; k++) {
        var d = (now.day + k) % 7;
        if (HOURS[d]) { text = T.opensOn(T.days[d], HOURS[d][0]); break; }
      }
    }
    if (!HOURS.length) return;
    document.querySelectorAll('[data-open-now]').forEach(function (el) {
      var span = el.querySelector('span');
      if (span) span.textContent = text;
      el.classList.toggle('is-open', isOpen);
      el.classList.toggle('is-closed', !isOpen);
    });
    document.querySelectorAll('table[data-hours] tr').forEach(function (tr) {
      var today = String(now.day) === tr.getAttribute('data-day');
      tr.classList.toggle('is-today', today);
      var th = tr.querySelector('th');
      if (today) th.setAttribute('data-today', T.today); else th.removeAttribute('data-today');
    });
  }
  updateOpen();
  setInterval(updateOpen, 60000);

  /* ---------- hero kitten: pupils follow the pointer, eyes blink ----------
     Each pupil is the render's own pupil, clipped and moved inside its iris; the catch-light stays put.
     A blink fades the closed-eye render in over the eyes for a moment. */
  (function () {
    var box = document.querySelector('[data-cat]');
    if (!box) return;
    var svg = box.querySelector('.cat__eyes');
    var lids = box.querySelector('.cat__lids');
    var VB_W = svg.viewBox.baseVal.width;
    var MAX = 13; // image pixels a pupil may travel from rest
    var pupils = Array.prototype.map.call(box.querySelectorAll('[data-pupil]'), function (el) {
      return { el: el, cx: +el.dataset.cx, cy: +el.dataset.cy, px: +el.dataset.px, py: +el.dataset.py, x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1 };
    });
    var raf = 0, lastMove = 0;
    // The moving pupils reuse whichever file the photo loaded, so no second download.
    var photo = box.querySelector(".cat__photo");
    function usePhoto() { box.querySelectorAll("[data-pupil-img]").forEach(function (im) { im.setAttribute("href", photo.currentSrc || photo.src); }); }
    if (photo.complete && photo.naturalWidth) usePhoto(); else photo.addEventListener("load", usePhoto, { once: true });

    function aim(clientX, clientY, strength) {
      var r = box.getBoundingClientRect();
      var k = r.width / VB_W;
      pupils.forEach(function (p) {
        var dx = clientX - (r.left + p.cx * k), dy = clientY - (r.top + p.cy * k);
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var reach = Math.min(1, d / (r.width * 0.28)) * (strength == null ? 1 : strength);
        p.tx = (dx / d) * reach * MAX;
        p.ty = (dy / d) * reach * MAX * 0.9;
        p.ts = 1 + 0.07 * (1 - Math.min(1, d / (r.width * 0.7))); // pupils widen as the pointer comes close
      });
      if (!raf) raf = requestAnimationFrame(step);
    }
    function step() {
      var moving = false;
      pupils.forEach(function (p) {
        p.x += (p.tx - p.x) * 0.2;
        p.y += (p.ty - p.y) * 0.2;
        p.s += (p.ts - p.s) * 0.12;
        if (Math.abs(p.tx - p.x) > 0.04 || Math.abs(p.ty - p.y) > 0.04 || Math.abs(p.ts - p.s) > 0.001) moving = true;
        p.el.setAttribute('transform',
          'translate(' + (p.x + p.px).toFixed(2) + ' ' + (p.y + p.py).toFixed(2) + ') scale(' + p.s.toFixed(4) + ') translate(' + (-p.px) + ' ' + (-p.py) + ')');
      });
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    function rest() { pupils.forEach(function (p) { p.tx = 0; p.ty = 0; p.ts = 1; }); if (!raf) raf = requestAnimationFrame(step); }

    window.addEventListener('pointermove', function (ev) { lastMove = Date.now(); aim(ev.clientX, ev.clientY); }, { passive: true });
    window.addEventListener('pointerdown', function (ev) { lastMove = Date.now(); aim(ev.clientX, ev.clientY); }, { passive: true });
    document.documentElement.addEventListener('mouseleave', rest);

    // Blink every few seconds, now and then twice.
    function blink() {
      if (!lids || document.hidden) return;
      lids.classList.add('is-shut');
      setTimeout(function () { lids.classList.remove('is-shut'); }, 140);
    }
    function scheduleBlink() {
      setTimeout(function () {
        blink();
        if (Math.random() < 0.25) setTimeout(blink, 300);
        scheduleBlink();
      }, 2600 + Math.random() * 3800);
    }
    if (!reduce) scheduleBlink();
    box.addEventListener('click', blink);

    // With no pointer (phones, or a still mouse) the kitten glances around.
    if (!reduce) {
      setInterval(function () {
        if (Date.now() - lastMove < 4000 || document.hidden) return;
        var r = box.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        if (Math.random() < 0.3) { rest(); return; }
        var a = Math.random() * Math.PI * 2;
        aim(r.left + r.width * 0.5 + Math.cos(a) * r.width, r.top + r.height * 0.6 + Math.sin(a) * r.width * 0.5, 0.8);
      }, 2400);
    }
  })();

  /* ---------- header shadow + mobile menu ---------- */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  var btn = document.querySelector('[data-menu]');
  var mnav = document.getElementById('mnav');
  if (btn && mnav) {
    var label = btn.querySelector('.sr-only');
    var setMenu = function (open) {
      btn.setAttribute('aria-expanded', String(open));
      mnav.hidden = !open;
      if (label) label.textContent = open ? T.menuClose : T.menuOpen;
    };
    setMenu(false);
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1024) setMenu(false); });
  }

  /* ---------- reveal on scroll ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.sec-head, .svc-card, .review, .post-card, .value, .split__media, .split__text, .svc, .visit > *, .channel, .form, .hours-card, .faq');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) return; // already on screen: leave it visible
      el.classList.add('reveal');
      var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sibs, 3) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- services index: highlight the section in view ---------- */
  var spies = document.querySelectorAll('[data-spy]');
  if (spies.length && 'IntersectionObserver' in window) {
    var map = {};
    spies.forEach(function (a) { map[a.getAttribute('data-spy')] = a; });
    var spyIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        spies.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        var a = map[en.target.id];
        if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    document.querySelectorAll('.svc[id]').forEach(function (s) { spyIo.observe(s); });
  }

  /* ---------- map: load Google Maps only when asked ---------- */
  document.querySelectorAll('[data-map]').forEach(function (box) {
    var b = box.querySelector('[data-map-load]');
    if (!b) return;
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-src');
      f.title = box.getAttribute('data-title');
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.setAttribute('allowfullscreen', '');
      box.appendChild(f);
      var cover = box.querySelector('.map__cover');
      if (cover) cover.remove();
      f.focus();
    });
  });

  /* ---------- appointment form: compose a WhatsApp message ---------- */
  var form = document.querySelector('[data-wa-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var err = document.getElementById('f-name-err');
      if (!name.value.trim()) {
        name.setAttribute('aria-invalid', 'true');
        name.setAttribute('aria-describedby', 'f-name-err');
        if (err) err.hidden = false;
        name.focus();
        return;
      }
      name.removeAttribute('aria-invalid');
      if (err) err.hidden = true;
      var lines = [
        T.greet,
        T.name + ': ' + name.value.trim(),
        T.pet + ': ' + form.elements.pet.value,
        T.svc + ': ' + form.elements.service.value,
      ];
      var note = form.elements.note.value.trim();
      if (note) lines.push(T.note + ': ' + note);
      var url = form.getAttribute('action') + '?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
    });
    form.elements.name.addEventListener('input', function () {
      if (this.value.trim()) {
        this.removeAttribute('aria-invalid');
        var err = document.getElementById('f-name-err');
        if (err) err.hidden = true;
      }
    });
  }
})();
