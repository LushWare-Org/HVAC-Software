import Container from '../ui/Container'
import Reveal from '../ui/Reveal'
import { ONBOARDING_STEPS } from '../../data/site'

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900"
    >
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_30%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_70%_100%,black,transparent)]" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />

      <Container className="relative py-20 lg:py-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Up and Running in{' '}
            <span className="bg-gradient-to-r from-white to-navy-300 bg-clip-text text-transparent">
              4 Simple Steps
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
            Quick, guided setup — start seeing results from day one.
          </p>
        </Reveal>

        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-[calc(12.5%+40px)] top-10 hidden h-px w-[calc(75%-80px)] overflow-hidden bg-white/15 lg:block">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-[sweep_2.5s_linear_infinite] bg-gradient-to-r from-transparent via-white to-transparent" />
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {ONBOARDING_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <Reveal key={step.number} delay={i * 60}>
                  <div className="text-center">
                    <div className="relative mb-6 inline-flex">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                        <Icon className="h-9 w-9 text-white" />
                      </div>
                      <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-navy-950 text-sm font-bold text-white shadow-md">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}
