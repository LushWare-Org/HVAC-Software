import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleDashed, Database } from 'lucide-react'
import clsx from 'clsx'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'
import SectionLabel from '../components/ui/SectionLabel'
import StatusBadge from '../components/ui/StatusBadge'
import CtaBanner from '../components/ui/CtaBanner'
import ModuleCard from '../components/sections/ModuleCard'
import { AVAILABILITY, MODULES, TECHNIQUES, getModule } from '../data/modules'

export default function ModuleDetail() {
  const { slug } = useParams()
  const m = getModule(slug)
  if (!m) return <Navigate to="/intelligence" replace />

  const contactQuery = `/contact?interest=Standalone%20Intelligence%20Modules&module=${encodeURIComponent(m.navLabel)}`
  const related = MODULES.filter((x) => x.slug !== m.slug).slice(0, 3)

  return (
    <>
      <Seo title={m.seoTitle} description={m.seoDescription} />
      <PageHero
        title={<span className="block text-3xl leading-tight sm:text-4xl lg:text-5xl">{m.name}</span>}
        description={m.tagline}
      >
        <StatusBadge status={m.availability} className="bg-white" />
        <Button to={contactQuery} variant="inverse" size="lg">
          Request a Demo
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button to="/contact?interest=Integration%20with%20my%20existing%20systems" variant="outline-inverse" size="lg">
          Discuss Integration
        </Button>
      </PageHero>

      <section className="bg-white">
        <Container className="py-16 lg:py-20">
          <Link to="/intelligence" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-800">
            <ArrowLeft className="h-4 w-4" /> All intelligence modules
          </Link>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
            <div>
              <Reveal>
                <SectionLabel index={m.number}>The problem</SectionLabel>
                <p className="mt-5 font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.65rem]">
                  {m.problem}
                </p>
              </Reveal>

              <Reveal className="mt-14">
                <SectionLabel>Key capabilities</SectionLabel>
                <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {m.capabilities.map((c) => (
                    <li key={c.text} className="flex items-start justify-between gap-4 px-5 py-4">
                      <span className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-700">
                        {c.status === 'live' ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-500" />
                        ) : (
                          <CircleDashed className="mt-0.5 h-5 w-5 flex-none text-amber-500" />
                        )}
                        {c.text}
                      </span>
                      <span
                        className={clsx(
                          'mt-0.5 flex-none whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider',
                          c.status === 'live' ? 'text-emerald-700' : 'text-amber-700',
                        )}
                      >
                        {c.status === 'live' ? 'Available' : 'In development'}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Module status: {AVAILABILITY[m.availability].label}. {AVAILABILITY[m.availability].description}
                </p>
              </Reveal>

              <Reveal className="mt-14">
                <SectionLabel>What it means for you</SectionLabel>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {m.value.map((v) => (
                    <div key={v} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-sm font-medium text-ink">
                      {v}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              <Reveal direction="right">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-block-sm">
                  <h2 className="font-display text-base font-bold tracking-tight text-ink">How it works</h2>
                  <ul className="mt-4 space-y-4">
                    {m.techniques.map((t) => {
                      const info = TECHNIQUES[t]
                      return (
                        <li key={t} className="flex items-start gap-3">
                          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-navy-900 text-white">
                            <info.icon className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-ink">{info.name}</div>
                            <div className="text-sm text-slate-600">{info.short}</div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Reveal>
              <Reveal direction="right" delay={80}>
                <div className="rounded-2xl bg-navy-900 p-6 text-white">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-navy-200" />
                    <h2 className="font-display text-base font-bold tracking-tight">Data it draws on</h2>
                  </div>
                  <p className="mt-2 text-sm text-white/65">
                    From HVACtor’s FSM, or connected from the systems you already use.
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {m.dataSources.map((d) => (
                      <li key={d} className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/85">
                        {d}
                      </li>
                    ))}
                  </ul>
                  <Link to="/integrations" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:underline">
                    How integration works <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </aside>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50">
        <Container className="py-16 lg:py-20">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Other intelligence modules</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ModuleCard key={r.slug} module={r} />
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner
        heading={`Explore ${m.navLabel} with your data`}
        subheading="Use it on HVACtor’s FSM or alongside your current systems. Start here, and add more modules later."
        primaryLabel="Request a Demo"
        primaryTo={contactQuery}
        secondaryLabel="Discuss Integration"
        secondaryTo="/contact?interest=Integration%20with%20my%20existing%20systems"
      />
    </>
  )
}
