// Waves: what each one contains, sending them (early calls pay a bonus), spawning, and clearing them.
import { ENEMIES, MAX_WAVE, waveMix, clearBonus, earlyBonus } from './config.js';
import { S } from './state.js';
import { L } from './i18n.js';
import { spawn } from './enemies.js';
import { cheer } from './cats.js';
import { sfx } from './audio.js';
import { endGame } from './game.js';
import { updateHUD, toast } from './hud.js';

// Each kind is spread evenly through the wave; dogs and then the king bring up the rear.
function buildWave(n) {
  const q = [];
  Object.entries(waveMix(n)).forEach(([kind, count], k) => {
    const rear = kind === 'dog' ? 1 : kind === 'boss' ? 2 : 0;
    for (let i = 0; i < count; i++) q.push({ kind, w: n, gap: ENEMIES[kind].gap, key: rear + (i + 0.5) / count + k * 0.001 });
  });
  return q.sort((a, b) => a.key - b.key);
}

// The next wave can be called once the current one has finished spawning; calling it early pays a bonus.
export const canSend = () => !S.over && S.wave < MAX_WAVE && !S.queue.length;
export function sendWave() {
  if (!canSend()) return;
  const early = S.waveActive ? earlyBonus(S.wave + 1) : 0;
  const w = ++S.wave; S.waveActive = true;
  const q = buildWave(w); S.waveLeft[w] = q.length; S.queue.push(...q); S.spawnTimer = 0.2;
  // Introduce each newcomer the first time it shows up
  const fresh = [...new Set(q.map(s => s.kind))].filter(k => !S.seen.has(k));
  fresh.forEach(k => S.seen.add(k));
  if (early) S.fish += early;
  const head = early ? L('earlyCall', w, early) : w === MAX_WAVE ? L('finalWave') : L('waveStart', w, q.length);
  if (fresh.length && w !== MAX_WAVE) toast(`${head}. ${L('new_' + fresh[0])}`, true);
  else toast(head, w === MAX_WAVE);
  sfx(early ? 'coin' : 'wave');
  updateHUD();
}

// The last invader of wave w is gone (defeated or not): pay its bonus; after the final wave, the game is won.
export function waveDone(w) {
  delete S.waveLeft[w];
  if (S.over) return;
  const bonus = clearBonus(w);
  S.fish += bonus;
  S.waveActive = Object.keys(S.waveLeft).length > 0;
  cheer(1);
  if (!S.waveActive && S.wave >= MAX_WAVE) endGame(true);
  else { toast(L('waveClear', w, bonus)); sfx('clear'); }
  updateHUD();
}

// Per frame: release queued invaders one by one, each kind with its own spacing.
export function updateSpawner(dt) {
  if (!S.waveActive || !S.queue.length) return;
  S.spawnTimer -= dt;
  if (S.spawnTimer > 0) return;
  const n = S.queue.shift();
  spawn(n.kind, n.w);
  S.spawnTimer = n.gap;
  if (!S.queue.length) updateHUD(); // the wave button becomes "call early"
}
