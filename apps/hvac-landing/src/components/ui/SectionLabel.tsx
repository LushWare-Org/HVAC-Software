import clsx from 'clsx'

interface SectionLabelProps {
  index?: string
  children: string
  className?: string
  tone?: 'dark' | 'light'
}

export default function SectionLabel({
  index,
  children,
  className,
  tone = 'dark',
}: SectionLabelProps) {
  const color = tone === 'dark' ? 'text-navy-500' : 'text-navy-300'
  const rule = tone === 'dark' ? 'bg-navy-500' : 'bg-navy-300/60'
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {index && (
        <span className={clsx('font-display text-sm font-bold tabular-nums', color)}>
          {index}
        </span>
      )}
      <span className={clsx('h-px w-8', rule)} />
      <span
        className={clsx(
          'text-xs font-semibold uppercase tracking-[0.2em]',
          color,
        )}
      >
        {children}
      </span>
    </div>
  )
}
