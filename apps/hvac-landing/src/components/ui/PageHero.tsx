import type { ReactNode } from 'react'
import clsx from 'clsx'
import Container from './Container'

interface PageHeroProps {
  title: ReactNode
  description?: string
  children?: ReactNode
  className?: string
}

export default function PageHero({ title, description, children, className }: PageHeroProps) {
  return (
    <section className="relative -mt-20 overflow-hidden bg-gradient-to-br from-navy-800 via-navy-950 to-navy-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_30%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_70%_100%,black,transparent)]" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />
      <div className="pointer-events-none absolute left-16 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <Container
        className={clsx(
          'relative flex flex-col items-start pt-28 pb-12 text-left lg:pt-32 lg:pb-16',
          className,
        )}
      >
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.45] tracking-tight text-white sm:text-5xl lg:text-6xl pb-2">
          {title}
        </h1>
        {description && (
          <p className="mt-6 max-w-[800px] text-lg leading-loose text-white/70 sm:text-xl">
            {description}
          </p>
        )}
        {children && (
          <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 pb-4">{children}</div>
        )}
      </Container>
    </section>
  )
}
