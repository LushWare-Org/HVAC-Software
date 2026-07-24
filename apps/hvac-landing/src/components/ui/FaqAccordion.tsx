import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import clsx from 'clsx'
import type { Faq } from '../../data/site'

interface FaqAccordionProps {
  items: Faq[]
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="border-t border-slate-200">
      {items.map((item, i) => {
        const isOpen = hovered === i
        return (
          <div
            key={item.question}
            className="border-b border-slate-200"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
          >
            <button
              type="button"
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered((h) => (h === i ? null : h))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
            >
              <span className="font-display text-lg font-semibold text-ink sm:text-xl">
                {item.question}
              </span>
              <span
                className={clsx(
                  'flex h-9 w-9 flex-none items-center justify-center rounded-full border transition-colors duration-300',
                  isOpen ? 'border-navy-700 bg-navy-700 text-white' : 'border-navy-200 text-ink',
                )}
              >
                {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
            </button>
            <div
              className={clsx(
                'grid transition-all duration-300 ease-out',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <p className="max-w-3xl overflow-hidden pb-7 pr-12 text-base leading-relaxed text-slate-600">
                {item.answer}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
