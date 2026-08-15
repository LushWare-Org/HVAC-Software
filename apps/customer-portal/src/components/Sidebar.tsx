import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wrench,
  FileText,
  MessageSquare,
  Thermometer,
  Fan,
  Lightbulb,
  Tag,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  FolderKanban,
  Home,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMyProjects } from '../hooks/useMyProjects'
import { useMyComponents } from '../hooks/useMyComponent'
import { useTheme } from '../contexts/ThemeContext'
import { useUnreadMyThreadsCount } from '../hooks/useCustomerPortal'
import { useCompany } from '../contexts/CompanyContext'

interface Props {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean // undefined = desktop mode, true/false = mobile mode
}

export default function Sidebar({ collapsed, onToggle, mobileOpen }: Props) {
  const isMobileMode = mobileOpen !== undefined
  const loc = useLocation()
  const { theme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const unreadMessages = useUnreadMyThreadsCount()
  const { data: myProjects } = useMyProjects()
  const hasProjects = (myProjects?.length ?? 0) > 0
  const { data: myComponents } = useMyComponents()
  const hasComponent = (myComponents?.length ?? 0) > 0

  const NAV = [
    {
      items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/', badge: 0 }],
    },
    {
      items: [
        { icon: Wrench, label: 'My Jobs', path: '/jobs', badge: 0 },
        { icon: FileText, label: 'Invoices', path: '/invoices', badge: 0 },
        { icon: FileText, label: 'Quotes', path: '/quotes', badge: 0 },
        { icon: MessageSquare, label: 'Messages', path: '/messages', badge: unreadMessages },
        { icon: Thermometer, label: 'My Devices', path: '/devices', badge: 0 },
        { icon: Fan, label: 'My Equipment', path: '/equipment', badge: 0 },
        { icon: ShieldCheck, label: 'My Plans', path: '/agreements', badge: 0 },
        // Only shown when the customer actually has a project
        ...(hasProjects ? [{ icon: FolderKanban, label: 'My Projects', path: '/projects', badge: 0 }] : []),
        // Only shown when the customer owns a project component
        ...(hasComponent ? [{ icon: Home, label: 'My Property', path: '/my-property', badge: 0 }] : []),
        { icon: User, label: 'Profile', path: '/profile', badge: 0 },
      ],
    },
    {
      label: 'From Us',
      items: [
        { icon: Lightbulb, label: 'Tips & Videos', path: '/tips', badge: 0 },
        { icon: Tag, label: 'Offers', path: '/offers', badge: 0 },
      ],
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  const isLight = theme === 'light'
  const mobileClass = isMobileMode
    ? (mobileOpen ? 'mobile-visible' : 'mobile-hidden')
    : ''

  const sidebarClasses = [
    'fixed left-0 top-0 bottom-0 z-[200] flex flex-col overflow-hidden shadow-xl transform-gpu',
    'transition-[width,transform] duration-[var(--dur-slow)] ease-[var(--ease)]',
    collapsed ? 'w-[var(--sidebar-w-col)]' : 'w-[var(--sidebar-w)]',
    isLight
      ? 'bg-gradient-to-b from-slate-900 to-slate-800 text-white'
      : 'bg-[var(--bg-surface)] text-[var(--t2)]',
    isLight ? 'border-r border-slate-700' : 'border-r border-[var(--bd)]',
    mobileClass,
  ].join(' ')

  const headerBorder = isLight ? 'border-slate-700' : 'border-b border-[var(--bd)]'
  const navItemBase = 'flex items-center rounded-lg cursor-pointer text-[15px] font-medium transition-colors duration-150 select-none whitespace-nowrap overflow-hidden no-underline'
  const navItemActive = isLight
    ? 'bg-slate-600 text-white'
    : 'bg-[var(--bg-active)] text-[var(--blue)] font-semibold'
  const navItemInactive = isLight
    ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
    : 'text-[var(--t3)] hover:bg-[var(--bg-hover)] hover:text-[var(--t2)]'
  const footerBorder = isLight ? 'border-slate-700' : 'border-t border-[var(--bd)]'
  const loggedInCard = isLight
    ? 'bg-slate-700 rounded-lg p-3'
    : 'px-3.5 py-3 rounded-xl bg-[var(--bg-card-2)] border border-[var(--bd)]'
  const loggedInLabel = isLight ? 'text-[11px] text-slate-400 mb-0.5' : 'text-[11px] text-[var(--t4)] mb-1 tracking-wide'
  const loggedInName = isLight ? 'text-sm font-semibold text-white leading-tight truncate' : 'text-sm font-bold text-[var(--t1)] leading-tight mb-0.5'
  const loggedInRole = isLight ? 'text-xs text-slate-400 mt-0.5 capitalize' : 'text-xs text-[var(--t3)]'
  const collapseBtn = isLight
    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border-0'
    : 'border border-[var(--bd)] bg-[var(--bg-card)] text-[var(--t2)] hover:bg-[var(--bg-hover)] hover:text-[var(--t1)]'

  const { settings } = useCompany()
  const brandName = settings?.name || 'HVACtor.ai'

  return (
    <aside className={sidebarClasses}>
      <div className={`flex items-center flex-shrink-0 h-20 border-b ${headerBorder} ${collapsed ? 'justify-center px-0' : 'justify-start px-5 gap-3.5'}`}>
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 font-bold text-white text-xl overflow-hidden shadow-lg">
          {settings?.logoUrl
            ? <img src={settings.logoUrl} alt={brandName} className="w-full h-full object-cover" />
            : (initials[0] ?? 'U')}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className={`text-lg font-bold leading-tight truncate ${isLight ? 'text-white' : 'text-[var(--t1)]'}`}>
              {brandName}
            </h2>
            <p className={`text-[11px] leading-tight mt-0.5 truncate ${isLight ? 'text-slate-400' : 'text-[var(--t3)]'}`}>
              {settings?.name ? 'Powered by HVACtor.ai' : 'Your Service Portal'}
            </p>
          </div>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto flex flex-col gap-1.5 ${collapsed ? 'px-1 py-5' : 'px-2 py-5'}`}>
        {NAV.map((group, index) => (
          <div key={index} className="flex flex-col gap-1">
            {'label' in group && group.label && !collapsed && (
              <div style={{
                fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: isLight ? 'rgba(255,255,255,0.35)' : 'var(--t4)',
                padding: '12px 16px 4px',
              }}>
                {group.label}
              </div>
            )}
            {index > 0 && !('label' in group && group.label) && (
              <div style={{
                height: 1, margin: '4px 12px 6px',
                background: isLight ? 'rgba(255,255,255,0.08)' : 'var(--bd)',
              }} />
            )}
            {group.items.map(item => {
              const Icon = item.icon
              const active = loc.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={[
                    navItemBase,
                    collapsed ? 'justify-center w-9 h-9 mx-auto p-0' : 'gap-3 px-4 py-2.5',
                    active ? navItemActive : navItemInactive,
                  ].join(' ')}
                >
                  {/* Icon with red dot overlay when there are unread messages */}
                  <span className="flex items-center justify-center flex-shrink-0 relative">
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                    {item.badge > 0 && (
                      <span style={{
                        position: 'absolute', top: -3, right: -3,
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#ef4444',
                        boxShadow: '0 0 0 2px var(--bg-surface)',
                      }} />
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 min-w-0">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="flex items-center justify-center px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex-shrink-0">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className={`flex flex-col gap-2 flex-shrink-0 border-t ${footerBorder} ${collapsed ? 'px-1 py-3 items-center' : 'px-3 py-3'}`}>
        {!collapsed && user && (
          <div className={loggedInCard}>
            <p className={loggedInLabel}>Logged in as</p>
            <p className={loggedInName}>{user.name}</p>
            <p className={loggedInRole}>{user.email}</p>
          </div>
        )}
        <button
          title="Logout"
          className={[
            'flex items-center justify-center gap-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium h-10 transition-colors duration-150 cursor-pointer border-0 flex-shrink-0',
            collapsed ? 'w-9 mx-auto' : 'w-full px-4',
          ].join(' ')}
          onClick={handleLogout}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          id="btn-sidebar-toggle"
          className={[
            'flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer h-9 flex-shrink-0',
            collapseBtn,
            collapsed ? 'w-9 mx-auto' : 'w-full',
          ].join(' ')}
        >
          {collapsed ? <Menu size={18} /> : <X size={16} />}
        </button>
      </div>
    </aside>
  )
}
