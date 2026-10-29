'use strict';
/* Prozedurale Pixel-Art für Kacheln, Gebäude und Schilder.
   Jede Karte wird beim Betreten einmal (zwei Wasser-Frames) in ein Offscreen-Canvas gerendert. */
(function () {
  const G = FC.gfx, T = 16;
  const C = {
    grass: '#6cc04a', grassD: '#58a83e', grassDD: '#3f8a32', grassL: '#8edb62',
    tall: '#4aa83c', tallD: '#2e7a2c', tallM: '#3c9634', tallL: '#8ae060',
    path: '#dcbd7e', pathD: '#c4a062', pathL: '#eed7a2', pathE: '#b89456',
    sand: '#ecd8a0', sandD: '#d8c084',
    water: '#3a8ad8', waterD: '#2c6cbc', waterL: '#7cc4f4', foam: '#d4f0ff',
    leaf: '#3f9a46', leafL: '#66c25a', leafD: '#2a7438', leafDD: '#1d5a2c', trunk: '#7a4a2a', trunkD: '#55331d',
    rock: '#9a948a', rockL: '#c8c2b6', rockD: '#6e685e',
    ol: '#1c1626',
  };
  const FLOORS = {
    wood:  { a: '#c8945a', b: '#b8844e', line: '#a07040' },
    lab:   { a: '#e6eaee', b: '#dfe4e9', line: '#c4cad2' },
    tile:  { a: '#f2ede4', b: '#e9e2d6', line: '#d4cabb' },
    stone: { a: '#bdb3a0', b: '#b3a994', line: '#968c78' },
  };
  const WALLS = {
    wood:  { a: '#efdcb8', b: '#e2cca4', base: '#8a5a3a' },
    lab:   { a: '#dbe6ee', b: '#cbd8e2', base: '#5a6a7a' },
    tile:  { a: '#f6e2e2', b: '#ecd2d2', base: '#b06a6a' },
    stone: { a: '#8f887c', b: '#7f786c', base: '#5a5248' },
  };

  function R(x, ox, oy, X, Y, w, h, col) { x.fillStyle = col; x.fillRect(ox + X, oy + Y, w, h); }
  function hline(x, ox, oy, X, Y, len, col) { // horizontale Linie mit Umbruch innerhalb der Kachel
    X = ((X % 16) + 16) % 16;
    const a = Math.min(len, 16 - X);
    R(x, ox, oy, X, Y, a, 1, col);
    if (len > a) R(x, ox, oy, 0, Y, len - a, 1, col);
  }

  function grass(x, ox, oy, rnd) {
    R(x, ox, oy, 0, 0, 16, 16, C.grass);
    for (let i = 0; i < 9; i++) R(x, ox, oy, Math.floor(rnd() * 16), Math.floor(rnd() * 16), 1, 1, C.grassD);
    for (let i = 0; i < 4; i++) {
      const X = 1 + Math.floor(rnd() * 13), Y = 1 + Math.floor(rnd() * 12);
      R(x, ox, oy, X, Y, 1, 2, C.grassL); R(x, ox, oy, X + 1, Y + 1, 1, 1, C.grassD);
    }
  }
  function clump(x, ox, oy, cx, by) {
    const h = [2, 4, 5, 4, 2];
    for (let k = 0; k < 5; k++) for (let j = 0; j < h[k]; j++)
      R(x, ox, oy, cx - 2 + k, by - j, 1, 1, j === h[k] - 1 ? C.tallL : j === 0 ? C.tallD : C.tallM);
  }
  function tallGrass(x, ox, oy, rnd) {
    R(x, ox, oy, 0, 0, 16, 16, C.tall);
    for (let i = 0; i < 8; i++) R(x, ox, oy, Math.floor(rnd() * 16), Math.floor(rnd() * 16), 1, 1, C.tallD);
    clump(x, ox, oy, 4, 6); clump(x, ox, oy, 12, 6); clump(x, ox, oy, 8, 10); clump(x, ox, oy, 4, 15); clump(x, ox, oy, 12, 15);
  }
  function flowers(x, ox, oy, rnd) {
    grass(x, ox, oy, rnd);
    const cols = ['#f05a6a', '#f8d84a', '#ffffff', '#e070e0'];
    for (const [fx, fy] of [[4, 4], [11, 10]]) {
      const c = cols[Math.floor(rnd() * cols.length)];
      R(x, ox, oy, fx, fy - 1, 1, 1, c); R(x, ox, oy, fx, fy + 1, 1, 1, c);
      R(x, ox, oy, fx - 1, fy, 1, 1, c); R(x, ox, oy, fx + 1, fy, 1, 1, c);
      R(x, ox, oy, fx, fy, 1, 1, '#f8b030');
      R(x, ox, oy, fx, fy + 2, 1, 2, C.grassDD);
    }
  }
  function tree(x, ox, oy, rnd) {
    grass(x, ox, oy, rnd);
    R(x, ox, oy, 3, 14, 10, 2, C.grassDD);
    R(x, ox, oy, 6, 10, 4, 6, C.trunk); R(x, ox, oy, 6, 10, 1, 6, C.trunkD);
    G.disc(x, ox + 8, oy + 7, 7.6, (dx, dy, d) => {
      if (d > 6.7) return C.leafDD;
      if (dy < -2.5 && dx < 1.5 && d < 5.5) return C.leafL;
      if (dy > 2.8) return C.leafD;
      return rnd() < 0.12 ? C.leafD : C.leaf;
    });
    R(x, ox, oy, 5, 2, 2, 1, '#9ae080'); R(x, ox, oy, 4, 3, 1, 2, '#9ae080');
  }
  function rock(x, ox, oy, rnd, env) {
    if (env === 'out') grass(x, ox, oy, rnd); else floor(x, ox, oy, rnd, env, 0, 0);
    R(x, ox, oy, 2, 13, 12, 2, 'rgba(0,0,0,.18)');
    G.disc(x, ox + 8, oy + 8.5, 6.6, (dx, dy, d) => {
      if (d > 5.8) return C.ol;
      if (dy < -1.5 && dx < 1) return C.rockL;
      if (dy > 2) return C.rockD;
      return C.rock;
    });
    R(x, ox, oy, 9, 6, 2, 1, C.rockD); R(x, ox, oy, 10, 7, 1, 2, C.rockD);
  }
  function path(x, ox, oy, rnd, map, tx, ty) {
    R(x, ox, oy, 0, 0, 16, 16, C.path);
    for (let i = 0; i < 10; i++) R(x, ox, oy, Math.floor(rnd() * 16), Math.floor(rnd() * 16), 1, 1, rnd() < 0.5 ? C.pathD : C.pathL);
    const isP = (a, b) => { const c = map.tile(a, b); return c === '=' || c === null; };
    if (!isP(tx, ty - 1)) R(x, ox, oy, 0, 0, 16, 1, C.pathE);
    if (!isP(tx, ty + 1)) R(x, ox, oy, 0, 15, 16, 1, C.pathE);
    if (!isP(tx - 1, ty)) R(x, ox, oy, 0, 0, 1, 16, C.pathE);
    if (!isP(tx + 1, ty)) R(x, ox, oy, 15, 0, 1, 16, C.pathE);
  }
  function water(x, ox, oy, rnd, frame, map, tx, ty) {
    R(x, ox, oy, 0, 0, 16, 16, C.water);
    for (const [wy, off] of [[3, 0], [8, 6], [13, 11]]) {
      const s = off + frame * 3 + tx * 5 + ty * 2;
      hline(x, ox, oy, s, wy, 4, C.waterL);
      hline(x, ox, oy, s + 9, wy + 1, 3, C.waterL);
    }
    const isW = (a, b) => { const c = map.tile(a, b); return c === '~' || c === null; };
    if (!isW(tx, ty - 1)) { R(x, ox, oy, 0, 0, 16, 2, C.foam); R(x, ox, oy, 0, 2, 16, 1, C.waterL); }
    if (!isW(tx, ty + 1)) R(x, ox, oy, 0, 14, 16, 2, C.waterD);
    if (!isW(tx - 1, ty)) R(x, ox, oy, 0, 0, 2, 16, C.waterD);
    if (!isW(tx + 1, ty)) R(x, ox, oy, 14, 0, 2, 16, C.waterD);
  }
  function floor(x, ox, oy, rnd, env, tx, ty) {
    const f = FLOORS[env] || FLOORS.wood;
    if (env === 'wood') {
      R(x, ox, oy, 0, 0, 16, 16, f.a);
      for (let r = 0; r < 4; r++) {
        R(x, ox, oy, 0, r * 4 + 3, 16, 1, f.line);
        const seam = ((tx * 7 + ty * 3 + r * 5) % 12) + 2;
        R(x, ox, oy, seam, r * 4, 1, 3, f.line);
        if (rnd() < 0.5) R(x, ox, oy, Math.floor(rnd() * 14) + 1, r * 4 + 1, 2, 1, f.b);
      }
    } else {
      R(x, ox, oy, 0, 0, 16, 16, (tx + ty) % 2 ? f.a : f.b);
      R(x, ox, oy, 0, 15, 16, 1, f.line); R(x, ox, oy, 15, 0, 1, 16, f.line);
      R(x, ox, oy, 1, 1, 3, 1, 'rgba(255,255,255,.35)');
    }
  }
  function wall(x, ox, oy, env, ty) {
    const w = WALLS[env] || WALLS.wood;
    R(x, ox, oy, 0, 0, 16, 16, w.a);
    if (env === 'stone') {
      for (let r = 0; r < 4; r++) {
        R(x, ox, oy, 0, r * 4 + 3, 16, 1, w.b);
        R(x, ox, oy, (r % 2) * 8 + 3, r * 4, 1, 3, w.b);
      }
    } else {
      for (let i = 0; i < 4; i++) R(x, ox, oy, i * 4 + 1, 0, 1, 16, w.b);
    }
    if (ty === 0) R(x, ox, oy, 0, 0, 16, 2, G.shade(w.a, -0.25));
    if (ty === 1) { R(x, ox, oy, 0, 13, 16, 3, w.base); R(x, ox, oy, 0, 13, 16, 1, G.shade(w.base, 0.25)); }
  }
  function windowT(x, ox, oy, env, ty) {
    wall(x, ox, oy, env, ty);
    R(x, ox, oy, 2, 2, 12, 10, '#f4f4f4');
    R(x, ox, oy, 3, 3, 10, 8, '#8fd0f4');
    R(x, ox, oy, 3, 3, 10, 2, '#b8e4fa');
    R(x, ox, oy, 7, 3, 2, 8, '#f4f4f4'); R(x, ox, oy, 3, 6, 10, 1, '#f4f4f4');
    R(x, ox, oy, 2, 12, 12, 1, '#c8b8a0');
  }
  function counter(x, ox, oy, rnd, env, map, tx, ty) {
    floor(x, ox, oy, rnd, env, tx, ty);
    const healish = env === 'tile';
    const top = healish ? '#f6e0e8' : '#d08a52', front = healish ? '#d86a8a' : '#a05a32';
    R(x, ox, oy, 0, 1, 16, 6, top); R(x, ox, oy, 0, 1, 16, 1, '#ffffff55');
    R(x, ox, oy, 0, 7, 16, 8, front); R(x, ox, oy, 0, 7, 16, 1, C.ol);
    R(x, ox, oy, 0, 15, 16, 1, C.ol);
    R(x, ox, oy, 3, 9, 10, 4, G.shade(front, -0.15));
    if (map.tile(tx - 1, ty) !== 'C') R(x, ox, oy, 0, 1, 1, 15, C.ol);
    if (map.tile(tx + 1, ty) !== 'C') R(x, ox, oy, 15, 1, 1, 15, C.ol);
    R(x, ox, oy, 0, 0, 16, 1, C.ol);
  }
  function shelf(x, ox, oy, rnd, env, ty) {
    if (ty <= 1) wall(x, ox, oy, env, ty); else floor(x, ox, oy, rnd, env, 0, 0);
    R(x, ox, oy, 1, 0, 14, 16, '#7a4a2a'); R(x, ox, oy, 2, 1, 12, 14, '#5a341c');
    const cols = ['#d84a3a', '#3a7ad0', '#4aa04a', '#e0b030', '#8a4ab0', '#f0f0e0'];
    for (let r = 0; r < 3; r++) {
      let X = 2;
      while (X < 14) {
        const w = 1 + Math.floor(rnd() * 2), h = 3 + Math.floor(rnd() * 2);
        R(x, ox, oy, X, r * 5 + 5 - h, w, h, cols[Math.floor(rnd() * cols.length)]);
        X += w + (rnd() < 0.2 ? 1 : 0);
      }
      R(x, ox, oy, 1, r * 5 + 5, 14, 1, '#8a5a32');
    }
  }
  function pc(x, ox, oy, env, ty) {
    wall(x, ox, oy, env, ty);
    R(x, ox, oy, 1, 10, 14, 6, '#8a6a52'); R(x, ox, oy, 1, 10, 14, 1, '#b08a6a');
    R(x, ox, oy, 3, 1, 10, 9, '#3a3a4a'); R(x, ox, oy, 4, 2, 8, 6, '#5ad0f0');
    R(x, ox, oy, 5, 3, 3, 1, '#c8f4ff'); R(x, ox, oy, 7, 8, 2, 2, '#3a3a4a');
  }
  function healer(x, ox, oy, env, ty) {
    wall(x, ox, oy, env, ty);
    R(x, ox, oy, 1, 2, 14, 13, '#e4e4ec'); R(x, ox, oy, 1, 2, 14, 1, '#ffffff');
    R(x, ox, oy, 1, 14, 14, 1, '#9a9aa8');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) G.capsule(x, ox + 4 + i * 4, oy + 9 + j * 4, '#e05a5a', true);
    R(x, ox, oy, 6, 3, 4, 1, '#e04a4a'); R(x, ox, oy, 7, 2, 2, 3, '#e04a4a');
  }
  function table(x, ox, oy, rnd, env, map, tx, ty) {
    floor(x, ox, oy, rnd, env, tx, ty);
    const isT = (a, b) => map.tile(a, b) === 't';
    const top = '#b8804e', side = '#8a5a32';
    R(x, ox, oy, 0, 0, 16, 16, top);
    for (let i = 0; i < 3; i++) R(x, ox, oy, 0, i * 5 + 2, 16, 1, '#a87240');
    if (!isT(tx, ty - 1)) R(x, ox, oy, 0, 0, 16, 1, C.ol);
    if (!isT(tx - 1, ty)) R(x, ox, oy, 0, 0, 1, 16, C.ol);
    if (!isT(tx + 1, ty)) R(x, ox, oy, 15, 0, 1, 16, C.ol);
    if (!isT(tx, ty + 1)) { R(x, ox, oy, 0, 11, 16, 4, side); R(x, ox, oy, 0, 15, 16, 1, C.ol); R(x, ox, oy, 0, 11, 16, 1, C.ol);
      if (!isT(tx - 1, ty)) R(x, ox, oy, 0, 11, 1, 5, C.ol);
      if (!isT(tx + 1, ty)) R(x, ox, oy, 15, 11, 1, 5, C.ol); }
  }
  function bed(x, ox, oy, rnd, env, map, tx, ty) {
    floor(x, ox, oy, rnd, env, tx, ty);
    const topPart = map.tile(tx, ty - 1) !== 'b';
    R(x, ox, oy, 1, 0, 14, 16, '#8a5a32');
    if (topPart) {
      R(x, ox, oy, 1, 0, 14, 2, '#5a341c');
      R(x, ox, oy, 2, 2, 12, 14, '#f4f4f4');
      R(x, ox, oy, 3, 3, 10, 5, '#ffffff'); R(x, ox, oy, 3, 8, 10, 1, '#d8d8e0');
      R(x, ox, oy, 2, 11, 12, 5, '#4a7ad0');
    } else {
      R(x, ox, oy, 2, 0, 12, 14, '#4a7ad0');
      for (let i = 0; i < 3; i++) R(x, ox, oy, 2, i * 4 + 2, 12, 1, '#3a62b0');
      R(x, ox, oy, 1, 14, 14, 2, '#5a341c');
    }
  }
  function mat(x, ox, oy, rnd, env, tx, ty) {
    floor(x, ox, oy, rnd, env, tx, ty);
    R(x, ox, oy, 1, 3, 14, 11, '#c04a3a'); R(x, ox, oy, 2, 4, 12, 9, '#d86a50');
    R(x, ox, oy, 3, 6, 10, 1, '#f0c080'); R(x, ox, oy, 3, 10, 10, 1, '#f0c080');
  }

  G.drawTile = function (x, ch, tx, ty, map, env, frame) {
    const ox = tx * T, oy = ty * T;
    const rnd = FC.U.seeded(FC.U.hash(map.id + ':' + tx + ':' + ty) + 7);
    switch (ch) {
      case '.': grass(x, ox, oy, rnd); break;
      case '*': flowers(x, ox, oy, rnd); break;
      case 'G': tallGrass(x, ox, oy, rnd); break;
      case 'T': tree(x, ox, oy, rnd); break;
      case '~': water(x, ox, oy, rnd, frame, map, tx, ty); break;
      case '=': path(x, ox, oy, rnd, map, tx, ty); break;
      case 's': R(x, ox, oy, 0, 0, 16, 16, C.sand); for (let i = 0; i < 8; i++) R(x, ox, oy, Math.floor(rnd() * 16), Math.floor(rnd() * 16), 1, 1, C.sandD); break;
      case 'R': rock(x, ox, oy, rnd, env); break;
      case 'F': grass(x, ox, oy, rnd); R(x, ox, oy, 0, 5, 16, 2, '#c8945a'); R(x, ox, oy, 0, 10, 16, 2, '#c8945a'); R(x, ox, oy, 6, 2, 4, 13, '#a87040'); R(x, ox, oy, 6, 2, 4, 1, '#e0b080'); break;
      case '#': wall(x, ox, oy, env, ty); break;
      case 'W': windowT(x, ox, oy, env, ty); break;
      case '_': floor(x, ox, oy, rnd, env, tx, ty); break;
      case 'C': counter(x, ox, oy, rnd, env, map, tx, ty); break;
      case 'B': shelf(x, ox, oy, rnd, env, ty); break;
      case 'P': pc(x, ox, oy, env, ty); break;
      case 'H': healer(x, ox, oy, env, ty); break;
      case 't': table(x, ox, oy, rnd, env, map, tx, ty); break;
      case 'b': bed(x, ox, oy, rnd, env, map, tx, ty); break;
      case 'm': mat(x, ox, oy, rnd, env, tx, ty); break;
      default: R(x, ox, oy, 0, 0, 16, 16, '#000');
    }
  };

  /* ───── Gebäude ───── */
  const STY = {
    home:   { roof: '#d0603a', wall: '#f4e8d0', trim: '#7a4a2a', door: '#8a5432' },
    house2: { roof: '#5a9a5a', wall: '#f0e4cc', trim: '#5a4a2a', door: '#6a4a2a' },
    lab:    { roof: '#5a8aa8', wall: '#e8eef2', trim: '#4a5a6a', door: '#4a6a8a', emblem: 'lab' },
    heal:   { roof: '#e05a5a', wall: '#fff4f0', trim: '#a04040', door: '#7ac0e0', emblem: 'cross' },
    shop:   { roof: '#4a78d0', wall: '#f2f0e8', trim: '#34508a', door: '#7ac0e0', emblem: 'bag' },
    arena:  { roof: '#8a7a5a', wall: '#c4bcac', trim: '#5a4a3a', door: '#3a2e24', emblem: 'star' },
  };
  G.drawBuilding = function (x, b) {
    const s = STY[b.style] || STY.home;
    const ox = b.x * T, oy = b.y * T, W = b.w * T, H = b.h * T;
    const wallY = (b.h - 2) * T;
    const roofD = G.shade(s.roof, -0.22), roofL = G.shade(s.roof, 0.18);
    // Schatten
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(ox + 2, oy + H - 2, W, 3);
    // Wände
    R(x, ox, oy, 0, wallY, W, H - wallY, s.wall);
    for (let i = 0; i < W; i += 8) R(x, ox, oy, i, wallY, 1, H - wallY, G.shade(s.wall, -0.07));
    R(x, ox, oy, 0, H - 3, W, 3, G.shade(s.wall, -0.25));
    // Fenster
    const doorCol = b.door - b.x;
    for (let c = 0; c < b.w; c++) {
      if (c === doorCol || (b.style === 'arena' && Math.abs(c - doorCol) === 1)) continue;
      const wx = c * T + 3, wy = wallY + 7;
      R(x, ox, oy, wx - 1, wy - 1, 12, 10, s.trim);
      R(x, ox, oy, wx, wy, 10, 8, '#8fd0f4'); R(x, ox, oy, wx, wy, 10, 3, '#bfe6fb');
      R(x, ox, oy, wx + 4, wy, 2, 8, s.trim);
    }
    // Tür
    const dx = doorCol * T + 2;
    R(x, ox, oy, dx - 1, H - 17, 14, 17, s.trim);
    R(x, ox, oy, dx, H - 16, 12, 16, s.door);
    if (s.door === '#7ac0e0') { R(x, ox, oy, dx + 5, H - 16, 2, 16, '#5a8ab0'); R(x, ox, oy, dx + 1, H - 15, 3, 6, '#c8ecfa'); }
    else { R(x, ox, oy, dx + 9, H - 9, 2, 2, '#f0d060'); R(x, ox, oy, dx + 2, H - 14, 8, 1, G.shade(s.door, 0.2)); }
    // Dach
    const roofH = wallY + 3;
    R(x, ox, oy, -1, 0, W + 2, roofH, s.roof);
    for (let y = 3; y < roofH - 3; y += 4) R(x, ox, oy, -1, y, W + 2, 1, roofD);
    for (let y = 1; y < roofH - 3; y += 8) for (let i = (y % 16 ? 4 : 0); i < W; i += 8) R(x, ox, oy, i, y, 1, 3, roofD);
    R(x, ox, oy, -1, 0, W + 2, 2, roofL);
    R(x, ox, oy, -1, roofH - 3, W + 2, 3, roofD);
    R(x, ox, oy, -1, roofH, W + 2, 1, C.ol);
    // Embleme
    const cx = Math.round(ox + W / 2), cy = Math.round(oy + Math.max(10, roofH / 2 - 1));
    if (s.emblem === 'cross') {
      G.disc(x, cx, cy, 7, d => '#ffffff');
      R(x, 0, 0, cx - 5, cy - 1, 10, 3, '#e04a4a'); R(x, 0, 0, cx - 1, cy - 5, 3, 10, '#e04a4a');
    } else if (s.emblem === 'bag') {
      G.disc(x, cx, cy, 7, d => '#ffffff');
      R(x, 0, 0, cx - 4, cy - 2, 8, 6, '#4a78d0'); R(x, 0, 0, cx - 2, cy - 5, 4, 1, '#4a78d0');
      R(x, 0, 0, cx - 3, cy - 4, 1, 2, '#4a78d0'); R(x, 0, 0, cx + 2, cy - 4, 1, 2, '#4a78d0');
    } else if (s.emblem === 'star') {
      G.disc(x, cx, cy, 9, d => d > 8 ? C.ol : '#f0e8d0');
      x.fillStyle = '#e0a020'; x.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
      x.closePath(); x.fill();
      for (const px of [1, b.w - 2]) { R(x, ox, oy, px * T + 4, wallY, 8, H - wallY, '#e0d8c8'); R(x, ox, oy, px * T + 4, wallY, 1, H - wallY, '#a49c8c'); R(x, ox, oy, px * T + 11, wallY, 1, H - wallY, '#a49c8c'); }
    } else if (s.emblem === 'lab') {
      R(x, ox, oy, W - 22, -6, 3, 8, '#8a9aa8'); G.disc(x, ox + W - 20, oy - 8, 5, (dx, dy) => dy < 1 ? '#dfe8ee' : null);
    }
    // Kontur
    x.strokeStyle = C.ol; x.lineWidth = 1; x.strokeRect(ox - 0.5, oy + 0.5, W + 1, H - 1);
  };

  G.drawSign = function (x, tx, ty) {
    const ox = tx * T, oy = ty * T;
    R(x, ox, oy, 3, 14, 10, 2, 'rgba(0,0,0,.2)');
    R(x, ox, oy, 7, 9, 2, 6, '#6a4022');
    R(x, ox, oy, 1, 2, 14, 9, C.ol);
    R(x, ox, oy, 2, 3, 12, 7, '#c8945a');
    R(x, ox, oy, 2, 3, 12, 1, '#e0b080');
    R(x, ox, oy, 4, 5, 8, 1, '#7a4a2a'); R(x, ox, oy, 4, 7, 6, 1, '#7a4a2a');
  };

  // Overlay für hohes Gras (über den Beinen der Figuren)
  G.grassOverlay = (function () {
    const c = G.canvas(16, 16), x = c.getContext('2d');
    clump(x, 0, 0, 4, 15); clump(x, 0, 0, 12, 15); clump(x, 0, 0, 8, 14);
    R(x, 0, 0, 0, 14, 16, 2, C.tall);
    clump(x, 0, 0, 4, 15); clump(x, 0, 0, 12, 15);
    return c;
  })();

  // Karte vorrendern (2 Frames für Wasseranimation)
  G.renderMap = function (map, env, frame) {
    const c = G.canvas(map.w * T, map.h * T), x = c.getContext('2d');
    for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) G.drawTile(x, map.tile(tx, ty), tx, ty, map, env, frame);
    for (const b of map.def.buildings || []) G.drawBuilding(x, b);
    for (const s of map.def.signs || []) G.drawSign(x, s.x, s.y);
    return c;
  };
})();
