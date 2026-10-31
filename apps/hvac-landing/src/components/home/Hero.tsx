import { ArrowRight, Layers, Puzzle, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
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

      <Container className="relative grid gap-12 pt-28 pb-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:pt-36 lg:pb-20">
        <div className="flex flex-col items-start text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-navy-200" />
            Operational intelligence for commercial & industrial HVAC/MEP contractors
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
            Beyond HVAC management.{' '}
            <span className="bg-gradient-to-r from-white to-navy-300 bg-clip-text text-transparent">
              Into intelligent operations.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
            Manage your HVAC operations, connect your existing business systems, and
            optimize critical decisions with AI-powered operational intelligence.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button to="/contact" variant="inverse" size="lg">
              Request a Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="#ways-to-use" variant="outline-inverse" size="lg">
              Explore the Platform
            </Button>
          </div>

          <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
            <Link
              to="/fsm"
              className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/25 hover:bg-white/10"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Layers className="h-4 w-4 text-navy-200" />
                Complete FSM + Intelligence
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-white/60">Run your operation on HVACtor.</p>
            </Link>
            <Link
              to="/intelligence"
              className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/25 hover:bg-white/10"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Puzzle className="h-4 w-4 text-navy-200" />
                Standalone Intelligence Modules
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-white/60">Keep your current software.</p>
            </Link>
          </div>
        </div>

        <Reveal direction="right" delay={150} duration={900} className="pb-4 lg:pb-0">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-block">
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
                alt="HVACtor live dispatch map with technician locations and unassigned jobs"
                loading="eager"
                fetchPriority="high"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
