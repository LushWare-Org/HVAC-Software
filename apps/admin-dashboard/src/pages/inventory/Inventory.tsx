import { useState } from 'react'
import { Package, ArrowRightLeft, ShoppingCart, AlertTriangle, Plus, Search, ChevronLeft, ChevronRight, Warehouse, ArrowDown, RefreshCw, Eye } from 'lucide-react'
import { useInventoryItems, useStockMovements, usePurchaseOrders, useLowStockAlerts, useLocations, decimalToNumber, useUpdatePOStatus, useReceivePO } from '../../hooks/useInventory'
import { useToast } from '../../contexts/ToastContext'
import type { InventoryItem, StockMovement, PurchaseOrder, LowStockAlert } from '../../types/api'
import AddInventoryItemModal from './AddInventoryItemModal'
import StockDetailModal from './StockDetailModal'
import IntakeStockModal from './IntakeStockModal'
import TransferStockModal from './TransferStockModal'
import CreatePurchaseOrderModal from './CreatePurchaseOrderModal'
import { formatMoney } from '../../lib/format'

// ─── Status CSS maps ──────────────────────────────────────────────────────────

const CAT_CSS: Record<string, string> = {
  PART: 'badge-blue', MATERIAL: 'badge-amber', TOOL: 'badge-purple', CONSUMABLE: 'badge-neutral',
}

const MOV_CSS: Record<string, string> = {
  INTAKE: 'badge-green', TRANSFER: 'badge-blue', CONSUME: 'badge-amber', ADJUST: 'badge-purple', RETURN: 'badge-cyan',
}

const PO_CSS: Record<string, string> = {
  DRAFT: 'badge-neutral', ORDERED: 'badge-blue', PARTIAL: 'badge-amber', RECEIVED: 'badge-green', CANCELLED: 'badge-red',
}

