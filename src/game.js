// Game flow: setting up a fresh game, starting it from the title/result screen, and ending it.
import { START_FISH, START_LIVES } from './config.js';
import { S, load, save } from './state.js';
import { buildMap, michka } from './world.js';
import { clearCats, cheer } from './cats.js';
import { clearEnemies } from './enemies.js';
import { clearFx } from './fx.js';
import { audio, sfx } from './audio.js';
import { setView } from './camera.js';
import { updateHUD, select, setPlacing, setPaused } from './hud.js';
import { showMenu } from './menu.js';

// Best star rating per map
export const best = (() => { try { return JSON.parse(load('best', '{}')) || {}; } catch (e) { return {}; } })();
const starsFor = (lives, max) => lives >= max ? 3 : lives >= max / 2 ? 2 : 1;

// A fresh board on the current map, ready for the next game.
export function reset() {
  clearCats(); clearEnemies(); clearFx();
  buildMap(S.mapId);
  Object.assign(S, {
    fish: START_FISH, lives: START_LIVES, maxLives: START_LIVES,
    wave: 0, waveActive: false, queue: [], spawnTimer: 0, waveLeft: {}, over: false,
    seen: new Set(['mouse', 'raccoon']),
  });
  michka.hop = 0;
  setPaused(false); select(null); setPlacing(null); updateHUD();
}

// The title/result screen's button
export function startGame() {
  showMenu(false);
  audio(); // unlock sound on this first gesture
  if (S.started) reset();
  S.started = true;
  setView('overview'); // the title screen's slow turn ends here
}

export function endGame(won) {
  S.over = true; S.waveActive = false;
  setPlacing(null); select(null); setPaused(false);
  S.ending = { won, lives: S.lives, max: S.maxLives, wave: S.wave, stars: won ? starsFor(S.lives, S.maxLives) : 0 };
  if (won) {
    if (S.ending.stars > (best[S.mapId] || 0)) { best[S.mapId] = S.ending.stars; save('best', JSON.stringify(best)); }
    cheer(1e9); // a victory dance behind the result sheet
  }
  sfx(won ? 'win' : 'lose');
  showMenu(true);
}
