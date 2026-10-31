import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import { modulePath, type IntelligenceModule } from '../../data/modules'

export default function ModuleCard({ module: m }: { module: IntelligenceModule }) {
  const Icon = m.icon
  return (
    <Link
      to={modulePath(m)}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-block-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition-colors duration-300 group-hover:bg-navy-900 group-hover:text-white">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <StatusBadge status={m.availability} />
      </div>
      <div className="mt-5 font-mono text-xs text-slate-400">Module {m.number}</div>
      <h3 className="mt-1 font-display text-lg font-bold leading-snug tracking-tight text-ink">{m.name}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{m.summary}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800">
        Explore module
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
