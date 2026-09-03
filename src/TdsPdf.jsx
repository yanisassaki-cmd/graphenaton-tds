import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Path, Line, Circle, Rect, G, Text as SvgText } from '@react-pdf/renderer'
import { SPEC_FIELDS, DEFAULT_BRAND, isLaminated } from './schema'
import { NAVY, TEAL } from './drawing'
import { t, specLabel, disclaimerOf } from './i18n'
import { computeCurve, hasCurveData } from './curve'
import { ICONS, ICON_VIEW } from './icons'
import { parseApplications, lines, complianceBadges, mechRows, hasText } from './page2'

Font.register({
  family: 'Inter',
  fonts: [400, 500, 600, 700, 800].map((w) => ({ src: `/fonts/inter-${w}.ttf`, fontWeight: w })),
})
Font.registerHyphenationCallback((w) => [w])

// Hauteurs max (pt) des images du schéma et de la courbe pour rester sur une seule page A4 :
// 190 pt chacune si les deux sont présentes, 260 pt pour une image seule ; cadre vide de 120 pt.
const FIG_PT = { both: 190, single: 260, placeholder: 120 }

const GREY = '#5B6270', LINE = '#D9DDE3', MUTED = '#8A8F99'
const s = StyleSheet.create({
  page: { fontFamily: 'Inter', color: NAVY, paddingTop: 40, paddingHorizontal: 40, paddingBottom: 40, fontSize: 8.5 },
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
  subtitle: { fontSize: 10.5, color: GREY, marginTop: 10, paddingBottom: 12, borderBottomWidth: 2.5, borderBottomColor: TEAL },
  cols: { flexDirection: 'row', gap: 20, marginTop: 16 },
  left: { width: '56%' },
  right: { flex: 1 },
  h2: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, paddingLeft: 9, borderLeftWidth: 4, borderLeftColor: TEAL, marginBottom: 5, lineHeight: 1.25 },
  h2b: { marginTop: 10 },
  table: { borderTopWidth: 1.5, borderTopColor: NAVY },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.75, borderBottomColor: LINE, paddingVertical: 5.5, paddingHorizontal: 3 },
  lbl: { fontSize: 8.6, lineHeight: 1.35, flex: 1, paddingRight: 8 },
  sub: { fontSize: 8.2, color: GREY, lineHeight: 1.35 },
  val: { fontSize: 8.6, fontWeight: 700, textAlign: 'right', lineHeight: 1.35 },
  miss: { color: '#C00000' },
  box: { borderWidth: 0.75, borderColor: '#E1E4E9', borderRadius: 5, padding: 10, backgroundColor: '#FAFBFC', marginTop: 4 },
  fig: { width: '100%', objectFit: 'contain' },
  ph: { borderWidth: 1, borderColor: '#B8BEC8', borderStyle: 'dashed', borderRadius: 5, height: FIG_PT.placeholder, marginTop: 4 },
  disc: { fontSize: 6.5, color: MUTED, lineHeight: 1.45, textAlign: 'justify', marginTop: 10 },
  footer: { position: 'absolute', left: 40, right: 40, bottom: 30, borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: 7, flexDirection: 'row', justifyContent: 'space-between' },
  fa: { fontSize: 6.5, color: GREY },
  fs: { fontSize: 7, fontWeight: 700, letterSpacing: 1.5 },
  // Page 2 (pt = px aperçu × 0,75)
  p2Body: { marginTop: 10 },
  p2Sec: { marginBottom: 9 },
  p2Text: { fontSize: 8.6, lineHeight: 1.5, marginTop: 2 },
  p2Intro: { fontSize: 8.6, lineHeight: 1.5, marginBottom: 7 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  card: { width: '48.8%', flexDirection: 'row', gap: 7, alignItems: 'flex-start', backgroundColor: '#F6F8FA', borderWidth: 0.75, borderColor: '#E6E9EE', borderRadius: 4.5, paddingVertical: 5.5, paddingHorizontal: 7.5 },
  cardIco: { width: 19.5, height: 19.5 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 8.6, fontWeight: 700, lineHeight: 1.3 },
  cardDesc: { fontSize: 7.9, color: GREY, lineHeight: 1.4, marginTop: 1.5 },
  p2Cols: { flexDirection: 'row', gap: 20, marginTop: 2 },
  p2Left: { flex: 1.25 },
  p2Right: { flex: 1 },
  chkRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-start', marginBottom: 2.2 },
  tick: { width: 9.75, height: 9.75, marginTop: 1.5 },
  chkText: { flex: 1, fontSize: 8.2, lineHeight: 1.45 },
  mechTable: { borderTopWidth: 1.5, borderTopColor: NAVY },
  mechRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.75, borderBottomColor: LINE, paddingVertical: 3.2, paddingHorizontal: 2 },
  mechLbl: { fontSize: 7.9, lineHeight: 1.35, flex: 1, paddingRight: 6 },
  mechVal: { fontSize: 7.9, fontWeight: 700, textAlign: 'right', lineHeight: 1.35, width: '42%' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4.5, marginTop: 6 },
  pill: { borderWidth: 1.1, borderColor: TEAL, borderRadius: 6, paddingVertical: 1.5, paddingHorizontal: 7 },
  pillText: { fontSize: 7.1, fontWeight: 700, letterSpacing: 0.4 },
  notes: { marginTop: 2, paddingTop: 8, borderTopWidth: 0.75, borderTopColor: LINE },
  notesH: { fontSize: 7.9, lineHeight: 1.3, borderLeftWidth: 3, marginBottom: 4 },
  notesText: { fontSize: 7.1, color: GREY, lineHeight: 1.45 },
})

