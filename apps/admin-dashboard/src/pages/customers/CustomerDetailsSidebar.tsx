/**
 * CustomerDetailsSidebar — orchestrator for the customer detail modal.
 * Owns the modal shell, header, persistent left context rail, tab bar, and
 * the state shared across tabs (edit mode, profile fields, addresses,
 * equipment, tags — everything Save persists). Each tab's own content lives
 * in ./tabs/*.
 */
import { useState, useEffect } from 'react'
import {
  ChevronLeft, X, Mail, Phone, Save, Edit2, Loader2, Check,
  User, MapPinned, Wrench, ClipboardList, ShieldCheck, FolderKanban, Star, Activity, Sparkles,
  MessageSquare, Plus, Sparkle,
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import AddJobModal from '../jobs/AddJobModal'
import { useCustomerStatusSummary, useUpdateCustomer, useCustomerTags } from '../../hooks/useCustomers'
import { useCustomerAddresses, useSaveCustomerAddresses } from '../../hooks/useAddresses'
import { useCustomerEquipment, useSaveCustomerEquipment } from '../../hooks/useEquipment'
import { useJobs } from '../../hooks/useJobs'
import { useQuotes, useInvoices, decimalToNumber } from '../../hooks/useFinance'
import { formatMoney } from '../../lib/format'
import { Badge } from './shared'

import OverviewTab from './tabs/OverviewTab'
import EquipmentTab from './tabs/EquipmentTab'
import JobsTab from './tabs/JobsTab'
import AgreementsTab from './tabs/AgreementsTab'
import ProjectsTab from './tabs/ProjectsTab'
import ReviewsTab from './tabs/ReviewsTab'
import ActivityTab from './tabs/ActivityTab'
import AiIotTab from './tabs/AiIotTab'

type TabType = 'overview' | 'equipment' | 'jobs' | 'agreements' | 'projects' | 'reviews' | 'activity' | 'ai-iot'

interface CustomerDetailsSidebarProps {
  person: any | null
  isOpen: boolean
  onClose: () => void
  onBack?: () => void
  initialTab?: TabType
}

const mockReviews: any[] = []

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <User size={14} /> },
  { id: 'equipment', label: 'Equipment', icon: <Wrench size={14} /> },
  { id: 'jobs', label: 'Jobs', icon: <ClipboardList size={14} /> },
  { id: 'agreements', label: 'Agreements', icon: <ShieldCheck size={14} /> },
  { id: 'projects', label: 'Projects', icon: <FolderKanban size={14} /> },
  { id: 'reviews', label: 'Reviews', icon: <Star size={14} /> },
  { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
  { id: 'ai-iot', label: 'AI & IoT', icon: <Sparkle size={14} /> },
]

