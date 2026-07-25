import Hero from '../components/home/Hero'
import FeatureAccordion from '../components/home/FeatureAccordion'
import HowItWorks from '../components/home/HowItWorks'
import OperationsShowcase from '../components/home/OperationsShowcase'
import SalesShowcase from '../components/home/SalesShowcase'
// import AnalyticsSection from '../components/home/AnalyticsSection'
import MobileAppSection from '../components/home/MobileAppSection'
import { AgentsSection, BusinessSection } from '../components/home/AgentsAndBusiness'
import { IntegrationsSection, RoadmapSection } from '../components/home/IntegrationsAndRoadmap'

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureAccordion />
      <HowItWorks />
      <OperationsShowcase />
      <AgentsSection />
      <SalesShowcase />
      {/* <AnalyticsSection /> */}
      <MobileAppSection />
      <BusinessSection />
      <IntegrationsSection />
      <RoadmapSection />
    </>
  )
}
