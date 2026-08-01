import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import BlockStyleSidebar from './BlockStyleSidebar'
import {
  useCreateDocumentTemplate, useUpdateDocumentTemplate, usePreviewTemplate, useUploadLetterhead, useUploadLogo,
  DEFAULT_ROWS,
  type DocumentType, type DocumentTemplate, type UpsertTemplateInput,
  type TemplateRow, type TemplateBlock, type TextStyle, type BoxStyle,
} from './documentTemplatesApi'

// accentColor is a click-to-focus field (it's a property of the whole hero band,
// not a discrete positionable/stylable slot) — every other data-field/data-block-id
// element in the preview is drag-and-drop.
const CLICK_ONLY_FIELDS = ['accentColor']

// Injected into the preview iframe. Everything is driven by plain mousedown/mousemove/
// mouseup — no native HTML5 drag-and-drop — because browsers make <img> elements
// natively draggable by default, and that hijacks a real drag-and-drop gesture before
// our own listeners see it (the exact bug behind "logo won't drag"). Manual mouse
// tracking sidesteps that entirely and works identically for every block.
//
// Hero-band blocks (logo, tagline, company name/address, header text, invoice/quote
// badge, bill-to, balance-due, …) are a true free-position canvas: pick one up and it
// follows the cursor 1:1, drop it anywhere. Body-band blocks (the line-items table,
// notes, totals, …) can't be freely positioned — their height depends on real document
// data — so they stay row/flow-based, but get many drop zones: one between every pair
// of components, one at each end of every row, and one between every row (to become a
// new row of its own), all shown live while dragging.
const PREVIEW_INTERACTIVITY_SCRIPT = `
<script>
(function () {
  var DRAG_THRESHOLD = 4
  var style = document.createElement('style')
  style.textContent =
    'img{-webkit-user-drag:none;}' +
    '[data-block-id]{user-select:none;-webkit-user-select:none;cursor:grab;}' +
    '[data-block-id]:hover{outline:2px dashed #6366f1;outline-offset:-2px;}' +
    '.tpl-block-dragging{opacity:.55;z-index:50;cursor:grabbing;}' +
    '.tpl-gap{transition:background .1s;}' +
    '.tpl-gap-active{background:#6366f1 !important;border-radius:3px;}' +
    'body.tpl-drag-active .tpl-gap{background:rgba(99,102,241,0.15);}' +
    'body.tpl-drag-active .tpl-row-gap{background:rgba(99,102,241,0.12);}'
  document.head.appendChild(style)

  var CLICK_ONLY = ${JSON.stringify(CLICK_ONLY_FIELDS)}
  document.querySelectorAll('[data-field]').forEach(function (el) {
    var field = el.getAttribute('data-field')
    if (CLICK_ONLY.indexOf(field) < 0) return
    el.style.cursor = 'pointer'
    el.addEventListener('mousemove', function (e) {
      el.style.outline = e.target.closest('[data-block-id]') ? '' : '2px dashed #6366f1'
      el.style.outlineOffset = '-2px'
    })
    el.addEventListener('mouseleave', function () { el.style.outline = '' })
    el.addEventListener('click', function (e) {
      e.preventDefault()
      window.parent.postMessage({ source: 'template-preview', type: 'focus', field: field }, '*')
    })
  })

  // ---- Free-canvas dragging for hero-band blocks (logo, bill-to, balance due, …) ----
  document.querySelectorAll('.tpl-block--free').forEach(function (block) {
    var hero = block.closest('.hero')
    var handle = document.createElement('div')
    handle.style.cssText = 'position:absolute;right:-2px;bottom:-2px;width:14px;height:14px;cursor:nwse-resize;background:#6366f1;border-radius:3px;opacity:0;z-index:6;'
    block.appendChild(handle)
    block.addEventListener('mouseenter', function () { handle.style.opacity = '1' })
    block.addEventListener('mouseleave', function () { if (!resizing) handle.style.opacity = '0' })

    var resizing = false, resizeStartX = 0, resizeStartWidth = 0
    handle.addEventListener('mousedown', function (e) {
      resizing = true
      resizeStartX = e.clientX
      resizeStartWidth = block.getBoundingClientRect().width
      e.stopPropagation()
      e.preventDefault()
    })
    window.addEventListener('mousemove', function (e) {
      if (!resizing) return
      var newWidth = Math.max(40, resizeStartWidth + (e.clientX - resizeStartX))
      block.style.width = newWidth + 'px'
    })
    window.addEventListener('mouseup', function () {
      if (!resizing) return
      resizing = false
      handle.style.opacity = '0'
      window.parent.postMessage({ source: 'template-preview', type: 'resize', blockId: block.getAttribute('data-block-id'), widthPx: block.getBoundingClientRect().width }, '*')
    })

    var dragging = false, moved = false, startX = 0, startY = 0, startLeft = 0, startTop = 0
    block.addEventListener('mousedown', function (e) {
      if (e.target === handle) return
      dragging = true
      moved = false
      startX = e.clientX; startY = e.clientY
      startLeft = block.offsetLeft; startTop = block.offsetTop
      e.preventDefault()
    })
    block.addEventListener('click', function (e) { e.stopPropagation() })
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return
      var dx = e.clientX - startX, dy = e.clientY - startY
      if (!moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
      moved = true
      block.classList.add('tpl-block-dragging')
      var heroRect = hero.getBoundingClientRect()
      var blockRect = block.getBoundingClientRect()
      var newLeft = Math.max(0, Math.min(heroRect.width - blockRect.width, startLeft + dx))
      var newTop = Math.max(0, Math.min(heroRect.height - blockRect.height, startTop + dy))
      block.style.left = newLeft + 'px'
      block.style.top = newTop + 'px'
    })
    window.addEventListener('mouseup', function () {
      if (!dragging) return
      dragging = false
      block.classList.remove('tpl-block-dragging')
      if (moved) {
        window.parent.postMessage({ source: 'template-preview', type: 'moveFree', blockId: block.getAttribute('data-block-id'), x: block.offsetLeft, y: block.offsetTop }, '*')
      } else {
        window.parent.postMessage({ source: 'template-preview', type: 'select', blockId: block.getAttribute('data-block-id') }, '*')
      }
    })
  })

  // ---- Row/flow dragging for body-band blocks (table, notes, totals, …) ----
  function clearGaps() {
    document.querySelectorAll('.tpl-gap, .tpl-row-gap').forEach(function (el) { el.remove() })
    document.body.classList.remove('tpl-drag-active')
  }

  function buildGaps() {
    clearGaps()
    document.body.classList.add('tpl-drag-active')
    document.querySelectorAll('[data-row-id]').forEach(function (row) {
      var rowId = row.getAttribute('data-row-id')
      var blocks = Array.prototype.slice.call(row.querySelectorAll(':scope > [data-block-id]'))
      function makeGap(beforeBlockId) {
        var gap = document.createElement('div')
        gap.className = 'tpl-gap'
        gap.setAttribute('data-gap-row-id', rowId)
        gap.setAttribute('data-gap-before', beforeBlockId || '')
        gap.style.cssText = 'width:16px;align-self:stretch;flex-shrink:0;'
        return gap
      }
      if (blocks.length === 0) { row.appendChild(makeGap(null)); return }
      row.insertBefore(makeGap(blocks[0].getAttribute('data-block-id')), blocks[0])
      blocks.forEach(function (b) {
        var next = b.nextElementSibling
        var nextBlockId = next && next.hasAttribute('data-block-id') ? next.getAttribute('data-block-id') : null
        var gap = makeGap(nextBlockId)
        if (b.nextSibling) row.insertBefore(gap, b.nextSibling); else row.appendChild(gap)
      })
    })
    var bodyEl = document.querySelector('.body')
    if (bodyEl) {
      var rowEls = Array.prototype.slice.call(bodyEl.querySelectorAll(':scope > [data-row-id]'))
      function makeRowGap(beforeRowId) {
        var gap = document.createElement('div')
        gap.className = 'tpl-row-gap'
        gap.setAttribute('data-row-gap-before', beforeRowId || '')
        gap.style.cssText = 'height:12px;'
        return gap
      }
      if (rowEls.length > 0) {
        bodyEl.insertBefore(makeRowGap(rowEls[0].getAttribute('data-row-id')), rowEls[0])
        rowEls.forEach(function (r) {
          var next = r.nextElementSibling
          var nextRowId = next && next.hasAttribute('data-row-id') ? next.getAttribute('data-row-id') : null
          var gap = makeRowGap(nextRowId)
          if (r.nextSibling) bodyEl.insertBefore(gap, r.nextSibling); else bodyEl.appendChild(gap)
        })
      }
    }
  }

  document.querySelectorAll('[data-row-id] > [data-block-id]').forEach(function (block) {
    block.style.position = 'relative'

    var handle = document.createElement('div')
    handle.style.cssText = 'position:absolute;right:0;top:0;bottom:0;width:8px;cursor:col-resize;background:transparent;z-index:5;'
    block.appendChild(handle)

    var resizing = false, resizeStartX = 0, resizeStartWidth = 0
    handle.addEventListener('mousedown', function (e) {
      resizing = true
      resizeStartX = e.clientX
      resizeStartWidth = block.getBoundingClientRect().width
      e.stopPropagation()
      e.preventDefault()
    })
    window.addEventListener('mousemove', function (e) {
      if (!resizing) return
      var row = block.closest('[data-row-id]')
      var rowWidth = row.getBoundingClientRect().width
      var newWidthPct = Math.max(10, Math.min(100, ((resizeStartWidth + (e.clientX - resizeStartX)) / rowWidth) * 100))
      block.style.width = newWidthPct + '%'
    })
    window.addEventListener('mouseup', function () {
      if (!resizing) return
      resizing = false
      var row = block.closest('[data-row-id]')
      var rowWidth = row.getBoundingClientRect().width
      var widthPct = (block.getBoundingClientRect().width / rowWidth) * 100
      window.parent.postMessage({ source: 'template-preview', type: 'resize', blockId: block.getAttribute('data-block-id'), widthPct: widthPct }, '*')
    })

    var dragging = false, moved = false, startX = 0, startY = 0
    block.addEventListener('mousedown', function (e) {
      if (e.target === handle) return
      dragging = true
      moved = false
      startX = e.clientX; startY = e.clientY
      e.preventDefault()
    })
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return
      var dx = e.clientX - startX, dy = e.clientY - startY
      if (!moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
      if (!moved) { moved = true; buildGaps(); block.style.pointerEvents = 'none' }
      block.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)'
      block.classList.add('tpl-block-dragging')
      var under = document.elementFromPoint(e.clientX, e.clientY)
      document.querySelectorAll('.tpl-gap-active').forEach(function (el) { el.classList.remove('tpl-gap-active') })
      var gapUnder = under && under.closest('.tpl-gap, .tpl-row-gap')
      if (gapUnder) gapUnder.classList.add('tpl-gap-active')
    })
    window.addEventListener('mouseup', function (e) {
      if (!dragging) return
      dragging = false
      block.style.pointerEvents = ''
      block.style.transform = ''
      block.classList.remove('tpl-block-dragging')
      if (moved) {
        var under = document.elementFromPoint(e.clientX, e.clientY)
        var gap = under && under.closest('.tpl-gap')
        var rowGap = under && under.closest('.tpl-row-gap')
        if (gap) {
          window.parent.postMessage({ source: 'template-preview', type: 'insertAt', blockId: block.getAttribute('data-block-id'), rowId: gap.getAttribute('data-gap-row-id'), beforeBlockId: gap.getAttribute('data-gap-before') || null }, '*')
        } else if (rowGap) {
          window.parent.postMessage({ source: 'template-preview', type: 'newRow', blockId: block.getAttribute('data-block-id'), section: 'body', beforeRowId: rowGap.getAttribute('data-row-gap-before') || null }, '*')
        }
        clearGaps()
      } else {
        window.parent.postMessage({ source: 'template-preview', type: 'select', blockId: block.getAttribute('data-block-id') }, '*')
      }
    })
  })
})()
</script>`

