import type { LucideIcon } from 'lucide-react'
import {
  CalendarClock,
  Smartphone,
  Users,
  ReceiptText,
  Boxes,
  BrainCircuit,
  LayoutDashboard,
  Route,
  ShieldCheck,
  Zap,
  Clock,
  TrendingUp,
  Briefcase,
  MapPinned,
  FolderKanban,
  FileClock,
  UserCog,
  Megaphone,
  MessagesSquare,
  RefreshCw,
  Heart,
  DollarSign,
  Wallet,
  PackageSearch,
  LineChart,
  Radar,
  Ruler,
  UserPlus,
  Settings,
  Rocket,
  ClipboardList,
  PhoneCall,
  Thermometer,
  Wifi,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Brand + navigation                                                        */
/* -------------------------------------------------------------------------- */

export const BRAND = {
  name: 'HVACtor.AI',
  tagline: 'Field Service Management for the trades',
  email: 'sales@hvactor.ai',
  phone: '+1 (123) 456-7890',
  address: '2200 Market Street, Suite 700, Denver, CO 80205',
}

export interface NavItem {
  to: string
  label: string
}

export const NAV_LINKS: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
]

export const PRODUCT_SHOTS = {
  jobsList: '/platform/jobs-list-in-hvactor-ai.jpg',
  liveDispatch: '/platform/live-scheduling-map-in-hvactor-ai.jpg',
  projects: '/platform/project-overview-in-hvactor-ai.jpg',
  serviceAgreements: '/platform/service-agreements-in-hvactor-ai.jpg',
  crm: '/platform/customer-crm-in-hvactor-ai.jpg',
  marketing: '/platform/marketing-automations-in-hvactor-ai.jpg',
  communications: '/platform/communications-inbox-in-hvactor-ai.jpg',
  agentSettings: '/platform/ai-agent-settings-in-hvactor-ai.jpg',
  finance: '/platform/finance-dashboard-in-hvactor-ai.jpg',
  inventory: '/platform/inventory-tracking-in-hvactor-ai.jpg',
  analytics: '/platform/analytics-dashboard-in-hvactor-ai.jpg',
  integrations: '/platform/integrations-settings-in-hvactor-ai.jpg',
}

export const IMAGES = {
  industrialUnit: '/platform/1.jpg',
  industrialUnitAlt: 'HVAC technicians servicing a rooftop industrial unit',
  dataViz: '/platform/analytics-dashboard-in-hvactor-ai.jpg',
  dataVizAlt: 'HVACtor analytics dashboard visualizing live business data',
}


export interface Feature {
  id: string
  index: string
  icon: LucideIcon
  title: string
  tagline: string
  short: string
  description: string
  bullets: string[]
  image: string
  imageAlt: string
  url?: string
}

