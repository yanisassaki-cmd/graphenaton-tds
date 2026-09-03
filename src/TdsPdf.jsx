import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Path, Line, Circle, G, Text as SvgText } from '@react-pdf/renderer'
import { SPEC_FIELDS, PAGE2_FIELDS, DEFAULT_BRAND, isLaminated } from './schema'
import { NAVY, TEAL } from './drawing'
import { t, specLabel, disclaimerOf } from './i18n'
import { computeCurve, hasCurveData } from './curve'

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
  // page 2
  p2Body: { marginTop: 16 },
  p2Sec: { marginBottom: 14 },
  p2Text: { fontSize: 8.6, lineHeight: 1.5, marginTop: 2 },
})

const V = ({ v, na }) => {
  const empty = !v || !String(v).trim()
  return <Text style={[s.val, empty && s.miss]}>{empty ? na : v}</Text>
}

// Image du produit dans son cadre, ou cadre pointillé vide si elle est absente.
// Le schéma coté généré (src/drawing.js) n'est plus utilisé par défaut : chaque produit porte sa propre image.
function Figure({ src, maxH }) {
  if (!src) return <View style={s.ph} />
  return <View style={s.box}><Image src={src} style={[s.fig, { maxHeight: maxH }]} /></View>
}

// Courbe générée (src/curve.js) avec les composants SVG de react-pdf.
function CurvePdf({ p, T }) {
  const { prims, viewW, viewH } = computeCurve(p.curvePoints, p.curveAxis, { x: T.curveX, y: T.curveY })
  return (
    <Svg viewBox={`0 0 ${viewW} ${viewH}`} style={{ width: '100%' }}>
      {prims.map((q, i) => {
        if (q.t === 'line') return <Line key={i} x1={q.x1} y1={q.y1} x2={q.x2} y2={q.y2} stroke={q.stroke} strokeWidth={q.sw} />
        if (q.t === 'path') return <Path key={i} d={q.d} fill="none" stroke={q.stroke} strokeWidth={q.sw} strokeLinejoin="round" strokeLinecap="round" />
        if (q.t === 'circle') return <Circle key={i} cx={q.cx} cy={q.cy} r={q.r} fill={q.fill} />
        const txt = <SvgText key={i} x={q.rotate ? 0 : q.x} y={q.rotate ? 0 : q.y} fill={q.fill} textAnchor={q.anchor} style={{ fontSize: q.size, fontWeight: q.weight, fontFamily: 'Inter' }}>{q.s}</SvgText>
        return q.rotate ? <G key={i} transform={`translate(${q.x},${q.y}) rotate(${q.rotate})`}>{txt}</G> : txt
      })}
    </Svg>
  )
}

// Section courbe du PDF : image ou SVG ; rien du tout (ni titre ni cadre) en mode « Aucune » ou sans données.
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

// nameSize : taille (px aperçu) du nom du produit calculée par productFontSize() dans le navigateur, pour tenir sur une ligne.
export default function TdsPdf({ product: p, brand = DEFAULT_BRAND, lang = 'en', nameSize = 46 }) {
  const lam = isLaminated(p)
  const T = t(lang)
  const namePt = nameSize * 0.75
  const curve = curveContent(p)
  const figH = p.schemaImage && curve ? FIG_PT.both : FIG_PT.single
  const page2 = p.page2Enabled ? PAGE2_FIELDS.filter((f) => String(p[f.key] || '').trim()) : []
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

      {p.page2Enabled && (
        <Page size="A4" style={s.page}>
          <Header p={p} brand={brand} T={T} namePt={namePt} />
          <View style={s.p2Body}>
            {page2.map((f) => (
              <View key={f.key} style={s.p2Sec}>
                <Text style={s.h2}>{T.page2[f.key]}</Text>
                <Text style={s.p2Text}>{p[f.key]}</Text>
              </View>
            ))}
          </View>
          <Footer brand={brand} />
        </Page>
      )}
    </Document>
  )
}
