// Game data and tuning: the board, the cats, the invaders, the waves and the difficulty.
// Every number that changes how the game plays lives here (see MECHANICS.md for the rules they drive).

export const COLS = 16, ROWS = 10, MAX_WAVE = 10;
export const ATK_TIME = 0.3, HIT_AT = 0.5, DROP_TIME = 0.55, DEATH_TIME = 0.4;

// ---------- Maps ----------
// Path waypoints in grid coords (col, row), from off-map to the house door, plus decorative bushes.
// The house always sits on columns 14–15, rows 4–6, with its door facing the path's last tile.
export const MAPS = {
  garden:  { hp: 1, path: [[-1, 2], [4, 2], [4, 7], [9, 7], [9, 2], [13, 2], [13, 5], [14, 5]],
             bushes: [[0, 0], [2, 8], [7, 0], [6, 4], [11, 9], [15, 1], [15, 8], [11, 4]] },
  // Longer and twistier, which gives cats more time; with the steep late HP curve it plays about as hard as the Garden
  potager: { hp: 1, path: [[1, -1], [1, 7], [5, 7], [5, 1], [9, 1], [9, 8], [12, 8], [12, 5], [14, 5]],
             bushes: [[3, 3], [7, 4], [7, 9], [0, 9], [11, 0], [15, 1], [15, 8], [10, 5], [3, 0]] },
};
export const HOUSE_TILES = [];
for (let c = 14; c <= 15; c++) for (let r = 4; r <= 6; r++) HOUSE_TILES.push([c, r]);

// ---------- Difficulty (a single mode; every economy knob lives here) ----------
export const START_LIVES = 9, START_FISH = 130;
// Enemy HP multiplier per wave: gentle through wave 5, then climbing much faster so waves 6–10 still test
// a full garden of upgraded cats
export const hpGrowth = w => 1 + 0.15 * (w - 1) + 0.03 * (w - 1) ** 2 + 0.37 * Math.max(0, w - 5) ** 2;
export const HP_EXTRA = 1.08;                            // extra toughness on top, times the map's own factor…
// …ramped in over waves 1–5, so the opening isn't lost before the first cats are up
export const hpBonus = (m, w) => m <= 1 ? m : 1 + (m - 1) * Math.min(1, (w - 1) / 4);
export const rewardMul = w => 1 + 0.03 * (w - 1);       // kill rewards grow a little with the wave
export const clearBonus = w => 15 + 3 * w;               // paid when the last invader of wave w is gone
export const earlyBonus = w => 10 + 2 * w;               // for calling wave w while the previous one is still on the path

// ---------- Cats ----------
export const TYPES = {
  // Kitten is melee: range 1.5 reaches the path tiles touching its own tile, diagonals included. It can't reach fliers.
  kitten:  { key: '1', cost: 40,  range: 1.5, rate: 0.45, dmg: 9,  color: 0xF2A541, pts: 0xD9822B, bib: 0xFFF1DC, eye: 0x9BD35A, cushion: 0xE8D5B5, size: 0.85, melee: true, meow: 1.35 },
  tabby:   { key: '2', cost: 70,  range: 3.3, rate: 0.9,  dmg: 22, color: 0x9A7B5E, pts: 0x5E4634, bib: 0xE9DCC8, eye: 0xE8B33A, cushion: 0x6B8FB3, proj: 0xDDEBF5, pspeed: 13, size: 1.0, marks: 'stripes', meow: 1 },
  // Siamese: slow is the speed multiplier left on the target, per level; upgrades deepen and lengthen it.
  siamese: { key: '3', cost: 60,  range: 2.6, rate: 0.7,  dmg: 4,  color: 0xEFE3D0, pts: 0x4A3328, eye: 0x6FB7E8, cushion: 0xB05A7A, proj: 0xE86A92, pspeed: 9,  size: 0.95, slow: [0.45, 0.38, 0.32], slowT: [1.8, 2.1, 2.4], marks: 'mask', meow: 1.15 },
  tom:     { key: '4', cost: 120, range: 2.7, rate: 1.7,  dmg: 34, color: 0x3A3340, pts: 0x241F29, bib: 0xF4EFE6, eye: 0xE8D23A, cushion: 0xC8553D, proj: 0x5E5468, pspeed: 7,  size: 1.25, splash: 1.3, splashUp: 0.15, marks: 'torn', meow: 0.72 },
  // Persian never attacks: its purring speeds up the attacks of every cat in range (the strongest purr wins, no stacking).
  persian: { key: '5', cost: 90,  range: 1.5, rate: 0,    dmg: 0,  color: 0xEDE4F0, pts: 0xC9B8D4, bib: 0xFFFFFF, eye: 0xE8923A, cushion: 0x7BD389, size: 1.05, aura: [0.12, 0.18, 0.25], marks: 'fluff', meow: 0.9 },
};
// Michka, the house cat on the chimney: a blue-grey Chartreux with copper eyes and no cushion.
export const MICHKA = { color: 0x8E9AAF, pts: 0x6F7B91, bib: 0xDCE3EC, eye: 0xF2A541, size: 0.6 };

