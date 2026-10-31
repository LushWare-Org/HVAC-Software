import { ArrowRight, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import Container from '../ui/Container'
import Reveal from '../ui/Reveal'
import Button from '../ui/Button'
import SectionHeading from '../ui/SectionHeading'
import StatusBadge from '../ui/StatusBadge'
import ModuleCard from './ModuleCard'
import ArchitectureDiagram from './ArchitectureDiagram'
import { CHALLENGES, OFFERINGS, PILLARS, VALUE_CATEGORIES } from '../../data/platform'
import { AVAILABILITY, MODULE_CATEGORIES, TECHNIQUES, modulesInCategory, type Availability } from '../../data/modules'

/* Reusable page sections shared by Home, Platform and Intelligence pages. */

export function ChallengesSection({ index }: { index?: string }) {
  return (
    <section className="bg-white">
      <Container className="py-20 lg:py-24">
        <SectionHeading
          index={index}
          label="The challenge"
          title="HVAC operations generate data. Few contractors can act on it."
          description="Commercial and industrial contractors make hundreds of scheduling, pricing, purchasing and maintenance decisions a week, usually with information scattered across systems that don’t talk to each other."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHALLENGES.map((c, i) => (
            <Reveal key={c.title} delay={i * 60}>
              <div className="h-full rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <c.icon className="h-5 w-5 text-navy-600" strokeWidth={1.8} />
                <h3 className="mt-4 font-display text-base font-bold leading-snug tracking-tight text-ink">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function PillarsSection({ index }: { index?: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950">
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-40 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,black,transparent)]" />
      <Container className="relative py-20 lg:py-24">
        <SectionHeading
          index={index}
          tone="light"
          label="The platform"
          title="Manage. Integrate. Optimize."
          description="HVACtor combines field service management, a shared integration layer and decision intelligence, so recording what happened and deciding what should happen next sit on one foundation."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                    <p.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="font-display text-2xl font-bold tracking-tight text-white">{p.verb}</span>
                </div>
                <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-navy-200">{p.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/70">{p.description}</p>
                <ul className="mt-5 space-y-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm text-white/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-400" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function OfferingsSection({ index }: { index?: string }) {
  return (
    <section id="ways-to-use" className="scroll-mt-20 bg-slate-50">
      <Container className="py-20 lg:py-24">
        <SectionHeading
          index={index}
          label="Two ways to use HVACtor"
          title="Run on HVACtor, or add intelligence to the systems you already have."
          description="You don’t need to replace your existing FSM or ERP to benefit from HVACtor’s intelligence. Choose the path that fits where your business is today."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {OFFERINGS.map((o, i) => (
            <Reveal key={o.id} delay={i * 100}>
              <article
                className={clsx(
                  'flex h-full flex-col rounded-3xl border p-7 sm:p-9',
                  o.id === 'complete'
                    ? 'border-slate-200 bg-white shadow-block-sm'
                    : 'border-navy-800 bg-navy-900 text-white shadow-block',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={clsx(
                      'flex h-12 w-12 items-center justify-center rounded-2xl',
                      o.id === 'complete' ? 'bg-navy-50 text-navy-700' : 'bg-white/10 text-white',
                    )}
                  >
                    <o.icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <span
                    className={clsx(
                      'font-mono text-xs uppercase tracking-[0.18em]',
                      o.id === 'complete' ? 'text-navy-500' : 'text-navy-200',
                    )}
                  >
                    {o.label}
                  </span>
                </div>
                <h3 className={clsx('mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl', o.id === 'complete' ? 'text-ink' : 'text-white')}>
                  {o.title}
                </h3>
                <p className={clsx('mt-2 text-sm font-semibold', o.id === 'complete' ? 'text-navy-700' : 'text-navy-200')}>
                  {o.forWho}
                </p>
                <p className={clsx('mt-4 text-[15px] leading-relaxed', o.id === 'complete' ? 'text-slate-600' : 'text-white/70')}>
                  {o.description}
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {o.includes.map((item) => (
                    <li
                      key={item}
                      className={clsx('flex items-start gap-2.5 text-sm', o.id === 'complete' ? 'text-slate-700' : 'text-white/85')}
                    >
                      <CheckCircle2 className={clsx('mt-0.5 h-4 w-4 flex-none', o.id === 'complete' ? 'text-emerald-500' : 'text-emerald-400')} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button to={o.cta.to} variant={o.id === 'complete' ? 'primary' : 'inverse'} size="md">
                    {o.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button to={o.secondary.to} variant={o.id === 'complete' ? 'outline' : 'outline-inverse'} size="md">
                    {o.secondary.label}
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function AvailabilityLegend({ className }: { className?: string }) {
  return (
    <div className={clsx('flex flex-wrap gap-x-5 gap-y-3', className)}>
      {(Object.keys(AVAILABILITY) as Availability[]).map((key) => (
        <div key={key} className="flex items-center gap-2 text-xs text-slate-500">
          <StatusBadge status={key} />
          <span className="hidden max-w-[16rem] xl:inline">{AVAILABILITY[key].description}</span>
        </div>
      ))}
    </div>
  )
}

export function ModulesSection({ index, showCta = true }: { index?: string; showCta?: boolean }) {
  return (
    <section id="modules" className="scroll-mt-20 bg-white">
      <Container className="py-20 lg:py-24">
        <SectionHeading
          index={index}
          label="HVACtor Intelligence Modules"
          title="Purpose-built intelligence for every critical HVAC workflow."
          description="Nine modules across three areas of the business, all built on one integration and intelligence foundation. Start with the challenges that matter most, connect your existing systems, and expand as your needs evolve."
        />
        <AvailabilityLegend className="mt-8" />
        <div className="mt-12 space-y-14">
          {MODULE_CATEGORIES.map((c) => (
            <div key={c.id}>
              <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-baseline sm:gap-4">
                <h3 className="font-display text-xl font-bold tracking-tight text-ink">{c.name}</h3>
                <p className="text-sm text-slate-500">{c.description}</p>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {modulesInCategory(c.id).map((m, i) => (
                  <Reveal key={m.slug} delay={i * 60}>
                    <ModuleCard module={m} />
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Reveal className="mt-14">
          <div className="flex flex-col gap-6 rounded-2xl border border-dashed border-navy-200 bg-navy-50/50 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight text-ink">One connected ecosystem. Start with one module.</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Choose a single module or a bundle. Modules share the same data and integrations, so each one you add
                builds on what is already connected. Scheduling draws on SLA priorities; maintenance planning draws on
                diagnostics and post-maintenance results.
              </p>
            </div>
            <Button to="/contact?interest=Standalone%20Intelligence%20Modules" variant="primary" size="md" className="flex-none self-start md:self-auto">
              Discuss your priorities
            </Button>
          </div>
        </Reveal>
        {showCta && (
          <div className="mt-10">
            <Button to="/intelligence" variant="outline" size="md">
              Compare all modules
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Container>
    </section>
  )
}

export function IntegrationArchitectureSection({ index }: { index?: string }) {
  return (
    <section id="architecture" className="scroll-mt-20 bg-slate-50">
      <Container className="grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            index={index}
            label="Integration-first"
            title="Your systems. Connected. Your operations. Optimized."
            description="Operational data is usually spread across several systems. HVACtor is designed to connect the relevant information across your technology stack and turn it into coordinated operational intelligence."
          />
          <Reveal delay={100} className="mt-8 flex flex-wrap gap-3">
            <Button to="/integrations" variant="primary" size="md">
              How integration works
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button to="/contact?interest=Integration%20with%20my%20existing%20systems" variant="outline" size="md">
              Discuss Integration
            </Button>
          </Reveal>
        </div>
        <ArchitectureDiagram />
      </Container>
    </section>
  )
}

export function IntelligencePillarsSection({ index, compact }: { index?: string; compact?: boolean }) {
  return (
    <section className="bg-white">
      <Container className="py-20 lg:py-24">
        <SectionHeading
          index={index}
          label="The intelligence behind HVACtor"
          title="Three technologies, applied where each one fits."
          description="Each module uses the combination of techniques its decisions call for. Not every module uses every technique."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {Object.values(TECHNIQUES).map((t, i) => (
            <Reveal key={t.id} delay={i * 80}>
              <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white">
                  <t.icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-ink">{t.name}</h3>
                <p className="mt-1 text-sm font-semibold text-navy-600">{t.short}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{t.description}</p>
                {!compact && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">For example</div>
                    <ul className="mt-2 space-y-1.5">
                      {t.examples.map((e) => (
                        <li key={e} className="text-sm text-slate-700">
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function ValueSection({ index }: { index?: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950">
      <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/20 blur-3xl" />
      <Container className="relative py-20 lg:py-24">
        <SectionHeading
          index={index}
          tone="light"
          label="Business value"
          title="From managing operations to optimizing performance."
          description="HVACtor is built to help you make better-informed decisions across the parts of the business that drive margin and service quality."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_CATEGORIES.map((v, i) => (
            <Reveal key={v.title} delay={i * 70}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6">
                <v.icon className="h-6 w-6 text-navy-200" strokeWidth={1.8} />
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-white">{v.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {v.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
                      <span className="mt-2 h-1 w-1 flex-none rounded-full bg-navy-300" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