export const FEATURES: Feature[] = [
  {
    id: 'dispatch',
    index: '01',
    icon: CalendarClock,
    title: 'Scheduling & Dispatch',
    tagline: 'Fill the board, optimize the route',
    short:
      'Drag-and-drop scheduling with real-time GPS tracking. Automatically assign the right technician based on skills, location, and availability, with route optimization that adapts to traffic and emergencies as the day unfolds.',
    description:
      'A drag-and-drop dispatch board that reads real drive times and technician skills, so the right tech reaches the right job — without the phone-tag.',
    bullets: [
      'Drag-and-drop calendar with live capacity',
      'Skill & certification-based auto-assignment',
      'Route optimization across the whole crew',
      'Automated arrival-window texts to customers',
    ],
    image: PRODUCT_SHOTS.liveDispatch,
    imageAlt: 'Live scheduling map in HVACtor.ai',
    url: 'app.hvactor.ai/scheduling',
  },
  {
    id: 'mobile',
    index: '02',
    icon: Smartphone,
    title: 'Technician Mobile App',
    tagline: 'The truck cab, digitized',
    short:
      'Give your field team a powerful mobile app for job details, customer history, and equipment manuals on-site. Capture photos, collect signatures, and process payments right from the job — even fully offline.',
    description:
      'Everything a tech needs in the field, online or off: work orders, equipment history, checklists, photos, and on-site payment capture.',
    bullets: [
      'Full offline mode with automatic sync',
      'Guided checklists & photo documentation',
      'Capture signatures and take card payments',
      'One-tap access to equipment service history',
    ],
    image: PRODUCT_SHOTS.jobsList,
    imageAlt: 'Jobs list in HVACtor.ai',
    url: 'app.hvactor.ai/jobs',
  },
  {
    id: 'crm',
    index: '03',
    icon: Users,
    title: 'CRM & Customer Records',
    tagline: 'Every home, every unit, one record',
    short:
      'Complete customer profiles with equipment details, service history, warranty tracking, and communication logs. Build lasting relationships with automated maintenance reminders and personalized follow-ups that keep customers coming back.',
    description:
      'A service-first CRM built around equipment, not just contacts. Track every install, warranty, and visit against the physical asset.',
    bullets: [
      'Equipment & warranty tracking per address',
      'Complete service and communication timeline',
      'Membership & maintenance-plan management',
      'Smart follow-up reminders that renew revenue',
    ],
    image: PRODUCT_SHOTS.crm,
    imageAlt: 'Customer CRM in HVACtor.ai',
    url: 'app.hvactor.ai/crm',
  },
  {
    id: 'invoicing',
    index: '04',
    icon: ReceiptText,
    title: 'Invoicing & Payments',
    tagline: 'Paid before the van leaves',
    short:
      'Generate professional invoices on-site and accept payments instantly via card, ACH, or financing. Auto-calculate labor, parts, and taxes, then send automated reminders so unpaid invoices get collected faster.',
    description:
      'Generate branded invoices from the job, collect payment on-site, and reconcile automatically — no double entry, no waiting.',
    bullets: [
      'Good-better-best quotes customers approve in-app',
      'On-site and online card / ACH payments',
      'Automated deposits, progress and final billing',
      'QuickBooks two-way sync',
    ],
    image: PRODUCT_SHOTS.finance,
    imageAlt: 'Finance dashboard in HVACtor.ai',
    url: 'app.hvactor.ai/finance',
  },
  {
    id: 'inventory',
    index: '05',
    icon: Boxes,
    title: 'Inventory & Parts',
    tagline: 'Know what is on every truck',
    short:
      'Track every part across your trucks and warehouse in real time. Set low-stock alerts so you never run out of critical components, and auto-reorder from preferred suppliers before a job stalls.',
    description:
      'Track parts across the warehouse and every truck, trigger reorders before you run dry, and cost every job accurately.',
    bullets: [
      'Per-truck and warehouse stock levels',
      'Low-stock alerts and automated purchase orders',
      'Barcode scanning from the mobile app',
      'True job costing on parts and labor',
    ],
    image: PRODUCT_SHOTS.inventory,
    imageAlt: 'Inventory tracking in HVACtor.ai',
    url: 'app.hvactor.ai/inventory',
  },
  {
    id: 'analytics',
    index: '06',
    icon: BrainCircuit,
    title: 'AI Analytics & Insights',
    tagline: 'Decisions, not dashboards',
    short:
      'Real-time dashboards showing revenue, job completion rates, technician performance, and customer satisfaction. Get plain-language weekly summaries and one-click exports for tax season or strategic planning.',
    description:
      'HVACtor watches your operation and surfaces what matters — predicted failures, at-risk revenue, and the jobs worth chasing.',
    bullets: [
      'Predictive maintenance recommendations',
      'Revenue-at-risk and churn signals',
      'Technician efficiency and first-time-fix rates',
      'Plain-language weekly business summaries',
    ],
    image: PRODUCT_SHOTS.analytics,
    imageAlt: 'Analytics dashboard in HVACtor.ai',
    url: 'app.hvactor.ai/analytics',
  },
  {
    id: 'portal',
    index: '07',
    icon: LayoutDashboard,
    title: 'Customer Self-Service Portal',
    tagline: 'Let customers help themselves',
    short: 'Customers book, approve estimates, pay invoices, and track their tech — self-serve.',
    description:
      'A branded portal where customers book, approve estimates, pay invoices, and track their technician in real time.',
    bullets: [
      'Online booking that respects your capacity',
      'Estimate approvals and secure online payment',
      'Live technician tracking and ETAs',
      'Self-serve service history and documents',
    ],
    image: PRODUCT_SHOTS.serviceAgreements,
    imageAlt: 'Service agreements board in HVACtor.ai',
    url: 'app.hvactor.ai/agreements',
  },
]

