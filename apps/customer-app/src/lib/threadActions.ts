import type { MessageThread } from '@/types/api'

/**
 * Determine what the customer should see as the conversation name.
 * Customer always sees the OTHER party, never their own name.
 *
 * - "Chat with Technician: X" → strip the prefix and show just the tech's name
 * - Any other thread (null/other subject) → "Admin" — every admin↔customer
 *   thread has no subject, so this is the only other case that occurs.
 */
export function getThreadTitle(thread: Pick<MessageThread, 'subject'>): string {
  const subject = thread.subject ?? ''
  if (subject.startsWith('Chat with Technician:')) {
    const techName = subject.replace('Chat with Technician:', '').trim()
    return techName || 'Technician'
  }
  return 'Admin'
}

export function isTechThread(thread: Pick<MessageThread, 'subject'>): boolean {
  return (thread.subject ?? '').startsWith('Chat with Technician:')
}

export function getInitials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Newest activity first. */
export function sortThreads(threads: MessageThread[]): MessageThread[] {
  return [...threads].sort((a, b) => {
    const ta = new Date(a.lastMessageAt ?? a.updatedAt).getTime()
    const tb = new Date(b.lastMessageAt ?? b.updatedAt).getTime()
    return tb - ta
  })
}