const V = ({ v, na }) => {
  const empty = !v || !String(v).trim()
  return <Text style={[s.val, empty && s.miss]}>{empty ? na : v}</Text>
}

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
  return <PrimsPdf prims={prims} viewW={viewW} viewH={viewH} style={{ width: '100%' }} />
}

// Section courbe du PDF : image ou SVG ; rien du tout (ni titre ni cadre) en mode « Aucune » ou sans données.
const curveContent = (p) =>
  p.curveMode === 'image' && p.curveImage ? 'image'
  : p.curveMode === 'generated' && hasCurveData(p) ? 'svg'
  : null

// Image du produit dans son cadre, ou cadre pointillé vide si elle est absente.
// Le schéma coté généré (src/drawing.js) n'est plus utilisé par défaut : chaque produit porte sa propre image.
function Figure({ src, maxH }) {
  if (!src) return <View style={s.ph} />
  return <View style={s.box}><Image src={src} style={[s.fig, { maxHeight: maxH }]} /></View>
}

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

const CheckList = ({ items }) => items.map((l, i) => (
  <View key={i} style={s.chkRow}><Icon name="check" style={s.tick} /><Text style={s.chkText}>{l}</Text></View>
))

// Page 2 optionnelle : applications en cartes, intégration / stockage / conditions d'essai, tableau mécanique,
// conformité avec badges, notes. Les sections vides sont omises.
function Page2({ p, brand, T, namePt, lam }) {
  const apps = parseApplications(p.applicationList)
  const integ = lines(p.integration), compl = lines(p.compliance), badges = complianceBadges(p.compliance), mech = mechRows(p, T, lam)
  const left = integ.length > 0 || hasText(p.storage) || hasText(p.testConditions)
  const right = mech.length > 0 || compl.length > 0
  return (
    <Page size="A4" style={s.page}>
      <Header p={p} brand={brand} T={T} namePt={namePt} />
      <View style={s.p2Body}>
        {(hasText(p.applications) || apps.length > 0) && (
          <View style={s.p2Sec}>
            <Text style={s.h2}>{T.page2.applications}</Text>
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
        )}
        {(left || right) && (
          <View style={s.p2Cols}>
            <View style={s.p2Left}>
              {integ.length > 0 && <View style={s.p2Sec}><Text style={s.h2}>{T.page2.integration}</Text><CheckList items={integ} /></View>}
              {hasText(p.storage) && <View style={s.p2Sec}><Text style={s.h2}>{T.page2.storage}</Text><Text style={s.p2Text}>{p.storage}</Text></View>}
              {hasText(p.testConditions) && <View style={s.p2Sec}><Text style={s.h2}>{T.page2.testConditions}</Text><Text style={s.p2Text}>{p.testConditions}</Text></View>}
            </View>
            <View style={s.p2Right}>
              {mech.length > 0 && (
                <View style={s.p2Sec}>
                  <Text style={s.h2}>{T.page2.mech}</Text>
                  <View style={s.mechTable}>
                    {mech.map((r) => <View key={r.key} style={s.mechRow}><Text style={s.mechLbl}>{r.label}</Text><Text style={s.mechVal}>{r.value}</Text></View>)}
                  </View>
                </View>
              )}
              {compl.length > 0 && (
                <View style={s.p2Sec}>
                  <Text style={s.h2}>{T.page2.compliance}</Text>
                  <CheckList items={compl} />
                  {badges.length > 0 && <View style={s.pills}>{badges.map((b) => <View key={b} style={s.pill}><Text style={s.pillText}>{b}</Text></View>)}</View>}
                </View>
              )}
            </View>
          </View>
        )}
        {hasText(p.footnotes) && <View style={s.notes}><Text style={[s.h2, s.notesH]}>{T.page2.footnotes}</Text><Text style={s.notesText}>{p.footnotes}</Text></View>}
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
  const figH = p.schemaImage && curve ? FIG_PT.both : FIG_PT.single
  return (
    <Document title={`Technical Data Sheet ${p.name}`} author="GRAPHENATON Labs">
      <Page size="A4" style={s.page}>
        <Header p={p} brand={brand} T={T} namePt={namePt} />

        <View style={s.cols}>
          <View style={s.left}>
            <Text style={s.h2}>{T.specsTitle}</Text>
            <View style={s.table}>
              {SPEC_FIELDS.filter((f) => !f.aluOnly || lam).map((f) => (
                <View key={f.key} style={s.row} wrap={false}>
                  <View style={s.lbl}>
                    <Text>{specLabel(lang, f.key)}</Text>
                    {f.dual && <Text style={s.sub}>{T.v230}{'\n'}{T.v240}</Text>}
                    {f.sub && <Text style={s.sub}>{T.subs[f.key]}</Text>}
                  </View>
                  {f.dual ? (
                    <View><V v={p.specs[f.key]?.[0]} na={T.na} /><V v={p.specs[f.key]?.[1]} na={T.na} /></View>
                  ) : (
                    <V v={p.specs[f.key]} na={T.na} />
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={s.right}>
            <Text style={s.h2}>{T.dimensionsTitle}</Text>
            <Figure src={p.schemaImage} maxH={figH} />
            <Text style={s.disc}>{disclaimerOf(lang, brand)}</Text>
            {curve && <Text style={[s.h2, s.h2b]}>{T.curveTitle}</Text>}
            {curve === 'image' && <Figure src={p.curveImage} maxH={figH} />}
            {curve === 'svg' && <View style={s.box}><CurvePdf p={p} T={T} /></View>}
          </View>
        </View>

        <Footer brand={brand} />
      </Page>

      {p.page2Enabled && <Page2 p={p} brand={brand} T={T} namePt={namePt} lam={lam} />}
    </Document>
  )
}
