// The in-game interface: stats bar, cat tray, selected-cat panel, messages, and the corner buttons.
import { TYPES, MAX_WAVE, waveMix, earlyBonus, upgradeCost, sellValue } from './config.js';
import { S, load, save } from './state.js';
import { L, catName, lang } from './i18n.js';
import { ART, FOE } from './art.js';
import { showRange, hideRange, hover } from './world.js';
import { upgrade, sell, cycleMode, updateBoosts } from './cats.js';
import { canSend, sendWave } from './waves.js';
import { muted, setMuted } from './audio.js';
import { markView, viewName, setView, nextView } from './camera.js';
import { renderMenu } from './menu.js';
import { $ } from './util.js';

const hex = n => '#' + n.toString(16).padStart(6, '0');

// ---------- Cat tray ----------
function renderTray() {
  Object.entries(TYPES).forEach(([id, T]) => {
    $('card-' + id).innerHTML = `<i class="face" style="--c:${hex(T.color)};--e:${hex(T.pts)}"><i></i></i>
      <span class="name">${catName(id)}</span>
      <span class="meta">${ART.fish}${T.cost}</span>
      <span class="role">${L('role_' + id)}</span>
      <span class="kbd">${T.key}</span>`;
  });
}

// Pick a cat type to place (null to stop placing)
export function setPlacing(type) {
  S.placing = type;
  if (type) select(null);
  document.querySelectorAll('.card').forEach(c => c.classList.toggle('on', c.dataset.type === type));
  if (!type) { hover.visible = false; if (!S.selected) hideRange(); }
}

// ---------- Selected cat ----------
export function select(t) {
  S.selected = t;
  $('info').hidden = !t;
  if (!t) { hideRange(); return; }
  const T = TYPES[t.type];
  updateBoosts();
  $('infoName').textContent = catName(t.type);
  $('infoBoost').hidden = !t.boost;
  $('infoBoost').textContent = L('purrBadge', Math.round(t.boost * 100));
  t.shownBoost = t.boost;
  // level pips in the same silver/gold as the cat's ring and bell
  $('infoLvl').innerHTML = `<span class="pips">${[1, 2, 3].map(n => `<i class="${n <= t.level ? 'l' + Math.max(2, t.level) : ''}"></i>`).join('')}</span>${L('level', t.level, t.level >= 3)}`;
  $('infoDmg').textContent = T.aura ? '—' : t.dmg + (T.splash ? L('splash') : '');
  $('infoRng').textContent = t.range.toFixed(1);
  $('infoRate').textContent = T.aura ? '—' : (1 / t.rate * (1 + t.boost)).toFixed(1) + (t.boost ? L('boosted', Math.round(t.boost * 100)) : '');
  $('infoExtraWrap').hidden = !T.slow && !T.splash && !T.aura;
  $('infoExtraLbl').textContent = T.slow ? L('slowLbl') : T.aura ? L('purrLbl') : L('splashLbl');
  $('infoExtra').textContent = T.slow ? `−${Math.round((1 - t.slow) * 100)}% · ${t.slowT.toFixed(1)}s`
    : T.aura ? L('purr', Math.round(t.aura * 100)) : T.splash ? t.splash.toFixed(2) : '';
  $('modeBtn').hidden = !!T.aura;
  $('modeBtn').textContent = L('target', L('mode_' + t.mode));
  const cost = upgradeCost(t);
  $('upBtn').textContent = t.level >= 3 ? L('maxed') : L('upgrade', cost);
  $('upBtn').disabled = t.level >= 3 || S.fish < cost;
  $('sellBtn').textContent = L('sell', sellValue(t));
  showRange(t.g.position, t.range);
}