function withPreviewInteractivity(html: string): string {
  return html.includes('</body>')
    ? html.replace('</body>', `${PREVIEW_INTERACTIVITY_SCRIPT}</body>`)
    : html + PREVIEW_INTERACTIVITY_SCRIPT
}

function findBlock(rows: TemplateRow[], blockId: string): TemplateBlock | undefined {
  for (const row of rows) {
    const found = row.blocks.find(b => b.id === blockId)
    if (found) return found
  }
  return undefined
}
/** Drops a block into a specific row, at a specific position within it (before a given
 * block, or at the end when beforeBlockId is null) — the horizontal-gap drop targets. */
function insertBlockInRow(rows: TemplateRow[], blockId: string, rowId: string, beforeBlockId: string | null): TemplateRow[] {
  const moved = findBlock(rows, blockId)
  if (!moved) return rows
  const stripped = rows.map(row => ({ ...row, blocks: row.blocks.filter(b => b.id !== blockId) }))
  return pruneEmptyRows(stripped.map(row => {
    if (row.id !== rowId) return row
    const blocks = [...row.blocks]
    const idx = beforeBlockId ? blocks.findIndex(b => b.id === beforeBlockId) : -1
    if (idx === -1) blocks.push(moved)
    else blocks.splice(idx, 0, moved)
    return { ...row, blocks }
  }))
}

