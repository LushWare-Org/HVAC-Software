
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model JobType
 * 
 */
export type JobType = $Result.DefaultSelection<Prisma.$JobTypePayload>
/**
 * Model JobTemplate
 * 
 */
export type JobTemplate = $Result.DefaultSelection<Prisma.$JobTemplatePayload>
/**
 * Model JobTemplateTask
 * 
 */
export type JobTemplateTask = $Result.DefaultSelection<Prisma.$JobTemplateTaskPayload>
/**
 * Model JobCustomFieldDef
 * 
 */
export type JobCustomFieldDef = $Result.DefaultSelection<Prisma.$JobCustomFieldDefPayload>
/**
 * Model JobCustomFieldValue
 * 
 */
export type JobCustomFieldValue = $Result.DefaultSelection<Prisma.$JobCustomFieldValuePayload>
/**
 * Model PriceBookItem
 * 
 */
export type PriceBookItem = $Result.DefaultSelection<Prisma.$PriceBookItemPayload>
/**
 * Model Job
 * 
 */
export type Job = $Result.DefaultSelection<Prisma.$JobPayload>
/**
 * Model JobStatusHistory
 * 
 */
export type JobStatusHistory = $Result.DefaultSelection<Prisma.$JobStatusHistoryPayload>
/**
 * Model JobPhoto
 * 
 */
export type JobPhoto = $Result.DefaultSelection<Prisma.$JobPhotoPayload>
/**
 * Model WorkOrder
 * 
 */
export type WorkOrder = $Result.DefaultSelection<Prisma.$WorkOrderPayload>
/**
 * Model WorkOrderTaskCompletion
 * 
 */
export type WorkOrderTaskCompletion = $Result.DefaultSelection<Prisma.$WorkOrderTaskCompletionPayload>
/**
 * Model WorkOrderLineItem
 * 
 */
export type WorkOrderLineItem = $Result.DefaultSelection<Prisma.$WorkOrderLineItemPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const CustomFieldType: {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  SELECT: 'SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  DATE: 'DATE',
  TEXTAREA: 'TEXTAREA'
};

export type CustomFieldType = (typeof CustomFieldType)[keyof typeof CustomFieldType]


export const PriceCategory: {
  LABOUR: 'LABOUR',
  PART: 'PART',
  MATERIAL: 'MATERIAL',
  EQUIPMENT_RENTAL: 'EQUIPMENT_RENTAL',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  OTHER: 'OTHER'
};

export type PriceCategory = (typeof PriceCategory)[keyof typeof PriceCategory]


export const JobStatus: {
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

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus]


export const JobPriority: {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  EMERGENCY: 'EMERGENCY'
};

export type JobPriority = (typeof JobPriority)[keyof typeof JobPriority]


export const PhotoType: {
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  GENERAL: 'GENERAL',
  EQUIPMENT: 'EQUIPMENT',
  ISSUE: 'ISSUE'
};

export type PhotoType = (typeof PhotoType)[keyof typeof PhotoType]


export const WorkOrderStatus: {
  PENDING: 'PENDING',
  EN_ROUTE: 'EN_ROUTE',
  ON_SITE: 'ON_SITE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus]

}

export type CustomFieldType = $Enums.CustomFieldType

export const CustomFieldType: typeof $Enums.CustomFieldType

export type PriceCategory = $Enums.PriceCategory

export const PriceCategory: typeof $Enums.PriceCategory

export type JobStatus = $Enums.JobStatus

export const JobStatus: typeof $Enums.JobStatus

export type JobPriority = $Enums.JobPriority

export const JobPriority: typeof $Enums.JobPriority

export type PhotoType = $Enums.PhotoType

export const PhotoType: typeof $Enums.PhotoType

export type WorkOrderStatus = $Enums.WorkOrderStatus

export const WorkOrderStatus: typeof $Enums.WorkOrderStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more JobTypes
 * const jobTypes = await prisma.jobType.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more JobTypes
   * const jobTypes = await prisma.jobType.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.jobType`: Exposes CRUD operations for the **JobType** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more JobTypes
    * const jobTypes = await prisma.jobType.findMany()
    * ```
    */
  get jobType(): Prisma.JobTypeDelegate<ExtArgs>;

  /**
   * `prisma.jobTemplate`: Exposes CRUD operations for the **JobTemplate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more JobTemplates
    * const jobTemplates = await prisma.jobTemplate.findMany()
    * ```
    */
  get jobTemplate(): Prisma.JobTemplateDelegate<ExtArgs>;

  /**
   * `prisma.jobTemplateTask`: Exposes CRUD operations for the **JobTemplateTask** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more JobTemplateTasks
    * const jobTemplateTasks = await prisma.jobTemplateTask.findMany()
    * ```
    */
  get jobTemplateTask(): Prisma.JobTemplateTaskDelegate<ExtArgs>;

  /**
   * `prisma.jobCustomFieldDef`: Exposes CRUD operations for the **JobCustomFieldDef** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more JobCustomFieldDefs
    * const jobCustomFieldDefs = await prisma.jobCustomFieldDef.findMany()
    * ```
    */
  get jobCustomFieldDef(): Prisma.JobCustomFieldDefDelegate<ExtArgs>;

  /**
   * `prisma.jobCustomFieldValue`: Exposes CRUD operations for the **JobCustomFieldValue** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more JobCustomFieldValues
    * const jobCustomFieldValues = await prisma.jobCustomFieldValue.findMany()
    * ```
    */
  get jobCustomFieldValue(): Prisma.JobCustomFieldValueDelegate<ExtArgs>;

  /**
   * `prisma.priceBookItem`: Exposes CRUD operations for the **PriceBookItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PriceBookItems
    * const priceBookItems = await prisma.priceBookItem.findMany()
    * ```
    */
  get priceBookItem(): Prisma.PriceBookItemDelegate<ExtArgs>;

  /**
   * `prisma.job`: Exposes CRUD operations for the **Job** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Jobs
    * const jobs = await prisma.job.findMany()
    * ```
    */
  get job(): Prisma.JobDelegate<ExtArgs>;

  /**
   * `prisma.jobStatusHistory`: Exposes CRUD operations for the **JobStatusHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more JobStatusHistories
    * const jobStatusHistories = await prisma.jobStatusHistory.findMany()
    * ```
    */
  get jobStatusHistory(): Prisma.JobStatusHistoryDelegate<ExtArgs>;

  /**
   * `prisma.jobPhoto`: Exposes CRUD operations for the **JobPhoto** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more JobPhotos
    * const jobPhotos = await prisma.jobPhoto.findMany()
    * ```
    */
  get jobPhoto(): Prisma.JobPhotoDelegate<ExtArgs>;

  /**
   * `prisma.workOrder`: Exposes CRUD operations for the **WorkOrder** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkOrders
    * const workOrders = await prisma.workOrder.findMany()
    * ```
    */
  get workOrder(): Prisma.WorkOrderDelegate<ExtArgs>;

  /**
   * `prisma.workOrderTaskCompletion`: Exposes CRUD operations for the **WorkOrderTaskCompletion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkOrderTaskCompletions
    * const workOrderTaskCompletions = await prisma.workOrderTaskCompletion.findMany()
    * ```
    */
  get workOrderTaskCompletion(): Prisma.WorkOrderTaskCompletionDelegate<ExtArgs>;

  /**
   * `prisma.workOrderLineItem`: Exposes CRUD operations for the **WorkOrderLineItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkOrderLineItems
    * const workOrderLineItems = await prisma.workOrderLineItem.findMany()
    * ```
    */
  get workOrderLineItem(): Prisma.WorkOrderLineItemDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
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
    WorkOrderLineItem: 'WorkOrderLineItem'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "jobType" | "jobTemplate" | "jobTemplateTask" | "jobCustomFieldDef" | "jobCustomFieldValue" | "priceBookItem" | "job" | "jobStatusHistory" | "jobPhoto" | "workOrder" | "workOrderTaskCompletion" | "workOrderLineItem"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      JobType: {
        payload: Prisma.$JobTypePayload<ExtArgs>
        fields: Prisma.JobTypeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.JobTypeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.JobTypeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload>
          }
          findFirst: {
            args: Prisma.JobTypeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.JobTypeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload>
          }
          findMany: {
            args: Prisma.JobTypeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload>[]
          }
          create: {
            args: Prisma.JobTypeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload>
          }
          createMany: {
            args: Prisma.JobTypeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.JobTypeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload>[]
          }
          delete: {
            args: Prisma.JobTypeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload>
          }
          update: {
            args: Prisma.JobTypeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload>
          }
          deleteMany: {
            args: Prisma.JobTypeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.JobTypeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.JobTypeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTypePayload>
          }
          aggregate: {
            args: Prisma.JobTypeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateJobType>
          }
          groupBy: {
            args: Prisma.JobTypeGroupByArgs<ExtArgs>
            result: $Utils.Optional<JobTypeGroupByOutputType>[]
          }
          count: {
            args: Prisma.JobTypeCountArgs<ExtArgs>
            result: $Utils.Optional<JobTypeCountAggregateOutputType> | number
          }
        }
      }
      JobTemplate: {
        payload: Prisma.$JobTemplatePayload<ExtArgs>
        fields: Prisma.JobTemplateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.JobTemplateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.JobTemplateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload>
          }
          findFirst: {
            args: Prisma.JobTemplateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.JobTemplateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload>
          }
          findMany: {
            args: Prisma.JobTemplateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload>[]
          }
          create: {
            args: Prisma.JobTemplateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload>
          }
          createMany: {
            args: Prisma.JobTemplateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.JobTemplateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload>[]
          }
          delete: {
            args: Prisma.JobTemplateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload>
          }
          update: {
            args: Prisma.JobTemplateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload>
          }
          deleteMany: {
            args: Prisma.JobTemplateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.JobTemplateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.JobTemplateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplatePayload>
          }
          aggregate: {
            args: Prisma.JobTemplateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateJobTemplate>
          }
          groupBy: {
            args: Prisma.JobTemplateGroupByArgs<ExtArgs>
            result: $Utils.Optional<JobTemplateGroupByOutputType>[]
          }
          count: {
            args: Prisma.JobTemplateCountArgs<ExtArgs>
            result: $Utils.Optional<JobTemplateCountAggregateOutputType> | number
          }
        }
      }
      JobTemplateTask: {
        payload: Prisma.$JobTemplateTaskPayload<ExtArgs>
        fields: Prisma.JobTemplateTaskFieldRefs
        operations: {
          findUnique: {
            args: Prisma.JobTemplateTaskFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.JobTemplateTaskFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload>
          }
          findFirst: {
            args: Prisma.JobTemplateTaskFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.JobTemplateTaskFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload>
          }
          findMany: {
            args: Prisma.JobTemplateTaskFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload>[]
          }
          create: {
            args: Prisma.JobTemplateTaskCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload>
          }
          createMany: {
            args: Prisma.JobTemplateTaskCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.JobTemplateTaskCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload>[]
          }
          delete: {
            args: Prisma.JobTemplateTaskDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload>
          }
          update: {
            args: Prisma.JobTemplateTaskUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload>
          }
          deleteMany: {
            args: Prisma.JobTemplateTaskDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.JobTemplateTaskUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.JobTemplateTaskUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobTemplateTaskPayload>
          }
          aggregate: {
            args: Prisma.JobTemplateTaskAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateJobTemplateTask>
          }
          groupBy: {
            args: Prisma.JobTemplateTaskGroupByArgs<ExtArgs>
            result: $Utils.Optional<JobTemplateTaskGroupByOutputType>[]
          }
          count: {
            args: Prisma.JobTemplateTaskCountArgs<ExtArgs>
            result: $Utils.Optional<JobTemplateTaskCountAggregateOutputType> | number
          }
        }
      }
      JobCustomFieldDef: {
        payload: Prisma.$JobCustomFieldDefPayload<ExtArgs>
        fields: Prisma.JobCustomFieldDefFieldRefs
        operations: {
          findUnique: {
            args: Prisma.JobCustomFieldDefFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.JobCustomFieldDefFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload>
          }
          findFirst: {
            args: Prisma.JobCustomFieldDefFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.JobCustomFieldDefFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload>
          }
          findMany: {
            args: Prisma.JobCustomFieldDefFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload>[]
          }
          create: {
            args: Prisma.JobCustomFieldDefCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload>
          }
          createMany: {
            args: Prisma.JobCustomFieldDefCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.JobCustomFieldDefCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload>[]
          }
          delete: {
            args: Prisma.JobCustomFieldDefDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload>
          }
          update: {
            args: Prisma.JobCustomFieldDefUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload>
          }
          deleteMany: {
            args: Prisma.JobCustomFieldDefDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.JobCustomFieldDefUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.JobCustomFieldDefUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldDefPayload>
          }
          aggregate: {
            args: Prisma.JobCustomFieldDefAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateJobCustomFieldDef>
          }
          groupBy: {
            args: Prisma.JobCustomFieldDefGroupByArgs<ExtArgs>
            result: $Utils.Optional<JobCustomFieldDefGroupByOutputType>[]
          }
          count: {
            args: Prisma.JobCustomFieldDefCountArgs<ExtArgs>
            result: $Utils.Optional<JobCustomFieldDefCountAggregateOutputType> | number
          }
        }
      }
      JobCustomFieldValue: {
        payload: Prisma.$JobCustomFieldValuePayload<ExtArgs>
        fields: Prisma.JobCustomFieldValueFieldRefs
        operations: {
          findUnique: {
            args: Prisma.JobCustomFieldValueFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.JobCustomFieldValueFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload>
          }
          findFirst: {
            args: Prisma.JobCustomFieldValueFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.JobCustomFieldValueFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload>
          }
          findMany: {
            args: Prisma.JobCustomFieldValueFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload>[]
          }
          create: {
            args: Prisma.JobCustomFieldValueCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload>
          }
          createMany: {
            args: Prisma.JobCustomFieldValueCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.JobCustomFieldValueCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload>[]
          }
          delete: {
            args: Prisma.JobCustomFieldValueDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload>
          }
          update: {
            args: Prisma.JobCustomFieldValueUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload>
          }
          deleteMany: {
            args: Prisma.JobCustomFieldValueDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.JobCustomFieldValueUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.JobCustomFieldValueUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobCustomFieldValuePayload>
          }
          aggregate: {
            args: Prisma.JobCustomFieldValueAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateJobCustomFieldValue>
          }
          groupBy: {
            args: Prisma.JobCustomFieldValueGroupByArgs<ExtArgs>
            result: $Utils.Optional<JobCustomFieldValueGroupByOutputType>[]
          }
          count: {
            args: Prisma.JobCustomFieldValueCountArgs<ExtArgs>
            result: $Utils.Optional<JobCustomFieldValueCountAggregateOutputType> | number
          }
        }
      }
      PriceBookItem: {
        payload: Prisma.$PriceBookItemPayload<ExtArgs>
        fields: Prisma.PriceBookItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PriceBookItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PriceBookItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload>
          }
          findFirst: {
            args: Prisma.PriceBookItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PriceBookItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload>
          }
          findMany: {
            args: Prisma.PriceBookItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload>[]
          }
          create: {
            args: Prisma.PriceBookItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload>
          }
          createMany: {
            args: Prisma.PriceBookItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PriceBookItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload>[]
          }
          delete: {
            args: Prisma.PriceBookItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload>
          }
          update: {
            args: Prisma.PriceBookItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload>
          }
          deleteMany: {
            args: Prisma.PriceBookItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PriceBookItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PriceBookItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceBookItemPayload>
          }
          aggregate: {
            args: Prisma.PriceBookItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePriceBookItem>
          }
          groupBy: {
            args: Prisma.PriceBookItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<PriceBookItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.PriceBookItemCountArgs<ExtArgs>
            result: $Utils.Optional<PriceBookItemCountAggregateOutputType> | number
          }
        }
      }
      Job: {
        payload: Prisma.$JobPayload<ExtArgs>
        fields: Prisma.JobFieldRefs
        operations: {
          findUnique: {
            args: Prisma.JobFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.JobFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          findFirst: {
            args: Prisma.JobFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.JobFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          findMany: {
            args: Prisma.JobFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>[]
          }
          create: {
            args: Prisma.JobCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          createMany: {
            args: Prisma.JobCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.JobCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>[]
          }
          delete: {
            args: Prisma.JobDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          update: {
            args: Prisma.JobUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          deleteMany: {
            args: Prisma.JobDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.JobUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.JobUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          aggregate: {
            args: Prisma.JobAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateJob>
          }
          groupBy: {
            args: Prisma.JobGroupByArgs<ExtArgs>
            result: $Utils.Optional<JobGroupByOutputType>[]
          }
          count: {
            args: Prisma.JobCountArgs<ExtArgs>
            result: $Utils.Optional<JobCountAggregateOutputType> | number
          }
        }
      }
      JobStatusHistory: {
        payload: Prisma.$JobStatusHistoryPayload<ExtArgs>
        fields: Prisma.JobStatusHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.JobStatusHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.JobStatusHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload>
          }
          findFirst: {
            args: Prisma.JobStatusHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.JobStatusHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload>
          }
          findMany: {
            args: Prisma.JobStatusHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload>[]
          }
          create: {
            args: Prisma.JobStatusHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload>
          }
          createMany: {
            args: Prisma.JobStatusHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.JobStatusHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload>[]
          }
          delete: {
            args: Prisma.JobStatusHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload>
          }
          update: {
            args: Prisma.JobStatusHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload>
          }
          deleteMany: {
            args: Prisma.JobStatusHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.JobStatusHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.JobStatusHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobStatusHistoryPayload>
          }
          aggregate: {
            args: Prisma.JobStatusHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateJobStatusHistory>
          }
          groupBy: {
            args: Prisma.JobStatusHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<JobStatusHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.JobStatusHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<JobStatusHistoryCountAggregateOutputType> | number
          }
        }
      }
      JobPhoto: {
        payload: Prisma.$JobPhotoPayload<ExtArgs>
        fields: Prisma.JobPhotoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.JobPhotoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.JobPhotoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload>
          }
          findFirst: {
            args: Prisma.JobPhotoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.JobPhotoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload>
          }
          findMany: {
            args: Prisma.JobPhotoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload>[]
          }
          create: {
            args: Prisma.JobPhotoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload>
          }
          createMany: {
            args: Prisma.JobPhotoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.JobPhotoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload>[]
          }
          delete: {
            args: Prisma.JobPhotoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload>
          }
          update: {
            args: Prisma.JobPhotoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload>
          }
          deleteMany: {
            args: Prisma.JobPhotoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.JobPhotoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.JobPhotoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPhotoPayload>
          }
          aggregate: {
            args: Prisma.JobPhotoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateJobPhoto>
          }
          groupBy: {
            args: Prisma.JobPhotoGroupByArgs<ExtArgs>
            result: $Utils.Optional<JobPhotoGroupByOutputType>[]
          }
          count: {
            args: Prisma.JobPhotoCountArgs<ExtArgs>
            result: $Utils.Optional<JobPhotoCountAggregateOutputType> | number
          }
        }
      }
      WorkOrder: {
        payload: Prisma.$WorkOrderPayload<ExtArgs>
        fields: Prisma.WorkOrderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkOrderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkOrderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload>
          }
          findFirst: {
            args: Prisma.WorkOrderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkOrderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload>
          }
          findMany: {
            args: Prisma.WorkOrderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload>[]
          }
          create: {
            args: Prisma.WorkOrderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload>
          }
          createMany: {
            args: Prisma.WorkOrderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkOrderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload>[]
          }
          delete: {
            args: Prisma.WorkOrderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload>
          }
          update: {
            args: Prisma.WorkOrderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload>
          }
          deleteMany: {
            args: Prisma.WorkOrderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkOrderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WorkOrderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderPayload>
          }
          aggregate: {
            args: Prisma.WorkOrderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkOrder>
          }
          groupBy: {
            args: Prisma.WorkOrderGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkOrderGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkOrderCountArgs<ExtArgs>
            result: $Utils.Optional<WorkOrderCountAggregateOutputType> | number
          }
        }
      }
      WorkOrderTaskCompletion: {
        payload: Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>
        fields: Prisma.WorkOrderTaskCompletionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkOrderTaskCompletionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkOrderTaskCompletionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload>
          }
          findFirst: {
            args: Prisma.WorkOrderTaskCompletionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkOrderTaskCompletionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload>
          }
          findMany: {
            args: Prisma.WorkOrderTaskCompletionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload>[]
          }
          create: {
            args: Prisma.WorkOrderTaskCompletionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload>
          }
          createMany: {
            args: Prisma.WorkOrderTaskCompletionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkOrderTaskCompletionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload>[]
          }
          delete: {
            args: Prisma.WorkOrderTaskCompletionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload>
          }
          update: {
            args: Prisma.WorkOrderTaskCompletionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload>
          }
          deleteMany: {
            args: Prisma.WorkOrderTaskCompletionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkOrderTaskCompletionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WorkOrderTaskCompletionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderTaskCompletionPayload>
          }
          aggregate: {
            args: Prisma.WorkOrderTaskCompletionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkOrderTaskCompletion>
          }
          groupBy: {
            args: Prisma.WorkOrderTaskCompletionGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkOrderTaskCompletionGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkOrderTaskCompletionCountArgs<ExtArgs>
            result: $Utils.Optional<WorkOrderTaskCompletionCountAggregateOutputType> | number
          }
        }
      }
      WorkOrderLineItem: {
        payload: Prisma.$WorkOrderLineItemPayload<ExtArgs>
        fields: Prisma.WorkOrderLineItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkOrderLineItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkOrderLineItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload>
          }
          findFirst: {
            args: Prisma.WorkOrderLineItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkOrderLineItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload>
          }
          findMany: {
            args: Prisma.WorkOrderLineItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload>[]
          }
          create: {
            args: Prisma.WorkOrderLineItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload>
          }
          createMany: {
            args: Prisma.WorkOrderLineItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkOrderLineItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload>[]
          }
          delete: {
            args: Prisma.WorkOrderLineItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload>
          }
          update: {
            args: Prisma.WorkOrderLineItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload>
          }
          deleteMany: {
            args: Prisma.WorkOrderLineItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkOrderLineItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WorkOrderLineItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkOrderLineItemPayload>
          }
          aggregate: {
            args: Prisma.WorkOrderLineItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkOrderLineItem>
          }
          groupBy: {
            args: Prisma.WorkOrderLineItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkOrderLineItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkOrderLineItemCountArgs<ExtArgs>
            result: $Utils.Optional<WorkOrderLineItemCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type JobTypeCountOutputType
   */

  export type JobTypeCountOutputType = {
    templates: number
    customFieldDefs: number
    jobs: number
  }

  export type JobTypeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    templates?: boolean | JobTypeCountOutputTypeCountTemplatesArgs
    customFieldDefs?: boolean | JobTypeCountOutputTypeCountCustomFieldDefsArgs
    jobs?: boolean | JobTypeCountOutputTypeCountJobsArgs
  }

  // Custom InputTypes
  /**
   * JobTypeCountOutputType without action
   */
  export type JobTypeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTypeCountOutputType
     */
    select?: JobTypeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * JobTypeCountOutputType without action
   */
  export type JobTypeCountOutputTypeCountTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobTemplateWhereInput
  }

  /**
   * JobTypeCountOutputType without action
   */
  export type JobTypeCountOutputTypeCountCustomFieldDefsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobCustomFieldDefWhereInput
  }

  /**
   * JobTypeCountOutputType without action
   */
  export type JobTypeCountOutputTypeCountJobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobWhereInput
  }


  /**
   * Count Type JobTemplateCountOutputType
   */

  export type JobTemplateCountOutputType = {
    tasks: number
    jobs: number
  }

  export type JobTemplateCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tasks?: boolean | JobTemplateCountOutputTypeCountTasksArgs
    jobs?: boolean | JobTemplateCountOutputTypeCountJobsArgs
  }

  // Custom InputTypes
  /**
   * JobTemplateCountOutputType without action
   */
  export type JobTemplateCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateCountOutputType
     */
    select?: JobTemplateCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * JobTemplateCountOutputType without action
   */
  export type JobTemplateCountOutputTypeCountTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobTemplateTaskWhereInput
  }

  /**
   * JobTemplateCountOutputType without action
   */
  export type JobTemplateCountOutputTypeCountJobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobWhereInput
  }


  /**
   * Count Type JobCustomFieldDefCountOutputType
   */

  export type JobCustomFieldDefCountOutputType = {
    values: number
  }

  export type JobCustomFieldDefCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    values?: boolean | JobCustomFieldDefCountOutputTypeCountValuesArgs
  }

  // Custom InputTypes
  /**
   * JobCustomFieldDefCountOutputType without action
   */
  export type JobCustomFieldDefCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDefCountOutputType
     */
    select?: JobCustomFieldDefCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * JobCustomFieldDefCountOutputType without action
   */
  export type JobCustomFieldDefCountOutputTypeCountValuesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobCustomFieldValueWhereInput
  }


  /**
   * Count Type PriceBookItemCountOutputType
   */

  export type PriceBookItemCountOutputType = {
    lineItems: number
  }

  export type PriceBookItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lineItems?: boolean | PriceBookItemCountOutputTypeCountLineItemsArgs
  }

  // Custom InputTypes
  /**
   * PriceBookItemCountOutputType without action
   */
  export type PriceBookItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItemCountOutputType
     */
    select?: PriceBookItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PriceBookItemCountOutputType without action
   */
  export type PriceBookItemCountOutputTypeCountLineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkOrderLineItemWhereInput
  }


  /**
   * Count Type JobCountOutputType
   */

  export type JobCountOutputType = {
    workOrders: number
    customFieldValues: number
    statusHistory: number
    photos: number
  }

  export type JobCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workOrders?: boolean | JobCountOutputTypeCountWorkOrdersArgs
    customFieldValues?: boolean | JobCountOutputTypeCountCustomFieldValuesArgs
    statusHistory?: boolean | JobCountOutputTypeCountStatusHistoryArgs
    photos?: boolean | JobCountOutputTypeCountPhotosArgs
  }

  // Custom InputTypes
  /**
   * JobCountOutputType without action
   */
  export type JobCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCountOutputType
     */
    select?: JobCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * JobCountOutputType without action
   */
  export type JobCountOutputTypeCountWorkOrdersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkOrderWhereInput
  }

  /**
   * JobCountOutputType without action
   */
  export type JobCountOutputTypeCountCustomFieldValuesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobCustomFieldValueWhereInput
  }

  /**
   * JobCountOutputType without action
   */
  export type JobCountOutputTypeCountStatusHistoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobStatusHistoryWhereInput
  }

  /**
   * JobCountOutputType without action
   */
  export type JobCountOutputTypeCountPhotosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobPhotoWhereInput
  }


  /**
   * Count Type WorkOrderCountOutputType
   */

  export type WorkOrderCountOutputType = {
    lineItems: number
    taskCompletions: number
  }

  export type WorkOrderCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lineItems?: boolean | WorkOrderCountOutputTypeCountLineItemsArgs
    taskCompletions?: boolean | WorkOrderCountOutputTypeCountTaskCompletionsArgs
  }

  // Custom InputTypes
  /**
   * WorkOrderCountOutputType without action
   */
  export type WorkOrderCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderCountOutputType
     */
    select?: WorkOrderCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WorkOrderCountOutputType without action
   */
  export type WorkOrderCountOutputTypeCountLineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkOrderLineItemWhereInput
  }

  /**
   * WorkOrderCountOutputType without action
   */
  export type WorkOrderCountOutputTypeCountTaskCompletionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkOrderTaskCompletionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model JobType
   */

  export type AggregateJobType = {
    _count: JobTypeCountAggregateOutputType | null
    _avg: JobTypeAvgAggregateOutputType | null
    _sum: JobTypeSumAggregateOutputType | null
    _min: JobTypeMinAggregateOutputType | null
    _max: JobTypeMaxAggregateOutputType | null
  }

  export type JobTypeAvgAggregateOutputType = {
    sortOrder: number | null
  }

  export type JobTypeSumAggregateOutputType = {
    sortOrder: number | null
  }

  export type JobTypeMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    slug: string | null
    description: string | null
    icon: string | null
    color: string | null
    isActive: boolean | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type JobTypeMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    slug: string | null
    description: string | null
    icon: string | null
    color: string | null
    isActive: boolean | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type JobTypeCountAggregateOutputType = {
    id: number
    companyId: number
    name: number
    slug: number
    description: number
    icon: number
    color: number
    isActive: number
    sortOrder: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type JobTypeAvgAggregateInputType = {
    sortOrder?: true
  }

  export type JobTypeSumAggregateInputType = {
    sortOrder?: true
  }

  export type JobTypeMinAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    slug?: true
    description?: true
    icon?: true
    color?: true
    isActive?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type JobTypeMaxAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    slug?: true
    description?: true
    icon?: true
    color?: true
    isActive?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type JobTypeCountAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    slug?: true
    description?: true
    icon?: true
    color?: true
    isActive?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type JobTypeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobType to aggregate.
     */
    where?: JobTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTypes to fetch.
     */
    orderBy?: JobTypeOrderByWithRelationInput | JobTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: JobTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned JobTypes
    **/
    _count?: true | JobTypeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: JobTypeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: JobTypeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: JobTypeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: JobTypeMaxAggregateInputType
  }

  export type GetJobTypeAggregateType<T extends JobTypeAggregateArgs> = {
        [P in keyof T & keyof AggregateJobType]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateJobType[P]>
      : GetScalarType<T[P], AggregateJobType[P]>
  }




  export type JobTypeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobTypeWhereInput
    orderBy?: JobTypeOrderByWithAggregationInput | JobTypeOrderByWithAggregationInput[]
    by: JobTypeScalarFieldEnum[] | JobTypeScalarFieldEnum
    having?: JobTypeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: JobTypeCountAggregateInputType | true
    _avg?: JobTypeAvgAggregateInputType
    _sum?: JobTypeSumAggregateInputType
    _min?: JobTypeMinAggregateInputType
    _max?: JobTypeMaxAggregateInputType
  }

  export type JobTypeGroupByOutputType = {
    id: string
    companyId: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    color: string | null
    isActive: boolean
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    _count: JobTypeCountAggregateOutputType | null
    _avg: JobTypeAvgAggregateOutputType | null
    _sum: JobTypeSumAggregateOutputType | null
    _min: JobTypeMinAggregateOutputType | null
    _max: JobTypeMaxAggregateOutputType | null
  }

  type GetJobTypeGroupByPayload<T extends JobTypeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<JobTypeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof JobTypeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], JobTypeGroupByOutputType[P]>
            : GetScalarType<T[P], JobTypeGroupByOutputType[P]>
        }
      >
    >


  export type JobTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
    color?: boolean
    isActive?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    templates?: boolean | JobType$templatesArgs<ExtArgs>
    customFieldDefs?: boolean | JobType$customFieldDefsArgs<ExtArgs>
    jobs?: boolean | JobType$jobsArgs<ExtArgs>
    _count?: boolean | JobTypeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobType"]>

  export type JobTypeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
    color?: boolean
    isActive?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["jobType"]>

  export type JobTypeSelectScalar = {
    id?: boolean
    companyId?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
    color?: boolean
    isActive?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type JobTypeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    templates?: boolean | JobType$templatesArgs<ExtArgs>
    customFieldDefs?: boolean | JobType$customFieldDefsArgs<ExtArgs>
    jobs?: boolean | JobType$jobsArgs<ExtArgs>
    _count?: boolean | JobTypeCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type JobTypeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $JobTypePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "JobType"
    objects: {
      templates: Prisma.$JobTemplatePayload<ExtArgs>[]
      customFieldDefs: Prisma.$JobCustomFieldDefPayload<ExtArgs>[]
      jobs: Prisma.$JobPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      name: string
      slug: string
      description: string | null
      icon: string | null
      color: string | null
      isActive: boolean
      sortOrder: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["jobType"]>
    composites: {}
  }

  type JobTypeGetPayload<S extends boolean | null | undefined | JobTypeDefaultArgs> = $Result.GetResult<Prisma.$JobTypePayload, S>

  type JobTypeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<JobTypeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: JobTypeCountAggregateInputType | true
    }

  export interface JobTypeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['JobType'], meta: { name: 'JobType' } }
    /**
     * Find zero or one JobType that matches the filter.
     * @param {JobTypeFindUniqueArgs} args - Arguments to find a JobType
     * @example
     * // Get one JobType
     * const jobType = await prisma.jobType.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends JobTypeFindUniqueArgs>(args: SelectSubset<T, JobTypeFindUniqueArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one JobType that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {JobTypeFindUniqueOrThrowArgs} args - Arguments to find a JobType
     * @example
     * // Get one JobType
     * const jobType = await prisma.jobType.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends JobTypeFindUniqueOrThrowArgs>(args: SelectSubset<T, JobTypeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first JobType that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTypeFindFirstArgs} args - Arguments to find a JobType
     * @example
     * // Get one JobType
     * const jobType = await prisma.jobType.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends JobTypeFindFirstArgs>(args?: SelectSubset<T, JobTypeFindFirstArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first JobType that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTypeFindFirstOrThrowArgs} args - Arguments to find a JobType
     * @example
     * // Get one JobType
     * const jobType = await prisma.jobType.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends JobTypeFindFirstOrThrowArgs>(args?: SelectSubset<T, JobTypeFindFirstOrThrowArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more JobTypes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTypeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all JobTypes
     * const jobTypes = await prisma.jobType.findMany()
     * 
     * // Get first 10 JobTypes
     * const jobTypes = await prisma.jobType.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const jobTypeWithIdOnly = await prisma.jobType.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends JobTypeFindManyArgs>(args?: SelectSubset<T, JobTypeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a JobType.
     * @param {JobTypeCreateArgs} args - Arguments to create a JobType.
     * @example
     * // Create one JobType
     * const JobType = await prisma.jobType.create({
     *   data: {
     *     // ... data to create a JobType
     *   }
     * })
     * 
     */
    create<T extends JobTypeCreateArgs>(args: SelectSubset<T, JobTypeCreateArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many JobTypes.
     * @param {JobTypeCreateManyArgs} args - Arguments to create many JobTypes.
     * @example
     * // Create many JobTypes
     * const jobType = await prisma.jobType.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends JobTypeCreateManyArgs>(args?: SelectSubset<T, JobTypeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many JobTypes and returns the data saved in the database.
     * @param {JobTypeCreateManyAndReturnArgs} args - Arguments to create many JobTypes.
     * @example
     * // Create many JobTypes
     * const jobType = await prisma.jobType.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many JobTypes and only return the `id`
     * const jobTypeWithIdOnly = await prisma.jobType.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends JobTypeCreateManyAndReturnArgs>(args?: SelectSubset<T, JobTypeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a JobType.
     * @param {JobTypeDeleteArgs} args - Arguments to delete one JobType.
     * @example
     * // Delete one JobType
     * const JobType = await prisma.jobType.delete({
     *   where: {
     *     // ... filter to delete one JobType
     *   }
     * })
     * 
     */
    delete<T extends JobTypeDeleteArgs>(args: SelectSubset<T, JobTypeDeleteArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one JobType.
     * @param {JobTypeUpdateArgs} args - Arguments to update one JobType.
     * @example
     * // Update one JobType
     * const jobType = await prisma.jobType.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends JobTypeUpdateArgs>(args: SelectSubset<T, JobTypeUpdateArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more JobTypes.
     * @param {JobTypeDeleteManyArgs} args - Arguments to filter JobTypes to delete.
     * @example
     * // Delete a few JobTypes
     * const { count } = await prisma.jobType.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends JobTypeDeleteManyArgs>(args?: SelectSubset<T, JobTypeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more JobTypes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTypeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many JobTypes
     * const jobType = await prisma.jobType.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends JobTypeUpdateManyArgs>(args: SelectSubset<T, JobTypeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one JobType.
     * @param {JobTypeUpsertArgs} args - Arguments to update or create a JobType.
     * @example
     * // Update or create a JobType
     * const jobType = await prisma.jobType.upsert({
     *   create: {
     *     // ... data to create a JobType
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the JobType we want to update
     *   }
     * })
     */
    upsert<T extends JobTypeUpsertArgs>(args: SelectSubset<T, JobTypeUpsertArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of JobTypes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTypeCountArgs} args - Arguments to filter JobTypes to count.
     * @example
     * // Count the number of JobTypes
     * const count = await prisma.jobType.count({
     *   where: {
     *     // ... the filter for the JobTypes we want to count
     *   }
     * })
    **/
    count<T extends JobTypeCountArgs>(
      args?: Subset<T, JobTypeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], JobTypeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a JobType.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTypeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends JobTypeAggregateArgs>(args: Subset<T, JobTypeAggregateArgs>): Prisma.PrismaPromise<GetJobTypeAggregateType<T>>

    /**
     * Group by JobType.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTypeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends JobTypeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: JobTypeGroupByArgs['orderBy'] }
        : { orderBy?: JobTypeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, JobTypeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobTypeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the JobType model
   */
  readonly fields: JobTypeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for JobType.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__JobTypeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    templates<T extends JobType$templatesArgs<ExtArgs> = {}>(args?: Subset<T, JobType$templatesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "findMany"> | Null>
    customFieldDefs<T extends JobType$customFieldDefsArgs<ExtArgs> = {}>(args?: Subset<T, JobType$customFieldDefsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "findMany"> | Null>
    jobs<T extends JobType$jobsArgs<ExtArgs> = {}>(args?: Subset<T, JobType$jobsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the JobType model
   */ 
  interface JobTypeFieldRefs {
    readonly id: FieldRef<"JobType", 'String'>
    readonly companyId: FieldRef<"JobType", 'String'>
    readonly name: FieldRef<"JobType", 'String'>
    readonly slug: FieldRef<"JobType", 'String'>
    readonly description: FieldRef<"JobType", 'String'>
    readonly icon: FieldRef<"JobType", 'String'>
    readonly color: FieldRef<"JobType", 'String'>
    readonly isActive: FieldRef<"JobType", 'Boolean'>
    readonly sortOrder: FieldRef<"JobType", 'Int'>
    readonly createdAt: FieldRef<"JobType", 'DateTime'>
    readonly updatedAt: FieldRef<"JobType", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * JobType findUnique
   */
  export type JobTypeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    /**
     * Filter, which JobType to fetch.
     */
    where: JobTypeWhereUniqueInput
  }

  /**
   * JobType findUniqueOrThrow
   */
  export type JobTypeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    /**
     * Filter, which JobType to fetch.
     */
    where: JobTypeWhereUniqueInput
  }

  /**
   * JobType findFirst
   */
  export type JobTypeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    /**
     * Filter, which JobType to fetch.
     */
    where?: JobTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTypes to fetch.
     */
    orderBy?: JobTypeOrderByWithRelationInput | JobTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobTypes.
     */
    cursor?: JobTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobTypes.
     */
    distinct?: JobTypeScalarFieldEnum | JobTypeScalarFieldEnum[]
  }

  /**
   * JobType findFirstOrThrow
   */
  export type JobTypeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    /**
     * Filter, which JobType to fetch.
     */
    where?: JobTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTypes to fetch.
     */
    orderBy?: JobTypeOrderByWithRelationInput | JobTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobTypes.
     */
    cursor?: JobTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobTypes.
     */
    distinct?: JobTypeScalarFieldEnum | JobTypeScalarFieldEnum[]
  }

  /**
   * JobType findMany
   */
  export type JobTypeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    /**
     * Filter, which JobTypes to fetch.
     */
    where?: JobTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTypes to fetch.
     */
    orderBy?: JobTypeOrderByWithRelationInput | JobTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing JobTypes.
     */
    cursor?: JobTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTypes.
     */
    skip?: number
    distinct?: JobTypeScalarFieldEnum | JobTypeScalarFieldEnum[]
  }

  /**
   * JobType create
   */
  export type JobTypeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    /**
     * The data needed to create a JobType.
     */
    data: XOR<JobTypeCreateInput, JobTypeUncheckedCreateInput>
  }

  /**
   * JobType createMany
   */
  export type JobTypeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many JobTypes.
     */
    data: JobTypeCreateManyInput | JobTypeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * JobType createManyAndReturn
   */
  export type JobTypeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many JobTypes.
     */
    data: JobTypeCreateManyInput | JobTypeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * JobType update
   */
  export type JobTypeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    /**
     * The data needed to update a JobType.
     */
    data: XOR<JobTypeUpdateInput, JobTypeUncheckedUpdateInput>
    /**
     * Choose, which JobType to update.
     */
    where: JobTypeWhereUniqueInput
  }

  /**
   * JobType updateMany
   */
  export type JobTypeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update JobTypes.
     */
    data: XOR<JobTypeUpdateManyMutationInput, JobTypeUncheckedUpdateManyInput>
    /**
     * Filter which JobTypes to update
     */
    where?: JobTypeWhereInput
  }

  /**
   * JobType upsert
   */
  export type JobTypeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    /**
     * The filter to search for the JobType to update in case it exists.
     */
    where: JobTypeWhereUniqueInput
    /**
     * In case the JobType found by the `where` argument doesn't exist, create a new JobType with this data.
     */
    create: XOR<JobTypeCreateInput, JobTypeUncheckedCreateInput>
    /**
     * In case the JobType was found with the provided `where` argument, update it with this data.
     */
    update: XOR<JobTypeUpdateInput, JobTypeUncheckedUpdateInput>
  }

  /**
   * JobType delete
   */
  export type JobTypeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    /**
     * Filter which JobType to delete.
     */
    where: JobTypeWhereUniqueInput
  }

  /**
   * JobType deleteMany
   */
  export type JobTypeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobTypes to delete
     */
    where?: JobTypeWhereInput
  }

  /**
   * JobType.templates
   */
  export type JobType$templatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    where?: JobTemplateWhereInput
    orderBy?: JobTemplateOrderByWithRelationInput | JobTemplateOrderByWithRelationInput[]
    cursor?: JobTemplateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: JobTemplateScalarFieldEnum | JobTemplateScalarFieldEnum[]
  }

  /**
   * JobType.customFieldDefs
   */
  export type JobType$customFieldDefsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    where?: JobCustomFieldDefWhereInput
    orderBy?: JobCustomFieldDefOrderByWithRelationInput | JobCustomFieldDefOrderByWithRelationInput[]
    cursor?: JobCustomFieldDefWhereUniqueInput
    take?: number
    skip?: number
    distinct?: JobCustomFieldDefScalarFieldEnum | JobCustomFieldDefScalarFieldEnum[]
  }

  /**
   * JobType.jobs
   */
  export type JobType$jobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    where?: JobWhereInput
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    cursor?: JobWhereUniqueInput
    take?: number
    skip?: number
    distinct?: JobScalarFieldEnum | JobScalarFieldEnum[]
  }

  /**
   * JobType without action
   */
  export type JobTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
  }


  /**
   * Model JobTemplate
   */

  export type AggregateJobTemplate = {
    _count: JobTemplateCountAggregateOutputType | null
    _avg: JobTemplateAvgAggregateOutputType | null
    _sum: JobTemplateSumAggregateOutputType | null
    _min: JobTemplateMinAggregateOutputType | null
    _max: JobTemplateMaxAggregateOutputType | null
  }

  export type JobTemplateAvgAggregateOutputType = {
    estimatedDurationMins: number | null
    version: number | null
  }

  export type JobTemplateSumAggregateOutputType = {
    estimatedDurationMins: number | null
    version: number | null
  }

  export type JobTemplateMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobTypeId: string | null
    name: string | null
    description: string | null
    estimatedDurationMins: number | null
    version: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type JobTemplateMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobTypeId: string | null
    name: string | null
    description: string | null
    estimatedDurationMins: number | null
    version: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type JobTemplateCountAggregateOutputType = {
    id: number
    companyId: number
    jobTypeId: number
    name: number
    description: number
    estimatedDurationMins: number
    version: number
    isActive: number
    requiredParts: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type JobTemplateAvgAggregateInputType = {
    estimatedDurationMins?: true
    version?: true
  }

  export type JobTemplateSumAggregateInputType = {
    estimatedDurationMins?: true
    version?: true
  }

  export type JobTemplateMinAggregateInputType = {
    id?: true
    companyId?: true
    jobTypeId?: true
    name?: true
    description?: true
    estimatedDurationMins?: true
    version?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type JobTemplateMaxAggregateInputType = {
    id?: true
    companyId?: true
    jobTypeId?: true
    name?: true
    description?: true
    estimatedDurationMins?: true
    version?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type JobTemplateCountAggregateInputType = {
    id?: true
    companyId?: true
    jobTypeId?: true
    name?: true
    description?: true
    estimatedDurationMins?: true
    version?: true
    isActive?: true
    requiredParts?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type JobTemplateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobTemplate to aggregate.
     */
    where?: JobTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTemplates to fetch.
     */
    orderBy?: JobTemplateOrderByWithRelationInput | JobTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: JobTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned JobTemplates
    **/
    _count?: true | JobTemplateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: JobTemplateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: JobTemplateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: JobTemplateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: JobTemplateMaxAggregateInputType
  }

  export type GetJobTemplateAggregateType<T extends JobTemplateAggregateArgs> = {
        [P in keyof T & keyof AggregateJobTemplate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateJobTemplate[P]>
      : GetScalarType<T[P], AggregateJobTemplate[P]>
  }




  export type JobTemplateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobTemplateWhereInput
    orderBy?: JobTemplateOrderByWithAggregationInput | JobTemplateOrderByWithAggregationInput[]
    by: JobTemplateScalarFieldEnum[] | JobTemplateScalarFieldEnum
    having?: JobTemplateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: JobTemplateCountAggregateInputType | true
    _avg?: JobTemplateAvgAggregateInputType
    _sum?: JobTemplateSumAggregateInputType
    _min?: JobTemplateMinAggregateInputType
    _max?: JobTemplateMaxAggregateInputType
  }

  export type JobTemplateGroupByOutputType = {
    id: string
    companyId: string
    jobTypeId: string
    name: string
    description: string | null
    estimatedDurationMins: number
    version: number
    isActive: boolean
    requiredParts: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: JobTemplateCountAggregateOutputType | null
    _avg: JobTemplateAvgAggregateOutputType | null
    _sum: JobTemplateSumAggregateOutputType | null
    _min: JobTemplateMinAggregateOutputType | null
    _max: JobTemplateMaxAggregateOutputType | null
  }

  type GetJobTemplateGroupByPayload<T extends JobTemplateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<JobTemplateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof JobTemplateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], JobTemplateGroupByOutputType[P]>
            : GetScalarType<T[P], JobTemplateGroupByOutputType[P]>
        }
      >
    >


  export type JobTemplateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobTypeId?: boolean
    name?: boolean
    description?: boolean
    estimatedDurationMins?: boolean
    version?: boolean
    isActive?: boolean
    requiredParts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    jobType?: boolean | JobTypeDefaultArgs<ExtArgs>
    tasks?: boolean | JobTemplate$tasksArgs<ExtArgs>
    jobs?: boolean | JobTemplate$jobsArgs<ExtArgs>
    _count?: boolean | JobTemplateCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobTemplate"]>

  export type JobTemplateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobTypeId?: boolean
    name?: boolean
    description?: boolean
    estimatedDurationMins?: boolean
    version?: boolean
    isActive?: boolean
    requiredParts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    jobType?: boolean | JobTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobTemplate"]>

  export type JobTemplateSelectScalar = {
    id?: boolean
    companyId?: boolean
    jobTypeId?: boolean
    name?: boolean
    description?: boolean
    estimatedDurationMins?: boolean
    version?: boolean
    isActive?: boolean
    requiredParts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type JobTemplateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobType?: boolean | JobTypeDefaultArgs<ExtArgs>
    tasks?: boolean | JobTemplate$tasksArgs<ExtArgs>
    jobs?: boolean | JobTemplate$jobsArgs<ExtArgs>
    _count?: boolean | JobTemplateCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type JobTemplateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobType?: boolean | JobTypeDefaultArgs<ExtArgs>
  }

  export type $JobTemplatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "JobTemplate"
    objects: {
      jobType: Prisma.$JobTypePayload<ExtArgs>
      tasks: Prisma.$JobTemplateTaskPayload<ExtArgs>[]
      jobs: Prisma.$JobPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      jobTypeId: string
      name: string
      description: string | null
      estimatedDurationMins: number
      version: number
      isActive: boolean
      requiredParts: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["jobTemplate"]>
    composites: {}
  }

  type JobTemplateGetPayload<S extends boolean | null | undefined | JobTemplateDefaultArgs> = $Result.GetResult<Prisma.$JobTemplatePayload, S>

  type JobTemplateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<JobTemplateFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: JobTemplateCountAggregateInputType | true
    }

  export interface JobTemplateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['JobTemplate'], meta: { name: 'JobTemplate' } }
    /**
     * Find zero or one JobTemplate that matches the filter.
     * @param {JobTemplateFindUniqueArgs} args - Arguments to find a JobTemplate
     * @example
     * // Get one JobTemplate
     * const jobTemplate = await prisma.jobTemplate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends JobTemplateFindUniqueArgs>(args: SelectSubset<T, JobTemplateFindUniqueArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one JobTemplate that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {JobTemplateFindUniqueOrThrowArgs} args - Arguments to find a JobTemplate
     * @example
     * // Get one JobTemplate
     * const jobTemplate = await prisma.jobTemplate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends JobTemplateFindUniqueOrThrowArgs>(args: SelectSubset<T, JobTemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first JobTemplate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateFindFirstArgs} args - Arguments to find a JobTemplate
     * @example
     * // Get one JobTemplate
     * const jobTemplate = await prisma.jobTemplate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends JobTemplateFindFirstArgs>(args?: SelectSubset<T, JobTemplateFindFirstArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first JobTemplate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateFindFirstOrThrowArgs} args - Arguments to find a JobTemplate
     * @example
     * // Get one JobTemplate
     * const jobTemplate = await prisma.jobTemplate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends JobTemplateFindFirstOrThrowArgs>(args?: SelectSubset<T, JobTemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more JobTemplates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all JobTemplates
     * const jobTemplates = await prisma.jobTemplate.findMany()
     * 
     * // Get first 10 JobTemplates
     * const jobTemplates = await prisma.jobTemplate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const jobTemplateWithIdOnly = await prisma.jobTemplate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends JobTemplateFindManyArgs>(args?: SelectSubset<T, JobTemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a JobTemplate.
     * @param {JobTemplateCreateArgs} args - Arguments to create a JobTemplate.
     * @example
     * // Create one JobTemplate
     * const JobTemplate = await prisma.jobTemplate.create({
     *   data: {
     *     // ... data to create a JobTemplate
     *   }
     * })
     * 
     */
    create<T extends JobTemplateCreateArgs>(args: SelectSubset<T, JobTemplateCreateArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many JobTemplates.
     * @param {JobTemplateCreateManyArgs} args - Arguments to create many JobTemplates.
     * @example
     * // Create many JobTemplates
     * const jobTemplate = await prisma.jobTemplate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends JobTemplateCreateManyArgs>(args?: SelectSubset<T, JobTemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many JobTemplates and returns the data saved in the database.
     * @param {JobTemplateCreateManyAndReturnArgs} args - Arguments to create many JobTemplates.
     * @example
     * // Create many JobTemplates
     * const jobTemplate = await prisma.jobTemplate.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many JobTemplates and only return the `id`
     * const jobTemplateWithIdOnly = await prisma.jobTemplate.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends JobTemplateCreateManyAndReturnArgs>(args?: SelectSubset<T, JobTemplateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a JobTemplate.
     * @param {JobTemplateDeleteArgs} args - Arguments to delete one JobTemplate.
     * @example
     * // Delete one JobTemplate
     * const JobTemplate = await prisma.jobTemplate.delete({
     *   where: {
     *     // ... filter to delete one JobTemplate
     *   }
     * })
     * 
     */
    delete<T extends JobTemplateDeleteArgs>(args: SelectSubset<T, JobTemplateDeleteArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one JobTemplate.
     * @param {JobTemplateUpdateArgs} args - Arguments to update one JobTemplate.
     * @example
     * // Update one JobTemplate
     * const jobTemplate = await prisma.jobTemplate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends JobTemplateUpdateArgs>(args: SelectSubset<T, JobTemplateUpdateArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more JobTemplates.
     * @param {JobTemplateDeleteManyArgs} args - Arguments to filter JobTemplates to delete.
     * @example
     * // Delete a few JobTemplates
     * const { count } = await prisma.jobTemplate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends JobTemplateDeleteManyArgs>(args?: SelectSubset<T, JobTemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more JobTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many JobTemplates
     * const jobTemplate = await prisma.jobTemplate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends JobTemplateUpdateManyArgs>(args: SelectSubset<T, JobTemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one JobTemplate.
     * @param {JobTemplateUpsertArgs} args - Arguments to update or create a JobTemplate.
     * @example
     * // Update or create a JobTemplate
     * const jobTemplate = await prisma.jobTemplate.upsert({
     *   create: {
     *     // ... data to create a JobTemplate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the JobTemplate we want to update
     *   }
     * })
     */
    upsert<T extends JobTemplateUpsertArgs>(args: SelectSubset<T, JobTemplateUpsertArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of JobTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateCountArgs} args - Arguments to filter JobTemplates to count.
     * @example
     * // Count the number of JobTemplates
     * const count = await prisma.jobTemplate.count({
     *   where: {
     *     // ... the filter for the JobTemplates we want to count
     *   }
     * })
    **/
    count<T extends JobTemplateCountArgs>(
      args?: Subset<T, JobTemplateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], JobTemplateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a JobTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends JobTemplateAggregateArgs>(args: Subset<T, JobTemplateAggregateArgs>): Prisma.PrismaPromise<GetJobTemplateAggregateType<T>>

    /**
     * Group by JobTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends JobTemplateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: JobTemplateGroupByArgs['orderBy'] }
        : { orderBy?: JobTemplateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, JobTemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the JobTemplate model
   */
  readonly fields: JobTemplateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for JobTemplate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__JobTemplateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    jobType<T extends JobTypeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, JobTypeDefaultArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    tasks<T extends JobTemplate$tasksArgs<ExtArgs> = {}>(args?: Subset<T, JobTemplate$tasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "findMany"> | Null>
    jobs<T extends JobTemplate$jobsArgs<ExtArgs> = {}>(args?: Subset<T, JobTemplate$jobsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the JobTemplate model
   */ 
  interface JobTemplateFieldRefs {
    readonly id: FieldRef<"JobTemplate", 'String'>
    readonly companyId: FieldRef<"JobTemplate", 'String'>
    readonly jobTypeId: FieldRef<"JobTemplate", 'String'>
    readonly name: FieldRef<"JobTemplate", 'String'>
    readonly description: FieldRef<"JobTemplate", 'String'>
    readonly estimatedDurationMins: FieldRef<"JobTemplate", 'Int'>
    readonly version: FieldRef<"JobTemplate", 'Int'>
    readonly isActive: FieldRef<"JobTemplate", 'Boolean'>
    readonly requiredParts: FieldRef<"JobTemplate", 'Json'>
    readonly createdAt: FieldRef<"JobTemplate", 'DateTime'>
    readonly updatedAt: FieldRef<"JobTemplate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * JobTemplate findUnique
   */
  export type JobTemplateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplate to fetch.
     */
    where: JobTemplateWhereUniqueInput
  }

  /**
   * JobTemplate findUniqueOrThrow
   */
  export type JobTemplateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplate to fetch.
     */
    where: JobTemplateWhereUniqueInput
  }

  /**
   * JobTemplate findFirst
   */
  export type JobTemplateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplate to fetch.
     */
    where?: JobTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTemplates to fetch.
     */
    orderBy?: JobTemplateOrderByWithRelationInput | JobTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobTemplates.
     */
    cursor?: JobTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobTemplates.
     */
    distinct?: JobTemplateScalarFieldEnum | JobTemplateScalarFieldEnum[]
  }

  /**
   * JobTemplate findFirstOrThrow
   */
  export type JobTemplateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplate to fetch.
     */
    where?: JobTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTemplates to fetch.
     */
    orderBy?: JobTemplateOrderByWithRelationInput | JobTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobTemplates.
     */
    cursor?: JobTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobTemplates.
     */
    distinct?: JobTemplateScalarFieldEnum | JobTemplateScalarFieldEnum[]
  }

  /**
   * JobTemplate findMany
   */
  export type JobTemplateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplates to fetch.
     */
    where?: JobTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTemplates to fetch.
     */
    orderBy?: JobTemplateOrderByWithRelationInput | JobTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing JobTemplates.
     */
    cursor?: JobTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTemplates.
     */
    skip?: number
    distinct?: JobTemplateScalarFieldEnum | JobTemplateScalarFieldEnum[]
  }

  /**
   * JobTemplate create
   */
  export type JobTemplateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    /**
     * The data needed to create a JobTemplate.
     */
    data: XOR<JobTemplateCreateInput, JobTemplateUncheckedCreateInput>
  }

  /**
   * JobTemplate createMany
   */
  export type JobTemplateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many JobTemplates.
     */
    data: JobTemplateCreateManyInput | JobTemplateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * JobTemplate createManyAndReturn
   */
  export type JobTemplateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many JobTemplates.
     */
    data: JobTemplateCreateManyInput | JobTemplateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * JobTemplate update
   */
  export type JobTemplateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    /**
     * The data needed to update a JobTemplate.
     */
    data: XOR<JobTemplateUpdateInput, JobTemplateUncheckedUpdateInput>
    /**
     * Choose, which JobTemplate to update.
     */
    where: JobTemplateWhereUniqueInput
  }

  /**
   * JobTemplate updateMany
   */
  export type JobTemplateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update JobTemplates.
     */
    data: XOR<JobTemplateUpdateManyMutationInput, JobTemplateUncheckedUpdateManyInput>
    /**
     * Filter which JobTemplates to update
     */
    where?: JobTemplateWhereInput
  }

  /**
   * JobTemplate upsert
   */
  export type JobTemplateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    /**
     * The filter to search for the JobTemplate to update in case it exists.
     */
    where: JobTemplateWhereUniqueInput
    /**
     * In case the JobTemplate found by the `where` argument doesn't exist, create a new JobTemplate with this data.
     */
    create: XOR<JobTemplateCreateInput, JobTemplateUncheckedCreateInput>
    /**
     * In case the JobTemplate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<JobTemplateUpdateInput, JobTemplateUncheckedUpdateInput>
  }

  /**
   * JobTemplate delete
   */
  export type JobTemplateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    /**
     * Filter which JobTemplate to delete.
     */
    where: JobTemplateWhereUniqueInput
  }

  /**
   * JobTemplate deleteMany
   */
  export type JobTemplateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobTemplates to delete
     */
    where?: JobTemplateWhereInput
  }

  /**
   * JobTemplate.tasks
   */
  export type JobTemplate$tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    where?: JobTemplateTaskWhereInput
    orderBy?: JobTemplateTaskOrderByWithRelationInput | JobTemplateTaskOrderByWithRelationInput[]
    cursor?: JobTemplateTaskWhereUniqueInput
    take?: number
    skip?: number
    distinct?: JobTemplateTaskScalarFieldEnum | JobTemplateTaskScalarFieldEnum[]
  }

  /**
   * JobTemplate.jobs
   */
  export type JobTemplate$jobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    where?: JobWhereInput
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    cursor?: JobWhereUniqueInput
    take?: number
    skip?: number
    distinct?: JobScalarFieldEnum | JobScalarFieldEnum[]
  }

  /**
   * JobTemplate without action
   */
  export type JobTemplateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
  }


  /**
   * Model JobTemplateTask
   */

  export type AggregateJobTemplateTask = {
    _count: JobTemplateTaskCountAggregateOutputType | null
    _avg: JobTemplateTaskAvgAggregateOutputType | null
    _sum: JobTemplateTaskSumAggregateOutputType | null
    _min: JobTemplateTaskMinAggregateOutputType | null
    _max: JobTemplateTaskMaxAggregateOutputType | null
  }

  export type JobTemplateTaskAvgAggregateOutputType = {
    taskOrder: number | null
    estimatedMins: number | null
  }

  export type JobTemplateTaskSumAggregateOutputType = {
    taskOrder: number | null
    estimatedMins: number | null
  }

  export type JobTemplateTaskMinAggregateOutputType = {
    id: string | null
    templateId: string | null
    taskName: string | null
    description: string | null
    taskOrder: number | null
    isRequired: boolean | null
    photoRequired: boolean | null
    safetyNote: string | null
    estimatedMins: number | null
    createdAt: Date | null
  }

  export type JobTemplateTaskMaxAggregateOutputType = {
    id: string | null
    templateId: string | null
    taskName: string | null
    description: string | null
    taskOrder: number | null
    isRequired: boolean | null
    photoRequired: boolean | null
    safetyNote: string | null
    estimatedMins: number | null
    createdAt: Date | null
  }

  export type JobTemplateTaskCountAggregateOutputType = {
    id: number
    templateId: number
    taskName: number
    description: number
    taskOrder: number
    isRequired: number
    photoRequired: number
    safetyNote: number
    estimatedMins: number
    createdAt: number
    _all: number
  }


  export type JobTemplateTaskAvgAggregateInputType = {
    taskOrder?: true
    estimatedMins?: true
  }

  export type JobTemplateTaskSumAggregateInputType = {
    taskOrder?: true
    estimatedMins?: true
  }

  export type JobTemplateTaskMinAggregateInputType = {
    id?: true
    templateId?: true
    taskName?: true
    description?: true
    taskOrder?: true
    isRequired?: true
    photoRequired?: true
    safetyNote?: true
    estimatedMins?: true
    createdAt?: true
  }

  export type JobTemplateTaskMaxAggregateInputType = {
    id?: true
    templateId?: true
    taskName?: true
    description?: true
    taskOrder?: true
    isRequired?: true
    photoRequired?: true
    safetyNote?: true
    estimatedMins?: true
    createdAt?: true
  }

  export type JobTemplateTaskCountAggregateInputType = {
    id?: true
    templateId?: true
    taskName?: true
    description?: true
    taskOrder?: true
    isRequired?: true
    photoRequired?: true
    safetyNote?: true
    estimatedMins?: true
    createdAt?: true
    _all?: true
  }

  export type JobTemplateTaskAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobTemplateTask to aggregate.
     */
    where?: JobTemplateTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTemplateTasks to fetch.
     */
    orderBy?: JobTemplateTaskOrderByWithRelationInput | JobTemplateTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: JobTemplateTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTemplateTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTemplateTasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned JobTemplateTasks
    **/
    _count?: true | JobTemplateTaskCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: JobTemplateTaskAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: JobTemplateTaskSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: JobTemplateTaskMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: JobTemplateTaskMaxAggregateInputType
  }

  export type GetJobTemplateTaskAggregateType<T extends JobTemplateTaskAggregateArgs> = {
        [P in keyof T & keyof AggregateJobTemplateTask]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateJobTemplateTask[P]>
      : GetScalarType<T[P], AggregateJobTemplateTask[P]>
  }




  export type JobTemplateTaskGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobTemplateTaskWhereInput
    orderBy?: JobTemplateTaskOrderByWithAggregationInput | JobTemplateTaskOrderByWithAggregationInput[]
    by: JobTemplateTaskScalarFieldEnum[] | JobTemplateTaskScalarFieldEnum
    having?: JobTemplateTaskScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: JobTemplateTaskCountAggregateInputType | true
    _avg?: JobTemplateTaskAvgAggregateInputType
    _sum?: JobTemplateTaskSumAggregateInputType
    _min?: JobTemplateTaskMinAggregateInputType
    _max?: JobTemplateTaskMaxAggregateInputType
  }

  export type JobTemplateTaskGroupByOutputType = {
    id: string
    templateId: string
    taskName: string
    description: string | null
    taskOrder: number
    isRequired: boolean
    photoRequired: boolean
    safetyNote: string | null
    estimatedMins: number | null
    createdAt: Date
    _count: JobTemplateTaskCountAggregateOutputType | null
    _avg: JobTemplateTaskAvgAggregateOutputType | null
    _sum: JobTemplateTaskSumAggregateOutputType | null
    _min: JobTemplateTaskMinAggregateOutputType | null
    _max: JobTemplateTaskMaxAggregateOutputType | null
  }

  type GetJobTemplateTaskGroupByPayload<T extends JobTemplateTaskGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<JobTemplateTaskGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof JobTemplateTaskGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], JobTemplateTaskGroupByOutputType[P]>
            : GetScalarType<T[P], JobTemplateTaskGroupByOutputType[P]>
        }
      >
    >


  export type JobTemplateTaskSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    templateId?: boolean
    taskName?: boolean
    description?: boolean
    taskOrder?: boolean
    isRequired?: boolean
    photoRequired?: boolean
    safetyNote?: boolean
    estimatedMins?: boolean
    createdAt?: boolean
    template?: boolean | JobTemplateDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobTemplateTask"]>

  export type JobTemplateTaskSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    templateId?: boolean
    taskName?: boolean
    description?: boolean
    taskOrder?: boolean
    isRequired?: boolean
    photoRequired?: boolean
    safetyNote?: boolean
    estimatedMins?: boolean
    createdAt?: boolean
    template?: boolean | JobTemplateDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobTemplateTask"]>

  export type JobTemplateTaskSelectScalar = {
    id?: boolean
    templateId?: boolean
    taskName?: boolean
    description?: boolean
    taskOrder?: boolean
    isRequired?: boolean
    photoRequired?: boolean
    safetyNote?: boolean
    estimatedMins?: boolean
    createdAt?: boolean
  }

  export type JobTemplateTaskInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    template?: boolean | JobTemplateDefaultArgs<ExtArgs>
  }
  export type JobTemplateTaskIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    template?: boolean | JobTemplateDefaultArgs<ExtArgs>
  }

  export type $JobTemplateTaskPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "JobTemplateTask"
    objects: {
      template: Prisma.$JobTemplatePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      templateId: string
      taskName: string
      description: string | null
      taskOrder: number
      isRequired: boolean
      photoRequired: boolean
      safetyNote: string | null
      estimatedMins: number | null
      createdAt: Date
    }, ExtArgs["result"]["jobTemplateTask"]>
    composites: {}
  }

  type JobTemplateTaskGetPayload<S extends boolean | null | undefined | JobTemplateTaskDefaultArgs> = $Result.GetResult<Prisma.$JobTemplateTaskPayload, S>

  type JobTemplateTaskCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<JobTemplateTaskFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: JobTemplateTaskCountAggregateInputType | true
    }

  export interface JobTemplateTaskDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['JobTemplateTask'], meta: { name: 'JobTemplateTask' } }
    /**
     * Find zero or one JobTemplateTask that matches the filter.
     * @param {JobTemplateTaskFindUniqueArgs} args - Arguments to find a JobTemplateTask
     * @example
     * // Get one JobTemplateTask
     * const jobTemplateTask = await prisma.jobTemplateTask.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends JobTemplateTaskFindUniqueArgs>(args: SelectSubset<T, JobTemplateTaskFindUniqueArgs<ExtArgs>>): Prisma__JobTemplateTaskClient<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one JobTemplateTask that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {JobTemplateTaskFindUniqueOrThrowArgs} args - Arguments to find a JobTemplateTask
     * @example
     * // Get one JobTemplateTask
     * const jobTemplateTask = await prisma.jobTemplateTask.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends JobTemplateTaskFindUniqueOrThrowArgs>(args: SelectSubset<T, JobTemplateTaskFindUniqueOrThrowArgs<ExtArgs>>): Prisma__JobTemplateTaskClient<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first JobTemplateTask that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateTaskFindFirstArgs} args - Arguments to find a JobTemplateTask
     * @example
     * // Get one JobTemplateTask
     * const jobTemplateTask = await prisma.jobTemplateTask.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends JobTemplateTaskFindFirstArgs>(args?: SelectSubset<T, JobTemplateTaskFindFirstArgs<ExtArgs>>): Prisma__JobTemplateTaskClient<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first JobTemplateTask that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateTaskFindFirstOrThrowArgs} args - Arguments to find a JobTemplateTask
     * @example
     * // Get one JobTemplateTask
     * const jobTemplateTask = await prisma.jobTemplateTask.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends JobTemplateTaskFindFirstOrThrowArgs>(args?: SelectSubset<T, JobTemplateTaskFindFirstOrThrowArgs<ExtArgs>>): Prisma__JobTemplateTaskClient<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more JobTemplateTasks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateTaskFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all JobTemplateTasks
     * const jobTemplateTasks = await prisma.jobTemplateTask.findMany()
     * 
     * // Get first 10 JobTemplateTasks
     * const jobTemplateTasks = await prisma.jobTemplateTask.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const jobTemplateTaskWithIdOnly = await prisma.jobTemplateTask.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends JobTemplateTaskFindManyArgs>(args?: SelectSubset<T, JobTemplateTaskFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a JobTemplateTask.
     * @param {JobTemplateTaskCreateArgs} args - Arguments to create a JobTemplateTask.
     * @example
     * // Create one JobTemplateTask
     * const JobTemplateTask = await prisma.jobTemplateTask.create({
     *   data: {
     *     // ... data to create a JobTemplateTask
     *   }
     * })
     * 
     */
    create<T extends JobTemplateTaskCreateArgs>(args: SelectSubset<T, JobTemplateTaskCreateArgs<ExtArgs>>): Prisma__JobTemplateTaskClient<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many JobTemplateTasks.
     * @param {JobTemplateTaskCreateManyArgs} args - Arguments to create many JobTemplateTasks.
     * @example
     * // Create many JobTemplateTasks
     * const jobTemplateTask = await prisma.jobTemplateTask.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends JobTemplateTaskCreateManyArgs>(args?: SelectSubset<T, JobTemplateTaskCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many JobTemplateTasks and returns the data saved in the database.
     * @param {JobTemplateTaskCreateManyAndReturnArgs} args - Arguments to create many JobTemplateTasks.
     * @example
     * // Create many JobTemplateTasks
     * const jobTemplateTask = await prisma.jobTemplateTask.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many JobTemplateTasks and only return the `id`
     * const jobTemplateTaskWithIdOnly = await prisma.jobTemplateTask.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends JobTemplateTaskCreateManyAndReturnArgs>(args?: SelectSubset<T, JobTemplateTaskCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a JobTemplateTask.
     * @param {JobTemplateTaskDeleteArgs} args - Arguments to delete one JobTemplateTask.
     * @example
     * // Delete one JobTemplateTask
     * const JobTemplateTask = await prisma.jobTemplateTask.delete({
     *   where: {
     *     // ... filter to delete one JobTemplateTask
     *   }
     * })
     * 
     */
    delete<T extends JobTemplateTaskDeleteArgs>(args: SelectSubset<T, JobTemplateTaskDeleteArgs<ExtArgs>>): Prisma__JobTemplateTaskClient<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one JobTemplateTask.
     * @param {JobTemplateTaskUpdateArgs} args - Arguments to update one JobTemplateTask.
     * @example
     * // Update one JobTemplateTask
     * const jobTemplateTask = await prisma.jobTemplateTask.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends JobTemplateTaskUpdateArgs>(args: SelectSubset<T, JobTemplateTaskUpdateArgs<ExtArgs>>): Prisma__JobTemplateTaskClient<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more JobTemplateTasks.
     * @param {JobTemplateTaskDeleteManyArgs} args - Arguments to filter JobTemplateTasks to delete.
     * @example
     * // Delete a few JobTemplateTasks
     * const { count } = await prisma.jobTemplateTask.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends JobTemplateTaskDeleteManyArgs>(args?: SelectSubset<T, JobTemplateTaskDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more JobTemplateTasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateTaskUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many JobTemplateTasks
     * const jobTemplateTask = await prisma.jobTemplateTask.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends JobTemplateTaskUpdateManyArgs>(args: SelectSubset<T, JobTemplateTaskUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one JobTemplateTask.
     * @param {JobTemplateTaskUpsertArgs} args - Arguments to update or create a JobTemplateTask.
     * @example
     * // Update or create a JobTemplateTask
     * const jobTemplateTask = await prisma.jobTemplateTask.upsert({
     *   create: {
     *     // ... data to create a JobTemplateTask
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the JobTemplateTask we want to update
     *   }
     * })
     */
    upsert<T extends JobTemplateTaskUpsertArgs>(args: SelectSubset<T, JobTemplateTaskUpsertArgs<ExtArgs>>): Prisma__JobTemplateTaskClient<$Result.GetResult<Prisma.$JobTemplateTaskPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of JobTemplateTasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateTaskCountArgs} args - Arguments to filter JobTemplateTasks to count.
     * @example
     * // Count the number of JobTemplateTasks
     * const count = await prisma.jobTemplateTask.count({
     *   where: {
     *     // ... the filter for the JobTemplateTasks we want to count
     *   }
     * })
    **/
    count<T extends JobTemplateTaskCountArgs>(
      args?: Subset<T, JobTemplateTaskCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], JobTemplateTaskCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a JobTemplateTask.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateTaskAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends JobTemplateTaskAggregateArgs>(args: Subset<T, JobTemplateTaskAggregateArgs>): Prisma.PrismaPromise<GetJobTemplateTaskAggregateType<T>>

    /**
     * Group by JobTemplateTask.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobTemplateTaskGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends JobTemplateTaskGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: JobTemplateTaskGroupByArgs['orderBy'] }
        : { orderBy?: JobTemplateTaskGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, JobTemplateTaskGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobTemplateTaskGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the JobTemplateTask model
   */
  readonly fields: JobTemplateTaskFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for JobTemplateTask.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__JobTemplateTaskClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    template<T extends JobTemplateDefaultArgs<ExtArgs> = {}>(args?: Subset<T, JobTemplateDefaultArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the JobTemplateTask model
   */ 
  interface JobTemplateTaskFieldRefs {
    readonly id: FieldRef<"JobTemplateTask", 'String'>
    readonly templateId: FieldRef<"JobTemplateTask", 'String'>
    readonly taskName: FieldRef<"JobTemplateTask", 'String'>
    readonly description: FieldRef<"JobTemplateTask", 'String'>
    readonly taskOrder: FieldRef<"JobTemplateTask", 'Int'>
    readonly isRequired: FieldRef<"JobTemplateTask", 'Boolean'>
    readonly photoRequired: FieldRef<"JobTemplateTask", 'Boolean'>
    readonly safetyNote: FieldRef<"JobTemplateTask", 'String'>
    readonly estimatedMins: FieldRef<"JobTemplateTask", 'Int'>
    readonly createdAt: FieldRef<"JobTemplateTask", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * JobTemplateTask findUnique
   */
  export type JobTemplateTaskFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplateTask to fetch.
     */
    where: JobTemplateTaskWhereUniqueInput
  }

  /**
   * JobTemplateTask findUniqueOrThrow
   */
  export type JobTemplateTaskFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplateTask to fetch.
     */
    where: JobTemplateTaskWhereUniqueInput
  }

  /**
   * JobTemplateTask findFirst
   */
  export type JobTemplateTaskFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplateTask to fetch.
     */
    where?: JobTemplateTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTemplateTasks to fetch.
     */
    orderBy?: JobTemplateTaskOrderByWithRelationInput | JobTemplateTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobTemplateTasks.
     */
    cursor?: JobTemplateTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTemplateTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTemplateTasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobTemplateTasks.
     */
    distinct?: JobTemplateTaskScalarFieldEnum | JobTemplateTaskScalarFieldEnum[]
  }

  /**
   * JobTemplateTask findFirstOrThrow
   */
  export type JobTemplateTaskFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplateTask to fetch.
     */
    where?: JobTemplateTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTemplateTasks to fetch.
     */
    orderBy?: JobTemplateTaskOrderByWithRelationInput | JobTemplateTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobTemplateTasks.
     */
    cursor?: JobTemplateTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTemplateTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTemplateTasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobTemplateTasks.
     */
    distinct?: JobTemplateTaskScalarFieldEnum | JobTemplateTaskScalarFieldEnum[]
  }

  /**
   * JobTemplateTask findMany
   */
  export type JobTemplateTaskFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    /**
     * Filter, which JobTemplateTasks to fetch.
     */
    where?: JobTemplateTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobTemplateTasks to fetch.
     */
    orderBy?: JobTemplateTaskOrderByWithRelationInput | JobTemplateTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing JobTemplateTasks.
     */
    cursor?: JobTemplateTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobTemplateTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobTemplateTasks.
     */
    skip?: number
    distinct?: JobTemplateTaskScalarFieldEnum | JobTemplateTaskScalarFieldEnum[]
  }

  /**
   * JobTemplateTask create
   */
  export type JobTemplateTaskCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    /**
     * The data needed to create a JobTemplateTask.
     */
    data: XOR<JobTemplateTaskCreateInput, JobTemplateTaskUncheckedCreateInput>
  }

  /**
   * JobTemplateTask createMany
   */
  export type JobTemplateTaskCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many JobTemplateTasks.
     */
    data: JobTemplateTaskCreateManyInput | JobTemplateTaskCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * JobTemplateTask createManyAndReturn
   */
  export type JobTemplateTaskCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many JobTemplateTasks.
     */
    data: JobTemplateTaskCreateManyInput | JobTemplateTaskCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * JobTemplateTask update
   */
  export type JobTemplateTaskUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    /**
     * The data needed to update a JobTemplateTask.
     */
    data: XOR<JobTemplateTaskUpdateInput, JobTemplateTaskUncheckedUpdateInput>
    /**
     * Choose, which JobTemplateTask to update.
     */
    where: JobTemplateTaskWhereUniqueInput
  }

  /**
   * JobTemplateTask updateMany
   */
  export type JobTemplateTaskUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update JobTemplateTasks.
     */
    data: XOR<JobTemplateTaskUpdateManyMutationInput, JobTemplateTaskUncheckedUpdateManyInput>
    /**
     * Filter which JobTemplateTasks to update
     */
    where?: JobTemplateTaskWhereInput
  }

  /**
   * JobTemplateTask upsert
   */
  export type JobTemplateTaskUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    /**
     * The filter to search for the JobTemplateTask to update in case it exists.
     */
    where: JobTemplateTaskWhereUniqueInput
    /**
     * In case the JobTemplateTask found by the `where` argument doesn't exist, create a new JobTemplateTask with this data.
     */
    create: XOR<JobTemplateTaskCreateInput, JobTemplateTaskUncheckedCreateInput>
    /**
     * In case the JobTemplateTask was found with the provided `where` argument, update it with this data.
     */
    update: XOR<JobTemplateTaskUpdateInput, JobTemplateTaskUncheckedUpdateInput>
  }

  /**
   * JobTemplateTask delete
   */
  export type JobTemplateTaskDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
    /**
     * Filter which JobTemplateTask to delete.
     */
    where: JobTemplateTaskWhereUniqueInput
  }

  /**
   * JobTemplateTask deleteMany
   */
  export type JobTemplateTaskDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobTemplateTasks to delete
     */
    where?: JobTemplateTaskWhereInput
  }

  /**
   * JobTemplateTask without action
   */
  export type JobTemplateTaskDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplateTask
     */
    select?: JobTemplateTaskSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateTaskInclude<ExtArgs> | null
  }


  /**
   * Model JobCustomFieldDef
   */

  export type AggregateJobCustomFieldDef = {
    _count: JobCustomFieldDefCountAggregateOutputType | null
    _avg: JobCustomFieldDefAvgAggregateOutputType | null
    _sum: JobCustomFieldDefSumAggregateOutputType | null
    _min: JobCustomFieldDefMinAggregateOutputType | null
    _max: JobCustomFieldDefMaxAggregateOutputType | null
  }

  export type JobCustomFieldDefAvgAggregateOutputType = {
    sortOrder: number | null
  }

  export type JobCustomFieldDefSumAggregateOutputType = {
    sortOrder: number | null
  }

  export type JobCustomFieldDefMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobTypeId: string | null
    fieldKey: string | null
    label: string | null
    fieldType: $Enums.CustomFieldType | null
    isRequired: boolean | null
    helpText: string | null
    sortOrder: number | null
    isActive: boolean | null
    createdAt: Date | null
  }

  export type JobCustomFieldDefMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobTypeId: string | null
    fieldKey: string | null
    label: string | null
    fieldType: $Enums.CustomFieldType | null
    isRequired: boolean | null
    helpText: string | null
    sortOrder: number | null
    isActive: boolean | null
    createdAt: Date | null
  }

  export type JobCustomFieldDefCountAggregateOutputType = {
    id: number
    companyId: number
    jobTypeId: number
    fieldKey: number
    label: number
    fieldType: number
    options: number
    isRequired: number
    helpText: number
    sortOrder: number
    isActive: number
    createdAt: number
    _all: number
  }


  export type JobCustomFieldDefAvgAggregateInputType = {
    sortOrder?: true
  }

  export type JobCustomFieldDefSumAggregateInputType = {
    sortOrder?: true
  }

  export type JobCustomFieldDefMinAggregateInputType = {
    id?: true
    companyId?: true
    jobTypeId?: true
    fieldKey?: true
    label?: true
    fieldType?: true
    isRequired?: true
    helpText?: true
    sortOrder?: true
    isActive?: true
    createdAt?: true
  }

  export type JobCustomFieldDefMaxAggregateInputType = {
    id?: true
    companyId?: true
    jobTypeId?: true
    fieldKey?: true
    label?: true
    fieldType?: true
    isRequired?: true
    helpText?: true
    sortOrder?: true
    isActive?: true
    createdAt?: true
  }

  export type JobCustomFieldDefCountAggregateInputType = {
    id?: true
    companyId?: true
    jobTypeId?: true
    fieldKey?: true
    label?: true
    fieldType?: true
    options?: true
    isRequired?: true
    helpText?: true
    sortOrder?: true
    isActive?: true
    createdAt?: true
    _all?: true
  }

  export type JobCustomFieldDefAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobCustomFieldDef to aggregate.
     */
    where?: JobCustomFieldDefWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobCustomFieldDefs to fetch.
     */
    orderBy?: JobCustomFieldDefOrderByWithRelationInput | JobCustomFieldDefOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: JobCustomFieldDefWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobCustomFieldDefs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobCustomFieldDefs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned JobCustomFieldDefs
    **/
    _count?: true | JobCustomFieldDefCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: JobCustomFieldDefAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: JobCustomFieldDefSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: JobCustomFieldDefMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: JobCustomFieldDefMaxAggregateInputType
  }

  export type GetJobCustomFieldDefAggregateType<T extends JobCustomFieldDefAggregateArgs> = {
        [P in keyof T & keyof AggregateJobCustomFieldDef]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateJobCustomFieldDef[P]>
      : GetScalarType<T[P], AggregateJobCustomFieldDef[P]>
  }




  export type JobCustomFieldDefGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobCustomFieldDefWhereInput
    orderBy?: JobCustomFieldDefOrderByWithAggregationInput | JobCustomFieldDefOrderByWithAggregationInput[]
    by: JobCustomFieldDefScalarFieldEnum[] | JobCustomFieldDefScalarFieldEnum
    having?: JobCustomFieldDefScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: JobCustomFieldDefCountAggregateInputType | true
    _avg?: JobCustomFieldDefAvgAggregateInputType
    _sum?: JobCustomFieldDefSumAggregateInputType
    _min?: JobCustomFieldDefMinAggregateInputType
    _max?: JobCustomFieldDefMaxAggregateInputType
  }

  export type JobCustomFieldDefGroupByOutputType = {
    id: string
    companyId: string
    jobTypeId: string
    fieldKey: string
    label: string
    fieldType: $Enums.CustomFieldType
    options: JsonValue | null
    isRequired: boolean
    helpText: string | null
    sortOrder: number
    isActive: boolean
    createdAt: Date
    _count: JobCustomFieldDefCountAggregateOutputType | null
    _avg: JobCustomFieldDefAvgAggregateOutputType | null
    _sum: JobCustomFieldDefSumAggregateOutputType | null
    _min: JobCustomFieldDefMinAggregateOutputType | null
    _max: JobCustomFieldDefMaxAggregateOutputType | null
  }

  type GetJobCustomFieldDefGroupByPayload<T extends JobCustomFieldDefGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<JobCustomFieldDefGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof JobCustomFieldDefGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], JobCustomFieldDefGroupByOutputType[P]>
            : GetScalarType<T[P], JobCustomFieldDefGroupByOutputType[P]>
        }
      >
    >


  export type JobCustomFieldDefSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobTypeId?: boolean
    fieldKey?: boolean
    label?: boolean
    fieldType?: boolean
    options?: boolean
    isRequired?: boolean
    helpText?: boolean
    sortOrder?: boolean
    isActive?: boolean
    createdAt?: boolean
    jobType?: boolean | JobTypeDefaultArgs<ExtArgs>
    values?: boolean | JobCustomFieldDef$valuesArgs<ExtArgs>
    _count?: boolean | JobCustomFieldDefCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobCustomFieldDef"]>

  export type JobCustomFieldDefSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobTypeId?: boolean
    fieldKey?: boolean
    label?: boolean
    fieldType?: boolean
    options?: boolean
    isRequired?: boolean
    helpText?: boolean
    sortOrder?: boolean
    isActive?: boolean
    createdAt?: boolean
    jobType?: boolean | JobTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobCustomFieldDef"]>

  export type JobCustomFieldDefSelectScalar = {
    id?: boolean
    companyId?: boolean
    jobTypeId?: boolean
    fieldKey?: boolean
    label?: boolean
    fieldType?: boolean
    options?: boolean
    isRequired?: boolean
    helpText?: boolean
    sortOrder?: boolean
    isActive?: boolean
    createdAt?: boolean
  }

  export type JobCustomFieldDefInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobType?: boolean | JobTypeDefaultArgs<ExtArgs>
    values?: boolean | JobCustomFieldDef$valuesArgs<ExtArgs>
    _count?: boolean | JobCustomFieldDefCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type JobCustomFieldDefIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobType?: boolean | JobTypeDefaultArgs<ExtArgs>
  }

  export type $JobCustomFieldDefPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "JobCustomFieldDef"
    objects: {
      jobType: Prisma.$JobTypePayload<ExtArgs>
      values: Prisma.$JobCustomFieldValuePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      jobTypeId: string
      fieldKey: string
      label: string
      fieldType: $Enums.CustomFieldType
      options: Prisma.JsonValue | null
      isRequired: boolean
      helpText: string | null
      sortOrder: number
      isActive: boolean
      createdAt: Date
    }, ExtArgs["result"]["jobCustomFieldDef"]>
    composites: {}
  }

  type JobCustomFieldDefGetPayload<S extends boolean | null | undefined | JobCustomFieldDefDefaultArgs> = $Result.GetResult<Prisma.$JobCustomFieldDefPayload, S>

  type JobCustomFieldDefCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<JobCustomFieldDefFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: JobCustomFieldDefCountAggregateInputType | true
    }

  export interface JobCustomFieldDefDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['JobCustomFieldDef'], meta: { name: 'JobCustomFieldDef' } }
    /**
     * Find zero or one JobCustomFieldDef that matches the filter.
     * @param {JobCustomFieldDefFindUniqueArgs} args - Arguments to find a JobCustomFieldDef
     * @example
     * // Get one JobCustomFieldDef
     * const jobCustomFieldDef = await prisma.jobCustomFieldDef.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends JobCustomFieldDefFindUniqueArgs>(args: SelectSubset<T, JobCustomFieldDefFindUniqueArgs<ExtArgs>>): Prisma__JobCustomFieldDefClient<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one JobCustomFieldDef that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {JobCustomFieldDefFindUniqueOrThrowArgs} args - Arguments to find a JobCustomFieldDef
     * @example
     * // Get one JobCustomFieldDef
     * const jobCustomFieldDef = await prisma.jobCustomFieldDef.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends JobCustomFieldDefFindUniqueOrThrowArgs>(args: SelectSubset<T, JobCustomFieldDefFindUniqueOrThrowArgs<ExtArgs>>): Prisma__JobCustomFieldDefClient<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first JobCustomFieldDef that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldDefFindFirstArgs} args - Arguments to find a JobCustomFieldDef
     * @example
     * // Get one JobCustomFieldDef
     * const jobCustomFieldDef = await prisma.jobCustomFieldDef.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends JobCustomFieldDefFindFirstArgs>(args?: SelectSubset<T, JobCustomFieldDefFindFirstArgs<ExtArgs>>): Prisma__JobCustomFieldDefClient<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first JobCustomFieldDef that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldDefFindFirstOrThrowArgs} args - Arguments to find a JobCustomFieldDef
     * @example
     * // Get one JobCustomFieldDef
     * const jobCustomFieldDef = await prisma.jobCustomFieldDef.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends JobCustomFieldDefFindFirstOrThrowArgs>(args?: SelectSubset<T, JobCustomFieldDefFindFirstOrThrowArgs<ExtArgs>>): Prisma__JobCustomFieldDefClient<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more JobCustomFieldDefs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldDefFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all JobCustomFieldDefs
     * const jobCustomFieldDefs = await prisma.jobCustomFieldDef.findMany()
     * 
     * // Get first 10 JobCustomFieldDefs
     * const jobCustomFieldDefs = await prisma.jobCustomFieldDef.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const jobCustomFieldDefWithIdOnly = await prisma.jobCustomFieldDef.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends JobCustomFieldDefFindManyArgs>(args?: SelectSubset<T, JobCustomFieldDefFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a JobCustomFieldDef.
     * @param {JobCustomFieldDefCreateArgs} args - Arguments to create a JobCustomFieldDef.
     * @example
     * // Create one JobCustomFieldDef
     * const JobCustomFieldDef = await prisma.jobCustomFieldDef.create({
     *   data: {
     *     // ... data to create a JobCustomFieldDef
     *   }
     * })
     * 
     */
    create<T extends JobCustomFieldDefCreateArgs>(args: SelectSubset<T, JobCustomFieldDefCreateArgs<ExtArgs>>): Prisma__JobCustomFieldDefClient<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many JobCustomFieldDefs.
     * @param {JobCustomFieldDefCreateManyArgs} args - Arguments to create many JobCustomFieldDefs.
     * @example
     * // Create many JobCustomFieldDefs
     * const jobCustomFieldDef = await prisma.jobCustomFieldDef.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends JobCustomFieldDefCreateManyArgs>(args?: SelectSubset<T, JobCustomFieldDefCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many JobCustomFieldDefs and returns the data saved in the database.
     * @param {JobCustomFieldDefCreateManyAndReturnArgs} args - Arguments to create many JobCustomFieldDefs.
     * @example
     * // Create many JobCustomFieldDefs
     * const jobCustomFieldDef = await prisma.jobCustomFieldDef.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many JobCustomFieldDefs and only return the `id`
     * const jobCustomFieldDefWithIdOnly = await prisma.jobCustomFieldDef.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends JobCustomFieldDefCreateManyAndReturnArgs>(args?: SelectSubset<T, JobCustomFieldDefCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a JobCustomFieldDef.
     * @param {JobCustomFieldDefDeleteArgs} args - Arguments to delete one JobCustomFieldDef.
     * @example
     * // Delete one JobCustomFieldDef
     * const JobCustomFieldDef = await prisma.jobCustomFieldDef.delete({
     *   where: {
     *     // ... filter to delete one JobCustomFieldDef
     *   }
     * })
     * 
     */
    delete<T extends JobCustomFieldDefDeleteArgs>(args: SelectSubset<T, JobCustomFieldDefDeleteArgs<ExtArgs>>): Prisma__JobCustomFieldDefClient<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one JobCustomFieldDef.
     * @param {JobCustomFieldDefUpdateArgs} args - Arguments to update one JobCustomFieldDef.
     * @example
     * // Update one JobCustomFieldDef
     * const jobCustomFieldDef = await prisma.jobCustomFieldDef.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends JobCustomFieldDefUpdateArgs>(args: SelectSubset<T, JobCustomFieldDefUpdateArgs<ExtArgs>>): Prisma__JobCustomFieldDefClient<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more JobCustomFieldDefs.
     * @param {JobCustomFieldDefDeleteManyArgs} args - Arguments to filter JobCustomFieldDefs to delete.
     * @example
     * // Delete a few JobCustomFieldDefs
     * const { count } = await prisma.jobCustomFieldDef.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends JobCustomFieldDefDeleteManyArgs>(args?: SelectSubset<T, JobCustomFieldDefDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more JobCustomFieldDefs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldDefUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many JobCustomFieldDefs
     * const jobCustomFieldDef = await prisma.jobCustomFieldDef.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends JobCustomFieldDefUpdateManyArgs>(args: SelectSubset<T, JobCustomFieldDefUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one JobCustomFieldDef.
     * @param {JobCustomFieldDefUpsertArgs} args - Arguments to update or create a JobCustomFieldDef.
     * @example
     * // Update or create a JobCustomFieldDef
     * const jobCustomFieldDef = await prisma.jobCustomFieldDef.upsert({
     *   create: {
     *     // ... data to create a JobCustomFieldDef
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the JobCustomFieldDef we want to update
     *   }
     * })
     */
    upsert<T extends JobCustomFieldDefUpsertArgs>(args: SelectSubset<T, JobCustomFieldDefUpsertArgs<ExtArgs>>): Prisma__JobCustomFieldDefClient<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of JobCustomFieldDefs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldDefCountArgs} args - Arguments to filter JobCustomFieldDefs to count.
     * @example
     * // Count the number of JobCustomFieldDefs
     * const count = await prisma.jobCustomFieldDef.count({
     *   where: {
     *     // ... the filter for the JobCustomFieldDefs we want to count
     *   }
     * })
    **/
    count<T extends JobCustomFieldDefCountArgs>(
      args?: Subset<T, JobCustomFieldDefCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], JobCustomFieldDefCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a JobCustomFieldDef.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldDefAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends JobCustomFieldDefAggregateArgs>(args: Subset<T, JobCustomFieldDefAggregateArgs>): Prisma.PrismaPromise<GetJobCustomFieldDefAggregateType<T>>

    /**
     * Group by JobCustomFieldDef.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldDefGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends JobCustomFieldDefGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: JobCustomFieldDefGroupByArgs['orderBy'] }
        : { orderBy?: JobCustomFieldDefGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, JobCustomFieldDefGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobCustomFieldDefGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the JobCustomFieldDef model
   */
  readonly fields: JobCustomFieldDefFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for JobCustomFieldDef.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__JobCustomFieldDefClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    jobType<T extends JobTypeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, JobTypeDefaultArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    values<T extends JobCustomFieldDef$valuesArgs<ExtArgs> = {}>(args?: Subset<T, JobCustomFieldDef$valuesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the JobCustomFieldDef model
   */ 
  interface JobCustomFieldDefFieldRefs {
    readonly id: FieldRef<"JobCustomFieldDef", 'String'>
    readonly companyId: FieldRef<"JobCustomFieldDef", 'String'>
    readonly jobTypeId: FieldRef<"JobCustomFieldDef", 'String'>
    readonly fieldKey: FieldRef<"JobCustomFieldDef", 'String'>
    readonly label: FieldRef<"JobCustomFieldDef", 'String'>
    readonly fieldType: FieldRef<"JobCustomFieldDef", 'CustomFieldType'>
    readonly options: FieldRef<"JobCustomFieldDef", 'Json'>
    readonly isRequired: FieldRef<"JobCustomFieldDef", 'Boolean'>
    readonly helpText: FieldRef<"JobCustomFieldDef", 'String'>
    readonly sortOrder: FieldRef<"JobCustomFieldDef", 'Int'>
    readonly isActive: FieldRef<"JobCustomFieldDef", 'Boolean'>
    readonly createdAt: FieldRef<"JobCustomFieldDef", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * JobCustomFieldDef findUnique
   */
  export type JobCustomFieldDefFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldDef to fetch.
     */
    where: JobCustomFieldDefWhereUniqueInput
  }

  /**
   * JobCustomFieldDef findUniqueOrThrow
   */
  export type JobCustomFieldDefFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldDef to fetch.
     */
    where: JobCustomFieldDefWhereUniqueInput
  }

  /**
   * JobCustomFieldDef findFirst
   */
  export type JobCustomFieldDefFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldDef to fetch.
     */
    where?: JobCustomFieldDefWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobCustomFieldDefs to fetch.
     */
    orderBy?: JobCustomFieldDefOrderByWithRelationInput | JobCustomFieldDefOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobCustomFieldDefs.
     */
    cursor?: JobCustomFieldDefWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobCustomFieldDefs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobCustomFieldDefs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobCustomFieldDefs.
     */
    distinct?: JobCustomFieldDefScalarFieldEnum | JobCustomFieldDefScalarFieldEnum[]
  }

  /**
   * JobCustomFieldDef findFirstOrThrow
   */
  export type JobCustomFieldDefFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldDef to fetch.
     */
    where?: JobCustomFieldDefWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobCustomFieldDefs to fetch.
     */
    orderBy?: JobCustomFieldDefOrderByWithRelationInput | JobCustomFieldDefOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobCustomFieldDefs.
     */
    cursor?: JobCustomFieldDefWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobCustomFieldDefs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobCustomFieldDefs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobCustomFieldDefs.
     */
    distinct?: JobCustomFieldDefScalarFieldEnum | JobCustomFieldDefScalarFieldEnum[]
  }

  /**
   * JobCustomFieldDef findMany
   */
  export type JobCustomFieldDefFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldDefs to fetch.
     */
    where?: JobCustomFieldDefWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobCustomFieldDefs to fetch.
     */
    orderBy?: JobCustomFieldDefOrderByWithRelationInput | JobCustomFieldDefOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing JobCustomFieldDefs.
     */
    cursor?: JobCustomFieldDefWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobCustomFieldDefs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobCustomFieldDefs.
     */
    skip?: number
    distinct?: JobCustomFieldDefScalarFieldEnum | JobCustomFieldDefScalarFieldEnum[]
  }

  /**
   * JobCustomFieldDef create
   */
  export type JobCustomFieldDefCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    /**
     * The data needed to create a JobCustomFieldDef.
     */
    data: XOR<JobCustomFieldDefCreateInput, JobCustomFieldDefUncheckedCreateInput>
  }

  /**
   * JobCustomFieldDef createMany
   */
  export type JobCustomFieldDefCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many JobCustomFieldDefs.
     */
    data: JobCustomFieldDefCreateManyInput | JobCustomFieldDefCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * JobCustomFieldDef createManyAndReturn
   */
  export type JobCustomFieldDefCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many JobCustomFieldDefs.
     */
    data: JobCustomFieldDefCreateManyInput | JobCustomFieldDefCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * JobCustomFieldDef update
   */
  export type JobCustomFieldDefUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    /**
     * The data needed to update a JobCustomFieldDef.
     */
    data: XOR<JobCustomFieldDefUpdateInput, JobCustomFieldDefUncheckedUpdateInput>
    /**
     * Choose, which JobCustomFieldDef to update.
     */
    where: JobCustomFieldDefWhereUniqueInput
  }

  /**
   * JobCustomFieldDef updateMany
   */
  export type JobCustomFieldDefUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update JobCustomFieldDefs.
     */
    data: XOR<JobCustomFieldDefUpdateManyMutationInput, JobCustomFieldDefUncheckedUpdateManyInput>
    /**
     * Filter which JobCustomFieldDefs to update
     */
    where?: JobCustomFieldDefWhereInput
  }

  /**
   * JobCustomFieldDef upsert
   */
  export type JobCustomFieldDefUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    /**
     * The filter to search for the JobCustomFieldDef to update in case it exists.
     */
    where: JobCustomFieldDefWhereUniqueInput
    /**
     * In case the JobCustomFieldDef found by the `where` argument doesn't exist, create a new JobCustomFieldDef with this data.
     */
    create: XOR<JobCustomFieldDefCreateInput, JobCustomFieldDefUncheckedCreateInput>
    /**
     * In case the JobCustomFieldDef was found with the provided `where` argument, update it with this data.
     */
    update: XOR<JobCustomFieldDefUpdateInput, JobCustomFieldDefUncheckedUpdateInput>
  }

  /**
   * JobCustomFieldDef delete
   */
  export type JobCustomFieldDefDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
    /**
     * Filter which JobCustomFieldDef to delete.
     */
    where: JobCustomFieldDefWhereUniqueInput
  }

  /**
   * JobCustomFieldDef deleteMany
   */
  export type JobCustomFieldDefDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobCustomFieldDefs to delete
     */
    where?: JobCustomFieldDefWhereInput
  }

  /**
   * JobCustomFieldDef.values
   */
  export type JobCustomFieldDef$valuesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    where?: JobCustomFieldValueWhereInput
    orderBy?: JobCustomFieldValueOrderByWithRelationInput | JobCustomFieldValueOrderByWithRelationInput[]
    cursor?: JobCustomFieldValueWhereUniqueInput
    take?: number
    skip?: number
    distinct?: JobCustomFieldValueScalarFieldEnum | JobCustomFieldValueScalarFieldEnum[]
  }

  /**
   * JobCustomFieldDef without action
   */
  export type JobCustomFieldDefDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldDef
     */
    select?: JobCustomFieldDefSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldDefInclude<ExtArgs> | null
  }


  /**
   * Model JobCustomFieldValue
   */

  export type AggregateJobCustomFieldValue = {
    _count: JobCustomFieldValueCountAggregateOutputType | null
    _min: JobCustomFieldValueMinAggregateOutputType | null
    _max: JobCustomFieldValueMaxAggregateOutputType | null
  }

  export type JobCustomFieldValueMinAggregateOutputType = {
    id: string | null
    jobId: string | null
    fieldDefId: string | null
    updatedAt: Date | null
  }

  export type JobCustomFieldValueMaxAggregateOutputType = {
    id: string | null
    jobId: string | null
    fieldDefId: string | null
    updatedAt: Date | null
  }

  export type JobCustomFieldValueCountAggregateOutputType = {
    id: number
    jobId: number
    fieldDefId: number
    value: number
    updatedAt: number
    _all: number
  }


  export type JobCustomFieldValueMinAggregateInputType = {
    id?: true
    jobId?: true
    fieldDefId?: true
    updatedAt?: true
  }

  export type JobCustomFieldValueMaxAggregateInputType = {
    id?: true
    jobId?: true
    fieldDefId?: true
    updatedAt?: true
  }

  export type JobCustomFieldValueCountAggregateInputType = {
    id?: true
    jobId?: true
    fieldDefId?: true
    value?: true
    updatedAt?: true
    _all?: true
  }

  export type JobCustomFieldValueAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobCustomFieldValue to aggregate.
     */
    where?: JobCustomFieldValueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobCustomFieldValues to fetch.
     */
    orderBy?: JobCustomFieldValueOrderByWithRelationInput | JobCustomFieldValueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: JobCustomFieldValueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobCustomFieldValues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobCustomFieldValues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned JobCustomFieldValues
    **/
    _count?: true | JobCustomFieldValueCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: JobCustomFieldValueMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: JobCustomFieldValueMaxAggregateInputType
  }

  export type GetJobCustomFieldValueAggregateType<T extends JobCustomFieldValueAggregateArgs> = {
        [P in keyof T & keyof AggregateJobCustomFieldValue]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateJobCustomFieldValue[P]>
      : GetScalarType<T[P], AggregateJobCustomFieldValue[P]>
  }




  export type JobCustomFieldValueGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobCustomFieldValueWhereInput
    orderBy?: JobCustomFieldValueOrderByWithAggregationInput | JobCustomFieldValueOrderByWithAggregationInput[]
    by: JobCustomFieldValueScalarFieldEnum[] | JobCustomFieldValueScalarFieldEnum
    having?: JobCustomFieldValueScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: JobCustomFieldValueCountAggregateInputType | true
    _min?: JobCustomFieldValueMinAggregateInputType
    _max?: JobCustomFieldValueMaxAggregateInputType
  }

  export type JobCustomFieldValueGroupByOutputType = {
    id: string
    jobId: string
    fieldDefId: string
    value: JsonValue
    updatedAt: Date
    _count: JobCustomFieldValueCountAggregateOutputType | null
    _min: JobCustomFieldValueMinAggregateOutputType | null
    _max: JobCustomFieldValueMaxAggregateOutputType | null
  }

  type GetJobCustomFieldValueGroupByPayload<T extends JobCustomFieldValueGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<JobCustomFieldValueGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof JobCustomFieldValueGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], JobCustomFieldValueGroupByOutputType[P]>
            : GetScalarType<T[P], JobCustomFieldValueGroupByOutputType[P]>
        }
      >
    >


  export type JobCustomFieldValueSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobId?: boolean
    fieldDefId?: boolean
    value?: boolean
    updatedAt?: boolean
    job?: boolean | JobDefaultArgs<ExtArgs>
    fieldDef?: boolean | JobCustomFieldDefDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobCustomFieldValue"]>

  export type JobCustomFieldValueSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobId?: boolean
    fieldDefId?: boolean
    value?: boolean
    updatedAt?: boolean
    job?: boolean | JobDefaultArgs<ExtArgs>
    fieldDef?: boolean | JobCustomFieldDefDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobCustomFieldValue"]>

  export type JobCustomFieldValueSelectScalar = {
    id?: boolean
    jobId?: boolean
    fieldDefId?: boolean
    value?: boolean
    updatedAt?: boolean
  }

  export type JobCustomFieldValueInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | JobDefaultArgs<ExtArgs>
    fieldDef?: boolean | JobCustomFieldDefDefaultArgs<ExtArgs>
  }
  export type JobCustomFieldValueIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | JobDefaultArgs<ExtArgs>
    fieldDef?: boolean | JobCustomFieldDefDefaultArgs<ExtArgs>
  }

  export type $JobCustomFieldValuePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "JobCustomFieldValue"
    objects: {
      job: Prisma.$JobPayload<ExtArgs>
      fieldDef: Prisma.$JobCustomFieldDefPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      jobId: string
      fieldDefId: string
      value: Prisma.JsonValue
      updatedAt: Date
    }, ExtArgs["result"]["jobCustomFieldValue"]>
    composites: {}
  }

  type JobCustomFieldValueGetPayload<S extends boolean | null | undefined | JobCustomFieldValueDefaultArgs> = $Result.GetResult<Prisma.$JobCustomFieldValuePayload, S>

  type JobCustomFieldValueCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<JobCustomFieldValueFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: JobCustomFieldValueCountAggregateInputType | true
    }

  export interface JobCustomFieldValueDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['JobCustomFieldValue'], meta: { name: 'JobCustomFieldValue' } }
    /**
     * Find zero or one JobCustomFieldValue that matches the filter.
     * @param {JobCustomFieldValueFindUniqueArgs} args - Arguments to find a JobCustomFieldValue
     * @example
     * // Get one JobCustomFieldValue
     * const jobCustomFieldValue = await prisma.jobCustomFieldValue.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends JobCustomFieldValueFindUniqueArgs>(args: SelectSubset<T, JobCustomFieldValueFindUniqueArgs<ExtArgs>>): Prisma__JobCustomFieldValueClient<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one JobCustomFieldValue that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {JobCustomFieldValueFindUniqueOrThrowArgs} args - Arguments to find a JobCustomFieldValue
     * @example
     * // Get one JobCustomFieldValue
     * const jobCustomFieldValue = await prisma.jobCustomFieldValue.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends JobCustomFieldValueFindUniqueOrThrowArgs>(args: SelectSubset<T, JobCustomFieldValueFindUniqueOrThrowArgs<ExtArgs>>): Prisma__JobCustomFieldValueClient<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first JobCustomFieldValue that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldValueFindFirstArgs} args - Arguments to find a JobCustomFieldValue
     * @example
     * // Get one JobCustomFieldValue
     * const jobCustomFieldValue = await prisma.jobCustomFieldValue.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends JobCustomFieldValueFindFirstArgs>(args?: SelectSubset<T, JobCustomFieldValueFindFirstArgs<ExtArgs>>): Prisma__JobCustomFieldValueClient<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first JobCustomFieldValue that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldValueFindFirstOrThrowArgs} args - Arguments to find a JobCustomFieldValue
     * @example
     * // Get one JobCustomFieldValue
     * const jobCustomFieldValue = await prisma.jobCustomFieldValue.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends JobCustomFieldValueFindFirstOrThrowArgs>(args?: SelectSubset<T, JobCustomFieldValueFindFirstOrThrowArgs<ExtArgs>>): Prisma__JobCustomFieldValueClient<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more JobCustomFieldValues that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldValueFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all JobCustomFieldValues
     * const jobCustomFieldValues = await prisma.jobCustomFieldValue.findMany()
     * 
     * // Get first 10 JobCustomFieldValues
     * const jobCustomFieldValues = await prisma.jobCustomFieldValue.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const jobCustomFieldValueWithIdOnly = await prisma.jobCustomFieldValue.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends JobCustomFieldValueFindManyArgs>(args?: SelectSubset<T, JobCustomFieldValueFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a JobCustomFieldValue.
     * @param {JobCustomFieldValueCreateArgs} args - Arguments to create a JobCustomFieldValue.
     * @example
     * // Create one JobCustomFieldValue
     * const JobCustomFieldValue = await prisma.jobCustomFieldValue.create({
     *   data: {
     *     // ... data to create a JobCustomFieldValue
     *   }
     * })
     * 
     */
    create<T extends JobCustomFieldValueCreateArgs>(args: SelectSubset<T, JobCustomFieldValueCreateArgs<ExtArgs>>): Prisma__JobCustomFieldValueClient<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many JobCustomFieldValues.
     * @param {JobCustomFieldValueCreateManyArgs} args - Arguments to create many JobCustomFieldValues.
     * @example
     * // Create many JobCustomFieldValues
     * const jobCustomFieldValue = await prisma.jobCustomFieldValue.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends JobCustomFieldValueCreateManyArgs>(args?: SelectSubset<T, JobCustomFieldValueCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many JobCustomFieldValues and returns the data saved in the database.
     * @param {JobCustomFieldValueCreateManyAndReturnArgs} args - Arguments to create many JobCustomFieldValues.
     * @example
     * // Create many JobCustomFieldValues
     * const jobCustomFieldValue = await prisma.jobCustomFieldValue.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many JobCustomFieldValues and only return the `id`
     * const jobCustomFieldValueWithIdOnly = await prisma.jobCustomFieldValue.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends JobCustomFieldValueCreateManyAndReturnArgs>(args?: SelectSubset<T, JobCustomFieldValueCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a JobCustomFieldValue.
     * @param {JobCustomFieldValueDeleteArgs} args - Arguments to delete one JobCustomFieldValue.
     * @example
     * // Delete one JobCustomFieldValue
     * const JobCustomFieldValue = await prisma.jobCustomFieldValue.delete({
     *   where: {
     *     // ... filter to delete one JobCustomFieldValue
     *   }
     * })
     * 
     */
    delete<T extends JobCustomFieldValueDeleteArgs>(args: SelectSubset<T, JobCustomFieldValueDeleteArgs<ExtArgs>>): Prisma__JobCustomFieldValueClient<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one JobCustomFieldValue.
     * @param {JobCustomFieldValueUpdateArgs} args - Arguments to update one JobCustomFieldValue.
     * @example
     * // Update one JobCustomFieldValue
     * const jobCustomFieldValue = await prisma.jobCustomFieldValue.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends JobCustomFieldValueUpdateArgs>(args: SelectSubset<T, JobCustomFieldValueUpdateArgs<ExtArgs>>): Prisma__JobCustomFieldValueClient<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more JobCustomFieldValues.
     * @param {JobCustomFieldValueDeleteManyArgs} args - Arguments to filter JobCustomFieldValues to delete.
     * @example
     * // Delete a few JobCustomFieldValues
     * const { count } = await prisma.jobCustomFieldValue.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends JobCustomFieldValueDeleteManyArgs>(args?: SelectSubset<T, JobCustomFieldValueDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more JobCustomFieldValues.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldValueUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many JobCustomFieldValues
     * const jobCustomFieldValue = await prisma.jobCustomFieldValue.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends JobCustomFieldValueUpdateManyArgs>(args: SelectSubset<T, JobCustomFieldValueUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one JobCustomFieldValue.
     * @param {JobCustomFieldValueUpsertArgs} args - Arguments to update or create a JobCustomFieldValue.
     * @example
     * // Update or create a JobCustomFieldValue
     * const jobCustomFieldValue = await prisma.jobCustomFieldValue.upsert({
     *   create: {
     *     // ... data to create a JobCustomFieldValue
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the JobCustomFieldValue we want to update
     *   }
     * })
     */
    upsert<T extends JobCustomFieldValueUpsertArgs>(args: SelectSubset<T, JobCustomFieldValueUpsertArgs<ExtArgs>>): Prisma__JobCustomFieldValueClient<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of JobCustomFieldValues.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldValueCountArgs} args - Arguments to filter JobCustomFieldValues to count.
     * @example
     * // Count the number of JobCustomFieldValues
     * const count = await prisma.jobCustomFieldValue.count({
     *   where: {
     *     // ... the filter for the JobCustomFieldValues we want to count
     *   }
     * })
    **/
    count<T extends JobCustomFieldValueCountArgs>(
      args?: Subset<T, JobCustomFieldValueCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], JobCustomFieldValueCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a JobCustomFieldValue.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldValueAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends JobCustomFieldValueAggregateArgs>(args: Subset<T, JobCustomFieldValueAggregateArgs>): Prisma.PrismaPromise<GetJobCustomFieldValueAggregateType<T>>

    /**
     * Group by JobCustomFieldValue.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCustomFieldValueGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends JobCustomFieldValueGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: JobCustomFieldValueGroupByArgs['orderBy'] }
        : { orderBy?: JobCustomFieldValueGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, JobCustomFieldValueGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobCustomFieldValueGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the JobCustomFieldValue model
   */
  readonly fields: JobCustomFieldValueFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for JobCustomFieldValue.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__JobCustomFieldValueClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    job<T extends JobDefaultArgs<ExtArgs> = {}>(args?: Subset<T, JobDefaultArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    fieldDef<T extends JobCustomFieldDefDefaultArgs<ExtArgs> = {}>(args?: Subset<T, JobCustomFieldDefDefaultArgs<ExtArgs>>): Prisma__JobCustomFieldDefClient<$Result.GetResult<Prisma.$JobCustomFieldDefPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the JobCustomFieldValue model
   */ 
  interface JobCustomFieldValueFieldRefs {
    readonly id: FieldRef<"JobCustomFieldValue", 'String'>
    readonly jobId: FieldRef<"JobCustomFieldValue", 'String'>
    readonly fieldDefId: FieldRef<"JobCustomFieldValue", 'String'>
    readonly value: FieldRef<"JobCustomFieldValue", 'Json'>
    readonly updatedAt: FieldRef<"JobCustomFieldValue", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * JobCustomFieldValue findUnique
   */
  export type JobCustomFieldValueFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldValue to fetch.
     */
    where: JobCustomFieldValueWhereUniqueInput
  }

  /**
   * JobCustomFieldValue findUniqueOrThrow
   */
  export type JobCustomFieldValueFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldValue to fetch.
     */
    where: JobCustomFieldValueWhereUniqueInput
  }

  /**
   * JobCustomFieldValue findFirst
   */
  export type JobCustomFieldValueFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldValue to fetch.
     */
    where?: JobCustomFieldValueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobCustomFieldValues to fetch.
     */
    orderBy?: JobCustomFieldValueOrderByWithRelationInput | JobCustomFieldValueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobCustomFieldValues.
     */
    cursor?: JobCustomFieldValueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobCustomFieldValues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobCustomFieldValues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobCustomFieldValues.
     */
    distinct?: JobCustomFieldValueScalarFieldEnum | JobCustomFieldValueScalarFieldEnum[]
  }

  /**
   * JobCustomFieldValue findFirstOrThrow
   */
  export type JobCustomFieldValueFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldValue to fetch.
     */
    where?: JobCustomFieldValueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobCustomFieldValues to fetch.
     */
    orderBy?: JobCustomFieldValueOrderByWithRelationInput | JobCustomFieldValueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobCustomFieldValues.
     */
    cursor?: JobCustomFieldValueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobCustomFieldValues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobCustomFieldValues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobCustomFieldValues.
     */
    distinct?: JobCustomFieldValueScalarFieldEnum | JobCustomFieldValueScalarFieldEnum[]
  }

  /**
   * JobCustomFieldValue findMany
   */
  export type JobCustomFieldValueFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    /**
     * Filter, which JobCustomFieldValues to fetch.
     */
    where?: JobCustomFieldValueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobCustomFieldValues to fetch.
     */
    orderBy?: JobCustomFieldValueOrderByWithRelationInput | JobCustomFieldValueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing JobCustomFieldValues.
     */
    cursor?: JobCustomFieldValueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobCustomFieldValues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobCustomFieldValues.
     */
    skip?: number
    distinct?: JobCustomFieldValueScalarFieldEnum | JobCustomFieldValueScalarFieldEnum[]
  }

  /**
   * JobCustomFieldValue create
   */
  export type JobCustomFieldValueCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    /**
     * The data needed to create a JobCustomFieldValue.
     */
    data: XOR<JobCustomFieldValueCreateInput, JobCustomFieldValueUncheckedCreateInput>
  }

  /**
   * JobCustomFieldValue createMany
   */
  export type JobCustomFieldValueCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many JobCustomFieldValues.
     */
    data: JobCustomFieldValueCreateManyInput | JobCustomFieldValueCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * JobCustomFieldValue createManyAndReturn
   */
  export type JobCustomFieldValueCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many JobCustomFieldValues.
     */
    data: JobCustomFieldValueCreateManyInput | JobCustomFieldValueCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * JobCustomFieldValue update
   */
  export type JobCustomFieldValueUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    /**
     * The data needed to update a JobCustomFieldValue.
     */
    data: XOR<JobCustomFieldValueUpdateInput, JobCustomFieldValueUncheckedUpdateInput>
    /**
     * Choose, which JobCustomFieldValue to update.
     */
    where: JobCustomFieldValueWhereUniqueInput
  }

  /**
   * JobCustomFieldValue updateMany
   */
  export type JobCustomFieldValueUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update JobCustomFieldValues.
     */
    data: XOR<JobCustomFieldValueUpdateManyMutationInput, JobCustomFieldValueUncheckedUpdateManyInput>
    /**
     * Filter which JobCustomFieldValues to update
     */
    where?: JobCustomFieldValueWhereInput
  }

  /**
   * JobCustomFieldValue upsert
   */
  export type JobCustomFieldValueUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    /**
     * The filter to search for the JobCustomFieldValue to update in case it exists.
     */
    where: JobCustomFieldValueWhereUniqueInput
    /**
     * In case the JobCustomFieldValue found by the `where` argument doesn't exist, create a new JobCustomFieldValue with this data.
     */
    create: XOR<JobCustomFieldValueCreateInput, JobCustomFieldValueUncheckedCreateInput>
    /**
     * In case the JobCustomFieldValue was found with the provided `where` argument, update it with this data.
     */
    update: XOR<JobCustomFieldValueUpdateInput, JobCustomFieldValueUncheckedUpdateInput>
  }

  /**
   * JobCustomFieldValue delete
   */
  export type JobCustomFieldValueDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    /**
     * Filter which JobCustomFieldValue to delete.
     */
    where: JobCustomFieldValueWhereUniqueInput
  }

  /**
   * JobCustomFieldValue deleteMany
   */
  export type JobCustomFieldValueDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobCustomFieldValues to delete
     */
    where?: JobCustomFieldValueWhereInput
  }

  /**
   * JobCustomFieldValue without action
   */
  export type JobCustomFieldValueDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
  }


  /**
   * Model PriceBookItem
   */

  export type AggregatePriceBookItem = {
    _count: PriceBookItemCountAggregateOutputType | null
    _avg: PriceBookItemAvgAggregateOutputType | null
    _sum: PriceBookItemSumAggregateOutputType | null
    _min: PriceBookItemMinAggregateOutputType | null
    _max: PriceBookItemMaxAggregateOutputType | null
  }

  export type PriceBookItemAvgAggregateOutputType = {
    unitPrice: Decimal | null
  }

  export type PriceBookItemSumAggregateOutputType = {
    unitPrice: Decimal | null
  }

  export type PriceBookItemMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    category: $Enums.PriceCategory | null
    code: string | null
    name: string | null
    description: string | null
    unit: string | null
    unitPrice: Decimal | null
    taxable: boolean | null
    isActive: boolean | null
    jobTypeId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PriceBookItemMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    category: $Enums.PriceCategory | null
    code: string | null
    name: string | null
    description: string | null
    unit: string | null
    unitPrice: Decimal | null
    taxable: boolean | null
    isActive: boolean | null
    jobTypeId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PriceBookItemCountAggregateOutputType = {
    id: number
    companyId: number
    category: number
    code: number
    name: number
    description: number
    unit: number
    unitPrice: number
    taxable: number
    isActive: number
    jobTypeId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PriceBookItemAvgAggregateInputType = {
    unitPrice?: true
  }

  export type PriceBookItemSumAggregateInputType = {
    unitPrice?: true
  }

  export type PriceBookItemMinAggregateInputType = {
    id?: true
    companyId?: true
    category?: true
    code?: true
    name?: true
    description?: true
    unit?: true
    unitPrice?: true
    taxable?: true
    isActive?: true
    jobTypeId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PriceBookItemMaxAggregateInputType = {
    id?: true
    companyId?: true
    category?: true
    code?: true
    name?: true
    description?: true
    unit?: true
    unitPrice?: true
    taxable?: true
    isActive?: true
    jobTypeId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PriceBookItemCountAggregateInputType = {
    id?: true
    companyId?: true
    category?: true
    code?: true
    name?: true
    description?: true
    unit?: true
    unitPrice?: true
    taxable?: true
    isActive?: true
    jobTypeId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PriceBookItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PriceBookItem to aggregate.
     */
    where?: PriceBookItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceBookItems to fetch.
     */
    orderBy?: PriceBookItemOrderByWithRelationInput | PriceBookItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PriceBookItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceBookItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceBookItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PriceBookItems
    **/
    _count?: true | PriceBookItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PriceBookItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PriceBookItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PriceBookItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PriceBookItemMaxAggregateInputType
  }

  export type GetPriceBookItemAggregateType<T extends PriceBookItemAggregateArgs> = {
        [P in keyof T & keyof AggregatePriceBookItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePriceBookItem[P]>
      : GetScalarType<T[P], AggregatePriceBookItem[P]>
  }




  export type PriceBookItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PriceBookItemWhereInput
    orderBy?: PriceBookItemOrderByWithAggregationInput | PriceBookItemOrderByWithAggregationInput[]
    by: PriceBookItemScalarFieldEnum[] | PriceBookItemScalarFieldEnum
    having?: PriceBookItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PriceBookItemCountAggregateInputType | true
    _avg?: PriceBookItemAvgAggregateInputType
    _sum?: PriceBookItemSumAggregateInputType
    _min?: PriceBookItemMinAggregateInputType
    _max?: PriceBookItemMaxAggregateInputType
  }

  export type PriceBookItemGroupByOutputType = {
    id: string
    companyId: string
    category: $Enums.PriceCategory
    code: string | null
    name: string
    description: string | null
    unit: string
    unitPrice: Decimal
    taxable: boolean
    isActive: boolean
    jobTypeId: string | null
    createdAt: Date
    updatedAt: Date
    _count: PriceBookItemCountAggregateOutputType | null
    _avg: PriceBookItemAvgAggregateOutputType | null
    _sum: PriceBookItemSumAggregateOutputType | null
    _min: PriceBookItemMinAggregateOutputType | null
    _max: PriceBookItemMaxAggregateOutputType | null
  }

  type GetPriceBookItemGroupByPayload<T extends PriceBookItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PriceBookItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PriceBookItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PriceBookItemGroupByOutputType[P]>
            : GetScalarType<T[P], PriceBookItemGroupByOutputType[P]>
        }
      >
    >


  export type PriceBookItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    category?: boolean
    code?: boolean
    name?: boolean
    description?: boolean
    unit?: boolean
    unitPrice?: boolean
    taxable?: boolean
    isActive?: boolean
    jobTypeId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lineItems?: boolean | PriceBookItem$lineItemsArgs<ExtArgs>
    _count?: boolean | PriceBookItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["priceBookItem"]>

  export type PriceBookItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    category?: boolean
    code?: boolean
    name?: boolean
    description?: boolean
    unit?: boolean
    unitPrice?: boolean
    taxable?: boolean
    isActive?: boolean
    jobTypeId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["priceBookItem"]>

  export type PriceBookItemSelectScalar = {
    id?: boolean
    companyId?: boolean
    category?: boolean
    code?: boolean
    name?: boolean
    description?: boolean
    unit?: boolean
    unitPrice?: boolean
    taxable?: boolean
    isActive?: boolean
    jobTypeId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PriceBookItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lineItems?: boolean | PriceBookItem$lineItemsArgs<ExtArgs>
    _count?: boolean | PriceBookItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PriceBookItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PriceBookItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PriceBookItem"
    objects: {
      lineItems: Prisma.$WorkOrderLineItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      category: $Enums.PriceCategory
      code: string | null
      name: string
      description: string | null
      unit: string
      unitPrice: Prisma.Decimal
      taxable: boolean
      isActive: boolean
      jobTypeId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["priceBookItem"]>
    composites: {}
  }

  type PriceBookItemGetPayload<S extends boolean | null | undefined | PriceBookItemDefaultArgs> = $Result.GetResult<Prisma.$PriceBookItemPayload, S>

  type PriceBookItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PriceBookItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PriceBookItemCountAggregateInputType | true
    }

  export interface PriceBookItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PriceBookItem'], meta: { name: 'PriceBookItem' } }
    /**
     * Find zero or one PriceBookItem that matches the filter.
     * @param {PriceBookItemFindUniqueArgs} args - Arguments to find a PriceBookItem
     * @example
     * // Get one PriceBookItem
     * const priceBookItem = await prisma.priceBookItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PriceBookItemFindUniqueArgs>(args: SelectSubset<T, PriceBookItemFindUniqueArgs<ExtArgs>>): Prisma__PriceBookItemClient<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PriceBookItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PriceBookItemFindUniqueOrThrowArgs} args - Arguments to find a PriceBookItem
     * @example
     * // Get one PriceBookItem
     * const priceBookItem = await prisma.priceBookItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PriceBookItemFindUniqueOrThrowArgs>(args: SelectSubset<T, PriceBookItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PriceBookItemClient<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PriceBookItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceBookItemFindFirstArgs} args - Arguments to find a PriceBookItem
     * @example
     * // Get one PriceBookItem
     * const priceBookItem = await prisma.priceBookItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PriceBookItemFindFirstArgs>(args?: SelectSubset<T, PriceBookItemFindFirstArgs<ExtArgs>>): Prisma__PriceBookItemClient<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PriceBookItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceBookItemFindFirstOrThrowArgs} args - Arguments to find a PriceBookItem
     * @example
     * // Get one PriceBookItem
     * const priceBookItem = await prisma.priceBookItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PriceBookItemFindFirstOrThrowArgs>(args?: SelectSubset<T, PriceBookItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__PriceBookItemClient<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PriceBookItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceBookItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PriceBookItems
     * const priceBookItems = await prisma.priceBookItem.findMany()
     * 
     * // Get first 10 PriceBookItems
     * const priceBookItems = await prisma.priceBookItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const priceBookItemWithIdOnly = await prisma.priceBookItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PriceBookItemFindManyArgs>(args?: SelectSubset<T, PriceBookItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PriceBookItem.
     * @param {PriceBookItemCreateArgs} args - Arguments to create a PriceBookItem.
     * @example
     * // Create one PriceBookItem
     * const PriceBookItem = await prisma.priceBookItem.create({
     *   data: {
     *     // ... data to create a PriceBookItem
     *   }
     * })
     * 
     */
    create<T extends PriceBookItemCreateArgs>(args: SelectSubset<T, PriceBookItemCreateArgs<ExtArgs>>): Prisma__PriceBookItemClient<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PriceBookItems.
     * @param {PriceBookItemCreateManyArgs} args - Arguments to create many PriceBookItems.
     * @example
     * // Create many PriceBookItems
     * const priceBookItem = await prisma.priceBookItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PriceBookItemCreateManyArgs>(args?: SelectSubset<T, PriceBookItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PriceBookItems and returns the data saved in the database.
     * @param {PriceBookItemCreateManyAndReturnArgs} args - Arguments to create many PriceBookItems.
     * @example
     * // Create many PriceBookItems
     * const priceBookItem = await prisma.priceBookItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PriceBookItems and only return the `id`
     * const priceBookItemWithIdOnly = await prisma.priceBookItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PriceBookItemCreateManyAndReturnArgs>(args?: SelectSubset<T, PriceBookItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PriceBookItem.
     * @param {PriceBookItemDeleteArgs} args - Arguments to delete one PriceBookItem.
     * @example
     * // Delete one PriceBookItem
     * const PriceBookItem = await prisma.priceBookItem.delete({
     *   where: {
     *     // ... filter to delete one PriceBookItem
     *   }
     * })
     * 
     */
    delete<T extends PriceBookItemDeleteArgs>(args: SelectSubset<T, PriceBookItemDeleteArgs<ExtArgs>>): Prisma__PriceBookItemClient<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PriceBookItem.
     * @param {PriceBookItemUpdateArgs} args - Arguments to update one PriceBookItem.
     * @example
     * // Update one PriceBookItem
     * const priceBookItem = await prisma.priceBookItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PriceBookItemUpdateArgs>(args: SelectSubset<T, PriceBookItemUpdateArgs<ExtArgs>>): Prisma__PriceBookItemClient<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PriceBookItems.
     * @param {PriceBookItemDeleteManyArgs} args - Arguments to filter PriceBookItems to delete.
     * @example
     * // Delete a few PriceBookItems
     * const { count } = await prisma.priceBookItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PriceBookItemDeleteManyArgs>(args?: SelectSubset<T, PriceBookItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PriceBookItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceBookItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PriceBookItems
     * const priceBookItem = await prisma.priceBookItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PriceBookItemUpdateManyArgs>(args: SelectSubset<T, PriceBookItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PriceBookItem.
     * @param {PriceBookItemUpsertArgs} args - Arguments to update or create a PriceBookItem.
     * @example
     * // Update or create a PriceBookItem
     * const priceBookItem = await prisma.priceBookItem.upsert({
     *   create: {
     *     // ... data to create a PriceBookItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PriceBookItem we want to update
     *   }
     * })
     */
    upsert<T extends PriceBookItemUpsertArgs>(args: SelectSubset<T, PriceBookItemUpsertArgs<ExtArgs>>): Prisma__PriceBookItemClient<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PriceBookItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceBookItemCountArgs} args - Arguments to filter PriceBookItems to count.
     * @example
     * // Count the number of PriceBookItems
     * const count = await prisma.priceBookItem.count({
     *   where: {
     *     // ... the filter for the PriceBookItems we want to count
     *   }
     * })
    **/
    count<T extends PriceBookItemCountArgs>(
      args?: Subset<T, PriceBookItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PriceBookItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PriceBookItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceBookItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PriceBookItemAggregateArgs>(args: Subset<T, PriceBookItemAggregateArgs>): Prisma.PrismaPromise<GetPriceBookItemAggregateType<T>>

    /**
     * Group by PriceBookItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceBookItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PriceBookItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PriceBookItemGroupByArgs['orderBy'] }
        : { orderBy?: PriceBookItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PriceBookItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPriceBookItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PriceBookItem model
   */
  readonly fields: PriceBookItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PriceBookItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PriceBookItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lineItems<T extends PriceBookItem$lineItemsArgs<ExtArgs> = {}>(args?: Subset<T, PriceBookItem$lineItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PriceBookItem model
   */ 
  interface PriceBookItemFieldRefs {
    readonly id: FieldRef<"PriceBookItem", 'String'>
    readonly companyId: FieldRef<"PriceBookItem", 'String'>
    readonly category: FieldRef<"PriceBookItem", 'PriceCategory'>
    readonly code: FieldRef<"PriceBookItem", 'String'>
    readonly name: FieldRef<"PriceBookItem", 'String'>
    readonly description: FieldRef<"PriceBookItem", 'String'>
    readonly unit: FieldRef<"PriceBookItem", 'String'>
    readonly unitPrice: FieldRef<"PriceBookItem", 'Decimal'>
    readonly taxable: FieldRef<"PriceBookItem", 'Boolean'>
    readonly isActive: FieldRef<"PriceBookItem", 'Boolean'>
    readonly jobTypeId: FieldRef<"PriceBookItem", 'String'>
    readonly createdAt: FieldRef<"PriceBookItem", 'DateTime'>
    readonly updatedAt: FieldRef<"PriceBookItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PriceBookItem findUnique
   */
  export type PriceBookItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    /**
     * Filter, which PriceBookItem to fetch.
     */
    where: PriceBookItemWhereUniqueInput
  }

  /**
   * PriceBookItem findUniqueOrThrow
   */
  export type PriceBookItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    /**
     * Filter, which PriceBookItem to fetch.
     */
    where: PriceBookItemWhereUniqueInput
  }

  /**
   * PriceBookItem findFirst
   */
  export type PriceBookItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    /**
     * Filter, which PriceBookItem to fetch.
     */
    where?: PriceBookItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceBookItems to fetch.
     */
    orderBy?: PriceBookItemOrderByWithRelationInput | PriceBookItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PriceBookItems.
     */
    cursor?: PriceBookItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceBookItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceBookItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PriceBookItems.
     */
    distinct?: PriceBookItemScalarFieldEnum | PriceBookItemScalarFieldEnum[]
  }

  /**
   * PriceBookItem findFirstOrThrow
   */
  export type PriceBookItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    /**
     * Filter, which PriceBookItem to fetch.
     */
    where?: PriceBookItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceBookItems to fetch.
     */
    orderBy?: PriceBookItemOrderByWithRelationInput | PriceBookItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PriceBookItems.
     */
    cursor?: PriceBookItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceBookItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceBookItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PriceBookItems.
     */
    distinct?: PriceBookItemScalarFieldEnum | PriceBookItemScalarFieldEnum[]
  }

  /**
   * PriceBookItem findMany
   */
  export type PriceBookItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    /**
     * Filter, which PriceBookItems to fetch.
     */
    where?: PriceBookItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceBookItems to fetch.
     */
    orderBy?: PriceBookItemOrderByWithRelationInput | PriceBookItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PriceBookItems.
     */
    cursor?: PriceBookItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceBookItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceBookItems.
     */
    skip?: number
    distinct?: PriceBookItemScalarFieldEnum | PriceBookItemScalarFieldEnum[]
  }

  /**
   * PriceBookItem create
   */
  export type PriceBookItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    /**
     * The data needed to create a PriceBookItem.
     */
    data: XOR<PriceBookItemCreateInput, PriceBookItemUncheckedCreateInput>
  }

  /**
   * PriceBookItem createMany
   */
  export type PriceBookItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PriceBookItems.
     */
    data: PriceBookItemCreateManyInput | PriceBookItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PriceBookItem createManyAndReturn
   */
  export type PriceBookItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PriceBookItems.
     */
    data: PriceBookItemCreateManyInput | PriceBookItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PriceBookItem update
   */
  export type PriceBookItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    /**
     * The data needed to update a PriceBookItem.
     */
    data: XOR<PriceBookItemUpdateInput, PriceBookItemUncheckedUpdateInput>
    /**
     * Choose, which PriceBookItem to update.
     */
    where: PriceBookItemWhereUniqueInput
  }

  /**
   * PriceBookItem updateMany
   */
  export type PriceBookItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PriceBookItems.
     */
    data: XOR<PriceBookItemUpdateManyMutationInput, PriceBookItemUncheckedUpdateManyInput>
    /**
     * Filter which PriceBookItems to update
     */
    where?: PriceBookItemWhereInput
  }

  /**
   * PriceBookItem upsert
   */
  export type PriceBookItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    /**
     * The filter to search for the PriceBookItem to update in case it exists.
     */
    where: PriceBookItemWhereUniqueInput
    /**
     * In case the PriceBookItem found by the `where` argument doesn't exist, create a new PriceBookItem with this data.
     */
    create: XOR<PriceBookItemCreateInput, PriceBookItemUncheckedCreateInput>
    /**
     * In case the PriceBookItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PriceBookItemUpdateInput, PriceBookItemUncheckedUpdateInput>
  }

  /**
   * PriceBookItem delete
   */
  export type PriceBookItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    /**
     * Filter which PriceBookItem to delete.
     */
    where: PriceBookItemWhereUniqueInput
  }

  /**
   * PriceBookItem deleteMany
   */
  export type PriceBookItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PriceBookItems to delete
     */
    where?: PriceBookItemWhereInput
  }

  /**
   * PriceBookItem.lineItems
   */
  export type PriceBookItem$lineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    where?: WorkOrderLineItemWhereInput
    orderBy?: WorkOrderLineItemOrderByWithRelationInput | WorkOrderLineItemOrderByWithRelationInput[]
    cursor?: WorkOrderLineItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkOrderLineItemScalarFieldEnum | WorkOrderLineItemScalarFieldEnum[]
  }

  /**
   * PriceBookItem without action
   */
  export type PriceBookItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
  }


  /**
   * Model Job
   */

  export type AggregateJob = {
    _count: JobCountAggregateOutputType | null
    _avg: JobAvgAggregateOutputType | null
    _sum: JobSumAggregateOutputType | null
    _min: JobMinAggregateOutputType | null
    _max: JobMaxAggregateOutputType | null
  }

  export type JobAvgAggregateOutputType = {
    serviceLatitude: Decimal | null
    serviceLongitude: Decimal | null
    estimatedDurationMins: number | null
    travelDistanceKm: Decimal | null
  }

  export type JobSumAggregateOutputType = {
    serviceLatitude: Decimal | null
    serviceLongitude: Decimal | null
    estimatedDurationMins: number | null
    travelDistanceKm: Decimal | null
  }

  export type JobMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobNumber: string | null
    customerId: string | null
    customerName: string | null
    customerPhone: string | null
    customerEmail: string | null
    serviceAddress: string | null
    serviceCity: string | null
    serviceState: string | null
    serviceZip: string | null
    serviceLatitude: Decimal | null
    serviceLongitude: Decimal | null
    jobTypeId: string | null
    templateId: string | null
    title: string | null
    description: string | null
    status: $Enums.JobStatus | null
    priority: $Enums.JobPriority | null
    assignedToId: string | null
    assignedToName: string | null
    scheduledStart: Date | null
    scheduledEnd: Date | null
    actualStart: Date | null
    actualEnd: Date | null
    estimatedDurationMins: number | null
    travelDistanceKm: Decimal | null
    quoteId: string | null
    invoiceId: string | null
    notes: string | null
    internalNotes: string | null
    createdByUserId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    completedAt: Date | null
  }

  export type JobMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobNumber: string | null
    customerId: string | null
    customerName: string | null
    customerPhone: string | null
    customerEmail: string | null
    serviceAddress: string | null
    serviceCity: string | null
    serviceState: string | null
    serviceZip: string | null
    serviceLatitude: Decimal | null
    serviceLongitude: Decimal | null
    jobTypeId: string | null
    templateId: string | null
    title: string | null
    description: string | null
    status: $Enums.JobStatus | null
    priority: $Enums.JobPriority | null
    assignedToId: string | null
    assignedToName: string | null
    scheduledStart: Date | null
    scheduledEnd: Date | null
    actualStart: Date | null
    actualEnd: Date | null
    estimatedDurationMins: number | null
    travelDistanceKm: Decimal | null
    quoteId: string | null
    invoiceId: string | null
    notes: string | null
    internalNotes: string | null
    createdByUserId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    completedAt: Date | null
  }

  export type JobCountAggregateOutputType = {
    id: number
    companyId: number
    jobNumber: number
    customerId: number
    customerName: number
    customerPhone: number
    customerEmail: number
    serviceAddress: number
    serviceCity: number
    serviceState: number
    serviceZip: number
    serviceLatitude: number
    serviceLongitude: number
    jobTypeId: number
    templateId: number
    title: number
    description: number
    status: number
    priority: number
    assignedToId: number
    assignedToName: number
    scheduledStart: number
    scheduledEnd: number
    actualStart: number
    actualEnd: number
    estimatedDurationMins: number
    travelDistanceKm: number
    quoteId: number
    invoiceId: number
    notes: number
    internalNotes: number
    tags: number
    createdByUserId: number
    createdAt: number
    updatedAt: number
    completedAt: number
    _all: number
  }


  export type JobAvgAggregateInputType = {
    serviceLatitude?: true
    serviceLongitude?: true
    estimatedDurationMins?: true
    travelDistanceKm?: true
  }

  export type JobSumAggregateInputType = {
    serviceLatitude?: true
    serviceLongitude?: true
    estimatedDurationMins?: true
    travelDistanceKm?: true
  }

  export type JobMinAggregateInputType = {
    id?: true
    companyId?: true
    jobNumber?: true
    customerId?: true
    customerName?: true
    customerPhone?: true
    customerEmail?: true
    serviceAddress?: true
    serviceCity?: true
    serviceState?: true
    serviceZip?: true
    serviceLatitude?: true
    serviceLongitude?: true
    jobTypeId?: true
    templateId?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    assignedToId?: true
    assignedToName?: true
    scheduledStart?: true
    scheduledEnd?: true
    actualStart?: true
    actualEnd?: true
    estimatedDurationMins?: true
    travelDistanceKm?: true
    quoteId?: true
    invoiceId?: true
    notes?: true
    internalNotes?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
    completedAt?: true
  }

  export type JobMaxAggregateInputType = {
    id?: true
    companyId?: true
    jobNumber?: true
    customerId?: true
    customerName?: true
    customerPhone?: true
    customerEmail?: true
    serviceAddress?: true
    serviceCity?: true
    serviceState?: true
    serviceZip?: true
    serviceLatitude?: true
    serviceLongitude?: true
    jobTypeId?: true
    templateId?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    assignedToId?: true
    assignedToName?: true
    scheduledStart?: true
    scheduledEnd?: true
    actualStart?: true
    actualEnd?: true
    estimatedDurationMins?: true
    travelDistanceKm?: true
    quoteId?: true
    invoiceId?: true
    notes?: true
    internalNotes?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
    completedAt?: true
  }

  export type JobCountAggregateInputType = {
    id?: true
    companyId?: true
    jobNumber?: true
    customerId?: true
    customerName?: true
    customerPhone?: true
    customerEmail?: true
    serviceAddress?: true
    serviceCity?: true
    serviceState?: true
    serviceZip?: true
    serviceLatitude?: true
    serviceLongitude?: true
    jobTypeId?: true
    templateId?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    assignedToId?: true
    assignedToName?: true
    scheduledStart?: true
    scheduledEnd?: true
    actualStart?: true
    actualEnd?: true
    estimatedDurationMins?: true
    travelDistanceKm?: true
    quoteId?: true
    invoiceId?: true
    notes?: true
    internalNotes?: true
    tags?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
    completedAt?: true
    _all?: true
  }

  export type JobAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Job to aggregate.
     */
    where?: JobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Jobs to fetch.
     */
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: JobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Jobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Jobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Jobs
    **/
    _count?: true | JobCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: JobAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: JobSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: JobMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: JobMaxAggregateInputType
  }

  export type GetJobAggregateType<T extends JobAggregateArgs> = {
        [P in keyof T & keyof AggregateJob]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateJob[P]>
      : GetScalarType<T[P], AggregateJob[P]>
  }




  export type JobGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobWhereInput
    orderBy?: JobOrderByWithAggregationInput | JobOrderByWithAggregationInput[]
    by: JobScalarFieldEnum[] | JobScalarFieldEnum
    having?: JobScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: JobCountAggregateInputType | true
    _avg?: JobAvgAggregateInputType
    _sum?: JobSumAggregateInputType
    _min?: JobMinAggregateInputType
    _max?: JobMaxAggregateInputType
  }

  export type JobGroupByOutputType = {
    id: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone: string | null
    customerEmail: string | null
    serviceAddress: string
    serviceCity: string | null
    serviceState: string | null
    serviceZip: string | null
    serviceLatitude: Decimal | null
    serviceLongitude: Decimal | null
    jobTypeId: string | null
    templateId: string | null
    title: string
    description: string | null
    status: $Enums.JobStatus
    priority: $Enums.JobPriority
    assignedToId: string | null
    assignedToName: string | null
    scheduledStart: Date | null
    scheduledEnd: Date | null
    actualStart: Date | null
    actualEnd: Date | null
    estimatedDurationMins: number | null
    travelDistanceKm: Decimal | null
    quoteId: string | null
    invoiceId: string | null
    notes: string | null
    internalNotes: string | null
    tags: string[]
    createdByUserId: string
    createdAt: Date
    updatedAt: Date
    completedAt: Date | null
    _count: JobCountAggregateOutputType | null
    _avg: JobAvgAggregateOutputType | null
    _sum: JobSumAggregateOutputType | null
    _min: JobMinAggregateOutputType | null
    _max: JobMaxAggregateOutputType | null
  }

  type GetJobGroupByPayload<T extends JobGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<JobGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof JobGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], JobGroupByOutputType[P]>
            : GetScalarType<T[P], JobGroupByOutputType[P]>
        }
      >
    >


  export type JobSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobNumber?: boolean
    customerId?: boolean
    customerName?: boolean
    customerPhone?: boolean
    customerEmail?: boolean
    serviceAddress?: boolean
    serviceCity?: boolean
    serviceState?: boolean
    serviceZip?: boolean
    serviceLatitude?: boolean
    serviceLongitude?: boolean
    jobTypeId?: boolean
    templateId?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    assignedToId?: boolean
    assignedToName?: boolean
    scheduledStart?: boolean
    scheduledEnd?: boolean
    actualStart?: boolean
    actualEnd?: boolean
    estimatedDurationMins?: boolean
    travelDistanceKm?: boolean
    quoteId?: boolean
    invoiceId?: boolean
    notes?: boolean
    internalNotes?: boolean
    tags?: boolean
    createdByUserId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
    jobType?: boolean | Job$jobTypeArgs<ExtArgs>
    template?: boolean | Job$templateArgs<ExtArgs>
    workOrders?: boolean | Job$workOrdersArgs<ExtArgs>
    customFieldValues?: boolean | Job$customFieldValuesArgs<ExtArgs>
    statusHistory?: boolean | Job$statusHistoryArgs<ExtArgs>
    photos?: boolean | Job$photosArgs<ExtArgs>
    _count?: boolean | JobCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["job"]>

  export type JobSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobNumber?: boolean
    customerId?: boolean
    customerName?: boolean
    customerPhone?: boolean
    customerEmail?: boolean
    serviceAddress?: boolean
    serviceCity?: boolean
    serviceState?: boolean
    serviceZip?: boolean
    serviceLatitude?: boolean
    serviceLongitude?: boolean
    jobTypeId?: boolean
    templateId?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    assignedToId?: boolean
    assignedToName?: boolean
    scheduledStart?: boolean
    scheduledEnd?: boolean
    actualStart?: boolean
    actualEnd?: boolean
    estimatedDurationMins?: boolean
    travelDistanceKm?: boolean
    quoteId?: boolean
    invoiceId?: boolean
    notes?: boolean
    internalNotes?: boolean
    tags?: boolean
    createdByUserId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
    jobType?: boolean | Job$jobTypeArgs<ExtArgs>
    template?: boolean | Job$templateArgs<ExtArgs>
  }, ExtArgs["result"]["job"]>

  export type JobSelectScalar = {
    id?: boolean
    companyId?: boolean
    jobNumber?: boolean
    customerId?: boolean
    customerName?: boolean
    customerPhone?: boolean
    customerEmail?: boolean
    serviceAddress?: boolean
    serviceCity?: boolean
    serviceState?: boolean
    serviceZip?: boolean
    serviceLatitude?: boolean
    serviceLongitude?: boolean
    jobTypeId?: boolean
    templateId?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    assignedToId?: boolean
    assignedToName?: boolean
    scheduledStart?: boolean
    scheduledEnd?: boolean
    actualStart?: boolean
    actualEnd?: boolean
    estimatedDurationMins?: boolean
    travelDistanceKm?: boolean
    quoteId?: boolean
    invoiceId?: boolean
    notes?: boolean
    internalNotes?: boolean
    tags?: boolean
    createdByUserId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
  }

  export type JobInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobType?: boolean | Job$jobTypeArgs<ExtArgs>
    template?: boolean | Job$templateArgs<ExtArgs>
    workOrders?: boolean | Job$workOrdersArgs<ExtArgs>
    customFieldValues?: boolean | Job$customFieldValuesArgs<ExtArgs>
    statusHistory?: boolean | Job$statusHistoryArgs<ExtArgs>
    photos?: boolean | Job$photosArgs<ExtArgs>
    _count?: boolean | JobCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type JobIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobType?: boolean | Job$jobTypeArgs<ExtArgs>
    template?: boolean | Job$templateArgs<ExtArgs>
  }

  export type $JobPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Job"
    objects: {
      jobType: Prisma.$JobTypePayload<ExtArgs> | null
      template: Prisma.$JobTemplatePayload<ExtArgs> | null
      workOrders: Prisma.$WorkOrderPayload<ExtArgs>[]
      customFieldValues: Prisma.$JobCustomFieldValuePayload<ExtArgs>[]
      statusHistory: Prisma.$JobStatusHistoryPayload<ExtArgs>[]
      photos: Prisma.$JobPhotoPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      jobNumber: string
      customerId: string
      customerName: string
      customerPhone: string | null
      customerEmail: string | null
      serviceAddress: string
      serviceCity: string | null
      serviceState: string | null
      serviceZip: string | null
      serviceLatitude: Prisma.Decimal | null
      serviceLongitude: Prisma.Decimal | null
      jobTypeId: string | null
      templateId: string | null
      title: string
      description: string | null
      status: $Enums.JobStatus
      priority: $Enums.JobPriority
      assignedToId: string | null
      assignedToName: string | null
      scheduledStart: Date | null
      scheduledEnd: Date | null
      actualStart: Date | null
      actualEnd: Date | null
      estimatedDurationMins: number | null
      travelDistanceKm: Prisma.Decimal | null
      quoteId: string | null
      invoiceId: string | null
      notes: string | null
      internalNotes: string | null
      tags: string[]
      createdByUserId: string
      createdAt: Date
      updatedAt: Date
      completedAt: Date | null
    }, ExtArgs["result"]["job"]>
    composites: {}
  }

  type JobGetPayload<S extends boolean | null | undefined | JobDefaultArgs> = $Result.GetResult<Prisma.$JobPayload, S>

  type JobCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<JobFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: JobCountAggregateInputType | true
    }

  export interface JobDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Job'], meta: { name: 'Job' } }
    /**
     * Find zero or one Job that matches the filter.
     * @param {JobFindUniqueArgs} args - Arguments to find a Job
     * @example
     * // Get one Job
     * const job = await prisma.job.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends JobFindUniqueArgs>(args: SelectSubset<T, JobFindUniqueArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Job that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {JobFindUniqueOrThrowArgs} args - Arguments to find a Job
     * @example
     * // Get one Job
     * const job = await prisma.job.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends JobFindUniqueOrThrowArgs>(args: SelectSubset<T, JobFindUniqueOrThrowArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Job that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobFindFirstArgs} args - Arguments to find a Job
     * @example
     * // Get one Job
     * const job = await prisma.job.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends JobFindFirstArgs>(args?: SelectSubset<T, JobFindFirstArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Job that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobFindFirstOrThrowArgs} args - Arguments to find a Job
     * @example
     * // Get one Job
     * const job = await prisma.job.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends JobFindFirstOrThrowArgs>(args?: SelectSubset<T, JobFindFirstOrThrowArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Jobs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Jobs
     * const jobs = await prisma.job.findMany()
     * 
     * // Get first 10 Jobs
     * const jobs = await prisma.job.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const jobWithIdOnly = await prisma.job.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends JobFindManyArgs>(args?: SelectSubset<T, JobFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Job.
     * @param {JobCreateArgs} args - Arguments to create a Job.
     * @example
     * // Create one Job
     * const Job = await prisma.job.create({
     *   data: {
     *     // ... data to create a Job
     *   }
     * })
     * 
     */
    create<T extends JobCreateArgs>(args: SelectSubset<T, JobCreateArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Jobs.
     * @param {JobCreateManyArgs} args - Arguments to create many Jobs.
     * @example
     * // Create many Jobs
     * const job = await prisma.job.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends JobCreateManyArgs>(args?: SelectSubset<T, JobCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Jobs and returns the data saved in the database.
     * @param {JobCreateManyAndReturnArgs} args - Arguments to create many Jobs.
     * @example
     * // Create many Jobs
     * const job = await prisma.job.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Jobs and only return the `id`
     * const jobWithIdOnly = await prisma.job.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends JobCreateManyAndReturnArgs>(args?: SelectSubset<T, JobCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Job.
     * @param {JobDeleteArgs} args - Arguments to delete one Job.
     * @example
     * // Delete one Job
     * const Job = await prisma.job.delete({
     *   where: {
     *     // ... filter to delete one Job
     *   }
     * })
     * 
     */
    delete<T extends JobDeleteArgs>(args: SelectSubset<T, JobDeleteArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Job.
     * @param {JobUpdateArgs} args - Arguments to update one Job.
     * @example
     * // Update one Job
     * const job = await prisma.job.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends JobUpdateArgs>(args: SelectSubset<T, JobUpdateArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Jobs.
     * @param {JobDeleteManyArgs} args - Arguments to filter Jobs to delete.
     * @example
     * // Delete a few Jobs
     * const { count } = await prisma.job.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends JobDeleteManyArgs>(args?: SelectSubset<T, JobDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Jobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Jobs
     * const job = await prisma.job.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends JobUpdateManyArgs>(args: SelectSubset<T, JobUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Job.
     * @param {JobUpsertArgs} args - Arguments to update or create a Job.
     * @example
     * // Update or create a Job
     * const job = await prisma.job.upsert({
     *   create: {
     *     // ... data to create a Job
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Job we want to update
     *   }
     * })
     */
    upsert<T extends JobUpsertArgs>(args: SelectSubset<T, JobUpsertArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Jobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCountArgs} args - Arguments to filter Jobs to count.
     * @example
     * // Count the number of Jobs
     * const count = await prisma.job.count({
     *   where: {
     *     // ... the filter for the Jobs we want to count
     *   }
     * })
    **/
    count<T extends JobCountArgs>(
      args?: Subset<T, JobCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], JobCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Job.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends JobAggregateArgs>(args: Subset<T, JobAggregateArgs>): Prisma.PrismaPromise<GetJobAggregateType<T>>

    /**
     * Group by Job.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends JobGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: JobGroupByArgs['orderBy'] }
        : { orderBy?: JobGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, JobGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Job model
   */
  readonly fields: JobFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Job.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__JobClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    jobType<T extends Job$jobTypeArgs<ExtArgs> = {}>(args?: Subset<T, Job$jobTypeArgs<ExtArgs>>): Prisma__JobTypeClient<$Result.GetResult<Prisma.$JobTypePayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    template<T extends Job$templateArgs<ExtArgs> = {}>(args?: Subset<T, Job$templateArgs<ExtArgs>>): Prisma__JobTemplateClient<$Result.GetResult<Prisma.$JobTemplatePayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    workOrders<T extends Job$workOrdersArgs<ExtArgs> = {}>(args?: Subset<T, Job$workOrdersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "findMany"> | Null>
    customFieldValues<T extends Job$customFieldValuesArgs<ExtArgs> = {}>(args?: Subset<T, Job$customFieldValuesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobCustomFieldValuePayload<ExtArgs>, T, "findMany"> | Null>
    statusHistory<T extends Job$statusHistoryArgs<ExtArgs> = {}>(args?: Subset<T, Job$statusHistoryArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "findMany"> | Null>
    photos<T extends Job$photosArgs<ExtArgs> = {}>(args?: Subset<T, Job$photosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Job model
   */ 
  interface JobFieldRefs {
    readonly id: FieldRef<"Job", 'String'>
    readonly companyId: FieldRef<"Job", 'String'>
    readonly jobNumber: FieldRef<"Job", 'String'>
    readonly customerId: FieldRef<"Job", 'String'>
    readonly customerName: FieldRef<"Job", 'String'>
    readonly customerPhone: FieldRef<"Job", 'String'>
    readonly customerEmail: FieldRef<"Job", 'String'>
    readonly serviceAddress: FieldRef<"Job", 'String'>
    readonly serviceCity: FieldRef<"Job", 'String'>
    readonly serviceState: FieldRef<"Job", 'String'>
    readonly serviceZip: FieldRef<"Job", 'String'>
    readonly serviceLatitude: FieldRef<"Job", 'Decimal'>
    readonly serviceLongitude: FieldRef<"Job", 'Decimal'>
    readonly jobTypeId: FieldRef<"Job", 'String'>
    readonly templateId: FieldRef<"Job", 'String'>
    readonly title: FieldRef<"Job", 'String'>
    readonly description: FieldRef<"Job", 'String'>
    readonly status: FieldRef<"Job", 'JobStatus'>
    readonly priority: FieldRef<"Job", 'JobPriority'>
    readonly assignedToId: FieldRef<"Job", 'String'>
    readonly assignedToName: FieldRef<"Job", 'String'>
    readonly scheduledStart: FieldRef<"Job", 'DateTime'>
    readonly scheduledEnd: FieldRef<"Job", 'DateTime'>
    readonly actualStart: FieldRef<"Job", 'DateTime'>
    readonly actualEnd: FieldRef<"Job", 'DateTime'>
    readonly estimatedDurationMins: FieldRef<"Job", 'Int'>
    readonly travelDistanceKm: FieldRef<"Job", 'Decimal'>
    readonly quoteId: FieldRef<"Job", 'String'>
    readonly invoiceId: FieldRef<"Job", 'String'>
    readonly notes: FieldRef<"Job", 'String'>
    readonly internalNotes: FieldRef<"Job", 'String'>
    readonly tags: FieldRef<"Job", 'String[]'>
    readonly createdByUserId: FieldRef<"Job", 'String'>
    readonly createdAt: FieldRef<"Job", 'DateTime'>
    readonly updatedAt: FieldRef<"Job", 'DateTime'>
    readonly completedAt: FieldRef<"Job", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Job findUnique
   */
  export type JobFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    /**
     * Filter, which Job to fetch.
     */
    where: JobWhereUniqueInput
  }

  /**
   * Job findUniqueOrThrow
   */
  export type JobFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    /**
     * Filter, which Job to fetch.
     */
    where: JobWhereUniqueInput
  }

  /**
   * Job findFirst
   */
  export type JobFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    /**
     * Filter, which Job to fetch.
     */
    where?: JobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Jobs to fetch.
     */
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Jobs.
     */
    cursor?: JobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Jobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Jobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Jobs.
     */
    distinct?: JobScalarFieldEnum | JobScalarFieldEnum[]
  }

  /**
   * Job findFirstOrThrow
   */
  export type JobFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    /**
     * Filter, which Job to fetch.
     */
    where?: JobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Jobs to fetch.
     */
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Jobs.
     */
    cursor?: JobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Jobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Jobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Jobs.
     */
    distinct?: JobScalarFieldEnum | JobScalarFieldEnum[]
  }

  /**
   * Job findMany
   */
  export type JobFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    /**
     * Filter, which Jobs to fetch.
     */
    where?: JobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Jobs to fetch.
     */
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Jobs.
     */
    cursor?: JobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Jobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Jobs.
     */
    skip?: number
    distinct?: JobScalarFieldEnum | JobScalarFieldEnum[]
  }

  /**
   * Job create
   */
  export type JobCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    /**
     * The data needed to create a Job.
     */
    data: XOR<JobCreateInput, JobUncheckedCreateInput>
  }

  /**
   * Job createMany
   */
  export type JobCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Jobs.
     */
    data: JobCreateManyInput | JobCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Job createManyAndReturn
   */
  export type JobCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Jobs.
     */
    data: JobCreateManyInput | JobCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Job update
   */
  export type JobUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    /**
     * The data needed to update a Job.
     */
    data: XOR<JobUpdateInput, JobUncheckedUpdateInput>
    /**
     * Choose, which Job to update.
     */
    where: JobWhereUniqueInput
  }

  /**
   * Job updateMany
   */
  export type JobUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Jobs.
     */
    data: XOR<JobUpdateManyMutationInput, JobUncheckedUpdateManyInput>
    /**
     * Filter which Jobs to update
     */
    where?: JobWhereInput
  }

  /**
   * Job upsert
   */
  export type JobUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    /**
     * The filter to search for the Job to update in case it exists.
     */
    where: JobWhereUniqueInput
    /**
     * In case the Job found by the `where` argument doesn't exist, create a new Job with this data.
     */
    create: XOR<JobCreateInput, JobUncheckedCreateInput>
    /**
     * In case the Job was found with the provided `where` argument, update it with this data.
     */
    update: XOR<JobUpdateInput, JobUncheckedUpdateInput>
  }

  /**
   * Job delete
   */
  export type JobDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
    /**
     * Filter which Job to delete.
     */
    where: JobWhereUniqueInput
  }

  /**
   * Job deleteMany
   */
  export type JobDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Jobs to delete
     */
    where?: JobWhereInput
  }

  /**
   * Job.jobType
   */
  export type Job$jobTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobType
     */
    select?: JobTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTypeInclude<ExtArgs> | null
    where?: JobTypeWhereInput
  }

  /**
   * Job.template
   */
  export type Job$templateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobTemplate
     */
    select?: JobTemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobTemplateInclude<ExtArgs> | null
    where?: JobTemplateWhereInput
  }

  /**
   * Job.workOrders
   */
  export type Job$workOrdersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    where?: WorkOrderWhereInput
    orderBy?: WorkOrderOrderByWithRelationInput | WorkOrderOrderByWithRelationInput[]
    cursor?: WorkOrderWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkOrderScalarFieldEnum | WorkOrderScalarFieldEnum[]
  }

  /**
   * Job.customFieldValues
   */
  export type Job$customFieldValuesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobCustomFieldValue
     */
    select?: JobCustomFieldValueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobCustomFieldValueInclude<ExtArgs> | null
    where?: JobCustomFieldValueWhereInput
    orderBy?: JobCustomFieldValueOrderByWithRelationInput | JobCustomFieldValueOrderByWithRelationInput[]
    cursor?: JobCustomFieldValueWhereUniqueInput
    take?: number
    skip?: number
    distinct?: JobCustomFieldValueScalarFieldEnum | JobCustomFieldValueScalarFieldEnum[]
  }

  /**
   * Job.statusHistory
   */
  export type Job$statusHistoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    where?: JobStatusHistoryWhereInput
    orderBy?: JobStatusHistoryOrderByWithRelationInput | JobStatusHistoryOrderByWithRelationInput[]
    cursor?: JobStatusHistoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: JobStatusHistoryScalarFieldEnum | JobStatusHistoryScalarFieldEnum[]
  }

  /**
   * Job.photos
   */
  export type Job$photosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    where?: JobPhotoWhereInput
    orderBy?: JobPhotoOrderByWithRelationInput | JobPhotoOrderByWithRelationInput[]
    cursor?: JobPhotoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: JobPhotoScalarFieldEnum | JobPhotoScalarFieldEnum[]
  }

  /**
   * Job without action
   */
  export type JobDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobInclude<ExtArgs> | null
  }


  /**
   * Model JobStatusHistory
   */

  export type AggregateJobStatusHistory = {
    _count: JobStatusHistoryCountAggregateOutputType | null
    _min: JobStatusHistoryMinAggregateOutputType | null
    _max: JobStatusHistoryMaxAggregateOutputType | null
  }

  export type JobStatusHistoryMinAggregateOutputType = {
    id: string | null
    jobId: string | null
    fromStatus: $Enums.JobStatus | null
    toStatus: $Enums.JobStatus | null
    changedById: string | null
    changedByName: string | null
    note: string | null
    createdAt: Date | null
  }

  export type JobStatusHistoryMaxAggregateOutputType = {
    id: string | null
    jobId: string | null
    fromStatus: $Enums.JobStatus | null
    toStatus: $Enums.JobStatus | null
    changedById: string | null
    changedByName: string | null
    note: string | null
    createdAt: Date | null
  }

  export type JobStatusHistoryCountAggregateOutputType = {
    id: number
    jobId: number
    fromStatus: number
    toStatus: number
    changedById: number
    changedByName: number
    note: number
    createdAt: number
    _all: number
  }


  export type JobStatusHistoryMinAggregateInputType = {
    id?: true
    jobId?: true
    fromStatus?: true
    toStatus?: true
    changedById?: true
    changedByName?: true
    note?: true
    createdAt?: true
  }

  export type JobStatusHistoryMaxAggregateInputType = {
    id?: true
    jobId?: true
    fromStatus?: true
    toStatus?: true
    changedById?: true
    changedByName?: true
    note?: true
    createdAt?: true
  }

  export type JobStatusHistoryCountAggregateInputType = {
    id?: true
    jobId?: true
    fromStatus?: true
    toStatus?: true
    changedById?: true
    changedByName?: true
    note?: true
    createdAt?: true
    _all?: true
  }

  export type JobStatusHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobStatusHistory to aggregate.
     */
    where?: JobStatusHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobStatusHistories to fetch.
     */
    orderBy?: JobStatusHistoryOrderByWithRelationInput | JobStatusHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: JobStatusHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobStatusHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobStatusHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned JobStatusHistories
    **/
    _count?: true | JobStatusHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: JobStatusHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: JobStatusHistoryMaxAggregateInputType
  }

  export type GetJobStatusHistoryAggregateType<T extends JobStatusHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateJobStatusHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateJobStatusHistory[P]>
      : GetScalarType<T[P], AggregateJobStatusHistory[P]>
  }




  export type JobStatusHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobStatusHistoryWhereInput
    orderBy?: JobStatusHistoryOrderByWithAggregationInput | JobStatusHistoryOrderByWithAggregationInput[]
    by: JobStatusHistoryScalarFieldEnum[] | JobStatusHistoryScalarFieldEnum
    having?: JobStatusHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: JobStatusHistoryCountAggregateInputType | true
    _min?: JobStatusHistoryMinAggregateInputType
    _max?: JobStatusHistoryMaxAggregateInputType
  }

  export type JobStatusHistoryGroupByOutputType = {
    id: string
    jobId: string
    fromStatus: $Enums.JobStatus | null
    toStatus: $Enums.JobStatus
    changedById: string
    changedByName: string
    note: string | null
    createdAt: Date
    _count: JobStatusHistoryCountAggregateOutputType | null
    _min: JobStatusHistoryMinAggregateOutputType | null
    _max: JobStatusHistoryMaxAggregateOutputType | null
  }

  type GetJobStatusHistoryGroupByPayload<T extends JobStatusHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<JobStatusHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof JobStatusHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], JobStatusHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], JobStatusHistoryGroupByOutputType[P]>
        }
      >
    >


  export type JobStatusHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobId?: boolean
    fromStatus?: boolean
    toStatus?: boolean
    changedById?: boolean
    changedByName?: boolean
    note?: boolean
    createdAt?: boolean
    job?: boolean | JobDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobStatusHistory"]>

  export type JobStatusHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobId?: boolean
    fromStatus?: boolean
    toStatus?: boolean
    changedById?: boolean
    changedByName?: boolean
    note?: boolean
    createdAt?: boolean
    job?: boolean | JobDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobStatusHistory"]>

  export type JobStatusHistorySelectScalar = {
    id?: boolean
    jobId?: boolean
    fromStatus?: boolean
    toStatus?: boolean
    changedById?: boolean
    changedByName?: boolean
    note?: boolean
    createdAt?: boolean
  }

  export type JobStatusHistoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | JobDefaultArgs<ExtArgs>
  }
  export type JobStatusHistoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | JobDefaultArgs<ExtArgs>
  }

  export type $JobStatusHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "JobStatusHistory"
    objects: {
      job: Prisma.$JobPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      jobId: string
      fromStatus: $Enums.JobStatus | null
      toStatus: $Enums.JobStatus
      changedById: string
      changedByName: string
      note: string | null
      createdAt: Date
    }, ExtArgs["result"]["jobStatusHistory"]>
    composites: {}
  }

  type JobStatusHistoryGetPayload<S extends boolean | null | undefined | JobStatusHistoryDefaultArgs> = $Result.GetResult<Prisma.$JobStatusHistoryPayload, S>

  type JobStatusHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<JobStatusHistoryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: JobStatusHistoryCountAggregateInputType | true
    }

  export interface JobStatusHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['JobStatusHistory'], meta: { name: 'JobStatusHistory' } }
    /**
     * Find zero or one JobStatusHistory that matches the filter.
     * @param {JobStatusHistoryFindUniqueArgs} args - Arguments to find a JobStatusHistory
     * @example
     * // Get one JobStatusHistory
     * const jobStatusHistory = await prisma.jobStatusHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends JobStatusHistoryFindUniqueArgs>(args: SelectSubset<T, JobStatusHistoryFindUniqueArgs<ExtArgs>>): Prisma__JobStatusHistoryClient<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one JobStatusHistory that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {JobStatusHistoryFindUniqueOrThrowArgs} args - Arguments to find a JobStatusHistory
     * @example
     * // Get one JobStatusHistory
     * const jobStatusHistory = await prisma.jobStatusHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends JobStatusHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, JobStatusHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__JobStatusHistoryClient<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first JobStatusHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobStatusHistoryFindFirstArgs} args - Arguments to find a JobStatusHistory
     * @example
     * // Get one JobStatusHistory
     * const jobStatusHistory = await prisma.jobStatusHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends JobStatusHistoryFindFirstArgs>(args?: SelectSubset<T, JobStatusHistoryFindFirstArgs<ExtArgs>>): Prisma__JobStatusHistoryClient<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first JobStatusHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobStatusHistoryFindFirstOrThrowArgs} args - Arguments to find a JobStatusHistory
     * @example
     * // Get one JobStatusHistory
     * const jobStatusHistory = await prisma.jobStatusHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends JobStatusHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, JobStatusHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__JobStatusHistoryClient<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more JobStatusHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobStatusHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all JobStatusHistories
     * const jobStatusHistories = await prisma.jobStatusHistory.findMany()
     * 
     * // Get first 10 JobStatusHistories
     * const jobStatusHistories = await prisma.jobStatusHistory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const jobStatusHistoryWithIdOnly = await prisma.jobStatusHistory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends JobStatusHistoryFindManyArgs>(args?: SelectSubset<T, JobStatusHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a JobStatusHistory.
     * @param {JobStatusHistoryCreateArgs} args - Arguments to create a JobStatusHistory.
     * @example
     * // Create one JobStatusHistory
     * const JobStatusHistory = await prisma.jobStatusHistory.create({
     *   data: {
     *     // ... data to create a JobStatusHistory
     *   }
     * })
     * 
     */
    create<T extends JobStatusHistoryCreateArgs>(args: SelectSubset<T, JobStatusHistoryCreateArgs<ExtArgs>>): Prisma__JobStatusHistoryClient<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many JobStatusHistories.
     * @param {JobStatusHistoryCreateManyArgs} args - Arguments to create many JobStatusHistories.
     * @example
     * // Create many JobStatusHistories
     * const jobStatusHistory = await prisma.jobStatusHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends JobStatusHistoryCreateManyArgs>(args?: SelectSubset<T, JobStatusHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many JobStatusHistories and returns the data saved in the database.
     * @param {JobStatusHistoryCreateManyAndReturnArgs} args - Arguments to create many JobStatusHistories.
     * @example
     * // Create many JobStatusHistories
     * const jobStatusHistory = await prisma.jobStatusHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many JobStatusHistories and only return the `id`
     * const jobStatusHistoryWithIdOnly = await prisma.jobStatusHistory.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends JobStatusHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, JobStatusHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a JobStatusHistory.
     * @param {JobStatusHistoryDeleteArgs} args - Arguments to delete one JobStatusHistory.
     * @example
     * // Delete one JobStatusHistory
     * const JobStatusHistory = await prisma.jobStatusHistory.delete({
     *   where: {
     *     // ... filter to delete one JobStatusHistory
     *   }
     * })
     * 
     */
    delete<T extends JobStatusHistoryDeleteArgs>(args: SelectSubset<T, JobStatusHistoryDeleteArgs<ExtArgs>>): Prisma__JobStatusHistoryClient<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one JobStatusHistory.
     * @param {JobStatusHistoryUpdateArgs} args - Arguments to update one JobStatusHistory.
     * @example
     * // Update one JobStatusHistory
     * const jobStatusHistory = await prisma.jobStatusHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends JobStatusHistoryUpdateArgs>(args: SelectSubset<T, JobStatusHistoryUpdateArgs<ExtArgs>>): Prisma__JobStatusHistoryClient<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more JobStatusHistories.
     * @param {JobStatusHistoryDeleteManyArgs} args - Arguments to filter JobStatusHistories to delete.
     * @example
     * // Delete a few JobStatusHistories
     * const { count } = await prisma.jobStatusHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends JobStatusHistoryDeleteManyArgs>(args?: SelectSubset<T, JobStatusHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more JobStatusHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobStatusHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many JobStatusHistories
     * const jobStatusHistory = await prisma.jobStatusHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends JobStatusHistoryUpdateManyArgs>(args: SelectSubset<T, JobStatusHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one JobStatusHistory.
     * @param {JobStatusHistoryUpsertArgs} args - Arguments to update or create a JobStatusHistory.
     * @example
     * // Update or create a JobStatusHistory
     * const jobStatusHistory = await prisma.jobStatusHistory.upsert({
     *   create: {
     *     // ... data to create a JobStatusHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the JobStatusHistory we want to update
     *   }
     * })
     */
    upsert<T extends JobStatusHistoryUpsertArgs>(args: SelectSubset<T, JobStatusHistoryUpsertArgs<ExtArgs>>): Prisma__JobStatusHistoryClient<$Result.GetResult<Prisma.$JobStatusHistoryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of JobStatusHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobStatusHistoryCountArgs} args - Arguments to filter JobStatusHistories to count.
     * @example
     * // Count the number of JobStatusHistories
     * const count = await prisma.jobStatusHistory.count({
     *   where: {
     *     // ... the filter for the JobStatusHistories we want to count
     *   }
     * })
    **/
    count<T extends JobStatusHistoryCountArgs>(
      args?: Subset<T, JobStatusHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], JobStatusHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a JobStatusHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobStatusHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends JobStatusHistoryAggregateArgs>(args: Subset<T, JobStatusHistoryAggregateArgs>): Prisma.PrismaPromise<GetJobStatusHistoryAggregateType<T>>

    /**
     * Group by JobStatusHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobStatusHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends JobStatusHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: JobStatusHistoryGroupByArgs['orderBy'] }
        : { orderBy?: JobStatusHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, JobStatusHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobStatusHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the JobStatusHistory model
   */
  readonly fields: JobStatusHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for JobStatusHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__JobStatusHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    job<T extends JobDefaultArgs<ExtArgs> = {}>(args?: Subset<T, JobDefaultArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the JobStatusHistory model
   */ 
  interface JobStatusHistoryFieldRefs {
    readonly id: FieldRef<"JobStatusHistory", 'String'>
    readonly jobId: FieldRef<"JobStatusHistory", 'String'>
    readonly fromStatus: FieldRef<"JobStatusHistory", 'JobStatus'>
    readonly toStatus: FieldRef<"JobStatusHistory", 'JobStatus'>
    readonly changedById: FieldRef<"JobStatusHistory", 'String'>
    readonly changedByName: FieldRef<"JobStatusHistory", 'String'>
    readonly note: FieldRef<"JobStatusHistory", 'String'>
    readonly createdAt: FieldRef<"JobStatusHistory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * JobStatusHistory findUnique
   */
  export type JobStatusHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    /**
     * Filter, which JobStatusHistory to fetch.
     */
    where: JobStatusHistoryWhereUniqueInput
  }

  /**
   * JobStatusHistory findUniqueOrThrow
   */
  export type JobStatusHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    /**
     * Filter, which JobStatusHistory to fetch.
     */
    where: JobStatusHistoryWhereUniqueInput
  }

  /**
   * JobStatusHistory findFirst
   */
  export type JobStatusHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    /**
     * Filter, which JobStatusHistory to fetch.
     */
    where?: JobStatusHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobStatusHistories to fetch.
     */
    orderBy?: JobStatusHistoryOrderByWithRelationInput | JobStatusHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobStatusHistories.
     */
    cursor?: JobStatusHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobStatusHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobStatusHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobStatusHistories.
     */
    distinct?: JobStatusHistoryScalarFieldEnum | JobStatusHistoryScalarFieldEnum[]
  }

  /**
   * JobStatusHistory findFirstOrThrow
   */
  export type JobStatusHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    /**
     * Filter, which JobStatusHistory to fetch.
     */
    where?: JobStatusHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobStatusHistories to fetch.
     */
    orderBy?: JobStatusHistoryOrderByWithRelationInput | JobStatusHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobStatusHistories.
     */
    cursor?: JobStatusHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobStatusHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobStatusHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobStatusHistories.
     */
    distinct?: JobStatusHistoryScalarFieldEnum | JobStatusHistoryScalarFieldEnum[]
  }

  /**
   * JobStatusHistory findMany
   */
  export type JobStatusHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    /**
     * Filter, which JobStatusHistories to fetch.
     */
    where?: JobStatusHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobStatusHistories to fetch.
     */
    orderBy?: JobStatusHistoryOrderByWithRelationInput | JobStatusHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing JobStatusHistories.
     */
    cursor?: JobStatusHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobStatusHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobStatusHistories.
     */
    skip?: number
    distinct?: JobStatusHistoryScalarFieldEnum | JobStatusHistoryScalarFieldEnum[]
  }

  /**
   * JobStatusHistory create
   */
  export type JobStatusHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    /**
     * The data needed to create a JobStatusHistory.
     */
    data: XOR<JobStatusHistoryCreateInput, JobStatusHistoryUncheckedCreateInput>
  }

  /**
   * JobStatusHistory createMany
   */
  export type JobStatusHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many JobStatusHistories.
     */
    data: JobStatusHistoryCreateManyInput | JobStatusHistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * JobStatusHistory createManyAndReturn
   */
  export type JobStatusHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many JobStatusHistories.
     */
    data: JobStatusHistoryCreateManyInput | JobStatusHistoryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * JobStatusHistory update
   */
  export type JobStatusHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    /**
     * The data needed to update a JobStatusHistory.
     */
    data: XOR<JobStatusHistoryUpdateInput, JobStatusHistoryUncheckedUpdateInput>
    /**
     * Choose, which JobStatusHistory to update.
     */
    where: JobStatusHistoryWhereUniqueInput
  }

  /**
   * JobStatusHistory updateMany
   */
  export type JobStatusHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update JobStatusHistories.
     */
    data: XOR<JobStatusHistoryUpdateManyMutationInput, JobStatusHistoryUncheckedUpdateManyInput>
    /**
     * Filter which JobStatusHistories to update
     */
    where?: JobStatusHistoryWhereInput
  }

  /**
   * JobStatusHistory upsert
   */
  export type JobStatusHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    /**
     * The filter to search for the JobStatusHistory to update in case it exists.
     */
    where: JobStatusHistoryWhereUniqueInput
    /**
     * In case the JobStatusHistory found by the `where` argument doesn't exist, create a new JobStatusHistory with this data.
     */
    create: XOR<JobStatusHistoryCreateInput, JobStatusHistoryUncheckedCreateInput>
    /**
     * In case the JobStatusHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<JobStatusHistoryUpdateInput, JobStatusHistoryUncheckedUpdateInput>
  }

  /**
   * JobStatusHistory delete
   */
  export type JobStatusHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
    /**
     * Filter which JobStatusHistory to delete.
     */
    where: JobStatusHistoryWhereUniqueInput
  }

  /**
   * JobStatusHistory deleteMany
   */
  export type JobStatusHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobStatusHistories to delete
     */
    where?: JobStatusHistoryWhereInput
  }

  /**
   * JobStatusHistory without action
   */
  export type JobStatusHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobStatusHistory
     */
    select?: JobStatusHistorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobStatusHistoryInclude<ExtArgs> | null
  }


  /**
   * Model JobPhoto
   */

  export type AggregateJobPhoto = {
    _count: JobPhotoCountAggregateOutputType | null
    _min: JobPhotoMinAggregateOutputType | null
    _max: JobPhotoMaxAggregateOutputType | null
  }

  export type JobPhotoMinAggregateOutputType = {
    id: string | null
    jobId: string | null
    workOrderId: string | null
    s3Key: string | null
    caption: string | null
    photoType: $Enums.PhotoType | null
    uploadedById: string | null
    createdAt: Date | null
  }

  export type JobPhotoMaxAggregateOutputType = {
    id: string | null
    jobId: string | null
    workOrderId: string | null
    s3Key: string | null
    caption: string | null
    photoType: $Enums.PhotoType | null
    uploadedById: string | null
    createdAt: Date | null
  }

  export type JobPhotoCountAggregateOutputType = {
    id: number
    jobId: number
    workOrderId: number
    s3Key: number
    caption: number
    photoType: number
    uploadedById: number
    createdAt: number
    _all: number
  }


  export type JobPhotoMinAggregateInputType = {
    id?: true
    jobId?: true
    workOrderId?: true
    s3Key?: true
    caption?: true
    photoType?: true
    uploadedById?: true
    createdAt?: true
  }

  export type JobPhotoMaxAggregateInputType = {
    id?: true
    jobId?: true
    workOrderId?: true
    s3Key?: true
    caption?: true
    photoType?: true
    uploadedById?: true
    createdAt?: true
  }

  export type JobPhotoCountAggregateInputType = {
    id?: true
    jobId?: true
    workOrderId?: true
    s3Key?: true
    caption?: true
    photoType?: true
    uploadedById?: true
    createdAt?: true
    _all?: true
  }

  export type JobPhotoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobPhoto to aggregate.
     */
    where?: JobPhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobPhotos to fetch.
     */
    orderBy?: JobPhotoOrderByWithRelationInput | JobPhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: JobPhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobPhotos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobPhotos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned JobPhotos
    **/
    _count?: true | JobPhotoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: JobPhotoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: JobPhotoMaxAggregateInputType
  }

  export type GetJobPhotoAggregateType<T extends JobPhotoAggregateArgs> = {
        [P in keyof T & keyof AggregateJobPhoto]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateJobPhoto[P]>
      : GetScalarType<T[P], AggregateJobPhoto[P]>
  }




  export type JobPhotoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobPhotoWhereInput
    orderBy?: JobPhotoOrderByWithAggregationInput | JobPhotoOrderByWithAggregationInput[]
    by: JobPhotoScalarFieldEnum[] | JobPhotoScalarFieldEnum
    having?: JobPhotoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: JobPhotoCountAggregateInputType | true
    _min?: JobPhotoMinAggregateInputType
    _max?: JobPhotoMaxAggregateInputType
  }

  export type JobPhotoGroupByOutputType = {
    id: string
    jobId: string
    workOrderId: string | null
    s3Key: string
    caption: string | null
    photoType: $Enums.PhotoType
    uploadedById: string
    createdAt: Date
    _count: JobPhotoCountAggregateOutputType | null
    _min: JobPhotoMinAggregateOutputType | null
    _max: JobPhotoMaxAggregateOutputType | null
  }

  type GetJobPhotoGroupByPayload<T extends JobPhotoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<JobPhotoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof JobPhotoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], JobPhotoGroupByOutputType[P]>
            : GetScalarType<T[P], JobPhotoGroupByOutputType[P]>
        }
      >
    >


  export type JobPhotoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobId?: boolean
    workOrderId?: boolean
    s3Key?: boolean
    caption?: boolean
    photoType?: boolean
    uploadedById?: boolean
    createdAt?: boolean
    job?: boolean | JobDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobPhoto"]>

  export type JobPhotoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobId?: boolean
    workOrderId?: boolean
    s3Key?: boolean
    caption?: boolean
    photoType?: boolean
    uploadedById?: boolean
    createdAt?: boolean
    job?: boolean | JobDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["jobPhoto"]>

  export type JobPhotoSelectScalar = {
    id?: boolean
    jobId?: boolean
    workOrderId?: boolean
    s3Key?: boolean
    caption?: boolean
    photoType?: boolean
    uploadedById?: boolean
    createdAt?: boolean
  }

  export type JobPhotoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | JobDefaultArgs<ExtArgs>
  }
  export type JobPhotoIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | JobDefaultArgs<ExtArgs>
  }

  export type $JobPhotoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "JobPhoto"
    objects: {
      job: Prisma.$JobPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      jobId: string
      workOrderId: string | null
      s3Key: string
      caption: string | null
      photoType: $Enums.PhotoType
      uploadedById: string
      createdAt: Date
    }, ExtArgs["result"]["jobPhoto"]>
    composites: {}
  }

  type JobPhotoGetPayload<S extends boolean | null | undefined | JobPhotoDefaultArgs> = $Result.GetResult<Prisma.$JobPhotoPayload, S>

  type JobPhotoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<JobPhotoFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: JobPhotoCountAggregateInputType | true
    }

  export interface JobPhotoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['JobPhoto'], meta: { name: 'JobPhoto' } }
    /**
     * Find zero or one JobPhoto that matches the filter.
     * @param {JobPhotoFindUniqueArgs} args - Arguments to find a JobPhoto
     * @example
     * // Get one JobPhoto
     * const jobPhoto = await prisma.jobPhoto.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends JobPhotoFindUniqueArgs>(args: SelectSubset<T, JobPhotoFindUniqueArgs<ExtArgs>>): Prisma__JobPhotoClient<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one JobPhoto that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {JobPhotoFindUniqueOrThrowArgs} args - Arguments to find a JobPhoto
     * @example
     * // Get one JobPhoto
     * const jobPhoto = await prisma.jobPhoto.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends JobPhotoFindUniqueOrThrowArgs>(args: SelectSubset<T, JobPhotoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__JobPhotoClient<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first JobPhoto that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobPhotoFindFirstArgs} args - Arguments to find a JobPhoto
     * @example
     * // Get one JobPhoto
     * const jobPhoto = await prisma.jobPhoto.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends JobPhotoFindFirstArgs>(args?: SelectSubset<T, JobPhotoFindFirstArgs<ExtArgs>>): Prisma__JobPhotoClient<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first JobPhoto that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobPhotoFindFirstOrThrowArgs} args - Arguments to find a JobPhoto
     * @example
     * // Get one JobPhoto
     * const jobPhoto = await prisma.jobPhoto.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends JobPhotoFindFirstOrThrowArgs>(args?: SelectSubset<T, JobPhotoFindFirstOrThrowArgs<ExtArgs>>): Prisma__JobPhotoClient<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more JobPhotos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobPhotoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all JobPhotos
     * const jobPhotos = await prisma.jobPhoto.findMany()
     * 
     * // Get first 10 JobPhotos
     * const jobPhotos = await prisma.jobPhoto.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const jobPhotoWithIdOnly = await prisma.jobPhoto.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends JobPhotoFindManyArgs>(args?: SelectSubset<T, JobPhotoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a JobPhoto.
     * @param {JobPhotoCreateArgs} args - Arguments to create a JobPhoto.
     * @example
     * // Create one JobPhoto
     * const JobPhoto = await prisma.jobPhoto.create({
     *   data: {
     *     // ... data to create a JobPhoto
     *   }
     * })
     * 
     */
    create<T extends JobPhotoCreateArgs>(args: SelectSubset<T, JobPhotoCreateArgs<ExtArgs>>): Prisma__JobPhotoClient<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many JobPhotos.
     * @param {JobPhotoCreateManyArgs} args - Arguments to create many JobPhotos.
     * @example
     * // Create many JobPhotos
     * const jobPhoto = await prisma.jobPhoto.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends JobPhotoCreateManyArgs>(args?: SelectSubset<T, JobPhotoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many JobPhotos and returns the data saved in the database.
     * @param {JobPhotoCreateManyAndReturnArgs} args - Arguments to create many JobPhotos.
     * @example
     * // Create many JobPhotos
     * const jobPhoto = await prisma.jobPhoto.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many JobPhotos and only return the `id`
     * const jobPhotoWithIdOnly = await prisma.jobPhoto.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends JobPhotoCreateManyAndReturnArgs>(args?: SelectSubset<T, JobPhotoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a JobPhoto.
     * @param {JobPhotoDeleteArgs} args - Arguments to delete one JobPhoto.
     * @example
     * // Delete one JobPhoto
     * const JobPhoto = await prisma.jobPhoto.delete({
     *   where: {
     *     // ... filter to delete one JobPhoto
     *   }
     * })
     * 
     */
    delete<T extends JobPhotoDeleteArgs>(args: SelectSubset<T, JobPhotoDeleteArgs<ExtArgs>>): Prisma__JobPhotoClient<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one JobPhoto.
     * @param {JobPhotoUpdateArgs} args - Arguments to update one JobPhoto.
     * @example
     * // Update one JobPhoto
     * const jobPhoto = await prisma.jobPhoto.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends JobPhotoUpdateArgs>(args: SelectSubset<T, JobPhotoUpdateArgs<ExtArgs>>): Prisma__JobPhotoClient<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more JobPhotos.
     * @param {JobPhotoDeleteManyArgs} args - Arguments to filter JobPhotos to delete.
     * @example
     * // Delete a few JobPhotos
     * const { count } = await prisma.jobPhoto.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends JobPhotoDeleteManyArgs>(args?: SelectSubset<T, JobPhotoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more JobPhotos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobPhotoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many JobPhotos
     * const jobPhoto = await prisma.jobPhoto.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends JobPhotoUpdateManyArgs>(args: SelectSubset<T, JobPhotoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one JobPhoto.
     * @param {JobPhotoUpsertArgs} args - Arguments to update or create a JobPhoto.
     * @example
     * // Update or create a JobPhoto
     * const jobPhoto = await prisma.jobPhoto.upsert({
     *   create: {
     *     // ... data to create a JobPhoto
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the JobPhoto we want to update
     *   }
     * })
     */
    upsert<T extends JobPhotoUpsertArgs>(args: SelectSubset<T, JobPhotoUpsertArgs<ExtArgs>>): Prisma__JobPhotoClient<$Result.GetResult<Prisma.$JobPhotoPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of JobPhotos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobPhotoCountArgs} args - Arguments to filter JobPhotos to count.
     * @example
     * // Count the number of JobPhotos
     * const count = await prisma.jobPhoto.count({
     *   where: {
     *     // ... the filter for the JobPhotos we want to count
     *   }
     * })
    **/
    count<T extends JobPhotoCountArgs>(
      args?: Subset<T, JobPhotoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], JobPhotoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a JobPhoto.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobPhotoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends JobPhotoAggregateArgs>(args: Subset<T, JobPhotoAggregateArgs>): Prisma.PrismaPromise<GetJobPhotoAggregateType<T>>

    /**
     * Group by JobPhoto.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobPhotoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends JobPhotoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: JobPhotoGroupByArgs['orderBy'] }
        : { orderBy?: JobPhotoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, JobPhotoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobPhotoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the JobPhoto model
   */
  readonly fields: JobPhotoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for JobPhoto.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__JobPhotoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    job<T extends JobDefaultArgs<ExtArgs> = {}>(args?: Subset<T, JobDefaultArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the JobPhoto model
   */ 
  interface JobPhotoFieldRefs {
    readonly id: FieldRef<"JobPhoto", 'String'>
    readonly jobId: FieldRef<"JobPhoto", 'String'>
    readonly workOrderId: FieldRef<"JobPhoto", 'String'>
    readonly s3Key: FieldRef<"JobPhoto", 'String'>
    readonly caption: FieldRef<"JobPhoto", 'String'>
    readonly photoType: FieldRef<"JobPhoto", 'PhotoType'>
    readonly uploadedById: FieldRef<"JobPhoto", 'String'>
    readonly createdAt: FieldRef<"JobPhoto", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * JobPhoto findUnique
   */
  export type JobPhotoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    /**
     * Filter, which JobPhoto to fetch.
     */
    where: JobPhotoWhereUniqueInput
  }

  /**
   * JobPhoto findUniqueOrThrow
   */
  export type JobPhotoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    /**
     * Filter, which JobPhoto to fetch.
     */
    where: JobPhotoWhereUniqueInput
  }

  /**
   * JobPhoto findFirst
   */
  export type JobPhotoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    /**
     * Filter, which JobPhoto to fetch.
     */
    where?: JobPhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobPhotos to fetch.
     */
    orderBy?: JobPhotoOrderByWithRelationInput | JobPhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobPhotos.
     */
    cursor?: JobPhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobPhotos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobPhotos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobPhotos.
     */
    distinct?: JobPhotoScalarFieldEnum | JobPhotoScalarFieldEnum[]
  }

  /**
   * JobPhoto findFirstOrThrow
   */
  export type JobPhotoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    /**
     * Filter, which JobPhoto to fetch.
     */
    where?: JobPhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobPhotos to fetch.
     */
    orderBy?: JobPhotoOrderByWithRelationInput | JobPhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for JobPhotos.
     */
    cursor?: JobPhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobPhotos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobPhotos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of JobPhotos.
     */
    distinct?: JobPhotoScalarFieldEnum | JobPhotoScalarFieldEnum[]
  }

  /**
   * JobPhoto findMany
   */
  export type JobPhotoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    /**
     * Filter, which JobPhotos to fetch.
     */
    where?: JobPhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of JobPhotos to fetch.
     */
    orderBy?: JobPhotoOrderByWithRelationInput | JobPhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing JobPhotos.
     */
    cursor?: JobPhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` JobPhotos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` JobPhotos.
     */
    skip?: number
    distinct?: JobPhotoScalarFieldEnum | JobPhotoScalarFieldEnum[]
  }

  /**
   * JobPhoto create
   */
  export type JobPhotoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    /**
     * The data needed to create a JobPhoto.
     */
    data: XOR<JobPhotoCreateInput, JobPhotoUncheckedCreateInput>
  }

  /**
   * JobPhoto createMany
   */
  export type JobPhotoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many JobPhotos.
     */
    data: JobPhotoCreateManyInput | JobPhotoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * JobPhoto createManyAndReturn
   */
  export type JobPhotoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many JobPhotos.
     */
    data: JobPhotoCreateManyInput | JobPhotoCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * JobPhoto update
   */
  export type JobPhotoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    /**
     * The data needed to update a JobPhoto.
     */
    data: XOR<JobPhotoUpdateInput, JobPhotoUncheckedUpdateInput>
    /**
     * Choose, which JobPhoto to update.
     */
    where: JobPhotoWhereUniqueInput
  }

  /**
   * JobPhoto updateMany
   */
  export type JobPhotoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update JobPhotos.
     */
    data: XOR<JobPhotoUpdateManyMutationInput, JobPhotoUncheckedUpdateManyInput>
    /**
     * Filter which JobPhotos to update
     */
    where?: JobPhotoWhereInput
  }

  /**
   * JobPhoto upsert
   */
  export type JobPhotoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    /**
     * The filter to search for the JobPhoto to update in case it exists.
     */
    where: JobPhotoWhereUniqueInput
    /**
     * In case the JobPhoto found by the `where` argument doesn't exist, create a new JobPhoto with this data.
     */
    create: XOR<JobPhotoCreateInput, JobPhotoUncheckedCreateInput>
    /**
     * In case the JobPhoto was found with the provided `where` argument, update it with this data.
     */
    update: XOR<JobPhotoUpdateInput, JobPhotoUncheckedUpdateInput>
  }

  /**
   * JobPhoto delete
   */
  export type JobPhotoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
    /**
     * Filter which JobPhoto to delete.
     */
    where: JobPhotoWhereUniqueInput
  }

  /**
   * JobPhoto deleteMany
   */
  export type JobPhotoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which JobPhotos to delete
     */
    where?: JobPhotoWhereInput
  }

  /**
   * JobPhoto without action
   */
  export type JobPhotoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the JobPhoto
     */
    select?: JobPhotoSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: JobPhotoInclude<ExtArgs> | null
  }


  /**
   * Model WorkOrder
   */

  export type AggregateWorkOrder = {
    _count: WorkOrderCountAggregateOutputType | null
    _min: WorkOrderMinAggregateOutputType | null
    _max: WorkOrderMaxAggregateOutputType | null
  }

  export type WorkOrderMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobId: string | null
    workOrderNumber: string | null
    technicianId: string | null
    technicianName: string | null
    status: $Enums.WorkOrderStatus | null
    scheduledStart: Date | null
    scheduledEnd: Date | null
    checkinAt: Date | null
    checkoutAt: Date | null
    signatureUrl: string | null
    technicianNotes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkOrderMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobId: string | null
    workOrderNumber: string | null
    technicianId: string | null
    technicianName: string | null
    status: $Enums.WorkOrderStatus | null
    scheduledStart: Date | null
    scheduledEnd: Date | null
    checkinAt: Date | null
    checkoutAt: Date | null
    signatureUrl: string | null
    technicianNotes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkOrderCountAggregateOutputType = {
    id: number
    companyId: number
    jobId: number
    workOrderNumber: number
    technicianId: number
    technicianName: number
    status: number
    scheduledStart: number
    scheduledEnd: number
    checkinAt: number
    checkoutAt: number
    signatureUrl: number
    technicianNotes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WorkOrderMinAggregateInputType = {
    id?: true
    companyId?: true
    jobId?: true
    workOrderNumber?: true
    technicianId?: true
    technicianName?: true
    status?: true
    scheduledStart?: true
    scheduledEnd?: true
    checkinAt?: true
    checkoutAt?: true
    signatureUrl?: true
    technicianNotes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkOrderMaxAggregateInputType = {
    id?: true
    companyId?: true
    jobId?: true
    workOrderNumber?: true
    technicianId?: true
    technicianName?: true
    status?: true
    scheduledStart?: true
    scheduledEnd?: true
    checkinAt?: true
    checkoutAt?: true
    signatureUrl?: true
    technicianNotes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkOrderCountAggregateInputType = {
    id?: true
    companyId?: true
    jobId?: true
    workOrderNumber?: true
    technicianId?: true
    technicianName?: true
    status?: true
    scheduledStart?: true
    scheduledEnd?: true
    checkinAt?: true
    checkoutAt?: true
    signatureUrl?: true
    technicianNotes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WorkOrderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkOrder to aggregate.
     */
    where?: WorkOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrders to fetch.
     */
    orderBy?: WorkOrderOrderByWithRelationInput | WorkOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkOrders
    **/
    _count?: true | WorkOrderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkOrderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkOrderMaxAggregateInputType
  }

  export type GetWorkOrderAggregateType<T extends WorkOrderAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkOrder]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkOrder[P]>
      : GetScalarType<T[P], AggregateWorkOrder[P]>
  }




  export type WorkOrderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkOrderWhereInput
    orderBy?: WorkOrderOrderByWithAggregationInput | WorkOrderOrderByWithAggregationInput[]
    by: WorkOrderScalarFieldEnum[] | WorkOrderScalarFieldEnum
    having?: WorkOrderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkOrderCountAggregateInputType | true
    _min?: WorkOrderMinAggregateInputType
    _max?: WorkOrderMaxAggregateInputType
  }

  export type WorkOrderGroupByOutputType = {
    id: string
    companyId: string
    jobId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status: $Enums.WorkOrderStatus
    scheduledStart: Date | null
    scheduledEnd: Date | null
    checkinAt: Date | null
    checkoutAt: Date | null
    signatureUrl: string | null
    technicianNotes: string | null
    createdAt: Date
    updatedAt: Date
    _count: WorkOrderCountAggregateOutputType | null
    _min: WorkOrderMinAggregateOutputType | null
    _max: WorkOrderMaxAggregateOutputType | null
  }

  type GetWorkOrderGroupByPayload<T extends WorkOrderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkOrderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkOrderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkOrderGroupByOutputType[P]>
            : GetScalarType<T[P], WorkOrderGroupByOutputType[P]>
        }
      >
    >


  export type WorkOrderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobId?: boolean
    workOrderNumber?: boolean
    technicianId?: boolean
    technicianName?: boolean
    status?: boolean
    scheduledStart?: boolean
    scheduledEnd?: boolean
    checkinAt?: boolean
    checkoutAt?: boolean
    signatureUrl?: boolean
    technicianNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    job?: boolean | JobDefaultArgs<ExtArgs>
    lineItems?: boolean | WorkOrder$lineItemsArgs<ExtArgs>
    taskCompletions?: boolean | WorkOrder$taskCompletionsArgs<ExtArgs>
    _count?: boolean | WorkOrderCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workOrder"]>

  export type WorkOrderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobId?: boolean
    workOrderNumber?: boolean
    technicianId?: boolean
    technicianName?: boolean
    status?: boolean
    scheduledStart?: boolean
    scheduledEnd?: boolean
    checkinAt?: boolean
    checkoutAt?: boolean
    signatureUrl?: boolean
    technicianNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    job?: boolean | JobDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workOrder"]>

  export type WorkOrderSelectScalar = {
    id?: boolean
    companyId?: boolean
    jobId?: boolean
    workOrderNumber?: boolean
    technicianId?: boolean
    technicianName?: boolean
    status?: boolean
    scheduledStart?: boolean
    scheduledEnd?: boolean
    checkinAt?: boolean
    checkoutAt?: boolean
    signatureUrl?: boolean
    technicianNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WorkOrderInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | JobDefaultArgs<ExtArgs>
    lineItems?: boolean | WorkOrder$lineItemsArgs<ExtArgs>
    taskCompletions?: boolean | WorkOrder$taskCompletionsArgs<ExtArgs>
    _count?: boolean | WorkOrderCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type WorkOrderIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | JobDefaultArgs<ExtArgs>
  }

  export type $WorkOrderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkOrder"
    objects: {
      job: Prisma.$JobPayload<ExtArgs>
      lineItems: Prisma.$WorkOrderLineItemPayload<ExtArgs>[]
      taskCompletions: Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      jobId: string
      workOrderNumber: string
      technicianId: string
      technicianName: string
      status: $Enums.WorkOrderStatus
      scheduledStart: Date | null
      scheduledEnd: Date | null
      checkinAt: Date | null
      checkoutAt: Date | null
      signatureUrl: string | null
      technicianNotes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["workOrder"]>
    composites: {}
  }

  type WorkOrderGetPayload<S extends boolean | null | undefined | WorkOrderDefaultArgs> = $Result.GetResult<Prisma.$WorkOrderPayload, S>

  type WorkOrderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WorkOrderFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WorkOrderCountAggregateInputType | true
    }

  export interface WorkOrderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkOrder'], meta: { name: 'WorkOrder' } }
    /**
     * Find zero or one WorkOrder that matches the filter.
     * @param {WorkOrderFindUniqueArgs} args - Arguments to find a WorkOrder
     * @example
     * // Get one WorkOrder
     * const workOrder = await prisma.workOrder.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkOrderFindUniqueArgs>(args: SelectSubset<T, WorkOrderFindUniqueArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one WorkOrder that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WorkOrderFindUniqueOrThrowArgs} args - Arguments to find a WorkOrder
     * @example
     * // Get one WorkOrder
     * const workOrder = await prisma.workOrder.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkOrderFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkOrderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first WorkOrder that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderFindFirstArgs} args - Arguments to find a WorkOrder
     * @example
     * // Get one WorkOrder
     * const workOrder = await prisma.workOrder.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkOrderFindFirstArgs>(args?: SelectSubset<T, WorkOrderFindFirstArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first WorkOrder that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderFindFirstOrThrowArgs} args - Arguments to find a WorkOrder
     * @example
     * // Get one WorkOrder
     * const workOrder = await prisma.workOrder.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkOrderFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkOrderFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more WorkOrders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkOrders
     * const workOrders = await prisma.workOrder.findMany()
     * 
     * // Get first 10 WorkOrders
     * const workOrders = await prisma.workOrder.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workOrderWithIdOnly = await prisma.workOrder.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkOrderFindManyArgs>(args?: SelectSubset<T, WorkOrderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a WorkOrder.
     * @param {WorkOrderCreateArgs} args - Arguments to create a WorkOrder.
     * @example
     * // Create one WorkOrder
     * const WorkOrder = await prisma.workOrder.create({
     *   data: {
     *     // ... data to create a WorkOrder
     *   }
     * })
     * 
     */
    create<T extends WorkOrderCreateArgs>(args: SelectSubset<T, WorkOrderCreateArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many WorkOrders.
     * @param {WorkOrderCreateManyArgs} args - Arguments to create many WorkOrders.
     * @example
     * // Create many WorkOrders
     * const workOrder = await prisma.workOrder.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkOrderCreateManyArgs>(args?: SelectSubset<T, WorkOrderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkOrders and returns the data saved in the database.
     * @param {WorkOrderCreateManyAndReturnArgs} args - Arguments to create many WorkOrders.
     * @example
     * // Create many WorkOrders
     * const workOrder = await prisma.workOrder.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkOrders and only return the `id`
     * const workOrderWithIdOnly = await prisma.workOrder.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkOrderCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkOrderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a WorkOrder.
     * @param {WorkOrderDeleteArgs} args - Arguments to delete one WorkOrder.
     * @example
     * // Delete one WorkOrder
     * const WorkOrder = await prisma.workOrder.delete({
     *   where: {
     *     // ... filter to delete one WorkOrder
     *   }
     * })
     * 
     */
    delete<T extends WorkOrderDeleteArgs>(args: SelectSubset<T, WorkOrderDeleteArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one WorkOrder.
     * @param {WorkOrderUpdateArgs} args - Arguments to update one WorkOrder.
     * @example
     * // Update one WorkOrder
     * const workOrder = await prisma.workOrder.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkOrderUpdateArgs>(args: SelectSubset<T, WorkOrderUpdateArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more WorkOrders.
     * @param {WorkOrderDeleteManyArgs} args - Arguments to filter WorkOrders to delete.
     * @example
     * // Delete a few WorkOrders
     * const { count } = await prisma.workOrder.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkOrderDeleteManyArgs>(args?: SelectSubset<T, WorkOrderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkOrders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkOrders
     * const workOrder = await prisma.workOrder.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkOrderUpdateManyArgs>(args: SelectSubset<T, WorkOrderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one WorkOrder.
     * @param {WorkOrderUpsertArgs} args - Arguments to update or create a WorkOrder.
     * @example
     * // Update or create a WorkOrder
     * const workOrder = await prisma.workOrder.upsert({
     *   create: {
     *     // ... data to create a WorkOrder
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkOrder we want to update
     *   }
     * })
     */
    upsert<T extends WorkOrderUpsertArgs>(args: SelectSubset<T, WorkOrderUpsertArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of WorkOrders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderCountArgs} args - Arguments to filter WorkOrders to count.
     * @example
     * // Count the number of WorkOrders
     * const count = await prisma.workOrder.count({
     *   where: {
     *     // ... the filter for the WorkOrders we want to count
     *   }
     * })
    **/
    count<T extends WorkOrderCountArgs>(
      args?: Subset<T, WorkOrderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkOrderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkOrder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkOrderAggregateArgs>(args: Subset<T, WorkOrderAggregateArgs>): Prisma.PrismaPromise<GetWorkOrderAggregateType<T>>

    /**
     * Group by WorkOrder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkOrderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkOrderGroupByArgs['orderBy'] }
        : { orderBy?: WorkOrderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkOrderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkOrderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkOrder model
   */
  readonly fields: WorkOrderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkOrder.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkOrderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    job<T extends JobDefaultArgs<ExtArgs> = {}>(args?: Subset<T, JobDefaultArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    lineItems<T extends WorkOrder$lineItemsArgs<ExtArgs> = {}>(args?: Subset<T, WorkOrder$lineItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "findMany"> | Null>
    taskCompletions<T extends WorkOrder$taskCompletionsArgs<ExtArgs> = {}>(args?: Subset<T, WorkOrder$taskCompletionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkOrder model
   */ 
  interface WorkOrderFieldRefs {
    readonly id: FieldRef<"WorkOrder", 'String'>
    readonly companyId: FieldRef<"WorkOrder", 'String'>
    readonly jobId: FieldRef<"WorkOrder", 'String'>
    readonly workOrderNumber: FieldRef<"WorkOrder", 'String'>
    readonly technicianId: FieldRef<"WorkOrder", 'String'>
    readonly technicianName: FieldRef<"WorkOrder", 'String'>
    readonly status: FieldRef<"WorkOrder", 'WorkOrderStatus'>
    readonly scheduledStart: FieldRef<"WorkOrder", 'DateTime'>
    readonly scheduledEnd: FieldRef<"WorkOrder", 'DateTime'>
    readonly checkinAt: FieldRef<"WorkOrder", 'DateTime'>
    readonly checkoutAt: FieldRef<"WorkOrder", 'DateTime'>
    readonly signatureUrl: FieldRef<"WorkOrder", 'String'>
    readonly technicianNotes: FieldRef<"WorkOrder", 'String'>
    readonly createdAt: FieldRef<"WorkOrder", 'DateTime'>
    readonly updatedAt: FieldRef<"WorkOrder", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkOrder findUnique
   */
  export type WorkOrderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrder to fetch.
     */
    where: WorkOrderWhereUniqueInput
  }

  /**
   * WorkOrder findUniqueOrThrow
   */
  export type WorkOrderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrder to fetch.
     */
    where: WorkOrderWhereUniqueInput
  }

  /**
   * WorkOrder findFirst
   */
  export type WorkOrderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrder to fetch.
     */
    where?: WorkOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrders to fetch.
     */
    orderBy?: WorkOrderOrderByWithRelationInput | WorkOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkOrders.
     */
    cursor?: WorkOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkOrders.
     */
    distinct?: WorkOrderScalarFieldEnum | WorkOrderScalarFieldEnum[]
  }

  /**
   * WorkOrder findFirstOrThrow
   */
  export type WorkOrderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrder to fetch.
     */
    where?: WorkOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrders to fetch.
     */
    orderBy?: WorkOrderOrderByWithRelationInput | WorkOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkOrders.
     */
    cursor?: WorkOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkOrders.
     */
    distinct?: WorkOrderScalarFieldEnum | WorkOrderScalarFieldEnum[]
  }

  /**
   * WorkOrder findMany
   */
  export type WorkOrderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrders to fetch.
     */
    where?: WorkOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrders to fetch.
     */
    orderBy?: WorkOrderOrderByWithRelationInput | WorkOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkOrders.
     */
    cursor?: WorkOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrders.
     */
    skip?: number
    distinct?: WorkOrderScalarFieldEnum | WorkOrderScalarFieldEnum[]
  }

  /**
   * WorkOrder create
   */
  export type WorkOrderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkOrder.
     */
    data: XOR<WorkOrderCreateInput, WorkOrderUncheckedCreateInput>
  }

  /**
   * WorkOrder createMany
   */
  export type WorkOrderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkOrders.
     */
    data: WorkOrderCreateManyInput | WorkOrderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkOrder createManyAndReturn
   */
  export type WorkOrderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many WorkOrders.
     */
    data: WorkOrderCreateManyInput | WorkOrderCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkOrder update
   */
  export type WorkOrderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkOrder.
     */
    data: XOR<WorkOrderUpdateInput, WorkOrderUncheckedUpdateInput>
    /**
     * Choose, which WorkOrder to update.
     */
    where: WorkOrderWhereUniqueInput
  }

  /**
   * WorkOrder updateMany
   */
  export type WorkOrderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkOrders.
     */
    data: XOR<WorkOrderUpdateManyMutationInput, WorkOrderUncheckedUpdateManyInput>
    /**
     * Filter which WorkOrders to update
     */
    where?: WorkOrderWhereInput
  }

  /**
   * WorkOrder upsert
   */
  export type WorkOrderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkOrder to update in case it exists.
     */
    where: WorkOrderWhereUniqueInput
    /**
     * In case the WorkOrder found by the `where` argument doesn't exist, create a new WorkOrder with this data.
     */
    create: XOR<WorkOrderCreateInput, WorkOrderUncheckedCreateInput>
    /**
     * In case the WorkOrder was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkOrderUpdateInput, WorkOrderUncheckedUpdateInput>
  }

  /**
   * WorkOrder delete
   */
  export type WorkOrderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
    /**
     * Filter which WorkOrder to delete.
     */
    where: WorkOrderWhereUniqueInput
  }

  /**
   * WorkOrder deleteMany
   */
  export type WorkOrderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkOrders to delete
     */
    where?: WorkOrderWhereInput
  }

  /**
   * WorkOrder.lineItems
   */
  export type WorkOrder$lineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    where?: WorkOrderLineItemWhereInput
    orderBy?: WorkOrderLineItemOrderByWithRelationInput | WorkOrderLineItemOrderByWithRelationInput[]
    cursor?: WorkOrderLineItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkOrderLineItemScalarFieldEnum | WorkOrderLineItemScalarFieldEnum[]
  }

  /**
   * WorkOrder.taskCompletions
   */
  export type WorkOrder$taskCompletionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    where?: WorkOrderTaskCompletionWhereInput
    orderBy?: WorkOrderTaskCompletionOrderByWithRelationInput | WorkOrderTaskCompletionOrderByWithRelationInput[]
    cursor?: WorkOrderTaskCompletionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkOrderTaskCompletionScalarFieldEnum | WorkOrderTaskCompletionScalarFieldEnum[]
  }

  /**
   * WorkOrder without action
   */
  export type WorkOrderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrder
     */
    select?: WorkOrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderInclude<ExtArgs> | null
  }


  /**
   * Model WorkOrderTaskCompletion
   */

  export type AggregateWorkOrderTaskCompletion = {
    _count: WorkOrderTaskCompletionCountAggregateOutputType | null
    _min: WorkOrderTaskCompletionMinAggregateOutputType | null
    _max: WorkOrderTaskCompletionMaxAggregateOutputType | null
  }

  export type WorkOrderTaskCompletionMinAggregateOutputType = {
    id: string | null
    workOrderId: string | null
    templateTaskId: string | null
    isAdHoc: boolean | null
    taskName: string | null
    isRequired: boolean | null
    isCompleted: boolean | null
    photoUrl: string | null
    notes: string | null
    completedAt: Date | null
  }

  export type WorkOrderTaskCompletionMaxAggregateOutputType = {
    id: string | null
    workOrderId: string | null
    templateTaskId: string | null
    isAdHoc: boolean | null
    taskName: string | null
    isRequired: boolean | null
    isCompleted: boolean | null
    photoUrl: string | null
    notes: string | null
    completedAt: Date | null
  }

  export type WorkOrderTaskCompletionCountAggregateOutputType = {
    id: number
    workOrderId: number
    templateTaskId: number
    isAdHoc: number
    taskName: number
    isRequired: number
    isCompleted: number
    photoUrl: number
    notes: number
    completedAt: number
    _all: number
  }


  export type WorkOrderTaskCompletionMinAggregateInputType = {
    id?: true
    workOrderId?: true
    templateTaskId?: true
    isAdHoc?: true
    taskName?: true
    isRequired?: true
    isCompleted?: true
    photoUrl?: true
    notes?: true
    completedAt?: true
  }

  export type WorkOrderTaskCompletionMaxAggregateInputType = {
    id?: true
    workOrderId?: true
    templateTaskId?: true
    isAdHoc?: true
    taskName?: true
    isRequired?: true
    isCompleted?: true
    photoUrl?: true
    notes?: true
    completedAt?: true
  }

  export type WorkOrderTaskCompletionCountAggregateInputType = {
    id?: true
    workOrderId?: true
    templateTaskId?: true
    isAdHoc?: true
    taskName?: true
    isRequired?: true
    isCompleted?: true
    photoUrl?: true
    notes?: true
    completedAt?: true
    _all?: true
  }

  export type WorkOrderTaskCompletionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkOrderTaskCompletion to aggregate.
     */
    where?: WorkOrderTaskCompletionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrderTaskCompletions to fetch.
     */
    orderBy?: WorkOrderTaskCompletionOrderByWithRelationInput | WorkOrderTaskCompletionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkOrderTaskCompletionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrderTaskCompletions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrderTaskCompletions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkOrderTaskCompletions
    **/
    _count?: true | WorkOrderTaskCompletionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkOrderTaskCompletionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkOrderTaskCompletionMaxAggregateInputType
  }

  export type GetWorkOrderTaskCompletionAggregateType<T extends WorkOrderTaskCompletionAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkOrderTaskCompletion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkOrderTaskCompletion[P]>
      : GetScalarType<T[P], AggregateWorkOrderTaskCompletion[P]>
  }




  export type WorkOrderTaskCompletionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkOrderTaskCompletionWhereInput
    orderBy?: WorkOrderTaskCompletionOrderByWithAggregationInput | WorkOrderTaskCompletionOrderByWithAggregationInput[]
    by: WorkOrderTaskCompletionScalarFieldEnum[] | WorkOrderTaskCompletionScalarFieldEnum
    having?: WorkOrderTaskCompletionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkOrderTaskCompletionCountAggregateInputType | true
    _min?: WorkOrderTaskCompletionMinAggregateInputType
    _max?: WorkOrderTaskCompletionMaxAggregateInputType
  }

  export type WorkOrderTaskCompletionGroupByOutputType = {
    id: string
    workOrderId: string
    templateTaskId: string | null
    isAdHoc: boolean
    taskName: string
    isRequired: boolean
    isCompleted: boolean
    photoUrl: string | null
    notes: string | null
    completedAt: Date | null
    _count: WorkOrderTaskCompletionCountAggregateOutputType | null
    _min: WorkOrderTaskCompletionMinAggregateOutputType | null
    _max: WorkOrderTaskCompletionMaxAggregateOutputType | null
  }

  type GetWorkOrderTaskCompletionGroupByPayload<T extends WorkOrderTaskCompletionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkOrderTaskCompletionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkOrderTaskCompletionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkOrderTaskCompletionGroupByOutputType[P]>
            : GetScalarType<T[P], WorkOrderTaskCompletionGroupByOutputType[P]>
        }
      >
    >


  export type WorkOrderTaskCompletionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workOrderId?: boolean
    templateTaskId?: boolean
    isAdHoc?: boolean
    taskName?: boolean
    isRequired?: boolean
    isCompleted?: boolean
    photoUrl?: boolean
    notes?: boolean
    completedAt?: boolean
    workOrder?: boolean | WorkOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workOrderTaskCompletion"]>

  export type WorkOrderTaskCompletionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workOrderId?: boolean
    templateTaskId?: boolean
    isAdHoc?: boolean
    taskName?: boolean
    isRequired?: boolean
    isCompleted?: boolean
    photoUrl?: boolean
    notes?: boolean
    completedAt?: boolean
    workOrder?: boolean | WorkOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workOrderTaskCompletion"]>

  export type WorkOrderTaskCompletionSelectScalar = {
    id?: boolean
    workOrderId?: boolean
    templateTaskId?: boolean
    isAdHoc?: boolean
    taskName?: boolean
    isRequired?: boolean
    isCompleted?: boolean
    photoUrl?: boolean
    notes?: boolean
    completedAt?: boolean
  }

  export type WorkOrderTaskCompletionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workOrder?: boolean | WorkOrderDefaultArgs<ExtArgs>
  }
  export type WorkOrderTaskCompletionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workOrder?: boolean | WorkOrderDefaultArgs<ExtArgs>
  }

  export type $WorkOrderTaskCompletionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkOrderTaskCompletion"
    objects: {
      workOrder: Prisma.$WorkOrderPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      workOrderId: string
      templateTaskId: string | null
      isAdHoc: boolean
      taskName: string
      isRequired: boolean
      isCompleted: boolean
      photoUrl: string | null
      notes: string | null
      completedAt: Date | null
    }, ExtArgs["result"]["workOrderTaskCompletion"]>
    composites: {}
  }

  type WorkOrderTaskCompletionGetPayload<S extends boolean | null | undefined | WorkOrderTaskCompletionDefaultArgs> = $Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload, S>

  type WorkOrderTaskCompletionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WorkOrderTaskCompletionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WorkOrderTaskCompletionCountAggregateInputType | true
    }

  export interface WorkOrderTaskCompletionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkOrderTaskCompletion'], meta: { name: 'WorkOrderTaskCompletion' } }
    /**
     * Find zero or one WorkOrderTaskCompletion that matches the filter.
     * @param {WorkOrderTaskCompletionFindUniqueArgs} args - Arguments to find a WorkOrderTaskCompletion
     * @example
     * // Get one WorkOrderTaskCompletion
     * const workOrderTaskCompletion = await prisma.workOrderTaskCompletion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkOrderTaskCompletionFindUniqueArgs>(args: SelectSubset<T, WorkOrderTaskCompletionFindUniqueArgs<ExtArgs>>): Prisma__WorkOrderTaskCompletionClient<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one WorkOrderTaskCompletion that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WorkOrderTaskCompletionFindUniqueOrThrowArgs} args - Arguments to find a WorkOrderTaskCompletion
     * @example
     * // Get one WorkOrderTaskCompletion
     * const workOrderTaskCompletion = await prisma.workOrderTaskCompletion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkOrderTaskCompletionFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkOrderTaskCompletionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkOrderTaskCompletionClient<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first WorkOrderTaskCompletion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderTaskCompletionFindFirstArgs} args - Arguments to find a WorkOrderTaskCompletion
     * @example
     * // Get one WorkOrderTaskCompletion
     * const workOrderTaskCompletion = await prisma.workOrderTaskCompletion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkOrderTaskCompletionFindFirstArgs>(args?: SelectSubset<T, WorkOrderTaskCompletionFindFirstArgs<ExtArgs>>): Prisma__WorkOrderTaskCompletionClient<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first WorkOrderTaskCompletion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderTaskCompletionFindFirstOrThrowArgs} args - Arguments to find a WorkOrderTaskCompletion
     * @example
     * // Get one WorkOrderTaskCompletion
     * const workOrderTaskCompletion = await prisma.workOrderTaskCompletion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkOrderTaskCompletionFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkOrderTaskCompletionFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkOrderTaskCompletionClient<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more WorkOrderTaskCompletions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderTaskCompletionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkOrderTaskCompletions
     * const workOrderTaskCompletions = await prisma.workOrderTaskCompletion.findMany()
     * 
     * // Get first 10 WorkOrderTaskCompletions
     * const workOrderTaskCompletions = await prisma.workOrderTaskCompletion.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workOrderTaskCompletionWithIdOnly = await prisma.workOrderTaskCompletion.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkOrderTaskCompletionFindManyArgs>(args?: SelectSubset<T, WorkOrderTaskCompletionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a WorkOrderTaskCompletion.
     * @param {WorkOrderTaskCompletionCreateArgs} args - Arguments to create a WorkOrderTaskCompletion.
     * @example
     * // Create one WorkOrderTaskCompletion
     * const WorkOrderTaskCompletion = await prisma.workOrderTaskCompletion.create({
     *   data: {
     *     // ... data to create a WorkOrderTaskCompletion
     *   }
     * })
     * 
     */
    create<T extends WorkOrderTaskCompletionCreateArgs>(args: SelectSubset<T, WorkOrderTaskCompletionCreateArgs<ExtArgs>>): Prisma__WorkOrderTaskCompletionClient<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many WorkOrderTaskCompletions.
     * @param {WorkOrderTaskCompletionCreateManyArgs} args - Arguments to create many WorkOrderTaskCompletions.
     * @example
     * // Create many WorkOrderTaskCompletions
     * const workOrderTaskCompletion = await prisma.workOrderTaskCompletion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkOrderTaskCompletionCreateManyArgs>(args?: SelectSubset<T, WorkOrderTaskCompletionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkOrderTaskCompletions and returns the data saved in the database.
     * @param {WorkOrderTaskCompletionCreateManyAndReturnArgs} args - Arguments to create many WorkOrderTaskCompletions.
     * @example
     * // Create many WorkOrderTaskCompletions
     * const workOrderTaskCompletion = await prisma.workOrderTaskCompletion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkOrderTaskCompletions and only return the `id`
     * const workOrderTaskCompletionWithIdOnly = await prisma.workOrderTaskCompletion.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkOrderTaskCompletionCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkOrderTaskCompletionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a WorkOrderTaskCompletion.
     * @param {WorkOrderTaskCompletionDeleteArgs} args - Arguments to delete one WorkOrderTaskCompletion.
     * @example
     * // Delete one WorkOrderTaskCompletion
     * const WorkOrderTaskCompletion = await prisma.workOrderTaskCompletion.delete({
     *   where: {
     *     // ... filter to delete one WorkOrderTaskCompletion
     *   }
     * })
     * 
     */
    delete<T extends WorkOrderTaskCompletionDeleteArgs>(args: SelectSubset<T, WorkOrderTaskCompletionDeleteArgs<ExtArgs>>): Prisma__WorkOrderTaskCompletionClient<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one WorkOrderTaskCompletion.
     * @param {WorkOrderTaskCompletionUpdateArgs} args - Arguments to update one WorkOrderTaskCompletion.
     * @example
     * // Update one WorkOrderTaskCompletion
     * const workOrderTaskCompletion = await prisma.workOrderTaskCompletion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkOrderTaskCompletionUpdateArgs>(args: SelectSubset<T, WorkOrderTaskCompletionUpdateArgs<ExtArgs>>): Prisma__WorkOrderTaskCompletionClient<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more WorkOrderTaskCompletions.
     * @param {WorkOrderTaskCompletionDeleteManyArgs} args - Arguments to filter WorkOrderTaskCompletions to delete.
     * @example
     * // Delete a few WorkOrderTaskCompletions
     * const { count } = await prisma.workOrderTaskCompletion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkOrderTaskCompletionDeleteManyArgs>(args?: SelectSubset<T, WorkOrderTaskCompletionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkOrderTaskCompletions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderTaskCompletionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkOrderTaskCompletions
     * const workOrderTaskCompletion = await prisma.workOrderTaskCompletion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkOrderTaskCompletionUpdateManyArgs>(args: SelectSubset<T, WorkOrderTaskCompletionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one WorkOrderTaskCompletion.
     * @param {WorkOrderTaskCompletionUpsertArgs} args - Arguments to update or create a WorkOrderTaskCompletion.
     * @example
     * // Update or create a WorkOrderTaskCompletion
     * const workOrderTaskCompletion = await prisma.workOrderTaskCompletion.upsert({
     *   create: {
     *     // ... data to create a WorkOrderTaskCompletion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkOrderTaskCompletion we want to update
     *   }
     * })
     */
    upsert<T extends WorkOrderTaskCompletionUpsertArgs>(args: SelectSubset<T, WorkOrderTaskCompletionUpsertArgs<ExtArgs>>): Prisma__WorkOrderTaskCompletionClient<$Result.GetResult<Prisma.$WorkOrderTaskCompletionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of WorkOrderTaskCompletions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderTaskCompletionCountArgs} args - Arguments to filter WorkOrderTaskCompletions to count.
     * @example
     * // Count the number of WorkOrderTaskCompletions
     * const count = await prisma.workOrderTaskCompletion.count({
     *   where: {
     *     // ... the filter for the WorkOrderTaskCompletions we want to count
     *   }
     * })
    **/
    count<T extends WorkOrderTaskCompletionCountArgs>(
      args?: Subset<T, WorkOrderTaskCompletionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkOrderTaskCompletionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkOrderTaskCompletion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderTaskCompletionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkOrderTaskCompletionAggregateArgs>(args: Subset<T, WorkOrderTaskCompletionAggregateArgs>): Prisma.PrismaPromise<GetWorkOrderTaskCompletionAggregateType<T>>

    /**
     * Group by WorkOrderTaskCompletion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderTaskCompletionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkOrderTaskCompletionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkOrderTaskCompletionGroupByArgs['orderBy'] }
        : { orderBy?: WorkOrderTaskCompletionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkOrderTaskCompletionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkOrderTaskCompletionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkOrderTaskCompletion model
   */
  readonly fields: WorkOrderTaskCompletionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkOrderTaskCompletion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkOrderTaskCompletionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    workOrder<T extends WorkOrderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, WorkOrderDefaultArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkOrderTaskCompletion model
   */ 
  interface WorkOrderTaskCompletionFieldRefs {
    readonly id: FieldRef<"WorkOrderTaskCompletion", 'String'>
    readonly workOrderId: FieldRef<"WorkOrderTaskCompletion", 'String'>
    readonly templateTaskId: FieldRef<"WorkOrderTaskCompletion", 'String'>
    readonly isAdHoc: FieldRef<"WorkOrderTaskCompletion", 'Boolean'>
    readonly taskName: FieldRef<"WorkOrderTaskCompletion", 'String'>
    readonly isRequired: FieldRef<"WorkOrderTaskCompletion", 'Boolean'>
    readonly isCompleted: FieldRef<"WorkOrderTaskCompletion", 'Boolean'>
    readonly photoUrl: FieldRef<"WorkOrderTaskCompletion", 'String'>
    readonly notes: FieldRef<"WorkOrderTaskCompletion", 'String'>
    readonly completedAt: FieldRef<"WorkOrderTaskCompletion", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkOrderTaskCompletion findUnique
   */
  export type WorkOrderTaskCompletionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderTaskCompletion to fetch.
     */
    where: WorkOrderTaskCompletionWhereUniqueInput
  }

  /**
   * WorkOrderTaskCompletion findUniqueOrThrow
   */
  export type WorkOrderTaskCompletionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderTaskCompletion to fetch.
     */
    where: WorkOrderTaskCompletionWhereUniqueInput
  }

  /**
   * WorkOrderTaskCompletion findFirst
   */
  export type WorkOrderTaskCompletionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderTaskCompletion to fetch.
     */
    where?: WorkOrderTaskCompletionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrderTaskCompletions to fetch.
     */
    orderBy?: WorkOrderTaskCompletionOrderByWithRelationInput | WorkOrderTaskCompletionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkOrderTaskCompletions.
     */
    cursor?: WorkOrderTaskCompletionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrderTaskCompletions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrderTaskCompletions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkOrderTaskCompletions.
     */
    distinct?: WorkOrderTaskCompletionScalarFieldEnum | WorkOrderTaskCompletionScalarFieldEnum[]
  }

  /**
   * WorkOrderTaskCompletion findFirstOrThrow
   */
  export type WorkOrderTaskCompletionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderTaskCompletion to fetch.
     */
    where?: WorkOrderTaskCompletionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrderTaskCompletions to fetch.
     */
    orderBy?: WorkOrderTaskCompletionOrderByWithRelationInput | WorkOrderTaskCompletionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkOrderTaskCompletions.
     */
    cursor?: WorkOrderTaskCompletionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrderTaskCompletions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrderTaskCompletions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkOrderTaskCompletions.
     */
    distinct?: WorkOrderTaskCompletionScalarFieldEnum | WorkOrderTaskCompletionScalarFieldEnum[]
  }

  /**
   * WorkOrderTaskCompletion findMany
   */
  export type WorkOrderTaskCompletionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderTaskCompletions to fetch.
     */
    where?: WorkOrderTaskCompletionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrderTaskCompletions to fetch.
     */
    orderBy?: WorkOrderTaskCompletionOrderByWithRelationInput | WorkOrderTaskCompletionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkOrderTaskCompletions.
     */
    cursor?: WorkOrderTaskCompletionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrderTaskCompletions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrderTaskCompletions.
     */
    skip?: number
    distinct?: WorkOrderTaskCompletionScalarFieldEnum | WorkOrderTaskCompletionScalarFieldEnum[]
  }

  /**
   * WorkOrderTaskCompletion create
   */
  export type WorkOrderTaskCompletionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkOrderTaskCompletion.
     */
    data: XOR<WorkOrderTaskCompletionCreateInput, WorkOrderTaskCompletionUncheckedCreateInput>
  }

  /**
   * WorkOrderTaskCompletion createMany
   */
  export type WorkOrderTaskCompletionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkOrderTaskCompletions.
     */
    data: WorkOrderTaskCompletionCreateManyInput | WorkOrderTaskCompletionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkOrderTaskCompletion createManyAndReturn
   */
  export type WorkOrderTaskCompletionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many WorkOrderTaskCompletions.
     */
    data: WorkOrderTaskCompletionCreateManyInput | WorkOrderTaskCompletionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkOrderTaskCompletion update
   */
  export type WorkOrderTaskCompletionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkOrderTaskCompletion.
     */
    data: XOR<WorkOrderTaskCompletionUpdateInput, WorkOrderTaskCompletionUncheckedUpdateInput>
    /**
     * Choose, which WorkOrderTaskCompletion to update.
     */
    where: WorkOrderTaskCompletionWhereUniqueInput
  }

  /**
   * WorkOrderTaskCompletion updateMany
   */
  export type WorkOrderTaskCompletionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkOrderTaskCompletions.
     */
    data: XOR<WorkOrderTaskCompletionUpdateManyMutationInput, WorkOrderTaskCompletionUncheckedUpdateManyInput>
    /**
     * Filter which WorkOrderTaskCompletions to update
     */
    where?: WorkOrderTaskCompletionWhereInput
  }

  /**
   * WorkOrderTaskCompletion upsert
   */
  export type WorkOrderTaskCompletionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkOrderTaskCompletion to update in case it exists.
     */
    where: WorkOrderTaskCompletionWhereUniqueInput
    /**
     * In case the WorkOrderTaskCompletion found by the `where` argument doesn't exist, create a new WorkOrderTaskCompletion with this data.
     */
    create: XOR<WorkOrderTaskCompletionCreateInput, WorkOrderTaskCompletionUncheckedCreateInput>
    /**
     * In case the WorkOrderTaskCompletion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkOrderTaskCompletionUpdateInput, WorkOrderTaskCompletionUncheckedUpdateInput>
  }

  /**
   * WorkOrderTaskCompletion delete
   */
  export type WorkOrderTaskCompletionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
    /**
     * Filter which WorkOrderTaskCompletion to delete.
     */
    where: WorkOrderTaskCompletionWhereUniqueInput
  }

  /**
   * WorkOrderTaskCompletion deleteMany
   */
  export type WorkOrderTaskCompletionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkOrderTaskCompletions to delete
     */
    where?: WorkOrderTaskCompletionWhereInput
  }

  /**
   * WorkOrderTaskCompletion without action
   */
  export type WorkOrderTaskCompletionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderTaskCompletion
     */
    select?: WorkOrderTaskCompletionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderTaskCompletionInclude<ExtArgs> | null
  }


  /**
   * Model WorkOrderLineItem
   */

  export type AggregateWorkOrderLineItem = {
    _count: WorkOrderLineItemCountAggregateOutputType | null
    _avg: WorkOrderLineItemAvgAggregateOutputType | null
    _sum: WorkOrderLineItemSumAggregateOutputType | null
    _min: WorkOrderLineItemMinAggregateOutputType | null
    _max: WorkOrderLineItemMaxAggregateOutputType | null
  }

  export type WorkOrderLineItemAvgAggregateOutputType = {
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
  }

  export type WorkOrderLineItemSumAggregateOutputType = {
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
  }

  export type WorkOrderLineItemMinAggregateOutputType = {
    id: string | null
    workOrderId: string | null
    priceBookItemId: string | null
    description: string | null
    category: $Enums.PriceCategory | null
    quantity: Decimal | null
    unitPrice: Decimal | null
    taxable: boolean | null
    lineTotal: Decimal | null
    createdAt: Date | null
  }

  export type WorkOrderLineItemMaxAggregateOutputType = {
    id: string | null
    workOrderId: string | null
    priceBookItemId: string | null
    description: string | null
    category: $Enums.PriceCategory | null
    quantity: Decimal | null
    unitPrice: Decimal | null
    taxable: boolean | null
    lineTotal: Decimal | null
    createdAt: Date | null
  }

  export type WorkOrderLineItemCountAggregateOutputType = {
    id: number
    workOrderId: number
    priceBookItemId: number
    description: number
    category: number
    quantity: number
    unitPrice: number
    taxable: number
    lineTotal: number
    createdAt: number
    _all: number
  }


  export type WorkOrderLineItemAvgAggregateInputType = {
    quantity?: true
    unitPrice?: true
    lineTotal?: true
  }

  export type WorkOrderLineItemSumAggregateInputType = {
    quantity?: true
    unitPrice?: true
    lineTotal?: true
  }

  export type WorkOrderLineItemMinAggregateInputType = {
    id?: true
    workOrderId?: true
    priceBookItemId?: true
    description?: true
    category?: true
    quantity?: true
    unitPrice?: true
    taxable?: true
    lineTotal?: true
    createdAt?: true
  }

  export type WorkOrderLineItemMaxAggregateInputType = {
    id?: true
    workOrderId?: true
    priceBookItemId?: true
    description?: true
    category?: true
    quantity?: true
    unitPrice?: true
    taxable?: true
    lineTotal?: true
    createdAt?: true
  }

  export type WorkOrderLineItemCountAggregateInputType = {
    id?: true
    workOrderId?: true
    priceBookItemId?: true
    description?: true
    category?: true
    quantity?: true
    unitPrice?: true
    taxable?: true
    lineTotal?: true
    createdAt?: true
    _all?: true
  }

  export type WorkOrderLineItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkOrderLineItem to aggregate.
     */
    where?: WorkOrderLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrderLineItems to fetch.
     */
    orderBy?: WorkOrderLineItemOrderByWithRelationInput | WorkOrderLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkOrderLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrderLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrderLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkOrderLineItems
    **/
    _count?: true | WorkOrderLineItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WorkOrderLineItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WorkOrderLineItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkOrderLineItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkOrderLineItemMaxAggregateInputType
  }

  export type GetWorkOrderLineItemAggregateType<T extends WorkOrderLineItemAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkOrderLineItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkOrderLineItem[P]>
      : GetScalarType<T[P], AggregateWorkOrderLineItem[P]>
  }




  export type WorkOrderLineItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkOrderLineItemWhereInput
    orderBy?: WorkOrderLineItemOrderByWithAggregationInput | WorkOrderLineItemOrderByWithAggregationInput[]
    by: WorkOrderLineItemScalarFieldEnum[] | WorkOrderLineItemScalarFieldEnum
    having?: WorkOrderLineItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkOrderLineItemCountAggregateInputType | true
    _avg?: WorkOrderLineItemAvgAggregateInputType
    _sum?: WorkOrderLineItemSumAggregateInputType
    _min?: WorkOrderLineItemMinAggregateInputType
    _max?: WorkOrderLineItemMaxAggregateInputType
  }

  export type WorkOrderLineItemGroupByOutputType = {
    id: string
    workOrderId: string
    priceBookItemId: string | null
    description: string
    category: $Enums.PriceCategory
    quantity: Decimal
    unitPrice: Decimal
    taxable: boolean
    lineTotal: Decimal
    createdAt: Date
    _count: WorkOrderLineItemCountAggregateOutputType | null
    _avg: WorkOrderLineItemAvgAggregateOutputType | null
    _sum: WorkOrderLineItemSumAggregateOutputType | null
    _min: WorkOrderLineItemMinAggregateOutputType | null
    _max: WorkOrderLineItemMaxAggregateOutputType | null
  }

  type GetWorkOrderLineItemGroupByPayload<T extends WorkOrderLineItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkOrderLineItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkOrderLineItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkOrderLineItemGroupByOutputType[P]>
            : GetScalarType<T[P], WorkOrderLineItemGroupByOutputType[P]>
        }
      >
    >


  export type WorkOrderLineItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workOrderId?: boolean
    priceBookItemId?: boolean
    description?: boolean
    category?: boolean
    quantity?: boolean
    unitPrice?: boolean
    taxable?: boolean
    lineTotal?: boolean
    createdAt?: boolean
    workOrder?: boolean | WorkOrderDefaultArgs<ExtArgs>
    priceBookItem?: boolean | WorkOrderLineItem$priceBookItemArgs<ExtArgs>
  }, ExtArgs["result"]["workOrderLineItem"]>

  export type WorkOrderLineItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workOrderId?: boolean
    priceBookItemId?: boolean
    description?: boolean
    category?: boolean
    quantity?: boolean
    unitPrice?: boolean
    taxable?: boolean
    lineTotal?: boolean
    createdAt?: boolean
    workOrder?: boolean | WorkOrderDefaultArgs<ExtArgs>
    priceBookItem?: boolean | WorkOrderLineItem$priceBookItemArgs<ExtArgs>
  }, ExtArgs["result"]["workOrderLineItem"]>

  export type WorkOrderLineItemSelectScalar = {
    id?: boolean
    workOrderId?: boolean
    priceBookItemId?: boolean
    description?: boolean
    category?: boolean
    quantity?: boolean
    unitPrice?: boolean
    taxable?: boolean
    lineTotal?: boolean
    createdAt?: boolean
  }

  export type WorkOrderLineItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workOrder?: boolean | WorkOrderDefaultArgs<ExtArgs>
    priceBookItem?: boolean | WorkOrderLineItem$priceBookItemArgs<ExtArgs>
  }
  export type WorkOrderLineItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workOrder?: boolean | WorkOrderDefaultArgs<ExtArgs>
    priceBookItem?: boolean | WorkOrderLineItem$priceBookItemArgs<ExtArgs>
  }

  export type $WorkOrderLineItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkOrderLineItem"
    objects: {
      workOrder: Prisma.$WorkOrderPayload<ExtArgs>
      priceBookItem: Prisma.$PriceBookItemPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      workOrderId: string
      priceBookItemId: string | null
      description: string
      category: $Enums.PriceCategory
      quantity: Prisma.Decimal
      unitPrice: Prisma.Decimal
      taxable: boolean
      lineTotal: Prisma.Decimal
      createdAt: Date
    }, ExtArgs["result"]["workOrderLineItem"]>
    composites: {}
  }

  type WorkOrderLineItemGetPayload<S extends boolean | null | undefined | WorkOrderLineItemDefaultArgs> = $Result.GetResult<Prisma.$WorkOrderLineItemPayload, S>

  type WorkOrderLineItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WorkOrderLineItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WorkOrderLineItemCountAggregateInputType | true
    }

  export interface WorkOrderLineItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkOrderLineItem'], meta: { name: 'WorkOrderLineItem' } }
    /**
     * Find zero or one WorkOrderLineItem that matches the filter.
     * @param {WorkOrderLineItemFindUniqueArgs} args - Arguments to find a WorkOrderLineItem
     * @example
     * // Get one WorkOrderLineItem
     * const workOrderLineItem = await prisma.workOrderLineItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkOrderLineItemFindUniqueArgs>(args: SelectSubset<T, WorkOrderLineItemFindUniqueArgs<ExtArgs>>): Prisma__WorkOrderLineItemClient<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one WorkOrderLineItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WorkOrderLineItemFindUniqueOrThrowArgs} args - Arguments to find a WorkOrderLineItem
     * @example
     * // Get one WorkOrderLineItem
     * const workOrderLineItem = await prisma.workOrderLineItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkOrderLineItemFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkOrderLineItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkOrderLineItemClient<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first WorkOrderLineItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderLineItemFindFirstArgs} args - Arguments to find a WorkOrderLineItem
     * @example
     * // Get one WorkOrderLineItem
     * const workOrderLineItem = await prisma.workOrderLineItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkOrderLineItemFindFirstArgs>(args?: SelectSubset<T, WorkOrderLineItemFindFirstArgs<ExtArgs>>): Prisma__WorkOrderLineItemClient<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first WorkOrderLineItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderLineItemFindFirstOrThrowArgs} args - Arguments to find a WorkOrderLineItem
     * @example
     * // Get one WorkOrderLineItem
     * const workOrderLineItem = await prisma.workOrderLineItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkOrderLineItemFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkOrderLineItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkOrderLineItemClient<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more WorkOrderLineItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderLineItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkOrderLineItems
     * const workOrderLineItems = await prisma.workOrderLineItem.findMany()
     * 
     * // Get first 10 WorkOrderLineItems
     * const workOrderLineItems = await prisma.workOrderLineItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workOrderLineItemWithIdOnly = await prisma.workOrderLineItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkOrderLineItemFindManyArgs>(args?: SelectSubset<T, WorkOrderLineItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a WorkOrderLineItem.
     * @param {WorkOrderLineItemCreateArgs} args - Arguments to create a WorkOrderLineItem.
     * @example
     * // Create one WorkOrderLineItem
     * const WorkOrderLineItem = await prisma.workOrderLineItem.create({
     *   data: {
     *     // ... data to create a WorkOrderLineItem
     *   }
     * })
     * 
     */
    create<T extends WorkOrderLineItemCreateArgs>(args: SelectSubset<T, WorkOrderLineItemCreateArgs<ExtArgs>>): Prisma__WorkOrderLineItemClient<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many WorkOrderLineItems.
     * @param {WorkOrderLineItemCreateManyArgs} args - Arguments to create many WorkOrderLineItems.
     * @example
     * // Create many WorkOrderLineItems
     * const workOrderLineItem = await prisma.workOrderLineItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkOrderLineItemCreateManyArgs>(args?: SelectSubset<T, WorkOrderLineItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkOrderLineItems and returns the data saved in the database.
     * @param {WorkOrderLineItemCreateManyAndReturnArgs} args - Arguments to create many WorkOrderLineItems.
     * @example
     * // Create many WorkOrderLineItems
     * const workOrderLineItem = await prisma.workOrderLineItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkOrderLineItems and only return the `id`
     * const workOrderLineItemWithIdOnly = await prisma.workOrderLineItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkOrderLineItemCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkOrderLineItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a WorkOrderLineItem.
     * @param {WorkOrderLineItemDeleteArgs} args - Arguments to delete one WorkOrderLineItem.
     * @example
     * // Delete one WorkOrderLineItem
     * const WorkOrderLineItem = await prisma.workOrderLineItem.delete({
     *   where: {
     *     // ... filter to delete one WorkOrderLineItem
     *   }
     * })
     * 
     */
    delete<T extends WorkOrderLineItemDeleteArgs>(args: SelectSubset<T, WorkOrderLineItemDeleteArgs<ExtArgs>>): Prisma__WorkOrderLineItemClient<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one WorkOrderLineItem.
     * @param {WorkOrderLineItemUpdateArgs} args - Arguments to update one WorkOrderLineItem.
     * @example
     * // Update one WorkOrderLineItem
     * const workOrderLineItem = await prisma.workOrderLineItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkOrderLineItemUpdateArgs>(args: SelectSubset<T, WorkOrderLineItemUpdateArgs<ExtArgs>>): Prisma__WorkOrderLineItemClient<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more WorkOrderLineItems.
     * @param {WorkOrderLineItemDeleteManyArgs} args - Arguments to filter WorkOrderLineItems to delete.
     * @example
     * // Delete a few WorkOrderLineItems
     * const { count } = await prisma.workOrderLineItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkOrderLineItemDeleteManyArgs>(args?: SelectSubset<T, WorkOrderLineItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkOrderLineItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderLineItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkOrderLineItems
     * const workOrderLineItem = await prisma.workOrderLineItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkOrderLineItemUpdateManyArgs>(args: SelectSubset<T, WorkOrderLineItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one WorkOrderLineItem.
     * @param {WorkOrderLineItemUpsertArgs} args - Arguments to update or create a WorkOrderLineItem.
     * @example
     * // Update or create a WorkOrderLineItem
     * const workOrderLineItem = await prisma.workOrderLineItem.upsert({
     *   create: {
     *     // ... data to create a WorkOrderLineItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkOrderLineItem we want to update
     *   }
     * })
     */
    upsert<T extends WorkOrderLineItemUpsertArgs>(args: SelectSubset<T, WorkOrderLineItemUpsertArgs<ExtArgs>>): Prisma__WorkOrderLineItemClient<$Result.GetResult<Prisma.$WorkOrderLineItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of WorkOrderLineItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderLineItemCountArgs} args - Arguments to filter WorkOrderLineItems to count.
     * @example
     * // Count the number of WorkOrderLineItems
     * const count = await prisma.workOrderLineItem.count({
     *   where: {
     *     // ... the filter for the WorkOrderLineItems we want to count
     *   }
     * })
    **/
    count<T extends WorkOrderLineItemCountArgs>(
      args?: Subset<T, WorkOrderLineItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkOrderLineItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkOrderLineItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderLineItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkOrderLineItemAggregateArgs>(args: Subset<T, WorkOrderLineItemAggregateArgs>): Prisma.PrismaPromise<GetWorkOrderLineItemAggregateType<T>>

    /**
     * Group by WorkOrderLineItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkOrderLineItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkOrderLineItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkOrderLineItemGroupByArgs['orderBy'] }
        : { orderBy?: WorkOrderLineItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkOrderLineItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkOrderLineItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkOrderLineItem model
   */
  readonly fields: WorkOrderLineItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkOrderLineItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkOrderLineItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    workOrder<T extends WorkOrderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, WorkOrderDefaultArgs<ExtArgs>>): Prisma__WorkOrderClient<$Result.GetResult<Prisma.$WorkOrderPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    priceBookItem<T extends WorkOrderLineItem$priceBookItemArgs<ExtArgs> = {}>(args?: Subset<T, WorkOrderLineItem$priceBookItemArgs<ExtArgs>>): Prisma__PriceBookItemClient<$Result.GetResult<Prisma.$PriceBookItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkOrderLineItem model
   */ 
  interface WorkOrderLineItemFieldRefs {
    readonly id: FieldRef<"WorkOrderLineItem", 'String'>
    readonly workOrderId: FieldRef<"WorkOrderLineItem", 'String'>
    readonly priceBookItemId: FieldRef<"WorkOrderLineItem", 'String'>
    readonly description: FieldRef<"WorkOrderLineItem", 'String'>
    readonly category: FieldRef<"WorkOrderLineItem", 'PriceCategory'>
    readonly quantity: FieldRef<"WorkOrderLineItem", 'Decimal'>
    readonly unitPrice: FieldRef<"WorkOrderLineItem", 'Decimal'>
    readonly taxable: FieldRef<"WorkOrderLineItem", 'Boolean'>
    readonly lineTotal: FieldRef<"WorkOrderLineItem", 'Decimal'>
    readonly createdAt: FieldRef<"WorkOrderLineItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkOrderLineItem findUnique
   */
  export type WorkOrderLineItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderLineItem to fetch.
     */
    where: WorkOrderLineItemWhereUniqueInput
  }

  /**
   * WorkOrderLineItem findUniqueOrThrow
   */
  export type WorkOrderLineItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderLineItem to fetch.
     */
    where: WorkOrderLineItemWhereUniqueInput
  }

  /**
   * WorkOrderLineItem findFirst
   */
  export type WorkOrderLineItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderLineItem to fetch.
     */
    where?: WorkOrderLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrderLineItems to fetch.
     */
    orderBy?: WorkOrderLineItemOrderByWithRelationInput | WorkOrderLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkOrderLineItems.
     */
    cursor?: WorkOrderLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrderLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrderLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkOrderLineItems.
     */
    distinct?: WorkOrderLineItemScalarFieldEnum | WorkOrderLineItemScalarFieldEnum[]
  }

  /**
   * WorkOrderLineItem findFirstOrThrow
   */
  export type WorkOrderLineItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderLineItem to fetch.
     */
    where?: WorkOrderLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrderLineItems to fetch.
     */
    orderBy?: WorkOrderLineItemOrderByWithRelationInput | WorkOrderLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkOrderLineItems.
     */
    cursor?: WorkOrderLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrderLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrderLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkOrderLineItems.
     */
    distinct?: WorkOrderLineItemScalarFieldEnum | WorkOrderLineItemScalarFieldEnum[]
  }

  /**
   * WorkOrderLineItem findMany
   */
  export type WorkOrderLineItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    /**
     * Filter, which WorkOrderLineItems to fetch.
     */
    where?: WorkOrderLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkOrderLineItems to fetch.
     */
    orderBy?: WorkOrderLineItemOrderByWithRelationInput | WorkOrderLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkOrderLineItems.
     */
    cursor?: WorkOrderLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkOrderLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkOrderLineItems.
     */
    skip?: number
    distinct?: WorkOrderLineItemScalarFieldEnum | WorkOrderLineItemScalarFieldEnum[]
  }

  /**
   * WorkOrderLineItem create
   */
  export type WorkOrderLineItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkOrderLineItem.
     */
    data: XOR<WorkOrderLineItemCreateInput, WorkOrderLineItemUncheckedCreateInput>
  }

  /**
   * WorkOrderLineItem createMany
   */
  export type WorkOrderLineItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkOrderLineItems.
     */
    data: WorkOrderLineItemCreateManyInput | WorkOrderLineItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkOrderLineItem createManyAndReturn
   */
  export type WorkOrderLineItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many WorkOrderLineItems.
     */
    data: WorkOrderLineItemCreateManyInput | WorkOrderLineItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkOrderLineItem update
   */
  export type WorkOrderLineItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkOrderLineItem.
     */
    data: XOR<WorkOrderLineItemUpdateInput, WorkOrderLineItemUncheckedUpdateInput>
    /**
     * Choose, which WorkOrderLineItem to update.
     */
    where: WorkOrderLineItemWhereUniqueInput
  }

  /**
   * WorkOrderLineItem updateMany
   */
  export type WorkOrderLineItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkOrderLineItems.
     */
    data: XOR<WorkOrderLineItemUpdateManyMutationInput, WorkOrderLineItemUncheckedUpdateManyInput>
    /**
     * Filter which WorkOrderLineItems to update
     */
    where?: WorkOrderLineItemWhereInput
  }

  /**
   * WorkOrderLineItem upsert
   */
  export type WorkOrderLineItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkOrderLineItem to update in case it exists.
     */
    where: WorkOrderLineItemWhereUniqueInput
    /**
     * In case the WorkOrderLineItem found by the `where` argument doesn't exist, create a new WorkOrderLineItem with this data.
     */
    create: XOR<WorkOrderLineItemCreateInput, WorkOrderLineItemUncheckedCreateInput>
    /**
     * In case the WorkOrderLineItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkOrderLineItemUpdateInput, WorkOrderLineItemUncheckedUpdateInput>
  }

  /**
   * WorkOrderLineItem delete
   */
  export type WorkOrderLineItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
    /**
     * Filter which WorkOrderLineItem to delete.
     */
    where: WorkOrderLineItemWhereUniqueInput
  }

  /**
   * WorkOrderLineItem deleteMany
   */
  export type WorkOrderLineItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkOrderLineItems to delete
     */
    where?: WorkOrderLineItemWhereInput
  }

  /**
   * WorkOrderLineItem.priceBookItem
   */
  export type WorkOrderLineItem$priceBookItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceBookItem
     */
    select?: PriceBookItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceBookItemInclude<ExtArgs> | null
    where?: PriceBookItemWhereInput
  }

  /**
   * WorkOrderLineItem without action
   */
  export type WorkOrderLineItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkOrderLineItem
     */
    select?: WorkOrderLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkOrderLineItemInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const JobTypeScalarFieldEnum: {
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

  export type JobTypeScalarFieldEnum = (typeof JobTypeScalarFieldEnum)[keyof typeof JobTypeScalarFieldEnum]


  export const JobTemplateScalarFieldEnum: {
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

  export type JobTemplateScalarFieldEnum = (typeof JobTemplateScalarFieldEnum)[keyof typeof JobTemplateScalarFieldEnum]


  export const JobTemplateTaskScalarFieldEnum: {
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

  export type JobTemplateTaskScalarFieldEnum = (typeof JobTemplateTaskScalarFieldEnum)[keyof typeof JobTemplateTaskScalarFieldEnum]


  export const JobCustomFieldDefScalarFieldEnum: {
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

  export type JobCustomFieldDefScalarFieldEnum = (typeof JobCustomFieldDefScalarFieldEnum)[keyof typeof JobCustomFieldDefScalarFieldEnum]


  export const JobCustomFieldValueScalarFieldEnum: {
    id: 'id',
    jobId: 'jobId',
    fieldDefId: 'fieldDefId',
    value: 'value',
    updatedAt: 'updatedAt'
  };

  export type JobCustomFieldValueScalarFieldEnum = (typeof JobCustomFieldValueScalarFieldEnum)[keyof typeof JobCustomFieldValueScalarFieldEnum]


  export const PriceBookItemScalarFieldEnum: {
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

  export type PriceBookItemScalarFieldEnum = (typeof PriceBookItemScalarFieldEnum)[keyof typeof PriceBookItemScalarFieldEnum]


  export const JobScalarFieldEnum: {
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
    quoteId: 'quoteId',
    invoiceId: 'invoiceId',
    notes: 'notes',
    internalNotes: 'internalNotes',
    tags: 'tags',
    createdByUserId: 'createdByUserId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    completedAt: 'completedAt'
  };

  export type JobScalarFieldEnum = (typeof JobScalarFieldEnum)[keyof typeof JobScalarFieldEnum]


  export const JobStatusHistoryScalarFieldEnum: {
    id: 'id',
    jobId: 'jobId',
    fromStatus: 'fromStatus',
    toStatus: 'toStatus',
    changedById: 'changedById',
    changedByName: 'changedByName',
    note: 'note',
    createdAt: 'createdAt'
  };

  export type JobStatusHistoryScalarFieldEnum = (typeof JobStatusHistoryScalarFieldEnum)[keyof typeof JobStatusHistoryScalarFieldEnum]


  export const JobPhotoScalarFieldEnum: {
    id: 'id',
    jobId: 'jobId',
    workOrderId: 'workOrderId',
    s3Key: 's3Key',
    caption: 'caption',
    photoType: 'photoType',
    uploadedById: 'uploadedById',
    createdAt: 'createdAt'
  };

  export type JobPhotoScalarFieldEnum = (typeof JobPhotoScalarFieldEnum)[keyof typeof JobPhotoScalarFieldEnum]


  export const WorkOrderScalarFieldEnum: {
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

  export type WorkOrderScalarFieldEnum = (typeof WorkOrderScalarFieldEnum)[keyof typeof WorkOrderScalarFieldEnum]


  export const WorkOrderTaskCompletionScalarFieldEnum: {
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

  export type WorkOrderTaskCompletionScalarFieldEnum = (typeof WorkOrderTaskCompletionScalarFieldEnum)[keyof typeof WorkOrderTaskCompletionScalarFieldEnum]


  export const WorkOrderLineItemScalarFieldEnum: {
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

  export type WorkOrderLineItemScalarFieldEnum = (typeof WorkOrderLineItemScalarFieldEnum)[keyof typeof WorkOrderLineItemScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'CustomFieldType'
   */
  export type EnumCustomFieldTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CustomFieldType'>
    


  /**
   * Reference to a field of type 'CustomFieldType[]'
   */
  export type ListEnumCustomFieldTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CustomFieldType[]'>
    


  /**
   * Reference to a field of type 'PriceCategory'
   */
  export type EnumPriceCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PriceCategory'>
    


  /**
   * Reference to a field of type 'PriceCategory[]'
   */
  export type ListEnumPriceCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PriceCategory[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'JobStatus'
   */
  export type EnumJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobStatus'>
    


  /**
   * Reference to a field of type 'JobStatus[]'
   */
  export type ListEnumJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobStatus[]'>
    


  /**
   * Reference to a field of type 'JobPriority'
   */
  export type EnumJobPriorityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobPriority'>
    


  /**
   * Reference to a field of type 'JobPriority[]'
   */
  export type ListEnumJobPriorityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobPriority[]'>
    


  /**
   * Reference to a field of type 'PhotoType'
   */
  export type EnumPhotoTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PhotoType'>
    


  /**
   * Reference to a field of type 'PhotoType[]'
   */
  export type ListEnumPhotoTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PhotoType[]'>
    


  /**
   * Reference to a field of type 'WorkOrderStatus'
   */
  export type EnumWorkOrderStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkOrderStatus'>
    


  /**
   * Reference to a field of type 'WorkOrderStatus[]'
   */
  export type ListEnumWorkOrderStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkOrderStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type JobTypeWhereInput = {
    AND?: JobTypeWhereInput | JobTypeWhereInput[]
    OR?: JobTypeWhereInput[]
    NOT?: JobTypeWhereInput | JobTypeWhereInput[]
    id?: StringFilter<"JobType"> | string
    companyId?: StringFilter<"JobType"> | string
    name?: StringFilter<"JobType"> | string
    slug?: StringFilter<"JobType"> | string
    description?: StringNullableFilter<"JobType"> | string | null
    icon?: StringNullableFilter<"JobType"> | string | null
    color?: StringNullableFilter<"JobType"> | string | null
    isActive?: BoolFilter<"JobType"> | boolean
    sortOrder?: IntFilter<"JobType"> | number
    createdAt?: DateTimeFilter<"JobType"> | Date | string
    updatedAt?: DateTimeFilter<"JobType"> | Date | string
    templates?: JobTemplateListRelationFilter
    customFieldDefs?: JobCustomFieldDefListRelationFilter
    jobs?: JobListRelationFilter
  }

  export type JobTypeOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    isActive?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    templates?: JobTemplateOrderByRelationAggregateInput
    customFieldDefs?: JobCustomFieldDefOrderByRelationAggregateInput
    jobs?: JobOrderByRelationAggregateInput
  }

  export type JobTypeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_slug?: JobTypeCompanyIdSlugCompoundUniqueInput
    AND?: JobTypeWhereInput | JobTypeWhereInput[]
    OR?: JobTypeWhereInput[]
    NOT?: JobTypeWhereInput | JobTypeWhereInput[]
    companyId?: StringFilter<"JobType"> | string
    name?: StringFilter<"JobType"> | string
    slug?: StringFilter<"JobType"> | string
    description?: StringNullableFilter<"JobType"> | string | null
    icon?: StringNullableFilter<"JobType"> | string | null
    color?: StringNullableFilter<"JobType"> | string | null
    isActive?: BoolFilter<"JobType"> | boolean
    sortOrder?: IntFilter<"JobType"> | number
    createdAt?: DateTimeFilter<"JobType"> | Date | string
    updatedAt?: DateTimeFilter<"JobType"> | Date | string
    templates?: JobTemplateListRelationFilter
    customFieldDefs?: JobCustomFieldDefListRelationFilter
    jobs?: JobListRelationFilter
  }, "id" | "companyId_slug">

  export type JobTypeOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    isActive?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: JobTypeCountOrderByAggregateInput
    _avg?: JobTypeAvgOrderByAggregateInput
    _max?: JobTypeMaxOrderByAggregateInput
    _min?: JobTypeMinOrderByAggregateInput
    _sum?: JobTypeSumOrderByAggregateInput
  }

  export type JobTypeScalarWhereWithAggregatesInput = {
    AND?: JobTypeScalarWhereWithAggregatesInput | JobTypeScalarWhereWithAggregatesInput[]
    OR?: JobTypeScalarWhereWithAggregatesInput[]
    NOT?: JobTypeScalarWhereWithAggregatesInput | JobTypeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"JobType"> | string
    companyId?: StringWithAggregatesFilter<"JobType"> | string
    name?: StringWithAggregatesFilter<"JobType"> | string
    slug?: StringWithAggregatesFilter<"JobType"> | string
    description?: StringNullableWithAggregatesFilter<"JobType"> | string | null
    icon?: StringNullableWithAggregatesFilter<"JobType"> | string | null
    color?: StringNullableWithAggregatesFilter<"JobType"> | string | null
    isActive?: BoolWithAggregatesFilter<"JobType"> | boolean
    sortOrder?: IntWithAggregatesFilter<"JobType"> | number
    createdAt?: DateTimeWithAggregatesFilter<"JobType"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"JobType"> | Date | string
  }

  export type JobTemplateWhereInput = {
    AND?: JobTemplateWhereInput | JobTemplateWhereInput[]
    OR?: JobTemplateWhereInput[]
    NOT?: JobTemplateWhereInput | JobTemplateWhereInput[]
    id?: StringFilter<"JobTemplate"> | string
    companyId?: StringFilter<"JobTemplate"> | string
    jobTypeId?: StringFilter<"JobTemplate"> | string
    name?: StringFilter<"JobTemplate"> | string
    description?: StringNullableFilter<"JobTemplate"> | string | null
    estimatedDurationMins?: IntFilter<"JobTemplate"> | number
    version?: IntFilter<"JobTemplate"> | number
    isActive?: BoolFilter<"JobTemplate"> | boolean
    requiredParts?: JsonNullableFilter<"JobTemplate">
    createdAt?: DateTimeFilter<"JobTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"JobTemplate"> | Date | string
    jobType?: XOR<JobTypeRelationFilter, JobTypeWhereInput>
    tasks?: JobTemplateTaskListRelationFilter
    jobs?: JobListRelationFilter
  }

  export type JobTemplateOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    estimatedDurationMins?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    requiredParts?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    jobType?: JobTypeOrderByWithRelationInput
    tasks?: JobTemplateTaskOrderByRelationAggregateInput
    jobs?: JobOrderByRelationAggregateInput
  }

  export type JobTemplateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: JobTemplateWhereInput | JobTemplateWhereInput[]
    OR?: JobTemplateWhereInput[]
    NOT?: JobTemplateWhereInput | JobTemplateWhereInput[]
    companyId?: StringFilter<"JobTemplate"> | string
    jobTypeId?: StringFilter<"JobTemplate"> | string
    name?: StringFilter<"JobTemplate"> | string
    description?: StringNullableFilter<"JobTemplate"> | string | null
    estimatedDurationMins?: IntFilter<"JobTemplate"> | number
    version?: IntFilter<"JobTemplate"> | number
    isActive?: BoolFilter<"JobTemplate"> | boolean
    requiredParts?: JsonNullableFilter<"JobTemplate">
    createdAt?: DateTimeFilter<"JobTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"JobTemplate"> | Date | string
    jobType?: XOR<JobTypeRelationFilter, JobTypeWhereInput>
    tasks?: JobTemplateTaskListRelationFilter
    jobs?: JobListRelationFilter
  }, "id">

  export type JobTemplateOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    estimatedDurationMins?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    requiredParts?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: JobTemplateCountOrderByAggregateInput
    _avg?: JobTemplateAvgOrderByAggregateInput
    _max?: JobTemplateMaxOrderByAggregateInput
    _min?: JobTemplateMinOrderByAggregateInput
    _sum?: JobTemplateSumOrderByAggregateInput
  }

  export type JobTemplateScalarWhereWithAggregatesInput = {
    AND?: JobTemplateScalarWhereWithAggregatesInput | JobTemplateScalarWhereWithAggregatesInput[]
    OR?: JobTemplateScalarWhereWithAggregatesInput[]
    NOT?: JobTemplateScalarWhereWithAggregatesInput | JobTemplateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"JobTemplate"> | string
    companyId?: StringWithAggregatesFilter<"JobTemplate"> | string
    jobTypeId?: StringWithAggregatesFilter<"JobTemplate"> | string
    name?: StringWithAggregatesFilter<"JobTemplate"> | string
    description?: StringNullableWithAggregatesFilter<"JobTemplate"> | string | null
    estimatedDurationMins?: IntWithAggregatesFilter<"JobTemplate"> | number
    version?: IntWithAggregatesFilter<"JobTemplate"> | number
    isActive?: BoolWithAggregatesFilter<"JobTemplate"> | boolean
    requiredParts?: JsonNullableWithAggregatesFilter<"JobTemplate">
    createdAt?: DateTimeWithAggregatesFilter<"JobTemplate"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"JobTemplate"> | Date | string
  }

  export type JobTemplateTaskWhereInput = {
    AND?: JobTemplateTaskWhereInput | JobTemplateTaskWhereInput[]
    OR?: JobTemplateTaskWhereInput[]
    NOT?: JobTemplateTaskWhereInput | JobTemplateTaskWhereInput[]
    id?: StringFilter<"JobTemplateTask"> | string
    templateId?: StringFilter<"JobTemplateTask"> | string
    taskName?: StringFilter<"JobTemplateTask"> | string
    description?: StringNullableFilter<"JobTemplateTask"> | string | null
    taskOrder?: IntFilter<"JobTemplateTask"> | number
    isRequired?: BoolFilter<"JobTemplateTask"> | boolean
    photoRequired?: BoolFilter<"JobTemplateTask"> | boolean
    safetyNote?: StringNullableFilter<"JobTemplateTask"> | string | null
    estimatedMins?: IntNullableFilter<"JobTemplateTask"> | number | null
    createdAt?: DateTimeFilter<"JobTemplateTask"> | Date | string
    template?: XOR<JobTemplateRelationFilter, JobTemplateWhereInput>
  }

  export type JobTemplateTaskOrderByWithRelationInput = {
    id?: SortOrder
    templateId?: SortOrder
    taskName?: SortOrder
    description?: SortOrderInput | SortOrder
    taskOrder?: SortOrder
    isRequired?: SortOrder
    photoRequired?: SortOrder
    safetyNote?: SortOrderInput | SortOrder
    estimatedMins?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    template?: JobTemplateOrderByWithRelationInput
  }

  export type JobTemplateTaskWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: JobTemplateTaskWhereInput | JobTemplateTaskWhereInput[]
    OR?: JobTemplateTaskWhereInput[]
    NOT?: JobTemplateTaskWhereInput | JobTemplateTaskWhereInput[]
    templateId?: StringFilter<"JobTemplateTask"> | string
    taskName?: StringFilter<"JobTemplateTask"> | string
    description?: StringNullableFilter<"JobTemplateTask"> | string | null
    taskOrder?: IntFilter<"JobTemplateTask"> | number
    isRequired?: BoolFilter<"JobTemplateTask"> | boolean
    photoRequired?: BoolFilter<"JobTemplateTask"> | boolean
    safetyNote?: StringNullableFilter<"JobTemplateTask"> | string | null
    estimatedMins?: IntNullableFilter<"JobTemplateTask"> | number | null
    createdAt?: DateTimeFilter<"JobTemplateTask"> | Date | string
    template?: XOR<JobTemplateRelationFilter, JobTemplateWhereInput>
  }, "id">

  export type JobTemplateTaskOrderByWithAggregationInput = {
    id?: SortOrder
    templateId?: SortOrder
    taskName?: SortOrder
    description?: SortOrderInput | SortOrder
    taskOrder?: SortOrder
    isRequired?: SortOrder
    photoRequired?: SortOrder
    safetyNote?: SortOrderInput | SortOrder
    estimatedMins?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: JobTemplateTaskCountOrderByAggregateInput
    _avg?: JobTemplateTaskAvgOrderByAggregateInput
    _max?: JobTemplateTaskMaxOrderByAggregateInput
    _min?: JobTemplateTaskMinOrderByAggregateInput
    _sum?: JobTemplateTaskSumOrderByAggregateInput
  }

  export type JobTemplateTaskScalarWhereWithAggregatesInput = {
    AND?: JobTemplateTaskScalarWhereWithAggregatesInput | JobTemplateTaskScalarWhereWithAggregatesInput[]
    OR?: JobTemplateTaskScalarWhereWithAggregatesInput[]
    NOT?: JobTemplateTaskScalarWhereWithAggregatesInput | JobTemplateTaskScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"JobTemplateTask"> | string
    templateId?: StringWithAggregatesFilter<"JobTemplateTask"> | string
    taskName?: StringWithAggregatesFilter<"JobTemplateTask"> | string
    description?: StringNullableWithAggregatesFilter<"JobTemplateTask"> | string | null
    taskOrder?: IntWithAggregatesFilter<"JobTemplateTask"> | number
    isRequired?: BoolWithAggregatesFilter<"JobTemplateTask"> | boolean
    photoRequired?: BoolWithAggregatesFilter<"JobTemplateTask"> | boolean
    safetyNote?: StringNullableWithAggregatesFilter<"JobTemplateTask"> | string | null
    estimatedMins?: IntNullableWithAggregatesFilter<"JobTemplateTask"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"JobTemplateTask"> | Date | string
  }

  export type JobCustomFieldDefWhereInput = {
    AND?: JobCustomFieldDefWhereInput | JobCustomFieldDefWhereInput[]
    OR?: JobCustomFieldDefWhereInput[]
    NOT?: JobCustomFieldDefWhereInput | JobCustomFieldDefWhereInput[]
    id?: StringFilter<"JobCustomFieldDef"> | string
    companyId?: StringFilter<"JobCustomFieldDef"> | string
    jobTypeId?: StringFilter<"JobCustomFieldDef"> | string
    fieldKey?: StringFilter<"JobCustomFieldDef"> | string
    label?: StringFilter<"JobCustomFieldDef"> | string
    fieldType?: EnumCustomFieldTypeFilter<"JobCustomFieldDef"> | $Enums.CustomFieldType
    options?: JsonNullableFilter<"JobCustomFieldDef">
    isRequired?: BoolFilter<"JobCustomFieldDef"> | boolean
    helpText?: StringNullableFilter<"JobCustomFieldDef"> | string | null
    sortOrder?: IntFilter<"JobCustomFieldDef"> | number
    isActive?: BoolFilter<"JobCustomFieldDef"> | boolean
    createdAt?: DateTimeFilter<"JobCustomFieldDef"> | Date | string
    jobType?: XOR<JobTypeRelationFilter, JobTypeWhereInput>
    values?: JobCustomFieldValueListRelationFilter
  }

  export type JobCustomFieldDefOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    fieldKey?: SortOrder
    label?: SortOrder
    fieldType?: SortOrder
    options?: SortOrderInput | SortOrder
    isRequired?: SortOrder
    helpText?: SortOrderInput | SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    jobType?: JobTypeOrderByWithRelationInput
    values?: JobCustomFieldValueOrderByRelationAggregateInput
  }

  export type JobCustomFieldDefWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    jobTypeId_fieldKey?: JobCustomFieldDefJobTypeIdFieldKeyCompoundUniqueInput
    AND?: JobCustomFieldDefWhereInput | JobCustomFieldDefWhereInput[]
    OR?: JobCustomFieldDefWhereInput[]
    NOT?: JobCustomFieldDefWhereInput | JobCustomFieldDefWhereInput[]
    companyId?: StringFilter<"JobCustomFieldDef"> | string
    jobTypeId?: StringFilter<"JobCustomFieldDef"> | string
    fieldKey?: StringFilter<"JobCustomFieldDef"> | string
    label?: StringFilter<"JobCustomFieldDef"> | string
    fieldType?: EnumCustomFieldTypeFilter<"JobCustomFieldDef"> | $Enums.CustomFieldType
    options?: JsonNullableFilter<"JobCustomFieldDef">
    isRequired?: BoolFilter<"JobCustomFieldDef"> | boolean
    helpText?: StringNullableFilter<"JobCustomFieldDef"> | string | null
    sortOrder?: IntFilter<"JobCustomFieldDef"> | number
    isActive?: BoolFilter<"JobCustomFieldDef"> | boolean
    createdAt?: DateTimeFilter<"JobCustomFieldDef"> | Date | string
    jobType?: XOR<JobTypeRelationFilter, JobTypeWhereInput>
    values?: JobCustomFieldValueListRelationFilter
  }, "id" | "jobTypeId_fieldKey">

  export type JobCustomFieldDefOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    fieldKey?: SortOrder
    label?: SortOrder
    fieldType?: SortOrder
    options?: SortOrderInput | SortOrder
    isRequired?: SortOrder
    helpText?: SortOrderInput | SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    _count?: JobCustomFieldDefCountOrderByAggregateInput
    _avg?: JobCustomFieldDefAvgOrderByAggregateInput
    _max?: JobCustomFieldDefMaxOrderByAggregateInput
    _min?: JobCustomFieldDefMinOrderByAggregateInput
    _sum?: JobCustomFieldDefSumOrderByAggregateInput
  }

  export type JobCustomFieldDefScalarWhereWithAggregatesInput = {
    AND?: JobCustomFieldDefScalarWhereWithAggregatesInput | JobCustomFieldDefScalarWhereWithAggregatesInput[]
    OR?: JobCustomFieldDefScalarWhereWithAggregatesInput[]
    NOT?: JobCustomFieldDefScalarWhereWithAggregatesInput | JobCustomFieldDefScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"JobCustomFieldDef"> | string
    companyId?: StringWithAggregatesFilter<"JobCustomFieldDef"> | string
    jobTypeId?: StringWithAggregatesFilter<"JobCustomFieldDef"> | string
    fieldKey?: StringWithAggregatesFilter<"JobCustomFieldDef"> | string
    label?: StringWithAggregatesFilter<"JobCustomFieldDef"> | string
    fieldType?: EnumCustomFieldTypeWithAggregatesFilter<"JobCustomFieldDef"> | $Enums.CustomFieldType
    options?: JsonNullableWithAggregatesFilter<"JobCustomFieldDef">
    isRequired?: BoolWithAggregatesFilter<"JobCustomFieldDef"> | boolean
    helpText?: StringNullableWithAggregatesFilter<"JobCustomFieldDef"> | string | null
    sortOrder?: IntWithAggregatesFilter<"JobCustomFieldDef"> | number
    isActive?: BoolWithAggregatesFilter<"JobCustomFieldDef"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"JobCustomFieldDef"> | Date | string
  }

  export type JobCustomFieldValueWhereInput = {
    AND?: JobCustomFieldValueWhereInput | JobCustomFieldValueWhereInput[]
    OR?: JobCustomFieldValueWhereInput[]
    NOT?: JobCustomFieldValueWhereInput | JobCustomFieldValueWhereInput[]
    id?: StringFilter<"JobCustomFieldValue"> | string
    jobId?: StringFilter<"JobCustomFieldValue"> | string
    fieldDefId?: StringFilter<"JobCustomFieldValue"> | string
    value?: JsonFilter<"JobCustomFieldValue">
    updatedAt?: DateTimeFilter<"JobCustomFieldValue"> | Date | string
    job?: XOR<JobRelationFilter, JobWhereInput>
    fieldDef?: XOR<JobCustomFieldDefRelationFilter, JobCustomFieldDefWhereInput>
  }

  export type JobCustomFieldValueOrderByWithRelationInput = {
    id?: SortOrder
    jobId?: SortOrder
    fieldDefId?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
    job?: JobOrderByWithRelationInput
    fieldDef?: JobCustomFieldDefOrderByWithRelationInput
  }

  export type JobCustomFieldValueWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    jobId_fieldDefId?: JobCustomFieldValueJobIdFieldDefIdCompoundUniqueInput
    AND?: JobCustomFieldValueWhereInput | JobCustomFieldValueWhereInput[]
    OR?: JobCustomFieldValueWhereInput[]
    NOT?: JobCustomFieldValueWhereInput | JobCustomFieldValueWhereInput[]
    jobId?: StringFilter<"JobCustomFieldValue"> | string
    fieldDefId?: StringFilter<"JobCustomFieldValue"> | string
    value?: JsonFilter<"JobCustomFieldValue">
    updatedAt?: DateTimeFilter<"JobCustomFieldValue"> | Date | string
    job?: XOR<JobRelationFilter, JobWhereInput>
    fieldDef?: XOR<JobCustomFieldDefRelationFilter, JobCustomFieldDefWhereInput>
  }, "id" | "jobId_fieldDefId">

  export type JobCustomFieldValueOrderByWithAggregationInput = {
    id?: SortOrder
    jobId?: SortOrder
    fieldDefId?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
    _count?: JobCustomFieldValueCountOrderByAggregateInput
    _max?: JobCustomFieldValueMaxOrderByAggregateInput
    _min?: JobCustomFieldValueMinOrderByAggregateInput
  }

  export type JobCustomFieldValueScalarWhereWithAggregatesInput = {
    AND?: JobCustomFieldValueScalarWhereWithAggregatesInput | JobCustomFieldValueScalarWhereWithAggregatesInput[]
    OR?: JobCustomFieldValueScalarWhereWithAggregatesInput[]
    NOT?: JobCustomFieldValueScalarWhereWithAggregatesInput | JobCustomFieldValueScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"JobCustomFieldValue"> | string
    jobId?: StringWithAggregatesFilter<"JobCustomFieldValue"> | string
    fieldDefId?: StringWithAggregatesFilter<"JobCustomFieldValue"> | string
    value?: JsonWithAggregatesFilter<"JobCustomFieldValue">
    updatedAt?: DateTimeWithAggregatesFilter<"JobCustomFieldValue"> | Date | string
  }

  export type PriceBookItemWhereInput = {
    AND?: PriceBookItemWhereInput | PriceBookItemWhereInput[]
    OR?: PriceBookItemWhereInput[]
    NOT?: PriceBookItemWhereInput | PriceBookItemWhereInput[]
    id?: StringFilter<"PriceBookItem"> | string
    companyId?: StringFilter<"PriceBookItem"> | string
    category?: EnumPriceCategoryFilter<"PriceBookItem"> | $Enums.PriceCategory
    code?: StringNullableFilter<"PriceBookItem"> | string | null
    name?: StringFilter<"PriceBookItem"> | string
    description?: StringNullableFilter<"PriceBookItem"> | string | null
    unit?: StringFilter<"PriceBookItem"> | string
    unitPrice?: DecimalFilter<"PriceBookItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"PriceBookItem"> | boolean
    isActive?: BoolFilter<"PriceBookItem"> | boolean
    jobTypeId?: StringNullableFilter<"PriceBookItem"> | string | null
    createdAt?: DateTimeFilter<"PriceBookItem"> | Date | string
    updatedAt?: DateTimeFilter<"PriceBookItem"> | Date | string
    lineItems?: WorkOrderLineItemListRelationFilter
  }

  export type PriceBookItemOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    category?: SortOrder
    code?: SortOrderInput | SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    unit?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    isActive?: SortOrder
    jobTypeId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lineItems?: WorkOrderLineItemOrderByRelationAggregateInput
  }

  export type PriceBookItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PriceBookItemWhereInput | PriceBookItemWhereInput[]
    OR?: PriceBookItemWhereInput[]
    NOT?: PriceBookItemWhereInput | PriceBookItemWhereInput[]
    companyId?: StringFilter<"PriceBookItem"> | string
    category?: EnumPriceCategoryFilter<"PriceBookItem"> | $Enums.PriceCategory
    code?: StringNullableFilter<"PriceBookItem"> | string | null
    name?: StringFilter<"PriceBookItem"> | string
    description?: StringNullableFilter<"PriceBookItem"> | string | null
    unit?: StringFilter<"PriceBookItem"> | string
    unitPrice?: DecimalFilter<"PriceBookItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"PriceBookItem"> | boolean
    isActive?: BoolFilter<"PriceBookItem"> | boolean
    jobTypeId?: StringNullableFilter<"PriceBookItem"> | string | null
    createdAt?: DateTimeFilter<"PriceBookItem"> | Date | string
    updatedAt?: DateTimeFilter<"PriceBookItem"> | Date | string
    lineItems?: WorkOrderLineItemListRelationFilter
  }, "id">

  export type PriceBookItemOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    category?: SortOrder
    code?: SortOrderInput | SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    unit?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    isActive?: SortOrder
    jobTypeId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PriceBookItemCountOrderByAggregateInput
    _avg?: PriceBookItemAvgOrderByAggregateInput
    _max?: PriceBookItemMaxOrderByAggregateInput
    _min?: PriceBookItemMinOrderByAggregateInput
    _sum?: PriceBookItemSumOrderByAggregateInput
  }

  export type PriceBookItemScalarWhereWithAggregatesInput = {
    AND?: PriceBookItemScalarWhereWithAggregatesInput | PriceBookItemScalarWhereWithAggregatesInput[]
    OR?: PriceBookItemScalarWhereWithAggregatesInput[]
    NOT?: PriceBookItemScalarWhereWithAggregatesInput | PriceBookItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PriceBookItem"> | string
    companyId?: StringWithAggregatesFilter<"PriceBookItem"> | string
    category?: EnumPriceCategoryWithAggregatesFilter<"PriceBookItem"> | $Enums.PriceCategory
    code?: StringNullableWithAggregatesFilter<"PriceBookItem"> | string | null
    name?: StringWithAggregatesFilter<"PriceBookItem"> | string
    description?: StringNullableWithAggregatesFilter<"PriceBookItem"> | string | null
    unit?: StringWithAggregatesFilter<"PriceBookItem"> | string
    unitPrice?: DecimalWithAggregatesFilter<"PriceBookItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolWithAggregatesFilter<"PriceBookItem"> | boolean
    isActive?: BoolWithAggregatesFilter<"PriceBookItem"> | boolean
    jobTypeId?: StringNullableWithAggregatesFilter<"PriceBookItem"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PriceBookItem"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PriceBookItem"> | Date | string
  }

  export type JobWhereInput = {
    AND?: JobWhereInput | JobWhereInput[]
    OR?: JobWhereInput[]
    NOT?: JobWhereInput | JobWhereInput[]
    id?: StringFilter<"Job"> | string
    companyId?: StringFilter<"Job"> | string
    jobNumber?: StringFilter<"Job"> | string
    customerId?: StringFilter<"Job"> | string
    customerName?: StringFilter<"Job"> | string
    customerPhone?: StringNullableFilter<"Job"> | string | null
    customerEmail?: StringNullableFilter<"Job"> | string | null
    serviceAddress?: StringFilter<"Job"> | string
    serviceCity?: StringNullableFilter<"Job"> | string | null
    serviceState?: StringNullableFilter<"Job"> | string | null
    serviceZip?: StringNullableFilter<"Job"> | string | null
    serviceLatitude?: DecimalNullableFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: DecimalNullableFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: StringNullableFilter<"Job"> | string | null
    templateId?: StringNullableFilter<"Job"> | string | null
    title?: StringFilter<"Job"> | string
    description?: StringNullableFilter<"Job"> | string | null
    status?: EnumJobStatusFilter<"Job"> | $Enums.JobStatus
    priority?: EnumJobPriorityFilter<"Job"> | $Enums.JobPriority
    assignedToId?: StringNullableFilter<"Job"> | string | null
    assignedToName?: StringNullableFilter<"Job"> | string | null
    scheduledStart?: DateTimeNullableFilter<"Job"> | Date | string | null
    scheduledEnd?: DateTimeNullableFilter<"Job"> | Date | string | null
    actualStart?: DateTimeNullableFilter<"Job"> | Date | string | null
    actualEnd?: DateTimeNullableFilter<"Job"> | Date | string | null
    estimatedDurationMins?: IntNullableFilter<"Job"> | number | null
    travelDistanceKm?: DecimalNullableFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    quoteId?: StringNullableFilter<"Job"> | string | null
    invoiceId?: StringNullableFilter<"Job"> | string | null
    notes?: StringNullableFilter<"Job"> | string | null
    internalNotes?: StringNullableFilter<"Job"> | string | null
    tags?: StringNullableListFilter<"Job">
    createdByUserId?: StringFilter<"Job"> | string
    createdAt?: DateTimeFilter<"Job"> | Date | string
    updatedAt?: DateTimeFilter<"Job"> | Date | string
    completedAt?: DateTimeNullableFilter<"Job"> | Date | string | null
    jobType?: XOR<JobTypeNullableRelationFilter, JobTypeWhereInput> | null
    template?: XOR<JobTemplateNullableRelationFilter, JobTemplateWhereInput> | null
    workOrders?: WorkOrderListRelationFilter
    customFieldValues?: JobCustomFieldValueListRelationFilter
    statusHistory?: JobStatusHistoryListRelationFilter
    photos?: JobPhotoListRelationFilter
  }

  export type JobOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobNumber?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrderInput | SortOrder
    customerEmail?: SortOrderInput | SortOrder
    serviceAddress?: SortOrder
    serviceCity?: SortOrderInput | SortOrder
    serviceState?: SortOrderInput | SortOrder
    serviceZip?: SortOrderInput | SortOrder
    serviceLatitude?: SortOrderInput | SortOrder
    serviceLongitude?: SortOrderInput | SortOrder
    jobTypeId?: SortOrderInput | SortOrder
    templateId?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    priority?: SortOrder
    assignedToId?: SortOrderInput | SortOrder
    assignedToName?: SortOrderInput | SortOrder
    scheduledStart?: SortOrderInput | SortOrder
    scheduledEnd?: SortOrderInput | SortOrder
    actualStart?: SortOrderInput | SortOrder
    actualEnd?: SortOrderInput | SortOrder
    estimatedDurationMins?: SortOrderInput | SortOrder
    travelDistanceKm?: SortOrderInput | SortOrder
    quoteId?: SortOrderInput | SortOrder
    invoiceId?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    internalNotes?: SortOrderInput | SortOrder
    tags?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    jobType?: JobTypeOrderByWithRelationInput
    template?: JobTemplateOrderByWithRelationInput
    workOrders?: WorkOrderOrderByRelationAggregateInput
    customFieldValues?: JobCustomFieldValueOrderByRelationAggregateInput
    statusHistory?: JobStatusHistoryOrderByRelationAggregateInput
    photos?: JobPhotoOrderByRelationAggregateInput
  }

  export type JobWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_jobNumber?: JobCompanyIdJobNumberCompoundUniqueInput
    AND?: JobWhereInput | JobWhereInput[]
    OR?: JobWhereInput[]
    NOT?: JobWhereInput | JobWhereInput[]
    companyId?: StringFilter<"Job"> | string
    jobNumber?: StringFilter<"Job"> | string
    customerId?: StringFilter<"Job"> | string
    customerName?: StringFilter<"Job"> | string
    customerPhone?: StringNullableFilter<"Job"> | string | null
    customerEmail?: StringNullableFilter<"Job"> | string | null
    serviceAddress?: StringFilter<"Job"> | string
    serviceCity?: StringNullableFilter<"Job"> | string | null
    serviceState?: StringNullableFilter<"Job"> | string | null
    serviceZip?: StringNullableFilter<"Job"> | string | null
    serviceLatitude?: DecimalNullableFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: DecimalNullableFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: StringNullableFilter<"Job"> | string | null
    templateId?: StringNullableFilter<"Job"> | string | null
    title?: StringFilter<"Job"> | string
    description?: StringNullableFilter<"Job"> | string | null
    status?: EnumJobStatusFilter<"Job"> | $Enums.JobStatus
    priority?: EnumJobPriorityFilter<"Job"> | $Enums.JobPriority
    assignedToId?: StringNullableFilter<"Job"> | string | null
    assignedToName?: StringNullableFilter<"Job"> | string | null
    scheduledStart?: DateTimeNullableFilter<"Job"> | Date | string | null
    scheduledEnd?: DateTimeNullableFilter<"Job"> | Date | string | null
    actualStart?: DateTimeNullableFilter<"Job"> | Date | string | null
    actualEnd?: DateTimeNullableFilter<"Job"> | Date | string | null
    estimatedDurationMins?: IntNullableFilter<"Job"> | number | null
    travelDistanceKm?: DecimalNullableFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    quoteId?: StringNullableFilter<"Job"> | string | null
    invoiceId?: StringNullableFilter<"Job"> | string | null
    notes?: StringNullableFilter<"Job"> | string | null
    internalNotes?: StringNullableFilter<"Job"> | string | null
    tags?: StringNullableListFilter<"Job">
    createdByUserId?: StringFilter<"Job"> | string
    createdAt?: DateTimeFilter<"Job"> | Date | string
    updatedAt?: DateTimeFilter<"Job"> | Date | string
    completedAt?: DateTimeNullableFilter<"Job"> | Date | string | null
    jobType?: XOR<JobTypeNullableRelationFilter, JobTypeWhereInput> | null
    template?: XOR<JobTemplateNullableRelationFilter, JobTemplateWhereInput> | null
    workOrders?: WorkOrderListRelationFilter
    customFieldValues?: JobCustomFieldValueListRelationFilter
    statusHistory?: JobStatusHistoryListRelationFilter
    photos?: JobPhotoListRelationFilter
  }, "id" | "companyId_jobNumber">

  export type JobOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobNumber?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrderInput | SortOrder
    customerEmail?: SortOrderInput | SortOrder
    serviceAddress?: SortOrder
    serviceCity?: SortOrderInput | SortOrder
    serviceState?: SortOrderInput | SortOrder
    serviceZip?: SortOrderInput | SortOrder
    serviceLatitude?: SortOrderInput | SortOrder
    serviceLongitude?: SortOrderInput | SortOrder
    jobTypeId?: SortOrderInput | SortOrder
    templateId?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    priority?: SortOrder
    assignedToId?: SortOrderInput | SortOrder
    assignedToName?: SortOrderInput | SortOrder
    scheduledStart?: SortOrderInput | SortOrder
    scheduledEnd?: SortOrderInput | SortOrder
    actualStart?: SortOrderInput | SortOrder
    actualEnd?: SortOrderInput | SortOrder
    estimatedDurationMins?: SortOrderInput | SortOrder
    travelDistanceKm?: SortOrderInput | SortOrder
    quoteId?: SortOrderInput | SortOrder
    invoiceId?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    internalNotes?: SortOrderInput | SortOrder
    tags?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    _count?: JobCountOrderByAggregateInput
    _avg?: JobAvgOrderByAggregateInput
    _max?: JobMaxOrderByAggregateInput
    _min?: JobMinOrderByAggregateInput
    _sum?: JobSumOrderByAggregateInput
  }

  export type JobScalarWhereWithAggregatesInput = {
    AND?: JobScalarWhereWithAggregatesInput | JobScalarWhereWithAggregatesInput[]
    OR?: JobScalarWhereWithAggregatesInput[]
    NOT?: JobScalarWhereWithAggregatesInput | JobScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Job"> | string
    companyId?: StringWithAggregatesFilter<"Job"> | string
    jobNumber?: StringWithAggregatesFilter<"Job"> | string
    customerId?: StringWithAggregatesFilter<"Job"> | string
    customerName?: StringWithAggregatesFilter<"Job"> | string
    customerPhone?: StringNullableWithAggregatesFilter<"Job"> | string | null
    customerEmail?: StringNullableWithAggregatesFilter<"Job"> | string | null
    serviceAddress?: StringWithAggregatesFilter<"Job"> | string
    serviceCity?: StringNullableWithAggregatesFilter<"Job"> | string | null
    serviceState?: StringNullableWithAggregatesFilter<"Job"> | string | null
    serviceZip?: StringNullableWithAggregatesFilter<"Job"> | string | null
    serviceLatitude?: DecimalNullableWithAggregatesFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: DecimalNullableWithAggregatesFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: StringNullableWithAggregatesFilter<"Job"> | string | null
    templateId?: StringNullableWithAggregatesFilter<"Job"> | string | null
    title?: StringWithAggregatesFilter<"Job"> | string
    description?: StringNullableWithAggregatesFilter<"Job"> | string | null
    status?: EnumJobStatusWithAggregatesFilter<"Job"> | $Enums.JobStatus
    priority?: EnumJobPriorityWithAggregatesFilter<"Job"> | $Enums.JobPriority
    assignedToId?: StringNullableWithAggregatesFilter<"Job"> | string | null
    assignedToName?: StringNullableWithAggregatesFilter<"Job"> | string | null
    scheduledStart?: DateTimeNullableWithAggregatesFilter<"Job"> | Date | string | null
    scheduledEnd?: DateTimeNullableWithAggregatesFilter<"Job"> | Date | string | null
    actualStart?: DateTimeNullableWithAggregatesFilter<"Job"> | Date | string | null
    actualEnd?: DateTimeNullableWithAggregatesFilter<"Job"> | Date | string | null
    estimatedDurationMins?: IntNullableWithAggregatesFilter<"Job"> | number | null
    travelDistanceKm?: DecimalNullableWithAggregatesFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    quoteId?: StringNullableWithAggregatesFilter<"Job"> | string | null
    invoiceId?: StringNullableWithAggregatesFilter<"Job"> | string | null
    notes?: StringNullableWithAggregatesFilter<"Job"> | string | null
    internalNotes?: StringNullableWithAggregatesFilter<"Job"> | string | null
    tags?: StringNullableListFilter<"Job">
    createdByUserId?: StringWithAggregatesFilter<"Job"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Job"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Job"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"Job"> | Date | string | null
  }

  export type JobStatusHistoryWhereInput = {
    AND?: JobStatusHistoryWhereInput | JobStatusHistoryWhereInput[]
    OR?: JobStatusHistoryWhereInput[]
    NOT?: JobStatusHistoryWhereInput | JobStatusHistoryWhereInput[]
    id?: StringFilter<"JobStatusHistory"> | string
    jobId?: StringFilter<"JobStatusHistory"> | string
    fromStatus?: EnumJobStatusNullableFilter<"JobStatusHistory"> | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFilter<"JobStatusHistory"> | $Enums.JobStatus
    changedById?: StringFilter<"JobStatusHistory"> | string
    changedByName?: StringFilter<"JobStatusHistory"> | string
    note?: StringNullableFilter<"JobStatusHistory"> | string | null
    createdAt?: DateTimeFilter<"JobStatusHistory"> | Date | string
    job?: XOR<JobRelationFilter, JobWhereInput>
  }

  export type JobStatusHistoryOrderByWithRelationInput = {
    id?: SortOrder
    jobId?: SortOrder
    fromStatus?: SortOrderInput | SortOrder
    toStatus?: SortOrder
    changedById?: SortOrder
    changedByName?: SortOrder
    note?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    job?: JobOrderByWithRelationInput
  }

  export type JobStatusHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: JobStatusHistoryWhereInput | JobStatusHistoryWhereInput[]
    OR?: JobStatusHistoryWhereInput[]
    NOT?: JobStatusHistoryWhereInput | JobStatusHistoryWhereInput[]
    jobId?: StringFilter<"JobStatusHistory"> | string
    fromStatus?: EnumJobStatusNullableFilter<"JobStatusHistory"> | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFilter<"JobStatusHistory"> | $Enums.JobStatus
    changedById?: StringFilter<"JobStatusHistory"> | string
    changedByName?: StringFilter<"JobStatusHistory"> | string
    note?: StringNullableFilter<"JobStatusHistory"> | string | null
    createdAt?: DateTimeFilter<"JobStatusHistory"> | Date | string
    job?: XOR<JobRelationFilter, JobWhereInput>
  }, "id">

  export type JobStatusHistoryOrderByWithAggregationInput = {
    id?: SortOrder
    jobId?: SortOrder
    fromStatus?: SortOrderInput | SortOrder
    toStatus?: SortOrder
    changedById?: SortOrder
    changedByName?: SortOrder
    note?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: JobStatusHistoryCountOrderByAggregateInput
    _max?: JobStatusHistoryMaxOrderByAggregateInput
    _min?: JobStatusHistoryMinOrderByAggregateInput
  }

  export type JobStatusHistoryScalarWhereWithAggregatesInput = {
    AND?: JobStatusHistoryScalarWhereWithAggregatesInput | JobStatusHistoryScalarWhereWithAggregatesInput[]
    OR?: JobStatusHistoryScalarWhereWithAggregatesInput[]
    NOT?: JobStatusHistoryScalarWhereWithAggregatesInput | JobStatusHistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"JobStatusHistory"> | string
    jobId?: StringWithAggregatesFilter<"JobStatusHistory"> | string
    fromStatus?: EnumJobStatusNullableWithAggregatesFilter<"JobStatusHistory"> | $Enums.JobStatus | null
    toStatus?: EnumJobStatusWithAggregatesFilter<"JobStatusHistory"> | $Enums.JobStatus
    changedById?: StringWithAggregatesFilter<"JobStatusHistory"> | string
    changedByName?: StringWithAggregatesFilter<"JobStatusHistory"> | string
    note?: StringNullableWithAggregatesFilter<"JobStatusHistory"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"JobStatusHistory"> | Date | string
  }

  export type JobPhotoWhereInput = {
    AND?: JobPhotoWhereInput | JobPhotoWhereInput[]
    OR?: JobPhotoWhereInput[]
    NOT?: JobPhotoWhereInput | JobPhotoWhereInput[]
    id?: StringFilter<"JobPhoto"> | string
    jobId?: StringFilter<"JobPhoto"> | string
    workOrderId?: StringNullableFilter<"JobPhoto"> | string | null
    s3Key?: StringFilter<"JobPhoto"> | string
    caption?: StringNullableFilter<"JobPhoto"> | string | null
    photoType?: EnumPhotoTypeFilter<"JobPhoto"> | $Enums.PhotoType
    uploadedById?: StringFilter<"JobPhoto"> | string
    createdAt?: DateTimeFilter<"JobPhoto"> | Date | string
    job?: XOR<JobRelationFilter, JobWhereInput>
  }

  export type JobPhotoOrderByWithRelationInput = {
    id?: SortOrder
    jobId?: SortOrder
    workOrderId?: SortOrderInput | SortOrder
    s3Key?: SortOrder
    caption?: SortOrderInput | SortOrder
    photoType?: SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
    job?: JobOrderByWithRelationInput
  }

  export type JobPhotoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: JobPhotoWhereInput | JobPhotoWhereInput[]
    OR?: JobPhotoWhereInput[]
    NOT?: JobPhotoWhereInput | JobPhotoWhereInput[]
    jobId?: StringFilter<"JobPhoto"> | string
    workOrderId?: StringNullableFilter<"JobPhoto"> | string | null
    s3Key?: StringFilter<"JobPhoto"> | string
    caption?: StringNullableFilter<"JobPhoto"> | string | null
    photoType?: EnumPhotoTypeFilter<"JobPhoto"> | $Enums.PhotoType
    uploadedById?: StringFilter<"JobPhoto"> | string
    createdAt?: DateTimeFilter<"JobPhoto"> | Date | string
    job?: XOR<JobRelationFilter, JobWhereInput>
  }, "id">

  export type JobPhotoOrderByWithAggregationInput = {
    id?: SortOrder
    jobId?: SortOrder
    workOrderId?: SortOrderInput | SortOrder
    s3Key?: SortOrder
    caption?: SortOrderInput | SortOrder
    photoType?: SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
    _count?: JobPhotoCountOrderByAggregateInput
    _max?: JobPhotoMaxOrderByAggregateInput
    _min?: JobPhotoMinOrderByAggregateInput
  }

  export type JobPhotoScalarWhereWithAggregatesInput = {
    AND?: JobPhotoScalarWhereWithAggregatesInput | JobPhotoScalarWhereWithAggregatesInput[]
    OR?: JobPhotoScalarWhereWithAggregatesInput[]
    NOT?: JobPhotoScalarWhereWithAggregatesInput | JobPhotoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"JobPhoto"> | string
    jobId?: StringWithAggregatesFilter<"JobPhoto"> | string
    workOrderId?: StringNullableWithAggregatesFilter<"JobPhoto"> | string | null
    s3Key?: StringWithAggregatesFilter<"JobPhoto"> | string
    caption?: StringNullableWithAggregatesFilter<"JobPhoto"> | string | null
    photoType?: EnumPhotoTypeWithAggregatesFilter<"JobPhoto"> | $Enums.PhotoType
    uploadedById?: StringWithAggregatesFilter<"JobPhoto"> | string
    createdAt?: DateTimeWithAggregatesFilter<"JobPhoto"> | Date | string
  }

  export type WorkOrderWhereInput = {
    AND?: WorkOrderWhereInput | WorkOrderWhereInput[]
    OR?: WorkOrderWhereInput[]
    NOT?: WorkOrderWhereInput | WorkOrderWhereInput[]
    id?: StringFilter<"WorkOrder"> | string
    companyId?: StringFilter<"WorkOrder"> | string
    jobId?: StringFilter<"WorkOrder"> | string
    workOrderNumber?: StringFilter<"WorkOrder"> | string
    technicianId?: StringFilter<"WorkOrder"> | string
    technicianName?: StringFilter<"WorkOrder"> | string
    status?: EnumWorkOrderStatusFilter<"WorkOrder"> | $Enums.WorkOrderStatus
    scheduledStart?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    scheduledEnd?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    checkinAt?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    checkoutAt?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    signatureUrl?: StringNullableFilter<"WorkOrder"> | string | null
    technicianNotes?: StringNullableFilter<"WorkOrder"> | string | null
    createdAt?: DateTimeFilter<"WorkOrder"> | Date | string
    updatedAt?: DateTimeFilter<"WorkOrder"> | Date | string
    job?: XOR<JobRelationFilter, JobWhereInput>
    lineItems?: WorkOrderLineItemListRelationFilter
    taskCompletions?: WorkOrderTaskCompletionListRelationFilter
  }

  export type WorkOrderOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrder
    workOrderNumber?: SortOrder
    technicianId?: SortOrder
    technicianName?: SortOrder
    status?: SortOrder
    scheduledStart?: SortOrderInput | SortOrder
    scheduledEnd?: SortOrderInput | SortOrder
    checkinAt?: SortOrderInput | SortOrder
    checkoutAt?: SortOrderInput | SortOrder
    signatureUrl?: SortOrderInput | SortOrder
    technicianNotes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    job?: JobOrderByWithRelationInput
    lineItems?: WorkOrderLineItemOrderByRelationAggregateInput
    taskCompletions?: WorkOrderTaskCompletionOrderByRelationAggregateInput
  }

  export type WorkOrderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_workOrderNumber?: WorkOrderCompanyIdWorkOrderNumberCompoundUniqueInput
    AND?: WorkOrderWhereInput | WorkOrderWhereInput[]
    OR?: WorkOrderWhereInput[]
    NOT?: WorkOrderWhereInput | WorkOrderWhereInput[]
    companyId?: StringFilter<"WorkOrder"> | string
    jobId?: StringFilter<"WorkOrder"> | string
    workOrderNumber?: StringFilter<"WorkOrder"> | string
    technicianId?: StringFilter<"WorkOrder"> | string
    technicianName?: StringFilter<"WorkOrder"> | string
    status?: EnumWorkOrderStatusFilter<"WorkOrder"> | $Enums.WorkOrderStatus
    scheduledStart?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    scheduledEnd?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    checkinAt?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    checkoutAt?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    signatureUrl?: StringNullableFilter<"WorkOrder"> | string | null
    technicianNotes?: StringNullableFilter<"WorkOrder"> | string | null
    createdAt?: DateTimeFilter<"WorkOrder"> | Date | string
    updatedAt?: DateTimeFilter<"WorkOrder"> | Date | string
    job?: XOR<JobRelationFilter, JobWhereInput>
    lineItems?: WorkOrderLineItemListRelationFilter
    taskCompletions?: WorkOrderTaskCompletionListRelationFilter
  }, "id" | "companyId_workOrderNumber">

  export type WorkOrderOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrder
    workOrderNumber?: SortOrder
    technicianId?: SortOrder
    technicianName?: SortOrder
    status?: SortOrder
    scheduledStart?: SortOrderInput | SortOrder
    scheduledEnd?: SortOrderInput | SortOrder
    checkinAt?: SortOrderInput | SortOrder
    checkoutAt?: SortOrderInput | SortOrder
    signatureUrl?: SortOrderInput | SortOrder
    technicianNotes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WorkOrderCountOrderByAggregateInput
    _max?: WorkOrderMaxOrderByAggregateInput
    _min?: WorkOrderMinOrderByAggregateInput
  }

  export type WorkOrderScalarWhereWithAggregatesInput = {
    AND?: WorkOrderScalarWhereWithAggregatesInput | WorkOrderScalarWhereWithAggregatesInput[]
    OR?: WorkOrderScalarWhereWithAggregatesInput[]
    NOT?: WorkOrderScalarWhereWithAggregatesInput | WorkOrderScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorkOrder"> | string
    companyId?: StringWithAggregatesFilter<"WorkOrder"> | string
    jobId?: StringWithAggregatesFilter<"WorkOrder"> | string
    workOrderNumber?: StringWithAggregatesFilter<"WorkOrder"> | string
    technicianId?: StringWithAggregatesFilter<"WorkOrder"> | string
    technicianName?: StringWithAggregatesFilter<"WorkOrder"> | string
    status?: EnumWorkOrderStatusWithAggregatesFilter<"WorkOrder"> | $Enums.WorkOrderStatus
    scheduledStart?: DateTimeNullableWithAggregatesFilter<"WorkOrder"> | Date | string | null
    scheduledEnd?: DateTimeNullableWithAggregatesFilter<"WorkOrder"> | Date | string | null
    checkinAt?: DateTimeNullableWithAggregatesFilter<"WorkOrder"> | Date | string | null
    checkoutAt?: DateTimeNullableWithAggregatesFilter<"WorkOrder"> | Date | string | null
    signatureUrl?: StringNullableWithAggregatesFilter<"WorkOrder"> | string | null
    technicianNotes?: StringNullableWithAggregatesFilter<"WorkOrder"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"WorkOrder"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WorkOrder"> | Date | string
  }

  export type WorkOrderTaskCompletionWhereInput = {
    AND?: WorkOrderTaskCompletionWhereInput | WorkOrderTaskCompletionWhereInput[]
    OR?: WorkOrderTaskCompletionWhereInput[]
    NOT?: WorkOrderTaskCompletionWhereInput | WorkOrderTaskCompletionWhereInput[]
    id?: StringFilter<"WorkOrderTaskCompletion"> | string
    workOrderId?: StringFilter<"WorkOrderTaskCompletion"> | string
    templateTaskId?: StringNullableFilter<"WorkOrderTaskCompletion"> | string | null
    isAdHoc?: BoolFilter<"WorkOrderTaskCompletion"> | boolean
    taskName?: StringFilter<"WorkOrderTaskCompletion"> | string
    isRequired?: BoolFilter<"WorkOrderTaskCompletion"> | boolean
    isCompleted?: BoolFilter<"WorkOrderTaskCompletion"> | boolean
    photoUrl?: StringNullableFilter<"WorkOrderTaskCompletion"> | string | null
    notes?: StringNullableFilter<"WorkOrderTaskCompletion"> | string | null
    completedAt?: DateTimeNullableFilter<"WorkOrderTaskCompletion"> | Date | string | null
    workOrder?: XOR<WorkOrderRelationFilter, WorkOrderWhereInput>
  }

  export type WorkOrderTaskCompletionOrderByWithRelationInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    templateTaskId?: SortOrderInput | SortOrder
    isAdHoc?: SortOrder
    taskName?: SortOrder
    isRequired?: SortOrder
    isCompleted?: SortOrder
    photoUrl?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    workOrder?: WorkOrderOrderByWithRelationInput
  }

  export type WorkOrderTaskCompletionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WorkOrderTaskCompletionWhereInput | WorkOrderTaskCompletionWhereInput[]
    OR?: WorkOrderTaskCompletionWhereInput[]
    NOT?: WorkOrderTaskCompletionWhereInput | WorkOrderTaskCompletionWhereInput[]
    workOrderId?: StringFilter<"WorkOrderTaskCompletion"> | string
    templateTaskId?: StringNullableFilter<"WorkOrderTaskCompletion"> | string | null
    isAdHoc?: BoolFilter<"WorkOrderTaskCompletion"> | boolean
    taskName?: StringFilter<"WorkOrderTaskCompletion"> | string
    isRequired?: BoolFilter<"WorkOrderTaskCompletion"> | boolean
    isCompleted?: BoolFilter<"WorkOrderTaskCompletion"> | boolean
    photoUrl?: StringNullableFilter<"WorkOrderTaskCompletion"> | string | null
    notes?: StringNullableFilter<"WorkOrderTaskCompletion"> | string | null
    completedAt?: DateTimeNullableFilter<"WorkOrderTaskCompletion"> | Date | string | null
    workOrder?: XOR<WorkOrderRelationFilter, WorkOrderWhereInput>
  }, "id">

  export type WorkOrderTaskCompletionOrderByWithAggregationInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    templateTaskId?: SortOrderInput | SortOrder
    isAdHoc?: SortOrder
    taskName?: SortOrder
    isRequired?: SortOrder
    isCompleted?: SortOrder
    photoUrl?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    _count?: WorkOrderTaskCompletionCountOrderByAggregateInput
    _max?: WorkOrderTaskCompletionMaxOrderByAggregateInput
    _min?: WorkOrderTaskCompletionMinOrderByAggregateInput
  }

  export type WorkOrderTaskCompletionScalarWhereWithAggregatesInput = {
    AND?: WorkOrderTaskCompletionScalarWhereWithAggregatesInput | WorkOrderTaskCompletionScalarWhereWithAggregatesInput[]
    OR?: WorkOrderTaskCompletionScalarWhereWithAggregatesInput[]
    NOT?: WorkOrderTaskCompletionScalarWhereWithAggregatesInput | WorkOrderTaskCompletionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorkOrderTaskCompletion"> | string
    workOrderId?: StringWithAggregatesFilter<"WorkOrderTaskCompletion"> | string
    templateTaskId?: StringNullableWithAggregatesFilter<"WorkOrderTaskCompletion"> | string | null
    isAdHoc?: BoolWithAggregatesFilter<"WorkOrderTaskCompletion"> | boolean
    taskName?: StringWithAggregatesFilter<"WorkOrderTaskCompletion"> | string
    isRequired?: BoolWithAggregatesFilter<"WorkOrderTaskCompletion"> | boolean
    isCompleted?: BoolWithAggregatesFilter<"WorkOrderTaskCompletion"> | boolean
    photoUrl?: StringNullableWithAggregatesFilter<"WorkOrderTaskCompletion"> | string | null
    notes?: StringNullableWithAggregatesFilter<"WorkOrderTaskCompletion"> | string | null
    completedAt?: DateTimeNullableWithAggregatesFilter<"WorkOrderTaskCompletion"> | Date | string | null
  }

  export type WorkOrderLineItemWhereInput = {
    AND?: WorkOrderLineItemWhereInput | WorkOrderLineItemWhereInput[]
    OR?: WorkOrderLineItemWhereInput[]
    NOT?: WorkOrderLineItemWhereInput | WorkOrderLineItemWhereInput[]
    id?: StringFilter<"WorkOrderLineItem"> | string
    workOrderId?: StringFilter<"WorkOrderLineItem"> | string
    priceBookItemId?: StringNullableFilter<"WorkOrderLineItem"> | string | null
    description?: StringFilter<"WorkOrderLineItem"> | string
    category?: EnumPriceCategoryFilter<"WorkOrderLineItem"> | $Enums.PriceCategory
    quantity?: DecimalFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"WorkOrderLineItem"> | boolean
    lineTotal?: DecimalFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"WorkOrderLineItem"> | Date | string
    workOrder?: XOR<WorkOrderRelationFilter, WorkOrderWhereInput>
    priceBookItem?: XOR<PriceBookItemNullableRelationFilter, PriceBookItemWhereInput> | null
  }

  export type WorkOrderLineItemOrderByWithRelationInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    priceBookItemId?: SortOrderInput | SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    lineTotal?: SortOrder
    createdAt?: SortOrder
    workOrder?: WorkOrderOrderByWithRelationInput
    priceBookItem?: PriceBookItemOrderByWithRelationInput
  }

  export type WorkOrderLineItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WorkOrderLineItemWhereInput | WorkOrderLineItemWhereInput[]
    OR?: WorkOrderLineItemWhereInput[]
    NOT?: WorkOrderLineItemWhereInput | WorkOrderLineItemWhereInput[]
    workOrderId?: StringFilter<"WorkOrderLineItem"> | string
    priceBookItemId?: StringNullableFilter<"WorkOrderLineItem"> | string | null
    description?: StringFilter<"WorkOrderLineItem"> | string
    category?: EnumPriceCategoryFilter<"WorkOrderLineItem"> | $Enums.PriceCategory
    quantity?: DecimalFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"WorkOrderLineItem"> | boolean
    lineTotal?: DecimalFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"WorkOrderLineItem"> | Date | string
    workOrder?: XOR<WorkOrderRelationFilter, WorkOrderWhereInput>
    priceBookItem?: XOR<PriceBookItemNullableRelationFilter, PriceBookItemWhereInput> | null
  }, "id">

  export type WorkOrderLineItemOrderByWithAggregationInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    priceBookItemId?: SortOrderInput | SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    lineTotal?: SortOrder
    createdAt?: SortOrder
    _count?: WorkOrderLineItemCountOrderByAggregateInput
    _avg?: WorkOrderLineItemAvgOrderByAggregateInput
    _max?: WorkOrderLineItemMaxOrderByAggregateInput
    _min?: WorkOrderLineItemMinOrderByAggregateInput
    _sum?: WorkOrderLineItemSumOrderByAggregateInput
  }

  export type WorkOrderLineItemScalarWhereWithAggregatesInput = {
    AND?: WorkOrderLineItemScalarWhereWithAggregatesInput | WorkOrderLineItemScalarWhereWithAggregatesInput[]
    OR?: WorkOrderLineItemScalarWhereWithAggregatesInput[]
    NOT?: WorkOrderLineItemScalarWhereWithAggregatesInput | WorkOrderLineItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorkOrderLineItem"> | string
    workOrderId?: StringWithAggregatesFilter<"WorkOrderLineItem"> | string
    priceBookItemId?: StringNullableWithAggregatesFilter<"WorkOrderLineItem"> | string | null
    description?: StringWithAggregatesFilter<"WorkOrderLineItem"> | string
    category?: EnumPriceCategoryWithAggregatesFilter<"WorkOrderLineItem"> | $Enums.PriceCategory
    quantity?: DecimalWithAggregatesFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalWithAggregatesFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolWithAggregatesFilter<"WorkOrderLineItem"> | boolean
    lineTotal?: DecimalWithAggregatesFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeWithAggregatesFilter<"WorkOrderLineItem"> | Date | string
  }

  export type JobTypeCreateInput = {
    id?: string
    companyId: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    isActive?: boolean
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    templates?: JobTemplateCreateNestedManyWithoutJobTypeInput
    customFieldDefs?: JobCustomFieldDefCreateNestedManyWithoutJobTypeInput
    jobs?: JobCreateNestedManyWithoutJobTypeInput
  }

  export type JobTypeUncheckedCreateInput = {
    id?: string
    companyId: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    isActive?: boolean
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    templates?: JobTemplateUncheckedCreateNestedManyWithoutJobTypeInput
    customFieldDefs?: JobCustomFieldDefUncheckedCreateNestedManyWithoutJobTypeInput
    jobs?: JobUncheckedCreateNestedManyWithoutJobTypeInput
  }

  export type JobTypeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    templates?: JobTemplateUpdateManyWithoutJobTypeNestedInput
    customFieldDefs?: JobCustomFieldDefUpdateManyWithoutJobTypeNestedInput
    jobs?: JobUpdateManyWithoutJobTypeNestedInput
  }

  export type JobTypeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    templates?: JobTemplateUncheckedUpdateManyWithoutJobTypeNestedInput
    customFieldDefs?: JobCustomFieldDefUncheckedUpdateManyWithoutJobTypeNestedInput
    jobs?: JobUncheckedUpdateManyWithoutJobTypeNestedInput
  }

  export type JobTypeCreateManyInput = {
    id?: string
    companyId: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    isActive?: boolean
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type JobTypeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobTypeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobTemplateCreateInput = {
    id?: string
    companyId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    jobType: JobTypeCreateNestedOneWithoutTemplatesInput
    tasks?: JobTemplateTaskCreateNestedManyWithoutTemplateInput
    jobs?: JobCreateNestedManyWithoutTemplateInput
  }

  export type JobTemplateUncheckedCreateInput = {
    id?: string
    companyId: string
    jobTypeId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: JobTemplateTaskUncheckedCreateNestedManyWithoutTemplateInput
    jobs?: JobUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type JobTemplateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobType?: JobTypeUpdateOneRequiredWithoutTemplatesNestedInput
    tasks?: JobTemplateTaskUpdateManyWithoutTemplateNestedInput
    jobs?: JobUpdateManyWithoutTemplateNestedInput
  }

  export type JobTemplateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobTypeId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: JobTemplateTaskUncheckedUpdateManyWithoutTemplateNestedInput
    jobs?: JobUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type JobTemplateCreateManyInput = {
    id?: string
    companyId: string
    jobTypeId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type JobTemplateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobTemplateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobTypeId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobTemplateTaskCreateInput = {
    id?: string
    taskName: string
    description?: string | null
    taskOrder: number
    isRequired?: boolean
    photoRequired?: boolean
    safetyNote?: string | null
    estimatedMins?: number | null
    createdAt?: Date | string
    template: JobTemplateCreateNestedOneWithoutTasksInput
  }

  export type JobTemplateTaskUncheckedCreateInput = {
    id?: string
    templateId: string
    taskName: string
    description?: string | null
    taskOrder: number
    isRequired?: boolean
    photoRequired?: boolean
    safetyNote?: string | null
    estimatedMins?: number | null
    createdAt?: Date | string
  }

  export type JobTemplateTaskUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    taskName?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    taskOrder?: IntFieldUpdateOperationsInput | number
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    photoRequired?: BoolFieldUpdateOperationsInput | boolean
    safetyNote?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedMins?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    template?: JobTemplateUpdateOneRequiredWithoutTasksNestedInput
  }

  export type JobTemplateTaskUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    templateId?: StringFieldUpdateOperationsInput | string
    taskName?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    taskOrder?: IntFieldUpdateOperationsInput | number
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    photoRequired?: BoolFieldUpdateOperationsInput | boolean
    safetyNote?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedMins?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobTemplateTaskCreateManyInput = {
    id?: string
    templateId: string
    taskName: string
    description?: string | null
    taskOrder: number
    isRequired?: boolean
    photoRequired?: boolean
    safetyNote?: string | null
    estimatedMins?: number | null
    createdAt?: Date | string
  }

  export type JobTemplateTaskUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    taskName?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    taskOrder?: IntFieldUpdateOperationsInput | number
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    photoRequired?: BoolFieldUpdateOperationsInput | boolean
    safetyNote?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedMins?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobTemplateTaskUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    templateId?: StringFieldUpdateOperationsInput | string
    taskName?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    taskOrder?: IntFieldUpdateOperationsInput | number
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    photoRequired?: BoolFieldUpdateOperationsInput | boolean
    safetyNote?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedMins?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCustomFieldDefCreateInput = {
    id?: string
    companyId: string
    fieldKey: string
    label: string
    fieldType: $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: boolean
    helpText?: string | null
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
    jobType: JobTypeCreateNestedOneWithoutCustomFieldDefsInput
    values?: JobCustomFieldValueCreateNestedManyWithoutFieldDefInput
  }

  export type JobCustomFieldDefUncheckedCreateInput = {
    id?: string
    companyId: string
    jobTypeId: string
    fieldKey: string
    label: string
    fieldType: $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: boolean
    helpText?: string | null
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
    values?: JobCustomFieldValueUncheckedCreateNestedManyWithoutFieldDefInput
  }

  export type JobCustomFieldDefUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    fieldKey?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    fieldType?: EnumCustomFieldTypeFieldUpdateOperationsInput | $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    helpText?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobType?: JobTypeUpdateOneRequiredWithoutCustomFieldDefsNestedInput
    values?: JobCustomFieldValueUpdateManyWithoutFieldDefNestedInput
  }

  export type JobCustomFieldDefUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobTypeId?: StringFieldUpdateOperationsInput | string
    fieldKey?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    fieldType?: EnumCustomFieldTypeFieldUpdateOperationsInput | $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    helpText?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    values?: JobCustomFieldValueUncheckedUpdateManyWithoutFieldDefNestedInput
  }

  export type JobCustomFieldDefCreateManyInput = {
    id?: string
    companyId: string
    jobTypeId: string
    fieldKey: string
    label: string
    fieldType: $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: boolean
    helpText?: string | null
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
  }

  export type JobCustomFieldDefUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    fieldKey?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    fieldType?: EnumCustomFieldTypeFieldUpdateOperationsInput | $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    helpText?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCustomFieldDefUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobTypeId?: StringFieldUpdateOperationsInput | string
    fieldKey?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    fieldType?: EnumCustomFieldTypeFieldUpdateOperationsInput | $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    helpText?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCustomFieldValueCreateInput = {
    id?: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
    job: JobCreateNestedOneWithoutCustomFieldValuesInput
    fieldDef: JobCustomFieldDefCreateNestedOneWithoutValuesInput
  }

  export type JobCustomFieldValueUncheckedCreateInput = {
    id?: string
    jobId: string
    fieldDefId: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type JobCustomFieldValueUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    job?: JobUpdateOneRequiredWithoutCustomFieldValuesNestedInput
    fieldDef?: JobCustomFieldDefUpdateOneRequiredWithoutValuesNestedInput
  }

  export type JobCustomFieldValueUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    fieldDefId?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCustomFieldValueCreateManyInput = {
    id?: string
    jobId: string
    fieldDefId: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type JobCustomFieldValueUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCustomFieldValueUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    fieldDefId?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceBookItemCreateInput = {
    id?: string
    companyId: string
    category: $Enums.PriceCategory
    code?: string | null
    name: string
    description?: string | null
    unit?: string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    isActive?: boolean
    jobTypeId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: WorkOrderLineItemCreateNestedManyWithoutPriceBookItemInput
  }

  export type PriceBookItemUncheckedCreateInput = {
    id?: string
    companyId: string
    category: $Enums.PriceCategory
    code?: string | null
    name: string
    description?: string | null
    unit?: string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    isActive?: boolean
    jobTypeId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: WorkOrderLineItemUncheckedCreateNestedManyWithoutPriceBookItemInput
  }

  export type PriceBookItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    code?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: StringFieldUpdateOperationsInput | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: WorkOrderLineItemUpdateManyWithoutPriceBookItemNestedInput
  }

  export type PriceBookItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    code?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: StringFieldUpdateOperationsInput | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: WorkOrderLineItemUncheckedUpdateManyWithoutPriceBookItemNestedInput
  }

  export type PriceBookItemCreateManyInput = {
    id?: string
    companyId: string
    category: $Enums.PriceCategory
    code?: string | null
    name: string
    description?: string | null
    unit?: string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    isActive?: boolean
    jobTypeId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PriceBookItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    code?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: StringFieldUpdateOperationsInput | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceBookItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    code?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: StringFieldUpdateOperationsInput | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCreateInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    jobType?: JobTypeCreateNestedOneWithoutJobsInput
    template?: JobTemplateCreateNestedOneWithoutJobsInput
    workOrders?: WorkOrderCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryCreateNestedManyWithoutJobInput
    photos?: JobPhotoCreateNestedManyWithoutJobInput
  }

  export type JobUncheckedCreateInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    jobTypeId?: string | null
    templateId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    workOrders?: WorkOrderUncheckedCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueUncheckedCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryUncheckedCreateNestedManyWithoutJobInput
    photos?: JobPhotoUncheckedCreateNestedManyWithoutJobInput
  }

  export type JobUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    jobType?: JobTypeUpdateOneWithoutJobsNestedInput
    template?: JobTemplateUpdateOneWithoutJobsNestedInput
    workOrders?: WorkOrderUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUpdateManyWithoutJobNestedInput
  }

  export type JobUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    workOrders?: WorkOrderUncheckedUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUncheckedUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUncheckedUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUncheckedUpdateManyWithoutJobNestedInput
  }

  export type JobCreateManyInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    jobTypeId?: string | null
    templateId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type JobUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type JobUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type JobStatusHistoryCreateInput = {
    id?: string
    fromStatus?: $Enums.JobStatus | null
    toStatus: $Enums.JobStatus
    changedById: string
    changedByName: string
    note?: string | null
    createdAt?: Date | string
    job: JobCreateNestedOneWithoutStatusHistoryInput
  }

  export type JobStatusHistoryUncheckedCreateInput = {
    id?: string
    jobId: string
    fromStatus?: $Enums.JobStatus | null
    toStatus: $Enums.JobStatus
    changedById: string
    changedByName: string
    note?: string | null
    createdAt?: Date | string
  }

  export type JobStatusHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromStatus?: NullableEnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    changedById?: StringFieldUpdateOperationsInput | string
    changedByName?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    job?: JobUpdateOneRequiredWithoutStatusHistoryNestedInput
  }

  export type JobStatusHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    fromStatus?: NullableEnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    changedById?: StringFieldUpdateOperationsInput | string
    changedByName?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobStatusHistoryCreateManyInput = {
    id?: string
    jobId: string
    fromStatus?: $Enums.JobStatus | null
    toStatus: $Enums.JobStatus
    changedById: string
    changedByName: string
    note?: string | null
    createdAt?: Date | string
  }

  export type JobStatusHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromStatus?: NullableEnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    changedById?: StringFieldUpdateOperationsInput | string
    changedByName?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobStatusHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    fromStatus?: NullableEnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    changedById?: StringFieldUpdateOperationsInput | string
    changedByName?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobPhotoCreateInput = {
    id?: string
    workOrderId?: string | null
    s3Key: string
    caption?: string | null
    photoType?: $Enums.PhotoType
    uploadedById: string
    createdAt?: Date | string
    job: JobCreateNestedOneWithoutPhotosInput
  }

  export type JobPhotoUncheckedCreateInput = {
    id?: string
    jobId: string
    workOrderId?: string | null
    s3Key: string
    caption?: string | null
    photoType?: $Enums.PhotoType
    uploadedById: string
    createdAt?: Date | string
  }

  export type JobPhotoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    s3Key?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    photoType?: EnumPhotoTypeFieldUpdateOperationsInput | $Enums.PhotoType
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    job?: JobUpdateOneRequiredWithoutPhotosNestedInput
  }

  export type JobPhotoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    s3Key?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    photoType?: EnumPhotoTypeFieldUpdateOperationsInput | $Enums.PhotoType
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobPhotoCreateManyInput = {
    id?: string
    jobId: string
    workOrderId?: string | null
    s3Key: string
    caption?: string | null
    photoType?: $Enums.PhotoType
    uploadedById: string
    createdAt?: Date | string
  }

  export type JobPhotoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    s3Key?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    photoType?: EnumPhotoTypeFieldUpdateOperationsInput | $Enums.PhotoType
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobPhotoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    s3Key?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    photoType?: EnumPhotoTypeFieldUpdateOperationsInput | $Enums.PhotoType
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderCreateInput = {
    id?: string
    companyId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    job: JobCreateNestedOneWithoutWorkOrdersInput
    lineItems?: WorkOrderLineItemCreateNestedManyWithoutWorkOrderInput
    taskCompletions?: WorkOrderTaskCompletionCreateNestedManyWithoutWorkOrderInput
  }

  export type WorkOrderUncheckedCreateInput = {
    id?: string
    companyId: string
    jobId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: WorkOrderLineItemUncheckedCreateNestedManyWithoutWorkOrderInput
    taskCompletions?: WorkOrderTaskCompletionUncheckedCreateNestedManyWithoutWorkOrderInput
  }

  export type WorkOrderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    job?: JobUpdateOneRequiredWithoutWorkOrdersNestedInput
    lineItems?: WorkOrderLineItemUpdateManyWithoutWorkOrderNestedInput
    taskCompletions?: WorkOrderTaskCompletionUpdateManyWithoutWorkOrderNestedInput
  }

  export type WorkOrderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: WorkOrderLineItemUncheckedUpdateManyWithoutWorkOrderNestedInput
    taskCompletions?: WorkOrderTaskCompletionUncheckedUpdateManyWithoutWorkOrderNestedInput
  }

  export type WorkOrderCreateManyInput = {
    id?: string
    companyId: string
    jobId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkOrderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderTaskCompletionCreateInput = {
    id?: string
    templateTaskId?: string | null
    isAdHoc?: boolean
    taskName: string
    isRequired?: boolean
    isCompleted?: boolean
    photoUrl?: string | null
    notes?: string | null
    completedAt?: Date | string | null
    workOrder: WorkOrderCreateNestedOneWithoutTaskCompletionsInput
  }

  export type WorkOrderTaskCompletionUncheckedCreateInput = {
    id?: string
    workOrderId: string
    templateTaskId?: string | null
    isAdHoc?: boolean
    taskName: string
    isRequired?: boolean
    isCompleted?: boolean
    photoUrl?: string | null
    notes?: string | null
    completedAt?: Date | string | null
  }

  export type WorkOrderTaskCompletionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    templateTaskId?: NullableStringFieldUpdateOperationsInput | string | null
    isAdHoc?: BoolFieldUpdateOperationsInput | boolean
    taskName?: StringFieldUpdateOperationsInput | string
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    workOrder?: WorkOrderUpdateOneRequiredWithoutTaskCompletionsNestedInput
  }

  export type WorkOrderTaskCompletionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: StringFieldUpdateOperationsInput | string
    templateTaskId?: NullableStringFieldUpdateOperationsInput | string | null
    isAdHoc?: BoolFieldUpdateOperationsInput | boolean
    taskName?: StringFieldUpdateOperationsInput | string
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WorkOrderTaskCompletionCreateManyInput = {
    id?: string
    workOrderId: string
    templateTaskId?: string | null
    isAdHoc?: boolean
    taskName: string
    isRequired?: boolean
    isCompleted?: boolean
    photoUrl?: string | null
    notes?: string | null
    completedAt?: Date | string | null
  }

  export type WorkOrderTaskCompletionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    templateTaskId?: NullableStringFieldUpdateOperationsInput | string | null
    isAdHoc?: BoolFieldUpdateOperationsInput | boolean
    taskName?: StringFieldUpdateOperationsInput | string
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WorkOrderTaskCompletionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: StringFieldUpdateOperationsInput | string
    templateTaskId?: NullableStringFieldUpdateOperationsInput | string | null
    isAdHoc?: BoolFieldUpdateOperationsInput | boolean
    taskName?: StringFieldUpdateOperationsInput | string
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WorkOrderLineItemCreateInput = {
    id?: string
    description: string
    category?: $Enums.PriceCategory
    quantity?: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    lineTotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    workOrder: WorkOrderCreateNestedOneWithoutLineItemsInput
    priceBookItem?: PriceBookItemCreateNestedOneWithoutLineItemsInput
  }

  export type WorkOrderLineItemUncheckedCreateInput = {
    id?: string
    workOrderId: string
    priceBookItemId?: string | null
    description: string
    category?: $Enums.PriceCategory
    quantity?: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    lineTotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type WorkOrderLineItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    workOrder?: WorkOrderUpdateOneRequiredWithoutLineItemsNestedInput
    priceBookItem?: PriceBookItemUpdateOneWithoutLineItemsNestedInput
  }

  export type WorkOrderLineItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderLineItemCreateManyInput = {
    id?: string
    workOrderId: string
    priceBookItemId?: string | null
    description: string
    category?: $Enums.PriceCategory
    quantity?: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    lineTotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type WorkOrderLineItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderLineItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type JobTemplateListRelationFilter = {
    every?: JobTemplateWhereInput
    some?: JobTemplateWhereInput
    none?: JobTemplateWhereInput
  }

  export type JobCustomFieldDefListRelationFilter = {
    every?: JobCustomFieldDefWhereInput
    some?: JobCustomFieldDefWhereInput
    none?: JobCustomFieldDefWhereInput
  }

  export type JobListRelationFilter = {
    every?: JobWhereInput
    some?: JobWhereInput
    none?: JobWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type JobTemplateOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type JobCustomFieldDefOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type JobOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type JobTypeCompanyIdSlugCompoundUniqueInput = {
    companyId: string
    slug: string
  }

  export type JobTypeCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    color?: SortOrder
    isActive?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobTypeAvgOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type JobTypeMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    color?: SortOrder
    isActive?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobTypeMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    color?: SortOrder
    isActive?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobTypeSumOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type JobTypeRelationFilter = {
    is?: JobTypeWhereInput
    isNot?: JobTypeWhereInput
  }

  export type JobTemplateTaskListRelationFilter = {
    every?: JobTemplateTaskWhereInput
    some?: JobTemplateTaskWhereInput
    none?: JobTemplateTaskWhereInput
  }

  export type JobTemplateTaskOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type JobTemplateCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    estimatedDurationMins?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    requiredParts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobTemplateAvgOrderByAggregateInput = {
    estimatedDurationMins?: SortOrder
    version?: SortOrder
  }

  export type JobTemplateMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    estimatedDurationMins?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobTemplateMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    estimatedDurationMins?: SortOrder
    version?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobTemplateSumOrderByAggregateInput = {
    estimatedDurationMins?: SortOrder
    version?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type JobTemplateRelationFilter = {
    is?: JobTemplateWhereInput
    isNot?: JobTemplateWhereInput
  }

  export type JobTemplateTaskCountOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    taskName?: SortOrder
    description?: SortOrder
    taskOrder?: SortOrder
    isRequired?: SortOrder
    photoRequired?: SortOrder
    safetyNote?: SortOrder
    estimatedMins?: SortOrder
    createdAt?: SortOrder
  }

  export type JobTemplateTaskAvgOrderByAggregateInput = {
    taskOrder?: SortOrder
    estimatedMins?: SortOrder
  }

  export type JobTemplateTaskMaxOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    taskName?: SortOrder
    description?: SortOrder
    taskOrder?: SortOrder
    isRequired?: SortOrder
    photoRequired?: SortOrder
    safetyNote?: SortOrder
    estimatedMins?: SortOrder
    createdAt?: SortOrder
  }

  export type JobTemplateTaskMinOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    taskName?: SortOrder
    description?: SortOrder
    taskOrder?: SortOrder
    isRequired?: SortOrder
    photoRequired?: SortOrder
    safetyNote?: SortOrder
    estimatedMins?: SortOrder
    createdAt?: SortOrder
  }

  export type JobTemplateTaskSumOrderByAggregateInput = {
    taskOrder?: SortOrder
    estimatedMins?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumCustomFieldTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CustomFieldType | EnumCustomFieldTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CustomFieldType[] | ListEnumCustomFieldTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CustomFieldType[] | ListEnumCustomFieldTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCustomFieldTypeFilter<$PrismaModel> | $Enums.CustomFieldType
  }

  export type JobCustomFieldValueListRelationFilter = {
    every?: JobCustomFieldValueWhereInput
    some?: JobCustomFieldValueWhereInput
    none?: JobCustomFieldValueWhereInput
  }

  export type JobCustomFieldValueOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type JobCustomFieldDefJobTypeIdFieldKeyCompoundUniqueInput = {
    jobTypeId: string
    fieldKey: string
  }

  export type JobCustomFieldDefCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    fieldKey?: SortOrder
    label?: SortOrder
    fieldType?: SortOrder
    options?: SortOrder
    isRequired?: SortOrder
    helpText?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
  }

  export type JobCustomFieldDefAvgOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type JobCustomFieldDefMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    fieldKey?: SortOrder
    label?: SortOrder
    fieldType?: SortOrder
    isRequired?: SortOrder
    helpText?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
  }

  export type JobCustomFieldDefMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobTypeId?: SortOrder
    fieldKey?: SortOrder
    label?: SortOrder
    fieldType?: SortOrder
    isRequired?: SortOrder
    helpText?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
  }

  export type JobCustomFieldDefSumOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type EnumCustomFieldTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CustomFieldType | EnumCustomFieldTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CustomFieldType[] | ListEnumCustomFieldTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CustomFieldType[] | ListEnumCustomFieldTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCustomFieldTypeWithAggregatesFilter<$PrismaModel> | $Enums.CustomFieldType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCustomFieldTypeFilter<$PrismaModel>
    _max?: NestedEnumCustomFieldTypeFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type JobRelationFilter = {
    is?: JobWhereInput
    isNot?: JobWhereInput
  }

  export type JobCustomFieldDefRelationFilter = {
    is?: JobCustomFieldDefWhereInput
    isNot?: JobCustomFieldDefWhereInput
  }

  export type JobCustomFieldValueJobIdFieldDefIdCompoundUniqueInput = {
    jobId: string
    fieldDefId: string
  }

  export type JobCustomFieldValueCountOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    fieldDefId?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobCustomFieldValueMaxOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    fieldDefId?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobCustomFieldValueMinOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    fieldDefId?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type EnumPriceCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceCategory | EnumPriceCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PriceCategory[] | ListEnumPriceCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceCategory[] | ListEnumPriceCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceCategoryFilter<$PrismaModel> | $Enums.PriceCategory
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type WorkOrderLineItemListRelationFilter = {
    every?: WorkOrderLineItemWhereInput
    some?: WorkOrderLineItemWhereInput
    none?: WorkOrderLineItemWhereInput
  }

  export type WorkOrderLineItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PriceBookItemCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    category?: SortOrder
    code?: SortOrder
    name?: SortOrder
    description?: SortOrder
    unit?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    isActive?: SortOrder
    jobTypeId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PriceBookItemAvgOrderByAggregateInput = {
    unitPrice?: SortOrder
  }

  export type PriceBookItemMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    category?: SortOrder
    code?: SortOrder
    name?: SortOrder
    description?: SortOrder
    unit?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    isActive?: SortOrder
    jobTypeId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PriceBookItemMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    category?: SortOrder
    code?: SortOrder
    name?: SortOrder
    description?: SortOrder
    unit?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    isActive?: SortOrder
    jobTypeId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PriceBookItemSumOrderByAggregateInput = {
    unitPrice?: SortOrder
  }

  export type EnumPriceCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceCategory | EnumPriceCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PriceCategory[] | ListEnumPriceCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceCategory[] | ListEnumPriceCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceCategoryWithAggregatesFilter<$PrismaModel> | $Enums.PriceCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPriceCategoryFilter<$PrismaModel>
    _max?: NestedEnumPriceCategoryFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type EnumJobStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusFilter<$PrismaModel> | $Enums.JobStatus
  }

  export type EnumJobPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.JobPriority | EnumJobPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.JobPriority[] | ListEnumJobPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobPriority[] | ListEnumJobPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumJobPriorityFilter<$PrismaModel> | $Enums.JobPriority
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type JobTypeNullableRelationFilter = {
    is?: JobTypeWhereInput | null
    isNot?: JobTypeWhereInput | null
  }

  export type JobTemplateNullableRelationFilter = {
    is?: JobTemplateWhereInput | null
    isNot?: JobTemplateWhereInput | null
  }

  export type WorkOrderListRelationFilter = {
    every?: WorkOrderWhereInput
    some?: WorkOrderWhereInput
    none?: WorkOrderWhereInput
  }

  export type JobStatusHistoryListRelationFilter = {
    every?: JobStatusHistoryWhereInput
    some?: JobStatusHistoryWhereInput
    none?: JobStatusHistoryWhereInput
  }

  export type JobPhotoListRelationFilter = {
    every?: JobPhotoWhereInput
    some?: JobPhotoWhereInput
    none?: JobPhotoWhereInput
  }

  export type WorkOrderOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type JobStatusHistoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type JobPhotoOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type JobCompanyIdJobNumberCompoundUniqueInput = {
    companyId: string
    jobNumber: string
  }

  export type JobCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobNumber?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    customerEmail?: SortOrder
    serviceAddress?: SortOrder
    serviceCity?: SortOrder
    serviceState?: SortOrder
    serviceZip?: SortOrder
    serviceLatitude?: SortOrder
    serviceLongitude?: SortOrder
    jobTypeId?: SortOrder
    templateId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    assignedToId?: SortOrder
    assignedToName?: SortOrder
    scheduledStart?: SortOrder
    scheduledEnd?: SortOrder
    actualStart?: SortOrder
    actualEnd?: SortOrder
    estimatedDurationMins?: SortOrder
    travelDistanceKm?: SortOrder
    quoteId?: SortOrder
    invoiceId?: SortOrder
    notes?: SortOrder
    internalNotes?: SortOrder
    tags?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrder
  }

  export type JobAvgOrderByAggregateInput = {
    serviceLatitude?: SortOrder
    serviceLongitude?: SortOrder
    estimatedDurationMins?: SortOrder
    travelDistanceKm?: SortOrder
  }

  export type JobMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobNumber?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    customerEmail?: SortOrder
    serviceAddress?: SortOrder
    serviceCity?: SortOrder
    serviceState?: SortOrder
    serviceZip?: SortOrder
    serviceLatitude?: SortOrder
    serviceLongitude?: SortOrder
    jobTypeId?: SortOrder
    templateId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    assignedToId?: SortOrder
    assignedToName?: SortOrder
    scheduledStart?: SortOrder
    scheduledEnd?: SortOrder
    actualStart?: SortOrder
    actualEnd?: SortOrder
    estimatedDurationMins?: SortOrder
    travelDistanceKm?: SortOrder
    quoteId?: SortOrder
    invoiceId?: SortOrder
    notes?: SortOrder
    internalNotes?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrder
  }

  export type JobMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobNumber?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    customerEmail?: SortOrder
    serviceAddress?: SortOrder
    serviceCity?: SortOrder
    serviceState?: SortOrder
    serviceZip?: SortOrder
    serviceLatitude?: SortOrder
    serviceLongitude?: SortOrder
    jobTypeId?: SortOrder
    templateId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    assignedToId?: SortOrder
    assignedToName?: SortOrder
    scheduledStart?: SortOrder
    scheduledEnd?: SortOrder
    actualStart?: SortOrder
    actualEnd?: SortOrder
    estimatedDurationMins?: SortOrder
    travelDistanceKm?: SortOrder
    quoteId?: SortOrder
    invoiceId?: SortOrder
    notes?: SortOrder
    internalNotes?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrder
  }

  export type JobSumOrderByAggregateInput = {
    serviceLatitude?: SortOrder
    serviceLongitude?: SortOrder
    estimatedDurationMins?: SortOrder
    travelDistanceKm?: SortOrder
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type EnumJobStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusWithAggregatesFilter<$PrismaModel> | $Enums.JobStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobStatusFilter<$PrismaModel>
    _max?: NestedEnumJobStatusFilter<$PrismaModel>
  }

  export type EnumJobPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobPriority | EnumJobPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.JobPriority[] | ListEnumJobPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobPriority[] | ListEnumJobPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumJobPriorityWithAggregatesFilter<$PrismaModel> | $Enums.JobPriority
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobPriorityFilter<$PrismaModel>
    _max?: NestedEnumJobPriorityFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumJobStatusNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumJobStatusNullableFilter<$PrismaModel> | $Enums.JobStatus | null
  }

  export type JobStatusHistoryCountOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    fromStatus?: SortOrder
    toStatus?: SortOrder
    changedById?: SortOrder
    changedByName?: SortOrder
    note?: SortOrder
    createdAt?: SortOrder
  }

  export type JobStatusHistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    fromStatus?: SortOrder
    toStatus?: SortOrder
    changedById?: SortOrder
    changedByName?: SortOrder
    note?: SortOrder
    createdAt?: SortOrder
  }

  export type JobStatusHistoryMinOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    fromStatus?: SortOrder
    toStatus?: SortOrder
    changedById?: SortOrder
    changedByName?: SortOrder
    note?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumJobStatusNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumJobStatusNullableWithAggregatesFilter<$PrismaModel> | $Enums.JobStatus | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumJobStatusNullableFilter<$PrismaModel>
    _max?: NestedEnumJobStatusNullableFilter<$PrismaModel>
  }

  export type EnumPhotoTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PhotoType | EnumPhotoTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PhotoType[] | ListEnumPhotoTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PhotoType[] | ListEnumPhotoTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPhotoTypeFilter<$PrismaModel> | $Enums.PhotoType
  }

  export type JobPhotoCountOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    workOrderId?: SortOrder
    s3Key?: SortOrder
    caption?: SortOrder
    photoType?: SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
  }

  export type JobPhotoMaxOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    workOrderId?: SortOrder
    s3Key?: SortOrder
    caption?: SortOrder
    photoType?: SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
  }

  export type JobPhotoMinOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    workOrderId?: SortOrder
    s3Key?: SortOrder
    caption?: SortOrder
    photoType?: SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumPhotoTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PhotoType | EnumPhotoTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PhotoType[] | ListEnumPhotoTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PhotoType[] | ListEnumPhotoTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPhotoTypeWithAggregatesFilter<$PrismaModel> | $Enums.PhotoType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPhotoTypeFilter<$PrismaModel>
    _max?: NestedEnumPhotoTypeFilter<$PrismaModel>
  }

  export type EnumWorkOrderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkOrderStatus | EnumWorkOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WorkOrderStatus[] | ListEnumWorkOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkOrderStatus[] | ListEnumWorkOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkOrderStatusFilter<$PrismaModel> | $Enums.WorkOrderStatus
  }

  export type WorkOrderTaskCompletionListRelationFilter = {
    every?: WorkOrderTaskCompletionWhereInput
    some?: WorkOrderTaskCompletionWhereInput
    none?: WorkOrderTaskCompletionWhereInput
  }

  export type WorkOrderTaskCompletionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WorkOrderCompanyIdWorkOrderNumberCompoundUniqueInput = {
    companyId: string
    workOrderNumber: string
  }

  export type WorkOrderCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrder
    workOrderNumber?: SortOrder
    technicianId?: SortOrder
    technicianName?: SortOrder
    status?: SortOrder
    scheduledStart?: SortOrder
    scheduledEnd?: SortOrder
    checkinAt?: SortOrder
    checkoutAt?: SortOrder
    signatureUrl?: SortOrder
    technicianNotes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkOrderMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrder
    workOrderNumber?: SortOrder
    technicianId?: SortOrder
    technicianName?: SortOrder
    status?: SortOrder
    scheduledStart?: SortOrder
    scheduledEnd?: SortOrder
    checkinAt?: SortOrder
    checkoutAt?: SortOrder
    signatureUrl?: SortOrder
    technicianNotes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkOrderMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrder
    workOrderNumber?: SortOrder
    technicianId?: SortOrder
    technicianName?: SortOrder
    status?: SortOrder
    scheduledStart?: SortOrder
    scheduledEnd?: SortOrder
    checkinAt?: SortOrder
    checkoutAt?: SortOrder
    signatureUrl?: SortOrder
    technicianNotes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumWorkOrderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkOrderStatus | EnumWorkOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WorkOrderStatus[] | ListEnumWorkOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkOrderStatus[] | ListEnumWorkOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkOrderStatusWithAggregatesFilter<$PrismaModel> | $Enums.WorkOrderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWorkOrderStatusFilter<$PrismaModel>
    _max?: NestedEnumWorkOrderStatusFilter<$PrismaModel>
  }

  export type WorkOrderRelationFilter = {
    is?: WorkOrderWhereInput
    isNot?: WorkOrderWhereInput
  }

  export type WorkOrderTaskCompletionCountOrderByAggregateInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    templateTaskId?: SortOrder
    isAdHoc?: SortOrder
    taskName?: SortOrder
    isRequired?: SortOrder
    isCompleted?: SortOrder
    photoUrl?: SortOrder
    notes?: SortOrder
    completedAt?: SortOrder
  }

  export type WorkOrderTaskCompletionMaxOrderByAggregateInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    templateTaskId?: SortOrder
    isAdHoc?: SortOrder
    taskName?: SortOrder
    isRequired?: SortOrder
    isCompleted?: SortOrder
    photoUrl?: SortOrder
    notes?: SortOrder
    completedAt?: SortOrder
  }

  export type WorkOrderTaskCompletionMinOrderByAggregateInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    templateTaskId?: SortOrder
    isAdHoc?: SortOrder
    taskName?: SortOrder
    isRequired?: SortOrder
    isCompleted?: SortOrder
    photoUrl?: SortOrder
    notes?: SortOrder
    completedAt?: SortOrder
  }

  export type PriceBookItemNullableRelationFilter = {
    is?: PriceBookItemWhereInput | null
    isNot?: PriceBookItemWhereInput | null
  }

  export type WorkOrderLineItemCountOrderByAggregateInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    priceBookItemId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    lineTotal?: SortOrder
    createdAt?: SortOrder
  }

  export type WorkOrderLineItemAvgOrderByAggregateInput = {
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
  }

  export type WorkOrderLineItemMaxOrderByAggregateInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    priceBookItemId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    lineTotal?: SortOrder
    createdAt?: SortOrder
  }

  export type WorkOrderLineItemMinOrderByAggregateInput = {
    id?: SortOrder
    workOrderId?: SortOrder
    priceBookItemId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    taxable?: SortOrder
    lineTotal?: SortOrder
    createdAt?: SortOrder
  }

  export type WorkOrderLineItemSumOrderByAggregateInput = {
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
  }

  export type JobTemplateCreateNestedManyWithoutJobTypeInput = {
    create?: XOR<JobTemplateCreateWithoutJobTypeInput, JobTemplateUncheckedCreateWithoutJobTypeInput> | JobTemplateCreateWithoutJobTypeInput[] | JobTemplateUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobTemplateCreateOrConnectWithoutJobTypeInput | JobTemplateCreateOrConnectWithoutJobTypeInput[]
    createMany?: JobTemplateCreateManyJobTypeInputEnvelope
    connect?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
  }

  export type JobCustomFieldDefCreateNestedManyWithoutJobTypeInput = {
    create?: XOR<JobCustomFieldDefCreateWithoutJobTypeInput, JobCustomFieldDefUncheckedCreateWithoutJobTypeInput> | JobCustomFieldDefCreateWithoutJobTypeInput[] | JobCustomFieldDefUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobCustomFieldDefCreateOrConnectWithoutJobTypeInput | JobCustomFieldDefCreateOrConnectWithoutJobTypeInput[]
    createMany?: JobCustomFieldDefCreateManyJobTypeInputEnvelope
    connect?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
  }

  export type JobCreateNestedManyWithoutJobTypeInput = {
    create?: XOR<JobCreateWithoutJobTypeInput, JobUncheckedCreateWithoutJobTypeInput> | JobCreateWithoutJobTypeInput[] | JobUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobCreateOrConnectWithoutJobTypeInput | JobCreateOrConnectWithoutJobTypeInput[]
    createMany?: JobCreateManyJobTypeInputEnvelope
    connect?: JobWhereUniqueInput | JobWhereUniqueInput[]
  }

  export type JobTemplateUncheckedCreateNestedManyWithoutJobTypeInput = {
    create?: XOR<JobTemplateCreateWithoutJobTypeInput, JobTemplateUncheckedCreateWithoutJobTypeInput> | JobTemplateCreateWithoutJobTypeInput[] | JobTemplateUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobTemplateCreateOrConnectWithoutJobTypeInput | JobTemplateCreateOrConnectWithoutJobTypeInput[]
    createMany?: JobTemplateCreateManyJobTypeInputEnvelope
    connect?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
  }

  export type JobCustomFieldDefUncheckedCreateNestedManyWithoutJobTypeInput = {
    create?: XOR<JobCustomFieldDefCreateWithoutJobTypeInput, JobCustomFieldDefUncheckedCreateWithoutJobTypeInput> | JobCustomFieldDefCreateWithoutJobTypeInput[] | JobCustomFieldDefUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobCustomFieldDefCreateOrConnectWithoutJobTypeInput | JobCustomFieldDefCreateOrConnectWithoutJobTypeInput[]
    createMany?: JobCustomFieldDefCreateManyJobTypeInputEnvelope
    connect?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
  }

  export type JobUncheckedCreateNestedManyWithoutJobTypeInput = {
    create?: XOR<JobCreateWithoutJobTypeInput, JobUncheckedCreateWithoutJobTypeInput> | JobCreateWithoutJobTypeInput[] | JobUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobCreateOrConnectWithoutJobTypeInput | JobCreateOrConnectWithoutJobTypeInput[]
    createMany?: JobCreateManyJobTypeInputEnvelope
    connect?: JobWhereUniqueInput | JobWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type JobTemplateUpdateManyWithoutJobTypeNestedInput = {
    create?: XOR<JobTemplateCreateWithoutJobTypeInput, JobTemplateUncheckedCreateWithoutJobTypeInput> | JobTemplateCreateWithoutJobTypeInput[] | JobTemplateUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobTemplateCreateOrConnectWithoutJobTypeInput | JobTemplateCreateOrConnectWithoutJobTypeInput[]
    upsert?: JobTemplateUpsertWithWhereUniqueWithoutJobTypeInput | JobTemplateUpsertWithWhereUniqueWithoutJobTypeInput[]
    createMany?: JobTemplateCreateManyJobTypeInputEnvelope
    set?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
    disconnect?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
    delete?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
    connect?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
    update?: JobTemplateUpdateWithWhereUniqueWithoutJobTypeInput | JobTemplateUpdateWithWhereUniqueWithoutJobTypeInput[]
    updateMany?: JobTemplateUpdateManyWithWhereWithoutJobTypeInput | JobTemplateUpdateManyWithWhereWithoutJobTypeInput[]
    deleteMany?: JobTemplateScalarWhereInput | JobTemplateScalarWhereInput[]
  }

  export type JobCustomFieldDefUpdateManyWithoutJobTypeNestedInput = {
    create?: XOR<JobCustomFieldDefCreateWithoutJobTypeInput, JobCustomFieldDefUncheckedCreateWithoutJobTypeInput> | JobCustomFieldDefCreateWithoutJobTypeInput[] | JobCustomFieldDefUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobCustomFieldDefCreateOrConnectWithoutJobTypeInput | JobCustomFieldDefCreateOrConnectWithoutJobTypeInput[]
    upsert?: JobCustomFieldDefUpsertWithWhereUniqueWithoutJobTypeInput | JobCustomFieldDefUpsertWithWhereUniqueWithoutJobTypeInput[]
    createMany?: JobCustomFieldDefCreateManyJobTypeInputEnvelope
    set?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
    disconnect?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
    delete?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
    connect?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
    update?: JobCustomFieldDefUpdateWithWhereUniqueWithoutJobTypeInput | JobCustomFieldDefUpdateWithWhereUniqueWithoutJobTypeInput[]
    updateMany?: JobCustomFieldDefUpdateManyWithWhereWithoutJobTypeInput | JobCustomFieldDefUpdateManyWithWhereWithoutJobTypeInput[]
    deleteMany?: JobCustomFieldDefScalarWhereInput | JobCustomFieldDefScalarWhereInput[]
  }

  export type JobUpdateManyWithoutJobTypeNestedInput = {
    create?: XOR<JobCreateWithoutJobTypeInput, JobUncheckedCreateWithoutJobTypeInput> | JobCreateWithoutJobTypeInput[] | JobUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobCreateOrConnectWithoutJobTypeInput | JobCreateOrConnectWithoutJobTypeInput[]
    upsert?: JobUpsertWithWhereUniqueWithoutJobTypeInput | JobUpsertWithWhereUniqueWithoutJobTypeInput[]
    createMany?: JobCreateManyJobTypeInputEnvelope
    set?: JobWhereUniqueInput | JobWhereUniqueInput[]
    disconnect?: JobWhereUniqueInput | JobWhereUniqueInput[]
    delete?: JobWhereUniqueInput | JobWhereUniqueInput[]
    connect?: JobWhereUniqueInput | JobWhereUniqueInput[]
    update?: JobUpdateWithWhereUniqueWithoutJobTypeInput | JobUpdateWithWhereUniqueWithoutJobTypeInput[]
    updateMany?: JobUpdateManyWithWhereWithoutJobTypeInput | JobUpdateManyWithWhereWithoutJobTypeInput[]
    deleteMany?: JobScalarWhereInput | JobScalarWhereInput[]
  }

  export type JobTemplateUncheckedUpdateManyWithoutJobTypeNestedInput = {
    create?: XOR<JobTemplateCreateWithoutJobTypeInput, JobTemplateUncheckedCreateWithoutJobTypeInput> | JobTemplateCreateWithoutJobTypeInput[] | JobTemplateUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobTemplateCreateOrConnectWithoutJobTypeInput | JobTemplateCreateOrConnectWithoutJobTypeInput[]
    upsert?: JobTemplateUpsertWithWhereUniqueWithoutJobTypeInput | JobTemplateUpsertWithWhereUniqueWithoutJobTypeInput[]
    createMany?: JobTemplateCreateManyJobTypeInputEnvelope
    set?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
    disconnect?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
    delete?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
    connect?: JobTemplateWhereUniqueInput | JobTemplateWhereUniqueInput[]
    update?: JobTemplateUpdateWithWhereUniqueWithoutJobTypeInput | JobTemplateUpdateWithWhereUniqueWithoutJobTypeInput[]
    updateMany?: JobTemplateUpdateManyWithWhereWithoutJobTypeInput | JobTemplateUpdateManyWithWhereWithoutJobTypeInput[]
    deleteMany?: JobTemplateScalarWhereInput | JobTemplateScalarWhereInput[]
  }

  export type JobCustomFieldDefUncheckedUpdateManyWithoutJobTypeNestedInput = {
    create?: XOR<JobCustomFieldDefCreateWithoutJobTypeInput, JobCustomFieldDefUncheckedCreateWithoutJobTypeInput> | JobCustomFieldDefCreateWithoutJobTypeInput[] | JobCustomFieldDefUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobCustomFieldDefCreateOrConnectWithoutJobTypeInput | JobCustomFieldDefCreateOrConnectWithoutJobTypeInput[]
    upsert?: JobCustomFieldDefUpsertWithWhereUniqueWithoutJobTypeInput | JobCustomFieldDefUpsertWithWhereUniqueWithoutJobTypeInput[]
    createMany?: JobCustomFieldDefCreateManyJobTypeInputEnvelope
    set?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
    disconnect?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
    delete?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
    connect?: JobCustomFieldDefWhereUniqueInput | JobCustomFieldDefWhereUniqueInput[]
    update?: JobCustomFieldDefUpdateWithWhereUniqueWithoutJobTypeInput | JobCustomFieldDefUpdateWithWhereUniqueWithoutJobTypeInput[]
    updateMany?: JobCustomFieldDefUpdateManyWithWhereWithoutJobTypeInput | JobCustomFieldDefUpdateManyWithWhereWithoutJobTypeInput[]
    deleteMany?: JobCustomFieldDefScalarWhereInput | JobCustomFieldDefScalarWhereInput[]
  }

  export type JobUncheckedUpdateManyWithoutJobTypeNestedInput = {
    create?: XOR<JobCreateWithoutJobTypeInput, JobUncheckedCreateWithoutJobTypeInput> | JobCreateWithoutJobTypeInput[] | JobUncheckedCreateWithoutJobTypeInput[]
    connectOrCreate?: JobCreateOrConnectWithoutJobTypeInput | JobCreateOrConnectWithoutJobTypeInput[]
    upsert?: JobUpsertWithWhereUniqueWithoutJobTypeInput | JobUpsertWithWhereUniqueWithoutJobTypeInput[]
    createMany?: JobCreateManyJobTypeInputEnvelope
    set?: JobWhereUniqueInput | JobWhereUniqueInput[]
    disconnect?: JobWhereUniqueInput | JobWhereUniqueInput[]
    delete?: JobWhereUniqueInput | JobWhereUniqueInput[]
    connect?: JobWhereUniqueInput | JobWhereUniqueInput[]
    update?: JobUpdateWithWhereUniqueWithoutJobTypeInput | JobUpdateWithWhereUniqueWithoutJobTypeInput[]
    updateMany?: JobUpdateManyWithWhereWithoutJobTypeInput | JobUpdateManyWithWhereWithoutJobTypeInput[]
    deleteMany?: JobScalarWhereInput | JobScalarWhereInput[]
  }

  export type JobTypeCreateNestedOneWithoutTemplatesInput = {
    create?: XOR<JobTypeCreateWithoutTemplatesInput, JobTypeUncheckedCreateWithoutTemplatesInput>
    connectOrCreate?: JobTypeCreateOrConnectWithoutTemplatesInput
    connect?: JobTypeWhereUniqueInput
  }

  export type JobTemplateTaskCreateNestedManyWithoutTemplateInput = {
    create?: XOR<JobTemplateTaskCreateWithoutTemplateInput, JobTemplateTaskUncheckedCreateWithoutTemplateInput> | JobTemplateTaskCreateWithoutTemplateInput[] | JobTemplateTaskUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: JobTemplateTaskCreateOrConnectWithoutTemplateInput | JobTemplateTaskCreateOrConnectWithoutTemplateInput[]
    createMany?: JobTemplateTaskCreateManyTemplateInputEnvelope
    connect?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
  }

  export type JobCreateNestedManyWithoutTemplateInput = {
    create?: XOR<JobCreateWithoutTemplateInput, JobUncheckedCreateWithoutTemplateInput> | JobCreateWithoutTemplateInput[] | JobUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: JobCreateOrConnectWithoutTemplateInput | JobCreateOrConnectWithoutTemplateInput[]
    createMany?: JobCreateManyTemplateInputEnvelope
    connect?: JobWhereUniqueInput | JobWhereUniqueInput[]
  }

  export type JobTemplateTaskUncheckedCreateNestedManyWithoutTemplateInput = {
    create?: XOR<JobTemplateTaskCreateWithoutTemplateInput, JobTemplateTaskUncheckedCreateWithoutTemplateInput> | JobTemplateTaskCreateWithoutTemplateInput[] | JobTemplateTaskUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: JobTemplateTaskCreateOrConnectWithoutTemplateInput | JobTemplateTaskCreateOrConnectWithoutTemplateInput[]
    createMany?: JobTemplateTaskCreateManyTemplateInputEnvelope
    connect?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
  }

  export type JobUncheckedCreateNestedManyWithoutTemplateInput = {
    create?: XOR<JobCreateWithoutTemplateInput, JobUncheckedCreateWithoutTemplateInput> | JobCreateWithoutTemplateInput[] | JobUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: JobCreateOrConnectWithoutTemplateInput | JobCreateOrConnectWithoutTemplateInput[]
    createMany?: JobCreateManyTemplateInputEnvelope
    connect?: JobWhereUniqueInput | JobWhereUniqueInput[]
  }

  export type JobTypeUpdateOneRequiredWithoutTemplatesNestedInput = {
    create?: XOR<JobTypeCreateWithoutTemplatesInput, JobTypeUncheckedCreateWithoutTemplatesInput>
    connectOrCreate?: JobTypeCreateOrConnectWithoutTemplatesInput
    upsert?: JobTypeUpsertWithoutTemplatesInput
    connect?: JobTypeWhereUniqueInput
    update?: XOR<XOR<JobTypeUpdateToOneWithWhereWithoutTemplatesInput, JobTypeUpdateWithoutTemplatesInput>, JobTypeUncheckedUpdateWithoutTemplatesInput>
  }

  export type JobTemplateTaskUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<JobTemplateTaskCreateWithoutTemplateInput, JobTemplateTaskUncheckedCreateWithoutTemplateInput> | JobTemplateTaskCreateWithoutTemplateInput[] | JobTemplateTaskUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: JobTemplateTaskCreateOrConnectWithoutTemplateInput | JobTemplateTaskCreateOrConnectWithoutTemplateInput[]
    upsert?: JobTemplateTaskUpsertWithWhereUniqueWithoutTemplateInput | JobTemplateTaskUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: JobTemplateTaskCreateManyTemplateInputEnvelope
    set?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
    disconnect?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
    delete?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
    connect?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
    update?: JobTemplateTaskUpdateWithWhereUniqueWithoutTemplateInput | JobTemplateTaskUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: JobTemplateTaskUpdateManyWithWhereWithoutTemplateInput | JobTemplateTaskUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: JobTemplateTaskScalarWhereInput | JobTemplateTaskScalarWhereInput[]
  }

  export type JobUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<JobCreateWithoutTemplateInput, JobUncheckedCreateWithoutTemplateInput> | JobCreateWithoutTemplateInput[] | JobUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: JobCreateOrConnectWithoutTemplateInput | JobCreateOrConnectWithoutTemplateInput[]
    upsert?: JobUpsertWithWhereUniqueWithoutTemplateInput | JobUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: JobCreateManyTemplateInputEnvelope
    set?: JobWhereUniqueInput | JobWhereUniqueInput[]
    disconnect?: JobWhereUniqueInput | JobWhereUniqueInput[]
    delete?: JobWhereUniqueInput | JobWhereUniqueInput[]
    connect?: JobWhereUniqueInput | JobWhereUniqueInput[]
    update?: JobUpdateWithWhereUniqueWithoutTemplateInput | JobUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: JobUpdateManyWithWhereWithoutTemplateInput | JobUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: JobScalarWhereInput | JobScalarWhereInput[]
  }

  export type JobTemplateTaskUncheckedUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<JobTemplateTaskCreateWithoutTemplateInput, JobTemplateTaskUncheckedCreateWithoutTemplateInput> | JobTemplateTaskCreateWithoutTemplateInput[] | JobTemplateTaskUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: JobTemplateTaskCreateOrConnectWithoutTemplateInput | JobTemplateTaskCreateOrConnectWithoutTemplateInput[]
    upsert?: JobTemplateTaskUpsertWithWhereUniqueWithoutTemplateInput | JobTemplateTaskUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: JobTemplateTaskCreateManyTemplateInputEnvelope
    set?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
    disconnect?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
    delete?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
    connect?: JobTemplateTaskWhereUniqueInput | JobTemplateTaskWhereUniqueInput[]
    update?: JobTemplateTaskUpdateWithWhereUniqueWithoutTemplateInput | JobTemplateTaskUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: JobTemplateTaskUpdateManyWithWhereWithoutTemplateInput | JobTemplateTaskUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: JobTemplateTaskScalarWhereInput | JobTemplateTaskScalarWhereInput[]
  }

  export type JobUncheckedUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<JobCreateWithoutTemplateInput, JobUncheckedCreateWithoutTemplateInput> | JobCreateWithoutTemplateInput[] | JobUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: JobCreateOrConnectWithoutTemplateInput | JobCreateOrConnectWithoutTemplateInput[]
    upsert?: JobUpsertWithWhereUniqueWithoutTemplateInput | JobUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: JobCreateManyTemplateInputEnvelope
    set?: JobWhereUniqueInput | JobWhereUniqueInput[]
    disconnect?: JobWhereUniqueInput | JobWhereUniqueInput[]
    delete?: JobWhereUniqueInput | JobWhereUniqueInput[]
    connect?: JobWhereUniqueInput | JobWhereUniqueInput[]
    update?: JobUpdateWithWhereUniqueWithoutTemplateInput | JobUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: JobUpdateManyWithWhereWithoutTemplateInput | JobUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: JobScalarWhereInput | JobScalarWhereInput[]
  }

  export type JobTemplateCreateNestedOneWithoutTasksInput = {
    create?: XOR<JobTemplateCreateWithoutTasksInput, JobTemplateUncheckedCreateWithoutTasksInput>
    connectOrCreate?: JobTemplateCreateOrConnectWithoutTasksInput
    connect?: JobTemplateWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type JobTemplateUpdateOneRequiredWithoutTasksNestedInput = {
    create?: XOR<JobTemplateCreateWithoutTasksInput, JobTemplateUncheckedCreateWithoutTasksInput>
    connectOrCreate?: JobTemplateCreateOrConnectWithoutTasksInput
    upsert?: JobTemplateUpsertWithoutTasksInput
    connect?: JobTemplateWhereUniqueInput
    update?: XOR<XOR<JobTemplateUpdateToOneWithWhereWithoutTasksInput, JobTemplateUpdateWithoutTasksInput>, JobTemplateUncheckedUpdateWithoutTasksInput>
  }

  export type JobTypeCreateNestedOneWithoutCustomFieldDefsInput = {
    create?: XOR<JobTypeCreateWithoutCustomFieldDefsInput, JobTypeUncheckedCreateWithoutCustomFieldDefsInput>
    connectOrCreate?: JobTypeCreateOrConnectWithoutCustomFieldDefsInput
    connect?: JobTypeWhereUniqueInput
  }

  export type JobCustomFieldValueCreateNestedManyWithoutFieldDefInput = {
    create?: XOR<JobCustomFieldValueCreateWithoutFieldDefInput, JobCustomFieldValueUncheckedCreateWithoutFieldDefInput> | JobCustomFieldValueCreateWithoutFieldDefInput[] | JobCustomFieldValueUncheckedCreateWithoutFieldDefInput[]
    connectOrCreate?: JobCustomFieldValueCreateOrConnectWithoutFieldDefInput | JobCustomFieldValueCreateOrConnectWithoutFieldDefInput[]
    createMany?: JobCustomFieldValueCreateManyFieldDefInputEnvelope
    connect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
  }

  export type JobCustomFieldValueUncheckedCreateNestedManyWithoutFieldDefInput = {
    create?: XOR<JobCustomFieldValueCreateWithoutFieldDefInput, JobCustomFieldValueUncheckedCreateWithoutFieldDefInput> | JobCustomFieldValueCreateWithoutFieldDefInput[] | JobCustomFieldValueUncheckedCreateWithoutFieldDefInput[]
    connectOrCreate?: JobCustomFieldValueCreateOrConnectWithoutFieldDefInput | JobCustomFieldValueCreateOrConnectWithoutFieldDefInput[]
    createMany?: JobCustomFieldValueCreateManyFieldDefInputEnvelope
    connect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
  }

  export type EnumCustomFieldTypeFieldUpdateOperationsInput = {
    set?: $Enums.CustomFieldType
  }

  export type JobTypeUpdateOneRequiredWithoutCustomFieldDefsNestedInput = {
    create?: XOR<JobTypeCreateWithoutCustomFieldDefsInput, JobTypeUncheckedCreateWithoutCustomFieldDefsInput>
    connectOrCreate?: JobTypeCreateOrConnectWithoutCustomFieldDefsInput
    upsert?: JobTypeUpsertWithoutCustomFieldDefsInput
    connect?: JobTypeWhereUniqueInput
    update?: XOR<XOR<JobTypeUpdateToOneWithWhereWithoutCustomFieldDefsInput, JobTypeUpdateWithoutCustomFieldDefsInput>, JobTypeUncheckedUpdateWithoutCustomFieldDefsInput>
  }

  export type JobCustomFieldValueUpdateManyWithoutFieldDefNestedInput = {
    create?: XOR<JobCustomFieldValueCreateWithoutFieldDefInput, JobCustomFieldValueUncheckedCreateWithoutFieldDefInput> | JobCustomFieldValueCreateWithoutFieldDefInput[] | JobCustomFieldValueUncheckedCreateWithoutFieldDefInput[]
    connectOrCreate?: JobCustomFieldValueCreateOrConnectWithoutFieldDefInput | JobCustomFieldValueCreateOrConnectWithoutFieldDefInput[]
    upsert?: JobCustomFieldValueUpsertWithWhereUniqueWithoutFieldDefInput | JobCustomFieldValueUpsertWithWhereUniqueWithoutFieldDefInput[]
    createMany?: JobCustomFieldValueCreateManyFieldDefInputEnvelope
    set?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    disconnect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    delete?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    connect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    update?: JobCustomFieldValueUpdateWithWhereUniqueWithoutFieldDefInput | JobCustomFieldValueUpdateWithWhereUniqueWithoutFieldDefInput[]
    updateMany?: JobCustomFieldValueUpdateManyWithWhereWithoutFieldDefInput | JobCustomFieldValueUpdateManyWithWhereWithoutFieldDefInput[]
    deleteMany?: JobCustomFieldValueScalarWhereInput | JobCustomFieldValueScalarWhereInput[]
  }

  export type JobCustomFieldValueUncheckedUpdateManyWithoutFieldDefNestedInput = {
    create?: XOR<JobCustomFieldValueCreateWithoutFieldDefInput, JobCustomFieldValueUncheckedCreateWithoutFieldDefInput> | JobCustomFieldValueCreateWithoutFieldDefInput[] | JobCustomFieldValueUncheckedCreateWithoutFieldDefInput[]
    connectOrCreate?: JobCustomFieldValueCreateOrConnectWithoutFieldDefInput | JobCustomFieldValueCreateOrConnectWithoutFieldDefInput[]
    upsert?: JobCustomFieldValueUpsertWithWhereUniqueWithoutFieldDefInput | JobCustomFieldValueUpsertWithWhereUniqueWithoutFieldDefInput[]
    createMany?: JobCustomFieldValueCreateManyFieldDefInputEnvelope
    set?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    disconnect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    delete?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    connect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    update?: JobCustomFieldValueUpdateWithWhereUniqueWithoutFieldDefInput | JobCustomFieldValueUpdateWithWhereUniqueWithoutFieldDefInput[]
    updateMany?: JobCustomFieldValueUpdateManyWithWhereWithoutFieldDefInput | JobCustomFieldValueUpdateManyWithWhereWithoutFieldDefInput[]
    deleteMany?: JobCustomFieldValueScalarWhereInput | JobCustomFieldValueScalarWhereInput[]
  }

  export type JobCreateNestedOneWithoutCustomFieldValuesInput = {
    create?: XOR<JobCreateWithoutCustomFieldValuesInput, JobUncheckedCreateWithoutCustomFieldValuesInput>
    connectOrCreate?: JobCreateOrConnectWithoutCustomFieldValuesInput
    connect?: JobWhereUniqueInput
  }

  export type JobCustomFieldDefCreateNestedOneWithoutValuesInput = {
    create?: XOR<JobCustomFieldDefCreateWithoutValuesInput, JobCustomFieldDefUncheckedCreateWithoutValuesInput>
    connectOrCreate?: JobCustomFieldDefCreateOrConnectWithoutValuesInput
    connect?: JobCustomFieldDefWhereUniqueInput
  }

  export type JobUpdateOneRequiredWithoutCustomFieldValuesNestedInput = {
    create?: XOR<JobCreateWithoutCustomFieldValuesInput, JobUncheckedCreateWithoutCustomFieldValuesInput>
    connectOrCreate?: JobCreateOrConnectWithoutCustomFieldValuesInput
    upsert?: JobUpsertWithoutCustomFieldValuesInput
    connect?: JobWhereUniqueInput
    update?: XOR<XOR<JobUpdateToOneWithWhereWithoutCustomFieldValuesInput, JobUpdateWithoutCustomFieldValuesInput>, JobUncheckedUpdateWithoutCustomFieldValuesInput>
  }

  export type JobCustomFieldDefUpdateOneRequiredWithoutValuesNestedInput = {
    create?: XOR<JobCustomFieldDefCreateWithoutValuesInput, JobCustomFieldDefUncheckedCreateWithoutValuesInput>
    connectOrCreate?: JobCustomFieldDefCreateOrConnectWithoutValuesInput
    upsert?: JobCustomFieldDefUpsertWithoutValuesInput
    connect?: JobCustomFieldDefWhereUniqueInput
    update?: XOR<XOR<JobCustomFieldDefUpdateToOneWithWhereWithoutValuesInput, JobCustomFieldDefUpdateWithoutValuesInput>, JobCustomFieldDefUncheckedUpdateWithoutValuesInput>
  }

  export type WorkOrderLineItemCreateNestedManyWithoutPriceBookItemInput = {
    create?: XOR<WorkOrderLineItemCreateWithoutPriceBookItemInput, WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput> | WorkOrderLineItemCreateWithoutPriceBookItemInput[] | WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput[]
    connectOrCreate?: WorkOrderLineItemCreateOrConnectWithoutPriceBookItemInput | WorkOrderLineItemCreateOrConnectWithoutPriceBookItemInput[]
    createMany?: WorkOrderLineItemCreateManyPriceBookItemInputEnvelope
    connect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
  }

  export type WorkOrderLineItemUncheckedCreateNestedManyWithoutPriceBookItemInput = {
    create?: XOR<WorkOrderLineItemCreateWithoutPriceBookItemInput, WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput> | WorkOrderLineItemCreateWithoutPriceBookItemInput[] | WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput[]
    connectOrCreate?: WorkOrderLineItemCreateOrConnectWithoutPriceBookItemInput | WorkOrderLineItemCreateOrConnectWithoutPriceBookItemInput[]
    createMany?: WorkOrderLineItemCreateManyPriceBookItemInputEnvelope
    connect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
  }

  export type EnumPriceCategoryFieldUpdateOperationsInput = {
    set?: $Enums.PriceCategory
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type WorkOrderLineItemUpdateManyWithoutPriceBookItemNestedInput = {
    create?: XOR<WorkOrderLineItemCreateWithoutPriceBookItemInput, WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput> | WorkOrderLineItemCreateWithoutPriceBookItemInput[] | WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput[]
    connectOrCreate?: WorkOrderLineItemCreateOrConnectWithoutPriceBookItemInput | WorkOrderLineItemCreateOrConnectWithoutPriceBookItemInput[]
    upsert?: WorkOrderLineItemUpsertWithWhereUniqueWithoutPriceBookItemInput | WorkOrderLineItemUpsertWithWhereUniqueWithoutPriceBookItemInput[]
    createMany?: WorkOrderLineItemCreateManyPriceBookItemInputEnvelope
    set?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    disconnect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    delete?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    connect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    update?: WorkOrderLineItemUpdateWithWhereUniqueWithoutPriceBookItemInput | WorkOrderLineItemUpdateWithWhereUniqueWithoutPriceBookItemInput[]
    updateMany?: WorkOrderLineItemUpdateManyWithWhereWithoutPriceBookItemInput | WorkOrderLineItemUpdateManyWithWhereWithoutPriceBookItemInput[]
    deleteMany?: WorkOrderLineItemScalarWhereInput | WorkOrderLineItemScalarWhereInput[]
  }

  export type WorkOrderLineItemUncheckedUpdateManyWithoutPriceBookItemNestedInput = {
    create?: XOR<WorkOrderLineItemCreateWithoutPriceBookItemInput, WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput> | WorkOrderLineItemCreateWithoutPriceBookItemInput[] | WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput[]
    connectOrCreate?: WorkOrderLineItemCreateOrConnectWithoutPriceBookItemInput | WorkOrderLineItemCreateOrConnectWithoutPriceBookItemInput[]
    upsert?: WorkOrderLineItemUpsertWithWhereUniqueWithoutPriceBookItemInput | WorkOrderLineItemUpsertWithWhereUniqueWithoutPriceBookItemInput[]
    createMany?: WorkOrderLineItemCreateManyPriceBookItemInputEnvelope
    set?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    disconnect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    delete?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    connect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    update?: WorkOrderLineItemUpdateWithWhereUniqueWithoutPriceBookItemInput | WorkOrderLineItemUpdateWithWhereUniqueWithoutPriceBookItemInput[]
    updateMany?: WorkOrderLineItemUpdateManyWithWhereWithoutPriceBookItemInput | WorkOrderLineItemUpdateManyWithWhereWithoutPriceBookItemInput[]
    deleteMany?: WorkOrderLineItemScalarWhereInput | WorkOrderLineItemScalarWhereInput[]
  }

  export type JobCreatetagsInput = {
    set: string[]
  }

  export type JobTypeCreateNestedOneWithoutJobsInput = {
    create?: XOR<JobTypeCreateWithoutJobsInput, JobTypeUncheckedCreateWithoutJobsInput>
    connectOrCreate?: JobTypeCreateOrConnectWithoutJobsInput
    connect?: JobTypeWhereUniqueInput
  }

  export type JobTemplateCreateNestedOneWithoutJobsInput = {
    create?: XOR<JobTemplateCreateWithoutJobsInput, JobTemplateUncheckedCreateWithoutJobsInput>
    connectOrCreate?: JobTemplateCreateOrConnectWithoutJobsInput
    connect?: JobTemplateWhereUniqueInput
  }

  export type WorkOrderCreateNestedManyWithoutJobInput = {
    create?: XOR<WorkOrderCreateWithoutJobInput, WorkOrderUncheckedCreateWithoutJobInput> | WorkOrderCreateWithoutJobInput[] | WorkOrderUncheckedCreateWithoutJobInput[]
    connectOrCreate?: WorkOrderCreateOrConnectWithoutJobInput | WorkOrderCreateOrConnectWithoutJobInput[]
    createMany?: WorkOrderCreateManyJobInputEnvelope
    connect?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
  }

  export type JobCustomFieldValueCreateNestedManyWithoutJobInput = {
    create?: XOR<JobCustomFieldValueCreateWithoutJobInput, JobCustomFieldValueUncheckedCreateWithoutJobInput> | JobCustomFieldValueCreateWithoutJobInput[] | JobCustomFieldValueUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobCustomFieldValueCreateOrConnectWithoutJobInput | JobCustomFieldValueCreateOrConnectWithoutJobInput[]
    createMany?: JobCustomFieldValueCreateManyJobInputEnvelope
    connect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
  }

  export type JobStatusHistoryCreateNestedManyWithoutJobInput = {
    create?: XOR<JobStatusHistoryCreateWithoutJobInput, JobStatusHistoryUncheckedCreateWithoutJobInput> | JobStatusHistoryCreateWithoutJobInput[] | JobStatusHistoryUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobStatusHistoryCreateOrConnectWithoutJobInput | JobStatusHistoryCreateOrConnectWithoutJobInput[]
    createMany?: JobStatusHistoryCreateManyJobInputEnvelope
    connect?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
  }

  export type JobPhotoCreateNestedManyWithoutJobInput = {
    create?: XOR<JobPhotoCreateWithoutJobInput, JobPhotoUncheckedCreateWithoutJobInput> | JobPhotoCreateWithoutJobInput[] | JobPhotoUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobPhotoCreateOrConnectWithoutJobInput | JobPhotoCreateOrConnectWithoutJobInput[]
    createMany?: JobPhotoCreateManyJobInputEnvelope
    connect?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
  }

  export type WorkOrderUncheckedCreateNestedManyWithoutJobInput = {
    create?: XOR<WorkOrderCreateWithoutJobInput, WorkOrderUncheckedCreateWithoutJobInput> | WorkOrderCreateWithoutJobInput[] | WorkOrderUncheckedCreateWithoutJobInput[]
    connectOrCreate?: WorkOrderCreateOrConnectWithoutJobInput | WorkOrderCreateOrConnectWithoutJobInput[]
    createMany?: WorkOrderCreateManyJobInputEnvelope
    connect?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
  }

  export type JobCustomFieldValueUncheckedCreateNestedManyWithoutJobInput = {
    create?: XOR<JobCustomFieldValueCreateWithoutJobInput, JobCustomFieldValueUncheckedCreateWithoutJobInput> | JobCustomFieldValueCreateWithoutJobInput[] | JobCustomFieldValueUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobCustomFieldValueCreateOrConnectWithoutJobInput | JobCustomFieldValueCreateOrConnectWithoutJobInput[]
    createMany?: JobCustomFieldValueCreateManyJobInputEnvelope
    connect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
  }

  export type JobStatusHistoryUncheckedCreateNestedManyWithoutJobInput = {
    create?: XOR<JobStatusHistoryCreateWithoutJobInput, JobStatusHistoryUncheckedCreateWithoutJobInput> | JobStatusHistoryCreateWithoutJobInput[] | JobStatusHistoryUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobStatusHistoryCreateOrConnectWithoutJobInput | JobStatusHistoryCreateOrConnectWithoutJobInput[]
    createMany?: JobStatusHistoryCreateManyJobInputEnvelope
    connect?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
  }

  export type JobPhotoUncheckedCreateNestedManyWithoutJobInput = {
    create?: XOR<JobPhotoCreateWithoutJobInput, JobPhotoUncheckedCreateWithoutJobInput> | JobPhotoCreateWithoutJobInput[] | JobPhotoUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobPhotoCreateOrConnectWithoutJobInput | JobPhotoCreateOrConnectWithoutJobInput[]
    createMany?: JobPhotoCreateManyJobInputEnvelope
    connect?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type EnumJobStatusFieldUpdateOperationsInput = {
    set?: $Enums.JobStatus
  }

  export type EnumJobPriorityFieldUpdateOperationsInput = {
    set?: $Enums.JobPriority
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type JobUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type JobTypeUpdateOneWithoutJobsNestedInput = {
    create?: XOR<JobTypeCreateWithoutJobsInput, JobTypeUncheckedCreateWithoutJobsInput>
    connectOrCreate?: JobTypeCreateOrConnectWithoutJobsInput
    upsert?: JobTypeUpsertWithoutJobsInput
    disconnect?: JobTypeWhereInput | boolean
    delete?: JobTypeWhereInput | boolean
    connect?: JobTypeWhereUniqueInput
    update?: XOR<XOR<JobTypeUpdateToOneWithWhereWithoutJobsInput, JobTypeUpdateWithoutJobsInput>, JobTypeUncheckedUpdateWithoutJobsInput>
  }

  export type JobTemplateUpdateOneWithoutJobsNestedInput = {
    create?: XOR<JobTemplateCreateWithoutJobsInput, JobTemplateUncheckedCreateWithoutJobsInput>
    connectOrCreate?: JobTemplateCreateOrConnectWithoutJobsInput
    upsert?: JobTemplateUpsertWithoutJobsInput
    disconnect?: JobTemplateWhereInput | boolean
    delete?: JobTemplateWhereInput | boolean
    connect?: JobTemplateWhereUniqueInput
    update?: XOR<XOR<JobTemplateUpdateToOneWithWhereWithoutJobsInput, JobTemplateUpdateWithoutJobsInput>, JobTemplateUncheckedUpdateWithoutJobsInput>
  }

  export type WorkOrderUpdateManyWithoutJobNestedInput = {
    create?: XOR<WorkOrderCreateWithoutJobInput, WorkOrderUncheckedCreateWithoutJobInput> | WorkOrderCreateWithoutJobInput[] | WorkOrderUncheckedCreateWithoutJobInput[]
    connectOrCreate?: WorkOrderCreateOrConnectWithoutJobInput | WorkOrderCreateOrConnectWithoutJobInput[]
    upsert?: WorkOrderUpsertWithWhereUniqueWithoutJobInput | WorkOrderUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: WorkOrderCreateManyJobInputEnvelope
    set?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
    disconnect?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
    delete?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
    connect?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
    update?: WorkOrderUpdateWithWhereUniqueWithoutJobInput | WorkOrderUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: WorkOrderUpdateManyWithWhereWithoutJobInput | WorkOrderUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: WorkOrderScalarWhereInput | WorkOrderScalarWhereInput[]
  }

  export type JobCustomFieldValueUpdateManyWithoutJobNestedInput = {
    create?: XOR<JobCustomFieldValueCreateWithoutJobInput, JobCustomFieldValueUncheckedCreateWithoutJobInput> | JobCustomFieldValueCreateWithoutJobInput[] | JobCustomFieldValueUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobCustomFieldValueCreateOrConnectWithoutJobInput | JobCustomFieldValueCreateOrConnectWithoutJobInput[]
    upsert?: JobCustomFieldValueUpsertWithWhereUniqueWithoutJobInput | JobCustomFieldValueUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: JobCustomFieldValueCreateManyJobInputEnvelope
    set?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    disconnect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    delete?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    connect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    update?: JobCustomFieldValueUpdateWithWhereUniqueWithoutJobInput | JobCustomFieldValueUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: JobCustomFieldValueUpdateManyWithWhereWithoutJobInput | JobCustomFieldValueUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: JobCustomFieldValueScalarWhereInput | JobCustomFieldValueScalarWhereInput[]
  }

  export type JobStatusHistoryUpdateManyWithoutJobNestedInput = {
    create?: XOR<JobStatusHistoryCreateWithoutJobInput, JobStatusHistoryUncheckedCreateWithoutJobInput> | JobStatusHistoryCreateWithoutJobInput[] | JobStatusHistoryUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobStatusHistoryCreateOrConnectWithoutJobInput | JobStatusHistoryCreateOrConnectWithoutJobInput[]
    upsert?: JobStatusHistoryUpsertWithWhereUniqueWithoutJobInput | JobStatusHistoryUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: JobStatusHistoryCreateManyJobInputEnvelope
    set?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
    disconnect?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
    delete?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
    connect?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
    update?: JobStatusHistoryUpdateWithWhereUniqueWithoutJobInput | JobStatusHistoryUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: JobStatusHistoryUpdateManyWithWhereWithoutJobInput | JobStatusHistoryUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: JobStatusHistoryScalarWhereInput | JobStatusHistoryScalarWhereInput[]
  }

  export type JobPhotoUpdateManyWithoutJobNestedInput = {
    create?: XOR<JobPhotoCreateWithoutJobInput, JobPhotoUncheckedCreateWithoutJobInput> | JobPhotoCreateWithoutJobInput[] | JobPhotoUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobPhotoCreateOrConnectWithoutJobInput | JobPhotoCreateOrConnectWithoutJobInput[]
    upsert?: JobPhotoUpsertWithWhereUniqueWithoutJobInput | JobPhotoUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: JobPhotoCreateManyJobInputEnvelope
    set?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
    disconnect?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
    delete?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
    connect?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
    update?: JobPhotoUpdateWithWhereUniqueWithoutJobInput | JobPhotoUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: JobPhotoUpdateManyWithWhereWithoutJobInput | JobPhotoUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: JobPhotoScalarWhereInput | JobPhotoScalarWhereInput[]
  }

  export type WorkOrderUncheckedUpdateManyWithoutJobNestedInput = {
    create?: XOR<WorkOrderCreateWithoutJobInput, WorkOrderUncheckedCreateWithoutJobInput> | WorkOrderCreateWithoutJobInput[] | WorkOrderUncheckedCreateWithoutJobInput[]
    connectOrCreate?: WorkOrderCreateOrConnectWithoutJobInput | WorkOrderCreateOrConnectWithoutJobInput[]
    upsert?: WorkOrderUpsertWithWhereUniqueWithoutJobInput | WorkOrderUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: WorkOrderCreateManyJobInputEnvelope
    set?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
    disconnect?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
    delete?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
    connect?: WorkOrderWhereUniqueInput | WorkOrderWhereUniqueInput[]
    update?: WorkOrderUpdateWithWhereUniqueWithoutJobInput | WorkOrderUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: WorkOrderUpdateManyWithWhereWithoutJobInput | WorkOrderUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: WorkOrderScalarWhereInput | WorkOrderScalarWhereInput[]
  }

  export type JobCustomFieldValueUncheckedUpdateManyWithoutJobNestedInput = {
    create?: XOR<JobCustomFieldValueCreateWithoutJobInput, JobCustomFieldValueUncheckedCreateWithoutJobInput> | JobCustomFieldValueCreateWithoutJobInput[] | JobCustomFieldValueUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobCustomFieldValueCreateOrConnectWithoutJobInput | JobCustomFieldValueCreateOrConnectWithoutJobInput[]
    upsert?: JobCustomFieldValueUpsertWithWhereUniqueWithoutJobInput | JobCustomFieldValueUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: JobCustomFieldValueCreateManyJobInputEnvelope
    set?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    disconnect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    delete?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    connect?: JobCustomFieldValueWhereUniqueInput | JobCustomFieldValueWhereUniqueInput[]
    update?: JobCustomFieldValueUpdateWithWhereUniqueWithoutJobInput | JobCustomFieldValueUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: JobCustomFieldValueUpdateManyWithWhereWithoutJobInput | JobCustomFieldValueUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: JobCustomFieldValueScalarWhereInput | JobCustomFieldValueScalarWhereInput[]
  }

  export type JobStatusHistoryUncheckedUpdateManyWithoutJobNestedInput = {
    create?: XOR<JobStatusHistoryCreateWithoutJobInput, JobStatusHistoryUncheckedCreateWithoutJobInput> | JobStatusHistoryCreateWithoutJobInput[] | JobStatusHistoryUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobStatusHistoryCreateOrConnectWithoutJobInput | JobStatusHistoryCreateOrConnectWithoutJobInput[]
    upsert?: JobStatusHistoryUpsertWithWhereUniqueWithoutJobInput | JobStatusHistoryUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: JobStatusHistoryCreateManyJobInputEnvelope
    set?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
    disconnect?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
    delete?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
    connect?: JobStatusHistoryWhereUniqueInput | JobStatusHistoryWhereUniqueInput[]
    update?: JobStatusHistoryUpdateWithWhereUniqueWithoutJobInput | JobStatusHistoryUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: JobStatusHistoryUpdateManyWithWhereWithoutJobInput | JobStatusHistoryUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: JobStatusHistoryScalarWhereInput | JobStatusHistoryScalarWhereInput[]
  }

  export type JobPhotoUncheckedUpdateManyWithoutJobNestedInput = {
    create?: XOR<JobPhotoCreateWithoutJobInput, JobPhotoUncheckedCreateWithoutJobInput> | JobPhotoCreateWithoutJobInput[] | JobPhotoUncheckedCreateWithoutJobInput[]
    connectOrCreate?: JobPhotoCreateOrConnectWithoutJobInput | JobPhotoCreateOrConnectWithoutJobInput[]
    upsert?: JobPhotoUpsertWithWhereUniqueWithoutJobInput | JobPhotoUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: JobPhotoCreateManyJobInputEnvelope
    set?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
    disconnect?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
    delete?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
    connect?: JobPhotoWhereUniqueInput | JobPhotoWhereUniqueInput[]
    update?: JobPhotoUpdateWithWhereUniqueWithoutJobInput | JobPhotoUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: JobPhotoUpdateManyWithWhereWithoutJobInput | JobPhotoUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: JobPhotoScalarWhereInput | JobPhotoScalarWhereInput[]
  }

  export type JobCreateNestedOneWithoutStatusHistoryInput = {
    create?: XOR<JobCreateWithoutStatusHistoryInput, JobUncheckedCreateWithoutStatusHistoryInput>
    connectOrCreate?: JobCreateOrConnectWithoutStatusHistoryInput
    connect?: JobWhereUniqueInput
  }

  export type NullableEnumJobStatusFieldUpdateOperationsInput = {
    set?: $Enums.JobStatus | null
  }

  export type JobUpdateOneRequiredWithoutStatusHistoryNestedInput = {
    create?: XOR<JobCreateWithoutStatusHistoryInput, JobUncheckedCreateWithoutStatusHistoryInput>
    connectOrCreate?: JobCreateOrConnectWithoutStatusHistoryInput
    upsert?: JobUpsertWithoutStatusHistoryInput
    connect?: JobWhereUniqueInput
    update?: XOR<XOR<JobUpdateToOneWithWhereWithoutStatusHistoryInput, JobUpdateWithoutStatusHistoryInput>, JobUncheckedUpdateWithoutStatusHistoryInput>
  }

  export type JobCreateNestedOneWithoutPhotosInput = {
    create?: XOR<JobCreateWithoutPhotosInput, JobUncheckedCreateWithoutPhotosInput>
    connectOrCreate?: JobCreateOrConnectWithoutPhotosInput
    connect?: JobWhereUniqueInput
  }

  export type EnumPhotoTypeFieldUpdateOperationsInput = {
    set?: $Enums.PhotoType
  }

  export type JobUpdateOneRequiredWithoutPhotosNestedInput = {
    create?: XOR<JobCreateWithoutPhotosInput, JobUncheckedCreateWithoutPhotosInput>
    connectOrCreate?: JobCreateOrConnectWithoutPhotosInput
    upsert?: JobUpsertWithoutPhotosInput
    connect?: JobWhereUniqueInput
    update?: XOR<XOR<JobUpdateToOneWithWhereWithoutPhotosInput, JobUpdateWithoutPhotosInput>, JobUncheckedUpdateWithoutPhotosInput>
  }

  export type JobCreateNestedOneWithoutWorkOrdersInput = {
    create?: XOR<JobCreateWithoutWorkOrdersInput, JobUncheckedCreateWithoutWorkOrdersInput>
    connectOrCreate?: JobCreateOrConnectWithoutWorkOrdersInput
    connect?: JobWhereUniqueInput
  }

  export type WorkOrderLineItemCreateNestedManyWithoutWorkOrderInput = {
    create?: XOR<WorkOrderLineItemCreateWithoutWorkOrderInput, WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput> | WorkOrderLineItemCreateWithoutWorkOrderInput[] | WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput[]
    connectOrCreate?: WorkOrderLineItemCreateOrConnectWithoutWorkOrderInput | WorkOrderLineItemCreateOrConnectWithoutWorkOrderInput[]
    createMany?: WorkOrderLineItemCreateManyWorkOrderInputEnvelope
    connect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
  }

  export type WorkOrderTaskCompletionCreateNestedManyWithoutWorkOrderInput = {
    create?: XOR<WorkOrderTaskCompletionCreateWithoutWorkOrderInput, WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput> | WorkOrderTaskCompletionCreateWithoutWorkOrderInput[] | WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput[]
    connectOrCreate?: WorkOrderTaskCompletionCreateOrConnectWithoutWorkOrderInput | WorkOrderTaskCompletionCreateOrConnectWithoutWorkOrderInput[]
    createMany?: WorkOrderTaskCompletionCreateManyWorkOrderInputEnvelope
    connect?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
  }

  export type WorkOrderLineItemUncheckedCreateNestedManyWithoutWorkOrderInput = {
    create?: XOR<WorkOrderLineItemCreateWithoutWorkOrderInput, WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput> | WorkOrderLineItemCreateWithoutWorkOrderInput[] | WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput[]
    connectOrCreate?: WorkOrderLineItemCreateOrConnectWithoutWorkOrderInput | WorkOrderLineItemCreateOrConnectWithoutWorkOrderInput[]
    createMany?: WorkOrderLineItemCreateManyWorkOrderInputEnvelope
    connect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
  }

  export type WorkOrderTaskCompletionUncheckedCreateNestedManyWithoutWorkOrderInput = {
    create?: XOR<WorkOrderTaskCompletionCreateWithoutWorkOrderInput, WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput> | WorkOrderTaskCompletionCreateWithoutWorkOrderInput[] | WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput[]
    connectOrCreate?: WorkOrderTaskCompletionCreateOrConnectWithoutWorkOrderInput | WorkOrderTaskCompletionCreateOrConnectWithoutWorkOrderInput[]
    createMany?: WorkOrderTaskCompletionCreateManyWorkOrderInputEnvelope
    connect?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
  }

  export type EnumWorkOrderStatusFieldUpdateOperationsInput = {
    set?: $Enums.WorkOrderStatus
  }

  export type JobUpdateOneRequiredWithoutWorkOrdersNestedInput = {
    create?: XOR<JobCreateWithoutWorkOrdersInput, JobUncheckedCreateWithoutWorkOrdersInput>
    connectOrCreate?: JobCreateOrConnectWithoutWorkOrdersInput
    upsert?: JobUpsertWithoutWorkOrdersInput
    connect?: JobWhereUniqueInput
    update?: XOR<XOR<JobUpdateToOneWithWhereWithoutWorkOrdersInput, JobUpdateWithoutWorkOrdersInput>, JobUncheckedUpdateWithoutWorkOrdersInput>
  }

  export type WorkOrderLineItemUpdateManyWithoutWorkOrderNestedInput = {
    create?: XOR<WorkOrderLineItemCreateWithoutWorkOrderInput, WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput> | WorkOrderLineItemCreateWithoutWorkOrderInput[] | WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput[]
    connectOrCreate?: WorkOrderLineItemCreateOrConnectWithoutWorkOrderInput | WorkOrderLineItemCreateOrConnectWithoutWorkOrderInput[]
    upsert?: WorkOrderLineItemUpsertWithWhereUniqueWithoutWorkOrderInput | WorkOrderLineItemUpsertWithWhereUniqueWithoutWorkOrderInput[]
    createMany?: WorkOrderLineItemCreateManyWorkOrderInputEnvelope
    set?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    disconnect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    delete?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    connect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    update?: WorkOrderLineItemUpdateWithWhereUniqueWithoutWorkOrderInput | WorkOrderLineItemUpdateWithWhereUniqueWithoutWorkOrderInput[]
    updateMany?: WorkOrderLineItemUpdateManyWithWhereWithoutWorkOrderInput | WorkOrderLineItemUpdateManyWithWhereWithoutWorkOrderInput[]
    deleteMany?: WorkOrderLineItemScalarWhereInput | WorkOrderLineItemScalarWhereInput[]
  }

  export type WorkOrderTaskCompletionUpdateManyWithoutWorkOrderNestedInput = {
    create?: XOR<WorkOrderTaskCompletionCreateWithoutWorkOrderInput, WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput> | WorkOrderTaskCompletionCreateWithoutWorkOrderInput[] | WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput[]
    connectOrCreate?: WorkOrderTaskCompletionCreateOrConnectWithoutWorkOrderInput | WorkOrderTaskCompletionCreateOrConnectWithoutWorkOrderInput[]
    upsert?: WorkOrderTaskCompletionUpsertWithWhereUniqueWithoutWorkOrderInput | WorkOrderTaskCompletionUpsertWithWhereUniqueWithoutWorkOrderInput[]
    createMany?: WorkOrderTaskCompletionCreateManyWorkOrderInputEnvelope
    set?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
    disconnect?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
    delete?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
    connect?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
    update?: WorkOrderTaskCompletionUpdateWithWhereUniqueWithoutWorkOrderInput | WorkOrderTaskCompletionUpdateWithWhereUniqueWithoutWorkOrderInput[]
    updateMany?: WorkOrderTaskCompletionUpdateManyWithWhereWithoutWorkOrderInput | WorkOrderTaskCompletionUpdateManyWithWhereWithoutWorkOrderInput[]
    deleteMany?: WorkOrderTaskCompletionScalarWhereInput | WorkOrderTaskCompletionScalarWhereInput[]
  }

  export type WorkOrderLineItemUncheckedUpdateManyWithoutWorkOrderNestedInput = {
    create?: XOR<WorkOrderLineItemCreateWithoutWorkOrderInput, WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput> | WorkOrderLineItemCreateWithoutWorkOrderInput[] | WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput[]
    connectOrCreate?: WorkOrderLineItemCreateOrConnectWithoutWorkOrderInput | WorkOrderLineItemCreateOrConnectWithoutWorkOrderInput[]
    upsert?: WorkOrderLineItemUpsertWithWhereUniqueWithoutWorkOrderInput | WorkOrderLineItemUpsertWithWhereUniqueWithoutWorkOrderInput[]
    createMany?: WorkOrderLineItemCreateManyWorkOrderInputEnvelope
    set?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    disconnect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    delete?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    connect?: WorkOrderLineItemWhereUniqueInput | WorkOrderLineItemWhereUniqueInput[]
    update?: WorkOrderLineItemUpdateWithWhereUniqueWithoutWorkOrderInput | WorkOrderLineItemUpdateWithWhereUniqueWithoutWorkOrderInput[]
    updateMany?: WorkOrderLineItemUpdateManyWithWhereWithoutWorkOrderInput | WorkOrderLineItemUpdateManyWithWhereWithoutWorkOrderInput[]
    deleteMany?: WorkOrderLineItemScalarWhereInput | WorkOrderLineItemScalarWhereInput[]
  }

  export type WorkOrderTaskCompletionUncheckedUpdateManyWithoutWorkOrderNestedInput = {
    create?: XOR<WorkOrderTaskCompletionCreateWithoutWorkOrderInput, WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput> | WorkOrderTaskCompletionCreateWithoutWorkOrderInput[] | WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput[]
    connectOrCreate?: WorkOrderTaskCompletionCreateOrConnectWithoutWorkOrderInput | WorkOrderTaskCompletionCreateOrConnectWithoutWorkOrderInput[]
    upsert?: WorkOrderTaskCompletionUpsertWithWhereUniqueWithoutWorkOrderInput | WorkOrderTaskCompletionUpsertWithWhereUniqueWithoutWorkOrderInput[]
    createMany?: WorkOrderTaskCompletionCreateManyWorkOrderInputEnvelope
    set?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
    disconnect?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
    delete?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
    connect?: WorkOrderTaskCompletionWhereUniqueInput | WorkOrderTaskCompletionWhereUniqueInput[]
    update?: WorkOrderTaskCompletionUpdateWithWhereUniqueWithoutWorkOrderInput | WorkOrderTaskCompletionUpdateWithWhereUniqueWithoutWorkOrderInput[]
    updateMany?: WorkOrderTaskCompletionUpdateManyWithWhereWithoutWorkOrderInput | WorkOrderTaskCompletionUpdateManyWithWhereWithoutWorkOrderInput[]
    deleteMany?: WorkOrderTaskCompletionScalarWhereInput | WorkOrderTaskCompletionScalarWhereInput[]
  }

  export type WorkOrderCreateNestedOneWithoutTaskCompletionsInput = {
    create?: XOR<WorkOrderCreateWithoutTaskCompletionsInput, WorkOrderUncheckedCreateWithoutTaskCompletionsInput>
    connectOrCreate?: WorkOrderCreateOrConnectWithoutTaskCompletionsInput
    connect?: WorkOrderWhereUniqueInput
  }

  export type WorkOrderUpdateOneRequiredWithoutTaskCompletionsNestedInput = {
    create?: XOR<WorkOrderCreateWithoutTaskCompletionsInput, WorkOrderUncheckedCreateWithoutTaskCompletionsInput>
    connectOrCreate?: WorkOrderCreateOrConnectWithoutTaskCompletionsInput
    upsert?: WorkOrderUpsertWithoutTaskCompletionsInput
    connect?: WorkOrderWhereUniqueInput
    update?: XOR<XOR<WorkOrderUpdateToOneWithWhereWithoutTaskCompletionsInput, WorkOrderUpdateWithoutTaskCompletionsInput>, WorkOrderUncheckedUpdateWithoutTaskCompletionsInput>
  }

  export type WorkOrderCreateNestedOneWithoutLineItemsInput = {
    create?: XOR<WorkOrderCreateWithoutLineItemsInput, WorkOrderUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: WorkOrderCreateOrConnectWithoutLineItemsInput
    connect?: WorkOrderWhereUniqueInput
  }

  export type PriceBookItemCreateNestedOneWithoutLineItemsInput = {
    create?: XOR<PriceBookItemCreateWithoutLineItemsInput, PriceBookItemUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: PriceBookItemCreateOrConnectWithoutLineItemsInput
    connect?: PriceBookItemWhereUniqueInput
  }

  export type WorkOrderUpdateOneRequiredWithoutLineItemsNestedInput = {
    create?: XOR<WorkOrderCreateWithoutLineItemsInput, WorkOrderUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: WorkOrderCreateOrConnectWithoutLineItemsInput
    upsert?: WorkOrderUpsertWithoutLineItemsInput
    connect?: WorkOrderWhereUniqueInput
    update?: XOR<XOR<WorkOrderUpdateToOneWithWhereWithoutLineItemsInput, WorkOrderUpdateWithoutLineItemsInput>, WorkOrderUncheckedUpdateWithoutLineItemsInput>
  }

  export type PriceBookItemUpdateOneWithoutLineItemsNestedInput = {
    create?: XOR<PriceBookItemCreateWithoutLineItemsInput, PriceBookItemUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: PriceBookItemCreateOrConnectWithoutLineItemsInput
    upsert?: PriceBookItemUpsertWithoutLineItemsInput
    disconnect?: PriceBookItemWhereInput | boolean
    delete?: PriceBookItemWhereInput | boolean
    connect?: PriceBookItemWhereUniqueInput
    update?: XOR<XOR<PriceBookItemUpdateToOneWithWhereWithoutLineItemsInput, PriceBookItemUpdateWithoutLineItemsInput>, PriceBookItemUncheckedUpdateWithoutLineItemsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumCustomFieldTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CustomFieldType | EnumCustomFieldTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CustomFieldType[] | ListEnumCustomFieldTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CustomFieldType[] | ListEnumCustomFieldTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCustomFieldTypeFilter<$PrismaModel> | $Enums.CustomFieldType
  }

  export type NestedEnumCustomFieldTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CustomFieldType | EnumCustomFieldTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CustomFieldType[] | ListEnumCustomFieldTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CustomFieldType[] | ListEnumCustomFieldTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCustomFieldTypeWithAggregatesFilter<$PrismaModel> | $Enums.CustomFieldType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCustomFieldTypeFilter<$PrismaModel>
    _max?: NestedEnumCustomFieldTypeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumPriceCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceCategory | EnumPriceCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PriceCategory[] | ListEnumPriceCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceCategory[] | ListEnumPriceCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceCategoryFilter<$PrismaModel> | $Enums.PriceCategory
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedEnumPriceCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceCategory | EnumPriceCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PriceCategory[] | ListEnumPriceCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceCategory[] | ListEnumPriceCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceCategoryWithAggregatesFilter<$PrismaModel> | $Enums.PriceCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPriceCategoryFilter<$PrismaModel>
    _max?: NestedEnumPriceCategoryFilter<$PrismaModel>
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedEnumJobStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusFilter<$PrismaModel> | $Enums.JobStatus
  }

  export type NestedEnumJobPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.JobPriority | EnumJobPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.JobPriority[] | ListEnumJobPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobPriority[] | ListEnumJobPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumJobPriorityFilter<$PrismaModel> | $Enums.JobPriority
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedEnumJobStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusWithAggregatesFilter<$PrismaModel> | $Enums.JobStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobStatusFilter<$PrismaModel>
    _max?: NestedEnumJobStatusFilter<$PrismaModel>
  }

  export type NestedEnumJobPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobPriority | EnumJobPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.JobPriority[] | ListEnumJobPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobPriority[] | ListEnumJobPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumJobPriorityWithAggregatesFilter<$PrismaModel> | $Enums.JobPriority
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobPriorityFilter<$PrismaModel>
    _max?: NestedEnumJobPriorityFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumJobStatusNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumJobStatusNullableFilter<$PrismaModel> | $Enums.JobStatus | null
  }

  export type NestedEnumJobStatusNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel> | null
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel> | null
    not?: NestedEnumJobStatusNullableWithAggregatesFilter<$PrismaModel> | $Enums.JobStatus | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumJobStatusNullableFilter<$PrismaModel>
    _max?: NestedEnumJobStatusNullableFilter<$PrismaModel>
  }

  export type NestedEnumPhotoTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PhotoType | EnumPhotoTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PhotoType[] | ListEnumPhotoTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PhotoType[] | ListEnumPhotoTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPhotoTypeFilter<$PrismaModel> | $Enums.PhotoType
  }

  export type NestedEnumPhotoTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PhotoType | EnumPhotoTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PhotoType[] | ListEnumPhotoTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PhotoType[] | ListEnumPhotoTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPhotoTypeWithAggregatesFilter<$PrismaModel> | $Enums.PhotoType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPhotoTypeFilter<$PrismaModel>
    _max?: NestedEnumPhotoTypeFilter<$PrismaModel>
  }

  export type NestedEnumWorkOrderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkOrderStatus | EnumWorkOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WorkOrderStatus[] | ListEnumWorkOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkOrderStatus[] | ListEnumWorkOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkOrderStatusFilter<$PrismaModel> | $Enums.WorkOrderStatus
  }

  export type NestedEnumWorkOrderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkOrderStatus | EnumWorkOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WorkOrderStatus[] | ListEnumWorkOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkOrderStatus[] | ListEnumWorkOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkOrderStatusWithAggregatesFilter<$PrismaModel> | $Enums.WorkOrderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWorkOrderStatusFilter<$PrismaModel>
    _max?: NestedEnumWorkOrderStatusFilter<$PrismaModel>
  }

  export type JobTemplateCreateWithoutJobTypeInput = {
    id?: string
    companyId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: JobTemplateTaskCreateNestedManyWithoutTemplateInput
    jobs?: JobCreateNestedManyWithoutTemplateInput
  }

  export type JobTemplateUncheckedCreateWithoutJobTypeInput = {
    id?: string
    companyId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: JobTemplateTaskUncheckedCreateNestedManyWithoutTemplateInput
    jobs?: JobUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type JobTemplateCreateOrConnectWithoutJobTypeInput = {
    where: JobTemplateWhereUniqueInput
    create: XOR<JobTemplateCreateWithoutJobTypeInput, JobTemplateUncheckedCreateWithoutJobTypeInput>
  }

  export type JobTemplateCreateManyJobTypeInputEnvelope = {
    data: JobTemplateCreateManyJobTypeInput | JobTemplateCreateManyJobTypeInput[]
    skipDuplicates?: boolean
  }

  export type JobCustomFieldDefCreateWithoutJobTypeInput = {
    id?: string
    companyId: string
    fieldKey: string
    label: string
    fieldType: $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: boolean
    helpText?: string | null
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
    values?: JobCustomFieldValueCreateNestedManyWithoutFieldDefInput
  }

  export type JobCustomFieldDefUncheckedCreateWithoutJobTypeInput = {
    id?: string
    companyId: string
    fieldKey: string
    label: string
    fieldType: $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: boolean
    helpText?: string | null
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
    values?: JobCustomFieldValueUncheckedCreateNestedManyWithoutFieldDefInput
  }

  export type JobCustomFieldDefCreateOrConnectWithoutJobTypeInput = {
    where: JobCustomFieldDefWhereUniqueInput
    create: XOR<JobCustomFieldDefCreateWithoutJobTypeInput, JobCustomFieldDefUncheckedCreateWithoutJobTypeInput>
  }

  export type JobCustomFieldDefCreateManyJobTypeInputEnvelope = {
    data: JobCustomFieldDefCreateManyJobTypeInput | JobCustomFieldDefCreateManyJobTypeInput[]
    skipDuplicates?: boolean
  }

  export type JobCreateWithoutJobTypeInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    template?: JobTemplateCreateNestedOneWithoutJobsInput
    workOrders?: WorkOrderCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryCreateNestedManyWithoutJobInput
    photos?: JobPhotoCreateNestedManyWithoutJobInput
  }

  export type JobUncheckedCreateWithoutJobTypeInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    templateId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    workOrders?: WorkOrderUncheckedCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueUncheckedCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryUncheckedCreateNestedManyWithoutJobInput
    photos?: JobPhotoUncheckedCreateNestedManyWithoutJobInput
  }

  export type JobCreateOrConnectWithoutJobTypeInput = {
    where: JobWhereUniqueInput
    create: XOR<JobCreateWithoutJobTypeInput, JobUncheckedCreateWithoutJobTypeInput>
  }

  export type JobCreateManyJobTypeInputEnvelope = {
    data: JobCreateManyJobTypeInput | JobCreateManyJobTypeInput[]
    skipDuplicates?: boolean
  }

  export type JobTemplateUpsertWithWhereUniqueWithoutJobTypeInput = {
    where: JobTemplateWhereUniqueInput
    update: XOR<JobTemplateUpdateWithoutJobTypeInput, JobTemplateUncheckedUpdateWithoutJobTypeInput>
    create: XOR<JobTemplateCreateWithoutJobTypeInput, JobTemplateUncheckedCreateWithoutJobTypeInput>
  }

  export type JobTemplateUpdateWithWhereUniqueWithoutJobTypeInput = {
    where: JobTemplateWhereUniqueInput
    data: XOR<JobTemplateUpdateWithoutJobTypeInput, JobTemplateUncheckedUpdateWithoutJobTypeInput>
  }

  export type JobTemplateUpdateManyWithWhereWithoutJobTypeInput = {
    where: JobTemplateScalarWhereInput
    data: XOR<JobTemplateUpdateManyMutationInput, JobTemplateUncheckedUpdateManyWithoutJobTypeInput>
  }

  export type JobTemplateScalarWhereInput = {
    AND?: JobTemplateScalarWhereInput | JobTemplateScalarWhereInput[]
    OR?: JobTemplateScalarWhereInput[]
    NOT?: JobTemplateScalarWhereInput | JobTemplateScalarWhereInput[]
    id?: StringFilter<"JobTemplate"> | string
    companyId?: StringFilter<"JobTemplate"> | string
    jobTypeId?: StringFilter<"JobTemplate"> | string
    name?: StringFilter<"JobTemplate"> | string
    description?: StringNullableFilter<"JobTemplate"> | string | null
    estimatedDurationMins?: IntFilter<"JobTemplate"> | number
    version?: IntFilter<"JobTemplate"> | number
    isActive?: BoolFilter<"JobTemplate"> | boolean
    requiredParts?: JsonNullableFilter<"JobTemplate">
    createdAt?: DateTimeFilter<"JobTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"JobTemplate"> | Date | string
  }

  export type JobCustomFieldDefUpsertWithWhereUniqueWithoutJobTypeInput = {
    where: JobCustomFieldDefWhereUniqueInput
    update: XOR<JobCustomFieldDefUpdateWithoutJobTypeInput, JobCustomFieldDefUncheckedUpdateWithoutJobTypeInput>
    create: XOR<JobCustomFieldDefCreateWithoutJobTypeInput, JobCustomFieldDefUncheckedCreateWithoutJobTypeInput>
  }

  export type JobCustomFieldDefUpdateWithWhereUniqueWithoutJobTypeInput = {
    where: JobCustomFieldDefWhereUniqueInput
    data: XOR<JobCustomFieldDefUpdateWithoutJobTypeInput, JobCustomFieldDefUncheckedUpdateWithoutJobTypeInput>
  }

  export type JobCustomFieldDefUpdateManyWithWhereWithoutJobTypeInput = {
    where: JobCustomFieldDefScalarWhereInput
    data: XOR<JobCustomFieldDefUpdateManyMutationInput, JobCustomFieldDefUncheckedUpdateManyWithoutJobTypeInput>
  }

  export type JobCustomFieldDefScalarWhereInput = {
    AND?: JobCustomFieldDefScalarWhereInput | JobCustomFieldDefScalarWhereInput[]
    OR?: JobCustomFieldDefScalarWhereInput[]
    NOT?: JobCustomFieldDefScalarWhereInput | JobCustomFieldDefScalarWhereInput[]
    id?: StringFilter<"JobCustomFieldDef"> | string
    companyId?: StringFilter<"JobCustomFieldDef"> | string
    jobTypeId?: StringFilter<"JobCustomFieldDef"> | string
    fieldKey?: StringFilter<"JobCustomFieldDef"> | string
    label?: StringFilter<"JobCustomFieldDef"> | string
    fieldType?: EnumCustomFieldTypeFilter<"JobCustomFieldDef"> | $Enums.CustomFieldType
    options?: JsonNullableFilter<"JobCustomFieldDef">
    isRequired?: BoolFilter<"JobCustomFieldDef"> | boolean
    helpText?: StringNullableFilter<"JobCustomFieldDef"> | string | null
    sortOrder?: IntFilter<"JobCustomFieldDef"> | number
    isActive?: BoolFilter<"JobCustomFieldDef"> | boolean
    createdAt?: DateTimeFilter<"JobCustomFieldDef"> | Date | string
  }

  export type JobUpsertWithWhereUniqueWithoutJobTypeInput = {
    where: JobWhereUniqueInput
    update: XOR<JobUpdateWithoutJobTypeInput, JobUncheckedUpdateWithoutJobTypeInput>
    create: XOR<JobCreateWithoutJobTypeInput, JobUncheckedCreateWithoutJobTypeInput>
  }

  export type JobUpdateWithWhereUniqueWithoutJobTypeInput = {
    where: JobWhereUniqueInput
    data: XOR<JobUpdateWithoutJobTypeInput, JobUncheckedUpdateWithoutJobTypeInput>
  }

  export type JobUpdateManyWithWhereWithoutJobTypeInput = {
    where: JobScalarWhereInput
    data: XOR<JobUpdateManyMutationInput, JobUncheckedUpdateManyWithoutJobTypeInput>
  }

  export type JobScalarWhereInput = {
    AND?: JobScalarWhereInput | JobScalarWhereInput[]
    OR?: JobScalarWhereInput[]
    NOT?: JobScalarWhereInput | JobScalarWhereInput[]
    id?: StringFilter<"Job"> | string
    companyId?: StringFilter<"Job"> | string
    jobNumber?: StringFilter<"Job"> | string
    customerId?: StringFilter<"Job"> | string
    customerName?: StringFilter<"Job"> | string
    customerPhone?: StringNullableFilter<"Job"> | string | null
    customerEmail?: StringNullableFilter<"Job"> | string | null
    serviceAddress?: StringFilter<"Job"> | string
    serviceCity?: StringNullableFilter<"Job"> | string | null
    serviceState?: StringNullableFilter<"Job"> | string | null
    serviceZip?: StringNullableFilter<"Job"> | string | null
    serviceLatitude?: DecimalNullableFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: DecimalNullableFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: StringNullableFilter<"Job"> | string | null
    templateId?: StringNullableFilter<"Job"> | string | null
    title?: StringFilter<"Job"> | string
    description?: StringNullableFilter<"Job"> | string | null
    status?: EnumJobStatusFilter<"Job"> | $Enums.JobStatus
    priority?: EnumJobPriorityFilter<"Job"> | $Enums.JobPriority
    assignedToId?: StringNullableFilter<"Job"> | string | null
    assignedToName?: StringNullableFilter<"Job"> | string | null
    scheduledStart?: DateTimeNullableFilter<"Job"> | Date | string | null
    scheduledEnd?: DateTimeNullableFilter<"Job"> | Date | string | null
    actualStart?: DateTimeNullableFilter<"Job"> | Date | string | null
    actualEnd?: DateTimeNullableFilter<"Job"> | Date | string | null
    estimatedDurationMins?: IntNullableFilter<"Job"> | number | null
    travelDistanceKm?: DecimalNullableFilter<"Job"> | Decimal | DecimalJsLike | number | string | null
    quoteId?: StringNullableFilter<"Job"> | string | null
    invoiceId?: StringNullableFilter<"Job"> | string | null
    notes?: StringNullableFilter<"Job"> | string | null
    internalNotes?: StringNullableFilter<"Job"> | string | null
    tags?: StringNullableListFilter<"Job">
    createdByUserId?: StringFilter<"Job"> | string
    createdAt?: DateTimeFilter<"Job"> | Date | string
    updatedAt?: DateTimeFilter<"Job"> | Date | string
    completedAt?: DateTimeNullableFilter<"Job"> | Date | string | null
  }

  export type JobTypeCreateWithoutTemplatesInput = {
    id?: string
    companyId: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    isActive?: boolean
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    customFieldDefs?: JobCustomFieldDefCreateNestedManyWithoutJobTypeInput
    jobs?: JobCreateNestedManyWithoutJobTypeInput
  }

  export type JobTypeUncheckedCreateWithoutTemplatesInput = {
    id?: string
    companyId: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    isActive?: boolean
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    customFieldDefs?: JobCustomFieldDefUncheckedCreateNestedManyWithoutJobTypeInput
    jobs?: JobUncheckedCreateNestedManyWithoutJobTypeInput
  }

  export type JobTypeCreateOrConnectWithoutTemplatesInput = {
    where: JobTypeWhereUniqueInput
    create: XOR<JobTypeCreateWithoutTemplatesInput, JobTypeUncheckedCreateWithoutTemplatesInput>
  }

  export type JobTemplateTaskCreateWithoutTemplateInput = {
    id?: string
    taskName: string
    description?: string | null
    taskOrder: number
    isRequired?: boolean
    photoRequired?: boolean
    safetyNote?: string | null
    estimatedMins?: number | null
    createdAt?: Date | string
  }

  export type JobTemplateTaskUncheckedCreateWithoutTemplateInput = {
    id?: string
    taskName: string
    description?: string | null
    taskOrder: number
    isRequired?: boolean
    photoRequired?: boolean
    safetyNote?: string | null
    estimatedMins?: number | null
    createdAt?: Date | string
  }

  export type JobTemplateTaskCreateOrConnectWithoutTemplateInput = {
    where: JobTemplateTaskWhereUniqueInput
    create: XOR<JobTemplateTaskCreateWithoutTemplateInput, JobTemplateTaskUncheckedCreateWithoutTemplateInput>
  }

  export type JobTemplateTaskCreateManyTemplateInputEnvelope = {
    data: JobTemplateTaskCreateManyTemplateInput | JobTemplateTaskCreateManyTemplateInput[]
    skipDuplicates?: boolean
  }

  export type JobCreateWithoutTemplateInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    jobType?: JobTypeCreateNestedOneWithoutJobsInput
    workOrders?: WorkOrderCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryCreateNestedManyWithoutJobInput
    photos?: JobPhotoCreateNestedManyWithoutJobInput
  }

  export type JobUncheckedCreateWithoutTemplateInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    jobTypeId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    workOrders?: WorkOrderUncheckedCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueUncheckedCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryUncheckedCreateNestedManyWithoutJobInput
    photos?: JobPhotoUncheckedCreateNestedManyWithoutJobInput
  }

  export type JobCreateOrConnectWithoutTemplateInput = {
    where: JobWhereUniqueInput
    create: XOR<JobCreateWithoutTemplateInput, JobUncheckedCreateWithoutTemplateInput>
  }

  export type JobCreateManyTemplateInputEnvelope = {
    data: JobCreateManyTemplateInput | JobCreateManyTemplateInput[]
    skipDuplicates?: boolean
  }

  export type JobTypeUpsertWithoutTemplatesInput = {
    update: XOR<JobTypeUpdateWithoutTemplatesInput, JobTypeUncheckedUpdateWithoutTemplatesInput>
    create: XOR<JobTypeCreateWithoutTemplatesInput, JobTypeUncheckedCreateWithoutTemplatesInput>
    where?: JobTypeWhereInput
  }

  export type JobTypeUpdateToOneWithWhereWithoutTemplatesInput = {
    where?: JobTypeWhereInput
    data: XOR<JobTypeUpdateWithoutTemplatesInput, JobTypeUncheckedUpdateWithoutTemplatesInput>
  }

  export type JobTypeUpdateWithoutTemplatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    customFieldDefs?: JobCustomFieldDefUpdateManyWithoutJobTypeNestedInput
    jobs?: JobUpdateManyWithoutJobTypeNestedInput
  }

  export type JobTypeUncheckedUpdateWithoutTemplatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    customFieldDefs?: JobCustomFieldDefUncheckedUpdateManyWithoutJobTypeNestedInput
    jobs?: JobUncheckedUpdateManyWithoutJobTypeNestedInput
  }

  export type JobTemplateTaskUpsertWithWhereUniqueWithoutTemplateInput = {
    where: JobTemplateTaskWhereUniqueInput
    update: XOR<JobTemplateTaskUpdateWithoutTemplateInput, JobTemplateTaskUncheckedUpdateWithoutTemplateInput>
    create: XOR<JobTemplateTaskCreateWithoutTemplateInput, JobTemplateTaskUncheckedCreateWithoutTemplateInput>
  }

  export type JobTemplateTaskUpdateWithWhereUniqueWithoutTemplateInput = {
    where: JobTemplateTaskWhereUniqueInput
    data: XOR<JobTemplateTaskUpdateWithoutTemplateInput, JobTemplateTaskUncheckedUpdateWithoutTemplateInput>
  }

  export type JobTemplateTaskUpdateManyWithWhereWithoutTemplateInput = {
    where: JobTemplateTaskScalarWhereInput
    data: XOR<JobTemplateTaskUpdateManyMutationInput, JobTemplateTaskUncheckedUpdateManyWithoutTemplateInput>
  }

  export type JobTemplateTaskScalarWhereInput = {
    AND?: JobTemplateTaskScalarWhereInput | JobTemplateTaskScalarWhereInput[]
    OR?: JobTemplateTaskScalarWhereInput[]
    NOT?: JobTemplateTaskScalarWhereInput | JobTemplateTaskScalarWhereInput[]
    id?: StringFilter<"JobTemplateTask"> | string
    templateId?: StringFilter<"JobTemplateTask"> | string
    taskName?: StringFilter<"JobTemplateTask"> | string
    description?: StringNullableFilter<"JobTemplateTask"> | string | null
    taskOrder?: IntFilter<"JobTemplateTask"> | number
    isRequired?: BoolFilter<"JobTemplateTask"> | boolean
    photoRequired?: BoolFilter<"JobTemplateTask"> | boolean
    safetyNote?: StringNullableFilter<"JobTemplateTask"> | string | null
    estimatedMins?: IntNullableFilter<"JobTemplateTask"> | number | null
    createdAt?: DateTimeFilter<"JobTemplateTask"> | Date | string
  }

  export type JobUpsertWithWhereUniqueWithoutTemplateInput = {
    where: JobWhereUniqueInput
    update: XOR<JobUpdateWithoutTemplateInput, JobUncheckedUpdateWithoutTemplateInput>
    create: XOR<JobCreateWithoutTemplateInput, JobUncheckedCreateWithoutTemplateInput>
  }

  export type JobUpdateWithWhereUniqueWithoutTemplateInput = {
    where: JobWhereUniqueInput
    data: XOR<JobUpdateWithoutTemplateInput, JobUncheckedUpdateWithoutTemplateInput>
  }

  export type JobUpdateManyWithWhereWithoutTemplateInput = {
    where: JobScalarWhereInput
    data: XOR<JobUpdateManyMutationInput, JobUncheckedUpdateManyWithoutTemplateInput>
  }

  export type JobTemplateCreateWithoutTasksInput = {
    id?: string
    companyId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    jobType: JobTypeCreateNestedOneWithoutTemplatesInput
    jobs?: JobCreateNestedManyWithoutTemplateInput
  }

  export type JobTemplateUncheckedCreateWithoutTasksInput = {
    id?: string
    companyId: string
    jobTypeId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    jobs?: JobUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type JobTemplateCreateOrConnectWithoutTasksInput = {
    where: JobTemplateWhereUniqueInput
    create: XOR<JobTemplateCreateWithoutTasksInput, JobTemplateUncheckedCreateWithoutTasksInput>
  }

  export type JobTemplateUpsertWithoutTasksInput = {
    update: XOR<JobTemplateUpdateWithoutTasksInput, JobTemplateUncheckedUpdateWithoutTasksInput>
    create: XOR<JobTemplateCreateWithoutTasksInput, JobTemplateUncheckedCreateWithoutTasksInput>
    where?: JobTemplateWhereInput
  }

  export type JobTemplateUpdateToOneWithWhereWithoutTasksInput = {
    where?: JobTemplateWhereInput
    data: XOR<JobTemplateUpdateWithoutTasksInput, JobTemplateUncheckedUpdateWithoutTasksInput>
  }

  export type JobTemplateUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobType?: JobTypeUpdateOneRequiredWithoutTemplatesNestedInput
    jobs?: JobUpdateManyWithoutTemplateNestedInput
  }

  export type JobTemplateUncheckedUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobTypeId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobs?: JobUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type JobTypeCreateWithoutCustomFieldDefsInput = {
    id?: string
    companyId: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    isActive?: boolean
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    templates?: JobTemplateCreateNestedManyWithoutJobTypeInput
    jobs?: JobCreateNestedManyWithoutJobTypeInput
  }

  export type JobTypeUncheckedCreateWithoutCustomFieldDefsInput = {
    id?: string
    companyId: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    isActive?: boolean
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    templates?: JobTemplateUncheckedCreateNestedManyWithoutJobTypeInput
    jobs?: JobUncheckedCreateNestedManyWithoutJobTypeInput
  }

  export type JobTypeCreateOrConnectWithoutCustomFieldDefsInput = {
    where: JobTypeWhereUniqueInput
    create: XOR<JobTypeCreateWithoutCustomFieldDefsInput, JobTypeUncheckedCreateWithoutCustomFieldDefsInput>
  }

  export type JobCustomFieldValueCreateWithoutFieldDefInput = {
    id?: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
    job: JobCreateNestedOneWithoutCustomFieldValuesInput
  }

  export type JobCustomFieldValueUncheckedCreateWithoutFieldDefInput = {
    id?: string
    jobId: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type JobCustomFieldValueCreateOrConnectWithoutFieldDefInput = {
    where: JobCustomFieldValueWhereUniqueInput
    create: XOR<JobCustomFieldValueCreateWithoutFieldDefInput, JobCustomFieldValueUncheckedCreateWithoutFieldDefInput>
  }

  export type JobCustomFieldValueCreateManyFieldDefInputEnvelope = {
    data: JobCustomFieldValueCreateManyFieldDefInput | JobCustomFieldValueCreateManyFieldDefInput[]
    skipDuplicates?: boolean
  }

  export type JobTypeUpsertWithoutCustomFieldDefsInput = {
    update: XOR<JobTypeUpdateWithoutCustomFieldDefsInput, JobTypeUncheckedUpdateWithoutCustomFieldDefsInput>
    create: XOR<JobTypeCreateWithoutCustomFieldDefsInput, JobTypeUncheckedCreateWithoutCustomFieldDefsInput>
    where?: JobTypeWhereInput
  }

  export type JobTypeUpdateToOneWithWhereWithoutCustomFieldDefsInput = {
    where?: JobTypeWhereInput
    data: XOR<JobTypeUpdateWithoutCustomFieldDefsInput, JobTypeUncheckedUpdateWithoutCustomFieldDefsInput>
  }

  export type JobTypeUpdateWithoutCustomFieldDefsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    templates?: JobTemplateUpdateManyWithoutJobTypeNestedInput
    jobs?: JobUpdateManyWithoutJobTypeNestedInput
  }

  export type JobTypeUncheckedUpdateWithoutCustomFieldDefsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    templates?: JobTemplateUncheckedUpdateManyWithoutJobTypeNestedInput
    jobs?: JobUncheckedUpdateManyWithoutJobTypeNestedInput
  }

  export type JobCustomFieldValueUpsertWithWhereUniqueWithoutFieldDefInput = {
    where: JobCustomFieldValueWhereUniqueInput
    update: XOR<JobCustomFieldValueUpdateWithoutFieldDefInput, JobCustomFieldValueUncheckedUpdateWithoutFieldDefInput>
    create: XOR<JobCustomFieldValueCreateWithoutFieldDefInput, JobCustomFieldValueUncheckedCreateWithoutFieldDefInput>
  }

  export type JobCustomFieldValueUpdateWithWhereUniqueWithoutFieldDefInput = {
    where: JobCustomFieldValueWhereUniqueInput
    data: XOR<JobCustomFieldValueUpdateWithoutFieldDefInput, JobCustomFieldValueUncheckedUpdateWithoutFieldDefInput>
  }

  export type JobCustomFieldValueUpdateManyWithWhereWithoutFieldDefInput = {
    where: JobCustomFieldValueScalarWhereInput
    data: XOR<JobCustomFieldValueUpdateManyMutationInput, JobCustomFieldValueUncheckedUpdateManyWithoutFieldDefInput>
  }

  export type JobCustomFieldValueScalarWhereInput = {
    AND?: JobCustomFieldValueScalarWhereInput | JobCustomFieldValueScalarWhereInput[]
    OR?: JobCustomFieldValueScalarWhereInput[]
    NOT?: JobCustomFieldValueScalarWhereInput | JobCustomFieldValueScalarWhereInput[]
    id?: StringFilter<"JobCustomFieldValue"> | string
    jobId?: StringFilter<"JobCustomFieldValue"> | string
    fieldDefId?: StringFilter<"JobCustomFieldValue"> | string
    value?: JsonFilter<"JobCustomFieldValue">
    updatedAt?: DateTimeFilter<"JobCustomFieldValue"> | Date | string
  }

  export type JobCreateWithoutCustomFieldValuesInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    jobType?: JobTypeCreateNestedOneWithoutJobsInput
    template?: JobTemplateCreateNestedOneWithoutJobsInput
    workOrders?: WorkOrderCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryCreateNestedManyWithoutJobInput
    photos?: JobPhotoCreateNestedManyWithoutJobInput
  }

  export type JobUncheckedCreateWithoutCustomFieldValuesInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    jobTypeId?: string | null
    templateId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    workOrders?: WorkOrderUncheckedCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryUncheckedCreateNestedManyWithoutJobInput
    photos?: JobPhotoUncheckedCreateNestedManyWithoutJobInput
  }

  export type JobCreateOrConnectWithoutCustomFieldValuesInput = {
    where: JobWhereUniqueInput
    create: XOR<JobCreateWithoutCustomFieldValuesInput, JobUncheckedCreateWithoutCustomFieldValuesInput>
  }

  export type JobCustomFieldDefCreateWithoutValuesInput = {
    id?: string
    companyId: string
    fieldKey: string
    label: string
    fieldType: $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: boolean
    helpText?: string | null
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
    jobType: JobTypeCreateNestedOneWithoutCustomFieldDefsInput
  }

  export type JobCustomFieldDefUncheckedCreateWithoutValuesInput = {
    id?: string
    companyId: string
    jobTypeId: string
    fieldKey: string
    label: string
    fieldType: $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: boolean
    helpText?: string | null
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
  }

  export type JobCustomFieldDefCreateOrConnectWithoutValuesInput = {
    where: JobCustomFieldDefWhereUniqueInput
    create: XOR<JobCustomFieldDefCreateWithoutValuesInput, JobCustomFieldDefUncheckedCreateWithoutValuesInput>
  }

  export type JobUpsertWithoutCustomFieldValuesInput = {
    update: XOR<JobUpdateWithoutCustomFieldValuesInput, JobUncheckedUpdateWithoutCustomFieldValuesInput>
    create: XOR<JobCreateWithoutCustomFieldValuesInput, JobUncheckedCreateWithoutCustomFieldValuesInput>
    where?: JobWhereInput
  }

  export type JobUpdateToOneWithWhereWithoutCustomFieldValuesInput = {
    where?: JobWhereInput
    data: XOR<JobUpdateWithoutCustomFieldValuesInput, JobUncheckedUpdateWithoutCustomFieldValuesInput>
  }

  export type JobUpdateWithoutCustomFieldValuesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    jobType?: JobTypeUpdateOneWithoutJobsNestedInput
    template?: JobTemplateUpdateOneWithoutJobsNestedInput
    workOrders?: WorkOrderUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUpdateManyWithoutJobNestedInput
  }

  export type JobUncheckedUpdateWithoutCustomFieldValuesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    workOrders?: WorkOrderUncheckedUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUncheckedUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUncheckedUpdateManyWithoutJobNestedInput
  }

  export type JobCustomFieldDefUpsertWithoutValuesInput = {
    update: XOR<JobCustomFieldDefUpdateWithoutValuesInput, JobCustomFieldDefUncheckedUpdateWithoutValuesInput>
    create: XOR<JobCustomFieldDefCreateWithoutValuesInput, JobCustomFieldDefUncheckedCreateWithoutValuesInput>
    where?: JobCustomFieldDefWhereInput
  }

  export type JobCustomFieldDefUpdateToOneWithWhereWithoutValuesInput = {
    where?: JobCustomFieldDefWhereInput
    data: XOR<JobCustomFieldDefUpdateWithoutValuesInput, JobCustomFieldDefUncheckedUpdateWithoutValuesInput>
  }

  export type JobCustomFieldDefUpdateWithoutValuesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    fieldKey?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    fieldType?: EnumCustomFieldTypeFieldUpdateOperationsInput | $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    helpText?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobType?: JobTypeUpdateOneRequiredWithoutCustomFieldDefsNestedInput
  }

  export type JobCustomFieldDefUncheckedUpdateWithoutValuesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobTypeId?: StringFieldUpdateOperationsInput | string
    fieldKey?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    fieldType?: EnumCustomFieldTypeFieldUpdateOperationsInput | $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    helpText?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderLineItemCreateWithoutPriceBookItemInput = {
    id?: string
    description: string
    category?: $Enums.PriceCategory
    quantity?: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    lineTotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    workOrder: WorkOrderCreateNestedOneWithoutLineItemsInput
  }

  export type WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput = {
    id?: string
    workOrderId: string
    description: string
    category?: $Enums.PriceCategory
    quantity?: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    lineTotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type WorkOrderLineItemCreateOrConnectWithoutPriceBookItemInput = {
    where: WorkOrderLineItemWhereUniqueInput
    create: XOR<WorkOrderLineItemCreateWithoutPriceBookItemInput, WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput>
  }

  export type WorkOrderLineItemCreateManyPriceBookItemInputEnvelope = {
    data: WorkOrderLineItemCreateManyPriceBookItemInput | WorkOrderLineItemCreateManyPriceBookItemInput[]
    skipDuplicates?: boolean
  }

  export type WorkOrderLineItemUpsertWithWhereUniqueWithoutPriceBookItemInput = {
    where: WorkOrderLineItemWhereUniqueInput
    update: XOR<WorkOrderLineItemUpdateWithoutPriceBookItemInput, WorkOrderLineItemUncheckedUpdateWithoutPriceBookItemInput>
    create: XOR<WorkOrderLineItemCreateWithoutPriceBookItemInput, WorkOrderLineItemUncheckedCreateWithoutPriceBookItemInput>
  }

  export type WorkOrderLineItemUpdateWithWhereUniqueWithoutPriceBookItemInput = {
    where: WorkOrderLineItemWhereUniqueInput
    data: XOR<WorkOrderLineItemUpdateWithoutPriceBookItemInput, WorkOrderLineItemUncheckedUpdateWithoutPriceBookItemInput>
  }

  export type WorkOrderLineItemUpdateManyWithWhereWithoutPriceBookItemInput = {
    where: WorkOrderLineItemScalarWhereInput
    data: XOR<WorkOrderLineItemUpdateManyMutationInput, WorkOrderLineItemUncheckedUpdateManyWithoutPriceBookItemInput>
  }

  export type WorkOrderLineItemScalarWhereInput = {
    AND?: WorkOrderLineItemScalarWhereInput | WorkOrderLineItemScalarWhereInput[]
    OR?: WorkOrderLineItemScalarWhereInput[]
    NOT?: WorkOrderLineItemScalarWhereInput | WorkOrderLineItemScalarWhereInput[]
    id?: StringFilter<"WorkOrderLineItem"> | string
    workOrderId?: StringFilter<"WorkOrderLineItem"> | string
    priceBookItemId?: StringNullableFilter<"WorkOrderLineItem"> | string | null
    description?: StringFilter<"WorkOrderLineItem"> | string
    category?: EnumPriceCategoryFilter<"WorkOrderLineItem"> | $Enums.PriceCategory
    quantity?: DecimalFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"WorkOrderLineItem"> | boolean
    lineTotal?: DecimalFilter<"WorkOrderLineItem"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"WorkOrderLineItem"> | Date | string
  }

  export type JobTypeCreateWithoutJobsInput = {
    id?: string
    companyId: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    isActive?: boolean
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    templates?: JobTemplateCreateNestedManyWithoutJobTypeInput
    customFieldDefs?: JobCustomFieldDefCreateNestedManyWithoutJobTypeInput
  }

  export type JobTypeUncheckedCreateWithoutJobsInput = {
    id?: string
    companyId: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    isActive?: boolean
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    templates?: JobTemplateUncheckedCreateNestedManyWithoutJobTypeInput
    customFieldDefs?: JobCustomFieldDefUncheckedCreateNestedManyWithoutJobTypeInput
  }

  export type JobTypeCreateOrConnectWithoutJobsInput = {
    where: JobTypeWhereUniqueInput
    create: XOR<JobTypeCreateWithoutJobsInput, JobTypeUncheckedCreateWithoutJobsInput>
  }

  export type JobTemplateCreateWithoutJobsInput = {
    id?: string
    companyId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    jobType: JobTypeCreateNestedOneWithoutTemplatesInput
    tasks?: JobTemplateTaskCreateNestedManyWithoutTemplateInput
  }

  export type JobTemplateUncheckedCreateWithoutJobsInput = {
    id?: string
    companyId: string
    jobTypeId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: JobTemplateTaskUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type JobTemplateCreateOrConnectWithoutJobsInput = {
    where: JobTemplateWhereUniqueInput
    create: XOR<JobTemplateCreateWithoutJobsInput, JobTemplateUncheckedCreateWithoutJobsInput>
  }

  export type WorkOrderCreateWithoutJobInput = {
    id?: string
    companyId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: WorkOrderLineItemCreateNestedManyWithoutWorkOrderInput
    taskCompletions?: WorkOrderTaskCompletionCreateNestedManyWithoutWorkOrderInput
  }

  export type WorkOrderUncheckedCreateWithoutJobInput = {
    id?: string
    companyId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: WorkOrderLineItemUncheckedCreateNestedManyWithoutWorkOrderInput
    taskCompletions?: WorkOrderTaskCompletionUncheckedCreateNestedManyWithoutWorkOrderInput
  }

  export type WorkOrderCreateOrConnectWithoutJobInput = {
    where: WorkOrderWhereUniqueInput
    create: XOR<WorkOrderCreateWithoutJobInput, WorkOrderUncheckedCreateWithoutJobInput>
  }

  export type WorkOrderCreateManyJobInputEnvelope = {
    data: WorkOrderCreateManyJobInput | WorkOrderCreateManyJobInput[]
    skipDuplicates?: boolean
  }

  export type JobCustomFieldValueCreateWithoutJobInput = {
    id?: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
    fieldDef: JobCustomFieldDefCreateNestedOneWithoutValuesInput
  }

  export type JobCustomFieldValueUncheckedCreateWithoutJobInput = {
    id?: string
    fieldDefId: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type JobCustomFieldValueCreateOrConnectWithoutJobInput = {
    where: JobCustomFieldValueWhereUniqueInput
    create: XOR<JobCustomFieldValueCreateWithoutJobInput, JobCustomFieldValueUncheckedCreateWithoutJobInput>
  }

  export type JobCustomFieldValueCreateManyJobInputEnvelope = {
    data: JobCustomFieldValueCreateManyJobInput | JobCustomFieldValueCreateManyJobInput[]
    skipDuplicates?: boolean
  }

  export type JobStatusHistoryCreateWithoutJobInput = {
    id?: string
    fromStatus?: $Enums.JobStatus | null
    toStatus: $Enums.JobStatus
    changedById: string
    changedByName: string
    note?: string | null
    createdAt?: Date | string
  }

  export type JobStatusHistoryUncheckedCreateWithoutJobInput = {
    id?: string
    fromStatus?: $Enums.JobStatus | null
    toStatus: $Enums.JobStatus
    changedById: string
    changedByName: string
    note?: string | null
    createdAt?: Date | string
  }

  export type JobStatusHistoryCreateOrConnectWithoutJobInput = {
    where: JobStatusHistoryWhereUniqueInput
    create: XOR<JobStatusHistoryCreateWithoutJobInput, JobStatusHistoryUncheckedCreateWithoutJobInput>
  }

  export type JobStatusHistoryCreateManyJobInputEnvelope = {
    data: JobStatusHistoryCreateManyJobInput | JobStatusHistoryCreateManyJobInput[]
    skipDuplicates?: boolean
  }

  export type JobPhotoCreateWithoutJobInput = {
    id?: string
    workOrderId?: string | null
    s3Key: string
    caption?: string | null
    photoType?: $Enums.PhotoType
    uploadedById: string
    createdAt?: Date | string
  }

  export type JobPhotoUncheckedCreateWithoutJobInput = {
    id?: string
    workOrderId?: string | null
    s3Key: string
    caption?: string | null
    photoType?: $Enums.PhotoType
    uploadedById: string
    createdAt?: Date | string
  }

  export type JobPhotoCreateOrConnectWithoutJobInput = {
    where: JobPhotoWhereUniqueInput
    create: XOR<JobPhotoCreateWithoutJobInput, JobPhotoUncheckedCreateWithoutJobInput>
  }

  export type JobPhotoCreateManyJobInputEnvelope = {
    data: JobPhotoCreateManyJobInput | JobPhotoCreateManyJobInput[]
    skipDuplicates?: boolean
  }

  export type JobTypeUpsertWithoutJobsInput = {
    update: XOR<JobTypeUpdateWithoutJobsInput, JobTypeUncheckedUpdateWithoutJobsInput>
    create: XOR<JobTypeCreateWithoutJobsInput, JobTypeUncheckedCreateWithoutJobsInput>
    where?: JobTypeWhereInput
  }

  export type JobTypeUpdateToOneWithWhereWithoutJobsInput = {
    where?: JobTypeWhereInput
    data: XOR<JobTypeUpdateWithoutJobsInput, JobTypeUncheckedUpdateWithoutJobsInput>
  }

  export type JobTypeUpdateWithoutJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    templates?: JobTemplateUpdateManyWithoutJobTypeNestedInput
    customFieldDefs?: JobCustomFieldDefUpdateManyWithoutJobTypeNestedInput
  }

  export type JobTypeUncheckedUpdateWithoutJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    templates?: JobTemplateUncheckedUpdateManyWithoutJobTypeNestedInput
    customFieldDefs?: JobCustomFieldDefUncheckedUpdateManyWithoutJobTypeNestedInput
  }

  export type JobTemplateUpsertWithoutJobsInput = {
    update: XOR<JobTemplateUpdateWithoutJobsInput, JobTemplateUncheckedUpdateWithoutJobsInput>
    create: XOR<JobTemplateCreateWithoutJobsInput, JobTemplateUncheckedCreateWithoutJobsInput>
    where?: JobTemplateWhereInput
  }

  export type JobTemplateUpdateToOneWithWhereWithoutJobsInput = {
    where?: JobTemplateWhereInput
    data: XOR<JobTemplateUpdateWithoutJobsInput, JobTemplateUncheckedUpdateWithoutJobsInput>
  }

  export type JobTemplateUpdateWithoutJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobType?: JobTypeUpdateOneRequiredWithoutTemplatesNestedInput
    tasks?: JobTemplateTaskUpdateManyWithoutTemplateNestedInput
  }

  export type JobTemplateUncheckedUpdateWithoutJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobTypeId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: JobTemplateTaskUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type WorkOrderUpsertWithWhereUniqueWithoutJobInput = {
    where: WorkOrderWhereUniqueInput
    update: XOR<WorkOrderUpdateWithoutJobInput, WorkOrderUncheckedUpdateWithoutJobInput>
    create: XOR<WorkOrderCreateWithoutJobInput, WorkOrderUncheckedCreateWithoutJobInput>
  }

  export type WorkOrderUpdateWithWhereUniqueWithoutJobInput = {
    where: WorkOrderWhereUniqueInput
    data: XOR<WorkOrderUpdateWithoutJobInput, WorkOrderUncheckedUpdateWithoutJobInput>
  }

  export type WorkOrderUpdateManyWithWhereWithoutJobInput = {
    where: WorkOrderScalarWhereInput
    data: XOR<WorkOrderUpdateManyMutationInput, WorkOrderUncheckedUpdateManyWithoutJobInput>
  }

  export type WorkOrderScalarWhereInput = {
    AND?: WorkOrderScalarWhereInput | WorkOrderScalarWhereInput[]
    OR?: WorkOrderScalarWhereInput[]
    NOT?: WorkOrderScalarWhereInput | WorkOrderScalarWhereInput[]
    id?: StringFilter<"WorkOrder"> | string
    companyId?: StringFilter<"WorkOrder"> | string
    jobId?: StringFilter<"WorkOrder"> | string
    workOrderNumber?: StringFilter<"WorkOrder"> | string
    technicianId?: StringFilter<"WorkOrder"> | string
    technicianName?: StringFilter<"WorkOrder"> | string
    status?: EnumWorkOrderStatusFilter<"WorkOrder"> | $Enums.WorkOrderStatus
    scheduledStart?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    scheduledEnd?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    checkinAt?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    checkoutAt?: DateTimeNullableFilter<"WorkOrder"> | Date | string | null
    signatureUrl?: StringNullableFilter<"WorkOrder"> | string | null
    technicianNotes?: StringNullableFilter<"WorkOrder"> | string | null
    createdAt?: DateTimeFilter<"WorkOrder"> | Date | string
    updatedAt?: DateTimeFilter<"WorkOrder"> | Date | string
  }

  export type JobCustomFieldValueUpsertWithWhereUniqueWithoutJobInput = {
    where: JobCustomFieldValueWhereUniqueInput
    update: XOR<JobCustomFieldValueUpdateWithoutJobInput, JobCustomFieldValueUncheckedUpdateWithoutJobInput>
    create: XOR<JobCustomFieldValueCreateWithoutJobInput, JobCustomFieldValueUncheckedCreateWithoutJobInput>
  }

  export type JobCustomFieldValueUpdateWithWhereUniqueWithoutJobInput = {
    where: JobCustomFieldValueWhereUniqueInput
    data: XOR<JobCustomFieldValueUpdateWithoutJobInput, JobCustomFieldValueUncheckedUpdateWithoutJobInput>
  }

  export type JobCustomFieldValueUpdateManyWithWhereWithoutJobInput = {
    where: JobCustomFieldValueScalarWhereInput
    data: XOR<JobCustomFieldValueUpdateManyMutationInput, JobCustomFieldValueUncheckedUpdateManyWithoutJobInput>
  }

  export type JobStatusHistoryUpsertWithWhereUniqueWithoutJobInput = {
    where: JobStatusHistoryWhereUniqueInput
    update: XOR<JobStatusHistoryUpdateWithoutJobInput, JobStatusHistoryUncheckedUpdateWithoutJobInput>
    create: XOR<JobStatusHistoryCreateWithoutJobInput, JobStatusHistoryUncheckedCreateWithoutJobInput>
  }

  export type JobStatusHistoryUpdateWithWhereUniqueWithoutJobInput = {
    where: JobStatusHistoryWhereUniqueInput
    data: XOR<JobStatusHistoryUpdateWithoutJobInput, JobStatusHistoryUncheckedUpdateWithoutJobInput>
  }

  export type JobStatusHistoryUpdateManyWithWhereWithoutJobInput = {
    where: JobStatusHistoryScalarWhereInput
    data: XOR<JobStatusHistoryUpdateManyMutationInput, JobStatusHistoryUncheckedUpdateManyWithoutJobInput>
  }

  export type JobStatusHistoryScalarWhereInput = {
    AND?: JobStatusHistoryScalarWhereInput | JobStatusHistoryScalarWhereInput[]
    OR?: JobStatusHistoryScalarWhereInput[]
    NOT?: JobStatusHistoryScalarWhereInput | JobStatusHistoryScalarWhereInput[]
    id?: StringFilter<"JobStatusHistory"> | string
    jobId?: StringFilter<"JobStatusHistory"> | string
    fromStatus?: EnumJobStatusNullableFilter<"JobStatusHistory"> | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFilter<"JobStatusHistory"> | $Enums.JobStatus
    changedById?: StringFilter<"JobStatusHistory"> | string
    changedByName?: StringFilter<"JobStatusHistory"> | string
    note?: StringNullableFilter<"JobStatusHistory"> | string | null
    createdAt?: DateTimeFilter<"JobStatusHistory"> | Date | string
  }

  export type JobPhotoUpsertWithWhereUniqueWithoutJobInput = {
    where: JobPhotoWhereUniqueInput
    update: XOR<JobPhotoUpdateWithoutJobInput, JobPhotoUncheckedUpdateWithoutJobInput>
    create: XOR<JobPhotoCreateWithoutJobInput, JobPhotoUncheckedCreateWithoutJobInput>
  }

  export type JobPhotoUpdateWithWhereUniqueWithoutJobInput = {
    where: JobPhotoWhereUniqueInput
    data: XOR<JobPhotoUpdateWithoutJobInput, JobPhotoUncheckedUpdateWithoutJobInput>
  }

  export type JobPhotoUpdateManyWithWhereWithoutJobInput = {
    where: JobPhotoScalarWhereInput
    data: XOR<JobPhotoUpdateManyMutationInput, JobPhotoUncheckedUpdateManyWithoutJobInput>
  }

  export type JobPhotoScalarWhereInput = {
    AND?: JobPhotoScalarWhereInput | JobPhotoScalarWhereInput[]
    OR?: JobPhotoScalarWhereInput[]
    NOT?: JobPhotoScalarWhereInput | JobPhotoScalarWhereInput[]
    id?: StringFilter<"JobPhoto"> | string
    jobId?: StringFilter<"JobPhoto"> | string
    workOrderId?: StringNullableFilter<"JobPhoto"> | string | null
    s3Key?: StringFilter<"JobPhoto"> | string
    caption?: StringNullableFilter<"JobPhoto"> | string | null
    photoType?: EnumPhotoTypeFilter<"JobPhoto"> | $Enums.PhotoType
    uploadedById?: StringFilter<"JobPhoto"> | string
    createdAt?: DateTimeFilter<"JobPhoto"> | Date | string
  }

  export type JobCreateWithoutStatusHistoryInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    jobType?: JobTypeCreateNestedOneWithoutJobsInput
    template?: JobTemplateCreateNestedOneWithoutJobsInput
    workOrders?: WorkOrderCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueCreateNestedManyWithoutJobInput
    photos?: JobPhotoCreateNestedManyWithoutJobInput
  }

  export type JobUncheckedCreateWithoutStatusHistoryInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    jobTypeId?: string | null
    templateId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    workOrders?: WorkOrderUncheckedCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueUncheckedCreateNestedManyWithoutJobInput
    photos?: JobPhotoUncheckedCreateNestedManyWithoutJobInput
  }

  export type JobCreateOrConnectWithoutStatusHistoryInput = {
    where: JobWhereUniqueInput
    create: XOR<JobCreateWithoutStatusHistoryInput, JobUncheckedCreateWithoutStatusHistoryInput>
  }

  export type JobUpsertWithoutStatusHistoryInput = {
    update: XOR<JobUpdateWithoutStatusHistoryInput, JobUncheckedUpdateWithoutStatusHistoryInput>
    create: XOR<JobCreateWithoutStatusHistoryInput, JobUncheckedCreateWithoutStatusHistoryInput>
    where?: JobWhereInput
  }

  export type JobUpdateToOneWithWhereWithoutStatusHistoryInput = {
    where?: JobWhereInput
    data: XOR<JobUpdateWithoutStatusHistoryInput, JobUncheckedUpdateWithoutStatusHistoryInput>
  }

  export type JobUpdateWithoutStatusHistoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    jobType?: JobTypeUpdateOneWithoutJobsNestedInput
    template?: JobTemplateUpdateOneWithoutJobsNestedInput
    workOrders?: WorkOrderUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUpdateManyWithoutJobNestedInput
  }

  export type JobUncheckedUpdateWithoutStatusHistoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    workOrders?: WorkOrderUncheckedUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUncheckedUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUncheckedUpdateManyWithoutJobNestedInput
  }

  export type JobCreateWithoutPhotosInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    jobType?: JobTypeCreateNestedOneWithoutJobsInput
    template?: JobTemplateCreateNestedOneWithoutJobsInput
    workOrders?: WorkOrderCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryCreateNestedManyWithoutJobInput
  }

  export type JobUncheckedCreateWithoutPhotosInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    jobTypeId?: string | null
    templateId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    workOrders?: WorkOrderUncheckedCreateNestedManyWithoutJobInput
    customFieldValues?: JobCustomFieldValueUncheckedCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryUncheckedCreateNestedManyWithoutJobInput
  }

  export type JobCreateOrConnectWithoutPhotosInput = {
    where: JobWhereUniqueInput
    create: XOR<JobCreateWithoutPhotosInput, JobUncheckedCreateWithoutPhotosInput>
  }

  export type JobUpsertWithoutPhotosInput = {
    update: XOR<JobUpdateWithoutPhotosInput, JobUncheckedUpdateWithoutPhotosInput>
    create: XOR<JobCreateWithoutPhotosInput, JobUncheckedCreateWithoutPhotosInput>
    where?: JobWhereInput
  }

  export type JobUpdateToOneWithWhereWithoutPhotosInput = {
    where?: JobWhereInput
    data: XOR<JobUpdateWithoutPhotosInput, JobUncheckedUpdateWithoutPhotosInput>
  }

  export type JobUpdateWithoutPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    jobType?: JobTypeUpdateOneWithoutJobsNestedInput
    template?: JobTemplateUpdateOneWithoutJobsNestedInput
    workOrders?: WorkOrderUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUpdateManyWithoutJobNestedInput
  }

  export type JobUncheckedUpdateWithoutPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    workOrders?: WorkOrderUncheckedUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUncheckedUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUncheckedUpdateManyWithoutJobNestedInput
  }

  export type JobCreateWithoutWorkOrdersInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    jobType?: JobTypeCreateNestedOneWithoutJobsInput
    template?: JobTemplateCreateNestedOneWithoutJobsInput
    customFieldValues?: JobCustomFieldValueCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryCreateNestedManyWithoutJobInput
    photos?: JobPhotoCreateNestedManyWithoutJobInput
  }

  export type JobUncheckedCreateWithoutWorkOrdersInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    jobTypeId?: string | null
    templateId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    customFieldValues?: JobCustomFieldValueUncheckedCreateNestedManyWithoutJobInput
    statusHistory?: JobStatusHistoryUncheckedCreateNestedManyWithoutJobInput
    photos?: JobPhotoUncheckedCreateNestedManyWithoutJobInput
  }

  export type JobCreateOrConnectWithoutWorkOrdersInput = {
    where: JobWhereUniqueInput
    create: XOR<JobCreateWithoutWorkOrdersInput, JobUncheckedCreateWithoutWorkOrdersInput>
  }

  export type WorkOrderLineItemCreateWithoutWorkOrderInput = {
    id?: string
    description: string
    category?: $Enums.PriceCategory
    quantity?: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    lineTotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    priceBookItem?: PriceBookItemCreateNestedOneWithoutLineItemsInput
  }

  export type WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput = {
    id?: string
    priceBookItemId?: string | null
    description: string
    category?: $Enums.PriceCategory
    quantity?: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    lineTotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type WorkOrderLineItemCreateOrConnectWithoutWorkOrderInput = {
    where: WorkOrderLineItemWhereUniqueInput
    create: XOR<WorkOrderLineItemCreateWithoutWorkOrderInput, WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput>
  }

  export type WorkOrderLineItemCreateManyWorkOrderInputEnvelope = {
    data: WorkOrderLineItemCreateManyWorkOrderInput | WorkOrderLineItemCreateManyWorkOrderInput[]
    skipDuplicates?: boolean
  }

  export type WorkOrderTaskCompletionCreateWithoutWorkOrderInput = {
    id?: string
    templateTaskId?: string | null
    isAdHoc?: boolean
    taskName: string
    isRequired?: boolean
    isCompleted?: boolean
    photoUrl?: string | null
    notes?: string | null
    completedAt?: Date | string | null
  }

  export type WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput = {
    id?: string
    templateTaskId?: string | null
    isAdHoc?: boolean
    taskName: string
    isRequired?: boolean
    isCompleted?: boolean
    photoUrl?: string | null
    notes?: string | null
    completedAt?: Date | string | null
  }

  export type WorkOrderTaskCompletionCreateOrConnectWithoutWorkOrderInput = {
    where: WorkOrderTaskCompletionWhereUniqueInput
    create: XOR<WorkOrderTaskCompletionCreateWithoutWorkOrderInput, WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput>
  }

  export type WorkOrderTaskCompletionCreateManyWorkOrderInputEnvelope = {
    data: WorkOrderTaskCompletionCreateManyWorkOrderInput | WorkOrderTaskCompletionCreateManyWorkOrderInput[]
    skipDuplicates?: boolean
  }

  export type JobUpsertWithoutWorkOrdersInput = {
    update: XOR<JobUpdateWithoutWorkOrdersInput, JobUncheckedUpdateWithoutWorkOrdersInput>
    create: XOR<JobCreateWithoutWorkOrdersInput, JobUncheckedCreateWithoutWorkOrdersInput>
    where?: JobWhereInput
  }

  export type JobUpdateToOneWithWhereWithoutWorkOrdersInput = {
    where?: JobWhereInput
    data: XOR<JobUpdateWithoutWorkOrdersInput, JobUncheckedUpdateWithoutWorkOrdersInput>
  }

  export type JobUpdateWithoutWorkOrdersInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    jobType?: JobTypeUpdateOneWithoutJobsNestedInput
    template?: JobTemplateUpdateOneWithoutJobsNestedInput
    customFieldValues?: JobCustomFieldValueUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUpdateManyWithoutJobNestedInput
  }

  export type JobUncheckedUpdateWithoutWorkOrdersInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    customFieldValues?: JobCustomFieldValueUncheckedUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUncheckedUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUncheckedUpdateManyWithoutJobNestedInput
  }

  export type WorkOrderLineItemUpsertWithWhereUniqueWithoutWorkOrderInput = {
    where: WorkOrderLineItemWhereUniqueInput
    update: XOR<WorkOrderLineItemUpdateWithoutWorkOrderInput, WorkOrderLineItemUncheckedUpdateWithoutWorkOrderInput>
    create: XOR<WorkOrderLineItemCreateWithoutWorkOrderInput, WorkOrderLineItemUncheckedCreateWithoutWorkOrderInput>
  }

  export type WorkOrderLineItemUpdateWithWhereUniqueWithoutWorkOrderInput = {
    where: WorkOrderLineItemWhereUniqueInput
    data: XOR<WorkOrderLineItemUpdateWithoutWorkOrderInput, WorkOrderLineItemUncheckedUpdateWithoutWorkOrderInput>
  }

  export type WorkOrderLineItemUpdateManyWithWhereWithoutWorkOrderInput = {
    where: WorkOrderLineItemScalarWhereInput
    data: XOR<WorkOrderLineItemUpdateManyMutationInput, WorkOrderLineItemUncheckedUpdateManyWithoutWorkOrderInput>
  }

  export type WorkOrderTaskCompletionUpsertWithWhereUniqueWithoutWorkOrderInput = {
    where: WorkOrderTaskCompletionWhereUniqueInput
    update: XOR<WorkOrderTaskCompletionUpdateWithoutWorkOrderInput, WorkOrderTaskCompletionUncheckedUpdateWithoutWorkOrderInput>
    create: XOR<WorkOrderTaskCompletionCreateWithoutWorkOrderInput, WorkOrderTaskCompletionUncheckedCreateWithoutWorkOrderInput>
  }

  export type WorkOrderTaskCompletionUpdateWithWhereUniqueWithoutWorkOrderInput = {
    where: WorkOrderTaskCompletionWhereUniqueInput
    data: XOR<WorkOrderTaskCompletionUpdateWithoutWorkOrderInput, WorkOrderTaskCompletionUncheckedUpdateWithoutWorkOrderInput>
  }

  export type WorkOrderTaskCompletionUpdateManyWithWhereWithoutWorkOrderInput = {
    where: WorkOrderTaskCompletionScalarWhereInput
    data: XOR<WorkOrderTaskCompletionUpdateManyMutationInput, WorkOrderTaskCompletionUncheckedUpdateManyWithoutWorkOrderInput>
  }

  export type WorkOrderTaskCompletionScalarWhereInput = {
    AND?: WorkOrderTaskCompletionScalarWhereInput | WorkOrderTaskCompletionScalarWhereInput[]
    OR?: WorkOrderTaskCompletionScalarWhereInput[]
    NOT?: WorkOrderTaskCompletionScalarWhereInput | WorkOrderTaskCompletionScalarWhereInput[]
    id?: StringFilter<"WorkOrderTaskCompletion"> | string
    workOrderId?: StringFilter<"WorkOrderTaskCompletion"> | string
    templateTaskId?: StringNullableFilter<"WorkOrderTaskCompletion"> | string | null
    isAdHoc?: BoolFilter<"WorkOrderTaskCompletion"> | boolean
    taskName?: StringFilter<"WorkOrderTaskCompletion"> | string
    isRequired?: BoolFilter<"WorkOrderTaskCompletion"> | boolean
    isCompleted?: BoolFilter<"WorkOrderTaskCompletion"> | boolean
    photoUrl?: StringNullableFilter<"WorkOrderTaskCompletion"> | string | null
    notes?: StringNullableFilter<"WorkOrderTaskCompletion"> | string | null
    completedAt?: DateTimeNullableFilter<"WorkOrderTaskCompletion"> | Date | string | null
  }

  export type WorkOrderCreateWithoutTaskCompletionsInput = {
    id?: string
    companyId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    job: JobCreateNestedOneWithoutWorkOrdersInput
    lineItems?: WorkOrderLineItemCreateNestedManyWithoutWorkOrderInput
  }

  export type WorkOrderUncheckedCreateWithoutTaskCompletionsInput = {
    id?: string
    companyId: string
    jobId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: WorkOrderLineItemUncheckedCreateNestedManyWithoutWorkOrderInput
  }

  export type WorkOrderCreateOrConnectWithoutTaskCompletionsInput = {
    where: WorkOrderWhereUniqueInput
    create: XOR<WorkOrderCreateWithoutTaskCompletionsInput, WorkOrderUncheckedCreateWithoutTaskCompletionsInput>
  }

  export type WorkOrderUpsertWithoutTaskCompletionsInput = {
    update: XOR<WorkOrderUpdateWithoutTaskCompletionsInput, WorkOrderUncheckedUpdateWithoutTaskCompletionsInput>
    create: XOR<WorkOrderCreateWithoutTaskCompletionsInput, WorkOrderUncheckedCreateWithoutTaskCompletionsInput>
    where?: WorkOrderWhereInput
  }

  export type WorkOrderUpdateToOneWithWhereWithoutTaskCompletionsInput = {
    where?: WorkOrderWhereInput
    data: XOR<WorkOrderUpdateWithoutTaskCompletionsInput, WorkOrderUncheckedUpdateWithoutTaskCompletionsInput>
  }

  export type WorkOrderUpdateWithoutTaskCompletionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    job?: JobUpdateOneRequiredWithoutWorkOrdersNestedInput
    lineItems?: WorkOrderLineItemUpdateManyWithoutWorkOrderNestedInput
  }

  export type WorkOrderUncheckedUpdateWithoutTaskCompletionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: WorkOrderLineItemUncheckedUpdateManyWithoutWorkOrderNestedInput
  }

  export type WorkOrderCreateWithoutLineItemsInput = {
    id?: string
    companyId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    job: JobCreateNestedOneWithoutWorkOrdersInput
    taskCompletions?: WorkOrderTaskCompletionCreateNestedManyWithoutWorkOrderInput
  }

  export type WorkOrderUncheckedCreateWithoutLineItemsInput = {
    id?: string
    companyId: string
    jobId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    taskCompletions?: WorkOrderTaskCompletionUncheckedCreateNestedManyWithoutWorkOrderInput
  }

  export type WorkOrderCreateOrConnectWithoutLineItemsInput = {
    where: WorkOrderWhereUniqueInput
    create: XOR<WorkOrderCreateWithoutLineItemsInput, WorkOrderUncheckedCreateWithoutLineItemsInput>
  }

  export type PriceBookItemCreateWithoutLineItemsInput = {
    id?: string
    companyId: string
    category: $Enums.PriceCategory
    code?: string | null
    name: string
    description?: string | null
    unit?: string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    isActive?: boolean
    jobTypeId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PriceBookItemUncheckedCreateWithoutLineItemsInput = {
    id?: string
    companyId: string
    category: $Enums.PriceCategory
    code?: string | null
    name: string
    description?: string | null
    unit?: string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    isActive?: boolean
    jobTypeId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PriceBookItemCreateOrConnectWithoutLineItemsInput = {
    where: PriceBookItemWhereUniqueInput
    create: XOR<PriceBookItemCreateWithoutLineItemsInput, PriceBookItemUncheckedCreateWithoutLineItemsInput>
  }

  export type WorkOrderUpsertWithoutLineItemsInput = {
    update: XOR<WorkOrderUpdateWithoutLineItemsInput, WorkOrderUncheckedUpdateWithoutLineItemsInput>
    create: XOR<WorkOrderCreateWithoutLineItemsInput, WorkOrderUncheckedCreateWithoutLineItemsInput>
    where?: WorkOrderWhereInput
  }

  export type WorkOrderUpdateToOneWithWhereWithoutLineItemsInput = {
    where?: WorkOrderWhereInput
    data: XOR<WorkOrderUpdateWithoutLineItemsInput, WorkOrderUncheckedUpdateWithoutLineItemsInput>
  }

  export type WorkOrderUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    job?: JobUpdateOneRequiredWithoutWorkOrdersNestedInput
    taskCompletions?: WorkOrderTaskCompletionUpdateManyWithoutWorkOrderNestedInput
  }

  export type WorkOrderUncheckedUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    taskCompletions?: WorkOrderTaskCompletionUncheckedUpdateManyWithoutWorkOrderNestedInput
  }

  export type PriceBookItemUpsertWithoutLineItemsInput = {
    update: XOR<PriceBookItemUpdateWithoutLineItemsInput, PriceBookItemUncheckedUpdateWithoutLineItemsInput>
    create: XOR<PriceBookItemCreateWithoutLineItemsInput, PriceBookItemUncheckedCreateWithoutLineItemsInput>
    where?: PriceBookItemWhereInput
  }

  export type PriceBookItemUpdateToOneWithWhereWithoutLineItemsInput = {
    where?: PriceBookItemWhereInput
    data: XOR<PriceBookItemUpdateWithoutLineItemsInput, PriceBookItemUncheckedUpdateWithoutLineItemsInput>
  }

  export type PriceBookItemUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    code?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: StringFieldUpdateOperationsInput | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceBookItemUncheckedUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    code?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: StringFieldUpdateOperationsInput | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobTemplateCreateManyJobTypeInput = {
    id?: string
    companyId: string
    name: string
    description?: string | null
    estimatedDurationMins?: number
    version?: number
    isActive?: boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type JobCustomFieldDefCreateManyJobTypeInput = {
    id?: string
    companyId: string
    fieldKey: string
    label: string
    fieldType: $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: boolean
    helpText?: string | null
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
  }

  export type JobCreateManyJobTypeInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    templateId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type JobTemplateUpdateWithoutJobTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: JobTemplateTaskUpdateManyWithoutTemplateNestedInput
    jobs?: JobUpdateManyWithoutTemplateNestedInput
  }

  export type JobTemplateUncheckedUpdateWithoutJobTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: JobTemplateTaskUncheckedUpdateManyWithoutTemplateNestedInput
    jobs?: JobUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type JobTemplateUncheckedUpdateManyWithoutJobTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedDurationMins?: IntFieldUpdateOperationsInput | number
    version?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    requiredParts?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCustomFieldDefUpdateWithoutJobTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    fieldKey?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    fieldType?: EnumCustomFieldTypeFieldUpdateOperationsInput | $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    helpText?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    values?: JobCustomFieldValueUpdateManyWithoutFieldDefNestedInput
  }

  export type JobCustomFieldDefUncheckedUpdateWithoutJobTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    fieldKey?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    fieldType?: EnumCustomFieldTypeFieldUpdateOperationsInput | $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    helpText?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    values?: JobCustomFieldValueUncheckedUpdateManyWithoutFieldDefNestedInput
  }

  export type JobCustomFieldDefUncheckedUpdateManyWithoutJobTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    fieldKey?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    fieldType?: EnumCustomFieldTypeFieldUpdateOperationsInput | $Enums.CustomFieldType
    options?: NullableJsonNullValueInput | InputJsonValue
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    helpText?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobUpdateWithoutJobTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    template?: JobTemplateUpdateOneWithoutJobsNestedInput
    workOrders?: WorkOrderUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUpdateManyWithoutJobNestedInput
  }

  export type JobUncheckedUpdateWithoutJobTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    workOrders?: WorkOrderUncheckedUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUncheckedUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUncheckedUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUncheckedUpdateManyWithoutJobNestedInput
  }

  export type JobUncheckedUpdateManyWithoutJobTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type JobTemplateTaskCreateManyTemplateInput = {
    id?: string
    taskName: string
    description?: string | null
    taskOrder: number
    isRequired?: boolean
    photoRequired?: boolean
    safetyNote?: string | null
    estimatedMins?: number | null
    createdAt?: Date | string
  }

  export type JobCreateManyTemplateInput = {
    id?: string
    companyId: string
    jobNumber: string
    customerId: string
    customerName: string
    customerPhone?: string | null
    customerEmail?: string | null
    serviceAddress: string
    serviceCity?: string | null
    serviceState?: string | null
    serviceZip?: string | null
    serviceLatitude?: Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: Decimal | DecimalJsLike | number | string | null
    jobTypeId?: string | null
    title: string
    description?: string | null
    status?: $Enums.JobStatus
    priority?: $Enums.JobPriority
    assignedToId?: string | null
    assignedToName?: string | null
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    actualStart?: Date | string | null
    actualEnd?: Date | string | null
    estimatedDurationMins?: number | null
    travelDistanceKm?: Decimal | DecimalJsLike | number | string | null
    quoteId?: string | null
    invoiceId?: string | null
    notes?: string | null
    internalNotes?: string | null
    tags?: JobCreatetagsInput | string[]
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type JobTemplateTaskUpdateWithoutTemplateInput = {
    id?: StringFieldUpdateOperationsInput | string
    taskName?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    taskOrder?: IntFieldUpdateOperationsInput | number
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    photoRequired?: BoolFieldUpdateOperationsInput | boolean
    safetyNote?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedMins?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobTemplateTaskUncheckedUpdateWithoutTemplateInput = {
    id?: StringFieldUpdateOperationsInput | string
    taskName?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    taskOrder?: IntFieldUpdateOperationsInput | number
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    photoRequired?: BoolFieldUpdateOperationsInput | boolean
    safetyNote?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedMins?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobTemplateTaskUncheckedUpdateManyWithoutTemplateInput = {
    id?: StringFieldUpdateOperationsInput | string
    taskName?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    taskOrder?: IntFieldUpdateOperationsInput | number
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    photoRequired?: BoolFieldUpdateOperationsInput | boolean
    safetyNote?: NullableStringFieldUpdateOperationsInput | string | null
    estimatedMins?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobUpdateWithoutTemplateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    jobType?: JobTypeUpdateOneWithoutJobsNestedInput
    workOrders?: WorkOrderUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUpdateManyWithoutJobNestedInput
  }

  export type JobUncheckedUpdateWithoutTemplateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    workOrders?: WorkOrderUncheckedUpdateManyWithoutJobNestedInput
    customFieldValues?: JobCustomFieldValueUncheckedUpdateManyWithoutJobNestedInput
    statusHistory?: JobStatusHistoryUncheckedUpdateManyWithoutJobNestedInput
    photos?: JobPhotoUncheckedUpdateManyWithoutJobNestedInput
  }

  export type JobUncheckedUpdateManyWithoutTemplateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobNumber?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAddress?: StringFieldUpdateOperationsInput | string
    serviceCity?: NullableStringFieldUpdateOperationsInput | string | null
    serviceState?: NullableStringFieldUpdateOperationsInput | string | null
    serviceZip?: NullableStringFieldUpdateOperationsInput | string | null
    serviceLatitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    serviceLongitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    jobTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: EnumJobPriorityFieldUpdateOperationsInput | $Enums.JobPriority
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    assignedToName?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    actualEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimatedDurationMins?: NullableIntFieldUpdateOperationsInput | number | null
    travelDistanceKm?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    internalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JobUpdatetagsInput | string[]
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type JobCustomFieldValueCreateManyFieldDefInput = {
    id?: string
    jobId: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type JobCustomFieldValueUpdateWithoutFieldDefInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    job?: JobUpdateOneRequiredWithoutCustomFieldValuesNestedInput
  }

  export type JobCustomFieldValueUncheckedUpdateWithoutFieldDefInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCustomFieldValueUncheckedUpdateManyWithoutFieldDefInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderLineItemCreateManyPriceBookItemInput = {
    id?: string
    workOrderId: string
    description: string
    category?: $Enums.PriceCategory
    quantity?: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    lineTotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type WorkOrderLineItemUpdateWithoutPriceBookItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    workOrder?: WorkOrderUpdateOneRequiredWithoutLineItemsNestedInput
  }

  export type WorkOrderLineItemUncheckedUpdateWithoutPriceBookItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderLineItemUncheckedUpdateManyWithoutPriceBookItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderCreateManyJobInput = {
    id?: string
    companyId: string
    workOrderNumber: string
    technicianId: string
    technicianName: string
    status?: $Enums.WorkOrderStatus
    scheduledStart?: Date | string | null
    scheduledEnd?: Date | string | null
    checkinAt?: Date | string | null
    checkoutAt?: Date | string | null
    signatureUrl?: string | null
    technicianNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type JobCustomFieldValueCreateManyJobInput = {
    id?: string
    fieldDefId: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type JobStatusHistoryCreateManyJobInput = {
    id?: string
    fromStatus?: $Enums.JobStatus | null
    toStatus: $Enums.JobStatus
    changedById: string
    changedByName: string
    note?: string | null
    createdAt?: Date | string
  }

  export type JobPhotoCreateManyJobInput = {
    id?: string
    workOrderId?: string | null
    s3Key: string
    caption?: string | null
    photoType?: $Enums.PhotoType
    uploadedById: string
    createdAt?: Date | string
  }

  export type WorkOrderUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: WorkOrderLineItemUpdateManyWithoutWorkOrderNestedInput
    taskCompletions?: WorkOrderTaskCompletionUpdateManyWithoutWorkOrderNestedInput
  }

  export type WorkOrderUncheckedUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: WorkOrderLineItemUncheckedUpdateManyWithoutWorkOrderNestedInput
    taskCompletions?: WorkOrderTaskCompletionUncheckedUpdateManyWithoutWorkOrderNestedInput
  }

  export type WorkOrderUncheckedUpdateManyWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    workOrderNumber?: StringFieldUpdateOperationsInput | string
    technicianId?: StringFieldUpdateOperationsInput | string
    technicianName?: StringFieldUpdateOperationsInput | string
    status?: EnumWorkOrderStatusFieldUpdateOperationsInput | $Enums.WorkOrderStatus
    scheduledStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scheduledEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkinAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkoutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    signatureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    technicianNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCustomFieldValueUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fieldDef?: JobCustomFieldDefUpdateOneRequiredWithoutValuesNestedInput
  }

  export type JobCustomFieldValueUncheckedUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    fieldDefId?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCustomFieldValueUncheckedUpdateManyWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    fieldDefId?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobStatusHistoryUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromStatus?: NullableEnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    changedById?: StringFieldUpdateOperationsInput | string
    changedByName?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobStatusHistoryUncheckedUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromStatus?: NullableEnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    changedById?: StringFieldUpdateOperationsInput | string
    changedByName?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobStatusHistoryUncheckedUpdateManyWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromStatus?: NullableEnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus | null
    toStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    changedById?: StringFieldUpdateOperationsInput | string
    changedByName?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobPhotoUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    s3Key?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    photoType?: EnumPhotoTypeFieldUpdateOperationsInput | $Enums.PhotoType
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobPhotoUncheckedUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    s3Key?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    photoType?: EnumPhotoTypeFieldUpdateOperationsInput | $Enums.PhotoType
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobPhotoUncheckedUpdateManyWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    s3Key?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    photoType?: EnumPhotoTypeFieldUpdateOperationsInput | $Enums.PhotoType
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderLineItemCreateManyWorkOrderInput = {
    id?: string
    priceBookItemId?: string | null
    description: string
    category?: $Enums.PriceCategory
    quantity?: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    lineTotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type WorkOrderTaskCompletionCreateManyWorkOrderInput = {
    id?: string
    templateTaskId?: string | null
    isAdHoc?: boolean
    taskName: string
    isRequired?: boolean
    isCompleted?: boolean
    photoUrl?: string | null
    notes?: string | null
    completedAt?: Date | string | null
  }

  export type WorkOrderLineItemUpdateWithoutWorkOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceBookItem?: PriceBookItemUpdateOneWithoutLineItemsNestedInput
  }

  export type WorkOrderLineItemUncheckedUpdateWithoutWorkOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderLineItemUncheckedUpdateManyWithoutWorkOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumPriceCategoryFieldUpdateOperationsInput | $Enums.PriceCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkOrderTaskCompletionUpdateWithoutWorkOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    templateTaskId?: NullableStringFieldUpdateOperationsInput | string | null
    isAdHoc?: BoolFieldUpdateOperationsInput | boolean
    taskName?: StringFieldUpdateOperationsInput | string
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WorkOrderTaskCompletionUncheckedUpdateWithoutWorkOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    templateTaskId?: NullableStringFieldUpdateOperationsInput | string | null
    isAdHoc?: BoolFieldUpdateOperationsInput | boolean
    taskName?: StringFieldUpdateOperationsInput | string
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WorkOrderTaskCompletionUncheckedUpdateManyWithoutWorkOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    templateTaskId?: NullableStringFieldUpdateOperationsInput | string | null
    isAdHoc?: BoolFieldUpdateOperationsInput | boolean
    taskName?: StringFieldUpdateOperationsInput | string
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    isCompleted?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use JobTypeCountOutputTypeDefaultArgs instead
     */
    export type JobTypeCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobTypeCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobTemplateCountOutputTypeDefaultArgs instead
     */
    export type JobTemplateCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobTemplateCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobCustomFieldDefCountOutputTypeDefaultArgs instead
     */
    export type JobCustomFieldDefCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobCustomFieldDefCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PriceBookItemCountOutputTypeDefaultArgs instead
     */
    export type PriceBookItemCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PriceBookItemCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobCountOutputTypeDefaultArgs instead
     */
    export type JobCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WorkOrderCountOutputTypeDefaultArgs instead
     */
    export type WorkOrderCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WorkOrderCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobTypeDefaultArgs instead
     */
    export type JobTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobTemplateDefaultArgs instead
     */
    export type JobTemplateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobTemplateDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobTemplateTaskDefaultArgs instead
     */
    export type JobTemplateTaskArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobTemplateTaskDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobCustomFieldDefDefaultArgs instead
     */
    export type JobCustomFieldDefArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobCustomFieldDefDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobCustomFieldValueDefaultArgs instead
     */
    export type JobCustomFieldValueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobCustomFieldValueDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PriceBookItemDefaultArgs instead
     */
    export type PriceBookItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PriceBookItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobDefaultArgs instead
     */
    export type JobArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobStatusHistoryDefaultArgs instead
     */
    export type JobStatusHistoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobStatusHistoryDefaultArgs<ExtArgs>
    /**
     * @deprecated Use JobPhotoDefaultArgs instead
     */
    export type JobPhotoArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = JobPhotoDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WorkOrderDefaultArgs instead
     */
    export type WorkOrderArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WorkOrderDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WorkOrderTaskCompletionDefaultArgs instead
     */
    export type WorkOrderTaskCompletionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WorkOrderTaskCompletionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WorkOrderLineItemDefaultArgs instead
     */
    export type WorkOrderLineItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WorkOrderLineItemDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}