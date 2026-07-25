import { useEffect, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'left' | 'right'
  once?: boolean
}

const HIDDEN_TRANSFORM: Record<NonNullable<RevealProps['direction']>, string> = {
  up: 'translate-y-6',
  left: '-translate-x-8',
  right: 'translate-x-8',
}

export default function Reveal({
  children,
  className,
  delay = 0,
  duration = 700,
  direction = 'up',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [once])

  return (
    <div
      ref={ref}
      className={clsx(
        'transition-all ease-out',
        visible ? 'translate-x-0 translate-y-0 opacity-100' : clsx(HIDDEN_TRANSFORM[direction], 'opacity-0'),
        className,
      )}
      style={{
        transitionDelay: visible ? `${delay}ms` : '0ms',
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}
