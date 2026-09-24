// Entry point: wires the modules together and runs the frame loop.
import * as THREE from 'three';
import { MAPS } from './config.js';
import { S, load } from './state.js';
import { renderer, scene, camera } from './gfx.js';
import { updateWorld } from './world.js';
import { updateCamera, initCamera } from './camera.js';
import { updateSpawner } from './waves.js';
import { updateEnemies } from './enemies.js';
import { updateCats } from './cats.js';
import { updateFx } from './fx.js';
import { reset } from './game.js';
import { initHud, applyLang } from './hud.js';
import { initMenu, menuOpen } from './menu.js';
import { initInput } from './input.js';

// Advance the game by `raw` seconds of real time and draw a frame.
// Game time (dt) stops while paused and runs 1–3× faster with the speed button; animations use real time.
let time = 0;
export function step(raw) {
  time += raw;
  const overlayUp = menuOpen();
  const paused = overlayUp || S.userPaused;
  const frame = { raw, dt: paused ? 0 : raw * S.speed, time, paused, overlayUp };
  updateCamera(frame);
  updateSpawner(frame.dt);
  updateEnemies(frame);
  updateCats(frame);
  updateFx(raw);
  updateWorld(frame);
  renderer.render(scene, camera);
}

const saved = load('map', 'garden');
S.mapId = saved in MAPS ? saved : 'garden';
initHud(); initMenu(); initCamera(); initInput();
reset();
applyLang();

// Frames are capped at 50 ms, so a lag spike can't carry invaders past the cats.
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => step(Math.min(clock.getDelta(), 0.05)));
