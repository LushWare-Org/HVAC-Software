
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
 * Model Campaign
 * 
 */
export type Campaign = $Result.DefaultSelection<Prisma.$CampaignPayload>
/**
 * Model Template
 * 
 */
export type Template = $Result.DefaultSelection<Prisma.$TemplatePayload>
/**
 * Model Audience
 * 
 */
export type Audience = $Result.DefaultSelection<Prisma.$AudiencePayload>
/**
 * Model SendJob
 * 
 */
export type SendJob = $Result.DefaultSelection<Prisma.$SendJobPayload>
/**
 * Model SendEvent
 * 
 */
export type SendEvent = $Result.DefaultSelection<Prisma.$SendEventPayload>
/**
 * Model Suppression
 * 
 */
export type Suppression = $Result.DefaultSelection<Prisma.$SuppressionPayload>
/**
 * Model ReviewRequest
 * 
 */
export type ReviewRequest = $Result.DefaultSelection<Prisma.$ReviewRequestPayload>
/**
 * Model MarketingAttribution
 * 
 */
export type MarketingAttribution = $Result.DefaultSelection<Prisma.$MarketingAttributionPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const MarketingChannel: {
  EMAIL: 'EMAIL',
  SMS: 'SMS'
};

export type MarketingChannel = (typeof MarketingChannel)[keyof typeof MarketingChannel]


export const AudienceType: {
  STATIC: 'STATIC',
  DYNAMIC: 'DYNAMIC'
};

export type AudienceType = (typeof AudienceType)[keyof typeof AudienceType]


export const SendJobStatus: {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  SENT: 'SENT',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED'
};

export type SendJobStatus = (typeof SendJobStatus)[keyof typeof SendJobStatus]


export const SendEventType: {
  DELIVERED: 'DELIVERED',
  OPENED: 'OPENED',
  CLICKED: 'CLICKED',
  BOUNCED: 'BOUNCED',
  UNSUBSCRIBED: 'UNSUBSCRIBED',
  COMPLAINED: 'COMPLAINED'
};

export type SendEventType = (typeof SendEventType)[keyof typeof SendEventType]


export const SuppressionReason: {
  UNSUBSCRIBED: 'UNSUBSCRIBED',
  BOUNCED: 'BOUNCED',
  COMPLAINED: 'COMPLAINED',
  MANUAL: 'MANUAL'
};

export type SuppressionReason = (typeof SuppressionReason)[keyof typeof SuppressionReason]


export const ReviewRequestStatus: {
  PENDING: 'PENDING',
  CLICKED: 'CLICKED',
  REVIEWED: 'REVIEWED',
  EXPIRED: 'EXPIRED'
};

export type ReviewRequestStatus = (typeof ReviewRequestStatus)[keyof typeof ReviewRequestStatus]

}

export type MarketingChannel = $Enums.MarketingChannel

export const MarketingChannel: typeof $Enums.MarketingChannel

export type AudienceType = $Enums.AudienceType

export const AudienceType: typeof $Enums.AudienceType

export type SendJobStatus = $Enums.SendJobStatus

export const SendJobStatus: typeof $Enums.SendJobStatus

export type SendEventType = $Enums.SendEventType

export const SendEventType: typeof $Enums.SendEventType

export type SuppressionReason = $Enums.SuppressionReason

export const SuppressionReason: typeof $Enums.SuppressionReason

export type ReviewRequestStatus = $Enums.ReviewRequestStatus

