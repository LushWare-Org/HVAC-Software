/**
 * Jobs tab — quotes, invoices, and jobs for this customer. Data is fetched by
 * the orchestrator (shared with the tab-bar Jobs count badge) and passed down.
 */
import { FileText, ClipboardList, Plus, ExternalLink } from 'lucide-react'
import { decimalToNumber } from '../../../hooks/useFinance'
import { formatMoney } from '../../../lib/format'
import { Badge, SectionLabel } from '../shared'
import RescheduleBadge from '../../../components/reschedule/RescheduleBadge'

const JOB_TONE: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'neutral'> = {
  COMPLETED: 'green', INVOICED: 'blue', ON_SITE: 'blue', EN_ROUTE: 'blue',
  SCHEDULED: 'amber', PENDING: 'amber', CANCELLED: 'red', PAID: 'green', ON_HOLD: 'neutral',
}
const QUOTE_TONE: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'neutral'> = {
  DRAFT: 'neutral', SENT: 'blue', VIEWED: 'blue', ACCEPTED: 'green',
  DECLINED: 'red', REJECTED: 'red', EXPIRED: 'amber', CONVERTED: 'blue',
}
const INVOICE_TONE: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'neutral'> = {
  DRAFT: 'neutral', SENT: 'blue', PARTIALLY_PAID: 'amber', PAID: 'green', OVERDUE: 'red', CANCELLED: 'red', VOID: 'neutral',
}

function ListRow({ accent, icon, title, meta, right, badge, onClick }: {
  accent: string; icon: React.ReactNode; title: string; meta: string
  right?: React.ReactNode; badge: React.ReactNode; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--bd)', borderLeft: `3px solid ${accent}`,
        borderRadius: 11, padding: '11px 13px', marginBottom: 8, cursor: 'pointer', background: 'var(--bg-card)',
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `color-mix(in srgb, ${accent} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 10.5, color: 'var(--t4)', marginTop: 1 }}>{meta}</div>
      </div>
      {right}
      {badge}
      <ExternalLink size={14} style={{ color: 'var(--t4)', flexShrink: 0 }} />
    </div>
  )
}

export default function JobsTab({
  quotes, invoices, jobs, jobsFetching, onNewJob,
}: {
  quotes: any[]
  invoices: any[]
  jobs: any[]
  jobsFetching: boolean
  onNewJob: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {quotes.length > 0 && (
        <div>
          <SectionLabel icon={FileText}>Quotes · {quotes.length}</SectionLabel>
          {quotes.map(q => (
            <ListRow
              key={q.id}
              accent="var(--blue)"
              icon={<FileText size={14} style={{ color: 'var(--blue)' }} />}
              title={q.title}
              meta={`${q.quoteNumber} · ${new Date(q.createdAt).toLocaleDateString()}`}
              right={<span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{formatMoney(decimalToNumber(q.total))}</span>}
              badge={<Badge tone={QUOTE_TONE[q.status] ?? 'neutral'}>{q.status}</Badge>}
              onClick={() => window.dispatchEvent(new CustomEvent('open-quote-detail', { detail: q }))}
            />
          ))}
        </div>
      )}

      {invoices.length > 0 && (
        <div>
          <SectionLabel icon={FileText}>Invoices · {invoices.length}</SectionLabel>
          {invoices.map(inv => (
            <ListRow
              key={inv.id}
              accent="var(--green)"
              icon={<FileText size={14} style={{ color: 'var(--green)' }} />}
              title={inv.invoiceNumber}
              meta={inv.dueDate ? `Due ${new Date(inv.dueDate).toLocaleDateString()}` : new Date(inv.createdAt).toLocaleDateString()}
              right={
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{formatMoney(decimalToNumber(inv.total))}</div>
                  {decimalToNumber(inv.balanceDue) > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--amber)' }}>Due: {formatMoney(decimalToNumber(inv.balanceDue))}</div>
                  )}
                </div>
              }
              badge={<Badge tone={INVOICE_TONE[inv.status] ?? 'neutral'}>{inv.status}</Badge>}
              onClick={() => window.dispatchEvent(new CustomEvent('open-invoice-detail', { detail: inv }))}
            />
          ))}
        </div>
      )}

      <div>
        <SectionLabel
          icon={ClipboardList}
          action={
            <button
              onClick={onNewJob}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#fff', background: 'var(--blue)', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer' }}
            >
              <Plus size={12} /> New Job
            </button>
          }
        >
          {jobsFetching ? 'Jobs' : `Jobs · ${jobs.length}`}
        </SectionLabel>
        {jobsFetching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: 54, borderRadius: 11, background: 'var(--bg-card-2)', opacity: 1 - i * 0.2 }} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0', fontSize: 13 }}>No jobs found for this customer</div>
        ) : (
          jobs.map(j => (
            <ListRow
              key={j.id}
              accent="var(--amber)"
              icon={<ClipboardList size={14} style={{ color: 'var(--amber)' }} />}
              title={j.title}
              meta={`${j.serviceAddress ?? j.customerAddress ?? ''} · ${new Date(j.createdAt).toLocaleDateString()}`}
              badge={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <RescheduleBadge state={j.rescheduleState} size="sm" />
                  <Badge tone={JOB_TONE[j.status] ?? 'neutral'}>{j.status.replace(/_/g, ' ')}</Badge>
                </span>
              }
              onClick={() => window.dispatchEvent(new CustomEvent('open-job-detail', { detail: j }))}
            />
          ))
        )}
      </div>
    </div>
  )
}
