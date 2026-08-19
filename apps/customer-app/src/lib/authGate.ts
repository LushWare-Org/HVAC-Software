import type { CustomerUser } from '@/types/api'

/**
 * POST /crm/auth/login authenticates EVERY role — it is the same endpoint the
 * admin dashboard and technician app use. Without this gate a staff login
 * succeeds and lands in a customer UI with no customerId, so every screen
 * renders empty with no explanation. Reject at the door instead.
 */
export const STAFF_LOGIN_MESSAGE =
  'This app is for customers. Staff should use the HVACtor.ai Field app.'

export function assertCustomer(
  user: CustomerUser,
): { ok: true } | { ok: false; message: string } {
  const isCustomer = user?.role === 'customer' && Boolean(user?.customerId)
  return isCustomer ? { ok: true } : { ok: false, message: STAFF_LOGIN_MESSAGE }
}
