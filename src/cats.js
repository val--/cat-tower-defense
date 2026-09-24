// Cats (the towers): placing, upgrading and selling them, choosing targets, attacking, and their animation.
import * as THREE from 'three';
import { TYPES, ATK_TIME, HIT_AT, DROP_TIME, modesFor, upgradeCost, sellValue } from './config.js';
import { S } from './state.js';
import { scene, toWorld, toon, SPH, torus, drop } from './gfx.js';
import { makeCat } from './models.js';
import { damage, applySlow } from './enemies.js';
import { cloud, burst, ring, slash, note } from './fx.js';
import { sfx } from './audio.js';
import { easeOutBounce } from './util.js';
import { updateHUD, select } from './hud.js';

let shots = [];   // projectiles in flight

// ---------- Placing, upgrading, selling ----------
export function placeTower(type, c, r) {
  const T = TYPES[type];
  const rig = makeCat(T);
  rig.g.position.copy(toWorld(c, r)); rig.g.rotation.y = -Math.PI / 2 + (Math.random() - 0.5);
  scene.add(rig.g);
  const t = { type, c, r, ...rig, level: 1, spent: T.cost, dmg: T.dmg, range: T.range, rate: T.rate, cd: 0.3, atk: 0, mode: 'first',
    slow: T.slow?.[0], slowT: T.slowT?.[0], splash: T.splash, aura: T.aura?.[0], boost: 0, cheer: 0, pulse: 1,
    drop: DROP_TIME, wag: Math.random() * 6, seed: Math.random() * 10, blink: 1 + Math.random() * 3, blinkT: 0, earT: 1 + Math.random() * 3, earFlick: 0, earSide: 0 };
  S.towers.push(t); S.grid[r][c] = t; S.fish -= T.cost;
  sfx('meow', T.meow);
  updateHUD();
}

export function upgrade(t) {
  const cost = upgradeCost(t);
  if (t.level >= 3 || S.fish < cost) return;
  S.fish -= cost; t.spent += cost; t.level++;
  t.dmg = Math.round(t.dmg * 1.55); t.range = +(t.range + 0.35).toFixed(2); t.rate *= 0.88;
  const T = TYPES[t.type];
  if (T.slow) { t.slow = T.slow[t.level - 1]; t.slowT = T.slowT[t.level - 1]; }
  if (T.splash) t.splash = +(t.splash + T.splashUp).toFixed(2);
  if (T.aura) t.aura = T.aura[t.level - 1];
  t.atk = ATK_TIME; // a proud stretch; size grows via the level factor in updateCats
  dressCat(t);
  burst(t.g.position, 0xF2A541, 10, 0.05);
  ring(t.g.position, 0xF2A541, 0.8, 0.45);
  sfx('upgrade');
  updateHUD(); select(t);
}

export function sell(t) {
  S.fish += sellValue(t); drop(t.g); S.grid[t.r][t.c] = 'grass';
  cloud(t.g.position, 0xFFF4E2, 7, 0.14);
  S.towers = S.towers.filter(x => x !== t);
  sfx('sell');
  select(null); updateHUD();
}

// Level marks: level 2 gets a silver cushion ring and a silver bell on a red collar,
// level 3 a thicker gold ring and a gold bell. (Cats also grow 12% per level.)
const RANK = { 2: { color: 0xC9D3E1, tube: 0.04 }, 3: { color: 0xFFD54F, tube: 0.06 } };
function dressCat(t) {
  const r = RANK[t.level], { rim, collar, bell } = t.rank;
  [rim, collar, bell].forEach(m => { if (m) m.visible = !!r; });
  if (!r) return;
  bell.material = toon(r.color);
  if (rim) { rim.material = toon(r.color); rim.geometry = torus(0.43, r.tube, 8, 40); t.rank.rimInk.geometry = torus(0.43, r.tube + 0.018, 8, 40); }
}

// Every cat hops for `time` seconds (after a cleared wave; for good after a win)
export const cheer = time => S.towers.forEach(t => t.cheer = time);

export function clearCats() {
  S.towers.forEach(t => drop(t.g));
  shots.forEach(s => drop(s.mesh));
  S.towers = []; shots = [];
}

