import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>
export type PartnerApiKey = $Result.DefaultSelection<Prisma.$PartnerApiKeyPayload>
export type PartnerNewCallerBooking = $Result.DefaultSelection<Prisma.$PartnerNewCallerBookingPayload>
export type PartnerWebhook = $Result.DefaultSelection<Prisma.$PartnerWebhookPayload>
export type PartnerWebhookDelivery = $Result.DefaultSelection<Prisma.$PartnerWebhookDeliveryPayload>
export type PartnerApiCall = $Result.DefaultSelection<Prisma.$PartnerApiCallPayload>

export namespace $Enums {
  export const PartnerEnvironment: {
  LIVE: 'LIVE',
  SANDBOX: 'SANDBOX'
};

export type PartnerEnvironment = (typeof PartnerEnvironment)[keyof typeof PartnerEnvironment]


export const ApiKeyStatus: {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED'
};

export type ApiKeyStatus = (typeof ApiKeyStatus)[keyof typeof ApiKeyStatus]


export const WebhookStatus: {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DISABLED: 'DISABLED'
};

export type WebhookStatus = (typeof WebhookStatus)[keyof typeof WebhookStatus]

}

export type PartnerEnvironment = $Enums.PartnerEnvironment

export const PartnerEnvironment: typeof $Enums.PartnerEnvironment

export type ApiKeyStatus = $Enums.ApiKeyStatus

export const ApiKeyStatus: typeof $Enums.ApiKeyStatus

export type WebhookStatus = $Enums.WebhookStatus

