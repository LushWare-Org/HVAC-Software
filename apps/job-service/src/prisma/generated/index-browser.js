
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

exports.Prisma.JobTypeScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  slug: 'slug',
  description: 'description',
  icon: 'icon',
  color: 'color',
  isActive: 'isActive',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JobTemplateScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  jobTypeId: 'jobTypeId',
  name: 'name',
  description: 'description',
  estimatedDurationMins: 'estimatedDurationMins',
  version: 'version',
  isActive: 'isActive',
  requiredParts: 'requiredParts',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JobTemplateTaskScalarFieldEnum = {
  id: 'id',
  templateId: 'templateId',
  taskName: 'taskName',
  description: 'description',
  taskOrder: 'taskOrder',
  isRequired: 'isRequired',
  photoRequired: 'photoRequired',
  safetyNote: 'safetyNote',
  estimatedMins: 'estimatedMins',
  createdAt: 'createdAt'
};

exports.Prisma.JobCustomFieldDefScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  jobTypeId: 'jobTypeId',
  fieldKey: 'fieldKey',
  label: 'label',
  fieldType: 'fieldType',
  options: 'options',
  isRequired: 'isRequired',
  helpText: 'helpText',
  sortOrder: 'sortOrder',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.JobCustomFieldValueScalarFieldEnum = {
  id: 'id',
  jobId: 'jobId',
  fieldDefId: 'fieldDefId',
  value: 'value',
  updatedAt: 'updatedAt'
};

exports.Prisma.PriceBookItemScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  category: 'category',
  code: 'code',
  name: 'name',
  description: 'description',
  unit: 'unit',
  unitPrice: 'unitPrice',
  taxable: 'taxable',
  isActive: 'isActive',
  jobTypeId: 'jobTypeId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JobScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  jobNumber: 'jobNumber',
  customerId: 'customerId',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  customerEmail: 'customerEmail',
  serviceAddress: 'serviceAddress',
  serviceCity: 'serviceCity',
  serviceState: 'serviceState',
  serviceZip: 'serviceZip',
  serviceLatitude: 'serviceLatitude',
  serviceLongitude: 'serviceLongitude',
  jobTypeId: 'jobTypeId',
  templateId: 'templateId',
  projectId: 'projectId',
  houseId: 'houseId',
  equipmentId: 'equipmentId',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  assignedToId: 'assignedToId',
  assignedToName: 'assignedToName',
  scheduledStart: 'scheduledStart',
  scheduledEnd: 'scheduledEnd',
  actualStart: 'actualStart',
  actualEnd: 'actualEnd',
  estimatedDurationMins: 'estimatedDurationMins',
  travelDistanceKm: 'travelDistanceKm',
  estimatedValue: 'estimatedValue',
  quoteId: 'quoteId',
  invoiceId: 'invoiceId',
  agreementId: 'agreementId',
  isAgreementJob: 'isAgreementJob',
  notes: 'notes',
  internalNotes: 'internalNotes',
  tags: 'tags',
  cancellationReason: 'cancellationReason',
  hasPartShortage: 'hasPartShortage',
  partShortageNote: 'partShortageNote',
  rescheduleState: 'rescheduleState',
  createdByUserId: 'createdByUserId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  completedAt: 'completedAt'
};

exports.Prisma.JobStatusHistoryScalarFieldEnum = {
  id: 'id',
  jobId: 'jobId',
  fromStatus: 'fromStatus',
  toStatus: 'toStatus',
  changedById: 'changedById',
  changedByName: 'changedByName',
  note: 'note',
  createdAt: 'createdAt'
};

exports.Prisma.JobPhotoScalarFieldEnum = {
  id: 'id',
  jobId: 'jobId',
  workOrderId: 'workOrderId',
  s3Key: 's3Key',
  caption: 'caption',
  photoType: 'photoType',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt'
};

exports.Prisma.WorkOrderScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  jobId: 'jobId',
  workOrderNumber: 'workOrderNumber',
  technicianId: 'technicianId',
  technicianName: 'technicianName',
  status: 'status',
  scheduledStart: 'scheduledStart',
  scheduledEnd: 'scheduledEnd',
  checkinAt: 'checkinAt',
  checkoutAt: 'checkoutAt',
  signatureUrl: 'signatureUrl',
  technicianNotes: 'technicianNotes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkOrderTaskCompletionScalarFieldEnum = {
  id: 'id',
  workOrderId: 'workOrderId',
  templateTaskId: 'templateTaskId',
  isAdHoc: 'isAdHoc',
  taskName: 'taskName',
  isRequired: 'isRequired',
  isCompleted: 'isCompleted',
  photoUrl: 'photoUrl',
  notes: 'notes',
  completedAt: 'completedAt'
};

