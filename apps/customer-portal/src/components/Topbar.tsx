import { useState, useRef, useEffect } from 'react'
import {
    Bell, Sun, Moon, Monitor, ChevronDown,
    User, LogOut, Calendar, RefreshCw
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const NOTIFICATIONS = [
    { id: 1, type: 'success', title: 'Job Completed', msg: 'Your AC maintenance is complete', time: '2 min ago', read: false },
    { id: 2, type: 'info', title: 'Invoice Sent', msg: 'Invoice INV-2024-001 has been sent', time: '18 min ago', read: false },
    { id: 3, type: 'info', title: 'Booking Confirmed', msg: 'Your service appointment is scheduled', time: '1 hr ago', read: true },
]

const PAGE_META: Record<string, { title: string; actions?: string }> = {
    '/': {
        title: 'Dashboard'
    },
    '/jobs': {
        title: 'My Jobs',
    },
    '/invoices': {
        title: 'Invoices',
    },
    '/profile': {
        title: 'My Profile',
    },
}

function useDropdown() {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])
    return { open, setOpen, ref }
}

const MOCK_USER = {
    name: 'John Smith',
    initials: 'JS',
}

export default function Topbar() {
    const { pathname } = useLocation()
    const { theme, toggleTheme } = useTheme()
    const notif = useDropdown()
    const user = useDropdown()
    const unread = NOTIFICATIONS.filter(n => !n.read).length

    const page = PAGE_META[pathname] || { title: 'Customer Portal' }
    const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
    })

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="topbar-title">{page.title}</div>
                <div className="topbar-subtitle">
                    <Calendar size={12} />
                    <span>{dateStr}</span>
                </div>
            </div>

            <div className="topbar-right">
                <button
                    className="topbar-icon-btn"
                    title="Refresh"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCw size={17} />
                </button>

                <button
                    className="topbar-icon-btn"
                    title={`Switch theme (${theme})`}
                    onClick={toggleTheme}
                >
                    {theme === 'light' ? <Sun size={17} /> : theme === 'dark' ? <Moon size={17} /> : <Monitor size={17} />}
                </button>

                <div ref={notif.ref} style={{ position: 'relative' }}>
                    <button
                        className="topbar-icon-btn"
                        title="Notifications"
                        onClick={() => { notif.setOpen(o => !o); user.setOpen(false) }}
                    >
                        <Bell size={17} />
                        {unread > 0 && <span className="notif-badge">{unread}</span>}
                    </button>

                    {notif.open && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            width: 320,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--bd)',
                            borderRadius: 'var(--r-xl)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 500,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '14px 16px',
                                borderBottom: '1px solid var(--bd)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Notifications</span>
                                {unread > 0 && (
                                    <span className="badge badge-blue">{unread} new</span>
                                )}
                            </div>
                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                {NOTIFICATIONS.map(n => (
                                    <div
                                        key={n.id}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--bd)',
                                            cursor: 'pointer',
                                            background: n.read ? 'transparent' : 'var(--blue-dim)',
                                            transition: 'background var(--dur-fast)'
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'var(--blue-dim)')}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>{n.title}</div>
                                        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4, lineHeight: 1.4 }}>{n.msg}</div>
                                        <div style={{ fontSize: 11, color: 'var(--t4)' }}>{n.time}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid var(--bd)' }}>
                                <button style={{
                                    fontSize: 12, color: 'var(--blue)', fontWeight: 600,
                                    background: 'none', border: 'none', cursor: 'pointer'
                                }}>
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User menu */}
                <div ref={user.ref} style={{ position: 'relative' }}>
                    <button
                        className="topbar-user-btn"
                        onClick={() => { user.setOpen(o => !o); notif.setOpen(false) }}
                    >
                        <div className="topbar-avatar">{MOCK_USER.initials}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                            <span className="topbar-user-name">{MOCK_USER.name}</span>
                        </div>
                        <ChevronDown size={14} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                    </button>

                    {user.open && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            width: 200,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--bd)',
                            borderRadius: 'var(--r-xl)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 500,
                            overflow: 'hidden'
                        }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bd)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{MOCK_USER.name}</div>
                            </div>
                            <div style={{ padding: 8 }}>
                                {[
                                    { icon: User, label: 'Profile' },
                                ].map(item => {
                                    const Icon = item.icon
                                    return (
                                        <button
                                            key={item.label}
                                            className="dropdown-menu-item"
                                        >
                                            <Icon size={15} style={{ color: 'var(--t3)' }} />
                                            {item.label}
                                        </button>
                                    )
                                })}
                                <div className="dropdown-divider" />
                                <button className="dropdown-menu-item danger">
                                    <LogOut size={15} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
