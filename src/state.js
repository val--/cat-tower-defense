// Shared game state. Modules read and write these fields directly; game.js resets them for each new game.

export const S = {
  // economy and progress
  fish: 0, lives: 0, maxLives: 0,
  wave: 0,              // last wave sent
  waveActive: false,    // some wave still has invaders queued or on the path
  queue: [],            // invaders waiting to spawn: { kind, w, gap }
  spawnTimer: 0,
  waveLeft: {},         // waveLeft[w]: invaders of wave w still queued or on the path (waves overlap when called early)
  seen: new Set(),      // invader kinds already introduced
  started: false,       // the first game has begun (the title screen is gone)
  over: false,
  ending: null,         // after a game: { won, lives, max, wave, stars }

  // the board
  mapId: 'garden',
  grid: null,           // grid[r][c]: 'grass' | 'path' | 'bush' | 'house', or the cat sitting there
  path: null,           // path waypoints as world positions
  towers: [],           // placed cats
  enemies: [],          // invaders on the path

  // what the player is doing
  placing: null,        // cat type picked in the tray
  selected: null,       // placed cat shown in the info panel
  speed: 1,
  userPaused: false,
};

// Settings and records are kept per browser when storage is available.
export function load(key, fallback) {
  try { const v = localStorage.getItem('nine-lives-' + key); return v === null ? fallback : v; } catch (e) { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem('nine-lives-' + key, value); } catch (e) {}
}
