import React from 'react'
import { SPEC_FIELDS, DEFAULT_BRAND, isLaminated } from './schema'

// Hauteurs max des images (px écran) : miroir des valeurs en pt de TdsPdf.jsx (× 1,333) pour que l'aperçu
// reflète la mise en page du PDF. Le schéma coté généré (src/drawing.js) n'est plus utilisé par défaut.
const FIG_PX = { both: 253, single: 347 }

function Val({ v }) {
  const empty = !v || !String(v).trim()
  return <b className={empty ? 'miss' : ''}>{empty ? 'N/A' : v}</b>
}

// Image du produit dans son cadre, ou cadre pointillé « à charger » si elle est absente.
function Figure({ src, placeholder, maxH }) {
  if (!src) return <div className="box ph">{placeholder}</div>
  return <div className="box"><img src={src} alt="" style={{ maxHeight: maxH }} /></div>
}

export default function Preview({ product: p, brand = DEFAULT_BRAND }) {
  const lam = isLaminated(p)
  const figH = p.schemaImage && p.curveImage ? FIG_PX.both : FIG_PX.single
  return (
    <div className="sheet">
      <div className="sheet-top">
        {brand.logo ? <img className="logo-img" src={brand.logo} alt="" style={{ height: brand.logoHeight }} /> : <div className="logo"><div className="g">G</div><div className="brand"><b>{brand.company}</b><span>{brand.companySub}</span></div></div>}
        <div className="tr"><b>TECHNICAL DATA SHEET</b>GRAPHENATON Labs – {p.date || <span className="miss">date</span>}</div>
      </div>
      <div className="kicker">TECHNICAL DATA SHEET</div>
      <h1>ABF<sup>®</sup> {p.productNumber}{p.titleSuffix ? ' ' + p.titleSuffix : ''}</h1>
      <div className="subtitle">{p.subtitle || <span className="miss">Sous-titre à renseigner</span>}</div>
      <div className="cols">
        <div className="left">
          <h2>ELECTRIC AND THERMAL SPECIFICATIONS</h2>
          <table>
            <tbody>
              {SPEC_FIELDS.filter((f) => !f.aluOnly || lam).map((f) => (
                <tr key={f.key}>
                  <td>
                    {f.label}
                    {f.dual && <span className="sub">230 V<br />240 V</span>}
                    {f.sub && <span className="sub">{f.sub}</span>}
                  </td>
                  <td className="v">
                    {f.dual ? <><Val v={p.specs[f.key]?.[0]} /><br /><Val v={p.specs[f.key]?.[1]} /></> : <Val v={p.specs[f.key]} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="right">
          <h2>DIMENSIONS</h2>
          <Figure src={p.schemaImage} placeholder="Schéma du film à charger" maxH={figH} />
          <div className="disc">{brand.disclaimer}</div>
          <h2 className="mt">TEMPERATURE RISE CURVE</h2>
          <Figure src={p.curveImage} placeholder="Courbe de température à charger" maxH={figH} />
        </div>
      </div>
      <div className="sheet-footer"><span>{brand.address}</span><b>{brand.site}</b></div>
    </div>
  )
}