function Skeleton({ h = 14 }: { h?: number }) {
  return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

function fmtDecimal(val: string | number | undefined | null): string {
  const n = decimalToNumber(val)
  return formatMoney(n)
}

export default function Inventory() {
  const { showError, showSuccess } = useToast()
  const [tab, setTab] = useState<'items' | 'movements' | 'purchase-orders' | 'low-stock'>('items')

  // Items state
  const [itemsPage, setItemsPage] = useState(1)
  const [itemsSearch, setItemsSearch] = useState('')
  const [itemsCategory, setItemsCategory] = useState('all')
  const [locationFilter, setLocationFilter] = useState<'all' | 'WAREHOUSE' | 'VAN'>('all')

  // Movements state
  const [movPage, setMovPage] = useState(1)
  const [movType, setMovType] = useState('all')

  // PO state
  const [poPage, setPoPage] = useState(1)
  const [poStatus, setPoStatus] = useState('all')

  // Modal state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isIntakeOpen, setIsIntakeOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null)

  const itemsPerPage = 10

  // ── API ───────────────────────────────────────────────────────────────────

  const itemsQuery = useInventoryItems({ page: itemsPage, limit: itemsPerPage, search: itemsSearch || undefined, category: itemsCategory !== 'all' ? itemsCategory : undefined })
  const movementsQuery = useStockMovements({ page: movPage, limit: itemsPerPage, movementType: movType !== 'all' ? movType : undefined })
  const posQuery = usePurchaseOrders({ page: poPage, limit: itemsPerPage, status: poStatus !== 'all' ? poStatus : undefined })
  const alertsQuery = useLowStockAlerts()
  const locationsQuery = useLocations()

  const items: InventoryItem[] = itemsQuery.data?.data ?? []
  const totalItems = itemsQuery.data?.count ?? 0
  const totalItemsPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const movements: StockMovement[] = movementsQuery.data?.data ?? []
  const totalMovements = movementsQuery.data?.count ?? 0
  const totalMovPages = Math.max(1, Math.ceil(totalMovements / itemsPerPage))

  const pos: PurchaseOrder[] = posQuery.data?.data ?? []
  const totalPOs = posQuery.data?.count ?? 0
  const totalPOPages = Math.max(1, Math.ceil(totalPOs / itemsPerPage))

  const alerts: LowStockAlert[] = alertsQuery.data ?? []
  const locations = locationsQuery.data ?? []

  const warehouseCount = locations.filter(l => l.type === 'WAREHOUSE').length
  const vanCount = locations.filter(l => l.type === 'VAN').length
  const pendingPOCount = pos.filter(po => po.status === 'DRAFT' || po.status === 'ORDERED').length

  const updatePOStatus = useUpdatePOStatus()
  const receivePO = useReceivePO()

  // Compute van vs warehouse qty for each item
  const getStockSummary = (item: InventoryItem) => {
    const levels = item.stockLevels ?? []
    let warehouseQty = 0
    let vanQty = 0
    for (const sl of levels) {
      const qty = decimalToNumber(sl.quantity)
      if (sl.location?.type === 'VAN') vanQty += qty
      else warehouseQty += qty
    }
    const total = warehouseQty + vanQty
    const isLow = total < item.reorderPoint
    return { warehouseQty, vanQty, total, isLow }
  }

  // IN4: client-side location type filter
  const filteredItems = locationFilter === 'all'
    ? items
    : items.filter(item => {
        const { warehouseQty, vanQty } = getStockSummary(item)
        return locationFilter === 'WAREHOUSE' ? warehouseQty > 0 : vanQty > 0
      })

  return (
    <div className="anim-fade-up">

      {/* KPIs */}
      <div className="kpi-grid mb-5">
        {[
          { icon: Package, v: String(totalItems), l: 'Total Items', loading: itemsQuery.isLoading, onClick: () => setTab('items') },
          { icon: Warehouse, v: `${warehouseCount} warehouse, ${vanCount} van`, l: 'Locations', loading: locationsQuery.isLoading, onClick: undefined },
          { icon: AlertTriangle, v: String(alerts.length), l: 'Low Stock', loading: alertsQuery.isLoading, highlight: alerts.length > 0, onClick: () => setTab('low-stock') },
          { icon: ShoppingCart, v: String(pendingPOCount), l: 'Pending POs', loading: posQuery.isLoading, onClick: () => setTab('purchase-orders') },
        ].map(k => (
          <div key={k.l} className="kpi-card" style={{ padding: '16px 20px', borderRadius: 'var(--r-md)', cursor: k.onClick ? 'pointer' : 'default' }} onClick={k.onClick}>
            <div className="kpi-card-top" style={{ marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="kpi-label" style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500, margin: 0 }}>{k.l}</div>
              <k.icon size={16} strokeWidth={1.5} color={k.highlight ? 'var(--red)' : 'var(--t3)'} />
            </div>
            {k.loading ? <Skeleton h={28} /> : (
              <div className="kpi-value" style={{ fontSize: 26, fontWeight: 700, color: k.highlight ? 'var(--red)' : 'var(--t1)' }}>{k.v}</div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="page-tabs">
        <button className={`tab-btn ${tab === 'items' ? 'active' : ''}`} onClick={() => setTab('items')}>
          <Package size={14} /> Stock Items <span className="tab-count">{totalItems}</span>
        </button>
        <button className={`tab-btn ${tab === 'movements' ? 'active' : ''}`} onClick={() => setTab('movements')}>
          <ArrowRightLeft size={14} /> Movements <span className="tab-count">{totalMovements}</span>
        </button>
        <button className={`tab-btn ${tab === 'purchase-orders' ? 'active' : ''}`} onClick={() => setTab('purchase-orders')}>
          <ShoppingCart size={14} /> Purchase Orders <span className="tab-count">{totalPOs}</span>
        </button>
        <button className={`tab-btn ${tab === 'low-stock' ? 'active' : ''}`} onClick={() => setTab('low-stock')}>
          <AlertTriangle size={14} /> Low Stock <span className="tab-count">{alerts.length}</span>
        </button>
      </div>

      {/* ── Stock Items ── */}
      {tab === 'items' && (
        <div className="card anim-fade-in">
          {itemsQuery.isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 4px' }}>
              <AlertTriangle size={14} /> Failed to load inventory items.
              <button onClick={() => itemsQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}><RefreshCw size={12} /> Retry</button>
            </div>
          )}
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="filter-bar">
              <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search items..." value={itemsSearch} onChange={e => { setItemsSearch(e.target.value); setItemsPage(1) }} /></div>
              <select className="select" style={{ width: 150 }} value={itemsCategory} onChange={e => { setItemsCategory(e.target.value); setItemsPage(1) }}>
                <option value="all">All Categories</option>
                <option value="PART">Part</option>
                <option value="MATERIAL">Material</option>
                <option value="TOOL">Tool</option>
                <option value="CONSUMABLE">Consumable</option>
              </select>
              <select className="select" style={{ width: 160 }} value={locationFilter} onChange={e => setLocationFilter(e.target.value as 'all' | 'WAREHOUSE' | 'VAN')}>
                <option value="all">All Locations</option>
                <option value="WAREHOUSE">Warehouse only</option>
                <option value="VAN">Tech Vans only</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <button className="btn btn-secondary btn-sm" onClick={() => setIsIntakeOpen(true)}><ArrowDown size={12} /> Receive Stock</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsTransferOpen(true)}><ArrowRightLeft size={12} /> Transfer</button>
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddItemOpen(true)}><Plus size={12} /> Add Item</button>
              </div>
            </div>
          </div>
          <div className="card-body-flush mt-2">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>SKU</th>
                    <th style={{ textAlign: 'left' }}>Name</th>
                    <th style={{ textAlign: 'left' }}>Category</th>
                    <th style={{ textAlign: 'left' }}>Unit</th>
                    <th style={{ textAlign: 'left' }}>Warehouse Qty</th>
                    <th style={{ textAlign: 'left' }}>Van Qty</th>
                    <th style={{ textAlign: 'left' }}>Unit Cost</th>
                    <th style={{ textAlign: 'left' }}>Stock Value</th>
                    <th style={{ textAlign: 'left' }}>Reorder Pt</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsQuery.isLoading && Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 10 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                  {!itemsQuery.isLoading && filteredItems.map(item => {
                    const stock = getStockSummary(item)
                    const totalQty = stock.warehouseQty + stock.vanQty
                    const unitCost = item.unitCost != null ? Number(item.unitCost) : null
                    const stockValue = unitCost != null ? unitCost * totalQty : null
                    return (
                      <tr key={item.id} onClick={() => setDetailItem(item)} className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group">
                        <td><span className="td-mono td-primary">{item.sku}</span></td>
                        <td><span className="cell-name">{item.name}</span></td>
                        <td><span className={`badge ${CAT_CSS[item.category] ?? 'badge-neutral'}`}>{item.category.toLowerCase()}</span></td>
                        <td className="text-sm text-3">{item.unit}</td>
                        <td className="td-primary font-600" style={{ color: locationFilter === 'WAREHOUSE' ? 'var(--blue)' : undefined }}>{stock.warehouseQty}</td>
                        <td className="td-primary font-600" style={{ color: locationFilter === 'VAN' ? 'var(--blue)' : undefined }}>{stock.vanQty}</td>
                        <td className="text-sm" style={{ color: 'var(--t2)' }}>
                          {unitCost != null ? formatMoney(unitCost) : <span style={{ color: 'var(--t4)' }}>—</span>}
                        </td>
                        <td className="td-primary font-600" style={{ color: stockValue != null ? 'var(--green)' : undefined }}>
                          {stockValue != null ? formatMoney(stockValue) : <span style={{ color: 'var(--t4)', fontWeight: 400 }}>—</span>}
                        </td>
                        <td className="text-sm text-3">{item.reorderPoint}</td>
                        <td>
                          {stock.isLow
                            ? <span className="badge badge-red">low</span>
                            : <span className="badge badge-green">ok</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                  {!itemsQuery.isLoading && filteredItems.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No inventory items found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <span className="text-[13px] text-[var(--t3)]">Showing {totalItems > 0 ? (itemsPage - 1) * itemsPerPage + 1 : 0} to {Math.min(itemsPage * itemsPerPage, totalItems)} of {totalItems} items</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setItemsPage(p => Math.max(1, p - 1))} disabled={itemsPage === 1}><ChevronLeft size={18} /></button>
              <span className="text-[13px] text-[var(--t2)] mx-2">Page {itemsPage} of {totalItemsPages}</span>
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setItemsPage(p => Math.min(totalItemsPages, p + 1))} disabled={itemsPage === totalItemsPages}><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Movements ── */}
      {tab === 'movements' && (
        <div className="card anim-fade-in">
          {movementsQuery.isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 4px' }}>
              <AlertTriangle size={14} /> Failed to load movements.
              <button onClick={() => movementsQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}><RefreshCw size={12} /> Retry</button>
            </div>
          )}
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="filter-bar">
              <select className="select" style={{ width: 160 }} value={movType} onChange={e => { setMovType(e.target.value); setMovPage(1) }}>
                <option value="all">All Types</option>
                <option value="INTAKE">Intake</option>
                <option value="TRANSFER">Transfer</option>
                <option value="CONSUME">Consume</option>
                <option value="ADJUST">Adjust</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <button className="btn btn-secondary btn-sm" onClick={() => setIsIntakeOpen(true)}><ArrowDown size={12} /> Receive Stock</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsTransferOpen(true)}><ArrowRightLeft size={12} /> Transfer</button>
              </div>
            </div>
          </div>
          <div className="card-body-flush mt-2">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Date</th>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th style={{ textAlign: 'left' }}>Type</th>
                    <th style={{ textAlign: 'left' }}>From</th>
                    <th style={{ textAlign: 'left' }}>To</th>
                    <th style={{ textAlign: 'left' }}>Qty</th>
                    <th style={{ textAlign: 'left' }}>By</th>
                    <th style={{ textAlign: 'left' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movementsQuery.isLoading && Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                  {!movementsQuery.isLoading && movements.map(mov => (
                    <tr key={mov.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="text-sm text-3">{new Date(mov.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div>
                          <span className="cell-name">{mov.inventoryItem?.name ?? '—'}</span>
                          {mov.inventoryItem?.sku && <span className="text-[11px] text-[var(--t4)] ml-1">({mov.inventoryItem.sku})</span>}
                        </div>
                      </td>
                      <td><span className={`badge ${MOV_CSS[mov.movementType] ?? 'badge-neutral'}`}>{mov.movementType.toLowerCase()}</span></td>
                      <td className="text-sm text-3">{mov.fromLocation?.name ?? '—'}</td>
                      <td className="text-sm text-3">{mov.toLocation?.name ?? '—'}</td>
                      <td className="td-primary font-600">{decimalToNumber(mov.quantity)}</td>
                      <td className="text-sm text-2">{mov.performedByName ?? mov.performedBy?.slice(0, 8) ?? '—'}</td>
                      <td className="text-sm text-3" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mov.notes ?? '—'}</td>
                    </tr>
                  ))}
                  {!movementsQuery.isLoading && movements.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No movements found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <span className="text-[13px] text-[var(--t3)]">Showing {totalMovements > 0 ? (movPage - 1) * itemsPerPage + 1 : 0} to {Math.min(movPage * itemsPerPage, totalMovements)} of {totalMovements} movements</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setMovPage(p => Math.max(1, p - 1))} disabled={movPage === 1}><ChevronLeft size={18} /></button>
              <span className="text-[13px] text-[var(--t2)] mx-2">Page {movPage} of {totalMovPages}</span>
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setMovPage(p => Math.min(totalMovPages, p + 1))} disabled={movPage === totalMovPages}><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Purchase Orders ── */}
      {tab === 'purchase-orders' && (
        <div className="card anim-fade-in">
          {posQuery.isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 4px' }}>
              <AlertTriangle size={14} /> Failed to load purchase orders.
              <button onClick={() => posQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}><RefreshCw size={12} /> Retry</button>
            </div>
          )}
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="filter-bar">
              <select className="select" style={{ width: 160 }} value={poStatus} onChange={e => { setPoStatus(e.target.value); setPoPage(1) }}>
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ORDERED">Ordered</option>
                <option value="PARTIAL">Partial</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <button className="btn btn-primary btn-sm" onClick={() => setIsCreatePOOpen(true)}><Plus size={12} /> Create PO</button>
              </div>
            </div>
          </div>
          <div className="card-body-flush mt-2">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>PO Number</th>
                    <th style={{ textAlign: 'left' }}>Supplier</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                    <th style={{ textAlign: 'left' }}>Items</th>
                    <th style={{ textAlign: 'left' }}>Total Cost</th>
                    <th style={{ textAlign: 'left' }}>Created</th>
                    <th style={{ textAlign: 'left' }}>Received</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posQuery.isLoading && Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                  {!posQuery.isLoading && pos.map(po => (
                    <tr key={po.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td><span className="td-mono td-primary">{po.poNumber}</span></td>
                      <td><span className="cell-name">{po.supplierName}</span></td>
                      <td><span className={`badge ${PO_CSS[po.status] ?? 'badge-neutral'}`}>{po.status.toLowerCase()}</span></td>
                      <td className="text-sm text-2">{po.items?.length ?? 0} items</td>
                      <td className="td-primary font-600">{fmtDecimal(po.totalCost)}</td>
                      <td className="text-sm text-3">{new Date(po.createdAt).toLocaleDateString()}</td>
                      <td className="text-sm text-3">{po.receivedAt ? new Date(po.receivedAt).toLocaleDateString() : '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-1 justify-end">
                          {po.status === 'DRAFT' && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                updatePOStatus.mutate({ id: po.id, status: 'ORDERED' }, {
                                  onSuccess: () => showSuccess('Purchase order marked as ordered.', 'PO Updated'),
                                  onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to update PO status.'),
                                })
                              }}
                              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                              title="Mark Ordered"
                              disabled={updatePOStatus.isPending}
                            >
                              <ShoppingCart size={14} strokeWidth={2.5} />
                            </button>
                          )}
                          {(po.status === 'ORDERED' || po.status === 'PARTIAL') && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                receivePO.mutate({ id: po.id }, {
                                  onSuccess: () => showSuccess('Purchase order received.', 'PO Received'),
                                  onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to receive PO.'),
                                })
                              }}
                              className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                              title="Receive"
                              disabled={receivePO.isPending}
                            >
                              <ArrowDown size={14} strokeWidth={2.5} />
                            </button>
                          )}
                          <button onClick={e => e.stopPropagation()} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors" title="View Details">
                            <Eye size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!posQuery.isLoading && pos.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No purchase orders found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <span className="text-[13px] text-[var(--t3)]">Showing {totalPOs > 0 ? (poPage - 1) * itemsPerPage + 1 : 0} to {Math.min(poPage * itemsPerPage, totalPOs)} of {totalPOs} purchase orders</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPoPage(p => Math.max(1, p - 1))} disabled={poPage === 1}><ChevronLeft size={18} /></button>
              <span className="text-[13px] text-[var(--t2)] mx-2">Page {poPage} of {totalPOPages}</span>
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPoPage(p => Math.min(totalPOPages, p + 1))} disabled={poPage === totalPOPages}><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Low Stock Alerts ── */}
      {tab === 'low-stock' && (
        <div className="card anim-fade-in">
          {alertsQuery.isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 4px' }}>
              <AlertTriangle size={14} /> Failed to load low stock alerts.
              <button onClick={() => alertsQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}><RefreshCw size={12} /> Retry</button>
            </div>
          )}
          <div className="card-body-flush mt-2">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>SKU</th>
                    <th style={{ textAlign: 'left' }}>Item Name</th>
                    <th style={{ textAlign: 'left' }}>Category</th>
                    <th style={{ textAlign: 'left' }}>Current Qty</th>
                    <th style={{ textAlign: 'left' }}>Reorder Point</th>
                    <th style={{ textAlign: 'left' }}>Deficit</th>
                    <th style={{ textAlign: 'left' }}>Suggested Order</th>
                  </tr>
                </thead>
                <tbody>
                  {alertsQuery.isLoading && Array.from({ length: 3 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                  {!alertsQuery.isLoading && alerts.map(alert => (
                    <tr key={alert.inventoryItemId} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td><span className="td-mono td-primary">{alert.sku}</span></td>
                      <td><span className="cell-name">{alert.itemName}</span></td>
                      <td><span className={`badge ${CAT_CSS[alert.category] ?? 'badge-neutral'}`}>{alert.category.toLowerCase()}</span></td>
                      <td><span style={{ color: 'var(--red)', fontWeight: 700 }}>{alert.currentQty}</span></td>
                      <td className="text-sm text-3">{alert.reorderPoint}</td>
                      <td><span style={{ color: 'var(--red)', fontWeight: 600 }}>{alert.deficit}</span></td>
                      <td className="td-primary font-600">{alert.reorderQty}</td>
                    </tr>
                  ))}
                  {!alertsQuery.isLoading && alerts.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--t4)', padding: '48px 0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <Package size={32} strokeWidth={1.5} color="var(--t4)" />
                          <span style={{ fontSize: 14, fontWeight: 500 }}>All stock levels are healthy</span>
                          <span style={{ fontSize: 12 }}>No items are below their reorder point.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddInventoryItemModal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} />
      <StockDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      <IntakeStockModal isOpen={isIntakeOpen} onClose={() => setIsIntakeOpen(false)} />
      <TransferStockModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <CreatePurchaseOrderModal isOpen={isCreatePOOpen} onClose={() => setIsCreatePOOpen(false)} />
    </div>
  )
}
