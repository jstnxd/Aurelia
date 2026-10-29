'use strict';
/* Attacken. c: phys | spec | status, p: Stärke, a: Genauigkeit (fehlt = trifft immer), pp,
   prio: Priorität, eff: Nebeneffekt {chance, status | stat+tgt}, status/stat+tgt bei Statusattacken,
   drain/recoil: Anteil des Schadens, heal: Anteil der Max-KP */
FC.data.MOVES = {
  rempler:      { n: 'Rempler',        t: 'normal',  c: 'phys', p: 40, a: 100, pp: 35, d: 'Ein kräftiger Körperstoß.' },
  kratzer:      { n: 'Kratzer',        t: 'normal',  c: 'phys', p: 40, a: 100, pp: 35, d: 'Kratzt mit scharfen Krallen.' },
  blitzsprint:  { n: 'Blitzsprint',    t: 'normal',  c: 'phys', p: 40, a: 100, pp: 30, prio: 1, d: 'Greift fast immer zuerst an.' },
  biss:         { n: 'Biss',           t: 'normal',  c: 'phys', p: 60, a: 100, pp: 25, d: 'Beißt kräftig zu.' },
  wuchtangriff: { n: 'Wuchtangriff',   t: 'normal',  c: 'phys', p: 85, a: 90,  pp: 15, recoil: 0.25, d: 'Starker Angriff mit Rückstoß.' },
  drohfauchen:  { n: 'Drohfauchen',    t: 'normal',  c: 'status', a: 100, pp: 40, stat: { atk: -1 }, tgt: 'foe', d: 'Senkt den Angriff des Gegners.' },
  spottwedel:   { n: 'Spottwedel',     t: 'normal',  c: 'status', a: 100, pp: 30, stat: { def: -1 }, tgt: 'foe', d: 'Senkt die Verteidigung des Gegners.' },
  kampfgeist:   { n: 'Kampfgeist',     t: 'normal',  c: 'status', pp: 20, stat: { atk: 2 }, tgt: 'self', d: 'Erhöht den eigenen Angriff stark.' },
  atempause:    { n: 'Atempause',      t: 'normal',  c: 'status', pp: 10, heal: 0.5, tgt: 'self', d: 'Heilt die Hälfte der KP.' },

  panzerhaut:   { n: 'Panzerhaut',     t: 'stein',   c: 'status', pp: 30, stat: { def: 1 }, tgt: 'self', d: 'Erhöht die eigene Verteidigung.' },
  staubwolke:   { n: 'Staubwolke',     t: 'stein',   c: 'status', a: 100, pp: 15, stat: { acc: -1 }, tgt: 'foe', d: 'Senkt die Genauigkeit des Gegners.' },
  kieselhagel:  { n: 'Kieselhagel',    t: 'stein',   c: 'phys', p: 50, a: 90, pp: 15, d: 'Wirft einen Hagel aus Kieseln.' },
  geroellfalle: { n: 'Geröllfalle',    t: 'stein',   c: 'phys', p: 60, a: 95, pp: 15, eff: { chance: 1, stat: { spe: -1 }, tgt: 'foe' }, d: 'Senkt die Initiative des Gegners.' },
  erdbrecher:   { n: 'Erdbrecher',     t: 'stein',   c: 'phys', p: 80, a: 100, pp: 10, d: 'Spaltet den Boden.' },

  funkenflug:   { n: 'Funkenflug',     t: 'feuer',   c: 'spec', p: 40, a: 100, pp: 25, eff: { chance: 0.1, status: 'brn' }, d: 'Kann verbrennen.' },
  glutrad:      { n: 'Glutrad',        t: 'feuer',   c: 'phys', p: 60, a: 100, pp: 20, eff: { chance: 0.1, status: 'brn' }, d: 'Rollt in Flammen gehüllt.' },
  feuersbrunst: { n: 'Feuersbrunst',   t: 'feuer',   c: 'spec', p: 90, a: 100, pp: 15, eff: { chance: 0.1, status: 'brn' }, d: 'Eine gewaltige Feuerwelle.' },

  perlblasen:   { n: 'Perlblasen',     t: 'wasser',  c: 'spec', p: 40, a: 100, pp: 30, d: 'Schießt schillernde Blasen.' },
  wellenschlag: { n: 'Wellenschlag',   t: 'wasser',  c: 'phys', p: 60, a: 100, pp: 20, d: 'Trifft mit einer Welle.' },
  hochdruck:    { n: 'Hochdruckstrahl', t: 'wasser', c: 'spec', p: 85, a: 100, pp: 10, d: 'Ein scharfer Wasserstrahl.' },

  peitschenranke: { n: 'Peitschenranke', t: 'pflanze', c: 'phys', p: 45, a: 100, pp: 25, d: 'Schlägt mit Ranken zu.' },
  saftsauger:   { n: 'Saftsauger',     t: 'pflanze', c: 'spec', p: 40, a: 100, pp: 25, drain: 0.5, d: 'Heilt um die Hälfte des Schadens.' },
  blaettersturm: { n: 'Blättersturm',  t: 'pflanze', c: 'spec', p: 65, a: 100, pp: 20, d: 'Ein Wirbel scharfer Blätter.' },
  traumsporen:  { n: 'Traumsporen',    t: 'pflanze', c: 'status', a: 75, pp: 15, status: 'slp', tgt: 'foe', d: 'Lässt den Gegner einschlafen.' },
  giftnebel:    { n: 'Giftnebel',      t: 'pflanze', c: 'status', a: 75, pp: 30, status: 'psn', tgt: 'foe', d: 'Vergiftet den Gegner.' },

  stromschlag:  { n: 'Stromschlag',    t: 'elektro', c: 'spec', p: 40, a: 100, pp: 30, eff: { chance: 0.1, status: 'par' }, d: 'Kann paralysieren.' },
  funkenhieb:   { n: 'Funkenhieb',     t: 'elektro', c: 'phys', p: 65, a: 100, pp: 20, eff: { chance: 0.3, status: 'par' }, d: 'Elektrischer Sprungangriff.' },
  gewitterlanze: { n: 'Gewitterlanze', t: 'elektro', c: 'spec', p: 90, a: 100, pp: 15, eff: { chance: 0.1, status: 'par' }, d: 'Ein gebündelter Blitz.' },
  laehmfeld:    { n: 'Lähmfeld',       t: 'elektro', c: 'status', a: 90, pp: 20, status: 'par', tgt: 'foe', d: 'Paralysiert den Gegner.' },

  boee:         { n: 'Böe',            t: 'flug',    c: 'spec', p: 40, a: 100, pp: 35, d: 'Ein scharfer Windstoß.' },
  schwingenhieb: { n: 'Schwingenhieb', t: 'flug',    c: 'phys', p: 60, a: 100, pp: 35, d: 'Schlägt mit den Flügeln.' },
  falkensturz:  { n: 'Falkensturz',    t: 'flug',    c: 'phys', p: 80, a: 95, pp: 15, d: 'Stürzt sich aus großer Höhe herab.' },

  zangengriff:  { n: 'Zangengriff',    t: 'kaefer',  c: 'phys', p: 60, a: 100, pp: 20, d: 'Packt mit kräftigen Zangen zu.' },
  seidennetz:   { n: 'Seidennetz',     t: 'kaefer',  c: 'status', a: 95, pp: 40, stat: { spe: -2 }, tgt: 'foe', d: 'Senkt die Initiative stark.' },
  stachelstich: { n: 'Stachelstich',   t: 'kaefer',  c: 'phys', p: 20, a: 100, pp: 35, eff: { chance: 0.3, status: 'psn' }, d: 'Kann vergiften.' },
  schuppenwind: { n: 'Schuppenwind',   t: 'kaefer',  c: 'spec', p: 60, a: 100, pp: 20, d: 'Wirbelt glitzernde Schuppen auf.' },

  schattensprung: { n: 'Schattensprung', t: 'geist', c: 'phys', p: 40, a: 100, pp: 30, prio: 1, d: 'Greift aus dem Schatten zuerst an.' },
  geistergriff: { n: 'Geistergriff',   t: 'geist',   c: 'phys', p: 30, a: 100, pp: 30, eff: { chance: 0.3, status: 'par' }, d: 'Eine eisige Berührung.' },
  nachtkugel:   { n: 'Nachtkugel',     t: 'geist',   c: 'spec', p: 80, a: 100, pp: 15, eff: { chance: 0.2, stat: { spd: -1 }, tgt: 'foe' }, d: 'Eine Kugel aus Dunkelheit.' },
  spukflamme:   { n: 'Spukflamme',     t: 'geist',   c: 'status', a: 85, pp: 15, status: 'brn', tgt: 'foe', d: 'Verbrennt den Gegner.' },

  gedankenwelle: { n: 'Gedankenwelle', t: 'psycho',  c: 'spec', p: 50, a: 100, pp: 25, d: 'Ein Stoß reiner Gedankenkraft.' },
  mondstrahl:   { n: 'Mondstrahl',     t: 'psycho',  c: 'spec', p: 65, a: 100, pp: 20, d: 'Ein silbriger Lichtstrahl.' },
  geisteskraft: { n: 'Geisteskraft',   t: 'psycho',  c: 'spec', p: 90, a: 100, pp: 10, d: 'Mächtige telekinetische Kraft.' },
  schlummerblick: { n: 'Schlummerblick', t: 'psycho', c: 'status', a: 60, pp: 20, status: 'slp', tgt: 'foe', d: 'Hypnotisiert den Gegner.' },
  fokus:        { n: 'Fokus',          t: 'psycho',  c: 'status', pp: 20, stat: { spa: 1, spd: 1 }, tgt: 'self', d: 'Erhöht Sp.-Angriff und Sp.-Vert.' },
};
