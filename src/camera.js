// The camera: an orbit around a point on the ground, preset views, mouse and keyboard controls,
// and the slow turn behind the title screen.
import * as THREE from 'three';
import { COLS, ROWS } from './config.js';
import { S } from './state.js';
import { L } from './i18n.js';
import { camera, renderer, stage } from './gfx.js';
import { hover } from './world.js';
import { $, clamp } from './util.js';

// theta: heading, phi: angle from straight down, zoom: multiple of the fit distance, (tx, tz): ground target.
const VIEWS = {
  overview: { theta: 0,     phi: 0.64, zoom: 1,    tx: 0,   tz: 0.4 },
  corner:   { theta: -0.75, phi: 0.86, zoom: 0.86, tx: 0.4, tz: 0.4 },
  top:      { theta: 0,     phi: 0.02, zoom: 1.08, tx: 0,   tz: 0.2 },
  low:      { theta: 0.4,   phi: 1.2,  zoom: 0.6,  tx: 1.2, tz: 0.8 },
};
const VIEW_ORDER = Object.keys(VIEWS);
// The title screen starts pulled back and slowly turns until the first game begins.
const TITLE_VIEW = { theta: -0.35, phi: 0.8, zoom: 1.3, tx: 0, tz: 0.4 };
const cam = { ...TITLE_VIEW }, want = { ...TITLE_VIEW };   // current values ease toward the wanted ones
const target = new THREE.Vector3();
let baseDist = 16, baseTheta = 0, frameShift = 1;
export let viewName = 'overview';

function applyCamera() {
  const th = cam.theta + baseTheta, r = baseDist * cam.zoom;
  target.set(cam.tx, 0, cam.tz);
  camera.position.set(target.x + r * Math.sin(cam.phi) * Math.sin(th), r * Math.cos(cam.phi), target.z + r * Math.sin(cam.phi) * Math.cos(th));
  camera.lookAt(target);
}

// ---------- Views ----------
// One camera button cycles through the preset views; its label names the current one ('Free' once moved by hand).
const viewLabel = name => name ? L('view' + name[0].toUpperCase() + name.slice(1)) : L('viewFree');
export function markView(name) {
  viewName = name;
  $('camLbl').textContent = viewLabel(name);
}
export const nextView = () => VIEW_ORDER[(VIEW_ORDER.indexOf(viewName) + 1) % VIEW_ORDER.length];
export function setView(name) {
  const v = VIEWS[name];
  Object.assign(want, v);
  want.theta = v.theta + Math.PI * 2 * Math.round((cam.theta - v.theta) / (Math.PI * 2)); // turn the short way round
  markView(name);
}

// ---------- Layout ----------
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight, aspect = w / h;
  renderer.setSize(w, h); camera.aspect = aspect;
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // fit distance for the overview; portrait turns the map so it runs top-to-bottom with the house at the bottom
  if (aspect >= 1) { baseTheta = 0; baseDist = Math.max(9.2 / (t * aspect), 6.4 / t); }
  else { baseTheta = Math.PI / 2; baseDist = Math.max(5.9 / (t * aspect), 8.6 / t); }
  camera.updateProjectionMatrix();
  applyCamera();
}

// ---------- Mouse ----------
// Drag orbits, right-drag (or Shift+drag) pans, wheel zooms. A press that moves under 6px is still a click.
let drag = null, noClickUntil = 0, noMenuUntil = 0;
export const dragging = () => !!drag?.moved;
export const clickAllowed = () => performance.now() >= noClickUntil;
export const menuAllowed = () => performance.now() >= noMenuUntil;   // false right after a right-drag pan

