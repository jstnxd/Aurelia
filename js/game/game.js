'use strict';
/* Spiel-API und Story-Skripte (Hauptgeschichte Region 1) */
FC.game = (function () {
  const U = FC.U, D = FC.data;
  const S = () => FC.state;
  const say = (t, n) => FC.ui.say(t, n);

  function newState(name) {
    return {
      version: FC.SAVE_VERSION,
      player: { name, map: 'haus', x: 1, y: 5, dir: 'right' },
      money: 3000, party: [], box: [], bag: { trank: 1 },
      flags: {}, dex: { seen: {}, caught: {} }, taken: {}, defeated: {},
      lastHeal: { map: 'haus', x: 5, y: 4, dir: 'up' },
      playtime: 0, createdAt: Date.now(),
    };
  }
  function flag(k) { return !!S().flags[k]; }
  function setFlag(k, v = true) { S().flags[k] = v; }
  function seen(sp) { S().dex.seen[sp] = true; }
  function caught(sp) { S().dex.seen[sp] = true; S().dex.caught[sp] = true; }

  async function give(item, qty = 1, from) {
    const s = S();
    s.bag[item] = (s.bag[item] || 0) + qty;
    FC.audio.jingle('item');
    await say(`${s.player.name} erhält ${qty > 1 ? qty + '× ' : ''}${D.ITEMS[item].n}!`, from);
  }
  function addMon(m) {
    const s = S();
    caught(m.sp);
    if (s.party.length < 6) { s.party.push(m); return 'party'; }
    s.box.push(m); return 'box';
  }
  function healParty() { for (const m of S().party) FC.mon.heal(m); }
  function alive() { return S().party.filter(m => m.hp > 0); }

  async function healScene(text, who) {
    await FC.ui.fade(true, true, 200);
    healParty();
    const ms = FC.audio.jingle('heal');
    await U.wait(Math.max(600, ms));
    await FC.ui.fade(false, true, 200);
    if (text) await say(text, who);
  }

  async function trainerBattle(key, npc) {
    const s = S(), t = D.TRAINERS[key];
    const team = t.team(s).map(([sp, l]) => FC.mon.create(sp, l));
    const res = await FC.battle.start({ kind: 'trainer', team, trainer: t, key, music: t.leader ? 'boss' : 'battle' });
    if (res === 'win') s.defeated[key] = true;
    return res;
  }
  async function trainer(npc) {
    const key = npc.def.trainer, t = D.TRAINERS[key], s = S();
    if (s.defeated[key]) { await say(t.after || '…', npc.def.name || t.name); return; }
    if (!alive().length) { await say('Du hast keine kampffähigen Monster!'); return; }
    if (t.intro) await say(t.intro, t.name);
    const res = await trainerBattle(key, npc);
    if (res === 'win') {
      if (key === 'gym_petra') await badgeScene();
      else FC.save && FC.game.autosave();
    }
  }
  async function badgeScene() {
    const s = S();
    setFlag('badge1');
    FC.audio.jingle('badge');
    await say(`${s.player.name} erhält den FELSORDEN von Petra!`);
    await say(D.TRAINERS.gym_petra.after, 'Petra');
    await say(['Herzlichen Glückwunsch! Du hast die erste Arena von Aurelia gemeistert.', 'Neu freigeschaltet: Kai wartet in Kieselstadt auf eine Revanche, und in Morgentau soll es etwas Seltenes zu entdecken geben …']);
    FC.ui.toast('Felsorden erhalten! Optionale Herausforderungen freigeschaltet.', 3600);
    FC.game.autosave();
  }

  async function blackout(noPenalty) {
    const s = S();
    if (!noPenalty) {
      const lost = Math.floor(s.money / 2);
      s.money -= lost;
      await say([`${s.player.name} hat keine kampffähigen Monster mehr!`, `${s.player.name} verliert ${U.money(lost)} und flieht zurück …`]);
    }
    await FC.ui.fade(true);
    healParty();
    const h = s.lastHeal;
    FC.world.load(h.map, h.x, h.y, h.dir);
    await FC.ui.fade(false);
    if (!noPenalty) await say('Deine Monster wurden geheilt. Pass beim nächsten Mal besser auf!');
    FC.game.autosave();
  }

  function autosave() {
    const s = S();
    if (!s || !FC.slot) return;
    FC.world.syncPlayer();
    if (FC.save.write(FC.slot, s)) FC.save.setLastSlot(FC.slot);
  }

  /* ───── Story-Skripte ───── */
  const SCRIPTS = {
    async gateCheck() {
      if (flag('starter')) return;
      await say(['Halt! Warte!', 'Ohne eigenes Monster ist das hohe Gras viel zu gefährlich. Komm zuerst in mein Labor!'], 'Prof. Linde (ruft)');
      await FC.world.forceStep('down');
    },
    async mom() {
      if (!flag('starter')) {
        await say(['Guten Morgen, {name}! Gut geschlafen?', 'Prof. Linde hat vorhin nach dir gefragt. Ihr Labor ist das Gebäude mit dem blauen Dach – gleich südöstlich von hier.', 'Heute bekommst du dein erstes Monster, nicht wahr? Ich bin so stolz auf dich!'], 'Mama');
        return;
      }
      await say('Du siehst erschöpft aus, {name}. Ruh dich kurz aus!', 'Mama');
      S().lastHeal = { map: 'haus', x: 5, y: 4, dir: 'up' };
      await healScene('Deine Monster sind wieder fit! Pass gut auf dich auf.', 'Mama');
      autosave();
    },
    async neighbor() {
      if (!flag('lenaGift')) {
        await say(['Oh, hallo {name}! Du ziehst heute los? Wie aufregend!', 'Hier, nimm das mit. Für Notfälle.'], 'Lena');
        setFlag('lenaGift');
        await give('trank', 2, 'Lena');
        return;
      }
      await say('Wenn ein Monster müde ist, kannst du es auch im Menü unter „Tasche“ mit einem Trank heilen.', 'Lena');
    },
    async oldPond() {
      if (flag('badge1') && !flag('schimmerl')) { await say(['Siehst du das? Über dem Teich schimmert es wieder!', 'Man sagt, es sei ein seltenes Geister-Monster. Trau dich ruhig, aber sei vorsichtig.'], 'Opa Gustav'); return; }
      await say(['Ich sitze hier jeden Tag und schaue auf den Teich.', 'Manchmal, nachdem ein starker Trainer durchs Dorf kam, sehe ich ein seltsames Schimmern über dem Wasser …'], 'Opa Gustav');
    },
    async prof() {
      const s = S();
      if (!flag('metProf')) {
        await say(['Ah, {name}! Da bist du ja endlich!', 'Ich bin Prof. Linde und erforsche die Monster der Region Aurelia.', 'Auf dem Tisch liegen drei Fangkapseln. In jeder schläft ein junges Monster.', 'Eines davon gehört ab heute dir. Schau sie dir in Ruhe an und wähle weise!'], 'Prof. Linde');
        setFlag('metProf');
        return;
      }
      if (!flag('starter')) { await say('Nur Mut! Stell dich vor den Tisch und schau dir die Kapseln an.', 'Prof. Linde'); return; }
      if (flag('badge1') && !flag('profGift2')) {
        await say(['Du hast Petra besiegt? Fantastisch!', 'Als Belohnung bekommst du diese hier. Damit fängst du auch hartnäckige Monster.'], 'Prof. Linde');
        setFlag('profGift2');
        await give('superkapsel', 5, 'Prof. Linde');
        return;
      }
      const n = Object.keys(s.dex.caught).length, sn = Object.keys(s.dex.seen).length;
      const verdict = n < 4 ? 'Ein guter Anfang! Geh ins hohe Gras und fang noch mehr Monster.' : n < 8 ? 'Sehr ordentlich! Du wirst ein richtiger Forscher.' : n < 12 ? 'Beeindruckend! Manche Monster entdeckt man nur in entwickelter Form.' : 'Unglaublich! Du kennst die Region besser als ich!';
      await say([`Lass mal dein Bestiarium sehen … ${sn} gesehen, ${n} gefangen.`, verdict], 'Prof. Linde');
    },
    async kaiLab() {
      if (!flag('starter')) { await say(['Yo, {name}! Ich bin schon eine Ewigkeit hier.', 'Prof. Linde sagt, ich darf erst wählen, wenn du dir eins ausgesucht hast. Beeil dich!'], 'Kai'); return; }
      await say('Wir sehen uns!', 'Kai');
    },
    async starter(obj) {
      const s = S(), sp = obj.def.sp, M = D.MON[sp];
      if (flag('starter')) { await say('In dieser Kapsel schläft ein Monster, um das sich Prof. Linde kümmert.'); return; }
      if (!flag('metProf')) { FC.world.faceNpc('prof', 'down'); await SCRIPTS.prof(); }
      const close = FC.ui.monCard(sp);
      const types = M.t.map(t => D.TYPES[t].n).join('/');
      const yes = await FC.ui.yesNo([`Das ist ${M.n}, ein Monster vom Typ ${types}.`, `Willst du ${M.n} als Partner wählen?`], 'Prof. Linde');
      close();
      if (!yes) return;
      const rivalSp = { 1: 4, 4: 7, 7: 1 }[sp];
      setFlag('starter'); setFlag('starterSp', sp);
      addMon(FC.mon.create(sp, 5));
      FC.world.refreshObjects();
      FC.audio.jingle('item');
      await say(`${s.player.name} erhält ${M.n}!`);
      setFlag('rivalSp', rivalSp);
      FC.world.refreshObjects();
      await say(['Dann nehme ich das hier!', `${D.MON[rivalSp].n} hat einen Typvorteil gegen dein ${M.n}. Hehe!`], 'Kai');
      seen(rivalSp);
      await say('Komm schon, {name}! Lass uns sofort testen, wer das bessere Monster hat!', 'Kai');
      const res = await trainerBattle('lab_kai');
      FC.world.faceNpc('kai_lab', 'down');
      if (res === 'win') await say(['Grr … Okay, das war Anfängerglück!', 'Ich trainiere jetzt auf Route 1. Wir sehen uns, {name}!'], 'Kai');
      else await say(['Siehst du? Ich bin einfach besser!', 'Aber du hast dich gut geschlagen. Wir sehen uns, {name}!'], 'Kai');
      await FC.world.walkNpc('kai_lab', ['down', 'down', 'down', 'down', 'down']);
      setFlag('rivalDone');
      FC.world.refreshNpcs();
      await say(['Was für ein spannender Kampf! Deine Monster sind erschöpft – einen Moment …'], 'Prof. Linde');
      await healScene();
      await say(['So, wieder topfit!', 'Nimm diese Fangkapseln. Damit kannst du wilde Monster im hohen Gras fangen.'], 'Prof. Linde');
      await give('kapsel', 5, 'Prof. Linde');
      setFlag('dex');
      await say(['Außerdem habe ich dein Bestiarium freigeschaltet. Es zeichnet jedes Monster auf, das du siehst oder fängst.', 'Dein erstes Ziel ist die Arena in Kieselstadt – nördlich über Route 1. Viel Glück, {name}!'], 'Prof. Linde');
      autosave();
    },
    async sparkle(obj) {
      await say(['Ein geheimnisvolles Licht schwebt über dem Ufer …', 'Es kommt näher!']);
      const m = FC.mon.create(21, 15);
      const res = await FC.battle.start({ kind: 'wild', team: [m], music: 'boss', special: true });
      if (res === 'caught' || res === 'win') { setFlag('schimmerl'); FC.world.refreshObjects(); }
      if (res === 'win') await say('Das Licht ist verschwunden …');
      autosave();
    },
    async nurse() {
      const s = S();
      const yes = await FC.ui.yesNo(['Willkommen in der Heilstation!', 'Sollen wir deine Monster wieder fit machen?'], 'Schwester Alma');
      if (!yes) { await say('Komm jederzeit wieder!', 'Schwester Alma'); return; }
      await say('Einen Moment bitte …', 'Schwester Alma');
      s.lastHeal = { map: 'heilstation', x: 5, y: 3, dir: 'up' };
      await healScene('Fertig! Deine Monster sind wieder topfit. Bis bald!', 'Schwester Alma');
      autosave();
    },
    async shop() {
      await say('Willkommen! Was darf es sein?', 'Verkäufer');
      await FC.menu.shop();
    },
    async guide() {
      await say(['Hey, zukünftiger Champion!', 'Petra kämpft mit Gesteins-Monstern. Wasser-, Pflanzen- und Psycho-Attacken sind sehr effektiv.', 'Feuer-, Flug- und Käfer-Monster haben es dagegen schwer. Viel Erfolg!'], 'Arena-Guide');
    },
    async pc() { await FC.menu.pc(); },
  };

  async function run(name, ctx) {
    const fn = SCRIPTS[name];
    if (fn) await fn(ctx);
  }

  async function intro() {
    await say(['Hallo! Willkommen in der Welt der Monster!', 'Mein Name ist Linde. Man nennt mich die Monster-Professorin der Region Aurelia.', 'Menschen und Monster leben hier Seite an Seite – sie spielen, arbeiten und kämpfen gemeinsam.', 'Aber verrate mir zuerst: Wie heißt du?'], 'Prof. Linde');
    const name = await FC.ui.prompt('Wie heißt du?', 'Alex', 10);
    S().player.name = name;
    await say([`${name}, also! Ein schöner Name.`, 'Dein eigenes Abenteuer beginnt genau jetzt. Besuch mich gleich in meinem Labor in Morgentau!'], 'Prof. Linde');
  }

  return { newState, flag, setFlag, seen, caught, give, addMon, healParty, alive, trainer, trainerBattle, blackout, autosave, run, intro, SCRIPTS };
})();
