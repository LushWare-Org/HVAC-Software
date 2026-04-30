import { Edit2, Trash2, Lock, Users, Shield, Briefcase, Maximize2, Minimize2, Search, ChevronLeft, ChevronRight, Mail, Plus, X, Loader2, AlertCircle, RefreshCw, UserPlus, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useState, useMemo } from 'react'
import {
    useTeamMembers,
    useCreateTeamMember,
    useUpdateTeamMember,
    useDeleteTeamMember,
    usePendingTechnicians,
    useApproveTechnician,
    useRejectTechnician,
    type TeamMember,
} from '../hooks/useTeam'
import { useCreateTechnician } from '../hooks/useScheduling'
import { useEnsureVan } from '../hooks/useInventory'
import MapPicker from '../components/MapPicker'
import RecommendationsPanel from '../components/RecommendationsPanel'

const ROLE_MAP: Record<string, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    office_manager: 'Office Manager',
    dispatcher: 'Dispatcher',
    technician: 'Technician',
    customer: 'Customer',
}

function Skeleton({ h = 14 }: { h?: number }) {
    return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

export default function Team() {
    const [selectedRole, setSelectedRole] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [isExpanded, setIsExpanded] = useState(false)
    const [page, setPage] = useState(1)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editMember, setEditMember] = useState<TeamMember | null>(null)
    const itemsPerPage = 10

    // ── API ──────────────────────────────────────────────────────────────────────
    const membersQuery = useTeamMembers({ limit: 200 })
    const deleteMember = useDeleteTeamMember()
    const updateMember = useUpdateTeamMember()
    const pendingQuery = usePendingTechnicians()
    const approve = useApproveTechnician()
    const reject = useRejectTechnician()
    const ensureVanOnApprove = useEnsureVan()
    const [rejectTarget, setRejectTarget] = useState<TeamMember | null>(null)
    const [rejectNote, setRejectNote] = useState('')
    const [viewTech, setViewTech] = useState<TeamMember | null>(null)

    const handleApproveTech = (tech: TeamMember) => {
        approve.mutate(tech.id, {
            onSuccess: () => {
                ensureVanOnApprove.mutate({ technicianId: tech.id, technicianName: tech.name })
            },
        })
    }

    const pendingTechs: TeamMember[] = pendingQuery.data?.data ?? []

    const allMembers: TeamMember[] = membersQuery.data?.data ?? []

    // ── Filter client-side ────────────────────────────────────────────────────
    const filteredMembers = useMemo(() => {
        return allMembers.filter(m => {
            let matchRole = true
            if (selectedRole === 'admin') {
                matchRole = m.role === 'super_admin' || m.role === 'company_admin'
            } else if (selectedRole) {
                matchRole = m.role === selectedRole
            }
            const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
            return matchRole && matchSearch
        })
    }, [allMembers, selectedRole, search])

    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage))
    const paginatedMembers = filteredMembers.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    const adminCount = allMembers.filter(m => m.role === 'super_admin' || m.role === 'company_admin').length
    const techCount = allMembers.filter(m => m.role === 'technician').length
    const dispatchCount = allMembers.filter(m => m.role === 'dispatcher').length

    const handleDelete = (e: React.MouseEvent, member: TeamMember) => {
        e.stopPropagation()
        if (member.role === 'super_admin') return
        if (confirm(`Remove ${member.name} from the team?`)) {
            deleteMember.mutate(member.id)
        }
    }

    const handleToggleActive = (e: React.MouseEvent, member: TeamMember) => {
        e.stopPropagation()
        updateMember.mutate({ id: member.id, isActive: !member.isActive })
    }

    return (
        <div className="anim-fade-up">
            {!isExpanded && (
                <div className="kpi-grid mb-5 mt-2">
                    {[
                        { l: 'Total Members', v: membersQuery.isLoading ? '—' : allMembers.length, icon: Users, role: null, showBg: false },
                        { l: 'Admins', v: membersQuery.isLoading ? '—' : adminCount, icon: Shield, role: 'admin', showBg: true },
                        { l: 'Technicians', v: membersQuery.isLoading ? '—' : techCount, icon: Briefcase, role: 'technician', showBg: true },
                        { l: 'Dispatchers', v: membersQuery.isLoading ? '—' : dispatchCount, icon: Briefcase, role: 'dispatcher', showBg: true },
                        { l: 'Pending Approvals', v: pendingQuery.isLoading ? '—' : pendingTechs.length, icon: Clock, role: null, showBg: false, highlight: !pendingQuery.isLoading && pendingTechs.length > 0 },
                    ].map((k: any) => {
                        const isActive = selectedRole === k.role
                        const applyActiveBg = isActive && k.showBg
                        return (
                            <div
                                key={k.l}
                                className="kpi-card"
                                style={{
                                    padding: '16px 20px',
                                    borderRadius: 'var(--r-md)',
                                    cursor: 'pointer',
                                    background: applyActiveBg ? 'var(--green-dim)' : k.highlight ? 'var(--yellow-dim, #2a2000)' : undefined,
                                    borderColor: applyActiveBg ? 'var(--green-dim)' : k.highlight ? '#f59e0b44' : undefined,
                                }}
                                onClick={() => { setSelectedRole(isActive ? null : k.role); setPage(1) }}
                            >
                                <div className="kpi-card-top" style={{ marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="kpi-label" style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500, margin: 0 }}>{k.l}</div>
                                    <k.icon size={16} strokeWidth={1.5} color="var(--t3)" />
                                </div>
                                <div className="kpi-value" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>{k.v}</div>
                            </div>
                        )
                    })}
                </div>
            )}

            {!isExpanded && <RecommendationsPanel filterActions={['increase_price', 'discount_20']} />}

            {membersQuery.isError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
                    <AlertCircle size={14} /> Failed to load team members.
                    <button onClick={() => membersQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            )}

            {/* ── Pending Approvals Banner ──────────────────────────────── */}
            {pendingTechs.length > 0 && (
                <div className="card mb-5 anim-fade-in" style={{ borderColor: 'var(--yellow, #f59e0b)', borderWidth: 1 }}>
                    <div className="card-body" style={{ paddingBottom: 12 }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={16} color="var(--yellow, #f59e0b)" />
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>
                                Pending Technician Applications
                            </h3>
                            <span style={{ marginLeft: 'auto', background: '#f59e0b22', color: '#f59e0b', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                                {pendingTechs.length} awaiting review
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {pendingTechs.map(tech => (
                                <div
                                    key={tech.id}
                                    onClick={() => setViewTech(tech)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-active)', borderRadius: 'var(--r-md)', border: '1px solid var(--bd)', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-active)')}
                                >
                                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17, fontWeight: 700, color: 'var(--blue)' }}>
                                        {tech.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: 'var(--t1)', fontSize: 14 }}>{tech.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{tech.email}{tech.phone ? ` · ${tech.phone}` : ''}</div>
                                        {tech.skills?.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                                                {tech.skills.slice(0, 4).map(s => <span key={s} style={{ fontSize: 11, background: 'var(--blue-dim)', color: 'var(--blue)', borderRadius: 4, padding: '1px 7px' }}>{s}</span>)}
                                                {tech.skills.length > 4 && <span style={{ fontSize: 11, color: 'var(--t4)' }}>+{tech.skills.length - 4} more</span>}
                                            </div>
                                        )}
                                        <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 3 }}>
                                            Applied {new Date(tech.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            {tech.latitude ? ' · 📍 Location provided' : ' · No location'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                        <button className="btn btn-primary btn-sm" style={{ background: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => handleApproveTech(tech)} disabled={approve.isPending}>
                                            {approve.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                            <span style={{ marginLeft: 4 }}>Approve</span>
                                        </button>
                                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => { setRejectTarget(tech); setRejectNote('') }}>
                                            <XCircle size={13} />
                                            <span style={{ marginLeft: 4 }}>Reject</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Modal ──────────────────────────────────────────────── */}
            {rejectTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 admin-modal-backdrop" onClick={() => setRejectTarget(null)}>
                    <div className="bg-[var(--bg-card)] rounded-[var(--r)] shadow-xl w-full max-w-md mx-4 admin-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-[var(--bd)]">
                            <h2 className="text-lg font-semibold text-[var(--t1)]">Reject Application</h2>
                            <button onClick={() => setRejectTarget(null)} className="topbar-icon-btn"><X size={18} /></button>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <p style={{ fontSize: 14, color: 'var(--t2)' }}>
                                You are rejecting <strong>{rejectTarget.name}</strong>'s application. They will be notified.
                            </p>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Reason (optional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. Insufficient experience in required trade area..."
                                    value={rejectNote}
                                    onChange={e => setRejectNote(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid var(--bd)', borderRadius: 'var(--r)', background: 'transparent', color: 'var(--t1)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--bd)]">
                            <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
                                onClick={() => {
                                    reject.mutate({ id: rejectTarget.id, note: rejectNote || undefined }, {
                                        onSuccess: () => setRejectTarget(null),
                                    })
                                }}
                                disabled={reject.isPending}
                            >
                                {reject.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <XCircle size={14} className="mr-2" />}
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="card anim-fade-in mb-5">
                <div className="card-body" style={{ paddingBottom: 0 }}>
                    <div className="filter-bar">
                        <div className="filter-search">
                            <Search size={13} color="var(--t4)" />
                            <input placeholder="Search team members…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
                        </div>
                        <select className="select" style={{ width: 160 }} value={selectedRole || 'all'} onChange={e => { setSelectedRole(e.target.value === 'all' ? null : e.target.value); setPage(1) }}>
                            <option value="all">All Roles</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="company_admin">Company Admin</option>
                            <option value="office_manager">Office Manager</option>
                            <option value="dispatcher">Dispatcher</option>
                            <option value="technician">Technician</option>
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={() => setIsAddOpen(true)}>
                            <UserPlus size={14} className="mr-1.5" /> Add Member
                        </button>
                        <button className="btn btn-secondary btn-sm flex items-center gap-1.5 ml-auto" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
                            {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                        </button>
                    </div>
                </div>
                <div className="card-body-flush">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Team Member</th>
                                    <th>Role</th>
                                    <th>Phone</th>
                                    <th>Last Login</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {membersQuery.isLoading && Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                                ))}
                                {!membersQuery.isLoading && filteredMembers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--t3)' }}>
                                                <div style={{ width: 48, height: 48, background: 'var(--bg-active)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                                    <Users size={20} color="var(--t4)" />
                                                </div>
                                                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)' }}>No members found</p>
                                                <p style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>Try adjusting your search or filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!membersQuery.isLoading && paginatedMembers.map(member => (
                                    <tr
                                        key={member.id}
                                        className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                                        onClick={() => setEditMember(member)}
                                    >
                                        <td>
                                            <div className="cell-user">
                                                <div>
                                                    <div className="cell-name">{member.name}</div>
                                                    <div className="flex items-center gap-2 text-xs text-[var(--t3)]"><Mail size={12} className="text-[var(--t4)]" /> {member.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${['super_admin', 'company_admin'].includes(member.role) ? 'badge-violet' : member.role === 'technician' ? 'badge-green' : 'badge-blue'}`}>
                                                {ROLE_MAP[member.role] || member.role}
                                            </span>
                                        </td>
                                        <td className="text-sm">{member.phone || '—'}</td>
                                        <td>
                                            {member.lastLoginAt ? (
                                                <div className="text-sm">
                                                    <div className="font-500 text-1">
                                                        {new Date(member.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: new Date(member.lastLoginAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
                                                    </div>
                                                    <div className="text-xs text-3">
                                                        {new Date(member.lastLoginAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-4">Never</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${member.isActive ? 'badge-green' : 'badge-neutral'}`}>
                                                {member.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                                                <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEditMember(member)}>
                                                    <Edit2 size={14} />
                                                </button>
                                                {member.role !== 'super_admin' && (
                                                    <button className="btn btn-ghost btn-sm" title={member.isActive ? 'Deactivate' : 'Activate'} onClick={e => handleToggleActive(e, member)}>
                                                        <Lock size={14} />
                                                    </button>
                                                )}
                                                {member.role !== 'super_admin' && (
                                                    <button className="btn btn-ghost btn-sm" title="Remove Member" style={{ color: 'var(--red)' }} onClick={e => handleDelete(e, member)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                    <span className="text-[13px] text-[var(--t3)]">
                        Showing {filteredMembers.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
                    </span>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[13px] text-[var(--t2)] mx-2">Page {page} of {Math.max(1, totalPages)}</span>
                        <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Add Member Modal ──────────────────────────────────────── */}
            {isAddOpen && <AddMemberModal onClose={() => setIsAddOpen(false)} />}

            {/* ── Edit Member Modal ─────────────────────────────────────── */}
            {editMember && <EditMemberModal member={editMember} onClose={() => setEditMember(null)} />}

            {/* ── Pending Tech Detail Modal ─────────────────────────────── */}
            {viewTech && (
                <PendingTechModal
                    tech={viewTech}
                    onClose={() => setViewTech(null)}
                    onApprove={(id) => {
                        const tech = pendingTechs.find(t => t.id === id) ?? allMembers.find(t => t.id === id)
                        if (tech) handleApproveTech(tech)
                        else approve.mutate(id)
                        setViewTech(null)
                    }}
                    onReject={(tech) => { setViewTech(null); setRejectTarget(tech); setRejectNote('') }}
                    approving={approve.isPending}
                />
            )}
        </div>
    )
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({ onClose }: { onClose: () => void }) {
    const create = useCreateTeamMember()
    const createTechnician = useCreateTechnician()
    const ensureVan = useEnsureVan()
    const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'technician' })
    const [skills, setSkills] = useState<string[]>([])
    const [customSkill, setCustomSkill] = useState('')
    const [lat, setLat] = useState(6.9271)
    const [lng, setLng] = useState(79.8612)
    const [error, setError] = useState('')

    const isTechnician = form.role === 'technician'

    const COMMON_SKILLS = ['HVAC', 'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Roofing', 'Landscaping', 'Appliance Repair', 'General Maintenance']

    const toggleSkill = (s: string) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

    const addCustomSkill = () => {
        const s = customSkill.trim()
        if (s && !skills.includes(s)) { setSkills(prev => [...prev, s]); setCustomSkill('') }
    }

    const handleSubmit = () => {
        setError('')
        if (!form.name.trim()) { setError('Name is required'); return }
        if (!form.email.trim()) { setError('Email is required'); return }

        create.mutate(
            { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, role: form.role },
            {
                onSuccess: (newUser) => {
                    // If technician, also register in scheduling service with GPS
                    if (isTechnician) {
                        createTechnician.mutate({
                            userId: newUser.id,
                            name: form.name.trim(),
                            phone: form.phone.trim() || undefined,
                            skills: skills.length > 0 ? skills : undefined,
                            maxDailyJobs: 5,
                            latitude: lat,
                            longitude: lng,
                        }, {
                            onSuccess: () => {
                                // Auto-create van for the new technician
                                ensureVan.mutate(
                                    { technicianId: newUser.id, technicianName: form.name.trim() },
                                    { onSettled: () => onClose() },
                                )
                            },
                            onError: () => onClose(), // still close even if scheduling fails
                        })
                    } else {
                        onClose()
                    }
                },
                onError: (err: any) => {
                    const apiMessage = err?.response?.data?.message
                    const text = Array.isArray(apiMessage)
                        ? apiMessage.join(', ')
                        : (typeof apiMessage === 'string' ? apiMessage : 'Failed to create member')
                    setError(text)
                },
            }
        )
    }

    const inputCls = "w-full px-3 py-2 text-sm border border-[var(--bd)] rounded-[var(--r)] bg-transparent text-[var(--t1)] outline-none focus:border-[var(--blue)]"

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 admin-modal-backdrop" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-[var(--r)] shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh] admin-modal-box" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-[var(--bd)] shrink-0">
                    <h2 className="text-lg font-semibold text-[var(--t1)]">Add Team Member</h2>
                    <button onClick={onClose} className="topbar-icon-btn"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                    {error && <p className="text-sm text-[var(--red)] flex items-center gap-1"><AlertCircle size={14} /> {error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1">Full Name *</label>
                        <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Smith" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1">Email *</label>
                        <input className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" type="email" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1">Phone</label>
                        <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1">Role</label>
                        <select className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="company_admin">Company Admin</option>
                            <option value="office_manager">Office Manager</option>
                            <option value="dispatcher">Dispatcher</option>
                            <option value="technician">Technician</option>
                        </select>
                    </div>

                    {/* Technician-specific fields */}
                    {isTechnician && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-[var(--t2)] mb-2 flex items-center gap-1.5">
                                    <Briefcase size={13} /> Skills
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {COMMON_SKILLS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => toggleSkill(s)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${skills.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent border-[var(--bd)] text-[var(--t2)] hover:border-blue-400'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={customSkill}
                                        onChange={e => setCustomSkill(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCustomSkill()}
                                        placeholder="Custom skill…"
                                        className={`flex-1 ${inputCls}`}
                                    />
                                    <button onClick={addCustomSkill} className="px-3 py-1.5 bg-blue-600 text-white rounded-[var(--r)] text-xs font-medium cursor-pointer border-0">
                                        <Plus size={12} />
                                    </button>
                                </div>
                                {skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {skills.map(s => (
                                            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                {s}
                                                <button onClick={() => toggleSkill(s)} className="text-blue-500 bg-transparent border-0 cursor-pointer p-0 ml-0.5"><X size={10} /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--t2)] mb-2 flex items-center gap-1.5">
                                    <MapPin size={13} /> Home / Base Location
                                </label>
                                <MapPicker
                                    label=""
                                    lat={lat}
                                    lng={lng}
                                    onChange={(la, ln) => { setLat(la); setLng(ln) }}
                                    height="220px"
                                />
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--bd)] shrink-0">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={create.isPending || createTechnician.isPending}>
                        {(create.isPending || createTechnician.isPending) ? <Loader2 size={14} className="animate-spin mr-2" /> : <UserPlus size={14} className="mr-2" />}
                        Add Member
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Pending Tech Detail Modal ────────────────────────────────────────────────

function PendingTechModal({
    tech, onClose, onApprove, onReject, approving,
}: {
    tech: TeamMember
    onClose: () => void
    onApprove: (id: string) => void
    onReject: (tech: TeamMember) => void
    approving: boolean
}) {
    const hasLocation = !!(tech.latitude && tech.longitude)
    const mapSrc = hasLocation
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${tech.longitude! - 0.05},${tech.latitude! - 0.05},${tech.longitude! + 0.05},${tech.latitude! + 0.05}&layer=mapnik&marker=${tech.latitude},${tech.longitude}`
        : null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 admin-modal-backdrop" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-[var(--r)] shadow-2xl w-full max-w-xl mx-4 flex flex-col max-h-[92vh] admin-modal-box" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-[var(--bd)] shrink-0">
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>
                        {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{tech.name}</h2>
                        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Technician Application</div>
                    </div>
                    <span style={{ background: '#f59e0b22', color: '#f59e0b', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>Pending Review</span>
                    <button onClick={onClose} className="topbar-icon-btn ml-2"><X size={18} /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                    {/* Contact info */}
                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            { icon: '📧', label: 'Email', value: tech.email },
                            { icon: '📞', label: 'Phone', value: tech.phone || 'Not provided' },
                            { icon: '📅', label: 'Applied', value: new Date(tech.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                            { icon: '🆔', label: 'User ID', value: tech.id.slice(0, 8) + '…' },
                        ].map(row => (
                            <div key={row.label} style={{ background: 'var(--bg-active)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--bd)' }}>
                                <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 4 }}>{row.icon} {row.label}</div>
                                <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500, wordBreak: 'break-all' }}>{row.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Skills */}
                    {tech.skills?.length > 0 && (
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Briefcase size={13} /> Skills & Trades
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {tech.skills.map(s => (
                                    <span key={s} style={{ fontSize: 12, background: 'var(--blue-dim)', color: 'var(--blue)', borderRadius: 6, padding: '4px 10px', fontWeight: 500 }}>{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Map */}
                    <div>
                        <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={13} /> Home / Base Location
                        </div>
                        {mapSrc ? (
                            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--bd)' }}>
                                <iframe
                                    src={mapSrc}
                                    style={{ width: '100%', height: 220, border: 'none', display: 'block' }}
                                    title="Technician location"
                                />
                                <div style={{ padding: '8px 12px', background: 'var(--bg-active)', fontSize: 12, color: 'var(--t3)' }}>
                                    📍 {tech.latitude?.toFixed(5)}, {tech.longitude?.toFixed(5)}
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '20px', background: 'var(--bg-active)', borderRadius: 8, border: '1px solid var(--bd)', textAlign: 'center', color: 'var(--t4)', fontSize: 13 }}>
                                No location provided
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--bd)] shrink-0">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                    <button
                        className="btn btn-secondary"
                        style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                        onClick={() => onReject(tech)}
                    >
                        <XCircle size={14} className="mr-1.5" /> Reject
                    </button>
                    <button
                        className="btn btn-primary"
                        style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
                        onClick={() => onApprove(tech.id)}
                        disabled={approving}
                    >
                        {approving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <CheckCircle size={14} className="mr-1.5" />}
                        Approve Technician
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Edit Member Modal ────────────────────────────────────────────────────────

function EditMemberModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
    const update = useUpdateTeamMember()
    const [form, setForm] = useState({ name: member.name, email: member.email, phone: member.phone || '', role: member.role })
    const [error, setError] = useState('')

    const handleSubmit = () => {
        setError('')
        if (!form.name.trim()) { setError('Name is required'); return }
        if (!form.email.trim()) { setError('Email is required'); return }

        update.mutate(
            { id: member.id, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, role: form.role },
            {
                onSuccess: () => onClose(),
                onError: (err: any) => setError(err?.response?.data?.message ?? 'Failed to update member'),
            }
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 admin-modal-backdrop" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-[var(--r)] shadow-xl w-full max-w-md mx-4 admin-modal-box" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-[var(--bd)]">
                    <h2 className="text-lg font-semibold text-[var(--t1)]">Edit Team Member</h2>
                    <button onClick={onClose} className="topbar-icon-btn"><X size={18} /></button>
                </div>
                <div className="p-5 flex flex-col gap-4">
                    {error && <p className="text-sm text-[var(--red)] flex items-center gap-1"><AlertCircle size={14} /> {error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1">Full Name *</label>
                        <input className="w-full px-3 py-2 text-sm border border-[var(--bd)] rounded-[var(--r)] bg-transparent text-[var(--t1)] outline-none focus:border-[var(--blue)]"
                            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1">Email *</label>
                        <input className="w-full px-3 py-2 text-sm border border-[var(--bd)] rounded-[var(--r)] bg-transparent text-[var(--t1)] outline-none focus:border-[var(--blue)]"
                            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1">Phone</label>
                        <input className="w-full px-3 py-2 text-sm border border-[var(--bd)] rounded-[var(--r)] bg-transparent text-[var(--t1)] outline-none focus:border-[var(--blue)]"
                            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1">Role</label>
                        <select className="w-full px-3 py-2 text-sm border border-[var(--bd)] rounded-[var(--r)] bg-transparent text-[var(--t1)] outline-none focus:border-[var(--blue)]"
                            value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={member.role === 'super_admin'}>
                            <option value="super_admin">Super Admin</option>
                            <option value="company_admin">Company Admin</option>
                            <option value="office_manager">Office Manager</option>
                            <option value="dispatcher">Dispatcher</option>
                            <option value="technician">Technician</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--bd)]">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={update.isPending}>
                        {update.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Edit2 size={14} className="mr-2" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}
