import { CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import SectionLabel from '../components/ui/SectionLabel'
import CtaBanner from '../components/ui/CtaBanner'
import Button from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'
import { FEATURES, OPERATIONS_SHOWCASE, SALES_SHOWCASE, BUSINESS_TABS } from '../data/site'

interface Row {
  key: string
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
  image: string
  imageAlt: string
  url?: string
}

const featureRows: Row[] = FEATURES.map((f) => ({
  key: `feature-${f.id}`,
  icon: f.icon,
  title: f.title,
  description: f.description,
  bullets: f.bullets,
  image: f.image,
  imageAlt: f.imageAlt,
  url: f.url,
}))

const opsRows: Row[] = OPERATIONS_SHOWCASE.map((item) => ({
  key: `ops-${item.id}`,
  icon: item.icon,
  title: item.title,
  description: item.description,
  bullets: item.bullets,
  image: item.image,
  imageAlt: item.imageAlt,
  url: item.url,
}))

const salesRows: Row[] = SALES_SHOWCASE.map((item) => ({
  key: `sales-${item.id}`,
  icon: item.icon,
  title: item.title,
  description: item.description,
  bullets: item.bullets,
  image: item.image,
  imageAlt: item.imageAlt,
  url: item.url,
}))

const businessRows: Row[] = BUSINESS_TABS.map((tab) => ({
  key: `business-${tab.id}`,
  icon: tab.icon,
  title: tab.headline,
  description: tab.description,
  bullets: tab.bullets,
  image: tab.image,
  imageAlt: tab.imageAlt,
  url: tab.url,
}))

function FeatureRows({ rows }: { rows: Row[] }) {
  return (
    <div className="mt-10 border-t border-ink">
      {rows.map((row, i) => {
        const Icon = row.icon
        const reversed = i % 2 === 1
        return (
          <div
            key={row.key}
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
                    {row.title}
                  </h3>
                </div>
                <p className="mt-6 text-lg leading-relaxed text-slate-600">{row.description}</p>
                <ul className="mt-7 flex flex-col gap-4">
                  {row.bullets.map((b) => (
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
                  {row.url && (
                    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                      <span className="flex flex-none gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                      </span>
                      <span className="ml-2 truncate rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-slate-500">
                        {row.url}
                      </span>
                    </div>
                  )}
                  <div className="relative aspect-[11/6] bg-white">
                    <img
                      src={row.image}
                      alt={row.imageAlt}
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
  )
}

function FeatureGroup({
  index,
  label,
  heading,
  description,
  rows,
  className,
}: {
  index: string
  label: string
  heading: ReactNode
  description?: string
  rows: Row[]
  className?: string
}) {
  return (
    <section className={className ?? 'border-b border-ink bg-white'}>
      <Container className="py-16 lg:py-20">
        <Reveal className="max-w-2xl">
          <SectionLabel index={index}>{label}</SectionLabel>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {heading}
          </h2>
          {description && (
            <p className="mt-5 text-lg leading-relaxed text-slate-600">{description}</p>
          )}
        </Reveal>
        <FeatureRows rows={rows} />
      </Container>
    </section>
  )
}

export default function Features() {
  return (
    <>
      <PageHero
        title={
          <>
            <span className="block">The Whole Operation,</span>
            <span className="mt-3 block sm:mt-4">In One System of Record</span>
          </>
        }
        description="Every capability shares the same data. So a job booked in the office is the same job your tech closes, and the same number that lands on the books."
      >
        <Button to="/contact" variant="inverse" size="lg">
          Request a Demo
        </Button>
      </PageHero>

      <FeatureGroup
        index="01"
        label="Platform"
        heading="Everything From The First Call To The Final Invoice"
        description="Seven capabilities that share the same data — so a job booked in the office is the same job your tech closes and gets paid for in the field."
        rows={featureRows}
      />

      <FeatureGroup
        index="02"
        label="Operations"
        heading="Run The Job, Start To Finish"
        description="Jobs, dispatch, multi-visit projects and service agreements share one record — so nothing gets re-typed between the office and the truck."
        rows={opsRows}
      />

      <FeatureGroup
        index="03"
        label="Sales & Customers"
        heading="Every Account, Scored - Not Guessed At"
        description="A CRM that reads risk and revenue automatically, marketing that runs on rails, and one inbox so no conversation gets lost between channels."
        rows={salesRows}
      />

      <FeatureGroup
        index="04"
        label="Business"
        heading="The Back Office, Without The Spreadsheets"
        rows={businessRows}
        className="border-b border-ink bg-white last:border-b-0"
      />

      <CtaBanner
        heading="See it on your data"
        subheading="Book a 30-minute demo and we’ll walk your workflow through HVACtor - dispatch, mobile, invoicing and all."
      />
    </>
  )
}
