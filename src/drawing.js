// Calcule les primitives du schéma coté (rect / line / text) à partir des dimensions en mm.
// Utilisé à la fois par l'aperçu HTML et par le PDF pour garantir le même dessin.

export const TEAL = '#1FB8B0'
export const NAVY = '#141B33'

export function computeDrawing(dims, laminated) {
  const n = (v, d) => (Number.isFinite(+v) && +v > 0 ? +v : d)
  const W = n(dims.outerW, 370), H = n(dims.outerH, 673)
  const FW = laminated ? Math.min(n(dims.filmW, W), W) : W
  const FH = laminated ? Math.min(n(dims.filmH, H), H) : H
  const AH = Math.min(n(dims.activeH, FH - 40), FH)
  const TO = n(dims.tabOffset, 17), TW = n(dims.tabW, 5), TG = n(dims.tabGap, 3)

  const S = 0.5
  const ox = 110, oy = 40
  const w = W * S, h = H * S
  const fx = ox + ((W - FW) / 2) * S, fy = oy + ((H - FH) / 2) * S, fw = FW * S, fh = FH * S
  const ax = fx + 10, ay = fy + ((FH - AH) / 2) * S, aw = Math.max(fw - 20, 10), ah = AH * S
  const tabx = fx + TO * S, taby = fy + fh + 2

  const P = []
  const rect = (x, y, width, height, fill, stroke, sw = 1) => P.push({ t: 'rect', x, y, width, height, fill, stroke, sw })
  const line = (x1, y1, x2, y2) => P.push({ t: 'line', x1, y1, x2, y2, stroke: TEAL })
  const text = (x, y, s, o = {}) => P.push({ t: 'text', x, y, s, size: o.size ?? 9, weight: o.weight ?? 700, fill: o.fill ?? NAVY, anchor: o.anchor ?? 'middle', rotate: o.rotate ?? 0 })

  const dimH = (x1, x2, y, s) => { line(x1, y, x2, y); line(x1, y - 4, x1, y + 4); line(x2, y - 4, x2, y + 4); text((x1 + x2) / 2, y - 6, s) }
  const dimV = (x, y1, y2, s) => { line(x, y1, x, y2); line(x - 4, y1, x + 4, y1); line(x - 4, y2, x + 4, y2); text(x - 6, (y1 + y2) / 2, s, { rotate: -90 }) }

  if (laminated) rect(ox, oy, w, h, '#D9DDE3', '#9AA1AD')
  rect(fx, fy, fw, fh, '#F3F4F6', '#C8CCD2')
  rect(ax, ay, aw, ah, '#2E3440', '#1B1F27', 2)
  rect(ax + 2, ay + 2, 6, ah - 4, '#8A8F99', 'none')
  rect(ax + aw - 8, ay + 2, 6, ah - 4, '#8A8F99', 'none')
  rect(tabx, taby, TW * S + 3, 9, TEAL, 'none')
  rect(tabx + TW * S + 3 + TG * S + 3, taby, TW * S + 3, 9, TEAL, 'none')

  dimH(ox, ox + w, oy - 18, W.toFixed(1))
  if (laminated) dimH(fx, fx + fw, oy - 4, FW.toFixed(1))
  dimV(ox - 14, oy, oy + h, H.toFixed(1))
  if (laminated) dimV(ox - 30, fy, fy + fh, FH.toFixed(1))
  dimV(laminated ? ox - 46 : ox - 30, ay, ay + ah, AH.toFixed(1))

  text(tabx, taby + 22, TW.toFixed(1), { size: 8, anchor: 'start' })
  line(tabx + (TW * S) / 2 + 1, taby + 24, tabx + (TW * S) / 2 + 1, taby + 30)
  text(tabx + (TW * S) / 2 + 1, taby + 38, 'H', { size: 8, fill: TEAL })
  text(tabx + 40, taby + 22, `${TO.toFixed(1)} / ${TG.toFixed(1)}`, { size: 8, anchor: 'start' })
  text(ox + w / 2, oy + h + 62, laminated ? 'Dimensions in mm (substrate + film)' : 'Dimensions in mm', { size: 8, weight: 400, fill: '#8A8F99' })

  return { prims: P, viewW: ox + w + 30, viewH: oy + h + 72 }
}
