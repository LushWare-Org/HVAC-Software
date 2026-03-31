import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, Loader2 } from 'lucide-react'
import { useInventoryItems, useLocations, useIntake } from '../../hooks/useInventory'
import { useToast } from '../../contexts/ToastContext'

interface IntakeStockModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'

export default function IntakeStockModal({ isOpen, onClose }: IntakeStockModalProps) {
  const { showError, showSuccess } = useToast()
  const [error, setError] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [toLocationId, setToLocationId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const itemsQuery = useInventoryItems({ limit: 200 })
  const locationsQuery = useLocations()
  const intake = useIntake()

  const items = itemsQuery.data?.data ?? []
  const locations = locationsQuery.data ?? []

  // Default to first warehouse location
  const warehouseDefault = locations.find(l => l.type === 'WAREHOUSE')

  if (!isOpen) return null

  const resetForm = () => {
    setInventoryItemId('')
    setToLocationId('')
    setQuantity(1)
    setNotes('')
    setError('')
  }

  const handleSubmit = () => {
    setError('')
    if (!inventoryItemId) {
      setError('Please select an item.')
      showError('Please select an item.')
      return
    }
    const locationId = toLocationId || warehouseDefault?.id
    if (!locationId) {
      setError('Please select a location.')
      showError('Please select a location.')
      return
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than 0.')
      showError('Quantity must be greater than 0.')
      return
    }

    intake.mutate(
      {
        inventoryItemId,
        toLocationId: locationId,
        quantity,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          showSuccess('Stock received successfully.', 'Stock Received')
          resetForm()
          onClose()
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message ?? 'Failed to receive stock.'
          setError(message)
          showError(message)
        },
      },
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 admin-modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl admin-modal-box" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            <h2 className="text-xl font-bold">Receive Stock</h2>
            <p className="text-emerald-100 text-sm mt-0.5">Add incoming stock to a location</p>
          </div>
          <button onClick={onClose} className="text-emerald-100 hover:text-white p-1 hover:bg-emerald-500 rounded-lg cursor-pointer bg-transparent border-0">
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
            <label className="block text-xs font-semibold text-gray-400 uppercase">Item <span className="text-red-500">*</span></label>
            <select value={inventoryItemId} onChange={e => setInventoryItemId(e.target.value)} className={inputClass}>
              <option value="">Select an item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.sku} — {item.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase">Location <span className="text-red-500">*</span></label>
            <select value={toLocationId || warehouseDefault?.id || ''} onChange={e => setToLocationId(e.target.value)} className={inputClass}>
              <option value="">Select a location...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} ({loc.type.toLowerCase()})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase">Quantity <span className="text-red-500">*</span></label>
            <input type="number" min={1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} className={inputClass} />
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
            disabled={intake.isPending}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors border-0 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {intake.isPending && <Loader2 size={14} className="animate-spin" />}
            {intake.isPending ? 'Receiving...' : 'Receive Stock'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
