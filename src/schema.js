// Schéma des champs d'une TDS. Chaque champ = une ligne du tableau "Electric and thermal specifications".
// `dual: true` = deux valeurs (230 V / 240 V). `aluOnly: true` = affiché uniquement pour les versions laminées.
// `sub: true` = sous-libellé (référence IEC). `multi: 3` = trois paliers « to 120 °C: < 1 min ». `noTable: true` =
// saisi dans l'éditeur mais affiché hors tableau (liste mécanique / section Warranty de la colonne gauche).
// Les libellés EN / FR sont dans src/i18n.js (specs[key], subs[key]). Ordre = ordre du tableau de la fiche.

import { DISCLAIMER_EN, DISCLAIMER_FR } from './i18n'

export const SPEC_FIELDS = [
  { key: 'powerPeak', dual: true },       // Peak power (W) **
  { key: 'powerNom', dual: true },        // Nominal Power (W) at 20°C
  { key: 'tempAvg' },                     // Average Surface Temperature (°C)
  { key: 'tempMax' },                     // Maximum Surface Temperature (°C)
  { key: 'voltage' },                     // Operating Voltage (V)
  { key: 'frequency' },                   // Frequency (Hz)
  { key: 'currentPeak', dual: true },     // Current at peak power (A)
  { key: 'currentNom', dual: true },      // Nominal current (A)
  { key: 'resistance' },                  // Electrical Resistance at 20°C (Ω)
  { key: 'dielectric', sub: true },       // Dielectric Strength (V) + (IEC 60335-1 : 2023 + A11 : 2023)
  { key: 'cop' },                         // Coefficient of Performance (COP)
  { key: 'ir' },                          // IR Radiation Distribution
  { key: 'tempAmbient' },                 // Operating ambient temperature (°C)
  { key: 'ip' },                          // Ingress Protection
  { key: 'endurance' },                   // Endurance (Electrical resistance variation after 2,500 cycles)
  { key: 'heatUp' },                      // Heat-up Time (Seconds)
  { key: 'emissivity' },                  // Radiative / Convective / Conductive emissivity (%)
  { key: 'warmUp', multi: 3 },            // Warm-up time at 230 V : 3 paliers « to 120 °C: < 1 min »
  { key: 'applianceClass' },              // Electrical appliance
  { key: 'thickness', noTable: true },    // Thickness of the heating film (mm) → liste mécanique
  { key: 'thicknessLam', noTable: true, aluOnly: true }, // Total thickness laminated (mm) → liste mécanique
  { key: 'weight', noTable: true },       // Weight (g) → liste mécanique
  { key: 'warranty', noTable: true },     // Warranty → section de la colonne gauche
]

// Cotes en mm : optionnelles et informatives depuis que le schéma est une image chargée par produit (`schemaImage`).
export const DIM_FIELDS = [
  { key: 'outerW', label: 'Largeur totale (mm)' },
  { key: 'outerH', label: 'Hauteur totale (mm)' },
  { key: 'activeH', label: 'Hauteur zone active (mm)' },
  { key: 'tabOffset', label: 'Décalage connecteurs (mm)' },
  { key: 'tabW', label: 'Largeur connecteur (mm)' },
  { key: 'tabGap', label: 'Écart connecteurs (mm)' },
  { key: 'filmW', label: 'Largeur du film seul (mm)', aluOnly: true },
  { key: 'filmH', label: 'Hauteur du film seul (mm)', aluOnly: true },
]

export const DEFAULT_BRAND = {
  logo: '',            // data URL (PNG/JPG) chargée depuis l'interface ; vide = logo « G » dessiné
  logoHeight: 90,      // hauteur du logo en px dans l'en-tête (aperçu) ; × 0,75 en pt dans le PDF
  headerCompany: 'GRAPHENATON Technologies SA', // ligne sous « TECHNICAL DATASHEET » dans l'en-tête
  company: 'GRAPHENATON',
  companySub: 'LABS SAS',
  address: 'GRAPHENATON Labs — 41 cours de la Liberté, 69003 Lyon – contact@graphenaton.com',
  site: 'WWW.GRAPHENATON.COM',
  disclaimerEn: DISCLAIMER_EN, // texte légal, fiche en anglais
  disclaimerFr: DISCLAIMER_FR, // texte légal, fiche en français
}

