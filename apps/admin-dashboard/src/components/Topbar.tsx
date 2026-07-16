import { useState, useRef, useEffect } from 'react'
import { Bell, Search, Sun, Moon, Monitor, ChevronDown, User, Settings as SettingsIcon, LogOut, Calendar, Plus, ArrowRight, Download, RefreshCw, LayoutDashboard, CalendarDays, MapPin, Menu } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import AddJobModal from '../pages/jobs/AddJobModal'
import JobDetailModal from '../pages/jobs/JobDetailModal'
import CustomerDetailsSidebar from '../pages/customers/CustomerDetailsSidebar'
import InvoiceDetailModal from '../pages/finance/InvoiceDetailModal'
import QuoteDetailModal from '../pages/finance/QuoteDetailModal'
import ExpenseDetailModal from '../pages/finance/ExpenseDetailModal'
import AddInvoiceModal from '../pages/finance/AddInvoiceModal'
import AddQuoteModal from '../pages/finance/AddQuoteModal'
import SchedulingDetailModal from '../pages/scheduling/SchedulingDetailModal'
import TechnicianDetailModal from '../pages/scheduling/TechnicianDetailModal'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/useComms'

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

export default function Topbar({ onMenuClick, showMenu }: TopbarProps = {}) {
    const [search, setSearch] = useState('')
    const { pathname } = useLocation()
    const { theme, toggleTheme } = useTheme()
    const notif = useDropdown()
    const user = useDropdown()
    const [searchParams, setSearchParams] = useSearchParams()
    const currentView = searchParams.get('view') || 'dispatch'
    const notificationsQuery = useNotifications(8)
    const markNotificationRead = useMarkNotificationRead()
    const markAllNotificationsRead = useMarkAllNotificationsRead()
    const notifications = notificationsQuery.data?.data ?? []
    const unread = notifications.filter(n => !n.isRead).length
    const isLight = theme === 'light'
    const [isAddJobOpen, setIsAddJobOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedJob, setSelectedJob] = useState<any>(null)
    const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [isQuoteDetailOpen, setIsQuoteDetailOpen] = useState(false)
    const [selectedQuote, setSelectedQuote] = useState<any>(null)
    const [isExpenseDetailOpen, setIsExpenseDetailOpen] = useState(false)
    const [selectedExpense, setSelectedExpense] = useState<any>(null)
    const [isSchedulingDetailOpen, setIsSchedulingDetailOpen] = useState(false)
    const [selectedScheduling, setSelectedScheduling] = useState<any>(null)
    const [isTechnicianDetailOpen, setIsTechnicianDetailOpen] = useState(false)
    const [selectedTechnician, setSelectedTechnician] = useState<any>(null)

    // Customer detail (opened from job view or anywhere via event)
    const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false)
    const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<any>(null)
    const [customerDetailReturnJob, setCustomerDetailReturnJob] = useState<any>(null)

    // Finance creation from job context
    const [isAddQuoteFromJobOpen, setIsAddQuoteFromJobOpen] = useState(false)
    const [isAddInvoiceFromJobOpen, setIsAddInvoiceFromJobOpen] = useState(false)
    const [financeContextJob, setFinanceContextJob] = useState<any>(null)

    // Return context when navigating job → finance doc and back
    const [financeReturn, setFinanceReturn] = useState<{ type: 'invoice' | 'quote'; label: string; doc: any } | null>(null)

    useEffect(() => {
        const handler = (e: Event) => {
            const job = (e as CustomEvent).detail
            setSelectedJob(job)
            setIsDetailOpen(true)
        }
        window.addEventListener('open-job-detail', handler)
        return () => window.removeEventListener('open-job-detail', handler)
    }, [])

    useEffect(() => {
        const handler = () => setIsAddJobOpen(true)
        window.addEventListener('open-add-job', handler)
        return () => window.removeEventListener('open-add-job', handler)
    }, [])

    useEffect(() => {
        const handler = (e: Event) => {
            const { job, returnTo } = (e as CustomEvent).detail
            setIsInvoiceDetailOpen(false)
            setIsQuoteDetailOpen(false)
            setSelectedJob(job)
            setFinanceReturn({ type: returnTo.type, label: returnTo.label, doc: returnTo.doc })
            setIsDetailOpen(true)
        }
        window.addEventListener('open-job-from-finance', handler)
        return () => window.removeEventListener('open-job-from-finance', handler)
    }, [])

    useEffect(() => {
        const handler = (e: Event) => {
            const invoice = (e as CustomEvent).detail
            setSelectedInvoice(invoice)
            setIsInvoiceDetailOpen(true)
        }
        window.addEventListener('open-invoice-detail', handler)
        return () => window.removeEventListener('open-invoice-detail', handler)
    }, [])

    useEffect(() => {
        const handler = (e: Event) => {
            const quote = (e as CustomEvent).detail
            setSelectedQuote(quote)
            setIsQuoteDetailOpen(true)
        }
        window.addEventListener('open-quote-detail', handler)
        return () => window.removeEventListener('open-quote-detail', handler)
    }, [])

    useEffect(() => {
        const handler = (e: Event) => {
            const expense = (e as CustomEvent).detail
            setSelectedExpense(expense)
            setIsExpenseDetailOpen(true)
        }
        window.addEventListener('open-expense-detail', handler)
        return () => window.removeEventListener('open-expense-detail', handler)
    }, [])

    useEffect(() => {
        const handler = (e: Event) => {
            const schedule = (e as CustomEvent).detail
            setSelectedScheduling(schedule)
            setIsSchedulingDetailOpen(true)
        }
        window.addEventListener('open-scheduling-detail', handler)
        return () => window.removeEventListener('open-scheduling-detail', handler)
    }, [])

    const handleCloseSchedulingDetail = () => {
        setIsSchedulingDetailOpen(false);
        window.dispatchEvent(new CustomEvent('scheduling-detail-closed'));
    };

    useEffect(() => {
        const handler = (e: Event) => {
            const technician = (e as CustomEvent).detail
            setSelectedTechnician(technician)
            setIsTechnicianDetailOpen(true)
        }
        window.addEventListener('open-technician-detail', handler)
        return () => window.removeEventListener('open-technician-detail', handler)
    }, [])

    useEffect(() => {
        const handler = (e: Event) => {
            const payload = (e as CustomEvent).detail
            // Payload may be { customer, returnToJob } OR just a customer object directly
            const customer = payload?.customer ?? payload
            const returnJob = payload?.returnToJob ?? null
            setSelectedCustomerDetail(customer)
            setCustomerDetailReturnJob(returnJob)
            setIsCustomerDetailOpen(true)
        }
        window.addEventListener('open-customer-detail', handler)
        return () => window.removeEventListener('open-customer-detail', handler)
    }, [])

    const { user: authUser, logout } = useAuth()
    const navigate = useNavigate()
    const currentUser = {
        name: authUser?.name ?? 'User',
        role: (authUser?.role ?? 'admin').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        initials: (authUser?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    }

    const getPageHeader = () => {
        switch (pathname) {
            case '/': return { title: 'Dashboard', sub: '' }
            case '/customers': return { title: 'Customers & CRM', sub: 'Manage customers and leads' }
            case '/jobs': return { title: 'Jobs', sub: 'Manage and track all your service work orders' }
            case '/scheduling': return { title: 'Scheduling & Dispatch', sub: 'Assign jobs and track field operations' }
            case '/dispatch': return { title: 'Dispatch', sub: 'Smart technician assignment and live field tracking' }
            case '/agreements': return { title: 'Service Agreements', sub: 'Maintenance plans and recurring service contracts' }
            case '/planner': return { title: 'Day Planner', sub: 'Plan and assign a full day of jobs on the map' }
            case '/projects': return { title: 'Projects', sub: 'Long-running engagements with dedicated crews' }
            case '/marketing': return { title: 'Marketing', sub: 'Campaigns, templates and automations' }
            case '/inventory': return { title: 'Inventory', sub: 'Items, stock levels and purchase orders' }
            case '/bandit-dashboard': return { title: 'ML Operations', sub: '' }
            case '/import': return { title: 'Data Import', sub: 'Bring customers and jobs in from other systems' }
            case '/import/admin': return { title: 'Import History', sub: '' }
            case '/finance': return { title: 'Finance', sub: 'Invoices, quotes, expenses and cash flow' }
            case '/communications': return { title: 'Communications', sub: 'Customer messaging and marketing automations' }
            case '/analytics': return { title: 'Analytics', sub: 'Business intelligence and performance insights' }
            case '/settings': return { title: 'Settings', sub: '' }
            case '/profile': return { title: 'My Profile', sub: 'Manage your account and preferences' }
            case '/team': return { title: 'Team Management', sub: '' }
            default:
                if (pathname.startsWith('/projects/')) return { title: 'Project', sub: '' }
                return { title: 'Admin Platform', sub: '' }
        }
    }
    const headerParams = getPageHeader()
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })

    const getSearchPlaceholder = () => {
        switch (pathname) {
            case '/customers': return "Search customers..."
            case '/jobs': return "Search jobs..."
            case '/analytics': return "Search reports..."
            case '/settings': return "Search settings..."
            case '/team': return "Search team members..."
            default: return "Search customers, jobs..."
        }
    }

    const btnBase = "inline-flex items-center justify-center gap-1.5 px-3.5 h-[34px] rounded-[var(--r)] text-[13px] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease)] whitespace-nowrap leading-none select-none cursor-pointer border-none"
    const btnSm = "h-[28px] px-2.5 text-[12px]"
    const btnPrimary = `${btnBase} bg-[var(--blue)] text-white shadow-[0_1px_2px_rgba(37,99,235,0.2)] hover:bg-[#1D4ED8] hover:shadow-[0_2px_4px_rgba(37,99,235,0.3)] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[0_1px_2px_rgba(37,99,235,0.2)]`
    const btnSecondary = `${btnBase} bg-[var(--bg-card)] text-[var(--t2)] border border-[var(--bd-md)] shadow-[var(--shadow-xs)] hover:bg-[var(--bg-hover)] hover:text-[var(--t1)] hover:border-[var(--bd-lg)]`

    const getPageActions = () => {
        switch (pathname) {
            case '/': return (
                <>
                    <button className={`${btnSecondary} ${btnSm}`}><Calendar size={14} /> Today</button>
                    <button className={`${btnPrimary} ${btnSm}`}><ArrowRight size={14} /> New Job</button>
                </>
            )
            case '/jobs': return <button className={`${btnPrimary} ${btnSm}`} id="btn-create-job" onClick={() => setIsAddJobOpen(true)}><Plus size={13} /> Create Job</button>
            case '/finance': return (
                <>
                    <button className={`${btnSecondary} ${btnSm}`} onClick={() => window.dispatchEvent(new CustomEvent('finance-export'))}><Download size={13} /> Export CSV</button>
                </>
            )
            case '/analytics': return <button className={`${btnPrimary} ${btnSm}`}><Download size={13} /> Export Report</button>
            case '/team': return <button className={`${btnPrimary} ${btnSm}`}><Plus size={13} /> Add Team Member</button>
            default: return null
        }
    }

    const topbarBg = isLight ? 'bg-white border-slate-200' : 'bg-[var(--bg-surface)] border-[var(--bd)]'
    const searchIconColor = isLight ? 'text-slate-400' : 'text-[var(--t3)]'
    const btnClass = isLight
        ? 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        : 'border-[var(--bd)] text-[var(--t2)] hover:bg-[var(--bg-hover)] hover:text-[var(--t1)]'
    const dropdownBg = isLight ? 'bg-white border-slate-200' : 'bg-[var(--bg-surface)] border-[var(--bd)]'
    const dropdownText = isLight ? 'text-slate-800' : 'text-[var(--t1)]'
    const dropdownTextMuted = isLight ? 'text-slate-500' : 'text-[var(--t3)]'
    const dropdownTime = isLight ? 'text-slate-400' : 'text-[var(--t4)]'
    const dropdownUnreadBg = isLight ? 'bg-blue-50' : 'bg-[var(--bg-active)]'
    const dropdownHover = isLight ? 'hover:bg-slate-50' : 'hover:bg-[var(--bg-hover)]'
    const dividerBorder = isLight ? 'border-slate-200' : 'border-[var(--bd)]'

    return (
        <>
            <header className={`admin-topbar h-20 border-b flex items-center justify-between px-6 gap-6 flex-shrink-0 sticky top-0 z-30 transition-colors duration-300 ${topbarBg}`}>
                <div className="flex-1 min-w-0 flex items-center gap-3">
                    {showMenu && (
                        <button
                            className="topbar-hamburger"
                            onClick={onMenuClick}
                            title="Menu"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                    <div className="min-w-0">
                    <h2 className={`text-2xl font-bold tracking-tight truncate ${isLight ? 'text-slate-900' : 'text-[var(--t1)]'}`}>
                        {headerParams.title}
                    </h2>
                    <div className={`hidden sm:flex items-center gap-1.5 text-sm mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-[var(--t3)]'}`}>
                        <Calendar size={14} />
                        <span>{dateStr}</span>
                    </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {!['/analytics', '/settings', '/communications', '/finance',].includes(pathname) && (
                        <div className="flex items-center gap-4">
                            {pathname === '/scheduling' && (
                                <div className="flex items-center gap-1 rounded-xl p-1 border border-[var(--bd)] bg-[var(--bg-input)]">
                                    {[
                                        { id: 'dispatch', label: 'Dispatch Board', icon: LayoutDashboard },
                                        { id: 'calendar', label: 'Full Calendar', icon: CalendarDays },
                                        { id: 'map', label: 'Live Map', icon: MapPin }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setSearchParams({ view: tab.id });
                                                const event = new CustomEvent('changeSchedulingView', { detail: tab.id });
                                                window.dispatchEvent(event);
                                            }}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${currentView === tab.id
                                                ? (isLight ? 'bg-blue-600 text-white shadow-md' : 'bg-[var(--primary)] text-white shadow-sm')
                                                : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-[var(--t3)] hover:text-[var(--t1)] hover:bg-[var(--bg-hover)]')
                                                }`}
                                        >
                                            <tab.icon size={14} />
                                            <span className="whitespace-nowrap">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {pathname !== '/scheduling' && (
                                <div className={`hidden md:flex items-center gap-3 border rounded-xl px-4 py-2.5 w-[280px] lg:w-[320px] transition-colors duration-300 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[var(--bg-input)] border-[var(--bd)]'}`}>
                                    <Search size={16} className={`flex-shrink-0 ${searchIconColor}`} />
                                    <input
                                        type="text"
                                        placeholder={getSearchPlaceholder()}
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className={`flex-1 bg-transparent border-none outline-none text-[14px] font-medium ${isLight ? 'text-slate-700 placeholder-slate-400' : 'text-[var(--t1)] placeholder-[var(--t4)]'}`}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Actions */}
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => window.location.reload()}
                            title="Refresh Page"
                            className={`flex items-center justify-center w-11 h-11 border rounded-xl transition-colors duration-150 ${btnClass}`}
                        >
                            <RefreshCw size={20} />
                        </button>

                        <button
                            onClick={toggleTheme}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            className={`flex items-center justify-center w-11 h-11 border rounded-xl transition-colors duration-150 ${btnClass}`}
                        >
                            {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
                        </button>

                        <div ref={notif.ref} className="relative">
                            <button
                                onClick={() => { notif.setOpen(o => !o); user.setOpen(false) }}
                                title="Notifications"
                                className={`relative flex items-center justify-center w-11 h-11 border rounded-xl transition-colors duration-150 ${btnClass}`}
                            >
                                <Bell size={20} />
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                        {unread}
                                    </span>
                                )}
                            </button>

                            {notif.open && (
                                <div className={`topbar-dropdown absolute top-[calc(100%+8px)] right-0 w-80 border rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.15)] z-50 overflow-hidden ${dropdownBg}`}>
                                    <div className={`p-4 border-b ${dividerBorder}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className={`text-sm font-semibold ${dropdownText}`}>Notifications</div>
                                            {unread > 0 && (
                                                <button
                                                    onClick={() => markAllNotificationsRead.mutate()}
                                                    className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 transition-colors bg-transparent border-0 cursor-pointer"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 && (
                                            <div className={`p-4 text-xs ${dropdownTextMuted}`}>
                                                No notifications yet.
                                            </div>
                                        )}
                                        {notifications.map((n) => (
                                            <button
                                                key={n.id}
                                                onClick={() => markNotificationRead.mutate(n.id)}
                                                className={`w-full text-left p-3 border-b ${dividerBorder} transition-colors duration-150 ${n.isRead ? 'bg-transparent' : dropdownUnreadBg} ${dropdownHover} bg-transparent cursor-pointer`}
                                            >
                                                <div className={`text-[13px] font-semibold mb-0.5 ${dropdownText}`}>{n.title}</div>
                                                <div className={`text-xs leading-relaxed mb-1 ${dropdownTextMuted}`}>{n.body}</div>
                                                <div className={`text-[11px] ${dropdownTime}`}>{new Date(n.createdAt).toLocaleString()}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className={`p-3 border-t text-center ${dividerBorder}`}>
                                        <button
                                            onClick={() => {
                                                navigate('/communications')
                                                notif.setOpen(false)
                                            }}
                                            className="text-xs text-blue-500 font-medium hover:text-blue-400 transition-colors bg-transparent border-0 cursor-pointer"
                                        >
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {pathname !== '/' && (
                        <div className={`flex items-center gap-3 border-l pl-4 ml-2 ${isLight ? 'border-slate-200' : 'border-[var(--bd)]'}`}>
                            {getPageActions()}
                        </div>
                    )}

                    {/* User Menu */}
                    <div ref={user.ref} className="relative">
                            <button
                                onClick={() => { user.setOpen(o => !o); notif.setOpen(false) }}
                                className={`flex items-center gap-3 px-3 py-1.5 border rounded-xl transition-colors duration-150 ${btnClass}`}
                            >
                                <div className="w-10 h-10 flex items-center justify-center bg-blue-600 rounded-lg text-white text-[13px] font-bold flex-shrink-0 shadow-sm">
                                    {currentUser.initials}
                                </div>
                                <div className="hidden sm:flex flex-col items-start pr-1">
                                    <span className={`text-[14px] font-semibold leading-tight ${isLight ? 'text-slate-800' : 'text-[var(--t1)]'}`}>
                                        {currentUser.name}
                                    </span>
                                    <span className={`text-[12px] font-medium leading-tight ${isLight ? 'text-slate-500' : 'text-[var(--t3)]'}`}>
                                        {currentUser.role}
                                    </span>
                                </div>
                                <ChevronDown size={16} className={isLight ? 'text-slate-400' : 'text-[var(--t3)]'} />
                            </button>

                            {user.open && (
                                <div className={`topbar-dropdown absolute top-[calc(100%+8px)] right-0 w-48 border rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.15)] z-50 overflow-hidden ${dropdownBg}`}>
                                    <div className={`px-3.5 py-3 border-b ${dividerBorder}`}>
                                        <div className={`text-[13px] font-semibold ${dropdownText}`}>My Account</div>
                                    </div>
                                    <div className="p-2">
                                        {[
                                            { icon: User, label: 'Profile', path: '/profile' },
                                            { icon: SettingsIcon, label: 'Settings', path: '/settings' }
                                        ].map((item) => {
                                            const Icon = item.icon
                                            return (
                                                <button
                                                    key={item.label}
                                                    onClick={() => { navigate(item.path); user.setOpen(false) }}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-[14px] text-left font-medium bg-transparent border-0 cursor-pointer mb-0.5 ${isLight ? 'text-slate-700 hover:bg-slate-50 hover:text-slate-900' : 'text-[var(--t2)] hover:bg-[var(--bg-hover)] hover:text-[var(--t1)]'}`}
                                                >
                                                    <Icon size={16} className={isLight ? 'text-slate-400' : 'text-[var(--t3)]'} />
                                                    {item.label}
                                                </button>
                                            )
                                        })}
                                        <div className={`h-px my-2 ${isLight ? 'bg-slate-100' : 'bg-[var(--bd)]'}`} />
                                        <button onClick={logout} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-[13px] text-left font-medium text-red-500 hover:bg-red-500/10 bg-transparent border-0 cursor-pointer`}>
                                            <LogOut size={14} className="text-red-500" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </header>

            <AddJobModal
                isOpen={isAddJobOpen}
                onClose={() => setIsAddJobOpen(false)}
            />
            <JobDetailModal
                isOpen={isDetailOpen}
                onClose={() => { setIsDetailOpen(false); setFinanceReturn(null); }}
                job={selectedJob}
                onCreateQuote={(j) => { setFinanceContextJob(j); setIsDetailOpen(false); setFinanceReturn(null); setIsAddQuoteFromJobOpen(true); }}
                onCreateInvoice={(j) => { setFinanceContextJob(j); setIsDetailOpen(false); setFinanceReturn(null); setIsAddInvoiceFromJobOpen(true); }}
                backLabel={financeReturn?.label}
                onBack={financeReturn ? () => {
                    if (financeReturn.type === 'invoice') {
                        setSelectedInvoice(financeReturn.doc)
                        setIsInvoiceDetailOpen(true)
                    } else {
                        setSelectedQuote(financeReturn.doc)
                        setIsQuoteDetailOpen(true)
                    }
                } : undefined}
            />
            <InvoiceDetailModal
                isOpen={isInvoiceDetailOpen}
                onClose={() => setIsInvoiceDetailOpen(false)}
                invoice={selectedInvoice}
            />
            <QuoteDetailModal
                isOpen={isQuoteDetailOpen}
                onClose={() => setIsQuoteDetailOpen(false)}
                quote={selectedQuote}
            />
            <ExpenseDetailModal
                isOpen={isExpenseDetailOpen}
                onClose={() => setIsExpenseDetailOpen(false)}
                expense={selectedExpense}
            />
            <SchedulingDetailModal
                isOpen={isSchedulingDetailOpen}
                onClose={handleCloseSchedulingDetail}
                schedule={selectedScheduling}
            />
            <TechnicianDetailModal
                isOpen={isTechnicianDetailOpen}
                onClose={() => setIsTechnicianDetailOpen(false)}
                technician={selectedTechnician}
            />
            <CustomerDetailsSidebar
                isOpen={isCustomerDetailOpen}
                onClose={() => { setIsCustomerDetailOpen(false); setSelectedCustomerDetail(null); setCustomerDetailReturnJob(null); }}
                person={selectedCustomerDetail}
                onBack={customerDetailReturnJob ? () => {
                    setIsCustomerDetailOpen(false);
                    setSelectedCustomerDetail(null);
                    setCustomerDetailReturnJob(null);
                    setSelectedJob(customerDetailReturnJob);
                    setIsDetailOpen(true);
                } : undefined}
            />

            {/* Finance creation from job context */}
            <AddQuoteModal
                isOpen={isAddQuoteFromJobOpen}
                onClose={() => { setIsAddQuoteFromJobOpen(false); setFinanceContextJob(null); }}
                prefilledJob={financeContextJob}
                onBack={financeContextJob ? () => {
                    setIsAddQuoteFromJobOpen(false);
                    setSelectedJob(financeContextJob);
                    setIsDetailOpen(true);
                } : undefined}
            />
            <AddInvoiceModal
                isOpen={isAddInvoiceFromJobOpen}
                onClose={() => { setIsAddInvoiceFromJobOpen(false); setFinanceContextJob(null); }}
                prefilledJob={financeContextJob}
                onBack={financeContextJob ? () => {
                    setIsAddInvoiceFromJobOpen(false);
                    setSelectedJob(financeContextJob);
                    setIsDetailOpen(true);
                } : undefined}
            />
        </>
    )
}
