/**
 * useCustomerPortal — barrel module for the customer-portal hook surface.
 *
 * The original 811-line file was split per-page in Session 15 (2026-05-08).
 * Existing imports like
 *   `import { useMyJobs } from '../hooks/useCustomerPortal'`
 * continue to work because every export is re-exported from here.
 *
 * New code: prefer importing from the per-page module directly
 *   `import { useMyJobs } from '../hooks/useMyJobs'`
 * — bundlers tree-shake those imports more reliably than a barrel.
 */

// Profile + user account + equipment + reviews + password
export {
  useCustomerProfile, useUpdateCustomerProfile,
  useMyUserProfile, useUpdateUserProfile,
  useMyEquipment, useSaveMyEquipment,
  useMyReviews, useJobReview, useCompanyReviewStats, useSubmitReview,
  useChangePassword,
} from './useMyProfile'

// Jobs + bookings + service requests
export {
  useMyJobs, useMyJob, useJobAssignments, useTechnician, useJobTechnicianNames,
  useCancelJob, useBookService, useSubmitJobRequest,
} from './useMyJobs'

// Invoices + quotes + payments
export {
  useMyInvoices, useMyQuotes, useJobInvoices, useJobQuotes,
  useMyInvoice, useMyQuote, useCreatePaymentIntent,
  useAcceptMyQuote, useDeclineMyQuote,
  useApproveMyInvoice, useDeclineMyInvoice,
} from './useMyFinance'

// In-app messaging + notifications
export {
  useMyThreads, useUnreadMyThreadsCount, useMyThread,
  useSendMyThreadMessage, useMarkMyThreadRead,
  useMyNotifications, useMarkMyNotificationRead, useMarkAllMyNotificationsRead,
  useCreateMyThread, useDeleteMyThread,
} from './useMyMessages'

// Dashboard aggregations
export { useCustomerDashboard } from './useCustomerDashboard'