// ---------- Targeting ----------
const crowdAt = (e, r) => S.enemies.reduce((n, o) => n + (!o.dead && o.pos.distanceTo(e.pos) <= r ? 1 : 0), 0);
function pickTarget(t) {
  const T = TYPES[t.type], r2 = t.range * t.range;
  if (T.aura) return null; // the Persian only purrs
  let cands = S.enemies.filter(e => !e.dead && !(T.melee && e.fly) && (e.pos.x - t.g.position.x) ** 2 + (e.pos.z - t.g.position.z) ** 2 <= r2);
  // The Siamese spends its yarn on invaders that aren't slowed yet (or whose slow is about to wear off)
  if (T.slow) { const fresh = cands.filter(e => e.slowT <= 0.3); if (fresh.length) cands = fresh; }
  let best = null, bestScore = -Infinity;
  for (const e of cands) {
    const score = t.mode === 'strong' ? e.hp : t.mode === 'weak' ? -e.hp : t.mode === 'crowd' ? crowdAt(e, t.splash) : 0;
    // 'first', and ties in the other modes, go to the invader furthest along the path
    if (score > bestScore || (score === bestScore && e.dist > best.dist)) { best = e; bestScore = score; }
  }
  return best;
}
export function cycleMode(t) {
  if (TYPES[t.type].aura) return;
  const list = modesFor(t.type);
  t.mode = list[(list.indexOf(t.mode) + 1) % list.length];
  select(t);
}
// Each cat's purr boost: the strongest Persian in range wins, boosts don't stack, Persians don't boost each other.
export function updateBoosts() {
  S.towers.forEach(t => t.boost = 0);
  for (const p of S.towers) {
    if (!p.aura || p.drop > 0) continue;
    for (const t of S.towers) {
      if (t.aura || (t.g.position.x - p.g.position.x) ** 2 + (t.g.position.z - p.g.position.z) ** 2 > p.range * p.range) continue;
      t.boost = Math.max(t.boost, p.aura);
    }
  }
}

// ---------- Attacks ----------
const PUSH = { kitten: 0.09, tabby: 0.14, siamese: 0.03, tom: 0.22 };

// An attack starts a paw wind-up; the hit (melee) or the throw happens at HIT_AT of the animation.
function fire(t, e) {
  t.atk = ATK_TIME; t.pending = e;
  t.arm = t.arm ? 0 : 1; // alternate paws
}
function release(t) {
  const e = t.pending, T = TYPES[t.type];
  t.pending = null;
  if (!e || e.dead) return;
  if (T.melee) {
    const dx = e.pos.x - t.g.position.x, dz = e.pos.z - t.g.position.z;
    if (dx * dx + dz * dz > (t.range + 0.4) ** 2) return; // it slipped away mid-swing
    damage(e, t.dmg, PUSH.kitten);
    slash(e.pos, t.arm ? 1 : -1);
    burst(e.pos, 0xFFF4E2, 3, 0.035);
    sfx('swipe');
    return;
  }
  const start = new THREE.Vector3(); t.paws[t.arm].getWorldPosition(start);
  const m = new THREE.Mesh(SPH, toon(T.proj));
  m.scale.setScalar(t.type === 'tom' ? 0.13 : t.type === 'siamese' ? 0.1 : 0.07);
  m.castShadow = true; m.position.copy(start);
  scene.add(m);
  shots.push({ mesh: m, target: e, aim: e.pos.clone(), aimY: 0.3 + e.fly, speed: T.pspeed, dmg: t.dmg, type: t.type, t: 0,
    slow: t.slow, slowT: t.slowT, splash: t.splash,
    start, arc: t.type === 'tom' ? 1.1 : t.type === 'siamese' ? 0.5 : 0.15 });
  sfx('throw');
}
function impact(s) {
  const T = TYPES[s.type];
  if (s.splash) {
    S.enemies.forEach(e => { if (!e.dead && e.pos.distanceTo(s.aim) <= s.splash) damage(e, s.dmg, PUSH.tom); });
    ring(s.aim, 0x3A3340, s.splash, 0.35);
    cloud(s.aim, 0xB9AFC6, 5, 0.1);
    burst(s.aim, 0x6E6275, 6, 0.06);
    sfx('thump');
  } else if (!s.target.dead) {
    const y = s.target.fly;
    if (s.slow) { applySlow(s.target, s.slow, s.slowT); burst(s.aim, T.proj, 4, 0.05, y); sfx('boing'); }
    else { burst(s.aim, T.proj, 3, 0.04, y); sfx('pop'); }
    damage(s.target, s.dmg, PUSH[s.type]);
  }
}

