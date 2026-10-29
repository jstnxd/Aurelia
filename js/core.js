'use strict';
/* Aurelia Chroniken – Kern: Namespace, Hilfsfunktionen, Animations-Manager */
window.FC = {
  VERSION: '0.1.0',
  SAVE_VERSION: 1,
  T: 16,              // Kachelgröße in Pixeln
  data: {},
  gfx: {},
  state: null,        // aktueller Spielstand
  mode: 'boot',       // boot | title | world | battle | cutscene
};

(function () {
  const U = FC.U = {};
  U.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  U.chance = p => Math.random() < p;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.pick = a => a[Math.floor(Math.random() * a.length)];
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.seeded = seed => {
    let s = (seed >>> 0) || 123456789;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };
  U.hash = str => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h;
  };
  U.wait = ms => new Promise(r => setTimeout(r, ms));
  U.$ = id => document.getElementById(id);
  U.el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  U.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  U.DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  U.OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  U.fmtTime = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h + ':' + String(m).padStart(2, '0'); };
  U.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  U.weighted = list => { // [[value, weight], ...]
    let t = 0; for (const [, w] of list) t += w;
    let r = Math.random() * t;
    for (const [v, w] of list) { r -= w; if (r <= 0) return v; }
    return list[list.length - 1][0];
  };
  U.money = n => n.toLocaleString('de-DE') + ' Taler';
})();

/* Zeitbasierter Tween-/Animations-Manager (läuft im Spiel-Loop, pausiert mit ihm) */
FC.anim = {
  list: [],
  ease: {
    linear: p => p,
    outQuad: p => 1 - (1 - p) * (1 - p),
    inQuad: p => p * p,
    inOutQuad: p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
    outBack: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  },
  tween(obj, props, dur, ease) {
    return new Promise(res => {
      const from = {};
      for (const k in props) from[k] = obj[k];
      this.list.push({ obj, from, to: props, dur: Math.max(1, dur), t: 0, ease: this.ease[ease || 'outQuad'], res });
    });
  },
  delay(ms) { return this.tween({ v: 0 }, { v: 1 }, ms, 'linear'); },
  update(dt) {
    if (!this.list.length) return;
    const done = [];
    for (const a of this.list) {
      a.t += dt;
      const p = Math.min(1, a.t / a.dur), e = a.ease(p);
      for (const k in a.to) a.obj[k] = a.from[k] + (a.to[k] - a.from[k]) * e;
      if (p >= 1) done.push(a);
    }
    if (done.length) {
      this.list = this.list.filter(a => !done.includes(a));
      for (const a of done) a.res();
    }
  },
};
