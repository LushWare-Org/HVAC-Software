import { Edit2, Trash2, Lock, Users, Shield, Briefcase, Maximize2, Minimize2, Search, ChevronLeft, ChevronRight, Mail, Plus, X, Loader2, AlertCircle, RefreshCw, UserPlus, MapPin } from 'lucide-react'
import { useState, useMemo } from 'react'
import {
    useTeamMembers,
    useCreateTeamMember,
    useUpdateTeamMember,
    useDeleteTeamMember,
    type TeamMember,
} from '../hooks/useTeam'
import { useCreateTechnician } from '../hooks/useScheduling'
import MapPicker from '../components/MapPicker'

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
                    ].map(k => {
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
                                    background: applyActiveBg ? 'var(--green-dim)' : undefined,
                                    borderColor: applyActiveBg ? 'var(--green-dim)' : undefined
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

            {membersQuery.isError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
                    <AlertCircle size={14} /> Failed to load team members.
                    <button onClick={() => membersQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                        <RefreshCw size={12} /> Retry
                    </button>
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
        </div>
    )
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({ onClose }: { onClose: () => void }) {
    const create = useCreateTeamMember()
    const createTechnician = useCreateTechnician()
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
                            onSuccess: () => onClose(),
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-[var(--r)] shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-[var(--r)] shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
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