// Valeurs par défaut des specs : presets, blankProduct, et produits mémorisés auxquels il manque une clé.
const defaultSpecs = () => ({
  voltage: '230-240', frequency: '50-60',
  powerPeak: ['', ''], powerNom: ['', ''], currentNom: ['', ''], currentPeak: ['', ''],
  warmUp: ['', '', ''], applianceClass: 'Compatible with Class I and II thermal systems',
  tempAvg: '', tempMax: '', tempAmbient: '0 to +40', heatUp: '', emissivity: '60 / 30 / 10',
  resistance: '', dielectric: '> 3000', cop: '1', ir: 'Lambertian',
  endurance: '< 5%', ip: '', weight: '', thickness: '', thicknessLam: '', warranty: '10 years',
})

// Textes par défaut de la fiche selon la version (film nu / laminé alu / laminé plâtre). Textes en anglais,
// partagés entre les fiches EN et FR ; modifiables produit par produit dans l'onglet Produit.
const APPLICATIONS_TEXT = {
  film: 'The Graphene heating film ABF® is a resistive heating film designed for integration into OEM thermal systems requiring uniform heat distribution, controlled temperature rise and stable electrical performance. This component is intended for integration into finished equipment and is not designed for standalone end-user operation; it does not carry standalone CE marking.',
  alu: 'The ABF® is a resistive heating film laminated onto an aluminium substrate, designed for integration into OEM thermal systems requiring uniform heat distribution, controlled temperature rise and stable electrical performance. This component is intended for integration into finished equipment and is not designed for standalone end-user operation; it does not carry standalone CE marking.',
  plaster: 'The ABF® is a resistive heating film laminated onto a plasterboard, designed for integration into ceiling and wall heating systems requiring uniform heat distribution, controlled temperature rise and stable electrical performance. This component is intended for integration into finished equipment and is not designed for standalone end-user operation; it does not carry standalone CE marking.',
}
const INTEGRATION = {
  film: ['Self-adhesive film to be integrated into a thermally controlled system', 'Over-temperature protection ensured at system level', 'Electrical protection compliant with applicable standards', 'Proper thermal contact with the support structure'],
  alu: ['Component to be integrated into a thermally controlled system', 'Over-temperature protection ensured at system level', 'Electrical protection compliant with applicable standards', 'Mechanical fixing on the aluminium plate, free air circulation on the radiant face'],
  plaster: ['Component to be integrated into a ceiling or wall system', 'Over-temperature protection ensured at system level', 'Electrical protection compliant with applicable standards', 'Finishing coat and paint compatible with radiant heating'],
}
const CONSTRUCTION = {
  film: 'Printed graphene encapsulated by insulating polymeric layers',
  alu: 'Graphene heating film laminated onto an aluminium plate',
  plaster: 'Graphene heating film laminated onto a plasterboard',
}
const v = (m, variant) => m[variant] ?? m.film
export const textDefaults = (variant) => ({
  applications: v(APPLICATIONS_TEXT, variant),
  integration: v(INTEGRATION, variant).join('\n'),
  storage: 'Clean, stable environment at ambient room temperature (< 50°C), relative humidity 20-80%',
  compliance: 'Designed for integration into CE-marked equipment\nCompliant with Directive 2011/65/EU (RoHS)\nCompliant with Regulation (EC) No 1907/2006 (REACH)',
  testConditions: 'Voltage: 230 V; Ambient temperature: 20 °C; Still air (no forced convection); Temperature measurement: 9 thermocouples on the active surface',
  footnotes: '* Subject to proper use and application of the product.\n** Peak power corresponds to transient conditions during warm-up phase and is not intended for continuous operation.',
  mech: { length: '', width: '', activeSurface: '', construction: v(CONSTRUCTION, variant) },
})
const TEXT_KEYS = ['applications', 'integration', 'storage', 'compliance', 'testConditions', 'footnotes']

