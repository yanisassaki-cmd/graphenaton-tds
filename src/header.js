// En-tête : nom du produit (« ABF® 800 », « ABF® 400 ALU ») et taille de police ajustée pour qu'il tienne
// sur une seule ligne à droite du bloc « TECHNICAL DATASHEET ». Tailles en px aperçu ; le PDF applique × 0,75.

export const HEADER = { width: 688, gap: 20, title: 30, line: 24, product: 46, productMin: 26 }

export const productName = (p) => `ABF® ${p.productNumber}${p.titleSuffix ? ' ' + p.titleSuffix : ''}`

const FAMILY = 'Inter, Arial, sans-serif'
let ctx
const measure = (text, font) => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d')
  ctx.font = font
  return ctx.measureText(text).width
}

// Largeur du bloc de gauche = ligne la plus large ; le nom du produit dispose du reste (marge de 3 %).
export function productFontSize(p, brand) {
  try {
    const left = Math.max(
      measure('TECHNICAL DATASHEET', `700 ${HEADER.title}px ${FAMILY}`),
      measure(brand.headerCompany || '', `400 ${HEADER.line}px ${FAMILY}`),
      measure(p.date || 'date', `400 ${HEADER.line}px ${FAMILY}`),
    )
    const avail = (HEADER.width - HEADER.gap - left) * 0.97
    const big = `800 ${HEADER.product}px ${FAMILY}`
    const w = measure('ABF', big) + measure('®', `800 ${HEADER.product * 0.35}px ${FAMILY}`) + measure(` ${p.productNumber}${p.titleSuffix ? ' ' + p.titleSuffix : ''}`, big)
    if (w <= avail) return HEADER.product
    return Math.max(HEADER.productMin, Math.floor(HEADER.product * avail / w))
  } catch {
    return HEADER.product
  }
}
