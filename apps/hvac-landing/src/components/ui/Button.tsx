import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

type Variant = 'primary' | 'gradient' | 'outline' | 'outline-inverse' | 'inverse' | 'ghost'
type Size = 'md' | 'lg'

const base =
  'group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-md font-display font-semibold tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

const variants: Record<Variant, string> = {
  primary: 'bg-navy-950 text-white shadow-glow hover:bg-navy-900 hover:-translate-y-0.5',
  gradient:
    'bg-gradient-to-r from-navy-700 to-navy-900 text-white shadow-lg shadow-navy-900/20 hover:from-navy-800 hover:to-navy-950 hover:shadow-xl hover:shadow-navy-800/30 hover:-translate-y-0.5',
  inverse: 'bg-white text-navy-950 hover:bg-navy-50 hover:-translate-y-0.5',
  outline:
    'border border-navy-200 bg-white text-ink hover:border-navy-950 hover:bg-navy-50',
  'outline-inverse':
    'border border-white/25 bg-white/5 text-white hover:border-white/45 hover:bg-white/10',
  ghost: 'text-ink hover:text-navy-600',
}

function Sweep() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[sweep_0.9s_ease-out]"
    />
  )
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof CommonProps> & { to?: undefined }
type ButtonAsLink = CommonProps & { to: string; href?: undefined }
type ButtonAsAnchor = CommonProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof CommonProps> & { href: string; to?: undefined }

type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor

export default function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className, children } = props
  const classes = clsx(base, sizes[size], variants[variant], className)
  const showSweep = variant === 'primary' || variant === 'gradient' || variant === 'inverse'
  const content = (
    <>
      {showSweep && <Sweep />}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  )

  if ('to' in props && props.to !== undefined) {
    return (
      <Link to={props.to} className={classes}>
        {content}
      </Link>
    )
  }

  if ('href' in props && props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props
    return (
      <a className={classes} {...rest}>
        {content}
      </a>
    )
  }

  const { variant: _v, size: _s, className: _c, children: _ch, to: _to, ...rest } =
    props as ButtonAsButton
  return (
    <button className={classes} {...rest}>
      {content}
    </button>
  )
}
