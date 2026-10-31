import type { LucideIcon } from 'lucide-react'
import {
  CalendarRange,
  Calculator,
  PackageSearch,
  ShieldCheck,
  Stethoscope,
  Activity,
  LineChart,
  Timer,
  Leaf,
  BrainCircuit,
  Sigma,
  Bot,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Availability                                                              */
/* -------------------------------------------------------------------------- */

// Keep these honest: a module is only "available" when its core capabilities
// ship in the product today. Update as modules move through development.
export type Availability = 'available' | 'early-access' | 'in-development' | 'roadmap'

export const AVAILABILITY: Record<Availability, { label: string; description: string }> = {
  available: {
    label: 'Available now',
    description: 'Core capabilities are live in the product today.',
  },
  'early-access': {
    label: 'Early access',
    description: 'Foundations are live; the intelligence layer is being expanded with early customers.',
  },
  'in-development': {
    label: 'In development',
    description: 'Being actively built. Talk to us about shaping it around your workflow.',
  },
  roadmap: {
    label: 'On the roadmap',
    description: 'Planned. Design partners help define scope and priorities.',
  },
}

/* -------------------------------------------------------------------------- */
/*  Intelligence techniques                                                   */
/* -------------------------------------------------------------------------- */

export type Technique = 'ml' | 'optimization' | 'agents'

export interface TechniqueInfo {
  id: Technique
  icon: LucideIcon
  name: string
  short: string
  description: string
  examples: string[]
}

export const TECHNIQUES: Record<Technique, TechniqueInfo> = {
  ml: {
    id: 'ml',
    icon: BrainCircuit,
    name: 'Predictive Machine Learning',
    short: 'Estimates what is likely to happen next.',
    description:
      'Learns from your historical and operational data to estimate future outcomes, surface patterns, and flag risks before they become problems.',
    examples: ['Job duration and cost estimates', 'Parts demand forecasts', 'Equipment failure risk'],
  },
  optimization: {
    id: 'optimization',
    icon: Sigma,
    name: 'Mathematical Optimization',
    short: 'Finds the best option under real constraints.',
    description:
      'Weighs constraints, competing objectives and available resources (technicians, time, stock, budget) to identify better operational and financial decisions.',
    examples: ['Technician-to-job assignment', 'Replenishment quantities', 'Maintenance prioritization'],
  },
  agents: {
    id: 'agents',
    icon: Bot,
    name: 'Governed AI Agents',
    short: 'Coordinates the work, with people in control.',
    description:
      'Interpret context, coordinate workflows and surface recommendations. They take actions only within the permissions you set, with human approval and a full audit trail.',
    examples: ['Approval routing and context', 'Diagnostic guidance in the field', 'Follow-up and retention outreach'],
  },
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

// Groups for navigation only; every module stays individually selectable.
export type ModuleCategory = 'service-delivery' | 'commercial-supply' | 'asset-energy'

export const MODULE_CATEGORIES: { id: ModuleCategory; name: string; description: string }[] = [
  {
    id: 'service-delivery',
    name: 'Service Delivery',
    description: 'Getting the right people to the right work, on time and to commitment.',
  },
  {
    id: 'commercial-supply',
    name: 'Commercial & Supply',
    description: 'Pricing, purchasing and sign-off decisions that protect margin.',
  },
  {
    id: 'asset-energy',
    name: 'Asset & Energy Performance',
    description: 'Keeping equipment reliable, efficient and worth what is spent on it.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Modules                                                                   */
/* -------------------------------------------------------------------------- */

export interface Capability {
  text: string
  status: 'live' | 'building'
}

export interface IntelligenceModule {
  slug: string
  number: string
  icon: LucideIcon
  name: string
  navLabel: string
  tagline: string
  problem: string
  summary: string
  capabilities: Capability[]
  value: string[]
  dataSources: string[]
  techniques: Technique[]
  availability: Availability
  category: ModuleCategory
  /** Scope statement shown on the module page, e.g. what the module does not do. */
  note?: string
  seoTitle: string
  seoDescription: string
}

export const MODULES: IntelligenceModule[] = [
  {
    slug: 'scheduling-workforce-optimization',
    number: '01',
    icon: CalendarRange,
    name: 'Intelligent Scheduling & Workforce Optimization',
    navLabel: 'Scheduling & Workforce Optimization',
    tagline: 'The right technician, on the right job, at the right time.',
    problem:
      'Dispatch decisions are made under pressure with partial information. Skills, location, workload and shifting priorities all compete, and the cost shows up as idle time, unnecessary travel and missed windows.',
    summary:
      'Match technicians to jobs on skills, availability, location and workload, then keep the schedule sound as the day changes.',
    capabilities: [
      { text: 'Match technicians to jobs based on skills, availability, location and workload', status: 'live' },
      { text: 'Re-plan when priorities change, including filling time freed by cancellations', status: 'live' },
      { text: 'Manage technician rosters and days off alongside the schedule', status: 'live' },
      { text: 'Predict job duration and resource requirements from historical work', status: 'building' },
      { text: 'Optimize schedules and assignments across multiple constraints at once', status: 'building' },
    ],
    value: [
      'Higher technician utilization',
      'Less avoidable travel and schedule churn',
      'Faster, more consistent dispatch decisions',
      'Schedules that adapt instead of collapsing',
    ],
    dataSources: ['FSM jobs and work orders', 'Technician skills and rosters', 'GPS and location data', 'Job history'],
    techniques: ['optimization', 'ml', 'agents'],
    availability: 'available',
    category: 'service-delivery',
    seoTitle: 'HVAC Scheduling & Workforce Optimization Software',
    seoDescription:
      'AI-assisted HVAC scheduling that matches technicians to jobs on skills, location and workload, and adapts the schedule as priorities change.',
  },
  {
    slug: 'quotation-job-costing',
    number: '02',
    icon: Calculator,
    name: 'Quotation Intelligence & Job Cost Optimization',
    navLabel: 'Quotation & Job Costing',
    tagline: 'Quote with evidence, not instinct.',
    problem:
      'Estimates often rely on experience and rules of thumb. Underquoted labor, missed materials and unchecked cost overruns erode margin quietly, job after job.',
    summary:
      'Use your historical job data to estimate costs, catch underquoting and learn from every estimate-versus-actual comparison.',
    capabilities: [
      { text: 'Build good-better-best quotes from your price book', status: 'live' },
      { text: 'Track quoted, invoiced and paid values per job and project', status: 'live' },
      { text: 'Estimate job costs using historical operational data', status: 'building' },
      { text: 'Predict labor, material and resource requirements', status: 'building' },
      { text: 'Flag cost deviations and potential underquoting before a quote is sent', status: 'building' },
      { text: 'Compare estimated and actual job performance to improve future estimates', status: 'building' },
    ],
    value: [
      'Better visibility into true job cost',
      'More informed pricing and quotation decisions',
      'Fewer margin surprises after the job closes',
      'Estimates that improve with every completed job',
    ],
    dataSources: ['FSM job history', 'Price book and quotes', 'Accounting and ERP costs', 'Inventory and material costs'],
    techniques: ['ml', 'optimization'],
    availability: 'in-development',
    category: 'commercial-supply',
    seoTitle: 'HVAC Job Costing & Quotation Intelligence Software',
    seoDescription:
      'HVAC job costing software that uses historical job data to estimate costs, flag underquoting and improve quotation accuracy over time.',
  },
  {
    slug: 'procurement-inventory-optimization',
    number: '03',
    icon: PackageSearch,
    name: 'Procurement & Inventory Optimization',
    navLabel: 'Procurement & Inventory',
    tagline: 'The right parts, in the right place, at the right cost.',
    problem:
      'Too much stock ties up cash; too little stalls jobs. Purchasing decisions are made without a clear view of upcoming demand, supplier lead times or what is already on each van.',
    summary:
      'Forecast material demand and support replenishment and supplier decisions that balance cost, availability and lead time.',
    capabilities: [
      { text: 'Track stock across the warehouse and every technician van', status: 'live' },
      { text: 'Reorder-point alerts and purchase order creation', status: 'live' },
      { text: 'Forecast material and spare-parts demand from scheduled and historical work', status: 'building' },
      { text: 'Recommend replenishment quantities and timing', status: 'building' },
      { text: 'Support supplier decisions on cost, availability and lead time', status: 'building' },
    ],
    value: [
      'Lower risk of stockouts that stall jobs',
      'Less cash tied up in excess inventory',
      'More informed procurement decisions',
      'Purchasing aligned with upcoming work',
    ],
    dataSources: ['Inventory and warehouse systems', 'ERP and purchasing records', 'Supplier lead times and pricing', 'Scheduled jobs'],
    techniques: ['ml', 'optimization'],
    availability: 'early-access',
    category: 'commercial-supply',
    seoTitle: 'HVAC Procurement & Inventory Optimization',
    seoDescription:
      'HVAC procurement optimization: forecast parts demand, plan replenishment and support supplier decisions across warehouse and van stock.',
  },
  {
    slug: 'intelligent-approval-workflows',
    number: '04',
    icon: ShieldCheck,
    name: 'Intelligent Approval Workflows',
    navLabel: 'Approval Workflows',
    tagline: 'Faster approvals, with accountability intact.',
    problem:
      'Purchase requests, quotes, discounts and change orders queue up waiting for sign-off. Approvers lack context, urgent items wait behind routine ones, and the audit trail lives in email.',
    summary:
      'Prioritize approval requests by urgency and impact, bring the relevant context to the approver, and keep every decision auditable.',
    capabilities: [
      { text: 'Prioritize approval requests by urgency and business impact', status: 'building' },
      { text: 'Present relevant cost, job and operational context with each request', status: 'building' },
      { text: 'Identify exceptions and requests that need additional review', status: 'building' },
      { text: 'Route approvals and coordinate the surrounding workflow', status: 'building' },
      { text: 'Keep human authorization, accountability and a full audit trail', status: 'building' },
    ],
    value: [
      'Shorter approval cycle times',
      'Better-informed approval decisions',
      'Exceptions caught before they cost money',
      'Clear accountability for every decision',
    ],
    dataSources: ['FSM jobs and quotes', 'ERP and accounting', 'Purchase orders', 'Policies and approval limits'],
    techniques: ['agents', 'ml'],
    availability: 'in-development',
    category: 'commercial-supply',
    seoTitle: 'Intelligent Approval Workflows for HVAC Contractors',
    seoDescription:
      'Context-aware approval workflows for HVAC operations: prioritize requests, surface exceptions and keep human authorization and auditability.',
  },
  {
    slug: 'on-site-diagnostics',
    number: '05',
    icon: Stethoscope,
    name: 'AI-Assisted On-Site Diagnostics',
    navLabel: 'On-Site Diagnostics',
    tagline: 'Better information in the technician’s hands.',
    problem:
      'Technicians often arrive without full equipment history or relevant technical information. Diagnosis depends on individual experience, and findings rarely flow back to improve the next visit.',
    summary:
      'Organize equipment history and technical information, and assist qualified technicians as they evaluate likely causes and next checks.',
    capabilities: [
      { text: 'Equipment service history available in the technician mobile app', status: 'live' },
      { text: 'Organize previous service records and available technical information per asset', status: 'building' },
      { text: 'Assist technicians in evaluating possible causes of equipment issues', status: 'building' },
      { text: 'Recommend relevant diagnostic checks and troubleshooting guidance', status: 'building' },
      { text: 'Capture diagnostic findings to improve future service decisions', status: 'building' },
    ],
    value: [
      'Technicians better prepared on arrival',
      'More consistent diagnostic approach across the team',
      'Knowledge retained when experienced staff move on',
      'Findings that inform future visits',
    ],
    dataSources: ['Asset and equipment records', 'Service history', 'Manuals and technical documentation', 'BMS and IoT readings'],
    techniques: ['agents', 'ml'],
    availability: 'in-development',
    category: 'service-delivery',
    seoTitle: 'AI-Assisted HVAC Diagnostics for Field Technicians',
    seoDescription:
      'AI-assisted HVAC diagnostics that organize equipment history and suggest diagnostic checks, supporting qualified technicians in the field.',
  },
  {
    slug: 'predictive-maintenance',
    number: '06',
    icon: Activity,
    name: 'ROI-Driven Preventive & Predictive Maintenance',
    navLabel: 'Maintenance Intelligence',
    tagline: 'Maintain what matters most, when it matters most.',
    problem:
      'Calendar-based maintenance treats every asset the same. Critical equipment can be under-served while low-impact units consume visits, and the financial case for each intervention is rarely clear.',
    summary:
      'Prioritize maintenance by asset criticality, risk, cost and expected business impact, so both technical need and economic value are weighed.',
    capabilities: [
      { text: 'Failure-risk scoring per customer and asset from service history', status: 'live' },
      { text: 'Alerts from connected thermostats for offline or underperforming systems', status: 'live' },
      { text: 'Evaluate equipment condition from available performance data', status: 'building' },
      { text: 'Prioritize maintenance by criticality, risk, cost and expected impact', status: 'building' },
      { text: 'Support choosing between preventive work, predictive intervention and continued operation', status: 'building' },
    ],
    value: [
      'Maintenance effort focused where it pays back',
      'Potential issues identified earlier, where data allows',
      'Clearer financial case for each intervention',
      'Improved equipment reliability',
    ],
    dataSources: ['Asset and CMMS records', 'BMS and IoT equipment data', 'Service history', 'Contract and cost data'],
    techniques: ['ml', 'optimization'],
    availability: 'early-access',
    category: 'asset-energy',
    seoTitle: 'HVAC Predictive Maintenance Software',
    seoDescription:
      'HVAC predictive maintenance that prioritizes work by asset risk, criticality, cost and expected business impact, not just the calendar.',
  },
  {
    slug: 'post-maintenance-performance',
    number: '07',
    icon: LineChart,
    name: 'Post-Maintenance Performance Intelligence',
    navLabel: 'Post-Maintenance Intelligence',
    tagline: 'Know whether the work actually worked.',
    problem:
      'Once a job is closed, few contractors can show whether equipment performs better afterwards. Recurring issues go unnoticed and maintenance quality is hard to measure.',
    summary:
      'Compare equipment performance before and after maintenance, identify recurring problems, and feed the results back into planning.',
    capabilities: [
      { text: 'Compare equipment performance before and after maintenance', status: 'building' },
      { text: 'Evaluate maintenance effectiveness using available operational data', status: 'building' },
      { text: 'Identify recurring issues and unresolved performance problems', status: 'building' },
      { text: 'Support maintenance quality assessment', status: 'building' },
      { text: 'Feed results into future maintenance planning and decisions', status: 'building' },
    ],
    value: [
      'Evidence of the value your maintenance delivers',
      'Recurring problems surfaced instead of repeated',
      'Measurable maintenance quality',
      'A feedback loop into planning',
    ],
    dataSources: ['BMS and IoT performance data', 'Service and work-order records', 'Asset data'],
    techniques: ['ml'],
    availability: 'roadmap',
    category: 'asset-energy',
    seoTitle: 'HVAC Post-Maintenance Performance Analytics',
    seoDescription:
      'Measure HVAC maintenance effectiveness by comparing equipment performance before and after service and surfacing recurring issues.',
  },
  {
    slug: 'sla-priority-management',
    number: '08',
    icon: Timer,
    name: 'SLA & Priority Management',
    navLabel: 'SLA & Priority Management',
    tagline: 'Ensure timely service delivery and stay ahead of SLA commitments.',
    problem:
      'Response and resolution commitments sit in contracts, not in the dispatch queue. Urgent work competes with routine visits on equal terms, and a job at risk of breaching its SLA is often noticed only after the deadline has passed.',
    summary:
      'Track SLA commitments, prioritize requests by urgency and contractual obligation, and see which jobs are at risk before they breach.',
    capabilities: [
      { text: 'Priority levels on every job, from Low to Emergency', status: 'live' },
      { text: 'Higher-priority work considered first when cancellations free up schedule time', status: 'live' },
      { text: 'Track SLA commitments, response times, resolution targets and service deadlines', status: 'building' },
      { text: 'Assess and prioritize requests on urgency, SLA terms, asset criticality and business impact', status: 'building' },
      { text: 'Identify jobs at risk of breaching SLA commitments', status: 'building' },
      { text: 'Support technician allocation and scheduling based on service priorities and available resources', status: 'building' },
      { text: 'Report on SLA performance, potential breaches and recurring service delays', status: 'building' },
    ],
    value: [
      'Better visibility into SLA compliance',
      'Fewer missed service commitments',
      'Critical work prioritized consistently',
      'Proactive decisions instead of after-the-fact explanations',
    ],
    dataSources: ['Service agreements and SLA terms', 'FSM jobs and service requests', 'Asset criticality', 'Technician availability and schedules'],
    techniques: ['optimization', 'ml', 'agents'],
    availability: 'in-development',
    category: 'service-delivery',
    note: 'HVACtor helps managers see and act on SLA risk earlier. It supports their decisions; it does not guarantee SLA compliance.',
    seoTitle: 'HVAC SLA & Priority Management Software',
    seoDescription:
      'Track HVAC service-level agreements, prioritize service requests by urgency and contract terms, and identify jobs at risk of breaching SLA commitments.',
  },
  {
    slug: 'energy-efficiency-advisor',
    number: '09',
    icon: Leaf,
    name: 'Energy Efficiency Advisor',
    navLabel: 'Energy Efficiency Advisor',
    tagline: 'Optimize equipment operation for smarter energy use and improved efficiency.',
    problem:
      'Equipment often runs on settings and schedules nobody has revisited in years. Unnecessary runtime and inefficient operation stay hidden in utility bills and building data that no one has time to analyze.',
    summary:
      'Analyze available equipment, schedule and energy data to find inefficiencies, and recommend operating settings and schedules for your team to review.',
    capabilities: [
      { text: 'Analyze available equipment performance, operating schedules, sensor readings and energy consumption data', status: 'building' },
      { text: 'Identify potential energy inefficiencies and unusual consumption patterns', status: 'building' },
      { text: 'Recommend operating settings and schedules that balance efficiency, comfort, equipment constraints and operational needs', status: 'building' },
      { text: 'Identify opportunities to reduce unnecessary runtime and inefficient operation', status: 'building' },
      { text: 'Compare energy consumption and equipment performance over time', status: 'building' },
      { text: 'Provide actionable recommendations for more informed energy-management decisions', status: 'building' },
    ],
    value: [
      'Support for more energy-efficient HVAC operation',
      'Less avoidable energy consumption',
      'Better equipment utilization',
      'Better-informed operating decisions',
    ],
    dataSources: ['BMS and IoT equipment data', 'Equipment operating schedules', 'Energy meter and utility data', 'Asset records'],
    techniques: ['ml', 'optimization'],
    availability: 'roadmap',
    category: 'asset-energy',
    note: 'Recommendations, not control. HVACtor does not change equipment or BMS settings. Your team or the facility operator reviews each recommendation and decides whether to apply it.',
    seoTitle: 'HVAC Energy Efficiency Advisor',
    seoDescription:
      'Identify HVAC energy inefficiencies and get recommended equipment settings and operating schedules, reviewed and applied by your team.',
  },
]

export const getModule = (slug: string | undefined) => MODULES.find((m) => m.slug === slug)

export const modulePath = (m: IntelligenceModule) => `/intelligence/${m.slug}`

export const modulesInCategory = (c: ModuleCategory) => MODULES.filter((m) => m.category === c)
