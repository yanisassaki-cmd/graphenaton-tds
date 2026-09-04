import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Path, Line, Circle, Rect, G, Text as SvgText } from '@react-pdf/renderer'
import { SPEC_FIELDS, DEFAULT_BRAND, isLaminated } from './schema'
import { NAVY, TEAL } from './drawing'
import { t, specLabel, disclaimerOf } from './i18n'
import { computeCurve, hasCurveData } from './curve'
import { ICONS, ICON_VIEW } from './icons'
import { parseApplications, lines, mechRows, mechLine, warmUpRows, hasText } from './page2'

Font.register({
  family: 'Inter',
  fonts: [400, 500, 600, 700, 800].map((w) => ({ src: `/fonts/inter-${w}.ttf`, fontWeight: w })),
})
Font.registerHyphenationCallback((w) => [w])

// Mise en page de la fiche (PDF), miroir de Preview.jsx : pt = px × 0,75.
// Colonne gauche : textes (applications, mécanique, intégration, stockage, garantie, conformité, courbe).
// Colonne droite : tableau électrique / thermique à bandeau bleu marine, schéma du film (100 pt max), notes.
const SCHEMA_MAX_PT = 85

const GREY = '#5B6270', LINE = '#D9DDE3', MUTED = '#8A8F99', CELL = '#C9CED6', HILITE = '#E8EBF0'
const s = StyleSheet.create({
  page: { fontFamily: 'Inter', color: NAVY, paddingTop: 28, paddingHorizontal: 40, paddingBottom: 40, fontSize: 7.6 },
  // En-tête deux colonnes : tailles en pt = tailles px de l'aperçu (.sheet) × 0,75
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15 },
  hdLeft: { flexShrink: 0, paddingTop: 6 },
  hdTitle: { fontSize: 22, fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.2 },
  hdLine: { fontSize: 18, color: GREY, lineHeight: 1.25, marginTop: 3 },
  hdRight: { flex: 1, alignItems: 'flex-end' },
  hdProduct: { fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.05, marginTop: 6, textAlign: 'right' }, // fontSize : nameSize × 0,75
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  g: { width: 34, height: 34, borderWidth: 2.5, borderColor: NAVY, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  gText: { fontSize: 18, fontWeight: 800 },
  brand: { fontSize: 13, fontWeight: 700, letterSpacing: 1.5 },
  brandSub: { fontSize: 6, letterSpacing: 2.5, color: GREY, marginTop: 1 },
  sup: { fontWeight: 800 },
  subtitle: { fontSize: 10.5, color: GREY, marginTop: 6, paddingBottom: 6, borderBottomWidth: 2.5, borderBottomColor: TEAL },
  // Corps
  cols: { flexDirection: 'row', gap: 14, marginTop: 8 },
  left: { flex: 1 },
  right: { flex: 1.06 },
  sec: { marginBottom: 6 },
  sh: { fontSize: 8.2, fontWeight: 700, letterSpacing: 0.3, backgroundColor: HILITE, paddingVertical: 1.2, paddingHorizontal: 4, alignSelf: 'flex-start', marginBottom: 3 },
  p: { fontSize: 7.6, lineHeight: 1.35 },
  li: { flexDirection: 'row', gap: 4, marginBottom: 0.5 },
  liDash: { fontSize: 7.6, lineHeight: 1.35, width: 6 },
  liText: { fontSize: 7.6, lineHeight: 1.35, flex: 1 },
  curveImg: { width: '100%', maxHeight: 130, objectFit: 'contain', marginTop: 3 },
  ph: { borderWidth: 1, borderColor: '#B8BEC8', borderStyle: 'dashed', borderRadius: 4, height: 60, marginTop: 4 },
  // Tableau électrique / thermique
  tblHead: { backgroundColor: NAVY, color: '#FFFFFF', fontSize: 7.8, fontWeight: 700, textAlign: 'center', paddingVertical: 3.5, paddingHorizontal: 4, letterSpacing: 0.3 },
  tbl: { borderWidth: 0.75, borderColor: CELL, borderTopWidth: 0, marginTop: 2 },
  row: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: CELL },
  lbl: { width: '61%', paddingVertical: 2.3, paddingHorizontal: 3.5, borderRightWidth: 0.75, borderRightColor: CELL, justifyContent: 'center' },
  lblText: { fontSize: 7.2, lineHeight: 1.28 },
  sub: { fontSize: 7, color: GREY, lineHeight: 1.28, marginLeft: 6 },
  val: { width: '39%', paddingVertical: 2.3, paddingHorizontal: 3, justifyContent: 'center' },
  valText: { fontSize: 7.2, lineHeight: 1.28, textAlign: 'center' },
  miss: { color: '#C00000' },
  schema: { marginTop: 6, alignItems: 'center' },
  schemaImg: { maxHeight: SCHEMA_MAX_PT, maxWidth: '100%', objectFit: 'contain' },
  fn: { fontSize: 6.2, color: GREY, lineHeight: 1.3, marginTop: 5 },
  legal: { fontSize: 5.8, color: MUTED, lineHeight: 1.35, textAlign: 'justify', marginTop: 4, paddingTop: 3.5, borderTopWidth: 0.75, borderTopColor: '#E1E4E9' },
  footer: { position: 'absolute', left: 40, right: 40, bottom: 22, borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  fa: { fontSize: 6.5, color: GREY },
  fs: { fontSize: 7, fontWeight: 700, letterSpacing: 1.5 },
  // Page 2 : cartes d'applications
  p2Body: { marginTop: 10 },
  p2Intro: { fontSize: 8.6, lineHeight: 1.5, marginBottom: 7 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  card: { width: '48.8%', flexDirection: 'row', gap: 7, alignItems: 'flex-start', backgroundColor: '#F6F8FA', borderWidth: 0.75, borderColor: '#E6E9EE', borderRadius: 4.5, paddingVertical: 5.5, paddingHorizontal: 7.5 },
  cardIco: { width: 19.5, height: 19.5 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 8.6, fontWeight: 700, lineHeight: 1.3 },
  cardDesc: { fontSize: 7.9, color: GREY, lineHeight: 1.4, marginTop: 1.5 },
})

// Rendu des primitives partagées (curve.js, icons.js) avec les composants SVG de react-pdf.
function PrimsPdf({ prims, viewW, viewH, style }) {
  return (
    <Svg viewBox={`0 0 ${viewW} ${viewH}`} style={style}>
      {prims.map((q, i) => {
        if (q.t === 'line') return <Line key={i} x1={q.x1} y1={q.y1} x2={q.x2} y2={q.y2} stroke={q.stroke} strokeWidth={q.sw} strokeLinecap="round" />
        if (q.t === 'path') return <Path key={i} d={q.d} fill={q.fill || 'none'} stroke={q.stroke} strokeWidth={q.sw} strokeLinejoin="round" strokeLinecap="round" />
        if (q.t === 'circle') return <Circle key={i} cx={q.cx} cy={q.cy} r={q.r} fill={q.fill || 'none'} stroke={q.stroke} strokeWidth={q.sw} />
        if (q.t === 'rect') return <Rect key={i} x={q.x} y={q.y} width={q.width} height={q.height} rx={q.rx} ry={q.rx} fill={q.fill || 'none'} stroke={q.stroke} strokeWidth={q.sw} />
        const txt = <SvgText key={i} x={q.rotate ? 0 : q.x} y={q.rotate ? 0 : q.y} fill={q.fill} textAnchor={q.anchor} style={{ fontSize: q.size, fontWeight: q.weight, fontFamily: 'Inter' }}>{q.s}</SvgText>
        return q.rotate ? <G key={i} transform={`translate(${q.x},${q.y}) rotate(${q.rotate})`}>{txt}</G> : txt
      })}
    </Svg>
  )
}

const Icon = ({ name, style }) => <PrimsPdf prims={ICONS[name] || ICONS.dot} viewW={ICON_VIEW} viewH={ICON_VIEW} style={style} />

// Courbe générée (src/curve.js).
function CurvePdf({ p, T }) {
  const { prims, viewW, viewH } = computeCurve(p.curvePoints, p.curveAxis, { x: T.curveX, y: T.curveY })
  return <PrimsPdf prims={prims} viewW={viewW} viewH={viewH} style={{ width: '100%', marginTop: 4 }} />
}

// Section courbe du PDF : image ou SVG ; rien (ni titre ni cadre) en mode « Aucune » ou sans données.
const curveContent = (p) =>
  p.curveMode === 'image' && p.curveImage ? 'image'
  : p.curveMode === 'generated' && hasCurveData(p) ? 'svg'
  : null

// En-tête commun aux deux pages (titre / société / date, logo + nom du produit, sous-titre + barre teale).
function Header({ p, brand, T, namePt }) {
  return (
    <>
      <View style={s.top}>
        <View style={s.hdLeft}>
          <Text style={s.hdTitle}>{T.title}</Text>
          <Text style={s.hdLine}>{brand.headerCompany}</Text>
          <Text style={s.hdLine}>{p.date}</Text>
        </View>
        <View style={s.hdRight}>
          {brand.logo ? (
            <Image src={brand.logo} style={{ height: brand.logoHeight * 0.75, objectFit: 'contain', objectPosition: 'right' }} />
          ) : (
            <View style={s.logo}>
              <View style={s.g}><Text style={s.gText}>G</Text></View>
              <View><Text style={s.brand}>{brand.company}</Text><Text style={s.brandSub}>{brand.companySub}</Text></View>
            </View>
          )}
          <Text style={[s.hdProduct, { fontSize: namePt }]}>ABF<Text style={[s.sup, { fontSize: namePt * 0.35 }]}>®</Text> {p.productNumber}{p.titleSuffix ? ' ' + p.titleSuffix : ''}</Text>
        </View>
      </View>
      <Text style={s.subtitle}>{p.subtitle}</Text>
    </>
  )
}

const Footer = ({ brand }) => (
  <View style={s.footer} fixed>
    <Text style={s.fa}>{brand.address}</Text>
    <Text style={s.fs}>{brand.site}</Text>
  </View>
)

const Sec = ({ title, children }) => <View style={s.sec}><Text style={s.sh}>{title}</Text>{children}</View>
const Dash = ({ items }) => items.map((l, i) => <View key={i} style={s.li}><Text style={s.liDash}>–</Text><Text style={s.liText}>{l}</Text></View>)
const Val = ({ v, na }) => { const empty = !v || !String(v).trim(); return <Text style={[s.valText, empty && s.miss]}>{empty ? na : v}</Text> }

// Lignes du tableau électrique / thermique : simple, double (230 / 240 V), paliers (warm-up), sous-libellé (IEC).
function SpecRows({ p, lang, T, lam }) {
  return SPEC_FIELDS.filter((f) => !f.noTable && (!f.aluOnly || lam)).map((f) => {
    const label = specLabel(lang, f.key)
    let subs = null, values = null
    if (f.dual) {
      const v = Array.isArray(p.specs[f.key]) ? p.specs[f.key] : ['', '']
      subs = [`- ${T.v230}`, `- ${T.v240}`]; values = <><Val v={v[0]} na={T.na} /><Val v={v[1]} na={T.na} /></>
    } else if (f.multi) {
      const rows = warmUpRows(p.specs[f.key])
      subs = rows.some((r) => r.sub) ? rows.map((r) => `- ${r.sub}`) : null
      values = rows.length ? rows.map((r, i) => <Val key={i} v={r.value} na={T.na} />) : <Val v="" na={T.na} />
    } else {
      subs = f.sub ? [T.subs[f.key]] : null; values = <Val v={p.specs[f.key]} na={T.na} />
    }
    return (
      <View key={f.key} style={s.row} wrap={false}>
        <View style={s.lbl}><Text style={s.lblText}>{label}</Text>{subs && subs.map((x, i) => <Text key={i} style={s.sub}>{x}</Text>)}</View>
        <View style={s.val}>{values}</View>
      </View>
    )
  })
}

// Page 2 optionnelle : applications détaillées en cartes (pictogramme, titre, description).
function Page2({ p, brand, T, namePt }) {
  const apps = parseApplications(p.applicationList)
  return (
    <Page size="A4" style={s.page}>
      <Header p={p} brand={brand} T={T} namePt={namePt} />
      <View style={s.p2Body}>
        <Text style={s.sh}>{T.page2.applications}</Text>
        {hasText(p.applications) && <Text style={s.p2Intro}>{p.applications}</Text>}
        {apps.length > 0 && (
          <View style={s.cards}>
            {apps.map((a, i) => (
              <View key={i} style={s.card} wrap={false}>
                <Icon name={a.icon} style={s.cardIco} />
                <View style={s.cardBody}>
                  <Text style={s.cardTitle}>{a.title}</Text>
                  {a.desc ? <Text style={s.cardDesc}>{a.desc}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      <Footer brand={brand} />
    </Page>
  )
}

// nameSize : taille (px aperçu) du nom du produit calculée par productFontSize() dans le navigateur, pour tenir sur une ligne.
export default function TdsPdf({ product: p, brand = DEFAULT_BRAND, lang = 'en', nameSize = 46 }) {
  const lam = isLaminated(p)
  const T = t(lang)
  const namePt = nameSize * 0.75
  const curve = curveContent(p)
  const mech = mechRows(p, T, lam), integ = lines(p.integration), compl = lines(p.compliance)
  return (
    <Document title={`Technical Data Sheet ${p.name}`} author="GRAPHENATON Labs">
      <Page size="A4" style={s.page}>
        <Header p={p} brand={brand} T={T} namePt={namePt} />

        <View style={s.cols}>
          <View style={s.left}>
            {hasText(p.applications) && <Sec title={T.page2.applications}><Text style={s.p}>{p.applications}</Text></Sec>}
            {mech.length > 0 && <Sec title={T.page2.mech}><Dash items={mech.map(mechLine)} /></Sec>}
            {integ.length > 0 && <Sec title={T.page2.integration}><Dash items={integ} /></Sec>}
            {hasText(p.storage) && <Sec title={T.page2.storage}><Text style={s.p}>{p.storage}</Text></Sec>}
            {hasText(p.specs.warranty) && <Sec title={T.warrantyTitle}><Text style={s.p}>{p.specs.warranty}</Text></Sec>}
            {compl.length > 0 && <Sec title={T.page2.compliance}><Dash items={compl} /></Sec>}
            {(curve || hasText(p.testConditions)) && (
              <Sec title={T.curveTitle}>
                {hasText(p.testConditions) && <Text style={s.p}>{T.testIntro} {p.testConditions}</Text>}
                {curve === 'image' && <Image src={p.curveImage} style={s.curveImg} />}
                {curve === 'svg' && <CurvePdf p={p} T={T} />}
              </Sec>
            )}
          </View>
          <View style={s.right}>
            <Text style={s.tblHead}>{T.specsTitle}</Text>
            <View style={s.tbl}><SpecRows p={p} lang={lang} T={T} lam={lam} /></View>
            <View style={s.schema}>
              {p.schemaImage ? <Image src={p.schemaImage} style={s.schemaImg} /> : <View style={[s.ph, { width: '100%' }]} />}
            </View>
            {hasText(p.footnotes) && <Text style={s.fn}>{p.footnotes}</Text>}
          </View>
        </View>

        <Text style={s.legal}>{disclaimerOf(lang, brand)}</Text>
        <Footer brand={brand} />
      </Page>

      {p.page2Enabled && <Page2 p={p} brand={brand} T={T} namePt={namePt} />}
    </Document>
  )
}