// ---------- Per frame ----------
// Each cat, every frame: land (if just placed), hunt, purr, then strike its pose.
export function updateCats(frame) {
  updateBoosts();
  if (S.selected && S.selected.boost !== S.selected.shownBoost) select(S.selected); // keep the panel's purr badge current
  for (const t of S.towers) {
    const dropY = land(t, frame.raw);
    const target = hunt(t, frame.dt);
    purr(t, frame);
    pose(t, target, dropY, frame);
  }
  updateShots(frame.dt);
}

const catSize = t => TYPES[t.type].size * (1 + 0.12 * (t.level - 1));

// Drop-in from the sky, bounce on the cushion, dust ring on landing. Returns the height above the cushion.
function land(t, raw) {
  if (t.drop <= 0) return 0;
  t.drop -= raw;
  if (t.drop <= 0) { ring(t.g.position, 0xE6C48C, 0.95, 0.4); burst(t.g.position, 0xD9B77E, 6, 0.05); sfx('land'); }
  return (1 - easeOutBounce(Math.min(1, 1 - t.drop / DROP_TIME))) * 3;
}

// Turn toward the chosen target and attack when the cooldown (sped up by purring) allows. Returns the target.
function hunt(t, dt) {
  t.cd -= dt * (1 + t.boost);
  const target = t.drop <= 0 ? pickTarget(t) : null;
  if (target) {
    const want = Math.atan2(target.pos.x - t.g.position.x, target.pos.z - t.g.position.z);
    let turn = want - t.g.rotation.y; turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    t.g.rotation.y += turn * Math.min(1, dt * 12);
    if (t.cd <= 0) { fire(t, target); t.cd = t.rate; }
  }
  // the paw strike (or throw) lands partway through the attack animation
  t.atk = Math.max(0, t.atk - dt);
  if (t.pending && 1 - t.atk / ATK_TIME >= HIT_AT) release(t);
  return target;
}

// Purring shows: the Persian sends out a pink ripple while it boosts someone; a boosted cat gets a pulsing
// pink ring around its cushion and gives off music notes.
const purrRingGeo = new THREE.RingGeometry(0.46, 0.62, 40);
function purr(t, { raw, time, paused }) {
  const active = !paused && t.drop <= 0;
  if (t.aura && active && (t.pulse -= raw) <= 0) {
    t.pulse = 2.4;
    if (S.towers.some(o => o.boost && !o.aura && (o.g.position.x - t.g.position.x) ** 2 + (o.g.position.z - t.g.position.z) ** 2 <= t.range * t.range)) ring(t.g.position, 0xE8A0B0, t.range, 0.9);
  }
  if (!t.boost && !t.purrRing) return;
  if (!t.purrRing) { // made on first need, per cat
    t.purrRing = new THREE.Mesh(purrRingGeo, new THREE.MeshBasicMaterial({ color: 0xE86A92, transparent: true, depthWrite: false }));
    t.purrRing.rotation.x = -Math.PI / 2; t.purrRing.position.y = 0.015;
    t.g.add(t.purrRing);
  }
  t.purrRing.visible = t.boost > 0;
  t.purrRing.material.opacity = 0.7 + 0.3 * Math.sin(time * 4 + t.seed);
  if (t.boost > 0 && active && (t.noteT = (t.noteT ?? Math.random()) - raw) <= 0) {
    note(t.g.position, 0.35 + 0.8 * catSize(t));
    t.noteT = 0.7 + Math.random() * 0.5;
  }
}

// Shoulder angle over an attack (p: 0→1): raise to -up, strike down to -hit, settle back to 0.
function pawSwing(p, up, hit) {
  if (p < 0.35) { const k = p / 0.35; return -up * (1 - (1 - k) * (1 - k)); }
  if (p < 0.55) return -up + (up - hit) * ((p - 0.35) / 0.2);
  return -hit * (1 - (p - 0.55) / 0.45);
}

