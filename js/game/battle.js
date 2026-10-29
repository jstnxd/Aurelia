'use strict';
/* Rundenbasiertes Kampfsystem: Typen, Fähigkeiten, Status, Statuswerte, KI, Fangen, EP, Entwicklung */
FC.battle = (function () {
  const U = FC.U, D = FC.data, G = FC.gfx, M = FC.mon;
  let B = null;
  const STAT_N = { atk: 'Angriff', def: 'Verteidigung', spa: 'Spezial-Angriff', spd: 'Spezial-Verteidigung', spe: 'Initiative', acc: 'Genauigkeit' };
  const ui = {};

  /* ───────── Hilfen ───────── */
  const stageMul = s => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
  const accMul = s => (s >= 0 ? (3 + s) / 3 : 3 / (3 - s));
  const ab = side => D.MON[side.mon.sp].ab;
  const S = () => FC.state;
  function nm(side) {
    const n = M.name(side.mon);
    if (side.isPlayer) return n;
    return B.kind === 'wild' ? `Das wilde ${n}` : `${n} des Gegners`;
  }
  function nmShort(side) { return M.name(side.mon); }
  function makeSide(mon, isPlayer) {
    return { mon, isPlayer, st: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 }, turns: 0, dispHp: mon.hp, spr: { dx: 0, dy: 0, alpha: 1, scale: 1, vis: true, white: 0, show: false } };
  }

  /* ───────── Layout ───────── */
  function layout() {
    const v = FC.view;
    const bs = Math.max(1, Math.floor(Math.min(v.cw, v.ch) * v.dpr / 190));
    const W = Math.ceil(v.cw * v.dpr / bs), H = Math.ceil(v.ch * v.dpr / bs);
    const bh = ui.bottom ? ui.bottom.offsetHeight : 160;
    const avail = Math.floor((v.ch - bh) * v.dpr / bs);
    return { bs, W, H, avail, e: [Math.round(W * 0.72), Math.round(avail * 0.52)], p: [Math.round(W * 0.27), avail - 2] };
  }
  function setBottomHeight() {
    const h = window.innerHeight, portrait = h > window.innerWidth;
    const px = portrait ? Math.min(300, Math.max(230, h * 0.36)) : Math.max(118, Math.min(172, h * 0.36));
    document.documentElement.style.setProperty('--b-bottom-h', Math.round(px) + 'px');
  }

  /* ───────── Darstellung ───────── */
  function drawBg(x, L) {
    const { W, H, avail } = L;
    const bg = B.bg;
    const pal = {
      grass: ['#a8dcff', '#e6f6ff', '#94d46a', '#7cc05a', '#5a9a40'],
      town: ['#b4dcff', '#eef8ff', '#d8c08a', '#c8ac74', '#9a8050'],
      indoor: ['#efe2c8', '#e2d2b0', '#c8945a', '#b8844e', '#8a5a32'],
      gym: ['#8f887c', '#a49c8e', '#bdb3a0', '#aaa08c', '#7a7262'],
      night: ['#1c1436', '#3a2a5a', '#2a3a4a', '#344a5a', '#1a2a38'],
    }[bg] || ['#a8dcff', '#e6f6ff', '#94d46a', '#7cc05a', '#5a9a40'];
    const hz = Math.round(avail * 0.42);
    const g = x.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, hz);
    x.fillStyle = pal[2]; x.fillRect(0, hz, W, H - hz);
    for (let y = hz + 4, i = 0; y < H; y += 6 + i * 2, i++) { x.fillStyle = pal[3]; x.fillRect(0, y, W, 2); }
    if (bg === 'grass' || bg === 'town') {
      x.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 137 + B.time / 90) % (W + 80)) - 40, cy = 8 + ((i * 53) % Math.max(10, hz - 24));
        x.fillRect(Math.round(cx), Math.round(cy), 26, 5); x.fillRect(Math.round(cx) + 6, Math.round(cy) - 4, 14, 4);
      }
      if (bg === 'grass') { x.fillStyle = '#5aa850'; for (let i = 0; i < W; i += 12) x.fillRect(i, hz - 3 - ((i * 7) % 5), 10, 4 + ((i * 7) % 5)); }
    }
    if (bg === 'night') { x.fillStyle = '#fff'; for (let i = 0; i < 30; i++) { const sx = (i * 97) % W, sy = (i * 43) % hz; if ((B.time / 300 + i) % 7 > 1) x.fillRect(sx, sy, 1, 1); } }
    if (bg === 'gym' || bg === 'indoor') { x.fillStyle = 'rgba(0,0,0,.1)'; for (let i = 0; i < W; i += 24) x.fillRect(i, 0, 2, hz); }
    // Plattformen
    for (const [cx, cy, rx] of [[L.e[0], L.e[1], 46], [L.p[0], L.p[1], 54]]) {
      x.fillStyle = pal[4]; x.beginPath(); x.ellipse(cx, cy - 2, rx, rx * 0.26, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = pal[3]; x.beginPath(); x.ellipse(cx, cy - 4, rx - 3, rx * 0.26 - 3, 0, 0, Math.PI * 2); x.fill();
    }
  }
  function drawMon(x, side, cx, base, back) {
    const s = side.spr;
    if (!s.show || !s.vis || s.scale <= 0.01) return;
    const img = back ? G.monsterBack(side.mon.sp) : G.monster(side.mon.sp);
    const w = 64 * s.scale, h = 64 * s.scale;
    x.save();
    x.globalAlpha = s.alpha;
    const dx = Math.round(cx - w / 2 + s.dx), dy = Math.round(base - 60 * s.scale + s.dy);
    if (s.clip) { x.beginPath(); x.rect(dx - 10, 0, w + 20, base + 2); x.clip(); }
    x.drawImage(img, dx, dy, w, h);
    if (s.white > 0) { x.globalAlpha = s.alpha * s.white; x.drawImage(G.monsterSil(side.mon.sp, '#ffffff'), dx, dy, w, h); }
    x.restore();
  }
  function drawTrainer(x, t, cx, base) {
    if (!t || !t.show) return;
    const img = G.charFrame(t.look, t.dir || 'down', 0);
    x.save(); x.globalAlpha = t.alpha ?? 1;
    x.drawImage(img, Math.round(cx - 24 + t.dx), Math.round(base - 60 + (t.dy || 0)), 48, 60);
    x.restore();
  }
  function render(x) {
    if (!B) return;
    const L = layout();
    x.setTransform(L.bs, 0, 0, L.bs, 0, 0);
    x.imageSmoothingEnabled = false;
    if (B.evoScene) { B.evoScene.draw(x, L); drawFx(x); return; }
    drawBg(x, L);
    drawTrainer(x, B.eTrainer, L.e[0], L.e[1]);
    drawTrainer(x, B.pTrainer, L.p[0], L.p[1]);
    drawMon(x, B.e, L.e[0], L.e[1], false);
    drawMon(x, B.p, L.p[0], L.p[1], true);
    if (B.ball) { G.capsule(x, Math.round(B.ball.x), Math.round(B.ball.y), B.ball.col); if (B.ball.glow) { x.fillStyle = `rgba(255,255,255,${B.ball.glow})`; x.fillRect(Math.round(B.ball.x) - 6, Math.round(B.ball.y) - 7, 12, 14); } }
    drawFx(x);
    if (B.weather === 'rain') {
      x.fillStyle = 'rgba(30,50,90,.15)'; x.fillRect(0, 0, L.W, L.H);
      x.fillStyle = 'rgba(210,230,255,.7)';
      for (let i = 0; i < 50; i++) { const rx = (i * 71 + B.time * 0.05 * (1 + (i % 3))) % L.W, ry = (i * 37 + B.time * 0.25) % L.H; x.fillRect(Math.round(rx), Math.round(ry), 1, 4); }
    }
    if (B.flash > 0) { x.fillStyle = `rgba(255,255,255,${B.flash})`; x.fillRect(0, 0, L.W, L.H); }
    updateBars();
  }
  function drawFx(x) {
    for (const p of B.fx) {
      const a = Math.max(0, p.life / p.max);
      x.globalAlpha = Math.min(1, a * 1.5);
      x.fillStyle = p.col;
      if (p.shape === 'ring') { x.strokeStyle = p.col; x.lineWidth = 2; x.beginPath(); x.arc(p.x, p.y, p.r + (1 - a) * p.grow, 0, Math.PI * 2); x.stroke(); }
      else if (p.shape === 'bolt') { x.fillRect(Math.round(p.x), Math.round(p.y), 2, p.size); x.fillRect(Math.round(p.x) + 2, Math.round(p.y) + p.size, 2, p.size); x.fillRect(Math.round(p.x), Math.round(p.y) + p.size * 2, 2, p.size); }
      else if (p.shape === 'arrow') { const X = Math.round(p.x), Y = Math.round(p.y), d = p.vy < 0 ? -1 : 1; x.fillRect(X - 1, Y, 3, 6); x.fillRect(X - 3, Y + (d < 0 ? 0 : 5), 7, 1); x.fillRect(X - 2, Y + (d < 0 ? -1 : 6), 5, 1); }
      else x.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
    }
    x.globalAlpha = 1;
  }
  function update(dt) {
    if (!B) return;
    B.time += dt;
    for (const p of B.fx) { p.life -= dt; p.x += (p.vx || 0) * dt / 1000; p.y += (p.vy || 0) * dt / 1000; if (p.grav) p.vy += p.grav * dt / 1000; }
    B.fx = B.fx.filter(p => p.life > 0);
    if (B.evoScene && B.evoScene.update) B.evoScene.update(dt);
  }

  /* ───────── Effekte ───────── */
  function center(side) { const L = layout(); const [cx, b] = side.isPlayer ? L.p : L.e; return [cx, b - 28]; }
  function burst(cx, cy, n, opt) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (opt.speed || 60) * (0.4 + Math.random());
      B.fx.push({ x: cx + (opt.spread ? (Math.random() - 0.5) * opt.spread : 0), y: cy + (opt.spreadY ? (Math.random() - 0.5) * opt.spreadY : 0), vx: Math.cos(a) * sp + (opt.vx || 0), vy: Math.sin(a) * sp + (opt.vy || 0), grav: opt.grav || 0, life: opt.life || 500, max: opt.life || 500, col: U.pick(opt.cols), size: opt.size || 2, shape: opt.shape });
    }
  }
  function typeFx(type, side) {
    const [cx, cy] = center(side);
    switch (type) {
      case 'feuer': burst(cx, cy + 10, 26, { cols: ['#ff8a2a', '#ffd040', '#ff5a2a'], vy: -70, speed: 30, spread: 30, life: 650, size: 3 }); break;
      case 'wasser': burst(cx, cy, 24, { cols: ['#7cc4f4', '#3a8ad8', '#ffffff'], speed: 90, grav: 160, life: 600, size: 3 }); break;
      case 'pflanze': burst(cx, cy, 18, { cols: ['#5ab040', '#8ae060', '#3a8a3a'], speed: 80, life: 700, size: 3 }); break;
      case 'elektro': for (let i = 0; i < 6; i++) B.fx.push({ x: cx + (Math.random() - 0.5) * 40, y: cy - 30 + Math.random() * 20, life: 300 + i * 40, max: 340, col: '#ffe040', size: 4, shape: 'bolt' }); burst(cx, cy, 10, { cols: ['#fff6a0'], speed: 70, life: 300 }); break;
      case 'stein': burst(cx, cy - 40, 12, { cols: ['#9a8f80', '#7a6a5a', '#c8bca8'], speed: 20, vy: 120, grav: 200, spread: 40, life: 500, size: 4 }); break;
      case 'flug': for (let i = 0; i < 8; i++) B.fx.push({ x: cx - 40, y: cy - 16 + i * 4, vx: 200 + Math.random() * 80, vy: 0, life: 380, max: 380, col: '#ffffff', size: 2 }); break;
      case 'kaefer': burst(cx, cy, 20, { cols: ['#c8e040', '#f0e080', '#8aa61e'], speed: 70, life: 500, size: 2 }); break;
      case 'geist': burst(cx, cy, 14, { cols: ['#9a80d8', '#5a3a8a', '#e0d0ff'], speed: 40, vy: -30, life: 800, size: 4 }); break;
      case 'psycho': for (let i = 0; i < 3; i++) B.fx.push({ x: cx, y: cy, r: 4 + i * 6, grow: 26, life: 500 + i * 120, max: 620, col: '#f070b0', shape: 'ring' }); break;
      default: burst(cx, cy, 14, { cols: ['#ffffff', '#ffe8a0'], speed: 100, life: 300, size: 3 });
    }
  }
  function statFx(side, up) {
    const [cx, cy] = center(side);
    for (let i = 0; i < 8; i++) B.fx.push({ x: cx - 24 + i * 7, y: up ? cy + 20 : cy - 20, vx: 0, vy: up ? -60 : 60, life: 600, max: 600, col: up ? '#5ab0f0' : '#f05a5a', shape: 'arrow' });
  }
  function statusFx(side, st) {
    const [cx, cy] = center(side);
    const col = { brn: ['#ff8a2a', '#ffd040'], psn: ['#b05ad0', '#e0a0ff'], par: ['#ffe040', '#fff6a0'], slp: ['#c8c8e0', '#ffffff'] }[st];
    burst(cx, cy, 16, { cols: col, speed: 40, vy: -40, life: 700, size: 3 });
  }
  async function blink(side, times = 3) {
    for (let i = 0; i < times * 2; i++) { side.spr.vis = !side.spr.vis; await FC.anim.delay(65); }
    side.spr.vis = true;
  }
  async function shake(side) {
    for (const d of [3, -3, 2, -2, 0]) { side.spr.dx = d; await FC.anim.delay(40); }
  }
  async function animAttack(att, def, mv) {
    const dir = att.isPlayer ? 1 : -1;
    if (mv.c === 'phys') { await FC.anim.tween(att.spr, { dx: 10 * dir, dy: -3 * dir }, 110); FC.anim.tween(att.spr, { dx: 0, dy: 0 }, 160); }
    else { await FC.anim.tween(att.spr, { dy: -5 }, 100); FC.anim.tween(att.spr, { dy: 0 }, 140); }
    typeFx(mv.t, def);
    await FC.anim.delay(260);
  }

  /* ───────── DOM-Anzeige ───────── */
  function initUi() {
    ui.root = U.$('battle-ui'); ui.enemy = U.$('b-enemy'); ui.player = U.$('b-player');
    ui.bottom = U.$('b-bottom'); ui.msg = U.$('b-msg'); ui.menu = U.$('b-menu');
    ui.bottom.addEventListener('pointerdown', e => { if (B && B.waiting && !e.target.closest('#b-menu')) { e.preventDefault(); B.waiting(); } });
  }
  function setInfo(el, side) {
    if (!side) { el.classList.add('hidden'); return; }
    el.classList.toggle('hidden', !side.spr.show);
    const m = side.mon;
    el.querySelector('.nm').textContent = M.name(m);
    el.querySelector('.lv').textContent = 'Lv. ' + m.lvl;
    const st = el.querySelector('.st');
    if (m.status) { st.textContent = D.STATUS[m.status].s; st.style.background = D.STATUS[m.status].c; } else st.textContent = '';
    side._el = el;
  }
  function updateBars() {
    for (const side of [B.p, B.e]) {
      if (!side || !side._el) continue;
      const max = M.maxHp(side.mon);
      const r = U.clamp(side.dispHp / max, 0, 1);
      const bar = side._el.querySelector('.hpbar i');
      bar.style.width = (r * 100).toFixed(1) + '%';
      bar.className = r <= 0.2 ? 'low' : r <= 0.5 ? 'mid' : '';
      if (side.isPlayer) {
        side._el.querySelector('.hpnum').textContent = Math.ceil(side.dispHp) + ' / ' + max;
        side._el.querySelector('.expbar i').style.width = (M.expProgress(side.mon) * 100).toFixed(1) + '%';
      }
    }
  }
  function refreshInfo() { setInfo(ui.enemy, B.e); setInfo(ui.player, B.p); }
  async function setHp(side, hp) {
    const max = M.maxHp(side.mon);
    hp = U.clamp(Math.round(hp), 0, max);
    const from = side.mon.hp;
    side.mon.hp = hp;
    const dur = Math.min(900, 250 + Math.abs(from - hp) / max * 900);
    await FC.anim.tween(side, { dispHp: hp }, dur, 'linear');
  }

  // Kampfmeldung: tippt Text, wartet kurz (oder bis A/Tippen)
  function msg(text, opts = {}) {
    return new Promise(resolve => {
      ui.menu.classList.add('hidden');
      ui.msg.classList.remove('hidden');
      ui.msg.classList.remove('ready');
      const speed = (FC.settings && FC.settings.textSpeed) || 2;
      const cps = [0, 32, 55, 120][speed];
      let i = 0, last = performance.now(), acc = 0, raf, timer, done = false;
      ui.msg.textContent = '';
      const finish = () => {
        if (done) return; done = true; clearTimeout(timer); cancelAnimationFrame(raf);
        B.waiting = null; ui.msg.classList.remove('ready'); resolve();
      };
      const typed = () => {
        ui.msg.textContent = text; ui.msg.classList.add('ready');
        const wait = opts.wait != null ? opts.wait : [0, 1500, 1050, 700][speed];
        if (!opts.hold) timer = setTimeout(finish, wait);
        B.waiting = finish;
      };
      const step = now => {
        acc += (now - last) * cps / 1000; last = now;
        const n = Math.floor(acc);
        if (n) { acc -= n; i = Math.min(text.length, i + n); ui.msg.textContent = text.slice(0, i); }
        if (i >= text.length) { typed(); return; }
        raf = requestAnimationFrame(step);
      };
      B.waiting = () => { cancelAnimationFrame(raf); typed(); };
      raf = requestAnimationFrame(step);
    });
  }

  // Knopfmenü im unteren Bereich; liefert Index (oder -1 bei Zurück)
  function buttons(defs, opts = {}) {
    return new Promise(resolve => {
      const box = ui.menu;
      box.innerHTML = '';
      box.classList.remove('hidden');
      if (opts.prompt != null) { ui.msg.textContent = opts.prompt; ui.msg.classList.remove('ready'); }
      ui.msg.classList.toggle('hidden', !!opts.hideMsg);
      let sel = 0;
      const els = defs.map((d, i) => {
        const b = U.el('button', 'b-btn ' + (d.cls || ''), d.html);
        if (d.style) b.setAttribute('style', d.style);
        if (d.disabled) b.disabled = true;
        if (d.wide) b.classList.add('b-menu-wide');
        b.addEventListener('click', e => { e.preventDefault(); if (!d.disabled) done(i); });
        box.appendChild(b);
        return b;
      });
      const mark = () => els.forEach((b, i) => { b.style.outline = i === sel ? '3px solid #fff' : ''; });
      B.onDir = d => {
        const cols = 2;
        if (d === 'left') sel = Math.max(0, sel - 1);
        if (d === 'right') sel = Math.min(els.length - 1, sel + 1);
        if (d === 'up') sel = Math.max(0, sel - cols);
        if (d === 'down') sel = Math.min(els.length - 1, sel + cols);
        mark();
      };
      B.onA = () => { if (!defs[sel].disabled) done(sel); };
      B.onB = () => { if (opts.back) done(-1); };
      function done(i) {
        B.onDir = B.onA = B.onB = null;
        FC.audio.sfx(i < 0 || (defs[i] && defs[i].cls === 'back') ? 'back' : 'select');
        box.innerHTML = '';
        resolve(defs[i] && defs[i].cls === 'back' ? -1 : i);
      }
      if (!('ontouchstart' in window)) mark();
    });
  }

  /* ───────── Aktionswahl ───────── */
  async function chooseAction() {
    while (true) {
      const p = B.p;
      const i = await buttons([
        { html: 'Kampf', cls: 'fight' }, { html: 'Tasche', cls: 'bag' },
        { html: 'Team', cls: 'team' }, { html: B.kind === 'wild' ? 'Flucht' : 'Flucht', cls: 'run', disabled: false },
      ], { prompt: `Was soll ${nmShort(p)} tun?` });
      if (i === 0) {
        const usable = p.mon.moves.filter(m => m.pp > 0);
        if (!usable.length) return { type: 'move', id: 'rempler', struggle: true };
        const defs = p.mon.moves.map(m => {
          const mv = D.MOVES[m.id], tc = D.TYPES[mv.t].c;
          const eff = mv.c !== 'status' ? D.typeEff(mv.t, M.types(B.e.mon)) : 1;
          const hint = mv.c === 'status' ? 'Status' : eff > 1 ? 'sehr effektiv' : eff === 0 ? 'wirkungslos' : eff < 1 ? 'schwach' : '';
          return { html: `${U.esc(mv.n)}<small>${D.TYPES[mv.t].n} · AP ${m.pp}/${mv.pp}${hint && S().dex.seen[B.e.mon.sp] ? ' · ' + hint : ''}</small>`, style: `background:${tc}`, disabled: m.pp <= 0 };
        });
        while (defs.length < 4) defs.push({ html: '–', disabled: true, style: 'background:#4a4058' });
        defs.push({ html: 'Zurück', cls: 'back', wide: true });
        const k = await buttons(defs, { back: true, hideMsg: true });
        if (k >= 0 && k < p.mon.moves.length) return { type: 'move', id: p.mon.moves[k].id };
        continue;
      }
      if (i === 1) { const a = await bagMenu(); if (a) return a; continue; }
      if (i === 2) { const k = await teamMenu(false); if (k != null) return { type: 'switch', idx: k }; continue; }
      if (i === 3) {
        if (B.kind !== 'wild') { await msg('Du kannst nicht vor einem Trainerkampf fliehen!'); continue; }
        return { type: 'run' };
      }
    }
  }

  function bagMenu() {
    return new Promise(resolve => {
      const s = S();
      const ui2 = FC.ui.sheet('Tasche');
      const close = v => { FC.input.pop(layer); FC.ui.closePanel(); resolve(v); };
      const layer = FC.input.push({ onB: () => close(null), onA() {}, onStart() {} });
      ui2.closeBtn.addEventListener('click', () => close(null));
      const list = U.el('div', 'list');
      const keys = Object.keys(D.ITEMS).filter(k => s.bag[k] > 0 && (D.ITEMS[k].kind !== 'ball' || B.kind === 'wild'));
      if (!keys.length) list.appendChild(U.el('div', 'note', 'Keine einsetzbaren Gegenstände.'));
      if (B.kind !== 'wild' && Object.keys(s.bag).some(k => s.bag[k] > 0 && D.ITEMS[k].kind === 'ball')) list.appendChild(U.el('div', 'note', 'Im Trainerkampf kannst du keine Monster fangen.'));
      for (const k of keys) {
        const it = D.ITEMS[k];
        const row = U.el('button', 'row-card', `<canvas width="16" height="16"></canvas><div class="grow"><div class="t1"><span>${it.n}</span><span>× ${s.bag[k]}</span></div><div class="t2">${it.d}</div></div>`);
        const c = row.querySelector('canvas'); c.style.width = '40px'; c.style.height = '40px';
        G.capsule(c.getContext('2d'), 8, 8, it.c);
        row.addEventListener('click', async () => {
          if (it.kind === 'ball') { close({ type: 'ball', item: k }); return; }
          FC.input.pop(layer); FC.ui.closePanel();
          const t = await teamMenu(true, k);
          if (t == null) { resolve(await bagMenu()); return; }
          resolve({ type: 'item', item: k, target: t });
        });
        list.appendChild(row);
      }
      ui2.body.appendChild(list);
    });
  }
  function itemUsable(k, m) {
    const it = D.ITEMS[k];
    if (it.kind === 'heal') return m.hp > 0 && m.hp < M.maxHp(m);
    if (it.kind === 'cure') return m.hp > 0 && !!m.status && (it.cure === 'all' || it.cure === m.status);
    if (it.kind === 'revive') return m.hp <= 0;
    return false;
  }
  // Teamliste; forItem = Gegenstand → Ziel wählen; forced = Wechsel nach K.O.
  function teamMenu(forItem, item, forced) {
    return new Promise(resolve => {
      const s = S();
      const ui2 = FC.ui.sheet(forItem ? 'Auf wen anwenden?' : forced ? 'Nächstes Monster wählen' : 'Team');
      const close = v => { FC.input.pop(layer); FC.ui.closePanel(); resolve(v); };
      const layer = FC.input.push({ onB: () => { if (!forced) close(null); }, onA() {}, onStart() {} });
      if (forced) ui2.closeBtn.remove(); else ui2.closeBtn.addEventListener('click', () => close(null));
      const list = U.el('div', 'list');
      s.party.forEach((m, i) => {
        const max = M.maxHp(m), r = m.hp / max;
        const active = B.p && B.p.mon === m;
        const row = U.el('button', 'row-card' + (active ? ' lead' : '') + (m.hp <= 0 ? ' fainted' : ''),
          `<div class="grow"><div class="t1"><span>${U.esc(M.name(m))}${active ? ' ★' : ''}</span><span>Lv. ${m.lvl}</span></div>
           <div class="t2">${m.hp} / ${max} KP${m.status ? ' · ' + D.STATUS[m.status].n : ''}</div>
           <div class="mini-hp"><i class="${r <= 0.2 ? 'low' : r <= 0.5 ? 'mid' : ''}" style="width:${(r * 100).toFixed(0)}%"></i></div></div>`);
        row.prepend(FC.ui.monCanvas(m.sp));
        row.addEventListener('click', () => {
          if (forItem) {
            if (!itemUsable(item, m)) { FC.ui.toast('Das hätte keine Wirkung.'); return; }
            close(i); return;
          }
          if (m.hp <= 0) { FC.ui.toast(`${M.name(m)} ist kampfunfähig!`); return; }
          if (active) { FC.ui.toast(`${M.name(m)} kämpft bereits!`); return; }
          close(i);
        });
        list.appendChild(row);
      });
      ui2.body.appendChild(list);
    });
  }

  /* ───────── Kampflogik ───────── */
  function calcDamage(att, def, mv, crit, avg) {
    const a = att.mon, d = def.mon, sa = M.stats(a), sd = M.stats(d);
    const phys = mv.c === 'phys';
    let as = att.st[phys ? 'atk' : 'spa'], ds = def.st[phys ? 'def' : 'spd'];
    if (crit) { as = Math.max(0, as); ds = Math.min(0, ds); }
    const A = (phys ? sa.atk : sa.spa) * stageMul(as), Dd = (phys ? sd.def : sd.spd) * stageMul(ds);
    let pow = mv.p;
    const pinch = { glutherz: 'feuer', sturzbach: 'wasser', wildwuchs: 'pflanze' }[ab(att)];
    if (pinch === mv.t && a.hp <= M.maxHp(a) / 3) pow *= 1.5;
    let dmg = Math.floor(Math.floor(Math.floor(2 * a.lvl / 5 + 2) * pow * A / Dd) / 50) + 2;
    if (phys && a.status === 'brn') dmg = Math.floor(dmg / 2);
    if (B.weather === 'rain') { if (mv.t === 'wasser') dmg *= 1.5; if (mv.t === 'feuer') dmg *= 0.5; }
    const stab = M.types(a).includes(mv.t) ? 1.5 : 1;
    let eff = D.typeEff(mv.t, M.types(d));
    if (mv.t === 'stein' && ab(def) === 'schwebe') eff = 0;
    dmg = dmg * stab * eff * (crit ? 1.5 : 1) * (avg ? 0.925 : U.ri(85, 100) / 100);
    return { dmg: eff > 0 ? Math.max(1, Math.floor(dmg)) : 0, eff };
  }

  async function inflict(side, st, quiet, source) {
    const m = side.mon;
    if (m.hp <= 0) return;
    if (m.status) { if (!quiet) await msg(`${nm(side)} ist bereits von einer Statusveränderung betroffen.`); return; }
    const t = M.types(m);
    if ((st === 'brn' && t.includes('feuer')) || (st === 'par' && t.includes('elektro'))) { if (!quiet) await msg(`Das hat keine Wirkung auf ${nm(side)} …`); return; }
    m.status = st;
    if (st === 'slp') m.slp = U.ri(2, 4);
    statusFx(side, st);
    FC.audio.sfx('stat_down');
    refreshInfo();
    if (source) await msg(`${source} von ${nmShort(side.isPlayer ? B.e : B.p)} wirkt!`);
    const txt = { brn: 'wurde verbrannt!', psn: 'wurde vergiftet!', par: 'ist paralysiert! Es kann sich eventuell nicht bewegen.', slp: 'ist eingeschlafen!' }[st];
    await msg(`${nm(side)} ${txt}`);
  }
  async function changeStats(side, changes) {
    for (const [k, v] of Object.entries(changes)) {
      if (k === 'acc' && v < 0 && ab(side) === 'scharfblick') { await msg(`Scharfblick verhindert, dass die Genauigkeit von ${nmShort(side)} sinkt!`); continue; }
      const cur = side.st[k];
      const nv = U.clamp(cur + v, -6, 6);
      if (nv === cur) { await msg(`${STAT_N[k]} von ${nmShort(side)} kann nicht weiter ${v > 0 ? 'steigen' : 'sinken'}!`); continue; }
      side.st[k] = nv;
      statFx(side, v > 0); FC.audio.sfx(v > 0 ? 'stat_up' : 'stat_down');
      await msg(`${STAT_N[k]} von ${nmShort(side)} ${v > 0 ? (v > 1 ? 'steigt stark' : 'steigt') : (v < -1 ? 'sinkt stark' : 'sinkt')}!`);
    }
  }

  async function doMove(att, def, moveId) {
    const a = att.mon, mv = D.MOVES[moveId];
    if (a.status === 'slp') {
      a.slp--;
      if (a.slp > 0) { statusFx(att, 'slp'); await msg(`${nm(att)} schläft tief und fest.`); return; }
      a.status = null; refreshInfo(); await msg(`${nm(att)} ist aufgewacht!`);
    }
    if (a.status === 'par' && U.chance(0.25)) { statusFx(att, 'par'); await msg(`${nm(att)} ist paralysiert! Es kann sich nicht bewegen!`); return; }
    const slot = a.moves.find(m => m.id === moveId);
    if (slot) slot.pp = Math.max(0, slot.pp - 1);
    await msg(`${nm(att)} setzt ${mv.n} ein!`, { wait: 500 });
    if (mv.a && !(mv.c === 'status' && mv.tgt === 'self')) {
      if (!U.chance((mv.a * accMul(att.st.acc)) / 100)) { await msg(`Die Attacke von ${nmShort(att)} ging daneben!`); return; }
    }
    if (mv.c === 'status') {
      const target = mv.tgt === 'self' ? att : def;
      if (mv.tgt === 'self') { await FC.anim.tween(att.spr, { dy: -6 }, 120); await FC.anim.tween(att.spr, { dy: 0 }, 120); }
      else typeFx(mv.t, def);
      if (mv.heal) {
        const max = M.maxHp(a);
        if (a.hp >= max) { await msg(`Die KP von ${nmShort(att)} sind bereits voll!`); return; }
        FC.audio.sfx('heal'); burst(...center(att), 14, { cols: ['#a0ffb0', '#ffffff'], vy: -40, speed: 30, life: 700, size: 3 });
        await setHp(att, a.hp + Math.floor(max * mv.heal));
        await msg(`${nm(att)} hat sich erholt!`);
      }
      if (mv.status) await inflict(target, mv.status);
      if (mv.stat) await changeStats(target, mv.stat);
      return;
    }
    if (mv.t === 'stein' && ab(def) === 'schwebe') { await msg(`${nm(def)} schwebt in der Luft und ist nicht betroffen!`); return; }
    const crit = U.chance(1 / 16);
    const { dmg, eff } = calcDamage(att, def, mv, crit);
    if (eff === 0) { await msg(`Das hat keine Wirkung auf ${nmShort(def)} …`); return; }
    await animAttack(att, def, mv);
    let real = Math.min(def.mon.hp, dmg), sturdy = false;
    if (ab(def) === 'felsenfest' && def.mon.hp === M.maxHp(def.mon) && dmg >= def.mon.hp) { real = def.mon.hp - 1; sturdy = true; }
    FC.audio.sfx(eff > 1 ? 'superhit' : eff < 1 ? 'weakhit' : 'hit');
    blink(def, 2); shake(def);
    await setHp(def, def.mon.hp - real);
    if (crit) await msg('Ein Volltreffer!', { wait: 700 });
    if (eff > 1) await msg('Das ist sehr effektiv!', { wait: 800 });
    else if (eff < 1) await msg('Das ist nicht sehr effektiv …', { wait: 800 });
    if (sturdy) await msg(`${nm(def)} hält dank Felsenfest durch!`);
    if (mv.drain && real > 0 && a.hp > 0 && a.hp < M.maxHp(a)) {
      await setHp(att, Math.min(M.maxHp(a), a.hp + Math.max(1, Math.floor(real * mv.drain))));
      await msg(`${nm(def)} wurde Energie entzogen!`);
    }
    if (mv.recoil && real > 0 && a.hp > 0) {
      await setHp(att, a.hp - Math.max(1, Math.floor(real * mv.recoil)));
      await msg(`${nm(att)} wird vom Rückstoß getroffen!`);
    }
    if (mv.eff && def.mon.hp > 0 && U.chance(mv.eff.chance)) {
      if (mv.eff.status) await inflict(def, mv.eff.status, true);
      if (mv.eff.stat) await changeStats(mv.eff.tgt === 'self' ? att : def, mv.eff.stat);
    }
    if (mv.c === 'phys' && a.hp > 0 && def.mon.hp > 0 && !a.status) {
      if (ab(def) === 'statik' && U.chance(0.3)) await inflict(att, 'par', true, 'Statik');
      else if (ab(def) === 'giftdorn' && U.chance(0.3)) await inflict(att, 'psn', true, 'Giftdorn');
    }
  }

  function aiPick(side, target, lvl) {
    const opts = side.mon.moves.filter(m => m.pp > 0);
    if (!opts.length) return 'rempler';
    if (!lvl) return U.pick(opts).id;
    let best = opts[0].id, bs = -1;
    for (const o of opts) {
      const mv = D.MOVES[o.id];
      let sc = 0;
      if (mv.c === 'status') {
        if (mv.status) sc = target.mon.status ? 0 : 42 * (mv.a || 100) / 100;
        else if (mv.heal) sc = side.mon.hp < M.maxHp(side.mon) * 0.45 ? 75 : 0;
        else if (mv.stat) {
          const k = Object.keys(mv.stat)[0];
          sc = side.turns < 1 ? 30 : 6;
          if (mv.tgt === 'self' && side.st[k] >= 2) sc = 0;
          if (mv.tgt === 'foe' && target.st[k] <= -2) sc = 0;
        }
      } else {
        const est = calcDamage(side, target, mv, false, true);
        sc = est.dmg * (mv.a || 100) / 100;
        if (lvl >= 2 && est.dmg >= target.mon.hp) sc += 300 + (mv.prio ? 100 : 0);
      }
      if (lvl === 1) sc *= 0.7 + Math.random() * 0.6;
      if (sc > bs) { bs = sc; best = o.id; }
    }
    return best;
  }
  function enemyChoose() {
    const e = B.e, lvl = B.kind === 'wild' ? 0 : (B.trainer.ai || 1);
    if (lvl >= 2 && B.items.supertrank > 0 && e.mon.hp > 0 && e.mon.hp < M.maxHp(e.mon) * 0.3) { B.items.supertrank--; return { type: 'item', item: 'supertrank' }; }
    return { type: 'move', id: aiPick(e, B.p, lvl) };
  }
  function speedOf(side) { let s = M.stats(side.mon).spe * stageMul(side.st.spe); if (side.mon.status === 'par') s *= 0.5; return s; }

  async function sendOut(side, mon, isPlayer) {
    const L = layout();
    side.mon = mon; side.dispHp = mon.hp; side.st = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 }; side.turns = 0;
    side.spr.show = true; side.spr.scale = 0; side.spr.white = 1; side.spr.alpha = 1; side.spr.dy = 0; side.spr.dx = 0; side.spr.clip = false;
    FC.game.seen(mon.sp);
    if (isPlayer) B.participants.add(mon.uid);
    refreshInfo();
    const [cx, base] = isPlayer ? L.p : L.e;
    burst(cx, base - 24, 16, { cols: ['#ffffff', '#ffe8a0'], speed: 90, life: 400 });
    FC.audio.sfx('throw');
    await FC.anim.tween(side.spr, { scale: 1 }, 320, 'outBack');
    await FC.anim.tween(side.spr, { white: 0 }, 220);
  }
  async function withdraw(side) {
    side.spr.white = 0;
    await FC.anim.tween(side.spr, { white: 1 }, 120);
    await FC.anim.tween(side.spr, { scale: 0 }, 220);
    side.spr.show = false; refreshInfo();
  }

  async function playerSwitch(idx, forced) {
    const s = S(), mon = s.party[idx];
    if (!forced) { await msg(`Komm zurück, ${nmShort(B.p)}!`, { wait: 600 }); await withdraw(B.p); }
    await sendOut(B.p, mon, true);
    await msg(`Los, ${M.name(mon)}!`, { wait: 600 });
  }

  async function useItemOn(k, idx, byEnemy) {
    const it = D.ITEMS[k];
    if (byEnemy) {
      await msg(`${B.trainer.name} setzt einen ${it.n} ein!`);
      FC.audio.sfx('heal');
      await setHp(B.e, B.e.mon.hp + it.heal);
      await msg(`${nm(B.e)} wurde geheilt!`);
      return;
    }
    const s = S(), m = s.party[idx];
    s.bag[k]--;
    await msg(`${s.player.name} setzt ${it.n} ein!`, { wait: 600 });
    const side = B.p.mon === m ? B.p : null;
    if (it.kind === 'heal') {
      FC.audio.sfx('heal');
      if (side) await setHp(side, m.hp + it.heal); else m.hp = Math.min(M.maxHp(m), m.hp + it.heal);
      await msg(`${M.name(m)} wurde geheilt!`);
    } else if (it.kind === 'cure') {
      m.status = null; m.slp = 0; refreshInfo(); FC.audio.sfx('heal');
      await msg(`${M.name(m)} ist wieder in Ordnung!`);
    } else if (it.kind === 'revive') {
      m.hp = Math.floor(M.maxHp(m) / 2); FC.audio.sfx('heal');
      await msg(`${M.name(m)} ist wieder bei Bewusstsein!`);
    }
  }

  async function throwBall(k) {
    const s = S(), it = D.ITEMS[k], e = B.e, L = layout();
    s.bag[k]--;
    await msg(`${s.player.name} wirft eine ${it.n}!`, { wait: 400 });
    FC.audio.sfx('throw');
    const [sx, sy] = [L.p[0] + 10, L.p[1] - 50], [tx, ty] = [L.e[0], L.e[1] - 40];
    B.ball = { x: sx, y: sy, col: it.c, glow: 0 };
    const prog = { t: 0 };
    const tw = FC.anim.tween(prog, { t: 1 }, 520, 'linear');
    const fly = () => { if (!B.ball) return; B.ball.x = U.lerp(sx, tx, prog.t); B.ball.y = U.lerp(sy, ty, prog.t) - Math.sin(prog.t * Math.PI) * 40; if (prog.t < 1) requestAnimationFrame(fly); };
    fly(); await tw;
    B.ball.glow = 1; e.spr.white = 1;
    await FC.anim.tween(e.spr, { scale: 0 }, 260);
    await FC.anim.tween(B.ball, { glow: 0, y: L.e[1] - 8 }, 300, 'inQuad');
    // Fangberechnung
    const mx = M.maxHp(e.mon), rate = D.MON[e.mon.sp].cr;
    const stb = e.mon.status === 'slp' ? 2 : e.mon.status ? 1.5 : 1;
    const a = ((3 * mx - 2 * e.mon.hp) * rate * it.rate) / (3 * mx) * stb;
    let shakes = 0;
    if (a >= 255) shakes = 4;
    else { const p = Math.pow(a / 255, 0.25); while (shakes < 4 && U.chance(p)) shakes++; }
    for (let i = 0; i < Math.min(3, shakes); i++) {
      await FC.anim.delay(320);
      FC.audio.sfx('shake');
      const bx = B.ball.x;
      for (const d of [-3, 3, -2, 0]) { B.ball.x = bx + d; await FC.anim.delay(55); }
    }
    await FC.anim.delay(300);
    if (shakes >= 4) {
      FC.audio.sfx('catch');
      burst(B.ball.x, B.ball.y, 14, { cols: ['#ffe060', '#ffffff'], speed: 60, life: 600 });
      FC.audio.jingle('victory');
      await msg(`Toll! ${M.name(e.mon)} wurde gefangen!`, { wait: 1400 });
      e.mon.status = null; e.mon.slp = 0;
      const where = FC.game.addMon(e.mon);
      if (where === 'box') await msg(`Dein Team ist voll. ${M.name(e.mon)} wurde in die Box am PC geschickt.`);
      else await msg(`${M.name(e.mon)} wurde ins Bestiarium eingetragen und schließt sich deinem Team an!`);
      return true;
    }
    B.ball = null;
    burst(L.e[0], L.e[1] - 20, 12, { cols: ['#ffffff'], speed: 80, life: 300 });
    await FC.anim.tween(e.spr, { scale: 1 }, 220, 'outBack');
    await FC.anim.tween(e.spr, { white: 0 }, 150);
    await msg(['Oh nein! Das Monster hat sich befreit!', 'Mist! Es hat sich losgerissen!', 'Argh! Fast hätte es geklappt!', 'Ganz knapp daneben!'][Math.min(3, shakes)]);
    return false;
  }

  async function tryRun() {
    B.escapes++;
    const ps = speedOf(B.p), es = speedOf(B.e);
    const ok = ab(B.p) === 'flinkfuss' || ps >= es || U.chance(((ps * 128) / Math.max(1, es) + 30 * B.escapes) / 256);
    if (ok) { FC.audio.sfx('back'); await msg('Du bist erfolgreich geflohen!'); return true; }
    await msg('Flucht gescheitert!');
    return false;
  }

  /* ───── EP, Level, neue Attacken ───── */
  async function learnMove(m, moveId, inBattle) {
    const mv = D.MOVES[moveId], n = M.name(m);
    const say = inBattle ? t => msg(t, { wait: 1200 }) : t => FC.ui.say(t);
    if (m.moves.some(x => x.id === moveId)) return;
    if (m.moves.length < 4) { m.moves.push({ id: moveId, pp: mv.pp }); FC.audio.sfx('levelup'); await say(`${n} hat ${mv.n} erlernt!`); return; }
    await say(`${n} möchte ${mv.n} erlernen, kennt aber bereits vier Attacken.`);
    const opts = m.moves.map(x => D.MOVES[x.id].n).concat([`${mv.n} nicht erlernen`]);
    let idx;
    if (inBattle) idx = await buttons(opts.map((o, i) => ({ html: U.esc(o) + (i < 4 ? `<small>${D.TYPES[D.MOVES[m.moves[i].id].t].n}</small>` : ''), style: i < 4 ? `background:${D.TYPES[D.MOVES[m.moves[i].id].t].c}` : '', cls: i === 4 ? 'back' : '', wide: i === 4 })), { prompt: `Welche Attacke soll ${n} vergessen?` });
    else idx = await FC.ui.choose(`Welche Attacke soll ${n} vergessen?`, opts);
    if (idx < 0 || idx >= 4) { await say(`${n} hat ${mv.n} nicht erlernt.`); return; }
    const old = D.MOVES[m.moves[idx].id].n;
    m.moves[idx] = { id: moveId, pp: mv.pp };
    await say(`1, 2 und … Schwupp! ${n} hat ${old} vergessen und ${mv.n} erlernt!`);
  }
  async function awardExp(enemyMon) {
    const s = S();
    const parts = s.party.filter(m => B.participants.has(m.uid) && m.hp > 0);
    if (!parts.length) return;
    const total = M.expYield(enemyMon, B.kind === 'trainer');
    const each = Math.max(1, Math.floor(total / parts.length));
    for (const m of parts) {
      await msg(`${M.name(m)} erhält ${each} Erfahrungspunkte!`, { wait: 800 });
      const ev = M.gainExp(m, each);
      for (const e of ev) {
        if (e.type === 'level') {
          FC.audio.sfx('levelup');
          if (B.p.mon === m) { B.p.dispHp = m.hp; refreshInfo(); burst(...center(B.p), 16, { cols: ['#ffe060', '#ffffff'], vy: -50, speed: 40, life: 700 }); }
          await msg(`${M.name(m)} erreicht Level ${e.lvl}!`, { wait: 1200 });
        } else if (e.type === 'learn') await learnMove(m, e.move, true);
      }
    }
  }

  /* ───── Entwicklung ───── */
  async function evolveScene(m) {
    const from = m.sp, to = m.evoPending, oldName = M.name(m);
    const sc = { t: 0, phase: 0, show: from, white: 1 };
    B.evoScene = {
      update(dt) { sc.t += dt; },
      draw(x, L) {
        const g = x.createRadialGradient(L.W / 2, L.H / 2, 10, L.W / 2, L.H / 2, Math.max(L.W, L.H) * 0.7);
        g.addColorStop(0, '#5a4a8a'); g.addColorStop(1, '#120e1c');
        x.fillStyle = g; x.fillRect(0, 0, L.W, L.H);
        const cx = Math.round(L.W / 2 - 64), cy = Math.round(Math.min(L.avail, L.H) / 2 - 70);
        const img = sc.white >= 1 ? G.monsterSil(sc.show, '#ffffff') : G.monster(sc.show);
        x.drawImage(img, cx, cy, 128, 128);
        if (sc.white > 0 && sc.white < 1) { x.globalAlpha = sc.white; x.drawImage(G.monsterSil(sc.show, '#ffffff'), cx, cy, 128, 128); x.globalAlpha = 1; }
      },
    };
    ui.enemy.classList.add('hidden'); ui.player.classList.add('hidden');
    sc.white = 0;
    await msg(`Nanu? ${oldName} entwickelt sich!`, { wait: 1200 });
    FC.audio.stop();
    await FC.anim.tween(sc, { white: 1 }, 600);
    let interval = 420;
    for (let i = 0; i < 12; i++) {
      sc.show = i % 2 ? from : to;
      FC.audio.sfx('blip');
      await FC.anim.delay(interval);
      interval = Math.max(70, interval * 0.8);
    }
    sc.show = to;
    const L = layout();
    burst(L.W / 2, Math.min(L.avail, L.H) / 2, 40, { cols: ['#ffffff', '#ffe060', '#c8b0ff'], speed: 140, life: 900, size: 3 });
    await FC.anim.tween(sc, { white: 0 }, 700);
    FC.audio.jingle('evolve');
    const learned = M.evolve(m);
    FC.game.caught(m.sp);
    await msg(`Glückwunsch! ${oldName} hat sich zu ${D.MON[to].n} entwickelt!`, { wait: 1800 });
    for (const mv of learned) await learnMove(m, mv, true);
    B.evoScene = null;
  }

  /* ───── Ablauf ───── */
  async function intro() {
    const s = S(), L = layout();
    B.p.spr.show = false; B.e.spr.show = false;
    B.pTrainer = { show: true, look: 'player', dir: 'up', dx: -L.W, alpha: 1 };
    if (B.kind === 'trainer') {
      B.eTrainer = { show: true, look: B.trainer.look, dir: 'down', dx: L.W, alpha: 1 };
      FC.anim.tween(B.pTrainer, { dx: 0 }, 600);
      await FC.anim.tween(B.eTrainer, { dx: 0 }, 600);
      await msg(`${B.trainer.name} fordert dich zum Kampf heraus!`);
      await FC.anim.tween(B.eTrainer, { dx: L.W, alpha: 0 }, 400);
      B.eTrainer.show = false;
      await sendOut(B.e, B.team[0], false);
      await msg(`${B.trainer.name} schickt ${M.name(B.team[0])} in den Kampf!`, { wait: 700 });
    } else {
      B.e.mon = B.team[0]; B.e.spr.show = true; B.e.spr.dx = L.W; B.e.spr.scale = 1;
      FC.game.seen(B.e.mon.sp);
      FC.anim.tween(B.pTrainer, { dx: 0 }, 600);
      await FC.anim.tween(B.e.spr, { dx: 0 }, 600);
      refreshInfo();
      FC.audio.sfx('encounter');
      await msg(B.special ? `Ein geheimnisvolles ${M.name(B.e.mon)} erscheint!` : `Ein wildes ${M.name(B.e.mon)} erscheint!`);
    }
    const first = s.party.findIndex(m => m.hp > 0);
    await FC.anim.tween(B.pTrainer, { dx: -L.W * 0.6, alpha: 0 }, 400);
    B.pTrainer.show = false;
    await sendOut(B.p, s.party[first], true);
    await msg(`Los, ${M.name(s.party[first])}!`, { wait: 600 });
    if (B.weather === 'rain') await msg('Es regnet. Wasser-Attacken werden stärker, Feuer-Attacken schwächer.');
  }

  async function handleFaints() {
    // Gegner besiegt?
    if (B.e.mon.hp <= 0 && B.e.spr.show) {
      FC.audio.sfx('faint');
      B.e.spr.clip = true;
      await FC.anim.tween(B.e.spr, { dy: 60, alpha: 0 }, 420, 'inQuad');
      B.e.spr.show = false; B.e.spr.clip = false; B.e.spr.dy = 0; refreshInfo();
      await msg(`${nm(B.e)} wurde besiegt!`);
      if (B.p.mon.hp > 0 || S().party.some(m => m.hp > 0)) await awardExp(B.e.mon);
      B.eIdx++;
      if (B.kind === 'trainer' && B.eIdx < B.team.length) {
        if (B.p.mon.hp > 0) {
          const nextName = M.name(B.team[B.eIdx]);
          await msg(`${B.trainer.name} wird gleich ${nextName} einsetzen.`, { wait: 900 });
        }
        B.participants = new Set(B.p.mon.hp > 0 ? [B.p.mon.uid] : []);
        if (B.p.mon.hp <= 0) { const r = await playerFainted(); if (r) return r; }
        await sendOut(B.e, B.team[B.eIdx], false);
        await msg(`${B.trainer.name} schickt ${M.name(B.team[B.eIdx])} in den Kampf!`, { wait: 700 });
        return null;
      }
      return 'win';
    }
    if (B.p.mon.hp <= 0 && B.p.spr.show) return playerFainted();
    return null;
  }
  async function playerFainted() {
    if (B.p.spr.show) {
      FC.audio.sfx('faint');
      B.p.spr.clip = true;
      await FC.anim.tween(B.p.spr, { dy: 60, alpha: 0 }, 420, 'inQuad');
      B.p.spr.show = false; B.p.spr.clip = false; B.p.spr.dy = 0; refreshInfo();
      await msg(`${M.name(B.p.mon)} wurde besiegt!`);
    }
    const s = S();
    if (!s.party.some(m => m.hp > 0)) return 'lose';
    const idx = await teamMenu(false, null, true);
    B.participants.add(s.party[idx].uid);
    await sendOut(B.p, s.party[idx], true);
    await msg(`Los, ${M.name(s.party[idx])}!`, { wait: 600 });
    return null;
  }

  async function endOfTurn() {
    for (const side of [B.p, B.e]) {
      const m = side.mon;
      if (m.hp <= 0 || !side.spr.show) continue;
      side.turns++;
      if (m.status === 'brn' || m.status === 'psn') {
        const dmg = Math.max(1, Math.floor(M.maxHp(m) / (m.status === 'brn' ? 16 : 8)));
        statusFx(side, m.status); blink(side, 1);
        await setHp(side, m.hp - dmg);
        await msg(m.status === 'brn' ? `${nm(side)} leidet unter seiner Verbrennung!` : `Das Gift schadet ${nmShort(side)}!`, { wait: 800 });
      }
    }
  }

  async function turn(act) {
    const eAct = enemyChoose();
    // Nicht-Attacken des Spielers zuerst
    if (act.type === 'run') { if (await tryRun()) return 'run'; }
    else if (act.type === 'switch') await playerSwitch(act.idx);
    else if (act.type === 'item') await useItemOn(act.item, act.target);
    else if (act.type === 'ball') { if (await throwBall(act.item)) return 'caught'; }
    if (eAct.type === 'item') await useItemOn(eAct.item, null, true);

    const order = [];
    if (act.type === 'move') order.push({ side: B.p, target: B.e, id: act.id, prio: D.MOVES[act.id].prio || 0 });
    if (eAct.type === 'move') order.push({ side: B.e, target: B.p, id: eAct.id, prio: D.MOVES[eAct.id].prio || 0 });
    order.sort((a, b) => (b.prio - a.prio) || (speedOf(b.side) - speedOf(a.side)) || (Math.random() - 0.5));
    for (const o of order) {
      if (o.side.mon.hp <= 0 || !o.side.spr.show || o.target.mon.hp <= 0) continue;
      if (o.side === B.p && act.struggle) await msg(`${nmShort(B.p)} hat keine AP mehr!`);
      await doMove(o.side, o.target, o.id);
      const r = await handleFaints();
      if (r) return r;
    }
    await endOfTurn();
    return handleFaints();
  }

  async function finish(result) {
    const s = S();
    if (result === 'win' && B.kind === 'trainer') {
      FC.audio.stop(); FC.audio.jingle('victory');
      await msg(`Du hast ${B.trainer.name} besiegt!`, { wait: 1300 });
      const L = layout();
      B.eTrainer = { show: true, look: B.trainer.look, dir: 'down', dx: L.W, alpha: 1 };
      await FC.anim.tween(B.eTrainer, { dx: 0 }, 500);
      await msg(B.trainer.lose, { wait: 2200 });
      s.money += B.trainer.pay;
      await msg(`${s.player.name} erhält ${U.money(B.trainer.pay)} für den Sieg.`, { wait: 1300 });
    } else if (result === 'win') {
      FC.audio.stop(); FC.audio.jingle('victory');
      await FC.anim.delay(300);
    } else if (result === 'lose' && B.kind === 'trainer') {
      const L = layout();
      B.eTrainer = { show: true, look: B.trainer.look, dir: 'down', dx: L.W, alpha: 1 };
      await FC.anim.tween(B.eTrainer, { dx: 0 }, 500);
      if (B.trainer.win) await msg(B.trainer.win, { wait: 1800 });
      if (B.trainer.noBlackout) await msg('Du hast verloren … aber das war erst der Anfang!');
    }
    // Entwicklungen
    if (result !== 'lose' && result !== 'run') {
      for (const m of s.party) if (m.evoPending && m.hp > 0) await evolveScene(m);
    }
    for (const m of s.party) m.evoPending = null;
  }

  async function start(opts) {
    if (B) return 'busy';
    const s = S();
    setBottomHeight();
    B = {
      kind: opts.kind, team: opts.team, trainer: opts.trainer || null, key: opts.key, special: !!opts.special,
      weather: opts.weather === 'rain' ? 'rain' : 'none', eIdx: 0, escapes: 0, time: 0, fx: [], flash: 0,
      bg: opts.special ? 'night' : (FC.world.map && FC.world.map.def.bg) || 'grass',
      items: Object.assign({}, (opts.trainer && opts.trainer.items) || {}),
      participants: new Set(),
      onA: null, onB: null, onDir: null, waiting: null,
    };
    B.p = makeSide(s.party.find(m => m.hp > 0) || s.party[0], true);
    B.e = makeSide(opts.team[0], false);
    const layer = FC.input.push({
      name: 'battle',
      onA() { if (B.waiting) B.waiting(); else if (B.onA) B.onA(); },
      onB() { if (B.waiting) B.waiting(); else if (B.onB) B.onB(); },
      onDir(d) { if (B.onDir) B.onDir(d); },
      onTap() { if (B.waiting) B.waiting(); },
      onStart() {},
    });
    // Übergang
    FC.audio.play(opts.music || 'battle');
    FC.audio.sfx('encounter');
    for (let i = 0; i < 2; i++) { await FC.ui.fade(true, true, 90); await FC.ui.fade(false, true, 90); }
    await FC.ui.fade(true, false, 200);
    FC.mode = 'battle';
    U.$('controls').classList.add('hidden'); U.$('hud').classList.add('hidden');
    ui.root.classList.remove('hidden');
    ui.msg.textContent = ''; ui.menu.innerHTML = '';
    refreshInfo();
    await FC.ui.fade(false, false, 220);

    let result = null;
    try {
      await intro();
      while (!result) {
        const act = await chooseAction();
        result = await turn(act);
      }
      await finish(result);
    } catch (err) {
      console.error(err);
      result = result || 'run';
    }
    // Aufräumen
    for (const m of s.party) for (const k of ['evoPending']) delete m[k];
    await FC.ui.fade(true, false, 300);
    ui.root.classList.add('hidden');
    FC.input.pop(layer);
    const r = result, tr = B.trainer;
    B = null;
    FC.mode = 'world';
    U.$('controls').classList.remove('hidden'); U.$('hud').classList.remove('hidden');
    FC.audio.play(FC.world.map.def.music || 'town');
    if (r === 'lose') {
      if (tr && tr.noBlackout) { FC.game.healParty(); await FC.ui.fade(false, false, 300); }
      else await FC.game.blackout();
    } else {
      await FC.ui.fade(false, false, 300);
      FC.game.autosave();
    }
    return r;
  }

  return { start, render, update, initUi, learnMove, get active() { return !!B; } };
})();
