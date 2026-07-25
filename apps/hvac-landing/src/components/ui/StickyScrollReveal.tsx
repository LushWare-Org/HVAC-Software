import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

export interface StickyScrollItem {
  index?: string
  title: string
  description: string
  bullets?: string[]
  content: ReactNode
}

interface StickyScrollRevealProps {
  items: StickyScrollItem[]
}

export default function StickyScrollReveal({ items }: StickyScrollRevealProps) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const idx = refs.current.findIndex((el) => el === entry.target)
          if (idx !== -1) setActive(idx)
        })
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 },
    )
    refs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [items.length])

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
      <div className="flex flex-col gap-16 lg:gap-40">
        {items.map((item, i) => (
          <div
            key={item.title}
            ref={(el) => {
              refs.current[i] = el
            }}
          >
            {item.index && (
              <span
                className={clsx(
                  'font-display text-sm font-bold tabular-nums transition-colors duration-300',
                  active === i ? 'text-navy-500' : 'text-slate-300',
                )}
              >
                {item.index}
              </span>
            )}
            <h3
              className={clsx(
                'font-display text-2xl font-bold tracking-tight transition-colors duration-300 sm:text-3xl',
                item.index && 'mt-2',
                active === i ? 'text-ink' : 'text-slate-300',
              )}
            >
              {item.title}
            </h3>
            <p
              className={clsx(
                'mt-4 text-lg leading-relaxed transition-colors duration-300',
                active === i ? 'text-slate-600' : 'text-slate-300',
              )}
            >
              {item.description}
            </p>
            {item.bullets && (
              <ul className="mt-6 flex flex-col gap-4">
                {item.bullets.map((b) => (
                  <li
                    key={b}
                    className={clsx(
                      'flex items-start gap-3 transition-colors duration-300',
                      active === i ? 'text-slate-600' : 'text-slate-300',
                    )}
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-500" />
                    <span className="text-[15px] leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="relative mt-6 lg:hidden">{item.content}</div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-28 grid">
          {items.map((item, i) => (
            <div
              key={item.title}
              className={clsx(
                'col-start-1 row-start-1 transition-opacity duration-700',
                active === i ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
