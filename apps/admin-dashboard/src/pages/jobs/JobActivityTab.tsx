/**
 * JobActivityTab — extracted from JobDetailModal.tsx (Session 14, 2026-05-08).
 *
 * Read-only timeline of status transitions. Pure presentational; the parent
 * still owns data fetching (`jobDetailQuery`) and passes the slice that
 * matters here. Status label/css map is duplicated locally rather than
 * imported back from the parent — the file is then truly standalone.
 */
import { Clock, Loader2 } from 'lucide-react'

interface StatusHistoryRow {
  id?: string
  fromStatus?: string | null
  toStatus: string
  createdAt: string
  notes?: string | null
}

const STATUS_LABEL: Record<string, { label: string; css: string }> = {
  PENDING:     { label: 'Pending',     css: 'badge-amber' },
  SCHEDULED:   { label: 'Scheduled',   css: 'badge-violet' },
  EN_ROUTE:    { label: 'En Route',    css: 'badge-blue' },
  ON_SITE:     { label: 'On Site',     css: 'badge-blue' },
  IN_PROGRESS: { label: 'In Progress', css: 'badge-blue' },
  COMPLETED:   { label: 'Completed',   css: 'badge-green' },
  INVOICED:    { label: 'Invoiced',    css: 'badge-cyan' },
  PAID:        { label: 'Paid',        css: 'badge-green' },
  CANCELLED:   { label: 'Cancelled',   css: 'badge-red' },
  ON_HOLD:     { label: 'On Hold',     css: 'badge-neutral' },
}

interface Props {
  isLoading: boolean
  statusHistory: StatusHistoryRow[]
}

export default function JobActivityTab({ isLoading, statusHistory }: Props) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Clock size={12} /> Status History
      </h4>
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 size={18} className="animate-spin mr-2" /> Loading activity…
        </div>
      )}
      {!isLoading && statusHistory.length === 0 && (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">No activity recorded yet</p>
      )}
      {statusHistory.length > 0 && (
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200" />
          {statusHistory.map((h, i) => {
            const s = STATUS_LABEL[h.toStatus] ?? { label: h.toStatus, css: 'badge-neutral' }
            return (
              <div key={h.id || i} className="relative">
                <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-white bg-blue-500 shadow" />
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${s.css}`}>{s.label}</span>
                    {h.fromStatus && (
                      <span className="text-xs text-gray-400">
                        from {(STATUS_LABEL[h.fromStatus] ?? { label: h.fromStatus }).label}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(h.createdAt).toLocaleString()}
                    {h.notes && <span className="ml-2 text-gray-600">— {h.notes}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
