'use strict';
/* Figuren-Sprites (16×20) – 4 Richtungen × 3 Frames, prozedural aus Farbparametern */
(function () {
  const G = FC.gfx;
  const cache = {};
  const EYE = '#201828';

  function draw(L, dir, f) {
    const c = G.canvas(16, 20), x = c.getContext('2d');
    const r = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    const skin = L.skin, hair = L.hair, shirt = L.shirt, pants = L.pants, shoe = '#2a2230';
    const shirtD = G.shade(shirt, -0.22), pantsD = G.shade(pants, -0.22), hairL = G.shade(hair, 0.22);
    const side = dir === 'left';

    // Beine / Rock
    if (L.long || L.coat) {
      const sk = L.coat ? '#f4f4f4' : pants;
      if (!side) {
        r(4, 14, 8, 4, sk); r(4, 17, 8, 1, G.shade(sk, -0.15));
        r(5, 18, 2, 1, f === 1 ? sk : shoe); r(9, 18, 2, 1, f === 2 ? sk : shoe);
        if (L.coat) { r(5, 18, 2, 1, f === 1 ? pants : shoe); r(9, 18, 2, 1, f === 2 ? pants : shoe); }
      } else {
        r(5, 14, 7, 4, sk); r(5, 17, 7, 1, G.shade(sk, -0.15));
        if (f === 0) r(6, 18, 4, 1, shoe); else { r(4, 18, 3, 1, shoe); r(9, 18, 3, 1, shoe); }
      }
    } else if (!side) {
      const lu = f === 1 ? 1 : 0, ru = f === 2 ? 1 : 0;
      r(5, 15, 3, 3 - lu, pants); r(8, 15, 3, 3 - ru, pantsD);
      r(5, 18 - lu, 3, 1, shoe); r(8, 18 - ru, 3, 1, shoe);
    } else {
      if (f === 0) { r(6, 15, 4, 3, pants); r(6, 18, 4, 1, shoe); }
      else { r(4, 15, 3, 3, pants); r(9, 15, 3, 3, pantsD); r(4, 18, 3, 1, shoe); r(9, 18, 3, 1, shoe); }
    }

    // Oberkörper
    const top = L.coat ? '#f4f4f4' : shirt, topD = L.coat ? '#d8d8e0' : shirtD;
    r(4, 9, 8, 6, top); r(4, 14, 8, 1, topD);
    if (L.coat && !side) r(7, 9, 2, 5, shirt === '#f4f4f4' ? '#7aa0d0' : '#7aa0d0');
    if (!side) {
      const la = f === 1 ? 1 : 0, ra = f === 2 ? 1 : 0;
      r(2, 10 + la, 2, 4, top); r(12, 10 + ra, 2, 4, top);
      r(2, 14 + la, 2, 1, skin); r(12, 14 + ra, 2, 1, skin);
      if (dir === 'down') r(5, 9, 6, 1, topD);
    } else {
      const ax = f === 1 ? 5 : f === 2 ? 8 : 7;
      r(ax, 10, 2, 4, topD); r(ax, 14, 2, 1, skin);
    }

    // Kopf
    if (dir === 'down') {
      r(4, 0, 8, 1, hair); r(3, 1, 10, 3, hair);
      r(4, 3, 8, 6, skin);
      r(3, 4, 1, 4, hair); r(12, 4, 1, 4, hair);
      r(4, 3, 2, 1, hair); r(10, 3, 2, 1, hair); r(7, 3, 1, 1, hair);
      r(5, 5, 1, 2, EYE); r(10, 5, 1, 2, EYE);
      r(5, 7, 1, 1, '#f0a0a0'); r(10, 7, 1, 1, '#f0a0a0');
      r(7, 8, 2, 1, G.shade(skin, -0.15));
      r(5, 1, 3, 1, hairL);
      if (L.long) { r(2, 4, 2, 7, hair); r(12, 4, 2, 7, hair); }
    } else if (dir === 'up') {
      r(4, 0, 8, 1, hair); r(3, 1, 10, 8, hair);
      r(5, 2, 3, 1, hairL); r(4, 8, 8, 1, G.shade(hair, -0.2));
      if (L.long) { r(3, 8, 10, 4, hair); r(4, 11, 8, 1, G.shade(hair, -0.2)); }
    } else { // links
      r(4, 0, 8, 1, hair); r(3, 1, 10, 3, hair);
      r(3, 4, 6, 5, skin); r(2, 6, 1, 1, skin);
      r(9, 3, 4, 5, hair); r(8, 8, 4, 1, hair); r(3, 3, 3, 1, hair);
      r(4, 5, 1, 2, EYE); r(5, 7, 1, 1, '#f0a0a0');
      r(5, 1, 3, 1, hairL);
      if (L.long) r(10, 7, 3, 5, hair);
    }

    // Kopfbedeckung
    if (L.hat) {
      const hatD = G.shade(L.hat, -0.25);
      r(4, 0, 8, 1, L.hat); r(3, 1, 10, 2, L.hat);
      if (dir === 'down') { r(3, 3, 10, 1, hatD); r(7, 1, 2, 1, '#ffffff'); }
      else if (dir === 'up') r(3, 3, 10, 1, L.hat);
      else { r(0, 3, 7, 1, hatD); r(3, 2, 2, 1, '#ffffff'); }
    }

    G.outline(c);
    return c;
  }

  G.charFrame = function (lookId, dir, f) {
    const key = lookId + ':' + dir + ':' + f;
    if (cache[key]) return cache[key];
    const L = typeof lookId === 'string' ? FC.data.LOOKS[lookId] : lookId;
    let c;
    if (dir === 'right') c = G.flip(G.charFrame(lookId, 'left', f));
    else c = draw(L, dir, f);
    cache[key] = c;
    return c;
  };

  // "!"-Sprechblase
  G.emote = (function () {
    const c = G.canvas(12, 14), x = c.getContext('2d');
    const r = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    r(1, 0, 10, 11, '#ffffff'); r(0, 1, 12, 9, '#ffffff'); r(4, 11, 3, 2, '#ffffff');
    r(5, 2, 2, 5, '#e03a3a'); r(5, 8, 2, 2, '#e03a3a');
    G.outline(c);
    return c;
  })();
})();
