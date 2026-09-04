import React, { useEffect, useMemo, useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { PRESETS, SPEC_FIELDS, DIM_FIELDS, PAGE2_FIELDS, DEFAULT_BRAND, blankProduct, normalizeProduct, isLaminated, slug } from './schema'
import Preview from './Preview'
import TdsPdf from './TdsPdf'
import { productFontSize } from './header'
import { LANGS, specLabel } from './i18n'
import { importExcel } from './excelImport'
import { hasCurveData } from './curve'

const STORAGE_KEY = 'graphenaton-tds-v1'
const BRAND_KEY = 'graphenaton-tds-brand-v1'
const LANG_KEY = 'graphenaton-tds-lang-v1'
const QUOTA_MSG = 'Stockage du navigateur plein : les dernières modifications ne seront pas mémorisées au rechargement. Retirez une image ou exportez la base en JSON pour la conserver.'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr.map(normalizeProduct) }
  } catch {}
  return PRESETS
}

function loadBrand() {
  try {
    const raw = localStorage.getItem(BRAND_KEY)
    if (raw) {
      const b = JSON.parse(raw)
      if (b.logoHeight === 44) delete b.logoHeight // ancien défaut de l'en-tête précédent : on reprend le nouveau (90)
      if (b.disclaimer) { if (!b.disclaimerEn) b.disclaimerEn = b.disclaimer; delete b.disclaimer } // texte légal devenu bilingue
      return { ...DEFAULT_BRAND, ...b }
    }
  } catch {}
  return DEFAULT_BRAND
}

const clone = (o) => JSON.parse(JSON.stringify(o))

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// Redimensionne une image PNG/JPG via canvas (maxW px de large max) et l'encode en JPEG sur fond blanc
// (le JPEG n'a pas de transparence) pour rester légère dans le localStorage.
function resizeImage(file, maxW = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const k = Math.min(1, maxW / img.naturalWidth)
      const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k))
      const c = document.createElement('canvas'); c.width = w; c.height = h
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable image')) }
    img.src = url
  })
}

// Vignette + boutons « Charger » / « Retirer » pour une image du produit (schéma, courbe).
function ImageField({ value, label, empty, onFile, onClear }) {
  const ref = useRef()
  return (
    <div className="img-field">
      {value ? <img src={value} alt="" /> : <span className="hint">{empty}</span>}
      <div className="row2">
        <button type="button" onClick={() => ref.current.click()}>{label}</button>
        {value && <button type="button" onClick={onClear}>Retirer</button>}
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg" hidden onChange={onFile} />
    </div>
  )
}

