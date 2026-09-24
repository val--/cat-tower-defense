// Small helpers shared by several modules.

export const $ = id => document.getElementById(id);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Restart a CSS animation on an element (e.g. the lives counter shaking when hurt)
export function bump(id, cls) {
  const el = $(id);
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}

export const easeOutBack = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
export function easeOutBounce(x) {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
}
