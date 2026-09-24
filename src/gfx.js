// three.js setup (renderer, scene, camera, lights) and the helpers every model is built with:
// toon materials, ink outlines, a geometry cache, and clean removal of objects.
import * as THREE from 'three';
import { COLS, ROWS } from './config.js';

// ---------- Renderer / scene ----------
export const stage = document.getElementById('stage');
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9CC27A);
scene.fog = new THREE.Fog(0x9CC27A, 30, 60);

export const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

scene.add(new THREE.HemisphereLight(0xFFF4E2, 0x5F7A45, 0.5));
const sun = new THREE.DirectionalLight(0xFFF1D6, 0.65);
sun.position.set(-6, 14, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: 1, far: 40 });
sun.shadow.bias = -0.0005;
scene.add(sun);

// ---------- Grid ↔ world ----------
export const toWorld = (c, r, y = 0) => new THREE.Vector3(c - COLS / 2 + 0.5, y, r - ROWS / 2 + 0.5);
export const inGrid = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS;

// ---------- Materials ----------
// Toon shading: a 3-step light ramp, sampled with nearest filtering for hard bands.
const toonRamp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.LuminanceFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
export const lambert = color => new THREE.MeshToonMaterial({ color, gradientMap: toonRamp });
// Materials that are never animated are shared, and registered so disposeMats leaves them alone.
const SHARED = new Set();
export const shared = m => (SHARED.add(m), m);
const BASIC = new Map(), TOON = new Map();
export const basic = color => BASIC.get(color) || (BASIC.set(color, shared(new THREE.MeshBasicMaterial({ color }))), BASIC.get(color));
export const toon = color => TOON.get(color) || (TOON.set(color, shared(lambert(color))), TOON.get(color));

// Ink outlines via the inverted-hull trick: a slightly larger back-face copy of each mesh.
export const inkMat = shared(new THREE.MeshBasicMaterial({ color: 0x2B2536, side: THREE.BackSide }));
export function outline(root, k = 1.07) {
  const list = [];
  root.traverse(o => { if (o.isMesh && !o.userData.ink && !o.userData.noInk && !(o.geometry instanceof THREE.TorusGeometry) && Math.max(o.scale.x, o.scale.y, o.scale.z) > 0.045) list.push(o); });
  list.forEach(o => {
    const h = new THREE.Mesh(o.geometry, inkMat);
    h.scale.setScalar(k); h.userData.ink = true;
    o.add(h);
  });
}

// ---------- Geometry ----------
export const SPH = new THREE.SphereGeometry(1, 20, 14);
// Geometry cache: rigs are rebuilt for every cat and invader, but identical shapes share one GPU buffer.
// `make` builds the geometry the first time a key is asked for (use it to bake in a translate).
const GEO = new Map();
export const geo = (key, make) => { if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); };
export const cyl = (...a) => geo('cyl' + a, () => new THREE.CylinderGeometry(...a));
export const cone = (...a) => geo('cone' + a, () => new THREE.ConeGeometry(...a));
export const box = (...a) => geo('box' + a, () => new THREE.BoxGeometry(...a));
export const torus = (...a) => geo('torus' + a, () => new THREE.TorusGeometry(...a));

// A mesh with optional position (p), scale (s: number or [x, y, z]) and rotation (r).
export const mesh = (g, mat, props = {}) => {
  const m = new THREE.Mesh(g, mat);
  if (props.p) m.position.set(...props.p);
  if (props.s) Array.isArray(props.s) ? m.scale.set(...props.s) : m.scale.setScalar(props.s);
  if (props.r) m.rotation.set(...props.r);
  m.castShadow = true;
  return m;
};
// Only parts big enough to show up in the shadow map cast one: eyes, noses and whiskers don't.
export const shadows = obj => obj.traverse(o => {
  if (!o.isMesh) return;
  if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
  o.castShadow = o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) > 0.07;
  o.receiveShadow = true;
});

// Take an object out of the scene and free its own materials. Geometry is cached, so it's kept.
const disposeMats = root => root.traverse(o => { if (o.isMesh && !SHARED.has(o.material)) o.material.dispose(); });
export const drop = obj => { scene.remove(obj); disposeMats(obj); };
