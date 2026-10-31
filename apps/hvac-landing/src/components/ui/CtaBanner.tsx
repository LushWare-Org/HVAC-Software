import { ArrowRight } from 'lucide-react'
import Container from './Container'
import Button from './Button'
import Reveal from './Reveal'

interface CtaBannerProps {
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryTo?: string
  secondaryLabel?: string
  secondaryTo?: string
}

export default function CtaBanner({
  heading = 'See HVACtor on your operation',
  subheading = 'Book a demo and we’ll walk through your workflows, your systems and the decisions that matter most to you.',
  primaryLabel = 'Request a Demo',
  primaryTo = '/contact',
  secondaryLabel = 'Explore Intelligence Modules',
  secondaryTo = '/intelligence',
}: CtaBannerProps) {
  return (
    <section className="bg-white">
      <Container className="py-12 lg:py-16">
        <Reveal
          once={false}
          className="relative overflow-hidden rounded-2xl bg-navy-900 px-6 py-10 text-center text-white shadow-block sm:px-10 sm:py-12"
        >
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-navy-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-12 h-56 w-56 rounded-full bg-navy-400/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-30" />

          <div className="relative mx-auto max-w-xl">
            <h2 className="font-display text-2xl font-bold leading-[1.15] tracking-tight sm:text-3xl">
              {heading}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base text-white/70">{subheading}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button to={primaryTo} variant="inverse" size="md">
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {secondaryLabel && (
                <Button to={secondaryTo} variant="outline-inverse" size="md">
                  {secondaryLabel}
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
