import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  MousePointer2,
  MapPinned,
  Users,
  Route,
  PenTool,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Truck,
  AlertTriangle,
  ScanLine,
  TrendingUp,
} from 'lucide-react'
import Container from '../ui/Container'
import Reveal from '../ui/Reveal'
import { FEATURES } from '../../data/site'

function StackedList({ items }: { items: { icon: LucideIcon; label: string }[] }) {
  const widths = ['w-[80%]', 'w-[90%] ml-3', 'w-full ml-6']
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-sm font-bold text-ink shadow-lg ${widths[i]}`}
        >
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-slate-100 text-ink">
            <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          {item.label}
        </div>
      ))}
    </div>
  )
}

function PhoneMockup({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
}) {
  return (
    <div className="relative h-full">
      <div className="absolute bottom-0 left-1/2 h-36 w-24 -translate-x-1/2 rounded-2xl border-[3px] border-white/80 bg-white/10" />
      <div className="absolute bottom-7 left-1/2 flex w-60 -translate-x-1/2 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100 text-ink">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{title}</p>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

function HeroPill({
  icon: Icon,
  label,
  badgeA: BadgeA,
  badgeB: BadgeB,
}: {
  icon: LucideIcon
  label: string
  badgeA: LucideIcon
  badgeB: LucideIcon
}) {
  return (
    <div className="relative h-full">
      <span className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/80 backdrop-blur-sm">
        <BadgeA className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="absolute right-2 top-7 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/80 backdrop-blur-sm">
        <BadgeB className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="absolute bottom-2 left-6 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-lg">
        <Icon className="h-4 w-4 text-ink" strokeWidth={2} />
        {label}
      </span>
      <MousePointer2
        className="absolute bottom-0 left-[8.5rem] h-5 w-5 -rotate-[8deg] text-white/70"
        fill="currentColor"
        fillOpacity={0.15}
      />
    </div>
  )
}

function ChipWall({ chips }: { chips: string[] }) {
  return (
    <div className="flex flex-wrap content-end gap-2">
      {chips.map((chip) => (
        <span key={chip} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-ink shadow-sm">
          {chip}
        </span>
      ))}
    </div>
  )
}

function MiniChart() {
  const bars = [40, 65, 50, 85, 60, 95]
  return (
    <div className="relative h-full">
      <span className="absolute -top-2 right-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 shadow">
        <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
        Trending up
      </span>
      <div className="absolute bottom-0 left-0 flex h-28 w-full items-end gap-2 rounded-2xl bg-white p-4 shadow-lg">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-navy-600/80" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

const FEATURE_VISUALS: Record<string, ReactNode> = {
  dispatch: (
    <StackedList
      items={[
        { icon: MapPinned, label: 'Live GPS tracking' },
        { icon: Users, label: 'Auto-assign by skill' },
        { icon: Route, label: 'Route optimization' },
      ]}
    />
  ),
  mobile: <PhoneMockup icon={PenTool} title="Signature captured" subtitle="Job #482 complete" />,
  crm: <HeroPill icon={Users} label="Customer record" badgeA={ShieldCheck} badgeB={Clock} />,
  invoicing: <ChipWall chips={['Card & ACH', 'Auto-reminders', 'QuickBooks sync', '+ more']} />,
  inventory: (
    <StackedList
      items={[
        { icon: Truck, label: 'Per-truck stock' },
        { icon: AlertTriangle, label: 'Low-stock alerts' },
        { icon: ScanLine, label: 'Barcode scan' },
      ]}
    />
  ),
  analytics: <MiniChart />,
  portal: <PhoneMockup icon={CheckCircle2} title="Booking confirmed" subtitle="Tech arrives 2–4pm" />,
}

const MARQUEE_FEATURES = [...FEATURES, ...FEATURES]

export default function FeatureAccordion() {
  return (
    <section id="features" className="bg-white">
      <Container className="pt-20 lg:pt-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">
            Everything From the First Call to{' '}
            <span className="bg-gradient-to-r from-navy-700 via-navy-600 to-navy-500 bg-clip-text text-transparent">
              the Final Invoice
            </span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Six capabilities, one shared record. Dispatch, invoicing, inventory
            and more all read and write the same data, so nothing gets
            re-typed twice.
          </p>
        </Reveal>
      </Container>

      <Reveal className="relative mt-14 overflow-hidden pb-20 lg:pb-28">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-40" />

        <div className="animate-ticker flex w-max gap-6 hover:[animation-play-state:paused]">
          {MARQUEE_FEATURES.map((feature, i) => (
            <div
              key={`${feature.id}-${i}`}
              className="relative flex h-[26rem] w-72 flex-none flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-navy-800 via-navy-900 to-navy-950 p-7 sm:w-80"
            >
              <div className="pointer-events-none absolute -bottom-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-navy-500/25 blur-3xl" />

              <h3 className="relative font-display text-xl font-bold tracking-tight text-white">
                {feature.title}
              </h3>
              <p className="relative mt-3 text-sm leading-relaxed text-white/60">
                {feature.description}
              </p>

              <div className="relative mt-auto h-40">{FEATURE_VISUALS[feature.id]}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