/* -------------------------------------------------------------------------- */
/*  Platform tour — Operations & Sales showcases (real product screenshots)   */
/* -------------------------------------------------------------------------- */

export interface ShowcaseItem {
  id: string
  index: string
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
  image: string
  imageAlt: string
  url?: string
}

export const OPERATIONS_SHOWCASE: ShowcaseItem[] = [
  {
    id: 'jobs',
    index: '01',
    icon: Briefcase,
    title: 'Jobs, Tracked from Call to Closeout',
    description:
      'Every job carries its own status, priority, and history - so nothing depends on someone remembering to follow up. Completed, invoiced, paid, or overdue, the board shows the real state of the business at a glance.',
    bullets: [
      'Priority flags for Emergency, High, Normal, and Low-Urgency calls',
      'Full job history searchable by Customer, Technician, or Service Type',
      'Status moves automatically as Invoices are Sent and Paid',
    ],
    image: PRODUCT_SHOTS.jobsList,
    imageAlt: 'Jobs list in HVACtor.ai',
    url: 'app.hvactor.ai/jobs',
  },
  {
    id: 'dispatch',
    index: '02',
    icon: MapPinned,
    title: 'Live Dispatch and Scheduling',
    description:
      'See every unassigned job on a map next to every technician’s live status. Smart-assign routes work to the closest available van; nothing sits in a queue because someone forgot to check a group chat.',
    bullets: [
      'Live technician locations and availability, updated in real time',
      'One-tap smart assign or manual assignment, either way',
      'Board, active, completed, and calendar views of the same data',
    ],
    image: PRODUCT_SHOTS.liveDispatch,
    imageAlt: 'Live scheduling map in HVACtor.ai',
    url: 'app.hvactor.ai/scheduling',
  },
  {
    id: 'projects',
    index: '03',
    icon: FolderKanban,
    title: 'Projects that Hold Multiple Jobs Together',
    description:
      'Multi-visit installs and retrofits get their own timeline - budget, crew, quoted-versus-invoiced totals, and every linked job in one view, instead of scattered across separate work orders.',
    bullets: [
      'Budget, quoted, invoiced, and paid tracked against one project',
      'A default crew assigned per project, not re-picked every visit',
      'Site details pinned straight onto the dispatch map',
    ],
    image: PRODUCT_SHOTS.projects,
    imageAlt: 'Project overview in HVACtor.ai',
    url: 'app.hvactor.ai/projects',
  },
  {
    id: 'agreements',
    index: '04',
    icon: FileClock,
    title: 'Service Agreements that Schedule Themselves',
    description:
      'Maintenance plans generate their own recurring visits - no one has to remember which customers are due this quarter. Renewals, expirations, and contract value stay visible on one board.',
    bullets: [
      'Recurring visits created automatically from the agreement terms',
      'Renewal and expiration status tracked without a separate spreadsheet',
      'Active contract value rolled up across the whole customer base',
    ],
    image: PRODUCT_SHOTS.serviceAgreements,
    imageAlt: 'Service agreements board in HVACtor.ai',
    url: 'app.hvactor.ai/agreements',
  },
]

