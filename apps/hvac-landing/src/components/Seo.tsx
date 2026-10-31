import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://hvactor.ai'
const SITE_NAME = 'HVACtor.ai'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

/** Per-route title, description, canonical and Open Graph tags for the SPA. */
export default function Seo({ title, description }: { title: string; description: string }) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    const url = `${SITE_URL}${pathname === '/' ? '' : pathname}`
    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setCanonical(url)
  }, [title, description, pathname])

  return null
}
