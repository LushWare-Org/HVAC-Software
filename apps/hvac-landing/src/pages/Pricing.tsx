import { useState } from 'react'
import { ArrowDown, ArrowRight, Puzzle, CheckCircle2, ChevronDown, Sparkles, X } from 'lucide-react'
import clsx from 'clsx'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import SectionLabel from '../components/ui/SectionLabel'
import FaqAccordion from '../components/ui/FaqAccordion'
import CtaBanner from '../components/ui/CtaBanner'
import Button from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'
import { BRAND } from '../data/site'
import { PRICING_PLANS, PRICING_TEAM_SIZES, BETA_OFFER, FAQS } from '../data/site'
import type { TeamSizeId } from '../data/site'

type Billing = 'monthly' | 'annual'

const DEFAULT_TEAM_SIZE: TeamSizeId = '1'

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('annual')
  const [teamSize, setTeamSize] = useState<TeamSizeId>(DEFAULT_TEAM_SIZE)
  const [showBetaBanner, setShowBetaBanner] = useState(true)

  return (
    <>
      <Seo
        title="Pricing: HVAC FSM Plans & Intelligence Modules"
        description="Transparent pricing for HVACtor’s HVAC field service management plans, plus per-module and bundle pricing for standalone intelligence modules."
      />
      <PageHero
        title={
          <>
            <span className="block">Straight Forward Pricing.</span>
            <span className="mt-3 block sm:mt-4">No Surprises on the Invoice.</span>
          </>
        }
        description="FSM plans that scale with your crew, including the mobile app, onboarding and updates. Intelligence modules are priced per module or bundle, with or without our FSM."
        className="pt-20 pb-20 lg:pt-30 lg:pb-10"
      >
        <Button href="#plans" variant="inverse" size="lg">
          View Plans & Pricing
          <ArrowDown className="h-4 w-4" />
        </Button>
      </PageHero>

      <section id="plans" className="scroll-mt-24 bg-white">
        <Container className="py-20 lg:py-22">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Clear Pricing, Built For Your Crew.
            </h2>
          </Reveal>

          {showBetaBanner && (
            <Reveal delay={80} className="mt-6 flex justify-center px-4">
              <div className="flex w-full flex-col gap-2 rounded-2xl border border-navy-100 bg-navy-50 p-4 text-sm sm:w-auto sm:max-w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-2.5 sm:gap-y-1.5 sm:rounded-full sm:py-1.5 sm:pl-1.5 sm:pr-3">
                <div className="flex w-full items-center justify-between gap-2 sm:contents">
                  <span className="inline-flex flex-none items-center gap-1 rounded-full bg-navy-950 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white sm:order-1">
                    <Sparkles className="h-3 w-3" /> Beta offer
                  </span>
                  <button
                    type="button"
                    aria-label="Dismiss beta offer"
                    onClick={() => setShowBetaBanner(false)}
                    className="flex-none text-navy-300 transition-colors hover:text-navy-700 sm:order-3"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-left text-navy-800 sm:order-2">
                  Our first <strong className="font-semibold">{BETA_OFFER.seats} Beta Clients</strong> get{' '}
                  {BETA_OFFER.freeMonths} months free, then {BETA_OFFER.discountPct}% off for a year. After that billed normally.
                </span>
              </div>
            </Reveal>
          )}

          {/* Configurator: team size + billing */}
          <Reveal delay={120} className="mt-10 flex justify-center">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-block-sm sm:flex-row sm:gap-6">
              <label className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-ink">Team size:</span>
                <span className="relative inline-flex items-center">
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value as TeamSizeId)}
                    className="appearance-none rounded-lg border border-navy-200 bg-white py-2 pl-3.5 pr-9 text-sm font-semibold text-navy-950 transition-colors hover:border-navy-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
                  >
                    {PRICING_TEAM_SIZES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-navy-400" />
                </span>
              </label>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-ink">Billing:</span>
                <span
                  className={clsx(
                    'font-semibold transition-colors',
                    billing === 'monthly' ? 'text-ink' : 'text-slate-400',
                  )}
                >
                  Monthly
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={billing === 'annual'}
                  onClick={() => setBilling((b) => (b === 'monthly' ? 'annual' : 'monthly'))}
                  className="relative h-7 w-14 flex-none rounded-full bg-navy-700 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
                >
                  <span
                    className={clsx(
                      'absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300',
                      billing === 'annual' ? 'translate-x-7' : 'translate-x-0',
                    )}
                  />
                </button>
                <span
                  className={clsx(
                    'font-semibold transition-colors',
                    billing === 'annual' ? 'text-ink' : 'text-slate-400',
                  )}
                >
                  Annual
                </span>
              </div>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-start lg:gap-8">
            {PRICING_PLANS.map((plan, i) => {
              const priceSet = plan.prices[teamSize]
              const isCustom = !priceSet
              const firstPrice = priceSet
                ? billing === 'annual'
                  ? priceSet.annualFirstYear
                  : priceSet.monthlyFirst6
                : null
              const afterPrice = priceSet
                ? billing === 'annual'
                  ? priceSet.annualAfterFirstYear
                  : priceSet.monthlyAfter6
                : null
              const savingsPct = priceSet
                ? Math.round(
                    ((priceSet.monthlyFirst6 - priceSet.annualFirstYear) /
                      priceSet.monthlyFirst6) *
                      100,
                  )
                : null

              const isDark = Boolean(plan.featured || plan.special)

              return (
                <Reveal key={plan.name} delay={160 + i * 80}>
                  <div
                    className={clsx(
                      'relative flex h-full flex-col rounded-3xl border-2 p-8 transition-all duration-300',
                      plan.featured
                        ? 'border-red-500 bg-navy-900 text-white shadow-block-lg lg:-translate-y-3 lg:py-12 hover:shadow-[0_25px_60px_-15px_rgba(239,68,68,0.45)]'
                        : plan.special
                          ? 'border-amber-400 bg-navy-950 text-white shadow-block-lg hover:shadow-[0_25px_60px_-15px_rgba(251,191,36,0.35)]'
                          : 'border-slate-600 bg-white text-ink shadow-block-sm hover:-translate-y-1 hover:shadow-block',
                    )}
                  >
                    {plan.featured && (
                      <span className="absolute -top-4 right-6 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                        <Sparkles className="h-3.5 w-3.5" /> Most popular
                      </span>
                    )}
                    {plan.special && (
                      <span className="absolute -top-4 right-6 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-navy-950 shadow-md">
                        <Sparkles className="h-3.5 w-3.5" /> Tailored
                      </span>
                    )}
                    {!plan.negotiable && billing === 'annual' && savingsPct !== null && savingsPct > 0 && (
                      <span
                        className={clsx(
                          'absolute right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm',
                          plan.featured ? 'top-12 bg-emerald-400 text-navy-950' : 'top-4 bg-emerald-500 text-white',
                        )}
                      >
                        Save {savingsPct}%
                      </span>
                    )}

                    <div className="relative flex h-full flex-col">
                      <h3 className="font-display text-3xl font-bold tracking-tight">
                        {plan.name}
                      </h3>
                      <p
                        className={clsx(
                          'mt-3 text-sm',
                          isDark ? 'text-white/60' : 'text-slate-500',
                        )}
                      >
                        {plan.description}
                      </p>

                      {isCustom ? (
                        <div className="mt-8">
                          <span className="font-display text-4xl font-bold tracking-tight">
                            {plan.negotiable ? 'Negotiable' : 'Custom'}
                          </span>
                          <p
                            className={clsx(
                              'mt-4 text-sm',
                              isDark ? 'text-white/50' : 'text-slate-400',
                            )}
                          >
                            {plan.negotiable
                              ? 'Tailored SaaS or on-site software, scoped and priced around your operation.'
                              : 'Talk to us for a plan built around your team.'}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-8">
                          <p
                            className={clsx(
                              'text-xs font-bold uppercase tracking-wider',
                              isDark ? 'text-white/40' : 'text-slate-400',
                            )}
                          >
                            {billing === 'annual' ? '1st year price' : 'First 6 months price'}
                          </p>
                          <div className="mt-2.5 flex items-end gap-1.5">
                            <span className="font-display text-5xl font-bold tabular-nums tracking-tight">
                              ${firstPrice}
                            </span>
                            <span
                              className={clsx(
                                'mb-1.5 text-sm font-medium',
                                isDark ? 'text-white/50' : 'text-slate-400',
                              )}
                            >
                              /mo
                            </span>
                          </div>
                          <p
                            className={clsx(
                              'mt-4 text-sm',
                              isDark ? 'text-white/60' : 'text-slate-500',
                            )}
                          >
                            {billing === 'annual'
                              ? `Then $${afterPrice}/mo after your 1st year`
                              : `Then $${afterPrice}/mo after 6 months`}
                          </p>
                        </div>
                      )}

                      <div className="mt-8">
                        <Button
                          to="/contact"
                          variant={isDark ? 'inverse' : 'outline'}
                          size="md"
                          className="w-full"
                        >
                          {isCustom && !plan.negotiable ? 'Talk to sales' : plan.cta}
                        </Button>
                      </div>

                      <ul className="mt-9 space-y-4">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-3 text-sm">
                            <CheckCircle2
                              className={clsx(
                                'mt-0.5 h-4 w-4 flex-none',
                                plan.featured ? 'text-sky-300' : plan.special ? 'text-amber-300' : 'text-navy-600',
                              )}
                            />
                            <span
                              className={clsx(
                                isDark ? 'text-white/80' : 'text-slate-600',
                                f.startsWith('Everything in') && 'font-bold',
                              )}
                            >
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Standalone intelligence modules */}
      <section className="bg-slate-50">
        <Container className="py-16 lg:py-20">
          <Reveal className="flex flex-col gap-8 rounded-3xl bg-navy-900 p-8 text-white shadow-block sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Puzzle className="h-5 w-5" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Already have an FSM or ERP? Add intelligence modules on their own.
              </h2>
              <p className="mt-3 leading-relaxed text-white/70">
                Standalone intelligence modules are priced per module or as a bundle, scoped to the
                systems you connect and the size of your operation. Start with one and add more later.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button to="/contact?interest=Standalone%20Intelligence%20Modules" variant="inverse" size="lg">
                Get module pricing
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button to="/intelligence" variant="outline-inverse" size="lg">
                View modules
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-ink bg-white">
        <Container className="py-20">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionLabel>Questions</SectionLabel>
              <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                Frequently asked
              </h2>
              <p className="mt-4 text-slate-600">
                Can’t find what you’re looking for? Reach us at{' '}
                <a href={`mailto:${BRAND.email}`} className="font-medium text-navy-800 underline underline-offset-4">
                  {BRAND.email}
                </a>
                .
              </p>
            </div>
            <FaqAccordion items={FAQS} />
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  )
}