export const SALES_SHOWCASE: ShowcaseItem[] = [
  {
    id: 'crm',
    index: '05',
    icon: UserCog,
    title: 'CRM Built Around Risk and Revenue, Not Just Contacts',
    description:
      'Every customer carries a live read on retention risk, upsell fit, and days since last service - scored automatically, not guessed at during a busy week.',
    bullets: [
      'Churn and failure-risk scoring per customer, updated continuously',
      'Upsell suggestions tied to actual job and equipment history',
      'Residential and commercial accounts managed side by side',
    ],
    image: PRODUCT_SHOTS.crm,
    imageAlt: 'Customer CRM in HVACtor.ai',
    url: 'app.hvactor.ai/crm',
  },
  {
    id: 'marketing',
    index: '06',
    icon: Megaphone,
    title: 'Marketing That Runs Itself - With a Kill Switch',
    description:
      'Review requests, equipment-age reminders, and win-back sequences send automatically once you turn them on. A single master switch stops every automated send instantly if you ever need it to.',
    bullets: [
      'Review requests sent by SMS and email on a set schedule after each job',
      'Tune-up and replacement reminders triggered by equipment age',
      'Win-back sequences for customers inactive 180+ days',
    ],
    image: PRODUCT_SHOTS.marketing,
    imageAlt: 'Marketing automations in HVACtor.ai',
    url: 'app.hvactor.ai/marketing',
  },
  {
    id: 'communications',
    index: '07',
    icon: MessagesSquare,
    title: 'Every Conversation, in One Inbox',
    description:
      'SMS, in-app messages, and call outcomes land in a single thread per customer - so a reschedule offer sent Monday isn’t a mystery to whoever answers the phone Thursday.',
    bullets: [
      'Unified thread per customer across SMS and in-app messages',
      'Read receipts and live delivery status on outbound offers',
      'Unread and active-thread counts visible at a glance',
    ],
    image: PRODUCT_SHOTS.communications,
    imageAlt: 'Unified communications inbox in HVACtor.ai',
    url: 'app.hvactor.ai/communications',
  },
]

/* -------------------------------------------------------------------------- */
/*  AI Agents band                                                            */
/* -------------------------------------------------------------------------- */

export interface Agent {
  id: string
  icon: LucideIcon
  name: string
  tag: string
  description: string
}

