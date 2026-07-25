
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

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  country: 'country',
  logoUrl: 'logoUrl',
  website: 'website',
  currency: 'currency',
  timezone: 'timezone',
  features: 'features',
  isActive: 'isActive',
  automaticFollowupEnabled: 'automaticFollowupEnabled',
  trialEndsAt: 'trialEndsAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompanyUserScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  auth0UserId: 'auth0UserId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  passwordHash: 'passwordHash',
  mustResetPassword: 'mustResetPassword',
  role: 'role',
  isActive: 'isActive',
  approvalStatus: 'approvalStatus',
  approvalNote: 'approvalNote',
  skills: 'skills',
  latitude: 'latitude',
  longitude: 'longitude',
  avatarUrl: 'avatarUrl',
  lastLoginAt: 'lastLoginAt',
  pushToken: 'pushToken',
  pushPlatform: 'pushPlatform',
  pushTokenUpdatedAt: 'pushTokenUpdatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserLoginEventScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  userEmail: 'userEmail',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  loggedInAt: 'loggedInAt'
};

exports.Prisma.CustomerScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  mobile: 'mobile',
  address: 'address',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  notes: 'notes',
  source: 'source',
  tags: 'tags',
  isActive: 'isActive',
  automaticFollowupEnabled: 'automaticFollowupEnabled',
  engagementStatus: 'engagementStatus',
  auth0UserId: 'auth0UserId',
  importBatchId: 'importBatchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContactScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  role: 'role',
  isPrimary: 'isPrimary',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  source: 'source',
  serviceInterest: 'serviceInterest',
  whatsappNo: 'whatsappNo',
  type: 'type',
  status: 'status',
  estimatedValue: 'estimatedValue',
  notes: 'notes',
  assignedToId: 'assignedToId',
  convertedAt: 'convertedAt',
  leadgenId: 'leadgenId',
  adName: 'adName',
  formId: 'formId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceAgreementScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  name: 'name',
  description: 'description',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  value: 'value',
  billingCycle: 'billingCycle',
  autoRenew: 'autoRenew',
  signedAt: 'signedAt',
  signedByName: 'signedByName',
  documentUrl: 'documentUrl',
  billingAmount: 'billingAmount',
  nextBillingDate: 'nextBillingDate',
  serviceType: 'serviceType',
  serviceInterval: 'serviceInterval',
  serviceIntervalDays: 'serviceIntervalDays',
  visitsIncluded: 'visitsIncluded',
  visitsUsed: 'visitsUsed',
  lastServiceDate: 'lastServiceDate',
  nextServiceDate: 'nextServiceDate',
  autoCreateJobs: 'autoCreateJobs',
  leadDays: 'leadDays',
  jobTemplateId: 'jobTemplateId',
  projectId: 'projectId',
  customerConfirmedAt: 'customerConfirmedAt',
  confirmToken: 'confirmToken',
  renewalReminderSent: 'renewalReminderSent',
  renewedFromId: 'renewedFromId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AgreementAmendmentScalarFieldEnum = {
  id: 'id',
  agreementId: 'agreementId',
  changedFields: 'changedFields',
  changedBy: 'changedBy',
  changedByName: 'changedByName',
  customerNotifiedAt: 'customerNotifiedAt',
  customerConfirmedAt: 'customerConfirmedAt',
  createdAt: 'createdAt'
};

exports.Prisma.BookingScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  guestName: 'guestName',
  guestEmail: 'guestEmail',
  guestPhone: 'guestPhone',
  serviceType: 'serviceType',
  description: 'description',
  preferredDate: 'preferredDate',
  alternateDate: 'alternateDate',
  status: 'status',
  jobId: 'jobId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  customerId: 'customerId',
  customerName: 'customerName',
  jobId: 'jobId',
  technicianId: 'technicianId',
  technicianName: 'technicianName',
  rating: 'rating',
  comment: 'comment',
  platform: 'platform',
  isPublished: 'isPublished',
  respondedAt: 'respondedAt',
  response: 'response',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AddressScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  leadId: 'leadId',
  type: 'type',
  line1: 'line1',
  line2: 'line2',
  city: 'city',
  state: 'state',
  postcode: 'postcode',
  isPrimary: 'isPrimary',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EquipmentScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  houseId: 'houseId',
  type: 'type',
  brand: 'brand',
  model: 'model',
  serialNo: 'serialNo',
  installDate: 'installDate',
  warrantyEnd: 'warrantyEnd',
  notes: 'notes',
  importBatchId: 'importBatchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  manualUrl: 'manualUrl'
};

