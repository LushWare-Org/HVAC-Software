/**
 * "Ask the customer where it is": sends them a link (in-app message, email and
 * push) to drop a pin for the visit. Says plainly which ways reached them.
 */
import { useState } from 'react'
import { Copy, Loader2, MapPinned } from 'lucide-react'
import { useRequestJobLocation, type ReachChannel, type ReachResult } from '../hooks/useJobs'

const WORD: Record<ReachChannel, string> = { message: 'In-app message', email: 'Email', push: 'Push' }
const WHY: Partial<Record<ReachResult, string>> = {
  'no-email': 'no email on file',
  'no-device': 'notifications not turned on',
  failed: 'failed',
}

export default function RequestLocationButton({ jobId, compact }: { jobId: string; compact?: boolean }) {
  const ask = useRequestJobLocation()
  const [copied, setCopied] = useState(false)
  const out = ask.data

  const entries = out ? (Object.entries(out.results) as [ReachChannel, ReachResult][]) : []
  const sent = entries.filter(([, r]) => r === 'sent').map(([c]) => WORD[c])
  // "with-message": the push goes out with the in-app message, so it isn't a failure.
  const missed = entries.filter(([, r]) => r !== 'sent' && r !== 'with-message').map(([c, r]) => `${WORD[c]}: ${WHY[r] ?? r}`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={ask.isPending}
        onClick={() => ask.mutate({ jobId, channels: ['message', 'email', 'push'] })}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        {ask.isPending ? <Loader2 size={12} className="spin" /> : <MapPinned size={12} />}
        {out ? 'Ask again' : compact ? 'Ask customer for location' : 'Ask the customer to mark it on a map'}
      </button>
      {out && (
        <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5 }}>
          {sent.length ? `Sent: ${sent.join(', ')}.` : 'It did not reach them.'}
          {missed.length ? ` Not sent: ${missed.join('; ')}.` : ''}{' '}
          <button
            type="button"
            onClick={() => { void navigator.clipboard?.writeText(out.url); setCopied(true) }}
            style={{ all: 'unset', cursor: 'pointer', color: 'var(--blue)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}
          >
            <Copy size={11} /> {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>
      )}
      {ask.isError && (
        <div style={{ fontSize: 11.5, color: 'var(--red)' }}>
          {(ask.error as any)?.response?.data?.message ?? 'Could not send the request.'}
        </div>
      )}
    </div>
  )
}
