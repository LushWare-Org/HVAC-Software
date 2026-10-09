import type { AnnouncementInput } from '../../hooks/useAnnouncements'

/** Ready-made announcements to start from. Everything stays editable. */
export const TELEGRAM_ANNOUNCEMENT = (): AnnouncementInput & { title: string } => ({
  title: 'We are on Telegram now',
  body: 'Get our replies on Telegram and message us from there. One tap to connect, and you can stop any time.',
  icon: 'telegram', ctaAction: 'telegram', linkLabel: 'Connect Telegram', accentColor: '#229ED9',
  style: 'spotlight', dismissible: true, pinned: true, isActive: true,
})

export const ANNOUNCEMENT_TEMPLATES: Array<{ id: string; label: string; make: () => AnnouncementInput & { title: string } }> = [
  { id: 'telegram', label: 'Telegram is here', make: TELEGRAM_ANNOUNCEMENT },
  {
    id: 'tune-up', label: 'Seasonal tune-up',
    make: () => ({ title: 'Book your seasonal tune-up', body: 'A quick service now keeps your system efficient and avoids breakdowns in the busy season.', icon: 'wrench', ctaAction: 'link', linkLabel: 'Book now', accentColor: '#0E9F6E', style: 'card', dismissible: true, pinned: false, isActive: true }),
  },
  {
    id: 'hours', label: 'Holiday hours',
    make: () => ({ title: 'Holiday opening hours', body: 'We are closed on public holidays. Emergency call-outs are still available.', icon: 'calendar', ctaAction: 'none', accentColor: '#D97706', style: 'card', dismissible: true, pinned: true, isActive: true }),
  },
  {
    id: 'offer', label: 'Special offer',
    make: () => ({ title: '10% off filter replacements this month', body: 'Mention this offer when you book.', icon: 'gift', ctaAction: 'link', linkLabel: 'See the offer', accentColor: '#DB2777', style: 'spotlight', dismissible: true, pinned: false, isActive: true }),
  },
]
