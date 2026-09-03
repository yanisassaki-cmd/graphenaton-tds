import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { SPEC_FIELDS, DEFAULT_BRAND, isLaminated } from './schema'
import { NAVY, TEAL } from './drawing'

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
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  g: { width: 34, height: 34, borderWidth: 2.5, borderColor: NAVY, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  gText: { fontSize: 18, fontWeight: 800 },
  brand: { fontSize: 13, fontWeight: 700, letterSpacing: 1.5 },
  brandSub: { fontSize: 6, letterSpacing: 2.5, color: GREY, marginTop: 1 },
  tr: { alignItems: 'flex-end' },
  trB: { fontSize: 7.5, fontWeight: 700 },
  trS: { fontSize: 7, color: GREY, marginTop: 2 },
  kicker: { marginTop: 30, color: TEAL, fontSize: 7.5, fontWeight: 700, letterSpacing: 3 },
  h1: { fontSize: 32, fontWeight: 800, marginTop: 4, letterSpacing: -0.8 },
  sup: { fontSize: 10, fontWeight: 800 },
  subtitle: { fontSize: 10.5, color: GREY, marginTop: 2, paddingBottom: 12, borderBottomWidth: 2.5, borderBottomColor: TEAL },
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
})

const V = ({ v }) => {
  const empty = !v || !String(v).trim()
  return <Text style={[s.val, empty && s.miss]}>{empty ? 'N/A' : v}</Text>
}

// Image du produit dans son cadre, ou cadre pointillé vide si elle est absente.
// Le schéma coté généré (src/drawing.js) n'est plus utilisé par défaut : chaque produit porte sa propre image.
function Figure({ src, maxH }) {
  if (!src) return <View style={s.ph} />
  return <View style={s.box}><Image src={src} style={[s.fig, { maxHeight: maxH }]} /></View>
}

export default function TdsPdf({ product: p, brand = DEFAULT_BRAND }) {
  const lam = isLaminated(p)
  const figH = p.schemaImage && p.curveImage ? FIG_PT.both : FIG_PT.single
  return (
    <Document title={`Technical Data Sheet ${p.name}`} author="GRAPHENATON Labs">
      <Page size="A4" style={s.page}>
        <View style={s.top}>
          {brand.logo ? (
            <Image src={brand.logo} style={{ height: brand.logoHeight * 0.75, objectFit: 'contain', objectPosition: 'left' }} />
          ) : (
            <View style={s.logo}>
              <View style={s.g}><Text style={s.gText}>G</Text></View>
              <View><Text style={s.brand}>{brand.company}</Text><Text style={s.brandSub}>{brand.companySub}</Text></View>
            </View>
          )}
          <View style={s.tr}><Text style={s.trB}>TECHNICAL DATA SHEET</Text><Text style={s.trS}>GRAPHENATON Labs – {p.date}</Text></View>
        </View>

        <Text style={s.kicker}>TECHNICAL DATA SHEET</Text>
        <Text style={s.h1}>ABF<Text style={s.sup}>®</Text> {p.productNumber}{p.titleSuffix ? ' ' + p.titleSuffix : ''}</Text>
        <Text style={s.subtitle}>{p.subtitle}</Text>

        <View style={s.cols}>
          <View style={s.left}>
            <Text style={s.h2}>ELECTRIC AND THERMAL SPECIFICATIONS</Text>
            <View style={s.table}>
              {SPEC_FIELDS.filter((f) => !f.aluOnly || lam).map((f) => (
                <View key={f.key} style={s.row} wrap={false}>
                  <View style={s.lbl}>
                    <Text>{f.label}</Text>
                    {f.dual && <Text style={s.sub}>230 V{'\n'}240 V</Text>}
                    {f.sub && <Text style={s.sub}>{f.sub}</Text>}
                  </View>
                  {f.dual ? (
                    <View><V v={p.specs[f.key]?.[0]} /><V v={p.specs[f.key]?.[1]} /></View>
                  ) : (
                    <V v={p.specs[f.key]} />
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={s.right}>
            <Text style={s.h2}>DIMENSIONS</Text>
            <Figure src={p.schemaImage} maxH={figH} />
            <Text style={s.disc}>{brand.disclaimer}</Text>
            <Text style={[s.h2, s.h2b]}>TEMPERATURE RISE CURVE</Text>
            <Figure src={p.curveImage} maxH={figH} />
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.fa}>{brand.address}</Text>
          <Text style={s.fs}>{brand.site}</Text>
        </View>
      </Page>
    </Document>
  )
}
