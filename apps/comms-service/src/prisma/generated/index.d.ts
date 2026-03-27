
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
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model Notification
 * 
 */
export type Notification = $Result.DefaultSelection<Prisma.$NotificationPayload>
/**
 * Model MessageThread
 * 
 */
export type MessageThread = $Result.DefaultSelection<Prisma.$MessageThreadPayload>
/**
 * Model NotificationTemplate
 * 
 */
export type NotificationTemplate = $Result.DefaultSelection<Prisma.$NotificationTemplatePayload>
/**
 * Model AutomationRule
 * 
 */
export type AutomationRule = $Result.DefaultSelection<Prisma.$AutomationRulePayload>
/**
 * Model DeliveryLog
 * 
 */
export type DeliveryLog = $Result.DefaultSelection<Prisma.$DeliveryLogPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Channel: {
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP'
};

export type Channel = (typeof Channel)[keyof typeof Channel]


export const DeliveryStatus: {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  BOUNCED: 'BOUNCED',
  UNSUBSCRIBED: 'UNSUBSCRIBED'
};

export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus]


export const ThreadStatus: {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  SPAM: 'SPAM'
};

export type ThreadStatus = (typeof ThreadStatus)[keyof typeof ThreadStatus]


export const TemplateType: {
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  JOB_STATUS_UPDATE: 'JOB_STATUS_UPDATE',
  INVOICE_SENT: 'INVOICE_SENT',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  REVIEW_REQUEST: 'REVIEW_REQUEST',
  WELCOME: 'WELCOME',
  CUSTOM: 'CUSTOM'
};

export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType]


export const AutomationTrigger: {
  JOB_STATUS_CHANGED: 'JOB_STATUS_CHANGED',
  INVOICE_SENT: 'INVOICE_SENT',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  QUOTE_APPROVED: 'QUOTE_APPROVED',
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  MANUAL: 'MANUAL'
};

export type AutomationTrigger = (typeof AutomationTrigger)[keyof typeof AutomationTrigger]


export const MessageDirection: {
  OUTBOUND: 'OUTBOUND',
  INBOUND: 'INBOUND'
};

export type MessageDirection = (typeof MessageDirection)[keyof typeof MessageDirection]

}

export type Channel = $Enums.Channel

export const Channel: typeof $Enums.Channel

export type DeliveryStatus = $Enums.DeliveryStatus

export const DeliveryStatus: typeof $Enums.DeliveryStatus

export type ThreadStatus = $Enums.ThreadStatus

export const ThreadStatus: typeof $Enums.ThreadStatus

export type TemplateType = $Enums.TemplateType

export const TemplateType: typeof $Enums.TemplateType

export type AutomationTrigger = $Enums.AutomationTrigger

export const AutomationTrigger: typeof $Enums.AutomationTrigger

export type MessageDirection = $Enums.MessageDirection

