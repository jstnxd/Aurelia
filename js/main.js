'use strict';
/* Start: Bildschirmgröße, Spiel-Loop, Titelbildschirm, Neues Spiel / Fortsetzen */
(function () {
  const U = FC.U;
  const canvas = U.$('screen');
  const ctx = canvas.getContext('2d', { alpha: false });
  FC.view = { cw: 0, ch: 0, dpr: 1, scale: 1, w: 0, h: 0 };
  FC.settings = FC.save.loadSettings();
  FC.audio.setVolume('music', FC.settings.music);
  FC.audio.setVolume('sfx', FC.settings.sfx);

  function resize() {
    const v = FC.view;
    v.dpr = Math.min(3, window.devicePixelRatio || 1);
    v.cw = window.innerWidth; v.ch = window.innerHeight;
    canvas.width = Math.round(v.cw * v.dpr);
    canvas.height = Math.round(v.ch * v.dpr);
    v.scale = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / (16 * 9.5)));
    v.w = Math.ceil(canvas.width / v.scale);
    v.h = Math.ceil(canvas.height / v.scale);
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();

  // Fehler sichtbar machen (hilfreich beim Testen auf dem Handy)
  window.addEventListener('error', e => { try { FC.ui.toast('Fehler: ' + (e.message || e), 5000); } catch (_) {} });
  window.addEventListener('unhandledrejection', e => { try { FC.ui.toast('Fehler: ' + ((e.reason && e.reason.message) || e.reason), 5000); } catch (_) {} });

  /* ───── Titel-Hintergrund ───── */
  const title = { t: 0, mons: [1, 4, 7, 17, 23, 26].map((sp, i) => ({ sp, x: i * 70, ph: i * 1.3 })) };
  function renderTitle(dt) {
    title.t += dt;
    const v = FC.view;
    const s = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / 220));
    const W = Math.ceil(canvas.width / s), H = Math.ceil(canvas.height / s);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a1a4a'); g.addColorStop(0.55, '#e8705a'); g.addColorStop(0.75, '#f8c070');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.62, 26, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 40; i++) { if ((title.t / 400 + i) % 5 > 1) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect((i * 97) % W, (i * 31) % Math.floor(H * 0.4), 1, 1); } }
    // Hügel
    for (const [base, col, amp, sp] of [[0.72, '#3a5a4a', 14, 0.01], [0.8, '#2a4a3a', 10, 0.02], [0.88, '#1c3428', 6, 0.035]]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) ctx.lineTo(x, H * base + Math.sin((x + title.t * sp) / 40) * amp);
      ctx.lineTo(W, H); ctx.fill();
    }
    // Monster laufen über den Horizont
    for (const m of title.mons) {
      m.x += dt * 0.02;
      if (m.x > W + 40) m.x = -70 - Math.random() * 60;
      const y = H * 0.88 - 56 + Math.abs(Math.sin(title.t / 260 + m.ph)) * -6;
      ctx.drawImage(FC.gfx.monster(m.sp), Math.round(m.x), Math.round(y));
    }
  }

  /* ───── Spiel-Loop ───── */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    FC.anim.update(dt);
    if (FC.mode === 'world') {
      FC.world.update(dt);
      ctx.setTransform(FC.view.scale, 0, 0, FC.view.scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      FC.world.render(ctx, FC.view.w, FC.view.h);
    } else if (FC.mode === 'battle') {
      FC.battle.update(dt);
      FC.battle.render(ctx);
    } else if (FC.mode === 'title') {
      renderTitle(dt);
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#120e1c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(frame);
  }

  /* ───── Titelbildschirm ───── */
  function showTitle() {
    FC.mode = 'title';
    const t = U.$('title');
    t.classList.remove('hidden');
    t.innerHTML = '';
    const logo = U.el('div', 'logo', '<h1>AURELIA</h1><p>MONSTER · CHRONIKEN</p>');
    t.appendChild(logo);
    const box = U.el('div', 'title-box');
    const slots = FC.save.list();
    const lastSlot = FC.save.lastSlot();
    let cont = null;
    if (lastSlot && slots[lastSlot - 1] && !slots[lastSlot - 1].broken) cont = lastSlot;
    else { const i = slots.findIndex(s => s && !s.broken); if (i >= 0) cont = i + 1; }
    if (cont) {
      const sl = slots[cont - 1];
      const b = U.el('button', 'btn primary', `Fortsetzen<br><small style="font-weight:400;font-size:14px">${U.esc(sl.name)} · ${sl.badges} Orden · ${sl.caught} gefangen · ${U.fmtTime(sl.time)}</small>`);
      b.addEventListener('click', () => continueGame(cont));
      box.appendChild(b);
    }
    const nb = U.el('button', 'btn' + (cont ? '' : ' primary'), 'Neues Spiel');
    nb.addEventListener('click', () => newGameSlot());
    box.appendChild(nb);
    if (slots.some(s => s)) {
      const lb = U.el('button', 'btn', 'Spielstand wählen');
      lb.addEventListener('click', () => slotPicker('load'));
      box.appendChild(lb);
    }
    const ob = U.el('button', 'btn', 'Optionen & Import');
    ob.addEventListener('click', () => { FC.menu.options(true); });
    box.appendChild(ob);
    if (!FC.save.available()) box.appendChild(U.el('div', 'note warn', 'Achtung: Dein Browser erlaubt keinen lokalen Speicher (privater Modus?). Fortschritt geht beim Schließen verloren – nutze den Export-Code.'));
    t.appendChild(box);
    t.appendChild(U.el('div', 'tap-hint', 'Tippe für Ton'));
    t.appendChild(U.el('div', 'version', `v${FC.VERSION} · Ein Fan-Monsterabenteuer mit eigenen Kreaturen`));
    const unlock = () => { FC.audio.unlock(); FC.audio.play('title'); const h = t.querySelector('.tap-hint'); if (h) h.remove(); };
    t.addEventListener('pointerdown', unlock, { once: true });
    FC.audio.play('title');
  }

  function slotPicker(mode) {
    const ui = FC.ui.sheet(mode === 'load' ? 'Spielstand wählen' : 'Speicherplatz für neues Spiel');
    const layer = FC.input.push({ onB: done, onA() {}, onStart: done });
    function done() { FC.input.pop(layer); FC.ui.closePanel(); }
    ui.closeBtn.addEventListener('click', done);
    const list = U.el('div', 'list');
    FC.save.list().forEach((sl, i) => {
      const n = i + 1;
      const row = U.el('div', 'row-card slot-card');
      row.innerHTML = `<div class="grow"><div class="t1"><span>Platz ${n}</span><span>${sl && !sl.broken ? U.fmtTime(sl.time) : ''}</span></div><div class="t2">${sl ? (sl.broken ? 'Beschädigt' : `${U.esc(sl.name)} · ${sl.badges} Orden · ${sl.caught} gefangen · ${U.esc((FC.data.MAPS[sl.map] || {}).name || '')}`) : 'Leer'}</div></div>`;
      const act = U.el('button', 'btn primary', mode === 'load' ? 'Laden' : (sl ? 'Überschreiben' : 'Hier starten'));
      act.disabled = mode === 'load' && (!sl || sl.broken);
      act.addEventListener('click', async () => {
        if (mode === 'load') { done(); continueGame(n); return; }
        if (sl && !act.dataset.sure) { act.dataset.sure = '1'; act.textContent = 'Sicher? Nochmal tippen'; return; }
        done(); startNew(n);
      });
      row.appendChild(act);
      if (sl && mode === 'load') {
        const del = U.el('button', 'btn', 'Löschen');
        del.addEventListener('click', () => { if (!del.dataset.sure) { del.dataset.sure = '1'; del.textContent = 'Wirklich löschen?'; return; } FC.save.remove(n); done(); showTitle(); });
        row.appendChild(del);
      }
      list.appendChild(row);
    });
    ui.body.appendChild(list);
  }
  function newGameSlot() {
    FC.audio.unlock();
    const slots = FC.save.list();
    const free = slots.findIndex(s => !s);
    if (free >= 0 && !slots.some(s => s)) { startNew(free + 1); return; }
    slotPicker('new');
  }

  async function enterWorld(state, slot, isNew) {
    FC.state = state; FC.slot = slot;
    FC.save.setLastSlot(slot);
    U.$('title').classList.add('hidden');
    FC.input.clear();
    FC.input.push(FC.world.layer);
    await FC.ui.fade(true, false, 250);
    if (isNew) {
      FC.mode = 'intro';
      FC.audio.play('indoor');
      await FC.ui.fade(false, false, 200);
      await FC.game.intro();
      await FC.ui.fade(true, false, 300);
    }
    FC.mode = 'world';
    const p = state.player;
    FC.world.load(p.map, p.x, p.y, p.dir);
    U.$('hud').classList.remove('hidden');
    U.$('controls').classList.remove('hidden');
    await FC.ui.fade(false, false, 400);
    if (isNew) {
      FC.game.autosave();
      FC.ui.toast('Tipp: Steuerkreuz zum Laufen, A zum Sprechen – oder einfach irgendwo hintippen!', 4200);
    } else FC.ui.toast(`Willkommen zurück, ${p.name}!`);
  }
  function startNew(slot) {
    FC.audio.unlock();
    enterWorld(FC.game.newState('Alex'), slot, true);
  }
  function continueGame(slot) {
    FC.audio.unlock();
    const s = FC.save.load(slot);
    if (!s) { FC.ui.toast('Spielstand konnte nicht geladen werden.'); return; }
    if (!FC.data.MAPS[s.player.map]) { s.player.map = 'morgentau'; s.player.x = 9; s.player.y = 5; }
    enterWorld(s, slot, false);
  }

  // Sicherheitsnetz: beim Verlassen der Seite speichern
  document.addEventListener('visibilitychange', () => { if (document.hidden && FC.state && FC.mode === 'world' && !FC.world.locked) FC.game.autosave(); });
  window.addEventListener('pagehide', () => { if (FC.state && FC.mode === 'world' && !FC.world.locked) FC.game.autosave(); });

  /* ───── Boot ───── */
  function boot() {
    FC.input.bindTouch();
    FC.battle.initUi();
    // Grafiken vorwärmen
    for (let i = 1; i <= FC.data.DEX_MAX; i++) FC.gfx.monster(i);
    U.$('boot').remove();
    showTitle();
    requestAnimationFrame(t => { last = t; frame(t); });
  }
  const ready = () => (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]) : Promise.resolve());
  ready().then(boot);

  // Test-Hilfe (nur für automatisierte Tests)
  FC._debug = { startNew, continueGame, enterWorld };
})();
