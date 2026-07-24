import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import Container from './Container'
import Button from './Button'

interface CtaBannerProps {
  heading?: string
  subheading?: string
}

export default function CtaBanner({
  heading = 'Ready to dispatch?',
  subheading = 'Start a 14-day free trial. No credit card, no contract — just your crew, organized.',
}: CtaBannerProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <section className="bg-white">
      <Container className="py-20 lg:py-28">
        <div className="relative overflow-hidden rounded-3xl bg-navy-950 px-8 py-16 text-white shadow-block-lg sm:px-14 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-navy-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-navy-400/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-30" />

          <div className="relative max-w-3xl">
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {heading}
            </h2>
            <p className="mt-5 max-w-xl text-lg text-white/70">{subheading}</p>

            {submitted ? (
              <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-5 py-4">
                <Check className="h-5 w-5 text-white" />
                <span className="text-sm font-medium text-white/90">
                  Thanks — we’ll be in touch at {email} shortly.
                </span>
              </div>
            ) : (
              <form
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (email) setSubmitted(true)
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-base text-white placeholder-white/40 outline-none transition-colors focus:border-white/50 focus:bg-white/10 sm:max-w-sm"
                />
                <Button variant="inverse" size="lg" type="submit">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
