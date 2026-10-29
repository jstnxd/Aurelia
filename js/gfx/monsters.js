'use strict';
/* Prozeduraler Monster-Sprite-Generator (64×64 Pixel-Art).
   Körperbau + Merkmale (Ohren, Schweif, Kamm …) + Schattierung + Kontur + Augen. */
(function () {
  const G = FC.gfx;
  const cache = {};
  const OL = '#1c1626';

  function ell(x, cx, cy, rx, ry, col, rot) { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), rot || 0, 0, Math.PI * 2); x.fill(); }
  function poly(x, pts, col) { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath(); x.fill(); }
  function rect(x, a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); }
  function flame(x, cx, cy, s) {
    poly(x, [[cx - 4 * s, cy], [cx - 5 * s, cy - 5 * s], [cx - 2 * s, cy - 3 * s], [cx - 1 * s, cy - 9 * s], [cx + 1.5 * s, cy - 4 * s], [cx + 4 * s, cy - 7 * s], [cx + 4.5 * s, cy - 1 * s], [cx + 2 * s, cy + 2 * s], [cx - 2 * s, cy + 2 * s]], '#ff8a2a');
    ell(x, cx, cy - 1.5 * s, 2.2 * s, 3 * s, '#ffe060');
  }
  function bolt(x, ax, ay, k, col) {
    poly(x, [[ax, ay], [ax + 6 * k, ay - 6 * k], [ax + 3 * k, ay - 7 * k], [ax + 9 * k, ay - 15 * k], [ax + 1 * k, ay - 8 * k], [ax + 4 * k, ay - 7 * k], [ax - 2 * k, ay - 2 * k]], col);
  }

  const BODY = {
    blob(x, L) {
      const c = L.c, c2 = L.c2, d = G.shade(c, -0.35);
      ell(x, 20, 50, 5, 3, d); ell(x, 36, 50, 5, 3, d);
      ell(x, 28, 37, 15, 13, c); ell(x, 28, 42, 9, 7, c2);
      ell(x, 13, 39, 3, 4, c); ell(x, 43, 39, 3, 4, c);
      return { eyes: [[22, 33], [33, 33]], mouth: [28, 38], head: [28, 31, 13], tail: [42, 44], top: [28, 24], back: [28, 30] };
    },
    quad(x, L) {
      const c = L.c, c2 = L.c2, d = G.shade(c, -0.3);
      rect(x, 19, 41, 4, 10, d); rect(x, 39, 41, 4, 10, d);
      ell(x, 31, 38, 14, 9, c);
      rect(x, 24, 42, 4, 9, c); rect(x, 34, 42, 4, 9, c);
      ell(x, 31, 42, 9, 4, c2);
      ell(x, 17, 28, 10, 9, c); ell(x, 11, 32, 4.5, 3, c2);
      return { eyes: [[13, 26], [21, 26]], mouth: [11, 32], head: [17, 28, 9], tail: [44, 34], top: [17, 19], back: [32, 30] };
    },
    biped(x, L) {
      const c = L.c, c2 = L.c2, d = G.shade(c, -0.3);
      rect(x, 21, 44, 5, 8, d); rect(x, 31, 44, 5, 8, d);
      ell(x, 28, 38, 10, 10, c); ell(x, 28, 40, 6, 7, c2);
      ell(x, 17, 37, 3, 6, c, 0.3); ell(x, 39, 37, 3, 6, c, -0.3);
      ell(x, 28, 22, 11, 10, c);
      return { eyes: [[23, 21], [33, 21]], mouth: [28, 26], head: [28, 22, 10], tail: [37, 44], top: [28, 12], back: [28, 32] };
    },
    bird(x, L) {
      const c = L.c, c2 = L.c2, c3 = L.c3 || G.shade(c, -0.25);
      poly(x, [[36, 42], [51, 48], [49, 38]], c3);
      rect(x, 24, 46, 2, 6, '#e0a030'); rect(x, 31, 46, 2, 6, '#e0a030');
      ell(x, 28, 36, 12, 11, c); ell(x, 30, 39, 7, 7, c2);
      ell(x, 24, 22, 9, 8, c);
      poly(x, [[12, 23], [18, 19.5], [18, 26]], '#f0b030');
      ell(x, 37, 34, 7, 10, c3, -0.4);
      return { eyes: [[20, 20], [27, 20]], mouth: null, head: [24, 22, 8], tail: [46, 42], top: [24, 14], back: [34, 26] };
    },
    bug(x, L) {
      const c = L.c, c2 = L.c2, d = G.shade(c, -0.3);
      for (const lx of [20, 28, 36]) rect(x, lx, 46, 2, 5, d);
      ell(x, 44, 44, 6, 5, c); ell(x, 35, 42, 7, 7, c); ell(x, 25, 40, 8, 8, c);
      ell(x, 35, 45, 5, 2.5, c2); ell(x, 25, 44, 6, 3, c2);
      ell(x, 15, 34, 9, 9, c2);
      x.strokeStyle = d; x.lineWidth = 2; x.beginPath(); x.moveTo(12, 27); x.lineTo(8, 18); x.moveTo(18, 26); x.lineTo(21, 17); x.stroke();
      ell(x, 8, 18, 2.5, 2.5, L.c3 || '#e04040'); ell(x, 21, 17, 2.5, 2.5, L.c3 || '#e04040');
      return { eyes: [[11, 33], [18, 33]], mouth: [15, 38], head: [15, 34, 9], tail: [48, 44], top: [15, 25], back: [35, 35] };
    },
    cocoon(x, L) {
      const c = L.c, c2 = L.c2, d = G.shade(c, -0.3);
      ell(x, 28, 33, 11, 18, c);
      for (const y of [22, 30, 38, 45]) { x.fillStyle = d; x.fillRect(18, y, 20, 2); }
      ell(x, 28, 16, 4, 3, c2);
      return { eyes: [[24, 28], [32, 28]], mouth: null, head: [28, 28, 8], tail: [28, 50], top: [28, 14], back: [28, 33], sleepy: true };
    },
    moth(x, L) {
      const c = L.c, c2 = L.c2, c3 = L.c3 || '#fff';
      ell(x, 14, 26, 12, 14, c2, -0.3); ell(x, 42, 26, 12, 14, c2, 0.3);
      ell(x, 17, 42, 7, 8, c2, 0.4); ell(x, 39, 42, 7, 8, c2, -0.4);
      ell(x, 12, 24, 4, 4, c3); ell(x, 44, 24, 4, 4, c3); ell(x, 12, 24, 2, 2, c); ell(x, 44, 24, 2, 2, c);
      ell(x, 28, 34, 5, 13, c); ell(x, 28, 19, 7, 6, c);
      x.strokeStyle = c; x.lineWidth = 1.6; x.beginPath(); x.moveTo(25, 14); x.lineTo(20, 5); x.moveTo(31, 14); x.lineTo(36, 5); x.stroke();
      return { eyes: [[25, 18], [32, 18]], mouth: null, head: [28, 19, 6], tail: [28, 46], top: [28, 10], back: [28, 30], small: true };
    },
    ghost(x, L) {
      const c = L.c, c2 = L.c2;
      ell(x, 28, 28, 14, 14, c);
      poly(x, [[14, 28], [42, 28], [42, 44], [38, 40], [34, 47], [30, 40], [26, 47], [22, 40], [18, 47], [14, 42]], c);
      ell(x, 28, 35, 8, 6, c2);
      ell(x, 11, 32, 3, 6, c, 0.6); ell(x, 45, 32, 3, 6, c, -0.6);
      return { eyes: [[22, 26], [34, 26]], mouth: [28, 33], head: [28, 26, 13], tail: [28, 46], top: [28, 15], back: [28, 28], big: true, float: true };
    },
    rock(x, L) {
      const c = L.c, c2 = L.c2, d = G.shade(c, -0.35);
      ell(x, 9, 42, 4, 5, c); ell(x, 47, 42, 4, 5, c);
      poly(x, [[13, 50], [10, 36], [16, 24], [27, 18], [40, 21], [46, 32], [46, 46], [40, 51]], c);
      ell(x, 28, 44, 9, 5, c2);
      x.strokeStyle = d; x.lineWidth = 1.2; x.beginPath(); x.moveTo(17, 26); x.lineTo(21, 31); x.lineTo(19, 36); x.moveTo(42, 38); x.lineTo(38, 43); x.stroke();
      return { eyes: [[22, 32], [34, 32]], mouth: [28, 38], head: [28, 32, 12], tail: [46, 44], top: [28, 19], back: [28, 24], angry: true };
    },
    mushroom(x, L) {
      const c = L.c, c2 = L.c2, d = G.shade(c2, -0.25);
      rect(x, 21, 47, 5, 4, d); rect(x, 31, 47, 5, 4, d);
      ell(x, 28, 41, 10, 9, c2);
      ell(x, 28, 28, 18, 11, c); rect(x, 10, 27, 36, 5, c);
      ell(x, 20, 23, 3, 2, '#ffffff'); ell(x, 33, 21, 4, 3, '#ffffff'); ell(x, 41, 28, 2, 2, '#ffffff'); ell(x, 15, 29, 2, 1.5, '#ffffff');
      return { eyes: [[24, 40], [33, 40]], mouth: [28, 45], head: [28, 40, 9], tail: [40, 44], top: [28, 17], back: [28, 22] };
    },
    salamander(x, L) {
      const c = L.c, c2 = L.c2, d = G.shade(c, -0.3);
      x.strokeStyle = c; x.lineWidth = 5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(40, 44); x.quadraticCurveTo(53, 47, 50, 36); x.stroke();
      rect(x, 20, 44, 4, 7, d); rect(x, 36, 44, 4, 7, d);
      ell(x, 30, 42, 13, 7, c); rect(x, 25, 45, 4, 6, c); rect(x, 33, 45, 4, 6, c);
      ell(x, 30, 45, 8, 3, c2);
      ell(x, 17, 34, 11, 8, c); ell(x, 15, 38, 7, 3, c2);
      ell(x, 5, 30, 3, 5, L.c3 || c2, -0.5); ell(x, 29, 28, 3, 5, L.c3 || c2, 0.5);
      return { eyes: [[12, 32], [21, 32]], mouth: [15, 38], head: [17, 34, 9], tail: [50, 36], top: [17, 26], back: [31, 35] };
    },
  };

  function features(x, L, A, phase) {
    const c = L.c, c2 = L.c2, c3 = L.c3;
    const [hx, hy, hr] = A.head;
    const [tx, ty] = A.tail;
    if (phase === 'back') {
      if (L.tail === 'flame') flame(x, tx + 4, ty - 3, 1.15);
      if (L.tail === 'leaf') ell(x, tx + 4, ty - 7, 4, 9, c3 || '#4ab040', 0.6);
      if (L.tail === 'fin') poly(x, [[tx - 3, ty], [tx + 10, ty - 9], [tx + 8, ty + 6]], c3 && L.b !== 'salamander' ? c3 : c2);
      if (L.tail === 'thin') { x.strokeStyle = G.shade(c, -0.1); x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + 12, ty + 2, tx + 10, ty - 10); x.stroke(); }
      if (L.tail === 'bolt') bolt(x, tx, ty, 1, c3 || '#f8d030');
      if (L.tail === 'fluffy') ell(x, tx + 5, ty - 6, 7, 9, c2, 0.4);
      if (L.wings) { const [bx, by] = A.back; ell(x, bx - 12, by - 6, 7, 12, c3 || '#e8f0ff', -0.6); ell(x, bx + 12, by - 6, 7, 12, c3 || '#e8f0ff', 0.6); }
      if (L.spikes) { const [bx, by] = A.back; for (let i = -2; i <= 2; i++) poly(x, [[bx + i * 5 - 3, by + 3], [bx + i * 5, by - 7 + Math.abs(i) * 1.5], [bx + i * 5 + 3, by + 3]], c3 || G.shade(c, -0.3)); }
      return;
    }
    const top = A.top;
    if (L.ears === 'pointy') {
      poly(x, [[hx - hr + 1, hy - hr * 0.3], [hx - hr * 0.85, hy - hr - 6], [hx - hr * 0.15, hy - hr * 0.75]], c);
      poly(x, [[hx + hr - 1, hy - hr * 0.3], [hx + hr * 0.85, hy - hr - 6], [hx + hr * 0.15, hy - hr * 0.75]], c);
      poly(x, [[hx - hr * 0.75, hy - hr * 0.55], [hx - hr * 0.8, hy - hr - 3], [hx - hr * 0.35, hy - hr * 0.75]], c2);
      poly(x, [[hx + hr * 0.75, hy - hr * 0.55], [hx + hr * 0.8, hy - hr - 3], [hx + hr * 0.35, hy - hr * 0.75]], c2);
    }
    if (L.ears === 'round') { for (const s of [-1, 1]) { ell(x, hx + s * hr * 0.75, hy - hr * 0.8, 4.5, 4.5, c); ell(x, hx + s * hr * 0.75, hy - hr * 0.8, 2.5, 2.5, c2); } }
    if (L.ears === 'long') { for (const s of [-1, 1]) { ell(x, hx + s * hr * 0.5, hy - hr - 5, 3.5, 9, c, s * 0.2); ell(x, hx + s * hr * 0.5, hy - hr - 4, 1.8, 6, c2, s * 0.2); } }
    if (L.ears === 'fin') { for (const s of [-1, 1]) poly(x, [[hx + s * hr * 0.8, hy - 2], [hx + s * (hr + 7), hy - 8], [hx + s * (hr + 5), hy + 3]], c2); }
    if (L.crest === 'flame') flame(x, top[0], top[1] + 4, 0.9);
    if (L.crest === 'leaf') {
      rect(x, top[0] - 0.5, top[1], 1.5, 5, c3 || '#3a8a3a');
      ell(x, top[0] - 4, top[1] - 1, 4, 2.5, c3 || '#4ab040', -0.5); ell(x, top[0] + 4, top[1] - 2, 4, 2.5, c3 || '#4ab040', 0.5);
    }
    if (L.crest === 'horn') poly(x, [[top[0] - 3, top[1] + 4], [top[0], top[1] - 8], [top[0] + 3, top[1] + 4]], c3 || '#f0e8d0');
    if (L.crest === 'crest') { for (const k of [-3, 0, 3]) poly(x, [[top[0] + k - 2, top[1] + 3], [top[0] + k * 1.6, top[1] - 7], [top[0] + k + 2, top[1] + 3]], c3 || c2); }
    if (L.crest === 'bolt') bolt(x, top[0] - 2, top[1] + 4, 0.75, c3 || '#f8d030');
    if (L.crest === 'gem') ell(x, hx, hy - hr * 0.55, 2.8, 2.8, c3 || '#f070b0');
    if (L.crest === 'moon') { ell(x, top[0], top[1] + 1, 4.5, 4.5, c3 || '#f0d040'); ell(x, top[0] + 2.5, top[1] - 0.5, 3.6, 3.6, c); }
    if (L.crest === 'moss') { const [bx, by] = A.back; for (const [dx, dy, r] of [[-6, -6, 4], [0, -8, 5], [6, -6, 4], [-12, -12, 3]]) ell(x, bx + dx, by + dy, r, r * 0.8, c3 || '#5ab040'); ell(x, bx - 1, by - 13, 2, 2, '#f0e060'); }
  }

  function eye(x, X, Y, L, A) {
    const r = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    if (A.sleepy) { r(X - 2, Y, 4, 1, OL); return; }
    const w = A.big ? 4 : A.small ? 2 : 3, h = A.big ? 5 : A.small ? 3 : 4;
    r(X - 1, Y - 1, w + 1, h + 1, '#ffffff');
    r(X, Y, w, h, L.eye || OL);
    r(X, Y, 1, 1, '#ffffff');
    if (A.angry || L.mood === 'angry') r(X - 2, Y - 2, w + 2, 1, OL);
  }

  G.monster = function (id) {
    if (cache[id]) return cache[id];
    const sp = FC.data.MON[id];
    const L = sp.look;
    const c = G.canvas(64, 64), x = c.getContext('2d');
    x.imageSmoothingEnabled = true;
    const s = L.s || 1;
    const A0 = { head: [28, 30, 10], tail: [42, 44], top: [28, 20], back: [28, 30] };
    x.save();
    x.translate(32, 60); x.scale(s, s); x.translate(-28, -52);
    // Anker vorab bestimmen (erste Messung in Wegwerf-Canvas)
    const probe = G.canvas(64, 64).getContext('2d');
    const A = BODY[L.b](probe, L) || A0;
    if (A.float) { x.translate(0, -4); }
    features(x, L, A, 'back');
    BODY[L.b](x, L);
    features(x, L, A, 'front');
    // Schattierung nur auf vorhandene Pixel
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = 0.22; ell(x, 20, 22, 22, 15, '#ffffff');
    x.globalAlpha = 0.26; ell(x, 40, 58, 30, 18, '#000000');
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    x.restore();
    G.quantize(c);
    const T = (ax, ay) => [Math.round(32 + (ax - 28) * s), Math.round(60 + (ay - 52) * s - (A.float ? 4 * s : 0))];
    for (const [ex, ey] of A.eyes) { const [X, Y] = T(ex, ey); eye(x, X, Y, L, A); }
    if (A.mouth) { const [X, Y] = T(A.mouth[0], A.mouth[1]); x.fillStyle = OL; x.fillRect(X - 1, Y, 3, 1); if (L.mood !== 'angry' && !A.angry) { x.fillRect(X - 2, Y - 1, 1, 1); x.fillRect(X + 2, Y - 1, 1, 1); } }
    G.outline(c, OL);
    cache[id] = c;
    return c;
  };
  G.monsterBack = function (id) {
    const k = 'b' + id;
    if (cache[k]) return cache[k];
    cache[k] = G.flip(G.monster(id));
    return cache[k];
  };
  G.monsterSil = function (id, col) {
    const k = 's' + id + col;
    if (cache[k]) return cache[k];
    cache[k] = G.tint(G.monster(id), col);
    return cache[k];
  };
})();