exports.Prisma.EquipmentConsumableScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  equipmentId: 'equipmentId',
  kind: 'kind',
  partNumber: 'partNumber',
  description: 'description',
  sizeSpec: 'sizeSpec',
  rating: 'rating',
  intervalDays: 'intervalDays',
  lastReplacedAt: 'lastReplacedAt',
  purchaseUrl: 'purchaseUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContractorPostScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  title: 'title',
  body: 'body',
  videoUrl: 'videoUrl',
  heroImageUrl: 'heroImageUrl',
  isPinned: 'isPinned',
  isPublished: 'isPublished',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompanyAnnouncementScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  title: 'title',
  body: 'body',
  linkUrl: 'linkUrl',
  linkLabel: 'linkLabel',
  accentColor: 'accentColor',
  isActive: 'isActive',
  activeFrom: 'activeFrom',
  activeTo: 'activeTo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FollowupAttemptScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  entityType: 'entityType',
  entityId: 'entityId',
  customerId: 'customerId',
  leadId: 'leadId',
  action: 'action',
  status: 'status',
  churnProbability: 'churnProbability',
  queueJobId: 'queueJobId',
  reason: 'reason',
  errorMessage: 'errorMessage',
  metadata: 'metadata',
  triggeredAt: 'triggeredAt',
  queuedAt: 'queuedAt',
  failedAt: 'failedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UpsellRecommendationScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  recommendedOffer: 'recommendedOffer',
  confidence: 'confidence',
  status: 'status',
  allScores: 'allScores',
  ruleOffer: 'ruleOffer',
  modelOffer: 'modelOffer',
  triggerSource: 'triggerSource',
  priorityScore: 'priorityScore',
  inputPayload: 'inputPayload',
  ruleResult: 'ruleResult',
  llmRecommendation: 'llmRecommendation',
  validationResult: 'validationResult',
  llmOffer: 'llmOffer',
  bundle: 'bundle',
  channel: 'channel',
  message: 'message',
  reasonCode: 'reasonCode',
  reason: 'reason',
  managerOverride: 'managerOverride',
  offerAccepted: 'offerAccepted',
  offerRejected: 'offerRejected',
  upsellConversion: 'upsellConversion',
  revenueGenerated: 'revenueGenerated',
  respondedAt: 'respondedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RetentionRecommendationScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  ruleResult: 'ruleResult',
  llmRecommendation: 'llmRecommendation',
  validationResult: 'validationResult',
  finalAction: 'finalAction',
  finalOffer: 'finalOffer',
  finalPriority: 'finalPriority',
  finalChannel: 'finalChannel',
  finalMessage: 'finalMessage',
  reason: 'reason',
  confidence: 'confidence',
  status: 'status',
  managerOverride: 'managerOverride',
  customerAccepted: 'customerAccepted',
  customerDeclined: 'customerDeclined',
  retentionSuccess: 'retentionSuccess',
  revenueGenerated: 'revenueGenerated',
  respondedAt: 'respondedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RevenueRecommendationScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  ruleResult: 'ruleResult',
  llmRecommendation: 'llmRecommendation',
  validationResult: 'validationResult',
  finalCategory: 'finalCategory',
  finalAction: 'finalAction',
  finalPriority: 'finalPriority',
  finalChannel: 'finalChannel',
  finalMessage: 'finalMessage',
  reason: 'reason',
  expectedRevenueImpact: 'expectedRevenueImpact',
  confidence: 'confidence',
  status: 'status',
  managerOverride: 'managerOverride',
  customerAccepted: 'customerAccepted',
  customerDeclined: 'customerDeclined',
  revenueRealized: 'revenueRealized',
  respondedAt: 'respondedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ImportBatchScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  source: 'source',
  status: 'status',
  totalRows: 'totalRows',
  imported: 'imported',
  skipped: 'skipped',
  failed: 'failed',
  createdBy: 'createdBy',
  rawData: 'rawData',
  columnMap: 'columnMap',
  completedAt: 'completedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ImportErrorScalarFieldEnum = {
  id: 'id',
  batchId: 'batchId',
  rowNumber: 'rowNumber',
  entityType: 'entityType',
  rawData: 'rawData',
  error: 'error',
  createdAt: 'createdAt'
};

