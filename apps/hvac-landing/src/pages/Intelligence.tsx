import { ArrowRight, Link2, PlayCircle, PlusCircle } from 'lucide-react'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'
import SectionHeading from '../components/ui/SectionHeading'
import CtaBanner from '../components/ui/CtaBanner'
import { ModulesSection, OfferingsSection } from '../components/sections/PlatformSections'

const ADOPTION_STEPS = [
  {
    icon: PlayCircle,
    title: 'Start with one priority',
    description: 'Pick the decision area costing you the most today, such as scheduling, SLA performance, quoting or maintenance.',
  },
  {
    icon: Link2,
    title: 'Connect the data it needs',
    description: 'Use HVACtor’s FSM, or connect the relevant data from the systems you already run.',
  },
  {
    icon: PlusCircle,
    title: 'Expand when ready',
    description: 'Add modules or a bundle later. Each new module builds on integrations already in place.',
  },
]

export default function Intelligence() {
  return (
    <>
      <Seo
        title="HVAC Intelligence Modules: AI for HVAC Operations"
        description="Nine connected intelligence modules for HVAC/MEP contractors: scheduling, SLA and priority management, job costing, procurement, approvals, diagnostics, predictive maintenance, post-maintenance performance and energy efficiency."
      />
      <PageHero
        title={
          <>
            <span className="block">HVACtor</span>
            <span className="mt-3 block sm:mt-4">Intelligence Modules</span>
          </>
        }
        description="Purpose-built intelligence for every critical HVAC operational workflow. Use them with HVACtor’s FSM or alongside the software you already run, and buy only what you need."
      >
        <Button to="/contact?interest=Standalone%20Intelligence%20Modules" variant="inverse" size="lg">
          Discuss your priorities
          <ArrowRight className="h-4 w-4" />
        </Button>
      </PageHero>

      <ModulesSection showCta={false} />

      <section className="bg-slate-50">
        <Container className="py-20 lg:py-24">
          <SectionHeading
            label="Modular by design"
            title="Start with one module. Expand as your needs evolve."
            description="Modules are independently selectable but share a common integration and intelligence foundation, so each one you add gets more from the data already connected."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {ADOPTION_STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-7">
                  <span className="font-mono text-xs text-slate-400">Step {i + 1}</span>
                  <s.icon className="mt-3 h-6 w-6 text-navy-700" strokeWidth={1.8} />
                  <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <OfferingsSection />
      <CtaBanner
        heading="Not sure where to start?"
        subheading="Tell us about your operation and the systems you use. We’ll help you identify the module most likely to make a difference first."
        primaryLabel="Talk to us"
        primaryTo="/contact?interest=Standalone%20Intelligence%20Modules"
        secondaryLabel="See integrations"
        secondaryTo="/integrations"
      />
    </>
  )
}
