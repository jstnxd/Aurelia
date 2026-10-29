'use strict';
/* Gegenstände. kind: ball | heal | cure | revive | key */
FC.data.ITEMS = {
  kapsel:      { n: 'Fangkapsel',     kind: 'ball', rate: 1,   price: 200,  c: '#2ab0a0', d: 'Fängt wilde Monster.' },
  superkapsel: { n: 'Superkapsel',    kind: 'ball', rate: 1.5, price: 600,  c: '#4a6ae0', d: 'Bessere Fangchance als eine Fangkapsel.' },
  trank:       { n: 'Trank',          kind: 'heal', heal: 20,  price: 300,  c: '#c060d0', d: 'Stellt 20 KP wieder her.' },
  supertrank:  { n: 'Supertrank',     kind: 'heal', heal: 60,  price: 700,  c: '#e05080', d: 'Stellt 60 KP wieder her.' },
  gegengift:   { n: 'Gegengift',      kind: 'cure', cure: 'psn', price: 100, c: '#9a4ab8', d: 'Heilt Vergiftung.' },
  brandsalbe:  { n: 'Brandsalbe',     kind: 'cure', cure: 'brn', price: 250, c: '#e8603a', d: 'Heilt Verbrennungen.' },
  lockerspray: { n: 'Lockerspray',    kind: 'cure', cure: 'par', price: 200, c: '#d9ab12', d: 'Heilt Paralyse.' },
  weckruf:     { n: 'Weckruf',        kind: 'cure', cure: 'slp', price: 250, c: '#7a7a92', d: 'Weckt ein schlafendes Monster.' },
  allheiler:   { n: 'Allheiler',      kind: 'cure', cure: 'all', price: 600, c: '#40b0e0', d: 'Heilt jede Statusveränderung.' },
  beleber:     { n: 'Beleber',        kind: 'revive', price: 1500, c: '#f0c030', d: 'Belebt ein besiegtes Monster mit halben KP.' },
};

// Laden-Sortiment (abhängig vom Fortschritt)
FC.data.SHOP = s => {
  const list = ['kapsel', 'trank', 'gegengift', 'brandsalbe', 'lockerspray', 'weckruf'];
  if (s.flags.badge1) list.splice(1, 0, 'superkapsel'), list.push('supertrank', 'allheiler', 'beleber');
  return list;
};
