import { useState } from 'react'
import { Plus, Star, Trash2, Loader2, FileText, DollarSign, FileSignature } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import {
  useDocumentTemplates, useDeleteDocumentTemplate, useSetDefaultTemplate,
  type DocumentType, type DocumentTemplate,
} from './documentTemplatesApi'
import TemplateEditorModal from './TemplateEditorModal'

const SECTIONS: { key: DocumentType; label: string; icon: React.ElementType }[] = [
  { key: 'INVOICE', label: 'Invoices', icon: FileText },
  { key: 'QUOTE', label: 'Quotes', icon: DollarSign },
  { key: 'AGREEMENT', label: 'Agreements', icon: FileSignature },
]

export default function DocumentTemplatesTab() {
  const [section, setSection] = useState<DocumentType>('INVOICE')
  const [editing, setEditing] = useState<DocumentTemplate | 'new' | null>(null)
  const templatesQ = useDocumentTemplates(section)
  const deleteMut = useDeleteDocumentTemplate()
  const setDefaultMut = useSetDefaultTemplate()
  const { showSuccess, showError } = useToast()

  const templates = templatesQ.data ?? []

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header">
        <div style={{ display: 'flex', gap: 6 }}>
          {SECTIONS.map(s => {
            const Icon = s.icon
            const active = section === s.key
            return (
              <button key={s.key} className="btn btn-sm" onClick={() => setSection(s.key)}
                style={active
                  ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }
                  : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                <Icon size={13} /> {s.label}
              </button>
            )
          })}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Plus size={12} /> New template
        </button>
      </div>

      {templatesQ.isLoading ? (
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
        </div>
      ) : templates.length === 0 ? (
        <div style={{ padding: '36px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No templates yet</p>
          <p style={{ fontSize: 12, color: 'var(--t4)', margin: '4px 0 0' }}>
            Without one, {SECTIONS.find(s => s.key === section)?.label.toLowerCase()} use the default T&amp;S CRM look.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, padding: 16 }}>
          {templates.map(t => (
            <div key={t.id} className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <button onClick={() => setEditing(t)} style={{
                  fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'left',
                }}>
                  {t.name}
                </button>
                {t.isDefault && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--amber)', background: 'var(--amber-dim)', padding: '2px 7px', borderRadius: 999 }}>
                    <Star size={9} /> Default
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--t4)' }}>{t.mode === 'BUILDER' ? 'Custom design' : 'Uploaded letterhead'}</span>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {!t.isDefault && (
                  <button className="btn btn-secondary btn-sm" disabled={setDefaultMut.isPending}
                    onClick={() => setDefaultMut.mutate(t.id, {
                      onSuccess: () => showSuccess(`${t.name} is now the default`, 'Default set'),
                      onError: (e: any) => showError(e?.response?.data?.message ?? 'Could not set default', 'Failed'),
                    })}>
                    <Star size={11} /> Make default
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" disabled={deleteMut.isPending}
                  onClick={() => deleteMut.mutate(t.id, {
                    onError: (e: any) => showError(e?.response?.data?.message ?? 'Could not delete this template', 'Delete failed'),
                  })}>
                  <Trash2 size={11} style={{ color: 'var(--red)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TemplateEditorModal
          documentType={section}
          template={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