exports.Prisma.WorkOrderLineItemScalarFieldEnum = {
  id: 'id',
  workOrderId: 'workOrderId',
  priceBookItemId: 'priceBookItemId',
  description: 'description',
  category: 'category',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  taxable: 'taxable',
  lineTotal: 'lineTotal',
  createdAt: 'createdAt'
};

exports.Prisma.RescheduleRequestScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  jobId: 'jobId',
  openedBy: 'openedBy',
  openedByUserId: 'openedByUserId',
  openedByName: 'openedByName',
  mode: 'mode',
  reasonCode: 'reasonCode',
  reason: 'reason',
  status: 'status',
  pickedSlotId: 'pickedSlotId',
  responseNote: 'responseNote',
  respondedAt: 'respondedAt',
  respondedByName: 'respondedByName',
  appliedAt: 'appliedAt',
  nudgedAt: 'nudgedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RescheduleSlotScalarFieldEnum = {
  id: 'id',
  requestId: 'requestId',
  startAt: 'startAt',
  endAt: 'endAt',
  window: 'window'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.CustomFieldType = exports.$Enums.CustomFieldType = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  SELECT: 'SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  DATE: 'DATE',
  TEXTAREA: 'TEXTAREA'
};

exports.PriceCategory = exports.$Enums.PriceCategory = {
  LABOUR: 'LABOUR',
  PART: 'PART',
  MATERIAL: 'MATERIAL',
  EQUIPMENT_RENTAL: 'EQUIPMENT_RENTAL',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  OTHER: 'OTHER'
};

exports.JobStatus = exports.$Enums.JobStatus = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  EN_ROUTE: 'EN_ROUTE',
  ON_SITE: 'ON_SITE',
  COMPLETED: 'COMPLETED',
  INVOICED: 'INVOICED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD'
};

exports.JobPriority = exports.$Enums.JobPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  EMERGENCY: 'EMERGENCY'
};

exports.RescheduleState = exports.$Enums.RescheduleState = {
  AWAITING_CUSTOMER: 'AWAITING_CUSTOMER',
  AWAITING_ADMIN: 'AWAITING_ADMIN',
  READY_TO_APPLY: 'READY_TO_APPLY'
};

exports.PhotoType = exports.$Enums.PhotoType = {
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  GENERAL: 'GENERAL',
  EQUIPMENT: 'EQUIPMENT',
  ISSUE: 'ISSUE'
};

exports.WorkOrderStatus = exports.$Enums.WorkOrderStatus = {
  PENDING: 'PENDING',
  EN_ROUTE: 'EN_ROUTE',
  ON_SITE: 'ON_SITE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.RescheduleActor = exports.$Enums.RescheduleActor = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER'
};

exports.RescheduleMode = exports.$Enums.RescheduleMode = {
  PROPOSE_SLOTS: 'PROPOSE_SLOTS',
  OPEN_ASK: 'OPEN_ASK'
};

exports.RescheduleReason = exports.$Enums.RescheduleReason = {
  PARTS_DELAY: 'PARTS_DELAY',
  TECH_UNAVAILABLE: 'TECH_UNAVAILABLE',
  WEATHER: 'WEATHER',
  EMERGENCY_BUMP: 'EMERGENCY_BUMP',
  CAPACITY: 'CAPACITY',
  CUSTOMER_UNAVAILABLE: 'CUSTOMER_UNAVAILABLE',
  ACCESS_ISSUE: 'ACCESS_ISSUE',
  OTHER: 'OTHER'
};

exports.RescheduleStatus = exports.$Enums.RescheduleStatus = {
  AWAITING_RESPONSE: 'AWAITING_RESPONSE',
  SLOT_PICKED: 'SLOT_PICKED',
  DECLINED: 'DECLINED',
  SUPERSEDED: 'SUPERSEDED',
  APPLIED: 'APPLIED',
  CANCELLED: 'CANCELLED'
};

exports.Prisma.ModelName = {
  JobType: 'JobType',
  JobTemplate: 'JobTemplate',
  JobTemplateTask: 'JobTemplateTask',
  JobCustomFieldDef: 'JobCustomFieldDef',
  JobCustomFieldValue: 'JobCustomFieldValue',
  PriceBookItem: 'PriceBookItem',
  Job: 'Job',
  JobStatusHistory: 'JobStatusHistory',
  JobPhoto: 'JobPhoto',
  WorkOrder: 'WorkOrder',
  WorkOrderTaskCompletion: 'WorkOrderTaskCompletion',
  WorkOrderLineItem: 'WorkOrderLineItem',
  RescheduleRequest: 'RescheduleRequest',
  RescheduleSlot: 'RescheduleSlot'
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
