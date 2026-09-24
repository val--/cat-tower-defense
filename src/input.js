// Player input on the board and the keyboard: placing and selecting cats, and the shortcuts.
// (Camera drag, zoom and panning live in camera.js.)
import * as THREE from 'three';
import { COLS, ROWS, TYPES } from './config.js';
import { S } from './state.js';
import { L, catName } from './i18n.js';
import { camera, renderer, toWorld, inGrid } from './gfx.js';
import { hover, showRange, hideRange } from './world.js';
import { placeTower, upgrade, sell, cycleMode } from './cats.js';
import { sendWave } from './waves.js';
import { sfx } from './audio.js';
import { setView, nextView, holdPan, dragging, clickAllowed, menuAllowed } from './camera.js';
import { select, setPlacing, setPaused, toggleMute, toast } from './hud.js';
import { menuOpen } from './menu.js';

// The grid tile under the pointer, if any
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
function tileAt(ev) {
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(ground, hit)) return null;
  const c = Math.floor(hit.x + COLS / 2), r = Math.floor(hit.z + ROWS / 2);
  return inGrid(c, r) ? { c, r } : null;
}

// While placing: highlight the tile under the pointer (red if the cat can't go there) and preview its range
function onHover(ev) {
  if (dragging() || !S.placing || ev.pointerType === 'touch') return;
  const t = tileAt(ev);
  if (!t) { hover.visible = false; hideRange(); return; }
  const ok = S.grid[t.r][t.c] === 'grass' && S.fish >= TYPES[S.placing].cost;
  hover.visible = true; hover.position.copy(toWorld(t.c, t.r, 0.02));
  hover.material.color.set(ok ? 0xFFF4E2 : 0xC8553D);
  showRange(hover.position, TYPES[S.placing].range);
}

// Click: select a cat, place the picked cat on grass, or deselect
function onClick(ev) {
  if (S.over || !clickAllowed()) return;
  const t = tileAt(ev);
  if (!t) { setPlacing(null); select(null); return; }
  const cell = S.grid[t.r][t.c];
  if (typeof cell === 'object') { setPlacing(null); select(cell); return; }
  if (!S.placing) { select(null); return; }
  if (cell !== 'grass') { sfx('nope'); return toast(cell === 'path' ? L('noDirt') : L('taken')); }
  const T = TYPES[S.placing];
  if (S.fish < T.cost) { sfx('nope'); return toast(L('tooPoor', catName(S.placing), T.cost)); }
  placeTower(S.placing, t.c, t.r);
  if (S.fish < T.cost) setPlacing(null);
}

function onKey(e) {
  if (menuOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (holdPan(k)) { e.preventDefault(); return; }
  const type = Object.keys(TYPES).find(id => TYPES[id].key === e.key);
  if (type) setPlacing(S.placing === type ? null : type);
  else if (k === 'escape') { setPlacing(null); select(null); }
  // Space only starts a wave when the path is clear: calling one early takes a deliberate click on the button
  else if (e.code === 'Space' || k === ' ') { e.preventDefault(); document.activeElement?.blur?.(); if (!S.waveActive) sendWave(); }
  else if (k === 'u' && S.selected) upgrade(S.selected);
  else if (k === 't' && S.selected) cycleMode(S.selected);
  else if (k === 'x' && S.selected) sell(S.selected);
  else if (k === 'p') setPaused(!S.userPaused);
  else if (k === 'm') toggleMute();
  else if (k === 'v') setView(nextView());
}

export function initInput() {
  const canvas = renderer.domElement;
  canvas.addEventListener('pointermove', onHover);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('contextmenu', ev => {
    ev.preventDefault();
    if (menuAllowed()) { setPlacing(null); select(null); } // a right-drag pan isn't a "cancel"
  });
  window.addEventListener('keydown', onKey);
}
