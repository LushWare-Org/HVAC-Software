import type React from 'react'

export function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []

  const inlineFormat = (s: string, key: string): React.ReactNode => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return (
      <span key={key}>
        {parts.map((p, i) => {
          if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
          if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>
          if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 3, padding: '1px 4px', fontSize: 12 }}>{p.slice(1, -1)}</code>
          return p
        })}
      </span>
    )
  }

  lines.forEach((line, i) => {
    const bulletMatch = line.match(/^[\-\*]\s+(.+)/)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/)
    const headingMatch = line.match(/^#{1,3}\s+(.+)/)

    if (headingMatch) {
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: 14, marginTop: i > 0 ? 8 : 0 }}>{inlineFormat(headingMatch[1], `h${i}`)}</div>)
    } else if (bulletMatch) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <span style={{ opacity: 0.5, flexShrink: 0 }}>•</span>
          <span>{inlineFormat(bulletMatch[1], `b${i}`)}</span>
        </div>
      )
    } else if (numberedMatch) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <span style={{ opacity: 0.6, flexShrink: 0 }}>{numberedMatch[1]}.</span>
          <span>{inlineFormat(numberedMatch[2], `n${i}`)}</span>
        </div>
      )
    } else if (line.trim() === '') {
      if (i > 0 && i < lines.length - 1) nodes.push(<div key={i} style={{ height: 6 }} />)
    } else {
      nodes.push(<div key={i}>{inlineFormat(line, `l${i}`)}</div>)
    }
  })

  return nodes
}
