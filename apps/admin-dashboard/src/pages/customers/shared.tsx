/**
 * Shared building blocks for the Customer Details redesign (orchestrator + tabs).
 */
import type { ComponentType, ReactNode } from 'react'

const inputBase: React.CSSProperties = {
  width: '100%', borderRadius: 9, fontSize: 12.5, fontWeight: 500,
  padding: '10px 12px', fontFamily: 'inherit', outline: 'none',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}

export function Field({
  label, name, value, type = 'text', isEdit, onChange, placeholder = '—', full = false, as = 'input', options,
}: {
  label: string; name: string; value: any; type?: string; isEdit: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  placeholder?: string; full?: boolean; as?: 'input' | 'select' | 'textarea'; options?: string[]
}) {
  // Gray fill + border, same as every other read-only value chip in this
  // redesign — always used inside a white item card (see EquipmentTab,
  // OverviewTab's address/contact cards) so it reads clearly against white.
  const viewStyle: React.CSSProperties = {
    ...inputBase, background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
    color: value ? 'var(--t1)' : 'var(--t4)', fontWeight: 600, appearance: 'none',
  }
  const editStyle: React.CSSProperties = { ...inputBase, background: 'var(--bg-card)', border: '1.5px solid var(--blue)', color: 'var(--t1)' }
  const style = isEdit ? editStyle : viewStyle

  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea name={name} value={value || ''} onChange={onChange} disabled={!isEdit} rows={3}
          placeholder={isEdit ? placeholder : ''} style={{ ...style, resize: 'none' }} />
      ) : as === 'select' ? (
        <select name={name} value={value || ''} onChange={onChange} disabled={!isEdit} style={style}>
          <option value="" disabled>{isEdit ? placeholder : '—'}</option>
          {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value || (isEdit ? '' : '—')} onChange={onChange} disabled={!isEdit}
          placeholder={isEdit ? placeholder : ''} style={style} />
      )}
    </div>
  )
}

export function SectionLabel({ icon: Icon, children, action }: { icon?: ComponentType<{ size?: number; style?: React.CSSProperties }>; children: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
        {Icon && <Icon size={15} style={{ color: 'var(--blue)' }} />}
        {children}
      </div>
      {action}
    </div>
  )
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, padding: '5px 0' }}>
      <span style={{ color: 'var(--t3)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--t1)', textAlign: 'right', fontWeight: 500 }}>{children}</span>
    </div>
  )
}

const BADGE_TONES = {
  blue: { bg: 'var(--blue-glow)', color: 'var(--blue)' },
  violet: { bg: 'color-mix(in srgb, #7C3AED 15%, transparent)', color: '#7C3AED' },
  green: { bg: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)' },
  amber: { bg: 'color-mix(in srgb, var(--amber) 15%, transparent)', color: 'var(--amber)' },
  red: { bg: 'color-mix(in srgb, var(--red) 15%, transparent)', color: 'var(--red)' },
  neutral: { bg: 'var(--bg-card-2)', color: 'var(--t3)' },
} as const

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  const s = BADGE_TONES[tone] ?? BADGE_TONES.neutral
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600,
      padding: '3px 8px', borderRadius: 999, background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

export function patchById<T extends { id: any }>(
  updater: (fn: (prev: T[]) => T[]) => void,
  id: any,
  patch: Partial<T>,
) {
  updater(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))
}

export const cardBoxStyle: React.CSSProperties = {
  border: '1px solid var(--bd)', borderRadius: 12, padding: 14, background: 'var(--bg-card)',
}

export const sectionCardStyle: React.CSSProperties = {
  padding: 16, borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
  display: 'flex', flexDirection: 'column', gap: 14,
}
