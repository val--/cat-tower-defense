// A tiny WebAudio synth: every sound is built from oscillators and a noise buffer, so there are no files to load.
// The context is created on the first user gesture (browsers keep audio locked until then).
import { load, save } from './state.js';

export let muted = load('mute', '0') === '1';
export function setMuted(m) { muted = m; save('mute', m ? '1' : '0'); }

let actx = null, master = null, noiseBuf = null;
const lastPlay = {};
// Also called on the first click so the browser unlocks sound.
export function audio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    master = actx.createGain(); master.gain.value = 0.3; master.connect(actx.destination);
    noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.5, actx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
// One note gliding from f0 to f1 over dur seconds, with a quick attack and an exponential fade.
function tone(f0, f1, dur, { type = 'sine', vol = 0.3, at = 0 } = {}) {
  const t0 = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.03);
}
// Filtered noise: swishes, thuds and hisses.
function noise(dur, { freq = 2000, to = freq, q = 1, vol = 0.3, at = 0, type = 'bandpass' } = {}) {
  const t0 = actx.currentTime + at, s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = noiseBuf; f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t0); f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(master); s.start(t0); s.stop(t0 + dur + 0.03);
}
// A meow: a buzzy tone whose pitch and formant rise then fall ("mi-aou").
function meow(pitch = 1, vol = 0.2) {
  const t0 = actx.currentTime, o = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain();
  o.type = 'sawtooth'; f.type = 'bandpass'; f.Q.value = 4;
  o.frequency.setValueAtTime(470 * pitch, t0); o.frequency.linearRampToValueAtTime(760 * pitch, t0 + 0.12); o.frequency.linearRampToValueAtTime(410 * pitch, t0 + 0.4);
  f.frequency.setValueAtTime(900 * pitch, t0); f.frequency.linearRampToValueAtTime(2300 * pitch, t0 + 0.13); f.frequency.linearRampToValueAtTime(800 * pitch, t0 + 0.4);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.05); g.gain.setValueAtTime(vol, t0 + 0.22); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
  o.connect(f).connect(g).connect(master); o.start(t0); o.stop(t0 + 0.45);
}
const notes = (list, gap, opts) => list.forEach((f, i) => tone(f, f, gap * 1.8, { ...opts, at: i * gap }));
const SOUNDS = {
  meow: p => meow(p),
  swipe: () => noise(0.09, { freq: 4000, to: 1200, q: 2, vol: 0.22 }),
  throw: () => tone(420, 700, 0.08, { type: 'triangle', vol: 0.1 }),
  pop: () => tone(900, 500, 0.06, { type: 'triangle', vol: 0.12 }),
  boing: () => tone(280, 640, 0.16, { vol: 0.16 }),
  thump: () => { tone(150, 55, 0.2, { vol: 0.45 }); noise(0.14, { freq: 600, type: 'lowpass', vol: 0.18 }); },
  land: () => tone(120, 70, 0.12, { vol: 0.3 }),
  tink: () => tone(2100, 1700, 0.06, { type: 'square', vol: 0.04 }),
  coin: () => { tone(988, 988, 0.07, { type: 'square', vol: 0.05 }); tone(1319, 1319, 0.14, { type: 'square', vol: 0.05, at: 0.06 }); },
  hurt: () => { tone(330, 110, 0.35, { type: 'square', vol: 0.09 }); noise(0.3, { freq: 3000, to: 1500, type: 'highpass', vol: 0.1, at: 0.05 }); }, // plus Michka's hiss
  upgrade: () => notes([523, 659, 784, 1047], 0.07, { type: 'triangle', vol: 0.14 }),
  sell: () => notes([784, 523], 0.08, { type: 'triangle', vol: 0.12 }),
  wave: () => notes([392, 523], 0.12, { type: 'triangle', vol: 0.14 }),
  clear: () => notes([523, 659, 784], 0.08, { type: 'triangle', vol: 0.13 }),
  growl: () => { tone(95, 60, 0.9, { type: 'sawtooth', vol: 0.12 }); noise(0.8, { freq: 300, type: 'lowpass', vol: 0.15 }); },
  win: () => { notes([523, 659, 784, 1047, 784, 1047], 0.13, { type: 'triangle', vol: 0.15 }); setTimeout(() => !muted && actx && meow(1.2), 900); },
  lose: () => notes([392, 330, 262, 196], 0.2, { type: 'triangle', vol: 0.14 }),
  nope: () => tone(200, 160, 0.12, { type: 'square', vol: 0.06 }),
};
// Throttled so a crowd of hits in one frame doesn't turn into a roar.
export function sfx(name, ...args) {
  if (muted || !audio()) return;
  const now = actx.currentTime;
  if (lastPlay[name] > now - 0.045) return;
  lastPlay[name] = now;
  SOUNDS[name](...args);
}