// ---------- Stats bar and wave button ----------
export function updateHUD() {
  // lives as a row of hearts (the number stays for screen readers)
  $('lives').textContent = S.lives;
  $('hearts').innerHTML = Array.from({ length: S.maxLives }, (_, i) => `<span${i < S.lives ? '' : ' class="lost"'}>${ART.heart}</span>`).join('');
  $('fish').textContent = S.fish;
  $('wave').textContent = `${S.wave}/${MAX_WAVE}`;
  // one pip per wave: cleared, on the path, or still to come
  $('track').innerHTML = Array.from({ length: MAX_WAVE }, (_, i) => {
    const n = i + 1;
    return `<i class="${n <= S.wave ? (S.waveLeft[n] ? 'now' : 'done') : ''}"></i>`;
  }).join('');
  const wb = $('waveBtn');
  wb.disabled = !canSend();
  wb.innerHTML = ART.paw + `<span>${S.wave >= MAX_WAVE || S.queue.length ? L('incoming', S.wave)
    : S.waveActive ? L('callEarly', S.wave + 1, earlyBonus(S.wave + 1)) : L('sendWave', S.wave + 1)}</span>`;
  // preview of the next wave: a little head and a count per kind
  const nx = S.wave < MAX_WAVE ? waveMix(S.wave + 1) : null;
  $('nextStat').hidden = !nx;
  if (nx) $('nextList').innerHTML = Object.entries(nx).filter(([, n]) => n).map(([k, n]) => `<span class="chip">${FOE[k]}${n}</span>`).join('');
  Object.entries(TYPES).forEach(([id, T]) => $('card-' + id).classList.toggle('poor', S.fish < T.cost));
  if (S.selected) select(S.selected);
}

// ---------- Messages ----------
let toastTimer;
export function toast(msg, long = false) {
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), long ? 4200 : 1800);
}

// ---------- Corner buttons ----------
export function setPaused(p) {
  S.userPaused = p && !S.over;
  $('pausedTag').hidden = !S.userPaused;
  $('pauseBtn').innerHTML = S.userPaused ? ART.play : ART.pause;
}
export function toggleMute() {
  setMuted(!muted);
  $('muteBtn').innerHTML = muted ? ART.mute : ART.sound;
}
function cycleSpeed() {
  S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 3 : 1;
  save('speed', S.speed);
  $('speedBtn').textContent = S.speed + '×';
}

// ---------- Language ----------
// Refresh every piece of text on the page (after a language switch, and at start-up).
export function applyLang() {
  document.documentElement.lang = lang;
  document.title = L('title');
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = L(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-html]').forEach(el => el.innerHTML = L(el.dataset.i18nHtml));
  document.querySelectorAll('[data-i18n-title]').forEach(el => el.title = L(el.dataset.i18nTitle));
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', L(el.dataset.i18nAria)));
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
  renderTray(); renderMenu(); updateHUD(); markView(viewName);
  document.querySelectorAll('.card').forEach(c => c.classList.toggle('on', c.dataset.type === S.placing));
}

export function initHud() {
  document.querySelectorAll('.ico-fish').forEach(el => el.outerHTML = ART.fish);
  document.querySelectorAll('.ico-cam').forEach(el => el.outerHTML = ART.cam);
  Object.keys(TYPES).forEach(id => {
    const b = document.createElement('button');
    b.className = 'card'; b.id = 'card-' + id; b.dataset.type = id;
    b.addEventListener('click', () => setPlacing(S.placing === id ? null : id));
    $('tray').appendChild(b);
  });
  $('upBtn').addEventListener('click', () => S.selected && upgrade(S.selected));
  $('modeBtn').addEventListener('click', () => S.selected && cycleMode(S.selected));
  $('sellBtn').addEventListener('click', () => S.selected && sell(S.selected));
  $('closeBtn').addEventListener('click', () => select(null));
  $('waveBtn').addEventListener('click', sendWave);
  $('speedBtn').addEventListener('click', cycleSpeed);
  $('pauseBtn').addEventListener('click', () => { setPaused(!S.userPaused); $('pauseBtn').blur(); });
  $('muteBtn').addEventListener('click', () => { toggleMute(); $('muteBtn').blur(); });
  $('camBtn').addEventListener('click', () => { setView(nextView()); $('camBtn').blur(); });
  // leaving the tab mid-game pauses it
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.started && !S.over && $('overlay').hidden) setPaused(true); });
  const speed = +load('speed', 1);
  S.speed = [1, 2, 3].includes(speed) ? speed : 1;
  $('speedBtn').textContent = S.speed + '×';
  $('muteBtn').innerHTML = muted ? ART.mute : ART.sound;
  setPaused(false);
}
