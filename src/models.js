// The 3D models: cats (towers and Michka), the invaders, and floating health bars.
// Models are toon-shaded, ink-outlined groups of simple shapes, rigged with pivots that the game animates.
import * as THREE from 'three';
import { scene, lambert, toon, basic, shared, inkMat, outline, SPH, geo, cyl, cone, box, torus, mesh, shadows } from './gfx.js';

// ---------- Cats ----------
// Cat rig: g (placement) > body (size, squash, lunge) > torso, haunches, arm pivots, head group, tail chain.
// A sitting cat: +z is forward, front legs straight down from the shoulders.
export function makeCat(T) {
  const g = new THREE.Group();
  const fur = lambert(T.color), pts = lambert(T.pts), dark = lambert(0x221C26);
  if (T.cushion) g.add(mesh(cyl(0.4, 0.43, 0.12, 20), lambert(T.cushion), { p: [0, 0.06, 0] }));
  const body = new THREE.Group(); body.position.y = 0.12; body.scale.setScalar(T.size); g.add(body);
  const bib = T.bib ? lambert(T.bib) : fur;
  const pawMat = T.marks === 'mask' ? pts : T.bib ? bib : pts;
  const torso = mesh(SPH, fur, { p: [0, 0.25, -0.03], s: [0.24, 0.3, 0.26], r: [-0.18, 0, 0] });
  body.add(torso);
  if (T.bib) body.add(mesh(SPH, bib, { p: [0, 0.3, 0.12], s: [0.15, 0.21, 0.12], r: [-0.18, 0, 0] }));
  [-1, 1].forEach(s => {
    body.add(mesh(SPH, fur, { p: [0.14 * s, 0.12, -0.08], s: [0.11, 0.13, 0.17] }));  // haunch
    body.add(mesh(SPH, pawMat, { p: [0.15 * s, 0.025, 0.08], s: [0.055, 0.035, 0.09] })); // hind foot
  });
  // front legs on shoulder pivots: rotation.x < 0 swings the paw forward and up
  const legGeo = geo('catLeg', () => new THREE.CylinderGeometry(0.042, 0.048, 0.3, 8).translate(0, -0.15, 0));
  const arms = [], paws = [];
  [-1, 1].forEach(s => {
    const arm = new THREE.Group(); arm.position.set(0.085 * s, 0.36, 0.13);
    arm.add(mesh(legGeo, T.marks === 'mask' ? pts : fur));
    const paw = mesh(SPH, pawMat, { p: [0, -0.325, 0.025], s: [0.062, 0.045, 0.075] });
    arm.add(paw); body.add(arm); arms.push(arm); paws.push(paw);
  });
  // head
  const head = new THREE.Group(); head.position.set(0, 0.62, 0.07); body.add(head);
  head.add(mesh(SPH, fur, { s: [0.22, 0.2, 0.2] }));
  const cheek = T.marks === 'fluff' ? 1.35 : 1;
  [-1, 1].forEach(s => head.add(mesh(SPH, fur, { p: [0.1 * s * cheek, -0.07, 0.06], s: [0.1 * cheek, 0.085 * cheek, 0.1] }))); // cheek fluff
  if (T.marks === 'fluff') body.add(mesh(SPH, bib, { p: [0, 0.45, 0.06], s: [0.27, 0.17, 0.22] }));              // Persian ruff
  const muzzleMat = T.marks === 'mask' ? pts : T.bib ? bib : lambert(0xFFF4E2);
  [-1, 1].forEach(s => head.add(mesh(SPH, muzzleMat, { p: [0.037 * s, -0.075, 0.16], s: [0.05, 0.04, 0.04] })));
  head.add(mesh(SPH, muzzleMat, { p: [0, -0.11, 0.14], s: [0.04, 0.03, 0.035] }));                      // chin
  head.add(mesh(cone(0.024, 0.025, 3), toon(0xE86A92), { p: [0, -0.045, 0.197], r: [Math.PI, 0, 0] })); // nose
  const whiskerMat = basic(T.color < 0x606060 ? 0xF4EFE6 : 0x4A4250);
  const whiskerGeo = geo('whisker', () => new THREE.BoxGeometry(0.17, 0.005, 0.005).translate(0.085, 0, 0));
  [-1, 1].forEach(s => [-1, 0, 1].forEach(i => {
    const w = new THREE.Mesh(whiskerGeo, whiskerMat); w.userData.noInk = true;
    w.position.set(0.06 * s, -0.07 + i * 0.012, 0.17);
    w.rotation.set(0, s > 0 ? -0.35 : Math.PI + 0.35, i * 0.14 * s);
    head.add(w);
  }));
  const earGeo = cone(0.075, 0.17, 4), innerEar = toon(0xE8A0B0);
  const ears = [-1, 1].map(s => {
    const e = new THREE.Group(); e.position.set(0.11 * s, 0.15, -0.01); e.rotation.z = -0.3 * s;
    e.add(mesh(earGeo, pts, { p: [0, 0.06, 0] }), mesh(earGeo, innerEar, { p: [0, 0.05, 0.03], s: [0.6, 0.7, 0.4] }));
    if (T.marks === 'torn' && s > 0) e.scale.set(1, 0.72, 1);   // Big Tom lost a fight once
    head.add(e); return e;
  });
  if (T.marks === 'stripes') [-1, 0, 1].forEach(i => head.add(mesh(SPH, pts, { p: [i * 0.05, 0.13, 0.13], s: [0.014, 0.05, 0.02], r: [0.5, 0, -i * 0.3] })));
  if (T.marks === 'torn') head.add(mesh(new THREE.BoxGeometry(0.012, 0.09, 0.01), lambert(0xE8A0B0), { p: [-0.09, 0.07, 0.17], r: [0.2, 0.3, 0.4] })); // scar
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff }), iris = lambert(T.eye);
  const eyes = [-1, 1].map(s => {
    const eye = new THREE.Group(); eye.position.set(0.08 * s, 0.03, 0.163); eye.rotation.y = 0.28 * s;
    eye.add(mesh(SPH, iris, { s: [0.046, 0.054, 0.03] }), mesh(SPH, dark, { p: [0, 0, 0.016], s: [0.016, 0.042, 0.02] }), mesh(SPH, white, { p: [0.014, 0.02, 0.028], s: 0.012 }));
    head.add(eye); return eye;
  });
  // tail: a chain of tapering segments that curls up behind; wagged as a travelling wave
  const tail = [], ringed = T.marks === 'stripes';
  let parent = body;
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Group();
    if (i === 0) seg.position.set(0, 0.08, -0.28); else seg.position.y = 0.085;
    seg.rotation.x = i === 0 ? -1.45 : 0.32;
    const r0 = (0.045 - i * 0.004) * (T.marks === 'fluff' ? 1.6 : 1);
    const segGeo = geo('tail' + r0, () => new THREE.CylinderGeometry(r0 - 0.004, r0, 0.1, 7).translate(0, 0.045, 0));
    seg.add(mesh(segGeo, i === 5 || (ringed && i % 2) ? pts : fur));
    parent.add(seg); tail.push(seg); parent = seg;
  }
  // Rank marks, hidden until level 2 (see dressCat): a ring around the cushion, readable from any camera
  // angle, and a collar with a bell
  const rank = {};
  if (T.cushion) {
    rank.rim = mesh(torus(0.43, 0.04, 8, 40), toon(0xDCE3EC), { p: [0, 0.125, 0], r: [Math.PI / 2, 0, 0] });
    rank.rim.add(rank.rimInk = new THREE.Mesh(torus(0.43, 0.058, 8, 40), inkMat)); // ink outline, like the models
    g.add(rank.rim);
  }
  rank.collar = mesh(torus(0.14, 0.03, 8, 24), toon(0xC8553D), { p: [0, 0.49, 0.05], r: [Math.PI / 2 + 0.35, 0, 0] });
  rank.bell = mesh(SPH, toon(0xDCE3EC), { p: [0, 0.43, 0.23], s: 0.055 });
  body.add(rank.collar, rank.bell);
  shadows(g); outline(g);
  [rank.rim, rank.collar, rank.bell].forEach(m => { if (m) m.visible = false; }); // the ring's ink child follows its parent
  return { g, body, torso, head, ears, eyes, tail, arms, paws, rank };
}