export const ReviewRequestStatus: typeof $Enums.ReviewRequestStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Campaigns
 * const campaigns = await prisma.campaign.findMany()
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
   * // Fetch zero or more Campaigns
   * const campaigns = await prisma.campaign.findMany()
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
   * `prisma.campaign`: Exposes CRUD operations for the **Campaign** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Campaigns
    * const campaigns = await prisma.campaign.findMany()
    * ```
    */
  get campaign(): Prisma.CampaignDelegate<ExtArgs>;

  /**
   * `prisma.template`: Exposes CRUD operations for the **Template** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Templates
    * const templates = await prisma.template.findMany()
    * ```
    */
  get template(): Prisma.TemplateDelegate<ExtArgs>;

  /**
   * `prisma.audience`: Exposes CRUD operations for the **Audience** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Audiences
    * const audiences = await prisma.audience.findMany()
    * ```
    */
  get audience(): Prisma.AudienceDelegate<ExtArgs>;

  /**
   * `prisma.sendJob`: Exposes CRUD operations for the **SendJob** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SendJobs
    * const sendJobs = await prisma.sendJob.findMany()
    * ```
    */
  get sendJob(): Prisma.SendJobDelegate<ExtArgs>;

  /**
   * `prisma.sendEvent`: Exposes CRUD operations for the **SendEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SendEvents
    * const sendEvents = await prisma.sendEvent.findMany()
    * ```
    */
  get sendEvent(): Prisma.SendEventDelegate<ExtArgs>;

  /**
   * `prisma.suppression`: Exposes CRUD operations for the **Suppression** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Suppressions
    * const suppressions = await prisma.suppression.findMany()
    * ```
    */
  get suppression(): Prisma.SuppressionDelegate<ExtArgs>;

  /**
   * `prisma.reviewRequest`: Exposes CRUD operations for the **ReviewRequest** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ReviewRequests
    * const reviewRequests = await prisma.reviewRequest.findMany()
    * ```
    */
  get reviewRequest(): Prisma.ReviewRequestDelegate<ExtArgs>;

  /**
   * `prisma.marketingAttribution`: Exposes CRUD operations for the **MarketingAttribution** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MarketingAttributions
    * const marketingAttributions = await prisma.marketingAttribution.findMany()
    * ```
    */
  get marketingAttribution(): Prisma.MarketingAttributionDelegate<ExtArgs>;
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
    Campaign: 'Campaign',
    Template: 'Template',
    Audience: 'Audience',
    SendJob: 'SendJob',
    SendEvent: 'SendEvent',
    Suppression: 'Suppression',
    ReviewRequest: 'ReviewRequest',
    MarketingAttribution: 'MarketingAttribution'
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
      modelProps: "campaign" | "template" | "audience" | "sendJob" | "sendEvent" | "suppression" | "reviewRequest" | "marketingAttribution"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Campaign: {
        payload: Prisma.$CampaignPayload<ExtArgs>
        fields: Prisma.CampaignFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CampaignFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CampaignFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          findFirst: {
            args: Prisma.CampaignFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CampaignFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          findMany: {
            args: Prisma.CampaignFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>[]
          }
          create: {
            args: Prisma.CampaignCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          createMany: {
            args: Prisma.CampaignCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CampaignCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>[]
          }
          delete: {
            args: Prisma.CampaignDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          update: {
            args: Prisma.CampaignUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          deleteMany: {
            args: Prisma.CampaignDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CampaignUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CampaignUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          aggregate: {
            args: Prisma.CampaignAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCampaign>
          }
          groupBy: {
            args: Prisma.CampaignGroupByArgs<ExtArgs>
            result: $Utils.Optional<CampaignGroupByOutputType>[]
          }
          count: {
            args: Prisma.CampaignCountArgs<ExtArgs>
            result: $Utils.Optional<CampaignCountAggregateOutputType> | number
          }
        }
      }
      Template: {
        payload: Prisma.$TemplatePayload<ExtArgs>
        fields: Prisma.TemplateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TemplateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TemplateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          findFirst: {
            args: Prisma.TemplateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TemplateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          findMany: {
            args: Prisma.TemplateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>[]
          }
          create: {
            args: Prisma.TemplateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          createMany: {
            args: Prisma.TemplateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TemplateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>[]
          }
          delete: {
            args: Prisma.TemplateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          update: {
            args: Prisma.TemplateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          deleteMany: {
            args: Prisma.TemplateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TemplateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TemplateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          aggregate: {
            args: Prisma.TemplateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTemplate>
          }
          groupBy: {
            args: Prisma.TemplateGroupByArgs<ExtArgs>
            result: $Utils.Optional<TemplateGroupByOutputType>[]
          }
          count: {
            args: Prisma.TemplateCountArgs<ExtArgs>
            result: $Utils.Optional<TemplateCountAggregateOutputType> | number
          }
        }
      }
      Audience: {
        payload: Prisma.$AudiencePayload<ExtArgs>
        fields: Prisma.AudienceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AudienceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AudienceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload>
          }
          findFirst: {
            args: Prisma.AudienceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AudienceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload>
          }
          findMany: {
            args: Prisma.AudienceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload>[]
          }
          create: {
            args: Prisma.AudienceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload>
          }
          createMany: {
            args: Prisma.AudienceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AudienceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload>[]
          }
          delete: {
            args: Prisma.AudienceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload>
          }
          update: {
            args: Prisma.AudienceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload>
          }
          deleteMany: {
            args: Prisma.AudienceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AudienceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AudienceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AudiencePayload>
          }
          aggregate: {
            args: Prisma.AudienceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAudience>
          }
          groupBy: {
            args: Prisma.AudienceGroupByArgs<ExtArgs>
            result: $Utils.Optional<AudienceGroupByOutputType>[]
          }
          count: {
            args: Prisma.AudienceCountArgs<ExtArgs>
            result: $Utils.Optional<AudienceCountAggregateOutputType> | number
          }
        }
      }
      SendJob: {
        payload: Prisma.$SendJobPayload<ExtArgs>
        fields: Prisma.SendJobFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SendJobFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SendJobFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload>
          }
          findFirst: {
            args: Prisma.SendJobFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SendJobFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload>
          }
          findMany: {
            args: Prisma.SendJobFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload>[]
          }
          create: {
            args: Prisma.SendJobCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload>
          }
          createMany: {
            args: Prisma.SendJobCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SendJobCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload>[]
          }
          delete: {
            args: Prisma.SendJobDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload>
          }
          update: {
            args: Prisma.SendJobUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload>
          }
          deleteMany: {
            args: Prisma.SendJobDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SendJobUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SendJobUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendJobPayload>
          }
          aggregate: {
            args: Prisma.SendJobAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSendJob>
          }
          groupBy: {
            args: Prisma.SendJobGroupByArgs<ExtArgs>
            result: $Utils.Optional<SendJobGroupByOutputType>[]
          }
          count: {
            args: Prisma.SendJobCountArgs<ExtArgs>
            result: $Utils.Optional<SendJobCountAggregateOutputType> | number
          }
        }
      }
      SendEvent: {
        payload: Prisma.$SendEventPayload<ExtArgs>
        fields: Prisma.SendEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SendEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SendEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload>
          }
          findFirst: {
            args: Prisma.SendEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SendEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload>
          }
          findMany: {
            args: Prisma.SendEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload>[]
          }
          create: {
            args: Prisma.SendEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload>
          }
          createMany: {
            args: Prisma.SendEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SendEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload>[]
          }
          delete: {
            args: Prisma.SendEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload>
          }
          update: {
            args: Prisma.SendEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload>
          }
          deleteMany: {
            args: Prisma.SendEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SendEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SendEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SendEventPayload>
          }
          aggregate: {
            args: Prisma.SendEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSendEvent>
          }
          groupBy: {
            args: Prisma.SendEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<SendEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.SendEventCountArgs<ExtArgs>
            result: $Utils.Optional<SendEventCountAggregateOutputType> | number
          }
        }
      }
      Suppression: {
        payload: Prisma.$SuppressionPayload<ExtArgs>
        fields: Prisma.SuppressionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SuppressionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SuppressionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload>
          }
          findFirst: {
            args: Prisma.SuppressionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SuppressionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload>
          }
          findMany: {
            args: Prisma.SuppressionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload>[]
          }
          create: {
            args: Prisma.SuppressionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload>
          }
          createMany: {
            args: Prisma.SuppressionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SuppressionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload>[]
          }
          delete: {
            args: Prisma.SuppressionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload>
          }
          update: {
            args: Prisma.SuppressionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload>
          }
          deleteMany: {
            args: Prisma.SuppressionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SuppressionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SuppressionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuppressionPayload>
          }
          aggregate: {
            args: Prisma.SuppressionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSuppression>
          }
          groupBy: {
            args: Prisma.SuppressionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SuppressionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SuppressionCountArgs<ExtArgs>
            result: $Utils.Optional<SuppressionCountAggregateOutputType> | number
          }
        }
      }
      ReviewRequest: {
        payload: Prisma.$ReviewRequestPayload<ExtArgs>
        fields: Prisma.ReviewRequestFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReviewRequestFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReviewRequestFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload>
          }
          findFirst: {
            args: Prisma.ReviewRequestFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReviewRequestFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload>
          }
          findMany: {
            args: Prisma.ReviewRequestFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload>[]
          }
          create: {
            args: Prisma.ReviewRequestCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload>
          }
          createMany: {
            args: Prisma.ReviewRequestCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReviewRequestCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload>[]
          }
          delete: {
            args: Prisma.ReviewRequestDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload>
          }
          update: {
            args: Prisma.ReviewRequestUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload>
          }
          deleteMany: {
            args: Prisma.ReviewRequestDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReviewRequestUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ReviewRequestUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewRequestPayload>
          }
          aggregate: {
            args: Prisma.ReviewRequestAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReviewRequest>
          }
          groupBy: {
            args: Prisma.ReviewRequestGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReviewRequestGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReviewRequestCountArgs<ExtArgs>
            result: $Utils.Optional<ReviewRequestCountAggregateOutputType> | number
          }
        }
      }
      MarketingAttribution: {
        payload: Prisma.$MarketingAttributionPayload<ExtArgs>
        fields: Prisma.MarketingAttributionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MarketingAttributionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MarketingAttributionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload>
          }
          findFirst: {
            args: Prisma.MarketingAttributionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MarketingAttributionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload>
          }
          findMany: {
            args: Prisma.MarketingAttributionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload>[]
          }
          create: {
            args: Prisma.MarketingAttributionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload>
          }
          createMany: {
            args: Prisma.MarketingAttributionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MarketingAttributionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload>[]
          }
          delete: {
            args: Prisma.MarketingAttributionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload>
          }
          update: {
            args: Prisma.MarketingAttributionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload>
          }
          deleteMany: {
            args: Prisma.MarketingAttributionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MarketingAttributionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MarketingAttributionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketingAttributionPayload>
          }
          aggregate: {
            args: Prisma.MarketingAttributionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMarketingAttribution>
          }
          groupBy: {
            args: Prisma.MarketingAttributionGroupByArgs<ExtArgs>
            result: $Utils.Optional<MarketingAttributionGroupByOutputType>[]
          }
          count: {
            args: Prisma.MarketingAttributionCountArgs<ExtArgs>
            result: $Utils.Optional<MarketingAttributionCountAggregateOutputType> | number
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
   * Count Type CampaignCountOutputType
   */

  export type CampaignCountOutputType = {
    sendJobs: number
  }

  export type CampaignCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sendJobs?: boolean | CampaignCountOutputTypeCountSendJobsArgs
  }

  // Custom InputTypes
  /**
   * CampaignCountOutputType without action
   */
  export type CampaignCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CampaignCountOutputType
     */
    select?: CampaignCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CampaignCountOutputType without action
   */
  export type CampaignCountOutputTypeCountSendJobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SendJobWhereInput
  }


  /**
   * Count Type SendJobCountOutputType
   */

  export type SendJobCountOutputType = {
    events: number
  }

  export type SendJobCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    events?: boolean | SendJobCountOutputTypeCountEventsArgs
  }

  // Custom InputTypes
  /**
   * SendJobCountOutputType without action
   */
  export type SendJobCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJobCountOutputType
     */
    select?: SendJobCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SendJobCountOutputType without action
   */
  export type SendJobCountOutputTypeCountEventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SendEventWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Campaign
   */

  export type AggregateCampaign = {
    _count: CampaignCountAggregateOutputType | null
    _min: CampaignMinAggregateOutputType | null
    _max: CampaignMaxAggregateOutputType | null
  }

  export type CampaignMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    channel: $Enums.MarketingChannel | null
    status: string | null
    audienceId: string | null
    templateId: string | null
    scheduleAt: Date | null
    createdBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CampaignMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    channel: $Enums.MarketingChannel | null
    status: string | null
    audienceId: string | null
    templateId: string | null
    scheduleAt: Date | null
    createdBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CampaignCountAggregateOutputType = {
    id: number
    companyId: number
    name: number
    channel: number
    status: number
    audienceId: number
    templateId: number
    scheduleAt: number
    createdBy: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CampaignMinAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    channel?: true
    status?: true
    audienceId?: true
    templateId?: true
    scheduleAt?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CampaignMaxAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    channel?: true
    status?: true
    audienceId?: true
    templateId?: true
    scheduleAt?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CampaignCountAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    channel?: true
    status?: true
    audienceId?: true
    templateId?: true
    scheduleAt?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CampaignAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Campaign to aggregate.
     */
    where?: CampaignWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Campaigns to fetch.
     */
    orderBy?: CampaignOrderByWithRelationInput | CampaignOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CampaignWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Campaigns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Campaigns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Campaigns
    **/
    _count?: true | CampaignCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CampaignMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CampaignMaxAggregateInputType
  }

  export type GetCampaignAggregateType<T extends CampaignAggregateArgs> = {
        [P in keyof T & keyof AggregateCampaign]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCampaign[P]>
      : GetScalarType<T[P], AggregateCampaign[P]>
  }




  export type CampaignGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CampaignWhereInput
    orderBy?: CampaignOrderByWithAggregationInput | CampaignOrderByWithAggregationInput[]
    by: CampaignScalarFieldEnum[] | CampaignScalarFieldEnum
    having?: CampaignScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CampaignCountAggregateInputType | true
    _min?: CampaignMinAggregateInputType
    _max?: CampaignMaxAggregateInputType
  }

  export type CampaignGroupByOutputType = {
    id: string
    companyId: string
    name: string
    channel: $Enums.MarketingChannel
    status: string
    audienceId: string | null
    templateId: string | null
    scheduleAt: Date | null
    createdBy: string
    createdAt: Date
    updatedAt: Date
    _count: CampaignCountAggregateOutputType | null
    _min: CampaignMinAggregateOutputType | null
    _max: CampaignMaxAggregateOutputType | null
  }

  type GetCampaignGroupByPayload<T extends CampaignGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CampaignGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CampaignGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CampaignGroupByOutputType[P]>
            : GetScalarType<T[P], CampaignGroupByOutputType[P]>
        }
      >
    >


  export type CampaignSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    channel?: boolean
    status?: boolean
    audienceId?: boolean
    templateId?: boolean
    scheduleAt?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sendJobs?: boolean | Campaign$sendJobsArgs<ExtArgs>
    _count?: boolean | CampaignCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["campaign"]>

  export type CampaignSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    channel?: boolean
    status?: boolean
    audienceId?: boolean
    templateId?: boolean
    scheduleAt?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["campaign"]>

  export type CampaignSelectScalar = {
    id?: boolean
    companyId?: boolean
    name?: boolean
    channel?: boolean
    status?: boolean
    audienceId?: boolean
    templateId?: boolean
    scheduleAt?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CampaignInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sendJobs?: boolean | Campaign$sendJobsArgs<ExtArgs>
    _count?: boolean | CampaignCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CampaignIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CampaignPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Campaign"
    objects: {
      sendJobs: Prisma.$SendJobPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      name: string
      channel: $Enums.MarketingChannel
      status: string
      audienceId: string | null
      templateId: string | null
      scheduleAt: Date | null
      createdBy: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["campaign"]>
    composites: {}
  }

  type CampaignGetPayload<S extends boolean | null | undefined | CampaignDefaultArgs> = $Result.GetResult<Prisma.$CampaignPayload, S>

  type CampaignCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CampaignFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CampaignCountAggregateInputType | true
    }

  export interface CampaignDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Campaign'], meta: { name: 'Campaign' } }
    /**
     * Find zero or one Campaign that matches the filter.
     * @param {CampaignFindUniqueArgs} args - Arguments to find a Campaign
     * @example
     * // Get one Campaign
     * const campaign = await prisma.campaign.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CampaignFindUniqueArgs>(args: SelectSubset<T, CampaignFindUniqueArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Campaign that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CampaignFindUniqueOrThrowArgs} args - Arguments to find a Campaign
     * @example
     * // Get one Campaign
     * const campaign = await prisma.campaign.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CampaignFindUniqueOrThrowArgs>(args: SelectSubset<T, CampaignFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Campaign that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignFindFirstArgs} args - Arguments to find a Campaign
     * @example
     * // Get one Campaign
     * const campaign = await prisma.campaign.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CampaignFindFirstArgs>(args?: SelectSubset<T, CampaignFindFirstArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Campaign that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignFindFirstOrThrowArgs} args - Arguments to find a Campaign
     * @example
     * // Get one Campaign
     * const campaign = await prisma.campaign.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CampaignFindFirstOrThrowArgs>(args?: SelectSubset<T, CampaignFindFirstOrThrowArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Campaigns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Campaigns
     * const campaigns = await prisma.campaign.findMany()
     * 
     * // Get first 10 Campaigns
     * const campaigns = await prisma.campaign.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const campaignWithIdOnly = await prisma.campaign.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CampaignFindManyArgs>(args?: SelectSubset<T, CampaignFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Campaign.
     * @param {CampaignCreateArgs} args - Arguments to create a Campaign.
     * @example
     * // Create one Campaign
     * const Campaign = await prisma.campaign.create({
     *   data: {
     *     // ... data to create a Campaign
     *   }
     * })
     * 
     */
    create<T extends CampaignCreateArgs>(args: SelectSubset<T, CampaignCreateArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Campaigns.
     * @param {CampaignCreateManyArgs} args - Arguments to create many Campaigns.
     * @example
     * // Create many Campaigns
     * const campaign = await prisma.campaign.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CampaignCreateManyArgs>(args?: SelectSubset<T, CampaignCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Campaigns and returns the data saved in the database.
     * @param {CampaignCreateManyAndReturnArgs} args - Arguments to create many Campaigns.
     * @example
     * // Create many Campaigns
     * const campaign = await prisma.campaign.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Campaigns and only return the `id`
     * const campaignWithIdOnly = await prisma.campaign.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CampaignCreateManyAndReturnArgs>(args?: SelectSubset<T, CampaignCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Campaign.
     * @param {CampaignDeleteArgs} args - Arguments to delete one Campaign.
     * @example
     * // Delete one Campaign
     * const Campaign = await prisma.campaign.delete({
     *   where: {
     *     // ... filter to delete one Campaign
     *   }
     * })
     * 
     */
    delete<T extends CampaignDeleteArgs>(args: SelectSubset<T, CampaignDeleteArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Campaign.
     * @param {CampaignUpdateArgs} args - Arguments to update one Campaign.
     * @example
     * // Update one Campaign
     * const campaign = await prisma.campaign.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CampaignUpdateArgs>(args: SelectSubset<T, CampaignUpdateArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Campaigns.
     * @param {CampaignDeleteManyArgs} args - Arguments to filter Campaigns to delete.
     * @example
     * // Delete a few Campaigns
     * const { count } = await prisma.campaign.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CampaignDeleteManyArgs>(args?: SelectSubset<T, CampaignDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Campaigns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Campaigns
     * const campaign = await prisma.campaign.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CampaignUpdateManyArgs>(args: SelectSubset<T, CampaignUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Campaign.
     * @param {CampaignUpsertArgs} args - Arguments to update or create a Campaign.
     * @example
     * // Update or create a Campaign
     * const campaign = await prisma.campaign.upsert({
     *   create: {
     *     // ... data to create a Campaign
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Campaign we want to update
     *   }
     * })
     */
    upsert<T extends CampaignUpsertArgs>(args: SelectSubset<T, CampaignUpsertArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Campaigns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignCountArgs} args - Arguments to filter Campaigns to count.
     * @example
     * // Count the number of Campaigns
     * const count = await prisma.campaign.count({
     *   where: {
     *     // ... the filter for the Campaigns we want to count
     *   }
     * })
    **/
    count<T extends CampaignCountArgs>(
      args?: Subset<T, CampaignCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CampaignCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Campaign.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CampaignAggregateArgs>(args: Subset<T, CampaignAggregateArgs>): Prisma.PrismaPromise<GetCampaignAggregateType<T>>

    /**
     * Group by Campaign.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignGroupByArgs} args - Group by arguments.
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
      T extends CampaignGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CampaignGroupByArgs['orderBy'] }
        : { orderBy?: CampaignGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CampaignGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCampaignGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Campaign model
   */
  readonly fields: CampaignFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Campaign.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CampaignClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sendJobs<T extends Campaign$sendJobsArgs<ExtArgs> = {}>(args?: Subset<T, Campaign$sendJobsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the Campaign model
   */ 
  interface CampaignFieldRefs {
    readonly id: FieldRef<"Campaign", 'String'>
    readonly companyId: FieldRef<"Campaign", 'String'>
    readonly name: FieldRef<"Campaign", 'String'>
    readonly channel: FieldRef<"Campaign", 'MarketingChannel'>
    readonly status: FieldRef<"Campaign", 'String'>
    readonly audienceId: FieldRef<"Campaign", 'String'>
    readonly templateId: FieldRef<"Campaign", 'String'>
    readonly scheduleAt: FieldRef<"Campaign", 'DateTime'>
    readonly createdBy: FieldRef<"Campaign", 'String'>
    readonly createdAt: FieldRef<"Campaign", 'DateTime'>
    readonly updatedAt: FieldRef<"Campaign", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Campaign findUnique
   */
  export type CampaignFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaign to fetch.
     */
    where: CampaignWhereUniqueInput
  }

  /**
   * Campaign findUniqueOrThrow
   */
  export type CampaignFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaign to fetch.
     */
    where: CampaignWhereUniqueInput
  }

  /**
   * Campaign findFirst
   */
  export type CampaignFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaign to fetch.
     */
    where?: CampaignWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Campaigns to fetch.
     */
    orderBy?: CampaignOrderByWithRelationInput | CampaignOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Campaigns.
     */
    cursor?: CampaignWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Campaigns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Campaigns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Campaigns.
     */
    distinct?: CampaignScalarFieldEnum | CampaignScalarFieldEnum[]
  }

  /**
   * Campaign findFirstOrThrow
   */
  export type CampaignFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaign to fetch.
     */
    where?: CampaignWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Campaigns to fetch.
     */
    orderBy?: CampaignOrderByWithRelationInput | CampaignOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Campaigns.
     */
    cursor?: CampaignWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Campaigns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Campaigns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Campaigns.
     */
    distinct?: CampaignScalarFieldEnum | CampaignScalarFieldEnum[]
  }

  /**
   * Campaign findMany
   */
  export type CampaignFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaigns to fetch.
     */
    where?: CampaignWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Campaigns to fetch.
     */
    orderBy?: CampaignOrderByWithRelationInput | CampaignOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Campaigns.
     */
    cursor?: CampaignWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Campaigns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Campaigns.
     */
    skip?: number
    distinct?: CampaignScalarFieldEnum | CampaignScalarFieldEnum[]
  }

  /**
   * Campaign create
   */
  export type CampaignCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * The data needed to create a Campaign.
     */
    data: XOR<CampaignCreateInput, CampaignUncheckedCreateInput>
  }

  /**
   * Campaign createMany
   */
  export type CampaignCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Campaigns.
     */
    data: CampaignCreateManyInput | CampaignCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Campaign createManyAndReturn
   */
  export type CampaignCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Campaigns.
     */
    data: CampaignCreateManyInput | CampaignCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Campaign update
   */
  export type CampaignUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * The data needed to update a Campaign.
     */
    data: XOR<CampaignUpdateInput, CampaignUncheckedUpdateInput>
    /**
     * Choose, which Campaign to update.
     */
    where: CampaignWhereUniqueInput
  }

  /**
   * Campaign updateMany
   */
  export type CampaignUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Campaigns.
     */
    data: XOR<CampaignUpdateManyMutationInput, CampaignUncheckedUpdateManyInput>
    /**
     * Filter which Campaigns to update
     */
    where?: CampaignWhereInput
  }

  /**
   * Campaign upsert
   */
  export type CampaignUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * The filter to search for the Campaign to update in case it exists.
     */
    where: CampaignWhereUniqueInput
    /**
     * In case the Campaign found by the `where` argument doesn't exist, create a new Campaign with this data.
     */
    create: XOR<CampaignCreateInput, CampaignUncheckedCreateInput>
    /**
     * In case the Campaign was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CampaignUpdateInput, CampaignUncheckedUpdateInput>
  }

  /**
   * Campaign delete
   */
  export type CampaignDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter which Campaign to delete.
     */
    where: CampaignWhereUniqueInput
  }

  /**
   * Campaign deleteMany
   */
  export type CampaignDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Campaigns to delete
     */
    where?: CampaignWhereInput
  }

  /**
   * Campaign.sendJobs
   */
  export type Campaign$sendJobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    where?: SendJobWhereInput
    orderBy?: SendJobOrderByWithRelationInput | SendJobOrderByWithRelationInput[]
    cursor?: SendJobWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SendJobScalarFieldEnum | SendJobScalarFieldEnum[]
  }

  /**
   * Campaign without action
   */
  export type CampaignDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
  }


  /**
   * Model Template
   */

  export type AggregateTemplate = {
    _count: TemplateCountAggregateOutputType | null
    _min: TemplateMinAggregateOutputType | null
    _max: TemplateMaxAggregateOutputType | null
  }

  export type TemplateMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    channel: $Enums.MarketingChannel | null
    name: string | null
    subject: string | null
    htmlBody: string | null
    smsBody: string | null
    mergeTagsJson: string | null
    isDefault: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    channel: $Enums.MarketingChannel | null
    name: string | null
    subject: string | null
    htmlBody: string | null
    smsBody: string | null
    mergeTagsJson: string | null
    isDefault: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateCountAggregateOutputType = {
    id: number
    companyId: number
    channel: number
    name: number
    subject: number
    htmlBody: number
    smsBody: number
    mergeTagsJson: number
    isDefault: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TemplateMinAggregateInputType = {
    id?: true
    companyId?: true
    channel?: true
    name?: true
    subject?: true
    htmlBody?: true
    smsBody?: true
    mergeTagsJson?: true
    isDefault?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateMaxAggregateInputType = {
    id?: true
    companyId?: true
    channel?: true
    name?: true
    subject?: true
    htmlBody?: true
    smsBody?: true
    mergeTagsJson?: true
    isDefault?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateCountAggregateInputType = {
    id?: true
    companyId?: true
    channel?: true
    name?: true
    subject?: true
    htmlBody?: true
    smsBody?: true
    mergeTagsJson?: true
    isDefault?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TemplateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Template to aggregate.
     */
    where?: TemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Templates to fetch.
     */
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Templates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Templates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Templates
    **/
    _count?: true | TemplateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TemplateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TemplateMaxAggregateInputType
  }

  export type GetTemplateAggregateType<T extends TemplateAggregateArgs> = {
        [P in keyof T & keyof AggregateTemplate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTemplate[P]>
      : GetScalarType<T[P], AggregateTemplate[P]>
  }




  export type TemplateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplateWhereInput
    orderBy?: TemplateOrderByWithAggregationInput | TemplateOrderByWithAggregationInput[]
    by: TemplateScalarFieldEnum[] | TemplateScalarFieldEnum
    having?: TemplateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TemplateCountAggregateInputType | true
    _min?: TemplateMinAggregateInputType
    _max?: TemplateMaxAggregateInputType
  }

  export type TemplateGroupByOutputType = {
    id: string
    companyId: string
    channel: $Enums.MarketingChannel
    name: string
    subject: string | null
    htmlBody: string | null
    smsBody: string | null
    mergeTagsJson: string
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
    _count: TemplateCountAggregateOutputType | null
    _min: TemplateMinAggregateOutputType | null
    _max: TemplateMaxAggregateOutputType | null
  }

  type GetTemplateGroupByPayload<T extends TemplateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TemplateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TemplateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TemplateGroupByOutputType[P]>
            : GetScalarType<T[P], TemplateGroupByOutputType[P]>
        }
      >
    >


  export type TemplateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    channel?: boolean
    name?: boolean
    subject?: boolean
    htmlBody?: boolean
    smsBody?: boolean
    mergeTagsJson?: boolean
    isDefault?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["template"]>

  export type TemplateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    channel?: boolean
    name?: boolean
    subject?: boolean
    htmlBody?: boolean
    smsBody?: boolean
    mergeTagsJson?: boolean
    isDefault?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["template"]>

  export type TemplateSelectScalar = {
    id?: boolean
    companyId?: boolean
    channel?: boolean
    name?: boolean
    subject?: boolean
    htmlBody?: boolean
    smsBody?: boolean
    mergeTagsJson?: boolean
    isDefault?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $TemplatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Template"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      channel: $Enums.MarketingChannel
      name: string
      subject: string | null
      htmlBody: string | null
      smsBody: string | null
      mergeTagsJson: string
      isDefault: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["template"]>
    composites: {}
  }

  type TemplateGetPayload<S extends boolean | null | undefined | TemplateDefaultArgs> = $Result.GetResult<Prisma.$TemplatePayload, S>

  type TemplateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TemplateFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TemplateCountAggregateInputType | true
    }

  export interface TemplateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Template'], meta: { name: 'Template' } }
    /**
     * Find zero or one Template that matches the filter.
     * @param {TemplateFindUniqueArgs} args - Arguments to find a Template
     * @example
     * // Get one Template
     * const template = await prisma.template.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TemplateFindUniqueArgs>(args: SelectSubset<T, TemplateFindUniqueArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Template that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TemplateFindUniqueOrThrowArgs} args - Arguments to find a Template
     * @example
     * // Get one Template
     * const template = await prisma.template.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TemplateFindUniqueOrThrowArgs>(args: SelectSubset<T, TemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Template that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFindFirstArgs} args - Arguments to find a Template
     * @example
     * // Get one Template
     * const template = await prisma.template.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TemplateFindFirstArgs>(args?: SelectSubset<T, TemplateFindFirstArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Template that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFindFirstOrThrowArgs} args - Arguments to find a Template
     * @example
     * // Get one Template
     * const template = await prisma.template.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TemplateFindFirstOrThrowArgs>(args?: SelectSubset<T, TemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Templates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Templates
     * const templates = await prisma.template.findMany()
     * 
     * // Get first 10 Templates
     * const templates = await prisma.template.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const templateWithIdOnly = await prisma.template.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TemplateFindManyArgs>(args?: SelectSubset<T, TemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Template.
     * @param {TemplateCreateArgs} args - Arguments to create a Template.
     * @example
     * // Create one Template
     * const Template = await prisma.template.create({
     *   data: {
     *     // ... data to create a Template
     *   }
     * })
     * 
     */
    create<T extends TemplateCreateArgs>(args: SelectSubset<T, TemplateCreateArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Templates.
     * @param {TemplateCreateManyArgs} args - Arguments to create many Templates.
     * @example
     * // Create many Templates
     * const template = await prisma.template.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TemplateCreateManyArgs>(args?: SelectSubset<T, TemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Templates and returns the data saved in the database.
     * @param {TemplateCreateManyAndReturnArgs} args - Arguments to create many Templates.
     * @example
     * // Create many Templates
     * const template = await prisma.template.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Templates and only return the `id`
     * const templateWithIdOnly = await prisma.template.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TemplateCreateManyAndReturnArgs>(args?: SelectSubset<T, TemplateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Template.
     * @param {TemplateDeleteArgs} args - Arguments to delete one Template.
     * @example
     * // Delete one Template
     * const Template = await prisma.template.delete({
     *   where: {
     *     // ... filter to delete one Template
     *   }
     * })
     * 
     */
    delete<T extends TemplateDeleteArgs>(args: SelectSubset<T, TemplateDeleteArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Template.
     * @param {TemplateUpdateArgs} args - Arguments to update one Template.
     * @example
     * // Update one Template
     * const template = await prisma.template.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TemplateUpdateArgs>(args: SelectSubset<T, TemplateUpdateArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Templates.
     * @param {TemplateDeleteManyArgs} args - Arguments to filter Templates to delete.
     * @example
     * // Delete a few Templates
     * const { count } = await prisma.template.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TemplateDeleteManyArgs>(args?: SelectSubset<T, TemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Templates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Templates
     * const template = await prisma.template.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TemplateUpdateManyArgs>(args: SelectSubset<T, TemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Template.
     * @param {TemplateUpsertArgs} args - Arguments to update or create a Template.
     * @example
     * // Update or create a Template
     * const template = await prisma.template.upsert({
     *   create: {
     *     // ... data to create a Template
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Template we want to update
     *   }
     * })
     */
    upsert<T extends TemplateUpsertArgs>(args: SelectSubset<T, TemplateUpsertArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Templates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateCountArgs} args - Arguments to filter Templates to count.
     * @example
     * // Count the number of Templates
     * const count = await prisma.template.count({
     *   where: {
     *     // ... the filter for the Templates we want to count
     *   }
     * })
    **/
    count<T extends TemplateCountArgs>(
      args?: Subset<T, TemplateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TemplateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Template.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends TemplateAggregateArgs>(args: Subset<T, TemplateAggregateArgs>): Prisma.PrismaPromise<GetTemplateAggregateType<T>>

    /**
     * Group by Template.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateGroupByArgs} args - Group by arguments.
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
      T extends TemplateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TemplateGroupByArgs['orderBy'] }
        : { orderBy?: TemplateGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, TemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Template model
   */
  readonly fields: TemplateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Template.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TemplateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the Template model
   */ 
  interface TemplateFieldRefs {
    readonly id: FieldRef<"Template", 'String'>
    readonly companyId: FieldRef<"Template", 'String'>
    readonly channel: FieldRef<"Template", 'MarketingChannel'>
    readonly name: FieldRef<"Template", 'String'>
    readonly subject: FieldRef<"Template", 'String'>
    readonly htmlBody: FieldRef<"Template", 'String'>
    readonly smsBody: FieldRef<"Template", 'String'>
    readonly mergeTagsJson: FieldRef<"Template", 'String'>
    readonly isDefault: FieldRef<"Template", 'Boolean'>
    readonly createdAt: FieldRef<"Template", 'DateTime'>
    readonly updatedAt: FieldRef<"Template", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Template findUnique
   */
  export type TemplateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Filter, which Template to fetch.
     */
    where: TemplateWhereUniqueInput
  }

  /**
   * Template findUniqueOrThrow
   */
  export type TemplateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Filter, which Template to fetch.
     */
    where: TemplateWhereUniqueInput
  }

  /**
   * Template findFirst
   */
  export type TemplateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Filter, which Template to fetch.
     */
    where?: TemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Templates to fetch.
     */
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Templates.
     */
    cursor?: TemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Templates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Templates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Templates.
     */
    distinct?: TemplateScalarFieldEnum | TemplateScalarFieldEnum[]
  }

  /**
   * Template findFirstOrThrow
   */
  export type TemplateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Filter, which Template to fetch.
     */
    where?: TemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Templates to fetch.
     */
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Templates.
     */
    cursor?: TemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Templates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Templates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Templates.
     */
    distinct?: TemplateScalarFieldEnum | TemplateScalarFieldEnum[]
  }

  /**
   * Template findMany
   */
  export type TemplateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Filter, which Templates to fetch.
     */
    where?: TemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Templates to fetch.
     */
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Templates.
     */
    cursor?: TemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Templates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Templates.
     */
    skip?: number
    distinct?: TemplateScalarFieldEnum | TemplateScalarFieldEnum[]
  }

  /**
   * Template create
   */
  export type TemplateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * The data needed to create a Template.
     */
    data: XOR<TemplateCreateInput, TemplateUncheckedCreateInput>
  }

  /**
   * Template createMany
   */
  export type TemplateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Templates.
     */
    data: TemplateCreateManyInput | TemplateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Template createManyAndReturn
   */
  export type TemplateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Templates.
     */
    data: TemplateCreateManyInput | TemplateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Template update
   */
  export type TemplateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * The data needed to update a Template.
     */
    data: XOR<TemplateUpdateInput, TemplateUncheckedUpdateInput>
    /**
     * Choose, which Template to update.
     */
    where: TemplateWhereUniqueInput
  }

  /**
   * Template updateMany
   */
  export type TemplateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Templates.
     */
    data: XOR<TemplateUpdateManyMutationInput, TemplateUncheckedUpdateManyInput>
    /**
     * Filter which Templates to update
     */
    where?: TemplateWhereInput
  }

  /**
   * Template upsert
   */
  export type TemplateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * The filter to search for the Template to update in case it exists.
     */
    where: TemplateWhereUniqueInput
    /**
     * In case the Template found by the `where` argument doesn't exist, create a new Template with this data.
     */
    create: XOR<TemplateCreateInput, TemplateUncheckedCreateInput>
    /**
     * In case the Template was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TemplateUpdateInput, TemplateUncheckedUpdateInput>
  }

  /**
   * Template delete
   */
  export type TemplateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Filter which Template to delete.
     */
    where: TemplateWhereUniqueInput
  }

  /**
   * Template deleteMany
   */
  export type TemplateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Templates to delete
     */
    where?: TemplateWhereInput
  }

  /**
   * Template without action
   */
  export type TemplateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
  }


  /**
   * Model Audience
   */

  export type AggregateAudience = {
    _count: AudienceCountAggregateOutputType | null
    _avg: AudienceAvgAggregateOutputType | null
    _sum: AudienceSumAggregateOutputType | null
    _min: AudienceMinAggregateOutputType | null
    _max: AudienceMaxAggregateOutputType | null
  }

  export type AudienceAvgAggregateOutputType = {
    lastCount: number | null
  }

  export type AudienceSumAggregateOutputType = {
    lastCount: number | null
  }

  export type AudienceMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    type: $Enums.AudienceType | null
    filtersJson: string | null
    lastCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AudienceMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    type: $Enums.AudienceType | null
    filtersJson: string | null
    lastCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AudienceCountAggregateOutputType = {
    id: number
    companyId: number
    name: number
    type: number
    filtersJson: number
    lastCount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AudienceAvgAggregateInputType = {
    lastCount?: true
  }

  export type AudienceSumAggregateInputType = {
    lastCount?: true
  }

  export type AudienceMinAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    type?: true
    filtersJson?: true
    lastCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AudienceMaxAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    type?: true
    filtersJson?: true
    lastCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AudienceCountAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    type?: true
    filtersJson?: true
    lastCount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AudienceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Audience to aggregate.
     */
    where?: AudienceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Audiences to fetch.
     */
    orderBy?: AudienceOrderByWithRelationInput | AudienceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AudienceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Audiences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Audiences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Audiences
    **/
    _count?: true | AudienceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AudienceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AudienceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AudienceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AudienceMaxAggregateInputType
  }

  export type GetAudienceAggregateType<T extends AudienceAggregateArgs> = {
        [P in keyof T & keyof AggregateAudience]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAudience[P]>
      : GetScalarType<T[P], AggregateAudience[P]>
  }




  export type AudienceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AudienceWhereInput
    orderBy?: AudienceOrderByWithAggregationInput | AudienceOrderByWithAggregationInput[]
    by: AudienceScalarFieldEnum[] | AudienceScalarFieldEnum
    having?: AudienceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AudienceCountAggregateInputType | true
    _avg?: AudienceAvgAggregateInputType
    _sum?: AudienceSumAggregateInputType
    _min?: AudienceMinAggregateInputType
    _max?: AudienceMaxAggregateInputType
  }

  export type AudienceGroupByOutputType = {
    id: string
    companyId: string
    name: string
    type: $Enums.AudienceType
    filtersJson: string
    lastCount: number
    createdAt: Date
    updatedAt: Date
    _count: AudienceCountAggregateOutputType | null
    _avg: AudienceAvgAggregateOutputType | null
    _sum: AudienceSumAggregateOutputType | null
    _min: AudienceMinAggregateOutputType | null
    _max: AudienceMaxAggregateOutputType | null
  }

  type GetAudienceGroupByPayload<T extends AudienceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AudienceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AudienceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AudienceGroupByOutputType[P]>
            : GetScalarType<T[P], AudienceGroupByOutputType[P]>
        }
      >
    >


  export type AudienceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    type?: boolean
    filtersJson?: boolean
    lastCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["audience"]>

  export type AudienceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    type?: boolean
    filtersJson?: boolean
    lastCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["audience"]>

  export type AudienceSelectScalar = {
    id?: boolean
    companyId?: boolean
    name?: boolean
    type?: boolean
    filtersJson?: boolean
    lastCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $AudiencePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Audience"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      name: string
      type: $Enums.AudienceType
      filtersJson: string
      lastCount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["audience"]>
    composites: {}
  }

  type AudienceGetPayload<S extends boolean | null | undefined | AudienceDefaultArgs> = $Result.GetResult<Prisma.$AudiencePayload, S>

  type AudienceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AudienceFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AudienceCountAggregateInputType | true
    }

  export interface AudienceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Audience'], meta: { name: 'Audience' } }
    /**
     * Find zero or one Audience that matches the filter.
     * @param {AudienceFindUniqueArgs} args - Arguments to find a Audience
     * @example
     * // Get one Audience
     * const audience = await prisma.audience.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AudienceFindUniqueArgs>(args: SelectSubset<T, AudienceFindUniqueArgs<ExtArgs>>): Prisma__AudienceClient<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Audience that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AudienceFindUniqueOrThrowArgs} args - Arguments to find a Audience
     * @example
     * // Get one Audience
     * const audience = await prisma.audience.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AudienceFindUniqueOrThrowArgs>(args: SelectSubset<T, AudienceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AudienceClient<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Audience that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AudienceFindFirstArgs} args - Arguments to find a Audience
     * @example
     * // Get one Audience
     * const audience = await prisma.audience.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AudienceFindFirstArgs>(args?: SelectSubset<T, AudienceFindFirstArgs<ExtArgs>>): Prisma__AudienceClient<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Audience that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AudienceFindFirstOrThrowArgs} args - Arguments to find a Audience
     * @example
     * // Get one Audience
     * const audience = await prisma.audience.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AudienceFindFirstOrThrowArgs>(args?: SelectSubset<T, AudienceFindFirstOrThrowArgs<ExtArgs>>): Prisma__AudienceClient<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Audiences that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AudienceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Audiences
     * const audiences = await prisma.audience.findMany()
     * 
     * // Get first 10 Audiences
     * const audiences = await prisma.audience.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const audienceWithIdOnly = await prisma.audience.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AudienceFindManyArgs>(args?: SelectSubset<T, AudienceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Audience.
     * @param {AudienceCreateArgs} args - Arguments to create a Audience.
     * @example
     * // Create one Audience
     * const Audience = await prisma.audience.create({
     *   data: {
     *     // ... data to create a Audience
     *   }
     * })
     * 
     */
    create<T extends AudienceCreateArgs>(args: SelectSubset<T, AudienceCreateArgs<ExtArgs>>): Prisma__AudienceClient<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Audiences.
     * @param {AudienceCreateManyArgs} args - Arguments to create many Audiences.
     * @example
     * // Create many Audiences
     * const audience = await prisma.audience.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AudienceCreateManyArgs>(args?: SelectSubset<T, AudienceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Audiences and returns the data saved in the database.
     * @param {AudienceCreateManyAndReturnArgs} args - Arguments to create many Audiences.
     * @example
     * // Create many Audiences
     * const audience = await prisma.audience.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Audiences and only return the `id`
     * const audienceWithIdOnly = await prisma.audience.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AudienceCreateManyAndReturnArgs>(args?: SelectSubset<T, AudienceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Audience.
     * @param {AudienceDeleteArgs} args - Arguments to delete one Audience.
     * @example
     * // Delete one Audience
     * const Audience = await prisma.audience.delete({
     *   where: {
     *     // ... filter to delete one Audience
     *   }
     * })
     * 
     */
    delete<T extends AudienceDeleteArgs>(args: SelectSubset<T, AudienceDeleteArgs<ExtArgs>>): Prisma__AudienceClient<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Audience.
     * @param {AudienceUpdateArgs} args - Arguments to update one Audience.
     * @example
     * // Update one Audience
     * const audience = await prisma.audience.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AudienceUpdateArgs>(args: SelectSubset<T, AudienceUpdateArgs<ExtArgs>>): Prisma__AudienceClient<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Audiences.
     * @param {AudienceDeleteManyArgs} args - Arguments to filter Audiences to delete.
     * @example
     * // Delete a few Audiences
     * const { count } = await prisma.audience.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AudienceDeleteManyArgs>(args?: SelectSubset<T, AudienceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Audiences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AudienceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Audiences
     * const audience = await prisma.audience.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AudienceUpdateManyArgs>(args: SelectSubset<T, AudienceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Audience.
     * @param {AudienceUpsertArgs} args - Arguments to update or create a Audience.
     * @example
     * // Update or create a Audience
     * const audience = await prisma.audience.upsert({
     *   create: {
     *     // ... data to create a Audience
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Audience we want to update
     *   }
     * })
     */
    upsert<T extends AudienceUpsertArgs>(args: SelectSubset<T, AudienceUpsertArgs<ExtArgs>>): Prisma__AudienceClient<$Result.GetResult<Prisma.$AudiencePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Audiences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AudienceCountArgs} args - Arguments to filter Audiences to count.
     * @example
     * // Count the number of Audiences
     * const count = await prisma.audience.count({
     *   where: {
     *     // ... the filter for the Audiences we want to count
     *   }
     * })
    **/
    count<T extends AudienceCountArgs>(
      args?: Subset<T, AudienceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AudienceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Audience.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AudienceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends AudienceAggregateArgs>(args: Subset<T, AudienceAggregateArgs>): Prisma.PrismaPromise<GetAudienceAggregateType<T>>

    /**
     * Group by Audience.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AudienceGroupByArgs} args - Group by arguments.
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
      T extends AudienceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AudienceGroupByArgs['orderBy'] }
        : { orderBy?: AudienceGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, AudienceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAudienceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Audience model
   */
  readonly fields: AudienceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Audience.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AudienceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the Audience model
   */ 
  interface AudienceFieldRefs {
    readonly id: FieldRef<"Audience", 'String'>
    readonly companyId: FieldRef<"Audience", 'String'>
    readonly name: FieldRef<"Audience", 'String'>
    readonly type: FieldRef<"Audience", 'AudienceType'>
    readonly filtersJson: FieldRef<"Audience", 'String'>
    readonly lastCount: FieldRef<"Audience", 'Int'>
    readonly createdAt: FieldRef<"Audience", 'DateTime'>
    readonly updatedAt: FieldRef<"Audience", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Audience findUnique
   */
  export type AudienceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
    /**
     * Filter, which Audience to fetch.
     */
    where: AudienceWhereUniqueInput
  }

  /**
   * Audience findUniqueOrThrow
   */
  export type AudienceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
    /**
     * Filter, which Audience to fetch.
     */
    where: AudienceWhereUniqueInput
  }

  /**
   * Audience findFirst
   */
  export type AudienceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
    /**
     * Filter, which Audience to fetch.
     */
    where?: AudienceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Audiences to fetch.
     */
    orderBy?: AudienceOrderByWithRelationInput | AudienceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Audiences.
     */
    cursor?: AudienceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Audiences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Audiences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Audiences.
     */
    distinct?: AudienceScalarFieldEnum | AudienceScalarFieldEnum[]
  }

  /**
   * Audience findFirstOrThrow
   */
  export type AudienceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
    /**
     * Filter, which Audience to fetch.
     */
    where?: AudienceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Audiences to fetch.
     */
    orderBy?: AudienceOrderByWithRelationInput | AudienceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Audiences.
     */
    cursor?: AudienceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Audiences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Audiences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Audiences.
     */
    distinct?: AudienceScalarFieldEnum | AudienceScalarFieldEnum[]
  }

  /**
   * Audience findMany
   */
  export type AudienceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
    /**
     * Filter, which Audiences to fetch.
     */
    where?: AudienceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Audiences to fetch.
     */
    orderBy?: AudienceOrderByWithRelationInput | AudienceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Audiences.
     */
    cursor?: AudienceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Audiences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Audiences.
     */
    skip?: number
    distinct?: AudienceScalarFieldEnum | AudienceScalarFieldEnum[]
  }

  /**
   * Audience create
   */
  export type AudienceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
    /**
     * The data needed to create a Audience.
     */
    data: XOR<AudienceCreateInput, AudienceUncheckedCreateInput>
  }

  /**
   * Audience createMany
   */
  export type AudienceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Audiences.
     */
    data: AudienceCreateManyInput | AudienceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Audience createManyAndReturn
   */
  export type AudienceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Audiences.
     */
    data: AudienceCreateManyInput | AudienceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Audience update
   */
  export type AudienceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
    /**
     * The data needed to update a Audience.
     */
    data: XOR<AudienceUpdateInput, AudienceUncheckedUpdateInput>
    /**
     * Choose, which Audience to update.
     */
    where: AudienceWhereUniqueInput
  }

  /**
   * Audience updateMany
   */
  export type AudienceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Audiences.
     */
    data: XOR<AudienceUpdateManyMutationInput, AudienceUncheckedUpdateManyInput>
    /**
     * Filter which Audiences to update
     */
    where?: AudienceWhereInput
  }

  /**
   * Audience upsert
   */
  export type AudienceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
    /**
     * The filter to search for the Audience to update in case it exists.
     */
    where: AudienceWhereUniqueInput
    /**
     * In case the Audience found by the `where` argument doesn't exist, create a new Audience with this data.
     */
    create: XOR<AudienceCreateInput, AudienceUncheckedCreateInput>
    /**
     * In case the Audience was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AudienceUpdateInput, AudienceUncheckedUpdateInput>
  }

  /**
   * Audience delete
   */
  export type AudienceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
    /**
     * Filter which Audience to delete.
     */
    where: AudienceWhereUniqueInput
  }

  /**
   * Audience deleteMany
   */
  export type AudienceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Audiences to delete
     */
    where?: AudienceWhereInput
  }

  /**
   * Audience without action
   */
  export type AudienceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Audience
     */
    select?: AudienceSelect<ExtArgs> | null
  }


  /**
   * Model SendJob
   */

  export type AggregateSendJob = {
    _count: SendJobCountAggregateOutputType | null
    _min: SendJobMinAggregateOutputType | null
    _max: SendJobMaxAggregateOutputType | null
  }

  export type SendJobMinAggregateOutputType = {
    id: string | null
    campaignId: string | null
    companyId: string | null
    customerId: string | null
    channel: $Enums.MarketingChannel | null
    address: string | null
    status: $Enums.SendJobStatus | null
    scheduledAt: Date | null
    sentAt: Date | null
    externalId: string | null
    automationTemplate: string | null
    error: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SendJobMaxAggregateOutputType = {
    id: string | null
    campaignId: string | null
    companyId: string | null
    customerId: string | null
    channel: $Enums.MarketingChannel | null
    address: string | null
    status: $Enums.SendJobStatus | null
    scheduledAt: Date | null
    sentAt: Date | null
    externalId: string | null
    automationTemplate: string | null
    error: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SendJobCountAggregateOutputType = {
    id: number
    campaignId: number
    companyId: number
    customerId: number
    channel: number
    address: number
    status: number
    scheduledAt: number
    sentAt: number
    externalId: number
    automationTemplate: number
    error: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SendJobMinAggregateInputType = {
    id?: true
    campaignId?: true
    companyId?: true
    customerId?: true
    channel?: true
    address?: true
    status?: true
    scheduledAt?: true
    sentAt?: true
    externalId?: true
    automationTemplate?: true
    error?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SendJobMaxAggregateInputType = {
    id?: true
    campaignId?: true
    companyId?: true
    customerId?: true
    channel?: true
    address?: true
    status?: true
    scheduledAt?: true
    sentAt?: true
    externalId?: true
    automationTemplate?: true
    error?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SendJobCountAggregateInputType = {
    id?: true
    campaignId?: true
    companyId?: true
    customerId?: true
    channel?: true
    address?: true
    status?: true
    scheduledAt?: true
    sentAt?: true
    externalId?: true
    automationTemplate?: true
    error?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SendJobAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SendJob to aggregate.
     */
    where?: SendJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SendJobs to fetch.
     */
    orderBy?: SendJobOrderByWithRelationInput | SendJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SendJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SendJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SendJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SendJobs
    **/
    _count?: true | SendJobCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SendJobMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SendJobMaxAggregateInputType
  }

  export type GetSendJobAggregateType<T extends SendJobAggregateArgs> = {
        [P in keyof T & keyof AggregateSendJob]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSendJob[P]>
      : GetScalarType<T[P], AggregateSendJob[P]>
  }




  export type SendJobGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SendJobWhereInput
    orderBy?: SendJobOrderByWithAggregationInput | SendJobOrderByWithAggregationInput[]
    by: SendJobScalarFieldEnum[] | SendJobScalarFieldEnum
    having?: SendJobScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SendJobCountAggregateInputType | true
    _min?: SendJobMinAggregateInputType
    _max?: SendJobMaxAggregateInputType
  }

  export type SendJobGroupByOutputType = {
    id: string
    campaignId: string | null
    companyId: string
    customerId: string
    channel: $Enums.MarketingChannel
    address: string
    status: $Enums.SendJobStatus
    scheduledAt: Date | null
    sentAt: Date | null
    externalId: string | null
    automationTemplate: string | null
    error: string | null
    createdAt: Date
    updatedAt: Date
    _count: SendJobCountAggregateOutputType | null
    _min: SendJobMinAggregateOutputType | null
    _max: SendJobMaxAggregateOutputType | null
  }

  type GetSendJobGroupByPayload<T extends SendJobGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SendJobGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SendJobGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SendJobGroupByOutputType[P]>
            : GetScalarType<T[P], SendJobGroupByOutputType[P]>
        }
      >
    >


  export type SendJobSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    campaignId?: boolean
    companyId?: boolean
    customerId?: boolean
    channel?: boolean
    address?: boolean
    status?: boolean
    scheduledAt?: boolean
    sentAt?: boolean
    externalId?: boolean
    automationTemplate?: boolean
    error?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    campaign?: boolean | SendJob$campaignArgs<ExtArgs>
    events?: boolean | SendJob$eventsArgs<ExtArgs>
    _count?: boolean | SendJobCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sendJob"]>

  export type SendJobSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    campaignId?: boolean
    companyId?: boolean
    customerId?: boolean
    channel?: boolean
    address?: boolean
    status?: boolean
    scheduledAt?: boolean
    sentAt?: boolean
    externalId?: boolean
    automationTemplate?: boolean
    error?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    campaign?: boolean | SendJob$campaignArgs<ExtArgs>
  }, ExtArgs["result"]["sendJob"]>

  export type SendJobSelectScalar = {
    id?: boolean
    campaignId?: boolean
    companyId?: boolean
    customerId?: boolean
    channel?: boolean
    address?: boolean
    status?: boolean
    scheduledAt?: boolean
    sentAt?: boolean
    externalId?: boolean
    automationTemplate?: boolean
    error?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SendJobInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    campaign?: boolean | SendJob$campaignArgs<ExtArgs>
    events?: boolean | SendJob$eventsArgs<ExtArgs>
    _count?: boolean | SendJobCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SendJobIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    campaign?: boolean | SendJob$campaignArgs<ExtArgs>
  }

  export type $SendJobPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SendJob"
    objects: {
      campaign: Prisma.$CampaignPayload<ExtArgs> | null
      events: Prisma.$SendEventPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      campaignId: string | null
      companyId: string
      customerId: string
      channel: $Enums.MarketingChannel
      address: string
      status: $Enums.SendJobStatus
      scheduledAt: Date | null
      sentAt: Date | null
      externalId: string | null
      automationTemplate: string | null
      error: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["sendJob"]>
    composites: {}
  }

  type SendJobGetPayload<S extends boolean | null | undefined | SendJobDefaultArgs> = $Result.GetResult<Prisma.$SendJobPayload, S>

  type SendJobCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SendJobFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SendJobCountAggregateInputType | true
    }

  export interface SendJobDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SendJob'], meta: { name: 'SendJob' } }
    /**
     * Find zero or one SendJob that matches the filter.
     * @param {SendJobFindUniqueArgs} args - Arguments to find a SendJob
     * @example
     * // Get one SendJob
     * const sendJob = await prisma.sendJob.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SendJobFindUniqueArgs>(args: SelectSubset<T, SendJobFindUniqueArgs<ExtArgs>>): Prisma__SendJobClient<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SendJob that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SendJobFindUniqueOrThrowArgs} args - Arguments to find a SendJob
     * @example
     * // Get one SendJob
     * const sendJob = await prisma.sendJob.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SendJobFindUniqueOrThrowArgs>(args: SelectSubset<T, SendJobFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SendJobClient<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SendJob that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendJobFindFirstArgs} args - Arguments to find a SendJob
     * @example
     * // Get one SendJob
     * const sendJob = await prisma.sendJob.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SendJobFindFirstArgs>(args?: SelectSubset<T, SendJobFindFirstArgs<ExtArgs>>): Prisma__SendJobClient<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SendJob that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendJobFindFirstOrThrowArgs} args - Arguments to find a SendJob
     * @example
     * // Get one SendJob
     * const sendJob = await prisma.sendJob.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SendJobFindFirstOrThrowArgs>(args?: SelectSubset<T, SendJobFindFirstOrThrowArgs<ExtArgs>>): Prisma__SendJobClient<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SendJobs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendJobFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SendJobs
     * const sendJobs = await prisma.sendJob.findMany()
     * 
     * // Get first 10 SendJobs
     * const sendJobs = await prisma.sendJob.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sendJobWithIdOnly = await prisma.sendJob.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SendJobFindManyArgs>(args?: SelectSubset<T, SendJobFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SendJob.
     * @param {SendJobCreateArgs} args - Arguments to create a SendJob.
     * @example
     * // Create one SendJob
     * const SendJob = await prisma.sendJob.create({
     *   data: {
     *     // ... data to create a SendJob
     *   }
     * })
     * 
     */
    create<T extends SendJobCreateArgs>(args: SelectSubset<T, SendJobCreateArgs<ExtArgs>>): Prisma__SendJobClient<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SendJobs.
     * @param {SendJobCreateManyArgs} args - Arguments to create many SendJobs.
     * @example
     * // Create many SendJobs
     * const sendJob = await prisma.sendJob.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SendJobCreateManyArgs>(args?: SelectSubset<T, SendJobCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SendJobs and returns the data saved in the database.
     * @param {SendJobCreateManyAndReturnArgs} args - Arguments to create many SendJobs.
     * @example
     * // Create many SendJobs
     * const sendJob = await prisma.sendJob.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SendJobs and only return the `id`
     * const sendJobWithIdOnly = await prisma.sendJob.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SendJobCreateManyAndReturnArgs>(args?: SelectSubset<T, SendJobCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SendJob.
     * @param {SendJobDeleteArgs} args - Arguments to delete one SendJob.
     * @example
     * // Delete one SendJob
     * const SendJob = await prisma.sendJob.delete({
     *   where: {
     *     // ... filter to delete one SendJob
     *   }
     * })
     * 
     */
    delete<T extends SendJobDeleteArgs>(args: SelectSubset<T, SendJobDeleteArgs<ExtArgs>>): Prisma__SendJobClient<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SendJob.
     * @param {SendJobUpdateArgs} args - Arguments to update one SendJob.
     * @example
     * // Update one SendJob
     * const sendJob = await prisma.sendJob.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SendJobUpdateArgs>(args: SelectSubset<T, SendJobUpdateArgs<ExtArgs>>): Prisma__SendJobClient<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SendJobs.
     * @param {SendJobDeleteManyArgs} args - Arguments to filter SendJobs to delete.
     * @example
     * // Delete a few SendJobs
     * const { count } = await prisma.sendJob.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SendJobDeleteManyArgs>(args?: SelectSubset<T, SendJobDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SendJobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendJobUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SendJobs
     * const sendJob = await prisma.sendJob.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SendJobUpdateManyArgs>(args: SelectSubset<T, SendJobUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SendJob.
     * @param {SendJobUpsertArgs} args - Arguments to update or create a SendJob.
     * @example
     * // Update or create a SendJob
     * const sendJob = await prisma.sendJob.upsert({
     *   create: {
     *     // ... data to create a SendJob
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SendJob we want to update
     *   }
     * })
     */
    upsert<T extends SendJobUpsertArgs>(args: SelectSubset<T, SendJobUpsertArgs<ExtArgs>>): Prisma__SendJobClient<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SendJobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendJobCountArgs} args - Arguments to filter SendJobs to count.
     * @example
     * // Count the number of SendJobs
     * const count = await prisma.sendJob.count({
     *   where: {
     *     // ... the filter for the SendJobs we want to count
     *   }
     * })
    **/
    count<T extends SendJobCountArgs>(
      args?: Subset<T, SendJobCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SendJobCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SendJob.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendJobAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SendJobAggregateArgs>(args: Subset<T, SendJobAggregateArgs>): Prisma.PrismaPromise<GetSendJobAggregateType<T>>

    /**
     * Group by SendJob.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendJobGroupByArgs} args - Group by arguments.
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
      T extends SendJobGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SendJobGroupByArgs['orderBy'] }
        : { orderBy?: SendJobGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SendJobGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSendJobGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SendJob model
   */
  readonly fields: SendJobFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SendJob.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SendJobClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    campaign<T extends SendJob$campaignArgs<ExtArgs> = {}>(args?: Subset<T, SendJob$campaignArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    events<T extends SendJob$eventsArgs<ExtArgs> = {}>(args?: Subset<T, SendJob$eventsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the SendJob model
   */ 
  interface SendJobFieldRefs {
    readonly id: FieldRef<"SendJob", 'String'>
    readonly campaignId: FieldRef<"SendJob", 'String'>
    readonly companyId: FieldRef<"SendJob", 'String'>
    readonly customerId: FieldRef<"SendJob", 'String'>
    readonly channel: FieldRef<"SendJob", 'MarketingChannel'>
    readonly address: FieldRef<"SendJob", 'String'>
    readonly status: FieldRef<"SendJob", 'SendJobStatus'>
    readonly scheduledAt: FieldRef<"SendJob", 'DateTime'>
    readonly sentAt: FieldRef<"SendJob", 'DateTime'>
    readonly externalId: FieldRef<"SendJob", 'String'>
    readonly automationTemplate: FieldRef<"SendJob", 'String'>
    readonly error: FieldRef<"SendJob", 'String'>
    readonly createdAt: FieldRef<"SendJob", 'DateTime'>
    readonly updatedAt: FieldRef<"SendJob", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SendJob findUnique
   */
  export type SendJobFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    /**
     * Filter, which SendJob to fetch.
     */
    where: SendJobWhereUniqueInput
  }

  /**
   * SendJob findUniqueOrThrow
   */
  export type SendJobFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    /**
     * Filter, which SendJob to fetch.
     */
    where: SendJobWhereUniqueInput
  }

  /**
   * SendJob findFirst
   */
  export type SendJobFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    /**
     * Filter, which SendJob to fetch.
     */
    where?: SendJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SendJobs to fetch.
     */
    orderBy?: SendJobOrderByWithRelationInput | SendJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SendJobs.
     */
    cursor?: SendJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SendJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SendJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SendJobs.
     */
    distinct?: SendJobScalarFieldEnum | SendJobScalarFieldEnum[]
  }

  /**
   * SendJob findFirstOrThrow
   */
  export type SendJobFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    /**
     * Filter, which SendJob to fetch.
     */
    where?: SendJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SendJobs to fetch.
     */
    orderBy?: SendJobOrderByWithRelationInput | SendJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SendJobs.
     */
    cursor?: SendJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SendJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SendJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SendJobs.
     */
    distinct?: SendJobScalarFieldEnum | SendJobScalarFieldEnum[]
  }

  /**
   * SendJob findMany
   */
  export type SendJobFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    /**
     * Filter, which SendJobs to fetch.
     */
    where?: SendJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SendJobs to fetch.
     */
    orderBy?: SendJobOrderByWithRelationInput | SendJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SendJobs.
     */
    cursor?: SendJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SendJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SendJobs.
     */
    skip?: number
    distinct?: SendJobScalarFieldEnum | SendJobScalarFieldEnum[]
  }

  /**
   * SendJob create
   */
  export type SendJobCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    /**
     * The data needed to create a SendJob.
     */
    data: XOR<SendJobCreateInput, SendJobUncheckedCreateInput>
  }

  /**
   * SendJob createMany
   */
  export type SendJobCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SendJobs.
     */
    data: SendJobCreateManyInput | SendJobCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SendJob createManyAndReturn
   */
  export type SendJobCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SendJobs.
     */
    data: SendJobCreateManyInput | SendJobCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SendJob update
   */
  export type SendJobUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    /**
     * The data needed to update a SendJob.
     */
    data: XOR<SendJobUpdateInput, SendJobUncheckedUpdateInput>
    /**
     * Choose, which SendJob to update.
     */
    where: SendJobWhereUniqueInput
  }

  /**
   * SendJob updateMany
   */
  export type SendJobUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SendJobs.
     */
    data: XOR<SendJobUpdateManyMutationInput, SendJobUncheckedUpdateManyInput>
    /**
     * Filter which SendJobs to update
     */
    where?: SendJobWhereInput
  }

  /**
   * SendJob upsert
   */
  export type SendJobUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    /**
     * The filter to search for the SendJob to update in case it exists.
     */
    where: SendJobWhereUniqueInput
    /**
     * In case the SendJob found by the `where` argument doesn't exist, create a new SendJob with this data.
     */
    create: XOR<SendJobCreateInput, SendJobUncheckedCreateInput>
    /**
     * In case the SendJob was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SendJobUpdateInput, SendJobUncheckedUpdateInput>
  }

  /**
   * SendJob delete
   */
  export type SendJobDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
    /**
     * Filter which SendJob to delete.
     */
    where: SendJobWhereUniqueInput
  }

  /**
   * SendJob deleteMany
   */
  export type SendJobDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SendJobs to delete
     */
    where?: SendJobWhereInput
  }

  /**
   * SendJob.campaign
   */
  export type SendJob$campaignArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    where?: CampaignWhereInput
  }

  /**
   * SendJob.events
   */
  export type SendJob$eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    where?: SendEventWhereInput
    orderBy?: SendEventOrderByWithRelationInput | SendEventOrderByWithRelationInput[]
    cursor?: SendEventWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SendEventScalarFieldEnum | SendEventScalarFieldEnum[]
  }

  /**
   * SendJob without action
   */
  export type SendJobDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendJob
     */
    select?: SendJobSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendJobInclude<ExtArgs> | null
  }


  /**
   * Model SendEvent
   */

  export type AggregateSendEvent = {
    _count: SendEventCountAggregateOutputType | null
    _min: SendEventMinAggregateOutputType | null
    _max: SendEventMaxAggregateOutputType | null
  }

  export type SendEventMinAggregateOutputType = {
    id: string | null
    sendJobId: string | null
    eventType: $Enums.SendEventType | null
    eventAt: Date | null
    urlClicked: string | null
    metadata: string | null
  }

  export type SendEventMaxAggregateOutputType = {
    id: string | null
    sendJobId: string | null
    eventType: $Enums.SendEventType | null
    eventAt: Date | null
    urlClicked: string | null
    metadata: string | null
  }

  export type SendEventCountAggregateOutputType = {
    id: number
    sendJobId: number
    eventType: number
    eventAt: number
    urlClicked: number
    metadata: number
    _all: number
  }


  export type SendEventMinAggregateInputType = {
    id?: true
    sendJobId?: true
    eventType?: true
    eventAt?: true
    urlClicked?: true
    metadata?: true
  }

  export type SendEventMaxAggregateInputType = {
    id?: true
    sendJobId?: true
    eventType?: true
    eventAt?: true
    urlClicked?: true
    metadata?: true
  }

  export type SendEventCountAggregateInputType = {
    id?: true
    sendJobId?: true
    eventType?: true
    eventAt?: true
    urlClicked?: true
    metadata?: true
    _all?: true
  }

  export type SendEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SendEvent to aggregate.
     */
    where?: SendEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SendEvents to fetch.
     */
    orderBy?: SendEventOrderByWithRelationInput | SendEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SendEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SendEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SendEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SendEvents
    **/
    _count?: true | SendEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SendEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SendEventMaxAggregateInputType
  }

  export type GetSendEventAggregateType<T extends SendEventAggregateArgs> = {
        [P in keyof T & keyof AggregateSendEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSendEvent[P]>
      : GetScalarType<T[P], AggregateSendEvent[P]>
  }




  export type SendEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SendEventWhereInput
    orderBy?: SendEventOrderByWithAggregationInput | SendEventOrderByWithAggregationInput[]
    by: SendEventScalarFieldEnum[] | SendEventScalarFieldEnum
    having?: SendEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SendEventCountAggregateInputType | true
    _min?: SendEventMinAggregateInputType
    _max?: SendEventMaxAggregateInputType
  }

  export type SendEventGroupByOutputType = {
    id: string
    sendJobId: string
    eventType: $Enums.SendEventType
    eventAt: Date
    urlClicked: string | null
    metadata: string
    _count: SendEventCountAggregateOutputType | null
    _min: SendEventMinAggregateOutputType | null
    _max: SendEventMaxAggregateOutputType | null
  }

  type GetSendEventGroupByPayload<T extends SendEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SendEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SendEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SendEventGroupByOutputType[P]>
            : GetScalarType<T[P], SendEventGroupByOutputType[P]>
        }
      >
    >


  export type SendEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sendJobId?: boolean
    eventType?: boolean
    eventAt?: boolean
    urlClicked?: boolean
    metadata?: boolean
    sendJob?: boolean | SendJobDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sendEvent"]>

  export type SendEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sendJobId?: boolean
    eventType?: boolean
    eventAt?: boolean
    urlClicked?: boolean
    metadata?: boolean
    sendJob?: boolean | SendJobDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sendEvent"]>

  export type SendEventSelectScalar = {
    id?: boolean
    sendJobId?: boolean
    eventType?: boolean
    eventAt?: boolean
    urlClicked?: boolean
    metadata?: boolean
  }

  export type SendEventInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sendJob?: boolean | SendJobDefaultArgs<ExtArgs>
  }
  export type SendEventIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sendJob?: boolean | SendJobDefaultArgs<ExtArgs>
  }

  export type $SendEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SendEvent"
    objects: {
      sendJob: Prisma.$SendJobPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sendJobId: string
      eventType: $Enums.SendEventType
      eventAt: Date
      urlClicked: string | null
      metadata: string
    }, ExtArgs["result"]["sendEvent"]>
    composites: {}
  }

  type SendEventGetPayload<S extends boolean | null | undefined | SendEventDefaultArgs> = $Result.GetResult<Prisma.$SendEventPayload, S>

  type SendEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SendEventFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SendEventCountAggregateInputType | true
    }

  export interface SendEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SendEvent'], meta: { name: 'SendEvent' } }
    /**
     * Find zero or one SendEvent that matches the filter.
     * @param {SendEventFindUniqueArgs} args - Arguments to find a SendEvent
     * @example
     * // Get one SendEvent
     * const sendEvent = await prisma.sendEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SendEventFindUniqueArgs>(args: SelectSubset<T, SendEventFindUniqueArgs<ExtArgs>>): Prisma__SendEventClient<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SendEvent that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SendEventFindUniqueOrThrowArgs} args - Arguments to find a SendEvent
     * @example
     * // Get one SendEvent
     * const sendEvent = await prisma.sendEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SendEventFindUniqueOrThrowArgs>(args: SelectSubset<T, SendEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SendEventClient<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SendEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendEventFindFirstArgs} args - Arguments to find a SendEvent
     * @example
     * // Get one SendEvent
     * const sendEvent = await prisma.sendEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SendEventFindFirstArgs>(args?: SelectSubset<T, SendEventFindFirstArgs<ExtArgs>>): Prisma__SendEventClient<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SendEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendEventFindFirstOrThrowArgs} args - Arguments to find a SendEvent
     * @example
     * // Get one SendEvent
     * const sendEvent = await prisma.sendEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SendEventFindFirstOrThrowArgs>(args?: SelectSubset<T, SendEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__SendEventClient<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SendEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SendEvents
     * const sendEvents = await prisma.sendEvent.findMany()
     * 
     * // Get first 10 SendEvents
     * const sendEvents = await prisma.sendEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sendEventWithIdOnly = await prisma.sendEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SendEventFindManyArgs>(args?: SelectSubset<T, SendEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SendEvent.
     * @param {SendEventCreateArgs} args - Arguments to create a SendEvent.
     * @example
     * // Create one SendEvent
     * const SendEvent = await prisma.sendEvent.create({
     *   data: {
     *     // ... data to create a SendEvent
     *   }
     * })
     * 
     */
    create<T extends SendEventCreateArgs>(args: SelectSubset<T, SendEventCreateArgs<ExtArgs>>): Prisma__SendEventClient<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SendEvents.
     * @param {SendEventCreateManyArgs} args - Arguments to create many SendEvents.
     * @example
     * // Create many SendEvents
     * const sendEvent = await prisma.sendEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SendEventCreateManyArgs>(args?: SelectSubset<T, SendEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SendEvents and returns the data saved in the database.
     * @param {SendEventCreateManyAndReturnArgs} args - Arguments to create many SendEvents.
     * @example
     * // Create many SendEvents
     * const sendEvent = await prisma.sendEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SendEvents and only return the `id`
     * const sendEventWithIdOnly = await prisma.sendEvent.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SendEventCreateManyAndReturnArgs>(args?: SelectSubset<T, SendEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SendEvent.
     * @param {SendEventDeleteArgs} args - Arguments to delete one SendEvent.
     * @example
     * // Delete one SendEvent
     * const SendEvent = await prisma.sendEvent.delete({
     *   where: {
     *     // ... filter to delete one SendEvent
     *   }
     * })
     * 
     */
    delete<T extends SendEventDeleteArgs>(args: SelectSubset<T, SendEventDeleteArgs<ExtArgs>>): Prisma__SendEventClient<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SendEvent.
     * @param {SendEventUpdateArgs} args - Arguments to update one SendEvent.
     * @example
     * // Update one SendEvent
     * const sendEvent = await prisma.sendEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SendEventUpdateArgs>(args: SelectSubset<T, SendEventUpdateArgs<ExtArgs>>): Prisma__SendEventClient<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SendEvents.
     * @param {SendEventDeleteManyArgs} args - Arguments to filter SendEvents to delete.
     * @example
     * // Delete a few SendEvents
     * const { count } = await prisma.sendEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SendEventDeleteManyArgs>(args?: SelectSubset<T, SendEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SendEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SendEvents
     * const sendEvent = await prisma.sendEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SendEventUpdateManyArgs>(args: SelectSubset<T, SendEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SendEvent.
     * @param {SendEventUpsertArgs} args - Arguments to update or create a SendEvent.
     * @example
     * // Update or create a SendEvent
     * const sendEvent = await prisma.sendEvent.upsert({
     *   create: {
     *     // ... data to create a SendEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SendEvent we want to update
     *   }
     * })
     */
    upsert<T extends SendEventUpsertArgs>(args: SelectSubset<T, SendEventUpsertArgs<ExtArgs>>): Prisma__SendEventClient<$Result.GetResult<Prisma.$SendEventPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SendEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendEventCountArgs} args - Arguments to filter SendEvents to count.
     * @example
     * // Count the number of SendEvents
     * const count = await prisma.sendEvent.count({
     *   where: {
     *     // ... the filter for the SendEvents we want to count
     *   }
     * })
    **/
    count<T extends SendEventCountArgs>(
      args?: Subset<T, SendEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SendEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SendEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SendEventAggregateArgs>(args: Subset<T, SendEventAggregateArgs>): Prisma.PrismaPromise<GetSendEventAggregateType<T>>

    /**
     * Group by SendEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SendEventGroupByArgs} args - Group by arguments.
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
      T extends SendEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SendEventGroupByArgs['orderBy'] }
        : { orderBy?: SendEventGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SendEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSendEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SendEvent model
   */
  readonly fields: SendEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SendEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SendEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sendJob<T extends SendJobDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SendJobDefaultArgs<ExtArgs>>): Prisma__SendJobClient<$Result.GetResult<Prisma.$SendJobPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the SendEvent model
   */ 
  interface SendEventFieldRefs {
    readonly id: FieldRef<"SendEvent", 'String'>
    readonly sendJobId: FieldRef<"SendEvent", 'String'>
    readonly eventType: FieldRef<"SendEvent", 'SendEventType'>
    readonly eventAt: FieldRef<"SendEvent", 'DateTime'>
    readonly urlClicked: FieldRef<"SendEvent", 'String'>
    readonly metadata: FieldRef<"SendEvent", 'String'>
  }
    

  // Custom InputTypes
  /**
   * SendEvent findUnique
   */
  export type SendEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    /**
     * Filter, which SendEvent to fetch.
     */
    where: SendEventWhereUniqueInput
  }

  /**
   * SendEvent findUniqueOrThrow
   */
  export type SendEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    /**
     * Filter, which SendEvent to fetch.
     */
    where: SendEventWhereUniqueInput
  }

  /**
   * SendEvent findFirst
   */
  export type SendEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    /**
     * Filter, which SendEvent to fetch.
     */
    where?: SendEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SendEvents to fetch.
     */
    orderBy?: SendEventOrderByWithRelationInput | SendEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SendEvents.
     */
    cursor?: SendEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SendEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SendEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SendEvents.
     */
    distinct?: SendEventScalarFieldEnum | SendEventScalarFieldEnum[]
  }

  /**
   * SendEvent findFirstOrThrow
   */
  export type SendEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    /**
     * Filter, which SendEvent to fetch.
     */
    where?: SendEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SendEvents to fetch.
     */
    orderBy?: SendEventOrderByWithRelationInput | SendEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SendEvents.
     */
    cursor?: SendEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SendEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SendEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SendEvents.
     */
    distinct?: SendEventScalarFieldEnum | SendEventScalarFieldEnum[]
  }

  /**
   * SendEvent findMany
   */
  export type SendEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    /**
     * Filter, which SendEvents to fetch.
     */
    where?: SendEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SendEvents to fetch.
     */
    orderBy?: SendEventOrderByWithRelationInput | SendEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SendEvents.
     */
    cursor?: SendEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SendEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SendEvents.
     */
    skip?: number
    distinct?: SendEventScalarFieldEnum | SendEventScalarFieldEnum[]
  }

  /**
   * SendEvent create
   */
  export type SendEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    /**
     * The data needed to create a SendEvent.
     */
    data: XOR<SendEventCreateInput, SendEventUncheckedCreateInput>
  }

  /**
   * SendEvent createMany
   */
  export type SendEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SendEvents.
     */
    data: SendEventCreateManyInput | SendEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SendEvent createManyAndReturn
   */
  export type SendEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SendEvents.
     */
    data: SendEventCreateManyInput | SendEventCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SendEvent update
   */
  export type SendEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    /**
     * The data needed to update a SendEvent.
     */
    data: XOR<SendEventUpdateInput, SendEventUncheckedUpdateInput>
    /**
     * Choose, which SendEvent to update.
     */
    where: SendEventWhereUniqueInput
  }

  /**
   * SendEvent updateMany
   */
  export type SendEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SendEvents.
     */
    data: XOR<SendEventUpdateManyMutationInput, SendEventUncheckedUpdateManyInput>
    /**
     * Filter which SendEvents to update
     */
    where?: SendEventWhereInput
  }

  /**
   * SendEvent upsert
   */
  export type SendEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    /**
     * The filter to search for the SendEvent to update in case it exists.
     */
    where: SendEventWhereUniqueInput
    /**
     * In case the SendEvent found by the `where` argument doesn't exist, create a new SendEvent with this data.
     */
    create: XOR<SendEventCreateInput, SendEventUncheckedCreateInput>
    /**
     * In case the SendEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SendEventUpdateInput, SendEventUncheckedUpdateInput>
  }

  /**
   * SendEvent delete
   */
  export type SendEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
    /**
     * Filter which SendEvent to delete.
     */
    where: SendEventWhereUniqueInput
  }

  /**
   * SendEvent deleteMany
   */
  export type SendEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SendEvents to delete
     */
    where?: SendEventWhereInput
  }

  /**
   * SendEvent without action
   */
  export type SendEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SendEvent
     */
    select?: SendEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SendEventInclude<ExtArgs> | null
  }


  /**
   * Model Suppression
   */

  export type AggregateSuppression = {
    _count: SuppressionCountAggregateOutputType | null
    _min: SuppressionMinAggregateOutputType | null
    _max: SuppressionMaxAggregateOutputType | null
  }

  export type SuppressionMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    channel: $Enums.MarketingChannel | null
    address: string | null
    reason: $Enums.SuppressionReason | null
    createdAt: Date | null
  }

  export type SuppressionMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    channel: $Enums.MarketingChannel | null
    address: string | null
    reason: $Enums.SuppressionReason | null
    createdAt: Date | null
  }

  export type SuppressionCountAggregateOutputType = {
    id: number
    companyId: number
    channel: number
    address: number
    reason: number
    createdAt: number
    _all: number
  }


  export type SuppressionMinAggregateInputType = {
    id?: true
    companyId?: true
    channel?: true
    address?: true
    reason?: true
    createdAt?: true
  }

  export type SuppressionMaxAggregateInputType = {
    id?: true
    companyId?: true
    channel?: true
    address?: true
    reason?: true
    createdAt?: true
  }

  export type SuppressionCountAggregateInputType = {
    id?: true
    companyId?: true
    channel?: true
    address?: true
    reason?: true
    createdAt?: true
    _all?: true
  }

  export type SuppressionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Suppression to aggregate.
     */
    where?: SuppressionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suppressions to fetch.
     */
    orderBy?: SuppressionOrderByWithRelationInput | SuppressionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SuppressionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suppressions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suppressions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Suppressions
    **/
    _count?: true | SuppressionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SuppressionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SuppressionMaxAggregateInputType
  }

  export type GetSuppressionAggregateType<T extends SuppressionAggregateArgs> = {
        [P in keyof T & keyof AggregateSuppression]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSuppression[P]>
      : GetScalarType<T[P], AggregateSuppression[P]>
  }




  export type SuppressionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SuppressionWhereInput
    orderBy?: SuppressionOrderByWithAggregationInput | SuppressionOrderByWithAggregationInput[]
    by: SuppressionScalarFieldEnum[] | SuppressionScalarFieldEnum
    having?: SuppressionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SuppressionCountAggregateInputType | true
    _min?: SuppressionMinAggregateInputType
    _max?: SuppressionMaxAggregateInputType
  }

  export type SuppressionGroupByOutputType = {
    id: string
    companyId: string
    channel: $Enums.MarketingChannel
    address: string
    reason: $Enums.SuppressionReason
    createdAt: Date
    _count: SuppressionCountAggregateOutputType | null
    _min: SuppressionMinAggregateOutputType | null
    _max: SuppressionMaxAggregateOutputType | null
  }

  type GetSuppressionGroupByPayload<T extends SuppressionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SuppressionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SuppressionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SuppressionGroupByOutputType[P]>
            : GetScalarType<T[P], SuppressionGroupByOutputType[P]>
        }
      >
    >


  export type SuppressionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    channel?: boolean
    address?: boolean
    reason?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["suppression"]>

  export type SuppressionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    channel?: boolean
    address?: boolean
    reason?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["suppression"]>

  export type SuppressionSelectScalar = {
    id?: boolean
    companyId?: boolean
    channel?: boolean
    address?: boolean
    reason?: boolean
    createdAt?: boolean
  }


  export type $SuppressionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Suppression"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      channel: $Enums.MarketingChannel
      address: string
      reason: $Enums.SuppressionReason
      createdAt: Date
    }, ExtArgs["result"]["suppression"]>
    composites: {}
  }

  type SuppressionGetPayload<S extends boolean | null | undefined | SuppressionDefaultArgs> = $Result.GetResult<Prisma.$SuppressionPayload, S>

  type SuppressionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SuppressionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SuppressionCountAggregateInputType | true
    }

  export interface SuppressionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Suppression'], meta: { name: 'Suppression' } }
    /**
     * Find zero or one Suppression that matches the filter.
     * @param {SuppressionFindUniqueArgs} args - Arguments to find a Suppression
     * @example
     * // Get one Suppression
     * const suppression = await prisma.suppression.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SuppressionFindUniqueArgs>(args: SelectSubset<T, SuppressionFindUniqueArgs<ExtArgs>>): Prisma__SuppressionClient<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Suppression that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SuppressionFindUniqueOrThrowArgs} args - Arguments to find a Suppression
     * @example
     * // Get one Suppression
     * const suppression = await prisma.suppression.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SuppressionFindUniqueOrThrowArgs>(args: SelectSubset<T, SuppressionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SuppressionClient<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Suppression that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuppressionFindFirstArgs} args - Arguments to find a Suppression
     * @example
     * // Get one Suppression
     * const suppression = await prisma.suppression.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SuppressionFindFirstArgs>(args?: SelectSubset<T, SuppressionFindFirstArgs<ExtArgs>>): Prisma__SuppressionClient<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Suppression that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuppressionFindFirstOrThrowArgs} args - Arguments to find a Suppression
     * @example
     * // Get one Suppression
     * const suppression = await prisma.suppression.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SuppressionFindFirstOrThrowArgs>(args?: SelectSubset<T, SuppressionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SuppressionClient<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Suppressions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuppressionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Suppressions
     * const suppressions = await prisma.suppression.findMany()
     * 
     * // Get first 10 Suppressions
     * const suppressions = await prisma.suppression.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const suppressionWithIdOnly = await prisma.suppression.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SuppressionFindManyArgs>(args?: SelectSubset<T, SuppressionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Suppression.
     * @param {SuppressionCreateArgs} args - Arguments to create a Suppression.
     * @example
     * // Create one Suppression
     * const Suppression = await prisma.suppression.create({
     *   data: {
     *     // ... data to create a Suppression
     *   }
     * })
     * 
     */
    create<T extends SuppressionCreateArgs>(args: SelectSubset<T, SuppressionCreateArgs<ExtArgs>>): Prisma__SuppressionClient<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Suppressions.
     * @param {SuppressionCreateManyArgs} args - Arguments to create many Suppressions.
     * @example
     * // Create many Suppressions
     * const suppression = await prisma.suppression.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SuppressionCreateManyArgs>(args?: SelectSubset<T, SuppressionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Suppressions and returns the data saved in the database.
     * @param {SuppressionCreateManyAndReturnArgs} args - Arguments to create many Suppressions.
     * @example
     * // Create many Suppressions
     * const suppression = await prisma.suppression.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Suppressions and only return the `id`
     * const suppressionWithIdOnly = await prisma.suppression.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SuppressionCreateManyAndReturnArgs>(args?: SelectSubset<T, SuppressionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Suppression.
     * @param {SuppressionDeleteArgs} args - Arguments to delete one Suppression.
     * @example
     * // Delete one Suppression
     * const Suppression = await prisma.suppression.delete({
     *   where: {
     *     // ... filter to delete one Suppression
     *   }
     * })
     * 
     */
    delete<T extends SuppressionDeleteArgs>(args: SelectSubset<T, SuppressionDeleteArgs<ExtArgs>>): Prisma__SuppressionClient<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Suppression.
     * @param {SuppressionUpdateArgs} args - Arguments to update one Suppression.
     * @example
     * // Update one Suppression
     * const suppression = await prisma.suppression.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SuppressionUpdateArgs>(args: SelectSubset<T, SuppressionUpdateArgs<ExtArgs>>): Prisma__SuppressionClient<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Suppressions.
     * @param {SuppressionDeleteManyArgs} args - Arguments to filter Suppressions to delete.
     * @example
     * // Delete a few Suppressions
     * const { count } = await prisma.suppression.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SuppressionDeleteManyArgs>(args?: SelectSubset<T, SuppressionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Suppressions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuppressionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Suppressions
     * const suppression = await prisma.suppression.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SuppressionUpdateManyArgs>(args: SelectSubset<T, SuppressionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Suppression.
     * @param {SuppressionUpsertArgs} args - Arguments to update or create a Suppression.
     * @example
     * // Update or create a Suppression
     * const suppression = await prisma.suppression.upsert({
     *   create: {
     *     // ... data to create a Suppression
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Suppression we want to update
     *   }
     * })
     */
    upsert<T extends SuppressionUpsertArgs>(args: SelectSubset<T, SuppressionUpsertArgs<ExtArgs>>): Prisma__SuppressionClient<$Result.GetResult<Prisma.$SuppressionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Suppressions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuppressionCountArgs} args - Arguments to filter Suppressions to count.
     * @example
     * // Count the number of Suppressions
     * const count = await prisma.suppression.count({
     *   where: {
     *     // ... the filter for the Suppressions we want to count
     *   }
     * })
    **/
    count<T extends SuppressionCountArgs>(
      args?: Subset<T, SuppressionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SuppressionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Suppression.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuppressionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SuppressionAggregateArgs>(args: Subset<T, SuppressionAggregateArgs>): Prisma.PrismaPromise<GetSuppressionAggregateType<T>>

    /**
     * Group by Suppression.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuppressionGroupByArgs} args - Group by arguments.
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
      T extends SuppressionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SuppressionGroupByArgs['orderBy'] }
        : { orderBy?: SuppressionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SuppressionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSuppressionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Suppression model
   */
  readonly fields: SuppressionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Suppression.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SuppressionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the Suppression model
   */ 
  interface SuppressionFieldRefs {
    readonly id: FieldRef<"Suppression", 'String'>
    readonly companyId: FieldRef<"Suppression", 'String'>
    readonly channel: FieldRef<"Suppression", 'MarketingChannel'>
    readonly address: FieldRef<"Suppression", 'String'>
    readonly reason: FieldRef<"Suppression", 'SuppressionReason'>
    readonly createdAt: FieldRef<"Suppression", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Suppression findUnique
   */
  export type SuppressionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
    /**
     * Filter, which Suppression to fetch.
     */
    where: SuppressionWhereUniqueInput
  }

  /**
   * Suppression findUniqueOrThrow
   */
  export type SuppressionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
    /**
     * Filter, which Suppression to fetch.
     */
    where: SuppressionWhereUniqueInput
  }

  /**
   * Suppression findFirst
   */
  export type SuppressionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
    /**
     * Filter, which Suppression to fetch.
     */
    where?: SuppressionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suppressions to fetch.
     */
    orderBy?: SuppressionOrderByWithRelationInput | SuppressionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Suppressions.
     */
    cursor?: SuppressionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suppressions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suppressions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Suppressions.
     */
    distinct?: SuppressionScalarFieldEnum | SuppressionScalarFieldEnum[]
  }

  /**
   * Suppression findFirstOrThrow
   */
  export type SuppressionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
    /**
     * Filter, which Suppression to fetch.
     */
    where?: SuppressionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suppressions to fetch.
     */
    orderBy?: SuppressionOrderByWithRelationInput | SuppressionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Suppressions.
     */
    cursor?: SuppressionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suppressions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suppressions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Suppressions.
     */
    distinct?: SuppressionScalarFieldEnum | SuppressionScalarFieldEnum[]
  }

  /**
   * Suppression findMany
   */
  export type SuppressionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
    /**
     * Filter, which Suppressions to fetch.
     */
    where?: SuppressionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suppressions to fetch.
     */
    orderBy?: SuppressionOrderByWithRelationInput | SuppressionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Suppressions.
     */
    cursor?: SuppressionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suppressions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suppressions.
     */
    skip?: number
    distinct?: SuppressionScalarFieldEnum | SuppressionScalarFieldEnum[]
  }

  /**
   * Suppression create
   */
  export type SuppressionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
    /**
     * The data needed to create a Suppression.
     */
    data: XOR<SuppressionCreateInput, SuppressionUncheckedCreateInput>
  }

  /**
   * Suppression createMany
   */
  export type SuppressionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Suppressions.
     */
    data: SuppressionCreateManyInput | SuppressionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Suppression createManyAndReturn
   */
  export type SuppressionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Suppressions.
     */
    data: SuppressionCreateManyInput | SuppressionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Suppression update
   */
  export type SuppressionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
    /**
     * The data needed to update a Suppression.
     */
    data: XOR<SuppressionUpdateInput, SuppressionUncheckedUpdateInput>
    /**
     * Choose, which Suppression to update.
     */
    where: SuppressionWhereUniqueInput
  }

  /**
   * Suppression updateMany
   */
  export type SuppressionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Suppressions.
     */
    data: XOR<SuppressionUpdateManyMutationInput, SuppressionUncheckedUpdateManyInput>
    /**
     * Filter which Suppressions to update
     */
    where?: SuppressionWhereInput
  }

  /**
   * Suppression upsert
   */
  export type SuppressionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
    /**
     * The filter to search for the Suppression to update in case it exists.
     */
    where: SuppressionWhereUniqueInput
    /**
     * In case the Suppression found by the `where` argument doesn't exist, create a new Suppression with this data.
     */
    create: XOR<SuppressionCreateInput, SuppressionUncheckedCreateInput>
    /**
     * In case the Suppression was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SuppressionUpdateInput, SuppressionUncheckedUpdateInput>
  }

  /**
   * Suppression delete
   */
  export type SuppressionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
    /**
     * Filter which Suppression to delete.
     */
    where: SuppressionWhereUniqueInput
  }

  /**
   * Suppression deleteMany
   */
  export type SuppressionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Suppressions to delete
     */
    where?: SuppressionWhereInput
  }

  /**
   * Suppression without action
   */
  export type SuppressionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suppression
     */
    select?: SuppressionSelect<ExtArgs> | null
  }


  /**
   * Model ReviewRequest
   */

  export type AggregateReviewRequest = {
    _count: ReviewRequestCountAggregateOutputType | null
    _avg: ReviewRequestAvgAggregateOutputType | null
    _sum: ReviewRequestSumAggregateOutputType | null
    _min: ReviewRequestMinAggregateOutputType | null
    _max: ReviewRequestMaxAggregateOutputType | null
  }

  export type ReviewRequestAvgAggregateOutputType = {
    gateScore: number | null
  }

  export type ReviewRequestSumAggregateOutputType = {
    gateScore: number | null
  }

  export type ReviewRequestMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    jobId: string | null
    status: $Enums.ReviewRequestStatus | null
    gateScore: number | null
    smsAt: Date | null
    emailAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReviewRequestMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    jobId: string | null
    status: $Enums.ReviewRequestStatus | null
    gateScore: number | null
    smsAt: Date | null
    emailAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReviewRequestCountAggregateOutputType = {
    id: number
    companyId: number
    customerId: number
    jobId: number
    status: number
    gateScore: number
    smsAt: number
    emailAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReviewRequestAvgAggregateInputType = {
    gateScore?: true
  }

  export type ReviewRequestSumAggregateInputType = {
    gateScore?: true
  }

  export type ReviewRequestMinAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    jobId?: true
    status?: true
    gateScore?: true
    smsAt?: true
    emailAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReviewRequestMaxAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    jobId?: true
    status?: true
    gateScore?: true
    smsAt?: true
    emailAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReviewRequestCountAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    jobId?: true
    status?: true
    gateScore?: true
    smsAt?: true
    emailAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReviewRequestAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReviewRequest to aggregate.
     */
    where?: ReviewRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReviewRequests to fetch.
     */
    orderBy?: ReviewRequestOrderByWithRelationInput | ReviewRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReviewRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReviewRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReviewRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ReviewRequests
    **/
    _count?: true | ReviewRequestCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReviewRequestAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReviewRequestSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReviewRequestMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReviewRequestMaxAggregateInputType
  }

  export type GetReviewRequestAggregateType<T extends ReviewRequestAggregateArgs> = {
        [P in keyof T & keyof AggregateReviewRequest]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReviewRequest[P]>
      : GetScalarType<T[P], AggregateReviewRequest[P]>
  }




  export type ReviewRequestGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReviewRequestWhereInput
    orderBy?: ReviewRequestOrderByWithAggregationInput | ReviewRequestOrderByWithAggregationInput[]
    by: ReviewRequestScalarFieldEnum[] | ReviewRequestScalarFieldEnum
    having?: ReviewRequestScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReviewRequestCountAggregateInputType | true
    _avg?: ReviewRequestAvgAggregateInputType
    _sum?: ReviewRequestSumAggregateInputType
    _min?: ReviewRequestMinAggregateInputType
    _max?: ReviewRequestMaxAggregateInputType
  }

  export type ReviewRequestGroupByOutputType = {
    id: string
    companyId: string
    customerId: string
    jobId: string
    status: $Enums.ReviewRequestStatus
    gateScore: number | null
    smsAt: Date | null
    emailAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ReviewRequestCountAggregateOutputType | null
    _avg: ReviewRequestAvgAggregateOutputType | null
    _sum: ReviewRequestSumAggregateOutputType | null
    _min: ReviewRequestMinAggregateOutputType | null
    _max: ReviewRequestMaxAggregateOutputType | null
  }

  type GetReviewRequestGroupByPayload<T extends ReviewRequestGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReviewRequestGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReviewRequestGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReviewRequestGroupByOutputType[P]>
            : GetScalarType<T[P], ReviewRequestGroupByOutputType[P]>
        }
      >
    >


  export type ReviewRequestSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    jobId?: boolean
    status?: boolean
    gateScore?: boolean
    smsAt?: boolean
    emailAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["reviewRequest"]>

  export type ReviewRequestSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    jobId?: boolean
    status?: boolean
    gateScore?: boolean
    smsAt?: boolean
    emailAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["reviewRequest"]>

  export type ReviewRequestSelectScalar = {
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    jobId?: boolean
    status?: boolean
    gateScore?: boolean
    smsAt?: boolean
    emailAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $ReviewRequestPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ReviewRequest"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      customerId: string
      jobId: string
      status: $Enums.ReviewRequestStatus
      gateScore: number | null
      smsAt: Date | null
      emailAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["reviewRequest"]>
    composites: {}
  }

  type ReviewRequestGetPayload<S extends boolean | null | undefined | ReviewRequestDefaultArgs> = $Result.GetResult<Prisma.$ReviewRequestPayload, S>

  type ReviewRequestCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ReviewRequestFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ReviewRequestCountAggregateInputType | true
    }

  export interface ReviewRequestDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ReviewRequest'], meta: { name: 'ReviewRequest' } }
    /**
     * Find zero or one ReviewRequest that matches the filter.
     * @param {ReviewRequestFindUniqueArgs} args - Arguments to find a ReviewRequest
     * @example
     * // Get one ReviewRequest
     * const reviewRequest = await prisma.reviewRequest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReviewRequestFindUniqueArgs>(args: SelectSubset<T, ReviewRequestFindUniqueArgs<ExtArgs>>): Prisma__ReviewRequestClient<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ReviewRequest that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ReviewRequestFindUniqueOrThrowArgs} args - Arguments to find a ReviewRequest
     * @example
     * // Get one ReviewRequest
     * const reviewRequest = await prisma.reviewRequest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReviewRequestFindUniqueOrThrowArgs>(args: SelectSubset<T, ReviewRequestFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReviewRequestClient<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ReviewRequest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewRequestFindFirstArgs} args - Arguments to find a ReviewRequest
     * @example
     * // Get one ReviewRequest
     * const reviewRequest = await prisma.reviewRequest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReviewRequestFindFirstArgs>(args?: SelectSubset<T, ReviewRequestFindFirstArgs<ExtArgs>>): Prisma__ReviewRequestClient<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ReviewRequest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewRequestFindFirstOrThrowArgs} args - Arguments to find a ReviewRequest
     * @example
     * // Get one ReviewRequest
     * const reviewRequest = await prisma.reviewRequest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReviewRequestFindFirstOrThrowArgs>(args?: SelectSubset<T, ReviewRequestFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReviewRequestClient<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ReviewRequests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewRequestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ReviewRequests
     * const reviewRequests = await prisma.reviewRequest.findMany()
     * 
     * // Get first 10 ReviewRequests
     * const reviewRequests = await prisma.reviewRequest.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const reviewRequestWithIdOnly = await prisma.reviewRequest.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReviewRequestFindManyArgs>(args?: SelectSubset<T, ReviewRequestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ReviewRequest.
     * @param {ReviewRequestCreateArgs} args - Arguments to create a ReviewRequest.
     * @example
     * // Create one ReviewRequest
     * const ReviewRequest = await prisma.reviewRequest.create({
     *   data: {
     *     // ... data to create a ReviewRequest
     *   }
     * })
     * 
     */
    create<T extends ReviewRequestCreateArgs>(args: SelectSubset<T, ReviewRequestCreateArgs<ExtArgs>>): Prisma__ReviewRequestClient<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ReviewRequests.
     * @param {ReviewRequestCreateManyArgs} args - Arguments to create many ReviewRequests.
     * @example
     * // Create many ReviewRequests
     * const reviewRequest = await prisma.reviewRequest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReviewRequestCreateManyArgs>(args?: SelectSubset<T, ReviewRequestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ReviewRequests and returns the data saved in the database.
     * @param {ReviewRequestCreateManyAndReturnArgs} args - Arguments to create many ReviewRequests.
     * @example
     * // Create many ReviewRequests
     * const reviewRequest = await prisma.reviewRequest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ReviewRequests and only return the `id`
     * const reviewRequestWithIdOnly = await prisma.reviewRequest.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReviewRequestCreateManyAndReturnArgs>(args?: SelectSubset<T, ReviewRequestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ReviewRequest.
     * @param {ReviewRequestDeleteArgs} args - Arguments to delete one ReviewRequest.
     * @example
     * // Delete one ReviewRequest
     * const ReviewRequest = await prisma.reviewRequest.delete({
     *   where: {
     *     // ... filter to delete one ReviewRequest
     *   }
     * })
     * 
     */
    delete<T extends ReviewRequestDeleteArgs>(args: SelectSubset<T, ReviewRequestDeleteArgs<ExtArgs>>): Prisma__ReviewRequestClient<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ReviewRequest.
     * @param {ReviewRequestUpdateArgs} args - Arguments to update one ReviewRequest.
     * @example
     * // Update one ReviewRequest
     * const reviewRequest = await prisma.reviewRequest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReviewRequestUpdateArgs>(args: SelectSubset<T, ReviewRequestUpdateArgs<ExtArgs>>): Prisma__ReviewRequestClient<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ReviewRequests.
     * @param {ReviewRequestDeleteManyArgs} args - Arguments to filter ReviewRequests to delete.
     * @example
     * // Delete a few ReviewRequests
     * const { count } = await prisma.reviewRequest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReviewRequestDeleteManyArgs>(args?: SelectSubset<T, ReviewRequestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReviewRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewRequestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ReviewRequests
     * const reviewRequest = await prisma.reviewRequest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReviewRequestUpdateManyArgs>(args: SelectSubset<T, ReviewRequestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ReviewRequest.
     * @param {ReviewRequestUpsertArgs} args - Arguments to update or create a ReviewRequest.
     * @example
     * // Update or create a ReviewRequest
     * const reviewRequest = await prisma.reviewRequest.upsert({
     *   create: {
     *     // ... data to create a ReviewRequest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ReviewRequest we want to update
     *   }
     * })
     */
    upsert<T extends ReviewRequestUpsertArgs>(args: SelectSubset<T, ReviewRequestUpsertArgs<ExtArgs>>): Prisma__ReviewRequestClient<$Result.GetResult<Prisma.$ReviewRequestPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ReviewRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewRequestCountArgs} args - Arguments to filter ReviewRequests to count.
     * @example
     * // Count the number of ReviewRequests
     * const count = await prisma.reviewRequest.count({
     *   where: {
     *     // ... the filter for the ReviewRequests we want to count
     *   }
     * })
    **/
    count<T extends ReviewRequestCountArgs>(
      args?: Subset<T, ReviewRequestCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReviewRequestCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ReviewRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewRequestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ReviewRequestAggregateArgs>(args: Subset<T, ReviewRequestAggregateArgs>): Prisma.PrismaPromise<GetReviewRequestAggregateType<T>>

    /**
     * Group by ReviewRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewRequestGroupByArgs} args - Group by arguments.
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
      T extends ReviewRequestGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReviewRequestGroupByArgs['orderBy'] }
        : { orderBy?: ReviewRequestGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ReviewRequestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReviewRequestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ReviewRequest model
   */
  readonly fields: ReviewRequestFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ReviewRequest.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReviewRequestClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the ReviewRequest model
   */ 
  interface ReviewRequestFieldRefs {
    readonly id: FieldRef<"ReviewRequest", 'String'>
    readonly companyId: FieldRef<"ReviewRequest", 'String'>
    readonly customerId: FieldRef<"ReviewRequest", 'String'>
    readonly jobId: FieldRef<"ReviewRequest", 'String'>
    readonly status: FieldRef<"ReviewRequest", 'ReviewRequestStatus'>
    readonly gateScore: FieldRef<"ReviewRequest", 'Float'>
    readonly smsAt: FieldRef<"ReviewRequest", 'DateTime'>
    readonly emailAt: FieldRef<"ReviewRequest", 'DateTime'>
    readonly createdAt: FieldRef<"ReviewRequest", 'DateTime'>
    readonly updatedAt: FieldRef<"ReviewRequest", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ReviewRequest findUnique
   */
  export type ReviewRequestFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
    /**
     * Filter, which ReviewRequest to fetch.
     */
    where: ReviewRequestWhereUniqueInput
  }

  /**
   * ReviewRequest findUniqueOrThrow
   */
  export type ReviewRequestFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
    /**
     * Filter, which ReviewRequest to fetch.
     */
    where: ReviewRequestWhereUniqueInput
  }

  /**
   * ReviewRequest findFirst
   */
  export type ReviewRequestFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
    /**
     * Filter, which ReviewRequest to fetch.
     */
    where?: ReviewRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReviewRequests to fetch.
     */
    orderBy?: ReviewRequestOrderByWithRelationInput | ReviewRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReviewRequests.
     */
    cursor?: ReviewRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReviewRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReviewRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReviewRequests.
     */
    distinct?: ReviewRequestScalarFieldEnum | ReviewRequestScalarFieldEnum[]
  }

  /**
   * ReviewRequest findFirstOrThrow
   */
  export type ReviewRequestFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
    /**
     * Filter, which ReviewRequest to fetch.
     */
    where?: ReviewRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReviewRequests to fetch.
     */
    orderBy?: ReviewRequestOrderByWithRelationInput | ReviewRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReviewRequests.
     */
    cursor?: ReviewRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReviewRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReviewRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReviewRequests.
     */
    distinct?: ReviewRequestScalarFieldEnum | ReviewRequestScalarFieldEnum[]
  }

  /**
   * ReviewRequest findMany
   */
  export type ReviewRequestFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
    /**
     * Filter, which ReviewRequests to fetch.
     */
    where?: ReviewRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReviewRequests to fetch.
     */
    orderBy?: ReviewRequestOrderByWithRelationInput | ReviewRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ReviewRequests.
     */
    cursor?: ReviewRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReviewRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReviewRequests.
     */
    skip?: number
    distinct?: ReviewRequestScalarFieldEnum | ReviewRequestScalarFieldEnum[]
  }

  /**
   * ReviewRequest create
   */
  export type ReviewRequestCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
    /**
     * The data needed to create a ReviewRequest.
     */
    data: XOR<ReviewRequestCreateInput, ReviewRequestUncheckedCreateInput>
  }

  /**
   * ReviewRequest createMany
   */
  export type ReviewRequestCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ReviewRequests.
     */
    data: ReviewRequestCreateManyInput | ReviewRequestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReviewRequest createManyAndReturn
   */
  export type ReviewRequestCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ReviewRequests.
     */
    data: ReviewRequestCreateManyInput | ReviewRequestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReviewRequest update
   */
  export type ReviewRequestUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
    /**
     * The data needed to update a ReviewRequest.
     */
    data: XOR<ReviewRequestUpdateInput, ReviewRequestUncheckedUpdateInput>
    /**
     * Choose, which ReviewRequest to update.
     */
    where: ReviewRequestWhereUniqueInput
  }

  /**
   * ReviewRequest updateMany
   */
  export type ReviewRequestUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ReviewRequests.
     */
    data: XOR<ReviewRequestUpdateManyMutationInput, ReviewRequestUncheckedUpdateManyInput>
    /**
     * Filter which ReviewRequests to update
     */
    where?: ReviewRequestWhereInput
  }

  /**
   * ReviewRequest upsert
   */
  export type ReviewRequestUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
    /**
     * The filter to search for the ReviewRequest to update in case it exists.
     */
    where: ReviewRequestWhereUniqueInput
    /**
     * In case the ReviewRequest found by the `where` argument doesn't exist, create a new ReviewRequest with this data.
     */
    create: XOR<ReviewRequestCreateInput, ReviewRequestUncheckedCreateInput>
    /**
     * In case the ReviewRequest was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReviewRequestUpdateInput, ReviewRequestUncheckedUpdateInput>
  }

  /**
   * ReviewRequest delete
   */
  export type ReviewRequestDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
    /**
     * Filter which ReviewRequest to delete.
     */
    where: ReviewRequestWhereUniqueInput
  }

  /**
   * ReviewRequest deleteMany
   */
  export type ReviewRequestDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReviewRequests to delete
     */
    where?: ReviewRequestWhereInput
  }

  /**
   * ReviewRequest without action
   */
  export type ReviewRequestDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReviewRequest
     */
    select?: ReviewRequestSelect<ExtArgs> | null
  }


  /**
   * Model MarketingAttribution
   */

  export type AggregateMarketingAttribution = {
    _count: MarketingAttributionCountAggregateOutputType | null
    _avg: MarketingAttributionAvgAggregateOutputType | null
    _sum: MarketingAttributionSumAggregateOutputType | null
    _min: MarketingAttributionMinAggregateOutputType | null
    _max: MarketingAttributionMaxAggregateOutputType | null
  }

  export type MarketingAttributionAvgAggregateOutputType = {
    revenueAttributed: Decimal | null
  }

  export type MarketingAttributionSumAggregateOutputType = {
    revenueAttributed: Decimal | null
  }

  export type MarketingAttributionMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    jobId: string | null
    invoiceId: string | null
    source: string | null
    adName: string | null
    formId: string | null
    clickedAt: Date | null
    revenueAttributed: Decimal | null
    createdAt: Date | null
  }

  export type MarketingAttributionMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    jobId: string | null
    invoiceId: string | null
    source: string | null
    adName: string | null
    formId: string | null
    clickedAt: Date | null
    revenueAttributed: Decimal | null
    createdAt: Date | null
  }

  export type MarketingAttributionCountAggregateOutputType = {
    id: number
    companyId: number
    customerId: number
    jobId: number
    invoiceId: number
    source: number
    adName: number
    formId: number
    clickedAt: number
    revenueAttributed: number
    createdAt: number
    _all: number
  }


  export type MarketingAttributionAvgAggregateInputType = {
    revenueAttributed?: true
  }

  export type MarketingAttributionSumAggregateInputType = {
    revenueAttributed?: true
  }

  export type MarketingAttributionMinAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    jobId?: true
    invoiceId?: true
    source?: true
    adName?: true
    formId?: true
    clickedAt?: true
    revenueAttributed?: true
    createdAt?: true
  }

  export type MarketingAttributionMaxAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    jobId?: true
    invoiceId?: true
    source?: true
    adName?: true
    formId?: true
    clickedAt?: true
    revenueAttributed?: true
    createdAt?: true
  }

  export type MarketingAttributionCountAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    jobId?: true
    invoiceId?: true
    source?: true
    adName?: true
    formId?: true
    clickedAt?: true
    revenueAttributed?: true
    createdAt?: true
    _all?: true
  }

  export type MarketingAttributionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MarketingAttribution to aggregate.
     */
    where?: MarketingAttributionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketingAttributions to fetch.
     */
    orderBy?: MarketingAttributionOrderByWithRelationInput | MarketingAttributionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MarketingAttributionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketingAttributions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketingAttributions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MarketingAttributions
    **/
    _count?: true | MarketingAttributionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MarketingAttributionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MarketingAttributionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MarketingAttributionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MarketingAttributionMaxAggregateInputType
  }

  export type GetMarketingAttributionAggregateType<T extends MarketingAttributionAggregateArgs> = {
        [P in keyof T & keyof AggregateMarketingAttribution]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMarketingAttribution[P]>
      : GetScalarType<T[P], AggregateMarketingAttribution[P]>
  }




  export type MarketingAttributionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MarketingAttributionWhereInput
    orderBy?: MarketingAttributionOrderByWithAggregationInput | MarketingAttributionOrderByWithAggregationInput[]
    by: MarketingAttributionScalarFieldEnum[] | MarketingAttributionScalarFieldEnum
    having?: MarketingAttributionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MarketingAttributionCountAggregateInputType | true
    _avg?: MarketingAttributionAvgAggregateInputType
    _sum?: MarketingAttributionSumAggregateInputType
    _min?: MarketingAttributionMinAggregateInputType
    _max?: MarketingAttributionMaxAggregateInputType
  }

  export type MarketingAttributionGroupByOutputType = {
    id: string
    companyId: string
    customerId: string
    jobId: string | null
    invoiceId: string | null
    source: string
    adName: string | null
    formId: string | null
    clickedAt: Date | null
    revenueAttributed: Decimal
    createdAt: Date
    _count: MarketingAttributionCountAggregateOutputType | null
    _avg: MarketingAttributionAvgAggregateOutputType | null
    _sum: MarketingAttributionSumAggregateOutputType | null
    _min: MarketingAttributionMinAggregateOutputType | null
    _max: MarketingAttributionMaxAggregateOutputType | null
  }

  type GetMarketingAttributionGroupByPayload<T extends MarketingAttributionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MarketingAttributionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MarketingAttributionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MarketingAttributionGroupByOutputType[P]>
            : GetScalarType<T[P], MarketingAttributionGroupByOutputType[P]>
        }
      >
    >


  export type MarketingAttributionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    jobId?: boolean
    invoiceId?: boolean
    source?: boolean
    adName?: boolean
    formId?: boolean
    clickedAt?: boolean
    revenueAttributed?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["marketingAttribution"]>

  export type MarketingAttributionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    jobId?: boolean
    invoiceId?: boolean
    source?: boolean
    adName?: boolean
    formId?: boolean
    clickedAt?: boolean
    revenueAttributed?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["marketingAttribution"]>

  export type MarketingAttributionSelectScalar = {
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    jobId?: boolean
    invoiceId?: boolean
    source?: boolean
    adName?: boolean
    formId?: boolean
    clickedAt?: boolean
    revenueAttributed?: boolean
    createdAt?: boolean
  }


  export type $MarketingAttributionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MarketingAttribution"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      customerId: string
      jobId: string | null
      invoiceId: string | null
      source: string
      adName: string | null
      formId: string | null
      clickedAt: Date | null
      revenueAttributed: Prisma.Decimal
      createdAt: Date
    }, ExtArgs["result"]["marketingAttribution"]>
    composites: {}
  }

  type MarketingAttributionGetPayload<S extends boolean | null | undefined | MarketingAttributionDefaultArgs> = $Result.GetResult<Prisma.$MarketingAttributionPayload, S>

  type MarketingAttributionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<MarketingAttributionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: MarketingAttributionCountAggregateInputType | true
    }

  export interface MarketingAttributionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MarketingAttribution'], meta: { name: 'MarketingAttribution' } }
    /**
     * Find zero or one MarketingAttribution that matches the filter.
     * @param {MarketingAttributionFindUniqueArgs} args - Arguments to find a MarketingAttribution
     * @example
     * // Get one MarketingAttribution
     * const marketingAttribution = await prisma.marketingAttribution.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MarketingAttributionFindUniqueArgs>(args: SelectSubset<T, MarketingAttributionFindUniqueArgs<ExtArgs>>): Prisma__MarketingAttributionClient<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one MarketingAttribution that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {MarketingAttributionFindUniqueOrThrowArgs} args - Arguments to find a MarketingAttribution
     * @example
     * // Get one MarketingAttribution
     * const marketingAttribution = await prisma.marketingAttribution.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MarketingAttributionFindUniqueOrThrowArgs>(args: SelectSubset<T, MarketingAttributionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MarketingAttributionClient<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first MarketingAttribution that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketingAttributionFindFirstArgs} args - Arguments to find a MarketingAttribution
     * @example
     * // Get one MarketingAttribution
     * const marketingAttribution = await prisma.marketingAttribution.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MarketingAttributionFindFirstArgs>(args?: SelectSubset<T, MarketingAttributionFindFirstArgs<ExtArgs>>): Prisma__MarketingAttributionClient<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first MarketingAttribution that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketingAttributionFindFirstOrThrowArgs} args - Arguments to find a MarketingAttribution
     * @example
     * // Get one MarketingAttribution
     * const marketingAttribution = await prisma.marketingAttribution.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MarketingAttributionFindFirstOrThrowArgs>(args?: SelectSubset<T, MarketingAttributionFindFirstOrThrowArgs<ExtArgs>>): Prisma__MarketingAttributionClient<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more MarketingAttributions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketingAttributionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MarketingAttributions
     * const marketingAttributions = await prisma.marketingAttribution.findMany()
     * 
     * // Get first 10 MarketingAttributions
     * const marketingAttributions = await prisma.marketingAttribution.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const marketingAttributionWithIdOnly = await prisma.marketingAttribution.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MarketingAttributionFindManyArgs>(args?: SelectSubset<T, MarketingAttributionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a MarketingAttribution.
     * @param {MarketingAttributionCreateArgs} args - Arguments to create a MarketingAttribution.
     * @example
     * // Create one MarketingAttribution
     * const MarketingAttribution = await prisma.marketingAttribution.create({
     *   data: {
     *     // ... data to create a MarketingAttribution
     *   }
     * })
     * 
     */
    create<T extends MarketingAttributionCreateArgs>(args: SelectSubset<T, MarketingAttributionCreateArgs<ExtArgs>>): Prisma__MarketingAttributionClient<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many MarketingAttributions.
     * @param {MarketingAttributionCreateManyArgs} args - Arguments to create many MarketingAttributions.
     * @example
     * // Create many MarketingAttributions
     * const marketingAttribution = await prisma.marketingAttribution.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MarketingAttributionCreateManyArgs>(args?: SelectSubset<T, MarketingAttributionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MarketingAttributions and returns the data saved in the database.
     * @param {MarketingAttributionCreateManyAndReturnArgs} args - Arguments to create many MarketingAttributions.
     * @example
     * // Create many MarketingAttributions
     * const marketingAttribution = await prisma.marketingAttribution.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MarketingAttributions and only return the `id`
     * const marketingAttributionWithIdOnly = await prisma.marketingAttribution.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MarketingAttributionCreateManyAndReturnArgs>(args?: SelectSubset<T, MarketingAttributionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a MarketingAttribution.
     * @param {MarketingAttributionDeleteArgs} args - Arguments to delete one MarketingAttribution.
     * @example
     * // Delete one MarketingAttribution
     * const MarketingAttribution = await prisma.marketingAttribution.delete({
     *   where: {
     *     // ... filter to delete one MarketingAttribution
     *   }
     * })
     * 
     */
    delete<T extends MarketingAttributionDeleteArgs>(args: SelectSubset<T, MarketingAttributionDeleteArgs<ExtArgs>>): Prisma__MarketingAttributionClient<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one MarketingAttribution.
     * @param {MarketingAttributionUpdateArgs} args - Arguments to update one MarketingAttribution.
     * @example
     * // Update one MarketingAttribution
     * const marketingAttribution = await prisma.marketingAttribution.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MarketingAttributionUpdateArgs>(args: SelectSubset<T, MarketingAttributionUpdateArgs<ExtArgs>>): Prisma__MarketingAttributionClient<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more MarketingAttributions.
     * @param {MarketingAttributionDeleteManyArgs} args - Arguments to filter MarketingAttributions to delete.
     * @example
     * // Delete a few MarketingAttributions
     * const { count } = await prisma.marketingAttribution.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MarketingAttributionDeleteManyArgs>(args?: SelectSubset<T, MarketingAttributionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MarketingAttributions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketingAttributionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MarketingAttributions
     * const marketingAttribution = await prisma.marketingAttribution.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MarketingAttributionUpdateManyArgs>(args: SelectSubset<T, MarketingAttributionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one MarketingAttribution.
     * @param {MarketingAttributionUpsertArgs} args - Arguments to update or create a MarketingAttribution.
     * @example
     * // Update or create a MarketingAttribution
     * const marketingAttribution = await prisma.marketingAttribution.upsert({
     *   create: {
     *     // ... data to create a MarketingAttribution
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MarketingAttribution we want to update
     *   }
     * })
     */
    upsert<T extends MarketingAttributionUpsertArgs>(args: SelectSubset<T, MarketingAttributionUpsertArgs<ExtArgs>>): Prisma__MarketingAttributionClient<$Result.GetResult<Prisma.$MarketingAttributionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of MarketingAttributions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketingAttributionCountArgs} args - Arguments to filter MarketingAttributions to count.
     * @example
     * // Count the number of MarketingAttributions
     * const count = await prisma.marketingAttribution.count({
     *   where: {
     *     // ... the filter for the MarketingAttributions we want to count
     *   }
     * })
    **/
    count<T extends MarketingAttributionCountArgs>(
      args?: Subset<T, MarketingAttributionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MarketingAttributionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MarketingAttribution.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketingAttributionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends MarketingAttributionAggregateArgs>(args: Subset<T, MarketingAttributionAggregateArgs>): Prisma.PrismaPromise<GetMarketingAttributionAggregateType<T>>

    /**
     * Group by MarketingAttribution.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketingAttributionGroupByArgs} args - Group by arguments.
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
      T extends MarketingAttributionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MarketingAttributionGroupByArgs['orderBy'] }
        : { orderBy?: MarketingAttributionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, MarketingAttributionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMarketingAttributionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MarketingAttribution model
   */
  readonly fields: MarketingAttributionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MarketingAttribution.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MarketingAttributionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the MarketingAttribution model
   */ 
  interface MarketingAttributionFieldRefs {
    readonly id: FieldRef<"MarketingAttribution", 'String'>
    readonly companyId: FieldRef<"MarketingAttribution", 'String'>
    readonly customerId: FieldRef<"MarketingAttribution", 'String'>
    readonly jobId: FieldRef<"MarketingAttribution", 'String'>
    readonly invoiceId: FieldRef<"MarketingAttribution", 'String'>
    readonly source: FieldRef<"MarketingAttribution", 'String'>
    readonly adName: FieldRef<"MarketingAttribution", 'String'>
    readonly formId: FieldRef<"MarketingAttribution", 'String'>
    readonly clickedAt: FieldRef<"MarketingAttribution", 'DateTime'>
    readonly revenueAttributed: FieldRef<"MarketingAttribution", 'Decimal'>
    readonly createdAt: FieldRef<"MarketingAttribution", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MarketingAttribution findUnique
   */
  export type MarketingAttributionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
    /**
     * Filter, which MarketingAttribution to fetch.
     */
    where: MarketingAttributionWhereUniqueInput
  }

  /**
   * MarketingAttribution findUniqueOrThrow
   */
  export type MarketingAttributionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
    /**
     * Filter, which MarketingAttribution to fetch.
     */
    where: MarketingAttributionWhereUniqueInput
  }

  /**
   * MarketingAttribution findFirst
   */
  export type MarketingAttributionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
    /**
     * Filter, which MarketingAttribution to fetch.
     */
    where?: MarketingAttributionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketingAttributions to fetch.
     */
    orderBy?: MarketingAttributionOrderByWithRelationInput | MarketingAttributionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MarketingAttributions.
     */
    cursor?: MarketingAttributionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketingAttributions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketingAttributions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarketingAttributions.
     */
    distinct?: MarketingAttributionScalarFieldEnum | MarketingAttributionScalarFieldEnum[]
  }

  /**
   * MarketingAttribution findFirstOrThrow
   */
  export type MarketingAttributionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
    /**
     * Filter, which MarketingAttribution to fetch.
     */
    where?: MarketingAttributionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketingAttributions to fetch.
     */
    orderBy?: MarketingAttributionOrderByWithRelationInput | MarketingAttributionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MarketingAttributions.
     */
    cursor?: MarketingAttributionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketingAttributions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketingAttributions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarketingAttributions.
     */
    distinct?: MarketingAttributionScalarFieldEnum | MarketingAttributionScalarFieldEnum[]
  }

  /**
   * MarketingAttribution findMany
   */
  export type MarketingAttributionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
    /**
     * Filter, which MarketingAttributions to fetch.
     */
    where?: MarketingAttributionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketingAttributions to fetch.
     */
    orderBy?: MarketingAttributionOrderByWithRelationInput | MarketingAttributionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MarketingAttributions.
     */
    cursor?: MarketingAttributionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketingAttributions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketingAttributions.
     */
    skip?: number
    distinct?: MarketingAttributionScalarFieldEnum | MarketingAttributionScalarFieldEnum[]
  }

  /**
   * MarketingAttribution create
   */
  export type MarketingAttributionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
    /**
     * The data needed to create a MarketingAttribution.
     */
    data: XOR<MarketingAttributionCreateInput, MarketingAttributionUncheckedCreateInput>
  }

  /**
   * MarketingAttribution createMany
   */
  export type MarketingAttributionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MarketingAttributions.
     */
    data: MarketingAttributionCreateManyInput | MarketingAttributionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MarketingAttribution createManyAndReturn
   */
  export type MarketingAttributionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many MarketingAttributions.
     */
    data: MarketingAttributionCreateManyInput | MarketingAttributionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MarketingAttribution update
   */
  export type MarketingAttributionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
    /**
     * The data needed to update a MarketingAttribution.
     */
    data: XOR<MarketingAttributionUpdateInput, MarketingAttributionUncheckedUpdateInput>
    /**
     * Choose, which MarketingAttribution to update.
     */
    where: MarketingAttributionWhereUniqueInput
  }

  /**
   * MarketingAttribution updateMany
   */
  export type MarketingAttributionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MarketingAttributions.
     */
    data: XOR<MarketingAttributionUpdateManyMutationInput, MarketingAttributionUncheckedUpdateManyInput>
    /**
     * Filter which MarketingAttributions to update
     */
    where?: MarketingAttributionWhereInput
  }

  /**
   * MarketingAttribution upsert
   */
  export type MarketingAttributionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
    /**
     * The filter to search for the MarketingAttribution to update in case it exists.
     */
    where: MarketingAttributionWhereUniqueInput
    /**
     * In case the MarketingAttribution found by the `where` argument doesn't exist, create a new MarketingAttribution with this data.
     */
    create: XOR<MarketingAttributionCreateInput, MarketingAttributionUncheckedCreateInput>
    /**
     * In case the MarketingAttribution was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MarketingAttributionUpdateInput, MarketingAttributionUncheckedUpdateInput>
  }

  /**
   * MarketingAttribution delete
   */
  export type MarketingAttributionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
    /**
     * Filter which MarketingAttribution to delete.
     */
    where: MarketingAttributionWhereUniqueInput
  }

  /**
   * MarketingAttribution deleteMany
   */
  export type MarketingAttributionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MarketingAttributions to delete
     */
    where?: MarketingAttributionWhereInput
  }

  /**
   * MarketingAttribution without action
   */
  export type MarketingAttributionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketingAttribution
     */
    select?: MarketingAttributionSelect<ExtArgs> | null
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


  export const CampaignScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    name: 'name',
    channel: 'channel',
    status: 'status',
    audienceId: 'audienceId',
    templateId: 'templateId',
    scheduleAt: 'scheduleAt',
    createdBy: 'createdBy',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CampaignScalarFieldEnum = (typeof CampaignScalarFieldEnum)[keyof typeof CampaignScalarFieldEnum]


  export const TemplateScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    channel: 'channel',
    name: 'name',
    subject: 'subject',
    htmlBody: 'htmlBody',
    smsBody: 'smsBody',
    mergeTagsJson: 'mergeTagsJson',
    isDefault: 'isDefault',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TemplateScalarFieldEnum = (typeof TemplateScalarFieldEnum)[keyof typeof TemplateScalarFieldEnum]


  export const AudienceScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    name: 'name',
    type: 'type',
    filtersJson: 'filtersJson',
    lastCount: 'lastCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AudienceScalarFieldEnum = (typeof AudienceScalarFieldEnum)[keyof typeof AudienceScalarFieldEnum]


  export const SendJobScalarFieldEnum: {
    id: 'id',
    campaignId: 'campaignId',
    companyId: 'companyId',
    customerId: 'customerId',
    channel: 'channel',
    address: 'address',
    status: 'status',
    scheduledAt: 'scheduledAt',
    sentAt: 'sentAt',
    externalId: 'externalId',
    automationTemplate: 'automationTemplate',
    error: 'error',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SendJobScalarFieldEnum = (typeof SendJobScalarFieldEnum)[keyof typeof SendJobScalarFieldEnum]


  export const SendEventScalarFieldEnum: {
    id: 'id',
    sendJobId: 'sendJobId',
    eventType: 'eventType',
    eventAt: 'eventAt',
    urlClicked: 'urlClicked',
    metadata: 'metadata'
  };

  export type SendEventScalarFieldEnum = (typeof SendEventScalarFieldEnum)[keyof typeof SendEventScalarFieldEnum]


  export const SuppressionScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    channel: 'channel',
    address: 'address',
    reason: 'reason',
    createdAt: 'createdAt'
  };

  export type SuppressionScalarFieldEnum = (typeof SuppressionScalarFieldEnum)[keyof typeof SuppressionScalarFieldEnum]


  export const ReviewRequestScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    customerId: 'customerId',
    jobId: 'jobId',
    status: 'status',
    gateScore: 'gateScore',
    smsAt: 'smsAt',
    emailAt: 'emailAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReviewRequestScalarFieldEnum = (typeof ReviewRequestScalarFieldEnum)[keyof typeof ReviewRequestScalarFieldEnum]


  export const MarketingAttributionScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    customerId: 'customerId',
    jobId: 'jobId',
    invoiceId: 'invoiceId',
    source: 'source',
    adName: 'adName',
    formId: 'formId',
    clickedAt: 'clickedAt',
    revenueAttributed: 'revenueAttributed',
    createdAt: 'createdAt'
  };

  export type MarketingAttributionScalarFieldEnum = (typeof MarketingAttributionScalarFieldEnum)[keyof typeof MarketingAttributionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


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
   * Reference to a field of type 'MarketingChannel'
   */
  export type EnumMarketingChannelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MarketingChannel'>
    


  /**
   * Reference to a field of type 'MarketingChannel[]'
   */
  export type ListEnumMarketingChannelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MarketingChannel[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'AudienceType'
   */
  export type EnumAudienceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AudienceType'>
    


  /**
   * Reference to a field of type 'AudienceType[]'
   */
  export type ListEnumAudienceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AudienceType[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'SendJobStatus'
   */
  export type EnumSendJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SendJobStatus'>
    


  /**
   * Reference to a field of type 'SendJobStatus[]'
   */
  export type ListEnumSendJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SendJobStatus[]'>
    


  /**
   * Reference to a field of type 'SendEventType'
   */
  export type EnumSendEventTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SendEventType'>
    


  /**
   * Reference to a field of type 'SendEventType[]'
   */
  export type ListEnumSendEventTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SendEventType[]'>
    


  /**
   * Reference to a field of type 'SuppressionReason'
   */
  export type EnumSuppressionReasonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuppressionReason'>
    


  /**
   * Reference to a field of type 'SuppressionReason[]'
   */
  export type ListEnumSuppressionReasonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuppressionReason[]'>
    


  /**
   * Reference to a field of type 'ReviewRequestStatus'
   */
  export type EnumReviewRequestStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ReviewRequestStatus'>
    


  /**
   * Reference to a field of type 'ReviewRequestStatus[]'
   */
  export type ListEnumReviewRequestStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ReviewRequestStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    
  /**
   * Deep Input Types
   */


  export type CampaignWhereInput = {
    AND?: CampaignWhereInput | CampaignWhereInput[]
    OR?: CampaignWhereInput[]
    NOT?: CampaignWhereInput | CampaignWhereInput[]
    id?: StringFilter<"Campaign"> | string
    companyId?: StringFilter<"Campaign"> | string
    name?: StringFilter<"Campaign"> | string
    channel?: EnumMarketingChannelFilter<"Campaign"> | $Enums.MarketingChannel
    status?: StringFilter<"Campaign"> | string
    audienceId?: StringNullableFilter<"Campaign"> | string | null
    templateId?: StringNullableFilter<"Campaign"> | string | null
    scheduleAt?: DateTimeNullableFilter<"Campaign"> | Date | string | null
    createdBy?: StringFilter<"Campaign"> | string
    createdAt?: DateTimeFilter<"Campaign"> | Date | string
    updatedAt?: DateTimeFilter<"Campaign"> | Date | string
    sendJobs?: SendJobListRelationFilter
  }

  export type CampaignOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    audienceId?: SortOrderInput | SortOrder
    templateId?: SortOrderInput | SortOrder
    scheduleAt?: SortOrderInput | SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sendJobs?: SendJobOrderByRelationAggregateInput
  }

  export type CampaignWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CampaignWhereInput | CampaignWhereInput[]
    OR?: CampaignWhereInput[]
    NOT?: CampaignWhereInput | CampaignWhereInput[]
    companyId?: StringFilter<"Campaign"> | string
    name?: StringFilter<"Campaign"> | string
    channel?: EnumMarketingChannelFilter<"Campaign"> | $Enums.MarketingChannel
    status?: StringFilter<"Campaign"> | string
    audienceId?: StringNullableFilter<"Campaign"> | string | null
    templateId?: StringNullableFilter<"Campaign"> | string | null
    scheduleAt?: DateTimeNullableFilter<"Campaign"> | Date | string | null
    createdBy?: StringFilter<"Campaign"> | string
    createdAt?: DateTimeFilter<"Campaign"> | Date | string
    updatedAt?: DateTimeFilter<"Campaign"> | Date | string
    sendJobs?: SendJobListRelationFilter
  }, "id">

  export type CampaignOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    audienceId?: SortOrderInput | SortOrder
    templateId?: SortOrderInput | SortOrder
    scheduleAt?: SortOrderInput | SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CampaignCountOrderByAggregateInput
    _max?: CampaignMaxOrderByAggregateInput
    _min?: CampaignMinOrderByAggregateInput
  }

  export type CampaignScalarWhereWithAggregatesInput = {
    AND?: CampaignScalarWhereWithAggregatesInput | CampaignScalarWhereWithAggregatesInput[]
    OR?: CampaignScalarWhereWithAggregatesInput[]
    NOT?: CampaignScalarWhereWithAggregatesInput | CampaignScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Campaign"> | string
    companyId?: StringWithAggregatesFilter<"Campaign"> | string
    name?: StringWithAggregatesFilter<"Campaign"> | string
    channel?: EnumMarketingChannelWithAggregatesFilter<"Campaign"> | $Enums.MarketingChannel
    status?: StringWithAggregatesFilter<"Campaign"> | string
    audienceId?: StringNullableWithAggregatesFilter<"Campaign"> | string | null
    templateId?: StringNullableWithAggregatesFilter<"Campaign"> | string | null
    scheduleAt?: DateTimeNullableWithAggregatesFilter<"Campaign"> | Date | string | null
    createdBy?: StringWithAggregatesFilter<"Campaign"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Campaign"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Campaign"> | Date | string
  }

  export type TemplateWhereInput = {
    AND?: TemplateWhereInput | TemplateWhereInput[]
    OR?: TemplateWhereInput[]
    NOT?: TemplateWhereInput | TemplateWhereInput[]
    id?: StringFilter<"Template"> | string
    companyId?: StringFilter<"Template"> | string
    channel?: EnumMarketingChannelFilter<"Template"> | $Enums.MarketingChannel
    name?: StringFilter<"Template"> | string
    subject?: StringNullableFilter<"Template"> | string | null
    htmlBody?: StringNullableFilter<"Template"> | string | null
    smsBody?: StringNullableFilter<"Template"> | string | null
    mergeTagsJson?: StringFilter<"Template"> | string
    isDefault?: BoolFilter<"Template"> | boolean
    createdAt?: DateTimeFilter<"Template"> | Date | string
    updatedAt?: DateTimeFilter<"Template"> | Date | string
  }

  export type TemplateOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    name?: SortOrder
    subject?: SortOrderInput | SortOrder
    htmlBody?: SortOrderInput | SortOrder
    smsBody?: SortOrderInput | SortOrder
    mergeTagsJson?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TemplateWhereInput | TemplateWhereInput[]
    OR?: TemplateWhereInput[]
    NOT?: TemplateWhereInput | TemplateWhereInput[]
    companyId?: StringFilter<"Template"> | string
    channel?: EnumMarketingChannelFilter<"Template"> | $Enums.MarketingChannel
    name?: StringFilter<"Template"> | string
    subject?: StringNullableFilter<"Template"> | string | null
    htmlBody?: StringNullableFilter<"Template"> | string | null
    smsBody?: StringNullableFilter<"Template"> | string | null
    mergeTagsJson?: StringFilter<"Template"> | string
    isDefault?: BoolFilter<"Template"> | boolean
    createdAt?: DateTimeFilter<"Template"> | Date | string
    updatedAt?: DateTimeFilter<"Template"> | Date | string
  }, "id">

  export type TemplateOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    name?: SortOrder
    subject?: SortOrderInput | SortOrder
    htmlBody?: SortOrderInput | SortOrder
    smsBody?: SortOrderInput | SortOrder
    mergeTagsJson?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TemplateCountOrderByAggregateInput
    _max?: TemplateMaxOrderByAggregateInput
    _min?: TemplateMinOrderByAggregateInput
  }

  export type TemplateScalarWhereWithAggregatesInput = {
    AND?: TemplateScalarWhereWithAggregatesInput | TemplateScalarWhereWithAggregatesInput[]
    OR?: TemplateScalarWhereWithAggregatesInput[]
    NOT?: TemplateScalarWhereWithAggregatesInput | TemplateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Template"> | string
    companyId?: StringWithAggregatesFilter<"Template"> | string
    channel?: EnumMarketingChannelWithAggregatesFilter<"Template"> | $Enums.MarketingChannel
    name?: StringWithAggregatesFilter<"Template"> | string
    subject?: StringNullableWithAggregatesFilter<"Template"> | string | null
    htmlBody?: StringNullableWithAggregatesFilter<"Template"> | string | null
    smsBody?: StringNullableWithAggregatesFilter<"Template"> | string | null
    mergeTagsJson?: StringWithAggregatesFilter<"Template"> | string
    isDefault?: BoolWithAggregatesFilter<"Template"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Template"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Template"> | Date | string
  }

  export type AudienceWhereInput = {
    AND?: AudienceWhereInput | AudienceWhereInput[]
    OR?: AudienceWhereInput[]
    NOT?: AudienceWhereInput | AudienceWhereInput[]
    id?: StringFilter<"Audience"> | string
    companyId?: StringFilter<"Audience"> | string
    name?: StringFilter<"Audience"> | string
    type?: EnumAudienceTypeFilter<"Audience"> | $Enums.AudienceType
    filtersJson?: StringFilter<"Audience"> | string
    lastCount?: IntFilter<"Audience"> | number
    createdAt?: DateTimeFilter<"Audience"> | Date | string
    updatedAt?: DateTimeFilter<"Audience"> | Date | string
  }

  export type AudienceOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    filtersJson?: SortOrder
    lastCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AudienceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AudienceWhereInput | AudienceWhereInput[]
    OR?: AudienceWhereInput[]
    NOT?: AudienceWhereInput | AudienceWhereInput[]
    companyId?: StringFilter<"Audience"> | string
    name?: StringFilter<"Audience"> | string
    type?: EnumAudienceTypeFilter<"Audience"> | $Enums.AudienceType
    filtersJson?: StringFilter<"Audience"> | string
    lastCount?: IntFilter<"Audience"> | number
    createdAt?: DateTimeFilter<"Audience"> | Date | string
    updatedAt?: DateTimeFilter<"Audience"> | Date | string
  }, "id">

  export type AudienceOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    filtersJson?: SortOrder
    lastCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AudienceCountOrderByAggregateInput
    _avg?: AudienceAvgOrderByAggregateInput
    _max?: AudienceMaxOrderByAggregateInput
    _min?: AudienceMinOrderByAggregateInput
    _sum?: AudienceSumOrderByAggregateInput
  }

  export type AudienceScalarWhereWithAggregatesInput = {
    AND?: AudienceScalarWhereWithAggregatesInput | AudienceScalarWhereWithAggregatesInput[]
    OR?: AudienceScalarWhereWithAggregatesInput[]
    NOT?: AudienceScalarWhereWithAggregatesInput | AudienceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Audience"> | string
    companyId?: StringWithAggregatesFilter<"Audience"> | string
    name?: StringWithAggregatesFilter<"Audience"> | string
    type?: EnumAudienceTypeWithAggregatesFilter<"Audience"> | $Enums.AudienceType
    filtersJson?: StringWithAggregatesFilter<"Audience"> | string
    lastCount?: IntWithAggregatesFilter<"Audience"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Audience"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Audience"> | Date | string
  }

  export type SendJobWhereInput = {
    AND?: SendJobWhereInput | SendJobWhereInput[]
    OR?: SendJobWhereInput[]
    NOT?: SendJobWhereInput | SendJobWhereInput[]
    id?: StringFilter<"SendJob"> | string
    campaignId?: StringNullableFilter<"SendJob"> | string | null
    companyId?: StringFilter<"SendJob"> | string
    customerId?: StringFilter<"SendJob"> | string
    channel?: EnumMarketingChannelFilter<"SendJob"> | $Enums.MarketingChannel
    address?: StringFilter<"SendJob"> | string
    status?: EnumSendJobStatusFilter<"SendJob"> | $Enums.SendJobStatus
    scheduledAt?: DateTimeNullableFilter<"SendJob"> | Date | string | null
    sentAt?: DateTimeNullableFilter<"SendJob"> | Date | string | null
    externalId?: StringNullableFilter<"SendJob"> | string | null
    automationTemplate?: StringNullableFilter<"SendJob"> | string | null
    error?: StringNullableFilter<"SendJob"> | string | null
    createdAt?: DateTimeFilter<"SendJob"> | Date | string
    updatedAt?: DateTimeFilter<"SendJob"> | Date | string
    campaign?: XOR<CampaignNullableRelationFilter, CampaignWhereInput> | null
    events?: SendEventListRelationFilter
  }

  export type SendJobOrderByWithRelationInput = {
    id?: SortOrder
    campaignId?: SortOrderInput | SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    status?: SortOrder
    scheduledAt?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    externalId?: SortOrderInput | SortOrder
    automationTemplate?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    campaign?: CampaignOrderByWithRelationInput
    events?: SendEventOrderByRelationAggregateInput
  }

  export type SendJobWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SendJobWhereInput | SendJobWhereInput[]
    OR?: SendJobWhereInput[]
    NOT?: SendJobWhereInput | SendJobWhereInput[]
    campaignId?: StringNullableFilter<"SendJob"> | string | null
    companyId?: StringFilter<"SendJob"> | string
    customerId?: StringFilter<"SendJob"> | string
    channel?: EnumMarketingChannelFilter<"SendJob"> | $Enums.MarketingChannel
    address?: StringFilter<"SendJob"> | string
    status?: EnumSendJobStatusFilter<"SendJob"> | $Enums.SendJobStatus
    scheduledAt?: DateTimeNullableFilter<"SendJob"> | Date | string | null
    sentAt?: DateTimeNullableFilter<"SendJob"> | Date | string | null
    externalId?: StringNullableFilter<"SendJob"> | string | null
    automationTemplate?: StringNullableFilter<"SendJob"> | string | null
    error?: StringNullableFilter<"SendJob"> | string | null
    createdAt?: DateTimeFilter<"SendJob"> | Date | string
    updatedAt?: DateTimeFilter<"SendJob"> | Date | string
    campaign?: XOR<CampaignNullableRelationFilter, CampaignWhereInput> | null
    events?: SendEventListRelationFilter
  }, "id">

  export type SendJobOrderByWithAggregationInput = {
    id?: SortOrder
    campaignId?: SortOrderInput | SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    status?: SortOrder
    scheduledAt?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    externalId?: SortOrderInput | SortOrder
    automationTemplate?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SendJobCountOrderByAggregateInput
    _max?: SendJobMaxOrderByAggregateInput
    _min?: SendJobMinOrderByAggregateInput
  }

  export type SendJobScalarWhereWithAggregatesInput = {
    AND?: SendJobScalarWhereWithAggregatesInput | SendJobScalarWhereWithAggregatesInput[]
    OR?: SendJobScalarWhereWithAggregatesInput[]
    NOT?: SendJobScalarWhereWithAggregatesInput | SendJobScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SendJob"> | string
    campaignId?: StringNullableWithAggregatesFilter<"SendJob"> | string | null
    companyId?: StringWithAggregatesFilter<"SendJob"> | string
    customerId?: StringWithAggregatesFilter<"SendJob"> | string
    channel?: EnumMarketingChannelWithAggregatesFilter<"SendJob"> | $Enums.MarketingChannel
    address?: StringWithAggregatesFilter<"SendJob"> | string
    status?: EnumSendJobStatusWithAggregatesFilter<"SendJob"> | $Enums.SendJobStatus
    scheduledAt?: DateTimeNullableWithAggregatesFilter<"SendJob"> | Date | string | null
    sentAt?: DateTimeNullableWithAggregatesFilter<"SendJob"> | Date | string | null
    externalId?: StringNullableWithAggregatesFilter<"SendJob"> | string | null
    automationTemplate?: StringNullableWithAggregatesFilter<"SendJob"> | string | null
    error?: StringNullableWithAggregatesFilter<"SendJob"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SendJob"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SendJob"> | Date | string
  }

  export type SendEventWhereInput = {
    AND?: SendEventWhereInput | SendEventWhereInput[]
    OR?: SendEventWhereInput[]
    NOT?: SendEventWhereInput | SendEventWhereInput[]
    id?: StringFilter<"SendEvent"> | string
    sendJobId?: StringFilter<"SendEvent"> | string
    eventType?: EnumSendEventTypeFilter<"SendEvent"> | $Enums.SendEventType
    eventAt?: DateTimeFilter<"SendEvent"> | Date | string
    urlClicked?: StringNullableFilter<"SendEvent"> | string | null
    metadata?: StringFilter<"SendEvent"> | string
    sendJob?: XOR<SendJobRelationFilter, SendJobWhereInput>
  }

  export type SendEventOrderByWithRelationInput = {
    id?: SortOrder
    sendJobId?: SortOrder
    eventType?: SortOrder
    eventAt?: SortOrder
    urlClicked?: SortOrderInput | SortOrder
    metadata?: SortOrder
    sendJob?: SendJobOrderByWithRelationInput
  }

  export type SendEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SendEventWhereInput | SendEventWhereInput[]
    OR?: SendEventWhereInput[]
    NOT?: SendEventWhereInput | SendEventWhereInput[]
    sendJobId?: StringFilter<"SendEvent"> | string
    eventType?: EnumSendEventTypeFilter<"SendEvent"> | $Enums.SendEventType
    eventAt?: DateTimeFilter<"SendEvent"> | Date | string
    urlClicked?: StringNullableFilter<"SendEvent"> | string | null
    metadata?: StringFilter<"SendEvent"> | string
    sendJob?: XOR<SendJobRelationFilter, SendJobWhereInput>
  }, "id">

  export type SendEventOrderByWithAggregationInput = {
    id?: SortOrder
    sendJobId?: SortOrder
    eventType?: SortOrder
    eventAt?: SortOrder
    urlClicked?: SortOrderInput | SortOrder
    metadata?: SortOrder
    _count?: SendEventCountOrderByAggregateInput
    _max?: SendEventMaxOrderByAggregateInput
    _min?: SendEventMinOrderByAggregateInput
  }

  export type SendEventScalarWhereWithAggregatesInput = {
    AND?: SendEventScalarWhereWithAggregatesInput | SendEventScalarWhereWithAggregatesInput[]
    OR?: SendEventScalarWhereWithAggregatesInput[]
    NOT?: SendEventScalarWhereWithAggregatesInput | SendEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SendEvent"> | string
    sendJobId?: StringWithAggregatesFilter<"SendEvent"> | string
    eventType?: EnumSendEventTypeWithAggregatesFilter<"SendEvent"> | $Enums.SendEventType
    eventAt?: DateTimeWithAggregatesFilter<"SendEvent"> | Date | string
    urlClicked?: StringNullableWithAggregatesFilter<"SendEvent"> | string | null
    metadata?: StringWithAggregatesFilter<"SendEvent"> | string
  }

  export type SuppressionWhereInput = {
    AND?: SuppressionWhereInput | SuppressionWhereInput[]
    OR?: SuppressionWhereInput[]
    NOT?: SuppressionWhereInput | SuppressionWhereInput[]
    id?: StringFilter<"Suppression"> | string
    companyId?: StringFilter<"Suppression"> | string
    channel?: EnumMarketingChannelFilter<"Suppression"> | $Enums.MarketingChannel
    address?: StringFilter<"Suppression"> | string
    reason?: EnumSuppressionReasonFilter<"Suppression"> | $Enums.SuppressionReason
    createdAt?: DateTimeFilter<"Suppression"> | Date | string
  }

  export type SuppressionOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type SuppressionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_channel_address?: SuppressionCompanyIdChannelAddressCompoundUniqueInput
    AND?: SuppressionWhereInput | SuppressionWhereInput[]
    OR?: SuppressionWhereInput[]
    NOT?: SuppressionWhereInput | SuppressionWhereInput[]
    companyId?: StringFilter<"Suppression"> | string
    channel?: EnumMarketingChannelFilter<"Suppression"> | $Enums.MarketingChannel
    address?: StringFilter<"Suppression"> | string
    reason?: EnumSuppressionReasonFilter<"Suppression"> | $Enums.SuppressionReason
    createdAt?: DateTimeFilter<"Suppression"> | Date | string
  }, "id" | "companyId_channel_address">

  export type SuppressionOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
    _count?: SuppressionCountOrderByAggregateInput
    _max?: SuppressionMaxOrderByAggregateInput
    _min?: SuppressionMinOrderByAggregateInput
  }

  export type SuppressionScalarWhereWithAggregatesInput = {
    AND?: SuppressionScalarWhereWithAggregatesInput | SuppressionScalarWhereWithAggregatesInput[]
    OR?: SuppressionScalarWhereWithAggregatesInput[]
    NOT?: SuppressionScalarWhereWithAggregatesInput | SuppressionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Suppression"> | string
    companyId?: StringWithAggregatesFilter<"Suppression"> | string
    channel?: EnumMarketingChannelWithAggregatesFilter<"Suppression"> | $Enums.MarketingChannel
    address?: StringWithAggregatesFilter<"Suppression"> | string
    reason?: EnumSuppressionReasonWithAggregatesFilter<"Suppression"> | $Enums.SuppressionReason
    createdAt?: DateTimeWithAggregatesFilter<"Suppression"> | Date | string
  }

  export type ReviewRequestWhereInput = {
    AND?: ReviewRequestWhereInput | ReviewRequestWhereInput[]
    OR?: ReviewRequestWhereInput[]
    NOT?: ReviewRequestWhereInput | ReviewRequestWhereInput[]
    id?: StringFilter<"ReviewRequest"> | string
    companyId?: StringFilter<"ReviewRequest"> | string
    customerId?: StringFilter<"ReviewRequest"> | string
    jobId?: StringFilter<"ReviewRequest"> | string
    status?: EnumReviewRequestStatusFilter<"ReviewRequest"> | $Enums.ReviewRequestStatus
    gateScore?: FloatNullableFilter<"ReviewRequest"> | number | null
    smsAt?: DateTimeNullableFilter<"ReviewRequest"> | Date | string | null
    emailAt?: DateTimeNullableFilter<"ReviewRequest"> | Date | string | null
    createdAt?: DateTimeFilter<"ReviewRequest"> | Date | string
    updatedAt?: DateTimeFilter<"ReviewRequest"> | Date | string
  }

  export type ReviewRequestOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    gateScore?: SortOrderInput | SortOrder
    smsAt?: SortOrderInput | SortOrder
    emailAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReviewRequestWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_jobId?: ReviewRequestCompanyIdJobIdCompoundUniqueInput
    AND?: ReviewRequestWhereInput | ReviewRequestWhereInput[]
    OR?: ReviewRequestWhereInput[]
    NOT?: ReviewRequestWhereInput | ReviewRequestWhereInput[]
    companyId?: StringFilter<"ReviewRequest"> | string
    customerId?: StringFilter<"ReviewRequest"> | string
    jobId?: StringFilter<"ReviewRequest"> | string
    status?: EnumReviewRequestStatusFilter<"ReviewRequest"> | $Enums.ReviewRequestStatus
    gateScore?: FloatNullableFilter<"ReviewRequest"> | number | null
    smsAt?: DateTimeNullableFilter<"ReviewRequest"> | Date | string | null
    emailAt?: DateTimeNullableFilter<"ReviewRequest"> | Date | string | null
    createdAt?: DateTimeFilter<"ReviewRequest"> | Date | string
    updatedAt?: DateTimeFilter<"ReviewRequest"> | Date | string
  }, "id" | "companyId_jobId">

  export type ReviewRequestOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    gateScore?: SortOrderInput | SortOrder
    smsAt?: SortOrderInput | SortOrder
    emailAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReviewRequestCountOrderByAggregateInput
    _avg?: ReviewRequestAvgOrderByAggregateInput
    _max?: ReviewRequestMaxOrderByAggregateInput
    _min?: ReviewRequestMinOrderByAggregateInput
    _sum?: ReviewRequestSumOrderByAggregateInput
  }

  export type ReviewRequestScalarWhereWithAggregatesInput = {
    AND?: ReviewRequestScalarWhereWithAggregatesInput | ReviewRequestScalarWhereWithAggregatesInput[]
    OR?: ReviewRequestScalarWhereWithAggregatesInput[]
    NOT?: ReviewRequestScalarWhereWithAggregatesInput | ReviewRequestScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ReviewRequest"> | string
    companyId?: StringWithAggregatesFilter<"ReviewRequest"> | string
    customerId?: StringWithAggregatesFilter<"ReviewRequest"> | string
    jobId?: StringWithAggregatesFilter<"ReviewRequest"> | string
    status?: EnumReviewRequestStatusWithAggregatesFilter<"ReviewRequest"> | $Enums.ReviewRequestStatus
    gateScore?: FloatNullableWithAggregatesFilter<"ReviewRequest"> | number | null
    smsAt?: DateTimeNullableWithAggregatesFilter<"ReviewRequest"> | Date | string | null
    emailAt?: DateTimeNullableWithAggregatesFilter<"ReviewRequest"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ReviewRequest"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ReviewRequest"> | Date | string
  }

  export type MarketingAttributionWhereInput = {
    AND?: MarketingAttributionWhereInput | MarketingAttributionWhereInput[]
    OR?: MarketingAttributionWhereInput[]
    NOT?: MarketingAttributionWhereInput | MarketingAttributionWhereInput[]
    id?: StringFilter<"MarketingAttribution"> | string
    companyId?: StringFilter<"MarketingAttribution"> | string
    customerId?: StringFilter<"MarketingAttribution"> | string
    jobId?: StringNullableFilter<"MarketingAttribution"> | string | null
    invoiceId?: StringNullableFilter<"MarketingAttribution"> | string | null
    source?: StringFilter<"MarketingAttribution"> | string
    adName?: StringNullableFilter<"MarketingAttribution"> | string | null
    formId?: StringNullableFilter<"MarketingAttribution"> | string | null
    clickedAt?: DateTimeNullableFilter<"MarketingAttribution"> | Date | string | null
    revenueAttributed?: DecimalFilter<"MarketingAttribution"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"MarketingAttribution"> | Date | string
  }

  export type MarketingAttributionOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrderInput | SortOrder
    invoiceId?: SortOrderInput | SortOrder
    source?: SortOrder
    adName?: SortOrderInput | SortOrder
    formId?: SortOrderInput | SortOrder
    clickedAt?: SortOrderInput | SortOrder
    revenueAttributed?: SortOrder
    createdAt?: SortOrder
  }

  export type MarketingAttributionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MarketingAttributionWhereInput | MarketingAttributionWhereInput[]
    OR?: MarketingAttributionWhereInput[]
    NOT?: MarketingAttributionWhereInput | MarketingAttributionWhereInput[]
    companyId?: StringFilter<"MarketingAttribution"> | string
    customerId?: StringFilter<"MarketingAttribution"> | string
    jobId?: StringNullableFilter<"MarketingAttribution"> | string | null
    invoiceId?: StringNullableFilter<"MarketingAttribution"> | string | null
    source?: StringFilter<"MarketingAttribution"> | string
    adName?: StringNullableFilter<"MarketingAttribution"> | string | null
    formId?: StringNullableFilter<"MarketingAttribution"> | string | null
    clickedAt?: DateTimeNullableFilter<"MarketingAttribution"> | Date | string | null
    revenueAttributed?: DecimalFilter<"MarketingAttribution"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"MarketingAttribution"> | Date | string
  }, "id">

  export type MarketingAttributionOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrderInput | SortOrder
    invoiceId?: SortOrderInput | SortOrder
    source?: SortOrder
    adName?: SortOrderInput | SortOrder
    formId?: SortOrderInput | SortOrder
    clickedAt?: SortOrderInput | SortOrder
    revenueAttributed?: SortOrder
    createdAt?: SortOrder
    _count?: MarketingAttributionCountOrderByAggregateInput
    _avg?: MarketingAttributionAvgOrderByAggregateInput
    _max?: MarketingAttributionMaxOrderByAggregateInput
    _min?: MarketingAttributionMinOrderByAggregateInput
    _sum?: MarketingAttributionSumOrderByAggregateInput
  }

  export type MarketingAttributionScalarWhereWithAggregatesInput = {
    AND?: MarketingAttributionScalarWhereWithAggregatesInput | MarketingAttributionScalarWhereWithAggregatesInput[]
    OR?: MarketingAttributionScalarWhereWithAggregatesInput[]
    NOT?: MarketingAttributionScalarWhereWithAggregatesInput | MarketingAttributionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MarketingAttribution"> | string
    companyId?: StringWithAggregatesFilter<"MarketingAttribution"> | string
    customerId?: StringWithAggregatesFilter<"MarketingAttribution"> | string
    jobId?: StringNullableWithAggregatesFilter<"MarketingAttribution"> | string | null
    invoiceId?: StringNullableWithAggregatesFilter<"MarketingAttribution"> | string | null
    source?: StringWithAggregatesFilter<"MarketingAttribution"> | string
    adName?: StringNullableWithAggregatesFilter<"MarketingAttribution"> | string | null
    formId?: StringNullableWithAggregatesFilter<"MarketingAttribution"> | string | null
    clickedAt?: DateTimeNullableWithAggregatesFilter<"MarketingAttribution"> | Date | string | null
    revenueAttributed?: DecimalWithAggregatesFilter<"MarketingAttribution"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeWithAggregatesFilter<"MarketingAttribution"> | Date | string
  }

  export type CampaignCreateInput = {
    id?: string
    companyId: string
    name: string
    channel: $Enums.MarketingChannel
    status?: string
    audienceId?: string | null
    templateId?: string | null
    scheduleAt?: Date | string | null
    createdBy: string
    createdAt?: Date | string
    updatedAt?: Date | string
    sendJobs?: SendJobCreateNestedManyWithoutCampaignInput
  }

  export type CampaignUncheckedCreateInput = {
    id?: string
    companyId: string
    name: string
    channel: $Enums.MarketingChannel
    status?: string
    audienceId?: string | null
    templateId?: string | null
    scheduleAt?: Date | string | null
    createdBy: string
    createdAt?: Date | string
    updatedAt?: Date | string
    sendJobs?: SendJobUncheckedCreateNestedManyWithoutCampaignInput
  }

  export type CampaignUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    status?: StringFieldUpdateOperationsInput | string
    audienceId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    scheduleAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sendJobs?: SendJobUpdateManyWithoutCampaignNestedInput
  }

  export type CampaignUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    status?: StringFieldUpdateOperationsInput | string
    audienceId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    scheduleAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sendJobs?: SendJobUncheckedUpdateManyWithoutCampaignNestedInput
  }

  export type CampaignCreateManyInput = {
    id?: string
    companyId: string
    name: string
    channel: $Enums.MarketingChannel
    status?: string
    audienceId?: string | null
    templateId?: string | null
    scheduleAt?: Date | string | null
    createdBy: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CampaignUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    status?: StringFieldUpdateOperationsInput | string
    audienceId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    scheduleAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CampaignUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    status?: StringFieldUpdateOperationsInput | string
    audienceId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    scheduleAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateCreateInput = {
    id?: string
    companyId: string
    channel: $Enums.MarketingChannel
    name: string
    subject?: string | null
    htmlBody?: string | null
    smsBody?: string | null
    mergeTagsJson?: string
    isDefault?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateUncheckedCreateInput = {
    id?: string
    companyId: string
    channel: $Enums.MarketingChannel
    name: string
    subject?: string | null
    htmlBody?: string | null
    smsBody?: string | null
    mergeTagsJson?: string
    isDefault?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    name?: StringFieldUpdateOperationsInput | string
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    htmlBody?: NullableStringFieldUpdateOperationsInput | string | null
    smsBody?: NullableStringFieldUpdateOperationsInput | string | null
    mergeTagsJson?: StringFieldUpdateOperationsInput | string
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    name?: StringFieldUpdateOperationsInput | string
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    htmlBody?: NullableStringFieldUpdateOperationsInput | string | null
    smsBody?: NullableStringFieldUpdateOperationsInput | string | null
    mergeTagsJson?: StringFieldUpdateOperationsInput | string
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateCreateManyInput = {
    id?: string
    companyId: string
    channel: $Enums.MarketingChannel
    name: string
    subject?: string | null
    htmlBody?: string | null
    smsBody?: string | null
    mergeTagsJson?: string
    isDefault?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    name?: StringFieldUpdateOperationsInput | string
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    htmlBody?: NullableStringFieldUpdateOperationsInput | string | null
    smsBody?: NullableStringFieldUpdateOperationsInput | string | null
    mergeTagsJson?: StringFieldUpdateOperationsInput | string
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    name?: StringFieldUpdateOperationsInput | string
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    htmlBody?: NullableStringFieldUpdateOperationsInput | string | null
    smsBody?: NullableStringFieldUpdateOperationsInput | string | null
    mergeTagsJson?: StringFieldUpdateOperationsInput | string
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AudienceCreateInput = {
    id?: string
    companyId: string
    name: string
    type?: $Enums.AudienceType
    filtersJson?: string
    lastCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AudienceUncheckedCreateInput = {
    id?: string
    companyId: string
    name: string
    type?: $Enums.AudienceType
    filtersJson?: string
    lastCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AudienceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumAudienceTypeFieldUpdateOperationsInput | $Enums.AudienceType
    filtersJson?: StringFieldUpdateOperationsInput | string
    lastCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AudienceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumAudienceTypeFieldUpdateOperationsInput | $Enums.AudienceType
    filtersJson?: StringFieldUpdateOperationsInput | string
    lastCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AudienceCreateManyInput = {
    id?: string
    companyId: string
    name: string
    type?: $Enums.AudienceType
    filtersJson?: string
    lastCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AudienceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumAudienceTypeFieldUpdateOperationsInput | $Enums.AudienceType
    filtersJson?: StringFieldUpdateOperationsInput | string
    lastCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AudienceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumAudienceTypeFieldUpdateOperationsInput | $Enums.AudienceType
    filtersJson?: StringFieldUpdateOperationsInput | string
    lastCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SendJobCreateInput = {
    id?: string
    companyId: string
    customerId: string
    channel: $Enums.MarketingChannel
    address: string
    status?: $Enums.SendJobStatus
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    externalId?: string | null
    automationTemplate?: string | null
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    campaign?: CampaignCreateNestedOneWithoutSendJobsInput
    events?: SendEventCreateNestedManyWithoutSendJobInput
  }

  export type SendJobUncheckedCreateInput = {
    id?: string
    campaignId?: string | null
    companyId: string
    customerId: string
    channel: $Enums.MarketingChannel
    address: string
    status?: $Enums.SendJobStatus
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    externalId?: string | null
    automationTemplate?: string | null
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    events?: SendEventUncheckedCreateNestedManyWithoutSendJobInput
  }

  export type SendJobUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    status?: EnumSendJobStatusFieldUpdateOperationsInput | $Enums.SendJobStatus
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    automationTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    campaign?: CampaignUpdateOneWithoutSendJobsNestedInput
    events?: SendEventUpdateManyWithoutSendJobNestedInput
  }

  export type SendJobUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    campaignId?: NullableStringFieldUpdateOperationsInput | string | null
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    status?: EnumSendJobStatusFieldUpdateOperationsInput | $Enums.SendJobStatus
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    automationTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    events?: SendEventUncheckedUpdateManyWithoutSendJobNestedInput
  }

  export type SendJobCreateManyInput = {
    id?: string
    campaignId?: string | null
    companyId: string
    customerId: string
    channel: $Enums.MarketingChannel
    address: string
    status?: $Enums.SendJobStatus
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    externalId?: string | null
    automationTemplate?: string | null
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SendJobUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    status?: EnumSendJobStatusFieldUpdateOperationsInput | $Enums.SendJobStatus
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    automationTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SendJobUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    campaignId?: NullableStringFieldUpdateOperationsInput | string | null
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    status?: EnumSendJobStatusFieldUpdateOperationsInput | $Enums.SendJobStatus
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    automationTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SendEventCreateInput = {
    id?: string
    eventType: $Enums.SendEventType
    eventAt?: Date | string
    urlClicked?: string | null
    metadata?: string
    sendJob: SendJobCreateNestedOneWithoutEventsInput
  }

  export type SendEventUncheckedCreateInput = {
    id?: string
    sendJobId: string
    eventType: $Enums.SendEventType
    eventAt?: Date | string
    urlClicked?: string | null
    metadata?: string
  }

  export type SendEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: EnumSendEventTypeFieldUpdateOperationsInput | $Enums.SendEventType
    eventAt?: DateTimeFieldUpdateOperationsInput | Date | string
    urlClicked?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: StringFieldUpdateOperationsInput | string
    sendJob?: SendJobUpdateOneRequiredWithoutEventsNestedInput
  }

  export type SendEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sendJobId?: StringFieldUpdateOperationsInput | string
    eventType?: EnumSendEventTypeFieldUpdateOperationsInput | $Enums.SendEventType
    eventAt?: DateTimeFieldUpdateOperationsInput | Date | string
    urlClicked?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: StringFieldUpdateOperationsInput | string
  }

  export type SendEventCreateManyInput = {
    id?: string
    sendJobId: string
    eventType: $Enums.SendEventType
    eventAt?: Date | string
    urlClicked?: string | null
    metadata?: string
  }

  export type SendEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: EnumSendEventTypeFieldUpdateOperationsInput | $Enums.SendEventType
    eventAt?: DateTimeFieldUpdateOperationsInput | Date | string
    urlClicked?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: StringFieldUpdateOperationsInput | string
  }

  export type SendEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sendJobId?: StringFieldUpdateOperationsInput | string
    eventType?: EnumSendEventTypeFieldUpdateOperationsInput | $Enums.SendEventType
    eventAt?: DateTimeFieldUpdateOperationsInput | Date | string
    urlClicked?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: StringFieldUpdateOperationsInput | string
  }

  export type SuppressionCreateInput = {
    id?: string
    companyId: string
    channel: $Enums.MarketingChannel
    address: string
    reason: $Enums.SuppressionReason
    createdAt?: Date | string
  }

  export type SuppressionUncheckedCreateInput = {
    id?: string
    companyId: string
    channel: $Enums.MarketingChannel
    address: string
    reason: $Enums.SuppressionReason
    createdAt?: Date | string
  }

  export type SuppressionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    reason?: EnumSuppressionReasonFieldUpdateOperationsInput | $Enums.SuppressionReason
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SuppressionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    reason?: EnumSuppressionReasonFieldUpdateOperationsInput | $Enums.SuppressionReason
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SuppressionCreateManyInput = {
    id?: string
    companyId: string
    channel: $Enums.MarketingChannel
    address: string
    reason: $Enums.SuppressionReason
    createdAt?: Date | string
  }

  export type SuppressionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    reason?: EnumSuppressionReasonFieldUpdateOperationsInput | $Enums.SuppressionReason
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SuppressionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    reason?: EnumSuppressionReasonFieldUpdateOperationsInput | $Enums.SuppressionReason
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewRequestCreateInput = {
    id?: string
    companyId: string
    customerId: string
    jobId: string
    status?: $Enums.ReviewRequestStatus
    gateScore?: number | null
    smsAt?: Date | string | null
    emailAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewRequestUncheckedCreateInput = {
    id?: string
    companyId: string
    customerId: string
    jobId: string
    status?: $Enums.ReviewRequestStatus
    gateScore?: number | null
    smsAt?: Date | string | null
    emailAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewRequestUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    status?: EnumReviewRequestStatusFieldUpdateOperationsInput | $Enums.ReviewRequestStatus
    gateScore?: NullableFloatFieldUpdateOperationsInput | number | null
    smsAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewRequestUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    status?: EnumReviewRequestStatusFieldUpdateOperationsInput | $Enums.ReviewRequestStatus
    gateScore?: NullableFloatFieldUpdateOperationsInput | number | null
    smsAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewRequestCreateManyInput = {
    id?: string
    companyId: string
    customerId: string
    jobId: string
    status?: $Enums.ReviewRequestStatus
    gateScore?: number | null
    smsAt?: Date | string | null
    emailAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewRequestUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    status?: EnumReviewRequestStatusFieldUpdateOperationsInput | $Enums.ReviewRequestStatus
    gateScore?: NullableFloatFieldUpdateOperationsInput | number | null
    smsAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewRequestUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    status?: EnumReviewRequestStatusFieldUpdateOperationsInput | $Enums.ReviewRequestStatus
    gateScore?: NullableFloatFieldUpdateOperationsInput | number | null
    smsAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketingAttributionCreateInput = {
    id?: string
    companyId: string
    customerId: string
    jobId?: string | null
    invoiceId?: string | null
    source: string
    adName?: string | null
    formId?: string | null
    clickedAt?: Date | string | null
    revenueAttributed?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type MarketingAttributionUncheckedCreateInput = {
    id?: string
    companyId: string
    customerId: string
    jobId?: string | null
    invoiceId?: string | null
    source: string
    adName?: string | null
    formId?: string | null
    clickedAt?: Date | string | null
    revenueAttributed?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type MarketingAttributionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    adName?: NullableStringFieldUpdateOperationsInput | string | null
    formId?: NullableStringFieldUpdateOperationsInput | string | null
    clickedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revenueAttributed?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketingAttributionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    adName?: NullableStringFieldUpdateOperationsInput | string | null
    formId?: NullableStringFieldUpdateOperationsInput | string | null
    clickedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revenueAttributed?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketingAttributionCreateManyInput = {
    id?: string
    companyId: string
    customerId: string
    jobId?: string | null
    invoiceId?: string | null
    source: string
    adName?: string | null
    formId?: string | null
    clickedAt?: Date | string | null
    revenueAttributed?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type MarketingAttributionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    adName?: NullableStringFieldUpdateOperationsInput | string | null
    formId?: NullableStringFieldUpdateOperationsInput | string | null
    clickedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revenueAttributed?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketingAttributionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    adName?: NullableStringFieldUpdateOperationsInput | string | null
    formId?: NullableStringFieldUpdateOperationsInput | string | null
    clickedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revenueAttributed?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
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

  export type EnumMarketingChannelFilter<$PrismaModel = never> = {
    equals?: $Enums.MarketingChannel | EnumMarketingChannelFieldRefInput<$PrismaModel>
    in?: $Enums.MarketingChannel[] | ListEnumMarketingChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.MarketingChannel[] | ListEnumMarketingChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumMarketingChannelFilter<$PrismaModel> | $Enums.MarketingChannel
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

  export type SendJobListRelationFilter = {
    every?: SendJobWhereInput
    some?: SendJobWhereInput
    none?: SendJobWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SendJobOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CampaignCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    audienceId?: SortOrder
    templateId?: SortOrder
    scheduleAt?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CampaignMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    audienceId?: SortOrder
    templateId?: SortOrder
    scheduleAt?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CampaignMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    audienceId?: SortOrder
    templateId?: SortOrder
    scheduleAt?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
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

  export type EnumMarketingChannelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MarketingChannel | EnumMarketingChannelFieldRefInput<$PrismaModel>
    in?: $Enums.MarketingChannel[] | ListEnumMarketingChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.MarketingChannel[] | ListEnumMarketingChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumMarketingChannelWithAggregatesFilter<$PrismaModel> | $Enums.MarketingChannel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMarketingChannelFilter<$PrismaModel>
    _max?: NestedEnumMarketingChannelFilter<$PrismaModel>
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

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type TemplateCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    name?: SortOrder
    subject?: SortOrder
    htmlBody?: SortOrder
    smsBody?: SortOrder
    mergeTagsJson?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    name?: SortOrder
    subject?: SortOrder
    htmlBody?: SortOrder
    smsBody?: SortOrder
    mergeTagsJson?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    name?: SortOrder
    subject?: SortOrder
    htmlBody?: SortOrder
    smsBody?: SortOrder
    mergeTagsJson?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumAudienceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AudienceType | EnumAudienceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AudienceType[] | ListEnumAudienceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AudienceType[] | ListEnumAudienceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAudienceTypeFilter<$PrismaModel> | $Enums.AudienceType
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

  export type AudienceCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    filtersJson?: SortOrder
    lastCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AudienceAvgOrderByAggregateInput = {
    lastCount?: SortOrder
  }

  export type AudienceMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    filtersJson?: SortOrder
    lastCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AudienceMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    filtersJson?: SortOrder
    lastCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AudienceSumOrderByAggregateInput = {
    lastCount?: SortOrder
  }

  export type EnumAudienceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AudienceType | EnumAudienceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AudienceType[] | ListEnumAudienceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AudienceType[] | ListEnumAudienceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAudienceTypeWithAggregatesFilter<$PrismaModel> | $Enums.AudienceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAudienceTypeFilter<$PrismaModel>
    _max?: NestedEnumAudienceTypeFilter<$PrismaModel>
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

  export type EnumSendJobStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SendJobStatus | EnumSendJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SendJobStatus[] | ListEnumSendJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SendJobStatus[] | ListEnumSendJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSendJobStatusFilter<$PrismaModel> | $Enums.SendJobStatus
  }

  export type CampaignNullableRelationFilter = {
    is?: CampaignWhereInput | null
    isNot?: CampaignWhereInput | null
  }

  export type SendEventListRelationFilter = {
    every?: SendEventWhereInput
    some?: SendEventWhereInput
    none?: SendEventWhereInput
  }

  export type SendEventOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SendJobCountOrderByAggregateInput = {
    id?: SortOrder
    campaignId?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    status?: SortOrder
    scheduledAt?: SortOrder
    sentAt?: SortOrder
    externalId?: SortOrder
    automationTemplate?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SendJobMaxOrderByAggregateInput = {
    id?: SortOrder
    campaignId?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    status?: SortOrder
    scheduledAt?: SortOrder
    sentAt?: SortOrder
    externalId?: SortOrder
    automationTemplate?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SendJobMinOrderByAggregateInput = {
    id?: SortOrder
    campaignId?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    status?: SortOrder
    scheduledAt?: SortOrder
    sentAt?: SortOrder
    externalId?: SortOrder
    automationTemplate?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumSendJobStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SendJobStatus | EnumSendJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SendJobStatus[] | ListEnumSendJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SendJobStatus[] | ListEnumSendJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSendJobStatusWithAggregatesFilter<$PrismaModel> | $Enums.SendJobStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSendJobStatusFilter<$PrismaModel>
    _max?: NestedEnumSendJobStatusFilter<$PrismaModel>
  }

  export type EnumSendEventTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SendEventType | EnumSendEventTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SendEventType[] | ListEnumSendEventTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SendEventType[] | ListEnumSendEventTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSendEventTypeFilter<$PrismaModel> | $Enums.SendEventType
  }

  export type SendJobRelationFilter = {
    is?: SendJobWhereInput
    isNot?: SendJobWhereInput
  }

  export type SendEventCountOrderByAggregateInput = {
    id?: SortOrder
    sendJobId?: SortOrder
    eventType?: SortOrder
    eventAt?: SortOrder
    urlClicked?: SortOrder
    metadata?: SortOrder
  }

  export type SendEventMaxOrderByAggregateInput = {
    id?: SortOrder
    sendJobId?: SortOrder
    eventType?: SortOrder
    eventAt?: SortOrder
    urlClicked?: SortOrder
    metadata?: SortOrder
  }

  export type SendEventMinOrderByAggregateInput = {
    id?: SortOrder
    sendJobId?: SortOrder
    eventType?: SortOrder
    eventAt?: SortOrder
    urlClicked?: SortOrder
    metadata?: SortOrder
  }

  export type EnumSendEventTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SendEventType | EnumSendEventTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SendEventType[] | ListEnumSendEventTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SendEventType[] | ListEnumSendEventTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSendEventTypeWithAggregatesFilter<$PrismaModel> | $Enums.SendEventType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSendEventTypeFilter<$PrismaModel>
    _max?: NestedEnumSendEventTypeFilter<$PrismaModel>
  }

  export type EnumSuppressionReasonFilter<$PrismaModel = never> = {
    equals?: $Enums.SuppressionReason | EnumSuppressionReasonFieldRefInput<$PrismaModel>
    in?: $Enums.SuppressionReason[] | ListEnumSuppressionReasonFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuppressionReason[] | ListEnumSuppressionReasonFieldRefInput<$PrismaModel>
    not?: NestedEnumSuppressionReasonFilter<$PrismaModel> | $Enums.SuppressionReason
  }

  export type SuppressionCompanyIdChannelAddressCompoundUniqueInput = {
    companyId: string
    channel: $Enums.MarketingChannel
    address: string
  }

  export type SuppressionCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type SuppressionMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type SuppressionMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    channel?: SortOrder
    address?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumSuppressionReasonWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SuppressionReason | EnumSuppressionReasonFieldRefInput<$PrismaModel>
    in?: $Enums.SuppressionReason[] | ListEnumSuppressionReasonFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuppressionReason[] | ListEnumSuppressionReasonFieldRefInput<$PrismaModel>
    not?: NestedEnumSuppressionReasonWithAggregatesFilter<$PrismaModel> | $Enums.SuppressionReason
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSuppressionReasonFilter<$PrismaModel>
    _max?: NestedEnumSuppressionReasonFilter<$PrismaModel>
  }

  export type EnumReviewRequestStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewRequestStatus | EnumReviewRequestStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ReviewRequestStatus[] | ListEnumReviewRequestStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ReviewRequestStatus[] | ListEnumReviewRequestStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumReviewRequestStatusFilter<$PrismaModel> | $Enums.ReviewRequestStatus
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type ReviewRequestCompanyIdJobIdCompoundUniqueInput = {
    companyId: string
    jobId: string
  }

  export type ReviewRequestCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    gateScore?: SortOrder
    smsAt?: SortOrder
    emailAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReviewRequestAvgOrderByAggregateInput = {
    gateScore?: SortOrder
  }

  export type ReviewRequestMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    gateScore?: SortOrder
    smsAt?: SortOrder
    emailAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReviewRequestMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    gateScore?: SortOrder
    smsAt?: SortOrder
    emailAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReviewRequestSumOrderByAggregateInput = {
    gateScore?: SortOrder
  }

  export type EnumReviewRequestStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewRequestStatus | EnumReviewRequestStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ReviewRequestStatus[] | ListEnumReviewRequestStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ReviewRequestStatus[] | ListEnumReviewRequestStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumReviewRequestStatusWithAggregatesFilter<$PrismaModel> | $Enums.ReviewRequestStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumReviewRequestStatusFilter<$PrismaModel>
    _max?: NestedEnumReviewRequestStatusFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
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

  export type MarketingAttributionCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    invoiceId?: SortOrder
    source?: SortOrder
    adName?: SortOrder
    formId?: SortOrder
    clickedAt?: SortOrder
    revenueAttributed?: SortOrder
    createdAt?: SortOrder
  }

  export type MarketingAttributionAvgOrderByAggregateInput = {
    revenueAttributed?: SortOrder
  }

  export type MarketingAttributionMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    invoiceId?: SortOrder
    source?: SortOrder
    adName?: SortOrder
    formId?: SortOrder
    clickedAt?: SortOrder
    revenueAttributed?: SortOrder
    createdAt?: SortOrder
  }

  export type MarketingAttributionMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    invoiceId?: SortOrder
    source?: SortOrder
    adName?: SortOrder
    formId?: SortOrder
    clickedAt?: SortOrder
    revenueAttributed?: SortOrder
    createdAt?: SortOrder
  }

  export type MarketingAttributionSumOrderByAggregateInput = {
    revenueAttributed?: SortOrder
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

  export type SendJobCreateNestedManyWithoutCampaignInput = {
    create?: XOR<SendJobCreateWithoutCampaignInput, SendJobUncheckedCreateWithoutCampaignInput> | SendJobCreateWithoutCampaignInput[] | SendJobUncheckedCreateWithoutCampaignInput[]
    connectOrCreate?: SendJobCreateOrConnectWithoutCampaignInput | SendJobCreateOrConnectWithoutCampaignInput[]
    createMany?: SendJobCreateManyCampaignInputEnvelope
    connect?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
  }

  export type SendJobUncheckedCreateNestedManyWithoutCampaignInput = {
    create?: XOR<SendJobCreateWithoutCampaignInput, SendJobUncheckedCreateWithoutCampaignInput> | SendJobCreateWithoutCampaignInput[] | SendJobUncheckedCreateWithoutCampaignInput[]
    connectOrCreate?: SendJobCreateOrConnectWithoutCampaignInput | SendJobCreateOrConnectWithoutCampaignInput[]
    createMany?: SendJobCreateManyCampaignInputEnvelope
    connect?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumMarketingChannelFieldUpdateOperationsInput = {
    set?: $Enums.MarketingChannel
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type SendJobUpdateManyWithoutCampaignNestedInput = {
    create?: XOR<SendJobCreateWithoutCampaignInput, SendJobUncheckedCreateWithoutCampaignInput> | SendJobCreateWithoutCampaignInput[] | SendJobUncheckedCreateWithoutCampaignInput[]
    connectOrCreate?: SendJobCreateOrConnectWithoutCampaignInput | SendJobCreateOrConnectWithoutCampaignInput[]
    upsert?: SendJobUpsertWithWhereUniqueWithoutCampaignInput | SendJobUpsertWithWhereUniqueWithoutCampaignInput[]
    createMany?: SendJobCreateManyCampaignInputEnvelope
    set?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
    disconnect?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
    delete?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
    connect?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
    update?: SendJobUpdateWithWhereUniqueWithoutCampaignInput | SendJobUpdateWithWhereUniqueWithoutCampaignInput[]
    updateMany?: SendJobUpdateManyWithWhereWithoutCampaignInput | SendJobUpdateManyWithWhereWithoutCampaignInput[]
    deleteMany?: SendJobScalarWhereInput | SendJobScalarWhereInput[]
  }

  export type SendJobUncheckedUpdateManyWithoutCampaignNestedInput = {
    create?: XOR<SendJobCreateWithoutCampaignInput, SendJobUncheckedCreateWithoutCampaignInput> | SendJobCreateWithoutCampaignInput[] | SendJobUncheckedCreateWithoutCampaignInput[]
    connectOrCreate?: SendJobCreateOrConnectWithoutCampaignInput | SendJobCreateOrConnectWithoutCampaignInput[]
    upsert?: SendJobUpsertWithWhereUniqueWithoutCampaignInput | SendJobUpsertWithWhereUniqueWithoutCampaignInput[]
    createMany?: SendJobCreateManyCampaignInputEnvelope
    set?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
    disconnect?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
    delete?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
    connect?: SendJobWhereUniqueInput | SendJobWhereUniqueInput[]
    update?: SendJobUpdateWithWhereUniqueWithoutCampaignInput | SendJobUpdateWithWhereUniqueWithoutCampaignInput[]
    updateMany?: SendJobUpdateManyWithWhereWithoutCampaignInput | SendJobUpdateManyWithWhereWithoutCampaignInput[]
    deleteMany?: SendJobScalarWhereInput | SendJobScalarWhereInput[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EnumAudienceTypeFieldUpdateOperationsInput = {
    set?: $Enums.AudienceType
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type CampaignCreateNestedOneWithoutSendJobsInput = {
    create?: XOR<CampaignCreateWithoutSendJobsInput, CampaignUncheckedCreateWithoutSendJobsInput>
    connectOrCreate?: CampaignCreateOrConnectWithoutSendJobsInput
    connect?: CampaignWhereUniqueInput
  }

  export type SendEventCreateNestedManyWithoutSendJobInput = {
    create?: XOR<SendEventCreateWithoutSendJobInput, SendEventUncheckedCreateWithoutSendJobInput> | SendEventCreateWithoutSendJobInput[] | SendEventUncheckedCreateWithoutSendJobInput[]
    connectOrCreate?: SendEventCreateOrConnectWithoutSendJobInput | SendEventCreateOrConnectWithoutSendJobInput[]
    createMany?: SendEventCreateManySendJobInputEnvelope
    connect?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
  }

  export type SendEventUncheckedCreateNestedManyWithoutSendJobInput = {
    create?: XOR<SendEventCreateWithoutSendJobInput, SendEventUncheckedCreateWithoutSendJobInput> | SendEventCreateWithoutSendJobInput[] | SendEventUncheckedCreateWithoutSendJobInput[]
    connectOrCreate?: SendEventCreateOrConnectWithoutSendJobInput | SendEventCreateOrConnectWithoutSendJobInput[]
    createMany?: SendEventCreateManySendJobInputEnvelope
    connect?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
  }

  export type EnumSendJobStatusFieldUpdateOperationsInput = {
    set?: $Enums.SendJobStatus
  }

  export type CampaignUpdateOneWithoutSendJobsNestedInput = {
    create?: XOR<CampaignCreateWithoutSendJobsInput, CampaignUncheckedCreateWithoutSendJobsInput>
    connectOrCreate?: CampaignCreateOrConnectWithoutSendJobsInput
    upsert?: CampaignUpsertWithoutSendJobsInput
    disconnect?: CampaignWhereInput | boolean
    delete?: CampaignWhereInput | boolean
    connect?: CampaignWhereUniqueInput
    update?: XOR<XOR<CampaignUpdateToOneWithWhereWithoutSendJobsInput, CampaignUpdateWithoutSendJobsInput>, CampaignUncheckedUpdateWithoutSendJobsInput>
  }

  export type SendEventUpdateManyWithoutSendJobNestedInput = {
    create?: XOR<SendEventCreateWithoutSendJobInput, SendEventUncheckedCreateWithoutSendJobInput> | SendEventCreateWithoutSendJobInput[] | SendEventUncheckedCreateWithoutSendJobInput[]
    connectOrCreate?: SendEventCreateOrConnectWithoutSendJobInput | SendEventCreateOrConnectWithoutSendJobInput[]
    upsert?: SendEventUpsertWithWhereUniqueWithoutSendJobInput | SendEventUpsertWithWhereUniqueWithoutSendJobInput[]
    createMany?: SendEventCreateManySendJobInputEnvelope
    set?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
    disconnect?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
    delete?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
    connect?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
    update?: SendEventUpdateWithWhereUniqueWithoutSendJobInput | SendEventUpdateWithWhereUniqueWithoutSendJobInput[]
    updateMany?: SendEventUpdateManyWithWhereWithoutSendJobInput | SendEventUpdateManyWithWhereWithoutSendJobInput[]
    deleteMany?: SendEventScalarWhereInput | SendEventScalarWhereInput[]
  }

  export type SendEventUncheckedUpdateManyWithoutSendJobNestedInput = {
    create?: XOR<SendEventCreateWithoutSendJobInput, SendEventUncheckedCreateWithoutSendJobInput> | SendEventCreateWithoutSendJobInput[] | SendEventUncheckedCreateWithoutSendJobInput[]
    connectOrCreate?: SendEventCreateOrConnectWithoutSendJobInput | SendEventCreateOrConnectWithoutSendJobInput[]
    upsert?: SendEventUpsertWithWhereUniqueWithoutSendJobInput | SendEventUpsertWithWhereUniqueWithoutSendJobInput[]
    createMany?: SendEventCreateManySendJobInputEnvelope
    set?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
    disconnect?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
    delete?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
    connect?: SendEventWhereUniqueInput | SendEventWhereUniqueInput[]
    update?: SendEventUpdateWithWhereUniqueWithoutSendJobInput | SendEventUpdateWithWhereUniqueWithoutSendJobInput[]
    updateMany?: SendEventUpdateManyWithWhereWithoutSendJobInput | SendEventUpdateManyWithWhereWithoutSendJobInput[]
    deleteMany?: SendEventScalarWhereInput | SendEventScalarWhereInput[]
  }

  export type SendJobCreateNestedOneWithoutEventsInput = {
    create?: XOR<SendJobCreateWithoutEventsInput, SendJobUncheckedCreateWithoutEventsInput>
    connectOrCreate?: SendJobCreateOrConnectWithoutEventsInput
    connect?: SendJobWhereUniqueInput
  }

  export type EnumSendEventTypeFieldUpdateOperationsInput = {
    set?: $Enums.SendEventType
  }

  export type SendJobUpdateOneRequiredWithoutEventsNestedInput = {
    create?: XOR<SendJobCreateWithoutEventsInput, SendJobUncheckedCreateWithoutEventsInput>
    connectOrCreate?: SendJobCreateOrConnectWithoutEventsInput
    upsert?: SendJobUpsertWithoutEventsInput
    connect?: SendJobWhereUniqueInput
    update?: XOR<XOR<SendJobUpdateToOneWithWhereWithoutEventsInput, SendJobUpdateWithoutEventsInput>, SendJobUncheckedUpdateWithoutEventsInput>
  }

  export type EnumSuppressionReasonFieldUpdateOperationsInput = {
    set?: $Enums.SuppressionReason
  }

  export type EnumReviewRequestStatusFieldUpdateOperationsInput = {
    set?: $Enums.ReviewRequestStatus
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
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

  export type NestedEnumMarketingChannelFilter<$PrismaModel = never> = {
    equals?: $Enums.MarketingChannel | EnumMarketingChannelFieldRefInput<$PrismaModel>
    in?: $Enums.MarketingChannel[] | ListEnumMarketingChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.MarketingChannel[] | ListEnumMarketingChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumMarketingChannelFilter<$PrismaModel> | $Enums.MarketingChannel
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

  export type NestedEnumMarketingChannelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MarketingChannel | EnumMarketingChannelFieldRefInput<$PrismaModel>
    in?: $Enums.MarketingChannel[] | ListEnumMarketingChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.MarketingChannel[] | ListEnumMarketingChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumMarketingChannelWithAggregatesFilter<$PrismaModel> | $Enums.MarketingChannel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMarketingChannelFilter<$PrismaModel>
    _max?: NestedEnumMarketingChannelFilter<$PrismaModel>
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

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumAudienceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AudienceType | EnumAudienceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AudienceType[] | ListEnumAudienceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AudienceType[] | ListEnumAudienceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAudienceTypeFilter<$PrismaModel> | $Enums.AudienceType
  }

  export type NestedEnumAudienceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AudienceType | EnumAudienceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AudienceType[] | ListEnumAudienceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AudienceType[] | ListEnumAudienceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAudienceTypeWithAggregatesFilter<$PrismaModel> | $Enums.AudienceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAudienceTypeFilter<$PrismaModel>
    _max?: NestedEnumAudienceTypeFilter<$PrismaModel>
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

  export type NestedEnumSendJobStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SendJobStatus | EnumSendJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SendJobStatus[] | ListEnumSendJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SendJobStatus[] | ListEnumSendJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSendJobStatusFilter<$PrismaModel> | $Enums.SendJobStatus
  }

  export type NestedEnumSendJobStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SendJobStatus | EnumSendJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SendJobStatus[] | ListEnumSendJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SendJobStatus[] | ListEnumSendJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSendJobStatusWithAggregatesFilter<$PrismaModel> | $Enums.SendJobStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSendJobStatusFilter<$PrismaModel>
    _max?: NestedEnumSendJobStatusFilter<$PrismaModel>
  }

  export type NestedEnumSendEventTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SendEventType | EnumSendEventTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SendEventType[] | ListEnumSendEventTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SendEventType[] | ListEnumSendEventTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSendEventTypeFilter<$PrismaModel> | $Enums.SendEventType
  }

  export type NestedEnumSendEventTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SendEventType | EnumSendEventTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SendEventType[] | ListEnumSendEventTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SendEventType[] | ListEnumSendEventTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSendEventTypeWithAggregatesFilter<$PrismaModel> | $Enums.SendEventType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSendEventTypeFilter<$PrismaModel>
    _max?: NestedEnumSendEventTypeFilter<$PrismaModel>
  }

  export type NestedEnumSuppressionReasonFilter<$PrismaModel = never> = {
    equals?: $Enums.SuppressionReason | EnumSuppressionReasonFieldRefInput<$PrismaModel>
    in?: $Enums.SuppressionReason[] | ListEnumSuppressionReasonFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuppressionReason[] | ListEnumSuppressionReasonFieldRefInput<$PrismaModel>
    not?: NestedEnumSuppressionReasonFilter<$PrismaModel> | $Enums.SuppressionReason
  }

  export type NestedEnumSuppressionReasonWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SuppressionReason | EnumSuppressionReasonFieldRefInput<$PrismaModel>
    in?: $Enums.SuppressionReason[] | ListEnumSuppressionReasonFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuppressionReason[] | ListEnumSuppressionReasonFieldRefInput<$PrismaModel>
    not?: NestedEnumSuppressionReasonWithAggregatesFilter<$PrismaModel> | $Enums.SuppressionReason
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSuppressionReasonFilter<$PrismaModel>
    _max?: NestedEnumSuppressionReasonFilter<$PrismaModel>
  }

  export type NestedEnumReviewRequestStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewRequestStatus | EnumReviewRequestStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ReviewRequestStatus[] | ListEnumReviewRequestStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ReviewRequestStatus[] | ListEnumReviewRequestStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumReviewRequestStatusFilter<$PrismaModel> | $Enums.ReviewRequestStatus
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

  export type NestedEnumReviewRequestStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewRequestStatus | EnumReviewRequestStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ReviewRequestStatus[] | ListEnumReviewRequestStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ReviewRequestStatus[] | ListEnumReviewRequestStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumReviewRequestStatusWithAggregatesFilter<$PrismaModel> | $Enums.ReviewRequestStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumReviewRequestStatusFilter<$PrismaModel>
    _max?: NestedEnumReviewRequestStatusFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
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

  export type SendJobCreateWithoutCampaignInput = {
    id?: string
    companyId: string
    customerId: string
    channel: $Enums.MarketingChannel
    address: string
    status?: $Enums.SendJobStatus
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    externalId?: string | null
    automationTemplate?: string | null
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    events?: SendEventCreateNestedManyWithoutSendJobInput
  }

  export type SendJobUncheckedCreateWithoutCampaignInput = {
    id?: string
    companyId: string
    customerId: string
    channel: $Enums.MarketingChannel
    address: string
    status?: $Enums.SendJobStatus
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    externalId?: string | null
    automationTemplate?: string | null
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    events?: SendEventUncheckedCreateNestedManyWithoutSendJobInput
  }

  export type SendJobCreateOrConnectWithoutCampaignInput = {
    where: SendJobWhereUniqueInput
    create: XOR<SendJobCreateWithoutCampaignInput, SendJobUncheckedCreateWithoutCampaignInput>
  }

  export type SendJobCreateManyCampaignInputEnvelope = {
    data: SendJobCreateManyCampaignInput | SendJobCreateManyCampaignInput[]
    skipDuplicates?: boolean
  }

  export type SendJobUpsertWithWhereUniqueWithoutCampaignInput = {
    where: SendJobWhereUniqueInput
    update: XOR<SendJobUpdateWithoutCampaignInput, SendJobUncheckedUpdateWithoutCampaignInput>
    create: XOR<SendJobCreateWithoutCampaignInput, SendJobUncheckedCreateWithoutCampaignInput>
  }

  export type SendJobUpdateWithWhereUniqueWithoutCampaignInput = {
    where: SendJobWhereUniqueInput
    data: XOR<SendJobUpdateWithoutCampaignInput, SendJobUncheckedUpdateWithoutCampaignInput>
  }

  export type SendJobUpdateManyWithWhereWithoutCampaignInput = {
    where: SendJobScalarWhereInput
    data: XOR<SendJobUpdateManyMutationInput, SendJobUncheckedUpdateManyWithoutCampaignInput>
  }

  export type SendJobScalarWhereInput = {
    AND?: SendJobScalarWhereInput | SendJobScalarWhereInput[]
    OR?: SendJobScalarWhereInput[]
    NOT?: SendJobScalarWhereInput | SendJobScalarWhereInput[]
    id?: StringFilter<"SendJob"> | string
    campaignId?: StringNullableFilter<"SendJob"> | string | null
    companyId?: StringFilter<"SendJob"> | string
    customerId?: StringFilter<"SendJob"> | string
    channel?: EnumMarketingChannelFilter<"SendJob"> | $Enums.MarketingChannel
    address?: StringFilter<"SendJob"> | string
    status?: EnumSendJobStatusFilter<"SendJob"> | $Enums.SendJobStatus
    scheduledAt?: DateTimeNullableFilter<"SendJob"> | Date | string | null
    sentAt?: DateTimeNullableFilter<"SendJob"> | Date | string | null
    externalId?: StringNullableFilter<"SendJob"> | string | null
    automationTemplate?: StringNullableFilter<"SendJob"> | string | null
    error?: StringNullableFilter<"SendJob"> | string | null
    createdAt?: DateTimeFilter<"SendJob"> | Date | string
    updatedAt?: DateTimeFilter<"SendJob"> | Date | string
  }

  export type CampaignCreateWithoutSendJobsInput = {
    id?: string
    companyId: string
    name: string
    channel: $Enums.MarketingChannel
    status?: string
    audienceId?: string | null
    templateId?: string | null
    scheduleAt?: Date | string | null
    createdBy: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CampaignUncheckedCreateWithoutSendJobsInput = {
    id?: string
    companyId: string
    name: string
    channel: $Enums.MarketingChannel
    status?: string
    audienceId?: string | null
    templateId?: string | null
    scheduleAt?: Date | string | null
    createdBy: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CampaignCreateOrConnectWithoutSendJobsInput = {
    where: CampaignWhereUniqueInput
    create: XOR<CampaignCreateWithoutSendJobsInput, CampaignUncheckedCreateWithoutSendJobsInput>
  }

  export type SendEventCreateWithoutSendJobInput = {
    id?: string
    eventType: $Enums.SendEventType
    eventAt?: Date | string
    urlClicked?: string | null
    metadata?: string
  }

  export type SendEventUncheckedCreateWithoutSendJobInput = {
    id?: string
    eventType: $Enums.SendEventType
    eventAt?: Date | string
    urlClicked?: string | null
    metadata?: string
  }

  export type SendEventCreateOrConnectWithoutSendJobInput = {
    where: SendEventWhereUniqueInput
    create: XOR<SendEventCreateWithoutSendJobInput, SendEventUncheckedCreateWithoutSendJobInput>
  }

  export type SendEventCreateManySendJobInputEnvelope = {
    data: SendEventCreateManySendJobInput | SendEventCreateManySendJobInput[]
    skipDuplicates?: boolean
  }

  export type CampaignUpsertWithoutSendJobsInput = {
    update: XOR<CampaignUpdateWithoutSendJobsInput, CampaignUncheckedUpdateWithoutSendJobsInput>
    create: XOR<CampaignCreateWithoutSendJobsInput, CampaignUncheckedCreateWithoutSendJobsInput>
    where?: CampaignWhereInput
  }

  export type CampaignUpdateToOneWithWhereWithoutSendJobsInput = {
    where?: CampaignWhereInput
    data: XOR<CampaignUpdateWithoutSendJobsInput, CampaignUncheckedUpdateWithoutSendJobsInput>
  }

  export type CampaignUpdateWithoutSendJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    status?: StringFieldUpdateOperationsInput | string
    audienceId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    scheduleAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CampaignUncheckedUpdateWithoutSendJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    status?: StringFieldUpdateOperationsInput | string
    audienceId?: NullableStringFieldUpdateOperationsInput | string | null
    templateId?: NullableStringFieldUpdateOperationsInput | string | null
    scheduleAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SendEventUpsertWithWhereUniqueWithoutSendJobInput = {
    where: SendEventWhereUniqueInput
    update: XOR<SendEventUpdateWithoutSendJobInput, SendEventUncheckedUpdateWithoutSendJobInput>
    create: XOR<SendEventCreateWithoutSendJobInput, SendEventUncheckedCreateWithoutSendJobInput>
  }

  export type SendEventUpdateWithWhereUniqueWithoutSendJobInput = {
    where: SendEventWhereUniqueInput
    data: XOR<SendEventUpdateWithoutSendJobInput, SendEventUncheckedUpdateWithoutSendJobInput>
  }

  export type SendEventUpdateManyWithWhereWithoutSendJobInput = {
    where: SendEventScalarWhereInput
    data: XOR<SendEventUpdateManyMutationInput, SendEventUncheckedUpdateManyWithoutSendJobInput>
  }

  export type SendEventScalarWhereInput = {
    AND?: SendEventScalarWhereInput | SendEventScalarWhereInput[]
    OR?: SendEventScalarWhereInput[]
    NOT?: SendEventScalarWhereInput | SendEventScalarWhereInput[]
    id?: StringFilter<"SendEvent"> | string
    sendJobId?: StringFilter<"SendEvent"> | string
    eventType?: EnumSendEventTypeFilter<"SendEvent"> | $Enums.SendEventType
    eventAt?: DateTimeFilter<"SendEvent"> | Date | string
    urlClicked?: StringNullableFilter<"SendEvent"> | string | null
    metadata?: StringFilter<"SendEvent"> | string
  }

  export type SendJobCreateWithoutEventsInput = {
    id?: string
    companyId: string
    customerId: string
    channel: $Enums.MarketingChannel
    address: string
    status?: $Enums.SendJobStatus
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    externalId?: string | null
    automationTemplate?: string | null
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    campaign?: CampaignCreateNestedOneWithoutSendJobsInput
  }

  export type SendJobUncheckedCreateWithoutEventsInput = {
    id?: string
    campaignId?: string | null
    companyId: string
    customerId: string
    channel: $Enums.MarketingChannel
    address: string
    status?: $Enums.SendJobStatus
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    externalId?: string | null
    automationTemplate?: string | null
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SendJobCreateOrConnectWithoutEventsInput = {
    where: SendJobWhereUniqueInput
    create: XOR<SendJobCreateWithoutEventsInput, SendJobUncheckedCreateWithoutEventsInput>
  }

  export type SendJobUpsertWithoutEventsInput = {
    update: XOR<SendJobUpdateWithoutEventsInput, SendJobUncheckedUpdateWithoutEventsInput>
    create: XOR<SendJobCreateWithoutEventsInput, SendJobUncheckedCreateWithoutEventsInput>
    where?: SendJobWhereInput
  }

  export type SendJobUpdateToOneWithWhereWithoutEventsInput = {
    where?: SendJobWhereInput
    data: XOR<SendJobUpdateWithoutEventsInput, SendJobUncheckedUpdateWithoutEventsInput>
  }

  export type SendJobUpdateWithoutEventsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    status?: EnumSendJobStatusFieldUpdateOperationsInput | $Enums.SendJobStatus
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    automationTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    campaign?: CampaignUpdateOneWithoutSendJobsNestedInput
  }

  export type SendJobUncheckedUpdateWithoutEventsInput = {
    id?: StringFieldUpdateOperationsInput | string
    campaignId?: NullableStringFieldUpdateOperationsInput | string | null
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    status?: EnumSendJobStatusFieldUpdateOperationsInput | $Enums.SendJobStatus
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    automationTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SendJobCreateManyCampaignInput = {
    id?: string
    companyId: string
    customerId: string
    channel: $Enums.MarketingChannel
    address: string
    status?: $Enums.SendJobStatus
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    externalId?: string | null
    automationTemplate?: string | null
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SendJobUpdateWithoutCampaignInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    status?: EnumSendJobStatusFieldUpdateOperationsInput | $Enums.SendJobStatus
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    automationTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    events?: SendEventUpdateManyWithoutSendJobNestedInput
  }

  export type SendJobUncheckedUpdateWithoutCampaignInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    status?: EnumSendJobStatusFieldUpdateOperationsInput | $Enums.SendJobStatus
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    automationTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    events?: SendEventUncheckedUpdateManyWithoutSendJobNestedInput
  }

  export type SendJobUncheckedUpdateManyWithoutCampaignInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    channel?: EnumMarketingChannelFieldUpdateOperationsInput | $Enums.MarketingChannel
    address?: StringFieldUpdateOperationsInput | string
    status?: EnumSendJobStatusFieldUpdateOperationsInput | $Enums.SendJobStatus
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    automationTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SendEventCreateManySendJobInput = {
    id?: string
    eventType: $Enums.SendEventType
    eventAt?: Date | string
    urlClicked?: string | null
    metadata?: string
  }

  export type SendEventUpdateWithoutSendJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: EnumSendEventTypeFieldUpdateOperationsInput | $Enums.SendEventType
    eventAt?: DateTimeFieldUpdateOperationsInput | Date | string
    urlClicked?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: StringFieldUpdateOperationsInput | string
  }

  export type SendEventUncheckedUpdateWithoutSendJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: EnumSendEventTypeFieldUpdateOperationsInput | $Enums.SendEventType
    eventAt?: DateTimeFieldUpdateOperationsInput | Date | string
    urlClicked?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: StringFieldUpdateOperationsInput | string
  }

  export type SendEventUncheckedUpdateManyWithoutSendJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: EnumSendEventTypeFieldUpdateOperationsInput | $Enums.SendEventType
    eventAt?: DateTimeFieldUpdateOperationsInput | Date | string
    urlClicked?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use CampaignCountOutputTypeDefaultArgs instead
     */
    export type CampaignCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CampaignCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SendJobCountOutputTypeDefaultArgs instead
     */
    export type SendJobCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SendJobCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CampaignDefaultArgs instead
     */
    export type CampaignArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CampaignDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TemplateDefaultArgs instead
     */
    export type TemplateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TemplateDefaultArgs<ExtArgs>
    /**
     * @deprecated Use AudienceDefaultArgs instead
     */
    export type AudienceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = AudienceDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SendJobDefaultArgs instead
     */
    export type SendJobArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SendJobDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SendEventDefaultArgs instead
     */
    export type SendEventArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SendEventDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SuppressionDefaultArgs instead
     */
    export type SuppressionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SuppressionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ReviewRequestDefaultArgs instead
     */
    export type ReviewRequestArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ReviewRequestDefaultArgs<ExtArgs>
    /**
     * @deprecated Use MarketingAttributionDefaultArgs instead
     */
    export type MarketingAttributionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = MarketingAttributionDefaultArgs<ExtArgs>

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