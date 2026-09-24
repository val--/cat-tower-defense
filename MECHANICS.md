# Michka's House — Game Mechanics

*La Maison de Michka* is a 3D tower-defense game for the browser (three.js r128, plain ES modules in `src/`).
Invaders walk up a garden path toward the house. You place cats on the grass to stop them.
Michka, the house cat, watches from the chimney.

All numbers below come from the code. Nearly all of them live in [`src/config.js`](src/config.js)
(`MAPS`, the Difficulty block, `TYPES`, `ENEMIES`, `waveMix`, …).

---

## 1. Goal

- Survive **10 waves** (`MAX_WAVE`).
- The house starts with **9 lives**.
- An invader that reaches the door costs lives equal to its **lives lost** value (§6).
- **Win:** clear wave 10, and every wave still on the path, with at least 1 life left.
- **Lose:** lives reach 0.
- **Stars** on a win:
  | Stars | Lives left |
  |---|---|
  | ★★★ | all of them |
  | ★★ | at least half |
  | ★ | fewer than half |
- The best star rating for each map is saved in the browser.

## 2. Maps

The grid is **16 × 10** tiles. One tile is 1 world unit.
The house always sits on columns 14–15, rows 4–6, and its door faces the last path tile.

| Tile | Can place a cat? | Notes |
|---|---|---|
| `grass` | ✅ | The only buildable tile |
| `path` | ❌ | "Cats won't sit in the dirt" |
| `bush` | ❌ | Decorative |
| `house` | ❌ | — |

| Map | Path (col,row waypoints) | Length | Map HP factor |
|---|---|---|---|
| **The Garden** (*Le Jardin*) | `(-1,2) (4,2) (4,7) (9,7) (9,2) (13,2) (13,5) (14,5)`: enters from the left | ~28 tiles | ×1 |
| **The Veg Patch** (*Le Potager*) | `(1,-1) (1,7) (5,7) (5,1) (9,1) (9,8) (12,8) (12,5) (14,5)`: enters from the top | ~37 tiles | ×1 |

- The Veg Patch path is longer, so cats get more time to attack.
  With the steep late HP curve, it still plays about as hard as the Garden, so its enemies get no extra HP.
- Grass tiles inside the bends touch two path segments. These are the best spots.

## 3. Difficulty

There is a single difficulty. It is always on, so there is nothing to choose. Its settings are at the top of the script:

| Setting | Value |
|---|---|
| Lives | 9 |
| Starting fish | 130 |
| Enemy HP growth per wave | `1 + 0.15 × (w − 1) + 0.03 × (w − 1)² + 0.37 × max(0, w − 5)²`. Gentle through wave 5, then much steeper. Including the extra toughness below, that's ×1.48 on wave 3, ×3.10 on wave 6 and ×15.2 on wave 10. |
| Extra toughness | ×1.08, multiplied by the map's HP factor (both maps ×1) |

**Ramp:** the extra toughness builds up over waves 1–5.
- Formula: `1 + (m − 1) × min(1, (wave − 1) / 4)`, where `m` is the extra toughness times the map's factor.
- Wave 1 therefore has base HP, and the full bonus applies from wave 5.
- This keeps the opening fair before the first cats are placed.

**Why HP grows much faster after wave 5:** a garden full of upgraded cats gets very strong by the end of a game.
With gentler growth, well-placed cats won every game without losing a life.
The steep curve after wave 5 keeps waves 7–10, and the Bulldog King, a real test.

**Tuning targets** (checked with scripted bots over full games):
| Player | Result |
|---|---|
| Casual (cats on random tiles next to the path) | usually wins, narrowly |
| Strong (ideal placement, spends everything) | wins with 1–2 stars: the Bulldog King usually gets through, sometimes a few invaders in wave 9 |

## 4. Economy — fish 🐟

| Source | Amount |
|---|---|
| Starting fish | **130** |
| Kill reward | the base reward (§6) × **(1 + 0.03 × (wave − 1))**, rounded. So rewards are +27% on wave 10. |
| Wave-clear bonus | **15 + 3 × wave**, paid when every invader of that wave is gone |
| Calling a wave early | **10 + 2 × wave number** (§7) |
| Selling a cat | **60 %** of all the fish spent on it (purchase + upgrades) |