export const WebhookStatus: typeof $Enums.WebhookStatus

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
   * // Fetch zero or more PartnerApiKeys
   * const partnerApiKeys = await prisma.partnerApiKey.findMany()
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
   * `prisma.partnerApiKey`: Exposes CRUD operations for the **PartnerApiKey** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PartnerApiKeys
    * const partnerApiKeys = await prisma.partnerApiKey.findMany()
    * ```
    */
  get partnerApiKey(): Prisma.PartnerApiKeyDelegate<ExtArgs>;

  /**
   * `prisma.partnerNewCallerBooking`: Exposes CRUD operations for the **PartnerNewCallerBooking** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PartnerNewCallerBookings
    * const partnerNewCallerBookings = await prisma.partnerNewCallerBooking.findMany()
    * ```
    */
  get partnerNewCallerBooking(): Prisma.PartnerNewCallerBookingDelegate<ExtArgs>;

  /**
   * `prisma.partnerWebhook`: Exposes CRUD operations for the **PartnerWebhook** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PartnerWebhooks
    * const partnerWebhooks = await prisma.partnerWebhook.findMany()
    * ```
    */
  get partnerWebhook(): Prisma.PartnerWebhookDelegate<ExtArgs>;

  /**
   * `prisma.partnerWebhookDelivery`: Exposes CRUD operations for the **PartnerWebhookDelivery** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PartnerWebhookDeliveries
    * const partnerWebhookDeliveries = await prisma.partnerWebhookDelivery.findMany()
    * ```
    */
  get partnerWebhookDelivery(): Prisma.PartnerWebhookDeliveryDelegate<ExtArgs>;

  /**
   * `prisma.partnerApiCall`: Exposes CRUD operations for the **PartnerApiCall** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PartnerApiCalls
    * const partnerApiCalls = await prisma.partnerApiCall.findMany()
    * ```
    */
  get partnerApiCall(): Prisma.PartnerApiCallDelegate<ExtArgs>;
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
    PartnerApiKey: 'PartnerApiKey',
    PartnerNewCallerBooking: 'PartnerNewCallerBooking',
    PartnerWebhook: 'PartnerWebhook',
    PartnerWebhookDelivery: 'PartnerWebhookDelivery',
    PartnerApiCall: 'PartnerApiCall'
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
      modelProps: "partnerApiKey" | "partnerNewCallerBooking" | "partnerWebhook" | "partnerWebhookDelivery" | "partnerApiCall"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      PartnerApiKey: {
        payload: Prisma.$PartnerApiKeyPayload<ExtArgs>
        fields: Prisma.PartnerApiKeyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PartnerApiKeyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PartnerApiKeyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload>
          }
          findFirst: {
            args: Prisma.PartnerApiKeyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PartnerApiKeyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload>
          }
          findMany: {
            args: Prisma.PartnerApiKeyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload>[]
          }
          create: {
            args: Prisma.PartnerApiKeyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload>
          }
          createMany: {
            args: Prisma.PartnerApiKeyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PartnerApiKeyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload>[]
          }
          delete: {
            args: Prisma.PartnerApiKeyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload>
          }
          update: {
            args: Prisma.PartnerApiKeyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload>
          }
          deleteMany: {
            args: Prisma.PartnerApiKeyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PartnerApiKeyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PartnerApiKeyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiKeyPayload>
          }
          aggregate: {
            args: Prisma.PartnerApiKeyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePartnerApiKey>
          }
          groupBy: {
            args: Prisma.PartnerApiKeyGroupByArgs<ExtArgs>
            result: $Utils.Optional<PartnerApiKeyGroupByOutputType>[]
          }
          count: {
            args: Prisma.PartnerApiKeyCountArgs<ExtArgs>
            result: $Utils.Optional<PartnerApiKeyCountAggregateOutputType> | number
          }
        }
      }
      PartnerNewCallerBooking: {
        payload: Prisma.$PartnerNewCallerBookingPayload<ExtArgs>
        fields: Prisma.PartnerNewCallerBookingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PartnerNewCallerBookingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PartnerNewCallerBookingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload>
          }
          findFirst: {
            args: Prisma.PartnerNewCallerBookingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PartnerNewCallerBookingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload>
          }
          findMany: {
            args: Prisma.PartnerNewCallerBookingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload>[]
          }
          create: {
            args: Prisma.PartnerNewCallerBookingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload>
          }
          createMany: {
            args: Prisma.PartnerNewCallerBookingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PartnerNewCallerBookingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload>[]
          }
          delete: {
            args: Prisma.PartnerNewCallerBookingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload>
          }
          update: {
            args: Prisma.PartnerNewCallerBookingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload>
          }
          deleteMany: {
            args: Prisma.PartnerNewCallerBookingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PartnerNewCallerBookingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PartnerNewCallerBookingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerNewCallerBookingPayload>
          }
          aggregate: {
            args: Prisma.PartnerNewCallerBookingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePartnerNewCallerBooking>
          }
          groupBy: {
            args: Prisma.PartnerNewCallerBookingGroupByArgs<ExtArgs>
            result: $Utils.Optional<PartnerNewCallerBookingGroupByOutputType>[]
          }
          count: {
            args: Prisma.PartnerNewCallerBookingCountArgs<ExtArgs>
            result: $Utils.Optional<PartnerNewCallerBookingCountAggregateOutputType> | number
          }
        }
      }
      PartnerWebhook: {
        payload: Prisma.$PartnerWebhookPayload<ExtArgs>
        fields: Prisma.PartnerWebhookFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PartnerWebhookFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PartnerWebhookFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload>
          }
          findFirst: {
            args: Prisma.PartnerWebhookFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PartnerWebhookFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload>
          }
          findMany: {
            args: Prisma.PartnerWebhookFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload>[]
          }
          create: {
            args: Prisma.PartnerWebhookCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload>
          }
          createMany: {
            args: Prisma.PartnerWebhookCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PartnerWebhookCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload>[]
          }
          delete: {
            args: Prisma.PartnerWebhookDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload>
          }
          update: {
            args: Prisma.PartnerWebhookUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload>
          }
          deleteMany: {
            args: Prisma.PartnerWebhookDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PartnerWebhookUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PartnerWebhookUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookPayload>
          }
          aggregate: {
            args: Prisma.PartnerWebhookAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePartnerWebhook>
          }
          groupBy: {
            args: Prisma.PartnerWebhookGroupByArgs<ExtArgs>
            result: $Utils.Optional<PartnerWebhookGroupByOutputType>[]
          }
          count: {
            args: Prisma.PartnerWebhookCountArgs<ExtArgs>
            result: $Utils.Optional<PartnerWebhookCountAggregateOutputType> | number
          }
        }
      }
      PartnerWebhookDelivery: {
        payload: Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>
        fields: Prisma.PartnerWebhookDeliveryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PartnerWebhookDeliveryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PartnerWebhookDeliveryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload>
          }
          findFirst: {
            args: Prisma.PartnerWebhookDeliveryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PartnerWebhookDeliveryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload>
          }
          findMany: {
            args: Prisma.PartnerWebhookDeliveryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload>[]
          }
          create: {
            args: Prisma.PartnerWebhookDeliveryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload>
          }
          createMany: {
            args: Prisma.PartnerWebhookDeliveryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PartnerWebhookDeliveryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload>[]
          }
          delete: {
            args: Prisma.PartnerWebhookDeliveryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload>
          }
          update: {
            args: Prisma.PartnerWebhookDeliveryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload>
          }
          deleteMany: {
            args: Prisma.PartnerWebhookDeliveryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PartnerWebhookDeliveryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PartnerWebhookDeliveryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerWebhookDeliveryPayload>
          }
          aggregate: {
            args: Prisma.PartnerWebhookDeliveryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePartnerWebhookDelivery>
          }
          groupBy: {
            args: Prisma.PartnerWebhookDeliveryGroupByArgs<ExtArgs>
            result: $Utils.Optional<PartnerWebhookDeliveryGroupByOutputType>[]
          }
          count: {
            args: Prisma.PartnerWebhookDeliveryCountArgs<ExtArgs>
            result: $Utils.Optional<PartnerWebhookDeliveryCountAggregateOutputType> | number
          }
        }
      }
      PartnerApiCall: {
        payload: Prisma.$PartnerApiCallPayload<ExtArgs>
        fields: Prisma.PartnerApiCallFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PartnerApiCallFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PartnerApiCallFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload>
          }
          findFirst: {
            args: Prisma.PartnerApiCallFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PartnerApiCallFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload>
          }
          findMany: {
            args: Prisma.PartnerApiCallFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload>[]
          }
          create: {
            args: Prisma.PartnerApiCallCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload>
          }
          createMany: {
            args: Prisma.PartnerApiCallCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PartnerApiCallCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload>[]
          }
          delete: {
            args: Prisma.PartnerApiCallDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload>
          }
          update: {
            args: Prisma.PartnerApiCallUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload>
          }
          deleteMany: {
            args: Prisma.PartnerApiCallDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PartnerApiCallUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PartnerApiCallUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PartnerApiCallPayload>
          }
          aggregate: {
            args: Prisma.PartnerApiCallAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePartnerApiCall>
          }
          groupBy: {
            args: Prisma.PartnerApiCallGroupByArgs<ExtArgs>
            result: $Utils.Optional<PartnerApiCallGroupByOutputType>[]
          }
          count: {
            args: Prisma.PartnerApiCallCountArgs<ExtArgs>
            result: $Utils.Optional<PartnerApiCallCountAggregateOutputType> | number
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
   * Count Type PartnerApiKeyCountOutputType
   */

  export type PartnerApiKeyCountOutputType = {
    calls: number
  }

  export type PartnerApiKeyCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    calls?: boolean | PartnerApiKeyCountOutputTypeCountCallsArgs
  }

  // Custom InputTypes
  /**
   * PartnerApiKeyCountOutputType without action
   */
  export type PartnerApiKeyCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKeyCountOutputType
     */
    select?: PartnerApiKeyCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PartnerApiKeyCountOutputType without action
   */
  export type PartnerApiKeyCountOutputTypeCountCallsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PartnerApiCallWhereInput
  }


  /**
   * Count Type PartnerWebhookCountOutputType
   */

  export type PartnerWebhookCountOutputType = {
    deliveries: number
  }

  export type PartnerWebhookCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    deliveries?: boolean | PartnerWebhookCountOutputTypeCountDeliveriesArgs
  }

  // Custom InputTypes
  /**
   * PartnerWebhookCountOutputType without action
   */
  export type PartnerWebhookCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookCountOutputType
     */
    select?: PartnerWebhookCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PartnerWebhookCountOutputType without action
   */
  export type PartnerWebhookCountOutputTypeCountDeliveriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PartnerWebhookDeliveryWhereInput
  }


  /**
   * Models
   */

  /**
   * Model PartnerApiKey
   */

  export type AggregatePartnerApiKey = {
    _count: PartnerApiKeyCountAggregateOutputType | null
    _avg: PartnerApiKeyAvgAggregateOutputType | null
    _sum: PartnerApiKeySumAggregateOutputType | null
    _min: PartnerApiKeyMinAggregateOutputType | null
    _max: PartnerApiKeyMaxAggregateOutputType | null
  }

  export type PartnerApiKeyAvgAggregateOutputType = {
    rateLimitPerMin: number | null
  }

  export type PartnerApiKeySumAggregateOutputType = {
    rateLimitPerMin: number | null
  }

  export type PartnerApiKeyMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    environment: $Enums.PartnerEnvironment | null
    keyPrefix: string | null
    keyHash: string | null
    rateLimitPerMin: number | null
    status: $Enums.ApiKeyStatus | null
    lastUsedAt: Date | null
    expiresAt: Date | null
    createdBy: string | null
    createdAt: Date | null
    revokedAt: Date | null
  }

  export type PartnerApiKeyMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    name: string | null
    environment: $Enums.PartnerEnvironment | null
    keyPrefix: string | null
    keyHash: string | null
    rateLimitPerMin: number | null
    status: $Enums.ApiKeyStatus | null
    lastUsedAt: Date | null
    expiresAt: Date | null
    createdBy: string | null
    createdAt: Date | null
    revokedAt: Date | null
  }

  export type PartnerApiKeyCountAggregateOutputType = {
    id: number
    companyId: number
    name: number
    environment: number
    keyPrefix: number
    keyHash: number
    scopes: number
    rateLimitPerMin: number
    status: number
    lastUsedAt: number
    expiresAt: number
    createdBy: number
    createdAt: number
    revokedAt: number
    _all: number
  }


  export type PartnerApiKeyAvgAggregateInputType = {
    rateLimitPerMin?: true
  }

  export type PartnerApiKeySumAggregateInputType = {
    rateLimitPerMin?: true
  }

  export type PartnerApiKeyMinAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    environment?: true
    keyPrefix?: true
    keyHash?: true
    rateLimitPerMin?: true
    status?: true
    lastUsedAt?: true
    expiresAt?: true
    createdBy?: true
    createdAt?: true
    revokedAt?: true
  }

  export type PartnerApiKeyMaxAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    environment?: true
    keyPrefix?: true
    keyHash?: true
    rateLimitPerMin?: true
    status?: true
    lastUsedAt?: true
    expiresAt?: true
    createdBy?: true
    createdAt?: true
    revokedAt?: true
  }

  export type PartnerApiKeyCountAggregateInputType = {
    id?: true
    companyId?: true
    name?: true
    environment?: true
    keyPrefix?: true
    keyHash?: true
    scopes?: true
    rateLimitPerMin?: true
    status?: true
    lastUsedAt?: true
    expiresAt?: true
    createdBy?: true
    createdAt?: true
    revokedAt?: true
    _all?: true
  }

  export type PartnerApiKeyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerApiKey to aggregate.
     */
    where?: PartnerApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerApiKeys to fetch.
     */
    orderBy?: PartnerApiKeyOrderByWithRelationInput | PartnerApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PartnerApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerApiKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PartnerApiKeys
    **/
    _count?: true | PartnerApiKeyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PartnerApiKeyAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PartnerApiKeySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PartnerApiKeyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PartnerApiKeyMaxAggregateInputType
  }

  export type GetPartnerApiKeyAggregateType<T extends PartnerApiKeyAggregateArgs> = {
        [P in keyof T & keyof AggregatePartnerApiKey]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePartnerApiKey[P]>
      : GetScalarType<T[P], AggregatePartnerApiKey[P]>
  }




  export type PartnerApiKeyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PartnerApiKeyWhereInput
    orderBy?: PartnerApiKeyOrderByWithAggregationInput | PartnerApiKeyOrderByWithAggregationInput[]
    by: PartnerApiKeyScalarFieldEnum[] | PartnerApiKeyScalarFieldEnum
    having?: PartnerApiKeyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PartnerApiKeyCountAggregateInputType | true
    _avg?: PartnerApiKeyAvgAggregateInputType
    _sum?: PartnerApiKeySumAggregateInputType
    _min?: PartnerApiKeyMinAggregateInputType
    _max?: PartnerApiKeyMaxAggregateInputType
  }

  export type PartnerApiKeyGroupByOutputType = {
    id: string
    companyId: string
    name: string
    environment: $Enums.PartnerEnvironment
    keyPrefix: string
    keyHash: string
    scopes: string[]
    rateLimitPerMin: number
    status: $Enums.ApiKeyStatus
    lastUsedAt: Date | null
    expiresAt: Date | null
    createdBy: string | null
    createdAt: Date
    revokedAt: Date | null
    _count: PartnerApiKeyCountAggregateOutputType | null
    _avg: PartnerApiKeyAvgAggregateOutputType | null
    _sum: PartnerApiKeySumAggregateOutputType | null
    _min: PartnerApiKeyMinAggregateOutputType | null
    _max: PartnerApiKeyMaxAggregateOutputType | null
  }

  type GetPartnerApiKeyGroupByPayload<T extends PartnerApiKeyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PartnerApiKeyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PartnerApiKeyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PartnerApiKeyGroupByOutputType[P]>
            : GetScalarType<T[P], PartnerApiKeyGroupByOutputType[P]>
        }
      >
    >


  export type PartnerApiKeySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    environment?: boolean
    keyPrefix?: boolean
    keyHash?: boolean
    scopes?: boolean
    rateLimitPerMin?: boolean
    status?: boolean
    lastUsedAt?: boolean
    expiresAt?: boolean
    createdBy?: boolean
    createdAt?: boolean
    revokedAt?: boolean
    calls?: boolean | PartnerApiKey$callsArgs<ExtArgs>
    _count?: boolean | PartnerApiKeyCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["partnerApiKey"]>

  export type PartnerApiKeySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    name?: boolean
    environment?: boolean
    keyPrefix?: boolean
    keyHash?: boolean
    scopes?: boolean
    rateLimitPerMin?: boolean
    status?: boolean
    lastUsedAt?: boolean
    expiresAt?: boolean
    createdBy?: boolean
    createdAt?: boolean
    revokedAt?: boolean
  }, ExtArgs["result"]["partnerApiKey"]>

  export type PartnerApiKeySelectScalar = {
    id?: boolean
    companyId?: boolean
    name?: boolean
    environment?: boolean
    keyPrefix?: boolean
    keyHash?: boolean
    scopes?: boolean
    rateLimitPerMin?: boolean
    status?: boolean
    lastUsedAt?: boolean
    expiresAt?: boolean
    createdBy?: boolean
    createdAt?: boolean
    revokedAt?: boolean
  }

  export type PartnerApiKeyInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    calls?: boolean | PartnerApiKey$callsArgs<ExtArgs>
    _count?: boolean | PartnerApiKeyCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PartnerApiKeyIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PartnerApiKeyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PartnerApiKey"
    objects: {
      calls: Prisma.$PartnerApiCallPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      name: string
      environment: $Enums.PartnerEnvironment
      /**
       * Non-secret display prefix, e.g. "pk_live_a94f1c2b" — safe to render in the UI.
       */
      keyPrefix: string
      keyHash: string
      scopes: string[]
      rateLimitPerMin: number
      status: $Enums.ApiKeyStatus
      lastUsedAt: Date | null
      expiresAt: Date | null
      createdBy: string | null
      createdAt: Date
      revokedAt: Date | null
    }, ExtArgs["result"]["partnerApiKey"]>
    composites: {}
  }

  type PartnerApiKeyGetPayload<S extends boolean | null | undefined | PartnerApiKeyDefaultArgs> = $Result.GetResult<Prisma.$PartnerApiKeyPayload, S>

  type PartnerApiKeyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PartnerApiKeyFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PartnerApiKeyCountAggregateInputType | true
    }

  export interface PartnerApiKeyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PartnerApiKey'], meta: { name: 'PartnerApiKey' } }
    /**
     * Find zero or one PartnerApiKey that matches the filter.
     * @param {PartnerApiKeyFindUniqueArgs} args - Arguments to find a PartnerApiKey
     * @example
     * // Get one PartnerApiKey
     * const partnerApiKey = await prisma.partnerApiKey.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PartnerApiKeyFindUniqueArgs>(args: SelectSubset<T, PartnerApiKeyFindUniqueArgs<ExtArgs>>): Prisma__PartnerApiKeyClient<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PartnerApiKey that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PartnerApiKeyFindUniqueOrThrowArgs} args - Arguments to find a PartnerApiKey
     * @example
     * // Get one PartnerApiKey
     * const partnerApiKey = await prisma.partnerApiKey.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PartnerApiKeyFindUniqueOrThrowArgs>(args: SelectSubset<T, PartnerApiKeyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PartnerApiKeyClient<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PartnerApiKey that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiKeyFindFirstArgs} args - Arguments to find a PartnerApiKey
     * @example
     * // Get one PartnerApiKey
     * const partnerApiKey = await prisma.partnerApiKey.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PartnerApiKeyFindFirstArgs>(args?: SelectSubset<T, PartnerApiKeyFindFirstArgs<ExtArgs>>): Prisma__PartnerApiKeyClient<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PartnerApiKey that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiKeyFindFirstOrThrowArgs} args - Arguments to find a PartnerApiKey
     * @example
     * // Get one PartnerApiKey
     * const partnerApiKey = await prisma.partnerApiKey.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PartnerApiKeyFindFirstOrThrowArgs>(args?: SelectSubset<T, PartnerApiKeyFindFirstOrThrowArgs<ExtArgs>>): Prisma__PartnerApiKeyClient<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PartnerApiKeys that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiKeyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PartnerApiKeys
     * const partnerApiKeys = await prisma.partnerApiKey.findMany()
     * 
     * // Get first 10 PartnerApiKeys
     * const partnerApiKeys = await prisma.partnerApiKey.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const partnerApiKeyWithIdOnly = await prisma.partnerApiKey.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PartnerApiKeyFindManyArgs>(args?: SelectSubset<T, PartnerApiKeyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PartnerApiKey.
     * @param {PartnerApiKeyCreateArgs} args - Arguments to create a PartnerApiKey.
     * @example
     * // Create one PartnerApiKey
     * const PartnerApiKey = await prisma.partnerApiKey.create({
     *   data: {
     *     // ... data to create a PartnerApiKey
     *   }
     * })
     * 
     */
    create<T extends PartnerApiKeyCreateArgs>(args: SelectSubset<T, PartnerApiKeyCreateArgs<ExtArgs>>): Prisma__PartnerApiKeyClient<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PartnerApiKeys.
     * @param {PartnerApiKeyCreateManyArgs} args - Arguments to create many PartnerApiKeys.
     * @example
     * // Create many PartnerApiKeys
     * const partnerApiKey = await prisma.partnerApiKey.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PartnerApiKeyCreateManyArgs>(args?: SelectSubset<T, PartnerApiKeyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PartnerApiKeys and returns the data saved in the database.
     * @param {PartnerApiKeyCreateManyAndReturnArgs} args - Arguments to create many PartnerApiKeys.
     * @example
     * // Create many PartnerApiKeys
     * const partnerApiKey = await prisma.partnerApiKey.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PartnerApiKeys and only return the `id`
     * const partnerApiKeyWithIdOnly = await prisma.partnerApiKey.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PartnerApiKeyCreateManyAndReturnArgs>(args?: SelectSubset<T, PartnerApiKeyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PartnerApiKey.
     * @param {PartnerApiKeyDeleteArgs} args - Arguments to delete one PartnerApiKey.
     * @example
     * // Delete one PartnerApiKey
     * const PartnerApiKey = await prisma.partnerApiKey.delete({
     *   where: {
     *     // ... filter to delete one PartnerApiKey
     *   }
     * })
     * 
     */
    delete<T extends PartnerApiKeyDeleteArgs>(args: SelectSubset<T, PartnerApiKeyDeleteArgs<ExtArgs>>): Prisma__PartnerApiKeyClient<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PartnerApiKey.
     * @param {PartnerApiKeyUpdateArgs} args - Arguments to update one PartnerApiKey.
     * @example
     * // Update one PartnerApiKey
     * const partnerApiKey = await prisma.partnerApiKey.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PartnerApiKeyUpdateArgs>(args: SelectSubset<T, PartnerApiKeyUpdateArgs<ExtArgs>>): Prisma__PartnerApiKeyClient<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PartnerApiKeys.
     * @param {PartnerApiKeyDeleteManyArgs} args - Arguments to filter PartnerApiKeys to delete.
     * @example
     * // Delete a few PartnerApiKeys
     * const { count } = await prisma.partnerApiKey.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PartnerApiKeyDeleteManyArgs>(args?: SelectSubset<T, PartnerApiKeyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PartnerApiKeys.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiKeyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PartnerApiKeys
     * const partnerApiKey = await prisma.partnerApiKey.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PartnerApiKeyUpdateManyArgs>(args: SelectSubset<T, PartnerApiKeyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PartnerApiKey.
     * @param {PartnerApiKeyUpsertArgs} args - Arguments to update or create a PartnerApiKey.
     * @example
     * // Update or create a PartnerApiKey
     * const partnerApiKey = await prisma.partnerApiKey.upsert({
     *   create: {
     *     // ... data to create a PartnerApiKey
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PartnerApiKey we want to update
     *   }
     * })
     */
    upsert<T extends PartnerApiKeyUpsertArgs>(args: SelectSubset<T, PartnerApiKeyUpsertArgs<ExtArgs>>): Prisma__PartnerApiKeyClient<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PartnerApiKeys.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiKeyCountArgs} args - Arguments to filter PartnerApiKeys to count.
     * @example
     * // Count the number of PartnerApiKeys
     * const count = await prisma.partnerApiKey.count({
     *   where: {
     *     // ... the filter for the PartnerApiKeys we want to count
     *   }
     * })
    **/
    count<T extends PartnerApiKeyCountArgs>(
      args?: Subset<T, PartnerApiKeyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PartnerApiKeyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PartnerApiKey.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiKeyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PartnerApiKeyAggregateArgs>(args: Subset<T, PartnerApiKeyAggregateArgs>): Prisma.PrismaPromise<GetPartnerApiKeyAggregateType<T>>

    /**
     * Group by PartnerApiKey.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiKeyGroupByArgs} args - Group by arguments.
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
      T extends PartnerApiKeyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PartnerApiKeyGroupByArgs['orderBy'] }
        : { orderBy?: PartnerApiKeyGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PartnerApiKeyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPartnerApiKeyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PartnerApiKey model
   */
  readonly fields: PartnerApiKeyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PartnerApiKey.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PartnerApiKeyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    calls<T extends PartnerApiKey$callsArgs<ExtArgs> = {}>(args?: Subset<T, PartnerApiKey$callsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the PartnerApiKey model
   */ 
  interface PartnerApiKeyFieldRefs {
    readonly id: FieldRef<"PartnerApiKey", 'String'>
    readonly companyId: FieldRef<"PartnerApiKey", 'String'>
    readonly name: FieldRef<"PartnerApiKey", 'String'>
    readonly environment: FieldRef<"PartnerApiKey", 'PartnerEnvironment'>
    readonly keyPrefix: FieldRef<"PartnerApiKey", 'String'>
    readonly keyHash: FieldRef<"PartnerApiKey", 'String'>
    readonly scopes: FieldRef<"PartnerApiKey", 'String[]'>
    readonly rateLimitPerMin: FieldRef<"PartnerApiKey", 'Int'>
    readonly status: FieldRef<"PartnerApiKey", 'ApiKeyStatus'>
    readonly lastUsedAt: FieldRef<"PartnerApiKey", 'DateTime'>
    readonly expiresAt: FieldRef<"PartnerApiKey", 'DateTime'>
    readonly createdBy: FieldRef<"PartnerApiKey", 'String'>
    readonly createdAt: FieldRef<"PartnerApiKey", 'DateTime'>
    readonly revokedAt: FieldRef<"PartnerApiKey", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PartnerApiKey findUnique
   */
  export type PartnerApiKeyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiKey to fetch.
     */
    where: PartnerApiKeyWhereUniqueInput
  }

  /**
   * PartnerApiKey findUniqueOrThrow
   */
  export type PartnerApiKeyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiKey to fetch.
     */
    where: PartnerApiKeyWhereUniqueInput
  }

  /**
   * PartnerApiKey findFirst
   */
  export type PartnerApiKeyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiKey to fetch.
     */
    where?: PartnerApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerApiKeys to fetch.
     */
    orderBy?: PartnerApiKeyOrderByWithRelationInput | PartnerApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerApiKeys.
     */
    cursor?: PartnerApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerApiKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerApiKeys.
     */
    distinct?: PartnerApiKeyScalarFieldEnum | PartnerApiKeyScalarFieldEnum[]
  }

  /**
   * PartnerApiKey findFirstOrThrow
   */
  export type PartnerApiKeyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiKey to fetch.
     */
    where?: PartnerApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerApiKeys to fetch.
     */
    orderBy?: PartnerApiKeyOrderByWithRelationInput | PartnerApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerApiKeys.
     */
    cursor?: PartnerApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerApiKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerApiKeys.
     */
    distinct?: PartnerApiKeyScalarFieldEnum | PartnerApiKeyScalarFieldEnum[]
  }

  /**
   * PartnerApiKey findMany
   */
  export type PartnerApiKeyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiKeys to fetch.
     */
    where?: PartnerApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerApiKeys to fetch.
     */
    orderBy?: PartnerApiKeyOrderByWithRelationInput | PartnerApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PartnerApiKeys.
     */
    cursor?: PartnerApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerApiKeys.
     */
    skip?: number
    distinct?: PartnerApiKeyScalarFieldEnum | PartnerApiKeyScalarFieldEnum[]
  }

  /**
   * PartnerApiKey create
   */
  export type PartnerApiKeyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    /**
     * The data needed to create a PartnerApiKey.
     */
    data: XOR<PartnerApiKeyCreateInput, PartnerApiKeyUncheckedCreateInput>
  }

  /**
   * PartnerApiKey createMany
   */
  export type PartnerApiKeyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PartnerApiKeys.
     */
    data: PartnerApiKeyCreateManyInput | PartnerApiKeyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PartnerApiKey createManyAndReturn
   */
  export type PartnerApiKeyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PartnerApiKeys.
     */
    data: PartnerApiKeyCreateManyInput | PartnerApiKeyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PartnerApiKey update
   */
  export type PartnerApiKeyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    /**
     * The data needed to update a PartnerApiKey.
     */
    data: XOR<PartnerApiKeyUpdateInput, PartnerApiKeyUncheckedUpdateInput>
    /**
     * Choose, which PartnerApiKey to update.
     */
    where: PartnerApiKeyWhereUniqueInput
  }

  /**
   * PartnerApiKey updateMany
   */
  export type PartnerApiKeyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PartnerApiKeys.
     */
    data: XOR<PartnerApiKeyUpdateManyMutationInput, PartnerApiKeyUncheckedUpdateManyInput>
    /**
     * Filter which PartnerApiKeys to update
     */
    where?: PartnerApiKeyWhereInput
  }

  /**
   * PartnerApiKey upsert
   */
  export type PartnerApiKeyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    /**
     * The filter to search for the PartnerApiKey to update in case it exists.
     */
    where: PartnerApiKeyWhereUniqueInput
    /**
     * In case the PartnerApiKey found by the `where` argument doesn't exist, create a new PartnerApiKey with this data.
     */
    create: XOR<PartnerApiKeyCreateInput, PartnerApiKeyUncheckedCreateInput>
    /**
     * In case the PartnerApiKey was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PartnerApiKeyUpdateInput, PartnerApiKeyUncheckedUpdateInput>
  }

  /**
   * PartnerApiKey delete
   */
  export type PartnerApiKeyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    /**
     * Filter which PartnerApiKey to delete.
     */
    where: PartnerApiKeyWhereUniqueInput
  }

  /**
   * PartnerApiKey deleteMany
   */
  export type PartnerApiKeyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerApiKeys to delete
     */
    where?: PartnerApiKeyWhereInput
  }

  /**
   * PartnerApiKey.calls
   */
  export type PartnerApiKey$callsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    where?: PartnerApiCallWhereInput
    orderBy?: PartnerApiCallOrderByWithRelationInput | PartnerApiCallOrderByWithRelationInput[]
    cursor?: PartnerApiCallWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PartnerApiCallScalarFieldEnum | PartnerApiCallScalarFieldEnum[]
  }

  /**
   * PartnerApiKey without action
   */
  export type PartnerApiKeyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
  }


  /**
   * Model PartnerNewCallerBooking
   */

  export type AggregatePartnerNewCallerBooking = {
    _count: PartnerNewCallerBookingCountAggregateOutputType | null
    _min: PartnerNewCallerBookingMinAggregateOutputType | null
    _max: PartnerNewCallerBookingMaxAggregateOutputType | null
  }

  export type PartnerNewCallerBookingMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    phoneSuffix: string | null
    customerId: string | null
    createdAt: Date | null
  }

  export type PartnerNewCallerBookingMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    phoneSuffix: string | null
    customerId: string | null
    createdAt: Date | null
  }

  export type PartnerNewCallerBookingCountAggregateOutputType = {
    id: number
    companyId: number
    phoneSuffix: number
    customerId: number
    createdAt: number
    _all: number
  }


  export type PartnerNewCallerBookingMinAggregateInputType = {
    id?: true
    companyId?: true
    phoneSuffix?: true
    customerId?: true
    createdAt?: true
  }

  export type PartnerNewCallerBookingMaxAggregateInputType = {
    id?: true
    companyId?: true
    phoneSuffix?: true
    customerId?: true
    createdAt?: true
  }

  export type PartnerNewCallerBookingCountAggregateInputType = {
    id?: true
    companyId?: true
    phoneSuffix?: true
    customerId?: true
    createdAt?: true
    _all?: true
  }

  export type PartnerNewCallerBookingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerNewCallerBooking to aggregate.
     */
    where?: PartnerNewCallerBookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerNewCallerBookings to fetch.
     */
    orderBy?: PartnerNewCallerBookingOrderByWithRelationInput | PartnerNewCallerBookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PartnerNewCallerBookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerNewCallerBookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerNewCallerBookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PartnerNewCallerBookings
    **/
    _count?: true | PartnerNewCallerBookingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PartnerNewCallerBookingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PartnerNewCallerBookingMaxAggregateInputType
  }

  export type GetPartnerNewCallerBookingAggregateType<T extends PartnerNewCallerBookingAggregateArgs> = {
        [P in keyof T & keyof AggregatePartnerNewCallerBooking]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePartnerNewCallerBooking[P]>
      : GetScalarType<T[P], AggregatePartnerNewCallerBooking[P]>
  }




  export type PartnerNewCallerBookingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PartnerNewCallerBookingWhereInput
    orderBy?: PartnerNewCallerBookingOrderByWithAggregationInput | PartnerNewCallerBookingOrderByWithAggregationInput[]
    by: PartnerNewCallerBookingScalarFieldEnum[] | PartnerNewCallerBookingScalarFieldEnum
    having?: PartnerNewCallerBookingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PartnerNewCallerBookingCountAggregateInputType | true
    _min?: PartnerNewCallerBookingMinAggregateInputType
    _max?: PartnerNewCallerBookingMaxAggregateInputType
  }

  export type PartnerNewCallerBookingGroupByOutputType = {
    id: string
    companyId: string
    phoneSuffix: string
    customerId: string | null
    createdAt: Date
    _count: PartnerNewCallerBookingCountAggregateOutputType | null
    _min: PartnerNewCallerBookingMinAggregateOutputType | null
    _max: PartnerNewCallerBookingMaxAggregateOutputType | null
  }

  type GetPartnerNewCallerBookingGroupByPayload<T extends PartnerNewCallerBookingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PartnerNewCallerBookingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PartnerNewCallerBookingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PartnerNewCallerBookingGroupByOutputType[P]>
            : GetScalarType<T[P], PartnerNewCallerBookingGroupByOutputType[P]>
        }
      >
    >


  export type PartnerNewCallerBookingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    phoneSuffix?: boolean
    customerId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["partnerNewCallerBooking"]>

  export type PartnerNewCallerBookingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    phoneSuffix?: boolean
    customerId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["partnerNewCallerBooking"]>

  export type PartnerNewCallerBookingSelectScalar = {
    id?: boolean
    companyId?: boolean
    phoneSuffix?: boolean
    customerId?: boolean
    createdAt?: boolean
  }


  export type $PartnerNewCallerBookingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PartnerNewCallerBooking"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      /**
       * Trailing digits only — enough to rate-limit, and matches the same
       * normalisation the CRM caller lookup uses.
       */
      phoneSuffix: string
      customerId: string | null
      createdAt: Date
    }, ExtArgs["result"]["partnerNewCallerBooking"]>
    composites: {}
  }

  type PartnerNewCallerBookingGetPayload<S extends boolean | null | undefined | PartnerNewCallerBookingDefaultArgs> = $Result.GetResult<Prisma.$PartnerNewCallerBookingPayload, S>

  type PartnerNewCallerBookingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PartnerNewCallerBookingFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PartnerNewCallerBookingCountAggregateInputType | true
    }

  export interface PartnerNewCallerBookingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PartnerNewCallerBooking'], meta: { name: 'PartnerNewCallerBooking' } }
    /**
     * Find zero or one PartnerNewCallerBooking that matches the filter.
     * @param {PartnerNewCallerBookingFindUniqueArgs} args - Arguments to find a PartnerNewCallerBooking
     * @example
     * // Get one PartnerNewCallerBooking
     * const partnerNewCallerBooking = await prisma.partnerNewCallerBooking.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PartnerNewCallerBookingFindUniqueArgs>(args: SelectSubset<T, PartnerNewCallerBookingFindUniqueArgs<ExtArgs>>): Prisma__PartnerNewCallerBookingClient<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PartnerNewCallerBooking that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PartnerNewCallerBookingFindUniqueOrThrowArgs} args - Arguments to find a PartnerNewCallerBooking
     * @example
     * // Get one PartnerNewCallerBooking
     * const partnerNewCallerBooking = await prisma.partnerNewCallerBooking.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PartnerNewCallerBookingFindUniqueOrThrowArgs>(args: SelectSubset<T, PartnerNewCallerBookingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PartnerNewCallerBookingClient<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PartnerNewCallerBooking that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerNewCallerBookingFindFirstArgs} args - Arguments to find a PartnerNewCallerBooking
     * @example
     * // Get one PartnerNewCallerBooking
     * const partnerNewCallerBooking = await prisma.partnerNewCallerBooking.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PartnerNewCallerBookingFindFirstArgs>(args?: SelectSubset<T, PartnerNewCallerBookingFindFirstArgs<ExtArgs>>): Prisma__PartnerNewCallerBookingClient<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PartnerNewCallerBooking that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerNewCallerBookingFindFirstOrThrowArgs} args - Arguments to find a PartnerNewCallerBooking
     * @example
     * // Get one PartnerNewCallerBooking
     * const partnerNewCallerBooking = await prisma.partnerNewCallerBooking.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PartnerNewCallerBookingFindFirstOrThrowArgs>(args?: SelectSubset<T, PartnerNewCallerBookingFindFirstOrThrowArgs<ExtArgs>>): Prisma__PartnerNewCallerBookingClient<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PartnerNewCallerBookings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerNewCallerBookingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PartnerNewCallerBookings
     * const partnerNewCallerBookings = await prisma.partnerNewCallerBooking.findMany()
     * 
     * // Get first 10 PartnerNewCallerBookings
     * const partnerNewCallerBookings = await prisma.partnerNewCallerBooking.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const partnerNewCallerBookingWithIdOnly = await prisma.partnerNewCallerBooking.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PartnerNewCallerBookingFindManyArgs>(args?: SelectSubset<T, PartnerNewCallerBookingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PartnerNewCallerBooking.
     * @param {PartnerNewCallerBookingCreateArgs} args - Arguments to create a PartnerNewCallerBooking.
     * @example
     * // Create one PartnerNewCallerBooking
     * const PartnerNewCallerBooking = await prisma.partnerNewCallerBooking.create({
     *   data: {
     *     // ... data to create a PartnerNewCallerBooking
     *   }
     * })
     * 
     */
    create<T extends PartnerNewCallerBookingCreateArgs>(args: SelectSubset<T, PartnerNewCallerBookingCreateArgs<ExtArgs>>): Prisma__PartnerNewCallerBookingClient<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PartnerNewCallerBookings.
     * @param {PartnerNewCallerBookingCreateManyArgs} args - Arguments to create many PartnerNewCallerBookings.
     * @example
     * // Create many PartnerNewCallerBookings
     * const partnerNewCallerBooking = await prisma.partnerNewCallerBooking.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PartnerNewCallerBookingCreateManyArgs>(args?: SelectSubset<T, PartnerNewCallerBookingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PartnerNewCallerBookings and returns the data saved in the database.
     * @param {PartnerNewCallerBookingCreateManyAndReturnArgs} args - Arguments to create many PartnerNewCallerBookings.
     * @example
     * // Create many PartnerNewCallerBookings
     * const partnerNewCallerBooking = await prisma.partnerNewCallerBooking.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PartnerNewCallerBookings and only return the `id`
     * const partnerNewCallerBookingWithIdOnly = await prisma.partnerNewCallerBooking.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PartnerNewCallerBookingCreateManyAndReturnArgs>(args?: SelectSubset<T, PartnerNewCallerBookingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PartnerNewCallerBooking.
     * @param {PartnerNewCallerBookingDeleteArgs} args - Arguments to delete one PartnerNewCallerBooking.
     * @example
     * // Delete one PartnerNewCallerBooking
     * const PartnerNewCallerBooking = await prisma.partnerNewCallerBooking.delete({
     *   where: {
     *     // ... filter to delete one PartnerNewCallerBooking
     *   }
     * })
     * 
     */
    delete<T extends PartnerNewCallerBookingDeleteArgs>(args: SelectSubset<T, PartnerNewCallerBookingDeleteArgs<ExtArgs>>): Prisma__PartnerNewCallerBookingClient<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PartnerNewCallerBooking.
     * @param {PartnerNewCallerBookingUpdateArgs} args - Arguments to update one PartnerNewCallerBooking.
     * @example
     * // Update one PartnerNewCallerBooking
     * const partnerNewCallerBooking = await prisma.partnerNewCallerBooking.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PartnerNewCallerBookingUpdateArgs>(args: SelectSubset<T, PartnerNewCallerBookingUpdateArgs<ExtArgs>>): Prisma__PartnerNewCallerBookingClient<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PartnerNewCallerBookings.
     * @param {PartnerNewCallerBookingDeleteManyArgs} args - Arguments to filter PartnerNewCallerBookings to delete.
     * @example
     * // Delete a few PartnerNewCallerBookings
     * const { count } = await prisma.partnerNewCallerBooking.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PartnerNewCallerBookingDeleteManyArgs>(args?: SelectSubset<T, PartnerNewCallerBookingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PartnerNewCallerBookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerNewCallerBookingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PartnerNewCallerBookings
     * const partnerNewCallerBooking = await prisma.partnerNewCallerBooking.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PartnerNewCallerBookingUpdateManyArgs>(args: SelectSubset<T, PartnerNewCallerBookingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PartnerNewCallerBooking.
     * @param {PartnerNewCallerBookingUpsertArgs} args - Arguments to update or create a PartnerNewCallerBooking.
     * @example
     * // Update or create a PartnerNewCallerBooking
     * const partnerNewCallerBooking = await prisma.partnerNewCallerBooking.upsert({
     *   create: {
     *     // ... data to create a PartnerNewCallerBooking
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PartnerNewCallerBooking we want to update
     *   }
     * })
     */
    upsert<T extends PartnerNewCallerBookingUpsertArgs>(args: SelectSubset<T, PartnerNewCallerBookingUpsertArgs<ExtArgs>>): Prisma__PartnerNewCallerBookingClient<$Result.GetResult<Prisma.$PartnerNewCallerBookingPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PartnerNewCallerBookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerNewCallerBookingCountArgs} args - Arguments to filter PartnerNewCallerBookings to count.
     * @example
     * // Count the number of PartnerNewCallerBookings
     * const count = await prisma.partnerNewCallerBooking.count({
     *   where: {
     *     // ... the filter for the PartnerNewCallerBookings we want to count
     *   }
     * })
    **/
    count<T extends PartnerNewCallerBookingCountArgs>(
      args?: Subset<T, PartnerNewCallerBookingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PartnerNewCallerBookingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PartnerNewCallerBooking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerNewCallerBookingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PartnerNewCallerBookingAggregateArgs>(args: Subset<T, PartnerNewCallerBookingAggregateArgs>): Prisma.PrismaPromise<GetPartnerNewCallerBookingAggregateType<T>>

    /**
     * Group by PartnerNewCallerBooking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerNewCallerBookingGroupByArgs} args - Group by arguments.
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
      T extends PartnerNewCallerBookingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PartnerNewCallerBookingGroupByArgs['orderBy'] }
        : { orderBy?: PartnerNewCallerBookingGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PartnerNewCallerBookingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPartnerNewCallerBookingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PartnerNewCallerBooking model
   */
  readonly fields: PartnerNewCallerBookingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PartnerNewCallerBooking.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PartnerNewCallerBookingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the PartnerNewCallerBooking model
   */ 
  interface PartnerNewCallerBookingFieldRefs {
    readonly id: FieldRef<"PartnerNewCallerBooking", 'String'>
    readonly companyId: FieldRef<"PartnerNewCallerBooking", 'String'>
    readonly phoneSuffix: FieldRef<"PartnerNewCallerBooking", 'String'>
    readonly customerId: FieldRef<"PartnerNewCallerBooking", 'String'>
    readonly createdAt: FieldRef<"PartnerNewCallerBooking", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PartnerNewCallerBooking findUnique
   */
  export type PartnerNewCallerBookingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
    /**
     * Filter, which PartnerNewCallerBooking to fetch.
     */
    where: PartnerNewCallerBookingWhereUniqueInput
  }

  /**
   * PartnerNewCallerBooking findUniqueOrThrow
   */
  export type PartnerNewCallerBookingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
    /**
     * Filter, which PartnerNewCallerBooking to fetch.
     */
    where: PartnerNewCallerBookingWhereUniqueInput
  }

  /**
   * PartnerNewCallerBooking findFirst
   */
  export type PartnerNewCallerBookingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
    /**
     * Filter, which PartnerNewCallerBooking to fetch.
     */
    where?: PartnerNewCallerBookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerNewCallerBookings to fetch.
     */
    orderBy?: PartnerNewCallerBookingOrderByWithRelationInput | PartnerNewCallerBookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerNewCallerBookings.
     */
    cursor?: PartnerNewCallerBookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerNewCallerBookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerNewCallerBookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerNewCallerBookings.
     */
    distinct?: PartnerNewCallerBookingScalarFieldEnum | PartnerNewCallerBookingScalarFieldEnum[]
  }

  /**
   * PartnerNewCallerBooking findFirstOrThrow
   */
  export type PartnerNewCallerBookingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
    /**
     * Filter, which PartnerNewCallerBooking to fetch.
     */
    where?: PartnerNewCallerBookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerNewCallerBookings to fetch.
     */
    orderBy?: PartnerNewCallerBookingOrderByWithRelationInput | PartnerNewCallerBookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerNewCallerBookings.
     */
    cursor?: PartnerNewCallerBookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerNewCallerBookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerNewCallerBookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerNewCallerBookings.
     */
    distinct?: PartnerNewCallerBookingScalarFieldEnum | PartnerNewCallerBookingScalarFieldEnum[]
  }

  /**
   * PartnerNewCallerBooking findMany
   */
  export type PartnerNewCallerBookingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
    /**
     * Filter, which PartnerNewCallerBookings to fetch.
     */
    where?: PartnerNewCallerBookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerNewCallerBookings to fetch.
     */
    orderBy?: PartnerNewCallerBookingOrderByWithRelationInput | PartnerNewCallerBookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PartnerNewCallerBookings.
     */
    cursor?: PartnerNewCallerBookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerNewCallerBookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerNewCallerBookings.
     */
    skip?: number
    distinct?: PartnerNewCallerBookingScalarFieldEnum | PartnerNewCallerBookingScalarFieldEnum[]
  }

  /**
   * PartnerNewCallerBooking create
   */
  export type PartnerNewCallerBookingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
    /**
     * The data needed to create a PartnerNewCallerBooking.
     */
    data: XOR<PartnerNewCallerBookingCreateInput, PartnerNewCallerBookingUncheckedCreateInput>
  }

  /**
   * PartnerNewCallerBooking createMany
   */
  export type PartnerNewCallerBookingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PartnerNewCallerBookings.
     */
    data: PartnerNewCallerBookingCreateManyInput | PartnerNewCallerBookingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PartnerNewCallerBooking createManyAndReturn
   */
  export type PartnerNewCallerBookingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PartnerNewCallerBookings.
     */
    data: PartnerNewCallerBookingCreateManyInput | PartnerNewCallerBookingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PartnerNewCallerBooking update
   */
  export type PartnerNewCallerBookingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
    /**
     * The data needed to update a PartnerNewCallerBooking.
     */
    data: XOR<PartnerNewCallerBookingUpdateInput, PartnerNewCallerBookingUncheckedUpdateInput>
    /**
     * Choose, which PartnerNewCallerBooking to update.
     */
    where: PartnerNewCallerBookingWhereUniqueInput
  }

  /**
   * PartnerNewCallerBooking updateMany
   */
  export type PartnerNewCallerBookingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PartnerNewCallerBookings.
     */
    data: XOR<PartnerNewCallerBookingUpdateManyMutationInput, PartnerNewCallerBookingUncheckedUpdateManyInput>
    /**
     * Filter which PartnerNewCallerBookings to update
     */
    where?: PartnerNewCallerBookingWhereInput
  }

  /**
   * PartnerNewCallerBooking upsert
   */
  export type PartnerNewCallerBookingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
    /**
     * The filter to search for the PartnerNewCallerBooking to update in case it exists.
     */
    where: PartnerNewCallerBookingWhereUniqueInput
    /**
     * In case the PartnerNewCallerBooking found by the `where` argument doesn't exist, create a new PartnerNewCallerBooking with this data.
     */
    create: XOR<PartnerNewCallerBookingCreateInput, PartnerNewCallerBookingUncheckedCreateInput>
    /**
     * In case the PartnerNewCallerBooking was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PartnerNewCallerBookingUpdateInput, PartnerNewCallerBookingUncheckedUpdateInput>
  }

  /**
   * PartnerNewCallerBooking delete
   */
  export type PartnerNewCallerBookingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
    /**
     * Filter which PartnerNewCallerBooking to delete.
     */
    where: PartnerNewCallerBookingWhereUniqueInput
  }

  /**
   * PartnerNewCallerBooking deleteMany
   */
  export type PartnerNewCallerBookingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerNewCallerBookings to delete
     */
    where?: PartnerNewCallerBookingWhereInput
  }

  /**
   * PartnerNewCallerBooking without action
   */
  export type PartnerNewCallerBookingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerNewCallerBooking
     */
    select?: PartnerNewCallerBookingSelect<ExtArgs> | null
  }


  /**
   * Model PartnerWebhook
   */

  export type AggregatePartnerWebhook = {
    _count: PartnerWebhookCountAggregateOutputType | null
    _avg: PartnerWebhookAvgAggregateOutputType | null
    _sum: PartnerWebhookSumAggregateOutputType | null
    _min: PartnerWebhookMinAggregateOutputType | null
    _max: PartnerWebhookMaxAggregateOutputType | null
  }

  export type PartnerWebhookAvgAggregateOutputType = {
    failureCount: number | null
  }

  export type PartnerWebhookSumAggregateOutputType = {
    failureCount: number | null
  }

  export type PartnerWebhookMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    apiKeyId: string | null
    url: string | null
    secret: string | null
    status: $Enums.WebhookStatus | null
    description: string | null
    failureCount: number | null
    lastSuccessAt: Date | null
    lastFailureAt: Date | null
    createdAt: Date | null
  }

  export type PartnerWebhookMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    apiKeyId: string | null
    url: string | null
    secret: string | null
    status: $Enums.WebhookStatus | null
    description: string | null
    failureCount: number | null
    lastSuccessAt: Date | null
    lastFailureAt: Date | null
    createdAt: Date | null
  }

  export type PartnerWebhookCountAggregateOutputType = {
    id: number
    companyId: number
    apiKeyId: number
    url: number
    secret: number
    events: number
    status: number
    description: number
    failureCount: number
    lastSuccessAt: number
    lastFailureAt: number
    createdAt: number
    _all: number
  }


  export type PartnerWebhookAvgAggregateInputType = {
    failureCount?: true
  }

  export type PartnerWebhookSumAggregateInputType = {
    failureCount?: true
  }

  export type PartnerWebhookMinAggregateInputType = {
    id?: true
    companyId?: true
    apiKeyId?: true
    url?: true
    secret?: true
    status?: true
    description?: true
    failureCount?: true
    lastSuccessAt?: true
    lastFailureAt?: true
    createdAt?: true
  }

  export type PartnerWebhookMaxAggregateInputType = {
    id?: true
    companyId?: true
    apiKeyId?: true
    url?: true
    secret?: true
    status?: true
    description?: true
    failureCount?: true
    lastSuccessAt?: true
    lastFailureAt?: true
    createdAt?: true
  }

  export type PartnerWebhookCountAggregateInputType = {
    id?: true
    companyId?: true
    apiKeyId?: true
    url?: true
    secret?: true
    events?: true
    status?: true
    description?: true
    failureCount?: true
    lastSuccessAt?: true
    lastFailureAt?: true
    createdAt?: true
    _all?: true
  }

  export type PartnerWebhookAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerWebhook to aggregate.
     */
    where?: PartnerWebhookWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerWebhooks to fetch.
     */
    orderBy?: PartnerWebhookOrderByWithRelationInput | PartnerWebhookOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PartnerWebhookWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerWebhooks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerWebhooks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PartnerWebhooks
    **/
    _count?: true | PartnerWebhookCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PartnerWebhookAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PartnerWebhookSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PartnerWebhookMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PartnerWebhookMaxAggregateInputType
  }

  export type GetPartnerWebhookAggregateType<T extends PartnerWebhookAggregateArgs> = {
        [P in keyof T & keyof AggregatePartnerWebhook]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePartnerWebhook[P]>
      : GetScalarType<T[P], AggregatePartnerWebhook[P]>
  }




  export type PartnerWebhookGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PartnerWebhookWhereInput
    orderBy?: PartnerWebhookOrderByWithAggregationInput | PartnerWebhookOrderByWithAggregationInput[]
    by: PartnerWebhookScalarFieldEnum[] | PartnerWebhookScalarFieldEnum
    having?: PartnerWebhookScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PartnerWebhookCountAggregateInputType | true
    _avg?: PartnerWebhookAvgAggregateInputType
    _sum?: PartnerWebhookSumAggregateInputType
    _min?: PartnerWebhookMinAggregateInputType
    _max?: PartnerWebhookMaxAggregateInputType
  }

  export type PartnerWebhookGroupByOutputType = {
    id: string
    companyId: string
    apiKeyId: string | null
    url: string
    secret: string
    events: string[]
    status: $Enums.WebhookStatus
    description: string | null
    failureCount: number
    lastSuccessAt: Date | null
    lastFailureAt: Date | null
    createdAt: Date
    _count: PartnerWebhookCountAggregateOutputType | null
    _avg: PartnerWebhookAvgAggregateOutputType | null
    _sum: PartnerWebhookSumAggregateOutputType | null
    _min: PartnerWebhookMinAggregateOutputType | null
    _max: PartnerWebhookMaxAggregateOutputType | null
  }

  type GetPartnerWebhookGroupByPayload<T extends PartnerWebhookGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PartnerWebhookGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PartnerWebhookGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PartnerWebhookGroupByOutputType[P]>
            : GetScalarType<T[P], PartnerWebhookGroupByOutputType[P]>
        }
      >
    >


  export type PartnerWebhookSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    apiKeyId?: boolean
    url?: boolean
    secret?: boolean
    events?: boolean
    status?: boolean
    description?: boolean
    failureCount?: boolean
    lastSuccessAt?: boolean
    lastFailureAt?: boolean
    createdAt?: boolean
    deliveries?: boolean | PartnerWebhook$deliveriesArgs<ExtArgs>
    _count?: boolean | PartnerWebhookCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["partnerWebhook"]>

  export type PartnerWebhookSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    apiKeyId?: boolean
    url?: boolean
    secret?: boolean
    events?: boolean
    status?: boolean
    description?: boolean
    failureCount?: boolean
    lastSuccessAt?: boolean
    lastFailureAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["partnerWebhook"]>

  export type PartnerWebhookSelectScalar = {
    id?: boolean
    companyId?: boolean
    apiKeyId?: boolean
    url?: boolean
    secret?: boolean
    events?: boolean
    status?: boolean
    description?: boolean
    failureCount?: boolean
    lastSuccessAt?: boolean
    lastFailureAt?: boolean
    createdAt?: boolean
  }

  export type PartnerWebhookInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    deliveries?: boolean | PartnerWebhook$deliveriesArgs<ExtArgs>
    _count?: boolean | PartnerWebhookCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PartnerWebhookIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PartnerWebhookPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PartnerWebhook"
    objects: {
      deliveries: Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      apiKeyId: string | null
      url: string
      /**
       * Shared secret for the HMAC signature on every delivery. Returned once at
       * registration so the partner can verify payloads really came from us.
       */
      secret: string
      events: string[]
      status: $Enums.WebhookStatus
      description: string | null
      failureCount: number
      lastSuccessAt: Date | null
      lastFailureAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["partnerWebhook"]>
    composites: {}
  }

  type PartnerWebhookGetPayload<S extends boolean | null | undefined | PartnerWebhookDefaultArgs> = $Result.GetResult<Prisma.$PartnerWebhookPayload, S>

  type PartnerWebhookCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PartnerWebhookFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PartnerWebhookCountAggregateInputType | true
    }

  export interface PartnerWebhookDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PartnerWebhook'], meta: { name: 'PartnerWebhook' } }
    /**
     * Find zero or one PartnerWebhook that matches the filter.
     * @param {PartnerWebhookFindUniqueArgs} args - Arguments to find a PartnerWebhook
     * @example
     * // Get one PartnerWebhook
     * const partnerWebhook = await prisma.partnerWebhook.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PartnerWebhookFindUniqueArgs>(args: SelectSubset<T, PartnerWebhookFindUniqueArgs<ExtArgs>>): Prisma__PartnerWebhookClient<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PartnerWebhook that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PartnerWebhookFindUniqueOrThrowArgs} args - Arguments to find a PartnerWebhook
     * @example
     * // Get one PartnerWebhook
     * const partnerWebhook = await prisma.partnerWebhook.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PartnerWebhookFindUniqueOrThrowArgs>(args: SelectSubset<T, PartnerWebhookFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PartnerWebhookClient<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PartnerWebhook that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookFindFirstArgs} args - Arguments to find a PartnerWebhook
     * @example
     * // Get one PartnerWebhook
     * const partnerWebhook = await prisma.partnerWebhook.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PartnerWebhookFindFirstArgs>(args?: SelectSubset<T, PartnerWebhookFindFirstArgs<ExtArgs>>): Prisma__PartnerWebhookClient<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PartnerWebhook that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookFindFirstOrThrowArgs} args - Arguments to find a PartnerWebhook
     * @example
     * // Get one PartnerWebhook
     * const partnerWebhook = await prisma.partnerWebhook.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PartnerWebhookFindFirstOrThrowArgs>(args?: SelectSubset<T, PartnerWebhookFindFirstOrThrowArgs<ExtArgs>>): Prisma__PartnerWebhookClient<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PartnerWebhooks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PartnerWebhooks
     * const partnerWebhooks = await prisma.partnerWebhook.findMany()
     * 
     * // Get first 10 PartnerWebhooks
     * const partnerWebhooks = await prisma.partnerWebhook.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const partnerWebhookWithIdOnly = await prisma.partnerWebhook.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PartnerWebhookFindManyArgs>(args?: SelectSubset<T, PartnerWebhookFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PartnerWebhook.
     * @param {PartnerWebhookCreateArgs} args - Arguments to create a PartnerWebhook.
     * @example
     * // Create one PartnerWebhook
     * const PartnerWebhook = await prisma.partnerWebhook.create({
     *   data: {
     *     // ... data to create a PartnerWebhook
     *   }
     * })
     * 
     */
    create<T extends PartnerWebhookCreateArgs>(args: SelectSubset<T, PartnerWebhookCreateArgs<ExtArgs>>): Prisma__PartnerWebhookClient<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PartnerWebhooks.
     * @param {PartnerWebhookCreateManyArgs} args - Arguments to create many PartnerWebhooks.
     * @example
     * // Create many PartnerWebhooks
     * const partnerWebhook = await prisma.partnerWebhook.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PartnerWebhookCreateManyArgs>(args?: SelectSubset<T, PartnerWebhookCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PartnerWebhooks and returns the data saved in the database.
     * @param {PartnerWebhookCreateManyAndReturnArgs} args - Arguments to create many PartnerWebhooks.
     * @example
     * // Create many PartnerWebhooks
     * const partnerWebhook = await prisma.partnerWebhook.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PartnerWebhooks and only return the `id`
     * const partnerWebhookWithIdOnly = await prisma.partnerWebhook.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PartnerWebhookCreateManyAndReturnArgs>(args?: SelectSubset<T, PartnerWebhookCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PartnerWebhook.
     * @param {PartnerWebhookDeleteArgs} args - Arguments to delete one PartnerWebhook.
     * @example
     * // Delete one PartnerWebhook
     * const PartnerWebhook = await prisma.partnerWebhook.delete({
     *   where: {
     *     // ... filter to delete one PartnerWebhook
     *   }
     * })
     * 
     */
    delete<T extends PartnerWebhookDeleteArgs>(args: SelectSubset<T, PartnerWebhookDeleteArgs<ExtArgs>>): Prisma__PartnerWebhookClient<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PartnerWebhook.
     * @param {PartnerWebhookUpdateArgs} args - Arguments to update one PartnerWebhook.
     * @example
     * // Update one PartnerWebhook
     * const partnerWebhook = await prisma.partnerWebhook.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PartnerWebhookUpdateArgs>(args: SelectSubset<T, PartnerWebhookUpdateArgs<ExtArgs>>): Prisma__PartnerWebhookClient<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PartnerWebhooks.
     * @param {PartnerWebhookDeleteManyArgs} args - Arguments to filter PartnerWebhooks to delete.
     * @example
     * // Delete a few PartnerWebhooks
     * const { count } = await prisma.partnerWebhook.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PartnerWebhookDeleteManyArgs>(args?: SelectSubset<T, PartnerWebhookDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PartnerWebhooks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PartnerWebhooks
     * const partnerWebhook = await prisma.partnerWebhook.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PartnerWebhookUpdateManyArgs>(args: SelectSubset<T, PartnerWebhookUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PartnerWebhook.
     * @param {PartnerWebhookUpsertArgs} args - Arguments to update or create a PartnerWebhook.
     * @example
     * // Update or create a PartnerWebhook
     * const partnerWebhook = await prisma.partnerWebhook.upsert({
     *   create: {
     *     // ... data to create a PartnerWebhook
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PartnerWebhook we want to update
     *   }
     * })
     */
    upsert<T extends PartnerWebhookUpsertArgs>(args: SelectSubset<T, PartnerWebhookUpsertArgs<ExtArgs>>): Prisma__PartnerWebhookClient<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PartnerWebhooks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookCountArgs} args - Arguments to filter PartnerWebhooks to count.
     * @example
     * // Count the number of PartnerWebhooks
     * const count = await prisma.partnerWebhook.count({
     *   where: {
     *     // ... the filter for the PartnerWebhooks we want to count
     *   }
     * })
    **/
    count<T extends PartnerWebhookCountArgs>(
      args?: Subset<T, PartnerWebhookCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PartnerWebhookCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PartnerWebhook.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PartnerWebhookAggregateArgs>(args: Subset<T, PartnerWebhookAggregateArgs>): Prisma.PrismaPromise<GetPartnerWebhookAggregateType<T>>

    /**
     * Group by PartnerWebhook.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookGroupByArgs} args - Group by arguments.
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
      T extends PartnerWebhookGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PartnerWebhookGroupByArgs['orderBy'] }
        : { orderBy?: PartnerWebhookGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PartnerWebhookGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPartnerWebhookGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PartnerWebhook model
   */
  readonly fields: PartnerWebhookFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PartnerWebhook.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PartnerWebhookClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    deliveries<T extends PartnerWebhook$deliveriesArgs<ExtArgs> = {}>(args?: Subset<T, PartnerWebhook$deliveriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the PartnerWebhook model
   */ 
  interface PartnerWebhookFieldRefs {
    readonly id: FieldRef<"PartnerWebhook", 'String'>
    readonly companyId: FieldRef<"PartnerWebhook", 'String'>
    readonly apiKeyId: FieldRef<"PartnerWebhook", 'String'>
    readonly url: FieldRef<"PartnerWebhook", 'String'>
    readonly secret: FieldRef<"PartnerWebhook", 'String'>
    readonly events: FieldRef<"PartnerWebhook", 'String[]'>
    readonly status: FieldRef<"PartnerWebhook", 'WebhookStatus'>
    readonly description: FieldRef<"PartnerWebhook", 'String'>
    readonly failureCount: FieldRef<"PartnerWebhook", 'Int'>
    readonly lastSuccessAt: FieldRef<"PartnerWebhook", 'DateTime'>
    readonly lastFailureAt: FieldRef<"PartnerWebhook", 'DateTime'>
    readonly createdAt: FieldRef<"PartnerWebhook", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PartnerWebhook findUnique
   */
  export type PartnerWebhookFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhook to fetch.
     */
    where: PartnerWebhookWhereUniqueInput
  }

  /**
   * PartnerWebhook findUniqueOrThrow
   */
  export type PartnerWebhookFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhook to fetch.
     */
    where: PartnerWebhookWhereUniqueInput
  }

  /**
   * PartnerWebhook findFirst
   */
  export type PartnerWebhookFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhook to fetch.
     */
    where?: PartnerWebhookWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerWebhooks to fetch.
     */
    orderBy?: PartnerWebhookOrderByWithRelationInput | PartnerWebhookOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerWebhooks.
     */
    cursor?: PartnerWebhookWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerWebhooks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerWebhooks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerWebhooks.
     */
    distinct?: PartnerWebhookScalarFieldEnum | PartnerWebhookScalarFieldEnum[]
  }

  /**
   * PartnerWebhook findFirstOrThrow
   */
  export type PartnerWebhookFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhook to fetch.
     */
    where?: PartnerWebhookWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerWebhooks to fetch.
     */
    orderBy?: PartnerWebhookOrderByWithRelationInput | PartnerWebhookOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerWebhooks.
     */
    cursor?: PartnerWebhookWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerWebhooks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerWebhooks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerWebhooks.
     */
    distinct?: PartnerWebhookScalarFieldEnum | PartnerWebhookScalarFieldEnum[]
  }

  /**
   * PartnerWebhook findMany
   */
  export type PartnerWebhookFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhooks to fetch.
     */
    where?: PartnerWebhookWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerWebhooks to fetch.
     */
    orderBy?: PartnerWebhookOrderByWithRelationInput | PartnerWebhookOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PartnerWebhooks.
     */
    cursor?: PartnerWebhookWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerWebhooks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerWebhooks.
     */
    skip?: number
    distinct?: PartnerWebhookScalarFieldEnum | PartnerWebhookScalarFieldEnum[]
  }

  /**
   * PartnerWebhook create
   */
  export type PartnerWebhookCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
    /**
     * The data needed to create a PartnerWebhook.
     */
    data: XOR<PartnerWebhookCreateInput, PartnerWebhookUncheckedCreateInput>
  }

  /**
   * PartnerWebhook createMany
   */
  export type PartnerWebhookCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PartnerWebhooks.
     */
    data: PartnerWebhookCreateManyInput | PartnerWebhookCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PartnerWebhook createManyAndReturn
   */
  export type PartnerWebhookCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PartnerWebhooks.
     */
    data: PartnerWebhookCreateManyInput | PartnerWebhookCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PartnerWebhook update
   */
  export type PartnerWebhookUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
    /**
     * The data needed to update a PartnerWebhook.
     */
    data: XOR<PartnerWebhookUpdateInput, PartnerWebhookUncheckedUpdateInput>
    /**
     * Choose, which PartnerWebhook to update.
     */
    where: PartnerWebhookWhereUniqueInput
  }

  /**
   * PartnerWebhook updateMany
   */
  export type PartnerWebhookUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PartnerWebhooks.
     */
    data: XOR<PartnerWebhookUpdateManyMutationInput, PartnerWebhookUncheckedUpdateManyInput>
    /**
     * Filter which PartnerWebhooks to update
     */
    where?: PartnerWebhookWhereInput
  }

  /**
   * PartnerWebhook upsert
   */
  export type PartnerWebhookUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
    /**
     * The filter to search for the PartnerWebhook to update in case it exists.
     */
    where: PartnerWebhookWhereUniqueInput
    /**
     * In case the PartnerWebhook found by the `where` argument doesn't exist, create a new PartnerWebhook with this data.
     */
    create: XOR<PartnerWebhookCreateInput, PartnerWebhookUncheckedCreateInput>
    /**
     * In case the PartnerWebhook was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PartnerWebhookUpdateInput, PartnerWebhookUncheckedUpdateInput>
  }

  /**
   * PartnerWebhook delete
   */
  export type PartnerWebhookDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
    /**
     * Filter which PartnerWebhook to delete.
     */
    where: PartnerWebhookWhereUniqueInput
  }

  /**
   * PartnerWebhook deleteMany
   */
  export type PartnerWebhookDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerWebhooks to delete
     */
    where?: PartnerWebhookWhereInput
  }

  /**
   * PartnerWebhook.deliveries
   */
  export type PartnerWebhook$deliveriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    where?: PartnerWebhookDeliveryWhereInput
    orderBy?: PartnerWebhookDeliveryOrderByWithRelationInput | PartnerWebhookDeliveryOrderByWithRelationInput[]
    cursor?: PartnerWebhookDeliveryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PartnerWebhookDeliveryScalarFieldEnum | PartnerWebhookDeliveryScalarFieldEnum[]
  }

  /**
   * PartnerWebhook without action
   */
  export type PartnerWebhookDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhook
     */
    select?: PartnerWebhookSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookInclude<ExtArgs> | null
  }


  /**
   * Model PartnerWebhookDelivery
   */

  export type AggregatePartnerWebhookDelivery = {
    _count: PartnerWebhookDeliveryCountAggregateOutputType | null
    _avg: PartnerWebhookDeliveryAvgAggregateOutputType | null
    _sum: PartnerWebhookDeliverySumAggregateOutputType | null
    _min: PartnerWebhookDeliveryMinAggregateOutputType | null
    _max: PartnerWebhookDeliveryMaxAggregateOutputType | null
  }

  export type PartnerWebhookDeliveryAvgAggregateOutputType = {
    attempt: number | null
    statusCode: number | null
    durationMs: number | null
  }

  export type PartnerWebhookDeliverySumAggregateOutputType = {
    attempt: number | null
    statusCode: number | null
    durationMs: number | null
  }

  export type PartnerWebhookDeliveryMinAggregateOutputType = {
    id: string | null
    webhookId: string | null
    companyId: string | null
    eventType: string | null
    entityId: string | null
    attempt: number | null
    statusCode: number | null
    success: boolean | null
    error: string | null
    durationMs: number | null
    createdAt: Date | null
  }

  export type PartnerWebhookDeliveryMaxAggregateOutputType = {
    id: string | null
    webhookId: string | null
    companyId: string | null
    eventType: string | null
    entityId: string | null
    attempt: number | null
    statusCode: number | null
    success: boolean | null
    error: string | null
    durationMs: number | null
    createdAt: Date | null
  }

  export type PartnerWebhookDeliveryCountAggregateOutputType = {
    id: number
    webhookId: number
    companyId: number
    eventType: number
    entityId: number
    attempt: number
    statusCode: number
    success: number
    error: number
    durationMs: number
    createdAt: number
    _all: number
  }


  export type PartnerWebhookDeliveryAvgAggregateInputType = {
    attempt?: true
    statusCode?: true
    durationMs?: true
  }

  export type PartnerWebhookDeliverySumAggregateInputType = {
    attempt?: true
    statusCode?: true
    durationMs?: true
  }

  export type PartnerWebhookDeliveryMinAggregateInputType = {
    id?: true
    webhookId?: true
    companyId?: true
    eventType?: true
    entityId?: true
    attempt?: true
    statusCode?: true
    success?: true
    error?: true
    durationMs?: true
    createdAt?: true
  }

  export type PartnerWebhookDeliveryMaxAggregateInputType = {
    id?: true
    webhookId?: true
    companyId?: true
    eventType?: true
    entityId?: true
    attempt?: true
    statusCode?: true
    success?: true
    error?: true
    durationMs?: true
    createdAt?: true
  }

  export type PartnerWebhookDeliveryCountAggregateInputType = {
    id?: true
    webhookId?: true
    companyId?: true
    eventType?: true
    entityId?: true
    attempt?: true
    statusCode?: true
    success?: true
    error?: true
    durationMs?: true
    createdAt?: true
    _all?: true
  }

  export type PartnerWebhookDeliveryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerWebhookDelivery to aggregate.
     */
    where?: PartnerWebhookDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerWebhookDeliveries to fetch.
     */
    orderBy?: PartnerWebhookDeliveryOrderByWithRelationInput | PartnerWebhookDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PartnerWebhookDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerWebhookDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerWebhookDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PartnerWebhookDeliveries
    **/
    _count?: true | PartnerWebhookDeliveryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PartnerWebhookDeliveryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PartnerWebhookDeliverySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PartnerWebhookDeliveryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PartnerWebhookDeliveryMaxAggregateInputType
  }

  export type GetPartnerWebhookDeliveryAggregateType<T extends PartnerWebhookDeliveryAggregateArgs> = {
        [P in keyof T & keyof AggregatePartnerWebhookDelivery]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePartnerWebhookDelivery[P]>
      : GetScalarType<T[P], AggregatePartnerWebhookDelivery[P]>
  }




  export type PartnerWebhookDeliveryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PartnerWebhookDeliveryWhereInput
    orderBy?: PartnerWebhookDeliveryOrderByWithAggregationInput | PartnerWebhookDeliveryOrderByWithAggregationInput[]
    by: PartnerWebhookDeliveryScalarFieldEnum[] | PartnerWebhookDeliveryScalarFieldEnum
    having?: PartnerWebhookDeliveryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PartnerWebhookDeliveryCountAggregateInputType | true
    _avg?: PartnerWebhookDeliveryAvgAggregateInputType
    _sum?: PartnerWebhookDeliverySumAggregateInputType
    _min?: PartnerWebhookDeliveryMinAggregateInputType
    _max?: PartnerWebhookDeliveryMaxAggregateInputType
  }

  export type PartnerWebhookDeliveryGroupByOutputType = {
    id: string
    webhookId: string
    companyId: string
    eventType: string
    entityId: string
    attempt: number
    statusCode: number | null
    success: boolean
    error: string | null
    durationMs: number | null
    createdAt: Date
    _count: PartnerWebhookDeliveryCountAggregateOutputType | null
    _avg: PartnerWebhookDeliveryAvgAggregateOutputType | null
    _sum: PartnerWebhookDeliverySumAggregateOutputType | null
    _min: PartnerWebhookDeliveryMinAggregateOutputType | null
    _max: PartnerWebhookDeliveryMaxAggregateOutputType | null
  }

  type GetPartnerWebhookDeliveryGroupByPayload<T extends PartnerWebhookDeliveryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PartnerWebhookDeliveryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PartnerWebhookDeliveryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PartnerWebhookDeliveryGroupByOutputType[P]>
            : GetScalarType<T[P], PartnerWebhookDeliveryGroupByOutputType[P]>
        }
      >
    >


  export type PartnerWebhookDeliverySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    webhookId?: boolean
    companyId?: boolean
    eventType?: boolean
    entityId?: boolean
    attempt?: boolean
    statusCode?: boolean
    success?: boolean
    error?: boolean
    durationMs?: boolean
    createdAt?: boolean
    webhook?: boolean | PartnerWebhookDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["partnerWebhookDelivery"]>

  export type PartnerWebhookDeliverySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    webhookId?: boolean
    companyId?: boolean
    eventType?: boolean
    entityId?: boolean
    attempt?: boolean
    statusCode?: boolean
    success?: boolean
    error?: boolean
    durationMs?: boolean
    createdAt?: boolean
    webhook?: boolean | PartnerWebhookDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["partnerWebhookDelivery"]>

  export type PartnerWebhookDeliverySelectScalar = {
    id?: boolean
    webhookId?: boolean
    companyId?: boolean
    eventType?: boolean
    entityId?: boolean
    attempt?: boolean
    statusCode?: boolean
    success?: boolean
    error?: boolean
    durationMs?: boolean
    createdAt?: boolean
  }

  export type PartnerWebhookDeliveryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    webhook?: boolean | PartnerWebhookDefaultArgs<ExtArgs>
  }
  export type PartnerWebhookDeliveryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    webhook?: boolean | PartnerWebhookDefaultArgs<ExtArgs>
  }

  export type $PartnerWebhookDeliveryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PartnerWebhookDelivery"
    objects: {
      webhook: Prisma.$PartnerWebhookPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      webhookId: string
      companyId: string
      eventType: string
      entityId: string
      attempt: number
      statusCode: number | null
      success: boolean
      error: string | null
      durationMs: number | null
      createdAt: Date
    }, ExtArgs["result"]["partnerWebhookDelivery"]>
    composites: {}
  }

  type PartnerWebhookDeliveryGetPayload<S extends boolean | null | undefined | PartnerWebhookDeliveryDefaultArgs> = $Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload, S>

  type PartnerWebhookDeliveryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PartnerWebhookDeliveryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PartnerWebhookDeliveryCountAggregateInputType | true
    }

  export interface PartnerWebhookDeliveryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PartnerWebhookDelivery'], meta: { name: 'PartnerWebhookDelivery' } }
    /**
     * Find zero or one PartnerWebhookDelivery that matches the filter.
     * @param {PartnerWebhookDeliveryFindUniqueArgs} args - Arguments to find a PartnerWebhookDelivery
     * @example
     * // Get one PartnerWebhookDelivery
     * const partnerWebhookDelivery = await prisma.partnerWebhookDelivery.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PartnerWebhookDeliveryFindUniqueArgs>(args: SelectSubset<T, PartnerWebhookDeliveryFindUniqueArgs<ExtArgs>>): Prisma__PartnerWebhookDeliveryClient<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PartnerWebhookDelivery that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PartnerWebhookDeliveryFindUniqueOrThrowArgs} args - Arguments to find a PartnerWebhookDelivery
     * @example
     * // Get one PartnerWebhookDelivery
     * const partnerWebhookDelivery = await prisma.partnerWebhookDelivery.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PartnerWebhookDeliveryFindUniqueOrThrowArgs>(args: SelectSubset<T, PartnerWebhookDeliveryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PartnerWebhookDeliveryClient<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PartnerWebhookDelivery that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookDeliveryFindFirstArgs} args - Arguments to find a PartnerWebhookDelivery
     * @example
     * // Get one PartnerWebhookDelivery
     * const partnerWebhookDelivery = await prisma.partnerWebhookDelivery.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PartnerWebhookDeliveryFindFirstArgs>(args?: SelectSubset<T, PartnerWebhookDeliveryFindFirstArgs<ExtArgs>>): Prisma__PartnerWebhookDeliveryClient<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PartnerWebhookDelivery that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookDeliveryFindFirstOrThrowArgs} args - Arguments to find a PartnerWebhookDelivery
     * @example
     * // Get one PartnerWebhookDelivery
     * const partnerWebhookDelivery = await prisma.partnerWebhookDelivery.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PartnerWebhookDeliveryFindFirstOrThrowArgs>(args?: SelectSubset<T, PartnerWebhookDeliveryFindFirstOrThrowArgs<ExtArgs>>): Prisma__PartnerWebhookDeliveryClient<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PartnerWebhookDeliveries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookDeliveryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PartnerWebhookDeliveries
     * const partnerWebhookDeliveries = await prisma.partnerWebhookDelivery.findMany()
     * 
     * // Get first 10 PartnerWebhookDeliveries
     * const partnerWebhookDeliveries = await prisma.partnerWebhookDelivery.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const partnerWebhookDeliveryWithIdOnly = await prisma.partnerWebhookDelivery.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PartnerWebhookDeliveryFindManyArgs>(args?: SelectSubset<T, PartnerWebhookDeliveryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PartnerWebhookDelivery.
     * @param {PartnerWebhookDeliveryCreateArgs} args - Arguments to create a PartnerWebhookDelivery.
     * @example
     * // Create one PartnerWebhookDelivery
     * const PartnerWebhookDelivery = await prisma.partnerWebhookDelivery.create({
     *   data: {
     *     // ... data to create a PartnerWebhookDelivery
     *   }
     * })
     * 
     */
    create<T extends PartnerWebhookDeliveryCreateArgs>(args: SelectSubset<T, PartnerWebhookDeliveryCreateArgs<ExtArgs>>): Prisma__PartnerWebhookDeliveryClient<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PartnerWebhookDeliveries.
     * @param {PartnerWebhookDeliveryCreateManyArgs} args - Arguments to create many PartnerWebhookDeliveries.
     * @example
     * // Create many PartnerWebhookDeliveries
     * const partnerWebhookDelivery = await prisma.partnerWebhookDelivery.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PartnerWebhookDeliveryCreateManyArgs>(args?: SelectSubset<T, PartnerWebhookDeliveryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PartnerWebhookDeliveries and returns the data saved in the database.
     * @param {PartnerWebhookDeliveryCreateManyAndReturnArgs} args - Arguments to create many PartnerWebhookDeliveries.
     * @example
     * // Create many PartnerWebhookDeliveries
     * const partnerWebhookDelivery = await prisma.partnerWebhookDelivery.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PartnerWebhookDeliveries and only return the `id`
     * const partnerWebhookDeliveryWithIdOnly = await prisma.partnerWebhookDelivery.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PartnerWebhookDeliveryCreateManyAndReturnArgs>(args?: SelectSubset<T, PartnerWebhookDeliveryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PartnerWebhookDelivery.
     * @param {PartnerWebhookDeliveryDeleteArgs} args - Arguments to delete one PartnerWebhookDelivery.
     * @example
     * // Delete one PartnerWebhookDelivery
     * const PartnerWebhookDelivery = await prisma.partnerWebhookDelivery.delete({
     *   where: {
     *     // ... filter to delete one PartnerWebhookDelivery
     *   }
     * })
     * 
     */
    delete<T extends PartnerWebhookDeliveryDeleteArgs>(args: SelectSubset<T, PartnerWebhookDeliveryDeleteArgs<ExtArgs>>): Prisma__PartnerWebhookDeliveryClient<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PartnerWebhookDelivery.
     * @param {PartnerWebhookDeliveryUpdateArgs} args - Arguments to update one PartnerWebhookDelivery.
     * @example
     * // Update one PartnerWebhookDelivery
     * const partnerWebhookDelivery = await prisma.partnerWebhookDelivery.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PartnerWebhookDeliveryUpdateArgs>(args: SelectSubset<T, PartnerWebhookDeliveryUpdateArgs<ExtArgs>>): Prisma__PartnerWebhookDeliveryClient<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PartnerWebhookDeliveries.
     * @param {PartnerWebhookDeliveryDeleteManyArgs} args - Arguments to filter PartnerWebhookDeliveries to delete.
     * @example
     * // Delete a few PartnerWebhookDeliveries
     * const { count } = await prisma.partnerWebhookDelivery.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PartnerWebhookDeliveryDeleteManyArgs>(args?: SelectSubset<T, PartnerWebhookDeliveryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PartnerWebhookDeliveries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookDeliveryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PartnerWebhookDeliveries
     * const partnerWebhookDelivery = await prisma.partnerWebhookDelivery.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PartnerWebhookDeliveryUpdateManyArgs>(args: SelectSubset<T, PartnerWebhookDeliveryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PartnerWebhookDelivery.
     * @param {PartnerWebhookDeliveryUpsertArgs} args - Arguments to update or create a PartnerWebhookDelivery.
     * @example
     * // Update or create a PartnerWebhookDelivery
     * const partnerWebhookDelivery = await prisma.partnerWebhookDelivery.upsert({
     *   create: {
     *     // ... data to create a PartnerWebhookDelivery
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PartnerWebhookDelivery we want to update
     *   }
     * })
     */
    upsert<T extends PartnerWebhookDeliveryUpsertArgs>(args: SelectSubset<T, PartnerWebhookDeliveryUpsertArgs<ExtArgs>>): Prisma__PartnerWebhookDeliveryClient<$Result.GetResult<Prisma.$PartnerWebhookDeliveryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PartnerWebhookDeliveries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookDeliveryCountArgs} args - Arguments to filter PartnerWebhookDeliveries to count.
     * @example
     * // Count the number of PartnerWebhookDeliveries
     * const count = await prisma.partnerWebhookDelivery.count({
     *   where: {
     *     // ... the filter for the PartnerWebhookDeliveries we want to count
     *   }
     * })
    **/
    count<T extends PartnerWebhookDeliveryCountArgs>(
      args?: Subset<T, PartnerWebhookDeliveryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PartnerWebhookDeliveryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PartnerWebhookDelivery.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookDeliveryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PartnerWebhookDeliveryAggregateArgs>(args: Subset<T, PartnerWebhookDeliveryAggregateArgs>): Prisma.PrismaPromise<GetPartnerWebhookDeliveryAggregateType<T>>

    /**
     * Group by PartnerWebhookDelivery.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerWebhookDeliveryGroupByArgs} args - Group by arguments.
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
      T extends PartnerWebhookDeliveryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PartnerWebhookDeliveryGroupByArgs['orderBy'] }
        : { orderBy?: PartnerWebhookDeliveryGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PartnerWebhookDeliveryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPartnerWebhookDeliveryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PartnerWebhookDelivery model
   */
  readonly fields: PartnerWebhookDeliveryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PartnerWebhookDelivery.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PartnerWebhookDeliveryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    webhook<T extends PartnerWebhookDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PartnerWebhookDefaultArgs<ExtArgs>>): Prisma__PartnerWebhookClient<$Result.GetResult<Prisma.$PartnerWebhookPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the PartnerWebhookDelivery model
   */ 
  interface PartnerWebhookDeliveryFieldRefs {
    readonly id: FieldRef<"PartnerWebhookDelivery", 'String'>
    readonly webhookId: FieldRef<"PartnerWebhookDelivery", 'String'>
    readonly companyId: FieldRef<"PartnerWebhookDelivery", 'String'>
    readonly eventType: FieldRef<"PartnerWebhookDelivery", 'String'>
    readonly entityId: FieldRef<"PartnerWebhookDelivery", 'String'>
    readonly attempt: FieldRef<"PartnerWebhookDelivery", 'Int'>
    readonly statusCode: FieldRef<"PartnerWebhookDelivery", 'Int'>
    readonly success: FieldRef<"PartnerWebhookDelivery", 'Boolean'>
    readonly error: FieldRef<"PartnerWebhookDelivery", 'String'>
    readonly durationMs: FieldRef<"PartnerWebhookDelivery", 'Int'>
    readonly createdAt: FieldRef<"PartnerWebhookDelivery", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PartnerWebhookDelivery findUnique
   */
  export type PartnerWebhookDeliveryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhookDelivery to fetch.
     */
    where: PartnerWebhookDeliveryWhereUniqueInput
  }

  /**
   * PartnerWebhookDelivery findUniqueOrThrow
   */
  export type PartnerWebhookDeliveryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhookDelivery to fetch.
     */
    where: PartnerWebhookDeliveryWhereUniqueInput
  }

  /**
   * PartnerWebhookDelivery findFirst
   */
  export type PartnerWebhookDeliveryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhookDelivery to fetch.
     */
    where?: PartnerWebhookDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerWebhookDeliveries to fetch.
     */
    orderBy?: PartnerWebhookDeliveryOrderByWithRelationInput | PartnerWebhookDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerWebhookDeliveries.
     */
    cursor?: PartnerWebhookDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerWebhookDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerWebhookDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerWebhookDeliveries.
     */
    distinct?: PartnerWebhookDeliveryScalarFieldEnum | PartnerWebhookDeliveryScalarFieldEnum[]
  }

  /**
   * PartnerWebhookDelivery findFirstOrThrow
   */
  export type PartnerWebhookDeliveryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhookDelivery to fetch.
     */
    where?: PartnerWebhookDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerWebhookDeliveries to fetch.
     */
    orderBy?: PartnerWebhookDeliveryOrderByWithRelationInput | PartnerWebhookDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerWebhookDeliveries.
     */
    cursor?: PartnerWebhookDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerWebhookDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerWebhookDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerWebhookDeliveries.
     */
    distinct?: PartnerWebhookDeliveryScalarFieldEnum | PartnerWebhookDeliveryScalarFieldEnum[]
  }

  /**
   * PartnerWebhookDelivery findMany
   */
  export type PartnerWebhookDeliveryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which PartnerWebhookDeliveries to fetch.
     */
    where?: PartnerWebhookDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerWebhookDeliveries to fetch.
     */
    orderBy?: PartnerWebhookDeliveryOrderByWithRelationInput | PartnerWebhookDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PartnerWebhookDeliveries.
     */
    cursor?: PartnerWebhookDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerWebhookDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerWebhookDeliveries.
     */
    skip?: number
    distinct?: PartnerWebhookDeliveryScalarFieldEnum | PartnerWebhookDeliveryScalarFieldEnum[]
  }

  /**
   * PartnerWebhookDelivery create
   */
  export type PartnerWebhookDeliveryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    /**
     * The data needed to create a PartnerWebhookDelivery.
     */
    data: XOR<PartnerWebhookDeliveryCreateInput, PartnerWebhookDeliveryUncheckedCreateInput>
  }

  /**
   * PartnerWebhookDelivery createMany
   */
  export type PartnerWebhookDeliveryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PartnerWebhookDeliveries.
     */
    data: PartnerWebhookDeliveryCreateManyInput | PartnerWebhookDeliveryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PartnerWebhookDelivery createManyAndReturn
   */
  export type PartnerWebhookDeliveryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PartnerWebhookDeliveries.
     */
    data: PartnerWebhookDeliveryCreateManyInput | PartnerWebhookDeliveryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PartnerWebhookDelivery update
   */
  export type PartnerWebhookDeliveryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    /**
     * The data needed to update a PartnerWebhookDelivery.
     */
    data: XOR<PartnerWebhookDeliveryUpdateInput, PartnerWebhookDeliveryUncheckedUpdateInput>
    /**
     * Choose, which PartnerWebhookDelivery to update.
     */
    where: PartnerWebhookDeliveryWhereUniqueInput
  }

  /**
   * PartnerWebhookDelivery updateMany
   */
  export type PartnerWebhookDeliveryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PartnerWebhookDeliveries.
     */
    data: XOR<PartnerWebhookDeliveryUpdateManyMutationInput, PartnerWebhookDeliveryUncheckedUpdateManyInput>
    /**
     * Filter which PartnerWebhookDeliveries to update
     */
    where?: PartnerWebhookDeliveryWhereInput
  }

  /**
   * PartnerWebhookDelivery upsert
   */
  export type PartnerWebhookDeliveryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    /**
     * The filter to search for the PartnerWebhookDelivery to update in case it exists.
     */
    where: PartnerWebhookDeliveryWhereUniqueInput
    /**
     * In case the PartnerWebhookDelivery found by the `where` argument doesn't exist, create a new PartnerWebhookDelivery with this data.
     */
    create: XOR<PartnerWebhookDeliveryCreateInput, PartnerWebhookDeliveryUncheckedCreateInput>
    /**
     * In case the PartnerWebhookDelivery was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PartnerWebhookDeliveryUpdateInput, PartnerWebhookDeliveryUncheckedUpdateInput>
  }

  /**
   * PartnerWebhookDelivery delete
   */
  export type PartnerWebhookDeliveryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
    /**
     * Filter which PartnerWebhookDelivery to delete.
     */
    where: PartnerWebhookDeliveryWhereUniqueInput
  }

  /**
   * PartnerWebhookDelivery deleteMany
   */
  export type PartnerWebhookDeliveryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerWebhookDeliveries to delete
     */
    where?: PartnerWebhookDeliveryWhereInput
  }

  /**
   * PartnerWebhookDelivery without action
   */
  export type PartnerWebhookDeliveryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerWebhookDelivery
     */
    select?: PartnerWebhookDeliverySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerWebhookDeliveryInclude<ExtArgs> | null
  }


  /**
   * Model PartnerApiCall
   */

  export type AggregatePartnerApiCall = {
    _count: PartnerApiCallCountAggregateOutputType | null
    _avg: PartnerApiCallAvgAggregateOutputType | null
    _sum: PartnerApiCallSumAggregateOutputType | null
    _min: PartnerApiCallMinAggregateOutputType | null
    _max: PartnerApiCallMaxAggregateOutputType | null
  }

  export type PartnerApiCallAvgAggregateOutputType = {
    statusCode: number | null
    durationMs: number | null
  }

  export type PartnerApiCallSumAggregateOutputType = {
    statusCode: number | null
    durationMs: number | null
  }

  export type PartnerApiCallMinAggregateOutputType = {
    id: string | null
    apiKeyId: string | null
    companyId: string | null
    method: string | null
    path: string | null
    statusCode: number | null
    durationMs: number | null
    ip: string | null
    userAgent: string | null
    errorCode: string | null
    createdAt: Date | null
  }

  export type PartnerApiCallMaxAggregateOutputType = {
    id: string | null
    apiKeyId: string | null
    companyId: string | null
    method: string | null
    path: string | null
    statusCode: number | null
    durationMs: number | null
    ip: string | null
    userAgent: string | null
    errorCode: string | null
    createdAt: Date | null
  }

  export type PartnerApiCallCountAggregateOutputType = {
    id: number
    apiKeyId: number
    companyId: number
    method: number
    path: number
    statusCode: number
    durationMs: number
    ip: number
    userAgent: number
    errorCode: number
    createdAt: number
    _all: number
  }


  export type PartnerApiCallAvgAggregateInputType = {
    statusCode?: true
    durationMs?: true
  }

  export type PartnerApiCallSumAggregateInputType = {
    statusCode?: true
    durationMs?: true
  }

  export type PartnerApiCallMinAggregateInputType = {
    id?: true
    apiKeyId?: true
    companyId?: true
    method?: true
    path?: true
    statusCode?: true
    durationMs?: true
    ip?: true
    userAgent?: true
    errorCode?: true
    createdAt?: true
  }

  export type PartnerApiCallMaxAggregateInputType = {
    id?: true
    apiKeyId?: true
    companyId?: true
    method?: true
    path?: true
    statusCode?: true
    durationMs?: true
    ip?: true
    userAgent?: true
    errorCode?: true
    createdAt?: true
  }

  export type PartnerApiCallCountAggregateInputType = {
    id?: true
    apiKeyId?: true
    companyId?: true
    method?: true
    path?: true
    statusCode?: true
    durationMs?: true
    ip?: true
    userAgent?: true
    errorCode?: true
    createdAt?: true
    _all?: true
  }

  export type PartnerApiCallAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerApiCall to aggregate.
     */
    where?: PartnerApiCallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerApiCalls to fetch.
     */
    orderBy?: PartnerApiCallOrderByWithRelationInput | PartnerApiCallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PartnerApiCallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerApiCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerApiCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PartnerApiCalls
    **/
    _count?: true | PartnerApiCallCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PartnerApiCallAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PartnerApiCallSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PartnerApiCallMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PartnerApiCallMaxAggregateInputType
  }

  export type GetPartnerApiCallAggregateType<T extends PartnerApiCallAggregateArgs> = {
        [P in keyof T & keyof AggregatePartnerApiCall]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePartnerApiCall[P]>
      : GetScalarType<T[P], AggregatePartnerApiCall[P]>
  }




  export type PartnerApiCallGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PartnerApiCallWhereInput
    orderBy?: PartnerApiCallOrderByWithAggregationInput | PartnerApiCallOrderByWithAggregationInput[]
    by: PartnerApiCallScalarFieldEnum[] | PartnerApiCallScalarFieldEnum
    having?: PartnerApiCallScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PartnerApiCallCountAggregateInputType | true
    _avg?: PartnerApiCallAvgAggregateInputType
    _sum?: PartnerApiCallSumAggregateInputType
    _min?: PartnerApiCallMinAggregateInputType
    _max?: PartnerApiCallMaxAggregateInputType
  }

  export type PartnerApiCallGroupByOutputType = {
    id: string
    apiKeyId: string | null
    companyId: string | null
    method: string
    path: string
    statusCode: number
    durationMs: number
    ip: string | null
    userAgent: string | null
    errorCode: string | null
    createdAt: Date
    _count: PartnerApiCallCountAggregateOutputType | null
    _avg: PartnerApiCallAvgAggregateOutputType | null
    _sum: PartnerApiCallSumAggregateOutputType | null
    _min: PartnerApiCallMinAggregateOutputType | null
    _max: PartnerApiCallMaxAggregateOutputType | null
  }

  type GetPartnerApiCallGroupByPayload<T extends PartnerApiCallGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PartnerApiCallGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PartnerApiCallGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PartnerApiCallGroupByOutputType[P]>
            : GetScalarType<T[P], PartnerApiCallGroupByOutputType[P]>
        }
      >
    >


  export type PartnerApiCallSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    apiKeyId?: boolean
    companyId?: boolean
    method?: boolean
    path?: boolean
    statusCode?: boolean
    durationMs?: boolean
    ip?: boolean
    userAgent?: boolean
    errorCode?: boolean
    createdAt?: boolean
    apiKey?: boolean | PartnerApiCall$apiKeyArgs<ExtArgs>
  }, ExtArgs["result"]["partnerApiCall"]>

  export type PartnerApiCallSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    apiKeyId?: boolean
    companyId?: boolean
    method?: boolean
    path?: boolean
    statusCode?: boolean
    durationMs?: boolean
    ip?: boolean
    userAgent?: boolean
    errorCode?: boolean
    createdAt?: boolean
    apiKey?: boolean | PartnerApiCall$apiKeyArgs<ExtArgs>
  }, ExtArgs["result"]["partnerApiCall"]>

  export type PartnerApiCallSelectScalar = {
    id?: boolean
    apiKeyId?: boolean
    companyId?: boolean
    method?: boolean
    path?: boolean
    statusCode?: boolean
    durationMs?: boolean
    ip?: boolean
    userAgent?: boolean
    errorCode?: boolean
    createdAt?: boolean
  }

  export type PartnerApiCallInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    apiKey?: boolean | PartnerApiCall$apiKeyArgs<ExtArgs>
  }
  export type PartnerApiCallIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    apiKey?: boolean | PartnerApiCall$apiKeyArgs<ExtArgs>
  }

  export type $PartnerApiCallPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PartnerApiCall"
    objects: {
      apiKey: Prisma.$PartnerApiKeyPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      apiKeyId: string | null
      companyId: string | null
      method: string
      path: string
      statusCode: number
      durationMs: number
      ip: string | null
      userAgent: string | null
      errorCode: string | null
      createdAt: Date
    }, ExtArgs["result"]["partnerApiCall"]>
    composites: {}
  }

  type PartnerApiCallGetPayload<S extends boolean | null | undefined | PartnerApiCallDefaultArgs> = $Result.GetResult<Prisma.$PartnerApiCallPayload, S>

  type PartnerApiCallCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PartnerApiCallFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PartnerApiCallCountAggregateInputType | true
    }

  export interface PartnerApiCallDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PartnerApiCall'], meta: { name: 'PartnerApiCall' } }
    /**
     * Find zero or one PartnerApiCall that matches the filter.
     * @param {PartnerApiCallFindUniqueArgs} args - Arguments to find a PartnerApiCall
     * @example
     * // Get one PartnerApiCall
     * const partnerApiCall = await prisma.partnerApiCall.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PartnerApiCallFindUniqueArgs>(args: SelectSubset<T, PartnerApiCallFindUniqueArgs<ExtArgs>>): Prisma__PartnerApiCallClient<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PartnerApiCall that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PartnerApiCallFindUniqueOrThrowArgs} args - Arguments to find a PartnerApiCall
     * @example
     * // Get one PartnerApiCall
     * const partnerApiCall = await prisma.partnerApiCall.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PartnerApiCallFindUniqueOrThrowArgs>(args: SelectSubset<T, PartnerApiCallFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PartnerApiCallClient<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PartnerApiCall that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiCallFindFirstArgs} args - Arguments to find a PartnerApiCall
     * @example
     * // Get one PartnerApiCall
     * const partnerApiCall = await prisma.partnerApiCall.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PartnerApiCallFindFirstArgs>(args?: SelectSubset<T, PartnerApiCallFindFirstArgs<ExtArgs>>): Prisma__PartnerApiCallClient<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PartnerApiCall that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiCallFindFirstOrThrowArgs} args - Arguments to find a PartnerApiCall
     * @example
     * // Get one PartnerApiCall
     * const partnerApiCall = await prisma.partnerApiCall.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PartnerApiCallFindFirstOrThrowArgs>(args?: SelectSubset<T, PartnerApiCallFindFirstOrThrowArgs<ExtArgs>>): Prisma__PartnerApiCallClient<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PartnerApiCalls that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiCallFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PartnerApiCalls
     * const partnerApiCalls = await prisma.partnerApiCall.findMany()
     * 
     * // Get first 10 PartnerApiCalls
     * const partnerApiCalls = await prisma.partnerApiCall.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const partnerApiCallWithIdOnly = await prisma.partnerApiCall.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PartnerApiCallFindManyArgs>(args?: SelectSubset<T, PartnerApiCallFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PartnerApiCall.
     * @param {PartnerApiCallCreateArgs} args - Arguments to create a PartnerApiCall.
     * @example
     * // Create one PartnerApiCall
     * const PartnerApiCall = await prisma.partnerApiCall.create({
     *   data: {
     *     // ... data to create a PartnerApiCall
     *   }
     * })
     * 
     */
    create<T extends PartnerApiCallCreateArgs>(args: SelectSubset<T, PartnerApiCallCreateArgs<ExtArgs>>): Prisma__PartnerApiCallClient<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PartnerApiCalls.
     * @param {PartnerApiCallCreateManyArgs} args - Arguments to create many PartnerApiCalls.
     * @example
     * // Create many PartnerApiCalls
     * const partnerApiCall = await prisma.partnerApiCall.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PartnerApiCallCreateManyArgs>(args?: SelectSubset<T, PartnerApiCallCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PartnerApiCalls and returns the data saved in the database.
     * @param {PartnerApiCallCreateManyAndReturnArgs} args - Arguments to create many PartnerApiCalls.
     * @example
     * // Create many PartnerApiCalls
     * const partnerApiCall = await prisma.partnerApiCall.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PartnerApiCalls and only return the `id`
     * const partnerApiCallWithIdOnly = await prisma.partnerApiCall.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PartnerApiCallCreateManyAndReturnArgs>(args?: SelectSubset<T, PartnerApiCallCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PartnerApiCall.
     * @param {PartnerApiCallDeleteArgs} args - Arguments to delete one PartnerApiCall.
     * @example
     * // Delete one PartnerApiCall
     * const PartnerApiCall = await prisma.partnerApiCall.delete({
     *   where: {
     *     // ... filter to delete one PartnerApiCall
     *   }
     * })
     * 
     */
    delete<T extends PartnerApiCallDeleteArgs>(args: SelectSubset<T, PartnerApiCallDeleteArgs<ExtArgs>>): Prisma__PartnerApiCallClient<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PartnerApiCall.
     * @param {PartnerApiCallUpdateArgs} args - Arguments to update one PartnerApiCall.
     * @example
     * // Update one PartnerApiCall
     * const partnerApiCall = await prisma.partnerApiCall.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PartnerApiCallUpdateArgs>(args: SelectSubset<T, PartnerApiCallUpdateArgs<ExtArgs>>): Prisma__PartnerApiCallClient<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PartnerApiCalls.
     * @param {PartnerApiCallDeleteManyArgs} args - Arguments to filter PartnerApiCalls to delete.
     * @example
     * // Delete a few PartnerApiCalls
     * const { count } = await prisma.partnerApiCall.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PartnerApiCallDeleteManyArgs>(args?: SelectSubset<T, PartnerApiCallDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PartnerApiCalls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiCallUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PartnerApiCalls
     * const partnerApiCall = await prisma.partnerApiCall.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PartnerApiCallUpdateManyArgs>(args: SelectSubset<T, PartnerApiCallUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PartnerApiCall.
     * @param {PartnerApiCallUpsertArgs} args - Arguments to update or create a PartnerApiCall.
     * @example
     * // Update or create a PartnerApiCall
     * const partnerApiCall = await prisma.partnerApiCall.upsert({
     *   create: {
     *     // ... data to create a PartnerApiCall
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PartnerApiCall we want to update
     *   }
     * })
     */
    upsert<T extends PartnerApiCallUpsertArgs>(args: SelectSubset<T, PartnerApiCallUpsertArgs<ExtArgs>>): Prisma__PartnerApiCallClient<$Result.GetResult<Prisma.$PartnerApiCallPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PartnerApiCalls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiCallCountArgs} args - Arguments to filter PartnerApiCalls to count.
     * @example
     * // Count the number of PartnerApiCalls
     * const count = await prisma.partnerApiCall.count({
     *   where: {
     *     // ... the filter for the PartnerApiCalls we want to count
     *   }
     * })
    **/
    count<T extends PartnerApiCallCountArgs>(
      args?: Subset<T, PartnerApiCallCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PartnerApiCallCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PartnerApiCall.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiCallAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PartnerApiCallAggregateArgs>(args: Subset<T, PartnerApiCallAggregateArgs>): Prisma.PrismaPromise<GetPartnerApiCallAggregateType<T>>

    /**
     * Group by PartnerApiCall.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PartnerApiCallGroupByArgs} args - Group by arguments.
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
      T extends PartnerApiCallGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PartnerApiCallGroupByArgs['orderBy'] }
        : { orderBy?: PartnerApiCallGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PartnerApiCallGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPartnerApiCallGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PartnerApiCall model
   */
  readonly fields: PartnerApiCallFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PartnerApiCall.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PartnerApiCallClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    apiKey<T extends PartnerApiCall$apiKeyArgs<ExtArgs> = {}>(args?: Subset<T, PartnerApiCall$apiKeyArgs<ExtArgs>>): Prisma__PartnerApiKeyClient<$Result.GetResult<Prisma.$PartnerApiKeyPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
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
   * Fields of the PartnerApiCall model
   */ 
  interface PartnerApiCallFieldRefs {
    readonly id: FieldRef<"PartnerApiCall", 'String'>
    readonly apiKeyId: FieldRef<"PartnerApiCall", 'String'>
    readonly companyId: FieldRef<"PartnerApiCall", 'String'>
    readonly method: FieldRef<"PartnerApiCall", 'String'>
    readonly path: FieldRef<"PartnerApiCall", 'String'>
    readonly statusCode: FieldRef<"PartnerApiCall", 'Int'>
    readonly durationMs: FieldRef<"PartnerApiCall", 'Int'>
    readonly ip: FieldRef<"PartnerApiCall", 'String'>
    readonly userAgent: FieldRef<"PartnerApiCall", 'String'>
    readonly errorCode: FieldRef<"PartnerApiCall", 'String'>
    readonly createdAt: FieldRef<"PartnerApiCall", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PartnerApiCall findUnique
   */
  export type PartnerApiCallFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiCall to fetch.
     */
    where: PartnerApiCallWhereUniqueInput
  }

  /**
   * PartnerApiCall findUniqueOrThrow
   */
  export type PartnerApiCallFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiCall to fetch.
     */
    where: PartnerApiCallWhereUniqueInput
  }

  /**
   * PartnerApiCall findFirst
   */
  export type PartnerApiCallFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiCall to fetch.
     */
    where?: PartnerApiCallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerApiCalls to fetch.
     */
    orderBy?: PartnerApiCallOrderByWithRelationInput | PartnerApiCallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerApiCalls.
     */
    cursor?: PartnerApiCallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerApiCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerApiCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerApiCalls.
     */
    distinct?: PartnerApiCallScalarFieldEnum | PartnerApiCallScalarFieldEnum[]
  }

  /**
   * PartnerApiCall findFirstOrThrow
   */
  export type PartnerApiCallFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiCall to fetch.
     */
    where?: PartnerApiCallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerApiCalls to fetch.
     */
    orderBy?: PartnerApiCallOrderByWithRelationInput | PartnerApiCallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PartnerApiCalls.
     */
    cursor?: PartnerApiCallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerApiCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerApiCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PartnerApiCalls.
     */
    distinct?: PartnerApiCallScalarFieldEnum | PartnerApiCallScalarFieldEnum[]
  }

  /**
   * PartnerApiCall findMany
   */
  export type PartnerApiCallFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    /**
     * Filter, which PartnerApiCalls to fetch.
     */
    where?: PartnerApiCallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PartnerApiCalls to fetch.
     */
    orderBy?: PartnerApiCallOrderByWithRelationInput | PartnerApiCallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PartnerApiCalls.
     */
    cursor?: PartnerApiCallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PartnerApiCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PartnerApiCalls.
     */
    skip?: number
    distinct?: PartnerApiCallScalarFieldEnum | PartnerApiCallScalarFieldEnum[]
  }

  /**
   * PartnerApiCall create
   */
  export type PartnerApiCallCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    /**
     * The data needed to create a PartnerApiCall.
     */
    data: XOR<PartnerApiCallCreateInput, PartnerApiCallUncheckedCreateInput>
  }

  /**
   * PartnerApiCall createMany
   */
  export type PartnerApiCallCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PartnerApiCalls.
     */
    data: PartnerApiCallCreateManyInput | PartnerApiCallCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PartnerApiCall createManyAndReturn
   */
  export type PartnerApiCallCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PartnerApiCalls.
     */
    data: PartnerApiCallCreateManyInput | PartnerApiCallCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PartnerApiCall update
   */
  export type PartnerApiCallUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    /**
     * The data needed to update a PartnerApiCall.
     */
    data: XOR<PartnerApiCallUpdateInput, PartnerApiCallUncheckedUpdateInput>
    /**
     * Choose, which PartnerApiCall to update.
     */
    where: PartnerApiCallWhereUniqueInput
  }

  /**
   * PartnerApiCall updateMany
   */
  export type PartnerApiCallUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PartnerApiCalls.
     */
    data: XOR<PartnerApiCallUpdateManyMutationInput, PartnerApiCallUncheckedUpdateManyInput>
    /**
     * Filter which PartnerApiCalls to update
     */
    where?: PartnerApiCallWhereInput
  }

  /**
   * PartnerApiCall upsert
   */
  export type PartnerApiCallUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    /**
     * The filter to search for the PartnerApiCall to update in case it exists.
     */
    where: PartnerApiCallWhereUniqueInput
    /**
     * In case the PartnerApiCall found by the `where` argument doesn't exist, create a new PartnerApiCall with this data.
     */
    create: XOR<PartnerApiCallCreateInput, PartnerApiCallUncheckedCreateInput>
    /**
     * In case the PartnerApiCall was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PartnerApiCallUpdateInput, PartnerApiCallUncheckedUpdateInput>
  }

  /**
   * PartnerApiCall delete
   */
  export type PartnerApiCallDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
    /**
     * Filter which PartnerApiCall to delete.
     */
    where: PartnerApiCallWhereUniqueInput
  }

  /**
   * PartnerApiCall deleteMany
   */
  export type PartnerApiCallDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PartnerApiCalls to delete
     */
    where?: PartnerApiCallWhereInput
  }

  /**
   * PartnerApiCall.apiKey
   */
  export type PartnerApiCall$apiKeyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiKey
     */
    select?: PartnerApiKeySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiKeyInclude<ExtArgs> | null
    where?: PartnerApiKeyWhereInput
  }

  /**
   * PartnerApiCall without action
   */
  export type PartnerApiCallDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PartnerApiCall
     */
    select?: PartnerApiCallSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PartnerApiCallInclude<ExtArgs> | null
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


  export const PartnerApiKeyScalarFieldEnum: {
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

  export type PartnerApiKeyScalarFieldEnum = (typeof PartnerApiKeyScalarFieldEnum)[keyof typeof PartnerApiKeyScalarFieldEnum]


  export const PartnerNewCallerBookingScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    phoneSuffix: 'phoneSuffix',
    customerId: 'customerId',
    createdAt: 'createdAt'
  };

  export type PartnerNewCallerBookingScalarFieldEnum = (typeof PartnerNewCallerBookingScalarFieldEnum)[keyof typeof PartnerNewCallerBookingScalarFieldEnum]


  export const PartnerWebhookScalarFieldEnum: {
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

  export type PartnerWebhookScalarFieldEnum = (typeof PartnerWebhookScalarFieldEnum)[keyof typeof PartnerWebhookScalarFieldEnum]


  export const PartnerWebhookDeliveryScalarFieldEnum: {
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

  export type PartnerWebhookDeliveryScalarFieldEnum = (typeof PartnerWebhookDeliveryScalarFieldEnum)[keyof typeof PartnerWebhookDeliveryScalarFieldEnum]


  export const PartnerApiCallScalarFieldEnum: {
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

  export type PartnerApiCallScalarFieldEnum = (typeof PartnerApiCallScalarFieldEnum)[keyof typeof PartnerApiCallScalarFieldEnum]


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
   * Reference to a field of type 'PartnerEnvironment'
   */
  export type EnumPartnerEnvironmentFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PartnerEnvironment'>
    


  /**
   * Reference to a field of type 'PartnerEnvironment[]'
   */
  export type ListEnumPartnerEnvironmentFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PartnerEnvironment[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'ApiKeyStatus'
   */
  export type EnumApiKeyStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApiKeyStatus'>
    


  /**
   * Reference to a field of type 'ApiKeyStatus[]'
   */
  export type ListEnumApiKeyStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApiKeyStatus[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'WebhookStatus'
   */
  export type EnumWebhookStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WebhookStatus'>
    


  /**
   * Reference to a field of type 'WebhookStatus[]'
   */
  export type ListEnumWebhookStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WebhookStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


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


  export type PartnerApiKeyWhereInput = {
    AND?: PartnerApiKeyWhereInput | PartnerApiKeyWhereInput[]
    OR?: PartnerApiKeyWhereInput[]
    NOT?: PartnerApiKeyWhereInput | PartnerApiKeyWhereInput[]
    id?: StringFilter<"PartnerApiKey"> | string
    companyId?: StringFilter<"PartnerApiKey"> | string
    name?: StringFilter<"PartnerApiKey"> | string
    environment?: EnumPartnerEnvironmentFilter<"PartnerApiKey"> | $Enums.PartnerEnvironment
    keyPrefix?: StringFilter<"PartnerApiKey"> | string
    keyHash?: StringFilter<"PartnerApiKey"> | string
    scopes?: StringNullableListFilter<"PartnerApiKey">
    rateLimitPerMin?: IntFilter<"PartnerApiKey"> | number
    status?: EnumApiKeyStatusFilter<"PartnerApiKey"> | $Enums.ApiKeyStatus
    lastUsedAt?: DateTimeNullableFilter<"PartnerApiKey"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"PartnerApiKey"> | Date | string | null
    createdBy?: StringNullableFilter<"PartnerApiKey"> | string | null
    createdAt?: DateTimeFilter<"PartnerApiKey"> | Date | string
    revokedAt?: DateTimeNullableFilter<"PartnerApiKey"> | Date | string | null
    calls?: PartnerApiCallListRelationFilter
  }

  export type PartnerApiKeyOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    environment?: SortOrder
    keyPrefix?: SortOrder
    keyHash?: SortOrder
    scopes?: SortOrder
    rateLimitPerMin?: SortOrder
    status?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    revokedAt?: SortOrderInput | SortOrder
    calls?: PartnerApiCallOrderByRelationAggregateInput
  }

  export type PartnerApiKeyWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    keyHash?: string
    AND?: PartnerApiKeyWhereInput | PartnerApiKeyWhereInput[]
    OR?: PartnerApiKeyWhereInput[]
    NOT?: PartnerApiKeyWhereInput | PartnerApiKeyWhereInput[]
    companyId?: StringFilter<"PartnerApiKey"> | string
    name?: StringFilter<"PartnerApiKey"> | string
    environment?: EnumPartnerEnvironmentFilter<"PartnerApiKey"> | $Enums.PartnerEnvironment
    keyPrefix?: StringFilter<"PartnerApiKey"> | string
    scopes?: StringNullableListFilter<"PartnerApiKey">
    rateLimitPerMin?: IntFilter<"PartnerApiKey"> | number
    status?: EnumApiKeyStatusFilter<"PartnerApiKey"> | $Enums.ApiKeyStatus
    lastUsedAt?: DateTimeNullableFilter<"PartnerApiKey"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"PartnerApiKey"> | Date | string | null
    createdBy?: StringNullableFilter<"PartnerApiKey"> | string | null
    createdAt?: DateTimeFilter<"PartnerApiKey"> | Date | string
    revokedAt?: DateTimeNullableFilter<"PartnerApiKey"> | Date | string | null
    calls?: PartnerApiCallListRelationFilter
  }, "id" | "keyHash">

  export type PartnerApiKeyOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    environment?: SortOrder
    keyPrefix?: SortOrder
    keyHash?: SortOrder
    scopes?: SortOrder
    rateLimitPerMin?: SortOrder
    status?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    revokedAt?: SortOrderInput | SortOrder
    _count?: PartnerApiKeyCountOrderByAggregateInput
    _avg?: PartnerApiKeyAvgOrderByAggregateInput
    _max?: PartnerApiKeyMaxOrderByAggregateInput
    _min?: PartnerApiKeyMinOrderByAggregateInput
    _sum?: PartnerApiKeySumOrderByAggregateInput
  }

  export type PartnerApiKeyScalarWhereWithAggregatesInput = {
    AND?: PartnerApiKeyScalarWhereWithAggregatesInput | PartnerApiKeyScalarWhereWithAggregatesInput[]
    OR?: PartnerApiKeyScalarWhereWithAggregatesInput[]
    NOT?: PartnerApiKeyScalarWhereWithAggregatesInput | PartnerApiKeyScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PartnerApiKey"> | string
    companyId?: StringWithAggregatesFilter<"PartnerApiKey"> | string
    name?: StringWithAggregatesFilter<"PartnerApiKey"> | string
    environment?: EnumPartnerEnvironmentWithAggregatesFilter<"PartnerApiKey"> | $Enums.PartnerEnvironment
    keyPrefix?: StringWithAggregatesFilter<"PartnerApiKey"> | string
    keyHash?: StringWithAggregatesFilter<"PartnerApiKey"> | string
    scopes?: StringNullableListFilter<"PartnerApiKey">
    rateLimitPerMin?: IntWithAggregatesFilter<"PartnerApiKey"> | number
    status?: EnumApiKeyStatusWithAggregatesFilter<"PartnerApiKey"> | $Enums.ApiKeyStatus
    lastUsedAt?: DateTimeNullableWithAggregatesFilter<"PartnerApiKey"> | Date | string | null
    expiresAt?: DateTimeNullableWithAggregatesFilter<"PartnerApiKey"> | Date | string | null
    createdBy?: StringNullableWithAggregatesFilter<"PartnerApiKey"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PartnerApiKey"> | Date | string
    revokedAt?: DateTimeNullableWithAggregatesFilter<"PartnerApiKey"> | Date | string | null
  }

  export type PartnerNewCallerBookingWhereInput = {
    AND?: PartnerNewCallerBookingWhereInput | PartnerNewCallerBookingWhereInput[]
    OR?: PartnerNewCallerBookingWhereInput[]
    NOT?: PartnerNewCallerBookingWhereInput | PartnerNewCallerBookingWhereInput[]
    id?: StringFilter<"PartnerNewCallerBooking"> | string
    companyId?: StringFilter<"PartnerNewCallerBooking"> | string
    phoneSuffix?: StringFilter<"PartnerNewCallerBooking"> | string
    customerId?: StringNullableFilter<"PartnerNewCallerBooking"> | string | null
    createdAt?: DateTimeFilter<"PartnerNewCallerBooking"> | Date | string
  }

  export type PartnerNewCallerBookingOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    phoneSuffix?: SortOrder
    customerId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type PartnerNewCallerBookingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PartnerNewCallerBookingWhereInput | PartnerNewCallerBookingWhereInput[]
    OR?: PartnerNewCallerBookingWhereInput[]
    NOT?: PartnerNewCallerBookingWhereInput | PartnerNewCallerBookingWhereInput[]
    companyId?: StringFilter<"PartnerNewCallerBooking"> | string
    phoneSuffix?: StringFilter<"PartnerNewCallerBooking"> | string
    customerId?: StringNullableFilter<"PartnerNewCallerBooking"> | string | null
    createdAt?: DateTimeFilter<"PartnerNewCallerBooking"> | Date | string
  }, "id">

  export type PartnerNewCallerBookingOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    phoneSuffix?: SortOrder
    customerId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: PartnerNewCallerBookingCountOrderByAggregateInput
    _max?: PartnerNewCallerBookingMaxOrderByAggregateInput
    _min?: PartnerNewCallerBookingMinOrderByAggregateInput
  }

  export type PartnerNewCallerBookingScalarWhereWithAggregatesInput = {
    AND?: PartnerNewCallerBookingScalarWhereWithAggregatesInput | PartnerNewCallerBookingScalarWhereWithAggregatesInput[]
    OR?: PartnerNewCallerBookingScalarWhereWithAggregatesInput[]
    NOT?: PartnerNewCallerBookingScalarWhereWithAggregatesInput | PartnerNewCallerBookingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PartnerNewCallerBooking"> | string
    companyId?: StringWithAggregatesFilter<"PartnerNewCallerBooking"> | string
    phoneSuffix?: StringWithAggregatesFilter<"PartnerNewCallerBooking"> | string
    customerId?: StringNullableWithAggregatesFilter<"PartnerNewCallerBooking"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PartnerNewCallerBooking"> | Date | string
  }

  export type PartnerWebhookWhereInput = {
    AND?: PartnerWebhookWhereInput | PartnerWebhookWhereInput[]
    OR?: PartnerWebhookWhereInput[]
    NOT?: PartnerWebhookWhereInput | PartnerWebhookWhereInput[]
    id?: StringFilter<"PartnerWebhook"> | string
    companyId?: StringFilter<"PartnerWebhook"> | string
    apiKeyId?: StringNullableFilter<"PartnerWebhook"> | string | null
    url?: StringFilter<"PartnerWebhook"> | string
    secret?: StringFilter<"PartnerWebhook"> | string
    events?: StringNullableListFilter<"PartnerWebhook">
    status?: EnumWebhookStatusFilter<"PartnerWebhook"> | $Enums.WebhookStatus
    description?: StringNullableFilter<"PartnerWebhook"> | string | null
    failureCount?: IntFilter<"PartnerWebhook"> | number
    lastSuccessAt?: DateTimeNullableFilter<"PartnerWebhook"> | Date | string | null
    lastFailureAt?: DateTimeNullableFilter<"PartnerWebhook"> | Date | string | null
    createdAt?: DateTimeFilter<"PartnerWebhook"> | Date | string
    deliveries?: PartnerWebhookDeliveryListRelationFilter
  }

  export type PartnerWebhookOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    apiKeyId?: SortOrderInput | SortOrder
    url?: SortOrder
    secret?: SortOrder
    events?: SortOrder
    status?: SortOrder
    description?: SortOrderInput | SortOrder
    failureCount?: SortOrder
    lastSuccessAt?: SortOrderInput | SortOrder
    lastFailureAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    deliveries?: PartnerWebhookDeliveryOrderByRelationAggregateInput
  }

  export type PartnerWebhookWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PartnerWebhookWhereInput | PartnerWebhookWhereInput[]
    OR?: PartnerWebhookWhereInput[]
    NOT?: PartnerWebhookWhereInput | PartnerWebhookWhereInput[]
    companyId?: StringFilter<"PartnerWebhook"> | string
    apiKeyId?: StringNullableFilter<"PartnerWebhook"> | string | null
    url?: StringFilter<"PartnerWebhook"> | string
    secret?: StringFilter<"PartnerWebhook"> | string
    events?: StringNullableListFilter<"PartnerWebhook">
    status?: EnumWebhookStatusFilter<"PartnerWebhook"> | $Enums.WebhookStatus
    description?: StringNullableFilter<"PartnerWebhook"> | string | null
    failureCount?: IntFilter<"PartnerWebhook"> | number
    lastSuccessAt?: DateTimeNullableFilter<"PartnerWebhook"> | Date | string | null
    lastFailureAt?: DateTimeNullableFilter<"PartnerWebhook"> | Date | string | null
    createdAt?: DateTimeFilter<"PartnerWebhook"> | Date | string
    deliveries?: PartnerWebhookDeliveryListRelationFilter
  }, "id">

  export type PartnerWebhookOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    apiKeyId?: SortOrderInput | SortOrder
    url?: SortOrder
    secret?: SortOrder
    events?: SortOrder
    status?: SortOrder
    description?: SortOrderInput | SortOrder
    failureCount?: SortOrder
    lastSuccessAt?: SortOrderInput | SortOrder
    lastFailureAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: PartnerWebhookCountOrderByAggregateInput
    _avg?: PartnerWebhookAvgOrderByAggregateInput
    _max?: PartnerWebhookMaxOrderByAggregateInput
    _min?: PartnerWebhookMinOrderByAggregateInput
    _sum?: PartnerWebhookSumOrderByAggregateInput
  }

  export type PartnerWebhookScalarWhereWithAggregatesInput = {
    AND?: PartnerWebhookScalarWhereWithAggregatesInput | PartnerWebhookScalarWhereWithAggregatesInput[]
    OR?: PartnerWebhookScalarWhereWithAggregatesInput[]
    NOT?: PartnerWebhookScalarWhereWithAggregatesInput | PartnerWebhookScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PartnerWebhook"> | string
    companyId?: StringWithAggregatesFilter<"PartnerWebhook"> | string
    apiKeyId?: StringNullableWithAggregatesFilter<"PartnerWebhook"> | string | null
    url?: StringWithAggregatesFilter<"PartnerWebhook"> | string
    secret?: StringWithAggregatesFilter<"PartnerWebhook"> | string
    events?: StringNullableListFilter<"PartnerWebhook">
    status?: EnumWebhookStatusWithAggregatesFilter<"PartnerWebhook"> | $Enums.WebhookStatus
    description?: StringNullableWithAggregatesFilter<"PartnerWebhook"> | string | null
    failureCount?: IntWithAggregatesFilter<"PartnerWebhook"> | number
    lastSuccessAt?: DateTimeNullableWithAggregatesFilter<"PartnerWebhook"> | Date | string | null
    lastFailureAt?: DateTimeNullableWithAggregatesFilter<"PartnerWebhook"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PartnerWebhook"> | Date | string
  }

  export type PartnerWebhookDeliveryWhereInput = {
    AND?: PartnerWebhookDeliveryWhereInput | PartnerWebhookDeliveryWhereInput[]
    OR?: PartnerWebhookDeliveryWhereInput[]
    NOT?: PartnerWebhookDeliveryWhereInput | PartnerWebhookDeliveryWhereInput[]
    id?: StringFilter<"PartnerWebhookDelivery"> | string
    webhookId?: StringFilter<"PartnerWebhookDelivery"> | string
    companyId?: StringFilter<"PartnerWebhookDelivery"> | string
    eventType?: StringFilter<"PartnerWebhookDelivery"> | string
    entityId?: StringFilter<"PartnerWebhookDelivery"> | string
    attempt?: IntFilter<"PartnerWebhookDelivery"> | number
    statusCode?: IntNullableFilter<"PartnerWebhookDelivery"> | number | null
    success?: BoolFilter<"PartnerWebhookDelivery"> | boolean
    error?: StringNullableFilter<"PartnerWebhookDelivery"> | string | null
    durationMs?: IntNullableFilter<"PartnerWebhookDelivery"> | number | null
    createdAt?: DateTimeFilter<"PartnerWebhookDelivery"> | Date | string
    webhook?: XOR<PartnerWebhookRelationFilter, PartnerWebhookWhereInput>
  }

  export type PartnerWebhookDeliveryOrderByWithRelationInput = {
    id?: SortOrder
    webhookId?: SortOrder
    companyId?: SortOrder
    eventType?: SortOrder
    entityId?: SortOrder
    attempt?: SortOrder
    statusCode?: SortOrderInput | SortOrder
    success?: SortOrder
    error?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    webhook?: PartnerWebhookOrderByWithRelationInput
  }

  export type PartnerWebhookDeliveryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PartnerWebhookDeliveryWhereInput | PartnerWebhookDeliveryWhereInput[]
    OR?: PartnerWebhookDeliveryWhereInput[]
    NOT?: PartnerWebhookDeliveryWhereInput | PartnerWebhookDeliveryWhereInput[]
    webhookId?: StringFilter<"PartnerWebhookDelivery"> | string
    companyId?: StringFilter<"PartnerWebhookDelivery"> | string
    eventType?: StringFilter<"PartnerWebhookDelivery"> | string
    entityId?: StringFilter<"PartnerWebhookDelivery"> | string
    attempt?: IntFilter<"PartnerWebhookDelivery"> | number
    statusCode?: IntNullableFilter<"PartnerWebhookDelivery"> | number | null
    success?: BoolFilter<"PartnerWebhookDelivery"> | boolean
    error?: StringNullableFilter<"PartnerWebhookDelivery"> | string | null
    durationMs?: IntNullableFilter<"PartnerWebhookDelivery"> | number | null
    createdAt?: DateTimeFilter<"PartnerWebhookDelivery"> | Date | string
    webhook?: XOR<PartnerWebhookRelationFilter, PartnerWebhookWhereInput>
  }, "id">

  export type PartnerWebhookDeliveryOrderByWithAggregationInput = {
    id?: SortOrder
    webhookId?: SortOrder
    companyId?: SortOrder
    eventType?: SortOrder
    entityId?: SortOrder
    attempt?: SortOrder
    statusCode?: SortOrderInput | SortOrder
    success?: SortOrder
    error?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: PartnerWebhookDeliveryCountOrderByAggregateInput
    _avg?: PartnerWebhookDeliveryAvgOrderByAggregateInput
    _max?: PartnerWebhookDeliveryMaxOrderByAggregateInput
    _min?: PartnerWebhookDeliveryMinOrderByAggregateInput
    _sum?: PartnerWebhookDeliverySumOrderByAggregateInput
  }

  export type PartnerWebhookDeliveryScalarWhereWithAggregatesInput = {
    AND?: PartnerWebhookDeliveryScalarWhereWithAggregatesInput | PartnerWebhookDeliveryScalarWhereWithAggregatesInput[]
    OR?: PartnerWebhookDeliveryScalarWhereWithAggregatesInput[]
    NOT?: PartnerWebhookDeliveryScalarWhereWithAggregatesInput | PartnerWebhookDeliveryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PartnerWebhookDelivery"> | string
    webhookId?: StringWithAggregatesFilter<"PartnerWebhookDelivery"> | string
    companyId?: StringWithAggregatesFilter<"PartnerWebhookDelivery"> | string
    eventType?: StringWithAggregatesFilter<"PartnerWebhookDelivery"> | string
    entityId?: StringWithAggregatesFilter<"PartnerWebhookDelivery"> | string
    attempt?: IntWithAggregatesFilter<"PartnerWebhookDelivery"> | number
    statusCode?: IntNullableWithAggregatesFilter<"PartnerWebhookDelivery"> | number | null
    success?: BoolWithAggregatesFilter<"PartnerWebhookDelivery"> | boolean
    error?: StringNullableWithAggregatesFilter<"PartnerWebhookDelivery"> | string | null
    durationMs?: IntNullableWithAggregatesFilter<"PartnerWebhookDelivery"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"PartnerWebhookDelivery"> | Date | string
  }

  export type PartnerApiCallWhereInput = {
    AND?: PartnerApiCallWhereInput | PartnerApiCallWhereInput[]
    OR?: PartnerApiCallWhereInput[]
    NOT?: PartnerApiCallWhereInput | PartnerApiCallWhereInput[]
    id?: StringFilter<"PartnerApiCall"> | string
    apiKeyId?: StringNullableFilter<"PartnerApiCall"> | string | null
    companyId?: StringNullableFilter<"PartnerApiCall"> | string | null
    method?: StringFilter<"PartnerApiCall"> | string
    path?: StringFilter<"PartnerApiCall"> | string
    statusCode?: IntFilter<"PartnerApiCall"> | number
    durationMs?: IntFilter<"PartnerApiCall"> | number
    ip?: StringNullableFilter<"PartnerApiCall"> | string | null
    userAgent?: StringNullableFilter<"PartnerApiCall"> | string | null
    errorCode?: StringNullableFilter<"PartnerApiCall"> | string | null
    createdAt?: DateTimeFilter<"PartnerApiCall"> | Date | string
    apiKey?: XOR<PartnerApiKeyNullableRelationFilter, PartnerApiKeyWhereInput> | null
  }

  export type PartnerApiCallOrderByWithRelationInput = {
    id?: SortOrder
    apiKeyId?: SortOrderInput | SortOrder
    companyId?: SortOrderInput | SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrder
    durationMs?: SortOrder
    ip?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    errorCode?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    apiKey?: PartnerApiKeyOrderByWithRelationInput
  }

  export type PartnerApiCallWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PartnerApiCallWhereInput | PartnerApiCallWhereInput[]
    OR?: PartnerApiCallWhereInput[]
    NOT?: PartnerApiCallWhereInput | PartnerApiCallWhereInput[]
    apiKeyId?: StringNullableFilter<"PartnerApiCall"> | string | null
    companyId?: StringNullableFilter<"PartnerApiCall"> | string | null
    method?: StringFilter<"PartnerApiCall"> | string
    path?: StringFilter<"PartnerApiCall"> | string
    statusCode?: IntFilter<"PartnerApiCall"> | number
    durationMs?: IntFilter<"PartnerApiCall"> | number
    ip?: StringNullableFilter<"PartnerApiCall"> | string | null
    userAgent?: StringNullableFilter<"PartnerApiCall"> | string | null
    errorCode?: StringNullableFilter<"PartnerApiCall"> | string | null
    createdAt?: DateTimeFilter<"PartnerApiCall"> | Date | string
    apiKey?: XOR<PartnerApiKeyNullableRelationFilter, PartnerApiKeyWhereInput> | null
  }, "id">

  export type PartnerApiCallOrderByWithAggregationInput = {
    id?: SortOrder
    apiKeyId?: SortOrderInput | SortOrder
    companyId?: SortOrderInput | SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrder
    durationMs?: SortOrder
    ip?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    errorCode?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: PartnerApiCallCountOrderByAggregateInput
    _avg?: PartnerApiCallAvgOrderByAggregateInput
    _max?: PartnerApiCallMaxOrderByAggregateInput
    _min?: PartnerApiCallMinOrderByAggregateInput
    _sum?: PartnerApiCallSumOrderByAggregateInput
  }

  export type PartnerApiCallScalarWhereWithAggregatesInput = {
    AND?: PartnerApiCallScalarWhereWithAggregatesInput | PartnerApiCallScalarWhereWithAggregatesInput[]
    OR?: PartnerApiCallScalarWhereWithAggregatesInput[]
    NOT?: PartnerApiCallScalarWhereWithAggregatesInput | PartnerApiCallScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PartnerApiCall"> | string
    apiKeyId?: StringNullableWithAggregatesFilter<"PartnerApiCall"> | string | null
    companyId?: StringNullableWithAggregatesFilter<"PartnerApiCall"> | string | null
    method?: StringWithAggregatesFilter<"PartnerApiCall"> | string
    path?: StringWithAggregatesFilter<"PartnerApiCall"> | string
    statusCode?: IntWithAggregatesFilter<"PartnerApiCall"> | number
    durationMs?: IntWithAggregatesFilter<"PartnerApiCall"> | number
    ip?: StringNullableWithAggregatesFilter<"PartnerApiCall"> | string | null
    userAgent?: StringNullableWithAggregatesFilter<"PartnerApiCall"> | string | null
    errorCode?: StringNullableWithAggregatesFilter<"PartnerApiCall"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PartnerApiCall"> | Date | string
  }

  export type PartnerApiKeyCreateInput = {
    id?: string
    companyId: string
    name: string
    environment?: $Enums.PartnerEnvironment
    keyPrefix: string
    keyHash: string
    scopes?: PartnerApiKeyCreatescopesInput | string[]
    rateLimitPerMin?: number
    status?: $Enums.ApiKeyStatus
    lastUsedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdBy?: string | null
    createdAt?: Date | string
    revokedAt?: Date | string | null
    calls?: PartnerApiCallCreateNestedManyWithoutApiKeyInput
  }

  export type PartnerApiKeyUncheckedCreateInput = {
    id?: string
    companyId: string
    name: string
    environment?: $Enums.PartnerEnvironment
    keyPrefix: string
    keyHash: string
    scopes?: PartnerApiKeyCreatescopesInput | string[]
    rateLimitPerMin?: number
    status?: $Enums.ApiKeyStatus
    lastUsedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdBy?: string | null
    createdAt?: Date | string
    revokedAt?: Date | string | null
    calls?: PartnerApiCallUncheckedCreateNestedManyWithoutApiKeyInput
  }

  export type PartnerApiKeyUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    environment?: EnumPartnerEnvironmentFieldUpdateOperationsInput | $Enums.PartnerEnvironment
    keyPrefix?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    scopes?: PartnerApiKeyUpdatescopesInput | string[]
    rateLimitPerMin?: IntFieldUpdateOperationsInput | number
    status?: EnumApiKeyStatusFieldUpdateOperationsInput | $Enums.ApiKeyStatus
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    calls?: PartnerApiCallUpdateManyWithoutApiKeyNestedInput
  }

  export type PartnerApiKeyUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    environment?: EnumPartnerEnvironmentFieldUpdateOperationsInput | $Enums.PartnerEnvironment
    keyPrefix?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    scopes?: PartnerApiKeyUpdatescopesInput | string[]
    rateLimitPerMin?: IntFieldUpdateOperationsInput | number
    status?: EnumApiKeyStatusFieldUpdateOperationsInput | $Enums.ApiKeyStatus
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    calls?: PartnerApiCallUncheckedUpdateManyWithoutApiKeyNestedInput
  }

  export type PartnerApiKeyCreateManyInput = {
    id?: string
    companyId: string
    name: string
    environment?: $Enums.PartnerEnvironment
    keyPrefix: string
    keyHash: string
    scopes?: PartnerApiKeyCreatescopesInput | string[]
    rateLimitPerMin?: number
    status?: $Enums.ApiKeyStatus
    lastUsedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdBy?: string | null
    createdAt?: Date | string
    revokedAt?: Date | string | null
  }

  export type PartnerApiKeyUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    environment?: EnumPartnerEnvironmentFieldUpdateOperationsInput | $Enums.PartnerEnvironment
    keyPrefix?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    scopes?: PartnerApiKeyUpdatescopesInput | string[]
    rateLimitPerMin?: IntFieldUpdateOperationsInput | number
    status?: EnumApiKeyStatusFieldUpdateOperationsInput | $Enums.ApiKeyStatus
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PartnerApiKeyUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    environment?: EnumPartnerEnvironmentFieldUpdateOperationsInput | $Enums.PartnerEnvironment
    keyPrefix?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    scopes?: PartnerApiKeyUpdatescopesInput | string[]
    rateLimitPerMin?: IntFieldUpdateOperationsInput | number
    status?: EnumApiKeyStatusFieldUpdateOperationsInput | $Enums.ApiKeyStatus
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PartnerNewCallerBookingCreateInput = {
    id?: string
    companyId: string
    phoneSuffix: string
    customerId?: string | null
    createdAt?: Date | string
  }

  export type PartnerNewCallerBookingUncheckedCreateInput = {
    id?: string
    companyId: string
    phoneSuffix: string
    customerId?: string | null
    createdAt?: Date | string
  }

  export type PartnerNewCallerBookingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    phoneSuffix?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerNewCallerBookingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    phoneSuffix?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerNewCallerBookingCreateManyInput = {
    id?: string
    companyId: string
    phoneSuffix: string
    customerId?: string | null
    createdAt?: Date | string
  }

  export type PartnerNewCallerBookingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    phoneSuffix?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerNewCallerBookingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    phoneSuffix?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerWebhookCreateInput = {
    id?: string
    companyId: string
    apiKeyId?: string | null
    url: string
    secret: string
    events?: PartnerWebhookCreateeventsInput | string[]
    status?: $Enums.WebhookStatus
    description?: string | null
    failureCount?: number
    lastSuccessAt?: Date | string | null
    lastFailureAt?: Date | string | null
    createdAt?: Date | string
    deliveries?: PartnerWebhookDeliveryCreateNestedManyWithoutWebhookInput
  }

  export type PartnerWebhookUncheckedCreateInput = {
    id?: string
    companyId: string
    apiKeyId?: string | null
    url: string
    secret: string
    events?: PartnerWebhookCreateeventsInput | string[]
    status?: $Enums.WebhookStatus
    description?: string | null
    failureCount?: number
    lastSuccessAt?: Date | string | null
    lastFailureAt?: Date | string | null
    createdAt?: Date | string
    deliveries?: PartnerWebhookDeliveryUncheckedCreateNestedManyWithoutWebhookInput
  }

  export type PartnerWebhookUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    apiKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    events?: PartnerWebhookUpdateeventsInput | string[]
    status?: EnumWebhookStatusFieldUpdateOperationsInput | $Enums.WebhookStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    failureCount?: IntFieldUpdateOperationsInput | number
    lastSuccessAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastFailureAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deliveries?: PartnerWebhookDeliveryUpdateManyWithoutWebhookNestedInput
  }

  export type PartnerWebhookUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    apiKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    events?: PartnerWebhookUpdateeventsInput | string[]
    status?: EnumWebhookStatusFieldUpdateOperationsInput | $Enums.WebhookStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    failureCount?: IntFieldUpdateOperationsInput | number
    lastSuccessAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastFailureAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deliveries?: PartnerWebhookDeliveryUncheckedUpdateManyWithoutWebhookNestedInput
  }

  export type PartnerWebhookCreateManyInput = {
    id?: string
    companyId: string
    apiKeyId?: string | null
    url: string
    secret: string
    events?: PartnerWebhookCreateeventsInput | string[]
    status?: $Enums.WebhookStatus
    description?: string | null
    failureCount?: number
    lastSuccessAt?: Date | string | null
    lastFailureAt?: Date | string | null
    createdAt?: Date | string
  }

  export type PartnerWebhookUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    apiKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    events?: PartnerWebhookUpdateeventsInput | string[]
    status?: EnumWebhookStatusFieldUpdateOperationsInput | $Enums.WebhookStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    failureCount?: IntFieldUpdateOperationsInput | number
    lastSuccessAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastFailureAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerWebhookUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    apiKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    events?: PartnerWebhookUpdateeventsInput | string[]
    status?: EnumWebhookStatusFieldUpdateOperationsInput | $Enums.WebhookStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    failureCount?: IntFieldUpdateOperationsInput | number
    lastSuccessAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastFailureAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerWebhookDeliveryCreateInput = {
    id?: string
    companyId: string
    eventType: string
    entityId: string
    attempt?: number
    statusCode?: number | null
    success?: boolean
    error?: string | null
    durationMs?: number | null
    createdAt?: Date | string
    webhook: PartnerWebhookCreateNestedOneWithoutDeliveriesInput
  }

  export type PartnerWebhookDeliveryUncheckedCreateInput = {
    id?: string
    webhookId: string
    companyId: string
    eventType: string
    entityId: string
    attempt?: number
    statusCode?: number | null
    success?: boolean
    error?: string | null
    durationMs?: number | null
    createdAt?: Date | string
  }

  export type PartnerWebhookDeliveryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    attempt?: IntFieldUpdateOperationsInput | number
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    success?: BoolFieldUpdateOperationsInput | boolean
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    webhook?: PartnerWebhookUpdateOneRequiredWithoutDeliveriesNestedInput
  }

  export type PartnerWebhookDeliveryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    webhookId?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    attempt?: IntFieldUpdateOperationsInput | number
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    success?: BoolFieldUpdateOperationsInput | boolean
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerWebhookDeliveryCreateManyInput = {
    id?: string
    webhookId: string
    companyId: string
    eventType: string
    entityId: string
    attempt?: number
    statusCode?: number | null
    success?: boolean
    error?: string | null
    durationMs?: number | null
    createdAt?: Date | string
  }

  export type PartnerWebhookDeliveryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    attempt?: IntFieldUpdateOperationsInput | number
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    success?: BoolFieldUpdateOperationsInput | boolean
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerWebhookDeliveryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    webhookId?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    attempt?: IntFieldUpdateOperationsInput | number
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    success?: BoolFieldUpdateOperationsInput | boolean
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerApiCallCreateInput = {
    id?: string
    companyId?: string | null
    method: string
    path: string
    statusCode: number
    durationMs: number
    ip?: string | null
    userAgent?: string | null
    errorCode?: string | null
    createdAt?: Date | string
    apiKey?: PartnerApiKeyCreateNestedOneWithoutCallsInput
  }

  export type PartnerApiCallUncheckedCreateInput = {
    id?: string
    apiKeyId?: string | null
    companyId?: string | null
    method: string
    path: string
    statusCode: number
    durationMs: number
    ip?: string | null
    userAgent?: string | null
    errorCode?: string | null
    createdAt?: Date | string
  }

  export type PartnerApiCallUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    durationMs?: IntFieldUpdateOperationsInput | number
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    apiKey?: PartnerApiKeyUpdateOneWithoutCallsNestedInput
  }

  export type PartnerApiCallUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    apiKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    durationMs?: IntFieldUpdateOperationsInput | number
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerApiCallCreateManyInput = {
    id?: string
    apiKeyId?: string | null
    companyId?: string | null
    method: string
    path: string
    statusCode: number
    durationMs: number
    ip?: string | null
    userAgent?: string | null
    errorCode?: string | null
    createdAt?: Date | string
  }

  export type PartnerApiCallUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    durationMs?: IntFieldUpdateOperationsInput | number
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerApiCallUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    apiKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    durationMs?: IntFieldUpdateOperationsInput | number
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
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

  export type EnumPartnerEnvironmentFilter<$PrismaModel = never> = {
    equals?: $Enums.PartnerEnvironment | EnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    in?: $Enums.PartnerEnvironment[] | ListEnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    notIn?: $Enums.PartnerEnvironment[] | ListEnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    not?: NestedEnumPartnerEnvironmentFilter<$PrismaModel> | $Enums.PartnerEnvironment
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
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

  export type EnumApiKeyStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ApiKeyStatus | EnumApiKeyStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ApiKeyStatus[] | ListEnumApiKeyStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ApiKeyStatus[] | ListEnumApiKeyStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumApiKeyStatusFilter<$PrismaModel> | $Enums.ApiKeyStatus
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

  export type PartnerApiCallListRelationFilter = {
    every?: PartnerApiCallWhereInput
    some?: PartnerApiCallWhereInput
    none?: PartnerApiCallWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PartnerApiCallOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PartnerApiKeyCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    environment?: SortOrder
    keyPrefix?: SortOrder
    keyHash?: SortOrder
    scopes?: SortOrder
    rateLimitPerMin?: SortOrder
    status?: SortOrder
    lastUsedAt?: SortOrder
    expiresAt?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    revokedAt?: SortOrder
  }

  export type PartnerApiKeyAvgOrderByAggregateInput = {
    rateLimitPerMin?: SortOrder
  }

  export type PartnerApiKeyMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    environment?: SortOrder
    keyPrefix?: SortOrder
    keyHash?: SortOrder
    rateLimitPerMin?: SortOrder
    status?: SortOrder
    lastUsedAt?: SortOrder
    expiresAt?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    revokedAt?: SortOrder
  }

  export type PartnerApiKeyMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    name?: SortOrder
    environment?: SortOrder
    keyPrefix?: SortOrder
    keyHash?: SortOrder
    rateLimitPerMin?: SortOrder
    status?: SortOrder
    lastUsedAt?: SortOrder
    expiresAt?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    revokedAt?: SortOrder
  }

  export type PartnerApiKeySumOrderByAggregateInput = {
    rateLimitPerMin?: SortOrder
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

  export type EnumPartnerEnvironmentWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PartnerEnvironment | EnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    in?: $Enums.PartnerEnvironment[] | ListEnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    notIn?: $Enums.PartnerEnvironment[] | ListEnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    not?: NestedEnumPartnerEnvironmentWithAggregatesFilter<$PrismaModel> | $Enums.PartnerEnvironment
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPartnerEnvironmentFilter<$PrismaModel>
    _max?: NestedEnumPartnerEnvironmentFilter<$PrismaModel>
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

  export type EnumApiKeyStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ApiKeyStatus | EnumApiKeyStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ApiKeyStatus[] | ListEnumApiKeyStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ApiKeyStatus[] | ListEnumApiKeyStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumApiKeyStatusWithAggregatesFilter<$PrismaModel> | $Enums.ApiKeyStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumApiKeyStatusFilter<$PrismaModel>
    _max?: NestedEnumApiKeyStatusFilter<$PrismaModel>
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

  export type PartnerNewCallerBookingCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    phoneSuffix?: SortOrder
    customerId?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerNewCallerBookingMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    phoneSuffix?: SortOrder
    customerId?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerNewCallerBookingMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    phoneSuffix?: SortOrder
    customerId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumWebhookStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WebhookStatus | EnumWebhookStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WebhookStatus[] | ListEnumWebhookStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WebhookStatus[] | ListEnumWebhookStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWebhookStatusFilter<$PrismaModel> | $Enums.WebhookStatus
  }

  export type PartnerWebhookDeliveryListRelationFilter = {
    every?: PartnerWebhookDeliveryWhereInput
    some?: PartnerWebhookDeliveryWhereInput
    none?: PartnerWebhookDeliveryWhereInput
  }

  export type PartnerWebhookDeliveryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PartnerWebhookCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    apiKeyId?: SortOrder
    url?: SortOrder
    secret?: SortOrder
    events?: SortOrder
    status?: SortOrder
    description?: SortOrder
    failureCount?: SortOrder
    lastSuccessAt?: SortOrder
    lastFailureAt?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerWebhookAvgOrderByAggregateInput = {
    failureCount?: SortOrder
  }

  export type PartnerWebhookMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    apiKeyId?: SortOrder
    url?: SortOrder
    secret?: SortOrder
    status?: SortOrder
    description?: SortOrder
    failureCount?: SortOrder
    lastSuccessAt?: SortOrder
    lastFailureAt?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerWebhookMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    apiKeyId?: SortOrder
    url?: SortOrder
    secret?: SortOrder
    status?: SortOrder
    description?: SortOrder
    failureCount?: SortOrder
    lastSuccessAt?: SortOrder
    lastFailureAt?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerWebhookSumOrderByAggregateInput = {
    failureCount?: SortOrder
  }

  export type EnumWebhookStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WebhookStatus | EnumWebhookStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WebhookStatus[] | ListEnumWebhookStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WebhookStatus[] | ListEnumWebhookStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWebhookStatusWithAggregatesFilter<$PrismaModel> | $Enums.WebhookStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWebhookStatusFilter<$PrismaModel>
    _max?: NestedEnumWebhookStatusFilter<$PrismaModel>
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

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type PartnerWebhookRelationFilter = {
    is?: PartnerWebhookWhereInput
    isNot?: PartnerWebhookWhereInput
  }

  export type PartnerWebhookDeliveryCountOrderByAggregateInput = {
    id?: SortOrder
    webhookId?: SortOrder
    companyId?: SortOrder
    eventType?: SortOrder
    entityId?: SortOrder
    attempt?: SortOrder
    statusCode?: SortOrder
    success?: SortOrder
    error?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerWebhookDeliveryAvgOrderByAggregateInput = {
    attempt?: SortOrder
    statusCode?: SortOrder
    durationMs?: SortOrder
  }

  export type PartnerWebhookDeliveryMaxOrderByAggregateInput = {
    id?: SortOrder
    webhookId?: SortOrder
    companyId?: SortOrder
    eventType?: SortOrder
    entityId?: SortOrder
    attempt?: SortOrder
    statusCode?: SortOrder
    success?: SortOrder
    error?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerWebhookDeliveryMinOrderByAggregateInput = {
    id?: SortOrder
    webhookId?: SortOrder
    companyId?: SortOrder
    eventType?: SortOrder
    entityId?: SortOrder
    attempt?: SortOrder
    statusCode?: SortOrder
    success?: SortOrder
    error?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerWebhookDeliverySumOrderByAggregateInput = {
    attempt?: SortOrder
    statusCode?: SortOrder
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
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type PartnerApiKeyNullableRelationFilter = {
    is?: PartnerApiKeyWhereInput | null
    isNot?: PartnerApiKeyWhereInput | null
  }

  export type PartnerApiCallCountOrderByAggregateInput = {
    id?: SortOrder
    apiKeyId?: SortOrder
    companyId?: SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrder
    durationMs?: SortOrder
    ip?: SortOrder
    userAgent?: SortOrder
    errorCode?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerApiCallAvgOrderByAggregateInput = {
    statusCode?: SortOrder
    durationMs?: SortOrder
  }

  export type PartnerApiCallMaxOrderByAggregateInput = {
    id?: SortOrder
    apiKeyId?: SortOrder
    companyId?: SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrder
    durationMs?: SortOrder
    ip?: SortOrder
    userAgent?: SortOrder
    errorCode?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerApiCallMinOrderByAggregateInput = {
    id?: SortOrder
    apiKeyId?: SortOrder
    companyId?: SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrder
    durationMs?: SortOrder
    ip?: SortOrder
    userAgent?: SortOrder
    errorCode?: SortOrder
    createdAt?: SortOrder
  }

  export type PartnerApiCallSumOrderByAggregateInput = {
    statusCode?: SortOrder
    durationMs?: SortOrder
  }

  export type PartnerApiKeyCreatescopesInput = {
    set: string[]
  }

  export type PartnerApiCallCreateNestedManyWithoutApiKeyInput = {
    create?: XOR<PartnerApiCallCreateWithoutApiKeyInput, PartnerApiCallUncheckedCreateWithoutApiKeyInput> | PartnerApiCallCreateWithoutApiKeyInput[] | PartnerApiCallUncheckedCreateWithoutApiKeyInput[]
    connectOrCreate?: PartnerApiCallCreateOrConnectWithoutApiKeyInput | PartnerApiCallCreateOrConnectWithoutApiKeyInput[]
    createMany?: PartnerApiCallCreateManyApiKeyInputEnvelope
    connect?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
  }

  export type PartnerApiCallUncheckedCreateNestedManyWithoutApiKeyInput = {
    create?: XOR<PartnerApiCallCreateWithoutApiKeyInput, PartnerApiCallUncheckedCreateWithoutApiKeyInput> | PartnerApiCallCreateWithoutApiKeyInput[] | PartnerApiCallUncheckedCreateWithoutApiKeyInput[]
    connectOrCreate?: PartnerApiCallCreateOrConnectWithoutApiKeyInput | PartnerApiCallCreateOrConnectWithoutApiKeyInput[]
    createMany?: PartnerApiCallCreateManyApiKeyInputEnvelope
    connect?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumPartnerEnvironmentFieldUpdateOperationsInput = {
    set?: $Enums.PartnerEnvironment
  }

  export type PartnerApiKeyUpdatescopesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumApiKeyStatusFieldUpdateOperationsInput = {
    set?: $Enums.ApiKeyStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PartnerApiCallUpdateManyWithoutApiKeyNestedInput = {
    create?: XOR<PartnerApiCallCreateWithoutApiKeyInput, PartnerApiCallUncheckedCreateWithoutApiKeyInput> | PartnerApiCallCreateWithoutApiKeyInput[] | PartnerApiCallUncheckedCreateWithoutApiKeyInput[]
    connectOrCreate?: PartnerApiCallCreateOrConnectWithoutApiKeyInput | PartnerApiCallCreateOrConnectWithoutApiKeyInput[]
    upsert?: PartnerApiCallUpsertWithWhereUniqueWithoutApiKeyInput | PartnerApiCallUpsertWithWhereUniqueWithoutApiKeyInput[]
    createMany?: PartnerApiCallCreateManyApiKeyInputEnvelope
    set?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
    disconnect?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
    delete?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
    connect?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
    update?: PartnerApiCallUpdateWithWhereUniqueWithoutApiKeyInput | PartnerApiCallUpdateWithWhereUniqueWithoutApiKeyInput[]
    updateMany?: PartnerApiCallUpdateManyWithWhereWithoutApiKeyInput | PartnerApiCallUpdateManyWithWhereWithoutApiKeyInput[]
    deleteMany?: PartnerApiCallScalarWhereInput | PartnerApiCallScalarWhereInput[]
  }

  export type PartnerApiCallUncheckedUpdateManyWithoutApiKeyNestedInput = {
    create?: XOR<PartnerApiCallCreateWithoutApiKeyInput, PartnerApiCallUncheckedCreateWithoutApiKeyInput> | PartnerApiCallCreateWithoutApiKeyInput[] | PartnerApiCallUncheckedCreateWithoutApiKeyInput[]
    connectOrCreate?: PartnerApiCallCreateOrConnectWithoutApiKeyInput | PartnerApiCallCreateOrConnectWithoutApiKeyInput[]
    upsert?: PartnerApiCallUpsertWithWhereUniqueWithoutApiKeyInput | PartnerApiCallUpsertWithWhereUniqueWithoutApiKeyInput[]
    createMany?: PartnerApiCallCreateManyApiKeyInputEnvelope
    set?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
    disconnect?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
    delete?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
    connect?: PartnerApiCallWhereUniqueInput | PartnerApiCallWhereUniqueInput[]
    update?: PartnerApiCallUpdateWithWhereUniqueWithoutApiKeyInput | PartnerApiCallUpdateWithWhereUniqueWithoutApiKeyInput[]
    updateMany?: PartnerApiCallUpdateManyWithWhereWithoutApiKeyInput | PartnerApiCallUpdateManyWithWhereWithoutApiKeyInput[]
    deleteMany?: PartnerApiCallScalarWhereInput | PartnerApiCallScalarWhereInput[]
  }

  export type PartnerWebhookCreateeventsInput = {
    set: string[]
  }

  export type PartnerWebhookDeliveryCreateNestedManyWithoutWebhookInput = {
    create?: XOR<PartnerWebhookDeliveryCreateWithoutWebhookInput, PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput> | PartnerWebhookDeliveryCreateWithoutWebhookInput[] | PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput[]
    connectOrCreate?: PartnerWebhookDeliveryCreateOrConnectWithoutWebhookInput | PartnerWebhookDeliveryCreateOrConnectWithoutWebhookInput[]
    createMany?: PartnerWebhookDeliveryCreateManyWebhookInputEnvelope
    connect?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
  }

  export type PartnerWebhookDeliveryUncheckedCreateNestedManyWithoutWebhookInput = {
    create?: XOR<PartnerWebhookDeliveryCreateWithoutWebhookInput, PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput> | PartnerWebhookDeliveryCreateWithoutWebhookInput[] | PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput[]
    connectOrCreate?: PartnerWebhookDeliveryCreateOrConnectWithoutWebhookInput | PartnerWebhookDeliveryCreateOrConnectWithoutWebhookInput[]
    createMany?: PartnerWebhookDeliveryCreateManyWebhookInputEnvelope
    connect?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
  }

  export type PartnerWebhookUpdateeventsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type EnumWebhookStatusFieldUpdateOperationsInput = {
    set?: $Enums.WebhookStatus
  }

  export type PartnerWebhookDeliveryUpdateManyWithoutWebhookNestedInput = {
    create?: XOR<PartnerWebhookDeliveryCreateWithoutWebhookInput, PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput> | PartnerWebhookDeliveryCreateWithoutWebhookInput[] | PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput[]
    connectOrCreate?: PartnerWebhookDeliveryCreateOrConnectWithoutWebhookInput | PartnerWebhookDeliveryCreateOrConnectWithoutWebhookInput[]
    upsert?: PartnerWebhookDeliveryUpsertWithWhereUniqueWithoutWebhookInput | PartnerWebhookDeliveryUpsertWithWhereUniqueWithoutWebhookInput[]
    createMany?: PartnerWebhookDeliveryCreateManyWebhookInputEnvelope
    set?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
    disconnect?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
    delete?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
    connect?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
    update?: PartnerWebhookDeliveryUpdateWithWhereUniqueWithoutWebhookInput | PartnerWebhookDeliveryUpdateWithWhereUniqueWithoutWebhookInput[]
    updateMany?: PartnerWebhookDeliveryUpdateManyWithWhereWithoutWebhookInput | PartnerWebhookDeliveryUpdateManyWithWhereWithoutWebhookInput[]
    deleteMany?: PartnerWebhookDeliveryScalarWhereInput | PartnerWebhookDeliveryScalarWhereInput[]
  }

  export type PartnerWebhookDeliveryUncheckedUpdateManyWithoutWebhookNestedInput = {
    create?: XOR<PartnerWebhookDeliveryCreateWithoutWebhookInput, PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput> | PartnerWebhookDeliveryCreateWithoutWebhookInput[] | PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput[]
    connectOrCreate?: PartnerWebhookDeliveryCreateOrConnectWithoutWebhookInput | PartnerWebhookDeliveryCreateOrConnectWithoutWebhookInput[]
    upsert?: PartnerWebhookDeliveryUpsertWithWhereUniqueWithoutWebhookInput | PartnerWebhookDeliveryUpsertWithWhereUniqueWithoutWebhookInput[]
    createMany?: PartnerWebhookDeliveryCreateManyWebhookInputEnvelope
    set?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
    disconnect?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
    delete?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
    connect?: PartnerWebhookDeliveryWhereUniqueInput | PartnerWebhookDeliveryWhereUniqueInput[]
    update?: PartnerWebhookDeliveryUpdateWithWhereUniqueWithoutWebhookInput | PartnerWebhookDeliveryUpdateWithWhereUniqueWithoutWebhookInput[]
    updateMany?: PartnerWebhookDeliveryUpdateManyWithWhereWithoutWebhookInput | PartnerWebhookDeliveryUpdateManyWithWhereWithoutWebhookInput[]
    deleteMany?: PartnerWebhookDeliveryScalarWhereInput | PartnerWebhookDeliveryScalarWhereInput[]
  }

  export type PartnerWebhookCreateNestedOneWithoutDeliveriesInput = {
    create?: XOR<PartnerWebhookCreateWithoutDeliveriesInput, PartnerWebhookUncheckedCreateWithoutDeliveriesInput>
    connectOrCreate?: PartnerWebhookCreateOrConnectWithoutDeliveriesInput
    connect?: PartnerWebhookWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type PartnerWebhookUpdateOneRequiredWithoutDeliveriesNestedInput = {
    create?: XOR<PartnerWebhookCreateWithoutDeliveriesInput, PartnerWebhookUncheckedCreateWithoutDeliveriesInput>
    connectOrCreate?: PartnerWebhookCreateOrConnectWithoutDeliveriesInput
    upsert?: PartnerWebhookUpsertWithoutDeliveriesInput
    connect?: PartnerWebhookWhereUniqueInput
    update?: XOR<XOR<PartnerWebhookUpdateToOneWithWhereWithoutDeliveriesInput, PartnerWebhookUpdateWithoutDeliveriesInput>, PartnerWebhookUncheckedUpdateWithoutDeliveriesInput>
  }

  export type PartnerApiKeyCreateNestedOneWithoutCallsInput = {
    create?: XOR<PartnerApiKeyCreateWithoutCallsInput, PartnerApiKeyUncheckedCreateWithoutCallsInput>
    connectOrCreate?: PartnerApiKeyCreateOrConnectWithoutCallsInput
    connect?: PartnerApiKeyWhereUniqueInput
  }

  export type PartnerApiKeyUpdateOneWithoutCallsNestedInput = {
    create?: XOR<PartnerApiKeyCreateWithoutCallsInput, PartnerApiKeyUncheckedCreateWithoutCallsInput>
    connectOrCreate?: PartnerApiKeyCreateOrConnectWithoutCallsInput
    upsert?: PartnerApiKeyUpsertWithoutCallsInput
    disconnect?: PartnerApiKeyWhereInput | boolean
    delete?: PartnerApiKeyWhereInput | boolean
    connect?: PartnerApiKeyWhereUniqueInput
    update?: XOR<XOR<PartnerApiKeyUpdateToOneWithWhereWithoutCallsInput, PartnerApiKeyUpdateWithoutCallsInput>, PartnerApiKeyUncheckedUpdateWithoutCallsInput>
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

  export type NestedEnumPartnerEnvironmentFilter<$PrismaModel = never> = {
    equals?: $Enums.PartnerEnvironment | EnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    in?: $Enums.PartnerEnvironment[] | ListEnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    notIn?: $Enums.PartnerEnvironment[] | ListEnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    not?: NestedEnumPartnerEnvironmentFilter<$PrismaModel> | $Enums.PartnerEnvironment
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

  export type NestedEnumApiKeyStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ApiKeyStatus | EnumApiKeyStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ApiKeyStatus[] | ListEnumApiKeyStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ApiKeyStatus[] | ListEnumApiKeyStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumApiKeyStatusFilter<$PrismaModel> | $Enums.ApiKeyStatus
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

  export type NestedEnumPartnerEnvironmentWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PartnerEnvironment | EnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    in?: $Enums.PartnerEnvironment[] | ListEnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    notIn?: $Enums.PartnerEnvironment[] | ListEnumPartnerEnvironmentFieldRefInput<$PrismaModel>
    not?: NestedEnumPartnerEnvironmentWithAggregatesFilter<$PrismaModel> | $Enums.PartnerEnvironment
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPartnerEnvironmentFilter<$PrismaModel>
    _max?: NestedEnumPartnerEnvironmentFilter<$PrismaModel>
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

  export type NestedEnumApiKeyStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ApiKeyStatus | EnumApiKeyStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ApiKeyStatus[] | ListEnumApiKeyStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ApiKeyStatus[] | ListEnumApiKeyStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumApiKeyStatusWithAggregatesFilter<$PrismaModel> | $Enums.ApiKeyStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumApiKeyStatusFilter<$PrismaModel>
    _max?: NestedEnumApiKeyStatusFilter<$PrismaModel>
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

  export type NestedEnumWebhookStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WebhookStatus | EnumWebhookStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WebhookStatus[] | ListEnumWebhookStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WebhookStatus[] | ListEnumWebhookStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWebhookStatusFilter<$PrismaModel> | $Enums.WebhookStatus
  }

  export type NestedEnumWebhookStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WebhookStatus | EnumWebhookStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WebhookStatus[] | ListEnumWebhookStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WebhookStatus[] | ListEnumWebhookStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWebhookStatusWithAggregatesFilter<$PrismaModel> | $Enums.WebhookStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWebhookStatusFilter<$PrismaModel>
    _max?: NestedEnumWebhookStatusFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type PartnerApiCallCreateWithoutApiKeyInput = {
    id?: string
    companyId?: string | null
    method: string
    path: string
    statusCode: number
    durationMs: number
    ip?: string | null
    userAgent?: string | null
    errorCode?: string | null
    createdAt?: Date | string
  }

  export type PartnerApiCallUncheckedCreateWithoutApiKeyInput = {
    id?: string
    companyId?: string | null
    method: string
    path: string
    statusCode: number
    durationMs: number
    ip?: string | null
    userAgent?: string | null
    errorCode?: string | null
    createdAt?: Date | string
  }

  export type PartnerApiCallCreateOrConnectWithoutApiKeyInput = {
    where: PartnerApiCallWhereUniqueInput
    create: XOR<PartnerApiCallCreateWithoutApiKeyInput, PartnerApiCallUncheckedCreateWithoutApiKeyInput>
  }

  export type PartnerApiCallCreateManyApiKeyInputEnvelope = {
    data: PartnerApiCallCreateManyApiKeyInput | PartnerApiCallCreateManyApiKeyInput[]
    skipDuplicates?: boolean
  }

  export type PartnerApiCallUpsertWithWhereUniqueWithoutApiKeyInput = {
    where: PartnerApiCallWhereUniqueInput
    update: XOR<PartnerApiCallUpdateWithoutApiKeyInput, PartnerApiCallUncheckedUpdateWithoutApiKeyInput>
    create: XOR<PartnerApiCallCreateWithoutApiKeyInput, PartnerApiCallUncheckedCreateWithoutApiKeyInput>
  }

  export type PartnerApiCallUpdateWithWhereUniqueWithoutApiKeyInput = {
    where: PartnerApiCallWhereUniqueInput
    data: XOR<PartnerApiCallUpdateWithoutApiKeyInput, PartnerApiCallUncheckedUpdateWithoutApiKeyInput>
  }

  export type PartnerApiCallUpdateManyWithWhereWithoutApiKeyInput = {
    where: PartnerApiCallScalarWhereInput
    data: XOR<PartnerApiCallUpdateManyMutationInput, PartnerApiCallUncheckedUpdateManyWithoutApiKeyInput>
  }

  export type PartnerApiCallScalarWhereInput = {
    AND?: PartnerApiCallScalarWhereInput | PartnerApiCallScalarWhereInput[]
    OR?: PartnerApiCallScalarWhereInput[]
    NOT?: PartnerApiCallScalarWhereInput | PartnerApiCallScalarWhereInput[]
    id?: StringFilter<"PartnerApiCall"> | string
    apiKeyId?: StringNullableFilter<"PartnerApiCall"> | string | null
    companyId?: StringNullableFilter<"PartnerApiCall"> | string | null
    method?: StringFilter<"PartnerApiCall"> | string
    path?: StringFilter<"PartnerApiCall"> | string
    statusCode?: IntFilter<"PartnerApiCall"> | number
    durationMs?: IntFilter<"PartnerApiCall"> | number
    ip?: StringNullableFilter<"PartnerApiCall"> | string | null
    userAgent?: StringNullableFilter<"PartnerApiCall"> | string | null
    errorCode?: StringNullableFilter<"PartnerApiCall"> | string | null
    createdAt?: DateTimeFilter<"PartnerApiCall"> | Date | string
  }

  export type PartnerWebhookDeliveryCreateWithoutWebhookInput = {
    id?: string
    companyId: string
    eventType: string
    entityId: string
    attempt?: number
    statusCode?: number | null
    success?: boolean
    error?: string | null
    durationMs?: number | null
    createdAt?: Date | string
  }

  export type PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput = {
    id?: string
    companyId: string
    eventType: string
    entityId: string
    attempt?: number
    statusCode?: number | null
    success?: boolean
    error?: string | null
    durationMs?: number | null
    createdAt?: Date | string
  }

  export type PartnerWebhookDeliveryCreateOrConnectWithoutWebhookInput = {
    where: PartnerWebhookDeliveryWhereUniqueInput
    create: XOR<PartnerWebhookDeliveryCreateWithoutWebhookInput, PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput>
  }

  export type PartnerWebhookDeliveryCreateManyWebhookInputEnvelope = {
    data: PartnerWebhookDeliveryCreateManyWebhookInput | PartnerWebhookDeliveryCreateManyWebhookInput[]
    skipDuplicates?: boolean
  }

  export type PartnerWebhookDeliveryUpsertWithWhereUniqueWithoutWebhookInput = {
    where: PartnerWebhookDeliveryWhereUniqueInput
    update: XOR<PartnerWebhookDeliveryUpdateWithoutWebhookInput, PartnerWebhookDeliveryUncheckedUpdateWithoutWebhookInput>
    create: XOR<PartnerWebhookDeliveryCreateWithoutWebhookInput, PartnerWebhookDeliveryUncheckedCreateWithoutWebhookInput>
  }

  export type PartnerWebhookDeliveryUpdateWithWhereUniqueWithoutWebhookInput = {
    where: PartnerWebhookDeliveryWhereUniqueInput
    data: XOR<PartnerWebhookDeliveryUpdateWithoutWebhookInput, PartnerWebhookDeliveryUncheckedUpdateWithoutWebhookInput>
  }

  export type PartnerWebhookDeliveryUpdateManyWithWhereWithoutWebhookInput = {
    where: PartnerWebhookDeliveryScalarWhereInput
    data: XOR<PartnerWebhookDeliveryUpdateManyMutationInput, PartnerWebhookDeliveryUncheckedUpdateManyWithoutWebhookInput>
  }

  export type PartnerWebhookDeliveryScalarWhereInput = {
    AND?: PartnerWebhookDeliveryScalarWhereInput | PartnerWebhookDeliveryScalarWhereInput[]
    OR?: PartnerWebhookDeliveryScalarWhereInput[]
    NOT?: PartnerWebhookDeliveryScalarWhereInput | PartnerWebhookDeliveryScalarWhereInput[]
    id?: StringFilter<"PartnerWebhookDelivery"> | string
    webhookId?: StringFilter<"PartnerWebhookDelivery"> | string
    companyId?: StringFilter<"PartnerWebhookDelivery"> | string
    eventType?: StringFilter<"PartnerWebhookDelivery"> | string
    entityId?: StringFilter<"PartnerWebhookDelivery"> | string
    attempt?: IntFilter<"PartnerWebhookDelivery"> | number
    statusCode?: IntNullableFilter<"PartnerWebhookDelivery"> | number | null
    success?: BoolFilter<"PartnerWebhookDelivery"> | boolean
    error?: StringNullableFilter<"PartnerWebhookDelivery"> | string | null
    durationMs?: IntNullableFilter<"PartnerWebhookDelivery"> | number | null
    createdAt?: DateTimeFilter<"PartnerWebhookDelivery"> | Date | string
  }

  export type PartnerWebhookCreateWithoutDeliveriesInput = {
    id?: string
    companyId: string
    apiKeyId?: string | null
    url: string
    secret: string
    events?: PartnerWebhookCreateeventsInput | string[]
    status?: $Enums.WebhookStatus
    description?: string | null
    failureCount?: number
    lastSuccessAt?: Date | string | null
    lastFailureAt?: Date | string | null
    createdAt?: Date | string
  }

  export type PartnerWebhookUncheckedCreateWithoutDeliveriesInput = {
    id?: string
    companyId: string
    apiKeyId?: string | null
    url: string
    secret: string
    events?: PartnerWebhookCreateeventsInput | string[]
    status?: $Enums.WebhookStatus
    description?: string | null
    failureCount?: number
    lastSuccessAt?: Date | string | null
    lastFailureAt?: Date | string | null
    createdAt?: Date | string
  }

  export type PartnerWebhookCreateOrConnectWithoutDeliveriesInput = {
    where: PartnerWebhookWhereUniqueInput
    create: XOR<PartnerWebhookCreateWithoutDeliveriesInput, PartnerWebhookUncheckedCreateWithoutDeliveriesInput>
  }

  export type PartnerWebhookUpsertWithoutDeliveriesInput = {
    update: XOR<PartnerWebhookUpdateWithoutDeliveriesInput, PartnerWebhookUncheckedUpdateWithoutDeliveriesInput>
    create: XOR<PartnerWebhookCreateWithoutDeliveriesInput, PartnerWebhookUncheckedCreateWithoutDeliveriesInput>
    where?: PartnerWebhookWhereInput
  }

  export type PartnerWebhookUpdateToOneWithWhereWithoutDeliveriesInput = {
    where?: PartnerWebhookWhereInput
    data: XOR<PartnerWebhookUpdateWithoutDeliveriesInput, PartnerWebhookUncheckedUpdateWithoutDeliveriesInput>
  }

  export type PartnerWebhookUpdateWithoutDeliveriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    apiKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    events?: PartnerWebhookUpdateeventsInput | string[]
    status?: EnumWebhookStatusFieldUpdateOperationsInput | $Enums.WebhookStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    failureCount?: IntFieldUpdateOperationsInput | number
    lastSuccessAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastFailureAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerWebhookUncheckedUpdateWithoutDeliveriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    apiKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    url?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    events?: PartnerWebhookUpdateeventsInput | string[]
    status?: EnumWebhookStatusFieldUpdateOperationsInput | $Enums.WebhookStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    failureCount?: IntFieldUpdateOperationsInput | number
    lastSuccessAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastFailureAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerApiKeyCreateWithoutCallsInput = {
    id?: string
    companyId: string
    name: string
    environment?: $Enums.PartnerEnvironment
    keyPrefix: string
    keyHash: string
    scopes?: PartnerApiKeyCreatescopesInput | string[]
    rateLimitPerMin?: number
    status?: $Enums.ApiKeyStatus
    lastUsedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdBy?: string | null
    createdAt?: Date | string
    revokedAt?: Date | string | null
  }

  export type PartnerApiKeyUncheckedCreateWithoutCallsInput = {
    id?: string
    companyId: string
    name: string
    environment?: $Enums.PartnerEnvironment
    keyPrefix: string
    keyHash: string
    scopes?: PartnerApiKeyCreatescopesInput | string[]
    rateLimitPerMin?: number
    status?: $Enums.ApiKeyStatus
    lastUsedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdBy?: string | null
    createdAt?: Date | string
    revokedAt?: Date | string | null
  }

  export type PartnerApiKeyCreateOrConnectWithoutCallsInput = {
    where: PartnerApiKeyWhereUniqueInput
    create: XOR<PartnerApiKeyCreateWithoutCallsInput, PartnerApiKeyUncheckedCreateWithoutCallsInput>
  }

  export type PartnerApiKeyUpsertWithoutCallsInput = {
    update: XOR<PartnerApiKeyUpdateWithoutCallsInput, PartnerApiKeyUncheckedUpdateWithoutCallsInput>
    create: XOR<PartnerApiKeyCreateWithoutCallsInput, PartnerApiKeyUncheckedCreateWithoutCallsInput>
    where?: PartnerApiKeyWhereInput
  }

  export type PartnerApiKeyUpdateToOneWithWhereWithoutCallsInput = {
    where?: PartnerApiKeyWhereInput
    data: XOR<PartnerApiKeyUpdateWithoutCallsInput, PartnerApiKeyUncheckedUpdateWithoutCallsInput>
  }

  export type PartnerApiKeyUpdateWithoutCallsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    environment?: EnumPartnerEnvironmentFieldUpdateOperationsInput | $Enums.PartnerEnvironment
    keyPrefix?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    scopes?: PartnerApiKeyUpdatescopesInput | string[]
    rateLimitPerMin?: IntFieldUpdateOperationsInput | number
    status?: EnumApiKeyStatusFieldUpdateOperationsInput | $Enums.ApiKeyStatus
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PartnerApiKeyUncheckedUpdateWithoutCallsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    environment?: EnumPartnerEnvironmentFieldUpdateOperationsInput | $Enums.PartnerEnvironment
    keyPrefix?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    scopes?: PartnerApiKeyUpdatescopesInput | string[]
    rateLimitPerMin?: IntFieldUpdateOperationsInput | number
    status?: EnumApiKeyStatusFieldUpdateOperationsInput | $Enums.ApiKeyStatus
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PartnerApiCallCreateManyApiKeyInput = {
    id?: string
    companyId?: string | null
    method: string
    path: string
    statusCode: number
    durationMs: number
    ip?: string | null
    userAgent?: string | null
    errorCode?: string | null
    createdAt?: Date | string
  }

  export type PartnerApiCallUpdateWithoutApiKeyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    durationMs?: IntFieldUpdateOperationsInput | number
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerApiCallUncheckedUpdateWithoutApiKeyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    durationMs?: IntFieldUpdateOperationsInput | number
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerApiCallUncheckedUpdateManyWithoutApiKeyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    durationMs?: IntFieldUpdateOperationsInput | number
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerWebhookDeliveryCreateManyWebhookInput = {
    id?: string
    companyId: string
    eventType: string
    entityId: string
    attempt?: number
    statusCode?: number | null
    success?: boolean
    error?: string | null
    durationMs?: number | null
    createdAt?: Date | string
  }

  export type PartnerWebhookDeliveryUpdateWithoutWebhookInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    attempt?: IntFieldUpdateOperationsInput | number
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    success?: BoolFieldUpdateOperationsInput | boolean
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerWebhookDeliveryUncheckedUpdateWithoutWebhookInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    attempt?: IntFieldUpdateOperationsInput | number
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    success?: BoolFieldUpdateOperationsInput | boolean
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PartnerWebhookDeliveryUncheckedUpdateManyWithoutWebhookInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    attempt?: IntFieldUpdateOperationsInput | number
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    success?: BoolFieldUpdateOperationsInput | boolean
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use PartnerApiKeyCountOutputTypeDefaultArgs instead
     */
    export type PartnerApiKeyCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PartnerApiKeyCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PartnerWebhookCountOutputTypeDefaultArgs instead
     */
    export type PartnerWebhookCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PartnerWebhookCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PartnerApiKeyDefaultArgs instead
     */
    export type PartnerApiKeyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PartnerApiKeyDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PartnerNewCallerBookingDefaultArgs instead
     */
    export type PartnerNewCallerBookingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PartnerNewCallerBookingDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PartnerWebhookDefaultArgs instead
     */
    export type PartnerWebhookArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PartnerWebhookDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PartnerWebhookDeliveryDefaultArgs instead
     */
    export type PartnerWebhookDeliveryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PartnerWebhookDeliveryDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PartnerApiCallDefaultArgs instead
     */
    export type PartnerApiCallArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PartnerApiCallDefaultArgs<ExtArgs>

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