'use strict';
/* Speichersystem: 3 Speicherplätze in localStorage, Versionierung + Migration, Export/Import als Code. */
FC.save = (function () {
  const PREFIX = 'aurelia_slot_';
  const SETTINGS = 'aurelia_settings';
  const SLOTS = 3;
  let ok = true;
  try { const k = '__aurelia_test'; localStorage.setItem(k, '1'); localStorage.removeItem(k); } catch (e) { ok = false; }

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  // Migrationen: jede Funktion hebt einen Spielstand um eine Version an
  const MIGRATIONS = {
    // 0 → 1: frühe Testversionen ohne "dex"/"taken"
    0: s => { s.dex = s.dex || { seen: {}, caught: {} }; s.taken = s.taken || {}; s.defeated = s.defeated || {}; return s; },
  };
  function migrate(s) {
    if (!s || typeof s !== 'object') return null;
    let v = s.version || 0;
    while (v < FC.SAVE_VERSION) {
      if (MIGRATIONS[v]) s = MIGRATIONS[v](s);
      v++; s.version = v;
    }
    // Pflichtfelder absichern
    s.flags = s.flags || {}; s.bag = s.bag || {}; s.box = s.box || []; s.party = s.party || [];
    s.settings = s.settings || {};
    return s;
  }

  return {
    available: () => ok,
    SLOTS,
    list() {
      const out = [];
      for (let i = 1; i <= SLOTS; i++) {
        const raw = get(PREFIX + i);
        if (!raw) { out.push(null); continue; }
        try { const s = JSON.parse(raw); out.push({ slot: i, name: s.player.name, badges: s.flags.badge1 ? 1 : 0, caught: Object.keys(s.dex.caught || {}).length, time: s.playtime || 0, saved: s.savedAt, map: s.player.map }); }
        catch (e) { out.push({ slot: i, broken: true }); }
      }
      return out;
    },
    load(slot) {
      const raw = get(PREFIX + slot);
      if (!raw) return null;
      try { return migrate(JSON.parse(raw)); } catch (e) { return null; }
    },
    write(slot, state) {
      state.version = FC.SAVE_VERSION;
      state.savedAt = Date.now();
      return set(PREFIX + slot, JSON.stringify(state));
    },
    remove(slot) { del(PREFIX + slot); },
    lastSlot() { return +(get('aurelia_last_slot') || 0) || null; },
    setLastSlot(n) { set('aurelia_last_slot', String(n)); },
    exportCode(state) {
      const json = JSON.stringify(state);
      return 'AUR1:' + btoa(unescape(encodeURIComponent(json)));
    },
    importCode(code) {
      code = String(code || '').trim();
      if (!code.startsWith('AUR1:')) throw new Error('Ungültiger Code');
      const json = decodeURIComponent(escape(atob(code.slice(5))));
      const s = migrate(JSON.parse(json));
      if (!s || !s.player || !Array.isArray(s.party)) throw new Error('Spielstand unvollständig');
      return s;
    },
    loadSettings() {
      try { return Object.assign({ music: 0.55, sfx: 0.8, textSpeed: 2 }, JSON.parse(get(SETTINGS) || '{}')); }
      catch (e) { return { music: 0.55, sfx: 0.8, textSpeed: 2 }; }
    },
    saveSettings(s) { set(SETTINGS, JSON.stringify(s)); },
  };
})();