- Enemies that reach the house give no kill reward.
- A wave's clear bonus is paid even if some of its enemies reached the house.

## 5. Cats (towers)

| Cat | Key | Cost | Damage | Range (tiles) | Attack interval (s) | DPS | Special |
|---|---|---|---|---|---|---|---|
| **Kitten** | 1 | 40 | 9 | 1.5 | 0.45 | 20.0 | Melee paw swipe. **Can't reach flying enemies.** |
| **Tabby** | 2 | 70 | 22 | 3.3 | 0.9 | 24.4 | Long range. Fast projectile. |
| **Siamese** | 3 | 60 | 4 | 2.6 | 0.7 | 5.7 | Yarn **slows** the target (see below) |
| **Big Tom** | 4 | 120 | 34 | 2.7 | 1.7 | 20.0 | Hairball deals **splash** damage (radius 1.3) |
| **Persian** | 5 | 90 | — | 1.5 | — | — | Never attacks. Its **purring** speeds up nearby cats. |

- **Kitten range:** 1.5 reaches the 8 tiles around the kitten, diagonals included.
  If the target moves more than `range + 0.4` away during the swing, the swipe misses.
- **Siamese slow:** the target moves at a fraction of its speed for a few seconds.
  - Slows do **not stack**. A hit keeps the stronger slow and the longer remaining time.
  - The Siamese prefers enemies that aren't slowed, or whose slow ends within 0.3 s.
- **Persian purr:** every cat in the Persian's range attacks faster (+12 % at level 1).
  - Persians don't boost each other.
  - When several Persians reach the same cat, only the strongest boost counts.
  - A purring Persian sends out a pink ripple every 2.4 s.
  - Every boosted cat shows it: a pink ring pulses around its cushion and little music notes float up from it.
    Its info panel shows a pink "purring +x %" badge.
- An attack has a 0.3 s wind-up. The hit or the throw lands halfway through it.
- A newly placed cat drops in over 0.55 s and can't attack until it lands.

### Targeting
- Each cat, except the Persian, has a **target priority**. Change it in the info panel or with **T**.
  | Priority | Targets |
  |---|---|
  | **First** (default) | the enemy furthest along the path |
  | **Strongest** | the enemy with the most HP left |
  | **Weakest** | the enemy with the least HP left |
  | **Crowd** (Big Tom only) | the enemy with the most other enemies within splash range |
- Ties go to the enemy furthest along the path.

### Projectiles
- Projectiles **home** in on their target and hit flying enemies in the air.
- If the target dies first, the projectile still lands where the target last was.
  - A tabby or siamese shot then does nothing.
  - A Big Tom hairball still splashes there.
- Big Tom's splash measures distance on the ground only, so it also hits pigeons flying above the spot.

### Upgrades (3 levels)
- Upgrade cost: `round(base cost × 0.8 × current level)`.
  | Cat | → Lv 2 | → Lv 3 | Total spent at Lv 3 |
  |---|---|---|---|
  | Kitten | 32 | 64 | 136 |
  | Tabby | 56 | 112 | 238 |
  | Siamese | 48 | 96 | 204 |
  | Big Tom | 96 | 192 | 408 |
  | Persian | 72 | 144 | 306 |
- Every level gives:
  - damage **× 1.55**, rounded
  - range **+0.35**
  - attack interval **× 0.88**
  - DPS × ~1.76 per level
- Some cats also improve their special:
  | Cat | Lv 1 | Lv 2 | Lv 3 |
  |---|---|---|---|
  | Siamese: target's speed | 45 % | 38 % | 32 % |
  | Siamese: slow duration | 1.8 s | 2.1 s | 2.4 s |
  | Big Tom: splash radius | 1.30 | 1.45 | 1.60 |
  | Persian: purr bonus | +12 % | +18 % | +25 % |
