import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  readOnly?: boolean
}

export function TagInput({ tags, onChange, suggestions = [], placeholder = 'Add tag…', readOnly = false }: TagInputProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(
    s => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase())
  )

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
    setOpen(false)
    setHighlighted(-1)
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag))
    inputRef.current?.focus()
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (highlighted >= 0 && filtered[highlighted]) {
        addTag(filtered[highlighted])
      } else if (input.trim()) {
        addTag(input.replace(/,+$/, ''))
      }
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => {
        const next = Math.min(h + 1, filtered.length - 1)
        setOpen(true)
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlighted(-1)
    }
  }

  const showDropdown = open && !readOnly && (filtered.length > 0 || (input.trim().length > 0 && !tags.includes(input.trim())))

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        onClick={() => { if (!readOnly) inputRef.current?.focus() }}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center',
          padding: '6px 8px', minHeight: 40,
          border: `1.5px solid ${focused ? 'var(--blue)' : 'var(--bd)'}`,
          borderRadius: 10,
          background: readOnly ? 'transparent' : 'var(--bg-card)',
          cursor: readOnly ? 'default' : 'text',
          transition: 'border-color 0.15s',
          boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--blue) 12%, transparent)' : 'none',
        }}
      >
        {tags.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: readOnly ? '2px 10px' : '2px 4px 2px 10px',
              borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
              color: 'var(--blue)',
              border: '1px solid color-mix(in srgb, var(--blue) 18%, transparent)',
              lineHeight: 1.6,
            }}
          >
            {tag}
            {!readOnly && (
              <button
                type="button"
                onMouseDown={e => { e.stopPropagation(); e.preventDefault() }}
                onClick={e => { e.stopPropagation(); removeTag(tag) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'color-mix(in srgb, var(--blue) 14%, transparent)',
                  border: 'none', cursor: 'pointer', color: 'var(--blue)',
                  padding: 0, flexShrink: 0,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--blue) 28%, transparent)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--blue) 14%, transparent)' }}
              >
                <X size={9} strokeWidth={2.5} />
              </button>
            )}
          </span>
        ))}

        {!readOnly && (
          <input
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              setOpen(true)
              setHighlighted(-1)
            }}
            onFocus={() => { setFocused(true); setOpen(true) }}
            onBlur={() => {
              // small delay so click on dropdown item registers first
              setTimeout(() => {
                if (!containerRef.current?.matches(':focus-within')) setFocused(false)
              }, 150)
            }}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            style={{
              flex: '1 1 80px', minWidth: 80, border: 'none', outline: 'none',
              background: 'transparent', fontSize: 13, color: 'var(--t1)',
              padding: '1px 2px',
            }}
          />
        )}

        {tags.length === 0 && readOnly && (
          <span style={{ fontSize: 12, color: 'var(--t4)', padding: '1px 2px' }}>—</span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--bd)',
            borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
            zIndex: 9999, overflow: 'hidden',
            maxHeight: 210, overflowY: 'auto',
          }}
        >
          {/* existing matching suggestions */}
          {filtered.map((s, i) => {
            const lower = s.toLowerCase()
            const q = input.toLowerCase()
            const idx = lower.indexOf(q)
            return (
              <div
                key={s}
                onMouseDown={e => { e.preventDefault(); addTag(s) }}
                onMouseEnter={() => setHighlighted(i)}
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                  color: 'var(--t1)',
                  background: i === highlighted
                    ? 'color-mix(in srgb, var(--blue) 8%, transparent)'
                    : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {input && idx >= 0 ? (
                  <span>
                    {s.slice(0, idx)}
                    <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{s.slice(idx, idx + input.length)}</span>
                    {s.slice(idx + input.length)}
                  </span>
                ) : s}
              </div>
            )
          })}

          {/* "Create new tag" option when input doesn't match any existing */}
          {input.trim() && !tags.includes(input.trim()) && !filtered.includes(input.trim()) && (
            <div
              onMouseDown={e => { e.preventDefault(); addTag(input.trim()) }}
              onMouseEnter={() => setHighlighted(filtered.length)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                borderTop: filtered.length > 0 ? '1px solid var(--bd)' : 'none',
                background: highlighted === filtered.length
                  ? 'color-mix(in srgb, var(--blue) 8%, transparent)'
                  : 'transparent',
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--t3)',
              }}
            >
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--blue)',
                background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
                padding: '1px 6px', borderRadius: 4,
              }}>
                New
              </span>
              Create <span style={{ color: 'var(--t1)', fontWeight: 600 }}>"{input.trim()}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
