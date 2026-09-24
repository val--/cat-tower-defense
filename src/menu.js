// The title screen before the first game, and the result screen after each one:
// story or result, map cards with records, the start button, and "how to play".
import { MAPS, MAX_WAVE } from './config.js';
import { S, save } from './state.js';
import { L, setLang } from './i18n.js';
import { ART, mapThumb } from './art.js';
import { best, reset, startGame } from './game.js';
import { applyLang } from './hud.js';
import { $ } from './util.js';

const starsHTML = s => [1, 2, 3].map(i => ART.star(i <= s)).join('');
// Keycaps and what they do. One-letter caps are shown as is; longer ones (kSpace, kEsc) are translated names.
const HOW_TO = [[['1', '5'], 'k_pick', '–'], [['kSpace'], 'k_wave'], [['U', 'T', 'X'], 'k_utx'], [['P', 'M'], 'k_pm'],
  [['V'], 'k_view'], [['W', 'A', 'S', 'D'], 'k_pan'], [['kEsc'], 'k_cancel']];

export const menuOpen = () => !$('overlay').hidden;
export function showMenu(on) {
  if (on) renderMenu();
  $('overlay').hidden = !on;
}

export function renderMenu() {
  const e = S.ending;
  $('ovTitle').innerHTML = !e ? L('titleHTML') : e.won ? L('wonTitle') : L('lostTitle');
  $('ovTag').textContent = !e ? L('tagline') : e.won ? L('wonTag') : L('lostTag');
  $('ovText').textContent = !e ? L('intro') : e.won ? L('wonText', MAX_WAVE, e.lives, e.max) : L('lostText', e.wave);
  $('ovStars').hidden = !e?.won;
  if (e?.won) $('ovStars').innerHTML = starsHTML(e.stars);
  $('ovBtn').innerHTML = ART.paw + `<span>${e ? L('again') : L('start')}</span>`;

  // Map cards: a mini-map, the name and the record. Picking one sets up a fresh board behind the overlay.
  const maps = $('mapPick'); maps.innerHTML = '';
  Object.keys(MAPS).forEach(id => {
    const b = document.createElement('button');
    b.className = 'map-card' + (id === S.mapId ? ' on' : '');
    b.setAttribute('aria-pressed', id === S.mapId);
    b.title = L('starsRule');
    const rec = best[id] || 0;
    b.innerHTML = mapThumb(id) + `<span class="row"><span>${L('map_' + id)}</span>${rec ? `<span class="stars small">${starsHTML(rec)}</span>` : `<span class="none">${L('noRecord')}</span>`}</span>`;
    b.addEventListener('click', () => {
      S.mapId = id; save('map', id);
      reset(); renderMenu(); $('mapPick').querySelector('.on')?.focus();
    });
    maps.appendChild(b);
  });

  // How to play, as keycaps (only on the title screen)
  $('ovHow').hidden = !!e;
  $('keys').innerHTML = HOW_TO.map(([keys, k, sep]) =>
    `<dt>${keys.map(x => `<span class="kbd">${x.length > 1 ? L(x) : x}</span>`).join(sep || '')}</dt><dd>${L(k)}</dd>`).join('')
    + `<dd class="mouse">${L('k_mouse')}</dd>`;
}

export function initMenu() {
  $('ovBtn').addEventListener('click', () => { $('ovBtn').blur(); startGame(); });
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
    setLang(b.dataset.lang); applyLang(); b.blur();
  }));
}
