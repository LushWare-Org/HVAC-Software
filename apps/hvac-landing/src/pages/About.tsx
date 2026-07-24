import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import SectionLabel from '../components/ui/SectionLabel'
// import StatStrip from '../components/ui/StatStrip'
// import CtaBanner from '../components/ui/CtaBanner'
import { VALUES, TIMELINE, IMAGES } from '../data/site'

export default function About() {
  return (
    <>
      <PageHero
        title={
          <>
            <span className="block">Built by people who’ve</span>
            <span className="mt-3 block sm:mt-4">been on the truck</span>
          </>
        }
        description="We started HVACtor because the trades deserve software that respects the reality of the field — dirty hands, bad signal, and no time for clunky menus."
      />

      <section className="border-b border-ink bg-white">
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
          <div>
            <SectionLabel index="01">Our mission</SectionLabel>
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              Give every trade business the tools of a national franchise
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-600">
              <p>
                The best contractors we know run on hustle and relationships — but
                they were fighting spreadsheets, whiteboards and five disconnected
                apps just to get through the day.
              </p>
              <p>
                HVACtor brings dispatch, field execution, billing and intelligence
                into one platform, so a three-truck shop can operate with the
                polish of an operation ten times its size.
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
            <div className="absolute bottom-4 left-4 border border-white/40 bg-navy-950/70 px-3 py-1.5 font-mono text-xs text-white">
              Est. 2018 · Denver, CO
            </div>
          </div>
        </Container>
      </section>

      {/* <StatStrip /> */}

      <section className="border-b border-ink bg-white">
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

      <section className="border-b border-ink bg-navy-50/40">
        <Container className="py-20">
          <div className="max-w-2xl">
            <SectionLabel index="03">The road so far</SectionLabel>
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              From service van to 12,000 technicians
            </h2>
          </div>
          <div className="mt-12 grid gap-px border border-ink bg-ink/10 lg:grid-cols-4">
            {TIMELINE.map((item) => (
              <div key={item.year} className="bg-white p-7">
                <div className="font-display text-4xl font-bold tracking-tight text-navy-900">
                  {item.year}
                </div>
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* <CtaBanner
        heading="Come build with us"
        subheading="Whether you want a demo or a career, we’d love to hear from you."
      /> */}
    </>
  )
}
