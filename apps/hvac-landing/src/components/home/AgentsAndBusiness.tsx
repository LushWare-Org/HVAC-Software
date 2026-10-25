import Container from '../ui/Container'
import SectionLabel from '../ui/SectionLabel'
import Reveal from '../ui/Reveal'
import { CheckCircle2 } from 'lucide-react'
import { AGENTS, BUSINESS_TABS } from '../../data/site'

export function AgentsSection() {
  return (
    <section
      id="agents"
      className="relative overflow-hidden  bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900"
    >
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_30%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_70%_100%,black,transparent)]" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />

      <Container className="relative py-20 lg:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel index="02" tone="light">On staff, around the clock</SectionLabel>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Four agents, each accountable to a number
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            Every recommendation traces back to a labeled insight - a
            retention risk, a pending quote, a utilization threshold - never a
            vague suggestion. Turn any agent on or off independently.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((agent) => {
            const Icon = agent.icon
            return (
              <div key={agent.id} className="h-full">
                <div className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-white">
                    {agent.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70 mb-8">
                    {agent.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

export function BusinessSection() {
  return (
    <section id="business" className="bg-white">
      <Container className="py-20 lg:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel index="05">Business</SectionLabel>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            The back office, without the spreadsheets
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Quotes, invoices, payments, and reporting stay in sync with the
            field - so the numbers office staff see are the numbers that are
            actually true.
          </p>
        </Reveal>

        <div className="mt-10 border-t border-ink">
          {BUSINESS_TABS.map((tab, i) => {
            const Icon = tab.icon
            const reversed = i % 2 === 1
            return (
              <div
                key={tab.id}
                className="group border-b border-ink/15 py-10 last:border-b-0 lg:py-14"
              >
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                  <Reveal
                    direction="up"
                    duration={800}
                    once={false}
                    className={reversed ? 'lg:order-2' : ''}
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 flex-none items-center justify-center border border-ink bg-navy-900 text-white transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                        {tab.headline}
                      </h3>
                    </div>
                    <p className="mt-6 text-lg leading-relaxed text-slate-600">{tab.description}</p>
                    <ul className="mt-7 flex flex-col gap-4">
                      {tab.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-500" />
                          <span className="text-[15px] leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>

                  <Reveal
                    direction={reversed ? 'left' : 'right'}
                    delay={150}
                    duration={900}
                    once={false}
                    className={reversed ? 'lg:order-1' : ''}
                  >
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-block-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-block">
                      {tab.url && (
                        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                          <span className="flex flex-none gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                          </span>
                          <span className="ml-2 truncate rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-slate-500">
                            {tab.url}
                          </span>
                        </div>
                      )}
                      <div className="relative aspect-[11/6] bg-white">
                        <img
                          src={tab.image}
                          alt={tab.imageAlt}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
