import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, Loader2 } from 'lucide-react'
import { useCreateInventoryItem } from '../../hooks/useInventory'
import { useToast } from '../../contexts/ToastContext'
import type { ItemCategory } from '../../types/api'

interface AddInventoryItemModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'

export default function AddInventoryItemModal({ isOpen, onClose }: AddInventoryItemModalProps) {
  const { showError, showSuccess } = useToast()
  const [error, setError] = useState('')
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ItemCategory>('PART')
  const [unit, setUnit] = useState('each')
  const [reorderPoint, setReorderPoint] = useState(5)
  const [reorderQty, setReorderQty] = useState(10)

  const createItem = useCreateInventoryItem()

  if (!isOpen) return null

  const resetForm = () => {
    setSku('')
    setName('')
    setDescription('')
    setCategory('PART')
    setUnit('each')
    setReorderPoint(5)
    setReorderQty(10)
    setError('')
  }

  const handleSubmit = () => {
    setError('')
    if (!sku.trim()) {
      setError('SKU is required.')
      showError('SKU is required.')
      return
    }
    if (!name.trim()) {
      setError('Name is required.')
      showError('Name is required.')
      return
    }

    createItem.mutate(
      {
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        unit: unit || undefined,
        reorderPoint,
        reorderQty,
      },
      {
        onSuccess: () => {
          showSuccess('Inventory item created successfully.', 'Item Added')
          resetForm()
          onClose()
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message ?? 'Failed to create inventory item.'
          setError(message)
          showError(message)
        },
      },
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 admin-modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl admin-modal-box" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            <h2 className="text-xl font-bold">Add Inventory Item</h2>
            <p className="text-blue-100 text-sm mt-0.5">Create a new item in your inventory</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">SKU <span className="text-red-500">*</span></label>
              <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. FLT-001" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HVAC Air Filter" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." rows={2} className={inputClass} style={{ resize: 'vertical' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Category <span className="text-red-500">*</span></label>
              <select value={category} onChange={e => setCategory(e.target.value as ItemCategory)} className={inputClass}>
                <option value="PART">Part</option>
                <option value="MATERIAL">Material</option>
                <option value="TOOL">Tool</option>
                <option value="CONSUMABLE">Consumable</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} className={inputClass}>
                <option value="each">Each</option>
                <option value="ft">Feet</option>
                <option value="gallon">Gallon</option>
                <option value="box">Box</option>
                <option value="roll">Roll</option>
                <option value="set">Set</option>
                <option value="hour">Hour</option>
                <option value="lb">Pound</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Reorder Point</label>
              <input type="number" min={0} value={reorderPoint} onChange={e => setReorderPoint(parseInt(e.target.value) || 0)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Reorder Qty</label>
              <input type="number" min={0} value={reorderQty} onChange={e => setReorderQty(parseInt(e.target.value) || 0)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createItem.isPending}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors border-0 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {createItem.isPending && <Loader2 size={14} className="animate-spin" />}
            {createItem.isPending ? 'Creating...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
