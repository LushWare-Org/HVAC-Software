
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/library.js')


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

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

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




  const path = require('path')

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
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "/Users/ravishan/Desktop/Lush/T&SBCRM/apps/comms-service/src/prisma/generated",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "darwin-arm64",
        "native": true
      }
    ],
    "previewFeatures": [],
    "sourceFilePath": "/Users/ravishan/Desktop/Lush/T&SBCRM/apps/comms-service/prisma/schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../../../prisma",
  "clientVersion": "5.22.0",
  "engineVersion": "605197351a3c8bdd595af2d2a9bc3025bca48ea2",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "mongodb",
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "MONGODB_URI",
        "value": null
      }
    }
  },
  "inlineSchema": "// ============================================================\n// Comms Service — Prisma Schema\n// Database: MongoDB (message threads, delivery logs)\n// Why MongoDB: Message threads are nested documents (messages inside threads).\n//              Variable metadata per notification type. High write volume for delivery logs.\n//              Document model avoids complex join tables for thread participants.\n// ============================================================\n\ngenerator client {\n  provider = \"prisma-client-js\"\n  output   = \"../src/prisma/generated\"\n}\n\ndatasource db {\n  provider = \"mongodb\"\n  url      = env(\"MONGODB_URI\")\n}\n\n// ── Enums ─────────────────────────────────────────────────────────────────\n\nenum Channel {\n  SMS\n  EMAIL\n  PUSH\n  IN_APP\n}\n\nenum DeliveryStatus {\n  QUEUED\n  SENT\n  DELIVERED\n  FAILED\n  BOUNCED\n  UNSUBSCRIBED\n}\n\nenum ThreadStatus {\n  ACTIVE\n  RESOLVED\n  SPAM\n}\n\nenum MessageDirection {\n  OUTBOUND // company → customer\n  INBOUND // customer → company (Twilio webhook)\n}\n\nenum TemplateType {\n  APPOINTMENT_REMINDER\n  JOB_STATUS_UPDATE\n  INVOICE_SENT\n  PAYMENT_RECEIVED\n  REVIEW_REQUEST\n  WELCOME\n  CUSTOM\n}\n\nenum AutomationTrigger {\n  JOB_STATUS_CHANGED\n  INVOICE_SENT\n  PAYMENT_RECEIVED\n  QUOTE_APPROVED\n  APPOINTMENT_BOOKED\n  MANUAL\n}\n\n// ── Notification — one notification delivery attempt per channel per event ─\n\nmodel Notification {\n  id                 String         @id @default(auto()) @map(\"_id\") @db.ObjectId\n  companyId          String\n  // Context references (foreign keys to other services — not enforced by Mongo)\n  customerId         String?\n  jobId              String?\n  invoiceId          String?\n  quoteId            String?\n  // Recipient\n  recipientId        String // Auth0 user sub OR external contact ID\n  recipientName      String?\n  recipientEmail     String?\n  recipientPhone     String?\n  recipientPushToken String?\n  // Delivery\n  channel            Channel\n  subject            String? // email only\n  body               String\n  status             DeliveryStatus @default(QUEUED)\n  // Provider tracking\n  externalId         String? // Twilio SID / SendGrid message-id / FCM message-id\n  providerResponse   String? // raw provider response JSON\n  error              String?\n  // Timestamps\n  scheduledAt        DateTime?\n  sentAt             DateTime?\n  deliveredAt        DateTime?\n  failedAt           DateTime?\n  createdAt          DateTime       @default(now())\n  updatedAt          DateTime       @updatedAt\n\n  @@index([companyId, status])\n  @@index([companyId, customerId])\n  @@index([companyId, jobId])\n  @@index([scheduledAt])\n}\n\n// ── MessageThread — two-way conversation between company staff and a customer ─\n\nmodel MessageThread {\n  id              String       @id @default(auto()) @map(\"_id\") @db.ObjectId\n  companyId       String\n  customerId      String\n  customerName    String\n  customerPhone   String?\n  customerEmail   String?\n  // Job context (optional)\n  jobId           String?\n  // Thread state\n  status          ThreadStatus @default(ACTIVE)\n  unreadCount     Int          @default(0) // unread by staff\n  lastMessageAt   DateTime?\n  lastMessageBody String?\n  // Messages embedded as array (MongoDB document model)\n  messages        Message[]\n  createdAt       DateTime     @default(now())\n  updatedAt       DateTime     @updatedAt\n\n  @@index([companyId, customerId])\n  @@index([companyId, status])\n  @@index([lastMessageAt])\n}\n\n// ── Message — embedded in MessageThread ───────────────────────────────────\n\ntype Message {\n  id          String // UUID generated in app\n  senderId    String // Auth0 sub (staff) OR customerId for inbound\n  senderName  String\n  direction   MessageDirection\n  body        String\n  channel     Channel\n  mediaUrls   String[] // MMS / email attachments\n  // Provider info\n  twilioSid   String?\n  sentAt      DateTime?\n  deliveredAt DateTime?\n  readAt      DateTime?\n  createdAt   DateTime\n}\n\n// ── NotificationTemplate — reusable templates per company ────────────────\n\nmodel NotificationTemplate {\n  id        String       @id @default(auto()) @map(\"_id\") @db.ObjectId\n  companyId String\n  name      String\n  type      TemplateType\n  channel   Channel\n  // Content (Handlebars syntax — {{customerName}}, {{jobAddress}}, etc.)\n  subject   String? // email only\n  body      String\n  // Variables declared for validation\n  variables String[]     @default([])\n  isActive  Boolean      @default(true)\n  isDefault Boolean      @default(false) // system default vs custom\n  createdAt DateTime     @default(now())\n  updatedAt DateTime     @updatedAt\n\n  @@index([companyId, type])\n  @@index([companyId, channel])\n}\n\n// ── AutomationRule — defines when notifications are triggered automatically ─\n\nmodel AutomationRule {\n  id           String            @id @default(auto()) @map(\"_id\") @db.ObjectId\n  companyId    String\n  name         String\n  isActive     Boolean           @default(true)\n  trigger      AutomationTrigger\n  // Condition JSON: e.g. {\"jobStatus\": \"COMPLETED\"} or {\"invoiceStatus\": \"SENT\"}\n  conditions   String // JSON string\n  // Actions JSON array: [{channel: \"SMS\", templateId: \"...\"}, {channel: \"EMAIL\", ...}]\n  actions      String // JSON string\n  // Delay config: send X minutes/hours before/after trigger\n  delayMinutes Int               @default(0)\n  createdAt    DateTime          @default(now())\n  updatedAt    DateTime          @updatedAt\n\n  @@index([companyId, trigger])\n  @@index([companyId, isActive])\n}\n\n// ── DeliveryLog — immutable audit log of every send attempt ──────────────\n\nmodel DeliveryLog {\n  id              String         @id @default(auto()) @map(\"_id\") @db.ObjectId\n  companyId       String\n  notificationId  String?\n  channel         Channel\n  recipient       String // phone or email or push token\n  status          DeliveryStatus\n  provider        String // \"twilio\" | \"sendgrid\" | \"fcm\"\n  externalId      String?\n  requestPayload  String? // JSON (redacted PII)\n  responsePayload String? // JSON\n  durationMs      Int?\n  error           String?\n  createdAt       DateTime       @default(now())\n\n  @@index([companyId, channel])\n  @@index([companyId, status])\n  @@index([createdAt])\n}\n",
  "inlineSchemaHash": "657d6476cbe101ae797eda0e727e8295b49bf0bfe60aa3a748fc7631f4b4362c",
  "copyEngine": true
}

