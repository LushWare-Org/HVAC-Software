
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
} = require('./runtime/edge.js')


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





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.PartnerApiKeyScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  environment: 'environment',
  keyPrefix: 'keyPrefix',
  keyHash: 'keyHash',
  scopes: 'scopes',
  rateLimitPerMin: 'rateLimitPerMin',
  status: 'status',
  lastUsedAt: 'lastUsedAt',
  expiresAt: 'expiresAt',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  revokedAt: 'revokedAt'
};

exports.Prisma.PartnerNewCallerBookingScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  phoneSuffix: 'phoneSuffix',
  customerId: 'customerId',
  createdAt: 'createdAt'
};

exports.Prisma.PartnerWebhookScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  apiKeyId: 'apiKeyId',
  url: 'url',
  secret: 'secret',
  events: 'events',
  status: 'status',
  description: 'description',
  failureCount: 'failureCount',
  lastSuccessAt: 'lastSuccessAt',
  lastFailureAt: 'lastFailureAt',
  createdAt: 'createdAt'
};

exports.Prisma.PartnerWebhookDeliveryScalarFieldEnum = {
  id: 'id',
  webhookId: 'webhookId',
  companyId: 'companyId',
  eventType: 'eventType',
  entityId: 'entityId',
  attempt: 'attempt',
  statusCode: 'statusCode',
  success: 'success',
  error: 'error',
  durationMs: 'durationMs',
  createdAt: 'createdAt'
};

exports.Prisma.PartnerApiCallScalarFieldEnum = {
  id: 'id',
  apiKeyId: 'apiKeyId',
  companyId: 'companyId',
  method: 'method',
  path: 'path',
  statusCode: 'statusCode',
  durationMs: 'durationMs',
  ip: 'ip',
  userAgent: 'userAgent',
  errorCode: 'errorCode',
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

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.PartnerEnvironment = exports.$Enums.PartnerEnvironment = {
  LIVE: 'LIVE',
  SANDBOX: 'SANDBOX'
};

exports.ApiKeyStatus = exports.$Enums.ApiKeyStatus = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED'
};

exports.WebhookStatus = exports.$Enums.WebhookStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DISABLED: 'DISABLED'
};