export const MessageDirection: typeof $Enums.MessageDirection

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Notifications
 * const notifications = await prisma.notification.findMany()
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
   * // Fetch zero or more Notifications
   * const notifications = await prisma.notification.findMany()
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
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P]): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number }): $Utils.JsPromise<R>

  /**
   * Executes a raw MongoDB command and returns the result of it.
   * @example
   * ```
   * const user = await prisma.$runCommandRaw({
   *   aggregate: 'User',
   *   pipeline: [{ $match: { name: 'Bob' } }, { $project: { email: true, _id: false } }],
   *   explain: false,
   * })
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $runCommandRaw(command: Prisma.InputJsonObject): Prisma.PrismaPromise<Prisma.JsonObject>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.notification`: Exposes CRUD operations for the **Notification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notifications
    * const notifications = await prisma.notification.findMany()
    * ```
    */
  get notification(): Prisma.NotificationDelegate<ExtArgs>;

  /**
   * `prisma.messageThread`: Exposes CRUD operations for the **MessageThread** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MessageThreads
    * const messageThreads = await prisma.messageThread.findMany()
    * ```
    */
  get messageThread(): Prisma.MessageThreadDelegate<ExtArgs>;

  /**
   * `prisma.notificationTemplate`: Exposes CRUD operations for the **NotificationTemplate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more NotificationTemplates
    * const notificationTemplates = await prisma.notificationTemplate.findMany()
    * ```
    */
  get notificationTemplate(): Prisma.NotificationTemplateDelegate<ExtArgs>;

  /**
   * `prisma.automationRule`: Exposes CRUD operations for the **AutomationRule** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AutomationRules
    * const automationRules = await prisma.automationRule.findMany()
    * ```
    */
  get automationRule(): Prisma.AutomationRuleDelegate<ExtArgs>;

  /**
   * `prisma.deliveryLog`: Exposes CRUD operations for the **DeliveryLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DeliveryLogs
    * const deliveryLogs = await prisma.deliveryLog.findMany()
    * ```
    */
  get deliveryLog(): Prisma.DeliveryLogDelegate<ExtArgs>;
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
    Notification: 'Notification',
    MessageThread: 'MessageThread',
    NotificationTemplate: 'NotificationTemplate',
    AutomationRule: 'AutomationRule',
    DeliveryLog: 'DeliveryLog'
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
      modelProps: "notification" | "messageThread" | "notificationTemplate" | "automationRule" | "deliveryLog"
      txIsolationLevel: never
    }
    model: {
      Notification: {
        payload: Prisma.$NotificationPayload<ExtArgs>
        fields: Prisma.NotificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findFirst: {
            args: Prisma.NotificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findMany: {
            args: Prisma.NotificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          create: {
            args: Prisma.NotificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          createMany: {
            args: Prisma.NotificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.NotificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          update: {
            args: Prisma.NotificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          deleteMany: {
            args: Prisma.NotificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.NotificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          aggregate: {
            args: Prisma.NotificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotification>
          }
          groupBy: {
            args: Prisma.NotificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.NotificationFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.NotificationAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.NotificationCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationCountAggregateOutputType> | number
          }
        }
      }
      MessageThread: {
        payload: Prisma.$MessageThreadPayload<ExtArgs>
        fields: Prisma.MessageThreadFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageThreadFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageThreadPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageThreadFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageThreadPayload>
          }
          findFirst: {
            args: Prisma.MessageThreadFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageThreadPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageThreadFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageThreadPayload>
          }
          findMany: {
            args: Prisma.MessageThreadFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageThreadPayload>[]
          }
          create: {
            args: Prisma.MessageThreadCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageThreadPayload>
          }
          createMany: {
            args: Prisma.MessageThreadCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.MessageThreadDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageThreadPayload>
          }
          update: {
            args: Prisma.MessageThreadUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageThreadPayload>
          }
          deleteMany: {
            args: Prisma.MessageThreadDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageThreadUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MessageThreadUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageThreadPayload>
          }
          aggregate: {
            args: Prisma.MessageThreadAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessageThread>
          }
          groupBy: {
            args: Prisma.MessageThreadGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageThreadGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.MessageThreadFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.MessageThreadAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.MessageThreadCountArgs<ExtArgs>
            result: $Utils.Optional<MessageThreadCountAggregateOutputType> | number
          }
        }
      }
      NotificationTemplate: {
        payload: Prisma.$NotificationTemplatePayload<ExtArgs>
        fields: Prisma.NotificationTemplateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationTemplateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationTemplatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationTemplateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationTemplatePayload>
          }
          findFirst: {
            args: Prisma.NotificationTemplateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationTemplatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationTemplateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationTemplatePayload>
          }
          findMany: {
            args: Prisma.NotificationTemplateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationTemplatePayload>[]
          }
          create: {
            args: Prisma.NotificationTemplateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationTemplatePayload>
          }
          createMany: {
            args: Prisma.NotificationTemplateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.NotificationTemplateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationTemplatePayload>
          }
          update: {
            args: Prisma.NotificationTemplateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationTemplatePayload>
          }
          deleteMany: {
            args: Prisma.NotificationTemplateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationTemplateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.NotificationTemplateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationTemplatePayload>
          }
          aggregate: {
            args: Prisma.NotificationTemplateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotificationTemplate>
          }
          groupBy: {
            args: Prisma.NotificationTemplateGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationTemplateGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.NotificationTemplateFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.NotificationTemplateAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.NotificationTemplateCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationTemplateCountAggregateOutputType> | number
          }
        }
      }
      AutomationRule: {
        payload: Prisma.$AutomationRulePayload<ExtArgs>
        fields: Prisma.AutomationRuleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AutomationRuleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AutomationRulePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AutomationRuleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AutomationRulePayload>
          }
          findFirst: {
            args: Prisma.AutomationRuleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AutomationRulePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AutomationRuleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AutomationRulePayload>
          }
          findMany: {
            args: Prisma.AutomationRuleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AutomationRulePayload>[]
          }
          create: {
            args: Prisma.AutomationRuleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AutomationRulePayload>
          }
          createMany: {
            args: Prisma.AutomationRuleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.AutomationRuleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AutomationRulePayload>
          }
          update: {
            args: Prisma.AutomationRuleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AutomationRulePayload>
          }
          deleteMany: {
            args: Prisma.AutomationRuleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AutomationRuleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AutomationRuleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AutomationRulePayload>
          }
          aggregate: {
            args: Prisma.AutomationRuleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAutomationRule>
          }
          groupBy: {
            args: Prisma.AutomationRuleGroupByArgs<ExtArgs>
            result: $Utils.Optional<AutomationRuleGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.AutomationRuleFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.AutomationRuleAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.AutomationRuleCountArgs<ExtArgs>
            result: $Utils.Optional<AutomationRuleCountAggregateOutputType> | number
          }
        }
      }
      DeliveryLog: {
        payload: Prisma.$DeliveryLogPayload<ExtArgs>
        fields: Prisma.DeliveryLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DeliveryLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DeliveryLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryLogPayload>
          }
          findFirst: {
            args: Prisma.DeliveryLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DeliveryLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryLogPayload>
          }
          findMany: {
            args: Prisma.DeliveryLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryLogPayload>[]
          }
          create: {
            args: Prisma.DeliveryLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryLogPayload>
          }
          createMany: {
            args: Prisma.DeliveryLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.DeliveryLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryLogPayload>
          }
          update: {
            args: Prisma.DeliveryLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryLogPayload>
          }
          deleteMany: {
            args: Prisma.DeliveryLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DeliveryLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.DeliveryLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryLogPayload>
          }
          aggregate: {
            args: Prisma.DeliveryLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDeliveryLog>
          }
          groupBy: {
            args: Prisma.DeliveryLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<DeliveryLogGroupByOutputType>[]
          }
          findRaw: {
            args: Prisma.DeliveryLogFindRawArgs<ExtArgs>
            result: JsonObject
          }
          aggregateRaw: {
            args: Prisma.DeliveryLogAggregateRawArgs<ExtArgs>
            result: JsonObject
          }
          count: {
            args: Prisma.DeliveryLogCountArgs<ExtArgs>
            result: $Utils.Optional<DeliveryLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $runCommandRaw: {
          args: Prisma.InputJsonObject,
          result: Prisma.JsonObject
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
   * Models
   */

  /**
   * Model Message
   */





  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    senderId?: boolean
    senderName?: boolean
    direction?: boolean
    body?: boolean
    channel?: boolean
    mediaUrls?: boolean
    twilioSid?: boolean
    sentAt?: boolean
    deliveredAt?: boolean
    readAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["message"]>


  export type MessageSelectScalar = {
    id?: boolean
    senderId?: boolean
    senderName?: boolean
    direction?: boolean
    body?: boolean
    channel?: boolean
    mediaUrls?: boolean
    twilioSid?: boolean
    sentAt?: boolean
    deliveredAt?: boolean
    readAt?: boolean
    createdAt?: boolean
  }


  export type $MessagePayload = {
    name: "Message"
    objects: {}
    scalars: {
      id: string
      senderId: string
      senderName: string
      direction: $Enums.MessageDirection
      body: string
      channel: $Enums.Channel
      mediaUrls: string[]
      twilioSid: string | null
      sentAt: Date | null
      deliveredAt: Date | null
      readAt: Date | null
      createdAt: Date
    }
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>





  /**
   * Fields of the Message model
   */ 
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'String'>
    readonly senderId: FieldRef<"Message", 'String'>
    readonly senderName: FieldRef<"Message", 'String'>
    readonly direction: FieldRef<"Message", 'MessageDirection'>
    readonly body: FieldRef<"Message", 'String'>
    readonly channel: FieldRef<"Message", 'Channel'>
    readonly mediaUrls: FieldRef<"Message", 'String[]'>
    readonly twilioSid: FieldRef<"Message", 'String'>
    readonly sentAt: FieldRef<"Message", 'DateTime'>
    readonly deliveredAt: FieldRef<"Message", 'DateTime'>
    readonly readAt: FieldRef<"Message", 'DateTime'>
    readonly createdAt: FieldRef<"Message", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
  }


  /**
   * Model Notification
   */

  export type AggregateNotification = {
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  export type NotificationMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    jobId: string | null
    invoiceId: string | null
    quoteId: string | null
    recipientId: string | null
    recipientName: string | null
    recipientEmail: string | null
    recipientPhone: string | null
    recipientPushToken: string | null
    channel: $Enums.Channel | null
    subject: string | null
    body: string | null
    status: $Enums.DeliveryStatus | null
    externalId: string | null
    providerResponse: string | null
    error: string | null
    isRead: boolean | null
    title: string | null
    type: string | null
    scheduledAt: Date | null
    sentAt: Date | null
    deliveredAt: Date | null
    failedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NotificationMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    jobId: string | null
    invoiceId: string | null
    quoteId: string | null
    recipientId: string | null
    recipientName: string | null
    recipientEmail: string | null
    recipientPhone: string | null
    recipientPushToken: string | null
    channel: $Enums.Channel | null
    subject: string | null
    body: string | null
    status: $Enums.DeliveryStatus | null
    externalId: string | null
    providerResponse: string | null
    error: string | null
    isRead: boolean | null
    title: string | null
    type: string | null
    scheduledAt: Date | null
    sentAt: Date | null
    deliveredAt: Date | null
    failedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NotificationCountAggregateOutputType = {
    id: number
    companyId: number
    customerId: number
    jobId: number
    invoiceId: number
    quoteId: number
    recipientId: number
    recipientName: number
    recipientEmail: number
    recipientPhone: number
    recipientPushToken: number
    channel: number
    subject: number
    body: number
    status: number
    externalId: number
    providerResponse: number
    error: number
    isRead: number
    title: number
    type: number
    scheduledAt: number
    sentAt: number
    deliveredAt: number
    failedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type NotificationMinAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    jobId?: true
    invoiceId?: true
    quoteId?: true
    recipientId?: true
    recipientName?: true
    recipientEmail?: true
    recipientPhone?: true
    recipientPushToken?: true
    channel?: true
    subject?: true
    body?: true
    status?: true
    externalId?: true
    providerResponse?: true
    error?: true
    isRead?: true
    title?: true
    type?: true
    scheduledAt?: true
    sentAt?: true
    deliveredAt?: true
    failedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NotificationMaxAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    jobId?: true
    invoiceId?: true
    quoteId?: true
    recipientId?: true
    recipientName?: true
    recipientEmail?: true
    recipientPhone?: true
    recipientPushToken?: true
    channel?: true
    subject?: true
    body?: true
    status?: true
    externalId?: true
    providerResponse?: true
    error?: true
    isRead?: true
    title?: true
    type?: true
    scheduledAt?: true
    sentAt?: true
    deliveredAt?: true
    failedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NotificationCountAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    jobId?: true
    invoiceId?: true
    quoteId?: true
    recipientId?: true
    recipientName?: true
    recipientEmail?: true
    recipientPhone?: true
    recipientPushToken?: true
    channel?: true
    subject?: true
    body?: true
    status?: true
    externalId?: true
    providerResponse?: true
    error?: true
    isRead?: true
    title?: true
    type?: true
    scheduledAt?: true
    sentAt?: true
    deliveredAt?: true
    failedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type NotificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notification to aggregate.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Notifications
    **/
    _count?: true | NotificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationMaxAggregateInputType
  }

  export type GetNotificationAggregateType<T extends NotificationAggregateArgs> = {
        [P in keyof T & keyof AggregateNotification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotification[P]>
      : GetScalarType<T[P], AggregateNotification[P]>
  }




  export type NotificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithAggregationInput | NotificationOrderByWithAggregationInput[]
    by: NotificationScalarFieldEnum[] | NotificationScalarFieldEnum
    having?: NotificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationCountAggregateInputType | true
    _min?: NotificationMinAggregateInputType
    _max?: NotificationMaxAggregateInputType
  }

  export type NotificationGroupByOutputType = {
    id: string
    companyId: string
    customerId: string | null
    jobId: string | null
    invoiceId: string | null
    quoteId: string | null
    recipientId: string
    recipientName: string | null
    recipientEmail: string | null
    recipientPhone: string | null
    recipientPushToken: string | null
    channel: $Enums.Channel
    subject: string | null
    body: string
    status: $Enums.DeliveryStatus
    externalId: string | null
    providerResponse: string | null
    error: string | null
    isRead: boolean
    title: string | null
    type: string | null
    scheduledAt: Date | null
    sentAt: Date | null
    deliveredAt: Date | null
    failedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  type GetNotificationGroupByPayload<T extends NotificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationGroupByOutputType[P]>
        }
      >
    >


  export type NotificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    jobId?: boolean
    invoiceId?: boolean
    quoteId?: boolean
    recipientId?: boolean
    recipientName?: boolean
    recipientEmail?: boolean
    recipientPhone?: boolean
    recipientPushToken?: boolean
    channel?: boolean
    subject?: boolean
    body?: boolean
    status?: boolean
    externalId?: boolean
    providerResponse?: boolean
    error?: boolean
    isRead?: boolean
    title?: boolean
    type?: boolean
    scheduledAt?: boolean
    sentAt?: boolean
    deliveredAt?: boolean
    failedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["notification"]>


  export type NotificationSelectScalar = {
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    jobId?: boolean
    invoiceId?: boolean
    quoteId?: boolean
    recipientId?: boolean
    recipientName?: boolean
    recipientEmail?: boolean
    recipientPhone?: boolean
    recipientPushToken?: boolean
    channel?: boolean
    subject?: boolean
    body?: boolean
    status?: boolean
    externalId?: boolean
    providerResponse?: boolean
    error?: boolean
    isRead?: boolean
    title?: boolean
    type?: boolean
    scheduledAt?: boolean
    sentAt?: boolean
    deliveredAt?: boolean
    failedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $NotificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Notification"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      customerId: string | null
      jobId: string | null
      invoiceId: string | null
      quoteId: string | null
      recipientId: string
      recipientName: string | null
      recipientEmail: string | null
      recipientPhone: string | null
      recipientPushToken: string | null
      channel: $Enums.Channel
      subject: string | null
      body: string
      status: $Enums.DeliveryStatus
      externalId: string | null
      providerResponse: string | null
      error: string | null
      isRead: boolean
      title: string | null
      type: string | null
      scheduledAt: Date | null
      sentAt: Date | null
      deliveredAt: Date | null
      failedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["notification"]>
    composites: {}
  }

  type NotificationGetPayload<S extends boolean | null | undefined | NotificationDefaultArgs> = $Result.GetResult<Prisma.$NotificationPayload, S>

  type NotificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<NotificationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: NotificationCountAggregateInputType | true
    }

  export interface NotificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Notification'], meta: { name: 'Notification' } }
    /**
     * Find zero or one Notification that matches the filter.
     * @param {NotificationFindUniqueArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationFindUniqueArgs>(args: SelectSubset<T, NotificationFindUniqueArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Notification that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {NotificationFindUniqueOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Notification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationFindFirstArgs>(args?: SelectSubset<T, NotificationFindFirstArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Notification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Notifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notifications
     * const notifications = await prisma.notification.findMany()
     * 
     * // Get first 10 Notifications
     * const notifications = await prisma.notification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationWithIdOnly = await prisma.notification.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationFindManyArgs>(args?: SelectSubset<T, NotificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Notification.
     * @param {NotificationCreateArgs} args - Arguments to create a Notification.
     * @example
     * // Create one Notification
     * const Notification = await prisma.notification.create({
     *   data: {
     *     // ... data to create a Notification
     *   }
     * })
     * 
     */
    create<T extends NotificationCreateArgs>(args: SelectSubset<T, NotificationCreateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Notifications.
     * @param {NotificationCreateManyArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationCreateManyArgs>(args?: SelectSubset<T, NotificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Notification.
     * @param {NotificationDeleteArgs} args - Arguments to delete one Notification.
     * @example
     * // Delete one Notification
     * const Notification = await prisma.notification.delete({
     *   where: {
     *     // ... filter to delete one Notification
     *   }
     * })
     * 
     */
    delete<T extends NotificationDeleteArgs>(args: SelectSubset<T, NotificationDeleteArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Notification.
     * @param {NotificationUpdateArgs} args - Arguments to update one Notification.
     * @example
     * // Update one Notification
     * const notification = await prisma.notification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationUpdateArgs>(args: SelectSubset<T, NotificationUpdateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Notifications.
     * @param {NotificationDeleteManyArgs} args - Arguments to filter Notifications to delete.
     * @example
     * // Delete a few Notifications
     * const { count } = await prisma.notification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationDeleteManyArgs>(args?: SelectSubset<T, NotificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationUpdateManyArgs>(args: SelectSubset<T, NotificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Notification.
     * @param {NotificationUpsertArgs} args - Arguments to update or create a Notification.
     * @example
     * // Update or create a Notification
     * const notification = await prisma.notification.upsert({
     *   create: {
     *     // ... data to create a Notification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Notification we want to update
     *   }
     * })
     */
    upsert<T extends NotificationUpsertArgs>(args: SelectSubset<T, NotificationUpsertArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>

    /**
     * Find zero or more Notifications that matches the filter.
     * @param {NotificationFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const notification = await prisma.notification.findRaw({
     *   filter: { age: { $gt: 25 } } 
     * })
     */
    findRaw(args?: NotificationFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a Notification.
     * @param {NotificationAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const notification = await prisma.notification.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: NotificationAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationCountArgs} args - Arguments to filter Notifications to count.
     * @example
     * // Count the number of Notifications
     * const count = await prisma.notification.count({
     *   where: {
     *     // ... the filter for the Notifications we want to count
     *   }
     * })
    **/
    count<T extends NotificationCountArgs>(
      args?: Subset<T, NotificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends NotificationAggregateArgs>(args: Subset<T, NotificationAggregateArgs>): Prisma.PrismaPromise<GetNotificationAggregateType<T>>

    /**
     * Group by Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationGroupByArgs} args - Group by arguments.
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
      T extends NotificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationGroupByArgs['orderBy'] }
        : { orderBy?: NotificationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, NotificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Notification model
   */
  readonly fields: NotificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Notification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Notification model
   */ 
  interface NotificationFieldRefs {
    readonly id: FieldRef<"Notification", 'String'>
    readonly companyId: FieldRef<"Notification", 'String'>
    readonly customerId: FieldRef<"Notification", 'String'>
    readonly jobId: FieldRef<"Notification", 'String'>
    readonly invoiceId: FieldRef<"Notification", 'String'>
    readonly quoteId: FieldRef<"Notification", 'String'>
    readonly recipientId: FieldRef<"Notification", 'String'>
    readonly recipientName: FieldRef<"Notification", 'String'>
    readonly recipientEmail: FieldRef<"Notification", 'String'>
    readonly recipientPhone: FieldRef<"Notification", 'String'>
    readonly recipientPushToken: FieldRef<"Notification", 'String'>
    readonly channel: FieldRef<"Notification", 'Channel'>
    readonly subject: FieldRef<"Notification", 'String'>
    readonly body: FieldRef<"Notification", 'String'>
    readonly status: FieldRef<"Notification", 'DeliveryStatus'>
    readonly externalId: FieldRef<"Notification", 'String'>
    readonly providerResponse: FieldRef<"Notification", 'String'>
    readonly error: FieldRef<"Notification", 'String'>
    readonly isRead: FieldRef<"Notification", 'Boolean'>
    readonly title: FieldRef<"Notification", 'String'>
    readonly type: FieldRef<"Notification", 'String'>
    readonly scheduledAt: FieldRef<"Notification", 'DateTime'>
    readonly sentAt: FieldRef<"Notification", 'DateTime'>
    readonly deliveredAt: FieldRef<"Notification", 'DateTime'>
    readonly failedAt: FieldRef<"Notification", 'DateTime'>
    readonly createdAt: FieldRef<"Notification", 'DateTime'>
    readonly updatedAt: FieldRef<"Notification", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Notification findUnique
   */
  export type NotificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findUniqueOrThrow
   */
  export type NotificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findFirst
   */
  export type NotificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findFirstOrThrow
   */
  export type NotificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findMany
   */
  export type NotificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notifications to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification create
   */
  export type NotificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * The data needed to create a Notification.
     */
    data: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
  }

  /**
   * Notification createMany
   */
  export type NotificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
  }

  /**
   * Notification update
   */
  export type NotificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * The data needed to update a Notification.
     */
    data: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
    /**
     * Choose, which Notification to update.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification updateMany
   */
  export type NotificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Notifications.
     */
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyInput>
    /**
     * Filter which Notifications to update
     */
    where?: NotificationWhereInput
  }

  /**
   * Notification upsert
   */
  export type NotificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * The filter to search for the Notification to update in case it exists.
     */
    where: NotificationWhereUniqueInput
    /**
     * In case the Notification found by the `where` argument doesn't exist, create a new Notification with this data.
     */
    create: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
    /**
     * In case the Notification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
  }

  /**
   * Notification delete
   */
  export type NotificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter which Notification to delete.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification deleteMany
   */
  export type NotificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notifications to delete
     */
    where?: NotificationWhereInput
  }

  /**
   * Notification findRaw
   */
  export type NotificationFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Notification aggregateRaw
   */
  export type NotificationAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * Notification without action
   */
  export type NotificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
  }


  /**
   * Model MessageThread
   */

  export type AggregateMessageThread = {
    _count: MessageThreadCountAggregateOutputType | null
    _avg: MessageThreadAvgAggregateOutputType | null
    _sum: MessageThreadSumAggregateOutputType | null
    _min: MessageThreadMinAggregateOutputType | null
    _max: MessageThreadMaxAggregateOutputType | null
  }

  export type MessageThreadAvgAggregateOutputType = {
    unreadCount: number | null
  }

  export type MessageThreadSumAggregateOutputType = {
    unreadCount: number | null
  }

  export type MessageThreadMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    customerName: string | null
    customerPhone: string | null
    customerEmail: string | null
    subject: string | null
    jobId: string | null
    status: $Enums.ThreadStatus | null
    unreadCount: number | null
    lastMessageAt: Date | null
    lastMessageBody: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MessageThreadMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    customerName: string | null
    customerPhone: string | null
    customerEmail: string | null
    subject: string | null
    jobId: string | null
    status: $Enums.ThreadStatus | null
    unreadCount: number | null
    lastMessageAt: Date | null
    lastMessageBody: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MessageThreadCountAggregateOutputType = {
    id: number
    companyId: number
    customerId: number
    customerName: number
    customerPhone: number
    customerEmail: number
    participantIds: number
    participantNames: number
    subject: number
    jobId: number
    status: number
    unreadCount: number
    lastMessageAt: number
    lastMessageBody: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type MessageThreadAvgAggregateInputType = {
    unreadCount?: true
  }

  export type MessageThreadSumAggregateInputType = {
    unreadCount?: true
  }

  export type MessageThreadMinAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    customerName?: true
    customerPhone?: true
    customerEmail?: true
    subject?: true
    jobId?: true
    status?: true
    unreadCount?: true
    lastMessageAt?: true
    lastMessageBody?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MessageThreadMaxAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    customerName?: true
    customerPhone?: true
    customerEmail?: true
    subject?: true
    jobId?: true
    status?: true
    unreadCount?: true
    lastMessageAt?: true
    lastMessageBody?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MessageThreadCountAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    customerName?: true
    customerPhone?: true
    customerEmail?: true
    participantIds?: true
    participantNames?: true
    subject?: true
    jobId?: true
    status?: true
    unreadCount?: true
    lastMessageAt?: true
    lastMessageBody?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type MessageThreadAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MessageThread to aggregate.
     */
    where?: MessageThreadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MessageThreads to fetch.
     */
    orderBy?: MessageThreadOrderByWithRelationInput | MessageThreadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageThreadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MessageThreads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MessageThreads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MessageThreads
    **/
    _count?: true | MessageThreadCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MessageThreadAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MessageThreadSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageThreadMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageThreadMaxAggregateInputType
  }

  export type GetMessageThreadAggregateType<T extends MessageThreadAggregateArgs> = {
        [P in keyof T & keyof AggregateMessageThread]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessageThread[P]>
      : GetScalarType<T[P], AggregateMessageThread[P]>
  }




  export type MessageThreadGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageThreadWhereInput
    orderBy?: MessageThreadOrderByWithAggregationInput | MessageThreadOrderByWithAggregationInput[]
    by: MessageThreadScalarFieldEnum[] | MessageThreadScalarFieldEnum
    having?: MessageThreadScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageThreadCountAggregateInputType | true
    _avg?: MessageThreadAvgAggregateInputType
    _sum?: MessageThreadSumAggregateInputType
    _min?: MessageThreadMinAggregateInputType
    _max?: MessageThreadMaxAggregateInputType
  }

  export type MessageThreadGroupByOutputType = {
    id: string
    companyId: string
    customerId: string | null
    customerName: string | null
    customerPhone: string | null
    customerEmail: string | null
    participantIds: string[]
    participantNames: string[]
    subject: string | null
    jobId: string | null
    status: $Enums.ThreadStatus
    unreadCount: number
    lastMessageAt: Date | null
    lastMessageBody: string | null
    createdAt: Date
    updatedAt: Date
    _count: MessageThreadCountAggregateOutputType | null
    _avg: MessageThreadAvgAggregateOutputType | null
    _sum: MessageThreadSumAggregateOutputType | null
    _min: MessageThreadMinAggregateOutputType | null
    _max: MessageThreadMaxAggregateOutputType | null
  }

  type GetMessageThreadGroupByPayload<T extends MessageThreadGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageThreadGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageThreadGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageThreadGroupByOutputType[P]>
            : GetScalarType<T[P], MessageThreadGroupByOutputType[P]>
        }
      >
    >


  export type MessageThreadSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerPhone?: boolean
    customerEmail?: boolean
    participantIds?: boolean
    participantNames?: boolean
    subject?: boolean
    jobId?: boolean
    status?: boolean
    unreadCount?: boolean
    lastMessageAt?: boolean
    lastMessageBody?: boolean
    messages?: boolean | MessageDefaultArgs<ExtArgs>
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["messageThread"]>


  export type MessageThreadSelectScalar = {
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerPhone?: boolean
    customerEmail?: boolean
    participantIds?: boolean
    participantNames?: boolean
    subject?: boolean
    jobId?: boolean
    status?: boolean
    unreadCount?: boolean
    lastMessageAt?: boolean
    lastMessageBody?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type MessageThreadInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $MessageThreadPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MessageThread"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      customerId: string | null
      customerName: string | null
      customerPhone: string | null
      customerEmail: string | null
      participantIds: string[]
      participantNames: string[]
      subject: string | null
      jobId: string | null
      status: $Enums.ThreadStatus
      unreadCount: number
      lastMessageAt: Date | null
      lastMessageBody: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["messageThread"]>
    composites: {
      messages: Prisma.$MessagePayload[]
    }
  }

  type MessageThreadGetPayload<S extends boolean | null | undefined | MessageThreadDefaultArgs> = $Result.GetResult<Prisma.$MessageThreadPayload, S>

  type MessageThreadCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<MessageThreadFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: MessageThreadCountAggregateInputType | true
    }

  export interface MessageThreadDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MessageThread'], meta: { name: 'MessageThread' } }
    /**
     * Find zero or one MessageThread that matches the filter.
     * @param {MessageThreadFindUniqueArgs} args - Arguments to find a MessageThread
     * @example
     * // Get one MessageThread
     * const messageThread = await prisma.messageThread.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageThreadFindUniqueArgs>(args: SelectSubset<T, MessageThreadFindUniqueArgs<ExtArgs>>): Prisma__MessageThreadClient<$Result.GetResult<Prisma.$MessageThreadPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one MessageThread that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {MessageThreadFindUniqueOrThrowArgs} args - Arguments to find a MessageThread
     * @example
     * // Get one MessageThread
     * const messageThread = await prisma.messageThread.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageThreadFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageThreadFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageThreadClient<$Result.GetResult<Prisma.$MessageThreadPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first MessageThread that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageThreadFindFirstArgs} args - Arguments to find a MessageThread
     * @example
     * // Get one MessageThread
     * const messageThread = await prisma.messageThread.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageThreadFindFirstArgs>(args?: SelectSubset<T, MessageThreadFindFirstArgs<ExtArgs>>): Prisma__MessageThreadClient<$Result.GetResult<Prisma.$MessageThreadPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first MessageThread that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageThreadFindFirstOrThrowArgs} args - Arguments to find a MessageThread
     * @example
     * // Get one MessageThread
     * const messageThread = await prisma.messageThread.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageThreadFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageThreadFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageThreadClient<$Result.GetResult<Prisma.$MessageThreadPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more MessageThreads that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageThreadFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MessageThreads
     * const messageThreads = await prisma.messageThread.findMany()
     * 
     * // Get first 10 MessageThreads
     * const messageThreads = await prisma.messageThread.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageThreadWithIdOnly = await prisma.messageThread.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageThreadFindManyArgs>(args?: SelectSubset<T, MessageThreadFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessageThreadPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a MessageThread.
     * @param {MessageThreadCreateArgs} args - Arguments to create a MessageThread.
     * @example
     * // Create one MessageThread
     * const MessageThread = await prisma.messageThread.create({
     *   data: {
     *     // ... data to create a MessageThread
     *   }
     * })
     * 
     */
    create<T extends MessageThreadCreateArgs>(args: SelectSubset<T, MessageThreadCreateArgs<ExtArgs>>): Prisma__MessageThreadClient<$Result.GetResult<Prisma.$MessageThreadPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many MessageThreads.
     * @param {MessageThreadCreateManyArgs} args - Arguments to create many MessageThreads.
     * @example
     * // Create many MessageThreads
     * const messageThread = await prisma.messageThread.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageThreadCreateManyArgs>(args?: SelectSubset<T, MessageThreadCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a MessageThread.
     * @param {MessageThreadDeleteArgs} args - Arguments to delete one MessageThread.
     * @example
     * // Delete one MessageThread
     * const MessageThread = await prisma.messageThread.delete({
     *   where: {
     *     // ... filter to delete one MessageThread
     *   }
     * })
     * 
     */
    delete<T extends MessageThreadDeleteArgs>(args: SelectSubset<T, MessageThreadDeleteArgs<ExtArgs>>): Prisma__MessageThreadClient<$Result.GetResult<Prisma.$MessageThreadPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one MessageThread.
     * @param {MessageThreadUpdateArgs} args - Arguments to update one MessageThread.
     * @example
     * // Update one MessageThread
     * const messageThread = await prisma.messageThread.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageThreadUpdateArgs>(args: SelectSubset<T, MessageThreadUpdateArgs<ExtArgs>>): Prisma__MessageThreadClient<$Result.GetResult<Prisma.$MessageThreadPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more MessageThreads.
     * @param {MessageThreadDeleteManyArgs} args - Arguments to filter MessageThreads to delete.
     * @example
     * // Delete a few MessageThreads
     * const { count } = await prisma.messageThread.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageThreadDeleteManyArgs>(args?: SelectSubset<T, MessageThreadDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MessageThreads.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageThreadUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MessageThreads
     * const messageThread = await prisma.messageThread.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageThreadUpdateManyArgs>(args: SelectSubset<T, MessageThreadUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one MessageThread.
     * @param {MessageThreadUpsertArgs} args - Arguments to update or create a MessageThread.
     * @example
     * // Update or create a MessageThread
     * const messageThread = await prisma.messageThread.upsert({
     *   create: {
     *     // ... data to create a MessageThread
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MessageThread we want to update
     *   }
     * })
     */
    upsert<T extends MessageThreadUpsertArgs>(args: SelectSubset<T, MessageThreadUpsertArgs<ExtArgs>>): Prisma__MessageThreadClient<$Result.GetResult<Prisma.$MessageThreadPayload<ExtArgs>, T, "upsert">, never, ExtArgs>

    /**
     * Find zero or more MessageThreads that matches the filter.
     * @param {MessageThreadFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const messageThread = await prisma.messageThread.findRaw({
     *   filter: { age: { $gt: 25 } } 
     * })
     */
    findRaw(args?: MessageThreadFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a MessageThread.
     * @param {MessageThreadAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const messageThread = await prisma.messageThread.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: MessageThreadAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of MessageThreads.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageThreadCountArgs} args - Arguments to filter MessageThreads to count.
     * @example
     * // Count the number of MessageThreads
     * const count = await prisma.messageThread.count({
     *   where: {
     *     // ... the filter for the MessageThreads we want to count
     *   }
     * })
    **/
    count<T extends MessageThreadCountArgs>(
      args?: Subset<T, MessageThreadCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageThreadCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MessageThread.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageThreadAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends MessageThreadAggregateArgs>(args: Subset<T, MessageThreadAggregateArgs>): Prisma.PrismaPromise<GetMessageThreadAggregateType<T>>

    /**
     * Group by MessageThread.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageThreadGroupByArgs} args - Group by arguments.
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
      T extends MessageThreadGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageThreadGroupByArgs['orderBy'] }
        : { orderBy?: MessageThreadGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, MessageThreadGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageThreadGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MessageThread model
   */
  readonly fields: MessageThreadFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MessageThread.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageThreadClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the MessageThread model
   */ 
  interface MessageThreadFieldRefs {
    readonly id: FieldRef<"MessageThread", 'String'>
    readonly companyId: FieldRef<"MessageThread", 'String'>
    readonly customerId: FieldRef<"MessageThread", 'String'>
    readonly customerName: FieldRef<"MessageThread", 'String'>
    readonly customerPhone: FieldRef<"MessageThread", 'String'>
    readonly customerEmail: FieldRef<"MessageThread", 'String'>
    readonly participantIds: FieldRef<"MessageThread", 'String[]'>
    readonly participantNames: FieldRef<"MessageThread", 'String[]'>
    readonly subject: FieldRef<"MessageThread", 'String'>
    readonly jobId: FieldRef<"MessageThread", 'String'>
    readonly status: FieldRef<"MessageThread", 'ThreadStatus'>
    readonly unreadCount: FieldRef<"MessageThread", 'Int'>
    readonly lastMessageAt: FieldRef<"MessageThread", 'DateTime'>
    readonly lastMessageBody: FieldRef<"MessageThread", 'String'>
    readonly createdAt: FieldRef<"MessageThread", 'DateTime'>
    readonly updatedAt: FieldRef<"MessageThread", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MessageThread findUnique
   */
  export type MessageThreadFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
    /**
     * Filter, which MessageThread to fetch.
     */
    where: MessageThreadWhereUniqueInput
  }

  /**
   * MessageThread findUniqueOrThrow
   */
  export type MessageThreadFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
    /**
     * Filter, which MessageThread to fetch.
     */
    where: MessageThreadWhereUniqueInput
  }

  /**
   * MessageThread findFirst
   */
  export type MessageThreadFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
    /**
     * Filter, which MessageThread to fetch.
     */
    where?: MessageThreadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MessageThreads to fetch.
     */
    orderBy?: MessageThreadOrderByWithRelationInput | MessageThreadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MessageThreads.
     */
    cursor?: MessageThreadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MessageThreads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MessageThreads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MessageThreads.
     */
    distinct?: MessageThreadScalarFieldEnum | MessageThreadScalarFieldEnum[]
  }

  /**
   * MessageThread findFirstOrThrow
   */
  export type MessageThreadFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
    /**
     * Filter, which MessageThread to fetch.
     */
    where?: MessageThreadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MessageThreads to fetch.
     */
    orderBy?: MessageThreadOrderByWithRelationInput | MessageThreadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MessageThreads.
     */
    cursor?: MessageThreadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MessageThreads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MessageThreads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MessageThreads.
     */
    distinct?: MessageThreadScalarFieldEnum | MessageThreadScalarFieldEnum[]
  }

  /**
   * MessageThread findMany
   */
  export type MessageThreadFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
    /**
     * Filter, which MessageThreads to fetch.
     */
    where?: MessageThreadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MessageThreads to fetch.
     */
    orderBy?: MessageThreadOrderByWithRelationInput | MessageThreadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MessageThreads.
     */
    cursor?: MessageThreadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MessageThreads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MessageThreads.
     */
    skip?: number
    distinct?: MessageThreadScalarFieldEnum | MessageThreadScalarFieldEnum[]
  }

  /**
   * MessageThread create
   */
  export type MessageThreadCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
    /**
     * The data needed to create a MessageThread.
     */
    data: XOR<MessageThreadCreateInput, MessageThreadUncheckedCreateInput>
  }

  /**
   * MessageThread createMany
   */
  export type MessageThreadCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MessageThreads.
     */
    data: MessageThreadCreateManyInput | MessageThreadCreateManyInput[]
  }

  /**
   * MessageThread update
   */
  export type MessageThreadUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
    /**
     * The data needed to update a MessageThread.
     */
    data: XOR<MessageThreadUpdateInput, MessageThreadUncheckedUpdateInput>
    /**
     * Choose, which MessageThread to update.
     */
    where: MessageThreadWhereUniqueInput
  }

  /**
   * MessageThread updateMany
   */
  export type MessageThreadUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MessageThreads.
     */
    data: XOR<MessageThreadUpdateManyMutationInput, MessageThreadUncheckedUpdateManyInput>
    /**
     * Filter which MessageThreads to update
     */
    where?: MessageThreadWhereInput
  }

  /**
   * MessageThread upsert
   */
  export type MessageThreadUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
    /**
     * The filter to search for the MessageThread to update in case it exists.
     */
    where: MessageThreadWhereUniqueInput
    /**
     * In case the MessageThread found by the `where` argument doesn't exist, create a new MessageThread with this data.
     */
    create: XOR<MessageThreadCreateInput, MessageThreadUncheckedCreateInput>
    /**
     * In case the MessageThread was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageThreadUpdateInput, MessageThreadUncheckedUpdateInput>
  }

  /**
   * MessageThread delete
   */
  export type MessageThreadDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
    /**
     * Filter which MessageThread to delete.
     */
    where: MessageThreadWhereUniqueInput
  }

  /**
   * MessageThread deleteMany
   */
  export type MessageThreadDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MessageThreads to delete
     */
    where?: MessageThreadWhereInput
  }

  /**
   * MessageThread findRaw
   */
  export type MessageThreadFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * MessageThread aggregateRaw
   */
  export type MessageThreadAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * MessageThread without action
   */
  export type MessageThreadDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageThread
     */
    select?: MessageThreadSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageThreadInclude<ExtArgs> | null
  }


  /**
   * Model NotificationTemplate
   */

  export type AggregateNotificationTemplate = {
    _count: NotificationTemplateCountAggregateOutputType | null
    _min: NotificationTemplateMinAggregateOutputType | null
    _max: NotificationTemplateMaxAggregateOutputType | null
  }

  export type NotificationTemplateMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    type: $Enums.TemplateType | null
    channel: $Enums.Channel | null
    subject: string | null
    body: string | null
    isActive: boolean | null
    isDefault: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NotificationTemplateMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    type: $Enums.TemplateType | null
    channel: $Enums.Channel | null
    subject: string | null
    body: string | null
    isActive: boolean | null
    isDefault: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NotificationTemplateCountAggregateOutputType = {
    id: number
    companyId: number
    name: number
    type: number
    channel: number
    subject: number
    body: number
    variables: number
    isActive: number
    isDefault: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type NotificationTemplateMinAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    type?: true
    channel?: true
    subject?: true
    body?: true
    isActive?: true
    isDefault?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NotificationTemplateMaxAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    type?: true
    channel?: true
    subject?: true
    body?: true
    isActive?: true
    isDefault?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NotificationTemplateCountAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    type?: true
    channel?: true
    subject?: true
    body?: true
    variables?: true
    isActive?: true
    isDefault?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type NotificationTemplateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationTemplate to aggregate.
     */
    where?: NotificationTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationTemplates to fetch.
     */
    orderBy?: NotificationTemplateOrderByWithRelationInput | NotificationTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned NotificationTemplates
    **/
    _count?: true | NotificationTemplateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationTemplateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationTemplateMaxAggregateInputType
  }

  export type GetNotificationTemplateAggregateType<T extends NotificationTemplateAggregateArgs> = {
        [P in keyof T & keyof AggregateNotificationTemplate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotificationTemplate[P]>
      : GetScalarType<T[P], AggregateNotificationTemplate[P]>
  }




  export type NotificationTemplateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationTemplateWhereInput
    orderBy?: NotificationTemplateOrderByWithAggregationInput | NotificationTemplateOrderByWithAggregationInput[]
    by: NotificationTemplateScalarFieldEnum[] | NotificationTemplateScalarFieldEnum
    having?: NotificationTemplateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationTemplateCountAggregateInputType | true
    _min?: NotificationTemplateMinAggregateInputType
    _max?: NotificationTemplateMaxAggregateInputType
  }

  export type NotificationTemplateGroupByOutputType = {
    id: string
    companyId: string
    name: string
    type: $Enums.TemplateType
    channel: $Enums.Channel
    subject: string | null
    body: string
    variables: string[]
    isActive: boolean
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
    _count: NotificationTemplateCountAggregateOutputType | null
    _min: NotificationTemplateMinAggregateOutputType | null
    _max: NotificationTemplateMaxAggregateOutputType | null
  }

  type GetNotificationTemplateGroupByPayload<T extends NotificationTemplateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationTemplateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationTemplateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationTemplateGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationTemplateGroupByOutputType[P]>
        }
      >
    >


  export type NotificationTemplateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    type?: boolean
    channel?: boolean
    subject?: boolean
    body?: boolean
    variables?: boolean
    isActive?: boolean
    isDefault?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["notificationTemplate"]>


  export type NotificationTemplateSelectScalar = {
    id?: boolean
    companyId?: boolean
    name?: boolean
    type?: boolean
    channel?: boolean
    subject?: boolean
    body?: boolean
    variables?: boolean
    isActive?: boolean
    isDefault?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $NotificationTemplatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "NotificationTemplate"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      name: string
      type: $Enums.TemplateType
      channel: $Enums.Channel
      subject: string | null
      body: string
      variables: string[]
      isActive: boolean
      isDefault: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["notificationTemplate"]>
    composites: {}
  }

  type NotificationTemplateGetPayload<S extends boolean | null | undefined | NotificationTemplateDefaultArgs> = $Result.GetResult<Prisma.$NotificationTemplatePayload, S>

  type NotificationTemplateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<NotificationTemplateFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: NotificationTemplateCountAggregateInputType | true
    }

  export interface NotificationTemplateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['NotificationTemplate'], meta: { name: 'NotificationTemplate' } }
    /**
     * Find zero or one NotificationTemplate that matches the filter.
     * @param {NotificationTemplateFindUniqueArgs} args - Arguments to find a NotificationTemplate
     * @example
     * // Get one NotificationTemplate
     * const notificationTemplate = await prisma.notificationTemplate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationTemplateFindUniqueArgs>(args: SelectSubset<T, NotificationTemplateFindUniqueArgs<ExtArgs>>): Prisma__NotificationTemplateClient<$Result.GetResult<Prisma.$NotificationTemplatePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one NotificationTemplate that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {NotificationTemplateFindUniqueOrThrowArgs} args - Arguments to find a NotificationTemplate
     * @example
     * // Get one NotificationTemplate
     * const notificationTemplate = await prisma.notificationTemplate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationTemplateFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationTemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationTemplateClient<$Result.GetResult<Prisma.$NotificationTemplatePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first NotificationTemplate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationTemplateFindFirstArgs} args - Arguments to find a NotificationTemplate
     * @example
     * // Get one NotificationTemplate
     * const notificationTemplate = await prisma.notificationTemplate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationTemplateFindFirstArgs>(args?: SelectSubset<T, NotificationTemplateFindFirstArgs<ExtArgs>>): Prisma__NotificationTemplateClient<$Result.GetResult<Prisma.$NotificationTemplatePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first NotificationTemplate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationTemplateFindFirstOrThrowArgs} args - Arguments to find a NotificationTemplate
     * @example
     * // Get one NotificationTemplate
     * const notificationTemplate = await prisma.notificationTemplate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationTemplateFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationTemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationTemplateClient<$Result.GetResult<Prisma.$NotificationTemplatePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more NotificationTemplates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationTemplateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NotificationTemplates
     * const notificationTemplates = await prisma.notificationTemplate.findMany()
     * 
     * // Get first 10 NotificationTemplates
     * const notificationTemplates = await prisma.notificationTemplate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationTemplateWithIdOnly = await prisma.notificationTemplate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationTemplateFindManyArgs>(args?: SelectSubset<T, NotificationTemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationTemplatePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a NotificationTemplate.
     * @param {NotificationTemplateCreateArgs} args - Arguments to create a NotificationTemplate.
     * @example
     * // Create one NotificationTemplate
     * const NotificationTemplate = await prisma.notificationTemplate.create({
     *   data: {
     *     // ... data to create a NotificationTemplate
     *   }
     * })
     * 
     */
    create<T extends NotificationTemplateCreateArgs>(args: SelectSubset<T, NotificationTemplateCreateArgs<ExtArgs>>): Prisma__NotificationTemplateClient<$Result.GetResult<Prisma.$NotificationTemplatePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many NotificationTemplates.
     * @param {NotificationTemplateCreateManyArgs} args - Arguments to create many NotificationTemplates.
     * @example
     * // Create many NotificationTemplates
     * const notificationTemplate = await prisma.notificationTemplate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationTemplateCreateManyArgs>(args?: SelectSubset<T, NotificationTemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a NotificationTemplate.
     * @param {NotificationTemplateDeleteArgs} args - Arguments to delete one NotificationTemplate.
     * @example
     * // Delete one NotificationTemplate
     * const NotificationTemplate = await prisma.notificationTemplate.delete({
     *   where: {
     *     // ... filter to delete one NotificationTemplate
     *   }
     * })
     * 
     */
    delete<T extends NotificationTemplateDeleteArgs>(args: SelectSubset<T, NotificationTemplateDeleteArgs<ExtArgs>>): Prisma__NotificationTemplateClient<$Result.GetResult<Prisma.$NotificationTemplatePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one NotificationTemplate.
     * @param {NotificationTemplateUpdateArgs} args - Arguments to update one NotificationTemplate.
     * @example
     * // Update one NotificationTemplate
     * const notificationTemplate = await prisma.notificationTemplate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationTemplateUpdateArgs>(args: SelectSubset<T, NotificationTemplateUpdateArgs<ExtArgs>>): Prisma__NotificationTemplateClient<$Result.GetResult<Prisma.$NotificationTemplatePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more NotificationTemplates.
     * @param {NotificationTemplateDeleteManyArgs} args - Arguments to filter NotificationTemplates to delete.
     * @example
     * // Delete a few NotificationTemplates
     * const { count } = await prisma.notificationTemplate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationTemplateDeleteManyArgs>(args?: SelectSubset<T, NotificationTemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NotificationTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationTemplateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NotificationTemplates
     * const notificationTemplate = await prisma.notificationTemplate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationTemplateUpdateManyArgs>(args: SelectSubset<T, NotificationTemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one NotificationTemplate.
     * @param {NotificationTemplateUpsertArgs} args - Arguments to update or create a NotificationTemplate.
     * @example
     * // Update or create a NotificationTemplate
     * const notificationTemplate = await prisma.notificationTemplate.upsert({
     *   create: {
     *     // ... data to create a NotificationTemplate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NotificationTemplate we want to update
     *   }
     * })
     */
    upsert<T extends NotificationTemplateUpsertArgs>(args: SelectSubset<T, NotificationTemplateUpsertArgs<ExtArgs>>): Prisma__NotificationTemplateClient<$Result.GetResult<Prisma.$NotificationTemplatePayload<ExtArgs>, T, "upsert">, never, ExtArgs>

    /**
     * Find zero or more NotificationTemplates that matches the filter.
     * @param {NotificationTemplateFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const notificationTemplate = await prisma.notificationTemplate.findRaw({
     *   filter: { age: { $gt: 25 } } 
     * })
     */
    findRaw(args?: NotificationTemplateFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a NotificationTemplate.
     * @param {NotificationTemplateAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const notificationTemplate = await prisma.notificationTemplate.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: NotificationTemplateAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of NotificationTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationTemplateCountArgs} args - Arguments to filter NotificationTemplates to count.
     * @example
     * // Count the number of NotificationTemplates
     * const count = await prisma.notificationTemplate.count({
     *   where: {
     *     // ... the filter for the NotificationTemplates we want to count
     *   }
     * })
    **/
    count<T extends NotificationTemplateCountArgs>(
      args?: Subset<T, NotificationTemplateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationTemplateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a NotificationTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationTemplateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends NotificationTemplateAggregateArgs>(args: Subset<T, NotificationTemplateAggregateArgs>): Prisma.PrismaPromise<GetNotificationTemplateAggregateType<T>>

    /**
     * Group by NotificationTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationTemplateGroupByArgs} args - Group by arguments.
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
      T extends NotificationTemplateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationTemplateGroupByArgs['orderBy'] }
        : { orderBy?: NotificationTemplateGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, NotificationTemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the NotificationTemplate model
   */
  readonly fields: NotificationTemplateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for NotificationTemplate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationTemplateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the NotificationTemplate model
   */ 
  interface NotificationTemplateFieldRefs {
    readonly id: FieldRef<"NotificationTemplate", 'String'>
    readonly companyId: FieldRef<"NotificationTemplate", 'String'>
    readonly name: FieldRef<"NotificationTemplate", 'String'>
    readonly type: FieldRef<"NotificationTemplate", 'TemplateType'>
    readonly channel: FieldRef<"NotificationTemplate", 'Channel'>
    readonly subject: FieldRef<"NotificationTemplate", 'String'>
    readonly body: FieldRef<"NotificationTemplate", 'String'>
    readonly variables: FieldRef<"NotificationTemplate", 'String[]'>
    readonly isActive: FieldRef<"NotificationTemplate", 'Boolean'>
    readonly isDefault: FieldRef<"NotificationTemplate", 'Boolean'>
    readonly createdAt: FieldRef<"NotificationTemplate", 'DateTime'>
    readonly updatedAt: FieldRef<"NotificationTemplate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * NotificationTemplate findUnique
   */
  export type NotificationTemplateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
    /**
     * Filter, which NotificationTemplate to fetch.
     */
    where: NotificationTemplateWhereUniqueInput
  }

  /**
   * NotificationTemplate findUniqueOrThrow
   */
  export type NotificationTemplateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
    /**
     * Filter, which NotificationTemplate to fetch.
     */
    where: NotificationTemplateWhereUniqueInput
  }

  /**
   * NotificationTemplate findFirst
   */
  export type NotificationTemplateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
    /**
     * Filter, which NotificationTemplate to fetch.
     */
    where?: NotificationTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationTemplates to fetch.
     */
    orderBy?: NotificationTemplateOrderByWithRelationInput | NotificationTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NotificationTemplates.
     */
    cursor?: NotificationTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NotificationTemplates.
     */
    distinct?: NotificationTemplateScalarFieldEnum | NotificationTemplateScalarFieldEnum[]
  }

  /**
   * NotificationTemplate findFirstOrThrow
   */
  export type NotificationTemplateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
    /**
     * Filter, which NotificationTemplate to fetch.
     */
    where?: NotificationTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationTemplates to fetch.
     */
    orderBy?: NotificationTemplateOrderByWithRelationInput | NotificationTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NotificationTemplates.
     */
    cursor?: NotificationTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NotificationTemplates.
     */
    distinct?: NotificationTemplateScalarFieldEnum | NotificationTemplateScalarFieldEnum[]
  }

  /**
   * NotificationTemplate findMany
   */
  export type NotificationTemplateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
    /**
     * Filter, which NotificationTemplates to fetch.
     */
    where?: NotificationTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationTemplates to fetch.
     */
    orderBy?: NotificationTemplateOrderByWithRelationInput | NotificationTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing NotificationTemplates.
     */
    cursor?: NotificationTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationTemplates.
     */
    skip?: number
    distinct?: NotificationTemplateScalarFieldEnum | NotificationTemplateScalarFieldEnum[]
  }

  /**
   * NotificationTemplate create
   */
  export type NotificationTemplateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
    /**
     * The data needed to create a NotificationTemplate.
     */
    data: XOR<NotificationTemplateCreateInput, NotificationTemplateUncheckedCreateInput>
  }

  /**
   * NotificationTemplate createMany
   */
  export type NotificationTemplateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many NotificationTemplates.
     */
    data: NotificationTemplateCreateManyInput | NotificationTemplateCreateManyInput[]
  }

  /**
   * NotificationTemplate update
   */
  export type NotificationTemplateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
    /**
     * The data needed to update a NotificationTemplate.
     */
    data: XOR<NotificationTemplateUpdateInput, NotificationTemplateUncheckedUpdateInput>
    /**
     * Choose, which NotificationTemplate to update.
     */
    where: NotificationTemplateWhereUniqueInput
  }

  /**
   * NotificationTemplate updateMany
   */
  export type NotificationTemplateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update NotificationTemplates.
     */
    data: XOR<NotificationTemplateUpdateManyMutationInput, NotificationTemplateUncheckedUpdateManyInput>
    /**
     * Filter which NotificationTemplates to update
     */
    where?: NotificationTemplateWhereInput
  }

  /**
   * NotificationTemplate upsert
   */
  export type NotificationTemplateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
    /**
     * The filter to search for the NotificationTemplate to update in case it exists.
     */
    where: NotificationTemplateWhereUniqueInput
    /**
     * In case the NotificationTemplate found by the `where` argument doesn't exist, create a new NotificationTemplate with this data.
     */
    create: XOR<NotificationTemplateCreateInput, NotificationTemplateUncheckedCreateInput>
    /**
     * In case the NotificationTemplate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationTemplateUpdateInput, NotificationTemplateUncheckedUpdateInput>
  }

  /**
   * NotificationTemplate delete
   */
  export type NotificationTemplateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
    /**
     * Filter which NotificationTemplate to delete.
     */
    where: NotificationTemplateWhereUniqueInput
  }

  /**
   * NotificationTemplate deleteMany
   */
  export type NotificationTemplateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationTemplates to delete
     */
    where?: NotificationTemplateWhereInput
  }

  /**
   * NotificationTemplate findRaw
   */
  export type NotificationTemplateFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * NotificationTemplate aggregateRaw
   */
  export type NotificationTemplateAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * NotificationTemplate without action
   */
  export type NotificationTemplateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationTemplate
     */
    select?: NotificationTemplateSelect<ExtArgs> | null
  }


  /**
   * Model AutomationRule
   */

  export type AggregateAutomationRule = {
    _count: AutomationRuleCountAggregateOutputType | null
    _avg: AutomationRuleAvgAggregateOutputType | null
    _sum: AutomationRuleSumAggregateOutputType | null
    _min: AutomationRuleMinAggregateOutputType | null
    _max: AutomationRuleMaxAggregateOutputType | null
  }

  export type AutomationRuleAvgAggregateOutputType = {
    delayMinutes: number | null
  }

  export type AutomationRuleSumAggregateOutputType = {
    delayMinutes: number | null
  }

  export type AutomationRuleMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    isActive: boolean | null
    trigger: $Enums.AutomationTrigger | null
    conditions: string | null
    actions: string | null
    delayMinutes: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AutomationRuleMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    isActive: boolean | null
    trigger: $Enums.AutomationTrigger | null
    conditions: string | null
    actions: string | null
    delayMinutes: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AutomationRuleCountAggregateOutputType = {
    id: number
    companyId: number
    name: number
    isActive: number
    trigger: number
    conditions: number
    actions: number
    delayMinutes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AutomationRuleAvgAggregateInputType = {
    delayMinutes?: true
  }

  export type AutomationRuleSumAggregateInputType = {
    delayMinutes?: true
  }

  export type AutomationRuleMinAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    isActive?: true
    trigger?: true
    conditions?: true
    actions?: true
    delayMinutes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AutomationRuleMaxAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    isActive?: true
    trigger?: true
    conditions?: true
    actions?: true
    delayMinutes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AutomationRuleCountAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    isActive?: true
    trigger?: true
    conditions?: true
    actions?: true
    delayMinutes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AutomationRuleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AutomationRule to aggregate.
     */
    where?: AutomationRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AutomationRules to fetch.
     */
    orderBy?: AutomationRuleOrderByWithRelationInput | AutomationRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AutomationRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AutomationRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AutomationRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AutomationRules
    **/
    _count?: true | AutomationRuleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AutomationRuleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AutomationRuleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AutomationRuleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AutomationRuleMaxAggregateInputType
  }

  export type GetAutomationRuleAggregateType<T extends AutomationRuleAggregateArgs> = {
        [P in keyof T & keyof AggregateAutomationRule]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAutomationRule[P]>
      : GetScalarType<T[P], AggregateAutomationRule[P]>
  }




  export type AutomationRuleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AutomationRuleWhereInput
    orderBy?: AutomationRuleOrderByWithAggregationInput | AutomationRuleOrderByWithAggregationInput[]
    by: AutomationRuleScalarFieldEnum[] | AutomationRuleScalarFieldEnum
    having?: AutomationRuleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AutomationRuleCountAggregateInputType | true
    _avg?: AutomationRuleAvgAggregateInputType
    _sum?: AutomationRuleSumAggregateInputType
    _min?: AutomationRuleMinAggregateInputType
    _max?: AutomationRuleMaxAggregateInputType
  }

  export type AutomationRuleGroupByOutputType = {
    id: string
    companyId: string
    name: string
    isActive: boolean
    trigger: $Enums.AutomationTrigger
    conditions: string
    actions: string
    delayMinutes: number
    createdAt: Date
    updatedAt: Date
    _count: AutomationRuleCountAggregateOutputType | null
    _avg: AutomationRuleAvgAggregateOutputType | null
    _sum: AutomationRuleSumAggregateOutputType | null
    _min: AutomationRuleMinAggregateOutputType | null
    _max: AutomationRuleMaxAggregateOutputType | null
  }

  type GetAutomationRuleGroupByPayload<T extends AutomationRuleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AutomationRuleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AutomationRuleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AutomationRuleGroupByOutputType[P]>
            : GetScalarType<T[P], AutomationRuleGroupByOutputType[P]>
        }
      >
    >


  export type AutomationRuleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    isActive?: boolean
    trigger?: boolean
    conditions?: boolean
    actions?: boolean
    delayMinutes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["automationRule"]>


  export type AutomationRuleSelectScalar = {
    id?: boolean
    companyId?: boolean
    name?: boolean
    isActive?: boolean
    trigger?: boolean
    conditions?: boolean
    actions?: boolean
    delayMinutes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $AutomationRulePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AutomationRule"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      name: string
      isActive: boolean
      trigger: $Enums.AutomationTrigger
      conditions: string
      actions: string
      delayMinutes: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["automationRule"]>
    composites: {}
  }

  type AutomationRuleGetPayload<S extends boolean | null | undefined | AutomationRuleDefaultArgs> = $Result.GetResult<Prisma.$AutomationRulePayload, S>

  type AutomationRuleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AutomationRuleFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AutomationRuleCountAggregateInputType | true
    }

  export interface AutomationRuleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AutomationRule'], meta: { name: 'AutomationRule' } }
    /**
     * Find zero or one AutomationRule that matches the filter.
     * @param {AutomationRuleFindUniqueArgs} args - Arguments to find a AutomationRule
     * @example
     * // Get one AutomationRule
     * const automationRule = await prisma.automationRule.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AutomationRuleFindUniqueArgs>(args: SelectSubset<T, AutomationRuleFindUniqueArgs<ExtArgs>>): Prisma__AutomationRuleClient<$Result.GetResult<Prisma.$AutomationRulePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one AutomationRule that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AutomationRuleFindUniqueOrThrowArgs} args - Arguments to find a AutomationRule
     * @example
     * // Get one AutomationRule
     * const automationRule = await prisma.automationRule.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AutomationRuleFindUniqueOrThrowArgs>(args: SelectSubset<T, AutomationRuleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AutomationRuleClient<$Result.GetResult<Prisma.$AutomationRulePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first AutomationRule that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AutomationRuleFindFirstArgs} args - Arguments to find a AutomationRule
     * @example
     * // Get one AutomationRule
     * const automationRule = await prisma.automationRule.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AutomationRuleFindFirstArgs>(args?: SelectSubset<T, AutomationRuleFindFirstArgs<ExtArgs>>): Prisma__AutomationRuleClient<$Result.GetResult<Prisma.$AutomationRulePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first AutomationRule that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AutomationRuleFindFirstOrThrowArgs} args - Arguments to find a AutomationRule
     * @example
     * // Get one AutomationRule
     * const automationRule = await prisma.automationRule.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AutomationRuleFindFirstOrThrowArgs>(args?: SelectSubset<T, AutomationRuleFindFirstOrThrowArgs<ExtArgs>>): Prisma__AutomationRuleClient<$Result.GetResult<Prisma.$AutomationRulePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more AutomationRules that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AutomationRuleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AutomationRules
     * const automationRules = await prisma.automationRule.findMany()
     * 
     * // Get first 10 AutomationRules
     * const automationRules = await prisma.automationRule.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const automationRuleWithIdOnly = await prisma.automationRule.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AutomationRuleFindManyArgs>(args?: SelectSubset<T, AutomationRuleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AutomationRulePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a AutomationRule.
     * @param {AutomationRuleCreateArgs} args - Arguments to create a AutomationRule.
     * @example
     * // Create one AutomationRule
     * const AutomationRule = await prisma.automationRule.create({
     *   data: {
     *     // ... data to create a AutomationRule
     *   }
     * })
     * 
     */
    create<T extends AutomationRuleCreateArgs>(args: SelectSubset<T, AutomationRuleCreateArgs<ExtArgs>>): Prisma__AutomationRuleClient<$Result.GetResult<Prisma.$AutomationRulePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many AutomationRules.
     * @param {AutomationRuleCreateManyArgs} args - Arguments to create many AutomationRules.
     * @example
     * // Create many AutomationRules
     * const automationRule = await prisma.automationRule.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AutomationRuleCreateManyArgs>(args?: SelectSubset<T, AutomationRuleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a AutomationRule.
     * @param {AutomationRuleDeleteArgs} args - Arguments to delete one AutomationRule.
     * @example
     * // Delete one AutomationRule
     * const AutomationRule = await prisma.automationRule.delete({
     *   where: {
     *     // ... filter to delete one AutomationRule
     *   }
     * })
     * 
     */
    delete<T extends AutomationRuleDeleteArgs>(args: SelectSubset<T, AutomationRuleDeleteArgs<ExtArgs>>): Prisma__AutomationRuleClient<$Result.GetResult<Prisma.$AutomationRulePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one AutomationRule.
     * @param {AutomationRuleUpdateArgs} args - Arguments to update one AutomationRule.
     * @example
     * // Update one AutomationRule
     * const automationRule = await prisma.automationRule.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AutomationRuleUpdateArgs>(args: SelectSubset<T, AutomationRuleUpdateArgs<ExtArgs>>): Prisma__AutomationRuleClient<$Result.GetResult<Prisma.$AutomationRulePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more AutomationRules.
     * @param {AutomationRuleDeleteManyArgs} args - Arguments to filter AutomationRules to delete.
     * @example
     * // Delete a few AutomationRules
     * const { count } = await prisma.automationRule.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AutomationRuleDeleteManyArgs>(args?: SelectSubset<T, AutomationRuleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AutomationRules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AutomationRuleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AutomationRules
     * const automationRule = await prisma.automationRule.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AutomationRuleUpdateManyArgs>(args: SelectSubset<T, AutomationRuleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one AutomationRule.
     * @param {AutomationRuleUpsertArgs} args - Arguments to update or create a AutomationRule.
     * @example
     * // Update or create a AutomationRule
     * const automationRule = await prisma.automationRule.upsert({
     *   create: {
     *     // ... data to create a AutomationRule
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AutomationRule we want to update
     *   }
     * })
     */
    upsert<T extends AutomationRuleUpsertArgs>(args: SelectSubset<T, AutomationRuleUpsertArgs<ExtArgs>>): Prisma__AutomationRuleClient<$Result.GetResult<Prisma.$AutomationRulePayload<ExtArgs>, T, "upsert">, never, ExtArgs>

    /**
     * Find zero or more AutomationRules that matches the filter.
     * @param {AutomationRuleFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const automationRule = await prisma.automationRule.findRaw({
     *   filter: { age: { $gt: 25 } } 
     * })
     */
    findRaw(args?: AutomationRuleFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a AutomationRule.
     * @param {AutomationRuleAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const automationRule = await prisma.automationRule.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: AutomationRuleAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of AutomationRules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AutomationRuleCountArgs} args - Arguments to filter AutomationRules to count.
     * @example
     * // Count the number of AutomationRules
     * const count = await prisma.automationRule.count({
     *   where: {
     *     // ... the filter for the AutomationRules we want to count
     *   }
     * })
    **/
    count<T extends AutomationRuleCountArgs>(
      args?: Subset<T, AutomationRuleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AutomationRuleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AutomationRule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AutomationRuleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends AutomationRuleAggregateArgs>(args: Subset<T, AutomationRuleAggregateArgs>): Prisma.PrismaPromise<GetAutomationRuleAggregateType<T>>

    /**
     * Group by AutomationRule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AutomationRuleGroupByArgs} args - Group by arguments.
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
      T extends AutomationRuleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AutomationRuleGroupByArgs['orderBy'] }
        : { orderBy?: AutomationRuleGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, AutomationRuleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAutomationRuleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AutomationRule model
   */
  readonly fields: AutomationRuleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AutomationRule.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AutomationRuleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the AutomationRule model
   */ 
  interface AutomationRuleFieldRefs {
    readonly id: FieldRef<"AutomationRule", 'String'>
    readonly companyId: FieldRef<"AutomationRule", 'String'>
    readonly name: FieldRef<"AutomationRule", 'String'>
    readonly isActive: FieldRef<"AutomationRule", 'Boolean'>
    readonly trigger: FieldRef<"AutomationRule", 'AutomationTrigger'>
    readonly conditions: FieldRef<"AutomationRule", 'String'>
    readonly actions: FieldRef<"AutomationRule", 'String'>
    readonly delayMinutes: FieldRef<"AutomationRule", 'Int'>
    readonly createdAt: FieldRef<"AutomationRule", 'DateTime'>
    readonly updatedAt: FieldRef<"AutomationRule", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AutomationRule findUnique
   */
  export type AutomationRuleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
    /**
     * Filter, which AutomationRule to fetch.
     */
    where: AutomationRuleWhereUniqueInput
  }

  /**
   * AutomationRule findUniqueOrThrow
   */
  export type AutomationRuleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
    /**
     * Filter, which AutomationRule to fetch.
     */
    where: AutomationRuleWhereUniqueInput
  }

  /**
   * AutomationRule findFirst
   */
  export type AutomationRuleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
    /**
     * Filter, which AutomationRule to fetch.
     */
    where?: AutomationRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AutomationRules to fetch.
     */
    orderBy?: AutomationRuleOrderByWithRelationInput | AutomationRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AutomationRules.
     */
    cursor?: AutomationRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AutomationRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AutomationRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AutomationRules.
     */
    distinct?: AutomationRuleScalarFieldEnum | AutomationRuleScalarFieldEnum[]
  }

  /**
   * AutomationRule findFirstOrThrow
   */
  export type AutomationRuleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
    /**
     * Filter, which AutomationRule to fetch.
     */
    where?: AutomationRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AutomationRules to fetch.
     */
    orderBy?: AutomationRuleOrderByWithRelationInput | AutomationRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AutomationRules.
     */
    cursor?: AutomationRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AutomationRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AutomationRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AutomationRules.
     */
    distinct?: AutomationRuleScalarFieldEnum | AutomationRuleScalarFieldEnum[]
  }

  /**
   * AutomationRule findMany
   */
  export type AutomationRuleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
    /**
     * Filter, which AutomationRules to fetch.
     */
    where?: AutomationRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AutomationRules to fetch.
     */
    orderBy?: AutomationRuleOrderByWithRelationInput | AutomationRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AutomationRules.
     */
    cursor?: AutomationRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AutomationRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AutomationRules.
     */
    skip?: number
    distinct?: AutomationRuleScalarFieldEnum | AutomationRuleScalarFieldEnum[]
  }

  /**
   * AutomationRule create
   */
  export type AutomationRuleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
    /**
     * The data needed to create a AutomationRule.
     */
    data: XOR<AutomationRuleCreateInput, AutomationRuleUncheckedCreateInput>
  }

  /**
   * AutomationRule createMany
   */
  export type AutomationRuleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AutomationRules.
     */
    data: AutomationRuleCreateManyInput | AutomationRuleCreateManyInput[]
  }

  /**
   * AutomationRule update
   */
  export type AutomationRuleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
    /**
     * The data needed to update a AutomationRule.
     */
    data: XOR<AutomationRuleUpdateInput, AutomationRuleUncheckedUpdateInput>
    /**
     * Choose, which AutomationRule to update.
     */
    where: AutomationRuleWhereUniqueInput
  }

  /**
   * AutomationRule updateMany
   */
  export type AutomationRuleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AutomationRules.
     */
    data: XOR<AutomationRuleUpdateManyMutationInput, AutomationRuleUncheckedUpdateManyInput>
    /**
     * Filter which AutomationRules to update
     */
    where?: AutomationRuleWhereInput
  }

  /**
   * AutomationRule upsert
   */
  export type AutomationRuleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
    /**
     * The filter to search for the AutomationRule to update in case it exists.
     */
    where: AutomationRuleWhereUniqueInput
    /**
     * In case the AutomationRule found by the `where` argument doesn't exist, create a new AutomationRule with this data.
     */
    create: XOR<AutomationRuleCreateInput, AutomationRuleUncheckedCreateInput>
    /**
     * In case the AutomationRule was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AutomationRuleUpdateInput, AutomationRuleUncheckedUpdateInput>
  }

  /**
   * AutomationRule delete
   */
  export type AutomationRuleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
    /**
     * Filter which AutomationRule to delete.
     */
    where: AutomationRuleWhereUniqueInput
  }

  /**
   * AutomationRule deleteMany
   */
  export type AutomationRuleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AutomationRules to delete
     */
    where?: AutomationRuleWhereInput
  }

  /**
   * AutomationRule findRaw
   */
  export type AutomationRuleFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * AutomationRule aggregateRaw
   */
  export type AutomationRuleAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * AutomationRule without action
   */
  export type AutomationRuleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AutomationRule
     */
    select?: AutomationRuleSelect<ExtArgs> | null
  }


  /**
   * Model DeliveryLog
   */

  export type AggregateDeliveryLog = {
    _count: DeliveryLogCountAggregateOutputType | null
    _avg: DeliveryLogAvgAggregateOutputType | null
    _sum: DeliveryLogSumAggregateOutputType | null
    _min: DeliveryLogMinAggregateOutputType | null
    _max: DeliveryLogMaxAggregateOutputType | null
  }

  export type DeliveryLogAvgAggregateOutputType = {
    durationMs: number | null
  }

  export type DeliveryLogSumAggregateOutputType = {
    durationMs: number | null
  }

  export type DeliveryLogMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    notificationId: string | null
    channel: $Enums.Channel | null
    recipient: string | null
    status: $Enums.DeliveryStatus | null
    provider: string | null
    externalId: string | null
    requestPayload: string | null
    responsePayload: string | null
    durationMs: number | null
    error: string | null
    createdAt: Date | null
  }

  export type DeliveryLogMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    notificationId: string | null
    channel: $Enums.Channel | null
    recipient: string | null
    status: $Enums.DeliveryStatus | null
    provider: string | null
    externalId: string | null
    requestPayload: string | null
    responsePayload: string | null
    durationMs: number | null
    error: string | null
    createdAt: Date | null
  }

  export type DeliveryLogCountAggregateOutputType = {
    id: number
    companyId: number
    notificationId: number
    channel: number
    recipient: number
    status: number
    provider: number
    externalId: number
    requestPayload: number
    responsePayload: number
    durationMs: number
    error: number
    createdAt: number
    _all: number
  }


  export type DeliveryLogAvgAggregateInputType = {
    durationMs?: true
  }

  export type DeliveryLogSumAggregateInputType = {
    durationMs?: true
  }

  export type DeliveryLogMinAggregateInputType = {
    id?: true
    companyId?: true
    notificationId?: true
    channel?: true
    recipient?: true
    status?: true
    provider?: true
    externalId?: true
    requestPayload?: true
    responsePayload?: true
    durationMs?: true
    error?: true
    createdAt?: true
  }

  export type DeliveryLogMaxAggregateInputType = {
    id?: true
    companyId?: true
    notificationId?: true
    channel?: true
    recipient?: true
    status?: true
    provider?: true
    externalId?: true
    requestPayload?: true
    responsePayload?: true
    durationMs?: true
    error?: true
    createdAt?: true
  }

  export type DeliveryLogCountAggregateInputType = {
    id?: true
    companyId?: true
    notificationId?: true
    channel?: true
    recipient?: true
    status?: true
    provider?: true
    externalId?: true
    requestPayload?: true
    responsePayload?: true
    durationMs?: true
    error?: true
    createdAt?: true
    _all?: true
  }

  export type DeliveryLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DeliveryLog to aggregate.
     */
    where?: DeliveryLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeliveryLogs to fetch.
     */
    orderBy?: DeliveryLogOrderByWithRelationInput | DeliveryLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DeliveryLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeliveryLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeliveryLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DeliveryLogs
    **/
    _count?: true | DeliveryLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DeliveryLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DeliveryLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DeliveryLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DeliveryLogMaxAggregateInputType
  }

  export type GetDeliveryLogAggregateType<T extends DeliveryLogAggregateArgs> = {
        [P in keyof T & keyof AggregateDeliveryLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDeliveryLog[P]>
      : GetScalarType<T[P], AggregateDeliveryLog[P]>
  }




  export type DeliveryLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DeliveryLogWhereInput
    orderBy?: DeliveryLogOrderByWithAggregationInput | DeliveryLogOrderByWithAggregationInput[]
    by: DeliveryLogScalarFieldEnum[] | DeliveryLogScalarFieldEnum
    having?: DeliveryLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DeliveryLogCountAggregateInputType | true
    _avg?: DeliveryLogAvgAggregateInputType
    _sum?: DeliveryLogSumAggregateInputType
    _min?: DeliveryLogMinAggregateInputType
    _max?: DeliveryLogMaxAggregateInputType
  }

  export type DeliveryLogGroupByOutputType = {
    id: string
    companyId: string
    notificationId: string | null
    channel: $Enums.Channel
    recipient: string
    status: $Enums.DeliveryStatus
    provider: string
    externalId: string | null
    requestPayload: string | null
    responsePayload: string | null
    durationMs: number | null
    error: string | null
    createdAt: Date
    _count: DeliveryLogCountAggregateOutputType | null
    _avg: DeliveryLogAvgAggregateOutputType | null
    _sum: DeliveryLogSumAggregateOutputType | null
    _min: DeliveryLogMinAggregateOutputType | null
    _max: DeliveryLogMaxAggregateOutputType | null
  }

  type GetDeliveryLogGroupByPayload<T extends DeliveryLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DeliveryLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DeliveryLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DeliveryLogGroupByOutputType[P]>
            : GetScalarType<T[P], DeliveryLogGroupByOutputType[P]>
        }
      >
    >


  export type DeliveryLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    notificationId?: boolean
    channel?: boolean
    recipient?: boolean
    status?: boolean
    provider?: boolean
    externalId?: boolean
    requestPayload?: boolean
    responsePayload?: boolean
    durationMs?: boolean
    error?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["deliveryLog"]>


  export type DeliveryLogSelectScalar = {
    id?: boolean
    companyId?: boolean
    notificationId?: boolean
    channel?: boolean
    recipient?: boolean
    status?: boolean
    provider?: boolean
    externalId?: boolean
    requestPayload?: boolean
    responsePayload?: boolean
    durationMs?: boolean
    error?: boolean
    createdAt?: boolean
  }


  export type $DeliveryLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DeliveryLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      notificationId: string | null
      channel: $Enums.Channel
      recipient: string
      status: $Enums.DeliveryStatus
      provider: string
      externalId: string | null
      requestPayload: string | null
      responsePayload: string | null
      durationMs: number | null
      error: string | null
      createdAt: Date
    }, ExtArgs["result"]["deliveryLog"]>
    composites: {}
  }

  type DeliveryLogGetPayload<S extends boolean | null | undefined | DeliveryLogDefaultArgs> = $Result.GetResult<Prisma.$DeliveryLogPayload, S>

  type DeliveryLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<DeliveryLogFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: DeliveryLogCountAggregateInputType | true
    }

  export interface DeliveryLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DeliveryLog'], meta: { name: 'DeliveryLog' } }
    /**
     * Find zero or one DeliveryLog that matches the filter.
     * @param {DeliveryLogFindUniqueArgs} args - Arguments to find a DeliveryLog
     * @example
     * // Get one DeliveryLog
     * const deliveryLog = await prisma.deliveryLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DeliveryLogFindUniqueArgs>(args: SelectSubset<T, DeliveryLogFindUniqueArgs<ExtArgs>>): Prisma__DeliveryLogClient<$Result.GetResult<Prisma.$DeliveryLogPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one DeliveryLog that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {DeliveryLogFindUniqueOrThrowArgs} args - Arguments to find a DeliveryLog
     * @example
     * // Get one DeliveryLog
     * const deliveryLog = await prisma.deliveryLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DeliveryLogFindUniqueOrThrowArgs>(args: SelectSubset<T, DeliveryLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DeliveryLogClient<$Result.GetResult<Prisma.$DeliveryLogPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first DeliveryLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryLogFindFirstArgs} args - Arguments to find a DeliveryLog
     * @example
     * // Get one DeliveryLog
     * const deliveryLog = await prisma.deliveryLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DeliveryLogFindFirstArgs>(args?: SelectSubset<T, DeliveryLogFindFirstArgs<ExtArgs>>): Prisma__DeliveryLogClient<$Result.GetResult<Prisma.$DeliveryLogPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first DeliveryLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryLogFindFirstOrThrowArgs} args - Arguments to find a DeliveryLog
     * @example
     * // Get one DeliveryLog
     * const deliveryLog = await prisma.deliveryLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DeliveryLogFindFirstOrThrowArgs>(args?: SelectSubset<T, DeliveryLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__DeliveryLogClient<$Result.GetResult<Prisma.$DeliveryLogPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more DeliveryLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DeliveryLogs
     * const deliveryLogs = await prisma.deliveryLog.findMany()
     * 
     * // Get first 10 DeliveryLogs
     * const deliveryLogs = await prisma.deliveryLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const deliveryLogWithIdOnly = await prisma.deliveryLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DeliveryLogFindManyArgs>(args?: SelectSubset<T, DeliveryLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeliveryLogPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a DeliveryLog.
     * @param {DeliveryLogCreateArgs} args - Arguments to create a DeliveryLog.
     * @example
     * // Create one DeliveryLog
     * const DeliveryLog = await prisma.deliveryLog.create({
     *   data: {
     *     // ... data to create a DeliveryLog
     *   }
     * })
     * 
     */
    create<T extends DeliveryLogCreateArgs>(args: SelectSubset<T, DeliveryLogCreateArgs<ExtArgs>>): Prisma__DeliveryLogClient<$Result.GetResult<Prisma.$DeliveryLogPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many DeliveryLogs.
     * @param {DeliveryLogCreateManyArgs} args - Arguments to create many DeliveryLogs.
     * @example
     * // Create many DeliveryLogs
     * const deliveryLog = await prisma.deliveryLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DeliveryLogCreateManyArgs>(args?: SelectSubset<T, DeliveryLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a DeliveryLog.
     * @param {DeliveryLogDeleteArgs} args - Arguments to delete one DeliveryLog.
     * @example
     * // Delete one DeliveryLog
     * const DeliveryLog = await prisma.deliveryLog.delete({
     *   where: {
     *     // ... filter to delete one DeliveryLog
     *   }
     * })
     * 
     */
    delete<T extends DeliveryLogDeleteArgs>(args: SelectSubset<T, DeliveryLogDeleteArgs<ExtArgs>>): Prisma__DeliveryLogClient<$Result.GetResult<Prisma.$DeliveryLogPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one DeliveryLog.
     * @param {DeliveryLogUpdateArgs} args - Arguments to update one DeliveryLog.
     * @example
     * // Update one DeliveryLog
     * const deliveryLog = await prisma.deliveryLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DeliveryLogUpdateArgs>(args: SelectSubset<T, DeliveryLogUpdateArgs<ExtArgs>>): Prisma__DeliveryLogClient<$Result.GetResult<Prisma.$DeliveryLogPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more DeliveryLogs.
     * @param {DeliveryLogDeleteManyArgs} args - Arguments to filter DeliveryLogs to delete.
     * @example
     * // Delete a few DeliveryLogs
     * const { count } = await prisma.deliveryLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DeliveryLogDeleteManyArgs>(args?: SelectSubset<T, DeliveryLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DeliveryLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DeliveryLogs
     * const deliveryLog = await prisma.deliveryLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DeliveryLogUpdateManyArgs>(args: SelectSubset<T, DeliveryLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one DeliveryLog.
     * @param {DeliveryLogUpsertArgs} args - Arguments to update or create a DeliveryLog.
     * @example
     * // Update or create a DeliveryLog
     * const deliveryLog = await prisma.deliveryLog.upsert({
     *   create: {
     *     // ... data to create a DeliveryLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DeliveryLog we want to update
     *   }
     * })
     */
    upsert<T extends DeliveryLogUpsertArgs>(args: SelectSubset<T, DeliveryLogUpsertArgs<ExtArgs>>): Prisma__DeliveryLogClient<$Result.GetResult<Prisma.$DeliveryLogPayload<ExtArgs>, T, "upsert">, never, ExtArgs>

    /**
     * Find zero or more DeliveryLogs that matches the filter.
     * @param {DeliveryLogFindRawArgs} args - Select which filters you would like to apply.
     * @example
     * const deliveryLog = await prisma.deliveryLog.findRaw({
     *   filter: { age: { $gt: 25 } } 
     * })
     */
    findRaw(args?: DeliveryLogFindRawArgs): Prisma.PrismaPromise<JsonObject>

    /**
     * Perform aggregation operations on a DeliveryLog.
     * @param {DeliveryLogAggregateRawArgs} args - Select which aggregations you would like to apply.
     * @example
     * const deliveryLog = await prisma.deliveryLog.aggregateRaw({
     *   pipeline: [
     *     { $match: { status: "registered" } },
     *     { $group: { _id: "$country", total: { $sum: 1 } } }
     *   ]
     * })
     */
    aggregateRaw(args?: DeliveryLogAggregateRawArgs): Prisma.PrismaPromise<JsonObject>


    /**
     * Count the number of DeliveryLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryLogCountArgs} args - Arguments to filter DeliveryLogs to count.
     * @example
     * // Count the number of DeliveryLogs
     * const count = await prisma.deliveryLog.count({
     *   where: {
     *     // ... the filter for the DeliveryLogs we want to count
     *   }
     * })
    **/
    count<T extends DeliveryLogCountArgs>(
      args?: Subset<T, DeliveryLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DeliveryLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DeliveryLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends DeliveryLogAggregateArgs>(args: Subset<T, DeliveryLogAggregateArgs>): Prisma.PrismaPromise<GetDeliveryLogAggregateType<T>>

    /**
     * Group by DeliveryLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryLogGroupByArgs} args - Group by arguments.
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
      T extends DeliveryLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DeliveryLogGroupByArgs['orderBy'] }
        : { orderBy?: DeliveryLogGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, DeliveryLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDeliveryLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DeliveryLog model
   */
  readonly fields: DeliveryLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DeliveryLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DeliveryLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the DeliveryLog model
   */ 
  interface DeliveryLogFieldRefs {
    readonly id: FieldRef<"DeliveryLog", 'String'>
    readonly companyId: FieldRef<"DeliveryLog", 'String'>
    readonly notificationId: FieldRef<"DeliveryLog", 'String'>
    readonly channel: FieldRef<"DeliveryLog", 'Channel'>
    readonly recipient: FieldRef<"DeliveryLog", 'String'>
    readonly status: FieldRef<"DeliveryLog", 'DeliveryStatus'>
    readonly provider: FieldRef<"DeliveryLog", 'String'>
    readonly externalId: FieldRef<"DeliveryLog", 'String'>
    readonly requestPayload: FieldRef<"DeliveryLog", 'String'>
    readonly responsePayload: FieldRef<"DeliveryLog", 'String'>
    readonly durationMs: FieldRef<"DeliveryLog", 'Int'>
    readonly error: FieldRef<"DeliveryLog", 'String'>
    readonly createdAt: FieldRef<"DeliveryLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DeliveryLog findUnique
   */
  export type DeliveryLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
    /**
     * Filter, which DeliveryLog to fetch.
     */
    where: DeliveryLogWhereUniqueInput
  }

  /**
   * DeliveryLog findUniqueOrThrow
   */
  export type DeliveryLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
    /**
     * Filter, which DeliveryLog to fetch.
     */
    where: DeliveryLogWhereUniqueInput
  }

  /**
   * DeliveryLog findFirst
   */
  export type DeliveryLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
    /**
     * Filter, which DeliveryLog to fetch.
     */
    where?: DeliveryLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeliveryLogs to fetch.
     */
    orderBy?: DeliveryLogOrderByWithRelationInput | DeliveryLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DeliveryLogs.
     */
    cursor?: DeliveryLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeliveryLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeliveryLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DeliveryLogs.
     */
    distinct?: DeliveryLogScalarFieldEnum | DeliveryLogScalarFieldEnum[]
  }

  /**
   * DeliveryLog findFirstOrThrow
   */
  export type DeliveryLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
    /**
     * Filter, which DeliveryLog to fetch.
     */
    where?: DeliveryLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeliveryLogs to fetch.
     */
    orderBy?: DeliveryLogOrderByWithRelationInput | DeliveryLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DeliveryLogs.
     */
    cursor?: DeliveryLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeliveryLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeliveryLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DeliveryLogs.
     */
    distinct?: DeliveryLogScalarFieldEnum | DeliveryLogScalarFieldEnum[]
  }

  /**
   * DeliveryLog findMany
   */
  export type DeliveryLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
    /**
     * Filter, which DeliveryLogs to fetch.
     */
    where?: DeliveryLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeliveryLogs to fetch.
     */
    orderBy?: DeliveryLogOrderByWithRelationInput | DeliveryLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DeliveryLogs.
     */
    cursor?: DeliveryLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeliveryLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeliveryLogs.
     */
    skip?: number
    distinct?: DeliveryLogScalarFieldEnum | DeliveryLogScalarFieldEnum[]
  }

  /**
   * DeliveryLog create
   */
  export type DeliveryLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
    /**
     * The data needed to create a DeliveryLog.
     */
    data: XOR<DeliveryLogCreateInput, DeliveryLogUncheckedCreateInput>
  }

  /**
   * DeliveryLog createMany
   */
  export type DeliveryLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DeliveryLogs.
     */
    data: DeliveryLogCreateManyInput | DeliveryLogCreateManyInput[]
  }

  /**
   * DeliveryLog update
   */
  export type DeliveryLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
    /**
     * The data needed to update a DeliveryLog.
     */
    data: XOR<DeliveryLogUpdateInput, DeliveryLogUncheckedUpdateInput>
    /**
     * Choose, which DeliveryLog to update.
     */
    where: DeliveryLogWhereUniqueInput
  }

  /**
   * DeliveryLog updateMany
   */
  export type DeliveryLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DeliveryLogs.
     */
    data: XOR<DeliveryLogUpdateManyMutationInput, DeliveryLogUncheckedUpdateManyInput>
    /**
     * Filter which DeliveryLogs to update
     */
    where?: DeliveryLogWhereInput
  }

  /**
   * DeliveryLog upsert
   */
  export type DeliveryLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
    /**
     * The filter to search for the DeliveryLog to update in case it exists.
     */
    where: DeliveryLogWhereUniqueInput
    /**
     * In case the DeliveryLog found by the `where` argument doesn't exist, create a new DeliveryLog with this data.
     */
    create: XOR<DeliveryLogCreateInput, DeliveryLogUncheckedCreateInput>
    /**
     * In case the DeliveryLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DeliveryLogUpdateInput, DeliveryLogUncheckedUpdateInput>
  }

  /**
   * DeliveryLog delete
   */
  export type DeliveryLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
    /**
     * Filter which DeliveryLog to delete.
     */
    where: DeliveryLogWhereUniqueInput
  }

  /**
   * DeliveryLog deleteMany
   */
  export type DeliveryLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DeliveryLogs to delete
     */
    where?: DeliveryLogWhereInput
  }

  /**
   * DeliveryLog findRaw
   */
  export type DeliveryLogFindRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The query predicate filter. If unspecified, then all documents in the collection will match the predicate. ${@link https://docs.mongodb.com/manual/reference/operator/query MongoDB Docs}.
     */
    filter?: InputJsonValue
    /**
     * Additional options to pass to the `find` command ${@link https://docs.mongodb.com/manual/reference/command/find/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * DeliveryLog aggregateRaw
   */
  export type DeliveryLogAggregateRawArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * An array of aggregation stages to process and transform the document stream via the aggregation pipeline. ${@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline MongoDB Docs}.
     */
    pipeline?: InputJsonValue[]
    /**
     * Additional options to pass to the `aggregate` command ${@link https://docs.mongodb.com/manual/reference/command/aggregate/#command-fields MongoDB Docs}.
     */
    options?: InputJsonValue
  }

  /**
   * DeliveryLog without action
   */
  export type DeliveryLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryLog
     */
    select?: DeliveryLogSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const NotificationScalarFieldEnum: {
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
    isRead: 'isRead',
    title: 'title',
    type: 'type',
    scheduledAt: 'scheduledAt',
    sentAt: 'sentAt',
    deliveredAt: 'deliveredAt',
    failedAt: 'failedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum]


  export const MessageThreadScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    customerId: 'customerId',
    customerName: 'customerName',
    customerPhone: 'customerPhone',
    customerEmail: 'customerEmail',
    participantIds: 'participantIds',
    participantNames: 'participantNames',
    subject: 'subject',
    jobId: 'jobId',
    status: 'status',
    unreadCount: 'unreadCount',
    lastMessageAt: 'lastMessageAt',
    lastMessageBody: 'lastMessageBody',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type MessageThreadScalarFieldEnum = (typeof MessageThreadScalarFieldEnum)[keyof typeof MessageThreadScalarFieldEnum]


  export const NotificationTemplateScalarFieldEnum: {
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

  export type NotificationTemplateScalarFieldEnum = (typeof NotificationTemplateScalarFieldEnum)[keyof typeof NotificationTemplateScalarFieldEnum]


  export const AutomationRuleScalarFieldEnum: {
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

  export type AutomationRuleScalarFieldEnum = (typeof AutomationRuleScalarFieldEnum)[keyof typeof AutomationRuleScalarFieldEnum]


  export const DeliveryLogScalarFieldEnum: {
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

  export type DeliveryLogScalarFieldEnum = (typeof DeliveryLogScalarFieldEnum)[keyof typeof DeliveryLogScalarFieldEnum]


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
   * Reference to a field of type 'Channel'
   */
  export type EnumChannelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Channel'>
    


  /**
   * Reference to a field of type 'Channel[]'
   */
  export type ListEnumChannelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Channel[]'>
    


  /**
   * Reference to a field of type 'DeliveryStatus'
   */
  export type EnumDeliveryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DeliveryStatus'>
    


  /**
   * Reference to a field of type 'DeliveryStatus[]'
   */
  export type ListEnumDeliveryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DeliveryStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'ThreadStatus'
   */
  export type EnumThreadStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ThreadStatus'>
    


  /**
   * Reference to a field of type 'ThreadStatus[]'
   */
  export type ListEnumThreadStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ThreadStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'TemplateType'
   */
  export type EnumTemplateTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TemplateType'>
    


  /**
   * Reference to a field of type 'TemplateType[]'
   */
  export type ListEnumTemplateTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TemplateType[]'>
    


  /**
   * Reference to a field of type 'AutomationTrigger'
   */
  export type EnumAutomationTriggerFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AutomationTrigger'>
    


  /**
   * Reference to a field of type 'AutomationTrigger[]'
   */
  export type ListEnumAutomationTriggerFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AutomationTrigger[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'MessageDirection'
   */
  export type EnumMessageDirectionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageDirection'>
    


  /**
   * Reference to a field of type 'MessageDirection[]'
   */
  export type ListEnumMessageDirectionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageDirection[]'>
    
  /**
   * Deep Input Types
   */


  export type NotificationWhereInput = {
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    id?: StringFilter<"Notification"> | string
    companyId?: StringFilter<"Notification"> | string
    customerId?: StringNullableFilter<"Notification"> | string | null
    jobId?: StringNullableFilter<"Notification"> | string | null
    invoiceId?: StringNullableFilter<"Notification"> | string | null
    quoteId?: StringNullableFilter<"Notification"> | string | null
    recipientId?: StringFilter<"Notification"> | string
    recipientName?: StringNullableFilter<"Notification"> | string | null
    recipientEmail?: StringNullableFilter<"Notification"> | string | null
    recipientPhone?: StringNullableFilter<"Notification"> | string | null
    recipientPushToken?: StringNullableFilter<"Notification"> | string | null
    channel?: EnumChannelFilter<"Notification"> | $Enums.Channel
    subject?: StringNullableFilter<"Notification"> | string | null
    body?: StringFilter<"Notification"> | string
    status?: EnumDeliveryStatusFilter<"Notification"> | $Enums.DeliveryStatus
    externalId?: StringNullableFilter<"Notification"> | string | null
    providerResponse?: StringNullableFilter<"Notification"> | string | null
    error?: StringNullableFilter<"Notification"> | string | null
    isRead?: BoolFilter<"Notification"> | boolean
    title?: StringNullableFilter<"Notification"> | string | null
    type?: StringNullableFilter<"Notification"> | string | null
    scheduledAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    sentAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    deliveredAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    failedAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    updatedAt?: DateTimeFilter<"Notification"> | Date | string
  }

  export type NotificationOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    invoiceId?: SortOrder
    quoteId?: SortOrder
    recipientId?: SortOrder
    recipientName?: SortOrder
    recipientEmail?: SortOrder
    recipientPhone?: SortOrder
    recipientPushToken?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    status?: SortOrder
    externalId?: SortOrder
    providerResponse?: SortOrder
    error?: SortOrder
    isRead?: SortOrder
    title?: SortOrder
    type?: SortOrder
    scheduledAt?: SortOrder
    sentAt?: SortOrder
    deliveredAt?: SortOrder
    failedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    companyId?: StringFilter<"Notification"> | string
    customerId?: StringNullableFilter<"Notification"> | string | null
    jobId?: StringNullableFilter<"Notification"> | string | null
    invoiceId?: StringNullableFilter<"Notification"> | string | null
    quoteId?: StringNullableFilter<"Notification"> | string | null
    recipientId?: StringFilter<"Notification"> | string
    recipientName?: StringNullableFilter<"Notification"> | string | null
    recipientEmail?: StringNullableFilter<"Notification"> | string | null
    recipientPhone?: StringNullableFilter<"Notification"> | string | null
    recipientPushToken?: StringNullableFilter<"Notification"> | string | null
    channel?: EnumChannelFilter<"Notification"> | $Enums.Channel
    subject?: StringNullableFilter<"Notification"> | string | null
    body?: StringFilter<"Notification"> | string
    status?: EnumDeliveryStatusFilter<"Notification"> | $Enums.DeliveryStatus
    externalId?: StringNullableFilter<"Notification"> | string | null
    providerResponse?: StringNullableFilter<"Notification"> | string | null
    error?: StringNullableFilter<"Notification"> | string | null
    isRead?: BoolFilter<"Notification"> | boolean
    title?: StringNullableFilter<"Notification"> | string | null
    type?: StringNullableFilter<"Notification"> | string | null
    scheduledAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    sentAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    deliveredAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    failedAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    updatedAt?: DateTimeFilter<"Notification"> | Date | string
  }, "id">

  export type NotificationOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    invoiceId?: SortOrder
    quoteId?: SortOrder
    recipientId?: SortOrder
    recipientName?: SortOrder
    recipientEmail?: SortOrder
    recipientPhone?: SortOrder
    recipientPushToken?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    status?: SortOrder
    externalId?: SortOrder
    providerResponse?: SortOrder
    error?: SortOrder
    isRead?: SortOrder
    title?: SortOrder
    type?: SortOrder
    scheduledAt?: SortOrder
    sentAt?: SortOrder
    deliveredAt?: SortOrder
    failedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: NotificationCountOrderByAggregateInput
    _max?: NotificationMaxOrderByAggregateInput
    _min?: NotificationMinOrderByAggregateInput
  }

  export type NotificationScalarWhereWithAggregatesInput = {
    AND?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    OR?: NotificationScalarWhereWithAggregatesInput[]
    NOT?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Notification"> | string
    companyId?: StringWithAggregatesFilter<"Notification"> | string
    customerId?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    jobId?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    invoiceId?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    quoteId?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    recipientId?: StringWithAggregatesFilter<"Notification"> | string
    recipientName?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    recipientEmail?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    recipientPhone?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    recipientPushToken?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    channel?: EnumChannelWithAggregatesFilter<"Notification"> | $Enums.Channel
    subject?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    body?: StringWithAggregatesFilter<"Notification"> | string
    status?: EnumDeliveryStatusWithAggregatesFilter<"Notification"> | $Enums.DeliveryStatus
    externalId?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    providerResponse?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    error?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    isRead?: BoolWithAggregatesFilter<"Notification"> | boolean
    title?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    type?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    scheduledAt?: DateTimeNullableWithAggregatesFilter<"Notification"> | Date | string | null
    sentAt?: DateTimeNullableWithAggregatesFilter<"Notification"> | Date | string | null
    deliveredAt?: DateTimeNullableWithAggregatesFilter<"Notification"> | Date | string | null
    failedAt?: DateTimeNullableWithAggregatesFilter<"Notification"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Notification"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Notification"> | Date | string
  }

  export type MessageThreadWhereInput = {
    AND?: MessageThreadWhereInput | MessageThreadWhereInput[]
    OR?: MessageThreadWhereInput[]
    NOT?: MessageThreadWhereInput | MessageThreadWhereInput[]
    id?: StringFilter<"MessageThread"> | string
    companyId?: StringFilter<"MessageThread"> | string
    customerId?: StringNullableFilter<"MessageThread"> | string | null
    customerName?: StringNullableFilter<"MessageThread"> | string | null
    customerPhone?: StringNullableFilter<"MessageThread"> | string | null
    customerEmail?: StringNullableFilter<"MessageThread"> | string | null
    participantIds?: StringNullableListFilter<"MessageThread">
    participantNames?: StringNullableListFilter<"MessageThread">
    subject?: StringNullableFilter<"MessageThread"> | string | null
    jobId?: StringNullableFilter<"MessageThread"> | string | null
    status?: EnumThreadStatusFilter<"MessageThread"> | $Enums.ThreadStatus
    unreadCount?: IntFilter<"MessageThread"> | number
    lastMessageAt?: DateTimeNullableFilter<"MessageThread"> | Date | string | null
    lastMessageBody?: StringNullableFilter<"MessageThread"> | string | null
    messages?: MessageCompositeListFilter | MessageObjectEqualityInput[]
    createdAt?: DateTimeFilter<"MessageThread"> | Date | string
    updatedAt?: DateTimeFilter<"MessageThread"> | Date | string
  }

  export type MessageThreadOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    customerEmail?: SortOrder
    participantIds?: SortOrder
    participantNames?: SortOrder
    subject?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    unreadCount?: SortOrder
    lastMessageAt?: SortOrder
    lastMessageBody?: SortOrder
    messages?: MessageOrderByCompositeAggregateInput
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MessageThreadWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MessageThreadWhereInput | MessageThreadWhereInput[]
    OR?: MessageThreadWhereInput[]
    NOT?: MessageThreadWhereInput | MessageThreadWhereInput[]
    companyId?: StringFilter<"MessageThread"> | string
    customerId?: StringNullableFilter<"MessageThread"> | string | null
    customerName?: StringNullableFilter<"MessageThread"> | string | null
    customerPhone?: StringNullableFilter<"MessageThread"> | string | null
    customerEmail?: StringNullableFilter<"MessageThread"> | string | null
    participantIds?: StringNullableListFilter<"MessageThread">
    participantNames?: StringNullableListFilter<"MessageThread">
    subject?: StringNullableFilter<"MessageThread"> | string | null
    jobId?: StringNullableFilter<"MessageThread"> | string | null
    status?: EnumThreadStatusFilter<"MessageThread"> | $Enums.ThreadStatus
    unreadCount?: IntFilter<"MessageThread"> | number
    lastMessageAt?: DateTimeNullableFilter<"MessageThread"> | Date | string | null
    lastMessageBody?: StringNullableFilter<"MessageThread"> | string | null
    messages?: MessageCompositeListFilter | MessageObjectEqualityInput[]
    createdAt?: DateTimeFilter<"MessageThread"> | Date | string
    updatedAt?: DateTimeFilter<"MessageThread"> | Date | string
  }, "id">

  export type MessageThreadOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    customerEmail?: SortOrder
    participantIds?: SortOrder
    participantNames?: SortOrder
    subject?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    unreadCount?: SortOrder
    lastMessageAt?: SortOrder
    lastMessageBody?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: MessageThreadCountOrderByAggregateInput
    _avg?: MessageThreadAvgOrderByAggregateInput
    _max?: MessageThreadMaxOrderByAggregateInput
    _min?: MessageThreadMinOrderByAggregateInput
    _sum?: MessageThreadSumOrderByAggregateInput
  }

  export type MessageThreadScalarWhereWithAggregatesInput = {
    AND?: MessageThreadScalarWhereWithAggregatesInput | MessageThreadScalarWhereWithAggregatesInput[]
    OR?: MessageThreadScalarWhereWithAggregatesInput[]
    NOT?: MessageThreadScalarWhereWithAggregatesInput | MessageThreadScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MessageThread"> | string
    companyId?: StringWithAggregatesFilter<"MessageThread"> | string
    customerId?: StringNullableWithAggregatesFilter<"MessageThread"> | string | null
    customerName?: StringNullableWithAggregatesFilter<"MessageThread"> | string | null
    customerPhone?: StringNullableWithAggregatesFilter<"MessageThread"> | string | null
    customerEmail?: StringNullableWithAggregatesFilter<"MessageThread"> | string | null
    participantIds?: StringNullableListFilter<"MessageThread">
    participantNames?: StringNullableListFilter<"MessageThread">
    subject?: StringNullableWithAggregatesFilter<"MessageThread"> | string | null
    jobId?: StringNullableWithAggregatesFilter<"MessageThread"> | string | null
    status?: EnumThreadStatusWithAggregatesFilter<"MessageThread"> | $Enums.ThreadStatus
    unreadCount?: IntWithAggregatesFilter<"MessageThread"> | number
    lastMessageAt?: DateTimeNullableWithAggregatesFilter<"MessageThread"> | Date | string | null
    lastMessageBody?: StringNullableWithAggregatesFilter<"MessageThread"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"MessageThread"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"MessageThread"> | Date | string
  }

  export type NotificationTemplateWhereInput = {
    AND?: NotificationTemplateWhereInput | NotificationTemplateWhereInput[]
    OR?: NotificationTemplateWhereInput[]
    NOT?: NotificationTemplateWhereInput | NotificationTemplateWhereInput[]
    id?: StringFilter<"NotificationTemplate"> | string
    companyId?: StringFilter<"NotificationTemplate"> | string
    name?: StringFilter<"NotificationTemplate"> | string
    type?: EnumTemplateTypeFilter<"NotificationTemplate"> | $Enums.TemplateType
    channel?: EnumChannelFilter<"NotificationTemplate"> | $Enums.Channel
    subject?: StringNullableFilter<"NotificationTemplate"> | string | null
    body?: StringFilter<"NotificationTemplate"> | string
    variables?: StringNullableListFilter<"NotificationTemplate">
    isActive?: BoolFilter<"NotificationTemplate"> | boolean
    isDefault?: BoolFilter<"NotificationTemplate"> | boolean
    createdAt?: DateTimeFilter<"NotificationTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"NotificationTemplate"> | Date | string
  }

  export type NotificationTemplateOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    variables?: SortOrder
    isActive?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationTemplateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: NotificationTemplateWhereInput | NotificationTemplateWhereInput[]
    OR?: NotificationTemplateWhereInput[]
    NOT?: NotificationTemplateWhereInput | NotificationTemplateWhereInput[]
    companyId?: StringFilter<"NotificationTemplate"> | string
    name?: StringFilter<"NotificationTemplate"> | string
    type?: EnumTemplateTypeFilter<"NotificationTemplate"> | $Enums.TemplateType
    channel?: EnumChannelFilter<"NotificationTemplate"> | $Enums.Channel
    subject?: StringNullableFilter<"NotificationTemplate"> | string | null
    body?: StringFilter<"NotificationTemplate"> | string
    variables?: StringNullableListFilter<"NotificationTemplate">
    isActive?: BoolFilter<"NotificationTemplate"> | boolean
    isDefault?: BoolFilter<"NotificationTemplate"> | boolean
    createdAt?: DateTimeFilter<"NotificationTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"NotificationTemplate"> | Date | string
  }, "id">

  export type NotificationTemplateOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    variables?: SortOrder
    isActive?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: NotificationTemplateCountOrderByAggregateInput
    _max?: NotificationTemplateMaxOrderByAggregateInput
    _min?: NotificationTemplateMinOrderByAggregateInput
  }

  export type NotificationTemplateScalarWhereWithAggregatesInput = {
    AND?: NotificationTemplateScalarWhereWithAggregatesInput | NotificationTemplateScalarWhereWithAggregatesInput[]
    OR?: NotificationTemplateScalarWhereWithAggregatesInput[]
    NOT?: NotificationTemplateScalarWhereWithAggregatesInput | NotificationTemplateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"NotificationTemplate"> | string
    companyId?: StringWithAggregatesFilter<"NotificationTemplate"> | string
    name?: StringWithAggregatesFilter<"NotificationTemplate"> | string
    type?: EnumTemplateTypeWithAggregatesFilter<"NotificationTemplate"> | $Enums.TemplateType
    channel?: EnumChannelWithAggregatesFilter<"NotificationTemplate"> | $Enums.Channel
    subject?: StringNullableWithAggregatesFilter<"NotificationTemplate"> | string | null
    body?: StringWithAggregatesFilter<"NotificationTemplate"> | string
    variables?: StringNullableListFilter<"NotificationTemplate">
    isActive?: BoolWithAggregatesFilter<"NotificationTemplate"> | boolean
    isDefault?: BoolWithAggregatesFilter<"NotificationTemplate"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"NotificationTemplate"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"NotificationTemplate"> | Date | string
  }

  export type AutomationRuleWhereInput = {
    AND?: AutomationRuleWhereInput | AutomationRuleWhereInput[]
    OR?: AutomationRuleWhereInput[]
    NOT?: AutomationRuleWhereInput | AutomationRuleWhereInput[]
    id?: StringFilter<"AutomationRule"> | string
    companyId?: StringFilter<"AutomationRule"> | string
    name?: StringFilter<"AutomationRule"> | string
    isActive?: BoolFilter<"AutomationRule"> | boolean
    trigger?: EnumAutomationTriggerFilter<"AutomationRule"> | $Enums.AutomationTrigger
    conditions?: StringFilter<"AutomationRule"> | string
    actions?: StringFilter<"AutomationRule"> | string
    delayMinutes?: IntFilter<"AutomationRule"> | number
    createdAt?: DateTimeFilter<"AutomationRule"> | Date | string
    updatedAt?: DateTimeFilter<"AutomationRule"> | Date | string
  }

  export type AutomationRuleOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    trigger?: SortOrder
    conditions?: SortOrder
    actions?: SortOrder
    delayMinutes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AutomationRuleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AutomationRuleWhereInput | AutomationRuleWhereInput[]
    OR?: AutomationRuleWhereInput[]
    NOT?: AutomationRuleWhereInput | AutomationRuleWhereInput[]
    companyId?: StringFilter<"AutomationRule"> | string
    name?: StringFilter<"AutomationRule"> | string
    isActive?: BoolFilter<"AutomationRule"> | boolean
    trigger?: EnumAutomationTriggerFilter<"AutomationRule"> | $Enums.AutomationTrigger
    conditions?: StringFilter<"AutomationRule"> | string
    actions?: StringFilter<"AutomationRule"> | string
    delayMinutes?: IntFilter<"AutomationRule"> | number
    createdAt?: DateTimeFilter<"AutomationRule"> | Date | string
    updatedAt?: DateTimeFilter<"AutomationRule"> | Date | string
  }, "id">

  export type AutomationRuleOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    trigger?: SortOrder
    conditions?: SortOrder
    actions?: SortOrder
    delayMinutes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AutomationRuleCountOrderByAggregateInput
    _avg?: AutomationRuleAvgOrderByAggregateInput
    _max?: AutomationRuleMaxOrderByAggregateInput
    _min?: AutomationRuleMinOrderByAggregateInput
    _sum?: AutomationRuleSumOrderByAggregateInput
  }

  export type AutomationRuleScalarWhereWithAggregatesInput = {
    AND?: AutomationRuleScalarWhereWithAggregatesInput | AutomationRuleScalarWhereWithAggregatesInput[]
    OR?: AutomationRuleScalarWhereWithAggregatesInput[]
    NOT?: AutomationRuleScalarWhereWithAggregatesInput | AutomationRuleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AutomationRule"> | string
    companyId?: StringWithAggregatesFilter<"AutomationRule"> | string
    name?: StringWithAggregatesFilter<"AutomationRule"> | string
    isActive?: BoolWithAggregatesFilter<"AutomationRule"> | boolean
    trigger?: EnumAutomationTriggerWithAggregatesFilter<"AutomationRule"> | $Enums.AutomationTrigger
    conditions?: StringWithAggregatesFilter<"AutomationRule"> | string
    actions?: StringWithAggregatesFilter<"AutomationRule"> | string
    delayMinutes?: IntWithAggregatesFilter<"AutomationRule"> | number
    createdAt?: DateTimeWithAggregatesFilter<"AutomationRule"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AutomationRule"> | Date | string
  }

  export type DeliveryLogWhereInput = {
    AND?: DeliveryLogWhereInput | DeliveryLogWhereInput[]
    OR?: DeliveryLogWhereInput[]
    NOT?: DeliveryLogWhereInput | DeliveryLogWhereInput[]
    id?: StringFilter<"DeliveryLog"> | string
    companyId?: StringFilter<"DeliveryLog"> | string
    notificationId?: StringNullableFilter<"DeliveryLog"> | string | null
    channel?: EnumChannelFilter<"DeliveryLog"> | $Enums.Channel
    recipient?: StringFilter<"DeliveryLog"> | string
    status?: EnumDeliveryStatusFilter<"DeliveryLog"> | $Enums.DeliveryStatus
    provider?: StringFilter<"DeliveryLog"> | string
    externalId?: StringNullableFilter<"DeliveryLog"> | string | null
    requestPayload?: StringNullableFilter<"DeliveryLog"> | string | null
    responsePayload?: StringNullableFilter<"DeliveryLog"> | string | null
    durationMs?: IntNullableFilter<"DeliveryLog"> | number | null
    error?: StringNullableFilter<"DeliveryLog"> | string | null
    createdAt?: DateTimeFilter<"DeliveryLog"> | Date | string
  }

  export type DeliveryLogOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    recipient?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    externalId?: SortOrder
    requestPayload?: SortOrder
    responsePayload?: SortOrder
    durationMs?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
  }

  export type DeliveryLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DeliveryLogWhereInput | DeliveryLogWhereInput[]
    OR?: DeliveryLogWhereInput[]
    NOT?: DeliveryLogWhereInput | DeliveryLogWhereInput[]
    companyId?: StringFilter<"DeliveryLog"> | string
    notificationId?: StringNullableFilter<"DeliveryLog"> | string | null
    channel?: EnumChannelFilter<"DeliveryLog"> | $Enums.Channel
    recipient?: StringFilter<"DeliveryLog"> | string
    status?: EnumDeliveryStatusFilter<"DeliveryLog"> | $Enums.DeliveryStatus
    provider?: StringFilter<"DeliveryLog"> | string
    externalId?: StringNullableFilter<"DeliveryLog"> | string | null
    requestPayload?: StringNullableFilter<"DeliveryLog"> | string | null
    responsePayload?: StringNullableFilter<"DeliveryLog"> | string | null
    durationMs?: IntNullableFilter<"DeliveryLog"> | number | null
    error?: StringNullableFilter<"DeliveryLog"> | string | null
    createdAt?: DateTimeFilter<"DeliveryLog"> | Date | string
  }, "id">

  export type DeliveryLogOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    recipient?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    externalId?: SortOrder
    requestPayload?: SortOrder
    responsePayload?: SortOrder
    durationMs?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    _count?: DeliveryLogCountOrderByAggregateInput
    _avg?: DeliveryLogAvgOrderByAggregateInput
    _max?: DeliveryLogMaxOrderByAggregateInput
    _min?: DeliveryLogMinOrderByAggregateInput
    _sum?: DeliveryLogSumOrderByAggregateInput
  }

  export type DeliveryLogScalarWhereWithAggregatesInput = {
    AND?: DeliveryLogScalarWhereWithAggregatesInput | DeliveryLogScalarWhereWithAggregatesInput[]
    OR?: DeliveryLogScalarWhereWithAggregatesInput[]
    NOT?: DeliveryLogScalarWhereWithAggregatesInput | DeliveryLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DeliveryLog"> | string
    companyId?: StringWithAggregatesFilter<"DeliveryLog"> | string
    notificationId?: StringNullableWithAggregatesFilter<"DeliveryLog"> | string | null
    channel?: EnumChannelWithAggregatesFilter<"DeliveryLog"> | $Enums.Channel
    recipient?: StringWithAggregatesFilter<"DeliveryLog"> | string
    status?: EnumDeliveryStatusWithAggregatesFilter<"DeliveryLog"> | $Enums.DeliveryStatus
    provider?: StringWithAggregatesFilter<"DeliveryLog"> | string
    externalId?: StringNullableWithAggregatesFilter<"DeliveryLog"> | string | null
    requestPayload?: StringNullableWithAggregatesFilter<"DeliveryLog"> | string | null
    responsePayload?: StringNullableWithAggregatesFilter<"DeliveryLog"> | string | null
    durationMs?: IntNullableWithAggregatesFilter<"DeliveryLog"> | number | null
    error?: StringNullableWithAggregatesFilter<"DeliveryLog"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"DeliveryLog"> | Date | string
  }

  export type NotificationCreateInput = {
    id?: string
    companyId: string
    customerId?: string | null
    jobId?: string | null
    invoiceId?: string | null
    quoteId?: string | null
    recipientId: string
    recipientName?: string | null
    recipientEmail?: string | null
    recipientPhone?: string | null
    recipientPushToken?: string | null
    channel: $Enums.Channel
    subject?: string | null
    body: string
    status?: $Enums.DeliveryStatus
    externalId?: string | null
    providerResponse?: string | null
    error?: string | null
    isRead?: boolean
    title?: string | null
    type?: string | null
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    failedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationUncheckedCreateInput = {
    id?: string
    companyId: string
    customerId?: string | null
    jobId?: string | null
    invoiceId?: string | null
    quoteId?: string | null
    recipientId: string
    recipientName?: string | null
    recipientEmail?: string | null
    recipientPhone?: string | null
    recipientPushToken?: string | null
    channel: $Enums.Channel
    subject?: string | null
    body: string
    status?: $Enums.DeliveryStatus
    externalId?: string | null
    providerResponse?: string | null
    error?: string | null
    isRead?: boolean
    title?: string | null
    type?: string | null
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    failedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    recipientId?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    recipientEmail?: NullableStringFieldUpdateOperationsInput | string | null
    recipientPhone?: NullableStringFieldUpdateOperationsInput | string | null
    recipientPushToken?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    status?: EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    providerResponse?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    isRead?: BoolFieldUpdateOperationsInput | boolean
    title?: NullableStringFieldUpdateOperationsInput | string | null
    type?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    recipientId?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    recipientEmail?: NullableStringFieldUpdateOperationsInput | string | null
    recipientPhone?: NullableStringFieldUpdateOperationsInput | string | null
    recipientPushToken?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    status?: EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    providerResponse?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    isRead?: BoolFieldUpdateOperationsInput | boolean
    title?: NullableStringFieldUpdateOperationsInput | string | null
    type?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationCreateManyInput = {
    id?: string
    companyId: string
    customerId?: string | null
    jobId?: string | null
    invoiceId?: string | null
    quoteId?: string | null
    recipientId: string
    recipientName?: string | null
    recipientEmail?: string | null
    recipientPhone?: string | null
    recipientPushToken?: string | null
    channel: $Enums.Channel
    subject?: string | null
    body: string
    status?: $Enums.DeliveryStatus
    externalId?: string | null
    providerResponse?: string | null
    error?: string | null
    isRead?: boolean
    title?: string | null
    type?: string | null
    scheduledAt?: Date | string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    failedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationUpdateManyMutationInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    recipientId?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    recipientEmail?: NullableStringFieldUpdateOperationsInput | string | null
    recipientPhone?: NullableStringFieldUpdateOperationsInput | string | null
    recipientPushToken?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    status?: EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    providerResponse?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    isRead?: BoolFieldUpdateOperationsInput | boolean
    title?: NullableStringFieldUpdateOperationsInput | string | null
    type?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateManyInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    recipientId?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    recipientEmail?: NullableStringFieldUpdateOperationsInput | string | null
    recipientPhone?: NullableStringFieldUpdateOperationsInput | string | null
    recipientPushToken?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    status?: EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    providerResponse?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    isRead?: BoolFieldUpdateOperationsInput | boolean
    title?: NullableStringFieldUpdateOperationsInput | string | null
    type?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageThreadCreateInput = {
    id?: string
    companyId: string
    customerId?: string | null
    customerName?: string | null
    customerPhone?: string | null
    customerEmail?: string | null
    participantIds?: MessageThreadCreateparticipantIdsInput | string[]
    participantNames?: MessageThreadCreateparticipantNamesInput | string[]
    subject?: string | null
    jobId?: string | null
    status?: $Enums.ThreadStatus
    unreadCount?: number
    lastMessageAt?: Date | string | null
    lastMessageBody?: string | null
    messages?: XOR<MessageListCreateEnvelopeInput, MessageCreateInput> | MessageCreateInput[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MessageThreadUncheckedCreateInput = {
    id?: string
    companyId: string
    customerId?: string | null
    customerName?: string | null
    customerPhone?: string | null
    customerEmail?: string | null
    participantIds?: MessageThreadCreateparticipantIdsInput | string[]
    participantNames?: MessageThreadCreateparticipantNamesInput | string[]
    subject?: string | null
    jobId?: string | null
    status?: $Enums.ThreadStatus
    unreadCount?: number
    lastMessageAt?: Date | string | null
    lastMessageBody?: string | null
    messages?: XOR<MessageListCreateEnvelopeInput, MessageCreateInput> | MessageCreateInput[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MessageThreadUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    participantIds?: MessageThreadUpdateparticipantIdsInput | string[]
    participantNames?: MessageThreadUpdateparticipantNamesInput | string[]
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumThreadStatusFieldUpdateOperationsInput | $Enums.ThreadStatus
    unreadCount?: IntFieldUpdateOperationsInput | number
    lastMessageAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastMessageBody?: NullableStringFieldUpdateOperationsInput | string | null
    messages?: XOR<MessageListUpdateEnvelopeInput, MessageCreateInput> | MessageCreateInput[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageThreadUncheckedUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    participantIds?: MessageThreadUpdateparticipantIdsInput | string[]
    participantNames?: MessageThreadUpdateparticipantNamesInput | string[]
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumThreadStatusFieldUpdateOperationsInput | $Enums.ThreadStatus
    unreadCount?: IntFieldUpdateOperationsInput | number
    lastMessageAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastMessageBody?: NullableStringFieldUpdateOperationsInput | string | null
    messages?: XOR<MessageListUpdateEnvelopeInput, MessageCreateInput> | MessageCreateInput[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageThreadCreateManyInput = {
    id?: string
    companyId: string
    customerId?: string | null
    customerName?: string | null
    customerPhone?: string | null
    customerEmail?: string | null
    participantIds?: MessageThreadCreateparticipantIdsInput | string[]
    participantNames?: MessageThreadCreateparticipantNamesInput | string[]
    subject?: string | null
    jobId?: string | null
    status?: $Enums.ThreadStatus
    unreadCount?: number
    lastMessageAt?: Date | string | null
    lastMessageBody?: string | null
    messages?: XOR<MessageListCreateEnvelopeInput, MessageCreateInput> | MessageCreateInput[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MessageThreadUpdateManyMutationInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    participantIds?: MessageThreadUpdateparticipantIdsInput | string[]
    participantNames?: MessageThreadUpdateparticipantNamesInput | string[]
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumThreadStatusFieldUpdateOperationsInput | $Enums.ThreadStatus
    unreadCount?: IntFieldUpdateOperationsInput | number
    lastMessageAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastMessageBody?: NullableStringFieldUpdateOperationsInput | string | null
    messages?: XOR<MessageListUpdateEnvelopeInput, MessageCreateInput> | MessageCreateInput[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageThreadUncheckedUpdateManyInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    participantIds?: MessageThreadUpdateparticipantIdsInput | string[]
    participantNames?: MessageThreadUpdateparticipantNamesInput | string[]
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumThreadStatusFieldUpdateOperationsInput | $Enums.ThreadStatus
    unreadCount?: IntFieldUpdateOperationsInput | number
    lastMessageAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastMessageBody?: NullableStringFieldUpdateOperationsInput | string | null
    messages?: XOR<MessageListUpdateEnvelopeInput, MessageCreateInput> | MessageCreateInput[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationTemplateCreateInput = {
    id?: string
    companyId: string
    name: string
    type: $Enums.TemplateType
    channel: $Enums.Channel
    subject?: string | null
    body: string
    variables?: NotificationTemplateCreatevariablesInput | string[]
    isActive?: boolean
    isDefault?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationTemplateUncheckedCreateInput = {
    id?: string
    companyId: string
    name: string
    type: $Enums.TemplateType
    channel: $Enums.Channel
    subject?: string | null
    body: string
    variables?: NotificationTemplateCreatevariablesInput | string[]
    isActive?: boolean
    isDefault?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationTemplateUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumTemplateTypeFieldUpdateOperationsInput | $Enums.TemplateType
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    variables?: NotificationTemplateUpdatevariablesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationTemplateUncheckedUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumTemplateTypeFieldUpdateOperationsInput | $Enums.TemplateType
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    variables?: NotificationTemplateUpdatevariablesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationTemplateCreateManyInput = {
    id?: string
    companyId: string
    name: string
    type: $Enums.TemplateType
    channel: $Enums.Channel
    subject?: string | null
    body: string
    variables?: NotificationTemplateCreatevariablesInput | string[]
    isActive?: boolean
    isDefault?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationTemplateUpdateManyMutationInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumTemplateTypeFieldUpdateOperationsInput | $Enums.TemplateType
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    variables?: NotificationTemplateUpdatevariablesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationTemplateUncheckedUpdateManyInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: EnumTemplateTypeFieldUpdateOperationsInput | $Enums.TemplateType
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    variables?: NotificationTemplateUpdatevariablesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AutomationRuleCreateInput = {
    id?: string
    companyId: string
    name: string
    isActive?: boolean
    trigger: $Enums.AutomationTrigger
    conditions: string
    actions: string
    delayMinutes?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AutomationRuleUncheckedCreateInput = {
    id?: string
    companyId: string
    name: string
    isActive?: boolean
    trigger: $Enums.AutomationTrigger
    conditions: string
    actions: string
    delayMinutes?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AutomationRuleUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    trigger?: EnumAutomationTriggerFieldUpdateOperationsInput | $Enums.AutomationTrigger
    conditions?: StringFieldUpdateOperationsInput | string
    actions?: StringFieldUpdateOperationsInput | string
    delayMinutes?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AutomationRuleUncheckedUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    trigger?: EnumAutomationTriggerFieldUpdateOperationsInput | $Enums.AutomationTrigger
    conditions?: StringFieldUpdateOperationsInput | string
    actions?: StringFieldUpdateOperationsInput | string
    delayMinutes?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AutomationRuleCreateManyInput = {
    id?: string
    companyId: string
    name: string
    isActive?: boolean
    trigger: $Enums.AutomationTrigger
    conditions: string
    actions: string
    delayMinutes?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AutomationRuleUpdateManyMutationInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    trigger?: EnumAutomationTriggerFieldUpdateOperationsInput | $Enums.AutomationTrigger
    conditions?: StringFieldUpdateOperationsInput | string
    actions?: StringFieldUpdateOperationsInput | string
    delayMinutes?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AutomationRuleUncheckedUpdateManyInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    trigger?: EnumAutomationTriggerFieldUpdateOperationsInput | $Enums.AutomationTrigger
    conditions?: StringFieldUpdateOperationsInput | string
    actions?: StringFieldUpdateOperationsInput | string
    delayMinutes?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeliveryLogCreateInput = {
    id?: string
    companyId: string
    notificationId?: string | null
    channel: $Enums.Channel
    recipient: string
    status: $Enums.DeliveryStatus
    provider: string
    externalId?: string | null
    requestPayload?: string | null
    responsePayload?: string | null
    durationMs?: number | null
    error?: string | null
    createdAt?: Date | string
  }

  export type DeliveryLogUncheckedCreateInput = {
    id?: string
    companyId: string
    notificationId?: string | null
    channel: $Enums.Channel
    recipient: string
    status: $Enums.DeliveryStatus
    provider: string
    externalId?: string | null
    requestPayload?: string | null
    responsePayload?: string | null
    durationMs?: number | null
    error?: string | null
    createdAt?: Date | string
  }

  export type DeliveryLogUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    notificationId?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    recipient?: StringFieldUpdateOperationsInput | string
    status?: EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus
    provider?: StringFieldUpdateOperationsInput | string
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    requestPayload?: NullableStringFieldUpdateOperationsInput | string | null
    responsePayload?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeliveryLogUncheckedUpdateInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    notificationId?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    recipient?: StringFieldUpdateOperationsInput | string
    status?: EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus
    provider?: StringFieldUpdateOperationsInput | string
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    requestPayload?: NullableStringFieldUpdateOperationsInput | string | null
    responsePayload?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeliveryLogCreateManyInput = {
    id?: string
    companyId: string
    notificationId?: string | null
    channel: $Enums.Channel
    recipient: string
    status: $Enums.DeliveryStatus
    provider: string
    externalId?: string | null
    requestPayload?: string | null
    responsePayload?: string | null
    durationMs?: number | null
    error?: string | null
    createdAt?: Date | string
  }

  export type DeliveryLogUpdateManyMutationInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    notificationId?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    recipient?: StringFieldUpdateOperationsInput | string
    status?: EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus
    provider?: StringFieldUpdateOperationsInput | string
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    requestPayload?: NullableStringFieldUpdateOperationsInput | string | null
    responsePayload?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeliveryLogUncheckedUpdateManyInput = {
    companyId?: StringFieldUpdateOperationsInput | string
    notificationId?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    recipient?: StringFieldUpdateOperationsInput | string
    status?: EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus
    provider?: StringFieldUpdateOperationsInput | string
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    requestPayload?: NullableStringFieldUpdateOperationsInput | string | null
    responsePayload?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
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
    isSet?: boolean
  }

  export type EnumChannelFilter<$PrismaModel = never> = {
    equals?: $Enums.Channel | EnumChannelFieldRefInput<$PrismaModel>
    in?: $Enums.Channel[] | ListEnumChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.Channel[] | ListEnumChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumChannelFilter<$PrismaModel> | $Enums.Channel
  }

  export type EnumDeliveryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DeliveryStatus | EnumDeliveryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DeliveryStatus[] | ListEnumDeliveryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DeliveryStatus[] | ListEnumDeliveryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDeliveryStatusFilter<$PrismaModel> | $Enums.DeliveryStatus
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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
    isSet?: boolean
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

  export type NotificationCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    invoiceId?: SortOrder
    quoteId?: SortOrder
    recipientId?: SortOrder
    recipientName?: SortOrder
    recipientEmail?: SortOrder
    recipientPhone?: SortOrder
    recipientPushToken?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    status?: SortOrder
    externalId?: SortOrder
    providerResponse?: SortOrder
    error?: SortOrder
    isRead?: SortOrder
    title?: SortOrder
    type?: SortOrder
    scheduledAt?: SortOrder
    sentAt?: SortOrder
    deliveredAt?: SortOrder
    failedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    invoiceId?: SortOrder
    quoteId?: SortOrder
    recipientId?: SortOrder
    recipientName?: SortOrder
    recipientEmail?: SortOrder
    recipientPhone?: SortOrder
    recipientPushToken?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    status?: SortOrder
    externalId?: SortOrder
    providerResponse?: SortOrder
    error?: SortOrder
    isRead?: SortOrder
    title?: SortOrder
    type?: SortOrder
    scheduledAt?: SortOrder
    sentAt?: SortOrder
    deliveredAt?: SortOrder
    failedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    jobId?: SortOrder
    invoiceId?: SortOrder
    quoteId?: SortOrder
    recipientId?: SortOrder
    recipientName?: SortOrder
    recipientEmail?: SortOrder
    recipientPhone?: SortOrder
    recipientPushToken?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    status?: SortOrder
    externalId?: SortOrder
    providerResponse?: SortOrder
    error?: SortOrder
    isRead?: SortOrder
    title?: SortOrder
    type?: SortOrder
    scheduledAt?: SortOrder
    sentAt?: SortOrder
    deliveredAt?: SortOrder
    failedAt?: SortOrder
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
    isSet?: boolean
  }

  export type EnumChannelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Channel | EnumChannelFieldRefInput<$PrismaModel>
    in?: $Enums.Channel[] | ListEnumChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.Channel[] | ListEnumChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumChannelWithAggregatesFilter<$PrismaModel> | $Enums.Channel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumChannelFilter<$PrismaModel>
    _max?: NestedEnumChannelFilter<$PrismaModel>
  }

  export type EnumDeliveryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DeliveryStatus | EnumDeliveryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DeliveryStatus[] | ListEnumDeliveryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DeliveryStatus[] | ListEnumDeliveryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDeliveryStatusWithAggregatesFilter<$PrismaModel> | $Enums.DeliveryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDeliveryStatusFilter<$PrismaModel>
    _max?: NestedEnumDeliveryStatusFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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
    isSet?: boolean
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

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type EnumThreadStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ThreadStatus | EnumThreadStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ThreadStatus[] | ListEnumThreadStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ThreadStatus[] | ListEnumThreadStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumThreadStatusFilter<$PrismaModel> | $Enums.ThreadStatus
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

  export type MessageCompositeListFilter = {
    equals?: MessageObjectEqualityInput[]
    every?: MessageWhereInput
    some?: MessageWhereInput
    none?: MessageWhereInput
    isEmpty?: boolean
    isSet?: boolean
  }

  export type MessageObjectEqualityInput = {
    id: string
    senderId: string
    senderName: string
    direction: $Enums.MessageDirection
    body: string
    channel: $Enums.Channel
    mediaUrls?: string[]
    twilioSid?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    readAt?: Date | string | null
    createdAt: Date | string
  }

  export type MessageOrderByCompositeAggregateInput = {
    _count?: SortOrder
  }

  export type MessageThreadCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    customerEmail?: SortOrder
    participantIds?: SortOrder
    participantNames?: SortOrder
    subject?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    unreadCount?: SortOrder
    lastMessageAt?: SortOrder
    lastMessageBody?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MessageThreadAvgOrderByAggregateInput = {
    unreadCount?: SortOrder
  }

  export type MessageThreadMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    customerEmail?: SortOrder
    subject?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    unreadCount?: SortOrder
    lastMessageAt?: SortOrder
    lastMessageBody?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MessageThreadMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    customerEmail?: SortOrder
    subject?: SortOrder
    jobId?: SortOrder
    status?: SortOrder
    unreadCount?: SortOrder
    lastMessageAt?: SortOrder
    lastMessageBody?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MessageThreadSumOrderByAggregateInput = {
    unreadCount?: SortOrder
  }

  export type EnumThreadStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ThreadStatus | EnumThreadStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ThreadStatus[] | ListEnumThreadStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ThreadStatus[] | ListEnumThreadStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumThreadStatusWithAggregatesFilter<$PrismaModel> | $Enums.ThreadStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumThreadStatusFilter<$PrismaModel>
    _max?: NestedEnumThreadStatusFilter<$PrismaModel>
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

  export type EnumTemplateTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TemplateType | EnumTemplateTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TemplateType[] | ListEnumTemplateTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TemplateType[] | ListEnumTemplateTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTemplateTypeFilter<$PrismaModel> | $Enums.TemplateType
  }

  export type NotificationTemplateCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    variables?: SortOrder
    isActive?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationTemplateMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    isActive?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationTemplateMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    isActive?: SortOrder
    isDefault?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumTemplateTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TemplateType | EnumTemplateTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TemplateType[] | ListEnumTemplateTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TemplateType[] | ListEnumTemplateTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTemplateTypeWithAggregatesFilter<$PrismaModel> | $Enums.TemplateType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTemplateTypeFilter<$PrismaModel>
    _max?: NestedEnumTemplateTypeFilter<$PrismaModel>
  }

  export type EnumAutomationTriggerFilter<$PrismaModel = never> = {
    equals?: $Enums.AutomationTrigger | EnumAutomationTriggerFieldRefInput<$PrismaModel>
    in?: $Enums.AutomationTrigger[] | ListEnumAutomationTriggerFieldRefInput<$PrismaModel>
    notIn?: $Enums.AutomationTrigger[] | ListEnumAutomationTriggerFieldRefInput<$PrismaModel>
    not?: NestedEnumAutomationTriggerFilter<$PrismaModel> | $Enums.AutomationTrigger
  }

  export type AutomationRuleCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    trigger?: SortOrder
    conditions?: SortOrder
    actions?: SortOrder
    delayMinutes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AutomationRuleAvgOrderByAggregateInput = {
    delayMinutes?: SortOrder
  }

  export type AutomationRuleMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    trigger?: SortOrder
    conditions?: SortOrder
    actions?: SortOrder
    delayMinutes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AutomationRuleMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    trigger?: SortOrder
    conditions?: SortOrder
    actions?: SortOrder
    delayMinutes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AutomationRuleSumOrderByAggregateInput = {
    delayMinutes?: SortOrder
  }

  export type EnumAutomationTriggerWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AutomationTrigger | EnumAutomationTriggerFieldRefInput<$PrismaModel>
    in?: $Enums.AutomationTrigger[] | ListEnumAutomationTriggerFieldRefInput<$PrismaModel>
    notIn?: $Enums.AutomationTrigger[] | ListEnumAutomationTriggerFieldRefInput<$PrismaModel>
    not?: NestedEnumAutomationTriggerWithAggregatesFilter<$PrismaModel> | $Enums.AutomationTrigger
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAutomationTriggerFilter<$PrismaModel>
    _max?: NestedEnumAutomationTriggerFilter<$PrismaModel>
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
    isSet?: boolean
  }

  export type DeliveryLogCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    recipient?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    externalId?: SortOrder
    requestPayload?: SortOrder
    responsePayload?: SortOrder
    durationMs?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
  }

  export type DeliveryLogAvgOrderByAggregateInput = {
    durationMs?: SortOrder
  }

  export type DeliveryLogMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    recipient?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    externalId?: SortOrder
    requestPayload?: SortOrder
    responsePayload?: SortOrder
    durationMs?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
  }

  export type DeliveryLogMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    recipient?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    externalId?: SortOrder
    requestPayload?: SortOrder
    responsePayload?: SortOrder
    durationMs?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
  }

  export type DeliveryLogSumOrderByAggregateInput = {
    durationMs?: SortOrder
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
    isSet?: boolean
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
    unset?: boolean
  }

  export type EnumChannelFieldUpdateOperationsInput = {
    set?: $Enums.Channel
  }

  export type EnumDeliveryStatusFieldUpdateOperationsInput = {
    set?: $Enums.DeliveryStatus
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
    unset?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type MessageThreadCreateparticipantIdsInput = {
    set: string[]
  }

  export type MessageThreadCreateparticipantNamesInput = {
    set: string[]
  }

  export type MessageListCreateEnvelopeInput = {
    set?: MessageCreateInput | MessageCreateInput[]
  }

  export type MessageCreateInput = {
    id: string
    senderId: string
    senderName: string
    direction: $Enums.MessageDirection
    body: string
    channel: $Enums.Channel
    mediaUrls?: MessageCreatemediaUrlsInput | string[]
    twilioSid?: string | null
    sentAt?: Date | string | null
    deliveredAt?: Date | string | null
    readAt?: Date | string | null
    createdAt: Date | string
  }

  export type MessageThreadUpdateparticipantIdsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type MessageThreadUpdateparticipantNamesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type EnumThreadStatusFieldUpdateOperationsInput = {
    set?: $Enums.ThreadStatus
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MessageListUpdateEnvelopeInput = {
    set?: MessageCreateInput | MessageCreateInput[]
    push?: MessageCreateInput | MessageCreateInput[]
    updateMany?: MessageUpdateManyInput
    deleteMany?: MessageDeleteManyInput
  }

  export type NotificationTemplateCreatevariablesInput = {
    set: string[]
  }

  export type EnumTemplateTypeFieldUpdateOperationsInput = {
    set?: $Enums.TemplateType
  }

  export type NotificationTemplateUpdatevariablesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type EnumAutomationTriggerFieldUpdateOperationsInput = {
    set?: $Enums.AutomationTrigger
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
    unset?: boolean
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
    isSet?: boolean
  }

  export type NestedEnumChannelFilter<$PrismaModel = never> = {
    equals?: $Enums.Channel | EnumChannelFieldRefInput<$PrismaModel>
    in?: $Enums.Channel[] | ListEnumChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.Channel[] | ListEnumChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumChannelFilter<$PrismaModel> | $Enums.Channel
  }

  export type NestedEnumDeliveryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DeliveryStatus | EnumDeliveryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DeliveryStatus[] | ListEnumDeliveryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DeliveryStatus[] | ListEnumDeliveryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDeliveryStatusFilter<$PrismaModel> | $Enums.DeliveryStatus
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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
    isSet?: boolean
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
    isSet?: boolean
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
    isSet?: boolean
  }

  export type NestedEnumChannelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Channel | EnumChannelFieldRefInput<$PrismaModel>
    in?: $Enums.Channel[] | ListEnumChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.Channel[] | ListEnumChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumChannelWithAggregatesFilter<$PrismaModel> | $Enums.Channel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumChannelFilter<$PrismaModel>
    _max?: NestedEnumChannelFilter<$PrismaModel>
  }

  export type NestedEnumDeliveryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DeliveryStatus | EnumDeliveryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DeliveryStatus[] | ListEnumDeliveryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DeliveryStatus[] | ListEnumDeliveryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDeliveryStatusWithAggregatesFilter<$PrismaModel> | $Enums.DeliveryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDeliveryStatusFilter<$PrismaModel>
    _max?: NestedEnumDeliveryStatusFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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
    isSet?: boolean
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

  export type NestedEnumThreadStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ThreadStatus | EnumThreadStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ThreadStatus[] | ListEnumThreadStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ThreadStatus[] | ListEnumThreadStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumThreadStatusFilter<$PrismaModel> | $Enums.ThreadStatus
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: StringFilter<"Message"> | string
    senderId?: StringFilter<"Message"> | string
    senderName?: StringFilter<"Message"> | string
    direction?: EnumMessageDirectionFilter<"Message"> | $Enums.MessageDirection
    body?: StringFilter<"Message"> | string
    channel?: EnumChannelFilter<"Message"> | $Enums.Channel
    mediaUrls?: StringNullableListFilter<"Message">
    twilioSid?: StringNullableFilter<"Message"> | string | null
    sentAt?: DateTimeNullableFilter<"Message"> | Date | string | null
    deliveredAt?: DateTimeNullableFilter<"Message"> | Date | string | null
    readAt?: DateTimeNullableFilter<"Message"> | Date | string | null
    createdAt?: DateTimeFilter<"Message"> | Date | string
  }

  export type NestedEnumThreadStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ThreadStatus | EnumThreadStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ThreadStatus[] | ListEnumThreadStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ThreadStatus[] | ListEnumThreadStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumThreadStatusWithAggregatesFilter<$PrismaModel> | $Enums.ThreadStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumThreadStatusFilter<$PrismaModel>
    _max?: NestedEnumThreadStatusFilter<$PrismaModel>
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

  export type NestedEnumTemplateTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TemplateType | EnumTemplateTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TemplateType[] | ListEnumTemplateTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TemplateType[] | ListEnumTemplateTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTemplateTypeFilter<$PrismaModel> | $Enums.TemplateType
  }

  export type NestedEnumTemplateTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TemplateType | EnumTemplateTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TemplateType[] | ListEnumTemplateTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TemplateType[] | ListEnumTemplateTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTemplateTypeWithAggregatesFilter<$PrismaModel> | $Enums.TemplateType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTemplateTypeFilter<$PrismaModel>
    _max?: NestedEnumTemplateTypeFilter<$PrismaModel>
  }

  export type NestedEnumAutomationTriggerFilter<$PrismaModel = never> = {
    equals?: $Enums.AutomationTrigger | EnumAutomationTriggerFieldRefInput<$PrismaModel>
    in?: $Enums.AutomationTrigger[] | ListEnumAutomationTriggerFieldRefInput<$PrismaModel>
    notIn?: $Enums.AutomationTrigger[] | ListEnumAutomationTriggerFieldRefInput<$PrismaModel>
    not?: NestedEnumAutomationTriggerFilter<$PrismaModel> | $Enums.AutomationTrigger
  }

  export type NestedEnumAutomationTriggerWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AutomationTrigger | EnumAutomationTriggerFieldRefInput<$PrismaModel>
    in?: $Enums.AutomationTrigger[] | ListEnumAutomationTriggerFieldRefInput<$PrismaModel>
    notIn?: $Enums.AutomationTrigger[] | ListEnumAutomationTriggerFieldRefInput<$PrismaModel>
    not?: NestedEnumAutomationTriggerWithAggregatesFilter<$PrismaModel> | $Enums.AutomationTrigger
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAutomationTriggerFilter<$PrismaModel>
    _max?: NestedEnumAutomationTriggerFilter<$PrismaModel>
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
    isSet?: boolean
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
    isSet?: boolean
  }

  export type MessageCreatemediaUrlsInput = {
    set: string[]
  }

  export type MessageUpdateManyInput = {
    where: MessageWhereInput
    data: MessageUpdateInput
  }

  export type MessageDeleteManyInput = {
    where: MessageWhereInput
  }

  export type EnumMessageDirectionFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageDirection | EnumMessageDirectionFieldRefInput<$PrismaModel>
    in?: $Enums.MessageDirection[] | ListEnumMessageDirectionFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageDirection[] | ListEnumMessageDirectionFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageDirectionFilter<$PrismaModel> | $Enums.MessageDirection
  }

  export type MessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    senderName?: StringFieldUpdateOperationsInput | string
    direction?: EnumMessageDirectionFieldUpdateOperationsInput | $Enums.MessageDirection
    body?: StringFieldUpdateOperationsInput | string
    channel?: EnumChannelFieldUpdateOperationsInput | $Enums.Channel
    mediaUrls?: MessageUpdatemediaUrlsInput | string[]
    twilioSid?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    readAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NestedEnumMessageDirectionFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageDirection | EnumMessageDirectionFieldRefInput<$PrismaModel>
    in?: $Enums.MessageDirection[] | ListEnumMessageDirectionFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageDirection[] | ListEnumMessageDirectionFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageDirectionFilter<$PrismaModel> | $Enums.MessageDirection
  }

  export type EnumMessageDirectionFieldUpdateOperationsInput = {
    set?: $Enums.MessageDirection
  }

  export type MessageUpdatemediaUrlsInput = {
    set?: string[]
    push?: string | string[]
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use MessageDefaultArgs instead
     */
    export type MessageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = MessageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use NotificationDefaultArgs instead
     */
    export type NotificationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = NotificationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use MessageThreadDefaultArgs instead
     */
    export type MessageThreadArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = MessageThreadDefaultArgs<ExtArgs>
    /**
     * @deprecated Use NotificationTemplateDefaultArgs instead
     */
    export type NotificationTemplateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = NotificationTemplateDefaultArgs<ExtArgs>
    /**
     * @deprecated Use AutomationRuleDefaultArgs instead
     */
    export type AutomationRuleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = AutomationRuleDefaultArgs<ExtArgs>
    /**
     * @deprecated Use DeliveryLogDefaultArgs instead
     */
    export type DeliveryLogArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = DeliveryLogDefaultArgs<ExtArgs>

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