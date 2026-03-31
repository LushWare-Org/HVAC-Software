import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'
import { useInventoryItems, useCreatePurchaseOrder } from '../../hooks/useInventory'
import { useToast } from '../../contexts/ToastContext'

interface CreatePurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
}

interface POLineItem {
  inventoryItemId: string
  qty: number
  unitCost: number
}

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'

export default function CreatePurchaseOrderModal({ isOpen, onClose }: CreatePurchaseOrderModalProps) {
  const { showError, showSuccess } = useToast()
  const [error, setError] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<POLineItem[]>([
    { inventoryItemId: '', qty: 1, unitCost: 0 },
  ])

  const itemsQuery = useInventoryItems({ limit: 200 })
  const createPO = useCreatePurchaseOrder()

  const items = itemsQuery.data?.data ?? []

  if (!isOpen) return null

  const addLineItem = () => setLineItems(prev => [...prev, { inventoryItemId: '', qty: 1, unitCost: 0 }])
  const removeLineItem = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i))
  const updateLineItem = (i: number, field: keyof POLineItem, value: string | number) =>
    setLineItems(prev => prev.map((li, idx) => (idx === i ? { ...li, [field]: value } : li)))

  const total = lineItems.reduce((sum, li) => sum + li.qty * li.unitCost, 0)

  const resetForm = () => {
    setSupplierName('')
    setNotes('')
    setLineItems([{ inventoryItemId: '', qty: 1, unitCost: 0 }])
    setError('')
  }

  const handleSubmit = () => {
    setError('')
    if (!supplierName.trim()) {
      setError('Supplier name is required.')
      showError('Supplier name is required.')
      return
    }
    const validItems = lineItems.filter(li => li.inventoryItemId && li.qty > 0)
    if (validItems.length === 0) {
      setError('At least one line item with an item and quantity is required.')
      showError('At least one valid line item is required.')
      return
    }

    createPO.mutate(
      {
        supplierName: supplierName.trim(),
        items: validItems.map(li => ({
          inventoryItemId: li.inventoryItemId,
          qty: li.qty,
          unitCost: li.unitCost,
        })),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          showSuccess('Purchase order created successfully.', 'PO Created')
          resetForm()
          onClose()
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message ?? 'Failed to create purchase order.'
          setError(message)
          showError(message)
        },
      },
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 admin-modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl admin-modal-box" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            <h2 className="text-xl font-bold">Create Purchase Order</h2>
            <p className="text-blue-100 text-sm mt-0.5">Order inventory from a supplier</p>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white p-1 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase">Supplier Name <span className="text-red-500">*</span></label>
            <input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="e.g. HVAC Parts Wholesale" className={inputClass} />
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Line Items <span className="text-red-500">*</span></label>
              <button onClick={addLineItem} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                <Plus size={12} /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2 text-[11px] font-semibold text-gray-400 uppercase px-1">
                <span>Item</span>
                <span>Qty</span>
                <span>Unit Cost</span>
                <span></span>
              </div>

              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
                  <select
                    value={li.inventoryItemId}
                    onChange={e => updateLineItem(i, 'inventoryItemId', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select item...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.sku} — {item.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={li.qty}
                    onChange={e => updateLineItem(i, 'qty', parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={li.unitCost}
                    onChange={e => updateLineItem(i, 'unitCost', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                    placeholder="0.00"
                  />
                  <button
                    onClick={() => removeLineItem(i)}
                    disabled={lineItems.length === 1}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors border-0 bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-500">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} className={inputClass} style={{ resize: 'vertical' }} />
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createPO.isPending}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors border-0 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {createPO.isPending && <Loader2 size={14} className="animate-spin" />}
            {createPO.isPending ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
