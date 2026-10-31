import { ArrowRight, Bot, CheckCircle2, FileSearch, Lock, UserCheck } from 'lucide-react'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'
import SectionHeading from '../components/ui/SectionHeading'
import CtaBanner from '../components/ui/CtaBanner'
import {
  PillarsSection,
  OfferingsSection,
  IntegrationArchitectureSection,
  IntelligencePillarsSection,
  ModulesSection,
} from '../components/sections/PlatformSections'
import { AGENTS } from '../data/site'

const GOVERNANCE = [
  { icon: UserCheck, title: 'Human approval', description: 'Agents recommend; authorized people approve consequential actions.' },
  { icon: Lock, title: 'Permissioned actions', description: 'Agents act only within the roles and permissions you configure.' },
  { icon: FileSearch, title: 'Explainable recommendations', description: 'Each recommendation shows the context and signals behind it.' },
  { icon: CheckCircle2, title: 'Auditable by default', description: 'Recommendations, approvals and actions are logged and reviewable.' },
]

export default function Platform() {
  return (
    <>
      <Seo
        title="The HVACtor Platform: HVAC Operations, Integration & AI"
        description="One platform to manage HVAC service operations, connect existing FSM, ERP and BMS systems, and optimize decisions with machine learning, optimization and governed AI agents."
      />
      <PageHero
        title={
          <>
            <span className="block">An intelligence layer for</span>
            <span className="mt-3 block sm:mt-4">HVAC operations</span>
          </>
        }
        description="HVACtor doesn’t just record what happens in your operation. It is built to help you decide what should happen next, why, and how to get a better operational and financial outcome."
      >
        <Button to="/contact" variant="inverse" size="lg">
          Request a Demo
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button href="#architecture" variant="outline-inverse" size="lg">
          See the architecture
        </Button>
      </PageHero>

      <PillarsSection index="01" />
      <IntegrationArchitectureSection index="02" />
      <IntelligencePillarsSection index="03" />

      <section className="bg-slate-50">
        <Container className="py-20 lg:py-24">
          <SectionHeading
            index="04"
            label="Governed AI"
            title="AI that supports decisions, with people accountable for them."
            description="HVACtor’s agents interpret context and coordinate work, but they operate inside clear guardrails."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GOVERNANCE.map((g, i) => (
              <Reveal key={g.title} delay={i * 60}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-6">
                  <g.icon className="h-5 w-5 text-navy-700" strokeWidth={1.8} />
                  <h3 className="mt-4 font-display text-base font-bold tracking-tight text-ink">{g.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{g.description}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight text-ink">In the product today</h3>
                <p className="text-sm text-slate-500">Customer-growth agents that learn which actions work, and can each be switched on or off.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AGENTS.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                    <a.icon className="h-4 w-4 text-navy-600" />
                    {a.name}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.description}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <OfferingsSection index="05" />
      <ModulesSection index="06" />
      <CtaBanner />
    </>
  )
}
