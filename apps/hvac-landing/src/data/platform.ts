import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  Network,
  Gauge,
  Layers,
  Puzzle,
  Unplug,
  CalendarX,
  Calculator,
  PackageX,
  Wrench,
  Timer,
  Workflow,
  DollarSign,
  Activity,
  Share2,
  Building2,
  Factory,
  HardHat,
  Hospital,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Manage · Integrate · Optimize                                             */
/* -------------------------------------------------------------------------- */

export interface Pillar {
  id: string
  icon: LucideIcon
  verb: string
  title: string
  description: string
  points: string[]
}

export const PILLARS: Pillar[] = [
  {
    id: 'manage',
    icon: ClipboardList,
    verb: 'Manage',
    title: 'Operational management',
    description:
      'Run day-to-day service operations, from customers and work orders to dispatch, field work, quotes, invoices and inventory.',
    points: ['Field Service Management', 'Technician mobile app', 'Quotes, invoices and inventory'],
  },
  {
    id: 'integrate',
    icon: Network,
    verb: 'Integrate',
    title: 'Connected data',
    description:
      'Bring together data from the FSM, ERP, accounting, inventory, asset and BMS/IoT systems you already run, without replacing them.',
    points: ['Works alongside existing software', 'One shared operational context', 'Data normalized across sources'],
  },
  {
    id: 'optimize',
    icon: Gauge,
    verb: 'Optimize',
    title: 'Decision intelligence',
    description:
      'Apply predictive machine learning, mathematical optimization and governed AI agents to decide what should happen next, and why.',
    points: ['Recommendations with reasons', 'Human approval where it matters', 'Measured against outcomes'],
  },
]

/* -------------------------------------------------------------------------- */
/*  Two ways to use HVACtor                                                   */
/* -------------------------------------------------------------------------- */

export interface Offering {
  id: 'complete' | 'standalone'
  label: string
  icon: LucideIcon
  title: string
  forWho: string
  description: string
  includes: string[]
  cta: { label: string; to: string }
  secondary: { label: string; to: string }
}

export const OFFERINGS: Offering[] = [
  {
    id: 'complete',
    label: 'Option A',
    icon: Layers,
    title: 'Complete FSM + Intelligence',
    forWho: 'For contractors without an adequate field service management system.',
    description:
      'Run your operation on HVACtor’s FSM and add the intelligence modules that matter most. Operations and intelligence share the same data from day one.',
    includes: [
      'Customers, equipment and service agreements',
      'Jobs, work orders and projects',
      'Scheduling, dispatch and the technician app',
      'Quotes, invoices, payments and inventory',
      'Reporting plus your choice of intelligence modules',
    ],
    cta: { label: 'Explore the FSM', to: '/fsm' },
    secondary: { label: 'Request a Demo', to: '/contact?interest=Complete%20FSM%20%2B%20Intelligence' },
  },
  {
    id: 'standalone',
    label: 'Option B',
    icon: Puzzle,
    title: 'Standalone Intelligence Modules',
    forWho: 'For contractors already running FSM, ERP, accounting or CMMS software.',
    description:
      'Keep the systems your team knows. Connect HVACtor to them and add individual intelligence modules, or a bundle, where they make the biggest difference.',
    includes: [
      'No rip-and-replace of your current software',
      'Connect only the data each module needs',
      'Start with one module, add more over time',
      'Recommendations delivered into your existing workflow',
      'Shared integration layer across every module',
    ],
    cta: { label: 'Browse Intelligence Modules', to: '/intelligence' },
    secondary: { label: 'Discuss Integration', to: '/contact?interest=Standalone%20Intelligence%20Modules' },
  },
]

/* -------------------------------------------------------------------------- */
/*  Architecture: systems → layer → modules → outcomes                        */
/* -------------------------------------------------------------------------- */

export const SOURCE_SYSTEMS: string[] = [
  'FSM software',
  'ERP systems',
  'Accounting software',
  'Inventory & procurement',
  'Asset & maintenance management',
  'Service agreements & SLA commitments',
  'BMS & IoT equipment data',
  'Equipment operating data',
  'Energy consumption data',
  'Other operational data',
]

export const LAYER_CAPABILITIES: string[] = [
  'Data integration & normalization',
  'Shared operational context',
  'Predictive machine learning',
  'Mathematical optimization',
  'Governed AI agents',
  'Workflow coordination & decision support',
]

export const OUTCOMES: string[] = [
  'Better resource utilization',
  'More informed financial decisions',
  'Improved procurement efficiency',
  'More effective maintenance planning',
  'Fewer operational inefficiencies',
  'Better equipment reliability',
  'Better visibility into SLA performance',
  'More informed energy-management decisions',
  'Improved profitability and service delivery',
]

/* -------------------------------------------------------------------------- */
/*  Operational challenges                                                    */
/* -------------------------------------------------------------------------- */

export interface Challenge {
  icon: LucideIcon
  title: string
  description: string
}

