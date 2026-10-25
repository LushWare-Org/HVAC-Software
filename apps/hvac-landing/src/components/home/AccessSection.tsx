import { ArrowRight } from 'lucide-react'
import Container from '../ui/Container'
import Reveal from '../ui/Reveal'
import SectionLabel from '../ui/SectionLabel'
import { APP_LINKS } from '../../data/site'

/** Two big, obvious doors into the product: the admin dashboard and the customer portal. */
export default function AccessSection() {
  return (
    <section id="login" className="bg-white">
      <Container className="py-20 lg:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel index="08">Log in</SectionLabel>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Already on HVACtor.ai? Pick your door.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            One for the people who run the business, one for the customers they serve.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 border-t border-ink pt-10 md:grid-cols-2 lg:gap-8 lg:pt-14">
          {APP_LINKS.map((app, i) => {
            const Icon = app.icon
            return (
              <Reveal key={app.id} delay={i * 120} duration={800} className="h-full">
                <a
                  href={app.href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-navy-900 p-7 text-white shadow-block-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-block focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 sm:p-9"
                >
                  <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-30" />
                  <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-navy-500/25 blur-3xl transition-opacity duration-300 group-hover:opacity-80" />

                  <div className="relative flex items-center gap-4">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-lg border border-white/20 bg-white/10">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-medium text-white/60">{app.audience}</span>
                  </div>

                  <h3 className="relative mt-8 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {app.name}
                  </h3>
                  <p className="relative mt-3 max-w-md text-base leading-relaxed text-white/70">
                    {app.description}
                  </p>

                  <div className="relative mt-auto flex flex-wrap items-center justify-between gap-4 pt-9">
                    <span className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 font-display text-sm font-semibold text-navy-950 transition-colors group-hover:bg-navy-50">
                      {app.cta}
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                    <span className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70">
                      {app.host}
                    </span>
                  </div>
                </a>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
