import { ArrowDown, Database, Cpu, LayoutGrid, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import Reveal from '../ui/Reveal'
import { SOURCE_SYSTEMS, LAYER_CAPABILITIES, OUTCOMES } from '../../data/platform'
import { MODULE_CATEGORIES, modulePath, modulesInCategory } from '../../data/modules'

function Tier({
  icon: Icon,
  step,
  title,
  children,
  emphasis,
}: {
  icon: LucideIcon
  step: string
  title: string
  children: React.ReactNode
  emphasis?: boolean
}) {
  return (
    <div
      className={clsx(
        'relative rounded-2xl border p-5 sm:p-6',
        emphasis
          ? 'border-navy-400/40 bg-gradient-to-br from-navy-700 to-navy-900 text-white shadow-block'
          : 'border-slate-200 bg-white shadow-block-sm',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            'flex h-9 w-9 flex-none items-center justify-center rounded-xl',
            emphasis ? 'bg-white/10 text-white' : 'bg-navy-50 text-navy-700',
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </span>
        <div>
          <div
            className={clsx(
              'font-mono text-[11px] uppercase tracking-[0.18em]',
              emphasis ? 'text-navy-200' : 'text-navy-500',
            )}
          >
            {step}
          </div>
          <h3 className={clsx('font-display text-base font-bold tracking-tight sm:text-lg', emphasis ? 'text-white' : 'text-ink')}>
            {title}
          </h3>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function Chips({ items, tone = 'light' }: { items: string[]; tone?: 'light' | 'dark' }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className={clsx(
            'rounded-lg border px-2.5 py-1.5 text-xs font-medium sm:text-[13px]',
            tone === 'dark' ? 'border-white/15 bg-white/5 text-white/85' : 'border-slate-200 bg-slate-50 text-slate-700',
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

function Connector() {
  return (
    <div className="flex justify-center py-2" aria-hidden="true">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-600 shadow-sm">
        <ArrowDown className="h-4 w-4" />
      </span>
    </div>
  )
}

/** Systems → integration & intelligence layer → modules → outcomes. */
export default function ArchitectureDiagram() {
  return (
    <figure aria-label="HVACtor architecture: existing systems feed the integration and intelligence layer, which powers the intelligence modules and business outcomes">
      <Reveal>
        <Tier icon={Database} step="Your systems" title="Existing systems & data sources">
          <Chips items={SOURCE_SYSTEMS} />
        </Tier>
      </Reveal>
      <Connector />
      <Reveal delay={80}>
        <Tier icon={Cpu} step="HVACtor" title="Integration & intelligence layer" emphasis>
          <Chips items={LAYER_CAPABILITIES} tone="dark" />
        </Tier>
      </Reveal>
      <Connector />
      <Reveal delay={160}>
        <Tier icon={LayoutGrid} step="Modules" title="Operational intelligence modules">
          <div className="grid gap-4 md:grid-cols-3">
            {MODULE_CATEGORIES.map((c) => (
              <div key={c.id}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{c.name}</div>
                <ul className="space-y-2">
                  {modulesInCategory(c.id).map((m) => (
                    <li key={m.slug}>
                      <Link
                        to={modulePath(m)}
                        className="flex h-full items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:border-navy-300 hover:bg-navy-50 hover:text-navy-900"
                      >
                        <m.icon className="h-4 w-4 flex-none text-navy-600" strokeWidth={1.9} />
                        {m.navLabel}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Tier>
      </Reveal>
      <Connector />
      <Reveal delay={240}>
        <Tier icon={Target} step="Results" title="Business outcomes">
          <Chips items={OUTCOMES} />
        </Tier>
      </Reveal>
    </figure>
  )
}
