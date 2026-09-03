import React from 'react'
import { SPEC_FIELDS, DEFAULT_BRAND, isLaminated } from './schema'
import { computeDrawing } from './drawing'

function Val({ v }) {
  const empty = !v || !String(v).trim()
  return <b className={empty ? 'miss' : ''}>{empty ? 'N/A' : v}</b>
}

function Drawing({ dims, laminated }) {
  const { prims, viewW, viewH } = computeDrawing(dims, laminated)
  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" xmlns="http://www.w3.org/2000/svg">
      {prims.map((p, i) => {
        if (p.t === 'rect') return <rect key={i} x={p.x} y={p.y} width={p.width} height={p.height} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        if (p.t === 'line') return <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={p.stroke} strokeWidth={1} />
        return (
          <text key={i} transform={`translate(${p.x},${p.y}) rotate(${p.rotate})`} fontSize={p.size} fontWeight={p.weight} fill={p.fill} textAnchor={p.anchor} fontFamily="Inter, Arial, sans-serif">{p.s}</text>
        )
      })}
    </svg>
  )
}

export default function Preview({ product: p, brand = DEFAULT_BRAND }) {
  const lam = isLaminated(p)
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
          <div className="box"><Drawing dims={p.dims} laminated={lam} /></div>
          <div className="disc">{brand.disclaimer}</div>
        </div>
      </div>
      <div className="sheet-footer"><span>{brand.address}</span><b>{brand.site}</b></div>
    </div>
  )
}
