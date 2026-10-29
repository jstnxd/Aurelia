'use strict';
/* Karten der ersten Region "Aurelia".
   Kachel-Legende:
   .  Wiese        *  Blumen      G  hohes Gras   T  Baum      ~  Wasser     =  Weg
   s  Sand         R  Felsen      F  Zaun
   #  Wand         W  Fenster     _  Boden        C  Theke     B  Regal      P  PC
   H  Heilgerät    t  Tisch       b  Bett         m  Matte (Ausgang)        X  Leere
   Gebäude, NPCs, Gegenstände und Schilder liegen als Objekte über den Kacheln. */

FC.data.LOOKS = {
  player: { skin: '#f2c9a0', hair: '#3a2a20', shirt: '#d84a3a', pants: '#2f3f6e', hat: '#d84a3a' },
  mom:    { skin: '#f2c9a0', hair: '#8a4a2a', shirt: '#e88aa0', pants: '#e88aa0', long: true },
  prof:   { skin: '#f0c8a0', hair: '#c8c8c8', shirt: '#f4f4f4', pants: '#6a5a4a', coat: true },
  rival:  { skin: '#f2c9a0', hair: '#2a4aa0', shirt: '#3a7ad0', pants: '#2a2a3a' },
  nurse:  { skin: '#f2c9a0', hair: '#e86a9a', shirt: '#ffffff', pants: '#ffffff', hat: '#ffffff', long: true },
  clerk:  { skin: '#e0b090', hair: '#2a2a2a', shirt: '#4aa04a', pants: '#3a3a4a' },
  bug:    { skin: '#f2c9a0', hair: '#6a4a20', shirt: '#c8d84a', pants: '#5a6a3a', hat: '#8ab83a' },
  hiker:  { skin: '#d8a070', hair: '#4a3020', shirt: '#c06a2a', pants: '#5a4a3a', hat: '#7a5a3a' },
  kid:    { skin: '#f2c9a0', hair: '#e0b040', shirt: '#4ac0c0', pants: '#2a5a8a' },
  oldman: { skin: '#e8c098', hair: '#e8e8e8', shirt: '#7a6a9a', pants: '#4a4a5a' },
  lass:   { skin: '#f2c9a0', hair: '#c0602a', shirt: '#f0a040', pants: '#7a3a8a', long: true },
  leader: { skin: '#d8a878', hair: '#6a3a1a', shirt: '#8a6a4a', pants: '#4a3a2a', long: true },
  worker: { skin: '#e0b090', hair: '#2a2a2a', shirt: '#f08a2a', pants: '#3a4a6a', hat: '#f0d02a' },
  woman:  { skin: '#f2c9a0', hair: '#2a2a2a', shirt: '#6a9ad0', pants: '#6a9ad0', long: true },
};

FC.data.TRAINERS = {
  lab_kai: {
    name: 'Rivale Kai', look: 'rival', ai: 1, pay: 200, noBlackout: true,
    team: s => [[s.flags.rivalSp || 4, 5]],
    lose: 'Was?! Ich habe mir doch das stärkere ausgesucht …',
    win: 'Ha! Ich bin eben der geborene Champion!',
  },
  r1_ben: {
    name: 'Käfersammler Ben', look: 'bug', ai: 1, pay: 120,
    team: () => [[14, 4], [14, 5]],
    intro: 'Halt! Meine Käfer wollen gegen dich kämpfen!',
    lose: 'Oh nein, meine armen Krabblys!',
    after: 'Käfer entwickeln sich superschnell. Fang dir doch auch eins!',
  },
  r1_mia: {
    name: 'Wanderin Mia', look: 'lass', ai: 1, pay: 180,
    team: () => [[12, 6], [10, 6]],
    intro: 'Du siehst aus, als bräuchtest du Kampferfahrung!',
    lose: 'Du bist ja richtig gut!',
    after: 'In Kieselstadt gibt es eine Heilstation. Dort werden deine Monster kostenlos geheilt.',
  },
  gym_rolf: {
    name: 'Kletterer Rolf', look: 'hiker', ai: 1, pay: 300,
    team: () => [[19, 9], [19, 10]],
    intro: 'Bevor du zu Petra darfst, musst du an mir vorbei!',
    lose: 'Steinhart … aber nicht hart genug.',
    after: 'Petras Felsrumpel ist zäh. Es übersteht jeden Treffer bei vollen KP!',
  },
  gym_petra: {
    name: 'Arenaleiterin Petra', look: 'leader', ai: 2, pay: 1400, leader: true, items: { supertrank: 1 },
    team: () => [[19, 11], [20, 13]],
    intro: 'Willkommen in der Arena von Kieselstadt! Ich bin Petra. Meine Gesteins-Monster sind hart wie Granit. Zeig mir, ob dein Wille genauso fest ist!',
    lose: 'Unglaublich … Du hast meinen Granit zerschlagen. Du hast dir den Felsorden verdient!',
    after: 'Mit dem Felsorden gehorchen dir Monster bis Level 30. Und im Laden gibt es jetzt neue Waren!',
  },
  kiesel_kai: {
    name: 'Rivale Kai', look: 'rival', ai: 2, pay: 1800, items: { supertrank: 1 },
    team: s => [[(s.flags.rivalSp || 4) + 1, 18], [12, 15], [17, 16]],
    intro: 'Du hast den Felsorden? Ich auch! Mal sehen, wer von uns stärker geworden ist!',
    lose: 'Grr … Na gut. Diesmal hast du gewonnen.',
    after: 'Sobald der Weg nach Norden frei ist, bin ich als Erster da. Wetten?',
  },
};

