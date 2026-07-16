/**
 * HouseIssuesAlert — the one shared "something needs attention" surface for
 * Housing Scheme issue reports (thermostat error codes etc.), reused on the
 * Dashboard (company-wide), Project detail, and the Houses tab (project-scoped).
 * Same visual language everywhere so it's instantly recognizable, and stays
 * visible until every listed issue is marked resolved — this is deliberately
 * not dismissible.
 */
import { useNavigate } from 'react-router-dom'
import { MessageSquareWarning, ChevronRight, Home } from 'lucide-react'
import { useOpenHouseIssues, ISSUE_STATUS_META, type OpenHouseIssue } from '../pages/projects/housesApi'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export default function HouseIssuesAlert({ projectId, maxRows = 5 }: { projectId?: string; maxRows?: number }) {
  const { data } = useOpenHouseIssues()
  const navigate = useNavigate()

  const issues = (data ?? []).filter((i) => !projectId || i.projectId === projectId)
  if (issues.length === 0) return null

  const shown = issues.slice(0, maxRows)
  const overflow = issues.length - shown.length

  return (
    <div
      role="alert"
      style={{
        marginBottom: 16, borderRadius: 'var(--r-lg)', overflow: 'hidden',
        background: 'var(--bg-card)', border: '1px solid var(--bd)', borderLeft: '4px solid var(--red)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px 10px' }}>
        <span style={{
          width: 30, height: 30, borderRadius: 9, background: 'var(--red-dim)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MessageSquareWarning size={15} style={{ color: 'var(--red)' }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
            {issues.length} open issue{issues.length === 1 ? '' : 's'} reported by homeowners
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>
            Stays here until each one is marked resolved.
          </p>
        </div>
      </div>

      <div>
        {shown.map((issue) => (
          <IssueRow key={issue.id} issue={issue} onClick={() => navigate(`/projects/${issue.projectId}?house=${issue.houseId}`)} />
        ))}
      </div>

      {overflow > 0 && (
        <div style={{ padding: '8px 18px 12px', fontSize: 11.5, color: 'var(--t4)' }}>
          +{overflow} more
        </div>
      )}
    </div>
  )
}

function IssueRow({ issue, onClick }: { issue: OpenHouseIssue; onClick: () => void }) {
  const meta = ISSUE_STATUS_META[issue.status]
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        padding: '9px 18px', borderTop: '1px solid var(--bd)', background: 'none',
        borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      <Home size={12} style={{ color: 'var(--t4)', flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>
          {issue.errorCode ? `Error ${issue.errorCode}` : 'Issue reported'}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>
          {' — '}{issue.houseLabel} · {issue.projectName} · {issue.reportedByName}
        </span>
      </span>
      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: meta.dim, color: meta.color, flexShrink: 0 }}>
        {meta.label}
      </span>
      <span style={{ fontSize: 10.5, color: 'var(--t4)', flexShrink: 0, minWidth: 50, textAlign: 'right' }}>
        {timeAgo(issue.createdAt)}
      </span>
      <ChevronRight size={12} style={{ color: 'var(--t4)', flexShrink: 0 }} />
    </button>
  )
}