export const AGENTS: Agent[] = [
  {
    id: 'followup',
    icon: RefreshCw,
    name: 'Follow-up Agent',
    tag: 'EpsilonGreedy bandit · scikit-learn',
    description:
      'Sends follow-ups to leads and at-risk customers, timed to when they’re most likely to respond.',
  },
  {
    id: 'retention',
    icon: Heart,
    name: 'Retention Agent',
    tag: 'UCB1 bandit · scikit-learn',
    description:
      'Watches engagement for churn signals and triggers outreach before a customer decides to leave.',
  },
  {
    id: 'upsell',
    icon: TrendingUp,
    name: 'Upsell Agent',
    tag: 'Thompson Sampling · scikit-learn',
    description:
      'Flags cross-sell and upsell fit from job history and equipment age, timed to the customer lifecycle.',
  },
  {
    id: 'revenue',
    icon: DollarSign,
    name: 'Revenue Agent',
    tag: 'Observability dashboard included',
    description:
      'Reads demand and utilization to surface pricing and discount opportunities in real time.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Business — Finance                    */
/* -------------------------------------------------------------------------- */

export interface BusinessTab {
  id: string
  index: string
  icon: LucideIcon
  label: string
  headline: string
  description: string
  bullets: string[]
  stats: { value: string; label: string }[]
  image: string
  imageAlt: string
  url?: string
}

export const BUSINESS_TABS: BusinessTab[] = [
  {
    id: 'finance',
    index: '08',
    icon: Wallet,
    label: 'Finance',
    headline: 'Quotes, Invoices, And Expenses In One Ledger',
    description:
      'Every quote’s status is visible from draft to accepted, every invoice tracked to paid, and QuickBooks stays in sync automatically - no month-end reconciliation surprises.',
    bullets: [
      'Good-better-best quotes tracked from draft to accepted',
      'Invoices reconciled automatically with QuickBooks',
      'Expenses and AI revenue insights rolled up in one ledger',
    ],
    stats: [
      { value: '$134K', label: 'Accounts receivable' },
      { value: '44', label: 'Quotes in flight' },
      { value: '49', label: 'Invoices tracked' },
      { value: '3', label: 'AI revenue insights' },
    ],
    image: PRODUCT_SHOTS.finance,
    imageAlt: 'Finance dashboard in HVACtor.ai',
    url: 'app.hvactor.ai/finance',
  },
  {
    id: 'inventory',
    index: '09',
    icon: PackageSearch,
    label: 'Inventory',
    headline: 'Parts Tracked Across The Warehouse And Every Van',
    description:
      'Stock levels, reorder points, and unit cost stay visible by location, so a tech doesn’t find out a capacitor is out of stock standing in a customer’s attic.',
    bullets: [
      'Live stock levels by warehouse and by individual van',
      'Automated purchase orders triggered at the reorder point',
      'Every part costed accurately back to the job',
    ],
    stats: [
      { value: '16', label: 'Tracked SKUs' },
      { value: '1+6', label: 'Warehouse + van stock' },
      { value: '31', label: 'Logged movements' },
      { value: 'Auto', label: 'Reorder point alerts' },
    ],
    image: PRODUCT_SHOTS.inventory,
    imageAlt: 'Inventory tracking in HVACtor.ai',
    url: 'app.hvactor.ai/inventory',
  },
  {
    id: 'analytics',
    index: '10',
    icon: LineChart,
    label: 'Analytics',
    headline: 'Revenue, Utilization, and Agent Accuracy in One View',
    description:
      'Track how the business is actually performing - and how well the AI agents are calling it - with an observability panel built for accountability, not just dashboards.',
    bullets: [
      'Revenue and utilization tracked automatically per job',
      'Agent accuracy trend logged for every AI recommendation',
      'Full reporting exportable as CSV in one click',
    ],
    stats: [
      { value: '5', label: 'Live AI insights' },
      { value: 'Rev / Job', label: 'Tracked automatically' },
      { value: 'Agent', label: 'Accuracy trend logged' },
      { value: 'Export', label: 'Full report as CSV' },
    ],
    image: PRODUCT_SHOTS.analytics,
    imageAlt: 'Analytics dashboard in HVACtor.ai',
    url: 'app.hvactor.ai/analytics',
  },
]

/* -------------------------------------------------------------------------- */
/*  Integrations                                                              */
/* -------------------------------------------------------------------------- */

export interface Integration {
  badge: string
  icon: LucideIcon
  name: string
  description: string
  status: 'connected' | 'soon'
}

export const INTEGRATIONS: Integration[] = [
  {
    badge: 'QB',
    icon: Wallet,
    name: 'QuickBooks Online',
    description:
      'Invoices and payments sync automatically, in both directions, the moment they’re created or updated.',
    status: 'connected',
  },
  {
    badge: '$',
    icon: DollarSign,
    name: 'Stripe',
    description: 'Take card payments on invoices and quotes without leaving the platform.',
    status: 'soon',
  },
  {
    badge: 'Ad',
    icon: Megaphone,
    name: 'Google Ads',
    description: 'Tie ad spend directly to booked jobs and revenue, not just click volume.',
    status: 'soon',
  },
  {
    badge: '☎',
    icon: PhoneCall,
    name: 'AI Voice Agent Calling',
    description: 'An AI voice agent answers, books, and reschedules calls when the office line is busy.',
    status: 'soon',
  },
  {
    badge: 'HW',
    icon: Thermometer,
    name: 'Honeywell',
    description: 'Pull live thermostat and system data from connected Honeywell devices into the job record.',
    status: 'soon',
  },
  {
    badge: 'GN',
    icon: Wifi,
    name: 'Google Nest',
    description: 'Same live device visibility for Nest-equipped homes and light commercial sites.',
    status: 'soon',
  },
]

/* -------------------------------------------------------------------------- */
/*  Roadmap                                                                   */
/* -------------------------------------------------------------------------- */

export const CONSULTANT_AGENTS: string[] = [
  'Executive Consultant Agent',
  'Revenue Optimization Agent',
  'Dispatch Optimization Agent',
  'Customer Experience Agent',
  'Technician Performance Agent',
  'Finance Agent',
  'Marketing Agent',
  'Compliance / Safety Agent',
]

export interface RoadmapCard {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
}

export const ROADMAP_CARDS: RoadmapCard[] = [
  {
    icon: Radar,
    eyebrow: 'Predictive',
    title: 'Automated fault detection & predictive maintenance',
    description:
      'Flag equipment likely to fail before the customer calls, using job history and connected-device data instead of a fixed maintenance calendar.',
  },
  {
    icon: Ruler,
    eyebrow: 'Engineering',
    title: 'HVAC design & load calculation',
    description:
      'Bring proper load calculations and system design into the same platform that runs dispatch and the books - so estimating and engineering stop living in separate tools.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Workflow steps                                         */
/* -------------------------------------------------------------------------- */

export interface WorkflowStep {
  step: string
  icon: LucideIcon
  title: string
  description: string
}

export const WORKFLOW: WorkflowStep[] = [
  {
    step: 'A',
    icon: Users,
    title: 'Capture the request',
    description:
      'Calls, web bookings and portal requests land in one inbox with the full customer and equipment history attached.',
  },
  {
    step: 'B',
    icon: Route,
    title: 'Dispatch the right tech',
    description:
      'The board matches skills, parts and location, then optimizes the route for the whole crew in a single click.',
  },
  {
    step: 'C',
    icon: Smartphone,
    title: 'Complete the work',
    description:
      'Techs run guided checklists, document with photos, and collect payment on-site - even with no signal.',
  },
  {
    step: 'D',
    icon: TrendingUp,
    title: 'Grow the account',
    description:
      'AI surfaces renewals, upsells and at-risk customers so nothing slips through the cracks.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Onboarding steps                                   */
/* -------------------------------------------------------------------------- */

export interface OnboardingStep {
  number: string
  icon: LucideIcon
  title: string
  description: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Sign Up in Minutes',
    description:
      'Create your account and import your customers - most contractors are dispatching their first job within 30 minutes.',
  },
  {
    number: '02',
    icon: Settings,
    title: 'Configure Your Workflow',
    description:
      'Set job types, pricing, and technician skills so jobs route to the right person automatically.',
  },
  {
    number: '03',
    icon: ClipboardList,
    title: 'Dispatch & Manage Jobs',
    description:
      'Schedule and dispatch from one dashboard while technicians get real-time updates in the field.',
  },
  {
    number: '04',
    icon: Rocket,
    title: 'Scale & Grow',
    description:
      'Automate follow-ups and invoicing, then use analytics to optimize routes and grow revenue as you scale.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Analytics deep-dive tabs                                                  */
/* -------------------------------------------------------------------------- */

export interface AnalyticsTab {
  id: string
  label: string
  headline: string
  description: string
  metrics: { value: string; label: string }[]
}

export const ANALYTICS_TABS: AnalyticsTab[] = [
  {
    id: 'predictive',
    label: 'Predictive Maintenance',
    headline: 'See failures before your customers do',
    description:
      'HVACtor models run-time, age and service history for every unit to flag equipment likely to fail - turning emergency calls into scheduled, profitable visits.',
    metrics: [
      { value: '38%', label: 'Fewer emergency callbacks' },
      { value: '2.7x', label: 'More maintenance renewals' },
    ],
  },
  {
    id: 'revenue',
    label: 'Revenue Intelligence',
    headline: 'Know exactly where the money is',
    description:
      'Track revenue by service line, technician and territory. Spot the jobs, memberships and customers driving your margin - and the ones quietly draining it.',
    metrics: [
      { value: '+22%', label: 'Avg. ticket after 90 days' },
      { value: '$0', label: 'Missed follow-ups left on table' },
    ],
  },
  {
    id: 'ops',
    label: 'Operational Health',
    headline: 'Run a tighter, faster operation',
    description:
      'First-time-fix rate, drive time, jobs-per-tech and idle capacity - measured automatically and benchmarked so you always know your next move.',
    metrics: [
      { value: '91%', label: 'First-time-fix rate' },
      { value: '-19%', label: 'Windshield (drive) time' },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Testimonials                                                              */
/* -------------------------------------------------------------------------- */

export interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
  avatar: string
  date: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'We cut dispatch time in half and stopped losing maintenance renewals. HVACtor paid for itself inside the first month across our 14 trucks.',
    name: 'Marcus Delgado',
    role: 'Owner',
    company: 'NorthAir Mechanical',
    avatar: 'https://i.pravatar.cc/120?u=marcus-delgado',
    date: 'WO-2024-0417',
  },
  {
    quote:
      'The techs actually like it - offline mode works in every basement and mechanical room. Payment collection on-site changed our cash flow completely.',
    name: 'Priya Nair',
    role: 'Operations Director',
    company: 'Summit Climate Co.',
    avatar: 'https://i.pravatar.cc/120?u=priya-nair',
    date: 'WO-2024-0388',
  },
  {
    quote:
      'The predictive maintenance flags turned into $180k of scheduled work last year that we would have never caught. It is like having a dispatcher who never sleeps.',
    name: 'Trevor Boone',
    role: 'General Manager',
    company: 'BlueLine HVAC',
    avatar: 'https://i.pravatar.cc/120?u=trevor-boone',
    date: 'WO-2024-0351',
  },
]

/* -------------------------------------------------------------------------- */
/*  Pricing                                                                   */
/* -------------------------------------------------------------------------- */
export type TeamSizeId = '1' | 'upto5' | 'upto10' | 'upto15' | '16plus'

export interface TeamSizeOption {
  id: TeamSizeId
  label: string
  shortLabel: string
}

export const PRICING_TEAM_SIZES: TeamSizeOption[] = [
  { id: '1', label: '1 user', shortLabel: '1' },
  { id: 'upto5', label: 'Up to 5 users', shortLabel: 'Up to 5' },
  { id: 'upto10', label: 'Up to 10 users', shortLabel: 'Up to 10' },
  { id: 'upto15', label: 'Up to 15 users', shortLabel: 'Up to 15' },
  { id: '16plus', label: '16+ users', shortLabel: '16+' },
]

export interface PricingTierPrice {
  annualFirstYear: number
  annualAfterFirstYear: number
  monthlyFirst6: number
  monthlyAfter6: number
}

export interface PricingPlan {
  name: string
  description: string
  featured?: boolean
  special?: boolean
  negotiable?: boolean
  cta: string
  features: string[]
  prices: Partial<Record<TeamSizeId, PricingTierPrice>>
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Launch',
    description: 'For new contractors getting off the whiteboard.',
    cta: 'Start Free Trial',
    features: [
      'Scheduling & dispatch board',
      'Exclusive day planner',
      'Inventory & parts tracking',
      'Customer records & history',
      'Invoicing & online payments',
      'Technician mobile app',
      'Previous data import facility',
      'Customer self-service portal',
      'Commercial project dashboard',
      'Service & maintenance agreements',
      'Email support & notifications',
      'Data analytics dashboard',
    ],
    prices: {
      '1': { annualFirstYear: 19, annualAfterFirstYear: 29, monthlyFirst6: 29, monthlyAfter6: 49 },
      upto5: { annualFirstYear: 99, annualAfterFirstYear: 139, monthlyFirst6: 109, monthlyAfter6: 189 },
      upto10: { annualFirstYear: 149, annualAfterFirstYear: 219, monthlyFirst6: 169, monthlyAfter6: 279 },
      upto15: { annualFirstYear: 199, annualAfterFirstYear: 279, monthlyFirst6: 229, monthlyAfter6: 379 },
    },
  },
  {
    name: 'Accelerate',
    description: 'For growing crews that live in the field.',
    featured: true,
    cta: 'Start Free Trial',
    features: [
      'Everything in Launch',
      'Software self-tailoring modules',
      'Management insights & AI recommendations',
      'Onboard marketing facilities',
      'Maintenance plans & memberships',
      'In-app communication',
      'AI voice agent calling',
      'IOT integration & Predictive maintenance',
      'QuickBooks accounting sync',
      'Multi-location & territory management',
      'Advanced permissions & audit logs',
      'Priority support',
    ],
    prices: {
      '1': { annualFirstYear: 69, annualAfterFirstYear: 89, monthlyFirst6: 79, monthlyAfter6: 129 },
      upto5: { annualFirstYear: 149, annualAfterFirstYear: 219, monthlyFirst6: 169, monthlyAfter6: 279 },
      upto10: { annualFirstYear: 199, annualAfterFirstYear: 279, monthlyFirst6: 229, monthlyAfter6: 379 },
      upto15: { annualFirstYear: 269, annualAfterFirstYear: 379, monthlyFirst6: 289, monthlyAfter6: 469 },
    },
  },
  {
    name: 'Scale',
    description:
      'For contractors scaling up who need tailored software, built as SaaS or deployed on-site.',
    special: true,
    negotiable: true,
    cta: 'Book a Free Consultation',
    features: [
      'Everything in Accelerate',
      'Advanced custom tailor-made software',
      'SaaS & onsite setup option',
    ],
    prices: {},
  },
]

export const BETA_OFFER = {
  seats: 10,
  freeMonths: 3,
  discountPct: 25,
  discountMonths: 12,
}

/* -------------------------------------------------------------------------- */
/*  FAQs                                                                      */
/* -------------------------------------------------------------------------- */

export interface Faq {
  question: string
  answer: string
}

export const FAQS: Faq[] = [
  {
    question: 'How long does it take to get set up?',
    answer:
      'Most shops are live within a week. Our onboarding team imports your customers, equipment and price book, and runs a hands-on training session with your dispatchers and techs.',
  },
  {
    question: 'Does the mobile app work without signal?',
    answer:
      'Yes. The technician app is offline-first - work orders, checklists, photos and signatures are captured locally and sync automatically the moment a connection returns.',
  },
  {
    question: 'Can I import data from my current software?',
    answer:
      'We support imports from spreadsheets and most major field-service platforms. Customer records, equipment history and open jobs come across so you start with a full picture.',
  },
  {
    question: 'Is there a contract or setup fee?',
    answer:
      'No setup fees and no long-term contract on monthly plans. Annual billing always locks in a lower monthly rate than paying monthly, and you can change plans or cancel any time.',
  },
  {
    question: 'How does team-size pricing work?',
    answer:
      'Pick the plan and team size that matches your crew and the price updates for that tier. Every plan also includes discounted introductory pricing — your first year on annual billing, or your first 6 months on monthly billing — before it steps up to the standard rate. Teams of 16+ get custom pricing from our sales team.',
  },
]

/* -------------------------------------------------------------------------- */
/*  About                                           */
/* -------------------------------------------------------------------------- */

export interface Value {
  icon: LucideIcon
  title: string
  description: string
}

export const VALUES: Value[] = [
  {
    icon: Zap,
    title: 'Built for the field, not the demo',
    description:
      'Every feature is pressure-tested in real mechanical rooms and truck cabs — not just a sales deck.',
  },
  {
    icon: Clock,
    title: 'Respect the operator’s time',
    description:
      'Fewer clicks, less double entry. Software should get out of the way so crews can keep moving.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust is the product',
    description:
      'Bank-grade security, transparent pricing and data you can export any time. No lock-in games.',
  },
  {
    icon: TrendingUp,
    title: 'Grow with our customers',
    description:
      'When a three-truck shop becomes a thirty-truck operation, the platform is already ready for them.',
  },
]

export interface TimelineItem {
  year: string
  title: string
  description: string
}

export const TIMELINE: TimelineItem[] = [
  {
    year: '2018',
    title: 'Started in a service van',
    description:
      'Founded by a second-generation HVAC contractor and two engineers tired of clipboard chaos.',
  },
  {
    year: '2020',
    title: 'First 500 shops',
    description:
      'The dispatch board and offline mobile app hit the market and word spread through the trades fast.',
  },
  {
    year: '2022',
    title: 'Payments & portal launch',
    description:
      'On-site payments and the customer self-service portal turned HVACtor into an end-to-end platform.',
  },
  {
    year: '2024',
    title: 'AI insights go live',
    description:
      'Predictive maintenance and revenue intelligence now power decisions for over 12,000 technicians.',
  },
]


/* -------------------------------------------------------------------------- */
/*  Contact                                              */
/* -------------------------------------------------------------------------- */

export const TEAM_SIZE_OPTIONS = [
  '1–3 technicians',
  '4–10 technicians',
  '11–25 technicians',
  '26–50 technicians',
  '50+ technicians',
]

export const INTEREST_OPTIONS = [
  'Book a demo',
  'Start a free trial',
  'Pricing question',
  'Migration from another tool',
  'Something else',
]