export const CHALLENGES: Challenge[] = [
  {
    icon: Unplug,
    title: 'Data spread across disconnected systems',
    description: 'Jobs, costs, stock and equipment data live in different tools, so no one sees the full picture.',
  },
  {
    icon: CalendarX,
    title: 'Scheduling decided under pressure',
    description: 'Skills, travel, workload and priorities are balanced by hand, every day, with limited information.',
  },
  {
    icon: Calculator,
    title: 'Quotes built on instinct',
    description: 'Estimates rarely learn from actual job costs, so underquoting repeats unnoticed.',
  },
  {
    icon: PackageX,
    title: 'Inventory that is too much and too little',
    description: 'Cash sits in slow stock while the part a job needs is missing from the van.',
  },
  {
    icon: Timer,
    title: 'Service commitments tracked by hand',
    description: 'SLA response and resolution targets live in contracts, so at-risk jobs surface after the deadline.',
  },
  {
    icon: Wrench,
    title: 'Maintenance by the calendar',
    description: 'Visits follow fixed schedules rather than asset risk, criticality or expected value.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Customer value                                                            */
/* -------------------------------------------------------------------------- */

export interface ValueCategory {
  icon: LucideIcon
  title: string
  points: string[]
}

export const VALUE_CATEGORIES: ValueCategory[] = [
  {
    icon: Workflow,
    title: 'Operational efficiency',
    points: [
      'Improve technician utilization',
      'Make better scheduling decisions',
      'Prioritize critical work against service commitments',
      'Reduce avoidable operational inefficiencies',
      'Coordinate workflows more effectively',
    ],
  },
  {
    icon: DollarSign,
    title: 'Financial performance',
    points: [
      'Improve job-cost visibility',
      'Support more informed quotations',
      'Optimize procurement and inventory decisions',
      'Understand the financial impact of operational choices',
    ],
  },
  {
    icon: Activity,
    title: 'Asset performance',
    points: [
      'Make more informed maintenance decisions',
      'Improve visibility into equipment performance',
      'Identify potential issues earlier where data supports it',
      'Evaluate maintenance effectiveness',
      'Support more energy-efficient equipment operation',
    ],
  },
  {
    icon: Share2,
    title: 'Connected decision-making',
    points: [
      'Connect information across existing systems',
      'Reduce fragmented operational visibility',
      'Coordinate decisions across departments',
      'Decide with broader operational context',
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Industries                                                                */
/* -------------------------------------------------------------------------- */

export interface Industry {
  id: string
  icon: LucideIcon
  title: string
  description: string
  challenges: string[]
  modules: string[] // module slugs
}

export const INDUSTRIES: Industry[] = [
  {
    id: 'commercial-hvac',
    icon: Building2,
    title: 'Commercial HVAC contractors',
    description:
      'Service and maintenance across offices, retail, education and multi-site portfolios, often under service agreements with response commitments.',
    challenges: ['Large agreement portfolios to schedule', 'Mixed planned and reactive work', 'Margin pressure on fixed-price contracts'],
    modules: ['scheduling-workforce-optimization', 'sla-priority-management', 'quotation-job-costing', 'energy-efficiency-advisor'],
  },
  {
    id: 'industrial-hvac',
    icon: Factory,
    title: 'Industrial HVAC & process cooling',
    description:
      'Critical equipment where downtime carries real operational cost, and maintenance decisions need a clear technical and financial rationale.',
    challenges: ['High cost of unplanned downtime', 'Specialist parts with long lead times', 'Need to justify maintenance spend'],
    modules: ['predictive-maintenance', 'procurement-inventory-optimization', 'post-maintenance-performance', 'energy-efficiency-advisor'],
  },
  {
    id: 'mep',
    icon: HardHat,
    title: 'MEP contractors',
    description:
      'Contractors delivering HVAC alongside mechanical, electrical and plumbing work, with projects, service and procurement running in parallel.',
    challenges: ['Projects and service competing for crews', 'Approvals spread across teams', 'Data split across ERP and field tools'],
    modules: ['intelligent-approval-workflows', 'procurement-inventory-optimization', 'scheduling-workforce-optimization'],
  },
  {
    id: 'critical-facilities',
    icon: Hospital,
    title: 'Critical & regulated facilities',
    description:
      'Service providers for healthcare, data centers, laboratories and similar sites, where equipment reliability and documented maintenance matter most.',
    challenges: ['Reliability expectations are strict', 'Maintenance must be documented', 'Building and equipment data is under-used'],
    modules: ['sla-priority-management', 'predictive-maintenance', 'on-site-diagnostics', 'post-maintenance-performance'],
  },
]

export const ROLES: { title: string; description: string }[] = [
  { title: 'Owners & directors', description: 'A connected view of operational and financial performance.' },
  { title: 'Service & operations managers', description: 'Better decisions on scheduling, maintenance and quality.' },
  { title: 'Dispatch & workforce managers', description: 'Assignments that weigh skills, travel and workload.' },
  { title: 'Procurement & inventory managers', description: 'Demand-aware purchasing and stock decisions.' },
  { title: 'Maintenance & asset professionals', description: 'Risk- and value-based maintenance planning.' },
]
