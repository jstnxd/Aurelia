'use strict';
/* UI-Bausteine: Dialoge mit Schreibmaschinen-Effekt, Auswahlmenüs, Toasts, Überblendungen, Eingabe */
FC.ui = (function () {
  const U = FC.U;
  const dlg = () => U.$('dialog');

  function cps() { const s = (FC.settings && FC.settings.textSpeed) || 2; return [0, 28, 50, 110][s] || 50; }

  // Text tippen; gibt Steuerobjekt zurück
  function typeInto(el, text, done) {
    let i = 0, finished = false, raf = null, last = performance.now(), acc = 0;
    el.textContent = '';
    const step = now => {
      acc += (now - last) * cps() / 1000; last = now;
      const n = Math.floor(acc);
      if (n > 0) { acc -= n; i = Math.min(text.length, i + n); el.textContent = text.slice(0, i); if (i % 3 === 0 && text[i - 1] !== ' ') FC.audio.sfx('blip_soft'); }
      if (i >= text.length) { finished = true; done && done(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return {
      get done() { return finished; },
      skip() { if (finished) return; cancelAnimationFrame(raf); i = text.length; el.textContent = text; finished = true; done && done(); },
    };
  }

  function fill(text, vars) {
    const s = FC.state;
    return String(text).replace(/\{name\}/g, s ? s.player.name : 'Du').replace(/\{rival\}/g, 'Kai');
  }

  // Ein oder mehrere Textseiten anzeigen
  function say(lines, name, opts = {}) {
    if (!Array.isArray(lines)) lines = [lines];
    lines = lines.map(fill);
    return new Promise(resolve => {
      const box = dlg(), txt = U.$('dialog-text');
      U.$('dialog-name').textContent = name || '';
      box.classList.remove('hidden');
      let idx = 0, ctl = null;
      const layer = FC.input.push({
        name: 'dialog',
        onA: adv, onB: adv, onTap: adv, onStart: () => {},
      });
      const onDown = e => { e.preventDefault(); adv(); };
      box.addEventListener('pointerdown', onDown);
      function show() {
        box.classList.remove('ready');
        ctl = typeInto(txt, lines[idx], () => box.classList.add('ready'));
      }
      function adv() {
        if (!ctl) return;
        if (!ctl.done) { ctl.skip(); return; }
        idx++;
        if (idx >= lines.length) {
          FC.input.pop(layer); box.removeEventListener('pointerdown', onDown);
          if (!opts.keep) box.classList.add('hidden');
          resolve();
          return;
        }
        FC.audio.sfx('blip');
        show();
      }
      show();
    });
  }

  // Auswahl: optionaler Fragetext im Dialog, dann Liste. Rückgabe: Index oder -1
  async function choose(question, options, opts = {}) {
    if (question) await say(question, opts.name, { keep: true });
    return new Promise(resolve => {
      const box = U.$('choice');
      box.innerHTML = '';
      box.classList.remove('hidden');
      let sel = 0;
      const btns = options.map((o, i) => {
        const b = U.el('button', 'choice-btn', U.esc(o));
        b.addEventListener('click', e => { e.preventDefault(); finish(i); });
        box.appendChild(b);
        return b;
      });
      const mark = () => btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
      mark();
      const cancel = opts.cancel !== false;
      const layer = FC.input.push({
        name: 'choice',
        onDir(d) { if (d === 'up') sel = (sel + options.length - 1) % options.length; if (d === 'down') sel = (sel + 1) % options.length; FC.audio.sfx('blip'); mark(); },
        onA() { finish(sel); },
        onB() { if (cancel) finish(-1); },
        onStart() {},
      });
      function finish(i) {
        FC.input.pop(layer);
        box.classList.add('hidden');
        dlg().classList.add('hidden');
        FC.audio.sfx(i < 0 ? 'back' : 'select');
        resolve(i);
      }
    });
  }
  async function yesNo(q, name) { return (await choose(q, ['Ja', 'Nein'], { name })) === 0; }

  let toastT = null;
  function toast(text, ms = 2200) {
    const t = U.$('toast');
    t.textContent = text; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
  }
  let mapNameT = null;
  function mapName(text) {
    const el = U.$('map-name');
    el.textContent = text; el.classList.add('show');
    clearTimeout(mapNameT); mapNameT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function fade(on, white, ms = 260) {
    const f = U.$('fade');
    f.classList.toggle('white', !!white);
    f.style.transitionDuration = ms + 'ms';
    f.classList.toggle('on', on);
    return new Promise(r => setTimeout(r, ms + 20));
  }

  // Panel-Grundgerüst (Menüs); gibt {sheet, body, close} zurück
  function sheet(title, opts = {}) {
    const panel = U.$('panel');
    panel.innerHTML = '';
    panel.classList.remove('hidden');
    const sh = U.el('div', 'sheet');
    const head = U.el('div', 'sheet-head');
    head.appendChild(U.el('h2', '', U.esc(title)));
    if (opts.money) head.appendChild(U.el('span', 'money', U.money(FC.state.money)));
    const x = U.el('button', 'x-btn', '✕');
    x.setAttribute('aria-label', 'Schließen');
    head.appendChild(x);
    const body = U.el('div', 'sheet-body');
    sh.appendChild(head); sh.appendChild(body); panel.appendChild(sh);
    return { panel, sheet: sh, body, head, closeBtn: x };
  }
  function closePanel() { const p = U.$('panel'); p.classList.add('hidden'); p.innerHTML = ''; }

  // Monster-Vorschaukarte (z. B. bei der Starter-Wahl)
  function monCard(spId) {
    const sp = FC.data.MON[spId];
    const panel = U.$('panel');
    panel.innerHTML = '';
    panel.classList.remove('hidden');
    panel.style.alignItems = 'flex-start';
    const sh = U.el('div', 'sheet');
    sh.style.maxWidth = '360px'; sh.style.marginTop = '4vh';
    const body = U.el('div', 'sheet-body');
    const cv = monCanvas(spId, 128);
    cv.style.width = '128px'; cv.style.height = '128px';
    const wrap = U.el('div', 'detail');
    wrap.appendChild(cv);
    wrap.appendChild(U.el('div', '', `<div style="font-size:24px;font-weight:700">${U.esc(sp.n)}</div><div style="margin:6px 0">${sp.t.map(FC.data.typeChip).join('')}</div><div style="font-size:15px;color:#5a4e66">${U.esc(sp.dex)}</div>`));
    body.appendChild(wrap); sh.appendChild(body); panel.appendChild(sh);
    return () => { panel.style.alignItems = ''; closePanel(); };
  }
  function monCanvas(spId, size = 64, sil) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(sil ? FC.gfx.monsterSil(spId, '#2a2236') : FC.gfx.monster(spId), 0, 0);
    return c;
  }

  // Texteingabe (Spielername)
  function prompt(title, def, max = 10) {
    return new Promise(resolve => {
      const ui = sheet(title);
      ui.closeBtn.remove();
      ui.sheet.style.maxWidth = '420px';
      const inp = U.el('input');
      inp.type = 'text'; inp.value = def; inp.maxLength = max;
      inp.autocomplete = 'off'; inp.spellcheck = false;
      Object.assign(inp.style, { width: '100%', fontSize: '22px', padding: '12px', border: '3px solid #2a2036', borderRadius: '12px', fontFamily: 'inherit', userSelect: 'text', webkitUserSelect: 'text' });
      const ok = U.el('button', 'btn primary', 'Bestätigen');
      const row = U.el('div', 'btn-row'); row.appendChild(ok);
      ui.body.appendChild(inp); ui.body.appendChild(row);
      const layer = FC.input.push({ name: 'prompt', onA() {}, onB() {}, onStart() {} });
      const done = () => {
        const v = inp.value.trim().replace(/[<>]/g, '').slice(0, max) || def;
        FC.input.pop(layer); closePanel(); FC.audio.sfx('select'); resolve(v);
      };
      ok.addEventListener('click', done);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); done(); } });
      setTimeout(() => { try { inp.focus(); inp.select(); } catch (_) {} }, 50);
    });
  }

  return { say, choose, yesNo, toast, mapName, fade, sheet, closePanel, monCard, monCanvas, prompt, fill };
})();
