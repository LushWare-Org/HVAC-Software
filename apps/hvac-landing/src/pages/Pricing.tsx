import { useState } from 'react'
import { CheckCircle2, Star } from 'lucide-react'
import clsx from 'clsx'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import SectionLabel from '../components/ui/SectionLabel'
import FaqAccordion from '../components/ui/FaqAccordion'
// import CtaBanner from '../components/ui/CtaBanner'
import Button from '../components/ui/Button'
import { PRICING_PLANS, FAQS } from '../data/site'

type Billing = 'monthly' | 'annual'

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('annual')

  return (
    <>
      <PageHero
        title={
          <>
            <span className="block">Straight Forward Pricing.</span>
            <span className="mt-3 block sm:mt-4">No Surprises on the Invoice.</span>
          </>
        }
        description="Per-user pricing that scales with your crew. Every plan includes the mobile app, onboarding and updates. Cancel any time."
      />

      <section className="border-b border-ink bg-white">
        <Container className="py-16 lg:py-18">
          <div className="text-center">
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Choose your billing
            </h2>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span
              className={clsx(
                'text-sm font-semibold transition-colors',
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
              className="relative h-8 w-16 flex-none rounded-full bg-navy-700 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
            >
              <span
                className={clsx(
                  'absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300',
                  billing === 'annual' ? 'translate-x-8' : 'translate-x-0',
                )}
              />
            </button>
            <span
              className={clsx(
                'flex items-center gap-2 text-sm font-semibold transition-colors',
                billing === 'annual' ? 'text-ink' : 'text-slate-400',
              )}
            >
              Annual
              <span
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors duration-300',
                  billing === 'annual'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400',
                )}
              >
                Save 18%
              </span>
            </span>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => {
              const price = billing === 'monthly' ? plan.monthly : plan.annual
              return (
                <div
                  key={plan.name}
                  className={clsx(
                    'relative flex flex-col rounded-2xl border-2 p-8 transition-all duration-300',
                    plan.featured
                      ? 'border-red-500 bg-navy-800 text-white shadow-block'
                      : 'border-ink bg-white text-ink shadow-block-sm hover:-translate-y-1 hover:shadow-block-sm',
                  )}
                >
                  {plan.featured && (
                    <span className="absolute -top-4 right-6 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                      <Star className="h-3.5 w-3.5 fill-white" /> Popular
                    </span>
                  )}
                  <h3 className="font-display text-xl font-bold tracking-tight">{plan.name}</h3>
                  <p
                    className={clsx(
                      'mt-2 text-sm',
                      plan.featured ? 'text-white/60' : 'text-slate-500',
                    )}
                  >
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-end gap-1">
                    <span className="font-display text-5xl font-bold tracking-tight">
                      ${price}
                    </span>
                    <span
                      className={clsx('mb-2 text-sm', plan.featured ? 'text-white/50' : 'text-slate-400')}
                    >
                       / mo
                    </span>
                  </div>
                  <p
                    className={clsx('mt-1 text-xs', plan.featured ? 'text-white/40' : 'text-slate-400')}
                  >
                    {billing === 'annual' ? 'billed annually' : 'billed monthly'}
                  </p>

                  <div className="mt-6">
                    <Button
                      to="/contact"
                      variant={plan.featured ? 'inverse' : 'primary'}
                      size="md"
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </div>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <CheckCircle2
                          className={clsx(
                            'mt-0.5 h-4 w-4 flex-none',
                            plan.featured ? 'text-white' : 'text-navy-700',
                          )}
                        />
                        <span className={plan.featured ? 'text-white/80' : 'text-slate-600'}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
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

      {/* <CtaBanner /> */}
    </>
  )
}