- **Telling levels apart:**
  | Level | Look |
  |---|---|
  | 1 | nothing extra |
  | 2 | silver ring around the cushion, and a silver bell on a red collar |
  | 3 | thicker gold ring, and a gold bell |
  - Cats also grow 12 % per level.
  - The rings have an ink outline, so they read from any camera angle, including the top view.
  - The info panel shows the level as three pips in the same colours.

### Knockback
Every hit pushes the enemy's model backward for a moment. The push is **visual only**:
the enemy's real position on the path does not change.

## 6. Invaders

| Enemy | Base HP | Speed (tiles/s) | Reward | Lives lost | Special |
|---|---|---|---|---|---|
| 🐭 Mouse | 18 | 1.9 | 4 | 1 | — |
| 🦝 Raccoon | 55 | 1.15 | 8 | 1 | — |
| 🐿️ Squirrel | 28 | 1.4 | 6 | 1 | **Dashes** (see below) |
| 🐦 Pigeon | 32 | 1.45 | 7 | 1 | **Flies** 0.9 above the path. Kittens can't reach it. |
| 🦔 Hedgehog | 60 | 0.95 | 10 | 1 | **Armour 6**: each hit does 6 less damage, minimum 1 |
| 🐶 Dog | 170 | 0.75 | 18 | **2** | — |
| 👑 Bulldog King | 700 | 0.5 | 150 | **4** | **Boss.** Slows work only half as well on it. |

- **Squirrel dash:** the squirrel moves in 1-second cycles.
  - For half a second it dashes at 1.9× speed.
  - For the other half it nearly freezes, at 0.25× speed.
  - Average speed: about 1.5 tiles/s.
- **Boss and slows:** a slow of `f` counts as `1 − (1 − f) / 2` on the Bulldog King.
  For example, a 45 % speed slow leaves it at 72.5 % speed.
- **HP:** base HP × the growth curve for the wave × the extra toughness (with the ramp from §3).
  On the Garden, wave 10 enemies have 15.2× base HP.
- The first time a new kind of invader appears, a longer message introduces it.

## 7. Waves

- Start a wave with the button or **Space**. Calling a wave early (below) only works with the button, so a stray Space press can't trigger it.
- **Calling a wave early:** once every enemy of the current wave has spawned,
  you can call the next wave while enemies are still on the path.
  - It pays **10 + 2 × wave number** fish.
  - Waves then overlap. Each wave's clear bonus is paid when that wave's last invader is gone.
- The HUD shows a preview of the next wave: an icon and a count for each kind of invader.
- Kinds within a wave spawn spread evenly. Dogs come last, then the Bulldog King.
- Spawn spacing (seconds until the next enemy):
  | Enemy | Gap |
  |---|---|
  | Mouse | 0.5 |
  | Squirrel | 0.6 |
  | Pigeon | 0.7 |
  | Raccoon | 0.85 |
  | Hedgehog | 0.9 |
  | Dog | 1.5 |
  | Bulldog King | 2.5 |

Numbers of each invader in wave *n*:

| Invader | Formula |
|---|---|
| Mice | `n < 5 ? 4 + 2n : 7 + n` |
| Raccoons | `max(0, floor(1.2n) − 1)` |
| Squirrels | from wave 3: `min(6, n − 1)` |
| Pigeons | from wave 5: `min(5, n − 3)` |
| Hedgehogs | from wave 6: `min(4, n − 4)` |
| Dogs | `[0,0,0,1,1,1,2,2,3,3]` (first dog on wave 4) |
| Bulldog King | 1, on wave 10 |

The table below is for the Garden:

