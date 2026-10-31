import { ArrowRight, Search, Plug, ShieldCheck, Rocket } from 'lucide-react'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'
import SectionHeading from '../components/ui/SectionHeading'
import CtaBanner from '../components/ui/CtaBanner'
import { IntegrationsSection } from '../components/home/IntegrationsSection'
import ArchitectureDiagram from '../components/sections/ArchitectureDiagram'

const SCENARIOS = [
  {
    title: 'You already run an FSM platform',
    description:
      'Contractors using a platform such as ServiceTitan, BuildOps or similar keep it as their system of record. HVACtor is designed to connect to job, technician and customer data and add intelligence, such as scheduling or job-cost insight, alongside it.',
  },
  {
    title: 'You run an ERP with separate inventory software',
    description:
      'Purchasing, stock and supplier data can be connected to support procurement and inventory decisions without changing how your finance or warehouse teams work.',
  },
  {
    title: 'You have BMS or IoT equipment data',
    description:
      'Connected equipment and building data can inform maintenance prioritization, diagnostics and post-maintenance performance analysis, where the data is available.',
  },
]

const PROCESS = [
  { icon: Search, title: 'Discover', description: 'We map your systems, data and the decisions you want to improve.' },
  { icon: Plug, title: 'Connect', description: 'We connect only the data each module needs, via APIs, exports or scheduled imports.' },
  { icon: ShieldCheck, title: 'Validate', description: 'Data is normalized and checked with your team before it drives recommendations.' },
  { icon: Rocket, title: 'Activate', description: 'Recommendations are delivered into your workflow, then refined over time.' },
]

export default function Integrations() {
  return (
    <>
      <Seo
        title="HVAC Software Integration: Connect FSM, ERP, BMS & IoT"
        description="HVACtor is designed to integrate with your existing HVAC FSM, ERP, accounting, inventory, asset management and BMS/IoT systems, adding intelligence without replacing them."
      />
      <PageHero
        title={
          <>
            <span className="block">Keep your systems.</span>
            <span className="mt-3 block sm:mt-4">Connect your data.</span>
          </>
        }
        description="HVACtor is designed as an integration-first intelligence layer. Connect the systems you already rely on, and turn fragmented data into coordinated decisions, with no rip-and-replace."
      >
        <Button to="/contact?interest=Integration%20with%20my%20existing%20systems" variant="inverse" size="lg">
          Discuss Integration
          <ArrowRight className="h-4 w-4" />
        </Button>
      </PageHero>

      <section className="bg-white">
        <Container className="grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              index="01"
              label="How it fits together"
              title="From your systems to better decisions."
              description="Data from your existing systems flows into HVACtor’s integration and intelligence layer, which powers the modules you choose and the outcomes you care about."
            />
          </div>
          <ArchitectureDiagram />
        </Container>
      </section>

      <section className="bg-slate-50">
        <Container className="py-20 lg:py-24">
          <SectionHeading
            index="02"
            label="Common scenarios"
            title="Designed to work with what you already run."
            description="These describe our intended integration approach. Specific connectors depend on the systems and data access involved, so let’s confirm the details for your stack together."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {SCENARIOS.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-7">
                  <h3 className="font-display text-lg font-bold tracking-tight text-ink">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="py-20 lg:py-24">
          <SectionHeading index="03" label="Our approach" title="A clear path from first conversation to first recommendation." />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <li className="h-full list-none rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <p.icon className="h-5 w-5 text-navy-700" strokeWidth={1.8} />
                    <span className="font-mono text-xs text-slate-400">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold tracking-tight text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.description}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <IntegrationsSection />

      <CtaBanner
        heading="Tell us what you run today"
        subheading="Share your FSM, ERP, accounting and equipment systems, and we’ll outline how HVACtor would connect to them."
        primaryLabel="Discuss Integration"
        primaryTo="/contact?interest=Integration%20with%20my%20existing%20systems"
        secondaryLabel="Browse modules"
        secondaryTo="/intelligence"
      />
    </>
  )
}
