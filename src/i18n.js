// Libellés de la fiche (aperçu + PDF) en anglais et en français. Les valeurs saisies pour un produit sont
// partagées entre les deux langues : seuls les libellés changent. Clés de `specs` = SPEC_FIELDS (schema.js).

export const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
]

export const DISCLAIMER_EN =
  'GRAPHENATON reserves the right to make changes without further notice to any products herein. GRAPHENATON makes no warranty, representation or guarantee regarding the suitability of its products for any particular purpose, nor does GRAPHENATON assume any liability arising out of the application or use of any product, and specifically disclaims any and all liability, including without limitation special, consequential or incidental damages.'

export const DISCLAIMER_FR =
  'GRAPHENATON se réserve le droit d\'apporter sans préavis des modifications à tout produit décrit dans le présent document. GRAPHENATON n\'accorde aucune garantie, déclaration ou assurance quant à l\'adéquation de ses produits à un usage particulier et n\'assume aucune responsabilité découlant de l\'application ou de l\'utilisation de tout produit ; GRAPHENATON décline expressément toute responsabilité, y compris, sans s\'y limiter, pour les dommages spéciaux, indirects ou accessoires.'

const en = {
  title: 'TECHNICAL DATASHEET',
  specsTitle: 'ELECTRIC AND THERMAL SPECIFICATIONS',
  dimensionsTitle: 'DIMENSIONS',
  curveTitle: 'TEMPERATURE RISE CURVE',
  v230: '230 V',
  v240: '240 V',
  dimsMm: 'Dimensions in mm',
  na: 'N/A',
  curveX: 'Time (min)',
  curveY: 'Temperature (°C)',
  disclaimerKey: 'disclaimerEn', // clé de `brand` contenant le texte légal dans cette langue
  page2: {
    applications: 'APPLICATIONS',
    integration: 'INTEGRATION',
    storage: 'STORAGE',
    compliance: 'COMPLIANCE AND REGULATORY',
    testConditions: 'TEST CONDITIONS',
    footnotes: 'NOTES',
  },
  subs: { dielectric: '(IEC 60335-1 : 2023 + A11 : 2023)' },
  specs: {
    voltage: 'Operating Voltage (V)',
    frequency: 'Frequency (Hz)',
    powerNom: 'Nominal Power (W) at 20°C',
    currentNom: 'Nominal current (A)',
    currentPeak: 'Current at peak power (A)',
    tempAvg: 'Average Surface Temperature (°C)',
    tempMax: 'Maximum Surface Temperature (°C)',
    tempAmbient: 'Operating ambient temperature (°C)',
    heatUp: 'Heat-up Time (Seconds)',
    emissivity: 'Radiative / Convective / Conductive emissivity (%)',
    resistance: 'Electrical Resistance at 20°C (Ω)',
    dielectric: 'Dielectric Strength (V)',
    cop: 'Coefficient of Performance (COP)',
    ir: 'IR Radiation Distribution',
    endurance: 'Endurance (Electrical resistance variation after 2,500 cycles)',
    ip: 'Ingress Protection',
    weight: 'Weight (g)',
    thickness: 'Thickness of the heating film (mm)',
    thicknessLam: 'Total thickness laminated (mm)',
    warranty: 'Warranty',
  },
}

const fr = {
  title: 'FICHE TECHNIQUE',
  specsTitle: 'SPÉCIFICATIONS ÉLECTRIQUES ET THERMIQUES',
  dimensionsTitle: 'DIMENSIONS',
  curveTitle: 'COURBE DE MONTÉE EN TEMPÉRATURE',
  v230: '230 V',
  v240: '240 V',
  dimsMm: 'Dimensions en mm',
  na: 'N/A',
  curveX: 'Temps (min)',
  curveY: 'Température (°C)',
  disclaimerKey: 'disclaimerFr',
  page2: {
    applications: 'APPLICATIONS',
    integration: 'INTÉGRATION',
    storage: 'STOCKAGE',
    compliance: 'CONFORMITÉ ET RÉGLEMENTATION',
    testConditions: 'CONDITIONS D\'ESSAI',
    footnotes: 'NOTES',
  },
  subs: { dielectric: '(IEC 60335-1 : 2023 + A11 : 2023)' },
  specs: {
    voltage: 'Tension de fonctionnement (V)',
    frequency: 'Fréquence (Hz)',
    powerNom: 'Puissance nominale (W) à 20 °C',
    currentNom: 'Courant nominal (A)',
    currentPeak: 'Courant à la puissance de crête (A)',
    tempAvg: 'Température de surface moyenne (°C)',
    tempMax: 'Température de surface maximale (°C)',
    tempAmbient: 'Température ambiante de fonctionnement (°C)',
    heatUp: 'Temps de montée en température (s)',
    emissivity: 'Émissivité radiative / convective / conductive (%)',
    resistance: 'Résistance électrique à 20 °C (Ω)',
    dielectric: 'Rigidité diélectrique (V)',
    cop: 'Coefficient de performance (COP)',
    ir: 'Distribution du rayonnement IR',
    endurance: 'Endurance (variation de la résistance électrique après 2 500 cycles)',
    ip: 'Indice de protection',
    weight: 'Poids (g)',
    thickness: 'Épaisseur du film chauffant (mm)',
    thicknessLam: 'Épaisseur totale laminée (mm)',
    warranty: 'Garantie',
  },
}

const DICT = { en, fr }

export const t = (lang) => DICT[lang] || en
export const specLabel = (lang, key) => t(lang).specs[key] ?? en.specs[key] ?? key
export const disclaimerOf = (lang, brand) => brand[t(lang).disclaimerKey] ?? ''
