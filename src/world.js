// The garden: map tiles and bushes, the house, Michka on the chimney, and the placement markers.
import * as THREE from 'three';
import { COLS, ROWS, MAPS, HOUSE_TILES, MICHKA } from './config.js';
import { S } from './state.js';
import { scene, toWorld, inGrid, lambert, toon, SPH, mesh, shadows, outline } from './gfx.js';
import { makeCat } from './models.js';

// ---------- Map ----------
const mapGroup = new THREE.Group(); scene.add(mapGroup);

const base = mesh(new THREE.BoxGeometry(COLS + 1, 0.6, ROWS + 1), new THREE.MeshLambertMaterial({ color: 0x6E8F4E }), { p: [0, -0.5, 0] });
base.receiveShadow = true; scene.add(base);

const tileGeo = new THREE.BoxGeometry(0.98, 0.2, 0.98);
// Ground keeps soft Lambert shading so the toon-shaded characters pop against it.
const soft = color => new THREE.MeshLambertMaterial({ color });
const grassA = soft(0x9BC36F), grassB = soft(0x8DB864), dirt = soft(0xE6C48C), dirtB = soft(0xDDB97E);

// Lay out map `id`: fills S.grid and S.path, and rebuilds the tiles and bushes.
export function buildMap(id) {
  S.mapId = id;
  const M = MAPS[id];
  const grid = S.grid = Array.from({ length: ROWS }, () => Array(COLS).fill('grass'));
  HOUSE_TILES.forEach(([c, r]) => grid[r][c] = 'house');
  for (let i = 0; i < M.path.length - 1; i++) {
    const [c0, r0] = M.path[i], [c1, r1] = M.path[i + 1];
    const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
    for (let s = 0; s <= steps; s++) {
      const c = c0 + Math.sign(c1 - c0) * s, r = r0 + Math.sign(r1 - r0) * s;
      if (inGrid(c, r) && grid[r][c] === 'grass') grid[r][c] = 'path';
    }
  }
  M.bushes.forEach(([c, r]) => { if (grid[r][c] === 'grass') grid[r][c] = 'bush'; });
  S.path = M.path.map(([c, r]) => toWorld(c, r));

  mapGroup.clear();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = grid[r][c];
    const isPath = t === 'path';
    const m = new THREE.Mesh(tileGeo, isPath ? ((c + r) % 2 ? dirt : dirtB) : ((c + r) % 2 ? grassA : grassB));
    m.position.copy(toWorld(c, r, isPath ? -0.14 : -0.1));
    m.receiveShadow = true;
    mapGroup.add(m);
    if (t === 'bush') {
      const b = new THREE.Group(), leaf = toon(0x5E8C43);
      b.add(mesh(SPH, leaf, { p: [0, 0.25, 0], s: 0.34 }), mesh(SPH, leaf, { p: [0.2, 0.18, 0.1], s: 0.24 }), mesh(SPH, leaf, { p: [-0.18, 0.16, -0.08], s: 0.22 }));
      b.add(mesh(SPH, toon(0xE86A92), { p: [0.1, 0.5, 0.15], s: 0.06 }), mesh(SPH, toon(0xF2D25C), { p: [-0.15, 0.4, 0.2], s: 0.05 }));
      b.position.copy(toWorld(c, r)); b.rotation.y = c * 1.7;
      shadows(b); outline(b, 1.05); mapGroup.add(b);
    }
  }
}

// ---------- House ----------
// Every map's path ends at the same door, with a doormat in front of it.
const door = toWorld(14, 5);
const doormat = mesh(new THREE.BoxGeometry(0.5, 0.03, 0.7), lambert(0xB05A7A), { p: [door.x - 0.35, 0, door.z] });
doormat.receiveShadow = true; scene.add(doormat);

const house = new THREE.Group();
const hx = door.x + 0.5, hz = door.z;
house.position.set(hx, 0, hz);
house.add(mesh(new THREE.BoxGeometry(1.7, 1.15, 2.6), lambert(0xE9D8BE), { p: [0, 0.57, 0] }));
const roofGeo = new THREE.CylinderGeometry(0.01, 1.35, 0.8, 4, 1); roofGeo.rotateY(Math.PI / 4);
house.add(mesh(roofGeo, lambert(0xC8553D), { p: [0, 1.55, 0], s: [1, 1, 1.45] }));
house.add(mesh(new THREE.BoxGeometry(0.28, 0.5, 0.28), lambert(0x8A3A2B), { p: [0.35, 1.85, -0.6] }));           // chimney
house.add(mesh(new THREE.BoxGeometry(0.06, 0.62, 0.46), lambert(0x5B3A29), { p: [-0.86, 0.31, 0] }));           // door
house.add(mesh(new THREE.CircleGeometry(0.12, 16), lambert(0x2B2536), { p: [-0.9, 0.22, 0], r: [0, -Math.PI / 2, 0] })); // cat flap
const winMat = lambert(0xFFE39A);
house.add(mesh(new THREE.BoxGeometry(0.05, 0.3, 0.34), winMat, { p: [-0.86, 0.72, 0.85] }), mesh(new THREE.BoxGeometry(0.05, 0.3, 0.34), winMat, { p: [-0.86, 0.72, -0.85] }));
shadows(house); outline(house, 1.025); scene.add(house);
const houseWalls = house.children[0].material;
const hurtColor = new THREE.Color(0xC8553D);
let houseShake = 0;

