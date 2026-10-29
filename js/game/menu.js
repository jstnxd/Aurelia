'use strict';
/* Menüs: Pausemenü, Team, Tasche, Bestiarium, Karte, Speichern, Optionen, Laden, PC-Box */
FC.menu = (function () {
  const U = FC.U, D = FC.data, G = FC.gfx, M = FC.mon;
  const S = () => FC.state;
  let layer = null, onClose = null;

  function openLayer(back) {
    if (layer) FC.input.pop(layer);
    layer = FC.input.push({ name: 'menu', onB: back, onStart: close, onA() {}, onDir() {} });
  }
  function close() {
    if (layer) FC.input.pop(layer);
    layer = null;
    FC.ui.closePanel();
    FC.audio.sfx('back');
    if (onClose) { const f = onClose; onClose = null; f(); }
  }

  function icon(kind) {
    const c = G.canvas(16, 16), x = c.getContext('2d');
    const r = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    switch (kind) {
      case 'team': G.capsule(x, 8, 8, '#e8603a'); break;
      case 'bag': r(3, 5, 10, 9, '#c8803a'); r(3, 5, 10, 2, '#a05a2a'); r(6, 2, 4, 1, '#7a4a2a'); r(5, 3, 1, 2, '#7a4a2a'); r(10, 3, 1, 2, '#7a4a2a'); r(7, 8, 2, 2, '#f0d060'); break;
      case 'dex': r(3, 2, 10, 12, '#d84a4a'); r(4, 3, 8, 10, '#f05a5a'); r(5, 5, 6, 4, '#bfe6fb'); r(6, 11, 2, 1, '#ffe060'); break;
      case 'map': r(2, 3, 12, 10, '#e8dcb0'); r(5, 3, 1, 10, '#c8b880'); r(10, 3, 1, 10, '#c8b880'); r(3, 6, 4, 3, '#7ac05a'); r(8, 8, 4, 2, '#5a9ad8'); r(11, 4, 2, 2, '#e04a4a'); break;
      case 'save': r(3, 2, 10, 12, '#3a5ab0'); r(5, 2, 6, 4, '#e8e8f0'); r(5, 9, 6, 5, '#f4f4f4'); r(9, 3, 1, 2, '#3a5ab0'); break;
      case 'opt': x.fillStyle = '#7a7a8a'; x.beginPath(); x.arc(8, 8, 5.5, 0, Math.PI * 2); x.fill(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; r(Math.round(8 + Math.cos(a) * 6) - 1, Math.round(8 + Math.sin(a) * 6) - 1, 2, 2, '#7a7a8a'); } r(6, 6, 4, 4, '#e8e8f0'); break;
    }
    G.outline(c);
    c.className = 'ic';
    return c;
  }

  /* ───── Hauptmenü ───── */
  function open(cb) {
    onClose = cb || null;
    FC.audio.sfx('select');
    main();
  }
  function main() {
    const s = S();
    const ui = FC.ui.sheet('Menü', { money: true });
    ui.closeBtn.addEventListener('click', close);
    openLayer(close);
    const grid = U.el('div', 'menu-grid');
    const tiles = [
      ['team', 'Team', team, s.party.length > 0],
      ['bag', 'Tasche', () => bag(), true],
      ['dex', 'Bestiarium', dex, !!s.flags.dex],
      ['map', 'Karte', regionMap, true],
      ['save', 'Speichern', saveScreen, true],
      ['opt', 'Optionen', options, true],
    ];
    for (const [ic, label, fn, en] of tiles) {
      const b = U.el('button', 'menu-tile');
      b.appendChild(icon(ic));
      b.appendChild(U.el('span', '', label + (en ? '' : ' <small style="font-weight:400;color:#9a8ea6">(gesperrt)</small>')));
      b.disabled = !en; if (!en) b.style.opacity = 0.55;
      b.addEventListener('click', () => { if (!en) return; FC.audio.sfx('select'); fn(); });
      grid.appendChild(b);
    }
    ui.body.appendChild(grid);
    const info = U.el('div', 'note');
    info.style.marginTop = '12px';
    const caught = Object.keys(s.dex.caught).length;
    info.innerHTML = `<b>${U.esc(s.player.name)}</b> · Orden: ${s.flags.badge1 ? 'Felsorden' : 'keine'} · Bestiarium: ${caught}/${D.DEX_MAX} · Spielzeit ${U.fmtTime(s.playtime || 0)}<br>Ort: ${U.esc(FC.world.map.def.name)}`;
    ui.body.appendChild(info);
  }
  function backBtn(ui, to) { ui.closeBtn.textContent = '←'; ui.closeBtn.setAttribute('aria-label', 'Zurück'); ui.closeBtn.addEventListener('click', () => { FC.audio.sfx('back'); to(); }); openLayer(() => { FC.audio.sfx('back'); to(); }); }

  /* ───── Team ───── */
  function monRow(m, i, extra) {
    const max = M.maxHp(m), r = m.hp / max;
    const row = U.el('button', 'row-card' + (i === 0 ? ' lead' : '') + (m.hp <= 0 ? ' fainted' : ''),
      `<div class="grow"><div class="t1"><span>${U.esc(M.name(m))}</span><span>Lv. ${m.lvl}</span></div>
       <div class="t2">${M.types(m).map(D.typeChip).join('')} ${m.hp}/${max} KP${m.status ? ' · ' + D.STATUS[m.status].n : ''}${extra || ''}</div>
       <div class="mini-hp"><i class="${r <= 0.2 ? 'low' : r <= 0.5 ? 'mid' : ''}" style="width:${(r * 100).toFixed(0)}%"></i></div></div>`);
    row.prepend(FC.ui.monCanvas(m.sp));
    return row;
  }
  function team() {
    const s = S();
    const ui = FC.ui.sheet('Team');
    backBtn(ui, main);
    const list = U.el('div', 'list');
    s.party.forEach((m, i) => {
      const row = monRow(m, i);
      row.addEventListener('click', () => { FC.audio.sfx('select'); monDetail(m, team); });
      list.appendChild(row);
    });
    ui.body.appendChild(list);
    ui.body.appendChild(U.el('div', 'note', 'Tippe auf ein Monster für Details. Das oberste Monster kämpft zuerst.'));
    ui.body.lastChild.style.marginTop = '10px';
  }
  function monDetail(m, back) {
    const s = S(), sp = M.sp(m), st = M.stats(m);
    const ui = FC.ui.sheet(M.name(m));
    backBtn(ui, back);
    const wrap = U.el('div', 'detail');
    const cv = FC.ui.monCanvas(m.sp);
    wrap.appendChild(cv);
    const next = m.lvl < 100 ? M.expFor(m.lvl + 1) - m.exp : 0;
    const info = U.el('div', '', `<div style="font-size:20px;font-weight:700">${U.esc(sp.n)} · Lv. ${m.lvl}</div>
      <div style="margin:6px 0">${sp.t.map(D.typeChip).join('')}</div>
      <div style="font-size:15px"><b>Fähigkeit:</b> ${D.ABILITIES[sp.ab].n} – ${D.ABILITIES[sp.ab].d}</div>
      <div style="font-size:14px;color:#5a4e66;margin-top:4px">Noch ${next} EP bis Level ${m.lvl + 1}${sp.evo ? ` · Entwickelt sich ab Lv. ${sp.evo.lvl}` : ''}</div>`);
    wrap.appendChild(info);
    ui.body.appendChild(wrap);
    const tbl = U.el('table', 'stat-table');
    tbl.innerHTML = [['KP', `${m.hp} / ${st.hp}`], ['Angriff', st.atk], ['Verteidigung', st.def], ['Sp.-Angriff', st.spa], ['Sp.-Verteidigung', st.spd], ['Initiative', st.spe]]
      .map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
    tbl.style.marginTop = '10px';
    ui.body.appendChild(tbl);
    const ml = U.el('div', 'move-list');
    for (const mv of m.moves) {
      const d = D.MOVES[mv.id];
      ml.appendChild(U.el('div', 'move-pill', `${d.n}<small>${D.TYPES[d.t].n} · ${d.c === 'status' ? 'Status' : 'Stärke ' + d.p} · AP ${mv.pp}/${d.pp}</small>`)).style.background = D.TYPES[d.t].c;
    }
    ui.body.appendChild(ml);
    const row = U.el('div', 'btn-row');
    const idx = s.party.indexOf(m);
    if (idx > 0) {
      const lead = U.el('button', 'btn primary', 'An die Spitze');
      lead.addEventListener('click', () => { s.party.splice(idx, 1); s.party.unshift(m); FC.ui.toast(`${M.name(m)} kämpft jetzt zuerst.`); FC.audio.sfx('select'); team(); });
      row.appendChild(lead);
    }
    if (idx >= 0) {
      const heal = U.el('button', 'btn', 'Gegenstand benutzen');
      heal.addEventListener('click', () => bag(m, () => monDetail(m, back)));
      row.appendChild(heal);
    }
    ui.body.appendChild(row);
  }

  /* ───── Tasche ───── */
  function usable(k, m) {
    const it = D.ITEMS[k];
    if (it.kind === 'heal') return m.hp > 0 && m.hp < M.maxHp(m);
    if (it.kind === 'cure') return m.hp > 0 && !!m.status && (it.cure === 'all' || it.cure === m.status);
    if (it.kind === 'revive') return m.hp <= 0;
    return false;
  }
  function applyItem(k, m) {
    const s = S(), it = D.ITEMS[k];
    s.bag[k]--;
    if (it.kind === 'heal') { const before = m.hp; m.hp = Math.min(M.maxHp(m), m.hp + it.heal); FC.ui.toast(`${M.name(m)} wurde um ${m.hp - before} KP geheilt.`); }
    if (it.kind === 'cure') { m.status = null; m.slp = 0; FC.ui.toast(`${M.name(m)} ist wieder gesund.`); }
    if (it.kind === 'revive') { m.hp = Math.floor(M.maxHp(m) / 2); FC.ui.toast(`${M.name(m)} ist wieder bei Bewusstsein!`); }
    FC.audio.sfx('heal');
  }
  function bag(target, back) {
    const s = S();
    back = back || main;
    const ui = FC.ui.sheet(target ? `Tasche → ${M.name(target)}` : 'Tasche', { money: true });
    backBtn(ui, back);
    const list = U.el('div', 'list');
    const keys = Object.keys(D.ITEMS).filter(k => s.bag[k] > 0);
    if (!keys.length) list.appendChild(U.el('div', 'note', 'Deine Tasche ist leer.'));
    for (const k of keys) {
      const it = D.ITEMS[k];
      const row = U.el('button', 'row-card', `<canvas width="16" height="16"></canvas><div class="grow"><div class="t1"><span>${it.n}</span><span>× ${s.bag[k]}</span></div><div class="t2">${it.d}</div></div>`);
      const c = row.querySelector('canvas'); c.style.width = '40px'; c.style.height = '40px';
      G.capsule(c.getContext('2d'), 8, 8, it.c);
      row.addEventListener('click', () => {
        if (it.kind === 'ball') { FC.ui.toast('Fangkapseln kannst du nur im Kampf gegen wilde Monster einsetzen.'); return; }
        if (target) {
          if (!usable(k, target)) { FC.ui.toast('Das hätte keine Wirkung.'); return; }
          applyItem(k, target); bag(target, back); return;
        }
        pickTarget(k);
      });
      list.appendChild(row);
    }
    ui.body.appendChild(list);
  }
  function pickTarget(k) {
    const s = S();
    const ui = FC.ui.sheet(`${D.ITEMS[k].n} → auf wen?`);
    backBtn(ui, () => bag());
    const list = U.el('div', 'list');
    s.party.forEach((m, i) => {
      const row = monRow(m, i);
      row.addEventListener('click', () => {
        if (!usable(k, m)) { FC.ui.toast('Das hätte keine Wirkung.'); return; }
        applyItem(k, m);
        if (s.bag[k] > 0) pickTarget(k); else bag();
      });
      list.appendChild(row);
    });
    ui.body.appendChild(list);
  }

  /* ───── Bestiarium ───── */
  function dex() {
    const s = S();
    const ui = FC.ui.sheet(`Bestiarium · ${Object.keys(s.dex.caught).length}/${D.DEX_MAX}`);
    backBtn(ui, main);
    const grid = U.el('div', 'dex-grid');
    for (let i = 1; i <= D.DEX_MAX; i++) {
      const sp = D.MON[i], c = s.dex.caught[i], sn = s.dex.seen[i];
      const cell = U.el('button', 'dex-cell' + (sn ? '' : ' unseen'));
      if (sn) cell.appendChild(FC.ui.monCanvas(i, 64, !c));
      else { const ph = U.el('div', '', '?'); Object.assign(ph.style, { height: '64px', fontSize: '34px', lineHeight: '64px' }); cell.appendChild(ph); }
      cell.appendChild(U.el('div', '', `#${String(i).padStart(3, '0')} ${sn ? U.esc(sp.n) : '???'}`));
      if (c) cell.addEventListener('click', () => dexEntry(i));
      grid.appendChild(cell);
    }
    ui.body.appendChild(grid);
    ui.body.appendChild(U.el('div', 'note', 'Gesehene Monster erscheinen als Schatten. Fange sie, um alle Daten freizuschalten.')).style.marginTop = '10px';
  }
  function dexEntry(i) {
    const sp = D.MON[i];
    const ui = FC.ui.sheet(`#${String(i).padStart(3, '0')} ${sp.n}`);
    backBtn(ui, dex);
    const wrap = U.el('div', 'detail');
    wrap.appendChild(FC.ui.monCanvas(i));
    wrap.appendChild(U.el('div', '', `<div style="margin-bottom:6px">${sp.t.map(D.typeChip).join('')}</div><div style="font-size:16px;line-height:1.4">${U.esc(sp.dex)}</div><div style="font-size:14px;color:#5a4e66;margin-top:6px">Fähigkeit: ${D.ABILITIES[sp.ab].n}${sp.evo ? ` · Entwicklung ab Lv. ${sp.evo.lvl} → ${D.MON[sp.evo.to].n}` : ''}</div>`));
    ui.body.appendChild(wrap);
    const names = ['KP', 'Angriff', 'Verteidigung', 'Sp.-Angriff', 'Sp.-Verteidigung', 'Initiative'];
    const tbl = U.el('table', 'stat-table');
    tbl.style.marginTop = '10px';
    tbl.innerHTML = sp.b.map((v, k) => `<tr><td>${names[k]}</td><td><span style="display:inline-block;height:8px;width:${Math.round(v * 0.9)}px;background:${v > 80 ? '#4cc05a' : v > 50 ? '#f2c62e' : '#e8804a'};border-radius:4px;margin-right:6px"></span>${v}</td></tr>`).join('');
    ui.body.appendChild(tbl);
  }

  /* ───── Karte ───── */
  function regionMap() {
    const R = D.REGION;
    const ui = FC.ui.sheet('Karte');
    backBtn(ui, main);
    const c = G.canvas(200, 140), x = c.getContext('2d');
    const r = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    r(0, 0, 200, 140, '#7cc4f4');
    for (let i = 0; i < 40; i++) r((i * 37) % 200, (i * 23) % 140, 6, 1, '#a8dcff');
    // Landmasse
    x.fillStyle = '#8ad060'; x.beginPath(); x.ellipse(70, 72, 62, 58, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#b8b0a0'; x.beginPath(); x.ellipse(40, 22, 26, 16, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#5aa850'; x.beginPath(); x.ellipse(150, 70, 36, 46, 0, 0, Math.PI * 2); x.fill();
    const pos = n => [40 + n.x * 30, 22 + n.y * 24];
    // Wege
    x.strokeStyle = '#e8d090'; x.lineWidth = 4;
    x.beginPath(); const a = pos(R.nodes[0]), b = pos(R.nodes[2]); x.moveTo(a[0] + 30 - 30, a[1]); x.lineTo(b[0], b[1]); x.stroke();
    x.setLineDash([3, 3]); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 2;
    for (const f of R.future) { const p = pos(f); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(p[0], p[1]); x.stroke(); }
    x.setLineDash([]);
    const cur = FC.world.map.def.region;
    for (const n of R.nodes) {
      const [px, py] = pos(n);
      r(px - 5, py - 5, 10, 10, '#1c1626'); r(px - 4, py - 4, 8, 8, n.id === 'route1' ? '#e8d090' : '#f05a3a');
      if (cur && cur[0] === n.x && cur[1] === n.y) { r(px - 2, py - 13, 4, 6, '#ffffff'); r(px - 3, py - 8, 6, 1, '#ffffff'); }
    }
    for (const f of R.future) { const [px, py] = pos(f); r(px - 4, py - 4, 8, 8, '#1c1626'); r(px - 3, py - 3, 6, 6, '#8a8a9a'); }
    c.className = 'region-map';
    ui.body.appendChild(c);
    const legend = U.el('div', 'list');
    legend.style.marginTop = '10px';
    legend.innerHTML = `<div class="note"><b>${R.name}</b><br>Aktueller Ort: <b>${U.esc(FC.world.map.def.name)}</b><br>Freigeschaltet: ${R.nodes.map(n => n.label).join(' · ')}<br>Noch unerforscht: ${R.future.map(f => f.label).join(' · ')} (folgen in kommenden Versionen)</div>`;
    ui.body.appendChild(legend);
  }

  /* ───── Speichern ───── */
  function saveScreen() {
    const ui = FC.ui.sheet('Speichern');
    backBtn(ui, main);
    if (!FC.save.available()) ui.body.appendChild(U.el('div', 'note warn', 'Der Browser blockiert lokalen Speicher (z. B. im privaten Modus). Nutze den Export-Code unter „Optionen“, um deinen Fortschritt zu sichern.'));
    const list = U.el('div', 'list');
    const slots = FC.save.list();
    slots.forEach((sl, i) => {
      const n = i + 1;
      const row = U.el('button', 'row-card slot-card' + (FC.slot === n ? ' lead' : ''),
        `<div class="grow"><div class="t1"><span>Platz ${n}${FC.slot === n ? ' (aktuell)' : ''}</span><span>${sl && !sl.broken ? U.fmtTime(sl.time) : ''}</span></div>
         <div class="t2">${sl ? (sl.broken ? 'Beschädigt' : `${U.esc(sl.name)} · ${sl.badges} Orden · ${sl.caught} gefangen · ${new Date(sl.saved).toLocaleString('de-DE')}`) : 'Leer'}</div></div>`);
      row.addEventListener('click', async () => {
        if (sl && FC.slot !== n) {
          FC.input.pop(layer); FC.ui.closePanel(); layer = null;
          const ok = await FC.ui.yesNo(`Platz ${n} enthält bereits einen Spielstand. Überschreiben?`);
          if (!ok) { saveScreen(); return; }
        }
        FC.slot = n;
        FC.world.syncPlayer();
        const ok = FC.save.write(n, S());
        if (ok) { FC.save.setLastSlot(n); FC.audio.sfx('save'); FC.ui.toast(`Gespeichert auf Platz ${n}.`); }
        else FC.ui.toast('Speichern fehlgeschlagen – nutze den Export-Code.');
        saveScreen();
      });
      list.appendChild(row);
    });
    ui.body.appendChild(list);
    const n = U.el('div', 'note', 'Das Spiel speichert automatisch bei jedem Kartenwechsel und nach jedem Kampf. <br><b>Wichtig für iPhone:</b> Safari kann Website-Daten löschen, wenn du die Seite länger nicht öffnest oder den Verlauf leerst. Sichere wichtige Spielstände zusätzlich über <b>Optionen → Export-Code</b>.');
    n.style.marginTop = '10px';
    ui.body.appendChild(n);
  }

  /* ───── Optionen ───── */
  function options(fromTitle) {
    const st = FC.settings;
    const ui = FC.ui.sheet('Optionen');
    if (fromTitle === true) { ui.closeBtn.addEventListener('click', close); openLayer(close); }
    else backBtn(ui, main);
    const mk = (label, key) => {
      const row = U.el('div', 'slider-row', `<label>${label}</label>`);
      const inp = U.el('input'); inp.type = 'range'; inp.min = 0; inp.max = 1; inp.step = 0.05; inp.value = st[key];
      const val = U.el('span', '', Math.round(st[key] * 100) + '%'); val.style.width = '48px';
      inp.addEventListener('input', () => { st[key] = +inp.value; FC.audio.setVolume(key, st[key]); val.textContent = Math.round(st[key] * 100) + '%'; FC.save.saveSettings(st); });
      inp.addEventListener('change', () => FC.audio.sfx('blip'));
      row.appendChild(inp); row.appendChild(val);
      return row;
    };
    ui.body.appendChild(mk('Musik', 'music'));
    ui.body.appendChild(mk('Effekte', 'sfx'));
    const ts = U.el('div', 'slider-row', '<label>Text</label>');
    const tg = U.el('div', 'btn-row'); tg.style.margin = '0';
    ['Langsam', 'Normal', 'Schnell'].forEach((l, i) => {
      const b = U.el('button', 'btn' + (st.textSpeed === i + 1 ? ' primary' : ''), l);
      b.style.minHeight = '44px'; b.style.padding = '8px 12px';
      b.addEventListener('click', () => { st.textSpeed = i + 1; FC.save.saveSettings(st); options(fromTitle); });
      tg.appendChild(b);
    });
    ts.appendChild(tg); ui.body.appendChild(ts);

    if (FC.state) {
      ui.body.appendChild(U.el('h3', '', 'Spielstand exportieren'));
      const ta = U.el('textarea', 'code'); ta.readOnly = true; ta.value = FC.save.exportCode(S());
      const cp = U.el('button', 'btn blue', 'Code kopieren');
      cp.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(ta.value); FC.ui.toast('Code kopiert! Bewahre ihn z. B. in Notizen auf.'); }
        catch (e) { ta.focus(); ta.select(); FC.ui.toast('Bitte Text markieren und kopieren.'); }
      });
      ui.body.appendChild(ta);
      const r = U.el('div', 'btn-row'); r.appendChild(cp); ui.body.appendChild(r);
    }
    ui.body.appendChild(U.el('h3', '', 'Spielstand importieren'));
    const ti = U.el('textarea', 'code'); ti.placeholder = 'Export-Code hier einfügen (beginnt mit AUR1:)';
    const im = U.el('button', 'btn', 'Code laden');
    im.addEventListener('click', () => {
      try {
        const s = FC.save.importCode(ti.value);
        const slot = FC.slot || 1;
        FC.save.write(slot, s); FC.save.setLastSlot(slot);
        FC.ui.toast('Import erfolgreich! Lade Spielstand …');
        setTimeout(() => location.reload(), 700);
      } catch (e) { FC.ui.toast('Import fehlgeschlagen: ' + e.message); }
    });
    ui.body.appendChild(ti);
    const r2 = U.el('div', 'btn-row'); r2.appendChild(im);
    if (FC.state) {
      const tt = U.el('button', 'btn', 'Zum Titelbildschirm');
      tt.addEventListener('click', () => { FC.game.autosave(); location.reload(); });
      r2.appendChild(tt);
    }
    ui.body.appendChild(r2);
    const v = U.el('div', 'note', `Version ${FC.VERSION} · Spielstand-Format v${FC.SAVE_VERSION}. Steuerung: Steuerkreuz bewegen · A sprechen/bestätigen · B gedrückt halten = rennen / zurück · Antippen = hinlaufen.`);
    v.style.marginTop = '12px';
    ui.body.appendChild(v);
  }

  /* ───── Laden (Shop) ───── */
  function shop() {
    return new Promise(resolve => {
      onClose = resolve;
      const render = () => {
        const s = S();
        const ui = FC.ui.sheet('Laden', { money: true });
        ui.closeBtn.addEventListener('click', close);
        openLayer(close);
        const list = U.el('div', 'list');
        for (const k of D.SHOP(s)) {
          const it = D.ITEMS[k];
          const row = U.el('button', 'row-card', `<canvas width="16" height="16"></canvas><div class="grow"><div class="t1"><span>${it.n}</span><span>${U.money(it.price)}</span></div><div class="t2">${it.d} · im Besitz: ${s.bag[k] || 0}</div></div>`);
          const c = row.querySelector('canvas'); c.style.width = '40px'; c.style.height = '40px';
          G.capsule(c.getContext('2d'), 8, 8, it.c);
          row.addEventListener('click', () => qty(k));
          list.appendChild(row);
        }
        ui.body.appendChild(list);
        if (!s.flags.badge1) ui.body.appendChild(U.el('div', 'note', 'Mit dem ersten Orden gibt es hier mehr Auswahl!')).style.marginTop = '10px';
      };
      const qty = k => {
        const s = S(), it = D.ITEMS[k];
        const max = Math.min(99, Math.floor(s.money / it.price));
        if (max < 1) { FC.ui.toast('Dafür reicht dein Geld nicht.'); return; }
        let n = 1;
        const ui = FC.ui.sheet(`${it.n} kaufen`, { money: true });
        ui.closeBtn.addEventListener('click', () => render());
        openLayer(() => render());
        const q = U.el('div', 'qty');
        const minus = U.el('button', 'btn', '–'), plus = U.el('button', 'btn', '+'), lab = U.el('span', '', '');
        const upd = () => { lab.innerHTML = `<b>${n}</b> × = ${U.money(n * it.price)}`; };
        minus.addEventListener('click', () => { n = Math.max(1, n - 1); upd(); FC.audio.sfx('blip'); });
        plus.addEventListener('click', () => { n = Math.min(max, n + 1); upd(); FC.audio.sfx('blip'); });
        q.appendChild(minus); q.appendChild(lab); q.appendChild(plus); upd();
        ui.body.appendChild(q);
        const row = U.el('div', 'btn-row'); row.style.justifyContent = 'center';
        const buy = U.el('button', 'btn primary', 'Kaufen');
        buy.addEventListener('click', () => {
          s.money -= n * it.price; s.bag[k] = (s.bag[k] || 0) + n;
          let bonus = '';
          if (k === 'kapsel' && n >= 10) { s.bag.superkapsel = (s.bag.superkapsel || 0) + 1; bonus = ' Als Dankeschön gibt es eine Superkapsel dazu!'; }
          FC.audio.sfx('save'); FC.ui.toast(`Danke für deinen Einkauf!${bonus}`, 2600);
          render();
        });
        row.appendChild(buy); ui.body.appendChild(row);
      };
      render();
    });
  }

  /* ───── PC-Box ───── */
  function pc() {
    return new Promise(resolve => {
      onClose = resolve;
      FC.audio.sfx('select');
      const render = () => {
        const s = S();
        const ui = FC.ui.sheet(`PC-Box · ${s.box.length} Monster`);
        ui.closeBtn.addEventListener('click', close);
        openLayer(close);
        ui.body.appendChild(U.el('h3', '', `Team (${s.party.length}/6) – antippen zum Ablegen`));
        const l1 = U.el('div', 'list');
        s.party.forEach((m, i) => {
          const row = monRow(m, i);
          row.addEventListener('click', () => {
            if (s.party.length <= 1) { FC.ui.toast('Du brauchst mindestens ein Monster im Team.'); return; }
            if (s.party.filter(x => x !== m && x.hp > 0).length === 0) { FC.ui.toast('Mindestens ein kampffähiges Monster muss im Team bleiben.'); return; }
            s.party.splice(i, 1); FC.mon.heal(m); s.box.push(m); FC.audio.sfx('blip'); render();
          });
          l1.appendChild(row);
        });
        ui.body.appendChild(l1);
        ui.body.appendChild(U.el('h3', '', 'Box – antippen zum Mitnehmen'));
        const l2 = U.el('div', 'list');
        if (!s.box.length) l2.appendChild(U.el('div', 'note', 'Die Box ist leer. Gefangene Monster landen hier, wenn dein Team voll ist.'));
        s.box.forEach((m, i) => {
          const row = monRow(m, 1);
          row.addEventListener('click', () => {
            if (s.party.length >= 6) { FC.ui.toast('Dein Team ist voll (6 Monster).'); return; }
            s.box.splice(i, 1); s.party.push(m); FC.audio.sfx('blip'); render();
          });
          l2.appendChild(row);
        });
        ui.body.appendChild(l2);
        ui.body.appendChild(U.el('div', 'note', 'Monster in der Box werden automatisch vollständig geheilt.')).style.marginTop = '10px';
      };
      render();
    });
  }

  return { open, close, shop, pc, options, team };
})();
