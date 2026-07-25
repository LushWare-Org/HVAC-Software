import Container from '../ui/Container'
import SectionLabel from '../ui/SectionLabel'
import { WORKFLOW } from '../../data/site'

export default function WorkflowSteps() {
  return (
    <section className="border-b border-ink bg-navy-50/40">
      <Container className="py-20 lg:py-28">
        <div className="max-w-2xl">
          <SectionLabel index="04">How it works</SectionLabel>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            From ringing phone to repeat customer
          </h2>
        </div>

        <div className="mt-12 grid gap-px border border-ink bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.step} className="group bg-white p-7 transition-colors hover:bg-navy-950 hover:text-white">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center border border-ink bg-navy-900 font-display text-lg font-bold text-white group-hover:border-white/40">
                    {step.step}
                  </span>
                  <Icon className="h-6 w-6 text-navy-700 group-hover:text-white/70" />
                </div>
                <h3 className="mt-6 font-display text-lg font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 group-hover:text-white/70">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
