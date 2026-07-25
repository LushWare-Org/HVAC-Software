import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Container from '../ui/Container'
import SectionLabel from '../ui/SectionLabel'
import Reveal from '../ui/Reveal'

const HIGHLIGHTS = [
  'Full Offline Mode With Automatic Sync',
  'Guided Checklists & Photo Documentation',
  'One-Tap Access To Equipment Service History',
]

const APP_SCREENS = [
  '/platform/4m.png',
  '/platform/5m.png',
  '/platform/6m.png',
  '/platform/7m.png',
  '/platform/8m.png',
]

function MobileAppShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % APP_SCREENS.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative mx-auto w-[310px] sm:w-[300px]">
      <div className="absolute inset-x-0 top-1/2 -z-10 h-[22rem] -translate-y-1/2 scale-110 rounded-[3rem] bg-navy-400/25 blur-3xl" />

      <div className="relative aspect-[853/1844] overflow-hidden rounded-[1.75rem] shadow-2xl shadow-black/40">
        {APP_SCREENS.map((src, index) => (
          <img
            key={src}
            src={src}
            alt="HVACtor technician app screen"
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-1000 ease-in-out"
            style={{ opacity: index === activeIndex ? 1 : 0 }}
          />
        ))}
      </div>
    </div>
  )
}

export default function MobileAppSection() {
  return (
    <section
      id="mobile-app"
      className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900"
    >
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_30%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-blueprint-dark opacity-90 [mask-image:radial-gradient(ellipse_90%_75%_at_70%_100%,black,transparent)]" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-navy-500/25 blur-3xl" />

      <Container className="relative grid gap-10 py-10 lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-12">
        <Reveal className="max-w-xl">
          <SectionLabel index="04" tone="light">
            Built for the field
          </SectionLabel>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            The Whole Platform, Now in Your Technician&rsquo;s Pocket
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            A dedicated mobile app puts job details, checklists, and payment
            capture in every technician&rsquo;s hand - online or off. No more
            calling the office to find an address or check a part number.
          </p>

          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-white/80">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="text-[15px] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal direction="right" delay={150} duration={900} once={false} className="relative">
          <MobileAppShowcase />
        </Reveal>
      </Container>
    </section>
  )
}