// The cat's body language: attack swing (stretch, lunge, paw), celebration hops, breathing,
// tail wag, head tilt, blinks and ear twitches. Attacks run on game time, the rest on real time.
function pose(t, target, dropY, { raw, time }) {
  const T = TYPES[t.type];
  const p = t.atk > 0 ? 1 - t.atk / ATK_TIME : 1;
  const st = t.atk > 0 ? Math.sin(p * Math.PI) * (1 - 0.4 * p) : 0;   // stretch over the swing
  // a little celebration hop with both paws up after a wave is cleared
  if (t.cheer > 0) t.cheer -= raw;
  const cheering = t.cheer > 0 && t.atk <= 0 && t.drop <= 0 && !target;
  const hopY = cheering ? Math.abs(Math.sin((time + t.seed) * 7)) * 0.18 : 0;
  const size = catSize(t);
  const breathe = Math.sin(time * (T.aura ? 1.4 : 2.2) + t.seed) * (T.aura ? 0.04 : 0.025);
  const stretch = T.melee ? 0.12 : 0.28;
  t.body.scale.set(size * (1 - 0.1 * st), size * (1 + stretch * st + breathe), size * (1 - 0.1 * st));
  t.body.rotation.x = (T.melee ? 0.55 : 0.3) * st;
  t.body.position.set(0, 0.12 + 0.08 * st + dropY + hopY, (T.melee ? 0.38 : 0.05) * st);
  const up = T.melee ? 2.4 : 2.8, hit = T.melee ? 0.9 : 1.3;
  t.arms.forEach((arm, i) => {
    if (cheering) { arm.rotation.x = -2.3 + Math.sin(time * 10 + t.seed + i) * 0.25; arm.rotation.z = (i ? -1 : 1) * 0.2; return; }
    arm.rotation.x = t.atk > 0 && i === t.arm ? pawSwing(p, up, hit) : 0;
    arm.rotation.z = t.atk > 0 && i === t.arm ? (i ? -1 : 1) * 0.25 * st : 0; // swipe slightly across the body
  });
  t.wag += raw * (target || cheering ? 7 : 2.2);
  t.tail.forEach((seg, i) => {
    seg.rotation.z = Math.sin(t.wag - i * 0.7) * (0.12 + i * 0.03);
    seg.rotation.x = (i === 0 ? -1.45 - 0.5 * st : 0.32 + 0.1 * st);
  });
  // head: idle tilt when bored, focused when hunting
  const tilt = target ? 0 : Math.sin(time * 0.7 + t.seed) * 0.16;
  t.head.rotation.z += (tilt - t.head.rotation.z) * Math.min(1, raw * 6);
  t.head.rotation.x += ((target ? 0.12 : 0) - t.head.rotation.x) * Math.min(1, raw * 6);
  // blinks and ear twitches on their own random timers; the Persian keeps its eyes half shut, purring
  t.blink -= raw;
  if (t.blink <= 0) { t.blinkT = 0.13; t.blink = 2 + Math.random() * 4; }
  t.blinkT = Math.max(0, t.blinkT - raw);
  t.eyes.forEach(eye => eye.scale.y = t.blinkT > 0 ? 0.12 : T.aura && !cheering ? 0.45 : 1);
  t.earT -= raw;
  if (t.earT <= 0) { t.earFlick = 0.25; t.earSide = Math.random() < 0.5 ? 0 : 1; t.earT = 1.5 + Math.random() * 4; }
  t.earFlick = Math.max(0, t.earFlick - raw);
  t.ears.forEach((ear, i) => ear.rotation.x = i === t.earSide ? -Math.sin((t.earFlick / 0.25) * Math.PI * 2) * 0.5 : 0);
}

// Projectiles, lobbed on a small arc toward their (moving) target; fliers are hit in the air.
function updateShots(dt) {
  for (const s of shots) {
    if (!s.target.dead) { s.aim.copy(s.target.pos); s.aimY = 0.3 + s.target.fly; }
    const total = Math.max(0.2, s.start.distanceTo(s.aim));
    s.t += (s.speed * dt) / total;
    const k = Math.min(1, s.t);
    s.mesh.position.set(
      s.start.x + (s.aim.x - s.start.x) * k,
      s.start.y + (s.aimY - s.start.y) * k + Math.sin(k * Math.PI) * s.arc,
      s.start.z + (s.aim.z - s.start.z) * k);
    s.mesh.rotation.x += dt * 10;
    if (k >= 1) { impact(s); scene.remove(s.mesh); s.done = true; }
  }
  shots = shots.filter(s => !s.done);
}
