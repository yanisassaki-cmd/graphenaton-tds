// Page 2 : analyse des textes libres du produit (liste d'applications, listes à coches, badges de conformité,
// tableau mécanique). Partagé entre l'aperçu et le PDF.

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Pictogramme d'une carte « Application », choisi d'après les mots du titre (puis de la description).
const ICON_RULES = [
  ['ceiling', /ceiling|plafond/],
  ['floor', /floor|plancher|\bsol\b|\bsols\b/],
  ['wall', /\bwall|\bmur|mirror|miroir|radiant heater|radiateur/],
  ['car', /mobilit|automotive|vehic|\bev\b|\bbus|\brail|train|transport|cabin|camper|\bvan\b|marine|aircraft|avion/],
  ['chair', /seat|siege|furniture|mobilier|desk|bench|banc|appliance|drawer|tiroir|incubat/],
  ['industrial', /industr|process|drying|sechage|curing|enclosure|armoire|cabinet|battery|batterie|condensation|frost/],
  ['snow', /de-?icing|degivrage|defrost|\bice\b|snow|neige|outdoor|exterieur|gutter|gouttiere|terrace|terrasse|shelter/],
  ['wellness', /wellness|bien-etre|sauna|medical|health|sante|therap|yoga|care|soin|animal/],
]
export const pickIcon = (title, desc = '') => {
  const a = norm(title), b = norm(desc)
  for (const [k, re] of ICON_RULES) if (re.test(a)) return k
  for (const [k, re] of ICON_RULES) if (re.test(b)) return k
  return 'dot'
}

// Texte multi-lignes → lignes non vides, sans puce de tête (- • *).
export const lines = (text) => String(text || '').split(/\r?\n/).map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean)

// « Titre : description » (ou « Titre – description », « Titre | description ») par ligne → cartes.
export const parseApplications = (text) => lines(text).map((l) => {
  const m = l.match(/^(.{2,60}?)\s*(?::|\s[-–—]\s|\|)\s*(.+)$/)
  const title = m ? m[1].trim() : l, desc = m ? m[2].trim() : ''
  return { title, desc, icon: pickIcon(title, desc) }
})

// Badges déduits du texte de conformité (CE, RoHS, REACH, UL, IEC xxxx).
export const complianceBadges = (text) => {
  const s = String(text || ''), out = []
  if (/\bCE\b/.test(s)) out.push('CE')
  if (/\bRoHS\b/i.test(s)) out.push('RoHS')
  if (/\bREACH\b/.test(s)) out.push('REACH')
  if (/\bUL\b/.test(s)) out.push('UL')
  const iec = s.match(/\bIEC\s?\d[\d-]*/); if (iec) out.push(iec[0])
  return out
}

// Lignes du tableau « Mechanical specifications » : champs mech + cotes (longueur / largeur si vides) + specs.
// Lignes sans valeur omises. T = dictionnaire i18n (T.mech[key]).
export const mechRows = (p, T, laminated) => [
  ['length', p.mech?.length || p.dims?.outerH],
  ['width', p.mech?.width || p.dims?.outerW],
  ['activeSurface', p.mech?.activeSurface],
  ['thickness', p.specs?.thickness],
  ...(laminated ? [['thicknessLam', p.specs?.thicknessLam]] : []),
  ['weight', p.specs?.weight],
  ['construction', p.mech?.construction],
].filter(([, v]) => v != null && String(v).trim() !== '').map(([k, v]) => ({ key: k, label: T.mech[k], short: T.mechShort?.[k] ?? T.mech[k], unit: MECH_UNITS[k] || '', value: String(v) }))

const MECH_UNITS = { length: 'mm', width: 'mm', activeSurface: 'mm', thickness: 'mm', thicknessLam: 'mm', weight: 'g' }

// Ligne « Length: 673 mm » de la liste mécanique ; l'unité n'est pas répétée si la valeur la contient déjà.
export const mechLine = (r) => `${r.short}: ${r.value}${r.unit && !r.value.includes(r.unit) ? ' ' + r.unit : ''}`

// Paliers « to 120 °C: < 1 min » → { sub: 'to 120 °C', value: '< 1 min' } ; entrées vides ignorées.
export const warmUpRows = (arr) => (Array.isArray(arr) ? arr : []).map((s) => String(s || '').trim()).filter(Boolean).map((s) => {
  const i = s.indexOf(':')
  return i > 0 ? { sub: s.slice(0, i).trim(), value: s.slice(i + 1).trim() } : { sub: '', value: s }
})

export const hasText = (s) => String(s || '').trim() !== ''
