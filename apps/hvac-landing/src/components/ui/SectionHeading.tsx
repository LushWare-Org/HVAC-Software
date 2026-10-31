import type { ReactNode } from 'react'
import clsx from 'clsx'
import Reveal from './Reveal'
import SectionLabel from './SectionLabel'

interface SectionHeadingProps {
  index?: string
  label: string
  title: ReactNode
  description?: ReactNode
  tone?: 'dark' | 'light'
  align?: 'left' | 'center'
  className?: string
}

/** Label + h2 + lead paragraph, the standard opening of every section. */
export default function SectionHeading({
  index,
  label,
  title,
  description,
  tone = 'dark',
  align = 'left',
  className,
}: SectionHeadingProps) {
  const light = tone === 'light'
  return (
    <Reveal className={clsx('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      <SectionLabel index={index} tone={light ? 'light' : 'dark'} className={align === 'center' ? 'justify-center' : undefined}>
        {label}
      </SectionLabel>
      <h2
        className={clsx(
          'mt-6 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl',
          light ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={clsx('mt-5 text-lg leading-relaxed', light ? 'text-white/70' : 'text-slate-600')}>
          {description}
        </p>
      )}
    </Reveal>
  )
}
