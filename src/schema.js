// Schéma des champs d'une TDS. Chaque champ = une ligne du tableau "Electric and thermal specifications".
// `dual: true` = deux valeurs (230 V / 240 V). `aluOnly: true` = affiché uniquement pour les versions laminées.

export const SPEC_FIELDS = [
  { key: 'voltage', label: 'Operating Voltage (V)' },
  { key: 'frequency', label: 'Frequency (Hz)' },
  { key: 'powerNom', label: 'Nominal Power (W) at 20°C', dual: true },
  { key: 'currentNom', label: 'Nominal current (A)', dual: true },
  { key: 'currentPeak', label: 'Current at peak power (A)', dual: true },
  { key: 'tempAvg', label: 'Average Surface Temperature (°C)' },
  { key: 'tempMax', label: 'Maximum Surface Temperature (°C)' },
  { key: 'heatUp', label: 'Heat-up Time (Seconds)' },
  { key: 'emissivity', label: 'Radiative / Convective / Conductive emissivity (%)' },
  { key: 'resistance', label: 'Electrical Resistance at 20°C (Ω)' },
  { key: 'dielectric', label: 'Dielectric Strength (V)', sub: '(IEC 60335-1 : 2023 + A11 : 2023)' },
  { key: 'cop', label: 'Coefficient of Performance (COP)' },
  { key: 'ir', label: 'IR Radiation Distribution' },
  { key: 'endurance', label: 'Endurance (Electrical resistance variation after 2,500 cycles)' },
  { key: 'ip', label: 'Ingress Protection' },
  { key: 'weight', label: 'Weight (g)' },
  { key: 'thickness', label: 'Thickness of the heating film (mm)' },
  { key: 'thicknessLam', label: 'Total thickness laminated (mm)', aluOnly: true },
  { key: 'warranty', label: 'Warranty' },
]

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

export const DISCLAIMER =
  'GRAPHENATON reserves the right to make changes without further notice to any products herein. GRAPHENATON makes no warranty, representation or guarantee regarding the suitability of its products for any particular purpose, nor does GRAPHENATON assume any liability arising out of the application or use of any product, and specifically disclaims any and all liability, including without limitation special, consequential or incidental damages.'

export const DEFAULT_BRAND = {
  logo: '',            // data URL (PNG/JPG) chargée depuis l'interface ; vide = logo « G » dessiné
  logoHeight: 44,      // hauteur du logo en px dans l'en-tête
  company: 'GRAPHENATON',
  companySub: 'LABS SAS',
  address: 'GRAPHENATON Labs — 41 cours de la Liberté, 69003 Lyon – contact@graphenaton.com',
  site: 'WWW.GRAPHENATON.COM',
  disclaimer: DISCLAIMER,
}

const base = (o) => ({
  id: o.id,
  name: o.name,
  variant: o.variant, // 'film' | 'alu' | 'plaster'
  productNumber: o.productNumber,
  titleSuffix: o.titleSuffix ?? '',
  subtitle: o.subtitle,
  date: o.date,
  specs: {
    voltage: '230-240', frequency: '50-60',
    powerNom: ['', ''], currentNom: ['', ''], currentPeak: ['', ''],
    tempAvg: '', tempMax: '', heatUp: '', emissivity: '60 / 30 / 10',
    resistance: '', dielectric: '> 3000', cop: '1', ir: 'Lambertian',
    endurance: '< 5%', ip: '', weight: '', thickness: '', thicknessLam: '', warranty: '10 years',
    ...o.specs,
  },
  dims: { outerW: 370, outerH: 673, activeH: 627, tabOffset: 17, tabW: 5, tabGap: 3, filmW: 370, filmH: 673, ...o.dims },
})

export const PRESETS = [
  base({
    id: 'abf400-film', name: 'ABF400 FILM', variant: 'film', productNumber: '400',
    subtitle: '400W GRAPHENE HEATING FILM: ABF® 400', date: 'May 2026',
    specs: { powerNom: ['409 ± 2.5%', '440 ± 2.5%'], currentNom: ['1.7', '1.8'], currentPeak: ['1.98', '2.11'],
      tempAvg: '102 ± 5', tempMax: '107 ± 2.5', heatUp: '< 150', resistance: '117 ± 3', ip: 'IP 20', weight: '160', thickness: '0.56' },
  }),
  base({
    id: 'abf400-alu', name: 'ABF400 ALU', variant: 'alu', productNumber: '400', titleSuffix: 'ALU',
    subtitle: 'GRAPHENE HEATING FILM LAMINATED ONTO ALUMINUM: ABF® 400', date: 'May 2026',
    specs: { powerNom: ['409 ± 2.5%', '440 ± 2.5%'], currentNom: ['1.7', '1.8'], currentPeak: ['1.98', '2.11'],
      tempAvg: '102 ± 5', tempMax: '107 ± 2.5', heatUp: '< 600', resistance: '117 ± 3', ip: 'IP4X', weight: '1910', thickness: '0.56', thicknessLam: '3.12' },
    dims: { outerW: 410, outerH: 690 },
  }),
  base({
    id: 'abf800-film', name: 'ABF800 FILM', variant: 'film', productNumber: '800',
    subtitle: '800W GRAPHENE HEATING FILM: ABF® 800', date: 'May 2026',
    specs: { powerNom: ['800 ± 2.5%', '870 ± 2.5%'], currentNom: ['3.4', '3.7'], currentPeak: ['4.5', '3.9'],
      tempAvg: '140 ± 5', tempMax: '150 ± 2.5', heatUp: '< 90', resistance: '55 ± 3', ip: 'IP 20', weight: '150', thickness: '0.5' },
  }),
  base({
    id: 'abf800-alu', name: 'ABF800 ALU', variant: 'alu', productNumber: '800', titleSuffix: 'ALU',
    subtitle: 'GRAPHENE HEATING FILM LAMINATED ONTO ALUMINUM: ABF® 800', date: 'May 2026',
    specs: { powerNom: ['800 ± 2.5%', '870 ± 2.5%'], currentNom: ['3.4', '3.7'], currentPeak: ['4.5', '3.9'],
      tempAvg: '140 ± 5', tempMax: '150 ± 2.5', heatUp: '< 360', resistance: '56 ± 3', ip: 'IP4X', weight: '2310', thickness: '0.5', thicknessLam: '3.57' },
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

export const isLaminated = (p) => p.variant !== 'film'
export const slug = (p) => 'TDS_' + p.name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') + '.pdf'
