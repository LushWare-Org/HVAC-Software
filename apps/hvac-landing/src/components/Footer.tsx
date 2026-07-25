import { Link } from 'react-router-dom'
import Container from './ui/Container'
import { BRAND } from '../data/site'

const PRODUCT_LINKS = [
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
]

const COMPANY_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function Footer() {
  return (
    <footer className="relative bg-navy-900 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <Container className="relative py-10">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Link
              to="/"
              className="group flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5">
                <img src="/platform/logo.jpg" alt="HVACtor logo" className="h-full w-full object-cover" />
              </span>
              {BRAND.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              The field service management platform built for HVAC, plumbing and
              electrical contractors who run on the road.
            </p>
            {/* <div className="mt-4 space-y-1.5 text-sm text-white/60">
              <a
                href={`mailto:${BRAND.email}`}
                className="flex items-center gap-2 transition-colors duration-300 hover:text-white"
              >
                <Mail className="h-3.5 w-3.5 flex-none" />
                {BRAND.email}
              </a>
              <a
                href={`tel:${BRAND.phone}`}
                className="flex items-center gap-2 transition-colors duration-300 hover:text-white"
              >
                <Phone className="h-3.5 w-3.5 flex-none" />
                {BRAND.phone}
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 flex-none" />
                {BRAND.address}
              </p>
            </div> */}
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.name}, Inc. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; to: string }[]
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((link, i) => (
          <li key={`${link.label}-${i}`}>
            <Link
              to={link.to}
              className="inline-block text-sm text-white/70 transition-all duration-300 hover:translate-x-0.5 hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
