import { CheckCircle2 } from 'lucide-react'
import Container from '../ui/Container'
import SectionLabel from '../ui/SectionLabel'
import Reveal from '../ui/Reveal'
import { OPERATIONS_SHOWCASE } from '../../data/site'

export default function OperationsShowcase() {
  return (
    <section id="operations" className="bg-white">
      <Container className="pt-12 pb-20 lg:pt-16 lg:pb-28">
        <Reveal className="max-w-2xl">
          <SectionLabel index="01">Operations</SectionLabel>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Run the job, start to finish
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Jobs, dispatch, multi-visit projects and service agreements share
            one record — so nothing gets re-typed between the office and the
            truck.
          </p>
        </Reveal>

        <div className="mt-10 border-t border-ink">
          {OPERATIONS_SHOWCASE.map((item, i) => {
            const Icon = item.icon
            const reversed = i % 2 === 1
            return (
              <div
                key={item.id}
                className="group border-b border-ink/15 py-10 last:border-b-0 lg:py-14"
              >
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                  <Reveal
                    direction="up"
                    duration={800}
                    once={false}
                    className={reversed ? 'lg:order-2' : ''}
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 flex-none items-center justify-center border border-ink bg-navy-900 text-white transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-6 text-lg leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                    <ul className="mt-7 flex flex-col gap-4">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-500" />
                          <span className="text-[15px] leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>

                  <Reveal
                    direction={reversed ? 'left' : 'right'}
                    delay={150}
                    duration={900}
                    once={false}
                    className={reversed ? 'lg:order-1' : ''}
                  >
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-block-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-block">
                      {item.url && (
                        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                          <span className="flex flex-none gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                          </span>
                          <span className="ml-2 truncate rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-slate-500">
                            {item.url}
                          </span>
                        </div>
                      )}
                      <div className="relative aspect-[11/6] bg-white">
                        <img
                          src={item.image}
                          alt={item.imageAlt}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
