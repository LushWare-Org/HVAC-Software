export interface CustomerUser {
  id: string
  name: string
  email: string
  role: string
  companyId: string
  /** Present for portal customers; absent for staff roles. */
  customerId?: string
  mustResetPassword?: boolean
}

export interface LoginResponse {
  access_token: string
  user: CustomerUser
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages?: number
}

export interface Job {
  id: string
  jobNumber?: string
  title: string
  status: string
  scheduledStart?: string | null
  customerId?: string
  currency?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  total: string | number
  amountPaid?: string | number
  dueDate?: string
  customerId?: string
  currency?: string
}

export interface Quote {
  id: string
  quoteNumber: string
  title?: string
  status: string
  total: string | number
  customerId?: string
  currency?: string
}
