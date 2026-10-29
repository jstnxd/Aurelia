'use strict';
/* Oberwelt: Karten laden, Bewegung, Kollision, NPCs, Trainer-Sichtlinien, Begegnungen, Rendering */
FC.world = (function () {
  const U = FC.U, D = FC.data, G = FC.gfx, T = 16;
  const SOLID = new Set('T~RF#WCBPHtbX'.split(''));
  const FLOOR_ENV = { haus: 'wood', nachbar: 'wood', labor: 'lab', heilstation: 'tile', laden: 'tile', arena: 'stone' };
  const WALK = 4.2, RUN = 8.5, NPC_SPEED = 3.2;

  const W = {
    map: null, npcs: [], objects: [], items: [],
    player: { x: 0, y: 0, fx: 0, fy: 0, dir: 'down', moving: false, t: 0, speed: WALK, parity: 0 },
    locked: 0, autoPath: null, autoInteract: null, tapMark: null,
    cam: { x: 0, y: 0 }, time: 0, noEncounter: 0, weather: 'none', particles: [], lastBump: 0,
  };

  /* ───── Karte aufbauen ───── */
  function build(id) {
    const def = D.MAPS[id];
    const rows = def.rows, w = rows[0].length, h = rows.length;
    const m = { id, def, w, h, env: def.indoor ? (FLOOR_ENV[id] || 'wood') : 'out', doors: {}, warps: {}, triggers: {}, signs: {} };
    m.tile = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : rows[y][x]);
    m.solid = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (SOLID.has(rows[y][x])) m.solid[y * w + x] = 1;
    for (const b of def.buildings || []) {
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) m.solid[y * w + x] = 1;
      const dy = b.y + b.h - 1;
      m.solid[dy * w + b.door] = 0;
      m.doors[b.door + ',' + dy] = b.to;
    }
    for (const s of def.signs || []) { m.solid[s.y * w + s.x] = 1; m.signs[s.x + ',' + s.y] = s; }
    for (const wp of def.warps || []) m.warps[wp.x + ',' + wp.y] = wp.to;
    for (const tr of def.triggers || []) m.triggers[tr.x + ',' + tr.y] = tr;
    const hasWater = rows.some(r => r.includes('~'));
    m.frames = [G.renderMap(m, m.env, 0)];
    if (hasWater) m.frames.push(G.renderMap(m, m.env, 1));
    return m;
  }
  const mapCache = {};
  function getMap(id) { return mapCache[id] || (mapCache[id] = build(id)); }

  function load(id, x, y, dir) {
    const prev = W.map && W.map.id;
    W.map = getMap(id);
    const p = W.player;
    Object.assign(p, { x, y, fx: x, fy: y, dir: dir || p.dir, moving: false, t: 0 });
    W.npcs = []; W.objects = []; W.autoPath = null; W.autoInteract = null; W.tapMark = null;
    refreshNpcs(); refreshObjects();
    const s = FC.state;
    W.items = (W.map.def.items || []).filter(it => !s.taken[it.id]).map(it => Object.assign({}, it));
    const wl = W.map.def.weather;
    W.weather = Array.isArray(wl) ? U.pick(wl) : wl || 'none';
    W.particles = [];
    FC.audio.play(W.map.def.music || 'town');
    if (prev !== id) FC.ui.mapName(W.map.def.name);
    syncPlayer();
    snapCamera();
  }
  function syncPlayer() {
    if (!FC.state || !W.map) return;
    const p = W.player;
    Object.assign(FC.state.player, { map: W.map.id, x: p.x, y: p.y, dir: p.dir });
  }

  function mkEntity(def) {
    return { def, id: def.id, x: def.x, y: def.y, fx: def.x, fy: def.y, ox: def.x, oy: def.y, dir: def.dir || 'down', look: def.look, moving: false, t: 0, speed: NPC_SPEED, parity: 0, nextWander: W.time + 1000 + Math.random() * 2500, emote: 0 };
  }
  function refreshNpcs() {
    const s = FC.state;
    for (const def of W.map.def.npcs || []) {
      const should = !def.cond || def.cond(s);
      const idx = W.npcs.findIndex(n => n.id === def.id);
      if (should && idx < 0) W.npcs.push(mkEntity(def));
      if (!should && idx >= 0) W.npcs.splice(idx, 1);
    }
  }
  function refreshObjects() {
    const s = FC.state;
    W.objects = (W.map.def.objects || []).filter(o => !o.cond || o.cond(s)).map(o => ({ def: o, x: o.x, y: o.y }));
  }

  /* ───── Abfragen ───── */
  const npcAt = (x, y) => W.npcs.find(n => n.x === x && n.y === y);
  const objAt = (x, y) => W.objects.find(o => o.x === x && o.y === y);
  const itemAt = (x, y, hidden) => W.items.find(i => i.x === x && i.y === y && !!i.hidden === !!hidden);
  function blocked(x, y, forNpc) {
    const m = W.map;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
    if (m.solid[y * m.w + x]) return true;
    if (npcAt(x, y) || objAt(x, y) || itemAt(x, y, false)) return true;
    if (forNpc && W.player.x === x && W.player.y === y) return true;
    if (forNpc && (m.warps[x + ',' + y] || m.doors[x + ',' + y])) return true;
    return false;
  }

  /* ───── Bewegung ───── */
  function startMove(e, dir, speed) {
    const [dx, dy] = U.DIRS[dir];
    e.dir = dir; e.fx = e.x; e.fy = e.y; e.x += dx; e.y += dy;
    e.moving = true; e.t = 0; e.speed = speed; e.parity ^= 1;
  }
  function frameOf(e) { return e.moving && e.t < 0.6 ? (e.parity ? 1 : 2) : 0; }
  function rpos(e) { const t = e.moving ? e.t : 1; return [(e.fx + (e.x - e.fx) * t) * T, (e.fy + (e.y - e.fy) * t) * T]; }

  async function lockRun(fn) {
    W.locked++;
    try { await fn(); }
    catch (err) { console.error(err); }
    finally { W.locked = Math.max(0, W.locked - 1); }
  }

  function tryMove(dir) {
    const p = W.player;
    p.dir = dir;
    const [dx, dy] = U.DIRS[dir];
    const tx = p.x + dx, ty = p.y + dy;
    if (blocked(tx, ty)) {
      if (W.time - W.lastBump > 320) { FC.audio.sfx('bump'); W.lastBump = W.time; }
      if (W.autoPath) { W.autoPath = null; }
      return;
    }
    startMove(p, dir, FC.input.held.b ? RUN : WALK);
  }

  function updatePlayer(dt) {
    const p = W.player;
    if (p.moving) {
      p.t += (dt / 1000) * p.speed;
      if (p.t >= 1) { p.t = 1; p.moving = false; p.fx = p.x; p.fy = p.y; onArrive(); }
      return;
    }
    if (W.locked || !FC.input.isTop(layer)) return;
    let dir = FC.input.dir();
    if (dir) { W.autoPath = null; W.autoInteract = null; }
    else if (W.autoPath && W.autoPath.length) dir = W.autoPath.shift();
    else if (W.autoPath && !W.autoPath.length) {
      W.autoPath = null; W.tapMark = null;
      if (W.autoInteract) { p.dir = W.autoInteract; W.autoInteract = null; interact(); }
      return;
    }
    if (dir) tryMove(dir);
  }

  function onArrive() {
    const p = W.player, m = W.map, k = p.x + ',' + p.y;
    syncPlayer();
    if (W.tapMark && W.tapMark.x === p.x && W.tapMark.y === p.y) W.tapMark = null;
    const door = m.doors[k], warp = m.warps[k];
    if (door || warp) { W.autoPath = null; lockRun(() => warpTo(door || warp, !!door || m.def.indoor)); return; }
    const trig = m.triggers[k];
    if (trig) { W.autoPath = null; lockRun(() => FC.game.run(trig.run, trig)); return; }
    if (checkTrainers()) return;
    if (m.tile(p.x, p.y) === 'G') {
      W.particles.push({ kind: 'rustle', x: p.x * T + 8, y: p.y * T + 12, life: 300, max: 300 });
      const enc = m.def.encounters;
      if (enc && W.noEncounter <= 0 && FC.game.alive().length && U.chance(enc.rate)) {
        W.autoPath = null;
        lockRun(wildBattle);
        return;
      }
    }
    if (W.noEncounter > 0) W.noEncounter--;
  }

  async function warpTo(to, door) {
    const [id, x, y, dir] = to;
    FC.audio.sfx(door ? 'door' : 'blip');
    await FC.ui.fade(true, false, door ? 220 : 160);
    load(id, x, y, dir);
    await U.wait(60);
    await FC.ui.fade(false, false, door ? 220 : 160);
    FC.game.autosave();
  }
  async function forceStep(dir) {
    const p = W.player;
    const [dx, dy] = U.DIRS[dir];
    if (blocked(p.x + dx, p.y + dy)) return;
    startMove(p, dir, WALK);
    await new Promise(r => { const chk = () => (p.moving ? requestAnimationFrame(chk) : r()); chk(); });
  }

  async function wildBattle() {
    const enc = W.map.def.encounters;
    const [sp, lo, hi] = U.weighted(enc.table.map(e => [e, e[3]]));
    const mon = FC.mon.create(sp, U.ri(lo, hi));
    await FC.battle.start({ kind: 'wild', team: [mon], weather: W.weather });
    W.noEncounter = 3;
  }

  /* ───── Trainer-Sichtlinien ───── */
  function checkTrainers() {
    const p = W.player, s = FC.state;
    for (const n of W.npcs) {
      const key = n.def.trainer;
      if (!key || !n.def.sight || s.defeated[key] || n.moving) continue;
      const [dx, dy] = U.DIRS[n.dir];
      let seen = false, dist = 0;
      for (let i = 1; i <= n.def.sight; i++) {
        const x = n.x + dx * i, y = n.y + dy * i;
        if (x === p.x && y === p.y) { seen = true; dist = i; break; }
        if (blocked(x, y)) break;
      }
      if (seen) { W.autoPath = null; lockRun(() => trainerApproach(n, dist)); return true; }
    }
    return false;
  }
  async function trainerApproach(n, dist) {
    n.emote = 900;
    FC.audio.sfx('exclaim');
    await U.wait(800);
    for (let i = 1; i < dist; i++) await stepNpc(n, n.dir);
    W.player.dir = U.OPP[n.dir];
    await FC.game.trainer(n);
  }
  function stepNpc(n, dir) {
    return new Promise(res => {
      const [dx, dy] = U.DIRS[dir];
      if (blocked(n.x + dx, n.y + dy, true)) { n.dir = dir; res(); return; }
      startMove(n, dir, NPC_SPEED);
      n.onDone = res;
    });
  }
  async function walkNpc(id, dirs) {
    const n = W.npcs.find(x => x.id === id);
    if (!n) return;
    for (const d of dirs) await stepNpc(n, d);
  }
  function faceNpc(id, dir) { const n = W.npcs.find(x => x.id === id); if (n) n.dir = dir; }

  function updateNpcs(dt) {
    for (const n of W.npcs) {
      if (n.emote > 0) n.emote -= dt;
      if (n.moving) {
        n.t += (dt / 1000) * n.speed;
        if (n.t >= 1) { n.t = 1; n.moving = false; n.fx = n.x; n.fy = n.y; if (n.onDone) { const f = n.onDone; n.onDone = null; f(); } }
        continue;
      }
      if (n.def.wander && !W.locked && W.time > n.nextWander && FC.input.isTop(layer)) {
        n.nextWander = W.time + 1500 + Math.random() * 2600;
        const dir = U.pick(['up', 'down', 'left', 'right']);
        const [dx, dy] = U.DIRS[dir];
        const tx = n.x + dx, ty = n.y + dy;
        if (Math.abs(tx - n.ox) <= 2 && Math.abs(ty - n.oy) <= 2 && !blocked(tx, ty, true)) startMove(n, dir, 2.2);
        else n.dir = dir;
      }
    }
  }

  /* ───── Interaktion ───── */
  function interact() {
    if (!W.map || W.locked || W.player.moving) return;
    const p = W.player, m = W.map;
    const [dx, dy] = U.DIRS[p.dir];
    let fx = p.x + dx, fy = p.y + dy;
    lockRun(async () => {
      const it = itemAt(fx, fy, false);
      if (it) return pickUp(it);
      const ob = objAt(fx, fy);
      if (ob) return FC.game.run(ob.def.run, ob);
      let n = npcAt(fx, fy);
      if (!n && (m.tile(fx, fy) === 'C' || m.tile(fx, fy) === 't')) n = npcAt(fx + dx, fy + dy);
      if (n) return talk(n);
      const sg = m.signs[fx + ',' + fy];
      if (sg) return FC.ui.say(sg.text.split('\n').join(' – '));
      const t = m.tile(fx, fy);
      if (t === 'P') return FC.game.run('pc');
      if (t === 'H') return FC.ui.say('Ein Heilgerät. Es summt leise.');
      if (t === 'B') return FC.ui.say(U.pick(['Bücher über Monster-Typen und ihre Schwächen.', 'Ein dickes Buch: „Die Monster von Aurelia, Band 1“.', 'Lauter Notizen über Entwicklungen.']));
      if (t === '~') return FC.ui.say('Das Wasser ist klar und kühl.');
      const hid = itemAt(fx, fy, true);
      if (hid) return pickUp(hid, true);
    });
  }
  async function pickUp(it, hidden) {
    FC.state.taken[it.id] = true;
    W.items = W.items.filter(i => i !== it);
    if (hidden) await FC.ui.say('Da liegt etwas versteckt!');
    await FC.game.give(it.item, it.qty || 1);
  }
  async function talk(n) {
    if (!n.moving) n.dir = U.OPP[W.player.dir];
    if (n.def.trainer) return FC.game.trainer(n);
    if (n.def.talk) return FC.game.run(n.def.talk, n);
    if (n.def.text) return FC.ui.say(n.def.text, n.def.name);
  }

  /* ───── Antippen → automatisch hinlaufen ───── */
  function onTap(cx, cy) {
    if (W.locked || !W.map) return;
    const dpr = FC.view.dpr, sc = FC.view.scale;
    const lx = (cx * dpr) / sc + W.cam.x, ly = (cy * dpr) / sc + W.cam.y;
    const tx = Math.floor(lx / T), ty = Math.floor(ly / T);
    const p = W.player;
    if (tx === p.x && ty === p.y) { interact(); return; }
    const m = W.map;
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return;
    const interesting = npcAt(tx, ty) || objAt(tx, ty) || itemAt(tx, ty, false) || m.signs[tx + ',' + ty] || 'CPHB~'.includes(m.tile(tx, ty));
    // Nachbarfeld: direkt interagieren
    if (Math.abs(tx - p.x) + Math.abs(ty - p.y) === 1 && interesting) {
      p.dir = tx > p.x ? 'right' : tx < p.x ? 'left' : ty > p.y ? 'down' : 'up';
      interact(); return;
    }
    let goal = null, faceDir = null;
    if (!blocked(tx, ty) || m.doors[tx + ',' + ty] || m.warps[tx + ',' + ty]) goal = [[tx, ty, null]];
    else if (interesting) {
      // Theke: zwei Felder vor dem NPC
      goal = [];
      for (const [d, [dx, dy]] of Object.entries(U.DIRS)) {
        goal.push([tx - dx, ty - dy, d]);
        if (m.tile(tx - dx, ty - dy) === 'C') goal.push([tx - 2 * dx, ty - 2 * dy, d]);
      }
    }
    if (!goal) return;
    const path = bfs(p.x, p.y, goal);
    if (!path) { FC.audio.sfx('bump'); return; }
    W.autoPath = path.dirs; W.autoInteract = path.face;
    W.tapMark = { x: path.x, y: path.y, t: 0 };
  }
  function bfs(sx, sy, goals) {
    const m = W.map, w = m.w;
    const goalMap = new Map(goals.map(([x, y, d]) => [y * w + x, d]));
    const prev = new Int32Array(w * m.h).fill(-2);
    const q = [sy * w + sx]; prev[sy * w + sx] = -1;
    const dirs = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
    while (q.length) {
      const c = q.shift(), cx = c % w, cy = (c - cx) / w;
      if (goalMap.has(c) && c !== sy * w + sx) {
        const out = []; let k = c;
        while (prev[k] !== -1) { const pk = prev[k], px = pk % w, py = (pk - px) / w; const kx = k % w, ky = (k - kx) / w; out.unshift(kx > px ? 'right' : kx < px ? 'left' : ky > py ? 'down' : 'up'); k = pk; }
        return { dirs: out, face: goalMap.get(c), x: cx, y: cy };
      }
      if (goalMap.has(c) && c === sy * w + sx) return { dirs: [], face: goalMap.get(c), x: cx, y: cy };
      for (const [, dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= m.h) continue;
        const ni = ny * w + nx;
        if (prev[ni] !== -2) continue;
        const isGoal = goalMap.has(ni);
        const passable = !blocked(nx, ny);
        if (!passable && !isGoal) continue;
        if (!passable && isGoal && !(m.doors[nx + ',' + ny] || m.warps[nx + ',' + ny])) continue;
        // Warps nur betreten, wenn sie das Ziel sind
        if ((m.doors[nx + ',' + ny] || m.warps[nx + ',' + ny]) && !isGoal) continue;
        prev[ni] = c; q.push(ni);
      }
    }
    return null;
  }

  /* ───── Wetter ───── */
  function updateWeather(dt, vw, vh) {
    const P = W.particles;
    if (W.weather === 'rain' && P.length < 90) for (let i = 0; i < 3; i++) P.push({ kind: 'rain', x: W.cam.x + Math.random() * (vw + 40) - 20, y: W.cam.y - 10 - Math.random() * 40, vx: -40, vy: 260, life: 1400, max: 1400 });
    if (W.weather === 'leaves' && P.length < 14 && Math.random() < 0.04) P.push({ kind: 'leaf', x: W.cam.x + Math.random() * vw, y: W.cam.y - 8, vx: 10 + Math.random() * 14, vy: 16 + Math.random() * 12, life: 9000, max: 9000, ph: Math.random() * 6, col: U.pick(['#f0a040', '#e86a3a', '#f8d060', '#9ad060']) });
    for (const q of P) {
      q.life -= dt;
      if (q.vx !== undefined) { q.x += (q.vx * dt) / 1000 + (q.kind === 'leaf' ? Math.sin(W.time / 400 + q.ph) * 0.3 : 0); q.y += (q.vy * dt) / 1000; }
    }
    W.particles = P.filter(q => q.life > 0 && q.y < W.cam.y + vh + 20);
  }

  /* ───── Kamera & Rendering ───── */
  function camTarget(vw, vh) {
    const m = W.map, [px, py] = rpos(W.player);
    let cx = px + 8 - vw / 2, cy = py + 8 - vh / 2;
    const mw = m.w * T, mh = m.h * T;
    cx = mw <= vw ? (mw - vw) / 2 : U.clamp(cx, 0, mw - vw);
    cy = mh <= vh ? (mh - vh) / 2 : U.clamp(cy, 0, mh - vh);
    return [Math.round(cx), Math.round(cy)];
  }
  function snapCamera() { if (FC.view) { const [x, y] = camTarget(FC.view.w, FC.view.h); W.cam.x = x; W.cam.y = y; } }

  function drawEntity(x, e, look) {
    const [px, py] = rpos(e);
    const sx = Math.round(px), sy = Math.round(py);
    x.fillStyle = 'rgba(20,16,30,.28)';
    x.fillRect(sx + 3, sy + 13, 10, 2); x.fillRect(sx + 4, sy + 15, 8, 1);
    x.drawImage(G.charFrame(look, e.dir, frameOf(e)), sx, sy - 5);
    const tx = Math.round(px / T), ty = Math.round(py / T);
    if (W.map.tile(tx, ty) === 'G' && (!e.moving || e.t > 0.25)) x.drawImage(G.grassOverlay, sx, sy);
    if (e.emote > 0) x.drawImage(G.emote, sx + 2, sy - 20);
  }

  function render(x, vw, vh) {
    const m = W.map;
    if (!m) return;
    const [tcx, tcy] = camTarget(vw, vh);
    W.cam.x = tcx; W.cam.y = tcy;
    x.fillStyle = '#0c0a12'; x.fillRect(0, 0, vw, vh);
    x.save();
    x.translate(-W.cam.x, -W.cam.y);
    const f = m.frames[m.frames.length > 1 ? Math.floor(W.time / 650) % 2 : 0];
    x.drawImage(f, 0, 0);
    // Tipp-Markierung
    if (W.tapMark) {
      const a = 0.5 + 0.5 * Math.sin(W.time / 120);
      x.strokeStyle = `rgba(255,255,255,${0.4 + a * 0.5})`; x.lineWidth = 1;
      x.strokeRect(W.tapMark.x * T + 1.5, W.tapMark.y * T + 1.5, 13, 13);
    }
    // Gegenstände
    for (const it of W.items) if (!it.hidden) {
      x.fillStyle = 'rgba(20,16,30,.25)'; x.fillRect(it.x * T + 4, it.y * T + 12, 8, 2);
      G.capsule(x, it.x * T + 8, it.y * T + 8 + Math.round(Math.sin(W.time / 300 + it.x) * 0.6), D.ITEMS[it.item].kind === 'ball' ? D.ITEMS[it.item].c : '#2ab0a0', true);
    }
    // Objekte
    for (const o of W.objects) {
      const ox = o.x * T, oy = o.y * T;
      if (o.def.kind === 'starter') {
        const col = { 1: '#e8603a', 4: '#3f86e8', 7: '#4cad40' }[o.def.sp];
        G.capsule(x, ox + 8, oy + 7, col);
      } else if (o.def.kind === 'sparkle') {
        const ph = (W.time / 200) % (Math.PI * 2), r = 3 + Math.sin(ph) * 1.5;
        x.fillStyle = 'rgba(200,180,255,.35)'; x.beginPath(); x.arc(ox + 8, oy + 8, 6 + Math.sin(ph) * 2, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#fff';
        x.fillRect(ox + 8 - r, oy + 7, r * 2 + 1, 1); x.fillRect(ox + 8, oy + 7 - r, 1, r * 2 + 1);
        x.fillStyle = '#e8d8ff'; x.fillRect(ox + 7, oy + 6, 3, 3);
      }
    }
    // Figuren nach Tiefe sortiert
    const ents = W.npcs.map(n => [n, n.look]).concat([[W.player, 'player']]);
    ents.sort((a, b) => rpos(a[0])[1] - rpos(b[0])[1]);
    for (const [e, look] of ents) drawEntity(x, e, look);
    // Partikel
    for (const q of W.particles) {
      if (q.kind === 'rain') { x.fillStyle = 'rgba(200,225,255,.7)'; x.fillRect(Math.round(q.x), Math.round(q.y), 1, 4); }
      else if (q.kind === 'leaf') { x.fillStyle = q.col; x.fillRect(Math.round(q.x), Math.round(q.y), 2, 1); x.fillRect(Math.round(q.x) + 1, Math.round(q.y) + 1, 1, 1); }
      else if (q.kind === 'rustle') { const k = 1 - q.life / q.max; x.fillStyle = '#8ae060'; for (const s of [-1, 1]) x.fillRect(Math.round(q.x + s * (3 + k * 4)), Math.round(q.y - 4 - k * 4), 1, 2); }
    }
    x.restore();
    if (W.weather === 'rain') { x.fillStyle = 'rgba(30,50,90,.18)'; x.fillRect(0, 0, vw, vh); }
  }

  function update(dt) {
    if (!W.map) return;
    W.time += dt;
    if (FC.state) FC.state.playtime = (FC.state.playtime || 0) + dt / 1000;
    updatePlayer(dt);
    updateNpcs(dt);
    updateWeather(dt, FC.view.w, FC.view.h);
  }

  const layer = {
    name: 'world',
    onA() { if (!W.locked && !W.player.moving) { W.autoPath = null; interact(); } },
    onB() {},
    onStart() { if (W.map && !W.locked && !W.player.moving) { W.autoPath = null; FC.menu.open(); } },
    onTap(cx, cy) { onTap(cx, cy); },
  };

  return {
    W, layer, load, update, render, syncPlayer, refreshNpcs, refreshObjects, forceStep, walkNpc, faceNpc, snapCamera, lockRun,
    get map() { return W.map; },
    set autoPath(v) { W.autoPath = v; W.autoInteract = null; W.tapMark = null; },
    get locked() { return W.locked; },
  };
})();
