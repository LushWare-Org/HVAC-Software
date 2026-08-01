import { useState } from 'react'
import { ArrowDown, CheckCircle2, ChevronDown, Sparkles, X } from 'lucide-react'
import clsx from 'clsx'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import SectionLabel from '../components/ui/SectionLabel'
import FaqAccordion from '../components/ui/FaqAccordion'
import CtaBanner from '../components/ui/CtaBanner'
import Button from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'
import { PRICING_PLANS, PRICING_TEAM_SIZES, BETA_OFFER, FAQS } from '../data/site'
import type { TeamSizeId } from '../data/site'

type Billing = 'monthly' | 'annual'

const DEFAULT_TEAM_SIZE: TeamSizeId = 'upto5'

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('annual')
  const [teamSize, setTeamSize] = useState<TeamSizeId>(DEFAULT_TEAM_SIZE)
  const [showBetaBanner, setShowBetaBanner] = useState(true)

  return (
    <>
      <PageHero
        title={
          <>
            <span className="block">Straight Forward Pricing.</span>
            <span className="mt-3 block sm:mt-4">No Surprises on the Invoice.</span>
          </>
        }
        description="Pricing that scales with your crew. Every plan includes the mobile app, onboarding and updates. Cancel any time."
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
              <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 rounded-full border border-navy-100 bg-navy-50 py-1.5 pl-1.5 pr-3 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-navy-950 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  <Sparkles className="h-3 w-3" /> Beta offer
                </span>
                <span className="text-navy-800">
                  Our first <strong className="font-semibold">{BETA_OFFER.seats} Beta Clients</strong> get{' '}
                  {BETA_OFFER.freeMonths} months free, then {BETA_OFFER.discountPct}% off for a year. After that billed normally.
                </span>
                <button
                  type="button"
                  aria-label="Dismiss beta offer"
                  onClick={() => setShowBetaBanner(false)}
                  className="text-navy-300 transition-colors hover:text-navy-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
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

          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-center lg:gap-8">
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

              return (
                <Reveal key={plan.name} delay={160 + i * 80}>
                  <div
                    className={clsx(
                      'relative flex h-full flex-col rounded-3xl border-2 p-8 transition-all duration-300',
                      plan.featured
                        ? 'border-red-500 bg-navy-900 text-white shadow-block-lg lg:-translate-y-3 lg:py-12 hover:shadow-[0_25px_60px_-15px_rgba(239,68,68,0.45)]'
                        : 'border-slate-600 bg-white text-ink shadow-block-sm hover:-translate-y-1 hover:shadow-block',
                    )}
                  >
                    {plan.featured && (
                      <span className="absolute -top-4 right-6 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                        <Sparkles className="h-3.5 w-3.5" /> Most popular
                      </span>
                    )}
                    {billing === 'annual' && savingsPct !== null && savingsPct > 0 && (
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
                          plan.featured ? 'text-white/60' : 'text-slate-500',
                        )}
                      >
                        {plan.description}
                      </p>

                      {isCustom ? (
                        <div className="mt-8">
                          <span className="font-display text-4xl font-bold tracking-tight">
                            Custom
                          </span>
                          <p
                            className={clsx(
                              'mt-4 text-sm',
                              plan.featured ? 'text-white/50' : 'text-slate-400',
                            )}
                          >
                            Talk to us for a plan built around your team.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-8">
                          <p
                            className={clsx(
                              'text-xs font-bold uppercase tracking-wider',
                              plan.featured ? 'text-white/40' : 'text-slate-400',
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
                                plan.featured ? 'text-white/50' : 'text-slate-400',
                              )}
                            >
                              /mo
                            </span>
                          </div>
                          <p
                            className={clsx(
                              'mt-4 text-sm',
                              plan.featured ? 'text-white/60' : 'text-slate-500',
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
                          variant={plan.featured ? 'inverse' : 'outline'}
                          size="md"
                          className="w-full"
                        >
                          {isCustom ? 'Talk to sales' : plan.cta}
                        </Button>
                      </div>

                      <ul className="mt-9 space-y-4">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-3 text-sm">
                            <CheckCircle2
                              className={clsx(
                                'mt-0.5 h-4 w-4 flex-none',
                                plan.featured ? 'text-sky-300' : 'text-navy-600',
                              )}
                            />
                            <span className={plan.featured ? 'text-white/80' : 'text-slate-600'}>
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
                <a href="mailto:sales@hvactor.ai" className="font-medium text-navy-800 underline underline-offset-4">
                  sales@hvactor.ai
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
