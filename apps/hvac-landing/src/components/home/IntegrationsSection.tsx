import Container from '../ui/Container'
import SectionLabel from '../ui/SectionLabel'
import Reveal from '../ui/Reveal'
import { INTEGRATIONS } from '../../data/site'

function StatusPill({ status }: { status: 'connected' | 'soon' }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        Connected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-600 ring-1 ring-inset ring-rose-200">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
      Coming soon
    </span>
  )
}

export function IntegrationsSection() {
  const [featured, ...rest] = INTEGRATIONS

  return (
    <section id="integrations" className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />
      <Container className="relative py-20 lg:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel tone="light">Available connectors</SectionLabel>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Connectors available and in progress
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            QuickBooks stays in sync today. Payments, ad tracking, voice and
            connected-device connectors are rolling out next, alongside
            integrations scoped to each customer’s FSM, ERP and BMS stack.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(0,1fr)]">
          {/* Featured, connected integration */}
          <Reveal className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="group relative flex h-full transform-gpu flex-col overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-7 shadow-block-sm transition-all duration-500 ease-out hover:z-10 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/15 sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />
              <div className="flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                  <featured.icon className="h-7 w-7" strokeWidth={1.75} />
                </span>
                <StatusPill status={featured.status} />
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink">
                {featured.name}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                {featured.description}
              </p>
              <div className="mt-auto pt-6 text-xs font-medium text-emerald-700">
                Live and syncing today
              </div>
            </div>
          </Reveal>

          {/* Upcoming integrations — compact tiles, red accent */}
          {rest.map((item, i) => (
            <Reveal
              key={item.name}
              delay={(i + 1) * 60}
              className={i < 2 ? 'lg:col-span-1' : 'sm:col-span-1 lg:col-span-2'}
            >
              <div className="group relative flex h-full transform-gpu flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 ease-out hover:z-10 hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-900/12">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors duration-300 group-hover:bg-rose-50 group-hover:text-rose-500">
                    <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <StatusPill status={item.status} />
                </div>
                <h3 className="mt-4 font-display text-base font-bold tracking-tight text-ink">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-white px-5 py-4 shadow-block-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-ink">
            Moving to HVACtor’s FSM from another tool?
          </span>
          <span className="text-sm text-slate-600">
            We help import your customers, equipment and job history, so you start with the full picture.
          </span>
        </div>
      </Container>
    </section>
  )
}
