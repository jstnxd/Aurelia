'use strict';
/* Eingabe: Touch-Steuerkreuz, A/B, Menü, Tastatur, Antippen.
   Eingaben gehen an die oberste "Ebene" (Welt, Dialog, Menü, Kampf …). */
FC.input = (function () {
  const U = FC.U;
  const held = { up: false, down: false, left: false, right: false, a: false, b: false };
  let dirStack = [];
  const layers = [];

  function top() { return layers[layers.length - 1] || null; }
  function fire(btn, arg) {
    const l = top();
    if (!l) return;
    FC.audio && FC.audio.unlock();
    const fn = l['on' + btn];
    if (fn) fn.call(l, arg);
  }
  function setDir(d, on) {
    if (on) {
      if (!held[d]) { held[d] = true; dirStack = dirStack.filter(x => x !== d); dirStack.push(d); fire('Dir', d); }
    } else if (held[d]) { held[d] = false; dirStack = dirStack.filter(x => x !== d); }
  }

  // ── Tastatur ──
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Space: 'a', Enter: 'a', KeyX: 'b', Backspace: 'b', ShiftLeft: 'b', ShiftRight: 'b', Escape: 'start', KeyM: 'start',
  };
  window.addEventListener('keydown', e => {
    const k = KEYMAP[e.code];
    if (!k) return;
    if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    e.preventDefault();
    if (k === 'a' || k === 'b') { const was = held[k]; held[k] = true; if (!e.repeat && !was) fire(k === 'a' ? 'A' : 'B'); }
    else if (k === 'start') { if (!e.repeat) fire('Start'); }
    else setDir(k, true);
  });
  window.addEventListener('keyup', e => {
    const k = KEYMAP[e.code];
    if (!k) return;
    if (k === 'a' || k === 'b') held[k] = false;
    else if (k !== 'start') setDir(k, false);
  });
  window.addEventListener('blur', () => { for (const d of ['up', 'down', 'left', 'right']) setDir(d, false); held.a = held.b = false; });

  // ── Touch ──
  function bindTouch() {
    const dpad = U.$('dpad');
    const arms = { up: dpad.querySelector('.dp-up'), down: dpad.querySelector('.dp-down'), left: dpad.querySelector('.dp-left'), right: dpad.querySelector('.dp-right') };
    let dpId = null, cur = null;
    const upd = e => {
      const r = dpad.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      let d = null;
      if (Math.hypot(dx, dy) > 12) d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (d !== cur) {
        if (cur) { setDir(cur, false); arms[cur].classList.remove('on'); }
        cur = d;
        if (cur) { setDir(cur, true); arms[cur].classList.add('on'); }
      }
    };
    const end = e => {
      if (e.pointerId !== dpId) return;
      dpId = null;
      if (cur) { setDir(cur, false); arms[cur].classList.remove('on'); cur = null; }
    };
    dpad.addEventListener('pointerdown', e => { e.preventDefault(); dpId = e.pointerId; try { dpad.setPointerCapture(e.pointerId); } catch (_) {} FC.input.cancelAuto(); upd(e); });
    dpad.addEventListener('pointermove', e => { if (e.pointerId === dpId) upd(e); });
    dpad.addEventListener('pointerup', end);
    dpad.addEventListener('pointercancel', end);
    dpad.addEventListener('lostpointercapture', end);

    for (const [id, k] of [['btn-a', 'a'], ['btn-b', 'b']]) {
      const el = U.$(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); held[k] = true; el.classList.add('on'); fire(k === 'a' ? 'A' : 'B'); });
      const rel = () => { held[k] = false; el.classList.remove('on'); };
      el.addEventListener('pointerup', rel); el.addEventListener('pointercancel', rel); el.addEventListener('pointerleave', rel);
    }
    U.$('btn-menu').addEventListener('click', () => fire('Start'));

    // Antippen der Spielfläche
    const cv = U.$('screen');
    let sx = 0, sy = 0, st = 0;
    cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; st = performance.now(); FC.audio && FC.audio.unlock(); });
    cv.addEventListener('pointerup', e => {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 24 || performance.now() - st > 600) return;
      const l = top();
      if (!l) return;
      if (l.onTap) l.onTap(e.clientX, e.clientY);
      else if (l.onA) fire('A');
    });

    // Zoom- und Scroll-Gesten verhindern
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
    document.addEventListener('touchmove', e => {
      if (!e.target.closest || !e.target.closest('.sheet-body, #choice, #title, textarea, input[type=range]')) e.preventDefault();
    }, { passive: false });
    document.addEventListener('contextmenu', e => e.preventDefault());
  }

  return {
    held, bindTouch, fire,
    dir() { return dirStack.length ? dirStack[dirStack.length - 1] : null; },
    push(l) { layers.push(l); return l; },
    pop(l) { const i = layers.lastIndexOf(l); if (i >= 0) layers.splice(i, 1); },
    top,
    isTop(l) { return top() === l; },
    clear() { layers.length = 0; },
    cancelAuto() { if (FC.world) FC.world.autoPath = null; },
  };
})();