/** Drops a block into a brand-new row of its own, positioned before a given row (or at
 * the end of its section when beforeRowId is null) — the vertical between-row drop targets. */
function insertNewRow(rows: TemplateRow[], blockId: string, section: 'hero' | 'body', beforeRowId: string | null): TemplateRow[] {
  const moved = findBlock(rows, blockId)
  if (!moved) return rows
  const stripped = rows.map(row => ({ ...row, blocks: row.blocks.filter(b => b.id !== blockId) }))
  const newRow: TemplateRow = { id: `row-${Date.now()}`, section, blocks: [moved] }
  if (beforeRowId) {
    const idx = stripped.findIndex(r => r.id === beforeRowId)
    const next = [...stripped]
    if (idx === -1) next.push(newRow)
    else next.splice(idx, 0, newRow)
    return pruneEmptyRows(next)
  }
  let lastIdx = -1
  stripped.forEach((r, i) => { if (r.section === section) lastIdx = i })
  const next = [...stripped]
  next.splice(lastIdx + 1, 0, newRow)
  return pruneEmptyRows(next)
}

/** A row can go empty after a block moves out of it — drop those rather than leave visible gaps. */
function pruneEmptyRows(rows: TemplateRow[]): TemplateRow[] {
  return rows.filter(row => row.blocks.length > 0)
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
  border: '1px solid var(--bd)', background: 'var(--bg-input, var(--bg-card))',
  color: 'var(--t1)', fontFamily: 'inherit', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase',
  letterSpacing: '0.05em', display: 'block', marginBottom: 6,
}

