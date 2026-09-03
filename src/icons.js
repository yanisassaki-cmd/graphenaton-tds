// Pictogrammes de la page 2 (cartes « Applications », coches des listes) en primitives SVG 24×24,
// partagées aperçu / PDF comme curve.js : line / path / rect / circle.

import { NAVY, TEAL } from './drawing'

const S = { stroke: NAVY, sw: 1.6, fill: 'none' }
const arrowDown = (x) => [{ t: 'line', x1: x, y1: 10, x2: x, y2: 18, ...S }, { t: 'path', d: `M${x - 2.2} 15.8 L${x} 18 L${x + 2.2} 15.8`, ...S }]
const arrowUp = (x) => [{ t: 'line', x1: x, y1: 14, x2: x, y2: 6, ...S }, { t: 'path', d: `M${x - 2.2} 8.2 L${x} 6 L${x + 2.2} 8.2`, ...S }]
const arrowRight = (y) => [{ t: 'line', x1: 10, y1: y, x2: 18, y2: y, ...S }, { t: 'path', d: `M15.8 ${y - 2.2} L18 ${y} L15.8 ${y + 2.2}`, ...S }]

export const ICON_VIEW = 24

export const ICONS = {
  car: [
    { t: 'path', d: 'M4.5 13.5 L7 8.5 H17 L19.5 13.5', ...S },
    { t: 'rect', x: 3, y: 13, width: 18, height: 5, rx: 1.5, ...S },
    { t: 'circle', cx: 7.5, cy: 18.5, r: 1.8, ...S, fill: '#FFFFFF' },
    { t: 'circle', cx: 16.5, cy: 18.5, r: 1.8, ...S, fill: '#FFFFFF' },
  ],
  ceiling: [{ t: 'rect', x: 3, y: 4, width: 18, height: 3, rx: 1, fill: TEAL }, ...arrowDown(8), ...arrowDown(12), ...arrowDown(16)],
  floor: [{ t: 'rect', x: 3, y: 17, width: 18, height: 3, rx: 1, fill: TEAL }, ...arrowUp(8), ...arrowUp(12), ...arrowUp(16)],
  wall: [{ t: 'rect', x: 4, y: 3, width: 3, height: 18, rx: 1, fill: TEAL }, ...arrowRight(8), ...arrowRight(12), ...arrowRight(16)],
  chair: [
    { t: 'path', d: 'M7 4 V20 M7 13 H17 V20 M17 13 H19.5', ...S },
    { t: 'line', x1: 7, y1: 8.5, x2: 12, y2: 8.5, stroke: TEAL, sw: 2, fill: 'none' },
  ],
  industrial: [
    { t: 'rect', x: 4, y: 11, width: 16, height: 9, rx: 1.5, ...S },
    { t: 'path', d: 'M8 8.5 C8 6.5 10 6.5 10 4.5', ...S }, { t: 'path', d: 'M12 8.5 C12 6.5 14 6.5 14 4.5', ...S }, { t: 'path', d: 'M16 8.5 C16 6.5 18 6.5 18 4.5', ...S },
    { t: 'line', x1: 8, y1: 15.5, x2: 16, y2: 15.5, stroke: TEAL, sw: 2, fill: 'none' },
  ],
  snow: [
    { t: 'line', x1: 12, y1: 3.5, x2: 12, y2: 20.5, ...S }, { t: 'line', x1: 4.6, y1: 7.75, x2: 19.4, y2: 16.25, ...S }, { t: 'line', x1: 4.6, y1: 16.25, x2: 19.4, y2: 7.75, ...S },
    { t: 'circle', cx: 12, cy: 12, r: 2.2, fill: TEAL },
  ],
  wellness: [
    { t: 'circle', cx: 12, cy: 12, r: 8.2, ...S },
    { t: 'line', x1: 12, y1: 8, x2: 12, y2: 16, stroke: TEAL, sw: 2.2, fill: 'none' }, { t: 'line', x1: 8, y1: 12, x2: 16, y2: 12, stroke: TEAL, sw: 2.2, fill: 'none' },
  ],
  dot: [{ t: 'circle', cx: 12, cy: 12, r: 4.5, fill: TEAL }],
  check: [{ t: 'path', d: 'M4 12.5 L9.5 18 L20 6.5', stroke: TEAL, sw: 2.6, fill: 'none' }],
}
