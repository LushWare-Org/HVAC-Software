import { createPortal } from 'react-dom'
import { MapPin, X } from 'lucide-react'
import { useSetMyVisitLocation } from '../../hooks/useShareLocation'
import VisitLocationPicker from '../../components/VisitLocationPicker'

/** Put one of my visits on the map, so the technician can find it. */
export default function MarkLocationModal({ job, onClose }: {
  job: { id: string; title: string; serviceLatitude?: number | string | null; serviceLongitude?: number | string | null }
  onClose: () => void
}) {
  const save = useSetMyVisitLocation()
  const lat = job.serviceLatitude != null ? Number(job.serviceLatitude) : null
  const lng = job.serviceLongitude != null ? Number(job.serviceLongitude) : null
  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Where is this visit?</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--t3)' }}>{job.title}. Drop a pin on the exact spot.</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <VisitLocationPicker
            initial={{ lat, lng }}
            saving={save.isPending}
            onSave={(la, ln) => save.mutate({ jobId: job.id, lat: la, lng: ln }, { onSuccess: onClose })}
          />
          {save.isError && (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--red)' }}>
              {(save.error as any)?.response?.data?.message ?? "That didn't save. Please try again."}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
