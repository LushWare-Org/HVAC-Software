import type { TemplateBlock, TextStyle, BoxStyle } from './documentTemplatesApi'

const FONT_LIST = [
  'Helvetica Neue, Arial, sans-serif', 'Georgia, serif', '"Times New Roman", serif',
  '"Courier New", monospace', 'Verdana, sans-serif', '"Trebuchet MS", sans-serif',
]

// Slots whose primary content is text (font/color/alignment controls apply). Everything
// else is a box-shaped slot (card/section — background/border/padding controls apply).
const TEXT_SLOTS = new Set(['companyName', 'companyAddress', 'tagline', 'headerText', 'footerText'])

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase',
  letterSpacing: '0.05em', display: 'block', marginBottom: 6,
}
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13,
  border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)', boxSizing: 'border-box',
}

export default function BlockStyleSidebar({ block, onChange, onClose }: {
  block: TemplateBlock
  onChange: (style: TextStyle & BoxStyle) => void
  onClose: () => void
}) {
  const style = block.style ?? {}
  const slotName = block.slot.split('/')[1] ?? block.slot
  const isTextSlot = TEXT_SLOTS.has(slotName)
  const set = (patch: Partial<TextStyle & BoxStyle>) => onChange({ ...style, ...patch })

  return (
    <div style={{ overflowY: 'auto', background: 'var(--bg-card)', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong style={{ fontSize: 13 }}>{slotName}</strong>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
      </div>
      {isTextSlot ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Font</label>
            <select className="select" style={{ width: '100%' }} value={style.fontFamily ?? FONT_LIST[0]} onChange={e => set({ fontFamily: e.target.value })}>
              {FONT_LIST.map(f => <option key={f} value={f}>{f.split(',')[0].replace(/"/g, '')}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Size: {style.fontSize ?? 14}px</label>
            <input type="range" min={9} max={40} value={style.fontSize ?? 14} onChange={e => set({ fontSize: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Weight</label>
            <select className="select" style={{ width: '100%' }} value={style.fontWeight ?? 400} onChange={e => set({ fontWeight: Number(e.target.value) as 400 | 600 | 700 | 800 })}>
              <option value={400}>Regular</option>
              <option value={600}>Semibold</option>
              <option value={700}>Bold</option>
              <option value={800}>Extra bold</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Color</label>
            <input type="color" style={{ ...inp, height: 36, padding: 4 }} value={style.color ?? '#0f172a'} onChange={e => set({ color: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Alignment</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} className="btn btn-sm" onClick={() => set({ align: a })} style={style.align === a ? { background: 'var(--blue)', color: '#fff' } : {}}>{a}</button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Background</label>
            <input type="color" style={{ ...inp, height: 36, padding: 4 }} value={style.background ?? '#f8fafc'} onChange={e => set({ background: e.target.value })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Border color</label>
            <input type="color" style={{ ...inp, height: 36, padding: 4 }} value={style.borderColor ?? '#e2e8f0'} onChange={e => set({ borderColor: e.target.value })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Corner radius: {style.borderRadiusPx ?? 8}px</label>
            <input type="range" min={0} max={24} value={style.borderRadiusPx ?? 8} onChange={e => set({ borderRadiusPx: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={lbl}>Padding: {style.paddingPx ?? 16}px</label>
            <input type="range" min={0} max={40} value={style.paddingPx ?? 16} onChange={e => set({ paddingPx: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
        </>
      )}
    </div>
  )
}