export default function TemplateEditorModal({ documentType, template, onClose }: {
  documentType: DocumentType
  template: DocumentTemplate | null
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createMut = useCreateDocumentTemplate()
  const updateMut = useUpdateDocumentTemplate()
  const previewMut = usePreviewTemplate()
  const uploadLetterhead = useUploadLetterhead()
  const uploadLogo = useUploadLogo()
  const { showError } = useToast()
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})

  const [name, setName] = useState(template?.name ?? '')
  const [companyName, setCompanyName] = useState(template?.companyName ?? '')
  const [companyAddress, setCompanyAddress] = useState(template?.companyAddress ?? '')
  const [logoUrl, setLogoUrl] = useState(template?.logoUrl ?? '')
  const [logoPosition, setLogoPosition] = useState(template?.logoPosition ?? 'LEFT')
  const [accentColor, setAccentColor] = useState(template?.accentColor ?? '#0f172a')
  const [headerText, setHeaderText] = useState(template?.headerText ?? '')
  const [footerText, setFooterText] = useState(template?.footerText ?? '')
  const [bankDetails, setBankDetails] = useState(template?.bankDetails ?? '')
  const [showPageNumbers, setShowPageNumbers] = useState(template?.showPageNumbers ?? true)
  const [letterheadImageUrl, setLetterheadImageUrl] = useState(template?.letterheadImageUrl ?? '')
  const [topMargin, setTopMargin] = useState(template?.letterheadTopMarginPx ?? 140)
  const [bottomMargin, setBottomMargin] = useState(template?.letterheadBottomMarginPx ?? 100)
  const [rows, setRows] = useState<TemplateRow[]>(template?.rows ?? DEFAULT_ROWS[documentType])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')

  // There's no separate "mode" toggle — uploading a letterhead switches the header
  // band over to it automatically; clearing it goes back to the interactive design.
  const mode = letterheadImageUrl ? 'LETTERHEAD' as const : 'BUILDER' as const

  const draft: Partial<UpsertTemplateInput> = useMemo(() => ({
    mode,
    companyName: companyName || undefined,
    companyAddress: companyAddress || undefined,
    logoUrl: logoUrl || undefined,
    logoPosition: logoPosition ?? undefined,
    accentColor: accentColor || undefined,
    headerText: headerText || undefined,
    footerText: footerText || undefined,
    bankDetails: bankDetails || undefined,
    showPageNumbers,
    letterheadImageUrl: letterheadImageUrl || undefined,
    letterheadTopMarginPx: topMargin,
    letterheadBottomMarginPx: bottomMargin,
    rows,
  }), [mode, companyName, companyAddress, logoUrl, logoPosition, accentColor, headerText, footerText, bankDetails, showPageNumbers, letterheadImageUrl, topMargin, bottomMargin, rows])

  // Debounced live preview — re-renders ~400ms after the last edit.
  useEffect(() => {
    const t = setTimeout(() => {
      previewMut.mutate({ documentType, template: draft }, {
        onSuccess: (res) => setPreviewHtml(withPreviewInteractivity(res.html)),
      })
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, documentType])

  // The preview iframe posts messages back for these interactions:
  //  - 'focus': clicking accentColor — jump focus to, and flash, its control here.
  //  - 'select': clicking a block — open the style sidebar for it.
  //  - 'moveFree': dropping a hero-band block anywhere on the free canvas — commit its new x/y.
  //  - 'resize': dragging a block's resize handle — commit its new width (px for hero blocks, % for body blocks).
  //  - 'insertAt': dropping a body-band block on a horizontal gap — insert into that row at that exact position.
  //  - 'newRow': dropping a body-band block on a between-row gap — it becomes its own new row there.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.source !== 'template-preview') return
      if (e.data.type === 'select') { setSelectedBlockId(e.data.blockId); return }
      if (e.data.type === 'moveFree') {
        setRows(prev => prev.map(row => ({ ...row, blocks: row.blocks.map(b => b.id === e.data.blockId ? { ...b, x: e.data.x, y: e.data.y } : b) })))
        return
      }
      if (e.data.type === 'resize') {
        setRows(prev => prev.map(row => ({
          ...row,
          blocks: row.blocks.map(b => {
            if (b.id !== e.data.blockId) return b
            return typeof e.data.widthPx === 'number' ? { ...b, widthPx: e.data.widthPx } : { ...b, widthPct: e.data.widthPct }
          }),
        })))
        return
      }
      if (e.data.type === 'insertAt') {
        setRows(prev => insertBlockInRow(prev, e.data.blockId, e.data.rowId, e.data.beforeBlockId));
        return
      }
      if (e.data.type === 'newRow') {
        setRows(prev => insertNewRow(prev, e.data.blockId, e.data.section, e.data.beforeRowId));
        return
      }
      if (e.data.type === 'focus') {
        const el = fieldRefs.current[e.data.field]
        if (!el) return
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        el.focus()
        const prevOutline = el.style.outline
        const prevOffset = el.style.outlineOffset
        el.style.outline = '2px solid var(--blue)'
        el.style.outlineOffset = '2px'
        setTimeout(() => { el.style.outline = prevOutline; el.style.outlineOffset = prevOffset }, 900)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const onPickLetterhead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const res = await uploadLetterhead.mutateAsync(file)
      setLetterheadImageUrl(res.url)
    } catch (err: any) {
      showError(err?.response?.data?.message ?? 'Could not upload this file', 'Upload failed')
    }
  }

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const res = await uploadLogo.mutateAsync(file)
      setLogoUrl(res.url)
    } catch (err: any) {
      showError(err?.response?.data?.message ?? 'Could not upload this logo', 'Upload failed')
    }
  }

  const saving = createMut.isPending || updateMut.isPending
  const valid = !!name.trim()
  const selectedBlock = selectedBlockId ? findBlock(rows, selectedBlockId) : undefined
  const hasCustomLayout = JSON.stringify(rows) !== JSON.stringify(DEFAULT_ROWS[documentType])

  const save = async () => {
    if (!valid || saving) return
    setError('')
    const payload: UpsertTemplateInput = { documentType, name: name.trim(), ...draft }
    try {
      if (template) await updateMut.mutateAsync({ id: template.id, ...payload })
      else await createMut.mutateAsync(payload)
      onClose()
    } catch (e: any) {
      const msg = e?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to save template')
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label={template ? 'Edit template' : 'New template'}
        style={{ width: 1560, maxWidth: '98vw', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'min(900px, calc(100vh - 40px))' }}
        onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <input style={{ ...inp, width: 260 }} value={name} placeholder="Template name" onChange={e => setName(e.target.value)} />
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>{mode === 'LETTERHEAD' ? 'Using uploaded letterhead for the header' : 'Designed header'}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: selectedBlock ? '300px 1fr 280px' : '300px 1fr' }}>
          {/* Left: content controls */}
          <div style={{ overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, borderRight: '1px solid var(--bd)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>Tip: header components (logo, bill to, balance due, …) drag freely anywhere in the header. Body components (table, notes, …) can be dropped between any two components or into a row of their own. Drag a corner/edge to resize, or click any component to style it.</p>
              {hasCustomLayout && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ flexShrink: 0, fontSize: 11 }} onClick={() => { setRows(DEFAULT_ROWS[documentType]); setSelectedBlockId(null) }}>
                  Reset layout
                </button>
              )}
            </div>
            <div>
              <label style={lbl}>Company name</label>
              <input style={inp} value={companyName} placeholder="Defaults to your company profile name" onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Company address</label>
              <input style={inp} value={companyAddress} placeholder="Defaults to your company profile address" onChange={e => setCompanyAddress(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Logo</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: uploadLogo.isPending ? 'default' : 'pointer', width: 'fit-content', flexShrink: 0 }}>
                  {uploadLogo.isPending ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                  {' '}{logoUrl ? 'Replace' : 'Upload'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickLogo} disabled={uploadLogo.isPending} style={{ display: 'none' }} />
                </label>
                {logoUrl && <img src={logoUrl} alt="" style={{ height: 32, maxWidth: 100, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--bd)' }} />}
              </div>
              <input style={{ ...inp, marginTop: 8 }} value={logoUrl} placeholder="or paste an image URL…" onChange={e => setLogoUrl(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Logo position</label>
              <select className="select" style={{ width: '100%' }} value={logoPosition ?? 'LEFT'} onChange={e => setLogoPosition(e.target.value)}>
                <option value="LEFT">Left</option>
                <option value="CENTER">Center</option>
                <option value="RIGHT">Right</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Accent / header color</label>
              <input ref={el => { fieldRefs.current.accentColor = el }} type="color" style={{ ...inp, height: 38, padding: 4 }} value={accentColor} onChange={e => setAccentColor(e.target.value)} disabled={mode === 'LETTERHEAD'} />
              {mode === 'LETTERHEAD' && <p style={{ fontSize: 11, color: 'var(--t4)', margin: '6px 0 0' }}>Not used while a letterhead image is active.</p>}
            </div>
            <div>
              <label style={lbl}>Header text</label>
              <input style={inp} value={headerText} placeholder="Tagline, registration number…" onChange={e => setHeaderText(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Footer text</label>
              <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={footerText} placeholder="Terms, disclaimer…" onChange={e => setFooterText(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Bank details</label>
              <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={bankDetails} placeholder="Account name, number, routing…" onChange={e => setBankDetails(e.target.value)} />
              <p style={{ fontSize: 11, color: 'var(--t4)', margin: '6px 0 0' }}>Shown in its own "Payment details" section, not the footer.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--t2)' }}>
              <input type="checkbox" checked={showPageNumbers} onChange={e => setShowPageNumbers(e.target.checked)} />
              Show page numbers
            </label>
          </div>

          {/* Center: live preview, with the letterhead control bar living directly above it */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: selectedBlock ? '1px solid var(--bd)' : undefined }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '1px solid var(--bd)', background: 'var(--bg-card)' }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: uploadLetterhead.isPending ? 'default' : 'pointer', width: 'fit-content', flexShrink: 0 }}>
                {uploadLetterhead.isPending ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                {' '}{letterheadImageUrl ? 'Replace letterhead' : 'Upload letterhead'}
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onPickLetterhead} disabled={uploadLetterhead.isPending} style={{ display: 'none' }} />
              </label>
              {letterheadImageUrl && (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLetterheadImageUrl('')} title="Remove letterhead — go back to the designed header">
                    <Trash2 size={12} /> Remove
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t3)' }}>
                    Top {topMargin}px
                    <input type="range" min={40} max={320} value={topMargin} onChange={e => setTopMargin(Number(e.target.value))} style={{ width: 90 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t3)' }}>
                    Bottom {bottomMargin}px
                    <input type="range" min={40} max={320} value={bottomMargin} onChange={e => setBottomMargin(Number(e.target.value))} style={{ width: 90 }} />
                  </div>
                </>
              )}
              {!letterheadImageUrl && <span style={{ fontSize: 11, color: 'var(--t4)' }}>No letterhead uploaded — the interactive designed header below is used instead.</span>}
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'var(--bg-card-2)', padding: 18 }}>
              {previewMut.isPending && !previewHtml ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                  <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
                </div>
              ) : (
                <iframe title="Template preview" srcDoc={previewHtml} style={{ width: '100%', height: '100%', border: '1px solid var(--bd)', borderRadius: 10, background: '#fff' }} />
              )}
            </div>
          </div>

          {/* Right: per-block style panel — its own grid column, so it never covers the preview */}
          {selectedBlock && (
            <BlockStyleSidebar
              block={selectedBlock}
              onClose={() => setSelectedBlockId(null)}
              onChange={(style: TextStyle & BoxStyle) => setRows(prev => prev.map(row => ({ ...row, blocks: row.blocks.map(b => b.id === selectedBlock.id ? { ...b, style } : b) })))}
            />
          )}
        </div>

        <div style={{ flexShrink: 0, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
          {error && <span style={{ fontSize: 12, color: 'var(--red)', marginRight: 'auto' }}>{error}</span>}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={!valid || saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {template ? 'Save changes' : 'Create template'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
