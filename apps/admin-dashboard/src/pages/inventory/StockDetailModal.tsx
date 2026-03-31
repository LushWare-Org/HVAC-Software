import { createPortal } from 'react-dom'
import { X, Warehouse, Truck } from 'lucide-react'
import { useItemStockLevels, decimalToNumber } from '../../hooks/useInventory'
import type { InventoryItem } from '../../types/api'

interface StockDetailModalProps {
  item: InventoryItem | null
  onClose: () => void
}

function Skeleton({ h = 14 }: { h?: number }) {
  return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

export default function StockDetailModal({ item, onClose }: StockDetailModalProps) {
  const stockQuery = useItemStockLevels(item?.id)
  const levels = stockQuery.data ?? []

  if (!item) return null

  const totalQty = levels.reduce((sum, sl) => sum + decimalToNumber(sl.quantity), 0)
  const totalReserved = levels.reduce((sum, sl) => sum + decimalToNumber(sl.reservedQty), 0)
  const totalAvailable = totalQty - totalReserved

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 admin-modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl admin-modal-box" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            <h2 className="text-xl font-bold">{item.name}</h2>
            <p className="text-blue-100 text-sm mt-0.5">SKU: {item.sku} &middot; {item.category.toLowerCase()} &middot; {item.unit}</p>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white p-1 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Location</th>
                  <th style={{ textAlign: 'left' }}>Type</th>
                  <th style={{ textAlign: 'left' }}>Quantity</th>
                  <th style={{ textAlign: 'left' }}>Reserved</th>
                  <th style={{ textAlign: 'left' }}>Available</th>
                </tr>
              </thead>
              <tbody>
                {stockQuery.isLoading && Array.from({ length: 3 }).map((_, i) => <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                {!stockQuery.isLoading && levels.map(sl => {
                  const qty = decimalToNumber(sl.quantity)
                  const reserved = decimalToNumber(sl.reservedQty)
                  const available = qty - reserved
                  const locType = sl.location?.type ?? 'WAREHOUSE'
                  return (
                    <tr key={sl.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td><span className="cell-name">{sl.location?.name ?? sl.locationId.slice(0, 8)}</span></td>
                      <td>
                        <span className={`badge ${locType === 'WAREHOUSE' ? 'badge-blue' : 'badge-amber'}`}>
                          <span className="flex items-center gap-1">
                            {locType === 'WAREHOUSE' ? <Warehouse size={11} /> : <Truck size={11} />}
                            {locType.toLowerCase()}
                          </span>
                        </span>
                      </td>
                      <td className="td-primary font-600">{qty}</td>
                      <td className="text-sm text-3">{reserved}</td>
                      <td className="td-primary font-700">{available}</td>
                    </tr>
                  )
                })}
                {!stockQuery.isLoading && levels.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No stock records for this item</td></tr>
                )}
              </tbody>
              {!stockQuery.isLoading && levels.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                    <td colSpan={2} style={{ textAlign: 'right', paddingRight: 16 }}>Totals</td>
                    <td className="td-primary">{totalQty}</td>
                    <td className="text-sm">{totalReserved}</td>
                    <td className="td-primary">{totalAvailable}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-end shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
