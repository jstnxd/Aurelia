'use strict';
/* Typen und Effektivitätstabelle (eigenes System, 10 Typen) */
FC.data.TYPES = {
  normal:  { n: 'Normal',  c: '#9a9184' },
  feuer:   { n: 'Feuer',   c: '#ea6a32' },
  wasser:  { n: 'Wasser',  c: '#3f86e8' },
  pflanze: { n: 'Pflanze', c: '#4cad40' },
  elektro: { n: 'Elektro', c: '#d9ab12' },
  stein:   { n: 'Gestein', c: '#a5834f' },
  flug:    { n: 'Flug',    c: '#7f95e2' },
  kaefer:  { n: 'Käfer',   c: '#8aa61e' },
  geist:   { n: 'Geist',   c: '#6e52a0' },
  psycho:  { n: 'Psycho',  c: '#e2508c' },
};

// Angreifer-Typ -> { Verteidiger-Typ: Multiplikator } (fehlend = 1)
FC.data.CHART = {
  normal:  { stein: 0.5, geist: 0 },
  feuer:   { pflanze: 2, kaefer: 2, feuer: 0.5, wasser: 0.5, stein: 0.5 },
  wasser:  { feuer: 2, stein: 2, wasser: 0.5, pflanze: 0.5 },
  pflanze: { wasser: 2, stein: 2, feuer: 0.5, pflanze: 0.5, flug: 0.5, kaefer: 0.5 },
  elektro: { wasser: 2, flug: 2, pflanze: 0.5, elektro: 0.5, stein: 0.5 },
  stein:   { feuer: 2, flug: 2, kaefer: 2, elektro: 2, pflanze: 0.5 },
  flug:    { pflanze: 2, kaefer: 2, elektro: 0.5, stein: 0.5 },
  kaefer:  { pflanze: 2, psycho: 2, feuer: 0.5, flug: 0.5, geist: 0.5 },
  geist:   { geist: 2, psycho: 2, normal: 0 },
  psycho:  { stein: 2, psycho: 0.5, kaefer: 0.5 },
};

FC.data.typeEff = function (atk, defTypes) {
  let m = 1;
  const row = FC.data.CHART[atk] || {};
  for (const d of defTypes) if (row[d] !== undefined) m *= row[d];
  return m;
};

FC.data.STATUS = {
  brn: { n: 'Verbrennung', s: 'BRN', c: '#e8603a' },
  psn: { n: 'Vergiftung', s: 'GFT', c: '#9a4ab8' },
  par: { n: 'Paralyse', s: 'PAR', c: '#c9a20a' },
  slp: { n: 'Schlaf', s: 'SLF', c: '#7a7a92' },
};

FC.data.typeChip = t => `<span class="type-chip" style="background:${FC.data.TYPES[t].c}">${FC.data.TYPES[t].n}</span>`;
