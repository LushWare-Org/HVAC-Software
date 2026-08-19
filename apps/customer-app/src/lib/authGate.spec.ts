import { assertCustomer, STAFF_LOGIN_MESSAGE } from './authGate'
import type { CustomerUser } from '@/types/api'

function user(patch: Partial<CustomerUser> = {}): CustomerUser {
  return {
    id: 'u-1',
    name: 'Grace Morgan',
    email: 'grace@example.com',
    role: 'customer',
    companyId: 'co-demo-001',
    customerId: 'demo-customer-017',
    ...patch,
  }
}

describe('assertCustomer', () => {
  it('accepts a customer with a customerId', () => {
    expect(assertCustomer(user())).toEqual({ ok: true })
  })

  it('rejects a technician with the staff message', () => {
    expect(assertCustomer(user({ role: 'technician', customerId: undefined })))
      .toEqual({ ok: false, message: STAFF_LOGIN_MESSAGE })
  })

  it('rejects a company_admin', () => {
    expect(assertCustomer(user({ role: 'company_admin', customerId: undefined })).ok).toBe(false)
  })

  it('rejects a customer role that somehow has no customerId', () => {
    // Without customerId every customer-scoped query returns nothing, so this
    // would be an empty app with no explanation — reject it as staff would be.
    expect(assertCustomer(user({ customerId: undefined })).ok).toBe(false)
  })

  it('uses the exact approved copy', () => {
    expect(STAFF_LOGIN_MESSAGE).toBe(
      'This app is for customers. Staff should use the HVACtor.ai Field app.',
    )
  })
})
