/**
 * ShareLocation — public page from the "where should we come?" link.
 * No login: the signed token in the URL opens this one visit only.
 */
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, MapPin } from 'lucide-react'
import { useShareLocation, useVisitByLocationToken } from '../hooks/useShareLocation'
import VisitLocationPicker from '../components/VisitLocationPicker'

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null

export default function ShareLocation() {
  const { token } = useParams<{ token: string }>()
  const { data: visit, isLoading, isError } = useVisitByLocationToken(token)
  const share = useShareLocation()
  const [done, setDone] = useState(false)

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #0f1117)', padding: 16 }}>
      <div className="card" style={{ width: 560, maxWidth: '100%', padding: 24 }}>{children}</div>
    </div>
  )

  if (isLoading) return shell(<div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={26} className="spin" style={{ color: 'var(--t3)' }} /></div>)

  if (isError || !visit) {
    return shell(
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <AlertCircle size={36} style={{ color: 'var(--red)', marginBottom: 12 }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>This link is no longer valid</h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', marginTop: 8, lineHeight: 1.6 }}>
          Links work for 14 days. Sign in to your portal to set the location on your visit, or call our office.
        </p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Go to portal</Link>
      </div>,
    )
  }

  if (done) {
    return shell(
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <CheckCircle2 size={40} style={{ color: 'var(--green)', marginBottom: 12 }} />
        <h1 style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Thanks, we have your location</h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', marginTop: 8, lineHeight: 1.6 }}>
          Our technician will come to the pin you set for {visit.title} ({visit.jobNumber}). You can close this page.
        </p>
      </div>,
    )
  }

  if (!visit.open) {
    return shell(
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <CheckCircle2 size={36} style={{ color: 'var(--t3)', marginBottom: 12 }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>This visit is already done</h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', marginTop: 8 }}>There's nothing more to do here.</p>
      </div>,
    )
  }

  return shell(
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
        <MapPin size={22} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Where should we come?</h1>
          <p style={{ fontSize: 14, color: 'var(--t3)', margin: '6px 0 0', lineHeight: 1.55 }}>
            {visit.title} ({visit.jobNumber}){when(visit.scheduledStart) ? ` · ${when(visit.scheduledStart)}` : ''}.
            {visit.address ? ` We have "${visit.address}".` : ''} Drop a pin on the exact spot so the technician finds you first time.
          </p>
        </div>
      </div>
      <VisitLocationPicker
        initial={{ lat: visit.lat, lng: visit.lng }}
        saving={share.isPending}
        onSave={(lat, lng) => token && share.mutate({ token, lat, lng }, { onSuccess: () => setDone(true) })}
      />
      {share.isError && (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {(share.error as any)?.response?.data?.message ?? "That didn't save. Please try again."}
        </p>
      )}
    </>,
  )
}
