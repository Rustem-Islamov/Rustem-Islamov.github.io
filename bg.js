/* Home page only: a faint loss-landscape background with three optimizers (Muon, SGD with momentum, Adam)
   rolling toward two minima. One minimum sits beside the CV icon, the other beside the photo,
   both in empty space, so the runs end where nothing is written. */
(function () {
  var cv = document.getElementById('bg-canvas');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var STRENGTH = 0.15;                                        /* overall faintness of the lines */
  var L = 400;                                                /* length unit of the landscape, in px */
  var W = 0, H = 0, dpr = 1, dark = false, cache = null, runs = [], visible = true;
  var wells = [];                                             /* valleys, in units of L */
  var bumps = [];                                             /* [x, y, height, width x, width y] */
  var mid = [0, 0];
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* a valley: elongated, tilted and possibly bent like a banana; its lowest point is at (x, y) */
  function valley(X, Y, w) {
    var c = Math.cos(w.ang), s = Math.sin(w.ang), dx = X - w.x, dy = Y - w.y;
    var u = c * dx + s * dy, v = -s * dx + c * dy - w.bend * u * u;
    return -w.d * Math.exp(-(u * u / (2 * w.sx * w.sx) + v * v / (2 * w.sy * w.sy)));
  }
  function f(X, Y) {
    var s = 0.02 * ((X - mid[0]) * (X - mid[0]) + (Y - mid[1]) * (Y - mid[1])) + 0.025 * X;      /* gentle bowl, slightly tilted */
    for (var i = 0; i < wells.length; i++) s += valley(X, Y, wells[i]);
    for (var j = 0; j < bumps.length; j++) {                                                         /* ridges and hills between the valleys */
      var b = bumps[j], dx = X - b[0], dy = Y - b[1];
      s += b[2] * Math.exp(-(dx * dx / (2 * b[3] * b[3]) + dy * dy / (2 * b[4] * b[4])));
    }
    return s + 0.012 * Math.sin(2.2 * X + 0.8 * Y + 1) * Math.cos(2.6 * Y - 0.5 * X);
  }
  function grad(X, Y) {
    var e = 1e-3;
    return [(f(X + e, Y) - f(X - e, Y)) / (2 * e), (f(X, Y + e) - f(X, Y - e)) / (2 * e)];
  }

  /* ---- where the minima go: next to the CV icon and next to the photo ---- */
  function layout() {
    var r = cv.getBoundingClientRect();
    var icons = document.querySelectorAll('.hero-icons a');
    var cvIcon = icons[icons.length - 1], photo = document.querySelector('.avatar');
    function box(el) { var b = el.getBoundingClientRect(); return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height }; }
    var a = cvIcon ? box(cvIcon) : { x: 0.25 * W, y: 0.45 * H, w: 40, h: 40 };
    var p = photo ? box(photo) : { x: 0.8 * W, y: 0.3 * H, w: 160, h: 160 };
    var narrow = W < 700;
    var left = [(a.x + a.w + (narrow ? 40 : 90)) / L, (a.y + a.h / 2 + 6) / L];
    var right = [(p.x - (narrow ? 30 : 70)) / L, (p.y + p.h / 2 - 14) / L];
    wells = [
      { x: left[0],  y: left[1],  d: 1.0, sx: 0.62, sy: 0.24, ang: -0.45, bend: 0.22 },   /* beside the CV icon: a long, tilted, slightly bent valley */
      { x: right[0], y: right[1], d: 1.1, sx: 0.55, sy: 0.22, ang: 0.62,  bend: -0.5 }    /* beside the photo: a banana-shaped valley */
    ];
    var mx = (left[0] + right[0]) / 2, my = (left[1] + right[1]) / 2;
    bumps = [[mx - 0.1, my - 0.1, 0.55, 0.22, 0.55], [mx + 0.45, my + 0.55, 0.4, 0.4, 0.2], [left[0] - 0.4, left[1] - 0.7, 0.3, 0.35, 0.3]];
    mid = [(left[0] + right[0]) / 2, (left[1] + right[1]) / 2];
  }

  /* ---- contour lines (marching squares) ---- */
  function contours(c, nx, ny, levels) {
    var vals = [], i, j;
    for (j = 0; j <= ny; j++) { vals[j] = []; for (i = 0; i <= nx; i++) vals[j][i] = f(i / nx * W / L, j / ny * H / L); }
    c.beginPath();
    levels.forEach(function (lv) {
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
        var a = vals[j][i], b = vals[j][i + 1], d = vals[j + 1][i], e = vals[j + 1][i + 1];
        var idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (e > lv ? 2 : 0) | (d > lv ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        var t = function (p, q) { return (lv - p) / (q - p); };
        var top = [i + t(a, b), j], right = [i + 1, j + t(b, e)], bottom = [i + t(d, e), j + 1], left = [i, j + t(a, d)];
        var segs = { 1: [left, bottom], 2: [bottom, right], 3: [left, right], 4: [top, right], 5: [top, left, bottom, right], 6: [top, bottom], 7: [top, left],
                     8: [top, left], 9: [top, bottom], 10: [top, right, left, bottom], 11: [top, right], 12: [left, right], 13: [bottom, right], 14: [left, bottom] }[idx];
        for (var k = 0; k < segs.length; k += 2) {
          c.moveTo(segs[k][0] / nx * W, segs[k][1] / ny * H); c.lineTo(segs[k + 1][0] / nx * W, segs[k + 1][1] / ny * H);
        }
      }
    });
    c.stroke();
  }
  function rgba(a) { return dark ? 'rgba(207,148,216,' + a + ')' : 'rgba(142,69,133,' + a + ')'; }

  function buildCache() {
    cache = document.createElement('canvas'); cache.width = cv.width; cache.height = cv.height;
    var c = cache.getContext('2d'); c.scale(dpr, dpr); c.lineWidth = 1; c.strokeStyle = rgba(1);
    var nx = Math.max(60, Math.round(W / 8)), ny = Math.max(30, Math.round(H / 8));
    var lo = Infinity, hi = -Infinity;
    for (var j = 0; j <= 40; j++) for (var i = 0; i <= 80; i++) { var v = f(i / 80 * W / L, j / 40 * H / L); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    var levels = [];
    for (var k = 1; k < 9; k++) levels.push(lo + (hi - lo) * Math.pow(k / 9, 1.25));      /* few lines: it is only a hint of terrain */
    contours(c, nx, ny, levels);
  }

  /* ---- optimizers ---- */
  /* The three optimizers: Muon (purple), SGD with momentum (blue) and Adam (orange).
     All of them see a noisy gradient (like a mini-batch), so the paths wobble. */
  var KINDS = {
    muon: { c: ['#8e4585', '#cf94d8'], lr: 0.009,  noise: 0.55, beta: 0.95 },
    mom:  { c: ['#2d7fb8', '#6cb4ea'], lr: 0.005,  noise: 0.30, beta: 0.93 },
    adam: { c: ['#d77a1f', '#f2a54f'], lr: 0.0065, noise: 0.55, b1: 0.9, b2: 0.999 }
  };
  function color(k) { return KINDS[k].c[dark ? 1 : 0]; }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185 * v); }
  function startRun(kind, X, Y) { return { kind: kind, X: X, Y: Y, mx: 0, my: 0, vx: 0, vy: 0, t: 0, trail: [], done: false, hold: 0, fade: 1, n: 0, near: 0 }; }

  /* Muon orthogonalises the momentum with a few Newton-Schulz iterations (the quintic one used in practice).
     The position (x, y) is treated as a 1 x 2 matrix W; for a single row the orthogonalised update is simply
     the direction of the momentum with (roughly) unit length, which is exactly what Muon does to rank-one matrices. */
  var NS = [3.4445, -4.7750, 2.0315];
  function newtonSchulz(gx, gy) {
    var n = Math.sqrt(gx * gx + gy * gy) + 1e-7, x = gx / n, y = gy / n;        /* X = G / ||G||_F */
    for (var i = 0; i < 5; i++) {
      var A = x * x + y * y;                                                   /* A = X X^T  (a 1 x 1 matrix) */
      var c = NS[0] + NS[1] * A + NS[2] * A * A;                               /* X <- a X + (b A + c A^2) X  */
      x *= c; y *= c;
    }
    return [x, y];
  }

  function step(r) {
    var g = grad(r.X, r.Y), k = KINDS[r.kind], dx, dy;
    g[0] += k.noise * gauss(); g[1] += k.noise * gauss();
    if (r.kind === 'muon') {
      r.mx = k.beta * r.mx + g[0]; r.my = k.beta * r.my + g[1];                 /* momentum buffer */
      var o = newtonSchulz(g[0] + k.beta * r.mx, g[1] + k.beta * r.my);         /* Nesterov-style update, orthogonalised */
      dx = -k.lr * o[0]; dy = -k.lr * o[1];
    } else if (r.kind === 'mom') {
      r.mx = k.beta * r.mx - k.lr * g[0]; r.my = k.beta * r.my - k.lr * g[1]; dx = r.mx; dy = r.my;
    } else {                                                                    /* Adam, per coordinate */
      r.t++;
      r.mx = k.b1 * r.mx + (1 - k.b1) * g[0]; r.my = k.b1 * r.my + (1 - k.b1) * g[1];
      r.vx = k.b2 * r.vx + (1 - k.b2) * g[0] * g[0]; r.vy = k.b2 * r.vy + (1 - k.b2) * g[1] * g[1];
      var c1 = 1 - Math.pow(k.b1, r.t), c2 = 1 - Math.pow(k.b2, r.t);
      dx = -k.lr * (r.mx / c1) / (Math.sqrt(r.vx / c2) + 1e-8);
      dy = -k.lr * (r.my / c1) / (Math.sqrt(r.vy / c2) + 1e-8);
    }
    r.X += dx; r.Y += dy;
    r.trail.push([r.X, r.Y]); if (r.trail.length > 480) r.trail.shift();
    r.n++;
    var near = false;                                          /* settled = has stayed close to a minimum for a while */
    for (var i = 0; i < wells.length; i++) if (Math.hypot(r.X - wells[i].x, r.Y - wells[i].y) < 0.09) near = true;
    r.near = near ? r.near + 1 : 0;
    if (r.near > 70 || r.n > 6000) r.done = true;
  }
  var toggle = Math.random() < 0.5;                            /* alternate: one run heads for the CV minimum, the next for the photo minimum */
  function newStart() {
    toggle = !toggle;
    return toggle ? [(0.03 + Math.random() * 0.14 * W / L), (0.1 + Math.random() * 0.8 * H / L)]                 /* left edge  -> CV minimum   */
                  : [(0.6 + Math.random() * 0.3) * W / L, (0.02 + Math.random() * 0.12) * H / L];                /* top right -> photo minimum */
  }
  function reset() {
    var s = newStart();
    runs = ['muon', 'mom', 'adam'].map(function (k) { return startRun(k, s[0], s[1]); });
    if (reduce) { for (var n = 0; n < 6000; n++) runs.forEach(function (r) { if (!r.done) step(r); }); for (n = 0; n < 160; n++) runs.forEach(step); }
  }

  /* ---- drawing ---- */
  function px(X, Y) { return [X * L, Y * L]; }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.globalAlpha = STRENGTH; ctx.drawImage(cache, 0, 0); ctx.globalAlpha = 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    runs.forEach(function (r) {
      var col = color(r.kind), a = Math.min(1, STRENGTH * 3.4) * r.fade;
      for (var i = 1; i < r.trail.length; i++) {
        var p0 = px(r.trail[i - 1][0], r.trail[i - 1][1]), p1 = px(r.trail[i][0], r.trail[i][1]), age = i / r.trail.length;
        ctx.strokeStyle = col; ctx.globalAlpha = a * age * 0.9; ctx.lineWidth = 0.6 + age * 1.6;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
      var p = px(r.X, r.Y);
      ctx.fillStyle = col; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(p[0], p[1], 3.6, 0, 6.283); ctx.fill();
      ctx.globalAlpha = a * 0.28; ctx.beginPath(); ctx.arc(p[0], p[1], 9, 0, 6.283); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  var last = 0, acc = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (document.hidden || !visible) { last = ts; return; }
    var dt = Math.min(50, ts - (last || ts)); last = ts; acc += dt;
    if (!reduce) {
      while (acc > 16) {
        acc -= 16;
        runs.forEach(function (r) {
          step(r);                                            /* keeps jittering around the minimum once it has arrived */
          if (r.done) { r.hold++; if (r.hold > 150) r.fade = Math.max(0, r.fade - 0.012); }
        });
      }
      if (runs.every(function (r) { return r.done && r.fade <= 0; })) reset();
    }
    draw();
  }

  function resize() {
    var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    layout(); buildCache(); reset(); draw();
  }
  function readTheme() { dark = document.documentElement.getAttribute('data-theme') === 'dark'; }

  readTheme();
  var timer = null;
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(resize, 120); });
  if (window.MutationObserver) new MutationObserver(function () { readTheme(); if (cache) { buildCache(); draw(); } })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.IntersectionObserver) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(cv);
  var start = function () { resize(); requestAnimationFrame(frame); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else window.addEventListener('load', start);

  /* hook for tests */
  window.__bg = { runs: function () { return runs; }, step: step, reset: reset, draw: draw, wells: function () { return wells.map(function (w) { return [w.x * L, w.y * L]; }); } };
})();