// Champs additionnels d'un produit (import Excel, courbe) et leurs valeurs par défaut.
const defaultExtras = () => ({
  fileRef: '',                          // référence du nom de fichier PDF (Excel « Référence (nom fichier PDF) ») ; vide = nom du produit
  curveMode: 'none',                    // 'none' (pas de section) | 'image' (curveImage) | 'generated' (curvePoints via curve.js)
  curvePoints: [],                      // [{ t, temp }] points de la courbe de montée en température (onglet Courbes)
  curveAxis: { tMax: '', tempMax: '' }, // bornes des axes de la courbe ; vide = automatique
  applications: '', integration: '', storage: '', compliance: '', testConditions: '', footnotes: '', // textes de la colonne gauche (voir textDefaults)
  mech: { length: '', width: '', activeSurface: '', construction: '' }, // tableau mécanique ; longueur / largeur reprennent les cotes si vides
})

// Textes de la colonne gauche, dans l'ordre d'affichage. Libellés de l'éditeur (FR) ; titres de la fiche dans i18n.sections.
export const TEXT_FIELDS = [
  { key: 'applications', label: 'Applications (paragraphe)' },
  { key: 'integration', label: 'Intégration' },
  { key: 'storage', label: 'Stockage' },
  { key: 'compliance', label: 'Conformité et réglementation' },
  { key: 'testConditions', label: 'Conditions de mesure (après « Unless otherwise specified… »)' },
  { key: 'footnotes', label: 'Notes de bas de page' },
]

const base = (o) => ({
  ...defaultExtras(),
  ...textDefaults(o.variant),
  id: o.id,
  name: o.name,
  variant: o.variant, // 'film' | 'alu' | 'plaster'
  productNumber: o.productNumber,
  titleSuffix: o.titleSuffix ?? '',
  subtitle: o.subtitle,
  date: o.date,
  specs: { ...defaultSpecs(), ...o.specs },
  dims: { outerW: 370, outerH: 673, activeH: 627, tabOffset: 17, tabW: 5, tabGap: 3, filmW: 370, filmH: 673, ...o.dims },
  schemaImage: o.schemaImage ?? '', // data URL (PNG/JPG) du schéma coté ; vide = cadre « Schéma du film à charger »
  curveImage: o.curveImage ?? '',   // data URL (PNG/JPG) de la courbe de montée en température ; vide = cadre « Courbe à charger »
  fileRef: o.fileRef ?? '',
  curvePoints: o.curvePoints ?? [],
  curveAxis: { tMax: '', tempMax: '', ...o.curveAxis },
  mech: { ...textDefaults(o.variant).mech, ...o.mech },
})

