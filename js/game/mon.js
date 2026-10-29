'use strict';
/* Monster-Instanzen: Werte, Erfahrung, Level-Aufstieg, Attacken, Entwicklung */
FC.mon = (function () {
  const D = FC.data, U = FC.U;
  const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

  function sp(m) { return D.MON[m.sp]; }
  function expFor(lvl) { return lvl <= 1 ? 0 : Math.floor(lvl * lvl * lvl * 0.5); }
  function movesAt(spId, lvl) {
    const ls = D.MON[spId].ls.filter(([l]) => l <= lvl).map(([, m]) => m);
    const uniq = [];
    for (const m of ls) { const i = uniq.indexOf(m); if (i >= 0) uniq.splice(i, 1); uniq.push(m); }
    return uniq.slice(-4);
  }
  function create(spId, lvl, opts = {}) {
    const iv = {};
    for (const k of KEYS) iv[k] = U.ri(0, 31);
    const m = {
      uid: U.uid(), sp: spId, lvl, exp: expFor(lvl), iv,
      moves: (opts.moves || movesAt(spId, lvl)).map(id => ({ id, pp: D.MOVES[id].pp })),
      status: null, slp: 0, hp: 0, nick: opts.nick || null,
    };
    m.hp = stats(m).hp;
    return m;
  }
  function stats(m) {
    const b = sp(m).b, o = {};
    KEYS.forEach((k, i) => {
      const base = Math.floor(((2 * b[i] + m.iv[k]) * m.lvl) / 100);
      o[k] = k === 'hp' ? base + m.lvl + 10 : base + 5;
    });
    return o;
  }
  function name(m) { return m.nick || sp(m).n; }
  function types(m) { return sp(m).t; }
  function maxHp(m) { return stats(m).hp; }
  function heal(m) {
    m.hp = maxHp(m); m.status = null; m.slp = 0;
    for (const mv of m.moves) mv.pp = D.MOVES[mv.id].pp;
  }
  function expProgress(m) {
    if (m.lvl >= 100) return 1;
    const a = expFor(m.lvl), b = expFor(m.lvl + 1);
    return U.clamp((m.exp - a) / (b - a), 0, 1);
  }
  // Fügt EP hinzu; liefert Ereignisliste [{type:'level', lvl}, {type:'learn', move}]
  function gainExp(m, amount) {
    const ev = [];
    if (m.lvl >= 100) return ev;
    m.exp += amount;
    while (m.lvl < 100 && m.exp >= expFor(m.lvl + 1)) {
      const before = maxHp(m);
      m.lvl++;
      const after = maxHp(m);
      if (m.hp > 0) m.hp += after - before;
      ev.push({ type: 'level', lvl: m.lvl });
      for (const [l, mv] of sp(m).ls) if (l === m.lvl && !m.moves.some(x => x.id === mv)) ev.push({ type: 'learn', move: mv });
      const e = sp(m).evo;
      if (e && e.lvl && m.lvl >= e.lvl) m.evoPending = e.to;
    }
    return ev;
  }
  function evolve(m) {
    const before = maxHp(m);
    const to = m.evoPending;
    m.sp = to; m.evoPending = null;
    m.hp = Math.max(1, m.hp + maxHp(m) - before);
    const learned = [];
    for (const [l, mv] of sp(m).ls) if (l === m.lvl && !m.moves.some(x => x.id === mv)) learned.push(mv);
    return learned;
  }
  function expYield(enemy, trainer) {
    return Math.max(1, Math.floor((sp(enemy).xp * enemy.lvl) / 5 * (trainer ? 1.5 : 1)));
  }
  return { create, stats, name, types, maxHp, heal, expFor, expProgress, gainExp, evolve, movesAt, expYield, sp };
})();
