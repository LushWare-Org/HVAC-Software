import { ArrowRight, Play } from 'lucide-react'
import Container from '../ui/Container'
import Button from '../ui/Button'
import Reveal from '../ui/Reveal'
import { PRODUCT_SHOTS } from '../../data/site'

export default function Hero() {
  return (
    <section className="relative -mt-16 overflow-hidden bg-gradient-to-br from-navy-800 via-navy-950 to-navy-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_30%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_70%_100%,black,transparent)]" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />
      <div className="pointer-events-none absolute left-16 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <Container className="relative grid gap-12 pt-28 pb-12 lg:grid-cols-2 lg:items-center lg:gap-10 lg:pt-32 lg:pb-16">
        <div className="flex flex-col items-start text-left">
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.3] tracking-tight text-white sm:text-5xl lg:text-6xl pb-2">
            Run Your HVAC
            <br />
            Business{' '}
            <span className="relative inline-block pt-2 pb-2">
              <span className="bg-gradient-to-r from-white to-navy-300 bg-clip-text text-transparent">
                Smarter
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8C40 2 80 2 100 6C120 10 160 10 198 4"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </svg>
            </span>
            <br />
            Not Harder
          </h1>

          <p className="mt-4 max-w-[800px] text-lg leading-relaxed text-white/70 sm:text-xl">
            HVACtor is the all-in-one platform that helps HVAC contractors
            streamline Scheduling, Dispatch, Invoicing, Inventory, and Customer
            Management - so you can focus on what you do best.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 pt-3 pb-8">
            <Button to="/contact" variant="inverse" size="lg">
              Start Free 7-Day Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button to="/features" variant="outline-inverse" size="lg">
              <Play className="h-4 w-4" />
              Explore Features
            </Button>
          </div>
        </div>

        <Reveal direction="right" delay={150} duration={900} once={false} className="pb-8 lg:pb-0">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-block transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <span className="flex flex-none gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </span>
              <span className="ml-2 truncate rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-slate-500">
                app.hvactor.ai/scheduling
              </span>
            </div>
            <div className="relative aspect-[11/7] bg-white">
              <img
                src={PRODUCT_SHOTS.liveDispatch}
                alt="Live scheduling map in HVACtor.ai"
                loading="eager"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