export default function App() {
  const [products, setProducts] = useState(load)
  const [sel, setSel] = useState(0)
  const [brand, setBrand] = useState(loadBrand)
  const [tab, setTab] = useState('product')
  const [lang, setLang] = useState(() => { try { return localStorage.getItem(LANG_KEY) || 'en' } catch { return 'en' } })
  useEffect(() => { try { localStorage.setItem(LANG_KEY, lang) } catch {} }, [lang])
  // Mobile (< 700 px) : l'onglet « Aperçu » affiche la fiche à l'échelle de l'écran (variable CSS --pvm, voir styles.css).
  const editTab = tab === 'preview' ? 'product' : tab
  useEffect(() => {
    const set = () => document.documentElement.style.setProperty('--pvm', String(Math.min(1, (window.innerWidth - 24) / 794)))
    set(); window.addEventListener('resize', set); return () => window.removeEventListener('resize', set)
  }, [])
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')
  const [p2Over, setP2Over] = useState(0) // dépassement (px) de la page 2 dans l'aperçu, pour prévenir avant le PDF
  const fileRef = useRef()
  const xlsRef = useRef()

  // Les images (data URL) peuvent dépasser le quota du localStorage : on prévient sans planter.
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)) } catch { setToast(QUOTA_MSG) } }, [products])
  useEffect(() => { try { localStorage.setItem(BRAND_KEY, JSON.stringify(brand)) } catch { setToast('Logo trop lourd pour être mémorisé (max ~2 Mo)') } }, [brand])
  const setB = (k, v) => setBrand((b) => ({ ...b, [k]: v }))
  const onLogo = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    if (!/image\/(png|jpeg)/.test(f.type)) { setToast('Logo : PNG ou JPG uniquement (le SVG n\'est pas supporté dans le PDF)'); return }
    const r = new FileReader(); r.onload = () => setB('logo', r.result); r.readAsDataURL(f); e.target.value = ''
  }
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), toast.length > 80 ? 7000 : 2500); return () => clearTimeout(t) }, [toast])

  const p = products[Math.min(sel, products.length - 1)]
  const lam = isLaminated(p)
  useEffect(() => {
    if (!p.page2Enabled) { setP2Over(0); return }
    let raf = requestAnimationFrame(() => { const el = document.querySelector('.sheet.p2'); setP2Over(el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0) })
    return () => cancelAnimationFrame(raf)
  }, [p, lang, brand, tab])

  const update = (fn) => setProducts((arr) => arr.map((x, i) => (i === sel ? fn(clone(x)) : x)))
  const setMeta = (k, v) => update((x) => { x[k] = v; return x })
  const setSpec = (k, v, idx) => update((x) => { if (idx == null) x.specs[k] = v; else { const a = Array.isArray(x.specs[k]) ? [...x.specs[k]] : []; while (a.length <= idx) a.push(''); a[idx] = v; x.specs[k] = a } return x })
  const setDim = (k, v) => update((x) => { x.dims[k] = v; return x })
  // Courbe générée : points { t, temp } et bornes des axes
  const setPoint = (i, k, v) => update((x) => { x.curvePoints[i][k] = v; return x })
  const addPoint = () => update((x) => { x.curvePoints = [...(x.curvePoints || []), { t: '', temp: '' }]; return x })
  const delPoint = (i) => update((x) => { x.curvePoints.splice(i, 1); return x })
  const setAxis = (k, v) => update((x) => { x.curveAxis = { ...(x.curveAxis || {}), [k]: v }; return x })
  const setMech = (k, v) => update((x) => { x.mech = { ...(x.mech || {}), [k]: v }; return x })

  // Upload d'une image produit (schemaImage / curveImage) : redimensionnée puis stockée dans l'objet produit.
  const onImage = (key, done) => async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    if (!/^image\/(png|jpeg)$/.test(f.type)) { setToast('PNG ou JPG uniquement (le SVG n\'est pas supporté dans le PDF)'); return }
    try { setMeta(key, await resizeImage(f)); setToast(done) } catch (err) { console.error(err); setToast('Image illisible') }
  }

  const addProduct = () => { setProducts((a) => [...a, blankProduct()]); setSel(products.length) }
  const duplicate = () => { const c = clone(p); c.id = 'copy-' + Date.now(); c.name = p.name + ' (copie)'; setProducts((a) => [...a, c]); setSel(products.length); setToast('Produit dupliqué') }
  const remove = () => { if (!confirm(`Supprimer « ${p.name} » ?`)) return; setProducts((a) => a.filter((_, i) => i !== sel)); setSel(0); setToast('Produit supprimé') }
  const resetAll = () => { if (!confirm('Restaurer les 5 produits par défaut ? Les modifications seront perdues.')) return; setProducts(PRESETS); setSel(0); setToast('Base restaurée') }

  const exportJson = () => download(new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' }), 'base_tds_graphenaton.json')
  const importJson = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    f.text().then((t) => { const arr = JSON.parse(t); if (!Array.isArray(arr)) throw 0; setProducts(arr.map(normalizeProduct)); setSel(0); setToast(`${arr.length} produits importés`) })
      .catch(() => setToast('Fichier invalide : JSON exporté depuis cet outil attendu'))
    e.target.value = ''
  }

  // Import de la base Excel : produits existants mis à jour par nom, nouveaux ajoutés, courbes de l'onglet Courbes.
  const importXlsx = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    try {
      const { products: next, brand: b, stats } = importExcel(await f.arrayBuffer(), products)
      setProducts(next.map(normalizeProduct)); setSel(0)
      if (b.address || b.site) setBrand((x) => ({ ...x, ...b }))
      if (stats.unknown.length) console.warn(`Import Excel : ${stats.unknown.length} libellé(s) non reconnu(s) dans l'onglet Produits :`, stats.unknown)
      setToast(`Excel importé : ${stats.products} produits, ${stats.fields} champs${stats.created.length ? ` (${stats.created.length} nouveau${stats.created.length > 1 ? 'x' : ''})` : ''}${stats.unknown.length ? `. ${stats.unknown.length} libellés non reconnus, voir la console.` : ''}`)
    } catch (err) { console.error(err); setToast('Excel illisible : onglet « Produits » avec une ligne « CHAMP » attendu') }
  }

  const makePdf = async (prod) => (await pdf(<TdsPdf product={prod} brand={brand} lang={lang} nameSize={productFontSize(prod, brand, lang)} />).toBlob())
  const exportOne = async () => {
    setBusy('Génération du PDF…')
    try { download(await makePdf(p), slug(p, lang)); setToast('PDF téléchargé') } catch (err) { console.error(err); setToast('Échec de la génération, voir la console') }
    setBusy('')
  }
  const exportAll = async () => {
    for (let i = 0; i < products.length; i++) {
      setBusy(`PDF ${i + 1} / ${products.length}…`)
      try { download(await makePdf(products[i]), slug(products[i], lang)) } catch (err) { console.error(err) }
      await new Promise((r) => setTimeout(r, 400))
    }
    setBusy(''); setToast(`${products.length} PDF téléchargés`)
  }

  const missing = useMemo(() => {
    const m = []
    if (!p.date) m.push('date'); if (!p.subtitle) m.push('sous-titre')
    if (!p.schemaImage) m.push('schéma')
    if ((p.curveMode === 'image' && !p.curveImage) || (p.curveMode === 'generated' && !hasCurveData(p))) m.push('courbe')
    SPEC_FIELDS.filter((f) => !f.aluOnly || lam).forEach((f) => {
      const v = p.specs[f.key]
      if (f.multi) return // paliers de montée en température : optionnels
      if (f.dual ? !(v?.[0] && v?.[1]) : !v) m.push(specLabel(lang, f.key))
    })
    return m
  }, [p, lam, lang])

  return (
    <div className={'app' + (tab === 'preview' ? ' tab-preview' : '')}>
      <aside className="side">
        <div className="side-head">
          <div className="side-logo"><span className="g">G</span><span>GRAPHENATON<small>Générateur de TDS</small></span></div>
        </div>
        <ul className="plist">
          {products.map((x, i) => (
            <li key={x.id}><button className={i === sel ? 'on' : ''} onClick={() => setSel(i)}>{x.name}<em>{x.variant}</em></button></li>
          ))}
        </ul>
        <select className="m-only plist-select" value={sel} onChange={(e) => setSel(+e.target.value)} aria-label="Produit">
          {products.map((x, i) => <option key={x.id} value={i}>{x.name}</option>)}
        </select>
        <div className="side-actions">
          <button onClick={addProduct}>+ Nouveau produit</button>
          <button onClick={exportAll} disabled={!!busy}>Télécharger tous les PDF</button>
          <div className="row2">
            <button onClick={exportJson}>Exporter la base</button>
            <button onClick={() => fileRef.current.click()}>Importer</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
          </div>
          <button onClick={() => xlsRef.current.click()}>Importer un Excel</button>
          <input ref={xlsRef} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={importXlsx} />
          <button className="quiet" onClick={resetAll}>Restaurer les valeurs par défaut</button>
        </div>
      </aside>

      <main className="editor">
        <div className="tabs"><button className={tab === 'product' ? 'on' : ''} onClick={() => setTab('product')}>Produit</button><button className={tab === 'brand' ? 'on' : ''} onClick={() => setTab('brand')}>Logo et mentions</button><button className={'m-only' + (tab === 'preview' ? ' on' : '')} onClick={() => setTab('preview')}>Aperçu</button></div>
        {editTab === 'brand' && (
          <div className="brand-ed">
            <section>
              <h3>En-tête</h3>
              <div className="grid">
                <label className="wide">Nom de la société dans l'en-tête<input value={brand.headerCompany} onChange={(e) => setB('headerCompany', e.target.value)} /></label>
              </div>
            </section>
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
                <label>Hauteur du logo (px)<input type="number" value={brand.logoHeight} onChange={(e) => setB('logoHeight', +e.target.value || 90)} /></label>
              </div>
              <p className="hint">Conseil : PNG sur fond transparent, largeur 800 px environ. Le logo remplace le bloc « G GRAPHENATON LABS SAS » en haut à droite, au-dessus du nom du produit.</p>
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
              <div className="grid">
                <label className="wide">Texte (fiche EN)<textarea rows="5" value={brand.disclaimerEn} onChange={(e) => setB('disclaimerEn', e.target.value)} /></label>
                <label className="wide">Texte (fiche FR)<textarea rows="5" value={brand.disclaimerFr} onChange={(e) => setB('disclaimerFr', e.target.value)} /></label>
              </div>
            </section>
            <button className="quiet" onClick={() => setBrand(DEFAULT_BRAND)}>Restaurer les valeurs par défaut</button>
          </div>
        )}
        <div style={{ display: editTab === 'product' ? 'contents' : 'none' }}>
        <header className="ed-head">
          <input className="name" value={p.name} onChange={(e) => setMeta('name', e.target.value)} aria-label="Nom du produit" />
          <div className="ed-btns">
            <button onClick={duplicate}>Dupliquer</button>
            <button className="danger" onClick={remove} disabled={products.length === 1}>Supprimer</button>
            <div className="lang-sw" role="group" aria-label="Langue de la fiche">{LANGS.map((l) => <button key={l.code} className={lang === l.code ? 'on' : ''} onClick={() => setLang(l.code)}>{l.label}</button>)}</div>
            <button className="primary" onClick={exportOne} disabled={!!busy}>{busy || 'Télécharger le PDF'}</button>
          </div>
        </header>

        {missing.length > 0 && <div className="warn">{missing.length} champ{missing.length > 1 ? 's' : ''} vide{missing.length > 1 ? 's' : ''} : {missing.slice(0, 4).join(', ')}{missing.length > 4 ? '…' : ''}. Ils sortiront en « N/A » rouge sur le PDF (cadre vide pour le schéma et la courbe).</div>}

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
              f.multi ? (
                <label key={f.key} className="wide triple">{specLabel(lang, f.key)} — paliers « cible: durée »
                  <span>{[0, 1, 2].map((i) => <input key={i} value={p.specs[f.key]?.[i] ?? ''} placeholder={['to 120 °C: < 1 min', 'to 100 °C: < 30 s', 'to 80 °C: < 20 s'][i]} onChange={(e) => setSpec(f.key, e.target.value, i)} />)}</span>
                </label>
              ) : f.dual ? (
                <label key={f.key} className="wide dual">{specLabel(lang, f.key)}
                  <span><input value={p.specs[f.key]?.[0] ?? ''} placeholder="230 V" onChange={(e) => setSpec(f.key, e.target.value, 0)} /><input value={p.specs[f.key]?.[1] ?? ''} placeholder="240 V" onChange={(e) => setSpec(f.key, e.target.value, 1)} /></span>
                </label>
              ) : (
                <label key={f.key}>{specLabel(lang, f.key)}<input value={p.specs[f.key] ?? ''} onChange={(e) => setSpec(f.key, e.target.value)} /></label>
              )
            )}
          </div>
        </section>

        <section>
          <h3>Dimensions du schéma</h3>
          <ImageField value={p.schemaImage} label="Charger le schéma (PNG / JPG)" empty="Aucun schéma chargé : la fiche affiche un cadre « Schéma du film à charger »." onFile={onImage('schemaImage', 'Schéma chargé')} onClear={() => setMeta('schemaImage', '')} />
          <p className="hint" style={{ margin: '0 0 10px' }}>Cotes en mm, optionnelles : mémorisées avec le produit, non dessinées sur la fiche.</p>
          <div className="grid">
            {DIM_FIELDS.filter((f) => !f.aluOnly || lam).map((f) => (
              <label key={f.key}>{f.label}<input type="number" step="0.1" value={p.dims[f.key] ?? ''} placeholder="optionnel" onChange={(e) => setDim(f.key, e.target.value)} /></label>
            ))}
          </div>
        </section>

        <section>
          <h3>Courbe de température</h3>
          <div className="radios" role="radiogroup" aria-label="Mode de la courbe">
            {[['none', 'Aucune'], ['image', 'Image chargée'], ['generated', 'Générée depuis les points']].map(([v, l]) => (
              <label key={v}><input type="radio" name="curveMode" value={v} checked={(p.curveMode || 'none') === v} onChange={() => setMeta('curveMode', v)} />{l}</label>
            ))}
          </div>
          {p.curveMode === 'image' && (
            <ImageField value={p.curveImage} label="Charger la courbe (PNG / JPG)" empty="Aucune courbe chargée : l'aperçu affiche un cadre « Courbe de température à charger »." onFile={onImage('curveImage', 'Courbe chargée')} onClear={() => setMeta('curveImage', '')} />
          )}
          {p.curveMode === 'generated' && (
            <div className="pts">
              <table>
                <thead><tr><th>Temps (min)</th><th>Température (°C)</th><th /></tr></thead>
                <tbody>
                  {(p.curvePoints || []).map((pt, i) => (
                    <tr key={i}>
                      <td><input type="number" step="any" value={pt.t} onChange={(e) => setPoint(i, 't', e.target.value)} /></td>
                      <td><input type="number" step="any" value={pt.temp} onChange={(e) => setPoint(i, 'temp', e.target.value)} /></td>
                      <td><button type="button" className="x" title="Supprimer ce point" onClick={() => delPoint(i)}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="row2"><button type="button" onClick={addPoint}>+ Ajouter un point</button></div>
              <div className="grid">
                <label>Axe X max (min)<input type="number" step="any" value={p.curveAxis?.tMax ?? ''} placeholder="auto" onChange={(e) => setAxis('tMax', e.target.value)} /></label>
                <label>Axe Y max (°C)<input type="number" step="any" value={p.curveAxis?.tempMax ?? ''} placeholder="auto" onChange={(e) => setAxis('tempMax', e.target.value)} /></label>
              </div>
              <p className="hint">Prérempli par l'import Excel (onglet Courbes). Bornes vides = automatiques. Au moins deux points pour tracer la courbe.</p>
            </div>
          )}
        </section>

        <section>
          <h3>Textes de la fiche (colonne gauche)</h3>
          <div className="grid">
            {PAGE2_FIELDS.map((f) => <label key={f.key} className="wide">{f.label}<textarea rows={f.key === 'applications' ? 4 : 3} value={p[f.key] ?? ''} onChange={(e) => setMeta(f.key, e.target.value)} /></label>)}
            <p className="hint wide" style={{ margin: 0 }}>Intégration et conformité : une ligne par point (liste à tirets). Les sections vides n'apparaissent pas sur la fiche.</p>
            <h3 className="wide" style={{ margin: '6px 0 0' }}>Spécifications mécaniques</h3>
            <label>Longueur (mm)<input value={p.mech?.length ?? ''} placeholder={String(p.dims.outerH ?? '')} onChange={(e) => setMech('length', e.target.value)} /></label>
            <label>Largeur (mm)<input value={p.mech?.width ?? ''} placeholder={String(p.dims.outerW ?? '')} onChange={(e) => setMech('width', e.target.value)} /></label>
            <label>Surface active (mm)<input value={p.mech?.activeSurface ?? ''} placeholder="620 x 360" onChange={(e) => setMech('activeSurface', e.target.value)} /></label>
            <label>Construction<input value={p.mech?.construction ?? ''} onChange={(e) => setMech('construction', e.target.value)} /></label>
            <p className="hint wide" style={{ margin: 0 }}>Épaisseur, poids et garantie sont repris des specs ; longueur et largeur reprennent les cotes du schéma si vides.</p>
          </div>
        </section>

        <section>
          <h3>Page 2</h3>
          <label className="check"><input type="checkbox" checked={!!p.page2Enabled} onChange={(e) => setMeta('page2Enabled', e.target.checked)} />Ajouter une page 2 (applications détaillées en cartes)</label>
          {p.page2Enabled && (
            <div className="grid">
              {p2Over > 6 && <div className="warn wide" style={{ margin: 0 }}>La page 2 déborde d'environ {Math.round(p2Over)} px dans l'aperçu : retirez une carte ou raccourcissez les descriptions.</div>}
              <label className="wide">Applications en cartes : une par ligne, « Titre : description »<textarea rows="9" value={p.applicationList ?? ''} onChange={(e) => setMeta('applicationList', e.target.value)} /></label>
              <p className="hint wide" style={{ margin: '-4px 0 0' }}>Le pictogramme est choisi d'après le titre : mobilité / véhicule, plafond, sol, mur, siège / mobilier, industriel, dégivrage / extérieur, bien-être / médical ; sinon un point teal. Le paragraphe « Applications » de la page 1 sert d'introduction.</p>
            </div>
          )}
        </section>
        </div>
      </main>

      <div className={'preview-wrap' + (tab === 'preview' ? ' on' : '')}><div className="preview-scale"><Preview product={p} brand={brand} lang={lang} /></div></div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