const fs = require('fs')

config.dirname = __dirname
if (!fs.existsSync(path.join(__dirname, 'schema.prisma'))) {
  const alternativePaths = [
    "src/prisma/generated",
    "prisma/generated",
  ]
  
  const alternativePath = alternativePaths.find((altPath) => {
    return fs.existsSync(path.join(process.cwd(), altPath, 'schema.prisma'))
  }) ?? alternativePaths[0]

  config.dirname = path.join(process.cwd(), alternativePath)
  config.isBundled = true
}

config.runtimeDataModel = JSON.parse("{\"models\":{\"Notification\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"dbName\":\"_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"auto\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"customerId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"jobId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"invoiceId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"quoteId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"recipientId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"recipientName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"recipientEmail\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"recipientPhone\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"recipientPushToken\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"channel\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Channel\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"subject\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"body\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DeliveryStatus\",\"default\":\"QUEUED\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"externalId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"providerResponse\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"error\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scheduledAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sentAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deliveredAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"failedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"MessageThread\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"dbName\":\"_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"auto\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"customerId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"customerName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"customerPhone\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"customerEmail\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"jobId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"ThreadStatus\",\"default\":\"ACTIVE\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"unreadCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastMessageAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastMessageBody\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"messages\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Message\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"NotificationTemplate\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"dbName\":\"_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"auto\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"TemplateType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"channel\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Channel\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"subject\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"body\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"variables\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isActive\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isDefault\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"AutomationRule\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"dbName\":\"_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"auto\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isActive\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"trigger\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AutomationTrigger\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"conditions\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"actions\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"delayMinutes\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"DeliveryLog\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"dbName\":\"_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"auto\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"notificationId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"channel\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Channel\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"recipient\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DeliveryStatus\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"provider\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"externalId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestPayload\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"responsePayload\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"durationMs\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"error\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{\"Channel\":{\"values\":[{\"name\":\"SMS\",\"dbName\":null},{\"name\":\"EMAIL\",\"dbName\":null},{\"name\":\"PUSH\",\"dbName\":null},{\"name\":\"IN_APP\",\"dbName\":null}],\"dbName\":null},\"DeliveryStatus\":{\"values\":[{\"name\":\"QUEUED\",\"dbName\":null},{\"name\":\"SENT\",\"dbName\":null},{\"name\":\"DELIVERED\",\"dbName\":null},{\"name\":\"FAILED\",\"dbName\":null},{\"name\":\"BOUNCED\",\"dbName\":null},{\"name\":\"UNSUBSCRIBED\",\"dbName\":null}],\"dbName\":null},\"ThreadStatus\":{\"values\":[{\"name\":\"ACTIVE\",\"dbName\":null},{\"name\":\"RESOLVED\",\"dbName\":null},{\"name\":\"SPAM\",\"dbName\":null}],\"dbName\":null},\"MessageDirection\":{\"values\":[{\"name\":\"OUTBOUND\",\"dbName\":null},{\"name\":\"INBOUND\",\"dbName\":null}],\"dbName\":null},\"TemplateType\":{\"values\":[{\"name\":\"APPOINTMENT_REMINDER\",\"dbName\":null},{\"name\":\"JOB_STATUS_UPDATE\",\"dbName\":null},{\"name\":\"INVOICE_SENT\",\"dbName\":null},{\"name\":\"PAYMENT_RECEIVED\",\"dbName\":null},{\"name\":\"REVIEW_REQUEST\",\"dbName\":null},{\"name\":\"WELCOME\",\"dbName\":null},{\"name\":\"CUSTOM\",\"dbName\":null}],\"dbName\":null},\"AutomationTrigger\":{\"values\":[{\"name\":\"JOB_STATUS_CHANGED\",\"dbName\":null},{\"name\":\"INVOICE_SENT\",\"dbName\":null},{\"name\":\"PAYMENT_RECEIVED\",\"dbName\":null},{\"name\":\"QUOTE_APPROVED\",\"dbName\":null},{\"name\":\"APPOINTMENT_BOOKED\",\"dbName\":null},{\"name\":\"MANUAL\",\"dbName\":null}],\"dbName\":null}},\"types\":{\"Message\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\"},{\"name\":\"senderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\"},{\"name\":\"senderName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\"},{\"name\":\"direction\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"MessageDirection\"},{\"name\":\"body\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\"},{\"name\":\"channel\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Channel\"},{\"name\":\"mediaUrls\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\"},{\"name\":\"twilioSid\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\"},{\"name\":\"sentAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\"},{\"name\":\"deliveredAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\"},{\"name\":\"readAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\"}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[]}}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined


const { warnEnvConflicts } = require('./runtime/library.js')

warnEnvConflicts({
    rootEnvPath: config.relativeEnvPaths.rootEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.rootEnvPath),
    schemaEnvPath: config.relativeEnvPaths.schemaEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.schemaEnvPath)
})

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

// file annotations for bundling tools to include these files
path.join(__dirname, "libquery_engine-darwin-arm64.dylib.node");
path.join(process.cwd(), "src/prisma/generated/libquery_engine-darwin-arm64.dylib.node")
// file annotations for bundling tools to include these files
path.join(__dirname, "schema.prisma");
path.join(process.cwd(), "src/prisma/generated/schema.prisma")
