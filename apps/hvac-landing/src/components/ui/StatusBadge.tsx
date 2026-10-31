import clsx from 'clsx'
import { AVAILABILITY, type Availability } from '../../data/modules'

const STYLES: Record<Availability, { pill: string; dot: string }> = {
  available: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  'early-access': { pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  'in-development': { pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  roadmap: { pill: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
}

export default function StatusBadge({
  status,
  className,
}: {
  status: Availability
  className?: string
}) {
  const style = STYLES[status]
  return (
    <span
      className={clsx(
        'inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset',
        style.pill,
        className,
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', style.dot)} />
      {AVAILABILITY[status].label}
    </span>
  )
}
