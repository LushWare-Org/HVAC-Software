import { Edit2, Trash2, Lock, Key, Users, Shield, Briefcase, Maximize2, Minimize2, Search, ChevronLeft, ChevronRight, Mail } from 'lucide-react'
import { useState } from 'react'

const MOCK_TEAM = [
    { _id: '1', name: 'Sarah Anderson', email: 'sarah@hvac-platform.com', role: 'super admin', phone: '+44 7700 900077', lastLogin: new Date().toISOString(), status: 'online', rating: null },
    { _id: '2', name: 'James Lee', email: 'james.lee@hvac-platform.com', role: 'office manager', phone: '+44 7700 900123', lastLogin: new Date(Date.now() - 3600000).toISOString(), status: 'away', rating: null },
    { _id: '3', name: 'Anna Smith', email: 'anna.s@hvac-platform.com', role: 'technician', phone: '+44 7700 900456', lastLogin: new Date(Date.now() - 86400000).toISOString(), status: 'offline', rating: 4.8 },
]

export default function Team() {
    const [teamMembers] = useState<any[]>(MOCK_TEAM)
    const [selectedRole, setSelectedRole] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [isExpanded, setIsExpanded] = useState(false)
    const [page, setPage] = useState(1)
    const itemsPerPage = 10
    const getRoleDisplay = (role: string) => {
        const roleMap: Record<string, string> = {
            'super admin': 'Super Admin',
            'company admin': 'Company Admin',
            'office manager': 'Office Manager',
            'dispatcher': 'Dispatcher',
            'technician': 'Technician',
            'customer': 'Customer'
        }
        return roleMap[role] || role
    }

    const getStatusDisplay = (status: string) => {
        if (status === 'online') return 'Online'
        if (status === 'away') return 'Away'
        return 'Offline'
    }

    const adminCount = teamMembers.filter(m => m.role === 'super admin' || m.role === 'company admin').length
    const techCount = teamMembers.filter(m => m.role === 'technician').length
    const dispatchCount = teamMembers.filter(m => m.role === 'dispatcher').length

    const filteredTeamMembers = teamMembers.filter(m => {
        let matchRole = !selectedRole || m.role === selectedRole;
        if (selectedRole === 'admin') {
            matchRole = m.role === 'super admin' || m.role === 'company admin';
        }
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || m.status === filterStatus;
        return matchRole && matchSearch && matchStatus;
    })

    const totalPages = Math.ceil(filteredTeamMembers.length / itemsPerPage)
    const paginatedTeamMembers = filteredTeamMembers.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    return (
        <div className="anim-fade-up">
            {!isExpanded && (
                <div className="kpi-grid mb-5 mt-2">
                    {[
                        { l: 'Total Members', v: teamMembers.length, icon: Users, role: null, showBg: false },
                        { l: 'Admins', v: adminCount, icon: Shield, role: 'admin', showBg: true },
                        { l: 'Technicians', v: techCount, icon: Briefcase, role: 'technician', showBg: true },
                        { l: 'Dispatchers', v: dispatchCount, icon: Briefcase, role: 'dispatcher', showBg: true },
                    ].map(k => {
                        const isActive = selectedRole === k.role;
                        const applyActiveBg = isActive && k.showBg;
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
                                onClick={() => setSelectedRole(isActive ? null : k.role)}
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

            <div className="card anim-fade-in mb-5">
                <div className="card-body" style={{ paddingBottom: 0 }}>
                    <div className="filter-bar">
                        <div className="filter-search">
                            <Search size={13} color="var(--t4)" />
                            <input placeholder="Search files…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                        </div>
                        <select className="select" style={{ width: 160 }} value={selectedRole || 'all'} onChange={e => { setSelectedRole(e.target.value === 'all' ? null : e.target.value); setPage(1); }}>
                            <option value="all">All Roles</option>
                            <option value="super admin">Super Admin</option>
                            <option value="company admin">Company Admin</option>
                            <option value="office manager">Office Manager</option>
                            <option value="dispatcher">Dispatcher</option>
                            <option value="technician">Technician</option>
                            <option value="customer">Customer</option>
                        </select>
                        <select className="select" style={{ width: 140 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                            <option value="all">All Status</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                            <option value="away">Away</option>
                        </select>
                        <button className="btn btn-secondary btn-sm flex items-center gap-1.5 ml-auto" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Collapse View" : "Expand View"}>
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
                                    <th style={{ textAlign: 'center' }}>Rating</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeamMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--t3)' }}>
                                                <div style={{ width: 48, height: 48, background: 'var(--bg-active)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                                    <Users size={20} color="var(--t4)" />
                                                </div>
                                                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)' }}>No members found</p>
                                                <p style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>No members match the selected role filter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTeamMembers.map(member => (
                                        <tr
                                            key={member._id}
                                            onClick={() => window.dispatchEvent(new CustomEvent("open-technician-detail", { detail: member }))}
                                            className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                                        >
                                            <td>
                                                <div className="cell-user">
                                                    <div>
                                                        <div className="cell-name">{member.name}</div>
                                                        <div className="flex items-center gap-2"><Mail size={12} className="text-[var(--t4)]" /> {member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${['super admin', 'company admin'].includes(member.role) ? 'badge-violet' : 'badge-green'}`}>
                                                    {getRoleDisplay(member.role)}
                                                </span>
                                            </td>
                                            <td className="text-sm">{member.phone || '—'}</td>
                                            <td>
                                                {member.lastLogin ? (
                                                    <div className="text-sm">
                                                        <div className="font-500 text-1">
                                                            {new Date(member.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: new Date(member.lastLogin).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
                                                        </div>
                                                        <div className="text-xs text-3">
                                                            {new Date(member.lastLogin).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-4">Never</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${member.status === 'online' ? 'badge-green' : member.status === 'away' ? 'badge-amber' : 'badge-neutral'}`}>
                                                    {getStatusDisplay(member.status)}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {member.rating ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="text-amber-500 font-bold text-sm">★ {member.rating}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[var(--t4)]">—</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-1 justify-end">
                                                    <button className="btn btn-ghost btn-sm" title="Edit">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    {member.role !== 'super admin' && (
                                                        <button className="btn btn-ghost btn-sm" title="Assign Permissions">
                                                            <Lock size={14} />
                                                        </button>
                                                    )}
                                                    <button className="btn btn-ghost btn-sm" title="Force Password Reset">
                                                        <Key size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" title="Remove Member" style={{ color: 'var(--red)' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                    <span className="text-[13px] text-[var(--t3)]">
                        Showing {filteredTeamMembers.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, filteredTeamMembers.length)} of {filteredTeamMembers.length} members
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                            style={{ width: 32, height: 32 }}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[13px] text-[var(--t2)] mx-2">
                            Page {page} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                            style={{ width: 32, height: 32 }}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
