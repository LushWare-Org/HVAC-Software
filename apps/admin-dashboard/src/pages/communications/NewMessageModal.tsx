/**
 * NewMessageModal — extracted from Communications.tsx (Session 14, 2026-05-08).
 *
 * Self-contained modal for starting a new thread with either a customer or a
 * technician. The parent owns nothing of this component's state — it only
 * passes `onClose` and `onThreadCreated`. Extracting it removed ~250 lines
 * from the parent without changing any behavior.
 */
import { useState } from 'react'
import { Search, Send, X, Loader2 } from 'lucide-react'
import { useCustomers } from '../../hooks/useCustomers'
import { useTeamMembers } from '../../hooks/useTeam'
import { useCreateThread, useSendThreadMessage } from '../../hooks/useComms'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  onClose: () => void
  onThreadCreated: (threadId: string) => void
  initialTechName?: string | null
}

export default function NewMessageModal({ onClose, onThreadCreated, initialTechName }: Props) {
  const [recipientType, setRecipientType] = useState<'customer' | 'technician'>(initialTechName ? 'technician' : 'customer')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [techSearch, setTechSearch] = useState(initialTechName ?? '')
  const [selectedTech, setSelectedTech] = useState<{ id: string; name: string; role: string } | null>(null)
  const [showTechDropdown, setShowTechDropdown] = useState(false)
  const [initialMessage, setInitialMessage] = useState('')

  const customersQuery = useCustomers({ search: customerSearch, limit: 20 })
  const customers = customersQuery.data?.data ?? []
  const teamQuery = useTeamMembers({ page: 1, limit: 200, isActive: true })
  const technicians = (teamQuery.data?.data ?? []).filter(m => m.role?.toLowerCase() === 'technician')
  const filteredTechs = techSearch.length >= 1
    ? technicians.filter(t => t.name.toLowerCase().includes(techSearch.toLowerCase()))
    : technicians
  const createThread = useCreateThread()
  const sendThreadMessage = useSendThreadMessage()

  const canSend = recipientType === 'customer'
    ? (selectedCustomer && initialMessage.trim())
    : (selectedTech && initialMessage.trim())

  const handleCreate = () => {
    if (!initialMessage.trim()) return
    const msg = initialMessage.trim()

    if (recipientType === 'technician') {
      if (!selectedTech) return
      createThread.mutate(
        {
          participantIds: [selectedTech.id],
          participantNames: [selectedTech.name],
          subject: `Chat with ${selectedTech.name}`,
        },
        {
          onSuccess: (thread) => {
            sendThreadMessage.mutate({ threadId: thread.id, body: msg })
            onThreadCreated(thread.id)
          },
        },
      )
    } else {
      if (!selectedCustomer) return
      createThread.mutate(
        {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerPhone: selectedCustomer.phone,
          customerEmail: selectedCustomer.email,
        },
        {
          onSuccess: (thread) => {
            sendThreadMessage.mutate({ threadId: thread.id, body: msg })
            onThreadCreated(thread.id)
          },
        },
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 admin-modal-backdrop" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-[var(--r)] shadow-xl w-full max-w-lg mx-4 admin-modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--bd)]">
          <h2 className="text-lg font-semibold text-[var(--t1)]">New Conversation</h2>
          <button onClick={onClose} className="topbar-icon-btn"><X size={18} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Recipient type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setRecipientType('customer'); setSelectedTech(null); setTechSearch('') }}
              className={`flex-1 py-2 text-sm font-semibold rounded-[var(--r)] border transition-colors ${recipientType === 'customer' ? 'bg-[var(--blue)] text-white border-[var(--blue)]' : 'border-[var(--bd)] text-[var(--t2)] hover:border-[var(--blue)]'}`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => { setRecipientType('technician'); setSelectedCustomer(null); setCustomerSearch('') }}
              className={`flex-1 py-2 text-sm font-semibold rounded-[var(--r)] border transition-colors ${recipientType === 'technician' ? 'bg-violet-600 text-white border-violet-600' : 'border-[var(--bd)] text-[var(--t2)] hover:border-violet-500'}`}
            >
              Technician
            </button>
          </div>

          {/* Customer recipient search */}
          {recipientType === 'customer' && (
            <div className="relative">
              <label className="block text-sm font-medium text-[var(--t2)] mb-1.5">Recipient</label>
              {selectedCustomer ? (
                <div className="flex items-center gap-2 p-2.5 border border-[var(--bd)] rounded-[var(--r)] bg-[var(--bg-surface)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center text-xs font-semibold">
                    {getInitials(selectedCustomer.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--t1)]">{selectedCustomer.name}</p>
                    <p className="text-xs text-[var(--t3)]">
                      {selectedCustomer.phone || selectedCustomer.email || 'In-app chat'}
                    </p>
                  </div>
                  <button className="topbar-icon-btn" onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--t4)]" />
                    <input
                      placeholder="Search customers..."
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-[var(--blue)] outline-none text-[var(--t1)]"
                      value={customerSearch}
                      onChange={e => { setCustomerSearch(e.target.value); setShowDropdown(true) }}
                      onFocus={() => setShowDropdown(true)}
                    />
                  </div>
                  {showDropdown && customerSearch.length >= 1 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--bd)] rounded-[var(--r)] shadow-lg max-h-48 overflow-auto">
                      {customersQuery.isLoading && (
                        <div className="p-3 text-center text-sm text-[var(--t4)]"><Loader2 size={14} className="animate-spin inline mr-2" />Searching...</div>
                      )}
                      {!customersQuery.isLoading && customers.length === 0 && (
                        <div className="p-3 text-center text-sm text-[var(--t4)]">No customers found</div>
                      )}
                      {customers.map(c => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 p-3 hover:bg-[var(--bg-hover)] cursor-pointer"
                          onClick={() => {
                            setSelectedCustomer({
                              id: c.id,
                              name: `${c.firstName} ${c.lastName}`,
                              phone: c.phone ?? undefined,
                              email: c.email ?? undefined,
                            })
                            setShowDropdown(false)
                            setCustomerSearch('')
                          }}
                        >
                          <div className="w-7 h-7 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center text-xs font-semibold">
                            {getInitials(`${c.firstName} ${c.lastName}`)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--t1)]">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-[var(--t3)]">{c.phone ?? c.email ?? '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Technician recipient search */}
          {recipientType === 'technician' && (
            <div className="relative">
              <label className="block text-sm font-medium text-[var(--t2)] mb-1.5">Technician</label>
              {selectedTech ? (
                <div className="flex items-center gap-2 p-2.5 border border-[var(--bd)] rounded-[var(--r)] bg-[var(--bg-surface)]">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-semibold">
                    {getInitials(selectedTech.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--t1)]">{selectedTech.name}</p>
                    <p className="text-xs text-[var(--t3)] capitalize">{selectedTech.role.toLowerCase()}</p>
                  </div>
                  <button className="topbar-icon-btn" onClick={() => { setSelectedTech(null); setTechSearch('') }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--t4)]" />
                    <input
                      placeholder="Search technicians..."
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-violet-500 outline-none text-[var(--t1)]"
                      value={techSearch}
                      onChange={e => { setTechSearch(e.target.value); setShowTechDropdown(true) }}
                      onFocus={() => setShowTechDropdown(true)}
                    />
                  </div>
                  {showTechDropdown && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--bd)] rounded-[var(--r)] shadow-lg max-h-48 overflow-auto">
                      {filteredTechs.length === 0 && (
                        <div className="p-3 text-center text-sm text-[var(--t4)]">No technicians found</div>
                      )}
                      {filteredTechs.map(t => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 p-3 hover:bg-[var(--bg-hover)] cursor-pointer"
                          onClick={() => { setSelectedTech({ id: t.id, name: t.name, role: t.role }); setShowTechDropdown(false); setTechSearch('') }}
                        >
                          <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-semibold">
                            {getInitials(t.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--t1)]">{t.name}</p>
                            <p className="text-xs text-[var(--t3)] capitalize">Technician</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Message body */}
          <div>
            <label className="block text-sm font-medium text-[var(--t2)] mb-1.5">Message</label>
            <textarea
              placeholder="Type your message..."
              className="w-full p-3 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-[var(--blue)] outline-none text-[var(--t1)] min-h-[100px] resize-none"
              value={initialMessage}
              onChange={e => setInitialMessage(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--bd)]">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!canSend || createThread.isPending}
          >
            {createThread.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
            Start Conversation
          </button>
        </div>

        {createThread.isError && (
          <p className="text-xs text-[var(--red)] px-5 pb-3">Failed to create conversation. Please try again.</p>
        )}
      </div>
    </div>
  )
}
