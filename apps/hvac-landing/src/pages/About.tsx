import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import SectionLabel from '../components/ui/SectionLabel'
import CtaBanner from '../components/ui/CtaBanner'
import { VALUES, IMAGES } from '../data/site'

export default function About() {
  return (
    <>
      <Seo
        title="About HVACtor"
        description="HVACtor builds AI-powered, integration-first decision intelligence for commercial and industrial HVAC/MEP contractors."
      />
      <PageHero
        title={
          <>
            <span className="block">From recording operations</span>
            <span className="mt-3 block sm:mt-4">to improving them</span>
          </>
        }
        description="HVACtor connects HVAC operations and transforms fragmented operational data into intelligent, optimized business decisions."
      />

      <section className="border-b border-ink bg-white">
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
          <div>
            <SectionLabel index="01">Our mission</SectionLabel>
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              Help HVAC contractors decide what should happen next
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-600">
              <p>
                Commercial and industrial HVAC/MEP contractors already generate the data
                they need to run better: jobs, costs, stock, equipment readings. But it is
                spread across field service, ERP, accounting and building systems, and
                most software only records what already happened.
              </p>
              <p>
                HVACtor combines field service management, an integration layer that works
                with the systems you already use, and decision intelligence built on
                predictive machine learning, mathematical optimization and governed AI
                agents, so operational and financial decisions are made with the full picture.
              </p>
            </div>
          </div>
          <div className="relative border-2 border-ink shadow-block">
            <img
              src={IMAGES.industrialUnit}
              alt={IMAGES.industrialUnitAlt}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="py-20">
          <div className="max-w-2xl">
            <SectionLabel index="02">What we believe</SectionLabel>
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              The principles behind every release
            </h2>
          </div>
          <div className="mt-12 grid gap-px border border-ink bg-ink/10 sm:grid-cols-2">
            {VALUES.map((value) => {
              const Icon = value.icon
              return (
                <div key={value.title} className="bg-white p-8">
                  <span className="flex h-12 w-12 items-center justify-center border border-ink bg-navy-900 text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-ink">
                    {value.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{value.description}</p>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      <CtaBanner
        heading="Let’s talk about your operation"
        subheading="Whether you need a complete FSM or intelligence on top of the systems you run today, we’d like to hear from you."
        primaryLabel="Get in touch"
        secondaryLabel={undefined}
      />
    </>
  )
}
