
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

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  jobId: 'jobId',
  invoiceId: 'invoiceId',
  quoteId: 'quoteId',
  recipientId: 'recipientId',
  recipientName: 'recipientName',
  recipientEmail: 'recipientEmail',
  recipientPhone: 'recipientPhone',
  recipientPushToken: 'recipientPushToken',
  channel: 'channel',
  subject: 'subject',
  body: 'body',
  status: 'status',
  externalId: 'externalId',
  providerResponse: 'providerResponse',
  error: 'error',
  scheduledAt: 'scheduledAt',
  sentAt: 'sentAt',
  deliveredAt: 'deliveredAt',
  failedAt: 'failedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MessageThreadScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  customerEmail: 'customerEmail',
  jobId: 'jobId',
  status: 'status',
  unreadCount: 'unreadCount',
  lastMessageAt: 'lastMessageAt',
  lastMessageBody: 'lastMessageBody',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationTemplateScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  type: 'type',
  channel: 'channel',
  subject: 'subject',
  body: 'body',
  variables: 'variables',
  isActive: 'isActive',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AutomationRuleScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  isActive: 'isActive',
  trigger: 'trigger',
  conditions: 'conditions',
  actions: 'actions',
  delayMinutes: 'delayMinutes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DeliveryLogScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  notificationId: 'notificationId',
  channel: 'channel',
  recipient: 'recipient',
  status: 'status',
  provider: 'provider',
  externalId: 'externalId',
  requestPayload: 'requestPayload',
  responsePayload: 'responsePayload',
  durationMs: 'durationMs',
  error: 'error',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};
exports.Channel = exports.$Enums.Channel = {
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP'
};

exports.DeliveryStatus = exports.$Enums.DeliveryStatus = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  BOUNCED: 'BOUNCED',
  UNSUBSCRIBED: 'UNSUBSCRIBED'
};

exports.ThreadStatus = exports.$Enums.ThreadStatus = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  SPAM: 'SPAM'
};

exports.TemplateType = exports.$Enums.TemplateType = {
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  JOB_STATUS_UPDATE: 'JOB_STATUS_UPDATE',
  INVOICE_SENT: 'INVOICE_SENT',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  REVIEW_REQUEST: 'REVIEW_REQUEST',
  WELCOME: 'WELCOME',
  CUSTOM: 'CUSTOM'
};

exports.AutomationTrigger = exports.$Enums.AutomationTrigger = {
  JOB_STATUS_CHANGED: 'JOB_STATUS_CHANGED',
  INVOICE_SENT: 'INVOICE_SENT',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  QUOTE_APPROVED: 'QUOTE_APPROVED',
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  MANUAL: 'MANUAL'
};

exports.MessageDirection = exports.$Enums.MessageDirection = {
  OUTBOUND: 'OUTBOUND',
  INBOUND: 'INBOUND'
};

exports.Prisma.ModelName = {
  Notification: 'Notification',
  MessageThread: 'MessageThread',
  NotificationTemplate: 'NotificationTemplate',
  AutomationRule: 'AutomationRule',
  DeliveryLog: 'DeliveryLog'
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
