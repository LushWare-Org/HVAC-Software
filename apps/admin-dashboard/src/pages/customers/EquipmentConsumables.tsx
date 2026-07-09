/**
 * EquipmentConsumables — staff editor for an equipment item's filters/consumables.
 * Rendered inside the Equipment tab of CustomerDetailsSidebar (per equipment card).
 */
import { useState } from 'react'
import { Wind, Plus, Trash2, Loader2, RefreshCw } from 'lucide-react'
import {
  useEquipmentConsumables, useAddConsumable, useUpdateConsumable, useDeleteConsumable,
  type ConsumableRecord, type ConsumableInput,
} from '../../hooks/useEquipment'

const EMPTY: ConsumableInput = {
  kind: 'FILTER', partNumber: '', description: '', sizeSpec: '', rating: '',
  intervalDays: 90, purchaseUrl: '',
}

function dueText(c: ConsumableRecord): { text: string; cls: string } {
  if (c.dueInDays == null) return { text: 'no schedule', cls: 'text-gray-400' }
  if (c.dueInDays < 0) return { text: `overdue ${Math.abs(c.dueInDays)}d`, cls: 'text-red-500 font-700' }
  if (c.dueInDays <= 14) return { text: `due in ${c.dueInDays}d`, cls: 'text-amber-600 font-700' }
  return { text: `due in ${c.dueInDays}d`, cls: 'text-emerald-600' }
}

export default function EquipmentConsumables({
  customerId, equipmentId,
}: {
  customerId: string
  equipmentId: string
}) {
  const { data: consumables = [], isLoading } = useEquipmentConsumables(customerId, equipmentId)
  const addMut = useAddConsumable()
  const updateMut = useUpdateConsumable()
  const deleteMut = useDeleteConsumable()

  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<ConsumableInput>(EMPTY)

  const save = () => {
    if (!form.partNumber?.trim() && !form.description?.trim()) return
    addMut.mutate(
      { customerId, equipmentId, item: { ...form, intervalDays: Number(form.intervalDays) || 90 } },
      { onSuccess: () => { setAdding(false); setForm(EMPTY) } },
    )
  }

  const inputCls = 'w-full text-xs rounded px-2 py-1.5 border border-gray-300 bg-white'

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-700 text-[var(--t4)] uppercase flex items-center gap-1.5">
          <Wind size={11} /> Filters &amp; consumables
        </span>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[11px] font-600 text-[var(--blue-light)] hover:underline flex items-center gap-1"
          >
            <Plus size={11} /> Add
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-xs text-gray-400">Loading…</div>
      ) : (
        <>
          {consumables.map(c => {
            const due = dueText(c)
            return (
              <div key={c.id} className="flex items-center gap-2 py-1.5 text-xs">
                <span className="font-600 text-[var(--t1)]">
                  {[c.partNumber, c.sizeSpec, c.rating].filter(Boolean).join(' ') || c.description || c.kind}
                </span>
                <span className="text-[var(--t4)]">every {c.intervalDays}d</span>
                <span className={due.cls}>{due.text}</span>
                <span className="flex-1" />
                <button
                  title="Mark replaced today"
                  className="text-gray-400 hover:text-emerald-600 p-0.5"
                  onClick={() => updateMut.mutate({
                    customerId, equipmentId, id: c.id,
                    item: { lastReplacedAt: new Date().toISOString() },
                  })}
                  disabled={updateMut.isPending}
                >
                  <RefreshCw size={12} />
                </button>
                <button
                  title="Remove"
                  className="text-gray-400 hover:text-red-500 p-0.5"
                  onClick={() => deleteMut.mutate({ customerId, equipmentId, id: c.id })}
                  disabled={deleteMut.isPending}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
          {consumables.length === 0 && !adding && (
            <div className="text-xs text-gray-400">
              None registered — add the filter spec so the customer sees it in their portal.
            </div>
          )}
        </>
      )}

      {adding && (
        <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-white space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} placeholder="Part number (X6673)" value={form.partNumber ?? ''}
              onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} />
            <input className={inputCls} placeholder="Description (Healthy Climate HCF20-11)" value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <input className={inputCls} placeholder="Size (20x25x5)" value={form.sizeSpec ?? ''}
              onChange={e => setForm(f => ({ ...f, sizeSpec: e.target.value }))} />
            <input className={inputCls} placeholder="Rating (MERV 11)" value={form.rating ?? ''}
              onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} />
            <input className={inputCls} type="number" min={1} max={3650} placeholder="Interval days (90)"
              value={form.intervalDays ?? 90}
              onChange={e => setForm(f => ({ ...f, intervalDays: Number(e.target.value) }))} />
            <input className={inputCls} placeholder="Purchase URL (optional)" value={form.purchaseUrl ?? ''}
              onChange={e => setForm(f => ({ ...f, purchaseUrl: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="text-xs font-600 text-gray-500 px-2 py-1" onClick={() => { setAdding(false); setForm(EMPTY) }}>
              Cancel
            </button>
            <button
              className="text-xs font-600 text-white bg-[var(--blue-light)] rounded px-3 py-1 disabled:opacity-50 flex items-center gap-1"
              onClick={save}
              disabled={addMut.isPending || (!form.partNumber?.trim() && !form.description?.trim())}
            >
              {addMut.isPending && <Loader2 size={11} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
