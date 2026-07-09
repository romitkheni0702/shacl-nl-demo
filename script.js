/* ============================================================
   Showcase interactions - scroll reveal, nav progress, count-up,
   and the auto-playing "demo video" mock.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-scale');
  if (reduce) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
  }

  /* ---------- nav scroll progress ---------- */
  var bar = document.getElementById('navProgress');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    bar.style.width = (p * 100).toFixed(2) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- count-up numbers ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduce) { el.textContent = target.toLocaleString(); return; }
    var dur = 1200, start = performance.now();
    function tick(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { cio.observe(el); });

  /* ============================================================
     DEMO MOCK - autoplay loop
     ============================================================ */
  var SHAPE = [
    [['e-p','ex:PersonShape '], ['tk','a '], ['e-k','sh:NodeShape'], ['tk',' ;']],
    [['tk','  '], ['e-p','sh:targetClass'], ['tk',' ex:Person ;']],
    [['tk','  '], ['e-p','sh:property'], ['tk',' [']],
    [['tk','    '], ['e-p','sh:path'], ['tk',' ex:name ;']],
    [['tk','    '], ['e-p','sh:datatype'], ['tk',' '], ['e-s','xsd:string'], ['tk',' ;']],
    [['tk','    '], ['e-p','sh:minCount'], ['tk',' '], ['e-n','1'], ['tk',' ] ;']],
    [['tk','  '], ['e-p','sh:property'], ['tk',' [']],
    [['tk','    '], ['e-p','sh:path'], ['tk',' ex:age ;']],
    [['tk','    '], ['e-p','sh:datatype'], ['tk',' '], ['e-s','xsd:integer'], ['tk',' ;']],
    [['tk','    '], ['e-p','sh:minInclusive'], ['tk',' '], ['e-n','0'], ['tk',' ] .']]
  ];

  var OUT = [
    'Every <strong>Person</strong> must have at least one name, and that name must be plain text.',
    'The age, if provided, must be a whole number that is 0 or greater.',
    'Together these rules define a valid Person record: a required name and an optional, non-negative age.'
  ];

  var editor = document.getElementById('demoEditor');
  var genBtn = document.getElementById('demoGen');
  var skeleton = document.getElementById('demoSkeleton');
  var outText = document.getElementById('demoText');
  var app = document.getElementById('demoApp');
  var modelSel = document.getElementById('demoModel');
  var modeSel = document.getElementById('demoMode');
  var badge = document.getElementById('demoBadge');
  var CHEV = ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
  var MODELS = ['GPT-4o mini', 'Claude 4.5 Sonnet', 'DeepSeek V3.2'];
  var MODES = ['Mode C · Raw Turtle', 'Mode B · Fine-grained', 'Mode A · Structured'];
  var metricEls = {
    cost: document.querySelector('[data-metric="cost"]'),
    tokens: document.querySelector('[data-metric="tokens"]'),
    time: document.querySelector('[data-metric="time"]')
  };
  var bars = {
    cost: document.querySelector('[data-bar="cost"]'),
    tokens: document.querySelector('[data-bar="tokens"]'),
    time: document.querySelector('[data-bar="time"]')
  };

  var timers = [];
  function after(ms, fn) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function setSel(el, label) { el.innerHTML = label + CHEV; }
  function flashSel(el) { el.classList.add('changing'); after(reduce ? 0 : 280, function () { el.classList.remove('changing'); }); }

  function reset() {
    clearTimers();
    editor.innerHTML = '';
    outText.innerHTML = '';
    outText.style.display = 'block';
    skeleton.style.display = 'none';
    genBtn.className = 'gen-btn';
    genBtn.innerHTML = 'Generate Explanation';
    setSel(modelSel, 'DeepSeek V3.2');
    setSel(modeSel, 'Mode A · Structured');
    badge.innerHTML = '<span class="b-dot"></span> DeepSeek · Mode A';
    Object.keys(metricEls).forEach(function (k) { bars[k].style.width = '0'; });
    metricEls.cost.textContent = '$0.00000';
    metricEls.tokens.textContent = '0';
    metricEls.time.textContent = '0.00s';
  }

  // After the shape is typed, visibly pick a model and a strategy, then generate.
  function cycleSelects() {
    if (reduce) { generate(); return; }
    var mi = 0, di = 0;
    function stepModel() {
      setSel(modelSel, MODELS[mi]); flashSel(modelSel); mi++;
      if (mi < MODELS.length) after(380, stepModel); else after(440, stepMode);
    }
    function stepMode() {
      setSel(modeSel, MODES[di]); flashSel(modeSel); di++;
      if (di < MODES.length) after(380, stepMode); else after(480, generate);
    }
    stepModel();
  }

  function lineHTML(parts) {
    return parts.map(function (p) { return '<span class="' + p[0] + '">' + p[1] + '</span>'; }).join('');
  }

  // Type the shape line by line, then run generation.
  function typeShape() {
    var i = 0;
    function nextLine() {
      if (i >= SHAPE.length) { after(450, cycleSelects); return; }
      var ln = document.createElement('div');
      ln.innerHTML = '<span class="ln">' + (i + 1) + '</span>' + lineHTML(SHAPE[i]);
      // caret on the freshly added line briefly
      var caret = document.createElement('span'); caret.className = 'caret';
      ln.appendChild(caret);
      editor.appendChild(ln);
      var prevCaret = editor.querySelector('.ln-prev .caret');
      i++;
      after(reduce ? 0 : 150, function () {
        if (caret.parentNode) caret.remove();
        nextLine();
      });
    }
    nextLine();
  }

  function animateMetric(el, barEl, from, to, fmt, dur) {
    var start = performance.now();
    barEl.style.width = '100%';
    function tick(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function generate() {
    genBtn.className = 'gen-btn go';
    after(420, function () {
      genBtn.className = 'gen-btn busy';
      genBtn.innerHTML = '<span class="spinner"></span> Generating…';
      skeleton.style.display = 'flex';
      outText.style.display = 'none';

      // metrics climb while "thinking"
      if (!reduce) {
        animateMetric(metricEls.tokens, bars.tokens, 0, 1041, function (v) { return Math.round(v).toLocaleString(); }, 1500);
        animateMetric(metricEls.cost, bars.cost, 0, 0.00019, function (v) { return '$' + v.toFixed(5); }, 1500);
        animateMetric(metricEls.time, bars.time, 0, 2.32, function (v) { return v.toFixed(2) + 's'; }, 1500);
      } else {
        metricEls.tokens.textContent = '1,041'; metricEls.cost.textContent = '$0.00019'; metricEls.time.textContent = '2.32s';
        bars.tokens.style.width = bars.cost.style.width = bars.time.style.width = '100%';
      }

      after(reduce ? 0 : 1700, streamOutput);
    });
  }

  function streamOutput() {
    skeleton.style.display = 'none';
    outText.style.display = 'block';
    genBtn.className = 'gen-btn';
    genBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg> Done';

    var p = 0;
    function nextPara() {
      if (p >= OUT.length) { after(3200, loop); return; }
      var el = document.createElement('p');
      el.className = 'reveal-line';
      el.innerHTML = OUT[p];
      outText.appendChild(el);
      // force reflow then reveal
      void el.offsetWidth;
      el.style.transition = 'opacity .5s ease, transform .5s ease';
      el.style.opacity = '1'; el.style.transform = 'none';
      p++;
      after(reduce ? 0 : 560, nextPara);
    }
    nextPara();
  }

  function loop() { reset(); after(500, typeShape); }

  // Start when the demo scrolls into view; restart on re-entry.
  var started = false;
  if (editor) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (!started || timers.length === 0) { started = true; reset(); after(300, typeShape); }
        } else {
          // pause/reset when fully out of view so it replays fresh next time
          if (!e.isIntersecting) { clearTimers(); started = false; }
        }
      });
    }, { threshold: 0.35 });
    dio.observe(app);
  }

  /* ============================================================
     THEME TOGGLE  (light default, remembers choice)
     ============================================================ */
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var saved = null;
  try { saved = localStorage.getItem('shacl-showcase-theme'); } catch (e) {}
  if (saved === 'dark' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var dark = root.classList.toggle('dark');
      try { localStorage.setItem('shacl-showcase-theme', dark ? 'dark' : 'light'); } catch (e) {}
    });
  }

  /* ============================================================
     COMPARE MODE DEMO  (three columns fill in, winners light up)
     ============================================================ */
  var cmpApp = document.getElementById('compareApp');
  if (cmpApp) {
    var COLS = [
      { sel: '[data-col="0"]', cost: '$0.00007', tokens: '1,040', time: '3.39s',
        text: 'Every Person must have at least one name, and it must be plain text. The age, if given, must be a whole number that is 0 or greater.' },
      { sel: '[data-col="1"]', cost: '$0.00009', tokens: '1,075', time: '3.28s',
        text: 'A Person needs at least one name as plain text. If an age is present, it has to be a whole number of 0 or more - a required name and an optional, non-negative age.' },
      { sel: '[data-col="2"]', cost: '$0.00460', tokens: '1,216', time: '3.06s',
        text: 'The age, if provided, must be a whole number of 0 or greater, and every Person must carry at least one plain-text name.' }
    ];
    // winners (lowest cost = col0 GPT, fastest = col2 Claude actually 3.06s, best score = col1 DeepSeek)
    // keep the narrative: cheapest GPT-4o mini, fastest Claude, best score DeepSeek
    var cmpTimers = [];
    function cAfter(ms, fn) { var id = setTimeout(fn, ms); cmpTimers.push(id); return id; }
    function cClear() { cmpTimers.forEach(clearTimeout); cmpTimers = []; }

    function cmpReset() {
      cClear();
      COLS.forEach(function (c) {
        var col = cmpApp.querySelector(c.sel);
        col.classList.remove('win');
        col.querySelectorAll('.cm-v').forEach(function (v) { v.textContent = '-'; });
        col.querySelectorAll('.cm').forEach(function (m) { m.classList.remove('best'); });
        col.querySelector('.cmp-skel').style.display = 'flex';
        col.querySelector('.cmp-text').innerHTML = '';
      });
      cmpApp.querySelectorAll('.cmp-chip').forEach(function (ch) { ch.classList.remove('lit'); });
    }

    function cmpFillCol(i, done) {
      var c = COLS[i];
      var col = cmpApp.querySelector(c.sel);
      col.querySelector('.cmp-skel').style.display = 'none';
      col.querySelector('[data-m="cost"] .cm-v').textContent = c.cost;
      col.querySelector('[data-m="tokens"] .cm-v').textContent = c.tokens;
      col.querySelector('[data-m="time"] .cm-v').textContent = c.time;
      var t = col.querySelector('.cmp-text');
      var p = document.createElement('p'); p.textContent = c.text; t.appendChild(p);
      void p.offsetWidth; p.classList.add('in');
      if (done) cAfter(reduce ? 0 : 700, cmpHighlight);
    }

    function cmpHighlight() {
      // cheapest -> col0, fastest -> col2, best score -> col1
      var c0 = cmpApp.querySelector('[data-col="0"]');
      var c1 = cmpApp.querySelector('[data-col="1"]');
      var c2 = cmpApp.querySelector('[data-col="2"]');
      c0.querySelector('[data-m="cost"]').classList.add('best');
      c2.querySelector('[data-m="time"]').classList.add('best');
      c1.classList.add('win');
      var chips = cmpApp.querySelectorAll('.cmp-chip');
      chips.forEach(function (ch, idx) { cAfter(reduce ? 0 : 180 * idx, function () { ch.classList.add('lit'); }); });
      cAfter(reduce ? 0 : 4200, cmpLoop);
    }

    function cmpRun() {
      cmpReset();
      cAfter(reduce ? 0 : 600, function () { cmpFillCol(0, false); });
      cAfter(reduce ? 0 : 1150, function () { cmpFillCol(1, false); });
      cAfter(reduce ? 0 : 1700, function () { cmpFillCol(2, true); });
    }
    function cmpLoop() { cmpRun(); }

    var cmpStarted = false;
    var cio2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (!cmpStarted || cmpTimers.length === 0) { cmpStarted = true; cmpReset(); cAfter(300, cmpRun); }
        } else { cClear(); cmpStarted = false; }
      });
    }, { threshold: 0.3 });
    cio2.observe(cmpApp);
  }
})();
