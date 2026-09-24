// Short-lived visual effects: smoke puffs, sparks, ground rings, claw slashes, purring notes,
// and the fish that fly to the counter.
import * as THREE from 'three';
import { scene, camera, renderer, SPH, basic, drop } from './gfx.js';
import { ART } from './art.js';
import { $, bump } from './util.js';

let puffs = [], rings = [], flashes = [], notes = [];

// A pink music note with an ink outline, drawn once on a canvas; purring cats give off these notes
const noteTexture = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  g.lineWidth = 5; g.strokeStyle = '#2B2536'; g.fillStyle = '#F07AA6'; g.lineJoin = 'round';
  const shape = () => {
    g.beginPath();
    g.ellipse(22, 46, 11, 8, -0.4, 0, Math.PI * 2);               // note head
    g.moveTo(31, 44); g.lineTo(31, 10); g.lineTo(48, 16); g.lineTo(48, 24); g.lineTo(35, 20); g.lineTo(35, 44); // stem and flag
  };
  shape(); g.stroke(); shape(); g.fill();
  return new THREE.CanvasTexture(cv);
})();
const dropNote = n => { scene.remove(n.mesh); n.mesh.material.dispose(); };  // sprites aren't meshes, so free by hand
export function note(pos, y) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTexture, transparent: true, depthWrite: false }));
  s.scale.setScalar(0.42);
  s.position.set(pos.x + (Math.random() - 0.5) * 0.4, y, pos.z + (Math.random() - 0.5) * 0.4);
  scene.add(s);
  notes.push({ mesh: s, life: 1.2, max: 1.2, sway: Math.random() * 6 });
}

// Soft cartoon smoke: spheres that swell and fade. They share one material, freed when the last puff is gone.
export function cloud(pos, color, n, size, y = 0) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
  mat.userData.left = n;
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(SPH, mat);
    const a = (i / n) * Math.PI * 2;
    p.position.set(pos.x + Math.cos(a) * 0.12, 0.3 + y, pos.z + Math.sin(a) * 0.12); scene.add(p);
    puffs.push({ mesh: p, cloud: true, v: new THREE.Vector3(Math.cos(a) * 0.9, 0.8 + Math.random() * 0.6, Math.sin(a) * 0.9), life: 0.45, max: 0.45, size: size * (0.8 + Math.random() * 0.5) });
  }
}

// Little sparks that pop up and fall
export function burst(pos, color, n, size = 0.07, y = 0) {
  const m = basic(color);
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(SPH, m); p.scale.setScalar(size);
    p.position.set(pos.x, 0.35 + y, pos.z); scene.add(p);
    const a = Math.random() * Math.PI * 2, s = 1.2 + Math.random() * 1.8;
    puffs.push({ mesh: p, v: new THREE.Vector3(Math.cos(a) * s, 2 + Math.random() * 2, Math.sin(a) * s), life: 0.5, max: 0.5, size });
  }
}

// A ring that spreads out on the ground and fades
const ringGeo = new THREE.RingGeometry(0.78, 1, 40);
export function ring(pos, color, radius, life = 0.4) {
  const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(pos.x, 0.03, pos.z); scene.add(m);
  rings.push({ mesh: m, life, max: life, radius });
}

// Three claw marks that flash across the target, facing the camera
const slashGeo = new THREE.PlaneGeometry(0.035, 0.5);
export function slash(pos, dir) {
  const grp = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, depthTest: false });
  [-1, 0, 1].forEach(i => {
    const m = new THREE.Mesh(slashGeo, mat);
    m.position.x = i * 0.1; m.rotation.z = 0.6 * dir; m.renderOrder = 12;
    m.scale.y = 1 - Math.abs(i) * 0.25;
    grp.add(m);
  });
  grp.position.set(pos.x, 0.4, pos.z);
  scene.add(grp);
  flashes.push({ mesh: grp, life: 0.22, max: 0.22, update(k) {
    grp.quaternion.copy(camera.quaternion);
    grp.scale.set(1, 0.4 + 0.9 * Math.min(1, k * 3), 1);
    mat.opacity = 1 - k * k;
  } });
}

// A little fish that flies from the kill to the fish counter
export function flyFish(pos, amount, y = 0) {
  const v = new THREE.Vector3(pos.x, 0.6 + y, pos.z).project(camera);
  const r = renderer.domElement.getBoundingClientRect();
  const x = r.left + (v.x + 1) / 2 * r.width, sy = r.top + (1 - v.y) / 2 * r.height;
  const el = document.createElement('div');
  el.className = 'coin'; el.innerHTML = ART.fish + '+' + amount;
  el.style.left = x + 'px'; el.style.top = sy + 'px';
  document.body.appendChild(el);
  const tgt = $('fishStat').getBoundingClientRect();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transform = `translate(${tgt.left + 18 - x}px, ${tgt.top + tgt.height / 2 - sy}px) scale(.55)`;
    el.style.opacity = '0.2';
  }));
  setTimeout(() => { el.remove(); bump('fishStat', 'gain'); }, 700);
}

// Effects run on real time, so they keep playing (and finish) while the game is paused.
export function updateFx(raw) {
  for (const p of puffs) {
    p.life -= raw;
    const k = 1 - p.life / p.max;
    if (p.cloud) {
      p.v.multiplyScalar(Math.exp(-raw * 4));
      p.mesh.scale.setScalar(p.size * (1 + 1.3 * k));
      p.mesh.material.opacity = Math.max(0, 1 - k * k);
    } else {
      p.v.y -= 9 * raw;
      p.mesh.scale.setScalar(Math.max(0.001, p.size * (1 - k)));
    }
    p.mesh.position.addScaledVector(p.v, raw);
    if (p.life <= 0) {
      scene.remove(p.mesh); p.done = true;
      if (p.cloud && --p.mesh.material.userData.left <= 0) p.mesh.material.dispose();
    }
  }
  puffs = puffs.filter(p => !p.done);

  for (const r of rings) {
    r.life -= raw;
    const k = 1 - r.life / r.max;
    r.mesh.scale.setScalar(r.radius * (0.3 + 0.7 * Math.sqrt(k)));
    r.mesh.material.opacity = 0.9 * (1 - k);
    if (r.life <= 0) { drop(r.mesh); r.done = true; }
  }
  rings = rings.filter(r => !r.done);

  for (const f of flashes) {
    f.life -= raw;
    f.update(Math.min(1, 1 - f.life / f.max));
    if (f.life <= 0) { drop(f.mesh); f.done = true; }
  }
  flashes = flashes.filter(f => !f.done);

  // notes drift up, sway and fade
  for (const n of notes) {
    n.life -= raw;
    const k = 1 - n.life / n.max;
    n.mesh.position.y += raw * 0.55;
    n.mesh.position.x += Math.sin(n.sway + k * 7) * raw * 0.25;
    n.mesh.material.opacity = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
    if (n.life <= 0) { dropNote(n); n.done = true; }
  }
  notes = notes.filter(n => !n.done);
}

export function clearFx() {
  [...puffs, ...rings, ...flashes].forEach(f => drop(f.mesh));
  notes.forEach(dropNote);
  puffs = []; rings = []; flashes = []; notes = [];
  document.querySelectorAll('.coin').forEach(el => el.remove());
}
