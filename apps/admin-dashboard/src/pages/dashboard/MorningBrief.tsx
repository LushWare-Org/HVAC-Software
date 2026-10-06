/**
 * The day sheet: what needs attention today, worked top to bottom like a
 * dispatcher's morning sheet. Facts come from exact checks on live data; the
 * assistant only orders them and adds the "why". Theme colours only.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useBrief, useRefreshBrief, type Brief, type BriefFact, type BriefSeverity } from '../../hooks/useBrief'
import { askAssistant } from '../../lib/assistant'
import { formatMoney } from '../../lib/format'

const URGENCY: Record<BriefSeverity, { label: string; tone: string }> = {
  urgent: { label: 'Now', tone: 'var(--red)' },
  important: { label: 'Today', tone: 'var(--amber)' },
  info: { label: 'This week', tone: 'var(--blue)' },
}

/** Where each kind of fact is dealt with, named for what the person will do there. */
const OPEN_LABEL: Record<string, string> = {
  'late-jobs': 'Open board',
  'stuck-jobs': 'Open board',
  'unassigned-soon': 'Assign',
  'overbooked-tomorrow': 'Rebalance',
  'overdue-invoices': 'View invoices',
  'stale-quotes': 'View quotes',
  'waiting-leads': 'View leads',
  'pending-technicians': 'Review',
}

const CHECK_NAMES: Record<string, string> = {
  lateJobs: 'late jobs', stuckJobs: 'stuck jobs', unassignedSoon: 'unassigned jobs', overbookedTomorrow: 'technician limits',
  overdueInvoices: 'overdue invoices', staleQuotes: 'unanswered quotes', waitingLeads: 'new leads', pendingTechnicians: 'technician approvals',
  yesterday: "yesterday's totals",
}

const FIRST_ROWS = 4

function leaf(date: string) {
  // Noon UTC keeps the calendar day stable whatever the viewer's own zone.
  const d = new Date(`${date}T12:00:00Z`)
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    day: d.getUTCDate(),
    month: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
  }
}

function yesterdayLine(y: Brief['yesterday']): string {
  if (!y.date) return ''
  const parts = [`${y.jobsCompleted} ${y.jobsCompleted === 1 ? 'job' : 'jobs'} done`]
  if (y.jobsCancelled) parts.push(`${y.jobsCancelled} cancelled`)
  if (y.collected !== undefined) parts.push(`${formatMoney(y.collected, { decimals: 0 })} collected`)
  return `Yesterday: ${parts.join(', ')}.`
}

function clockTime(iso: string, timeZone: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone })
  } catch {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
}

function Row({ fact }: { fact: BriefFact }) {
  const u = URGENCY[fact.severity]
  const examples = (fact.items ?? []).slice(0, 3)
  return (
    <li className="brief-row" style={{ ['--tone' as string]: u.tone }}>
      <span className="brief-tag">{u.label}</span>
      <div className="brief-body">
        <p className="brief-title">{fact.title}</p>
        <p className="brief-why">{fact.why ?? fact.detail}</p>
        {examples.length > 0 && (
          <ul className="brief-examples">
            {examples.map(i => <li key={i.id}>{i.label}{i.meta ? <span>{i.meta}</span> : null}</li>)}
          </ul>
        )}
      </div>
      <div className="brief-actions">
        {fact.action && (
          <button type="button" className="ops-btn ops-btn-sm" onClick={() => askAssistant(fact.action!.label)} title={`Opens the assistant with: ${fact.action.label}`}>
            Ask the assistant
          </button>
        )}
        {fact.href && <Link to={fact.href} className="ops-btn ops-btn-sm">{OPEN_LABEL[fact.id] ?? 'Open'}</Link>}
      </div>
    </li>
  )
}

export default function MorningBrief() {
  const { data: brief, isLoading, isError, refetch } = useBrief()
  const refresh = useRefreshBrief()
  const [showAll, setShowAll] = useState(false)

  if (isLoading) {
    return (
      <section className="ops-panel brief" aria-label="Today's sheet" aria-busy="true">
        <div className="brief-head">
          <div className="brief-leaf ops-skeleton" style={{ height: 76 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="ops-skeleton" style={{ height: 22, width: '60%' }} />
            <div className="ops-skeleton" style={{ height: 14, width: '40%' }} />
          </div>
        </div>
      </section>
    )
  }

  if (isError || !brief) {
    return (
      <section className="ops-panel brief" aria-label="Today's sheet">
        <p className="brief-note">Today's sheet didn't load. The checks run on the analytics service.</p>
        <div><button type="button" className="ops-btn ops-btn-sm" onClick={() => refetch()}>Try again</button></div>
      </section>
    )
  }

  const d = leaf(brief.date)
  const rows = showAll ? brief.facts : brief.facts.slice(0, FIRST_ROWS)
  const hidden = brief.facts.length - rows.length
  const failed = brief.failedChecks.map(c => CHECK_NAMES[c] ?? c)

  return (
    <section className="ops-panel brief" aria-labelledby="brief-headline">
      <header className="brief-head">
        <div className="brief-leaf" aria-label={`${d.weekday} ${d.day} ${d.month}`}>
          <span className="brief-leaf-wd">{d.weekday}</span>
          <span className="brief-leaf-day">{d.day}</span>
          <span className="brief-leaf-mo">{d.month}</span>
        </div>
        <div className="brief-headline-wrap">
          <h2 id="brief-headline" className="brief-headline">{brief.headline}</h2>
          {yesterdayLine(brief.yesterday) && <p className="brief-yesterday">{yesterdayLine(brief.yesterday)}</p>}
        </div>
        <button
          type="button" className="ops-btn ops-btn-sm brief-refresh"
          onClick={() => refresh.mutate()} disabled={refresh.isPending}
          aria-label="Check again now"
        >
          <RefreshCw size={14} aria-hidden="true" className={refresh.isPending ? 'animate-spin' : undefined} />
          <span className="brief-refresh-text">{refresh.isPending ? 'Checking…' : 'Check again'}</span>
        </button>
      </header>

      {brief.facts.length === 0 ? (
        <p className="brief-clear">Nothing is late, unassigned, overdue or waiting on you. New issues show here as they come up.</p>
      ) : (
        <ul className="brief-rows">{rows.map(f => <Row key={f.id} fact={f} />)}</ul>
      )}

      {(hidden > 0 || showAll) && brief.facts.length > FIRST_ROWS && (
        <button type="button" className="brief-more" onClick={() => setShowAll(s => !s)} aria-expanded={showAll}>
          {showAll ? 'Show fewer' : `Show ${hidden} more`}
        </button>
      )}

      <footer className="brief-foot">
        <span>
          {brief.usedAi ? 'Ordered by the assistant from live checks.' : 'Listed by urgency from live checks.'}{' '}
          Updated {clockTime(brief.generatedAt, brief.timezone)}.
        </span>
        {failed.length > 0 && <span className="brief-failed">Couldn't check {failed.join(', ')} this time.</span>}
      </footer>
    </section>
  )
}