// ---------- Invaders ----------
const UP = new THREE.Vector3(0, 1, 0); // hedgehog spines point away from the body
// Each invader's body parts. A builder fills the rig (the inner group, the tail pivot, the wings list)
// using the shared dark and pink materials and the addLegs / eyes helpers.
const INVADERS = {
  mouse({ inner, tail, pink, addLegs, eyes }) {
    const fur = lambert(0xA7A0AE);
    inner.add(mesh(SPH, fur, { p: [0, 0.2, 0], s: [0.2, 0.18, 0.3] }), mesh(SPH, fur, { p: [0, 0.25, 0.28], s: 0.14 }));
    inner.add(mesh(SPH, pink, { p: [-0.1, 0.38, 0.24], s: [0.08, 0.08, 0.02] }), mesh(SPH, pink, { p: [0.1, 0.38, 0.24], s: [0.08, 0.08, 0.02] }));
    inner.add(mesh(SPH, pink, { p: [0, 0.24, 0.43], s: 0.03 }));
    eyes(0.06, 0.29, 0.39, 0.026);
    addLegs([[-0.1, 0.14], [0.1, 0.14], [-0.1, -0.14], [0.1, -0.14]], 0.1, 0.07, 0.03, fur, pink);
    tail.position.set(0, 0.16, -0.28);
    tail.add(mesh(cyl(0.015, 0.022, 0.45, 5), pink, { p: [0, -0.06, -0.2], r: [Math.PI / 2 + 0.3, 0, 0] }));
  },
  raccoon({ inner, tail, dark, addLegs }) {
    const fur = lambert(0x7D7A83), light = lambert(0xCFCAD3);
    inner.add(mesh(SPH, fur, { p: [0, 0.34, 0], s: [0.28, 0.26, 0.38] }), mesh(SPH, fur, { p: [0, 0.44, 0.36], s: 0.21 }));
    inner.add(mesh(SPH, light, { p: [0, 0.38, 0.52], s: [0.1, 0.08, 0.09] }), mesh(SPH, dark, { p: [0, 0.39, 0.61], s: 0.035 }));
    inner.add(mesh(SPH, dark, { p: [0, 0.48, 0.47], s: [0.2, 0.06, 0.1] }));
    inner.add(mesh(SPH, light, { p: [-0.08, 0.49, 0.555], s: 0.028 }), mesh(SPH, light, { p: [0.08, 0.49, 0.555], s: 0.028 }));
    inner.add(mesh(cone(0.06, 0.12, 5), dark, { p: [-0.13, 0.64, 0.32] }), mesh(cone(0.06, 0.12, 5), dark, { p: [0.13, 0.64, 0.32] }));
    addLegs([[-0.15, 0.2], [0.15, 0.2], [-0.15, -0.2], [0.15, -0.2]], 0.2, 0.16, 0.045, fur, dark);
    tail.position.set(0, 0.36, -0.32);
    for (let i = 0; i < 4; i++) tail.add(mesh(cyl(0.075 - i * 0.008, 0.08 - i * 0.008, 0.13, 8), i % 2 ? dark : light, { p: [0, 0.02 + i * 0.03, -0.06 - i * 0.12], r: [Math.PI / 2 - 0.3, 0, 0] }));
  },
  squirrel({ inner, tail, dark, addLegs, eyes }) {
    // upright little body, tufted ears, and a big bushy tail curling up over its back
    const fur = lambert(0xC4703A), belly = lambert(0xF2DEC0);
    inner.add(mesh(SPH, fur, { p: [0, 0.26, 0], s: [0.17, 0.2, 0.24], r: [-0.4, 0, 0] }), mesh(SPH, belly, { p: [0, 0.25, 0.1], s: [0.12, 0.15, 0.1], r: [-0.4, 0, 0] }));
    inner.add(mesh(SPH, fur, { p: [0, 0.42, 0.2], s: 0.13 }), mesh(SPH, belly, { p: [0, 0.38, 0.29], s: [0.07, 0.06, 0.06] }), mesh(SPH, dark, { p: [0, 0.41, 0.335], s: 0.022 }));
    eyes(0.065, 0.46, 0.29, 0.028);
    inner.add(mesh(cone(0.035, 0.1, 5), fur, { p: [-0.07, 0.57, 0.17], r: [0, 0, 0.2] }), mesh(cone(0.035, 0.1, 5), fur, { p: [0.07, 0.57, 0.17], r: [0, 0, -0.2] }));
    addLegs([[-0.08, 0.12], [0.08, 0.12], [-0.1, -0.1], [0.1, -0.1]], 0.12, 0.09, 0.03, fur, belly);
    tail.position.set(0, 0.22, -0.2);
    [[0, 0.04, -0.08, 0.1], [0, 0.19, -0.16, 0.13], [0, 0.37, -0.12, 0.14], [0, 0.5, -0.01, 0.11]]
      .forEach(([x, y, z, s]) => tail.add(mesh(SPH, fur, { p: [x, y, z], s })));
  },
  hedgehog({ inner, dark, addLegs, eyes }) {
    // a dome of spines over a pale snout
    const skin = lambert(0x9C7B5B), spine = lambert(0x5E4634), pale = lambert(0xE9D5B5);
    const R = [0.26, 0.2, 0.3], c = new THREE.Vector3(0, 0.2, -0.02);
    inner.add(mesh(SPH, skin, { p: [c.x, c.y, c.z], s: R }));
    inner.add(mesh(SPH, pale, { p: [0, 0.17, 0.28], s: [0.11, 0.09, 0.14] }), mesh(SPH, dark, { p: [0, 0.18, 0.42], s: 0.032 }));
    eyes(0.065, 0.24, 0.32, 0.022);
    const d = new THREE.Vector3();
    for (let a = 0; a < 3; a++) for (let b = 0; b < 8; b++) {
      const el = 0.3 + a * 0.42, az = (b / 8) * Math.PI * 2 + a * 0.4;
      d.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
      if (d.z > 0.45 && el < 1) continue; // leave the face clear
      const m = mesh(cone(0.04, 0.15, 4), spine, { p: [c.x + d.x * R[0], c.y + d.y * R[1], c.z + d.z * R[2]] });
      m.quaternion.setFromUnitVectors(UP, d); inner.add(m);
    }
    addLegs([[-0.12, 0.12], [0.12, 0.12], [-0.12, -0.12], [0.12, -0.12]], 0.08, 0.06, 0.03, pale, pale);
  },
  pigeon({ inner, tail, wings, eyes }) {
    // flies: no walking legs, two wings on shoulder pivots that flap
    const fur = lambert(0x8E96A8), wing = lambert(0x747C90), neck = lambert(0x6FA88E);
    inner.add(mesh(SPH, fur, { p: [0, 0.2, 0], s: [0.16, 0.15, 0.24] }), mesh(SPH, neck, { p: [0, 0.27, 0.14], s: [0.11, 0.09, 0.1] }));
    inner.add(mesh(SPH, fur, { p: [0, 0.35, 0.2], s: 0.1 }), mesh(cone(0.025, 0.07, 5), lambert(0xE8B33A), { p: [0, 0.34, 0.32], r: [Math.PI / 2, 0, 0] }));
    eyes(0.055, 0.38, 0.27, 0.02);
    [-1, 1].forEach(s => {
      const pivot = new THREE.Group(); pivot.position.set(0.12 * s, 0.26, 0);
      pivot.add(mesh(SPH, wing, { p: [0.17 * s, 0, -0.02], s: [0.2, 0.03, 0.13] }));
      inner.add(pivot); wings.push({ pivot, side: s });
    });
    tail.position.set(0, 0.2, -0.22);
    tail.add(mesh(box(0.16, 0.02, 0.18), wing, { p: [0, 0, -0.07], r: [0.25, 0, 0] }));
  },
  boss({ inner, tail, dark, addLegs, eyes }) {
    // the Bulldog King: wide, jowly, with an underbite, a little crown and a cape
    const fur = lambert(0xD9B38C), white = lambert(0xF4EFE6), gold = lambert(0xF2C744), cape = lambert(0xC8553D);
    inner.add(mesh(SPH, fur, { p: [0, 0.36, 0], s: [0.3, 0.24, 0.38] }), mesh(SPH, white, { p: [0, 0.34, 0.22], s: [0.2, 0.18, 0.14] }));
    inner.add(mesh(SPH, fur, { p: [0, 0.52, 0.38], s: [0.26, 0.2, 0.2] }), mesh(SPH, white, { p: [0, 0.45, 0.54], s: [0.16, 0.1, 0.08] }));
    inner.add(mesh(SPH, fur, { p: [-0.13, 0.44, 0.5], s: 0.09 }), mesh(SPH, fur, { p: [0.13, 0.44, 0.5], s: 0.09 }));  // jowls
    inner.add(mesh(SPH, dark, { p: [0, 0.51, 0.62], s: [0.05, 0.035, 0.03] }));
    inner.add(mesh(cone(0.018, 0.05, 4), white, { p: [-0.06, 0.45, 0.61] }), mesh(cone(0.018, 0.05, 4), white, { p: [0.06, 0.45, 0.61] })); // underbite
    eyes(0.1, 0.58, 0.53, 0.03);
    const earMat = lambert(0x9C7450);
    inner.add(mesh(SPH, earMat, { p: [-0.21, 0.62, 0.36], s: [0.05, 0.08, 0.07], r: [0, 0, 0.6] }), mesh(SPH, earMat, { p: [0.21, 0.62, 0.36], s: [0.05, 0.08, 0.07], r: [0, 0, -0.6] }));
    const crown = new THREE.Group(); crown.position.set(0, 0.73, 0.36); crown.rotation.x = -0.15;
    crown.add(mesh(cyl(0.1, 0.11, 0.07, 10), gold));
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; crown.add(mesh(cone(0.025, 0.07, 4), gold, { p: [Math.sin(a) * 0.09, 0.065, Math.cos(a) * 0.09] })); }
    crown.add(mesh(SPH, lambert(0xE86A92), { p: [0, 0.01, 0.11], s: 0.024 }));
    inner.add(crown);
    // cape: a draped half-shell over the back
    inner.add(mesh(SPH, cape, { p: [0, 0.4, -0.08], s: [0.32, 0.25, 0.34], r: [0.1, 0, 0] }));
    inner.add(mesh(torus(0.13, 0.025, 6, 16), gold, { p: [0, 0.47, 0.22], r: [Math.PI / 2 - 0.4, 0, 0] })); // cape clasp
    addLegs([[-0.17, 0.2], [0.17, 0.2], [-0.17, -0.22], [0.17, -0.22]], 0.26, 0.22, 0.065, fur, white);
    tail.position.set(0, 0.42, -0.38);
    tail.add(mesh(cone(0.04, 0.12, 6), fur, { p: [0, 0.03, -0.04], r: [-0.8, 0, 0] }));
  },
  dog({ inner, tail, dark, addLegs, eyes }) {
    const fur = lambert(0xB07A45), ear = lambert(0x6E4527);
    inner.add(mesh(SPH, fur, { p: [0, 0.42, 0], s: [0.27, 0.25, 0.42] }), mesh(SPH, fur, { p: [0, 0.62, 0.4], s: 0.22 }));
    inner.add(mesh(box(0.2, 0.14, 0.2), lambert(0xE3C49E), { p: [0, 0.55, 0.6] }), mesh(SPH, dark, { p: [0, 0.6, 0.71], s: 0.045 }));
    eyes(0.09, 0.69, 0.58, 0.032);
    inner.add(mesh(box(0.06, 0.24, 0.14), ear, { p: [-0.22, 0.6, 0.36], r: [0, 0, 0.25] }), mesh(box(0.06, 0.24, 0.14), ear, { p: [0.22, 0.6, 0.36], r: [0, 0, -0.25] }));
    addLegs([[-0.14, 0.22], [0.14, 0.22], [-0.14, -0.22], [0.14, -0.22]], 0.3, 0.26, 0.05, fur, ear);
    tail.position.set(0, 0.52, -0.38);
    tail.add(mesh(cone(0.04, 0.26, 6), fur, { p: [0, 0.06, -0.08], r: [-0.8, 0, 0] }));
    inner.add(mesh(torus(0.16, 0.03, 6, 16), lambert(0xC8553D), { p: [0, 0.53, 0.28], r: [Math.PI / 2 - 0.3, 0, 0] })); // collar
  },
};

