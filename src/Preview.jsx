import React, { useEffect, useReducer } from 'react'
import { SPEC_FIELDS, DEFAULT_BRAND, isLaminated } from './schema'
import { productFontSize } from './header'
import { t, specLabel, disclaimerOf } from './i18n'
import { computeCurve, hasCurveData } from './curve'
import { ICONS, ICON_VIEW } from './icons'
import { parseApplications, lines, complianceBadges, mechRows, hasText } from './page2'

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

// Rendu SVG des primitives partagées (curve.js, icons.js) : line / path / circle / rect / text.
function PrimsSvg({ prims, viewW, viewH, className }) {
  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} className={className} xmlns="http://www.w3.org/2000/svg">
      {prims.map((q, i) => {
        if (q.t === 'line') return <line key={i} x1={q.x1} y1={q.y1} x2={q.x2} y2={q.y2} stroke={q.stroke} strokeWidth={q.sw} strokeLinecap="round" />
        if (q.t === 'path') return <path key={i} d={q.d} fill={q.fill || 'none'} stroke={q.stroke} strokeWidth={q.sw} strokeLinejoin="round" strokeLinecap="round" />
        if (q.t === 'circle') return <circle key={i} cx={q.cx} cy={q.cy} r={q.r} fill={q.fill || 'none'} stroke={q.stroke} strokeWidth={q.sw} />
        if (q.t === 'rect') return <rect key={i} x={q.x} y={q.y} width={q.width} height={q.height} rx={q.rx} fill={q.fill || 'none'} stroke={q.stroke} strokeWidth={q.sw} />
        return <text key={i} transform={`translate(${q.x},${q.y}) rotate(${q.rotate})`} fontSize={q.size} fontWeight={q.weight} fill={q.fill} textAnchor={q.anchor} fontFamily="Inter, Arial, sans-serif">{q.s}</text>
      })}
    </svg>
  )
}

const Icon = ({ name, className }) => <PrimsSvg prims={ICONS[name] || ICONS.dot} viewW={ICON_VIEW} viewH={ICON_VIEW} className={className} />

// Courbe générée (src/curve.js) en SVG.
function CurveSvg({ p, T }) {
  const { prims, viewW, viewH } = computeCurve(p.curvePoints, p.curveAxis, { x: T.curveX, y: T.curveY })
  return <PrimsSvg prims={prims} viewW={viewW} viewH={viewH} className="curve" />
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

const CheckList = ({ items }) => <ul className="chk">{items.map((l, i) => <li key={i}><Icon name="check" className="tick" />{l}</li>)}</ul>

// Page 2 optionnelle : applications en cartes, intégration / stockage / conditions d'essai, tableau mécanique,
// conformité avec badges, notes. Les sections vides sont omises.
function Page2({ p, brand, T, nameSize, lam }) {
  const apps = parseApplications(p.applicationList)
  const integ = lines(p.integration), compl = lines(p.compliance), badges = complianceBadges(p.compliance), mech = mechRows(p, T, lam)
  const left = integ.length > 0 || hasText(p.storage) || hasText(p.testConditions)
  const right = mech.length > 0 || compl.length > 0
  return (
    <div className="sheet p2">
      <SheetHeader p={p} brand={brand} T={T} nameSize={nameSize} />
      <div className="p2-body">
        {(hasText(p.applications) || apps.length > 0) && (
          <div className="p2-sec">
            <h2>{T.page2.applications}</h2>
            {hasText(p.applications) && <p className="p2-intro">{p.applications}</p>}
            {apps.length > 0 && (
              <div className="cards">
                {apps.map((a, i) => (
                  <div key={i} className="card"><Icon name={a.icon} className="ico" /><div><b>{a.title}</b>{a.desc && <span>{a.desc}</span>}</div></div>
                ))}
              </div>
            )}
          </div>
        )}
        {(left || right) && (
          <div className="p2-cols">
            <div className="p2-left">
              {integ.length > 0 && <div className="p2-sec"><h2>{T.page2.integration}</h2><CheckList items={integ} /></div>}
              {hasText(p.storage) && <div className="p2-sec"><h2>{T.page2.storage}</h2><p>{p.storage}</p></div>}
              {hasText(p.testConditions) && <div className="p2-sec"><h2>{T.page2.testConditions}</h2><p>{p.testConditions}</p></div>}
            </div>
            <div className="p2-right">
              {mech.length > 0 && (
                <div className="p2-sec"><h2>{T.page2.mech}</h2>
                  <table className="mech"><tbody>{mech.map((r) => <tr key={r.key}><td>{r.label}</td><td className="v">{r.value}</td></tr>)}</tbody></table>
                </div>
              )}
              {compl.length > 0 && (
                <div className="p2-sec"><h2>{T.page2.compliance}</h2><CheckList items={compl} />
                  {badges.length > 0 && <div className="pills">{badges.map((b) => <span key={b}>{b}</span>)}</div>}
                </div>
              )}
            </div>
          </div>
        )}
        {hasText(p.footnotes) && <div className="p2-notes"><h2>{T.page2.footnotes}</h2><p>{p.footnotes}</p></div>}
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
      {p.page2Enabled && <Page2 p={p} brand={brand} T={T} nameSize={nameSize} lam={lam} />}
    </>
  )
}
