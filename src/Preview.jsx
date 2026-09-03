import React, { useEffect, useReducer } from 'react'
import { SPEC_FIELDS, PAGE2_FIELDS, DEFAULT_BRAND, isLaminated } from './schema'
import { productFontSize } from './header'
import { t, specLabel, disclaimerOf } from './i18n'
import { computeCurve, hasCurveData } from './curve'

// Hauteurs max des images (px écran) : miroir des valeurs en pt de TdsPdf.jsx (× 1,333) pour que l'aperçu
// reflète la mise en page du PDF. Le schéma coté généré (src/drawing.js) n'est plus utilisé par défaut.
const FIG_PX = { both: 253, single: 347 }

function Val({ v, na }) {
  const empty = !v || !String(v).trim()
  return <b className={empty ? 'miss' : ''}>{empty ? na : v}</b>
}

// Image du produit dans son cadre, ou cadre pointillé « à charger » si elle est absente.
function Figure({ src, placeholder, maxH }) {
  if (!src) return <div className="box ph">{placeholder}</div>
  return <div className="box"><img src={src} alt="" style={{ maxHeight: maxH }} /></div>
}

// Courbe générée (src/curve.js) en SVG.
function CurveSvg({ p, T }) {
  const { prims, viewW, viewH } = computeCurve(p.curvePoints, p.curveAxis, { x: T.curveX, y: T.curveY })
  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" xmlns="http://www.w3.org/2000/svg">
      {prims.map((q, i) => {
        if (q.t === 'line') return <line key={i} x1={q.x1} y1={q.y1} x2={q.x2} y2={q.y2} stroke={q.stroke} strokeWidth={q.sw} />
        if (q.t === 'path') return <path key={i} d={q.d} fill="none" stroke={q.stroke} strokeWidth={q.sw} strokeLinejoin="round" strokeLinecap="round" />
        if (q.t === 'circle') return <circle key={i} cx={q.cx} cy={q.cy} r={q.r} fill={q.fill} />
        return <text key={i} transform={`translate(${q.x},${q.y}) rotate(${q.rotate})`} fontSize={q.size} fontWeight={q.weight} fill={q.fill} textAnchor={q.anchor} fontFamily="Inter, Arial, sans-serif">{q.s}</text>
      })}
    </svg>
  )
}

// Contenu de la section courbe selon le mode : 'image' | 'svg' | 'placeholder' (aperçu seulement) | null (section absente).
export const curveContent = (p) =>
  p.curveMode === 'image' ? (p.curveImage ? 'image' : 'placeholder')
  : p.curveMode === 'generated' ? (hasCurveData(p) ? 'svg' : 'placeholder')
  : null

// En-tête commun aux deux pages : titre / société / date à gauche, logo + nom du produit à droite, sous-titre, barre teale.
function SheetHeader({ p, brand, T, nameSize }) {
  return (
    <>
      <div className="sheet-top">
        <div className="hd-left">
          <div className="hd-title">{T.title}</div>
          <div className="hd-line">{brand.headerCompany}</div>
          <div className="hd-line">{p.date || <span className="miss">date</span>}</div>
        </div>
        <div className="hd-right">
          {brand.logo ? <img className="logo-img" src={brand.logo} alt="" style={{ height: brand.logoHeight }} /> : <div className="logo"><div className="g">G</div><div className="brand"><b>{brand.company}</b><span>{brand.companySub}</span></div></div>}
          <div className="hd-product" style={{ fontSize: nameSize }}>ABF<sup>®</sup> {p.productNumber}{p.titleSuffix ? ' ' + p.titleSuffix : ''}</div>
        </div>
      </div>
      <div className="subtitle">{p.subtitle || <span className="miss">Sous-titre à renseigner</span>}</div>
    </>
  )
}

const Footer = ({ brand }) => <div className="sheet-footer"><span>{brand.address}</span><b>{brand.site}</b></div>

// Page 2 optionnelle : sections texte (applications, intégration…) ; les sections vides sont omises.
function Page2({ p, brand, T, nameSize }) {
  const secs = PAGE2_FIELDS.filter((f) => String(p[f.key] || '').trim())
  return (
    <div className="sheet p2">
      <SheetHeader p={p} brand={brand} T={T} nameSize={nameSize} />
      <div className="p2-body">
        {secs.map((f) => <div key={f.key} className="p2-sec"><h2>{T.page2[f.key]}</h2><p>{p[f.key]}</p></div>)}
      </div>
      <Footer brand={brand} />
    </div>
  )
}

export default function Preview({ product: p, brand = DEFAULT_BRAND, lang = 'en' }) {
  const lam = isLaminated(p)
  const T = t(lang)
  const curve = curveContent(p)
  const figH = p.schemaImage && (curve === 'image' || curve === 'svg') ? FIG_PX.both : FIG_PX.single
  // Le nom du produit est mesuré avec Inter : on re-rend une fois les polices chargées.
  const [, fontsReady] = useReducer((x) => x + 1, 0)
  useEffect(() => { document.fonts?.ready.then(fontsReady) }, [])
  const nameSize = productFontSize(p, brand, lang)
  return (
    <>
      <div className="sheet">
        <SheetHeader p={p} brand={brand} T={T} nameSize={nameSize} />
        <div className="cols">
          <div className="left">
            <h2>{T.specsTitle}</h2>
            <table>
              <tbody>
                {SPEC_FIELDS.filter((f) => !f.aluOnly || lam).map((f) => (
                  <tr key={f.key}>
                    <td>
                      {specLabel(lang, f.key)}
                      {f.dual && <span className="sub">{T.v230}<br />{T.v240}</span>}
                      {f.sub && <span className="sub">{T.subs[f.key]}</span>}
                    </td>
                    <td className="v">
                      {f.dual ? <><Val v={p.specs[f.key]?.[0]} na={T.na} /><br /><Val v={p.specs[f.key]?.[1]} na={T.na} /></> : <Val v={p.specs[f.key]} na={T.na} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="right">
            <h2>{T.dimensionsTitle}</h2>
            <Figure src={p.schemaImage} placeholder="Schéma du film à charger" maxH={figH} />
            <div className="disc">{disclaimerOf(lang, brand)}</div>
            {curve && <h2 className="mt">{T.curveTitle}</h2>}
            {curve === 'image' && <Figure src={p.curveImage} maxH={figH} />}
            {curve === 'svg' && <div className="box"><CurveSvg p={p} T={T} /></div>}
            {curve === 'placeholder' && <div className="box ph">Courbe de température à charger</div>}
          </div>
        </div>
        <Footer brand={brand} />
      </div>
      {p.page2Enabled && <Page2 p={p} brand={brand} T={T} nameSize={nameSize} />}
    </>
  )
}
