
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.QuoteScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  quoteNumber: 'quoteNumber',
  jobId: 'jobId',
  customerId: 'customerId',
  customerName: 'customerName',
  customerEmail: 'customerEmail',
  title: 'title',
  description: 'description',
  status: 'status',
  validUntil: 'validUntil',
  subtotal: 'subtotal',
  discountType: 'discountType',
  discountValue: 'discountValue',
  discountAmount: 'discountAmount',
  taxRate: 'taxRate',
  taxAmount: 'taxAmount',
  total: 'total',
  notes: 'notes',
  terms: 'terms',
  pdfUrl: 'pdfUrl',
  approvalToken: 'approvalToken',
  approvedAt: 'approvedAt',
  approvedByName: 'approvedByName',
  approvedByEmail: 'approvedByEmail',
  sentAt: 'sentAt',
  viewedAt: 'viewedAt',
  createdByUserId: 'createdByUserId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuoteLineItemScalarFieldEnum = {
  id: 'id',
  quoteId: 'quoteId',
  description: 'description',
  category: 'category',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  lineTotal: 'lineTotal',
  taxable: 'taxable',
  sortOrder: 'sortOrder'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  invoiceNumber: 'invoiceNumber',
  quoteId: 'quoteId',
  jobId: 'jobId',
  workOrderId: 'workOrderId',
  customerId: 'customerId',
  customerName: 'customerName',
  customerEmail: 'customerEmail',
  status: 'status',
  dueDate: 'dueDate',
  dueDays: 'dueDays',
  subtotal: 'subtotal',
  discountAmount: 'discountAmount',
  taxRate: 'taxRate',
  taxAmount: 'taxAmount',
  total: 'total',
  amountPaid: 'amountPaid',
  balanceDue: 'balanceDue',
  notes: 'notes',
  terms: 'terms',
  pdfUrl: 'pdfUrl',
  stripePaymentIntentId: 'stripePaymentIntentId',
  stripePaymentUrl: 'stripePaymentUrl',
  sentAt: 'sentAt',
  paidAt: 'paidAt',
  voidedAt: 'voidedAt',
  createdByUserId: 'createdByUserId',
  recurringScheduleId: 'recurringScheduleId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceLineItemScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  description: 'description',
  category: 'category',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  lineTotal: 'lineTotal',
  taxable: 'taxable',
  sortOrder: 'sortOrder'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  invoiceId: 'invoiceId',
  amount: 'amount',
  paymentMethod: 'paymentMethod',
  status: 'status',
  stripePaymentIntentId: 'stripePaymentIntentId',
  stripeChargeId: 'stripeChargeId',
  paidAt: 'paidAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecurringScheduleScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  customerName: 'customerName',
  customerEmail: 'customerEmail',
  description: 'description',
  frequency: 'frequency',
  amount: 'amount',
  taxRate: 'taxRate',
  nextBillingDate: 'nextBillingDate',
  isActive: 'isActive',
  jobId: 'jobId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  jobId: 'jobId',
  technicianId: 'technicianId',
  category: 'category',
  description: 'description',
  amount: 'amount',
  vendor: 'vendor',
  receiptUrl: 'receiptUrl',
  expenseDate: 'expenseDate',
  isReimbursable: 'isReimbursable',
  createdByUserId: 'createdByUserId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.QuoteStatus = exports.$Enums.QuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED'
};

exports.DiscountType = exports.$Enums.DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED'
};

exports.LineItemCategory = exports.$Enums.LineItemCategory = {
  LABOUR: 'LABOUR',
  PARTS: 'PARTS',
  MATERIALS: 'MATERIALS',
  EQUIPMENT_RENTAL: 'EQUIPMENT_RENTAL',
  TRAVEL: 'TRAVEL',
  OTHER: 'OTHER'
};

exports.InvoiceStatus = exports.$Enums.InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  VOID: 'VOID'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CARD: 'CARD',
  ACH: 'ACH',
  CASH: 'CASH',
  CHECK: 'CHECK',
  OTHER: 'OTHER'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

exports.RecurringFrequency = exports.$Enums.RecurringFrequency = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUALLY: 'ANNUALLY'
};

exports.ExpenseCategory = exports.$Enums.ExpenseCategory = {
  PARTS: 'PARTS',
  FUEL: 'FUEL',
  TOOLS: 'TOOLS',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  OTHER: 'OTHER'
};

exports.Prisma.ModelName = {
  Quote: 'Quote',
  QuoteLineItem: 'QuoteLineItem',
  Invoice: 'Invoice',
  InvoiceLineItem: 'InvoiceLineItem',
  Payment: 'Payment',
  RecurringSchedule: 'RecurringSchedule',
  Expense: 'Expense'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
