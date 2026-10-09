/** Telegram's paper-plane mark, in its brand blue by default. */
export default function TelegramMark({ size = 16, color = 'var(--telegram, #229ED9)', plane = '#fff', title }: { size?: number; color?: string; plane?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title} style={{ flexShrink: 0 }}>
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="12" fill={color} />
      <path d="M5.4 11.8l11.3-4.4c.5-.2 1 .1.8.9l-1.9 9c-.1.6-.5.8-1.1.5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5.1c.2-.2 0-.3-.4-.1l-6.9 4.4-3-.9c-.6-.2-.6-.6.4-.7z" fill={plane} />
    </svg>
  )
}