// Michka, the house cat, keeps watch from the chimney, facing the path.
export const michka = makeCat(MICHKA);
michka.g.position.set(0.35, 1.965, -0.6); michka.g.rotation.y = -Math.PI / 2; house.add(michka.g);
Object.assign(michka, { hop: 0, blink: 2, blinkT: 0 });

// An invader got in: the house shakes and blushes, Michka jumps.
export function houseHit() { houseShake = 0.4; michka.hop = 0.5; }

// Per frame: the house recovering from a hit, and Michka's mood.
export function updateWorld({ raw, time }) {
  if (houseShake > 0) {
    houseShake -= raw;
    house.position.x = hx + Math.sin(time * 60) * 0.05 * (houseShake / 0.4);
    houseWalls.color.setHex(0xE9D8BE).lerp(hurtColor, houseShake / 0.4);
  } else { house.position.x = hx; houseWalls.color.setHex(0xE9D8BE); }

  // Michka: calm and blinking, startled when something gets in,
  // frantic (fur up, ears back, eyes wide) when lives run low, and dancing after a win.
  const m = michka;
  const panic = S.started && !S.over && S.lives <= Math.max(2, Math.ceil(S.maxLives / 3));
  const party = S.over && S.ending?.won;
  m.hop = Math.max(0, m.hop - raw);
  const startled = m.hop > 0;
  let y = startled ? Math.sin((m.hop / 0.5) * Math.PI) * 0.22 : 0;
  if (party) y = Math.abs(Math.sin(time * 6)) * 0.16;
  if (panic) y += Math.abs(Math.sin(time * 9)) * 0.04;
  m.body.position.set(panic ? Math.sin(time * 40) * 0.012 : 0, 0.12 + y, 0);
  m.body.scale.set(0.6, 0.6 * (1 + Math.sin(time * 2) * 0.02), 0.6);
  m.head.rotation.y = panic ? Math.sin(time * 5) * 0.35 : Math.sin(time * 0.45) * 0.5;
  m.ears.forEach((ear, i) => ear.rotation.z = (i ? -1 : 1) * (panic || startled ? 1.1 : 0.3));
  m.tail.forEach((seg, i) => {
    seg.children[0].scale.set(panic || startled ? 1.8 : 1, 1, panic || startled ? 1.8 : 1); // bottle-brush tail
    seg.rotation.z = Math.sin(time * (panic ? 14 : 1.8) - i * 0.7) * (0.12 + i * 0.03);
  });
  m.arms.forEach((arm, i) => arm.rotation.x = party ? -2.3 + Math.sin(time * 8 + i * 2) * 0.3 : 0);
  m.blink -= raw;
  if (m.blink <= 0) { m.blinkT = 0.13; m.blink = 2 + Math.random() * 4; }
  m.blinkT = Math.max(0, m.blinkT - raw);
  const eyeS = panic || startled ? 1.35 : 1;
  m.eyes.forEach(eye => eye.scale.set(eyeS, m.blinkT > 0 && !panic ? 0.12 : eyeS, eyeS));
}

// ---------- Markers ----------
// The tile under the pointer while placing a cat, and a cat's range circle.
export const hover = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.03, 0.96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }));
hover.visible = false; scene.add(hover);
const rangeGroup = new THREE.Group();
rangeGroup.add(new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0xFFF4E2, transparent: true, opacity: 0.16, depthWrite: false })));
rangeGroup.add(new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0xFFF4E2, transparent: true, opacity: 0.8, depthWrite: false })));
rangeGroup.rotation.x = -Math.PI / 2; rangeGroup.position.y = 0.02; rangeGroup.visible = false;
scene.add(rangeGroup);
export const showRange = (pos, r) => { rangeGroup.visible = true; rangeGroup.position.x = pos.x; rangeGroup.position.z = pos.z; rangeGroup.scale.setScalar(r); };
export const hideRange = () => { rangeGroup.visible = false; };