function dragCamera(ev) {
  const dx = ev.clientX - drag.lx, dy = ev.clientY - drag.ly;
  drag.lx = ev.clientX; drag.ly = ev.clientY;
  if (!drag.moved) {
    if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 6) return;
    drag.moved = true; hover.visible = false; markView(null);
  }
  if (drag.pan) {
    const th = cam.theta + baseTheta, s = baseDist * cam.zoom * 0.0016;
    want.tx = clamp(want.tx - Math.cos(th) * dx * s - Math.sin(th) * dy * s, -COLS / 2, COLS / 2);
    want.tz = clamp(want.tz + Math.sin(th) * dx * s - Math.cos(th) * dy * s, -ROWS / 2, ROWS / 2);
  } else {
    want.theta -= dx * 0.008;
    want.phi = clamp(want.phi - dy * 0.006, 0.02, 1.35);
  }
  Object.assign(cam, want); // follow the pointer directly, no easing lag
}

export function initCamera() {
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', ev => {
    drag = { x: ev.clientX, y: ev.clientY, lx: ev.clientX, ly: ev.clientY, pan: ev.button === 2 || ev.shiftKey, moved: false };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', ev => { if (drag) dragCamera(ev); });
  canvas.addEventListener('pointerup', () => {
    if (drag?.moved) { noClickUntil = performance.now() + 80; if (drag.pan) noMenuUntil = performance.now() + 400; }
    drag = null;
  });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('wheel', ev => {
    ev.preventDefault();
    want.zoom = clamp(want.zoom * Math.exp(ev.deltaY * 0.0012), 0.35, 1.6);
    markView(null);
  }, { passive: false });
  window.addEventListener('keyup', e => { panHeld.delete(PAN_KEYS[e.key.toLowerCase()]); });
  window.addEventListener('blur', () => panHeld.clear());
  window.addEventListener('resize', resize);
  resize();
}

// ---------- Keyboard ----------
// W/A/S/D, Z/Q/S/D (AZERTY) and arrow keys pan while held. Returns true if the key was a pan key.
const PAN_KEYS = { w: 'up', z: 'up', a: 'left', q: 'left', s: 'down', d: 'right', arrowup: 'up', arrowleft: 'left', arrowdown: 'down', arrowright: 'right' };
const panHeld = new Set();
export function holdPan(key) {
  const dir = PAN_KEYS[key];
  if (dir) panHeld.add(dir);
  return !!dir;
}

// ---------- Per frame ----------
export function updateCamera({ raw, overlayUp }) {
  // keyboard pan, relative to the camera heading (still works while paused, to look around)
  if (panHeld.size && !overlayUp) {
    const fx = (panHeld.has('right') ? 1 : 0) - (panHeld.has('left') ? 1 : 0);
    const fy = (panHeld.has('up') ? 1 : 0) - (panHeld.has('down') ? 1 : 0);
    if (fx || fy) {
      const th = cam.theta + baseTheta, len = Math.hypot(fx, fy), s = raw * 9 * cam.zoom / len;
      want.tx = clamp(want.tx + (Math.cos(th) * fx - Math.sin(th) * fy) * s, -COLS / 2, COLS / 2);
      want.tz = clamp(want.tz + (-Math.sin(th) * fx - Math.cos(th) * fy) * s, -ROWS / 2, ROWS / 2);
      if (viewName) markView(null);
    }
  }
  // title screen: the garden turns slowly behind the card
  if (overlayUp && !S.started) want.theta += raw * 0.07;
  // ease the camera toward the chosen view
  const ck = 1 - Math.exp(-raw * 7);
  for (const k in want) cam[k] += (want[k] - cam[k]) * ck;
  applyCamera();
  // while the title/result card is up on a wide screen, frame the garden to the right of it
  frameShift += ((overlayUp && innerWidth > 900 ? 1 : 0) - frameShift) * (1 - Math.exp(-raw * 4));
  if (frameShift > 0.002) { const w = stage.clientWidth, h = stage.clientHeight; camera.setViewOffset(w, h, -frameShift * w * 0.16, 0, w, h); }
  else if (camera.view?.enabled) camera.clearViewOffset();
}