exports.Prisma.CustomerIotConnectionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  provider: 'provider',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  tokenExpiresAt: 'tokenExpiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomerIotDeviceScalarFieldEnum = {
  id: 'id',
  connectionId: 'connectionId',
  deviceId: 'deviceId',
  locationId: 'locationId',
  name: 'name',
  type: 'type',
  lastSnapshot: 'lastSnapshot',
  lastSyncedAt: 'lastSyncedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.IotDeviceHistoryScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  companyId: 'companyId',
  customerId: 'customerId',
  snapshot: 'snapshot',
  recordedAt: 'recordedAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  customerId: 'customerId',
  name: 'name',
  description: 'description',
  category: 'category',
  status: 'status',
  templateType: 'templateType',
  startDate: 'startDate',
  targetEndDate: 'targetEndDate',
  budget: 'budget',
  requiredHeadcount: 'requiredHeadcount',
  siteAddress: 'siteAddress',
  latitude: 'latitude',
  longitude: 'longitude',
  workingDays: 'workingDays',
  baseTeamUserIds: 'baseTeamUserIds',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProjectRosterDayScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  projectId: 'projectId',
  date: 'date',
  techUserIds: 'techUserIds',
  isOff: 'isOff',
  updatedBy: 'updatedBy',
  updatedAt: 'updatedAt'
};

exports.Prisma.HouseScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  projectId: 'projectId',
  label: 'label',
  address: 'address',
  ownerCustomerId: 'ownerCustomerId',
  tags: 'tags',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HouseIssueReportScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  houseId: 'houseId',
  equipmentId: 'equipmentId',
  reportedByCustomerId: 'reportedByCustomerId',
  errorCode: 'errorCode',
  description: 'description',
  status: 'status',
  resolvedNote: 'resolvedNote',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.CustomerType = exports.$Enums.CustomerType = {
  RESIDENTIAL: 'RESIDENTIAL',
  COMMERCIAL: 'COMMERCIAL'
};

exports.CustomerEngagementStatus = exports.$Enums.CustomerEngagementStatus = {
  ACTIVE: 'ACTIVE',
  QUOTE_SENT: 'QUOTE_SENT',
  INVOICE_SENT: 'INVOICE_SENT',
  JOB_BOOKED: 'JOB_BOOKED',
  COMPLETED: 'COMPLETED',
  INACTIVE: 'INACTIVE'
};

exports.LeadStatus = exports.$Enums.LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  WON: 'WON',
  LOST: 'LOST'
};

exports.AgreementStatus = exports.$Enums.AgreementStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACTIVE: 'ACTIVE',
  PENDING_RENEWAL: 'PENDING_RENEWAL',
  RENEWED: 'RENEWED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

exports.BookingStatus = exports.$Enums.BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CONVERTED: 'CONVERTED',
  CANCELLED: 'CANCELLED'
};

exports.ReviewType = exports.$Enums.ReviewType = {
  JOB: 'JOB',
  COMPANY: 'COMPANY'
};

exports.ImportStatus = exports.$Enums.ImportStatus = {
  VALIDATING: 'VALIDATING',
  READY: 'READY',
  IMPORTING: 'IMPORTING',
  DONE: 'DONE',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK'
};

exports.Prisma.ModelName = {
  Company: 'Company',
  CompanyUser: 'CompanyUser',
  UserLoginEvent: 'UserLoginEvent',
  Customer: 'Customer',
  Contact: 'Contact',
  Lead: 'Lead',
  ServiceAgreement: 'ServiceAgreement',
  AgreementAmendment: 'AgreementAmendment',
  Booking: 'Booking',
  Review: 'Review',
  Address: 'Address',
  Equipment: 'Equipment',
  EquipmentConsumable: 'EquipmentConsumable',
  ContractorPost: 'ContractorPost',
  CompanyAnnouncement: 'CompanyAnnouncement',
  FollowupAttempt: 'FollowupAttempt',
  UpsellRecommendation: 'UpsellRecommendation',
  RetentionRecommendation: 'RetentionRecommendation',
  RevenueRecommendation: 'RevenueRecommendation',
  ImportBatch: 'ImportBatch',
  ImportError: 'ImportError',
  CustomerIotConnection: 'CustomerIotConnection',
  CustomerIotDevice: 'CustomerIotDevice',
  IotDeviceHistory: 'IotDeviceHistory',
  Project: 'Project',
  ProjectRosterDay: 'ProjectRosterDay',
  House: 'House',
  HouseIssueReport: 'HouseIssueReport'
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
