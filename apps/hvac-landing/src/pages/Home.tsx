import Seo from '../components/Seo'
import Hero from '../components/home/Hero'
import FeatureAccordion from '../components/home/FeatureAccordion'
import CtaBanner from '../components/ui/CtaBanner'
import {
  ChallengesSection,
  PillarsSection,
  OfferingsSection,
  ModulesSection,
  IntegrationArchitectureSection,
  IntelligencePillarsSection,
  ValueSection,
} from '../components/sections/PlatformSections'

export default function Home() {
  return (
    <>
      <Seo
        title="HVACtor.ai | AI-Powered HVAC Operations & Field Service Software"
        description="HVACtor connects HVAC operations and turns fragmented data into optimized decisions. Field service management, integrations and AI intelligence modules for HVAC/MEP contractors."
      />
      <Hero />
      <ChallengesSection index="01" />
      <PillarsSection index="02" />
      <OfferingsSection index="03" />
      <ModulesSection index="04" />
      <IntegrationArchitectureSection index="05" />
      <IntelligencePillarsSection index="06" compact />
      <FeatureAccordion />
      <ValueSection index="07" />
      <CtaBanner
        heading="See what HVACtor can do with your data"
        subheading="Tell us which systems you run and which decisions matter most. We’ll show you where HVACtor fits, whether as your FSM or alongside it."
        primaryLabel="Request a Demo"
        secondaryLabel="Discuss Integration"
        secondaryTo="/contact?interest=Integration%20with%20my%20existing%20systems"
      />
    </>
  )
}
