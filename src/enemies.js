// Invaders: spawning, walking the path, taking hits, and leaving (defeated, or through the cat flap).
import { ENEMIES, MAPS, DEATH_TIME, HP_EXTRA, hpGrowth, hpBonus, rewardMul } from './config.js';
import { S } from './state.js';
import { scene, camera, drop } from './gfx.js';
import { makeEnemy, makeHealthBar } from './models.js';
import { houseHit } from './world.js';
import { cloud, burst, flyFish } from './fx.js';
import { sfx } from './audio.js';
import { bump, easeOutBack } from './util.js';
import { waveDone } from './waves.js';
import { endGame } from './game.js';
import { updateHUD } from './hud.js';

let dying = [];   // defeated invaders playing their exit animation

export function spawn(kind, w) {
  const d = ENEMIES[kind], hp = d.hp * hpGrowth(w) * hpBonus(HP_EXTRA * MAPS[S.mapId].hp, w);
  const rig = makeEnemy(kind); rig.g.scale.setScalar(0.001);
  const pos = S.path[0].clone(); rig.g.position.copy(pos); scene.add(rig.g);
  const hb = makeHealthBar(); if (d.boss) hb.group.scale.setScalar(1.7);
  S.enemies.push({ kind, w, mesh: rig.g, rig, hb, hp, max: hp, speed: d.speed, reward: Math.round(d.reward * rewardMul(w)), dmg: d.dmg,
    armor: d.armor || 0, fly: d.fly || 0, dash: !!d.dash, boss: !!d.boss, clock: Math.random(),
    seg: 1, pos, dist: 0, slowT: 0, slowF: 1, dead: false, walk: Math.random() * 6, hbY: d.hbY, size: d.scale, age: 0, flash: 0, lastFlash: -1, kb: 0 });
  if (d.boss) sfx('growl');
}

// Speed multiplier from slows and, for squirrels, the dash-and-freeze rhythm.
const dashing = e => e.dash && e.clock % 1 < 0.5;
const pace = e => (e.slowT > 0 ? e.slowF : 1) * (e.dash ? (dashing(e) ? 1.9 : 0.25) : 1);

const setFlash = (e, v) => { if (e.lastFlash !== v) { e.rig.mats.forEach(m => m.emissive.setScalar(v)); e.lastFlash = v; } };

// An invader leaves the path: defeated (reward) or through the door (lives lost).
function killEnemy(e, reached) {
  if (e.dead) return;
  e.dead = true; drop(e.hb.group);
  dying.push({ g: e.mesh, t: 0, reached, s0: e.mesh.scale.x, y0: e.fly, spin: Math.random() < 0.5 ? -1 : 1 });
  if (reached) {
    S.lives = Math.max(0, S.lives - e.dmg);
    houseHit(); bump('livesStat', 'hurt'); sfx('hurt');
    if (S.lives <= 0) endGame(false);
  } else {
    setFlash(e, 0.9);
    S.fish += e.reward;
    cloud(e.pos, 0xFFF4E2, 6, 0.12 * e.size, e.fly);
    flyFish(e.pos, e.reward, e.fly);
    sfx('coin');
  }
  if (--S.waveLeft[e.w] <= 0) waveDone(e.w);
  updateHUD();
}

// Hedgehog spines take a flat amount off every hit (never below 1). `push` is a visual knockback only.
export function damage(e, amt, push = 0.1) {
  if (e.dead) return;
  if (e.armor) { amt = Math.max(1, amt - e.armor); burst(e.pos, 0xCFCAD3, 2, 0.03, e.fly); sfx('tink'); }
  e.hp -= amt; e.flash = 0.12; e.kb = Math.min(0.3, e.kb + push);
  if (e.hp <= 0) killEnemy(e, false);
}

// Slows don't stack: keep the stronger one and the longer time left. The king shrugs off half of any slow.
export function applySlow(e, f, time) {
  if (e.boss) f = 1 - (1 - f) / 2;
  e.slowF = e.slowT > 0 ? Math.min(e.slowF, f) : f;
  e.slowT = Math.max(e.slowT, time);
}

export function updateEnemies(frame) {
  for (const e of S.enemies) {
    if (e.dead) continue;
    if (walk(e, frame.dt)) animate(e, frame);
  }
  S.enemies = S.enemies.filter(e => !e.dead);
  updateDying(frame.raw);
}

