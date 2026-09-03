import React, { useEffect, useMemo, useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { PRESETS, SPEC_FIELDS, DIM_FIELDS, DEFAULT_BRAND, blankProduct, isLaminated, slug } from './schema'
import Preview from './Preview'
import TdsPdf from './TdsPdf'

const STORAGE_KEY = 'graphenaton-tds-v1'
const BRAND_KEY = 'graphenaton-tds-brand-v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr }
  } catch {}
  return PRESETS
}

function loadBrand() {
  try { const raw = localStorage.getItem(BRAND_KEY); if (raw) return { ...DEFAULT_BRAND, ...JSON.parse(raw) } } catch {}
  return DEFAULT_BRAND
}

const clone = (o) => JSON.parse(JSON.stringify(o))

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export default function App() {
  const [products, setProducts] = useState(load)
  const [sel, setSel] = useState(0)
  const [brand, setBrand] = useState(loadBrand)
  const [tab, setTab] = useState('product')
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')
  const fileRef = useRef()

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)) }, [products])
  useEffect(() => { try { localStorage.setItem(BRAND_KEY, JSON.stringify(brand)) } catch { setToast('Logo trop lourd pour être mémorisé (max ~2 Mo)') } }, [brand])
  const setB = (k, v) => setBrand((b) => ({ ...b, [k]: v }))
  const onLogo = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    if (!/image\/(png|jpeg)/.test(f.type)) { setToast('Logo : PNG ou JPG uniquement (le SVG n\'est pas supporté dans le PDF)'); return }
    const r = new FileReader(); r.onload = () => setB('logo', r.result); r.readAsDataURL(f); e.target.value = ''
  }
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t) }, [toast])

  const p = products[Math.min(sel, products.length - 1)]
  const lam = isLaminated(p)

  const update = (fn) => setProducts((arr) => arr.map((x, i) => (i === sel ? fn(clone(x)) : x)))
  const setMeta = (k, v) => update((x) => { x[k] = v; return x })
  const setSpec = (k, v, idx) => update((x) => { if (idx == null) x.specs[k] = v; else { const a = Array.isArray(x.specs[k]) ? x.specs[k] : ['', '']; a[idx] = v; x.specs[k] = a } return x })
  const setDim = (k, v) => update((x) => { x.dims[k] = v; return x })

  const addProduct = () => { setProducts((a) => [...a, blankProduct()]); setSel(products.length) }
  const duplicate = () => { const c = clone(p); c.id = 'copy-' + Date.now(); c.name = p.name + ' (copie)'; setProducts((a) => [...a, c]); setSel(products.length); setToast('Produit dupliqué') }
  const remove = () => { if (!confirm(`Supprimer « ${p.name} » ?`)) return; setProducts((a) => a.filter((_, i) => i !== sel)); setSel(0); setToast('Produit supprimé') }
  const resetAll = () => { if (!confirm('Restaurer les 5 produits par défaut ? Les modifications seront perdues.')) return; setProducts(PRESETS); setSel(0); setToast('Base restaurée') }

  const exportJson = () => download(new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' }), 'base_tds_graphenaton.json')
  const importJson = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    f.text().then((t) => { const arr = JSON.parse(t); if (!Array.isArray(arr)) throw 0; setProducts(arr); setSel(0); setToast(`${arr.length} produits importés`) })
      .catch(() => setToast('Fichier invalide : JSON exporté depuis cet outil attendu'))
    e.target.value = ''
  }

  const makePdf = async (prod) => (await pdf(<TdsPdf product={prod} brand={brand} />).toBlob())
  const exportOne = async () => {
    setBusy('Génération du PDF…')
    try { download(await makePdf(p), slug(p)); setToast('PDF téléchargé') } catch (err) { console.error(err); setToast('Échec de la génération, voir la console') }
    setBusy('')
  }
  const exportAll = async () => {
    for (let i = 0; i < products.length; i++) {
      setBusy(`PDF ${i + 1} / ${products.length}…`)
      try { download(await makePdf(products[i]), slug(products[i])) } catch (err) { console.error(err) }
      await new Promise((r) => setTimeout(r, 400))
    }
    setBusy(''); setToast(`${products.length} PDF téléchargés`)
  }

  const missing = useMemo(() => {
    const m = []
    if (!p.date) m.push('date'); if (!p.subtitle) m.push('sous-titre')
    SPEC_FIELDS.filter((f) => !f.aluOnly || lam).forEach((f) => {
      const v = p.specs[f.key]
      if (f.dual ? !(v?.[0] && v?.[1]) : !v) m.push(f.label)
    })
    return m
  }, [p, lam])

  return (
    <div className="app">
      <aside className="side">
        <div className="side-head">
          <div className="side-logo"><span className="g">G</span><span>GRAPHENATON<small>Générateur de TDS</small></span></div>
        </div>
        <ul className="plist">
          {products.map((x, i) => (
            <li key={x.id}><button className={i === sel ? 'on' : ''} onClick={() => setSel(i)}>{x.name}<em>{x.variant}</em></button></li>
          ))}
        </ul>
        <div className="side-actions">
          <button onClick={addProduct}>+ Nouveau produit</button>
          <button onClick={exportAll} disabled={!!busy}>Télécharger tous les PDF</button>
          <div className="row2">
            <button onClick={exportJson}>Exporter la base</button>
            <button onClick={() => fileRef.current.click()}>Importer</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
          </div>
          <button className="quiet" onClick={resetAll}>Restaurer les valeurs par défaut</button>
        </div>
      </aside>

      <main className="editor">
        <div className="tabs"><button className={tab === 'product' ? 'on' : ''} onClick={() => setTab('product')}>Produit</button><button className={tab === 'brand' ? 'on' : ''} onClick={() => setTab('brand')}>Logo et mentions</button></div>
        {tab === 'brand' && (
          <div className="brand-ed">
            <section>
              <h3>Logo</h3>
              <div className="logo-row">
                {brand.logo ? <img src={brand.logo} alt="" style={{ height: 48 }} /> : <span className="hint">Aucun logo chargé : le « G » dessiné est utilisé.</span>}
                <div className="row2">
                  <button onClick={() => document.getElementById('logo-file').click()}>Charger un logo (PNG / JPG)</button>
                  {brand.logo && <button onClick={() => setB('logo', '')}>Retirer</button>}
                </div>
                <input id="logo-file" type="file" accept="image/png,image/jpeg" hidden onChange={onLogo} />
              </div>
              <div className="grid">
                <label>Hauteur du logo (px)<input type="number" value={brand.logoHeight} onChange={(e) => setB('logoHeight', +e.target.value || 44)} /></label>
              </div>
              <p className="hint">Conseil : PNG sur fond transparent, largeur 800 px environ. Le logo remplace le bloc « G GRAPHENATON LABS SAS » en haut à gauche.</p>
            </section>
            <section>
              <h3>Sans logo : texte de l'en-tête</h3>
              <div className="grid">
                <label>Société<input value={brand.company} onChange={(e) => setB('company', e.target.value)} /></label>
                <label>Sous-titre<input value={brand.companySub} onChange={(e) => setB('companySub', e.target.value)} /></label>
              </div>
            </section>
            <section>
              <h3>Pied de page</h3>
              <div className="grid">
                <label className="wide">Adresse / contact<input value={brand.address} onChange={(e) => setB('address', e.target.value)} /></label>
                <label className="wide">Site web<input value={brand.site} onChange={(e) => setB('site', e.target.value)} /></label>
              </div>
            </section>
            <section>
              <h3>Mention légale</h3>
              <div className="grid"><label className="wide">Texte<textarea rows="6" value={brand.disclaimer} onChange={(e) => setB('disclaimer', e.target.value)} /></label></div>
            </section>
            <button className="quiet" onClick={() => setBrand(DEFAULT_BRAND)}>Restaurer les valeurs par défaut</button>
          </div>
        )}
        <div style={{ display: tab === 'product' ? 'contents' : 'none' }}>
        <header className="ed-head">
          <input className="name" value={p.name} onChange={(e) => setMeta('name', e.target.value)} aria-label="Nom du produit" />
          <div className="ed-btns">
            <button onClick={duplicate}>Dupliquer</button>
            <button className="danger" onClick={remove} disabled={products.length === 1}>Supprimer</button>
            <button className="primary" onClick={exportOne} disabled={!!busy}>{busy || 'Télécharger le PDF'}</button>
          </div>
        </header>

        {missing.length > 0 && <div className="warn">{missing.length} champ{missing.length > 1 ? 's' : ''} vide{missing.length > 1 ? 's' : ''} : {missing.slice(0, 4).join(', ')}{missing.length > 4 ? '…' : ''}. Ils sortiront en « N/A » rouge sur le PDF.</div>}

        <section>
          <h3>Document</h3>
          <div className="grid">
            <label>Version<select value={p.variant} onChange={(e) => setMeta('variant', e.target.value)}><option value="film">Film nu</option><option value="alu">Laminé aluminium</option><option value="plaster">Laminé plâtre</option></select></label>
            <label>Numéro (ABF® …)<input value={p.productNumber} onChange={(e) => setMeta('productNumber', e.target.value)} /></label>
            <label>Suffixe du titre<input value={p.titleSuffix} placeholder="ALU, PLASTER…" onChange={(e) => setMeta('titleSuffix', e.target.value)} /></label>
            <label>Date<input value={p.date} placeholder="May 2026" onChange={(e) => setMeta('date', e.target.value)} /></label>
            <label className="wide">Sous-titre<input value={p.subtitle} onChange={(e) => setMeta('subtitle', e.target.value)} /></label>
          </div>
        </section>

        <section>
          <h3>Electric and thermal specifications</h3>
          <div className="grid">
            {SPEC_FIELDS.filter((f) => !f.aluOnly || lam).map((f) =>
              f.dual ? (
                <label key={f.key} className="wide dual">{f.label}
                  <span><input value={p.specs[f.key]?.[0] ?? ''} placeholder="230 V" onChange={(e) => setSpec(f.key, e.target.value, 0)} /><input value={p.specs[f.key]?.[1] ?? ''} placeholder="240 V" onChange={(e) => setSpec(f.key, e.target.value, 1)} /></span>
                </label>
              ) : (
                <label key={f.key}>{f.label}<input value={p.specs[f.key] ?? ''} onChange={(e) => setSpec(f.key, e.target.value)} /></label>
              )
            )}
          </div>
        </section>

        <section>
          <h3>Dimensions du schéma (mm)</h3>
          <div className="grid">
            {DIM_FIELDS.filter((f) => !f.aluOnly || lam).map((f) => (
              <label key={f.key}>{f.label}<input type="number" step="0.1" value={p.dims[f.key] ?? ''} onChange={(e) => setDim(f.key, e.target.value)} /></label>
            ))}
          </div>
        </section>
        </div>
      </main>

      <div className="preview-wrap"><div className="preview-scale"><Preview product={p} brand={brand} /></div></div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
