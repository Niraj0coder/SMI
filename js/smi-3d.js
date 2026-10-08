/* Sri Maruthi Industries: hero interaction, 3D tilt, 3D scroll reveal, floating gears.
   Built to stay smooth on modest laptops: event delegation, rAF throttling, no layout reads on scroll,
   animations paused off-screen, and an automatic "lite" mode on slow devices. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} }

  /* ---------- lite mode (weak devices) ---------- */
  var weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
             (navigator.connection && navigator.connection.saveData) || store('smiLite') === '1';
  function goLite() { if (doc.classList.contains('smi-lite')) return; doc.classList.add('smi-lite'); store('smiLite', '1'); }
  if (weak || reduce) goLite();
  var lite = function () { return doc.classList.contains('smi-lite'); };

  /* measure real frame rate for ~1.6s after load; if the device cannot keep ~40fps, drop to lite mode */
  if (!lite()) {
    var frames = 0, t0 = 0, probeDone = false;
    window.addEventListener('load', function () {
      setTimeout(function () {
        function tick(t) {
          if (!t0) t0 = t; frames++;
          if (t - t0 < 1600) requestAnimationFrame(tick);
          else if (!probeDone) { probeDone = true; var fps = frames / ((t - t0) / 1000); if (fps < 38) goLite(); }
        }
        requestAnimationFrame(tick);
      }, 600);
    });
  }

  /* ---------- hero: rotating words ---------- */
  var rotor = document.querySelector('.smi-rotor'), hero = document.querySelector('.smi-hero'), heroVisible = true;
  if (rotor && !reduce) {
    var words = rotor.getAttribute('data-words').split('|'), wi = 0;
    setInterval(function () {
      if (!heroVisible || document.hidden) return;
      rotor.classList.add('out');
      setTimeout(function () { wi = (wi + 1) % words.length; rotor.textContent = words[wi]; rotor.classList.remove('out'); }, 380);
    }, 2800);
  }

  /* ---------- pause animations that are off-screen or in a hidden tab ---------- */
  if ('IntersectionObserver' in window) {
    var pauser = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        e.target.classList.toggle('smi-paused', !e.isIntersecting);
        if (e.target === hero) heroVisible = e.isIntersecting;
      });
    }, { rootMargin: '80px' });
    if (hero) pauser.observe(hero);
    $$('.smi-marquee').forEach(function (m) { pauser.observe(m); });
  }
  document.addEventListener('visibilitychange', function () { doc.classList.toggle('smi-paused', document.hidden); });

  /* ---------- hero: mouse depth (rAF throttled, transforms only) ---------- */
  var art = document.getElementById('heroArt');
  if (art && hero && fine && !reduce) {
    var svg = art.querySelector('svg'), layers = $$('.layer', art), depth = [8, 16, 26, 40], mx = 0, my = 0, pending = false;
    hero.addEventListener('mousemove', function (e) {
      if (lite()) return;
      var r = hero.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5;
      if (pending) return; pending = true;
      requestAnimationFrame(function () {
        pending = false;
        svg.style.transform = 'rotateY(' + (mx * 14).toFixed(2) + 'deg) rotateX(' + (-my * 10).toFixed(2) + 'deg)';
        for (var i = 0; i < layers.length; i++) layers[i].style.transform = 'translate(' + (-mx * depth[i % 4]).toFixed(1) + 'px,' + (-my * depth[i % 4]).toFixed(1) + 'px)';
      });
    }, { passive: true });
    hero.addEventListener('mouseleave', function () { svg.style.transform = ''; layers.forEach(function (l) { l.style.transform = ''; }); });
  }

  /* ---------- 3D tilt: ONE delegated listener instead of one per card ---------- */
  var tiltSel = '.smi-card, .service-box.style1, .smi-person, .smi-dept, .smi-cert, .smi-logo, .smi-goal, .project-bx .dlab-media, .smi-counters .counter-style-5';
  if (fine && !reduce) {
    var cur = null, tx = 0, ty = 0, tPending = false;
    function apply() {
      tPending = false; if (!cur) return;
      var r = cur.getBoundingClientRect(), x = (tx - r.left) / r.width, y = (ty - r.top) / r.height;
      cur.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); cur.style.setProperty('--my', (y * 100).toFixed(0) + '%');
      cur.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 12).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 14).toFixed(2) + 'deg) translateY(-8px) translateZ(12px)';
    }
    function release(el) { if (!el) return; el.classList.remove('tilting'); el.style.transform = ''; }
    document.addEventListener('mousemove', function (e) {
      if (lite()) { if (cur) { release(cur); cur = null; } return; }
      var el = e.target.closest ? e.target.closest(tiltSel) : null;
      if (el !== cur) {
        release(cur); cur = el;
        if (cur) {
          cur.classList.add('smi-tilt', 'tilting');
          if (!cur.querySelector(':scope > .smi-glare')) { var g = document.createElement('div'); g.className = 'smi-glare'; cur.appendChild(g); }
        }
      }
      if (!cur) return;
      tx = e.clientX; ty = e.clientY;
      if (!tPending) { tPending = true; requestAnimationFrame(apply); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { release(cur); cur = null; });
  }

  /* ---------- 3D scroll reveal ---------- */
  var targets = $$('.section-head, .content-block .row > [class*="col-"], .smi-timeline, .smi-goals, .our-story, .on-show-slider, .table-responsive');
  targets = targets.filter(function (el) { return !el.closest('.owl-carousel') && !el.closest('.smi-hero') && !el.closest('.smi-marquee'); });
  targets.forEach(function (el) {
    if (el.classList.contains('wow')) { el.classList.remove('wow'); el.style.visibility = 'visible'; el.style.animationName = 'none'; }
    el.classList.add('smi-r3d');
    var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
    el.style.setProperty('--d', (Math.min(sib, 5) * 0.08).toFixed(2) + 's');
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else { targets.forEach(function (el) { el.classList.add('is-in'); }); }

})();
