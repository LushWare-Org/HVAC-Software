import { useLocation, Link } from 'react-router-dom'
import { ROUTE_LOADERS } from '../App'
import { prefetchRouteData } from '../lib/prefetchRoutes'

// Warm a route before the user clicks. Called on hover/focus — by the time
// they release the mouse the JS chunk is usually in the module cache AND the
// page's data is in the React Query cache (prefetchRouteData respects
// staleTime, so hovering repeatedly costs nothing while data is fresh).
const prefetched = new Set<string>()
function prefetchRoute(path: string) {
  prefetchRouteData(path)
  if (prefetched.has(path)) return
  const loader = ROUTE_LOADERS[path]
  if (!loader) return
  prefetched.add(path)
  // Fire-and-forget; network errors are retried on actual navigation.
  loader().catch(() => prefetched.delete(path))
}
import {
    LayoutDashboard, Users, Wrench, CalendarDays,
    DollarSign, MessageSquare, BarChart3, Settings,
    Menu, X, LogOut, Shield, Package, Megaphone, Upload, FileSignature, FolderKanban,
    ChevronLeft, Plus, Radio,
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { usePendingTechnicians } from '../hooks/useTeam'
import { useUnreadThreadsCount } from '../hooks/useComms'
import { useCompany } from '../hooks/useSettings'

interface Props { collapsed: boolean; onToggle: () => void; mobileOpen?: boolean }

export default function Sidebar({ collapsed, onToggle, mobileOpen }: Props) {
    const loc = useLocation()
    const { theme } = useTheme()
    const { user: authUser, logout } = useAuth()
    const pendingQuery = usePendingTechnicians()
    const pendingCount = pendingQuery.data?.total ?? 0
    const unreadMessages = useUnreadThreadsCount()
    const companyQuery = useCompany()
    const company = companyQuery.data

    const currentUser = {
        name: authUser?.name ?? 'User',
        role: (authUser?.role ?? 'admin').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        initials: (authUser?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    }

    const isLight = theme === 'light'
    const isMobileMode = mobileOpen !== undefined
    const mobileClass = isMobileMode
        ? (mobileOpen ? 'mobile-visible' : 'mobile-hidden')
        : ''

    const sidebarClasses = [
        'fixed left-0 top-0 bottom-0 z-[200] flex flex-col overflow-hidden shadow-xl transform-gpu',
        'transition-[width,transform] duration-[var(--dur-slow)] ease-[var(--ease)]',
        collapsed ? 'w-[var(--sidebar-w-col)]' : 'w-[var(--sidebar-w)]',
        mobileClass,
        isLight
            ? 'bg-gradient-to-b from-slate-900 to-slate-800 text-white'
            : 'bg-[var(--bg-surface)] text-[var(--t2)]',
        isLight ? 'border-r border-slate-700' : 'border-r border-[var(--bd)]'
    ].join(' ')

    const headerBorder = isLight ? 'border-slate-700' : 'border-b border-[var(--bd)]'
    const navItemBase = 'flex items-center rounded-lg cursor-pointer text-[15px] font-medium transition-colors duration-150 select-none whitespace-nowrap overflow-hidden no-underline'
    const navItemActive = isLight ? 'bg-slate-600 text-white' : 'bg-[var(--bg-active)] text-[var(--blue)] font-semibold'
    const navItemInactive = isLight ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-[var(--t3)] hover:bg-[var(--bg-hover)] hover:text-[var(--t2)]'
    const footerBorder = isLight ? 'border-slate-700' : 'border-t border-[var(--bd)]'
    const loggedInCard = isLight ? 'bg-slate-700 rounded-lg p-3' : 'px-3.5 py-3 rounded-xl bg-[var(--bg-card-2)] border border-[var(--bd)]'
    const loggedInLabel = isLight ? 'text-[11px] text-slate-400 mb-0.5' : 'text-[11px] text-[var(--t4)] mb-1 tracking-wide'
    const loggedInName = isLight ? 'text-sm font-semibold text-white leading-tight truncate' : 'text-sm font-bold text-[var(--t1)] leading-tight mb-0.5'
    const loggedInRole = isLight ? 'text-xs text-slate-400 mt-0.5 capitalize' : 'text-xs text-[var(--t3)]'
    const collapseBtn = isLight
        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border-0'
        : 'border border-[var(--bd)] bg-[var(--bg-card)] text-[var(--t2)] hover:bg-[var(--bg-hover)] hover:text-[var(--t1)]'

    const NAV = [
        {
            label: 'Home',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
            ],
        },
        {
            label: 'Operations',
            items: [
                { icon: Wrench, label: 'Jobs', path: '/jobs', badge: 0 },
                { icon: CalendarDays, label: 'Scheduling', path: '/scheduling' },
                { icon: FolderKanban, label: 'Projects', path: '/projects' },
                { icon: FileSignature, label: 'Agreements', path: '/agreements' },
            ],
        },
        {
            label: 'Sales & customers',
            items: [
                { icon: Users, label: 'Customers & CRM', path: '/customers' },
                { icon: Megaphone, label: 'Marketing', path: '/marketing' },
                { icon: MessageSquare, label: 'Communications', path: '/communications', badge: unreadMessages },
            ],
        },
        {
            label: 'Money',
            items: [
                { icon: DollarSign, label: 'Finance', path: '/finance' },
                { icon: Package, label: 'Inventory', path: '/inventory' },
                { icon: BarChart3, label: 'Analytics', path: '/analytics' },
                // { icon: Brain, label: 'Bandit AI', path: '/bandit-dashboard' },
            ],
        },
        {
            label: 'Workspace',
            items: [
                { icon: Upload, label: 'Integrations', path: '/import' },
                { icon: Shield, label: 'Team', path: '/team', pendingDot: pendingCount > 0 },
                { icon: Settings, label: 'Settings', path: '/settings' },
            ],
        },
        // Super-admin-only monitoring surface — hidden from every other role,
        // not just visually but at the route level too (see App.tsx).
        ...(authUser?.role === 'super_admin' ? [{
            label: 'System',
            items: [
                { icon: Radio, label: 'System Activity', path: '/system-activity' },
            ],
        }] : []),
    ]

    const groupLabelClass = isLight ? 'text-slate-500' : 'text-[var(--t4)]'
    const createBtnClass = isLight
        ? 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white shadow-lg shadow-blue-900/30'
        : 'bg-gradient-to-r from-[var(--blue)] to-blue-400 hover:brightness-110 text-white shadow-md'

    return (
        <aside className={sidebarClasses}>
            <div className={`flex items-center flex-shrink-0 h-20 border-b ${headerBorder} ${collapsed ? 'justify-center px-0' : 'justify-between px-5 gap-2'}`}>
                <div className={`flex items-center min-w-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    {/* Company logo or initial avatar */}
                    {company?.logoUrl ? (
                        <img
                            src={company.logoUrl}
                            alt={company.name ?? 'Company'}
                            className="w-11 h-11 rounded-xl object-contain flex-shrink-0 shadow-lg"
                            style={{ background: 'var(--bg-card-2)', padding: 2 }}
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 font-bold text-white text-xl overflow-hidden shadow-lg">
                            {(company?.name ?? 'H')[0].toUpperCase()}
                        </div>
                    )}
                    {!collapsed && (
                        <div className="min-w-0">
                            <h2 className={`text-lg font-bold leading-tight truncate ${isLight ? 'text-white' : 'text-[var(--t1)]'}`}>
                                {company?.name ?? 'HVACtor.ai'}
                            </h2>
                            <p className={`text-[11px] leading-tight mt-0.5 truncate ${isLight ? 'text-slate-400' : 'text-[var(--t3)]'}`}>
                                Management Dashboard
                            </p>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <button
                        onClick={onToggle}
                        title={isMobileMode ? 'Close menu' : 'Collapse sidebar'}
                        className={[
                            'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer flex-shrink-0',
                            collapseBtn,
                        ].join(' ')}
                    >
                        {isMobileMode ? <X size={15} /> : <ChevronLeft size={15} />}
                    </button>
                )}
            </div>

            {!collapsed && (
                <div className="px-3 pt-4 flex-shrink-0">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-add-job'))}
                        className={[
                            'w-full flex items-center justify-center gap-2 rounded-xl h-11 text-sm font-semibold cursor-pointer border-0 transition-all duration-150',
                            createBtnClass,
                        ].join(' ')}
                    >
                        <Plus size={16} strokeWidth={2.5} /> Create job
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto flex flex-col gap-4 ${collapsed ? 'px-1 py-5' : 'px-2 py-5'}`}>
                {NAV.map((group, index) => (
                    <div key={index} className="flex flex-col gap-1">
                        {!collapsed && (
                            <div className={`px-3 pb-1 text-[10px] font-bold uppercase tracking-wider ${groupLabelClass}`}>
                                {group.label}
                            </div>
                        )}
                        {group.items.map((item: any) => {
                            const Icon = item.icon
                            const active = loc.pathname === item.path
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={collapsed ? item.label : undefined}
                                    onMouseEnter={() => prefetchRoute(item.path)}
                                    onFocus={() => prefetchRoute(item.path)}
                                    className={[
                                        navItemBase,
                                        collapsed ? 'justify-center w-9 h-9 mx-auto p-0' : 'gap-3 px-4 py-2.5',
                                        active ? navItemActive : navItemInactive,
                                    ].join(' ')}
                                >
                                    {/* Icon with optional red dot overlay */}
                                    <span className="flex items-center justify-center flex-shrink-0 relative">
                                        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                                        {(item.pendingDot || item.badge > 0) && (
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
                                            {item.pendingDot && (
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                            )}
                                            {item.badge > 0 && (
                                                <span className="flex items-center justify-center px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex-shrink-0">
                                                    {item.badge}
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
                {!collapsed && (
                    <div className={loggedInCard}>
                        <p className={loggedInLabel}>Logged in as</p>
                        <p className={loggedInName}>{currentUser.name}</p>
                        <p className={loggedInRole}>{currentUser.role}</p>
                    </div>
                )}
                <button
                    onClick={logout}
                    title="Logout"
                    className={[
                        'flex items-center justify-center gap-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium h-10 transition-colors duration-150 cursor-pointer border-0 flex-shrink-0',
                        collapsed ? 'w-9 mx-auto' : 'w-full px-4',
                    ].join(' ')}
                >
                    <LogOut size={16} className="flex-shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </button>
                {collapsed && (
                    <button
                        onClick={onToggle}
                        title="Expand sidebar"
                        id="btn-sidebar-toggle"
                        className={[
                            'flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer h-9 w-9 mx-auto flex-shrink-0',
                            collapseBtn,
                        ].join(' ')}
                    >
                        <Menu size={18} />
                    </button>
                )}
            </div>
        </aside>
    )
}