// Enemy rig: g (path position + heading + size) > inner (bob, lean, squash) > parts; legs, wings and tail on pivots.
// Every invader gets its own materials so its hit flash doesn't light up the others.
export function makeEnemy(kind) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const dark = lambert(0x221C26), pink = lambert(0xE8A0B0);
  const legs = [], wings = [], tail = new THREE.Group();
  const addLegs = (spots, hip, len, r, legMat, footMat) => spots.forEach(([x, z], i) => {
    const pivot = new THREE.Group(); pivot.position.set(x, hip, z);
    pivot.add(mesh(cyl(r, r * 0.9, len, 7), legMat, { p: [0, -len / 2, 0] }));
    pivot.add(mesh(SPH, footMat, { p: [0, -len, 0.02], s: [r * 1.3, r * 0.9, r * 1.6] }));
    inner.add(pivot);
    legs.push({ pivot, phase: (i === 0 || i === 3) ? 0 : Math.PI }); // diagonal pairs move together
  });
  const eyes = (x, y, z, s) => inner.add(mesh(SPH, dark, { p: [-x, y, z], s }), mesh(SPH, dark, { p: [x, y, z], s }));
  INVADERS[kind]({ inner, tail, wings, dark, pink, addLegs, eyes });
  inner.add(tail);
  shadows(g); outline(g);
  const mats = new Set();
  inner.traverse(o => { if (o.isMesh && o.material.isMeshToonMaterial) mats.add(o.material); });
  return { g, inner, legs, wings, tail, mats: [...mats] };
}

// ---------- Health bars ----------
const hbBgGeo = new THREE.PlaneGeometry(0.64, 0.1);
const hbFgGeo = new THREE.PlaneGeometry(0.6, 0.06); hbFgGeo.translate(0.3, 0, 0);
const hbBgMat = shared(new THREE.MeshBasicMaterial({ color: 0x2B2536, depthTest: false }));
// A health bar that the game keeps above its invader, facing the camera
export function makeHealthBar() {
  const group = new THREE.Group();
  const bg = new THREE.Mesh(hbBgGeo, hbBgMat);
  const fg = new THREE.Mesh(hbFgGeo, new THREE.MeshBasicMaterial({ color: 0x7BD389, depthTest: false }));
  fg.position.set(-0.3, 0, 0.001);
  bg.renderOrder = 10; fg.renderOrder = 11;
  group.add(bg, fg); group.visible = false;
  scene.add(group);
  return { group, fg };
}