| Wave | 🐭 | 🦝 | 🐿️ | 🐦 | 🦔 | 🐶 | 👑 | HP × | Total HP | Kill fish | Clear bonus | Total fish earned since start (incl. 130) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 1.00 | 108 | 24 | 18 | 172 |
| 2 | 8 | 1 | 0 | 0 | 0 | 0 | 0 | 1.20 | 240 | 40 | 21 | 233 |
| 3 | 10 | 2 | 2 | 0 | 0 | 0 | 0 | 1.48 | 511 | 68 | 24 | 325 |
| 4 | 12 | 3 | 3 | 0 | 0 | 1 | 0 | 1.82 | 1 158 | 116 | 27 | 468 |
| 5 | 12 | 5 | 4 | 2 | 0 | 1 | 0 | 2.25 | 1 880 | 157 | 30 | 655 |
| 6 | 13 | 6 | 5 | 3 | 2 | 1 | 0 | 3.10 | 3 379 | 223 | 33 | 911 |
| 7 | 14 | 7 | 6 | 4 | 3 | 2 | 0 | 4.82 | 6 999 | 285 | 36 | 1 232 |
| 8 | 15 | 8 | 6 | 5 | 4 | 2 | 0 | 7.40 | 11 970 | 329 | 39 | 1 600 |
| 9 | 16 | 9 | 6 | 5 | 4 | 3 | 0 | 10.84 | 20 179 | 371 | 42 | 2 013 |
| 10 | 17 | 11 | 6 | 5 | 4 | 3 | 1 | 15.15 | 40 745 | 600 | 45 | 2 658 |

- "Total fish earned" assumes every enemy is killed and no wave is called early. It ignores spending.
- In wave 10, the Bulldog King has 10 607 of the 40 745 HP.

## 8. Controls

| Action | Mouse / touch | Keyboard |
|---|---|---|
| Pick a cat to place | Click a card in the tray | **1–5** (press again to deselect) |
| Place a cat | Click a grass tile | — |
| Select a placed cat | Click it | — |
| Upgrade / change target / sell the selected cat | Info panel buttons | **U** / **T** / **X** |
| Cancel / deselect | Right-click or click off the map | **Esc** |
| Start the next wave | Button | **Space** |
| Call the next wave early | Button only (so a stray Space press can't do it) | — |
| Pause | Pause button | **P** |
| Sound on / off | Speaker button | **M** |
| Game speed 1× / 2× / 3× | Speed button | — |
| Rotate the camera | Drag | — |
| Pan the camera | Right-drag or Shift+drag | **W A S D**, **Z Q S D** (AZERTY) or arrow keys |
| Zoom | Mouse wheel | — |
| Camera presets (Overview, Corner, Top, Low) | Camera button, which cycles through them | **V** |
| Language | FR / EN, on the title, result and pause screens | — |
| Map | Picker on the start and end screens | — |

- After you place a cat, the same cat stays selected so you can place more.
  It is deselected when you can no longer afford it.
- The game pauses when:
  - the start or end screen is open,
  - you press pause, or
  - you switch to another browser tab mid-game.
- You can still place cats, upgrade and pan the camera while paused.
- Choosing a map on the start or end screen sets up a fresh board for the next game.
- The browser remembers:
  - the language, map, game speed and mute setting
  - your best stars

## 9. Feedback and presentation

- **Sound:** every sound is generated live with WebAudio, so there are no audio files.
  - A meow when a cat is placed. Each breed has its own pitch.
  - Swipes, throws, thumps and boings for attacks.
  - A metallic tink when a hit bounces off a hedgehog's spines.
  - A coin chime for each kill.
  - A growl when the Bulldog King appears.
  - A jingle when a wave starts or is cleared, and on a win or loss.
  - Each sound plays at most once every 45 ms, so crowds of hits don't get too loud.
- **Cats celebrate:** they hop with both paws up after each cleared wave, and keep dancing after a win.
- **Michka** (on the chimney) reacts to the game:
  | Situation | Michka |
  |---|---|
  | Normally | calm, blinking, looking around |
  | An invader gets in | jumps, eyes wide, bristled tail |
  | Lives ≤ a third of the starting lives (min. 2) | panics: ears flat, tail bristled, shaking |
  | You win | dances |

## 10. Timing notes
- Game speed (1×–3×) affects movement, spawns, cooldowns, attack swings, slows, squirrel dashes and projectiles.
- Cosmetic animations always run in real time: the drop-in, particles, blinks and celebrations.
- Frame time is capped at 50 ms, so a lag spike cannot skip enemies past your cats.