exports.Prisma.ModelName = {
  PartnerApiKey: 'PartnerApiKey',
  PartnerNewCallerBooking: 'PartnerNewCallerBooking',
  PartnerWebhook: 'PartnerWebhook',
  PartnerWebhookDelivery: 'PartnerWebhookDelivery',
  PartnerApiCall: 'PartnerApiCall'
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
      "value": "C:\\Users\\SHALINI\\OneDrive - University of Colombo\\Documents\\LWOG\\HVAC-Software\\apps\\partner-api\\src\\prisma\\generated",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [],
    "sourceFilePath": "C:\\Users\\SHALINI\\OneDrive - University of Colombo\\Documents\\LWOG\\HVAC-Software\\apps\\partner-api\\prisma\\schema.prisma",
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
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "PARTNER_DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider = \"prisma-client-js\"\n  output   = \"../src/prisma/generated\"\n}\n\ndatasource db {\n  provider  = \"postgresql\"\n  url       = env(\"PARTNER_DATABASE_URL\")\n  directUrl = env(\"PARTNER_DIRECT_DATABASE_URL\")\n}\n\nenum ApiKeyStatus {\n  ACTIVE\n  REVOKED\n}\n\nenum PartnerEnvironment {\n  LIVE\n  SANDBOX\n}\n\n/// A credential issued to an external integrator (e.g. an AI phone agent\n/// vendor). Only the SHA-256 hash of the key is stored — the plaintext is\n/// shown once at creation and is unrecoverable afterwards.\nmodel PartnerApiKey {\n  id              String             @id @default(uuid())\n  companyId       String             @map(\"company_id\")\n  name            String\n  environment     PartnerEnvironment @default(LIVE)\n  /// Non-secret display prefix, e.g. \"pk_live_a94f1c2b\" — safe to render in the UI.\n  keyPrefix       String             @map(\"key_prefix\")\n  keyHash         String             @unique @map(\"key_hash\")\n  scopes          String[]\n  rateLimitPerMin Int                @default(60) @map(\"rate_limit_per_min\")\n  status          ApiKeyStatus       @default(ACTIVE)\n  lastUsedAt      DateTime?          @map(\"last_used_at\")\n  expiresAt       DateTime?          @map(\"expires_at\")\n  createdBy       String?            @map(\"created_by\")\n  createdAt       DateTime           @default(now()) @map(\"created_at\")\n  revokedAt       DateTime?          @map(\"revoked_at\")\n\n  calls PartnerApiCall[]\n\n  @@index([companyId, status])\n  @@map(\"partner_api_key\")\n}\n\n/// One row per appointment a partner booked for a caller who was not already\n/// a customer. Backs the per-number daily cap, so a single number cannot fill\n/// the calendar. Held here rather than in CRM because it is abuse control over\n/// the partner surface, not customer data.\nmodel PartnerNewCallerBooking {\n  id          String   @id @default(uuid())\n  companyId   String   @map(\"company_id\")\n  /// Trailing digits only — enough to rate-limit, and matches the same\n  /// normalisation the CRM caller lookup uses.\n  phoneSuffix String   @map(\"phone_suffix\")\n  customerId  String?  @map(\"customer_id\")\n  createdAt   DateTime @default(now()) @map(\"created_at\")\n\n  @@index([companyId, phoneSuffix, createdAt])\n  @@map(\"partner_new_caller_booking\")\n}\n\nenum WebhookStatus {\n  ACTIVE\n  /// Auto-set after repeated delivery failures, so a dead endpoint stops\n  /// consuming retries. A partner re-enables it by re-registering.\n  SUSPENDED\n  DISABLED\n}\n\n/// A partner's subscription to business events. Each partner registers its own\n/// endpoint; events are only ever delivered to subscriptions belonging to the\n/// same company as the event.\nmodel PartnerWebhook {\n  id            String        @id @default(uuid())\n  companyId     String        @map(\"company_id\")\n  apiKeyId      String?       @map(\"api_key_id\")\n  url           String\n  /// Shared secret for the HMAC signature on every delivery. Returned once at\n  /// registration so the partner can verify payloads really came from us.\n  secret        String\n  events        String[]\n  status        WebhookStatus @default(ACTIVE)\n  description   String?\n  failureCount  Int           @default(0) @map(\"failure_count\")\n  lastSuccessAt DateTime?     @map(\"last_success_at\")\n  lastFailureAt DateTime?     @map(\"last_failure_at\")\n  createdAt     DateTime      @default(now()) @map(\"created_at\")\n\n  deliveries PartnerWebhookDelivery[]\n\n  @@index([companyId, status])\n  @@map(\"partner_webhook\")\n}\n\n/// One row per delivery attempt. Answers \"did they get it?\" when a partner\n/// says an event never arrived.\nmodel PartnerWebhookDelivery {\n  id         String   @id @default(uuid())\n  webhookId  String   @map(\"webhook_id\")\n  companyId  String   @map(\"company_id\")\n  eventType  String   @map(\"event_type\")\n  entityId   String   @map(\"entity_id\")\n  attempt    Int      @default(1)\n  statusCode Int?     @map(\"status_code\")\n  success    Boolean  @default(false)\n  error      String?\n  durationMs Int?     @map(\"duration_ms\")\n  createdAt  DateTime @default(now()) @map(\"created_at\")\n\n  webhook PartnerWebhook @relation(fields: [webhookId], references: [id], onDelete: Cascade)\n\n  @@index([webhookId, createdAt])\n  @@index([companyId, eventType, createdAt])\n  @@map(\"partner_webhook_delivery\")\n}\n\n/// One row per inbound partner request. Used for troubleshooting, abuse\n/// detection and per-partner usage reporting.\nmodel PartnerApiCall {\n  id         String   @id @default(uuid())\n  apiKeyId   String?  @map(\"api_key_id\")\n  companyId  String?  @map(\"company_id\")\n  method     String\n  path       String\n  statusCode Int      @map(\"status_code\")\n  durationMs Int      @map(\"duration_ms\")\n  ip         String?\n  userAgent  String?  @map(\"user_agent\")\n  errorCode  String?  @map(\"error_code\")\n  createdAt  DateTime @default(now()) @map(\"created_at\")\n\n  apiKey PartnerApiKey? @relation(fields: [apiKeyId], references: [id], onDelete: SetNull)\n\n  @@index([apiKeyId, createdAt])\n  @@index([companyId, createdAt])\n  @@map(\"partner_api_call\")\n}\n",
  "inlineSchemaHash": "2d2c3922787e646a90117a4971aac0f1f78ff96c75b7e0d6f1e5ad2ef2a8b2cd",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"PartnerApiKey\":{\"dbName\":\"partner_api_key\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"dbName\":\"company_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"environment\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"PartnerEnvironment\",\"default\":\"LIVE\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"keyPrefix\",\"dbName\":\"key_prefix\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false,\"documentation\":\"Non-secret display prefix, e.g. \\\"pk_live_a94f1c2b\\\" — safe to render in the UI.\"},{\"name\":\"keyHash\",\"dbName\":\"key_hash\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scopes\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"rateLimitPerMin\",\"dbName\":\"rate_limit_per_min\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":60,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"ApiKeyStatus\",\"default\":\"ACTIVE\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastUsedAt\",\"dbName\":\"last_used_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"expiresAt\",\"dbName\":\"expires_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"revokedAt\",\"dbName\":\"revoked_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"calls\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PartnerApiCall\",\"relationName\":\"PartnerApiCallToPartnerApiKey\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"A credential issued to an external integrator (e.g. an AI phone agent\\\\nvendor). Only the SHA-256 hash of the key is stored — the plaintext is\\\\nshown once at creation and is unrecoverable afterwards.\"},\"PartnerNewCallerBooking\":{\"dbName\":\"partner_new_caller_booking\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"dbName\":\"company_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"phoneSuffix\",\"dbName\":\"phone_suffix\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false,\"documentation\":\"Trailing digits only — enough to rate-limit, and matches the same\\\\nnormalisation the CRM caller lookup uses.\"},{\"name\":\"customerId\",\"dbName\":\"customer_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"One row per appointment a partner booked for a caller who was not already\\\\na customer. Backs the per-number daily cap, so a single number cannot fill\\\\nthe calendar. Held here rather than in CRM because it is abuse control over\\\\nthe partner surface, not customer data.\"},\"PartnerWebhook\":{\"dbName\":\"partner_webhook\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"dbName\":\"company_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"apiKeyId\",\"dbName\":\"api_key_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"url\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"secret\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false,\"documentation\":\"Shared secret for the HMAC signature on every delivery. Returned once at\\\\nregistration so the partner can verify payloads really came from us.\"},{\"name\":\"events\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"WebhookStatus\",\"default\":\"ACTIVE\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"failureCount\",\"dbName\":\"failure_count\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastSuccessAt\",\"dbName\":\"last_success_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastFailureAt\",\"dbName\":\"last_failure_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deliveries\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PartnerWebhookDelivery\",\"relationName\":\"PartnerWebhookToPartnerWebhookDelivery\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"A partner's subscription to business events. Each partner registers its own\\\\nendpoint; events are only ever delivered to subscriptions belonging to the\\\\nsame company as the event.\"},\"PartnerWebhookDelivery\":{\"dbName\":\"partner_webhook_delivery\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"webhookId\",\"dbName\":\"webhook_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"dbName\":\"company_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"eventType\",\"dbName\":\"event_type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"entityId\",\"dbName\":\"entity_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"attempt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"statusCode\",\"dbName\":\"status_code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"success\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"error\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"durationMs\",\"dbName\":\"duration_ms\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"webhook\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PartnerWebhook\",\"relationName\":\"PartnerWebhookToPartnerWebhookDelivery\",\"relationFromFields\":[\"webhookId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"One row per delivery attempt. Answers \\\"did they get it?\\\" when a partner\\\\nsays an event never arrived.\"},\"PartnerApiCall\":{\"dbName\":\"partner_api_call\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"apiKeyId\",\"dbName\":\"api_key_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"companyId\",\"dbName\":\"company_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"method\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"statusCode\",\"dbName\":\"status_code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"durationMs\",\"dbName\":\"duration_ms\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"ip\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userAgent\",\"dbName\":\"user_agent\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"errorCode\",\"dbName\":\"error_code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"apiKey\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PartnerApiKey\",\"relationName\":\"PartnerApiCallToPartnerApiKey\",\"relationFromFields\":[\"apiKeyId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"One row per inbound partner request. Used for troubleshooting, abuse\\\\ndetection and per-partner usage reporting.\"}},\"enums\":{\"ApiKeyStatus\":{\"values\":[{\"name\":\"ACTIVE\",\"dbName\":null},{\"name\":\"REVOKED\",\"dbName\":null}],\"dbName\":null},\"PartnerEnvironment\":{\"values\":[{\"name\":\"LIVE\",\"dbName\":null},{\"name\":\"SANDBOX\",\"dbName\":null}],\"dbName\":null},\"WebhookStatus\":{\"values\":[{\"name\":\"ACTIVE\",\"dbName\":null},{\"name\":\"SUSPENDED\",\"dbName\":null,\"documentation\":\"Auto-set after repeated delivery failures, so a dead endpoint stops\\\\nconsuming retries. A partner re-enables it by re-registering.\"},{\"name\":\"DISABLED\",\"dbName\":null}],\"dbName\":null}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    PARTNER_DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['PARTNER_DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.PARTNER_DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

