// Textes de la fiche : découpage en lignes, tableau mécanique, paliers de montée en température.
// Partagé entre l'aperçu et le PDF.

// Texte multi-lignes → lignes non vides, sans puce de tête (- • *).
export const lines = (text) => String(text || '').split(/\r?\n/).map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean)

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
