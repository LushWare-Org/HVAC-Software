import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { BRAND } from '../data/site'

const WHATSAPP_NUMBER = BRAND.phone.replace(/[^\d]/g, '')
const WHATSAPP_MESSAGE = encodeURIComponent(
  `Hi ${BRAND.name}, I'd like to know more about your platform.`
)

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path d="M12.01 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38a9.96 9.96 0 0 0 4.76 1.21h.01c5.52 0 10-4.48 10-10s-4.48-10-10.01-10Zm0 18.15h-.01a8.15 8.15 0 0 1-4.15-1.14l-.3-.18-3.11.82.83-3.03-.2-.31a8.15 8.15 0 0 1-1.26-4.33c0-4.51 3.67-8.18 8.19-8.18 2.19 0 4.24.85 5.79 2.4a8.14 8.14 0 0 1 2.4 5.79c0 4.51-3.67 8.16-8.18 8.16Zm4.48-6.13c-.24-.12-1.44-.71-1.67-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01a.9.9 0 0 0-.65.3c-.22.24-.85.83-.85 2.03s.87 2.36.99 2.52c.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  )
}

export default function FloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-4">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-blue-900 mr-2 text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 ${
          showScrollTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#20bd5a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        <WhatsAppIcon />
      </a>
    </div>
  )
}
