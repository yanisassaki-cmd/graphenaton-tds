import React, { useEffect, useReducer } from 'react'
import { SPEC_FIELDS, DEFAULT_BRAND, isLaminated } from './schema'
import { productFontSize } from './header'
import { t, specLabel, disclaimerOf } from './i18n'
import { computeCurve, hasCurveData } from './curve'
import { ICONS, ICON_VIEW } from './icons'
import { parseApplications, lines, mechRows, mechLine, warmUpRows, hasText } from './page2'

// Mise en page de la fiche (aperçu HTML), miroir de TdsPdf.jsx : px = pt × 1,333.
// Colonne gauche : textes (applications, mécanique, intégration, stockage, garantie, conformité, courbe).
// Colonne droite : tableau électrique / thermique à bandeau bleu marine, schéma du film, notes.

const SCHEMA_MAX_PX = 113 // 85 pt

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

const Sec = ({ title, children }) => <div className="sec"><div className="sh">{title}</div>{children}</div>
const Dash = ({ items }) => <ul className="dash">{items.map((l, i) => <li key={i}><span>–</span><div>{l}</div></li>)}</ul>
const Val = ({ v, na }) => { const empty = !v || !String(v).trim(); return <span className={empty ? 'miss' : ''}>{empty ? na : v}</span> }

// Lignes du tableau électrique / thermique : simple, double (230 / 240 V), paliers (warm-up), sous-libellé (IEC).
function SpecRows({ p, lang, T, lam }) {
  return SPEC_FIELDS.filter((f) => !f.noTable && (!f.aluOnly || lam)).map((f) => {
    const label = specLabel(lang, f.key)
    if (f.dual) {
      const v = Array.isArray(p.specs[f.key]) ? p.specs[f.key] : ['', '']
      return <tr key={f.key}><td>{label}<span className="sub">- {T.v230}<br />- {T.v240}</span></td><td className="v"><Val v={v[0]} na={T.na} /><br /><Val v={v[1]} na={T.na} /></td></tr>
    }
    if (f.multi) {
      const rows = warmUpRows(p.specs[f.key])
      return (
        <tr key={f.key}>
          <td>{label}{rows.some((r) => r.sub) && <span className="sub">{rows.map((r, i) => <React.Fragment key={i}>- {r.sub}<br /></React.Fragment>)}</span>}</td>
          <td className="v">{rows.length ? rows.map((r, i) => <React.Fragment key={i}>{r.value || T.na}<br /></React.Fragment>) : <Val v="" na={T.na} />}</td>
        </tr>
      )
    }
    return <tr key={f.key}><td>{label}{f.sub && <span className="sub">{T.subs[f.key]}</span>}</td><td className="v"><Val v={p.specs[f.key]} na={T.na} /></td></tr>
  })
}

// Page 2 optionnelle : applications détaillées en cartes (pictogramme, titre, description).
function Page2({ p, brand, T, nameSize }) {
  const apps = parseApplications(p.applicationList)
  return (
    <div className="sheet p2">
      <SheetHeader p={p} brand={brand} T={T} nameSize={nameSize} />
      <div className="p2-body">
        <div className="sh">{T.page2.applications}</div>
        {hasText(p.applications) && <p className="p2-intro">{p.applications}</p>}
        {apps.length > 0 && (
          <div className="cards">
            {apps.map((a, i) => (
              <div key={i} className="card"><Icon name={a.icon} className="ico" /><div><b>{a.title}</b>{a.desc && <span>{a.desc}</span>}</div></div>
            ))}
          </div>
        )}
      </div>
      <Footer brand={brand} />
    </div>
  )
}

export default function Preview({ product: p, brand = DEFAULT_BRAND, lang = 'en' }) {
  const lam = isLaminated(p)
  const T = t(lang)
  const curve = curveContent(p)
  const mech = mechRows(p, T, lam), integ = lines(p.integration), compl = lines(p.compliance)
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
            {hasText(p.applications) && <Sec title={T.page2.applications}><p>{p.applications}</p></Sec>}
            {mech.length > 0 && <Sec title={T.page2.mech}><Dash items={mech.map(mechLine)} /></Sec>}
            {integ.length > 0 && <Sec title={T.page2.integration}><Dash items={integ} /></Sec>}
            {hasText(p.storage) && <Sec title={T.page2.storage}><p>{p.storage}</p></Sec>}
            {hasText(p.specs.warranty) && <Sec title={T.warrantyTitle}><p>{p.specs.warranty}</p></Sec>}
            {compl.length > 0 && <Sec title={T.page2.compliance}><Dash items={compl} /></Sec>}
            {(curve || hasText(p.testConditions)) && (
              <Sec title={T.curveTitle}>
                {hasText(p.testConditions) && <p>{T.testIntro} {p.testConditions}</p>}
                {curve === 'image' && <img className="curve-img" src={p.curveImage} alt="" />}
                {curve === 'svg' && <CurveSvg p={p} T={T} />}
                {curve === 'placeholder' && <div className="ph">Courbe de température à charger</div>}
              </Sec>
            )}
          </div>
          <div className="right">
            <div className="tbl-head">{T.specsTitle}</div>
            <table className="spec"><tbody><SpecRows p={p} lang={lang} T={T} lam={lam} /></tbody></table>
            <div className="schema">
              {p.schemaImage ? <img src={p.schemaImage} alt="" style={{ maxHeight: SCHEMA_MAX_PX }} /> : <div className="ph">Schéma du film à charger</div>}
            </div>
            {hasText(p.footnotes) && <p className="fn">{p.footnotes}</p>}
          </div>
        </div>
        <div className="legal">{disclaimerOf(lang, brand)}</div>
        <Footer brand={brand} />
      </div>
      {p.page2Enabled && <Page2 p={p} brand={brand} T={T} nameSize={nameSize} />}
    </>
  )
}
