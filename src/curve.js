// Courbe de montée en température en SVG pur, partagée entre l'aperçu (<svg>) et le PDF (@react-pdf/renderer),
// sur le modèle de drawing.js : computeCurve() renvoie des primitives line / path / circle / text dans un viewBox.

import { NAVY, TEAL } from './drawing'

const GREY = '#8A8F99', GRID = '#E3E7EC', AXIS = '#5B6270'

const valid = (pt) => pt && String(pt.t) !== '' && String(pt.temp) !== '' && Number.isFinite(+pt.t) && Number.isFinite(+pt.temp)

// Au moins deux points valides = courbe affichable.
export const hasCurveData = (p) => (p?.curvePoints || []).filter(valid).length >= 2

// Pas de graduation « rond » (1, 2, 2.5, 5 × 10^n) pour environ n intervalles.
function niceStep(range, n = 5) {
  const raw = Math.max(range, 1e-9) / n
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const r = raw / mag
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag
}

const fmt = (v) => String(Number(v.toFixed(2)))

// points : [{ t, temp }], axis : { tMax, tempMax } (vide = automatique), labels : { x, y } (titres traduits).
export function computeCurve(points, axis = {}, labels = { x: 'Time (min)', y: 'Temperature (°C)' }) {
  const pts = (points || []).filter(valid).map((p) => ({ t: +p.t, temp: +p.temp })).sort((a, b) => a.t - b.t)
  const viewW = 400, viewH = 200
  const ml = 46, mr = 14, mt = 12, mb = 38
  const W = viewW - ml - mr, H = viewH - mt - mb
  const maxT = pts.length ? Math.max(...pts.map((p) => p.t)) : 1
  const maxTemp = pts.length ? Math.max(...pts.map((p) => p.temp)) : 1
  const axT = +axis.tMax > 0 ? +axis.tMax : 0, axY = +axis.tempMax > 0 ? +axis.tempMax : 0
  const xStep = niceStep(axT || maxT || 1), yStep = niceStep(axY || maxTemp || 1)
  const xMax = axT || Math.ceil((maxT || 1) / xStep) * xStep
  const yMax = axY || Math.ceil((maxTemp || 1) / yStep) * yStep
  const X = (t) => ml + (t / xMax) * W
  const Y = (v) => mt + H - (v / yMax) * H
  const P = []
  const line = (x1, y1, x2, y2, stroke, sw) => P.push({ t: 'line', x1, y1, x2, y2, stroke, sw })
  const text = (x, y, s, o = {}) => P.push({ t: 'text', x, y, s, size: o.size ?? 8, fill: o.fill ?? GREY, anchor: o.anchor ?? 'middle', weight: o.weight ?? 400, rotate: o.rotate ?? 0 })

  // Grille légère + graduations
  for (let v = 0; v <= yMax + 1e-9; v += yStep) { const y = Y(v); if (v > 0) line(ml, y, ml + W, y, GRID, 0.75); text(ml - 6, y + 3, fmt(v), { anchor: 'end' }) }
  for (let v = 0; v <= xMax + 1e-9; v += xStep) { const x = X(v); if (v > 0) line(x, mt, x, mt + H, GRID, 0.75); text(x, mt + H + 12, fmt(v)) }
  // Axes
  line(ml, mt, ml, mt + H, AXIS, 1)
  line(ml, mt + H, ml + W, mt + H, AXIS, 1)
  // Titres des axes
  text(ml + W / 2, viewH - 8, labels.x, { size: 9, fill: AXIS, weight: 600 })
  text(12, mt + H / 2, labels.y, { size: 9, fill: AXIS, weight: 600, rotate: -90 })
  // Courbe (teal 2 px) + points (navy)
  if (pts.length >= 2) P.push({ t: 'path', d: pts.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.temp).toFixed(1)).join(' '), stroke: TEAL, sw: 2 })
  pts.forEach((p) => P.push({ t: 'circle', cx: X(p.t), cy: Y(p.temp), r: 2.5, fill: NAVY }))

  return { viewW, viewH, prims: P }
}
