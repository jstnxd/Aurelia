'use strict';
/* Chiptune-Audio über WebAudio: eigene Musikstücke + Soundeffekte (keine Fremddateien).
   iOS erfordert eine Berührung, bevor Ton abgespielt werden darf → unlock(). */
FC.audio = (function () {
  let ctx = null, master = null, musicGain = null, sfxGain = null, noiseBuf = null;
  let vol = { music: 0.55, sfx: 0.8 };
  let current = null, timer = null;

  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(n) {
    const m = /^([A-G]#?)(\d)$/.exec(n);
    if (!m) return 0;
    const midi = 12 * (+m[2] + 1) + NOTE[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function parse(str) { return str.trim().split(/\s+/).map(t => { const [n, d] = t.split(':'); return [n, +d]; }); }

  // Eigene Kompositionen (Notenlängen in Achteln)
  const TRACKS = {
    town: { bpm: 112, voices: [
      { wave: 'square', gain: 0.10, notes: parse('C5:2 E5:2 G5:2 E5:2 F5:2 A5:2 G5:4 E5:2 D5:2 C5:2 D5:2 E5:4 G4:4 C5:2 E5:2 G5:2 C6:2 B5:2 A5:2 G5:4 F5:2 E5:2 D5:2 E5:2 C5:8') },
      { wave: 'triangle', gain: 0.22, notes: parse('C3:4 G3:4 F3:4 C3:4 A2:4 E3:4 G2:4 G3:4 C3:4 E3:4 F3:4 G3:4 F3:4 G3:4 C3:8') },
    ] },
    route: { bpm: 138, voices: [
      { wave: 'square', gain: 0.09, notes: parse('G4:1 B4:1 D5:2 D5:1 E5:1 D5:2 B4:2 G4:2 A4:2 B4:2 C5:1 B4:1 A4:2 F#4:2 D4:2 E4:2 F#4:2 G4:2 A4:2 B4:2 D5:2 G5:4 F#5:2 E5:2 D5:4 B4:4 A4:4 G4:8') },
      { wave: 'triangle', gain: 0.22, notes: parse('G2:4 D3:4 G2:4 D3:4 C3:4 G3:4 D3:4 D3:4 E3:4 B2:4 C3:4 D3:4 G2:4 C3:4 D3:4 G2:4') },
      { wave: 'noise', gain: 0.035, notes: parse('x:2 -:2 x:1 x:1 -:2 x:2 -:2 x:1 x:1 -:2') },
    ] },
    indoor: { bpm: 96, voices: [
      { wave: 'triangle', gain: 0.16, notes: parse('E5:2 G5:2 C6:4 B5:2 G5:2 A5:4 F5:2 A5:2 D6:4 C6:2 B5:2 G5:4 E5:2 G5:2 C6:4 D6:2 E6:2 D6:4 C6:2 B5:2 A5:2 B5:2 C6:8') },
      { wave: 'triangle', gain: 0.14, notes: parse('C3:8 F3:8 D3:8 G3:8 A2:8 F3:8 G3:8 C3:8') },
    ] },
    battle: { bpm: 168, voices: [
      { wave: 'square', gain: 0.09, notes: parse('A4:1 A4:1 C5:1 A4:1 E5:2 D5:1 C5:1 B4:1 B4:1 D5:1 B4:1 E5:2 D5:1 B4:1 A4:1 A4:1 C5:1 E5:1 A5:2 G5:1 E5:1 F5:2 E5:2 D5:2 B4:2') },
      { wave: 'triangle', gain: 0.24, notes: parse('A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1 F2:1 F3:1 F2:1 F3:1 F2:1 F3:1 F2:1 F3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1') },
      { wave: 'noise', gain: 0.05, notes: parse('x:1 -:1 x:1 x:1') },
    ] },
    boss: { bpm: 184, voices: [
      { wave: 'square', gain: 0.09, notes: parse('E5:1 E5:1 D5:1 E5:1 G5:2 E5:2 D5:1 D5:1 C5:1 D5:1 F5:2 D5:2 C5:1 C5:1 B4:1 C5:1 E5:2 C5:2 B4:2 G#4:2 B4:2 E5:2') },
      { wave: 'square', gain: 0.05, notes: parse('A3:2 E4:2 A3:2 E4:2 G3:2 D4:2 G3:2 D4:2 F3:2 C4:2 F3:2 C4:2 E3:2 B3:2 E3:2 G#3:2') },
      { wave: 'triangle', gain: 0.24, notes: parse('A2:2 A2:2 A2:2 A2:2 G2:2 G2:2 G2:2 G2:2 F2:2 F2:2 F2:2 F2:2 E2:2 E2:2 E2:2 E2:2') },
      { wave: 'noise', gain: 0.06, notes: parse('x:1 x:1 -:1 x:1') },
    ] },
    title: { bpm: 100, voices: [
      { wave: 'square', gain: 0.09, notes: parse('E5:3 D5:1 C5:2 G4:2 A4:3 B4:1 C5:4 E5:3 F5:1 G5:2 E5:2 D5:8 C5:3 D5:1 E5:2 G5:2 A5:3 G5:1 E5:4 F5:2 E5:2 D5:2 B4:2 C5:8') },
      { wave: 'triangle', gain: 0.22, notes: parse('C3:8 F3:8 C3:8 G3:8 A2:8 E3:8 F3:4 G3:4 C3:8') },
    ] },
  };
  const JINGLES = {
    victory: { bpm: 150, notes: parse('C5:1 E5:1 G5:1 C6:3 A5:1 B5:1 C6:4') },
    heal: { bpm: 140, notes: parse('C5:1 E5:1 G5:1 E5:1 C6:2 G5:2 C6:4') },
    item: { bpm: 170, notes: parse('G5:1 B5:1 D6:1 G6:3') },
    badge: { bpm: 130, notes: parse('C5:1 E5:1 G5:1 C6:2 G5:1 C6:1 E6:2 D6:1 E6:1 G6:4') },
    evolve: { bpm: 120, notes: parse('C5:1 D5:1 E5:1 G5:1 C6:2 E6:2 G6:4') },
  };

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = vol.music; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = vol.sfx; sfxGain.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if (pending) { const p = pending; pending = null; play(p); }
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(dest, f, t, dur, wave, g) {
    if (wave === 'noise') {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const gg = ctx.createGain(); gg.gain.setValueAtTime(g, t); gg.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur, 0.08));
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      s.connect(hp); hp.connect(gg); gg.connect(dest); s.start(t); s.stop(t + 0.1);
      return;
    }
    const o = ctx.createOscillator(); o.type = wave; o.frequency.setValueAtTime(f, t);
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(g, t + 0.01);
    gg.gain.setValueAtTime(g, t + Math.max(0.02, dur - 0.04)); gg.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(gg); gg.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }

  let pending = null;
  function play(name) {
    if (!ctx) { pending = name; return; }
    if (current && current.name === name) return;
    stop();
    const tr = TRACKS[name];
    if (!tr) return;
    const eighth = 60 / tr.bpm / 2;
    current = { name, voices: tr.voices.map(v => ({ v, i: 0, t: ctx.currentTime + 0.08 })) };
    const cur = current;
    timer = setInterval(() => {
      if (cur !== current) return;
      const horizon = ctx.currentTime + 0.25;
      for (const vs of cur.voices) {
        while (vs.t < horizon) {
          const [n, d] = vs.v.notes[vs.i];
          const dur = d * eighth;
          if (n !== '-') tone(musicGain, n === 'x' ? 0 : freq(n), vs.t, dur * 0.92, vs.v.wave, vs.v.gain);
          vs.t += dur; vs.i = (vs.i + 1) % vs.v.notes.length;
        }
      }
    }, 60);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; current = null; pending = null; }

  function jingle(name) {
    if (!ctx) return 0;
    const j = JINGLES[name];
    const eighth = 60 / j.bpm / 2;
    let t = ctx.currentTime + 0.05;
    for (const [n, d] of j.notes) { tone(sfxGain, freq(n), t, d * eighth * 0.95, 'square', 0.12); tone(sfxGain, freq(n) / 2, t, d * eighth * 0.95, 'triangle', 0.16); t += d * eighth; }
    return (t - ctx.currentTime) * 1000;
  }

  // Soundeffekte
  function sfx(name) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const g = sfxGain;
    const sweep = (f1, f2, dur, wave, gain) => {
      const o = ctx.createOscillator(); o.type = wave; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const gg = ctx.createGain(); gg.gain.setValueAtTime(gain, t); gg.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(gg); gg.connect(g); o.start(t); o.stop(t + dur + 0.02);
    };
    switch (name) {
      case 'blip': tone(g, 880, t, 0.05, 'square', 0.08); break;
      case 'blip_soft': tone(g, 1320, t, 0.018, 'square', 0.025); break;
      case 'select': tone(g, 660, t, 0.05, 'square', 0.08); tone(g, 990, t + 0.05, 0.07, 'square', 0.08); break;
      case 'back': tone(g, 520, t, 0.05, 'square', 0.07); tone(g, 390, t + 0.05, 0.06, 'square', 0.07); break;
      case 'bump': sweep(140, 70, 0.08, 'square', 0.12); break;
      case 'door': sweep(300, 600, 0.12, 'triangle', 0.25); break;
      case 'hit': tone(g, 0, t, 0.12, 'noise', 0.35); sweep(220, 60, 0.15, 'square', 0.12); break;
      case 'superhit': tone(g, 0, t, 0.2, 'noise', 0.45); sweep(320, 50, 0.25, 'square', 0.16); break;
      case 'weakhit': tone(g, 0, t, 0.08, 'noise', 0.2); break;
      case 'faint': sweep(600, 80, 0.6, 'square', 0.12); break;
      case 'throw': sweep(300, 900, 0.25, 'triangle', 0.25); break;
      case 'shake': tone(g, 200, t, 0.06, 'square', 0.1); tone(g, 160, t + 0.07, 0.06, 'square', 0.1); break;
      case 'catch': tone(g, 784, t, 0.08, 'square', 0.1); tone(g, 1046, t + 0.09, 0.15, 'square', 0.1); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => tone(g, f, t + i * 0.07, 0.08, 'square', 0.1)); break;
      case 'encounter': [392, 440, 523, 587, 659, 784].forEach((f, i) => tone(g, f, t + i * 0.05, 0.06, 'square', 0.1)); break;
      case 'stat_up': sweep(400, 1200, 0.3, 'triangle', 0.25); break;
      case 'stat_down': sweep(1200, 300, 0.3, 'triangle', 0.25); break;
      case 'heal': sweep(500, 1000, 0.35, 'sine', 0.25); break;
      case 'exclaim': tone(g, 1200, t, 0.08, 'square', 0.1); tone(g, 1500, t + 0.08, 0.1, 'square', 0.1); break;
      case 'save': [784, 988, 1175].forEach((f, i) => tone(g, f, t + i * 0.08, 0.08, 'triangle', 0.2)); break;
    }
  }

  function setVolume(kind, v) {
    vol[kind] = v;
    if (kind === 'music' && musicGain) musicGain.gain.value = v;
    if (kind === 'sfx' && sfxGain) sfxGain.gain.value = v;
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  return { unlock, play, stop, sfx, jingle, setVolume, get vol() { return vol; }, get playing() { return current && current.name; } };
})();