FC.data.MAPS = {
  /* ───────────── Morgentau ───────────── */
  morgentau: {
    name: 'Morgentau', music: 'town', bg: 'grass', region: [1, 4],
    rows: [
      'TTTTTTTTT==TTTTTTTTT',
      'TT.......==.......TT',
      'TT.......==.......TT',
      'TT.......==.......TT',
      'TT.......==.......TT',
      'TT.......==.......TT',
      'TT.*.....==....*..TT',
      'TT================TT',
      'TT.......==.......TT',
      'TT.......==.......TT',
      'TT.......==.......TT',
      'TT.......==.......TT',
      'TT.*.....==.......TT',
      'TT.......==...~~~~TT',
      'TT.......==...~~~~TT',
      'TT............~~~~TT',
      'TTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
    buildings: [
      { x: 3, y: 2, w: 5, h: 4, style: 'home', door: 5, to: ['haus', 4, 6, 'up'] },
      { x: 12, y: 2, w: 5, h: 4, style: 'house2', door: 14, to: ['nachbar', 4, 6, 'up'] },
      { x: 12, y: 8, w: 6, h: 4, style: 'lab', door: 14, to: ['labor', 5, 8, 'up'] },
    ],
    warps: [
      { x: 9, y: 0, to: ['route1', 9, 28, 'up'] },
      { x: 10, y: 0, to: ['route1', 10, 28, 'up'] },
    ],
    triggers: [
      { x: 9, y: 1, run: 'gateCheck' }, { x: 10, y: 1, run: 'gateCheck' },
    ],
    signs: [
      { x: 8, y: 6, text: 'MORGENTAU\nHier beginnt jedes Abenteuer.' },
      { x: 17, y: 12, text: 'FORSCHUNGSLABOR\nProf. Linde – Monsterforschung' },
    ],
    items: [
      { id: 'mt_h1', x: 2, y: 15, item: 'trank', qty: 1, hidden: true },
    ],
    npcs: [
      { id: 'mt_kid', x: 6, y: 10, dir: 'down', look: 'kid', wander: true,
        text: ['Im hohen Gras leben wilde Monster!', 'Ohne eigenes Monster solltest du da nicht reingehen.'] },
      { id: 'mt_old', x: 12, y: 14, dir: 'right', look: 'oldman', name: 'Opa Gustav', talk: 'oldPond' },
    ],
    objects: [
      { id: 'sparkle', x: 13, y: 15, kind: 'sparkle', cond: s => s.flags.badge1 && !s.flags.schimmerl, run: 'sparkle' },
    ],
  },

  haus: {
    name: 'Zuhause', music: 'indoor', bg: 'indoor', indoor: true, region: [1, 4],
    rows: [
      '##########',
      '##BB#W#W##',
      '__________',
      '__tt______',
      '__tt______',
      'b_________',
      'b_________',
      '____mm____',
    ],
    warps: [
      { x: 4, y: 7, to: ['morgentau', 5, 6, 'down'] },
      { x: 5, y: 7, to: ['morgentau', 5, 6, 'down'] },
    ],
    npcs: [
      { id: 'mom', x: 6, y: 3, dir: 'down', look: 'mom', name: 'Mama', talk: 'mom' },
    ],
  },

  nachbar: {
    name: 'Nachbarhaus', music: 'indoor', bg: 'indoor', indoor: true, region: [1, 4],
    rows: [
      '##########',
      '#W##BBB#W#',
      '__________',
      '______tt__',
      '______tt__',
      '__________',
      '__________',
      '____mm____',
    ],
    warps: [
      { x: 4, y: 7, to: ['morgentau', 14, 6, 'down'] },
      { x: 5, y: 7, to: ['morgentau', 14, 6, 'down'] },
    ],
    npcs: [
      { id: 'nb_lena', x: 3, y: 3, dir: 'down', look: 'woman', name: 'Lena', talk: 'neighbor' },
    ],
  },

  labor: {
    name: 'Labor von Prof. Linde', music: 'indoor', bg: 'indoor', indoor: true, region: [1, 4],
    rows: [
      '############',
      'BBBB#WW#BBBB',
      '____________',
      '____ttt_____',
      '____________',
      'BB________BB',
      '____________',
      '____________',
      '____________',
      '_____mm_____',
    ],
    warps: [
      { x: 5, y: 9, to: ['morgentau', 14, 12, 'down'] },
      { x: 6, y: 9, to: ['morgentau', 14, 12, 'down'] },
    ],
    npcs: [
      { id: 'prof', x: 5, y: 2, dir: 'down', look: 'prof', name: 'Prof. Linde', talk: 'prof' },
      { id: 'kai_lab', x: 8, y: 4, dir: 'left', look: 'rival', name: 'Kai', talk: 'kaiLab', cond: s => !s.flags.rivalDone },
      { id: 'lab_asst', x: 2, y: 7, dir: 'right', look: 'lass', name: 'Assistentin', wander: true,
        text: ['Jedes Monster hat einen oder zwei Typen.', 'Feuer schlägt Pflanze, Pflanze schlägt Wasser, Wasser schlägt Feuer.', 'Und Gestein? Gegen Wasser und Pflanze sieht es schlecht aus!'] },
    ],
    objects: [
      { id: 'cap1', x: 4, y: 3, kind: 'starter', sp: 1, cond: s => s.flags.starterSp !== 1 && s.flags.rivalSp !== 1, run: 'starter' },
      { id: 'cap4', x: 5, y: 3, kind: 'starter', sp: 4, cond: s => s.flags.starterSp !== 4 && s.flags.rivalSp !== 4, run: 'starter' },
      { id: 'cap7', x: 6, y: 3, kind: 'starter', sp: 7, cond: s => s.flags.starterSp !== 7 && s.flags.rivalSp !== 7, run: 'starter' },
    ],
  },

  /* ───────────── Route 1 ───────────── */
  route1: {
    name: 'Route 1', music: 'route', bg: 'grass', region: [1, 2], weather: ['leaves', 'rain', 'none'],
    encounters: { rate: 0.11, table: [[10, 2, 5, 30], [12, 2, 5, 25], [14, 2, 4, 18], [26, 3, 5, 12], [17, 3, 6, 9], [23, 4, 6, 4], [25, 5, 7, 2]] },
    rows: [
      'TTTTTTTTT==TTTTTTTTT',
      'TT.......==......TTT',
      'TT.GGGG..==..GGG..TT',
      'TT.GGGG..==..GGG..TT',
      'TT.GGGG..==..GGG..TT',
      'TT.......==.......TT',
      'TTTTTT...==...TTTTTT',
      'TTTTTT...==...TTTTTT',
      'TT.......==.......TT',
      'TT.GGGGGG==GGGGG..TT',
      'TT.GGGGGG==GGGGG..TT',
      'TT.GGGGGG==GGGGG..TT',
      'TT.......==.......TT',
      'TT.~~~...==...*...TT',
      'TT.~~~...==.......TT',
      'TT.......==..RR...TT',
      'TTTTT....==....TTTTT',
      'TTTTT....==....TTTTT',
      'TT.......==.......TT',
      'TT..GGGG.==.GGGGG.TT',
      'TT..GGGG.==.GGGGG.TT',
      'TT..GGGG.==.GGGGG.TT',
      'TT..GGGG.==.......TT',
      'TT.......==.......TT',
      'TT.*.....==....*..TT',
      'TT.......==.......TT',
      'TTTTTTTT.==.TTTTTTTT',
      'TTTTTTTT.==.TTTTTTTT',
      'TTTTTTTTT==TTTTTTTTT',
      'TTTTTTTTT==TTTTTTTTT',
    ],
    warps: [
      { x: 9, y: 29, to: ['morgentau', 9, 1, 'down'] },
      { x: 10, y: 29, to: ['morgentau', 10, 1, 'down'] },
      { x: 9, y: 0, to: ['kiesel', 12, 20, 'up'] },
      { x: 10, y: 0, to: ['kiesel', 13, 20, 'up'] },
    ],
    signs: [
      { x: 11, y: 27, text: 'ROUTE 1\nNord: Kieselstadt  ·  Süd: Morgentau' },
    ],
    items: [
      { id: 'r1_i1', x: 3, y: 5, item: 'trank', qty: 1 },
      { id: 'r1_i2', x: 16, y: 1, item: 'kapsel', qty: 2 },
      { id: 'r1_h1', x: 8, y: 14, item: 'supertrank', qty: 1, hidden: true },
      { id: 'r1_h2', x: 17, y: 24, item: 'kapsel', qty: 1, hidden: true },
    ],
    npcs: [
      { id: 'r1_ben', x: 5, y: 8, dir: 'right', look: 'bug', name: 'Ben', trainer: 'r1_ben', sight: 5 },
      { id: 'r1_mia', x: 14, y: 18, dir: 'left', look: 'lass', name: 'Mia', trainer: 'r1_mia', sight: 5 },
      { id: 'r1_kid', x: 11, y: 23, dir: 'left', look: 'kid',
        text: ['Tipp: Halte B gedrückt, um zu rennen!', 'Und tippe irgendwo auf den Bildschirm, dann laufe ich… äh, du automatisch dorthin!'] },
    ],
  },

  /* ───────────── Kieselstadt ───────────── */
  kiesel: {
    name: 'Kieselstadt', music: 'town', bg: 'town', region: [1, 0],
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTT=TTT',
      'TT......................TT',
      'TT......................TT',
      'TT......................TT',
      'TT......................TT',
      'TT......................TT',
      'TT......................TT',
      'TT.*........==......*...TT',
      'TT..........==..........TT',
      'TT..........==..........TT',
      'TT..........==..........TT',
      'TT..........==..........TT',
      'TT..........==..........TT',
      'TT..........==..........TT',
      'TT======================TT',
      'TT..........==..........TT',
      'TT..*.......==.....~~~..TT',
      'TT..........==.....~~~..TT',
      'TT..........==..........TT',
      'TTTTTTTTTTT.==.TTTTTTTTTTT',
      'TTTTTTTTTTT.==.TTTTTTTTTTT',
      'TTTTTTTTTTTT==TTTTTTTTTTTT',
    ],
    buildings: [
      { x: 4, y: 10, w: 5, h: 4, style: 'heal', door: 6, to: ['heilstation', 5, 6, 'up'] },
      { x: 16, y: 10, w: 5, h: 4, style: 'shop', door: 18, to: ['laden', 4, 6, 'up'] },
      { x: 9, y: 2, w: 8, h: 5, style: 'arena', door: 12, to: ['arena', 6, 14, 'up'] },
    ],
    warps: [
      { x: 12, y: 21, to: ['route1', 9, 1, 'down'] },
      { x: 13, y: 21, to: ['route1', 10, 1, 'down'] },
    ],
    signs: [
      { x: 11, y: 8, text: 'KIESELSTADT\nDie Stadt aus Stein und Zuversicht.' },
      { x: 17, y: 7, text: 'MONSTER-ARENA KIESELSTADT\nLeiterin: Petra – „Fest wie Fels“' },
    ],
    items: [
      { id: 'ks_i1', x: 23, y: 12, item: 'kapsel', qty: 2 },
      { id: 'ks_h1', x: 3, y: 1, item: 'supertrank', qty: 1, hidden: true },
      { id: 'ks_h2', x: 2, y: 18, item: 'weckruf', qty: 1, hidden: true },
    ],
    npcs: [
      { id: 'ks_worker', x: 22, y: 1, dir: 'down', look: 'worker', name: 'Bauarbeiter',
        text: ['Halt! Ein Erdrutsch hat den Weg nach Norden verschüttet.', 'Wir räumen noch auf. Komm in einer späteren Version wieder!'] },
      { id: 'ks_woman', x: 6, y: 7, dir: 'down', look: 'woman', wander: true,
        text: ['Arenaleiterin Petra setzt auf Gesteins-Monster.', 'Wasser-, Pflanzen- und Psycho-Attacken sind gegen Gestein sehr effektiv!'] },
      { id: 'ks_old', x: 18, y: 17, dir: 'left', look: 'oldman',
        text: ['Gewinnst du gegen Trainer, bekommst du Taler.', 'Im Laden kannst du davon Fangkapseln und Tränke kaufen.'] },
      { id: 'ks_kai', x: 20, y: 5, dir: 'left', look: 'rival', name: 'Kai', trainer: 'kiesel_kai', sight: 0, cond: s => s.flags.badge1 },
    ],
  },

  heilstation: {
    name: 'Heilstation', music: 'indoor', bg: 'indoor', indoor: true, region: [1, 0], healPoint: [5, 3],
    rows: [
      '############',
      '######H##P##',
      '___CCCCC____',
      '____________',
      '____________',
      '_tt______tt_',
      '____________',
      '_____mm_____',
    ],
    warps: [
      { x: 5, y: 7, to: ['kiesel', 6, 14, 'down'] },
      { x: 6, y: 7, to: ['kiesel', 6, 14, 'down'] },
    ],
    npcs: [
      { id: 'nurse', x: 5, y: 1, dir: 'down', look: 'nurse', name: 'Schwester Alma', talk: 'nurse' },
      { id: 'hs_woman', x: 2, y: 4, dir: 'right', look: 'woman',
        text: ['Ist dein Team voll, landen neue Monster in der Box.', 'Am PC dort drüben kannst du sie austauschen.'] },
      { id: 'hs_kid', x: 8, y: 6, dir: 'up', look: 'kid', wander: true,
        text: ['Wenn alle deine Monster besiegt sind, wachst du in der letzten Heilstation wieder auf.', 'Und du verlierst die Hälfte deiner Taler! Autsch.'] },
    ],
  },

  laden: {
    name: 'Laden', music: 'indoor', bg: 'indoor', indoor: true, region: [1, 0],
    rows: [
      '##########',
      '##########',
      'CCC_______',
      '__________',
      '_____BB_BB',
      '_____BB_BB',
      '__________',
      '____mm____',
    ],
    warps: [
      { x: 4, y: 7, to: ['kiesel', 18, 14, 'down'] },
      { x: 5, y: 7, to: ['kiesel', 18, 14, 'down'] },
    ],
    npcs: [
      { id: 'clerk', x: 1, y: 1, dir: 'down', look: 'clerk', name: 'Verkäufer', talk: 'shop' },
      { id: 'ld_cust', x: 3, y: 5, dir: 'right', look: 'lass',
        text: ['Superkapseln gibt es erst, wenn man einen Orden hat.', 'Das ist hier so eine Art Gesetz.'] },
    ],
  },

  arena: {
    name: 'Arena Kieselstadt', music: 'indoor', bg: 'gym', indoor: true, region: [1, 0],
    rows: [
      '##############',
      '##############',
      '______________',
      '_RR________RR_',
      '______________',
      '____RR__RR____',
      '______________',
      '_RR________RR_',
      '______________',
      '____RR__RR____',
      '______________',
      '_RR________RR_',
      '______________',
      '______________',
      '______________',
      '______mm______',
    ],
    warps: [
      { x: 6, y: 15, to: ['kiesel', 12, 7, 'down'] },
      { x: 7, y: 15, to: ['kiesel', 12, 7, 'down'] },
    ],
    npcs: [
      { id: 'petra', x: 6, y: 2, dir: 'down', look: 'leader', name: 'Petra', trainer: 'gym_petra', sight: 0 },
      { id: 'rolf', x: 10, y: 8, dir: 'left', look: 'hiker', name: 'Rolf', trainer: 'gym_rolf', sight: 4 },
      { id: 'guide', x: 4, y: 14, dir: 'right', look: 'kid', name: 'Arena-Guide', talk: 'guide' },
    ],
  },
};

// Regionskarte (für das Menü)
FC.data.REGION = {
  name: 'Aurelia – Region 1: Heideland',
  nodes: [
    { id: 'kiesel', label: 'Kieselstadt', x: 1, y: 0 },
    { id: 'route1', label: 'Route 1', x: 1, y: 2 },
    { id: 'morgentau', label: 'Morgentau', x: 1, y: 4 },
  ],
  future: [
    { label: 'Nebelküste', x: 3, y: 0 },
    { label: 'Schimmerwald', x: 3, y: 2 },
    { label: 'Glutgipfel', x: 0, y: -1 },
  ],
};