export const PRESETS = [
  base({
    id: 'abf400-film', name: 'ABF400 FILM', variant: 'film', productNumber: '400',
    subtitle: '400W GRAPHENE HEATING FILM: ABF® 400', date: 'May 2026',
    specs: { powerPeak: ['464 ± 2.5%', '498 ± 2.5%'], powerNom: ['409 ± 2.5%', '440 ± 2.5%'], currentNom: ['1.7', '1.8'], currentPeak: ['1.98', '2.11'],
      tempAvg: '102 ± 5', tempMax: '107 ± 2.5', heatUp: '< 150', resistance: '117 ± 3', ip: 'IP 20', weight: '160', thickness: '0.56',
      warmUp: ['to 100 °C: 2 min 30 s', 'to 80 °C: < 1 min', 'to 60 °C: < 30 s'] },
  }),
  base({
    id: 'abf400-alu', name: 'ABF400 ALU', variant: 'alu', productNumber: '400', titleSuffix: 'ALU',
    subtitle: 'GRAPHENE HEATING FILM LAMINATED ONTO ALUMINUM: ABF® 400', date: 'May 2026',
    specs: { powerPeak: ['464 ± 2.5%', '498 ± 2.5%'], powerNom: ['409 ± 2.5%', '440 ± 2.5%'], currentNom: ['1.7', '1.8'], currentPeak: ['1.98', '2.11'],
      tempAvg: '102 ± 5', tempMax: '107 ± 2.5', heatUp: '< 600', resistance: '117 ± 3', ip: 'IP4X', weight: '1910', thickness: '0.56', thicknessLam: '3.12',
      warmUp: ['to 90 °C: 10 min', 'to 80 °C: 6 min', 'to 60 °C: < 3 min'] },
    dims: { outerW: 410, outerH: 690 },
  }),
  base({
    id: 'abf800-film', name: 'ABF800 FILM', variant: 'film', productNumber: '800',
    subtitle: '800W GRAPHENE HEATING FILM: ABF® 800', date: 'May 2026',
    specs: { powerPeak: ['925 ± 2.5%', '1030 ± 2.5%'], powerNom: ['800 ± 2.5%', '870 ± 2.5%'], currentNom: ['3.4', '3.7'], currentPeak: ['4.5', '3.9'],
      tempAvg: '140 ± 5', tempMax: '150 ± 2.5', heatUp: '< 90', resistance: '55 ± 3', ip: 'IP 20', weight: '150', thickness: '0.5',
      warmUp: ['to 120 °C: < 1 min', 'to 100 °C: < 30 s', 'to 80 °C: < 20 s'] },
  }),
  base({
    id: 'abf800-alu', name: 'ABF800 ALU', variant: 'alu', productNumber: '800', titleSuffix: 'ALU',
    subtitle: 'GRAPHENE HEATING FILM LAMINATED ONTO ALUMINUM: ABF® 800', date: 'May 2026',
    specs: { powerPeak: ['925 ± 2.5%', '1030 ± 2.5%'], powerNom: ['800 ± 2.5%', '870 ± 2.5%'], currentNom: ['3.4', '3.7'], currentPeak: ['4.5', '3.9'],
      tempAvg: '140 ± 5', tempMax: '150 ± 2.5', heatUp: '< 360', resistance: '56 ± 3', ip: 'IP4X', weight: '2310', thickness: '0.5', thicknessLam: '3.57',
      warmUp: ['to 120 °C: < 6 min', 'to 100 °C: 3 min', 'to 80 °C: < 2 min'] },
    dims: { outerW: 410, outerH: 690 },
  }),
  base({
    id: 'abf80-plaster', name: 'ABF80 PLASTER', variant: 'plaster', productNumber: '80', titleSuffix: 'PLASTER',
    subtitle: 'GRAPHENE HEATING FILM LAMINATED ONTO PLASTER: ABF® 80', date: 'May 2026',
    specs: { voltage: '230', powerNom: ['80 ± 3%', ''], currentNom: ['0.325', ''], currentPeak: ['', ''],
      tempAvg: '37 ± 2.5%', tempMax: '', heatUp: '', emissivity: '', resistance: '710 ± 3%', dielectric: '', ip: 'IP4X', weight: '3300', thickness: '0.345', thicknessLam: '13.345' },
    dims: { outerW: 600, outerH: 600, activeH: 560, filmW: 560, filmH: 560 },
  }),
]

export const blankProduct = () =>
  base({ id: 'new-' + Date.now(), name: 'Nouveau produit', variant: 'film', productNumber: '000', subtitle: '', date: '', specs: {}, dims: {} })

// Complète un produit venant du localStorage ou d'un JSON exporté par une version antérieure :
// clés images absentes, specs ajoutées depuis (ex. tempAmbient). Une valeur vidée volontairement ('') est conservée.
export const normalizeProduct = (p) => {
  const d2 = textDefaults(p.variant)
  const n = {
    ...defaultExtras(), schemaImage: '', curveImage: '', ...p,
    specs: { ...defaultSpecs(), ...(p.specs || {}) },
    curveAxis: { tMax: '', tempMax: '', ...(p.curveAxis || {}) },
    // produits d'avant le choix de mode : image chargée → 'image', points présents → 'generated', sinon 'none'
    curveMode: p.curveMode ?? (p.curveImage ? 'image' : (p.curvePoints || []).length >= 2 ? 'generated' : 'none'),
    mech: { ...d2.mech, ...(p.mech || {}) },
  }
  // Textes jamais renseignés (absents ou vides) : contenus par défaut de la version.
  for (const k of TEXT_KEYS) if (!String(n[k] || '').trim()) n[k] = d2[k]
  delete n.page2Enabled; delete n.applicationList // anciens champs de la page 2, supprimée
  return n
}

export const isLaminated = (p) => p.variant !== 'film'
// Nom du fichier PDF : TDS_<nom>_EN.pdf / TDS_<nom>_FR.pdf
export const slug = (p, lang = 'en') => 'TDS_' + (p.fileRef || p.name).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + lang.toUpperCase() + '.pdf'
