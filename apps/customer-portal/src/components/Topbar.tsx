import { useState, useRef, useEffect } from 'react'
import {
  Bell,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  User,
  LogOut,
  Calendar,
  RefreshCw,
  Menu,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useMarkAllMyNotificationsRead, useMarkMyNotificationRead, useMyNotifications } from '../hooks/useCustomerPortal'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/jobs': 'My Jobs',
  '/invoices': 'Invoices',
  '/quotes': 'Quotes',
  '/messages': 'Messages',
  '/profile': 'My Profile',
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

interface TopbarProps {
  onMenuClick?: () => void
  showMenu?: boolean
}

export default function Topbar({ onMenuClick, showMenu }: TopbarProps) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const notif = useDropdown()
  const userMenu = useDropdown()

  const notificationsQuery = useMyNotifications(20)
  const markNotificationRead = useMarkMyNotificationRead()
  const markAllRead = useMarkAllMyNotificationsRead()
  const notifications = notificationsQuery.data?.data ?? []
  const unreadCount = notifications.filter(n => !n.isRead).length

  const pageTitle = PAGE_TITLES[window.location.pathname] ?? 'Customer Portal'
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {showMenu && (
          <button className="topbar-hamburger" onClick={onMenuClick} title="Menu">
            <Menu size={20} />
          </button>
        )}
        <div>
          <div className="topbar-title">{pageTitle}</div>
          <div className="topbar-subtitle">
            <Calendar size={12} />
            <span>{dateStr}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Refresh" onClick={() => window.location.reload()}>
          <RefreshCw size={17} />
        </button>

        <button className="topbar-icon-btn" title={`Switch theme (${theme})`} onClick={toggleTheme}>
          {theme === 'light' ? <Sun size={17} /> : theme === 'dark' ? <Moon size={17} /> : <Monitor size={17} />}
        </button>

        <div ref={notif.ref} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            title="Notifications"
            onClick={() => {
              notif.setOpen(o => !o)
              userMenu.setOpen(false)
            }}
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {notif.open && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 320,
                background: 'var(--bg-card)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 500,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--bd)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Notifications</span>
                {unreadCount > 0 && <span className="badge badge-blue">{unreadCount} unread</span>}
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 && (
                  <div style={{ padding: '16px', fontSize: 12, color: 'var(--t3)' }}>No new notifications</div>
                )}
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead.mutate(n.id)}
                    style={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderTop: '1px solid var(--bd)',
                      background: n.isRead ? 'transparent' : 'var(--blue-glow)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{n.body}</div>
                  </button>
                ))}
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    style={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'center',
                      padding: '10px 12px',
                      borderTop: '1px solid var(--bd)',
                      background: 'var(--bg-card-2)',
                      color: 'var(--blue)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={userMenu.ref} style={{ position: 'relative' }}>
          <button
            className="topbar-user-btn"
            onClick={() => {
              userMenu.setOpen(o => !o)
              notif.setOpen(false)
            }}
          >
            <div className="topbar-avatar">{initials}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
              <span className="topbar-user-name">{user?.name ?? 'Account'}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--t4)', flexShrink: 0 }} />
          </button>

          {userMenu.open && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 220,
                background: 'var(--bg-card)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 500,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bd)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{user?.email}</div>
              </div>
              <div style={{ padding: 8 }}>
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    navigate('/profile')
                    userMenu.setOpen(false)
                  }}
                >
                  <User size={15} style={{ color: 'var(--t3)' }} />
                  Profile
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-menu-item danger" onClick={handleLogout}>
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