export default function CustomerDetailsSidebar({
  person, isOpen, onClose, onBack, initialTab = 'overview',
}: CustomerDetailsSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [addresses, setAddresses] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [reviews, setReviews] = useState(mockReviews)
  const [showRequestPanel, setShowRequestPanel] = useState(false)
  const [requestForm, setRequestForm] = useState({ email: '', channel: 'Google', message: '' })
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false)
  const [saveSucceeded, setSaveSucceeded] = useState(false)

  const customerId = person?.id ?? ''
  const statusSummaryQuery = useCustomerStatusSummary(customerId || undefined)

  const customerJobsQuery = useJobs({ customerId: customerId || undefined, limit: 50 })
  const customerJobs = [...(customerJobsQuery.data?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const customerQuotesQuery = useQuotes({ customerId: customerId || undefined, limit: 50 })
  const customerQuotes = [...(customerQuotesQuery.data?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const customerInvoicesQuery = useInvoices({ customerId: customerId || undefined, limit: 50 })
  const customerInvoices = [...(customerInvoicesQuery.data?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const currentYear = new Date().getFullYear()
  const lifetimeRevenue = decimalToNumber(person?.totalRevenue ?? customerInvoices.reduce((sum, invoice) => sum + decimalToNumber(invoice.total), 0))
  const ytdRevenue = customerInvoices.reduce((sum, invoice) => {
    const invoiceDate = new Date(invoice.createdAt)
    if (invoiceDate.getFullYear() !== currentYear) return sum
    if (['DRAFT', 'VOID', 'CANCELLED'].includes(invoice.status)) return sum
    return sum + decimalToNumber(invoice.total)
  }, 0)
  const outstandingBalance = customerInvoices.reduce((sum, invoice) => sum + decimalToNumber(invoice.balanceDue), 0)

  const addressesQuery = useCustomerAddresses(customerId || undefined)
  const equipmentQuery = useCustomerEquipment(customerId || undefined)
  const saveAddresses = useSaveCustomerAddresses()
  const saveEquipment = useSaveCustomerEquipment()

  useEffect(() => {
    if (isOpen && person) {
      document.body.style.overflow = 'hidden'
      const fullName = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim()
      setFormData({
        ...person,
        name: fullName,
        whatsappNo: person.mobile || '',
        customerSince: person.createdAt ? person.createdAt.split('T')[0] : '',
        lastService: person.lastServiceDate ? person.lastServiceDate.split('T')[0] : '',
      })
      setTags(person.tags ?? [])
      setContacts([{ id: 1, name: fullName, role: 'Owner', email: person.email || '', phone: person.phone || person.mobile || '' }])
      setReviews(mockReviews)
      setActiveTab(initialTab)
      setIsEditMode(false)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen, person, initialTab])

  useEffect(() => {
    if (addressesQuery.data) {
      setAddresses(addressesQuery.data.map((a: any) => ({
        id: a.id, type: a.type || 'Site', line1: a.line1 || '', line2: a.line2 || '',
        city: a.city || '', state: a.state || '', postcode: a.postcode || '', primary: a.isPrimary || false,
      })))
    }
  }, [addressesQuery.data])

  useEffect(() => {
    if (equipmentQuery.data) {
      setEquipment(equipmentQuery.data.map((e: any) => ({
        id: e.id, type: e.type || 'Boiler', brand: e.brand || '', model: e.model || '',
        serial: e.serialNo || '', install: e.installDate ? e.installDate.split('T')[0] : '',
        warranty: e.warrantyEnd ? e.warrantyEnd.split('T')[0] : '', manualUrl: e.manualUrl || '',
      })))
    }
  }, [equipmentQuery.data])

  const updateCustomer = useUpdateCustomer()
  const allTagsQuery = useCustomerTags()
  const allTags = allTagsQuery.data ?? []
  const { showSuccess, showError } = useToast()

  if (!isOpen || !person) return null

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    const nameParts = (formData.name || '').trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    updateCustomer.mutate(
      {
        id: person.id,
        data: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          mobile: formData.whatsappNo || undefined,
          source: formData.source || undefined,
          type: (formData.type as 'RESIDENTIAL' | 'COMMERCIAL') || undefined,
          notes: formData.notes || undefined,
          engagementStatus: formData.engagementStatus || undefined,
          tags,
        },
      },
      {
        onSuccess: () => {
          if (addresses.length > 0 || (addressesQuery.data && addressesQuery.data.length > 0)) {
            saveAddresses.mutate({
              customerId: person.id,
              addresses: addresses
                .filter((a: any) => a.line1?.trim())
                .map((a: any) => ({
                  type: a.type || 'Site', line1: a.line1, line2: a.line2 || undefined,
                  city: a.city || undefined, state: a.state || undefined, postcode: a.postcode || undefined,
                  isPrimary: a.primary || false,
                })),
            })
          }
          if (equipment.length > 0 || (equipmentQuery.data && equipmentQuery.data.length > 0)) {
            saveEquipment.mutate({
              customerId: person.id,
              equipment: equipment
                .filter((e: any) => e.brand?.trim() || e.model?.trim() || e.serial?.trim())
                .map((e: any) => ({
                  type: e.type || 'Boiler', brand: e.brand || undefined, model: e.model || undefined,
                  serialNo: e.serial || undefined, installDate: e.install || undefined,
                  warrantyEnd: e.warranty || undefined, manualUrl: e.manualUrl || undefined,
                })),
            })
          }
          setIsEditMode(false)
          setSaveSucceeded(true)
          setTimeout(() => setSaveSucceeded(false), 2000)
          showSuccess('Customer details saved.')
        },
        onError: (err: any) => {
          showError(err?.response?.data?.message ?? err.message ?? 'Something went wrong.', 'Save failed')
        },
      },
    )
  }

  const initials = (formData.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}
        onClick={onClose}
      >
        <div
          role="dialog" aria-modal="true"
          style={{
            width: 1280, maxWidth: '95vw', maxHeight: '90vh', borderRadius: 18, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--bd)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.42)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              {onBack && (
                <button
                  onClick={onBack}
                  style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-card-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t2)', flexShrink: 0 }}
                  aria-label="Go back" title="Back"
                >
                  <ChevronLeft size={17} />
                </button>
              )}
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #0891B2, #0369A1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{formData.name || 'Details'}</span>
                  <Badge tone={formData.type === 'COMMERCIAL' ? 'violet' : 'blue'}>{(formData.type || 'RESIDENTIAL').charAt(0) + (formData.type || 'RESIDENTIAL').slice(1).toLowerCase()}</Badge>
                  {isEditMode ? (
                    <select
                      value={formData.engagementStatus || 'ACTIVE'}
                      onChange={e => setFormData({ ...formData, engagementStatus: e.target.value })}
                      style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 6px', border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)' }}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="QUOTE_SENT">Quote Sent</option>
                      <option value="JOB_BOOKED">Job Booked</option>
                      <option value="INVOICE_SENT">Invoice Sent</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  ) : (
                    <Badge tone={formData.engagementStatus === 'INACTIVE' ? 'neutral' : 'green'}>
                      {(formData.engagementStatus || 'ACTIVE').replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 11.5, color: 'var(--t4)', fontWeight: 500 }}>
                  <span>Customer since {formData.customerSince || '—'}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--bd)' }} />
                  <span>Last service {formData.lastService || '—'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <a
                href={formData.email ? `mailto:${formData.email}` : undefined}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, border: '1px solid var(--bd)', color: 'var(--t2)', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', textDecoration: 'none' }}
              >
                <MessageSquare size={14} /> Message
              </a>
              <button
                onClick={() => setIsAddJobModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 12px', cursor: 'pointer' }}
              >
                <Plus size={14} /> New job
              </button>
              {isEditMode ? (
                <>
                  <button
                    onClick={() => setIsEditMode(false)}
                    style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--red)', border: '1px solid var(--bd)', background: 'var(--bg-card)', borderRadius: 9, padding: '8px 12px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateCustomer.isPending}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, borderRadius: 9, padding: '8px 12px', border: 'none',
                      background: saveSucceeded ? 'var(--green)' : 'var(--blue)', color: '#fff',
                      cursor: updateCustomer.isPending ? 'not-allowed' : 'pointer', opacity: updateCustomer.isPending ? 0.8 : 1,
                    }}
                  >
                    {updateCustomer.isPending ? <><Loader2 size={13} className="spin" /> Saving…</> : saveSucceeded ? <><Check size={13} /> Saved</> : <><Save size={13} /> Save</>}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--blue)', border: '1px solid var(--bd)', background: 'var(--bg-card)', borderRadius: 9, padding: '8px 12px', cursor: 'pointer' }}
                >
                  <Edit2 size={13} /> Edit
                </button>
              )}
              <button
                onClick={onClose}
                style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-card-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t2)' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body: persistent left rail + main */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            {/* Left rail */}
            <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--bd)', background: 'var(--bg-card-2)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              {/* AI health */}
              <div style={{ borderRadius: 13, border: '1px solid color-mix(in srgb, #7C3AED 25%, transparent)', background: 'linear-gradient(160deg, var(--blue-glow), color-mix(in srgb, #7C3AED 10%, transparent))', padding: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
                  <div style={{ width: 21, height: 21, borderRadius: 6, background: 'linear-gradient(135deg, #7C3AED, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={11} style={{ color: '#fff' }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#4C1D95' }}>AI health</span>
                </div>
                {statusSummaryQuery.data ? (() => {
                  const summary = statusSummaryQuery.data
                  const upsell = summary.upsellRecommendation
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#6B21A8' }}>Churn risk</span>
                        <Badge tone={summary.churnPrediction.level === 'High' ? 'red' : summary.churnPrediction.level === 'Medium' ? 'amber' : 'green'}>
                          {summary.churnPrediction.level} · {Math.round(summary.churnPrediction.probability * 100)}%
                        </Badge>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.5)', overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ width: `${Math.round(summary.churnPrediction.probability * 100)}%`, height: '100%', background: 'var(--green)', borderRadius: 999 }} />
                      </div>
                      {upsell && (
                        <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                          <div style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                            Upsell · {Math.round(upsell.confidence * 100)}%
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)' }}>
                            {upsell.recommendedOffer.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                          </div>
                        </div>
                      )}
                      <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Next step</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)' }}>{summary.proposedNextStep}</div>
                      </div>
                    </>
                  )
                })() : (
                  <p style={{ fontSize: 11, color: '#6B21A8', margin: 0 }}>{statusSummaryQuery.isLoading ? 'Loading…' : 'Unavailable'}</p>
                )}
              </div>

              {/* Revenue */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 13, padding: 13 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 9 }}>Revenue</div>
                <div style={{ fontSize: 23, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>{formatMoney(lifetimeRevenue, { decimals: 0 })}</div>
                <div style={{ fontSize: 10.5, color: 'var(--t4)', marginTop: 3 }}>Lifetime value</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{formatMoney(ytdRevenue, { decimals: 0 })}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>YTD</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: outstandingBalance > 0 ? 'var(--red)' : 'var(--t1)' }}>{formatMoney(outstandingBalance, { decimals: 0 })}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>Outstanding</div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 13, padding: 13 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Contact</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Mail size={13} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.email || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Phone size={13} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--t2)' }}>{formData.phone || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <MapPinned size={13} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--t2)' }}>{formData.city || '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
                  <a
                    href={formData.phone ? `tel:${formData.phone}` : undefined}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'var(--blue-glow)', color: 'var(--blue)', borderRadius: 8, padding: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
                  >
                    <Phone size={13} /> Call
                  </a>
                  <a
                    href={formData.email ? `mailto:${formData.email}` : undefined}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'color-mix(in srgb, var(--green) 12%, transparent)', color: 'var(--green)', borderRadius: 8, padding: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
                  >
                    <Mail size={13} /> Email
                  </a>
                </div>
              </div>
            </div>

            {/* Main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 20px', borderBottom: '1px solid var(--bd)', overflowX: 'auto', flexShrink: 0 }}>
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '14px 4px', marginRight: 20,
                        borderBottom: `2.5px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
                        fontSize: 12.5, fontWeight: 600, color: isActive ? 'var(--blue)' : 'var(--t3)',
                        cursor: 'pointer', whiteSpace: 'nowrap', background: 'none', border: 'none', borderBottomWidth: 2.5, borderBottomStyle: 'solid',
                      }}
                    >
                      {tab.icon}
                      {tab.label}
                      {tab.id === 'jobs' && !customerJobsQuery.isFetching && customerJobs.length > 0 && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, background: '#EF4444', color: '#fff', borderRadius: 999, minWidth: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                          {customerJobs.length}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                {activeTab === 'overview' && (
                  <OverviewTab
                    formData={formData} isEditMode={isEditMode} onFieldChange={handleFieldChange}
                    tags={tags} onTagsChange={setTags} allTags={allTags}
                    contacts={contacts} onContactsChange={setContacts}
                    addresses={addresses} onAddressesChange={setAddresses}
                  />
                )}
                {activeTab === 'equipment' && (
                  <EquipmentTab
                    customerId={customerId} isEditMode={isEditMode}
                    equipment={equipment} onEquipmentChange={setEquipment}
                    equipmentQueryData={equipmentQuery.data}
                  />
                )}
                {activeTab === 'jobs' && (
                  <JobsTab
                    quotes={customerQuotes} invoices={customerInvoices} jobs={customerJobs}
                    jobsFetching={customerJobsQuery.isFetching}
                    onNewJob={() => setIsAddJobModalOpen(true)}
                  />
                )}
                {activeTab === 'agreements' && customerId && (
                  <AgreementsTab customerId={customerId} customerName={`${person.firstName ?? ''} ${person.lastName ?? ''}`.trim()} />
                )}
                {activeTab === 'projects' && <ProjectsTab customerId={customerId} />}
                {activeTab === 'reviews' && (
                  <ReviewsTab
                    isEditMode={isEditMode} reviews={reviews} onReviewsChange={setReviews}
                    showRequestPanel={showRequestPanel}
                    onToggleRequestPanel={() => {
                      setShowRequestPanel(p => !p)
                      setRequestForm(p => ({ ...p, email: formData.email || '' }))
                    }}
                    requestForm={requestForm}
                    onRequestFormChange={patch => setRequestForm(p => ({ ...p, ...patch }))}
                    customerName={formData.name}
                  />
                )}
                {activeTab === 'activity' && <ActivityTab createdAt={person.createdAt} source={person.source} />}
                {activeTab === 'ai-iot' && customerId && <AiIotTab customerId={customerId} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddJobModal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
        preselectedCustomer={person ? {
          id: person.id,
          name: `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim(),
          address: [person.address, person.city, person.state, person.zipCode].filter(Boolean).join(', '),
        } : undefined}
        onCreated={() => { customerJobsQuery.refetch() }}
      />
    </>
  )
}
