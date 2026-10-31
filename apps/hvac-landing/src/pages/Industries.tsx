import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'
import SectionHeading from '../components/ui/SectionHeading'
import CtaBanner from '../components/ui/CtaBanner'
import { INDUSTRIES, ROLES } from '../data/platform'
import { getModule, modulePath } from '../data/modules'

export default function Industries() {
  return (
    <>
      <Seo
        title="HVAC Contractor Software for Commercial, Industrial & MEP"
        description="HVACtor serves commercial HVAC, industrial HVAC, MEP contractors and critical-facility service providers with field service management and operational intelligence."
      />
      <PageHero
        title={
          <>
            <span className="block">Built for commercial</span>
            <span className="mt-3 block sm:mt-4">& industrial HVAC</span>
          </>
        }
        description="HVACtor is designed for contractors whose operations are complex enough that better decisions about crews, costs, parts and equipment make a measurable difference."
      >
        <Button to="/contact" variant="inverse" size="lg">
          Request a Demo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </PageHero>

      <section className="bg-white">
        <Container className="py-20 lg:py-24">
          <SectionHeading index="01" label="Who we serve" title="Where HVACtor fits." />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {INDUSTRIES.map((ind, i) => (
              <Reveal key={ind.id} delay={(i % 2) * 80}>
                <article id={ind.id} className="flex h-full scroll-mt-24 flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-700">
                    <ind.icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">{ind.title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{ind.description}</p>
                  <div className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Common challenges</div>
                  <ul className="mt-2 space-y-1.5">
                    {ind.challenges.map((c) => (
                      <li key={c} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span className="mt-2 h-1 w-1 flex-none rounded-full bg-navy-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Relevant modules</div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {ind.modules.map((slug) => {
                      const m = getModule(slug)
                      if (!m) return null
                      return (
                        <li key={slug}>
                          <Link
                            to={modulePath(m)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-navy-300 hover:bg-navy-50"
                          >
                            <m.icon className="h-3.5 w-3.5 text-navy-600" />
                            {m.navLabel}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-slate-50">
        <Container className="py-20 lg:py-24">
          <SectionHeading index="02" label="Who uses HVACtor" title="Built for the people making the decisions." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ROLES.map((r, i) => (
              <Reveal key={r.title} delay={i * 60}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-display text-base font-bold tracking-tight text-ink">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  )
}
