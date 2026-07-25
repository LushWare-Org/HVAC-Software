import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import Container from '../ui/Container'
import SectionLabel from '../ui/SectionLabel'
import Reveal from '../ui/Reveal'
import { ANALYTICS_TABS, IMAGES } from '../../data/site'

export default function AnalyticsSection() {
  const [active, setActive] = useState(ANALYTICS_TABS[0].id)
  const tab = ANALYTICS_TABS.find((t) => t.id === active) ?? ANALYTICS_TABS[0]

  return (
    <section className="bg-white">
      <Container className="py-20 lg:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel index="05">The intelligence layer</SectionLabel>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Your data, finally working a shift
          </h2>
        </Reveal>

        <Reveal
          delay={100}
          className="mt-12 grid overflow-hidden rounded-3xl border border-slate-200 shadow-block-sm lg:grid-cols-[1fr_1fr]"
        >
          <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
            <div className="flex flex-col">
              {ANALYTICS_TABS.map((t) => {
                const isActive = t.id === active
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActive(t.id)}
                    className={[
                      'flex items-center gap-4 border-b border-slate-200 px-6 py-5 text-left transition-colors last:border-b-0',
                      isActive ? 'bg-navy-950 text-white' : 'bg-white text-ink hover:bg-navy-50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'h-6 w-1 flex-none rounded-full transition-colors',
                        isActive ? 'bg-sky-300' : 'bg-transparent',
                      ].join(' ')}
                    />
                    <span className="font-display text-lg font-bold tracking-tight">
                      {t.label}
                    </span>
                    {isActive && <ArrowUpRight className="ml-auto h-4 w-4" />}
                  </button>
                )
              })}
            </div>

            <div className="p-6 lg:p-8">
              <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
                {tab.headline}
              </h3>
              <p className="mt-4 text-slate-600">{tab.description}</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {tab.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl bg-navy-50 p-5">
                    <div className="font-display text-3xl font-bold text-navy-900">
                      {m.value}
                    </div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="relative flex items-center justify-center overflow-hidden bg-navy-950 p-8">
            <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-50" />
            <div className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-navy-500/25 blur-3xl" />
            <div
              className="relative aspect-square w-full max-w-md overflow-hidden border border-white/15"
              style={{
                clipPath:
                  'polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%)',
              }}
            >
              <img
                src={IMAGES.dataViz}
                alt={IMAGES.dataVizAlt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl border border-white/25 bg-navy-950/60 px-4 py-2 text-center text-white backdrop-blur-sm">
                  <div className="font-display text-xl font-bold">AI Engine</div>
                  <div className="text-[11px] uppercase tracking-widest text-white/60">
                    optimizing · live
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