// Target priorities a cat can cycle through; Big Tom can also aim for the thickest crowd.
const MODES = ['first', 'strong', 'weak'];
export const modesFor = type => TYPES[type].splash ? [...MODES, 'crowd'] : MODES;
export const upgradeCost = t => Math.round(TYPES[t.type].cost * 0.8 * t.level);
export const sellValue = t => Math.round(t.spent * 0.6);

// ---------- Invaders ----------
// armor: flat damage taken off every hit (min 1). fly: height above the path; kittens can't reach it.
// dash: moves in hops, fast then still. boss: slows only work half as well on it.
export const ENEMIES = {
  mouse:    { hp: 18,  speed: 1.9,  reward: 4,   dmg: 1, scale: 0.75, hbY: 0.55, gap: 0.5 },
  raccoon:  { hp: 55,  speed: 1.15, reward: 8,   dmg: 1, scale: 0.9,  hbY: 0.85, gap: 0.85 },
  squirrel: { hp: 28,  speed: 1.4,  reward: 6,   dmg: 1, scale: 0.8,  hbY: 0.8,  gap: 0.6, dash: true },
  pigeon:   { hp: 32,  speed: 1.45, reward: 7,   dmg: 1, scale: 0.8,  hbY: 1.45, gap: 0.7, fly: 0.9 },
  hedgehog: { hp: 60,  speed: 0.95, reward: 10,  dmg: 1, scale: 0.85, hbY: 0.6,  gap: 0.9, armor: 6 },
  dog:      { hp: 170, speed: 0.75, reward: 18,  dmg: 2, scale: 1.05, hbY: 1.05, gap: 1.5 },
  boss:     { hp: 700, speed: 0.5,  reward: 150, dmg: 4, scale: 1.7,  hbY: 1.95, gap: 2.5, boss: true },
};

// ---------- Waves ----------
// Invaders per wave n. Newcomers join gradually (squirrels at 3, dogs at 4, pigeons at 5, hedgehogs at 6),
// and the Bulldog King leads the last wave.
const DOGS = [0, 0, 0, 1, 1, 1, 2, 2, 3, 3];
export const waveMix = n => ({
  mouse: n < 5 ? 4 + 2 * n : 7 + n,
  raccoon: Math.max(0, Math.floor(n * 1.2) - 1),
  squirrel: n >= 3 ? Math.min(6, n - 1) : 0,
  pigeon: n >= 5 ? Math.min(5, n - 3) : 0,
  hedgehog: n >= 6 ? Math.min(4, n - 4) : 0,
  dog: DOGS[n - 1],
  boss: n === MAX_WAVE ? 1 : 0,
});
