// Import de la base Excel (SheetJS). Onglet « Produits » : ligne d'en-tête « CHAMP » puis un produit par colonne,
// une ligne par champ avec le libellé en colonne A. Onglet « Courbes » : A Produit, B Temps (min), C Température (°C),
// et E Produit, F Axe X max, G Axe Y max pour les bornes des axes.

import * as XLSX from 'xlsx'
import { blankProduct } from './schema'

// Mapping « libellé Excel (colonne A) » → chemin dans l'objet produit. Pour étendre : ajouter une ligne.
// Chemins : champ direct ('date'), spec ('specs.heatUp'), valeur 230/240 V ('specs.powerNom.0' / '.1'),
// cote ('dims.outerW'), texte page 2 ('applications'…), ou niveau marque ('brand.address').
// null = libellé connu mais ignoré volontairement. La comparaison ignore la casse, les accents, les espaces
// multiples, les tirets typographiques et les astérisques.
export const FIELD_MAP = {
  // Infos générales
  'Date du document': 'date',
  'Titre': null,
  'Sous-titre': 'subtitle',
  'Référence (nom fichier PDF)': 'fileRef',
  'Applications (texte)': 'applications',
  // Specs électriques et thermiques
  'Operating Voltage (V)': 'specs.voltage',
  'Frequency (Hz)': 'specs.frequency',
  'Peak Power (W) at 20°C – 230 V': 'specs.powerPeak.0',
  'Peak Power (W) at 20°C – 240 V': 'specs.powerPeak.1',
  'Nominal Power (W) at 20°C – 230 V': 'specs.powerNom.0',
  'Nominal Power (W) at 20°C – 240 V': 'specs.powerNom.1',
  'Nominal current (A) – 230 V': 'specs.currentNom.0',
  'Nominal current (A) – 240 V': 'specs.currentNom.1',
  'Current at peak power (A) – 230 V': 'specs.currentPeak.0',
  'Current at peak power (A) – 240 V': 'specs.currentPeak.1',
  'Average Surface Temperature (°C)': 'specs.tempAvg',
  'Maximum Surface Temperature (°C)': 'specs.tempMax',
  'Operating ambient temperature (°C)': 'specs.tempAmbient',
  'Heat-up Time (seconds)': 'specs.heatUp',
  'Radiative / Convective / Conductive emissivity (%)': 'specs.emissivity',
  'Electrical Resistance at 20°C (Ω)': 'specs.resistance',
  'Dielectric Strength (V) – norme IEC 60335-1 : 2023 + A11 : 2023': 'specs.dielectric',
  'Dielectric Strength (V)': 'specs.dielectric',
  'Coefficient of Performance (COP)': 'specs.cop',
  'IR Radiation Distribution': 'specs.ir',
  'Endurance (variation résistance après 2 500 cycles)': 'specs.endurance',
  'Endurance (Electrical resistance variation after 2,500 cycles)': 'specs.endurance',
  'Ingress Protection': 'specs.ip',
  'Electrical appliance class': 'specs.applianceClass',
  'Warm-up time at 230 V – palier 1': 'specs.warmUp.0',
  'Warm-up time at 230 V – palier 2': 'specs.warmUp.1',
  'Warm-up time at 230 V – palier 3': 'specs.warmUp.2',
  'Warranty': 'specs.warranty',
  'Conditions de mesure (texte)': 'testConditions',
  // Specs mécaniques (tableau « Mechanical specifications » de la page 2)
  'Length (mm)': 'mech.length',
  'Width (mm)': 'mech.width',
  'Active surface (mm)': 'mech.activeSurface',
  'Construction': 'mech.construction',
  'Thickness of the heating film (mm)': 'specs.thickness',
  'Total thickness laminated (mm)': 'specs.thicknessLam',
  'Weight (g)': 'specs.weight',
  'Integration (texte)': 'integration',
  'Storage (texte)': 'storage',
  'Compliance and regulatory (texte)': 'compliance',
  'Notes de bas de page': 'footnotes',
  // Dimensions du schéma (mm)
  'Largeur totale film (outer_w)': 'dims.outerW',
  'Largeur totale (outer_w)': 'dims.outerW',
  'Hauteur totale film (outer_h)': 'dims.outerH',
  'Hauteur zone active (active_h)': 'dims.activeH',
  'Décalage latéral connecteurs (tab_offset)': 'dims.tabOffset',
  'Largeur connecteur (tab_w)': 'dims.tabW',
  'Écart entre connecteurs (tab_gap)': 'dims.tabGap',
  // Pied de page (niveau marque : première valeur non vide)
  'Adresse / contact': 'brand.address',
  'Site web': 'brand.site',
}

// Champs texte multi-lignes : « a | b | c » dans une cellule devient trois lignes.
const MULTILINE = new Set(['applications', 'integration', 'storage', 'compliance', 'testConditions', 'footnotes'])

export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[–—−]/g, '-').replace(/\*/g, '').replace(/\s+/g, ' ').trim()

