import { useState } from 'react'
import type { FormEvent } from 'react'
import { Mail, Phone, MapPin, CheckCircle2, ArrowRight, ArrowDown } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { BRAND, TEAM_SIZE_OPTIONS, INTEREST_OPTIONS } from '../data/site'

interface FormState {
  name: string
  company: string
  email: string
  phone: string
  teamSize: string
  interest: string
  message: string
}

const EMPTY: FormState = {
  name: '',
  company: '',
  email: '',
  phone: '',
  teamSize: '',
  interest: INTEREST_OPTIONS[0],
  message: '',
}

const inputBase =
  'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder-slate-400 outline-none transition-colors focus:border-navy-700 focus:ring-1 focus:ring-navy-700'
const labelBase = 'mb-1.5 block text-sm font-semibold text-slate-500'

export default function Contact() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitted, setSubmitted] = useState(false)

  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Please enter your name'
    if (!form.company.trim()) next.company = 'Please enter your company'
    if (!form.email.trim()) next.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!form.phone.trim()) next.phone = 'Please enter your phone number'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validate()) setSubmitted(true)
  }

  return (
    <>
      <PageHero
        title={
          <>
            <span className="block">Let’s Get Your Crew</span>
            <span className="mt-3 block sm:mt-4">Running on HVACtor</span>
          </>
        }
        description="Book a demo, start a trial, or ask us anything. A real person on our team will get back to you within one business day."
      >
        <Button href="#contact-form" variant="inverse" size="lg">
          Jump to Contact Form
          <ArrowDown className="h-4 w-4" />
        </Button>
      </PageHero>

      <section id="contact-form" className="scroll-mt-24 bg-slate-50">
        <Container className="grid gap-6 py-16 lg:grid-cols-[1.3fr_1fr] lg:gap-8 lg:py-24">
          {/* Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-block-sm lg:p-12">
            {submitted ? (
              <div className="flex h-full flex-col items-start justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-white">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
                  Thanks, {form.name.split(' ')[0] || 'there'}!
                </h2>
                <p className="mt-3 max-w-md text-slate-600">
                  We’ve received your message and someone from our team will reach
                  out to <span className="font-medium text-ink">{form.email}</span>{' '}
                  within one business day.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForm(EMPTY)
                    setSubmitted(false)
                  }}
                  className="mt-8 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy-800 underline underline-offset-4"
                >
                  Send another message <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                  Tell us about your business
                </h2>

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <Field label="Full name" required error={errors.name}>
                    <input
                      className={inputBase}
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Jordan Rivera"
                    />
                  </Field>
                  <Field label="Company" required error={errors.company}>
                    <input
                      className={inputBase}
                      value={form.company}
                      onChange={(e) => update('company', e.target.value)}
                      placeholder="Rivera Heating & Air"
                    />
                  </Field>
                  <Field label="Work email" required error={errors.email}>
                    <input
                      type="email"
                      className={inputBase}
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="jordan@company.com"
                    />
                  </Field>
                  <Field label="Phone" required error={errors.phone}>
                    <input
                      type="tel"
                      className={inputBase}
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="(555) 000-0000"
                    />
                  </Field>
                  <Field label="Team size">
                    <select
                      className={inputBase}
                      value={form.teamSize}
                      onChange={(e) => update('teamSize', e.target.value)}
                    >
                      <option value="">Select…</option>
                      {TEAM_SIZE_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="I'm interested in" required>
                    <select
                      className={inputBase}
                      value={form.interest}
                      onChange={(e) => update('interest', e.target.value)}
                    >
                      {INTEREST_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-6">
                  <Field label="How can we help? (optional)" error={errors.message}>
                    <textarea
                      className={`${inputBase} resize-none`}
                      rows={4}
                      value={form.message}
                      onChange={(e) => update('message', e.target.value)}
                      placeholder="We run 8 trucks and want to move off spreadsheets…"
                    />
                  </Field>
                </div>

                <div className="mt-8">
                  <Button type="submit" variant="primary" size="lg">
                    Send message
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <aside className="relative self-start overflow-hidden rounded-2xl bg-navy-900 p-8 text-white lg:sticky lg:top-28 lg:p-10">
            <h3 className="relative font-display text-2xl font-bold tracking-tight">
              Other Ways to Reach To us
            </h3>

            <div className="relative mt-7 space-y-5 text-lg">
              <ContactRow icon={Mail} label="Email">
                <a href={`mailto:${BRAND.email}`} className="hover:underline">
                  {BRAND.email}
                </a>
              </ContactRow>
              <ContactRow icon={Phone} label="Phone">
                <a href={`tel:${BRAND.phone}`} className="hover:underline">
                  {BRAND.phone}
                </a>
              </ContactRow>
              <ContactRow icon={MapPin} label="Headquarters">
                {BRAND.address}
              </ContactRow>
            </div>
          </aside>
        </Container>
      </section>
    </>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className={labelBase}>
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/15 bg-white/5">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-sm font-semibold text-white/40">{label}</div>
        <div className="mt-1 text-base text-white/85">{children}</div>
      </div>
    </div>
  )
}
