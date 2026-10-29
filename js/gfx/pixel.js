'use strict';
/* Pixel-Art-Hilfen: Offscreen-Canvas, Farben, Alpha-Quantisierung, Konturen */
(function () {
  const G = FC.gfx;
  G.canvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d', w * h <= 4096 ? { willReadFrequently: true } : undefined).imageSmoothingEnabled = false;
    return c;
  };
  G.rgb = hex => {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  G.hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  G.shade = (hex, amt) => {
    const [r, g, b] = G.rgb(hex);
    if (amt < 0) { const f = 1 + amt; return G.hex(r * f, g * f, b * f); }
    return G.hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  };
  // Halbtransparente Kanten entfernen → harte Pixelkanten
  G.quantize = (c, th = 110) => {
    const x = c.getContext('2d');
    const d = x.getImageData(0, 0, c.width, c.height);
    const a = d.data;
    for (let i = 3; i < a.length; i += 4) a[i] = a[i] > th ? 255 : 0;
    x.putImageData(d, 0, 0);
  };
  // 1-Pixel-Kontur um alle deckenden Pixel
  G.outline = (c, col = '#1c1626') => {
    const x = c.getContext('2d');
    const w = c.width, h = c.height;
    const d = x.getImageData(0, 0, w, h);
    const a = d.data;
    const out = new Uint8ClampedArray(a);
    const [r, g, b] = G.rgb(col);
    for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) {
      const i = (y * w + X) * 4;
      if (a[i + 3]) continue;
      const n = (X > 0 && a[i - 1]) || (X < w - 1 && a[i + 7]) || (y > 0 && a[i - w * 4 + 3]) || (y < h - 1 && a[i + w * 4 + 3]);
      if (n) { out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255; }
    }
    d.data.set(out);
    x.putImageData(d, 0, 0);
  };
  G.flip = c => {
    const f = G.canvas(c.width, c.height);
    const x = f.getContext('2d');
    x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0);
    return f;
  };
  G.tint = (c, col) => {
    const f = G.canvas(c.width, c.height);
    const x = f.getContext('2d');
    x.drawImage(c, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    return f;
  };
  // Pixel-genaue Grundformen
  G.px = (x, X, Y, col) => { x.fillStyle = col; x.fillRect(X, Y, 1, 1); };
  G.rect = (x, X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  G.disc = (x, cx, cy, r, colFn) => {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let X = Math.floor(cx - r); X <= Math.ceil(cx + r); X++) {
        const dx = X + 0.5 - cx, dy = y + 0.5 - cy, d = Math.sqrt(dx * dx + dy * dy);
        if (d <= r) { const c = colFn(dx, dy, d); if (c) { x.fillStyle = c; x.fillRect(X, y, 1, 1); } }
      }
  };
  // Kapsel-Symbol (eigenes Design, keine Fremdmarke)
  G.capsule = (x, ox, oy, top, small) => {
    const s = small ? 0.75 : 1;
    const w = Math.round(8 * s), h = Math.round(10 * s);
    const X = ox - Math.floor(w / 2), Y = oy - Math.floor(h / 2);
    G.rect(x, X + 1, Y, w - 2, h, '#1c1626');
    G.rect(x, X, Y + 1, w, h - 2, '#1c1626');
    G.rect(x, X + 1, Y + 1, w - 2, Math.floor(h / 2) - 1, top);
    G.rect(x, X + 1, Y + Math.floor(h / 2), w - 2, Math.ceil(h / 2) - 1, '#f4f0e8');
    G.rect(x, X + 1, Y + Math.floor(h / 2) - 1, w - 2, 1, '#1c1626');
    G.rect(x, X + Math.floor(w / 2) - 1, Y + Math.floor(h / 2) - 2, 2, 3, '#ffd25a');
    G.rect(x, X + 2, Y + 2, 1, 2, 'rgba(255,255,255,.75)');
  };
})();