const MAP = Object.fromEntries(Object.entries(FIELD_MAP).map(([k, v]) => [norm(k), v]))
const PLACEHOLDER = new Set(['a completer', 'to complete', 'tbd', 'n/a (a completer)'])
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Valeur brute d'une cellule → chaîne ('' pour « À COMPLÉTER »), date Excel → « May 2026 ».
function cellText(v, path) {
  if (v == null) return ''
  if (typeof v === 'number') {
    if (path === 'date' && v > 20000 && v < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
    return String(v)
  }
  const s = String(v).trim()
  if (PLACEHOLDER.has(norm(s))) return ''
  return MULTILINE.has(path) ? s.split(/\s*\|\s*/).join('\n') : s
}

const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null }

function setPath(obj, path, value) {
  const keys = path.split('.')
  let o = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i], next = keys[i + 1]
    if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(next) ? [] : {}
    o = o[k]
  }
  o[keys[keys.length - 1]] = value
}

// Produit neuf à partir du nom de colonne : « ABF400 ALU » → variant alu, numéro 400, suffixe ALU.
function productFromName(name) {
  const p = blankProduct()
  const n = norm(name)
  p.id = 'xlsx-' + n.replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
  p.name = String(name).trim()
  p.variant = /\balu/.test(n) ? 'alu' : /plaster|platre/.test(n) ? 'plaster' : 'film'
  p.productNumber = (String(name).match(/ABF\s*(\d+)/i) || [])[1] || ''
  p.titleSuffix = p.variant === 'alu' ? 'ALU' : p.variant === 'plaster' ? 'PLASTER' : ''
  return p
}

// Importe un classeur (ArrayBuffer) et fusionne dans `existing` (produits mis à jour par nom, nouveaux ajoutés).
// Retourne { products, brand: { address?, site? }, stats: { products, fields, created, unknown } }.
export function importExcel(buffer, existing = []) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const wsName = wb.SheetNames.find((n) => norm(n) === 'produits') || wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wsName], { header: 1, defval: '' })
  let hdr = rows.findIndex((r) => norm(r[0]) === 'champ')
  if (hdr < 0) hdr = 3
  const header = rows[hdr] || []
  const cols = [] // { col, product }
  const products = existing.map((p) => JSON.parse(JSON.stringify(p)))
  const created = []
  for (let c = 1; c < header.length; c++) {
    const name = String(header[c] ?? '').trim()
    if (!name) continue
    let p = products.find((x) => norm(x.name) === norm(name))
    if (!p) { p = productFromName(name); products.push(p); created.push(p.name) }
    cols.push({ col: c, product: p })
  }
  const brand = {}
  const unknown = []
  let fields = 0
  for (let r = hdr + 1; r < rows.length; r++) {
    const row = rows[r]
    const label = String(row[0] ?? '').trim()
    if (!label) continue
    if (cols.every(({ col }) => String(row[col] ?? '').trim() === '')) continue // ligne de section
    const key = norm(label)
    if (!(key in MAP)) { unknown.push(label); continue }
    const path = MAP[key]
    if (path === null) continue
    if (path.startsWith('brand.')) {
      const v = cols.map(({ col }) => cellText(row[col], path)).find(Boolean)
      if (v) brand[path.slice(6)] = v
      continue
    }
    for (const { col, product } of cols) {
      const v = cellText(row[col], path)
      setPath(product, path, path.startsWith('dims.') ? (num(v) ?? '') : v)
      if (v !== '') fields++
    }
  }

  // Onglet Courbes : points et bornes d'axes par produit.
  const cName = wb.SheetNames.find((n) => norm(n) === 'courbes')
  if (cName) {
    const crows = XLSX.utils.sheet_to_json(wb.Sheets[cName], { header: 1, defval: '' })
    let ch = crows.findIndex((r) => norm(r[0]) === 'produit')
    if (ch < 0) ch = 0
    const byName = (n) => products.find((x) => norm(x.name) === norm(n))
    const pts = new Map()
    for (let r = ch + 1; r < crows.length; r++) {
      const row = crows[r]
      const p1 = byName(row[0]), t = num(row[1]), temp = num(row[2])
      if (p1 && t != null && temp != null) { if (!pts.has(p1)) pts.set(p1, []); pts.get(p1).push({ t, temp }) }
      const p2 = byName(row[4]), tMax = num(row[5]), tempMax = num(row[6])
      if (p2 && (tMax != null || tempMax != null)) p2.curveAxis = { tMax: tMax ?? '', tempMax: tempMax ?? '' }
    }
    for (const [p, list] of pts) {
      p.curvePoints = list.sort((a, b) => a.t - b.t); fields += list.length
      if (p.curveMode !== 'image') p.curveMode = 'generated' // la courbe importée s'affiche, sauf si une image est déjà choisie
    }
  }

  return { products, brand, stats: { products: cols.length, fields, created, unknown } }
}
