// Small inked SVG drawings for the interface, in the palette of the 3D models.
// (No emoji: they look different on every system and clash with the inked style.)
import { MAPS } from './config.js';

const INK = '#2B2536';
const svg = body => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const inked = (w = 1.8) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"`;
export const ART = {
  heart: svg(`<path d="M12 20.5s-7.6-4.5-9.3-9C1.4 8 3.4 4.6 6.8 4.6c2.2 0 3.6 1.3 5.2 3.1 1.6-1.8 3-3.1 5.2-3.1 3.4 0 5.4 3.4 4.1 6.9-1.7 4.5-9.3 9-9.3 9z" fill="#E86A6A" ${inked(2)}/>`),
  fish: svg(`<path d="M2.5 12c3-4.6 8.6-6 13.4-2.8l4.6-3.2-1.2 6 1.2 6-4.6-3.2C11.1 18 5.5 16.6 2.5 12z" fill="#7FB8D9" ${inked()}/><circle cx="7.2" cy="11" r="1.3" fill="${INK}"/>`),
  cam: svg(`<path d="M3 8.5a2 2 0 0 1 2-2h2.3L9 4h6l1.7 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" stroke-width="2.2"/>`),
  paw: svg(`<ellipse cx="12" cy="15.8" rx="5.2" ry="4.3" fill="currentColor"/><circle cx="5.3" cy="10.2" r="2.3" fill="currentColor"/><circle cx="9.2" cy="6.1" r="2.4" fill="currentColor"/><circle cx="14.8" cy="6.1" r="2.4" fill="currentColor"/><circle cx="18.7" cy="10.2" r="2.3" fill="currentColor"/>`),
  star: on => svg(`<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="${on ? '#F2A541' : '#F5E6CA'}" ${inked(1.9)}/>`),
  pause: svg(`<rect x="5.5" y="4.5" width="4.5" height="15" rx="1.5" fill="currentColor"/><rect x="14" y="4.5" width="4.5" height="15" rx="1.5" fill="currentColor"/>`),
  play: svg(`<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor"/>`),
  sound: svg(`<path d="M3 9h4l5-4.5v15L7 15H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>`),
  mute: svg(`<path d="M3 9h4l5-4.5v15L7 15H3z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`),
};
// One little head per invader, for the next-wave preview
export const FOE = {
  mouse: svg(`<circle cx="6.5" cy="8" r="4.3" fill="#E8A0B0" ${inked()}/><circle cx="17.5" cy="8" r="4.3" fill="#E8A0B0" ${inked()}/><ellipse cx="12" cy="14.5" rx="7" ry="6.4" fill="#A7A0AE" ${inked()}/><circle cx="9.5" cy="13.4" r="1.1" fill="${INK}"/><circle cx="14.5" cy="13.4" r="1.1" fill="${INK}"/><circle cx="12" cy="17" r="1.3" fill="#E8A0B0"/>`),
  raccoon: svg(`<path d="M5.2 9.5 4.6 3.6 10 6.6z" fill="#7D7A83" ${inked()}/><path d="M18.8 9.5l.6-5.9L14 6.6z" fill="#7D7A83" ${inked()}/><ellipse cx="12" cy="13.6" rx="8" ry="6.8" fill="#7D7A83" ${inked()}/><path d="M4.8 12.4c2-2 4.5-1.6 7.2 0 2.7-1.6 5.2-2 7.2 0-1 2.2-3.8 2.8-7.2 1.2-3.4 1.6-6.2 1-7.2-1.2z" fill="${INK}"/><circle cx="9" cy="12.6" r="1" fill="#fff"/><circle cx="15" cy="12.6" r="1" fill="#fff"/><ellipse cx="12" cy="17.2" rx="3" ry="2" fill="#CFCAD3" ${inked(1.4)}/><circle cx="12" cy="16.6" r=".9" fill="${INK}"/>`),
  squirrel: svg(`<path d="M6 10 5.4 2.8 10.2 7z" fill="#C4703A" ${inked()}/><path d="M18 10l.6-7.2L13.8 7z" fill="#C4703A" ${inked()}/><circle cx="12" cy="13.8" r="7" fill="#C4703A" ${inked()}/><ellipse cx="12" cy="16.8" rx="3.8" ry="2.9" fill="#F2DEC0"/><circle cx="9.2" cy="12.6" r="1.2" fill="${INK}"/><circle cx="14.8" cy="12.6" r="1.2" fill="${INK}"/><circle cx="12" cy="15.3" r=".9" fill="${INK}"/>`),
  pigeon: svg(`<circle cx="11" cy="12.5" r="7.6" fill="#8E96A8" ${inked()}/><path d="M5.2 15.6c2.5 1.5 6 1.8 9.5.5" stroke="#6FA88E" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M18.2 10.8l4 1.7-4 1.5z" fill="#E8B33A" ${inked(1.4)}/><circle cx="14" cy="10.4" r="1.3" fill="${INK}"/>`),
  hedgehog: svg(`<path d="M2.5 15 4 10 2.8 7.4 6.2 7 7 3.8 10 5.6 12 2.8 14 5.6 17 3.8 17.8 7 21.2 7.4 20 10 21.5 15z" fill="#5E4634" ${inked()}/><ellipse cx="12" cy="15.6" rx="6.2" ry="5" fill="#E9D5B5" ${inked()}/><circle cx="9.8" cy="14.4" r="1" fill="${INK}"/><circle cx="14.2" cy="14.4" r="1" fill="${INK}"/><circle cx="12" cy="17.4" r="1.2" fill="${INK}"/>`),
  dog: svg(`<path d="M6.6 6.6C3.6 6 2.6 9 3 13c.3 2 2 2.4 3.2 1.4z" fill="#6E4527" ${inked()}/><path d="M17.4 6.6c3-.6 4 2.4 3.6 6.4-.3 2-2 2.4-3.2 1.4z" fill="#6E4527" ${inked()}/><ellipse cx="12" cy="13" rx="6.8" ry="7" fill="#B07A45" ${inked()}/><ellipse cx="12" cy="16.6" rx="3.6" ry="2.8" fill="#E3C49E" ${inked(1.4)}/><ellipse cx="12" cy="15.4" rx="1.5" ry="1.1" fill="${INK}"/><circle cx="9.3" cy="11.5" r="1.1" fill="${INK}"/><circle cx="14.7" cy="11.5" r="1.1" fill="${INK}"/>`),
  boss: svg(`<path d="M7 8.2 6.4 2.6 9.6 5.2 12 1.8l2.4 3.4 3.2-2.6-.6 5.6z" fill="#F2C744" ${inked(1.6)}/><ellipse cx="12" cy="15.2" rx="9.2" ry="6.8" fill="#D9B38C" ${inked()}/><ellipse cx="12" cy="17.4" rx="4.6" ry="2.9" fill="#F4EFE6" ${inked(1.4)}/><path d="M9.8 16.6v-1.4M14.2 16.6v-1.4" stroke="${INK}" stroke-width="1.3"/><ellipse cx="12" cy="15.1" rx="1.7" ry="1.1" fill="${INK}"/><circle cx="8.3" cy="12.8" r="1.1" fill="${INK}"/><circle cx="15.7" cy="12.8" r="1.1" fill="${INK}"/>`),
};
// A mini-map of a garden, drawn from its real path, bushes and house
export function mapThumb(id) {
  const M = MAPS[id];
  const pts = M.path.map(([c, r]) => `${c + 0.5},${r + 0.5}`).join(' ');
  const bushes = M.bushes.map(([c, r]) => `<circle cx="${c + 0.5}" cy="${r + 0.5}" r=".4" fill="#5E8C43"/>`).join('');
  return `<svg class="thumb" viewBox="0 0 16 10" aria-hidden="true"><rect width="16" height="10" fill="#9BC36F"/>
    <polyline points="${pts}" fill="none" stroke="#E6C48C" stroke-width=".95" stroke-linecap="square"/>${bushes}
    <rect x="14.1" y="4.1" width="1.8" height="2.8" rx=".2" fill="#C8553D" stroke="${INK}" stroke-width=".18"/>
    <rect x="14.1" y="5.2" width=".35" height=".6" fill="${INK}"/></svg>`;
}
