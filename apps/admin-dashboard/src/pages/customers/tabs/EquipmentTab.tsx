/**
 * Equipment tab — its own tab per the redesign brief (not folded into Overview).
 */
import { Wrench, Plus, Trash2 } from 'lucide-react'
import EquipmentConsumables from '../EquipmentConsumables'
import { Field, SectionLabel, patchById, sectionCardStyle } from '../shared'

interface EquipmentItem {
  id: number | string; type: string; brand: string; model: string
  serial: string; install: string; warranty: string; manualUrl?: string
}

export default function EquipmentTab({
  customerId, isEditMode, equipment, onEquipmentChange, equipmentQueryData,
}: {
  customerId: string
  isEditMode: boolean
  equipment: EquipmentItem[]
  onEquipmentChange: (updater: (prev: EquipmentItem[]) => EquipmentItem[]) => void
  equipmentQueryData: Array<{ id: string }> | undefined
}) {
  return (
    <div style={sectionCardStyle}>
      <SectionLabel
        icon={Wrench}
        action={isEditMode && (
          <button
            onClick={() => onEquipmentChange(prev => [
              ...prev,
              { id: Date.now(), type: 'Boiler', brand: '', model: '', serial: '', install: '', warranty: '', manualUrl: '' },
            ])}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Plus size={13} /> Add Equipment
          </button>
        )}
      >
        Equipment records
      </SectionLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {equipment.map((eq, idx) => (
          <div key={eq.id} style={{ border: '1px solid var(--bd)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={14} style={{ color: 'var(--blue)' }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>
                  {eq.brand || eq.model ? `${eq.brand} ${eq.model}`.trim() : `Equipment ${idx + 1}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isEditMode ? (
                  <select
                    value={eq.type}
                    onChange={e => patchById(onEquipmentChange, eq.id, { type: e.target.value })}
                    style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 6px', border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)' }}
                  >
                    <option>Boiler</option>
                    <option>AC Unit</option>
                    <option>Heat Pump</option>
                    <option>Electrical Panel</option>
                    <option>Other</option>
                  </select>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)' }}>{eq.type}</span>
                )}
                {isEditMode && (
                  <button
                    onClick={() => onEquipmentChange(prev => prev.filter(x => x.id !== eq.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label="Brand" name="brand" value={eq.brand} isEdit={isEditMode}
                onChange={e => patchById(onEquipmentChange, eq.id, { brand: e.target.value })} />
              <Field label="Model" name="model" value={eq.model} isEdit={isEditMode}
                onChange={e => patchById(onEquipmentChange, eq.id, { model: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <Field label="Serial No." name="serial" value={eq.serial} isEdit={isEditMode}
                onChange={e => patchById(onEquipmentChange, eq.id, { serial: e.target.value })} />
              <Field label="Install Date" name="install" value={eq.install} type="date" isEdit={isEditMode}
                onChange={e => patchById(onEquipmentChange, eq.id, { install: e.target.value })} />
              <Field label="Warranty Until" name="warranty" value={eq.warranty} type="date" isEdit={isEditMode}
                onChange={e => patchById(onEquipmentChange, eq.id, { warranty: e.target.value })} />
            </div>
            <div style={{ marginTop: 10 }}>
              <Field label="Manual URL" name="manualUrl" value={eq.manualUrl ?? ''} isEdit={isEditMode} placeholder="https://…/manual.pdf"
                onChange={e => patchById(onEquipmentChange, eq.id, { manualUrl: e.target.value })} />
            </div>
            {customerId && equipmentQueryData?.some(d => d.id === eq.id) && (
              <EquipmentConsumables customerId={customerId} equipmentId={String(eq.id)} />
            )}
          </div>
        ))}
        {equipment.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', textAlign: 'center' }}>
            <Wrench size={36} style={{ color: 'var(--t4)', opacity: 0.4, marginBottom: 10 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No equipment records</p>
            <p style={{ fontSize: 11.5, color: 'var(--t4)', marginTop: 4 }}>
              Add boilers, AC units, panels and other installed equipment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