// Move along the path at the invader's pace. Returns false if it reached the door (and got in).
function walk(e, dt) {
  const path = S.path;
  if (e.slowT > 0) e.slowT -= dt;
  e.clock += dt;
  let move = e.speed * pace(e) * dt;
  while (move > 0 && e.seg < path.length) {
    const tgt = path[e.seg], dx = tgt.x - e.pos.x, dz = tgt.z - e.pos.z, len = Math.hypot(dx, dz);
    if (len > 0.001) e.mesh.rotation.y = Math.atan2(dx, dz);
    if (len <= move) { e.pos.x = tgt.x; e.pos.z = tgt.z; move -= len; e.dist += len; e.seg++; }
    else { e.pos.x += dx / len * move; e.pos.z += dz / len * move; e.dist += move; move = 0; }
  }
  if (e.seg < path.length) return true;
  killEnemy(e, true);
  return false;
}

// Walk cycle, hops and wing beats, hit reactions, the pop-in at spawn, and the health bar.
function animate(e, { dt, raw, time }) {
  // walk cycle: legs swing in diagonal pairs, body bobs twice per stride and rolls side to side
  e.walk += dt * e.speed * pace(e) * 11;
  const { inner, legs, wings, tail } = e.rig;
  legs.forEach(l => l.pivot.rotation.x = Math.sin(e.walk + l.phase) * 0.65);
  inner.position.y = Math.abs(Math.cos(e.walk)) * 0.05;
  inner.rotation.z = Math.sin(e.walk) * 0.07;
  tail.rotation.y = Math.sin(e.walk * 0.5) * 0.5;
  if (e.dash) {
    // squirrel: big bounding hops while dashing, then a frozen pose with a nervous tail flick
    inner.position.y = dashing(e) ? Math.abs(Math.sin(e.walk * 0.5)) * 0.16 : 0;
    if (!dashing(e)) tail.rotation.y = Math.sin(time * 30) * 0.12;
  }
  if (wings.length) {
    // pigeon: flapping, bobbing gently in the air
    wings.forEach(w => w.pivot.rotation.z = w.side * (Math.sin(time * 16 + e.walk) * 0.6 + 0.15));
    inner.position.y = Math.sin(time * 4 + e.walk) * 0.05;
    inner.rotation.z = 0;
  }
  // hit reaction: white flash, squash, knockback against the direction of travel
  e.flash = Math.max(0, e.flash - raw);
  setFlash(e, e.flash > 0 ? 0.85 : 0);
  const hq = e.flash / 0.12;
  inner.scale.set(1 + 0.18 * hq, 1 - 0.22 * hq, 1 + 0.18 * hq);
  e.kb *= Math.exp(-raw * 10);
  const hd = e.mesh.rotation.y;
  e.mesh.position.set(e.pos.x - Math.sin(hd) * e.kb, e.fly, e.pos.z - Math.cos(hd) * e.kb);
  // pop in at spawn
  e.age += raw;
  e.mesh.scale.setScalar(e.size * Math.max(0.001, easeOutBack(Math.min(1, e.age / 0.3))));
  const hb = e.hb;
  hb.group.visible = e.hp < e.max;
  hb.group.position.set(e.pos.x, e.hbY, e.pos.z);
  hb.group.quaternion.copy(camera.quaternion);
  hb.fg.scale.x = Math.max(0.001, e.hp / e.max);
  hb.fg.material.color.set(e.slowT > 0 ? 0xE86A92 : e.hp / e.max > 0.4 ? 0x7BD389 : 0xF2A541);
}

// Defeated invaders spin up and shrink away; ones that got in slip through the cat flap.
function updateDying(raw) {
  for (const d of dying) {
    d.t += raw;
    const k = Math.min(1, d.t / DEATH_TIME);
    if (d.reached) {
      d.g.scale.setScalar(d.s0 * (1 - k));
    } else {
      d.g.position.y = d.y0 + Math.sin(k * Math.PI) * 0.45;
      d.g.rotation.y += raw * 16 * d.spin;
      d.g.scale.setScalar(Math.max(0.001, d.s0 * (1 + 0.3 * Math.sin(k * Math.PI * 0.5)) * (1 - k * k)));
    }
    if (k >= 1) { drop(d.g); d.done = true; }
  }
  dying = dying.filter(d => !d.done);
}

export function clearEnemies() {
  S.enemies.forEach(e => { drop(e.mesh); drop(e.hb.group); });
  dying.forEach(d => drop(d.g));
  S.enemies = []; dying = [];
}
