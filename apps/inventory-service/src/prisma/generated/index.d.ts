
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
 * Model InventoryItem
 * 
 */
export type InventoryItem = $Result.DefaultSelection<Prisma.$InventoryItemPayload>
/**
 * Model StockLocation
 * 
 */
export type StockLocation = $Result.DefaultSelection<Prisma.$StockLocationPayload>
/**
 * Model StockLevel
 * 
 */
export type StockLevel = $Result.DefaultSelection<Prisma.$StockLevelPayload>
/**
 * Model StockMovement
 * 
 */
export type StockMovement = $Result.DefaultSelection<Prisma.$StockMovementPayload>
/**
 * Model PurchaseOrder
 * 
 */
export type PurchaseOrder = $Result.DefaultSelection<Prisma.$PurchaseOrderPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ItemCategory: {
  PART: 'PART',
  MATERIAL: 'MATERIAL',
  TOOL: 'TOOL',
  CONSUMABLE: 'CONSUMABLE'
};

export type ItemCategory = (typeof ItemCategory)[keyof typeof ItemCategory]


export const LocationType: {
  WAREHOUSE: 'WAREHOUSE',
  VAN: 'VAN'
};

export type LocationType = (typeof LocationType)[keyof typeof LocationType]


export const MovementType: {
  INTAKE: 'INTAKE',
  TRANSFER: 'TRANSFER',
  CONSUME: 'CONSUME',
  ADJUST: 'ADJUST',
  RETURN: 'RETURN'
};

export type MovementType = (typeof MovementType)[keyof typeof MovementType]


export const PurchaseOrderStatus: {
  DRAFT: 'DRAFT',
  ORDERED: 'ORDERED',
  PARTIAL: 'PARTIAL',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
};

export type PurchaseOrderStatus = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus]

}

export type ItemCategory = $Enums.ItemCategory

export const ItemCategory: typeof $Enums.ItemCategory

export type LocationType = $Enums.LocationType

export const LocationType: typeof $Enums.LocationType

export type MovementType = $Enums.MovementType

export const MovementType: typeof $Enums.MovementType

export type PurchaseOrderStatus = $Enums.PurchaseOrderStatus

export const PurchaseOrderStatus: typeof $Enums.PurchaseOrderStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more InventoryItems
 * const inventoryItems = await prisma.inventoryItem.findMany()
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
   * // Fetch zero or more InventoryItems
   * const inventoryItems = await prisma.inventoryItem.findMany()
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
   * `prisma.inventoryItem`: Exposes CRUD operations for the **InventoryItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more InventoryItems
    * const inventoryItems = await prisma.inventoryItem.findMany()
    * ```
    */
  get inventoryItem(): Prisma.InventoryItemDelegate<ExtArgs>;

  /**
   * `prisma.stockLocation`: Exposes CRUD operations for the **StockLocation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StockLocations
    * const stockLocations = await prisma.stockLocation.findMany()
    * ```
    */
  get stockLocation(): Prisma.StockLocationDelegate<ExtArgs>;

  /**
   * `prisma.stockLevel`: Exposes CRUD operations for the **StockLevel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StockLevels
    * const stockLevels = await prisma.stockLevel.findMany()
    * ```
    */
  get stockLevel(): Prisma.StockLevelDelegate<ExtArgs>;

  /**
   * `prisma.stockMovement`: Exposes CRUD operations for the **StockMovement** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StockMovements
    * const stockMovements = await prisma.stockMovement.findMany()
    * ```
    */
  get stockMovement(): Prisma.StockMovementDelegate<ExtArgs>;

  /**
   * `prisma.purchaseOrder`: Exposes CRUD operations for the **PurchaseOrder** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PurchaseOrders
    * const purchaseOrders = await prisma.purchaseOrder.findMany()
    * ```
    */
  get purchaseOrder(): Prisma.PurchaseOrderDelegate<ExtArgs>;
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
    InventoryItem: 'InventoryItem',
    StockLocation: 'StockLocation',
    StockLevel: 'StockLevel',
    StockMovement: 'StockMovement',
    PurchaseOrder: 'PurchaseOrder'
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
      modelProps: "inventoryItem" | "stockLocation" | "stockLevel" | "stockMovement" | "purchaseOrder"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      InventoryItem: {
        payload: Prisma.$InventoryItemPayload<ExtArgs>
        fields: Prisma.InventoryItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InventoryItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InventoryItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          findFirst: {
            args: Prisma.InventoryItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InventoryItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          findMany: {
            args: Prisma.InventoryItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>[]
          }
          create: {
            args: Prisma.InventoryItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          createMany: {
            args: Prisma.InventoryItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InventoryItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>[]
          }
          delete: {
            args: Prisma.InventoryItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          update: {
            args: Prisma.InventoryItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          deleteMany: {
            args: Prisma.InventoryItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InventoryItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.InventoryItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          aggregate: {
            args: Prisma.InventoryItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInventoryItem>
          }
          groupBy: {
            args: Prisma.InventoryItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<InventoryItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.InventoryItemCountArgs<ExtArgs>
            result: $Utils.Optional<InventoryItemCountAggregateOutputType> | number
          }
        }
      }
      StockLocation: {
        payload: Prisma.$StockLocationPayload<ExtArgs>
        fields: Prisma.StockLocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StockLocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StockLocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload>
          }
          findFirst: {
            args: Prisma.StockLocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StockLocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload>
          }
          findMany: {
            args: Prisma.StockLocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload>[]
          }
          create: {
            args: Prisma.StockLocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload>
          }
          createMany: {
            args: Prisma.StockLocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StockLocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload>[]
          }
          delete: {
            args: Prisma.StockLocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload>
          }
          update: {
            args: Prisma.StockLocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload>
          }
          deleteMany: {
            args: Prisma.StockLocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StockLocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StockLocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLocationPayload>
          }
          aggregate: {
            args: Prisma.StockLocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStockLocation>
          }
          groupBy: {
            args: Prisma.StockLocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<StockLocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.StockLocationCountArgs<ExtArgs>
            result: $Utils.Optional<StockLocationCountAggregateOutputType> | number
          }
        }
      }
      StockLevel: {
        payload: Prisma.$StockLevelPayload<ExtArgs>
        fields: Prisma.StockLevelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StockLevelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StockLevelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload>
          }
          findFirst: {
            args: Prisma.StockLevelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StockLevelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload>
          }
          findMany: {
            args: Prisma.StockLevelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload>[]
          }
          create: {
            args: Prisma.StockLevelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload>
          }
          createMany: {
            args: Prisma.StockLevelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StockLevelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload>[]
          }
          delete: {
            args: Prisma.StockLevelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload>
          }
          update: {
            args: Prisma.StockLevelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload>
          }
          deleteMany: {
            args: Prisma.StockLevelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StockLevelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StockLevelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLevelPayload>
          }
          aggregate: {
            args: Prisma.StockLevelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStockLevel>
          }
          groupBy: {
            args: Prisma.StockLevelGroupByArgs<ExtArgs>
            result: $Utils.Optional<StockLevelGroupByOutputType>[]
          }
          count: {
            args: Prisma.StockLevelCountArgs<ExtArgs>
            result: $Utils.Optional<StockLevelCountAggregateOutputType> | number
          }
        }
      }
      StockMovement: {
        payload: Prisma.$StockMovementPayload<ExtArgs>
        fields: Prisma.StockMovementFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StockMovementFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StockMovementFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          findFirst: {
            args: Prisma.StockMovementFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StockMovementFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          findMany: {
            args: Prisma.StockMovementFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>[]
          }
          create: {
            args: Prisma.StockMovementCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          createMany: {
            args: Prisma.StockMovementCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StockMovementCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>[]
          }
          delete: {
            args: Prisma.StockMovementDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          update: {
            args: Prisma.StockMovementUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          deleteMany: {
            args: Prisma.StockMovementDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StockMovementUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StockMovementUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          aggregate: {
            args: Prisma.StockMovementAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStockMovement>
          }
          groupBy: {
            args: Prisma.StockMovementGroupByArgs<ExtArgs>
            result: $Utils.Optional<StockMovementGroupByOutputType>[]
          }
          count: {
            args: Prisma.StockMovementCountArgs<ExtArgs>
            result: $Utils.Optional<StockMovementCountAggregateOutputType> | number
          }
        }
      }
      PurchaseOrder: {
        payload: Prisma.$PurchaseOrderPayload<ExtArgs>
        fields: Prisma.PurchaseOrderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PurchaseOrderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PurchaseOrderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          findFirst: {
            args: Prisma.PurchaseOrderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PurchaseOrderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          findMany: {
            args: Prisma.PurchaseOrderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>[]
          }
          create: {
            args: Prisma.PurchaseOrderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          createMany: {
            args: Prisma.PurchaseOrderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PurchaseOrderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>[]
          }
          delete: {
            args: Prisma.PurchaseOrderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          update: {
            args: Prisma.PurchaseOrderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          deleteMany: {
            args: Prisma.PurchaseOrderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PurchaseOrderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PurchaseOrderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          aggregate: {
            args: Prisma.PurchaseOrderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePurchaseOrder>
          }
          groupBy: {
            args: Prisma.PurchaseOrderGroupByArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderGroupByOutputType>[]
          }
          count: {
            args: Prisma.PurchaseOrderCountArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderCountAggregateOutputType> | number
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
   * Count Type InventoryItemCountOutputType
   */

  export type InventoryItemCountOutputType = {
    stockLevels: number
    stockMovements: number
  }

  export type InventoryItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    stockLevels?: boolean | InventoryItemCountOutputTypeCountStockLevelsArgs
    stockMovements?: boolean | InventoryItemCountOutputTypeCountStockMovementsArgs
  }

  // Custom InputTypes
  /**
   * InventoryItemCountOutputType without action
   */
  export type InventoryItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItemCountOutputType
     */
    select?: InventoryItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * InventoryItemCountOutputType without action
   */
  export type InventoryItemCountOutputTypeCountStockLevelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockLevelWhereInput
  }

  /**
   * InventoryItemCountOutputType without action
   */
  export type InventoryItemCountOutputTypeCountStockMovementsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockMovementWhereInput
  }


  /**
   * Count Type StockLocationCountOutputType
   */

  export type StockLocationCountOutputType = {
    stockLevels: number
    movementsFrom: number
    movementsTo: number
  }

  export type StockLocationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    stockLevels?: boolean | StockLocationCountOutputTypeCountStockLevelsArgs
    movementsFrom?: boolean | StockLocationCountOutputTypeCountMovementsFromArgs
    movementsTo?: boolean | StockLocationCountOutputTypeCountMovementsToArgs
  }

  // Custom InputTypes
  /**
   * StockLocationCountOutputType without action
   */
  export type StockLocationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocationCountOutputType
     */
    select?: StockLocationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * StockLocationCountOutputType without action
   */
  export type StockLocationCountOutputTypeCountStockLevelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockLevelWhereInput
  }

  /**
   * StockLocationCountOutputType without action
   */
  export type StockLocationCountOutputTypeCountMovementsFromArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockMovementWhereInput
  }

  /**
   * StockLocationCountOutputType without action
   */
  export type StockLocationCountOutputTypeCountMovementsToArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockMovementWhereInput
  }


  /**
   * Models
   */

  /**
   * Model InventoryItem
   */

  export type AggregateInventoryItem = {
    _count: InventoryItemCountAggregateOutputType | null
    _avg: InventoryItemAvgAggregateOutputType | null
    _sum: InventoryItemSumAggregateOutputType | null
    _min: InventoryItemMinAggregateOutputType | null
    _max: InventoryItemMaxAggregateOutputType | null
  }

  export type InventoryItemAvgAggregateOutputType = {
    reorderPoint: number | null
    reorderQty: number | null
  }

  export type InventoryItemSumAggregateOutputType = {
    reorderPoint: number | null
    reorderQty: number | null
  }

  export type InventoryItemMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    priceBookItemId: string | null
    sku: string | null
    name: string | null
    description: string | null
    category: $Enums.ItemCategory | null
    unit: string | null
    reorderPoint: number | null
    reorderQty: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InventoryItemMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    priceBookItemId: string | null
    sku: string | null
    name: string | null
    description: string | null
    category: $Enums.ItemCategory | null
    unit: string | null
    reorderPoint: number | null
    reorderQty: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InventoryItemCountAggregateOutputType = {
    id: number
    companyId: number
    priceBookItemId: number
    sku: number
    name: number
    description: number
    category: number
    unit: number
    reorderPoint: number
    reorderQty: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InventoryItemAvgAggregateInputType = {
    reorderPoint?: true
    reorderQty?: true
  }

  export type InventoryItemSumAggregateInputType = {
    reorderPoint?: true
    reorderQty?: true
  }

  export type InventoryItemMinAggregateInputType = {
    id?: true
    companyId?: true
    priceBookItemId?: true
    sku?: true
    name?: true
    description?: true
    category?: true
    unit?: true
    reorderPoint?: true
    reorderQty?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InventoryItemMaxAggregateInputType = {
    id?: true
    companyId?: true
    priceBookItemId?: true
    sku?: true
    name?: true
    description?: true
    category?: true
    unit?: true
    reorderPoint?: true
    reorderQty?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InventoryItemCountAggregateInputType = {
    id?: true
    companyId?: true
    priceBookItemId?: true
    sku?: true
    name?: true
    description?: true
    category?: true
    unit?: true
    reorderPoint?: true
    reorderQty?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InventoryItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryItem to aggregate.
     */
    where?: InventoryItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryItems to fetch.
     */
    orderBy?: InventoryItemOrderByWithRelationInput | InventoryItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InventoryItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned InventoryItems
    **/
    _count?: true | InventoryItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InventoryItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InventoryItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InventoryItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InventoryItemMaxAggregateInputType
  }

  export type GetInventoryItemAggregateType<T extends InventoryItemAggregateArgs> = {
        [P in keyof T & keyof AggregateInventoryItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryItem[P]>
      : GetScalarType<T[P], AggregateInventoryItem[P]>
  }




  export type InventoryItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryItemWhereInput
    orderBy?: InventoryItemOrderByWithAggregationInput | InventoryItemOrderByWithAggregationInput[]
    by: InventoryItemScalarFieldEnum[] | InventoryItemScalarFieldEnum
    having?: InventoryItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InventoryItemCountAggregateInputType | true
    _avg?: InventoryItemAvgAggregateInputType
    _sum?: InventoryItemSumAggregateInputType
    _min?: InventoryItemMinAggregateInputType
    _max?: InventoryItemMaxAggregateInputType
  }

  export type InventoryItemGroupByOutputType = {
    id: string
    companyId: string
    priceBookItemId: string | null
    sku: string
    name: string
    description: string | null
    category: $Enums.ItemCategory
    unit: string
    reorderPoint: number
    reorderQty: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: InventoryItemCountAggregateOutputType | null
    _avg: InventoryItemAvgAggregateOutputType | null
    _sum: InventoryItemSumAggregateOutputType | null
    _min: InventoryItemMinAggregateOutputType | null
    _max: InventoryItemMaxAggregateOutputType | null
  }

  type GetInventoryItemGroupByPayload<T extends InventoryItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InventoryItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InventoryItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InventoryItemGroupByOutputType[P]>
            : GetScalarType<T[P], InventoryItemGroupByOutputType[P]>
        }
      >
    >


  export type InventoryItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    priceBookItemId?: boolean
    sku?: boolean
    name?: boolean
    description?: boolean
    category?: boolean
    unit?: boolean
    reorderPoint?: boolean
    reorderQty?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    stockLevels?: boolean | InventoryItem$stockLevelsArgs<ExtArgs>
    stockMovements?: boolean | InventoryItem$stockMovementsArgs<ExtArgs>
    _count?: boolean | InventoryItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryItem"]>

  export type InventoryItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    priceBookItemId?: boolean
    sku?: boolean
    name?: boolean
    description?: boolean
    category?: boolean
    unit?: boolean
    reorderPoint?: boolean
    reorderQty?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["inventoryItem"]>

  export type InventoryItemSelectScalar = {
    id?: boolean
    companyId?: boolean
    priceBookItemId?: boolean
    sku?: boolean
    name?: boolean
    description?: boolean
    category?: boolean
    unit?: boolean
    reorderPoint?: boolean
    reorderQty?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InventoryItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    stockLevels?: boolean | InventoryItem$stockLevelsArgs<ExtArgs>
    stockMovements?: boolean | InventoryItem$stockMovementsArgs<ExtArgs>
    _count?: boolean | InventoryItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type InventoryItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $InventoryItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "InventoryItem"
    objects: {
      stockLevels: Prisma.$StockLevelPayload<ExtArgs>[]
      stockMovements: Prisma.$StockMovementPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      priceBookItemId: string | null
      sku: string
      name: string
      description: string | null
      category: $Enums.ItemCategory
      unit: string
      reorderPoint: number
      reorderQty: number
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["inventoryItem"]>
    composites: {}
  }

  type InventoryItemGetPayload<S extends boolean | null | undefined | InventoryItemDefaultArgs> = $Result.GetResult<Prisma.$InventoryItemPayload, S>

  type InventoryItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<InventoryItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: InventoryItemCountAggregateInputType | true
    }

  export interface InventoryItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['InventoryItem'], meta: { name: 'InventoryItem' } }
    /**
     * Find zero or one InventoryItem that matches the filter.
     * @param {InventoryItemFindUniqueArgs} args - Arguments to find a InventoryItem
     * @example
     * // Get one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryItemFindUniqueArgs>(args: SelectSubset<T, InventoryItemFindUniqueArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one InventoryItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {InventoryItemFindUniqueOrThrowArgs} args - Arguments to find a InventoryItem
     * @example
     * // Get one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryItemFindUniqueOrThrowArgs>(args: SelectSubset<T, InventoryItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first InventoryItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemFindFirstArgs} args - Arguments to find a InventoryItem
     * @example
     * // Get one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryItemFindFirstArgs>(args?: SelectSubset<T, InventoryItemFindFirstArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first InventoryItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemFindFirstOrThrowArgs} args - Arguments to find a InventoryItem
     * @example
     * // Get one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryItemFindFirstOrThrowArgs>(args?: SelectSubset<T, InventoryItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more InventoryItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryItems
     * const inventoryItems = await prisma.inventoryItem.findMany()
     * 
     * // Get first 10 InventoryItems
     * const inventoryItems = await prisma.inventoryItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inventoryItemWithIdOnly = await prisma.inventoryItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InventoryItemFindManyArgs>(args?: SelectSubset<T, InventoryItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a InventoryItem.
     * @param {InventoryItemCreateArgs} args - Arguments to create a InventoryItem.
     * @example
     * // Create one InventoryItem
     * const InventoryItem = await prisma.inventoryItem.create({
     *   data: {
     *     // ... data to create a InventoryItem
     *   }
     * })
     * 
     */
    create<T extends InventoryItemCreateArgs>(args: SelectSubset<T, InventoryItemCreateArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many InventoryItems.
     * @param {InventoryItemCreateManyArgs} args - Arguments to create many InventoryItems.
     * @example
     * // Create many InventoryItems
     * const inventoryItem = await prisma.inventoryItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InventoryItemCreateManyArgs>(args?: SelectSubset<T, InventoryItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many InventoryItems and returns the data saved in the database.
     * @param {InventoryItemCreateManyAndReturnArgs} args - Arguments to create many InventoryItems.
     * @example
     * // Create many InventoryItems
     * const inventoryItem = await prisma.inventoryItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many InventoryItems and only return the `id`
     * const inventoryItemWithIdOnly = await prisma.inventoryItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InventoryItemCreateManyAndReturnArgs>(args?: SelectSubset<T, InventoryItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a InventoryItem.
     * @param {InventoryItemDeleteArgs} args - Arguments to delete one InventoryItem.
     * @example
     * // Delete one InventoryItem
     * const InventoryItem = await prisma.inventoryItem.delete({
     *   where: {
     *     // ... filter to delete one InventoryItem
     *   }
     * })
     * 
     */
    delete<T extends InventoryItemDeleteArgs>(args: SelectSubset<T, InventoryItemDeleteArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one InventoryItem.
     * @param {InventoryItemUpdateArgs} args - Arguments to update one InventoryItem.
     * @example
     * // Update one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InventoryItemUpdateArgs>(args: SelectSubset<T, InventoryItemUpdateArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more InventoryItems.
     * @param {InventoryItemDeleteManyArgs} args - Arguments to filter InventoryItems to delete.
     * @example
     * // Delete a few InventoryItems
     * const { count } = await prisma.inventoryItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InventoryItemDeleteManyArgs>(args?: SelectSubset<T, InventoryItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InventoryItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryItems
     * const inventoryItem = await prisma.inventoryItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InventoryItemUpdateManyArgs>(args: SelectSubset<T, InventoryItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one InventoryItem.
     * @param {InventoryItemUpsertArgs} args - Arguments to update or create a InventoryItem.
     * @example
     * // Update or create a InventoryItem
     * const inventoryItem = await prisma.inventoryItem.upsert({
     *   create: {
     *     // ... data to create a InventoryItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryItem we want to update
     *   }
     * })
     */
    upsert<T extends InventoryItemUpsertArgs>(args: SelectSubset<T, InventoryItemUpsertArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of InventoryItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemCountArgs} args - Arguments to filter InventoryItems to count.
     * @example
     * // Count the number of InventoryItems
     * const count = await prisma.inventoryItem.count({
     *   where: {
     *     // ... the filter for the InventoryItems we want to count
     *   }
     * })
    **/
    count<T extends InventoryItemCountArgs>(
      args?: Subset<T, InventoryItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InventoryItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a InventoryItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends InventoryItemAggregateArgs>(args: Subset<T, InventoryItemAggregateArgs>): Prisma.PrismaPromise<GetInventoryItemAggregateType<T>>

    /**
     * Group by InventoryItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemGroupByArgs} args - Group by arguments.
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
      T extends InventoryItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryItemGroupByArgs['orderBy'] }
        : { orderBy?: InventoryItemGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, InventoryItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInventoryItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the InventoryItem model
   */
  readonly fields: InventoryItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    stockLevels<T extends InventoryItem$stockLevelsArgs<ExtArgs> = {}>(args?: Subset<T, InventoryItem$stockLevelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "findMany"> | Null>
    stockMovements<T extends InventoryItem$stockMovementsArgs<ExtArgs> = {}>(args?: Subset<T, InventoryItem$stockMovementsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the InventoryItem model
   */ 
  interface InventoryItemFieldRefs {
    readonly id: FieldRef<"InventoryItem", 'String'>
    readonly companyId: FieldRef<"InventoryItem", 'String'>
    readonly priceBookItemId: FieldRef<"InventoryItem", 'String'>
    readonly sku: FieldRef<"InventoryItem", 'String'>
    readonly name: FieldRef<"InventoryItem", 'String'>
    readonly description: FieldRef<"InventoryItem", 'String'>
    readonly category: FieldRef<"InventoryItem", 'ItemCategory'>
    readonly unit: FieldRef<"InventoryItem", 'String'>
    readonly reorderPoint: FieldRef<"InventoryItem", 'Int'>
    readonly reorderQty: FieldRef<"InventoryItem", 'Int'>
    readonly isActive: FieldRef<"InventoryItem", 'Boolean'>
    readonly createdAt: FieldRef<"InventoryItem", 'DateTime'>
    readonly updatedAt: FieldRef<"InventoryItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * InventoryItem findUnique
   */
  export type InventoryItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItem to fetch.
     */
    where: InventoryItemWhereUniqueInput
  }

  /**
   * InventoryItem findUniqueOrThrow
   */
  export type InventoryItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItem to fetch.
     */
    where: InventoryItemWhereUniqueInput
  }

  /**
   * InventoryItem findFirst
   */
  export type InventoryItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItem to fetch.
     */
    where?: InventoryItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryItems to fetch.
     */
    orderBy?: InventoryItemOrderByWithRelationInput | InventoryItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryItems.
     */
    cursor?: InventoryItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryItems.
     */
    distinct?: InventoryItemScalarFieldEnum | InventoryItemScalarFieldEnum[]
  }

  /**
   * InventoryItem findFirstOrThrow
   */
  export type InventoryItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItem to fetch.
     */
    where?: InventoryItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryItems to fetch.
     */
    orderBy?: InventoryItemOrderByWithRelationInput | InventoryItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryItems.
     */
    cursor?: InventoryItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryItems.
     */
    distinct?: InventoryItemScalarFieldEnum | InventoryItemScalarFieldEnum[]
  }

  /**
   * InventoryItem findMany
   */
  export type InventoryItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItems to fetch.
     */
    where?: InventoryItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryItems to fetch.
     */
    orderBy?: InventoryItemOrderByWithRelationInput | InventoryItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing InventoryItems.
     */
    cursor?: InventoryItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryItems.
     */
    skip?: number
    distinct?: InventoryItemScalarFieldEnum | InventoryItemScalarFieldEnum[]
  }

  /**
   * InventoryItem create
   */
  export type InventoryItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * The data needed to create a InventoryItem.
     */
    data: XOR<InventoryItemCreateInput, InventoryItemUncheckedCreateInput>
  }

  /**
   * InventoryItem createMany
   */
  export type InventoryItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many InventoryItems.
     */
    data: InventoryItemCreateManyInput | InventoryItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * InventoryItem createManyAndReturn
   */
  export type InventoryItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many InventoryItems.
     */
    data: InventoryItemCreateManyInput | InventoryItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * InventoryItem update
   */
  export type InventoryItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * The data needed to update a InventoryItem.
     */
    data: XOR<InventoryItemUpdateInput, InventoryItemUncheckedUpdateInput>
    /**
     * Choose, which InventoryItem to update.
     */
    where: InventoryItemWhereUniqueInput
  }

  /**
   * InventoryItem updateMany
   */
  export type InventoryItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update InventoryItems.
     */
    data: XOR<InventoryItemUpdateManyMutationInput, InventoryItemUncheckedUpdateManyInput>
    /**
     * Filter which InventoryItems to update
     */
    where?: InventoryItemWhereInput
  }

  /**
   * InventoryItem upsert
   */
  export type InventoryItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * The filter to search for the InventoryItem to update in case it exists.
     */
    where: InventoryItemWhereUniqueInput
    /**
     * In case the InventoryItem found by the `where` argument doesn't exist, create a new InventoryItem with this data.
     */
    create: XOR<InventoryItemCreateInput, InventoryItemUncheckedCreateInput>
    /**
     * In case the InventoryItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InventoryItemUpdateInput, InventoryItemUncheckedUpdateInput>
  }

  /**
   * InventoryItem delete
   */
  export type InventoryItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter which InventoryItem to delete.
     */
    where: InventoryItemWhereUniqueInput
  }

  /**
   * InventoryItem deleteMany
   */
  export type InventoryItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryItems to delete
     */
    where?: InventoryItemWhereInput
  }

  /**
   * InventoryItem.stockLevels
   */
  export type InventoryItem$stockLevelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    where?: StockLevelWhereInput
    orderBy?: StockLevelOrderByWithRelationInput | StockLevelOrderByWithRelationInput[]
    cursor?: StockLevelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StockLevelScalarFieldEnum | StockLevelScalarFieldEnum[]
  }

  /**
   * InventoryItem.stockMovements
   */
  export type InventoryItem$stockMovementsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    where?: StockMovementWhereInput
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    cursor?: StockMovementWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * InventoryItem without action
   */
  export type InventoryItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
  }


  /**
   * Model StockLocation
   */

  export type AggregateStockLocation = {
    _count: StockLocationCountAggregateOutputType | null
    _min: StockLocationMinAggregateOutputType | null
    _max: StockLocationMaxAggregateOutputType | null
  }

  export type StockLocationMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    type: $Enums.LocationType | null
    name: string | null
    technicianId: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StockLocationMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    type: $Enums.LocationType | null
    name: string | null
    technicianId: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StockLocationCountAggregateOutputType = {
    id: number
    companyId: number
    type: number
    name: number
    technicianId: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type StockLocationMinAggregateInputType = {
    id?: true
    companyId?: true
    type?: true
    name?: true
    technicianId?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StockLocationMaxAggregateInputType = {
    id?: true
    companyId?: true
    type?: true
    name?: true
    technicianId?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StockLocationCountAggregateInputType = {
    id?: true
    companyId?: true
    type?: true
    name?: true
    technicianId?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type StockLocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockLocation to aggregate.
     */
    where?: StockLocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLocations to fetch.
     */
    orderBy?: StockLocationOrderByWithRelationInput | StockLocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StockLocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StockLocations
    **/
    _count?: true | StockLocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StockLocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StockLocationMaxAggregateInputType
  }

  export type GetStockLocationAggregateType<T extends StockLocationAggregateArgs> = {
        [P in keyof T & keyof AggregateStockLocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStockLocation[P]>
      : GetScalarType<T[P], AggregateStockLocation[P]>
  }




  export type StockLocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockLocationWhereInput
    orderBy?: StockLocationOrderByWithAggregationInput | StockLocationOrderByWithAggregationInput[]
    by: StockLocationScalarFieldEnum[] | StockLocationScalarFieldEnum
    having?: StockLocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StockLocationCountAggregateInputType | true
    _min?: StockLocationMinAggregateInputType
    _max?: StockLocationMaxAggregateInputType
  }

  export type StockLocationGroupByOutputType = {
    id: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: StockLocationCountAggregateOutputType | null
    _min: StockLocationMinAggregateOutputType | null
    _max: StockLocationMaxAggregateOutputType | null
  }

  type GetStockLocationGroupByPayload<T extends StockLocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StockLocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StockLocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StockLocationGroupByOutputType[P]>
            : GetScalarType<T[P], StockLocationGroupByOutputType[P]>
        }
      >
    >


  export type StockLocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    type?: boolean
    name?: boolean
    technicianId?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    stockLevels?: boolean | StockLocation$stockLevelsArgs<ExtArgs>
    movementsFrom?: boolean | StockLocation$movementsFromArgs<ExtArgs>
    movementsTo?: boolean | StockLocation$movementsToArgs<ExtArgs>
    _count?: boolean | StockLocationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["stockLocation"]>

  export type StockLocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    type?: boolean
    name?: boolean
    technicianId?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["stockLocation"]>

  export type StockLocationSelectScalar = {
    id?: boolean
    companyId?: boolean
    type?: boolean
    name?: boolean
    technicianId?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type StockLocationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    stockLevels?: boolean | StockLocation$stockLevelsArgs<ExtArgs>
    movementsFrom?: boolean | StockLocation$movementsFromArgs<ExtArgs>
    movementsTo?: boolean | StockLocation$movementsToArgs<ExtArgs>
    _count?: boolean | StockLocationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type StockLocationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $StockLocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StockLocation"
    objects: {
      stockLevels: Prisma.$StockLevelPayload<ExtArgs>[]
      movementsFrom: Prisma.$StockMovementPayload<ExtArgs>[]
      movementsTo: Prisma.$StockMovementPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      type: $Enums.LocationType
      name: string
      technicianId: string | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["stockLocation"]>
    composites: {}
  }

  type StockLocationGetPayload<S extends boolean | null | undefined | StockLocationDefaultArgs> = $Result.GetResult<Prisma.$StockLocationPayload, S>

  type StockLocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StockLocationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StockLocationCountAggregateInputType | true
    }

  export interface StockLocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StockLocation'], meta: { name: 'StockLocation' } }
    /**
     * Find zero or one StockLocation that matches the filter.
     * @param {StockLocationFindUniqueArgs} args - Arguments to find a StockLocation
     * @example
     * // Get one StockLocation
     * const stockLocation = await prisma.stockLocation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StockLocationFindUniqueArgs>(args: SelectSubset<T, StockLocationFindUniqueArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one StockLocation that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StockLocationFindUniqueOrThrowArgs} args - Arguments to find a StockLocation
     * @example
     * // Get one StockLocation
     * const stockLocation = await prisma.stockLocation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StockLocationFindUniqueOrThrowArgs>(args: SelectSubset<T, StockLocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first StockLocation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLocationFindFirstArgs} args - Arguments to find a StockLocation
     * @example
     * // Get one StockLocation
     * const stockLocation = await prisma.stockLocation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StockLocationFindFirstArgs>(args?: SelectSubset<T, StockLocationFindFirstArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first StockLocation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLocationFindFirstOrThrowArgs} args - Arguments to find a StockLocation
     * @example
     * // Get one StockLocation
     * const stockLocation = await prisma.stockLocation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StockLocationFindFirstOrThrowArgs>(args?: SelectSubset<T, StockLocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more StockLocations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StockLocations
     * const stockLocations = await prisma.stockLocation.findMany()
     * 
     * // Get first 10 StockLocations
     * const stockLocations = await prisma.stockLocation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const stockLocationWithIdOnly = await prisma.stockLocation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StockLocationFindManyArgs>(args?: SelectSubset<T, StockLocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a StockLocation.
     * @param {StockLocationCreateArgs} args - Arguments to create a StockLocation.
     * @example
     * // Create one StockLocation
     * const StockLocation = await prisma.stockLocation.create({
     *   data: {
     *     // ... data to create a StockLocation
     *   }
     * })
     * 
     */
    create<T extends StockLocationCreateArgs>(args: SelectSubset<T, StockLocationCreateArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many StockLocations.
     * @param {StockLocationCreateManyArgs} args - Arguments to create many StockLocations.
     * @example
     * // Create many StockLocations
     * const stockLocation = await prisma.stockLocation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StockLocationCreateManyArgs>(args?: SelectSubset<T, StockLocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StockLocations and returns the data saved in the database.
     * @param {StockLocationCreateManyAndReturnArgs} args - Arguments to create many StockLocations.
     * @example
     * // Create many StockLocations
     * const stockLocation = await prisma.stockLocation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StockLocations and only return the `id`
     * const stockLocationWithIdOnly = await prisma.stockLocation.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StockLocationCreateManyAndReturnArgs>(args?: SelectSubset<T, StockLocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a StockLocation.
     * @param {StockLocationDeleteArgs} args - Arguments to delete one StockLocation.
     * @example
     * // Delete one StockLocation
     * const StockLocation = await prisma.stockLocation.delete({
     *   where: {
     *     // ... filter to delete one StockLocation
     *   }
     * })
     * 
     */
    delete<T extends StockLocationDeleteArgs>(args: SelectSubset<T, StockLocationDeleteArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one StockLocation.
     * @param {StockLocationUpdateArgs} args - Arguments to update one StockLocation.
     * @example
     * // Update one StockLocation
     * const stockLocation = await prisma.stockLocation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StockLocationUpdateArgs>(args: SelectSubset<T, StockLocationUpdateArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more StockLocations.
     * @param {StockLocationDeleteManyArgs} args - Arguments to filter StockLocations to delete.
     * @example
     * // Delete a few StockLocations
     * const { count } = await prisma.stockLocation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StockLocationDeleteManyArgs>(args?: SelectSubset<T, StockLocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StockLocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StockLocations
     * const stockLocation = await prisma.stockLocation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StockLocationUpdateManyArgs>(args: SelectSubset<T, StockLocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StockLocation.
     * @param {StockLocationUpsertArgs} args - Arguments to update or create a StockLocation.
     * @example
     * // Update or create a StockLocation
     * const stockLocation = await prisma.stockLocation.upsert({
     *   create: {
     *     // ... data to create a StockLocation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StockLocation we want to update
     *   }
     * })
     */
    upsert<T extends StockLocationUpsertArgs>(args: SelectSubset<T, StockLocationUpsertArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of StockLocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLocationCountArgs} args - Arguments to filter StockLocations to count.
     * @example
     * // Count the number of StockLocations
     * const count = await prisma.stockLocation.count({
     *   where: {
     *     // ... the filter for the StockLocations we want to count
     *   }
     * })
    **/
    count<T extends StockLocationCountArgs>(
      args?: Subset<T, StockLocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StockLocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StockLocation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends StockLocationAggregateArgs>(args: Subset<T, StockLocationAggregateArgs>): Prisma.PrismaPromise<GetStockLocationAggregateType<T>>

    /**
     * Group by StockLocation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLocationGroupByArgs} args - Group by arguments.
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
      T extends StockLocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StockLocationGroupByArgs['orderBy'] }
        : { orderBy?: StockLocationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, StockLocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStockLocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StockLocation model
   */
  readonly fields: StockLocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StockLocation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StockLocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    stockLevels<T extends StockLocation$stockLevelsArgs<ExtArgs> = {}>(args?: Subset<T, StockLocation$stockLevelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "findMany"> | Null>
    movementsFrom<T extends StockLocation$movementsFromArgs<ExtArgs> = {}>(args?: Subset<T, StockLocation$movementsFromArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findMany"> | Null>
    movementsTo<T extends StockLocation$movementsToArgs<ExtArgs> = {}>(args?: Subset<T, StockLocation$movementsToArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the StockLocation model
   */ 
  interface StockLocationFieldRefs {
    readonly id: FieldRef<"StockLocation", 'String'>
    readonly companyId: FieldRef<"StockLocation", 'String'>
    readonly type: FieldRef<"StockLocation", 'LocationType'>
    readonly name: FieldRef<"StockLocation", 'String'>
    readonly technicianId: FieldRef<"StockLocation", 'String'>
    readonly isActive: FieldRef<"StockLocation", 'Boolean'>
    readonly createdAt: FieldRef<"StockLocation", 'DateTime'>
    readonly updatedAt: FieldRef<"StockLocation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StockLocation findUnique
   */
  export type StockLocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    /**
     * Filter, which StockLocation to fetch.
     */
    where: StockLocationWhereUniqueInput
  }

  /**
   * StockLocation findUniqueOrThrow
   */
  export type StockLocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    /**
     * Filter, which StockLocation to fetch.
     */
    where: StockLocationWhereUniqueInput
  }

  /**
   * StockLocation findFirst
   */
  export type StockLocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    /**
     * Filter, which StockLocation to fetch.
     */
    where?: StockLocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLocations to fetch.
     */
    orderBy?: StockLocationOrderByWithRelationInput | StockLocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockLocations.
     */
    cursor?: StockLocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockLocations.
     */
    distinct?: StockLocationScalarFieldEnum | StockLocationScalarFieldEnum[]
  }

  /**
   * StockLocation findFirstOrThrow
   */
  export type StockLocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    /**
     * Filter, which StockLocation to fetch.
     */
    where?: StockLocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLocations to fetch.
     */
    orderBy?: StockLocationOrderByWithRelationInput | StockLocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockLocations.
     */
    cursor?: StockLocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockLocations.
     */
    distinct?: StockLocationScalarFieldEnum | StockLocationScalarFieldEnum[]
  }

  /**
   * StockLocation findMany
   */
  export type StockLocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    /**
     * Filter, which StockLocations to fetch.
     */
    where?: StockLocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLocations to fetch.
     */
    orderBy?: StockLocationOrderByWithRelationInput | StockLocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StockLocations.
     */
    cursor?: StockLocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLocations.
     */
    skip?: number
    distinct?: StockLocationScalarFieldEnum | StockLocationScalarFieldEnum[]
  }

  /**
   * StockLocation create
   */
  export type StockLocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    /**
     * The data needed to create a StockLocation.
     */
    data: XOR<StockLocationCreateInput, StockLocationUncheckedCreateInput>
  }

  /**
   * StockLocation createMany
   */
  export type StockLocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StockLocations.
     */
    data: StockLocationCreateManyInput | StockLocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StockLocation createManyAndReturn
   */
  export type StockLocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many StockLocations.
     */
    data: StockLocationCreateManyInput | StockLocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StockLocation update
   */
  export type StockLocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    /**
     * The data needed to update a StockLocation.
     */
    data: XOR<StockLocationUpdateInput, StockLocationUncheckedUpdateInput>
    /**
     * Choose, which StockLocation to update.
     */
    where: StockLocationWhereUniqueInput
  }

  /**
   * StockLocation updateMany
   */
  export type StockLocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StockLocations.
     */
    data: XOR<StockLocationUpdateManyMutationInput, StockLocationUncheckedUpdateManyInput>
    /**
     * Filter which StockLocations to update
     */
    where?: StockLocationWhereInput
  }

  /**
   * StockLocation upsert
   */
  export type StockLocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    /**
     * The filter to search for the StockLocation to update in case it exists.
     */
    where: StockLocationWhereUniqueInput
    /**
     * In case the StockLocation found by the `where` argument doesn't exist, create a new StockLocation with this data.
     */
    create: XOR<StockLocationCreateInput, StockLocationUncheckedCreateInput>
    /**
     * In case the StockLocation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StockLocationUpdateInput, StockLocationUncheckedUpdateInput>
  }

  /**
   * StockLocation delete
   */
  export type StockLocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    /**
     * Filter which StockLocation to delete.
     */
    where: StockLocationWhereUniqueInput
  }

  /**
   * StockLocation deleteMany
   */
  export type StockLocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockLocations to delete
     */
    where?: StockLocationWhereInput
  }

  /**
   * StockLocation.stockLevels
   */
  export type StockLocation$stockLevelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    where?: StockLevelWhereInput
    orderBy?: StockLevelOrderByWithRelationInput | StockLevelOrderByWithRelationInput[]
    cursor?: StockLevelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StockLevelScalarFieldEnum | StockLevelScalarFieldEnum[]
  }

  /**
   * StockLocation.movementsFrom
   */
  export type StockLocation$movementsFromArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    where?: StockMovementWhereInput
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    cursor?: StockMovementWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * StockLocation.movementsTo
   */
  export type StockLocation$movementsToArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    where?: StockMovementWhereInput
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    cursor?: StockMovementWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * StockLocation without action
   */
  export type StockLocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
  }


  /**
   * Model StockLevel
   */

  export type AggregateStockLevel = {
    _count: StockLevelCountAggregateOutputType | null
    _avg: StockLevelAvgAggregateOutputType | null
    _sum: StockLevelSumAggregateOutputType | null
    _min: StockLevelMinAggregateOutputType | null
    _max: StockLevelMaxAggregateOutputType | null
  }

  export type StockLevelAvgAggregateOutputType = {
    quantity: Decimal | null
    reservedQty: Decimal | null
  }

  export type StockLevelSumAggregateOutputType = {
    quantity: Decimal | null
    reservedQty: Decimal | null
  }

  export type StockLevelMinAggregateOutputType = {
    id: string | null
    inventoryItemId: string | null
    locationId: string | null
    quantity: Decimal | null
    reservedQty: Decimal | null
    updatedAt: Date | null
  }

  export type StockLevelMaxAggregateOutputType = {
    id: string | null
    inventoryItemId: string | null
    locationId: string | null
    quantity: Decimal | null
    reservedQty: Decimal | null
    updatedAt: Date | null
  }

  export type StockLevelCountAggregateOutputType = {
    id: number
    inventoryItemId: number
    locationId: number
    quantity: number
    reservedQty: number
    updatedAt: number
    _all: number
  }


  export type StockLevelAvgAggregateInputType = {
    quantity?: true
    reservedQty?: true
  }

  export type StockLevelSumAggregateInputType = {
    quantity?: true
    reservedQty?: true
  }

  export type StockLevelMinAggregateInputType = {
    id?: true
    inventoryItemId?: true
    locationId?: true
    quantity?: true
    reservedQty?: true
    updatedAt?: true
  }

  export type StockLevelMaxAggregateInputType = {
    id?: true
    inventoryItemId?: true
    locationId?: true
    quantity?: true
    reservedQty?: true
    updatedAt?: true
  }

  export type StockLevelCountAggregateInputType = {
    id?: true
    inventoryItemId?: true
    locationId?: true
    quantity?: true
    reservedQty?: true
    updatedAt?: true
    _all?: true
  }

  export type StockLevelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockLevel to aggregate.
     */
    where?: StockLevelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLevels to fetch.
     */
    orderBy?: StockLevelOrderByWithRelationInput | StockLevelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StockLevelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLevels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLevels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StockLevels
    **/
    _count?: true | StockLevelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StockLevelAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StockLevelSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StockLevelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StockLevelMaxAggregateInputType
  }

  export type GetStockLevelAggregateType<T extends StockLevelAggregateArgs> = {
        [P in keyof T & keyof AggregateStockLevel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStockLevel[P]>
      : GetScalarType<T[P], AggregateStockLevel[P]>
  }




  export type StockLevelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockLevelWhereInput
    orderBy?: StockLevelOrderByWithAggregationInput | StockLevelOrderByWithAggregationInput[]
    by: StockLevelScalarFieldEnum[] | StockLevelScalarFieldEnum
    having?: StockLevelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StockLevelCountAggregateInputType | true
    _avg?: StockLevelAvgAggregateInputType
    _sum?: StockLevelSumAggregateInputType
    _min?: StockLevelMinAggregateInputType
    _max?: StockLevelMaxAggregateInputType
  }

  export type StockLevelGroupByOutputType = {
    id: string
    inventoryItemId: string
    locationId: string
    quantity: Decimal
    reservedQty: Decimal
    updatedAt: Date
    _count: StockLevelCountAggregateOutputType | null
    _avg: StockLevelAvgAggregateOutputType | null
    _sum: StockLevelSumAggregateOutputType | null
    _min: StockLevelMinAggregateOutputType | null
    _max: StockLevelMaxAggregateOutputType | null
  }

  type GetStockLevelGroupByPayload<T extends StockLevelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StockLevelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StockLevelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StockLevelGroupByOutputType[P]>
            : GetScalarType<T[P], StockLevelGroupByOutputType[P]>
        }
      >
    >


  export type StockLevelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inventoryItemId?: boolean
    locationId?: boolean
    quantity?: boolean
    reservedQty?: boolean
    updatedAt?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    location?: boolean | StockLocationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["stockLevel"]>

  export type StockLevelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inventoryItemId?: boolean
    locationId?: boolean
    quantity?: boolean
    reservedQty?: boolean
    updatedAt?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    location?: boolean | StockLocationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["stockLevel"]>

  export type StockLevelSelectScalar = {
    id?: boolean
    inventoryItemId?: boolean
    locationId?: boolean
    quantity?: boolean
    reservedQty?: boolean
    updatedAt?: boolean
  }

  export type StockLevelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    location?: boolean | StockLocationDefaultArgs<ExtArgs>
  }
  export type StockLevelIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    location?: boolean | StockLocationDefaultArgs<ExtArgs>
  }

  export type $StockLevelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StockLevel"
    objects: {
      inventoryItem: Prisma.$InventoryItemPayload<ExtArgs>
      location: Prisma.$StockLocationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      inventoryItemId: string
      locationId: string
      quantity: Prisma.Decimal
      reservedQty: Prisma.Decimal
      updatedAt: Date
    }, ExtArgs["result"]["stockLevel"]>
    composites: {}
  }

  type StockLevelGetPayload<S extends boolean | null | undefined | StockLevelDefaultArgs> = $Result.GetResult<Prisma.$StockLevelPayload, S>

  type StockLevelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StockLevelFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StockLevelCountAggregateInputType | true
    }

  export interface StockLevelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StockLevel'], meta: { name: 'StockLevel' } }
    /**
     * Find zero or one StockLevel that matches the filter.
     * @param {StockLevelFindUniqueArgs} args - Arguments to find a StockLevel
     * @example
     * // Get one StockLevel
     * const stockLevel = await prisma.stockLevel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StockLevelFindUniqueArgs>(args: SelectSubset<T, StockLevelFindUniqueArgs<ExtArgs>>): Prisma__StockLevelClient<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one StockLevel that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StockLevelFindUniqueOrThrowArgs} args - Arguments to find a StockLevel
     * @example
     * // Get one StockLevel
     * const stockLevel = await prisma.stockLevel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StockLevelFindUniqueOrThrowArgs>(args: SelectSubset<T, StockLevelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StockLevelClient<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first StockLevel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLevelFindFirstArgs} args - Arguments to find a StockLevel
     * @example
     * // Get one StockLevel
     * const stockLevel = await prisma.stockLevel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StockLevelFindFirstArgs>(args?: SelectSubset<T, StockLevelFindFirstArgs<ExtArgs>>): Prisma__StockLevelClient<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first StockLevel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLevelFindFirstOrThrowArgs} args - Arguments to find a StockLevel
     * @example
     * // Get one StockLevel
     * const stockLevel = await prisma.stockLevel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StockLevelFindFirstOrThrowArgs>(args?: SelectSubset<T, StockLevelFindFirstOrThrowArgs<ExtArgs>>): Prisma__StockLevelClient<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more StockLevels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLevelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StockLevels
     * const stockLevels = await prisma.stockLevel.findMany()
     * 
     * // Get first 10 StockLevels
     * const stockLevels = await prisma.stockLevel.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const stockLevelWithIdOnly = await prisma.stockLevel.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StockLevelFindManyArgs>(args?: SelectSubset<T, StockLevelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a StockLevel.
     * @param {StockLevelCreateArgs} args - Arguments to create a StockLevel.
     * @example
     * // Create one StockLevel
     * const StockLevel = await prisma.stockLevel.create({
     *   data: {
     *     // ... data to create a StockLevel
     *   }
     * })
     * 
     */
    create<T extends StockLevelCreateArgs>(args: SelectSubset<T, StockLevelCreateArgs<ExtArgs>>): Prisma__StockLevelClient<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many StockLevels.
     * @param {StockLevelCreateManyArgs} args - Arguments to create many StockLevels.
     * @example
     * // Create many StockLevels
     * const stockLevel = await prisma.stockLevel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StockLevelCreateManyArgs>(args?: SelectSubset<T, StockLevelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StockLevels and returns the data saved in the database.
     * @param {StockLevelCreateManyAndReturnArgs} args - Arguments to create many StockLevels.
     * @example
     * // Create many StockLevels
     * const stockLevel = await prisma.stockLevel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StockLevels and only return the `id`
     * const stockLevelWithIdOnly = await prisma.stockLevel.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StockLevelCreateManyAndReturnArgs>(args?: SelectSubset<T, StockLevelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a StockLevel.
     * @param {StockLevelDeleteArgs} args - Arguments to delete one StockLevel.
     * @example
     * // Delete one StockLevel
     * const StockLevel = await prisma.stockLevel.delete({
     *   where: {
     *     // ... filter to delete one StockLevel
     *   }
     * })
     * 
     */
    delete<T extends StockLevelDeleteArgs>(args: SelectSubset<T, StockLevelDeleteArgs<ExtArgs>>): Prisma__StockLevelClient<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one StockLevel.
     * @param {StockLevelUpdateArgs} args - Arguments to update one StockLevel.
     * @example
     * // Update one StockLevel
     * const stockLevel = await prisma.stockLevel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StockLevelUpdateArgs>(args: SelectSubset<T, StockLevelUpdateArgs<ExtArgs>>): Prisma__StockLevelClient<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more StockLevels.
     * @param {StockLevelDeleteManyArgs} args - Arguments to filter StockLevels to delete.
     * @example
     * // Delete a few StockLevels
     * const { count } = await prisma.stockLevel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StockLevelDeleteManyArgs>(args?: SelectSubset<T, StockLevelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StockLevels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLevelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StockLevels
     * const stockLevel = await prisma.stockLevel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StockLevelUpdateManyArgs>(args: SelectSubset<T, StockLevelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StockLevel.
     * @param {StockLevelUpsertArgs} args - Arguments to update or create a StockLevel.
     * @example
     * // Update or create a StockLevel
     * const stockLevel = await prisma.stockLevel.upsert({
     *   create: {
     *     // ... data to create a StockLevel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StockLevel we want to update
     *   }
     * })
     */
    upsert<T extends StockLevelUpsertArgs>(args: SelectSubset<T, StockLevelUpsertArgs<ExtArgs>>): Prisma__StockLevelClient<$Result.GetResult<Prisma.$StockLevelPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of StockLevels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLevelCountArgs} args - Arguments to filter StockLevels to count.
     * @example
     * // Count the number of StockLevels
     * const count = await prisma.stockLevel.count({
     *   where: {
     *     // ... the filter for the StockLevels we want to count
     *   }
     * })
    **/
    count<T extends StockLevelCountArgs>(
      args?: Subset<T, StockLevelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StockLevelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StockLevel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLevelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends StockLevelAggregateArgs>(args: Subset<T, StockLevelAggregateArgs>): Prisma.PrismaPromise<GetStockLevelAggregateType<T>>

    /**
     * Group by StockLevel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLevelGroupByArgs} args - Group by arguments.
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
      T extends StockLevelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StockLevelGroupByArgs['orderBy'] }
        : { orderBy?: StockLevelGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, StockLevelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStockLevelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StockLevel model
   */
  readonly fields: StockLevelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StockLevel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StockLevelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inventoryItem<T extends InventoryItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InventoryItemDefaultArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    location<T extends StockLocationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, StockLocationDefaultArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the StockLevel model
   */ 
  interface StockLevelFieldRefs {
    readonly id: FieldRef<"StockLevel", 'String'>
    readonly inventoryItemId: FieldRef<"StockLevel", 'String'>
    readonly locationId: FieldRef<"StockLevel", 'String'>
    readonly quantity: FieldRef<"StockLevel", 'Decimal'>
    readonly reservedQty: FieldRef<"StockLevel", 'Decimal'>
    readonly updatedAt: FieldRef<"StockLevel", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StockLevel findUnique
   */
  export type StockLevelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    /**
     * Filter, which StockLevel to fetch.
     */
    where: StockLevelWhereUniqueInput
  }

  /**
   * StockLevel findUniqueOrThrow
   */
  export type StockLevelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    /**
     * Filter, which StockLevel to fetch.
     */
    where: StockLevelWhereUniqueInput
  }

  /**
   * StockLevel findFirst
   */
  export type StockLevelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    /**
     * Filter, which StockLevel to fetch.
     */
    where?: StockLevelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLevels to fetch.
     */
    orderBy?: StockLevelOrderByWithRelationInput | StockLevelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockLevels.
     */
    cursor?: StockLevelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLevels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLevels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockLevels.
     */
    distinct?: StockLevelScalarFieldEnum | StockLevelScalarFieldEnum[]
  }

  /**
   * StockLevel findFirstOrThrow
   */
  export type StockLevelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    /**
     * Filter, which StockLevel to fetch.
     */
    where?: StockLevelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLevels to fetch.
     */
    orderBy?: StockLevelOrderByWithRelationInput | StockLevelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockLevels.
     */
    cursor?: StockLevelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLevels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLevels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockLevels.
     */
    distinct?: StockLevelScalarFieldEnum | StockLevelScalarFieldEnum[]
  }

  /**
   * StockLevel findMany
   */
  export type StockLevelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    /**
     * Filter, which StockLevels to fetch.
     */
    where?: StockLevelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLevels to fetch.
     */
    orderBy?: StockLevelOrderByWithRelationInput | StockLevelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StockLevels.
     */
    cursor?: StockLevelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLevels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLevels.
     */
    skip?: number
    distinct?: StockLevelScalarFieldEnum | StockLevelScalarFieldEnum[]
  }

  /**
   * StockLevel create
   */
  export type StockLevelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    /**
     * The data needed to create a StockLevel.
     */
    data: XOR<StockLevelCreateInput, StockLevelUncheckedCreateInput>
  }

  /**
   * StockLevel createMany
   */
  export type StockLevelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StockLevels.
     */
    data: StockLevelCreateManyInput | StockLevelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StockLevel createManyAndReturn
   */
  export type StockLevelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many StockLevels.
     */
    data: StockLevelCreateManyInput | StockLevelCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StockLevel update
   */
  export type StockLevelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    /**
     * The data needed to update a StockLevel.
     */
    data: XOR<StockLevelUpdateInput, StockLevelUncheckedUpdateInput>
    /**
     * Choose, which StockLevel to update.
     */
    where: StockLevelWhereUniqueInput
  }

  /**
   * StockLevel updateMany
   */
  export type StockLevelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StockLevels.
     */
    data: XOR<StockLevelUpdateManyMutationInput, StockLevelUncheckedUpdateManyInput>
    /**
     * Filter which StockLevels to update
     */
    where?: StockLevelWhereInput
  }

  /**
   * StockLevel upsert
   */
  export type StockLevelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    /**
     * The filter to search for the StockLevel to update in case it exists.
     */
    where: StockLevelWhereUniqueInput
    /**
     * In case the StockLevel found by the `where` argument doesn't exist, create a new StockLevel with this data.
     */
    create: XOR<StockLevelCreateInput, StockLevelUncheckedCreateInput>
    /**
     * In case the StockLevel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StockLevelUpdateInput, StockLevelUncheckedUpdateInput>
  }

  /**
   * StockLevel delete
   */
  export type StockLevelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
    /**
     * Filter which StockLevel to delete.
     */
    where: StockLevelWhereUniqueInput
  }

  /**
   * StockLevel deleteMany
   */
  export type StockLevelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockLevels to delete
     */
    where?: StockLevelWhereInput
  }

  /**
   * StockLevel without action
   */
  export type StockLevelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLevel
     */
    select?: StockLevelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLevelInclude<ExtArgs> | null
  }


  /**
   * Model StockMovement
   */

  export type AggregateStockMovement = {
    _count: StockMovementCountAggregateOutputType | null
    _avg: StockMovementAvgAggregateOutputType | null
    _sum: StockMovementSumAggregateOutputType | null
    _min: StockMovementMinAggregateOutputType | null
    _max: StockMovementMaxAggregateOutputType | null
  }

  export type StockMovementAvgAggregateOutputType = {
    quantity: Decimal | null
  }

  export type StockMovementSumAggregateOutputType = {
    quantity: Decimal | null
  }

  export type StockMovementMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    inventoryItemId: string | null
    fromLocationId: string | null
    toLocationId: string | null
    quantity: Decimal | null
    movementType: $Enums.MovementType | null
    referenceId: string | null
    referenceType: string | null
    notes: string | null
    performedBy: string | null
    performedByName: string | null
    createdAt: Date | null
  }

  export type StockMovementMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    inventoryItemId: string | null
    fromLocationId: string | null
    toLocationId: string | null
    quantity: Decimal | null
    movementType: $Enums.MovementType | null
    referenceId: string | null
    referenceType: string | null
    notes: string | null
    performedBy: string | null
    performedByName: string | null
    createdAt: Date | null
  }

  export type StockMovementCountAggregateOutputType = {
    id: number
    companyId: number
    inventoryItemId: number
    fromLocationId: number
    toLocationId: number
    quantity: number
    movementType: number
    referenceId: number
    referenceType: number
    notes: number
    performedBy: number
    performedByName: number
    createdAt: number
    _all: number
  }


  export type StockMovementAvgAggregateInputType = {
    quantity?: true
  }

  export type StockMovementSumAggregateInputType = {
    quantity?: true
  }

  export type StockMovementMinAggregateInputType = {
    id?: true
    companyId?: true
    inventoryItemId?: true
    fromLocationId?: true
    toLocationId?: true
    quantity?: true
    movementType?: true
    referenceId?: true
    referenceType?: true
    notes?: true
    performedBy?: true
    performedByName?: true
    createdAt?: true
  }

  export type StockMovementMaxAggregateInputType = {
    id?: true
    companyId?: true
    inventoryItemId?: true
    fromLocationId?: true
    toLocationId?: true
    quantity?: true
    movementType?: true
    referenceId?: true
    referenceType?: true
    notes?: true
    performedBy?: true
    performedByName?: true
    createdAt?: true
  }

  export type StockMovementCountAggregateInputType = {
    id?: true
    companyId?: true
    inventoryItemId?: true
    fromLocationId?: true
    toLocationId?: true
    quantity?: true
    movementType?: true
    referenceId?: true
    referenceType?: true
    notes?: true
    performedBy?: true
    performedByName?: true
    createdAt?: true
    _all?: true
  }

  export type StockMovementAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockMovement to aggregate.
     */
    where?: StockMovementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockMovements to fetch.
     */
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StockMovementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockMovements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockMovements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StockMovements
    **/
    _count?: true | StockMovementCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StockMovementAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StockMovementSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StockMovementMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StockMovementMaxAggregateInputType
  }

  export type GetStockMovementAggregateType<T extends StockMovementAggregateArgs> = {
        [P in keyof T & keyof AggregateStockMovement]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStockMovement[P]>
      : GetScalarType<T[P], AggregateStockMovement[P]>
  }




  export type StockMovementGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockMovementWhereInput
    orderBy?: StockMovementOrderByWithAggregationInput | StockMovementOrderByWithAggregationInput[]
    by: StockMovementScalarFieldEnum[] | StockMovementScalarFieldEnum
    having?: StockMovementScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StockMovementCountAggregateInputType | true
    _avg?: StockMovementAvgAggregateInputType
    _sum?: StockMovementSumAggregateInputType
    _min?: StockMovementMinAggregateInputType
    _max?: StockMovementMaxAggregateInputType
  }

  export type StockMovementGroupByOutputType = {
    id: string
    companyId: string
    inventoryItemId: string
    fromLocationId: string | null
    toLocationId: string | null
    quantity: Decimal
    movementType: $Enums.MovementType
    referenceId: string | null
    referenceType: string | null
    notes: string | null
    performedBy: string
    performedByName: string | null
    createdAt: Date
    _count: StockMovementCountAggregateOutputType | null
    _avg: StockMovementAvgAggregateOutputType | null
    _sum: StockMovementSumAggregateOutputType | null
    _min: StockMovementMinAggregateOutputType | null
    _max: StockMovementMaxAggregateOutputType | null
  }

  type GetStockMovementGroupByPayload<T extends StockMovementGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StockMovementGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StockMovementGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StockMovementGroupByOutputType[P]>
            : GetScalarType<T[P], StockMovementGroupByOutputType[P]>
        }
      >
    >


  export type StockMovementSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    inventoryItemId?: boolean
    fromLocationId?: boolean
    toLocationId?: boolean
    quantity?: boolean
    movementType?: boolean
    referenceId?: boolean
    referenceType?: boolean
    notes?: boolean
    performedBy?: boolean
    performedByName?: boolean
    createdAt?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    fromLocation?: boolean | StockMovement$fromLocationArgs<ExtArgs>
    toLocation?: boolean | StockMovement$toLocationArgs<ExtArgs>
  }, ExtArgs["result"]["stockMovement"]>

  export type StockMovementSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    inventoryItemId?: boolean
    fromLocationId?: boolean
    toLocationId?: boolean
    quantity?: boolean
    movementType?: boolean
    referenceId?: boolean
    referenceType?: boolean
    notes?: boolean
    performedBy?: boolean
    performedByName?: boolean
    createdAt?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    fromLocation?: boolean | StockMovement$fromLocationArgs<ExtArgs>
    toLocation?: boolean | StockMovement$toLocationArgs<ExtArgs>
  }, ExtArgs["result"]["stockMovement"]>

  export type StockMovementSelectScalar = {
    id?: boolean
    companyId?: boolean
    inventoryItemId?: boolean
    fromLocationId?: boolean
    toLocationId?: boolean
    quantity?: boolean
    movementType?: boolean
    referenceId?: boolean
    referenceType?: boolean
    notes?: boolean
    performedBy?: boolean
    performedByName?: boolean
    createdAt?: boolean
  }

  export type StockMovementInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    fromLocation?: boolean | StockMovement$fromLocationArgs<ExtArgs>
    toLocation?: boolean | StockMovement$toLocationArgs<ExtArgs>
  }
  export type StockMovementIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    fromLocation?: boolean | StockMovement$fromLocationArgs<ExtArgs>
    toLocation?: boolean | StockMovement$toLocationArgs<ExtArgs>
  }

  export type $StockMovementPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StockMovement"
    objects: {
      inventoryItem: Prisma.$InventoryItemPayload<ExtArgs>
      fromLocation: Prisma.$StockLocationPayload<ExtArgs> | null
      toLocation: Prisma.$StockLocationPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      inventoryItemId: string
      fromLocationId: string | null
      toLocationId: string | null
      quantity: Prisma.Decimal
      movementType: $Enums.MovementType
      referenceId: string | null
      referenceType: string | null
      notes: string | null
      performedBy: string
      performedByName: string | null
      createdAt: Date
    }, ExtArgs["result"]["stockMovement"]>
    composites: {}
  }

  type StockMovementGetPayload<S extends boolean | null | undefined | StockMovementDefaultArgs> = $Result.GetResult<Prisma.$StockMovementPayload, S>

  type StockMovementCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StockMovementFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StockMovementCountAggregateInputType | true
    }

  export interface StockMovementDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StockMovement'], meta: { name: 'StockMovement' } }
    /**
     * Find zero or one StockMovement that matches the filter.
     * @param {StockMovementFindUniqueArgs} args - Arguments to find a StockMovement
     * @example
     * // Get one StockMovement
     * const stockMovement = await prisma.stockMovement.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StockMovementFindUniqueArgs>(args: SelectSubset<T, StockMovementFindUniqueArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one StockMovement that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StockMovementFindUniqueOrThrowArgs} args - Arguments to find a StockMovement
     * @example
     * // Get one StockMovement
     * const stockMovement = await prisma.stockMovement.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StockMovementFindUniqueOrThrowArgs>(args: SelectSubset<T, StockMovementFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first StockMovement that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementFindFirstArgs} args - Arguments to find a StockMovement
     * @example
     * // Get one StockMovement
     * const stockMovement = await prisma.stockMovement.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StockMovementFindFirstArgs>(args?: SelectSubset<T, StockMovementFindFirstArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first StockMovement that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementFindFirstOrThrowArgs} args - Arguments to find a StockMovement
     * @example
     * // Get one StockMovement
     * const stockMovement = await prisma.stockMovement.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StockMovementFindFirstOrThrowArgs>(args?: SelectSubset<T, StockMovementFindFirstOrThrowArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more StockMovements that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StockMovements
     * const stockMovements = await prisma.stockMovement.findMany()
     * 
     * // Get first 10 StockMovements
     * const stockMovements = await prisma.stockMovement.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const stockMovementWithIdOnly = await prisma.stockMovement.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StockMovementFindManyArgs>(args?: SelectSubset<T, StockMovementFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a StockMovement.
     * @param {StockMovementCreateArgs} args - Arguments to create a StockMovement.
     * @example
     * // Create one StockMovement
     * const StockMovement = await prisma.stockMovement.create({
     *   data: {
     *     // ... data to create a StockMovement
     *   }
     * })
     * 
     */
    create<T extends StockMovementCreateArgs>(args: SelectSubset<T, StockMovementCreateArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many StockMovements.
     * @param {StockMovementCreateManyArgs} args - Arguments to create many StockMovements.
     * @example
     * // Create many StockMovements
     * const stockMovement = await prisma.stockMovement.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StockMovementCreateManyArgs>(args?: SelectSubset<T, StockMovementCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StockMovements and returns the data saved in the database.
     * @param {StockMovementCreateManyAndReturnArgs} args - Arguments to create many StockMovements.
     * @example
     * // Create many StockMovements
     * const stockMovement = await prisma.stockMovement.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StockMovements and only return the `id`
     * const stockMovementWithIdOnly = await prisma.stockMovement.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StockMovementCreateManyAndReturnArgs>(args?: SelectSubset<T, StockMovementCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a StockMovement.
     * @param {StockMovementDeleteArgs} args - Arguments to delete one StockMovement.
     * @example
     * // Delete one StockMovement
     * const StockMovement = await prisma.stockMovement.delete({
     *   where: {
     *     // ... filter to delete one StockMovement
     *   }
     * })
     * 
     */
    delete<T extends StockMovementDeleteArgs>(args: SelectSubset<T, StockMovementDeleteArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one StockMovement.
     * @param {StockMovementUpdateArgs} args - Arguments to update one StockMovement.
     * @example
     * // Update one StockMovement
     * const stockMovement = await prisma.stockMovement.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StockMovementUpdateArgs>(args: SelectSubset<T, StockMovementUpdateArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more StockMovements.
     * @param {StockMovementDeleteManyArgs} args - Arguments to filter StockMovements to delete.
     * @example
     * // Delete a few StockMovements
     * const { count } = await prisma.stockMovement.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StockMovementDeleteManyArgs>(args?: SelectSubset<T, StockMovementDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StockMovements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StockMovements
     * const stockMovement = await prisma.stockMovement.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StockMovementUpdateManyArgs>(args: SelectSubset<T, StockMovementUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StockMovement.
     * @param {StockMovementUpsertArgs} args - Arguments to update or create a StockMovement.
     * @example
     * // Update or create a StockMovement
     * const stockMovement = await prisma.stockMovement.upsert({
     *   create: {
     *     // ... data to create a StockMovement
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StockMovement we want to update
     *   }
     * })
     */
    upsert<T extends StockMovementUpsertArgs>(args: SelectSubset<T, StockMovementUpsertArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of StockMovements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementCountArgs} args - Arguments to filter StockMovements to count.
     * @example
     * // Count the number of StockMovements
     * const count = await prisma.stockMovement.count({
     *   where: {
     *     // ... the filter for the StockMovements we want to count
     *   }
     * })
    **/
    count<T extends StockMovementCountArgs>(
      args?: Subset<T, StockMovementCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StockMovementCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StockMovement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends StockMovementAggregateArgs>(args: Subset<T, StockMovementAggregateArgs>): Prisma.PrismaPromise<GetStockMovementAggregateType<T>>

    /**
     * Group by StockMovement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementGroupByArgs} args - Group by arguments.
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
      T extends StockMovementGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StockMovementGroupByArgs['orderBy'] }
        : { orderBy?: StockMovementGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, StockMovementGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStockMovementGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StockMovement model
   */
  readonly fields: StockMovementFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StockMovement.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StockMovementClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inventoryItem<T extends InventoryItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InventoryItemDefaultArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    fromLocation<T extends StockMovement$fromLocationArgs<ExtArgs> = {}>(args?: Subset<T, StockMovement$fromLocationArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    toLocation<T extends StockMovement$toLocationArgs<ExtArgs> = {}>(args?: Subset<T, StockMovement$toLocationArgs<ExtArgs>>): Prisma__StockLocationClient<$Result.GetResult<Prisma.$StockLocationPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
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
   * Fields of the StockMovement model
   */ 
  interface StockMovementFieldRefs {
    readonly id: FieldRef<"StockMovement", 'String'>
    readonly companyId: FieldRef<"StockMovement", 'String'>
    readonly inventoryItemId: FieldRef<"StockMovement", 'String'>
    readonly fromLocationId: FieldRef<"StockMovement", 'String'>
    readonly toLocationId: FieldRef<"StockMovement", 'String'>
    readonly quantity: FieldRef<"StockMovement", 'Decimal'>
    readonly movementType: FieldRef<"StockMovement", 'MovementType'>
    readonly referenceId: FieldRef<"StockMovement", 'String'>
    readonly referenceType: FieldRef<"StockMovement", 'String'>
    readonly notes: FieldRef<"StockMovement", 'String'>
    readonly performedBy: FieldRef<"StockMovement", 'String'>
    readonly performedByName: FieldRef<"StockMovement", 'String'>
    readonly createdAt: FieldRef<"StockMovement", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StockMovement findUnique
   */
  export type StockMovementFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovement to fetch.
     */
    where: StockMovementWhereUniqueInput
  }

  /**
   * StockMovement findUniqueOrThrow
   */
  export type StockMovementFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovement to fetch.
     */
    where: StockMovementWhereUniqueInput
  }

  /**
   * StockMovement findFirst
   */
  export type StockMovementFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovement to fetch.
     */
    where?: StockMovementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockMovements to fetch.
     */
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockMovements.
     */
    cursor?: StockMovementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockMovements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockMovements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockMovements.
     */
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * StockMovement findFirstOrThrow
   */
  export type StockMovementFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovement to fetch.
     */
    where?: StockMovementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockMovements to fetch.
     */
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockMovements.
     */
    cursor?: StockMovementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockMovements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockMovements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockMovements.
     */
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * StockMovement findMany
   */
  export type StockMovementFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovements to fetch.
     */
    where?: StockMovementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockMovements to fetch.
     */
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StockMovements.
     */
    cursor?: StockMovementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockMovements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockMovements.
     */
    skip?: number
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * StockMovement create
   */
  export type StockMovementCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * The data needed to create a StockMovement.
     */
    data: XOR<StockMovementCreateInput, StockMovementUncheckedCreateInput>
  }

  /**
   * StockMovement createMany
   */
  export type StockMovementCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StockMovements.
     */
    data: StockMovementCreateManyInput | StockMovementCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StockMovement createManyAndReturn
   */
  export type StockMovementCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many StockMovements.
     */
    data: StockMovementCreateManyInput | StockMovementCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StockMovement update
   */
  export type StockMovementUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * The data needed to update a StockMovement.
     */
    data: XOR<StockMovementUpdateInput, StockMovementUncheckedUpdateInput>
    /**
     * Choose, which StockMovement to update.
     */
    where: StockMovementWhereUniqueInput
  }

  /**
   * StockMovement updateMany
   */
  export type StockMovementUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StockMovements.
     */
    data: XOR<StockMovementUpdateManyMutationInput, StockMovementUncheckedUpdateManyInput>
    /**
     * Filter which StockMovements to update
     */
    where?: StockMovementWhereInput
  }

  /**
   * StockMovement upsert
   */
  export type StockMovementUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * The filter to search for the StockMovement to update in case it exists.
     */
    where: StockMovementWhereUniqueInput
    /**
     * In case the StockMovement found by the `where` argument doesn't exist, create a new StockMovement with this data.
     */
    create: XOR<StockMovementCreateInput, StockMovementUncheckedCreateInput>
    /**
     * In case the StockMovement was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StockMovementUpdateInput, StockMovementUncheckedUpdateInput>
  }

  /**
   * StockMovement delete
   */
  export type StockMovementDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter which StockMovement to delete.
     */
    where: StockMovementWhereUniqueInput
  }

  /**
   * StockMovement deleteMany
   */
  export type StockMovementDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockMovements to delete
     */
    where?: StockMovementWhereInput
  }

  /**
   * StockMovement.fromLocation
   */
  export type StockMovement$fromLocationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    where?: StockLocationWhereInput
  }

  /**
   * StockMovement.toLocation
   */
  export type StockMovement$toLocationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLocation
     */
    select?: StockLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockLocationInclude<ExtArgs> | null
    where?: StockLocationWhereInput
  }

  /**
   * StockMovement without action
   */
  export type StockMovementDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
  }


  /**
   * Model PurchaseOrder
   */

  export type AggregatePurchaseOrder = {
    _count: PurchaseOrderCountAggregateOutputType | null
    _avg: PurchaseOrderAvgAggregateOutputType | null
    _sum: PurchaseOrderSumAggregateOutputType | null
    _min: PurchaseOrderMinAggregateOutputType | null
    _max: PurchaseOrderMaxAggregateOutputType | null
  }

  export type PurchaseOrderAvgAggregateOutputType = {
    totalCost: Decimal | null
  }

  export type PurchaseOrderSumAggregateOutputType = {
    totalCost: Decimal | null
  }

  export type PurchaseOrderMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    poNumber: string | null
    supplierName: string | null
    status: $Enums.PurchaseOrderStatus | null
    totalCost: Decimal | null
    notes: string | null
    orderedAt: Date | null
    receivedAt: Date | null
    createdBy: string | null
    createdByName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PurchaseOrderMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    poNumber: string | null
    supplierName: string | null
    status: $Enums.PurchaseOrderStatus | null
    totalCost: Decimal | null
    notes: string | null
    orderedAt: Date | null
    receivedAt: Date | null
    createdBy: string | null
    createdByName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PurchaseOrderCountAggregateOutputType = {
    id: number
    companyId: number
    poNumber: number
    supplierName: number
    status: number
    items: number
    totalCost: number
    notes: number
    orderedAt: number
    receivedAt: number
    createdBy: number
    createdByName: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PurchaseOrderAvgAggregateInputType = {
    totalCost?: true
  }

  export type PurchaseOrderSumAggregateInputType = {
    totalCost?: true
  }

  export type PurchaseOrderMinAggregateInputType = {
    id?: true
    companyId?: true
    poNumber?: true
    supplierName?: true
    status?: true
    totalCost?: true
    notes?: true
    orderedAt?: true
    receivedAt?: true
    createdBy?: true
    createdByName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PurchaseOrderMaxAggregateInputType = {
    id?: true
    companyId?: true
    poNumber?: true
    supplierName?: true
    status?: true
    totalCost?: true
    notes?: true
    orderedAt?: true
    receivedAt?: true
    createdBy?: true
    createdByName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PurchaseOrderCountAggregateInputType = {
    id?: true
    companyId?: true
    poNumber?: true
    supplierName?: true
    status?: true
    items?: true
    totalCost?: true
    notes?: true
    orderedAt?: true
    receivedAt?: true
    createdBy?: true
    createdByName?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PurchaseOrderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrder to aggregate.
     */
    where?: PurchaseOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrders to fetch.
     */
    orderBy?: PurchaseOrderOrderByWithRelationInput | PurchaseOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PurchaseOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PurchaseOrders
    **/
    _count?: true | PurchaseOrderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PurchaseOrderAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PurchaseOrderSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PurchaseOrderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PurchaseOrderMaxAggregateInputType
  }

  export type GetPurchaseOrderAggregateType<T extends PurchaseOrderAggregateArgs> = {
        [P in keyof T & keyof AggregatePurchaseOrder]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePurchaseOrder[P]>
      : GetScalarType<T[P], AggregatePurchaseOrder[P]>
  }




  export type PurchaseOrderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseOrderWhereInput
    orderBy?: PurchaseOrderOrderByWithAggregationInput | PurchaseOrderOrderByWithAggregationInput[]
    by: PurchaseOrderScalarFieldEnum[] | PurchaseOrderScalarFieldEnum
    having?: PurchaseOrderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PurchaseOrderCountAggregateInputType | true
    _avg?: PurchaseOrderAvgAggregateInputType
    _sum?: PurchaseOrderSumAggregateInputType
    _min?: PurchaseOrderMinAggregateInputType
    _max?: PurchaseOrderMaxAggregateInputType
  }

  export type PurchaseOrderGroupByOutputType = {
    id: string
    companyId: string
    poNumber: string
    supplierName: string
    status: $Enums.PurchaseOrderStatus
    items: JsonValue
    totalCost: Decimal
    notes: string | null
    orderedAt: Date | null
    receivedAt: Date | null
    createdBy: string
    createdByName: string | null
    createdAt: Date
    updatedAt: Date
    _count: PurchaseOrderCountAggregateOutputType | null
    _avg: PurchaseOrderAvgAggregateOutputType | null
    _sum: PurchaseOrderSumAggregateOutputType | null
    _min: PurchaseOrderMinAggregateOutputType | null
    _max: PurchaseOrderMaxAggregateOutputType | null
  }

  type GetPurchaseOrderGroupByPayload<T extends PurchaseOrderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PurchaseOrderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PurchaseOrderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PurchaseOrderGroupByOutputType[P]>
            : GetScalarType<T[P], PurchaseOrderGroupByOutputType[P]>
        }
      >
    >


  export type PurchaseOrderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    poNumber?: boolean
    supplierName?: boolean
    status?: boolean
    items?: boolean
    totalCost?: boolean
    notes?: boolean
    orderedAt?: boolean
    receivedAt?: boolean
    createdBy?: boolean
    createdByName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["purchaseOrder"]>

  export type PurchaseOrderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    poNumber?: boolean
    supplierName?: boolean
    status?: boolean
    items?: boolean
    totalCost?: boolean
    notes?: boolean
    orderedAt?: boolean
    receivedAt?: boolean
    createdBy?: boolean
    createdByName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["purchaseOrder"]>

  export type PurchaseOrderSelectScalar = {
    id?: boolean
    companyId?: boolean
    poNumber?: boolean
    supplierName?: boolean
    status?: boolean
    items?: boolean
    totalCost?: boolean
    notes?: boolean
    orderedAt?: boolean
    receivedAt?: boolean
    createdBy?: boolean
    createdByName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $PurchaseOrderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PurchaseOrder"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      poNumber: string
      supplierName: string
      status: $Enums.PurchaseOrderStatus
      items: Prisma.JsonValue
      totalCost: Prisma.Decimal
      notes: string | null
      orderedAt: Date | null
      receivedAt: Date | null
      createdBy: string
      createdByName: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["purchaseOrder"]>
    composites: {}
  }

  type PurchaseOrderGetPayload<S extends boolean | null | undefined | PurchaseOrderDefaultArgs> = $Result.GetResult<Prisma.$PurchaseOrderPayload, S>

  type PurchaseOrderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PurchaseOrderFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PurchaseOrderCountAggregateInputType | true
    }

  export interface PurchaseOrderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PurchaseOrder'], meta: { name: 'PurchaseOrder' } }
    /**
     * Find zero or one PurchaseOrder that matches the filter.
     * @param {PurchaseOrderFindUniqueArgs} args - Arguments to find a PurchaseOrder
     * @example
     * // Get one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PurchaseOrderFindUniqueArgs>(args: SelectSubset<T, PurchaseOrderFindUniqueArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PurchaseOrder that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PurchaseOrderFindUniqueOrThrowArgs} args - Arguments to find a PurchaseOrder
     * @example
     * // Get one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PurchaseOrderFindUniqueOrThrowArgs>(args: SelectSubset<T, PurchaseOrderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PurchaseOrder that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderFindFirstArgs} args - Arguments to find a PurchaseOrder
     * @example
     * // Get one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PurchaseOrderFindFirstArgs>(args?: SelectSubset<T, PurchaseOrderFindFirstArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PurchaseOrder that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderFindFirstOrThrowArgs} args - Arguments to find a PurchaseOrder
     * @example
     * // Get one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PurchaseOrderFindFirstOrThrowArgs>(args?: SelectSubset<T, PurchaseOrderFindFirstOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PurchaseOrders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PurchaseOrders
     * const purchaseOrders = await prisma.purchaseOrder.findMany()
     * 
     * // Get first 10 PurchaseOrders
     * const purchaseOrders = await prisma.purchaseOrder.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const purchaseOrderWithIdOnly = await prisma.purchaseOrder.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PurchaseOrderFindManyArgs>(args?: SelectSubset<T, PurchaseOrderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PurchaseOrder.
     * @param {PurchaseOrderCreateArgs} args - Arguments to create a PurchaseOrder.
     * @example
     * // Create one PurchaseOrder
     * const PurchaseOrder = await prisma.purchaseOrder.create({
     *   data: {
     *     // ... data to create a PurchaseOrder
     *   }
     * })
     * 
     */
    create<T extends PurchaseOrderCreateArgs>(args: SelectSubset<T, PurchaseOrderCreateArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PurchaseOrders.
     * @param {PurchaseOrderCreateManyArgs} args - Arguments to create many PurchaseOrders.
     * @example
     * // Create many PurchaseOrders
     * const purchaseOrder = await prisma.purchaseOrder.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PurchaseOrderCreateManyArgs>(args?: SelectSubset<T, PurchaseOrderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PurchaseOrders and returns the data saved in the database.
     * @param {PurchaseOrderCreateManyAndReturnArgs} args - Arguments to create many PurchaseOrders.
     * @example
     * // Create many PurchaseOrders
     * const purchaseOrder = await prisma.purchaseOrder.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PurchaseOrders and only return the `id`
     * const purchaseOrderWithIdOnly = await prisma.purchaseOrder.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PurchaseOrderCreateManyAndReturnArgs>(args?: SelectSubset<T, PurchaseOrderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PurchaseOrder.
     * @param {PurchaseOrderDeleteArgs} args - Arguments to delete one PurchaseOrder.
     * @example
     * // Delete one PurchaseOrder
     * const PurchaseOrder = await prisma.purchaseOrder.delete({
     *   where: {
     *     // ... filter to delete one PurchaseOrder
     *   }
     * })
     * 
     */
    delete<T extends PurchaseOrderDeleteArgs>(args: SelectSubset<T, PurchaseOrderDeleteArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PurchaseOrder.
     * @param {PurchaseOrderUpdateArgs} args - Arguments to update one PurchaseOrder.
     * @example
     * // Update one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PurchaseOrderUpdateArgs>(args: SelectSubset<T, PurchaseOrderUpdateArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PurchaseOrders.
     * @param {PurchaseOrderDeleteManyArgs} args - Arguments to filter PurchaseOrders to delete.
     * @example
     * // Delete a few PurchaseOrders
     * const { count } = await prisma.purchaseOrder.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PurchaseOrderDeleteManyArgs>(args?: SelectSubset<T, PurchaseOrderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseOrders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PurchaseOrders
     * const purchaseOrder = await prisma.purchaseOrder.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PurchaseOrderUpdateManyArgs>(args: SelectSubset<T, PurchaseOrderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PurchaseOrder.
     * @param {PurchaseOrderUpsertArgs} args - Arguments to update or create a PurchaseOrder.
     * @example
     * // Update or create a PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.upsert({
     *   create: {
     *     // ... data to create a PurchaseOrder
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PurchaseOrder we want to update
     *   }
     * })
     */
    upsert<T extends PurchaseOrderUpsertArgs>(args: SelectSubset<T, PurchaseOrderUpsertArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PurchaseOrders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderCountArgs} args - Arguments to filter PurchaseOrders to count.
     * @example
     * // Count the number of PurchaseOrders
     * const count = await prisma.purchaseOrder.count({
     *   where: {
     *     // ... the filter for the PurchaseOrders we want to count
     *   }
     * })
    **/
    count<T extends PurchaseOrderCountArgs>(
      args?: Subset<T, PurchaseOrderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PurchaseOrderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PurchaseOrder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PurchaseOrderAggregateArgs>(args: Subset<T, PurchaseOrderAggregateArgs>): Prisma.PrismaPromise<GetPurchaseOrderAggregateType<T>>

    /**
     * Group by PurchaseOrder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderGroupByArgs} args - Group by arguments.
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
      T extends PurchaseOrderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PurchaseOrderGroupByArgs['orderBy'] }
        : { orderBy?: PurchaseOrderGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PurchaseOrderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPurchaseOrderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PurchaseOrder model
   */
  readonly fields: PurchaseOrderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PurchaseOrder.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PurchaseOrderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the PurchaseOrder model
   */ 
  interface PurchaseOrderFieldRefs {
    readonly id: FieldRef<"PurchaseOrder", 'String'>
    readonly companyId: FieldRef<"PurchaseOrder", 'String'>
    readonly poNumber: FieldRef<"PurchaseOrder", 'String'>
    readonly supplierName: FieldRef<"PurchaseOrder", 'String'>
    readonly status: FieldRef<"PurchaseOrder", 'PurchaseOrderStatus'>
    readonly items: FieldRef<"PurchaseOrder", 'Json'>
    readonly totalCost: FieldRef<"PurchaseOrder", 'Decimal'>
    readonly notes: FieldRef<"PurchaseOrder", 'String'>
    readonly orderedAt: FieldRef<"PurchaseOrder", 'DateTime'>
    readonly receivedAt: FieldRef<"PurchaseOrder", 'DateTime'>
    readonly createdBy: FieldRef<"PurchaseOrder", 'String'>
    readonly createdByName: FieldRef<"PurchaseOrder", 'String'>
    readonly createdAt: FieldRef<"PurchaseOrder", 'DateTime'>
    readonly updatedAt: FieldRef<"PurchaseOrder", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PurchaseOrder findUnique
   */
  export type PurchaseOrderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Filter, which PurchaseOrder to fetch.
     */
    where: PurchaseOrderWhereUniqueInput
  }

  /**
   * PurchaseOrder findUniqueOrThrow
   */
  export type PurchaseOrderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Filter, which PurchaseOrder to fetch.
     */
    where: PurchaseOrderWhereUniqueInput
  }

  /**
   * PurchaseOrder findFirst
   */
  export type PurchaseOrderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Filter, which PurchaseOrder to fetch.
     */
    where?: PurchaseOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrders to fetch.
     */
    orderBy?: PurchaseOrderOrderByWithRelationInput | PurchaseOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrders.
     */
    cursor?: PurchaseOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrders.
     */
    distinct?: PurchaseOrderScalarFieldEnum | PurchaseOrderScalarFieldEnum[]
  }

  /**
   * PurchaseOrder findFirstOrThrow
   */
  export type PurchaseOrderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Filter, which PurchaseOrder to fetch.
     */
    where?: PurchaseOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrders to fetch.
     */
    orderBy?: PurchaseOrderOrderByWithRelationInput | PurchaseOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrders.
     */
    cursor?: PurchaseOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrders.
     */
    distinct?: PurchaseOrderScalarFieldEnum | PurchaseOrderScalarFieldEnum[]
  }

  /**
   * PurchaseOrder findMany
   */
  export type PurchaseOrderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Filter, which PurchaseOrders to fetch.
     */
    where?: PurchaseOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrders to fetch.
     */
    orderBy?: PurchaseOrderOrderByWithRelationInput | PurchaseOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PurchaseOrders.
     */
    cursor?: PurchaseOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrders.
     */
    skip?: number
    distinct?: PurchaseOrderScalarFieldEnum | PurchaseOrderScalarFieldEnum[]
  }

  /**
   * PurchaseOrder create
   */
  export type PurchaseOrderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * The data needed to create a PurchaseOrder.
     */
    data: XOR<PurchaseOrderCreateInput, PurchaseOrderUncheckedCreateInput>
  }

  /**
   * PurchaseOrder createMany
   */
  export type PurchaseOrderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PurchaseOrders.
     */
    data: PurchaseOrderCreateManyInput | PurchaseOrderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseOrder createManyAndReturn
   */
  export type PurchaseOrderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PurchaseOrders.
     */
    data: PurchaseOrderCreateManyInput | PurchaseOrderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseOrder update
   */
  export type PurchaseOrderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * The data needed to update a PurchaseOrder.
     */
    data: XOR<PurchaseOrderUpdateInput, PurchaseOrderUncheckedUpdateInput>
    /**
     * Choose, which PurchaseOrder to update.
     */
    where: PurchaseOrderWhereUniqueInput
  }

  /**
   * PurchaseOrder updateMany
   */
  export type PurchaseOrderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PurchaseOrders.
     */
    data: XOR<PurchaseOrderUpdateManyMutationInput, PurchaseOrderUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseOrders to update
     */
    where?: PurchaseOrderWhereInput
  }

  /**
   * PurchaseOrder upsert
   */
  export type PurchaseOrderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * The filter to search for the PurchaseOrder to update in case it exists.
     */
    where: PurchaseOrderWhereUniqueInput
    /**
     * In case the PurchaseOrder found by the `where` argument doesn't exist, create a new PurchaseOrder with this data.
     */
    create: XOR<PurchaseOrderCreateInput, PurchaseOrderUncheckedCreateInput>
    /**
     * In case the PurchaseOrder was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PurchaseOrderUpdateInput, PurchaseOrderUncheckedUpdateInput>
  }

  /**
   * PurchaseOrder delete
   */
  export type PurchaseOrderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Filter which PurchaseOrder to delete.
     */
    where: PurchaseOrderWhereUniqueInput
  }

  /**
   * PurchaseOrder deleteMany
   */
  export type PurchaseOrderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrders to delete
     */
    where?: PurchaseOrderWhereInput
  }

  /**
   * PurchaseOrder without action
   */
  export type PurchaseOrderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
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


  export const InventoryItemScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    priceBookItemId: 'priceBookItemId',
    sku: 'sku',
    name: 'name',
    description: 'description',
    category: 'category',
    unit: 'unit',
    reorderPoint: 'reorderPoint',
    reorderQty: 'reorderQty',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InventoryItemScalarFieldEnum = (typeof InventoryItemScalarFieldEnum)[keyof typeof InventoryItemScalarFieldEnum]


  export const StockLocationScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    type: 'type',
    name: 'name',
    technicianId: 'technicianId',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type StockLocationScalarFieldEnum = (typeof StockLocationScalarFieldEnum)[keyof typeof StockLocationScalarFieldEnum]


  export const StockLevelScalarFieldEnum: {
    id: 'id',
    inventoryItemId: 'inventoryItemId',
    locationId: 'locationId',
    quantity: 'quantity',
    reservedQty: 'reservedQty',
    updatedAt: 'updatedAt'
  };

  export type StockLevelScalarFieldEnum = (typeof StockLevelScalarFieldEnum)[keyof typeof StockLevelScalarFieldEnum]


  export const StockMovementScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    inventoryItemId: 'inventoryItemId',
    fromLocationId: 'fromLocationId',
    toLocationId: 'toLocationId',
    quantity: 'quantity',
    movementType: 'movementType',
    referenceId: 'referenceId',
    referenceType: 'referenceType',
    notes: 'notes',
    performedBy: 'performedBy',
    performedByName: 'performedByName',
    createdAt: 'createdAt'
  };

  export type StockMovementScalarFieldEnum = (typeof StockMovementScalarFieldEnum)[keyof typeof StockMovementScalarFieldEnum]


  export const PurchaseOrderScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    poNumber: 'poNumber',
    supplierName: 'supplierName',
    status: 'status',
    items: 'items',
    totalCost: 'totalCost',
    notes: 'notes',
    orderedAt: 'orderedAt',
    receivedAt: 'receivedAt',
    createdBy: 'createdBy',
    createdByName: 'createdByName',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PurchaseOrderScalarFieldEnum = (typeof PurchaseOrderScalarFieldEnum)[keyof typeof PurchaseOrderScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


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
   * Reference to a field of type 'ItemCategory'
   */
  export type EnumItemCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemCategory'>
    


  /**
   * Reference to a field of type 'ItemCategory[]'
   */
  export type ListEnumItemCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemCategory[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


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
   * Reference to a field of type 'LocationType'
   */
  export type EnumLocationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LocationType'>
    


  /**
   * Reference to a field of type 'LocationType[]'
   */
  export type ListEnumLocationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LocationType[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'MovementType'
   */
  export type EnumMovementTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MovementType'>
    


  /**
   * Reference to a field of type 'MovementType[]'
   */
  export type ListEnumMovementTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MovementType[]'>
    


  /**
   * Reference to a field of type 'PurchaseOrderStatus'
   */
  export type EnumPurchaseOrderStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PurchaseOrderStatus'>
    


  /**
   * Reference to a field of type 'PurchaseOrderStatus[]'
   */
  export type ListEnumPurchaseOrderStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PurchaseOrderStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


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


  export type InventoryItemWhereInput = {
    AND?: InventoryItemWhereInput | InventoryItemWhereInput[]
    OR?: InventoryItemWhereInput[]
    NOT?: InventoryItemWhereInput | InventoryItemWhereInput[]
    id?: StringFilter<"InventoryItem"> | string
    companyId?: StringFilter<"InventoryItem"> | string
    priceBookItemId?: StringNullableFilter<"InventoryItem"> | string | null
    sku?: StringFilter<"InventoryItem"> | string
    name?: StringFilter<"InventoryItem"> | string
    description?: StringNullableFilter<"InventoryItem"> | string | null
    category?: EnumItemCategoryFilter<"InventoryItem"> | $Enums.ItemCategory
    unit?: StringFilter<"InventoryItem"> | string
    reorderPoint?: IntFilter<"InventoryItem"> | number
    reorderQty?: IntFilter<"InventoryItem"> | number
    isActive?: BoolFilter<"InventoryItem"> | boolean
    createdAt?: DateTimeFilter<"InventoryItem"> | Date | string
    updatedAt?: DateTimeFilter<"InventoryItem"> | Date | string
    stockLevels?: StockLevelListRelationFilter
    stockMovements?: StockMovementListRelationFilter
  }

  export type InventoryItemOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    priceBookItemId?: SortOrderInput | SortOrder
    sku?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    category?: SortOrder
    unit?: SortOrder
    reorderPoint?: SortOrder
    reorderQty?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    stockLevels?: StockLevelOrderByRelationAggregateInput
    stockMovements?: StockMovementOrderByRelationAggregateInput
  }

  export type InventoryItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_sku?: InventoryItemCompanyIdSkuCompoundUniqueInput
    AND?: InventoryItemWhereInput | InventoryItemWhereInput[]
    OR?: InventoryItemWhereInput[]
    NOT?: InventoryItemWhereInput | InventoryItemWhereInput[]
    companyId?: StringFilter<"InventoryItem"> | string
    priceBookItemId?: StringNullableFilter<"InventoryItem"> | string | null
    sku?: StringFilter<"InventoryItem"> | string
    name?: StringFilter<"InventoryItem"> | string
    description?: StringNullableFilter<"InventoryItem"> | string | null
    category?: EnumItemCategoryFilter<"InventoryItem"> | $Enums.ItemCategory
    unit?: StringFilter<"InventoryItem"> | string
    reorderPoint?: IntFilter<"InventoryItem"> | number
    reorderQty?: IntFilter<"InventoryItem"> | number
    isActive?: BoolFilter<"InventoryItem"> | boolean
    createdAt?: DateTimeFilter<"InventoryItem"> | Date | string
    updatedAt?: DateTimeFilter<"InventoryItem"> | Date | string
    stockLevels?: StockLevelListRelationFilter
    stockMovements?: StockMovementListRelationFilter
  }, "id" | "companyId_sku">

  export type InventoryItemOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    priceBookItemId?: SortOrderInput | SortOrder
    sku?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    category?: SortOrder
    unit?: SortOrder
    reorderPoint?: SortOrder
    reorderQty?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InventoryItemCountOrderByAggregateInput
    _avg?: InventoryItemAvgOrderByAggregateInput
    _max?: InventoryItemMaxOrderByAggregateInput
    _min?: InventoryItemMinOrderByAggregateInput
    _sum?: InventoryItemSumOrderByAggregateInput
  }

  export type InventoryItemScalarWhereWithAggregatesInput = {
    AND?: InventoryItemScalarWhereWithAggregatesInput | InventoryItemScalarWhereWithAggregatesInput[]
    OR?: InventoryItemScalarWhereWithAggregatesInput[]
    NOT?: InventoryItemScalarWhereWithAggregatesInput | InventoryItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"InventoryItem"> | string
    companyId?: StringWithAggregatesFilter<"InventoryItem"> | string
    priceBookItemId?: StringNullableWithAggregatesFilter<"InventoryItem"> | string | null
    sku?: StringWithAggregatesFilter<"InventoryItem"> | string
    name?: StringWithAggregatesFilter<"InventoryItem"> | string
    description?: StringNullableWithAggregatesFilter<"InventoryItem"> | string | null
    category?: EnumItemCategoryWithAggregatesFilter<"InventoryItem"> | $Enums.ItemCategory
    unit?: StringWithAggregatesFilter<"InventoryItem"> | string
    reorderPoint?: IntWithAggregatesFilter<"InventoryItem"> | number
    reorderQty?: IntWithAggregatesFilter<"InventoryItem"> | number
    isActive?: BoolWithAggregatesFilter<"InventoryItem"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"InventoryItem"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"InventoryItem"> | Date | string
  }

  export type StockLocationWhereInput = {
    AND?: StockLocationWhereInput | StockLocationWhereInput[]
    OR?: StockLocationWhereInput[]
    NOT?: StockLocationWhereInput | StockLocationWhereInput[]
    id?: StringFilter<"StockLocation"> | string
    companyId?: StringFilter<"StockLocation"> | string
    type?: EnumLocationTypeFilter<"StockLocation"> | $Enums.LocationType
    name?: StringFilter<"StockLocation"> | string
    technicianId?: StringNullableFilter<"StockLocation"> | string | null
    isActive?: BoolFilter<"StockLocation"> | boolean
    createdAt?: DateTimeFilter<"StockLocation"> | Date | string
    updatedAt?: DateTimeFilter<"StockLocation"> | Date | string
    stockLevels?: StockLevelListRelationFilter
    movementsFrom?: StockMovementListRelationFilter
    movementsTo?: StockMovementListRelationFilter
  }

  export type StockLocationOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    type?: SortOrder
    name?: SortOrder
    technicianId?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    stockLevels?: StockLevelOrderByRelationAggregateInput
    movementsFrom?: StockMovementOrderByRelationAggregateInput
    movementsTo?: StockMovementOrderByRelationAggregateInput
  }

  export type StockLocationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_technicianId?: StockLocationCompanyIdTechnicianIdCompoundUniqueInput
    AND?: StockLocationWhereInput | StockLocationWhereInput[]
    OR?: StockLocationWhereInput[]
    NOT?: StockLocationWhereInput | StockLocationWhereInput[]
    companyId?: StringFilter<"StockLocation"> | string
    type?: EnumLocationTypeFilter<"StockLocation"> | $Enums.LocationType
    name?: StringFilter<"StockLocation"> | string
    technicianId?: StringNullableFilter<"StockLocation"> | string | null
    isActive?: BoolFilter<"StockLocation"> | boolean
    createdAt?: DateTimeFilter<"StockLocation"> | Date | string
    updatedAt?: DateTimeFilter<"StockLocation"> | Date | string
    stockLevels?: StockLevelListRelationFilter
    movementsFrom?: StockMovementListRelationFilter
    movementsTo?: StockMovementListRelationFilter
  }, "id" | "companyId_technicianId">

  export type StockLocationOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    type?: SortOrder
    name?: SortOrder
    technicianId?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: StockLocationCountOrderByAggregateInput
    _max?: StockLocationMaxOrderByAggregateInput
    _min?: StockLocationMinOrderByAggregateInput
  }

  export type StockLocationScalarWhereWithAggregatesInput = {
    AND?: StockLocationScalarWhereWithAggregatesInput | StockLocationScalarWhereWithAggregatesInput[]
    OR?: StockLocationScalarWhereWithAggregatesInput[]
    NOT?: StockLocationScalarWhereWithAggregatesInput | StockLocationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StockLocation"> | string
    companyId?: StringWithAggregatesFilter<"StockLocation"> | string
    type?: EnumLocationTypeWithAggregatesFilter<"StockLocation"> | $Enums.LocationType
    name?: StringWithAggregatesFilter<"StockLocation"> | string
    technicianId?: StringNullableWithAggregatesFilter<"StockLocation"> | string | null
    isActive?: BoolWithAggregatesFilter<"StockLocation"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"StockLocation"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"StockLocation"> | Date | string
  }

  export type StockLevelWhereInput = {
    AND?: StockLevelWhereInput | StockLevelWhereInput[]
    OR?: StockLevelWhereInput[]
    NOT?: StockLevelWhereInput | StockLevelWhereInput[]
    id?: StringFilter<"StockLevel"> | string
    inventoryItemId?: StringFilter<"StockLevel"> | string
    locationId?: StringFilter<"StockLevel"> | string
    quantity?: DecimalFilter<"StockLevel"> | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFilter<"StockLevel"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"StockLevel"> | Date | string
    inventoryItem?: XOR<InventoryItemRelationFilter, InventoryItemWhereInput>
    location?: XOR<StockLocationRelationFilter, StockLocationWhereInput>
  }

  export type StockLevelOrderByWithRelationInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    locationId?: SortOrder
    quantity?: SortOrder
    reservedQty?: SortOrder
    updatedAt?: SortOrder
    inventoryItem?: InventoryItemOrderByWithRelationInput
    location?: StockLocationOrderByWithRelationInput
  }

  export type StockLevelWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    inventoryItemId_locationId?: StockLevelInventoryItemIdLocationIdCompoundUniqueInput
    AND?: StockLevelWhereInput | StockLevelWhereInput[]
    OR?: StockLevelWhereInput[]
    NOT?: StockLevelWhereInput | StockLevelWhereInput[]
    inventoryItemId?: StringFilter<"StockLevel"> | string
    locationId?: StringFilter<"StockLevel"> | string
    quantity?: DecimalFilter<"StockLevel"> | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFilter<"StockLevel"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"StockLevel"> | Date | string
    inventoryItem?: XOR<InventoryItemRelationFilter, InventoryItemWhereInput>
    location?: XOR<StockLocationRelationFilter, StockLocationWhereInput>
  }, "id" | "inventoryItemId_locationId">

  export type StockLevelOrderByWithAggregationInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    locationId?: SortOrder
    quantity?: SortOrder
    reservedQty?: SortOrder
    updatedAt?: SortOrder
    _count?: StockLevelCountOrderByAggregateInput
    _avg?: StockLevelAvgOrderByAggregateInput
    _max?: StockLevelMaxOrderByAggregateInput
    _min?: StockLevelMinOrderByAggregateInput
    _sum?: StockLevelSumOrderByAggregateInput
  }

  export type StockLevelScalarWhereWithAggregatesInput = {
    AND?: StockLevelScalarWhereWithAggregatesInput | StockLevelScalarWhereWithAggregatesInput[]
    OR?: StockLevelScalarWhereWithAggregatesInput[]
    NOT?: StockLevelScalarWhereWithAggregatesInput | StockLevelScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StockLevel"> | string
    inventoryItemId?: StringWithAggregatesFilter<"StockLevel"> | string
    locationId?: StringWithAggregatesFilter<"StockLevel"> | string
    quantity?: DecimalWithAggregatesFilter<"StockLevel"> | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalWithAggregatesFilter<"StockLevel"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeWithAggregatesFilter<"StockLevel"> | Date | string
  }

  export type StockMovementWhereInput = {
    AND?: StockMovementWhereInput | StockMovementWhereInput[]
    OR?: StockMovementWhereInput[]
    NOT?: StockMovementWhereInput | StockMovementWhereInput[]
    id?: StringFilter<"StockMovement"> | string
    companyId?: StringFilter<"StockMovement"> | string
    inventoryItemId?: StringFilter<"StockMovement"> | string
    fromLocationId?: StringNullableFilter<"StockMovement"> | string | null
    toLocationId?: StringNullableFilter<"StockMovement"> | string | null
    quantity?: DecimalFilter<"StockMovement"> | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFilter<"StockMovement"> | $Enums.MovementType
    referenceId?: StringNullableFilter<"StockMovement"> | string | null
    referenceType?: StringNullableFilter<"StockMovement"> | string | null
    notes?: StringNullableFilter<"StockMovement"> | string | null
    performedBy?: StringFilter<"StockMovement"> | string
    performedByName?: StringNullableFilter<"StockMovement"> | string | null
    createdAt?: DateTimeFilter<"StockMovement"> | Date | string
    inventoryItem?: XOR<InventoryItemRelationFilter, InventoryItemWhereInput>
    fromLocation?: XOR<StockLocationNullableRelationFilter, StockLocationWhereInput> | null
    toLocation?: XOR<StockLocationNullableRelationFilter, StockLocationWhereInput> | null
  }

  export type StockMovementOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    inventoryItemId?: SortOrder
    fromLocationId?: SortOrderInput | SortOrder
    toLocationId?: SortOrderInput | SortOrder
    quantity?: SortOrder
    movementType?: SortOrder
    referenceId?: SortOrderInput | SortOrder
    referenceType?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    performedBy?: SortOrder
    performedByName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    inventoryItem?: InventoryItemOrderByWithRelationInput
    fromLocation?: StockLocationOrderByWithRelationInput
    toLocation?: StockLocationOrderByWithRelationInput
  }

  export type StockMovementWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: StockMovementWhereInput | StockMovementWhereInput[]
    OR?: StockMovementWhereInput[]
    NOT?: StockMovementWhereInput | StockMovementWhereInput[]
    companyId?: StringFilter<"StockMovement"> | string
    inventoryItemId?: StringFilter<"StockMovement"> | string
    fromLocationId?: StringNullableFilter<"StockMovement"> | string | null
    toLocationId?: StringNullableFilter<"StockMovement"> | string | null
    quantity?: DecimalFilter<"StockMovement"> | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFilter<"StockMovement"> | $Enums.MovementType
    referenceId?: StringNullableFilter<"StockMovement"> | string | null
    referenceType?: StringNullableFilter<"StockMovement"> | string | null
    notes?: StringNullableFilter<"StockMovement"> | string | null
    performedBy?: StringFilter<"StockMovement"> | string
    performedByName?: StringNullableFilter<"StockMovement"> | string | null
    createdAt?: DateTimeFilter<"StockMovement"> | Date | string
    inventoryItem?: XOR<InventoryItemRelationFilter, InventoryItemWhereInput>
    fromLocation?: XOR<StockLocationNullableRelationFilter, StockLocationWhereInput> | null
    toLocation?: XOR<StockLocationNullableRelationFilter, StockLocationWhereInput> | null
  }, "id">

  export type StockMovementOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    inventoryItemId?: SortOrder
    fromLocationId?: SortOrderInput | SortOrder
    toLocationId?: SortOrderInput | SortOrder
    quantity?: SortOrder
    movementType?: SortOrder
    referenceId?: SortOrderInput | SortOrder
    referenceType?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    performedBy?: SortOrder
    performedByName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: StockMovementCountOrderByAggregateInput
    _avg?: StockMovementAvgOrderByAggregateInput
    _max?: StockMovementMaxOrderByAggregateInput
    _min?: StockMovementMinOrderByAggregateInput
    _sum?: StockMovementSumOrderByAggregateInput
  }

  export type StockMovementScalarWhereWithAggregatesInput = {
    AND?: StockMovementScalarWhereWithAggregatesInput | StockMovementScalarWhereWithAggregatesInput[]
    OR?: StockMovementScalarWhereWithAggregatesInput[]
    NOT?: StockMovementScalarWhereWithAggregatesInput | StockMovementScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StockMovement"> | string
    companyId?: StringWithAggregatesFilter<"StockMovement"> | string
    inventoryItemId?: StringWithAggregatesFilter<"StockMovement"> | string
    fromLocationId?: StringNullableWithAggregatesFilter<"StockMovement"> | string | null
    toLocationId?: StringNullableWithAggregatesFilter<"StockMovement"> | string | null
    quantity?: DecimalWithAggregatesFilter<"StockMovement"> | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeWithAggregatesFilter<"StockMovement"> | $Enums.MovementType
    referenceId?: StringNullableWithAggregatesFilter<"StockMovement"> | string | null
    referenceType?: StringNullableWithAggregatesFilter<"StockMovement"> | string | null
    notes?: StringNullableWithAggregatesFilter<"StockMovement"> | string | null
    performedBy?: StringWithAggregatesFilter<"StockMovement"> | string
    performedByName?: StringNullableWithAggregatesFilter<"StockMovement"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"StockMovement"> | Date | string
  }

  export type PurchaseOrderWhereInput = {
    AND?: PurchaseOrderWhereInput | PurchaseOrderWhereInput[]
    OR?: PurchaseOrderWhereInput[]
    NOT?: PurchaseOrderWhereInput | PurchaseOrderWhereInput[]
    id?: StringFilter<"PurchaseOrder"> | string
    companyId?: StringFilter<"PurchaseOrder"> | string
    poNumber?: StringFilter<"PurchaseOrder"> | string
    supplierName?: StringFilter<"PurchaseOrder"> | string
    status?: EnumPurchaseOrderStatusFilter<"PurchaseOrder"> | $Enums.PurchaseOrderStatus
    items?: JsonFilter<"PurchaseOrder">
    totalCost?: DecimalFilter<"PurchaseOrder"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableFilter<"PurchaseOrder"> | string | null
    orderedAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    receivedAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    createdBy?: StringFilter<"PurchaseOrder"> | string
    createdByName?: StringNullableFilter<"PurchaseOrder"> | string | null
    createdAt?: DateTimeFilter<"PurchaseOrder"> | Date | string
    updatedAt?: DateTimeFilter<"PurchaseOrder"> | Date | string
  }

  export type PurchaseOrderOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    poNumber?: SortOrder
    supplierName?: SortOrder
    status?: SortOrder
    items?: SortOrder
    totalCost?: SortOrder
    notes?: SortOrderInput | SortOrder
    orderedAt?: SortOrderInput | SortOrder
    receivedAt?: SortOrderInput | SortOrder
    createdBy?: SortOrder
    createdByName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PurchaseOrderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_poNumber?: PurchaseOrderCompanyIdPoNumberCompoundUniqueInput
    AND?: PurchaseOrderWhereInput | PurchaseOrderWhereInput[]
    OR?: PurchaseOrderWhereInput[]
    NOT?: PurchaseOrderWhereInput | PurchaseOrderWhereInput[]
    companyId?: StringFilter<"PurchaseOrder"> | string
    poNumber?: StringFilter<"PurchaseOrder"> | string
    supplierName?: StringFilter<"PurchaseOrder"> | string
    status?: EnumPurchaseOrderStatusFilter<"PurchaseOrder"> | $Enums.PurchaseOrderStatus
    items?: JsonFilter<"PurchaseOrder">
    totalCost?: DecimalFilter<"PurchaseOrder"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableFilter<"PurchaseOrder"> | string | null
    orderedAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    receivedAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    createdBy?: StringFilter<"PurchaseOrder"> | string
    createdByName?: StringNullableFilter<"PurchaseOrder"> | string | null
    createdAt?: DateTimeFilter<"PurchaseOrder"> | Date | string
    updatedAt?: DateTimeFilter<"PurchaseOrder"> | Date | string
  }, "id" | "companyId_poNumber">

  export type PurchaseOrderOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    poNumber?: SortOrder
    supplierName?: SortOrder
    status?: SortOrder
    items?: SortOrder
    totalCost?: SortOrder
    notes?: SortOrderInput | SortOrder
    orderedAt?: SortOrderInput | SortOrder
    receivedAt?: SortOrderInput | SortOrder
    createdBy?: SortOrder
    createdByName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PurchaseOrderCountOrderByAggregateInput
    _avg?: PurchaseOrderAvgOrderByAggregateInput
    _max?: PurchaseOrderMaxOrderByAggregateInput
    _min?: PurchaseOrderMinOrderByAggregateInput
    _sum?: PurchaseOrderSumOrderByAggregateInput
  }

  export type PurchaseOrderScalarWhereWithAggregatesInput = {
    AND?: PurchaseOrderScalarWhereWithAggregatesInput | PurchaseOrderScalarWhereWithAggregatesInput[]
    OR?: PurchaseOrderScalarWhereWithAggregatesInput[]
    NOT?: PurchaseOrderScalarWhereWithAggregatesInput | PurchaseOrderScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    companyId?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    poNumber?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    supplierName?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    status?: EnumPurchaseOrderStatusWithAggregatesFilter<"PurchaseOrder"> | $Enums.PurchaseOrderStatus
    items?: JsonWithAggregatesFilter<"PurchaseOrder">
    totalCost?: DecimalWithAggregatesFilter<"PurchaseOrder"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableWithAggregatesFilter<"PurchaseOrder"> | string | null
    orderedAt?: DateTimeNullableWithAggregatesFilter<"PurchaseOrder"> | Date | string | null
    receivedAt?: DateTimeNullableWithAggregatesFilter<"PurchaseOrder"> | Date | string | null
    createdBy?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    createdByName?: StringNullableWithAggregatesFilter<"PurchaseOrder"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PurchaseOrder"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PurchaseOrder"> | Date | string
  }

  export type InventoryItemCreateInput = {
    id?: string
    companyId: string
    priceBookItemId?: string | null
    sku: string
    name: string
    description?: string | null
    category: $Enums.ItemCategory
    unit?: string
    reorderPoint?: number
    reorderQty?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelCreateNestedManyWithoutInventoryItemInput
    stockMovements?: StockMovementCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemUncheckedCreateInput = {
    id?: string
    companyId: string
    priceBookItemId?: string | null
    sku: string
    name: string
    description?: string | null
    category: $Enums.ItemCategory
    unit?: string
    reorderPoint?: number
    reorderQty?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelUncheckedCreateNestedManyWithoutInventoryItemInput
    stockMovements?: StockMovementUncheckedCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    sku?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumItemCategoryFieldUpdateOperationsInput | $Enums.ItemCategory
    unit?: StringFieldUpdateOperationsInput | string
    reorderPoint?: IntFieldUpdateOperationsInput | number
    reorderQty?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUpdateManyWithoutInventoryItemNestedInput
    stockMovements?: StockMovementUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    sku?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumItemCategoryFieldUpdateOperationsInput | $Enums.ItemCategory
    unit?: StringFieldUpdateOperationsInput | string
    reorderPoint?: IntFieldUpdateOperationsInput | number
    reorderQty?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUncheckedUpdateManyWithoutInventoryItemNestedInput
    stockMovements?: StockMovementUncheckedUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemCreateManyInput = {
    id?: string
    companyId: string
    priceBookItemId?: string | null
    sku: string
    name: string
    description?: string | null
    category: $Enums.ItemCategory
    unit?: string
    reorderPoint?: number
    reorderQty?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InventoryItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    sku?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumItemCategoryFieldUpdateOperationsInput | $Enums.ItemCategory
    unit?: StringFieldUpdateOperationsInput | string
    reorderPoint?: IntFieldUpdateOperationsInput | number
    reorderQty?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    sku?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumItemCategoryFieldUpdateOperationsInput | $Enums.ItemCategory
    unit?: StringFieldUpdateOperationsInput | string
    reorderPoint?: IntFieldUpdateOperationsInput | number
    reorderQty?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLocationCreateInput = {
    id?: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelCreateNestedManyWithoutLocationInput
    movementsFrom?: StockMovementCreateNestedManyWithoutFromLocationInput
    movementsTo?: StockMovementCreateNestedManyWithoutToLocationInput
  }

  export type StockLocationUncheckedCreateInput = {
    id?: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelUncheckedCreateNestedManyWithoutLocationInput
    movementsFrom?: StockMovementUncheckedCreateNestedManyWithoutFromLocationInput
    movementsTo?: StockMovementUncheckedCreateNestedManyWithoutToLocationInput
  }

  export type StockLocationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUpdateManyWithoutLocationNestedInput
    movementsFrom?: StockMovementUpdateManyWithoutFromLocationNestedInput
    movementsTo?: StockMovementUpdateManyWithoutToLocationNestedInput
  }

  export type StockLocationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUncheckedUpdateManyWithoutLocationNestedInput
    movementsFrom?: StockMovementUncheckedUpdateManyWithoutFromLocationNestedInput
    movementsTo?: StockMovementUncheckedUpdateManyWithoutToLocationNestedInput
  }

  export type StockLocationCreateManyInput = {
    id?: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StockLocationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLocationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLevelCreateInput = {
    id?: string
    quantity?: Decimal | DecimalJsLike | number | string
    reservedQty?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
    inventoryItem: InventoryItemCreateNestedOneWithoutStockLevelsInput
    location: StockLocationCreateNestedOneWithoutStockLevelsInput
  }

  export type StockLevelUncheckedCreateInput = {
    id?: string
    inventoryItemId: string
    locationId: string
    quantity?: Decimal | DecimalJsLike | number | string
    reservedQty?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type StockLevelUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItem?: InventoryItemUpdateOneRequiredWithoutStockLevelsNestedInput
    location?: StockLocationUpdateOneRequiredWithoutStockLevelsNestedInput
  }

  export type StockLevelUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLevelCreateManyInput = {
    id?: string
    inventoryItemId: string
    locationId: string
    quantity?: Decimal | DecimalJsLike | number | string
    reservedQty?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type StockLevelUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLevelUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementCreateInput = {
    id?: string
    companyId: string
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
    inventoryItem: InventoryItemCreateNestedOneWithoutStockMovementsInput
    fromLocation?: StockLocationCreateNestedOneWithoutMovementsFromInput
    toLocation?: StockLocationCreateNestedOneWithoutMovementsToInput
  }

  export type StockMovementUncheckedCreateInput = {
    id?: string
    companyId: string
    inventoryItemId: string
    fromLocationId?: string | null
    toLocationId?: string | null
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
  }

  export type StockMovementUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItem?: InventoryItemUpdateOneRequiredWithoutStockMovementsNestedInput
    fromLocation?: StockLocationUpdateOneWithoutMovementsFromNestedInput
    toLocation?: StockLocationUpdateOneWithoutMovementsToNestedInput
  }

  export type StockMovementUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    fromLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    toLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementCreateManyInput = {
    id?: string
    companyId: string
    inventoryItemId: string
    fromLocationId?: string | null
    toLocationId?: string | null
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
  }

  export type StockMovementUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    fromLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    toLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PurchaseOrderCreateInput = {
    id?: string
    companyId: string
    poNumber: string
    supplierName: string
    status?: $Enums.PurchaseOrderStatus
    items: JsonNullValueInput | InputJsonValue
    totalCost?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    orderedAt?: Date | string | null
    receivedAt?: Date | string | null
    createdBy: string
    createdByName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PurchaseOrderUncheckedCreateInput = {
    id?: string
    companyId: string
    poNumber: string
    supplierName: string
    status?: $Enums.PurchaseOrderStatus
    items: JsonNullValueInput | InputJsonValue
    totalCost?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    orderedAt?: Date | string | null
    receivedAt?: Date | string | null
    createdBy: string
    createdByName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PurchaseOrderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    poNumber?: StringFieldUpdateOperationsInput | string
    supplierName?: StringFieldUpdateOperationsInput | string
    status?: EnumPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.PurchaseOrderStatus
    items?: JsonNullValueInput | InputJsonValue
    totalCost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    orderedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receivedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PurchaseOrderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    poNumber?: StringFieldUpdateOperationsInput | string
    supplierName?: StringFieldUpdateOperationsInput | string
    status?: EnumPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.PurchaseOrderStatus
    items?: JsonNullValueInput | InputJsonValue
    totalCost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    orderedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receivedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PurchaseOrderCreateManyInput = {
    id?: string
    companyId: string
    poNumber: string
    supplierName: string
    status?: $Enums.PurchaseOrderStatus
    items: JsonNullValueInput | InputJsonValue
    totalCost?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    orderedAt?: Date | string | null
    receivedAt?: Date | string | null
    createdBy: string
    createdByName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PurchaseOrderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    poNumber?: StringFieldUpdateOperationsInput | string
    supplierName?: StringFieldUpdateOperationsInput | string
    status?: EnumPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.PurchaseOrderStatus
    items?: JsonNullValueInput | InputJsonValue
    totalCost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    orderedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receivedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PurchaseOrderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    poNumber?: StringFieldUpdateOperationsInput | string
    supplierName?: StringFieldUpdateOperationsInput | string
    status?: EnumPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.PurchaseOrderStatus
    items?: JsonNullValueInput | InputJsonValue
    totalCost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    orderedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receivedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    createdByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type EnumItemCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemCategory | EnumItemCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.ItemCategory[] | ListEnumItemCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemCategory[] | ListEnumItemCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumItemCategoryFilter<$PrismaModel> | $Enums.ItemCategory
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

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type StockLevelListRelationFilter = {
    every?: StockLevelWhereInput
    some?: StockLevelWhereInput
    none?: StockLevelWhereInput
  }

  export type StockMovementListRelationFilter = {
    every?: StockMovementWhereInput
    some?: StockMovementWhereInput
    none?: StockMovementWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type StockLevelOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type StockMovementOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InventoryItemCompanyIdSkuCompoundUniqueInput = {
    companyId: string
    sku: string
  }

  export type InventoryItemCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    priceBookItemId?: SortOrder
    sku?: SortOrder
    name?: SortOrder
    description?: SortOrder
    category?: SortOrder
    unit?: SortOrder
    reorderPoint?: SortOrder
    reorderQty?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryItemAvgOrderByAggregateInput = {
    reorderPoint?: SortOrder
    reorderQty?: SortOrder
  }

  export type InventoryItemMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    priceBookItemId?: SortOrder
    sku?: SortOrder
    name?: SortOrder
    description?: SortOrder
    category?: SortOrder
    unit?: SortOrder
    reorderPoint?: SortOrder
    reorderQty?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryItemMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    priceBookItemId?: SortOrder
    sku?: SortOrder
    name?: SortOrder
    description?: SortOrder
    category?: SortOrder
    unit?: SortOrder
    reorderPoint?: SortOrder
    reorderQty?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryItemSumOrderByAggregateInput = {
    reorderPoint?: SortOrder
    reorderQty?: SortOrder
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

  export type EnumItemCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemCategory | EnumItemCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.ItemCategory[] | ListEnumItemCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemCategory[] | ListEnumItemCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumItemCategoryWithAggregatesFilter<$PrismaModel> | $Enums.ItemCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemCategoryFilter<$PrismaModel>
    _max?: NestedEnumItemCategoryFilter<$PrismaModel>
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

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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

  export type EnumLocationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LocationType | EnumLocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LocationType[] | ListEnumLocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LocationType[] | ListEnumLocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLocationTypeFilter<$PrismaModel> | $Enums.LocationType
  }

  export type StockLocationCompanyIdTechnicianIdCompoundUniqueInput = {
    companyId: string
    technicianId: string
  }

  export type StockLocationCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    type?: SortOrder
    name?: SortOrder
    technicianId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StockLocationMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    type?: SortOrder
    name?: SortOrder
    technicianId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StockLocationMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    type?: SortOrder
    name?: SortOrder
    technicianId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumLocationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LocationType | EnumLocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LocationType[] | ListEnumLocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LocationType[] | ListEnumLocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLocationTypeWithAggregatesFilter<$PrismaModel> | $Enums.LocationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLocationTypeFilter<$PrismaModel>
    _max?: NestedEnumLocationTypeFilter<$PrismaModel>
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

  export type InventoryItemRelationFilter = {
    is?: InventoryItemWhereInput
    isNot?: InventoryItemWhereInput
  }

  export type StockLocationRelationFilter = {
    is?: StockLocationWhereInput
    isNot?: StockLocationWhereInput
  }

  export type StockLevelInventoryItemIdLocationIdCompoundUniqueInput = {
    inventoryItemId: string
    locationId: string
  }

  export type StockLevelCountOrderByAggregateInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    locationId?: SortOrder
    quantity?: SortOrder
    reservedQty?: SortOrder
    updatedAt?: SortOrder
  }

  export type StockLevelAvgOrderByAggregateInput = {
    quantity?: SortOrder
    reservedQty?: SortOrder
  }

  export type StockLevelMaxOrderByAggregateInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    locationId?: SortOrder
    quantity?: SortOrder
    reservedQty?: SortOrder
    updatedAt?: SortOrder
  }

  export type StockLevelMinOrderByAggregateInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    locationId?: SortOrder
    quantity?: SortOrder
    reservedQty?: SortOrder
    updatedAt?: SortOrder
  }

  export type StockLevelSumOrderByAggregateInput = {
    quantity?: SortOrder
    reservedQty?: SortOrder
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

  export type EnumMovementTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.MovementType | EnumMovementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMovementTypeFilter<$PrismaModel> | $Enums.MovementType
  }

  export type StockLocationNullableRelationFilter = {
    is?: StockLocationWhereInput | null
    isNot?: StockLocationWhereInput | null
  }

  export type StockMovementCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    inventoryItemId?: SortOrder
    fromLocationId?: SortOrder
    toLocationId?: SortOrder
    quantity?: SortOrder
    movementType?: SortOrder
    referenceId?: SortOrder
    referenceType?: SortOrder
    notes?: SortOrder
    performedBy?: SortOrder
    performedByName?: SortOrder
    createdAt?: SortOrder
  }

  export type StockMovementAvgOrderByAggregateInput = {
    quantity?: SortOrder
  }

  export type StockMovementMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    inventoryItemId?: SortOrder
    fromLocationId?: SortOrder
    toLocationId?: SortOrder
    quantity?: SortOrder
    movementType?: SortOrder
    referenceId?: SortOrder
    referenceType?: SortOrder
    notes?: SortOrder
    performedBy?: SortOrder
    performedByName?: SortOrder
    createdAt?: SortOrder
  }

  export type StockMovementMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    inventoryItemId?: SortOrder
    fromLocationId?: SortOrder
    toLocationId?: SortOrder
    quantity?: SortOrder
    movementType?: SortOrder
    referenceId?: SortOrder
    referenceType?: SortOrder
    notes?: SortOrder
    performedBy?: SortOrder
    performedByName?: SortOrder
    createdAt?: SortOrder
  }

  export type StockMovementSumOrderByAggregateInput = {
    quantity?: SortOrder
  }

  export type EnumMovementTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MovementType | EnumMovementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMovementTypeWithAggregatesFilter<$PrismaModel> | $Enums.MovementType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMovementTypeFilter<$PrismaModel>
    _max?: NestedEnumMovementTypeFilter<$PrismaModel>
  }

  export type EnumPurchaseOrderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PurchaseOrderStatus | EnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PurchaseOrderStatus[] | ListEnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PurchaseOrderStatus[] | ListEnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPurchaseOrderStatusFilter<$PrismaModel> | $Enums.PurchaseOrderStatus
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

  export type PurchaseOrderCompanyIdPoNumberCompoundUniqueInput = {
    companyId: string
    poNumber: string
  }

  export type PurchaseOrderCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    poNumber?: SortOrder
    supplierName?: SortOrder
    status?: SortOrder
    items?: SortOrder
    totalCost?: SortOrder
    notes?: SortOrder
    orderedAt?: SortOrder
    receivedAt?: SortOrder
    createdBy?: SortOrder
    createdByName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PurchaseOrderAvgOrderByAggregateInput = {
    totalCost?: SortOrder
  }

  export type PurchaseOrderMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    poNumber?: SortOrder
    supplierName?: SortOrder
    status?: SortOrder
    totalCost?: SortOrder
    notes?: SortOrder
    orderedAt?: SortOrder
    receivedAt?: SortOrder
    createdBy?: SortOrder
    createdByName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PurchaseOrderMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    poNumber?: SortOrder
    supplierName?: SortOrder
    status?: SortOrder
    totalCost?: SortOrder
    notes?: SortOrder
    orderedAt?: SortOrder
    receivedAt?: SortOrder
    createdBy?: SortOrder
    createdByName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PurchaseOrderSumOrderByAggregateInput = {
    totalCost?: SortOrder
  }

  export type EnumPurchaseOrderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PurchaseOrderStatus | EnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PurchaseOrderStatus[] | ListEnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PurchaseOrderStatus[] | ListEnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPurchaseOrderStatusWithAggregatesFilter<$PrismaModel> | $Enums.PurchaseOrderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPurchaseOrderStatusFilter<$PrismaModel>
    _max?: NestedEnumPurchaseOrderStatusFilter<$PrismaModel>
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

  export type StockLevelCreateNestedManyWithoutInventoryItemInput = {
    create?: XOR<StockLevelCreateWithoutInventoryItemInput, StockLevelUncheckedCreateWithoutInventoryItemInput> | StockLevelCreateWithoutInventoryItemInput[] | StockLevelUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockLevelCreateOrConnectWithoutInventoryItemInput | StockLevelCreateOrConnectWithoutInventoryItemInput[]
    createMany?: StockLevelCreateManyInventoryItemInputEnvelope
    connect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
  }

  export type StockMovementCreateNestedManyWithoutInventoryItemInput = {
    create?: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput> | StockMovementCreateWithoutInventoryItemInput[] | StockMovementUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutInventoryItemInput | StockMovementCreateOrConnectWithoutInventoryItemInput[]
    createMany?: StockMovementCreateManyInventoryItemInputEnvelope
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
  }

  export type StockLevelUncheckedCreateNestedManyWithoutInventoryItemInput = {
    create?: XOR<StockLevelCreateWithoutInventoryItemInput, StockLevelUncheckedCreateWithoutInventoryItemInput> | StockLevelCreateWithoutInventoryItemInput[] | StockLevelUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockLevelCreateOrConnectWithoutInventoryItemInput | StockLevelCreateOrConnectWithoutInventoryItemInput[]
    createMany?: StockLevelCreateManyInventoryItemInputEnvelope
    connect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
  }

  export type StockMovementUncheckedCreateNestedManyWithoutInventoryItemInput = {
    create?: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput> | StockMovementCreateWithoutInventoryItemInput[] | StockMovementUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutInventoryItemInput | StockMovementCreateOrConnectWithoutInventoryItemInput[]
    createMany?: StockMovementCreateManyInventoryItemInputEnvelope
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumItemCategoryFieldUpdateOperationsInput = {
    set?: $Enums.ItemCategory
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type StockLevelUpdateManyWithoutInventoryItemNestedInput = {
    create?: XOR<StockLevelCreateWithoutInventoryItemInput, StockLevelUncheckedCreateWithoutInventoryItemInput> | StockLevelCreateWithoutInventoryItemInput[] | StockLevelUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockLevelCreateOrConnectWithoutInventoryItemInput | StockLevelCreateOrConnectWithoutInventoryItemInput[]
    upsert?: StockLevelUpsertWithWhereUniqueWithoutInventoryItemInput | StockLevelUpsertWithWhereUniqueWithoutInventoryItemInput[]
    createMany?: StockLevelCreateManyInventoryItemInputEnvelope
    set?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    disconnect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    delete?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    connect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    update?: StockLevelUpdateWithWhereUniqueWithoutInventoryItemInput | StockLevelUpdateWithWhereUniqueWithoutInventoryItemInput[]
    updateMany?: StockLevelUpdateManyWithWhereWithoutInventoryItemInput | StockLevelUpdateManyWithWhereWithoutInventoryItemInput[]
    deleteMany?: StockLevelScalarWhereInput | StockLevelScalarWhereInput[]
  }

  export type StockMovementUpdateManyWithoutInventoryItemNestedInput = {
    create?: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput> | StockMovementCreateWithoutInventoryItemInput[] | StockMovementUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutInventoryItemInput | StockMovementCreateOrConnectWithoutInventoryItemInput[]
    upsert?: StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput | StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput[]
    createMany?: StockMovementCreateManyInventoryItemInputEnvelope
    set?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    disconnect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    delete?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    update?: StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput | StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput[]
    updateMany?: StockMovementUpdateManyWithWhereWithoutInventoryItemInput | StockMovementUpdateManyWithWhereWithoutInventoryItemInput[]
    deleteMany?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
  }

  export type StockLevelUncheckedUpdateManyWithoutInventoryItemNestedInput = {
    create?: XOR<StockLevelCreateWithoutInventoryItemInput, StockLevelUncheckedCreateWithoutInventoryItemInput> | StockLevelCreateWithoutInventoryItemInput[] | StockLevelUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockLevelCreateOrConnectWithoutInventoryItemInput | StockLevelCreateOrConnectWithoutInventoryItemInput[]
    upsert?: StockLevelUpsertWithWhereUniqueWithoutInventoryItemInput | StockLevelUpsertWithWhereUniqueWithoutInventoryItemInput[]
    createMany?: StockLevelCreateManyInventoryItemInputEnvelope
    set?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    disconnect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    delete?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    connect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    update?: StockLevelUpdateWithWhereUniqueWithoutInventoryItemInput | StockLevelUpdateWithWhereUniqueWithoutInventoryItemInput[]
    updateMany?: StockLevelUpdateManyWithWhereWithoutInventoryItemInput | StockLevelUpdateManyWithWhereWithoutInventoryItemInput[]
    deleteMany?: StockLevelScalarWhereInput | StockLevelScalarWhereInput[]
  }

  export type StockMovementUncheckedUpdateManyWithoutInventoryItemNestedInput = {
    create?: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput> | StockMovementCreateWithoutInventoryItemInput[] | StockMovementUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutInventoryItemInput | StockMovementCreateOrConnectWithoutInventoryItemInput[]
    upsert?: StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput | StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput[]
    createMany?: StockMovementCreateManyInventoryItemInputEnvelope
    set?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    disconnect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    delete?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    update?: StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput | StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput[]
    updateMany?: StockMovementUpdateManyWithWhereWithoutInventoryItemInput | StockMovementUpdateManyWithWhereWithoutInventoryItemInput[]
    deleteMany?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
  }

  export type StockLevelCreateNestedManyWithoutLocationInput = {
    create?: XOR<StockLevelCreateWithoutLocationInput, StockLevelUncheckedCreateWithoutLocationInput> | StockLevelCreateWithoutLocationInput[] | StockLevelUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: StockLevelCreateOrConnectWithoutLocationInput | StockLevelCreateOrConnectWithoutLocationInput[]
    createMany?: StockLevelCreateManyLocationInputEnvelope
    connect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
  }

  export type StockMovementCreateNestedManyWithoutFromLocationInput = {
    create?: XOR<StockMovementCreateWithoutFromLocationInput, StockMovementUncheckedCreateWithoutFromLocationInput> | StockMovementCreateWithoutFromLocationInput[] | StockMovementUncheckedCreateWithoutFromLocationInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutFromLocationInput | StockMovementCreateOrConnectWithoutFromLocationInput[]
    createMany?: StockMovementCreateManyFromLocationInputEnvelope
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
  }

  export type StockMovementCreateNestedManyWithoutToLocationInput = {
    create?: XOR<StockMovementCreateWithoutToLocationInput, StockMovementUncheckedCreateWithoutToLocationInput> | StockMovementCreateWithoutToLocationInput[] | StockMovementUncheckedCreateWithoutToLocationInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutToLocationInput | StockMovementCreateOrConnectWithoutToLocationInput[]
    createMany?: StockMovementCreateManyToLocationInputEnvelope
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
  }

  export type StockLevelUncheckedCreateNestedManyWithoutLocationInput = {
    create?: XOR<StockLevelCreateWithoutLocationInput, StockLevelUncheckedCreateWithoutLocationInput> | StockLevelCreateWithoutLocationInput[] | StockLevelUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: StockLevelCreateOrConnectWithoutLocationInput | StockLevelCreateOrConnectWithoutLocationInput[]
    createMany?: StockLevelCreateManyLocationInputEnvelope
    connect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
  }

  export type StockMovementUncheckedCreateNestedManyWithoutFromLocationInput = {
    create?: XOR<StockMovementCreateWithoutFromLocationInput, StockMovementUncheckedCreateWithoutFromLocationInput> | StockMovementCreateWithoutFromLocationInput[] | StockMovementUncheckedCreateWithoutFromLocationInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutFromLocationInput | StockMovementCreateOrConnectWithoutFromLocationInput[]
    createMany?: StockMovementCreateManyFromLocationInputEnvelope
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
  }

  export type StockMovementUncheckedCreateNestedManyWithoutToLocationInput = {
    create?: XOR<StockMovementCreateWithoutToLocationInput, StockMovementUncheckedCreateWithoutToLocationInput> | StockMovementCreateWithoutToLocationInput[] | StockMovementUncheckedCreateWithoutToLocationInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutToLocationInput | StockMovementCreateOrConnectWithoutToLocationInput[]
    createMany?: StockMovementCreateManyToLocationInputEnvelope
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
  }

  export type EnumLocationTypeFieldUpdateOperationsInput = {
    set?: $Enums.LocationType
  }

  export type StockLevelUpdateManyWithoutLocationNestedInput = {
    create?: XOR<StockLevelCreateWithoutLocationInput, StockLevelUncheckedCreateWithoutLocationInput> | StockLevelCreateWithoutLocationInput[] | StockLevelUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: StockLevelCreateOrConnectWithoutLocationInput | StockLevelCreateOrConnectWithoutLocationInput[]
    upsert?: StockLevelUpsertWithWhereUniqueWithoutLocationInput | StockLevelUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: StockLevelCreateManyLocationInputEnvelope
    set?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    disconnect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    delete?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    connect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    update?: StockLevelUpdateWithWhereUniqueWithoutLocationInput | StockLevelUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: StockLevelUpdateManyWithWhereWithoutLocationInput | StockLevelUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: StockLevelScalarWhereInput | StockLevelScalarWhereInput[]
  }

  export type StockMovementUpdateManyWithoutFromLocationNestedInput = {
    create?: XOR<StockMovementCreateWithoutFromLocationInput, StockMovementUncheckedCreateWithoutFromLocationInput> | StockMovementCreateWithoutFromLocationInput[] | StockMovementUncheckedCreateWithoutFromLocationInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutFromLocationInput | StockMovementCreateOrConnectWithoutFromLocationInput[]
    upsert?: StockMovementUpsertWithWhereUniqueWithoutFromLocationInput | StockMovementUpsertWithWhereUniqueWithoutFromLocationInput[]
    createMany?: StockMovementCreateManyFromLocationInputEnvelope
    set?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    disconnect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    delete?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    update?: StockMovementUpdateWithWhereUniqueWithoutFromLocationInput | StockMovementUpdateWithWhereUniqueWithoutFromLocationInput[]
    updateMany?: StockMovementUpdateManyWithWhereWithoutFromLocationInput | StockMovementUpdateManyWithWhereWithoutFromLocationInput[]
    deleteMany?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
  }

  export type StockMovementUpdateManyWithoutToLocationNestedInput = {
    create?: XOR<StockMovementCreateWithoutToLocationInput, StockMovementUncheckedCreateWithoutToLocationInput> | StockMovementCreateWithoutToLocationInput[] | StockMovementUncheckedCreateWithoutToLocationInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutToLocationInput | StockMovementCreateOrConnectWithoutToLocationInput[]
    upsert?: StockMovementUpsertWithWhereUniqueWithoutToLocationInput | StockMovementUpsertWithWhereUniqueWithoutToLocationInput[]
    createMany?: StockMovementCreateManyToLocationInputEnvelope
    set?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    disconnect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    delete?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    update?: StockMovementUpdateWithWhereUniqueWithoutToLocationInput | StockMovementUpdateWithWhereUniqueWithoutToLocationInput[]
    updateMany?: StockMovementUpdateManyWithWhereWithoutToLocationInput | StockMovementUpdateManyWithWhereWithoutToLocationInput[]
    deleteMany?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
  }

  export type StockLevelUncheckedUpdateManyWithoutLocationNestedInput = {
    create?: XOR<StockLevelCreateWithoutLocationInput, StockLevelUncheckedCreateWithoutLocationInput> | StockLevelCreateWithoutLocationInput[] | StockLevelUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: StockLevelCreateOrConnectWithoutLocationInput | StockLevelCreateOrConnectWithoutLocationInput[]
    upsert?: StockLevelUpsertWithWhereUniqueWithoutLocationInput | StockLevelUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: StockLevelCreateManyLocationInputEnvelope
    set?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    disconnect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    delete?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    connect?: StockLevelWhereUniqueInput | StockLevelWhereUniqueInput[]
    update?: StockLevelUpdateWithWhereUniqueWithoutLocationInput | StockLevelUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: StockLevelUpdateManyWithWhereWithoutLocationInput | StockLevelUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: StockLevelScalarWhereInput | StockLevelScalarWhereInput[]
  }

  export type StockMovementUncheckedUpdateManyWithoutFromLocationNestedInput = {
    create?: XOR<StockMovementCreateWithoutFromLocationInput, StockMovementUncheckedCreateWithoutFromLocationInput> | StockMovementCreateWithoutFromLocationInput[] | StockMovementUncheckedCreateWithoutFromLocationInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutFromLocationInput | StockMovementCreateOrConnectWithoutFromLocationInput[]
    upsert?: StockMovementUpsertWithWhereUniqueWithoutFromLocationInput | StockMovementUpsertWithWhereUniqueWithoutFromLocationInput[]
    createMany?: StockMovementCreateManyFromLocationInputEnvelope
    set?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    disconnect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    delete?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    update?: StockMovementUpdateWithWhereUniqueWithoutFromLocationInput | StockMovementUpdateWithWhereUniqueWithoutFromLocationInput[]
    updateMany?: StockMovementUpdateManyWithWhereWithoutFromLocationInput | StockMovementUpdateManyWithWhereWithoutFromLocationInput[]
    deleteMany?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
  }

  export type StockMovementUncheckedUpdateManyWithoutToLocationNestedInput = {
    create?: XOR<StockMovementCreateWithoutToLocationInput, StockMovementUncheckedCreateWithoutToLocationInput> | StockMovementCreateWithoutToLocationInput[] | StockMovementUncheckedCreateWithoutToLocationInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutToLocationInput | StockMovementCreateOrConnectWithoutToLocationInput[]
    upsert?: StockMovementUpsertWithWhereUniqueWithoutToLocationInput | StockMovementUpsertWithWhereUniqueWithoutToLocationInput[]
    createMany?: StockMovementCreateManyToLocationInputEnvelope
    set?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    disconnect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    delete?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    update?: StockMovementUpdateWithWhereUniqueWithoutToLocationInput | StockMovementUpdateWithWhereUniqueWithoutToLocationInput[]
    updateMany?: StockMovementUpdateManyWithWhereWithoutToLocationInput | StockMovementUpdateManyWithWhereWithoutToLocationInput[]
    deleteMany?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
  }

  export type InventoryItemCreateNestedOneWithoutStockLevelsInput = {
    create?: XOR<InventoryItemCreateWithoutStockLevelsInput, InventoryItemUncheckedCreateWithoutStockLevelsInput>
    connectOrCreate?: InventoryItemCreateOrConnectWithoutStockLevelsInput
    connect?: InventoryItemWhereUniqueInput
  }

  export type StockLocationCreateNestedOneWithoutStockLevelsInput = {
    create?: XOR<StockLocationCreateWithoutStockLevelsInput, StockLocationUncheckedCreateWithoutStockLevelsInput>
    connectOrCreate?: StockLocationCreateOrConnectWithoutStockLevelsInput
    connect?: StockLocationWhereUniqueInput
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type InventoryItemUpdateOneRequiredWithoutStockLevelsNestedInput = {
    create?: XOR<InventoryItemCreateWithoutStockLevelsInput, InventoryItemUncheckedCreateWithoutStockLevelsInput>
    connectOrCreate?: InventoryItemCreateOrConnectWithoutStockLevelsInput
    upsert?: InventoryItemUpsertWithoutStockLevelsInput
    connect?: InventoryItemWhereUniqueInput
    update?: XOR<XOR<InventoryItemUpdateToOneWithWhereWithoutStockLevelsInput, InventoryItemUpdateWithoutStockLevelsInput>, InventoryItemUncheckedUpdateWithoutStockLevelsInput>
  }

  export type StockLocationUpdateOneRequiredWithoutStockLevelsNestedInput = {
    create?: XOR<StockLocationCreateWithoutStockLevelsInput, StockLocationUncheckedCreateWithoutStockLevelsInput>
    connectOrCreate?: StockLocationCreateOrConnectWithoutStockLevelsInput
    upsert?: StockLocationUpsertWithoutStockLevelsInput
    connect?: StockLocationWhereUniqueInput
    update?: XOR<XOR<StockLocationUpdateToOneWithWhereWithoutStockLevelsInput, StockLocationUpdateWithoutStockLevelsInput>, StockLocationUncheckedUpdateWithoutStockLevelsInput>
  }

  export type InventoryItemCreateNestedOneWithoutStockMovementsInput = {
    create?: XOR<InventoryItemCreateWithoutStockMovementsInput, InventoryItemUncheckedCreateWithoutStockMovementsInput>
    connectOrCreate?: InventoryItemCreateOrConnectWithoutStockMovementsInput
    connect?: InventoryItemWhereUniqueInput
  }

  export type StockLocationCreateNestedOneWithoutMovementsFromInput = {
    create?: XOR<StockLocationCreateWithoutMovementsFromInput, StockLocationUncheckedCreateWithoutMovementsFromInput>
    connectOrCreate?: StockLocationCreateOrConnectWithoutMovementsFromInput
    connect?: StockLocationWhereUniqueInput
  }

  export type StockLocationCreateNestedOneWithoutMovementsToInput = {
    create?: XOR<StockLocationCreateWithoutMovementsToInput, StockLocationUncheckedCreateWithoutMovementsToInput>
    connectOrCreate?: StockLocationCreateOrConnectWithoutMovementsToInput
    connect?: StockLocationWhereUniqueInput
  }

  export type EnumMovementTypeFieldUpdateOperationsInput = {
    set?: $Enums.MovementType
  }

  export type InventoryItemUpdateOneRequiredWithoutStockMovementsNestedInput = {
    create?: XOR<InventoryItemCreateWithoutStockMovementsInput, InventoryItemUncheckedCreateWithoutStockMovementsInput>
    connectOrCreate?: InventoryItemCreateOrConnectWithoutStockMovementsInput
    upsert?: InventoryItemUpsertWithoutStockMovementsInput
    connect?: InventoryItemWhereUniqueInput
    update?: XOR<XOR<InventoryItemUpdateToOneWithWhereWithoutStockMovementsInput, InventoryItemUpdateWithoutStockMovementsInput>, InventoryItemUncheckedUpdateWithoutStockMovementsInput>
  }

  export type StockLocationUpdateOneWithoutMovementsFromNestedInput = {
    create?: XOR<StockLocationCreateWithoutMovementsFromInput, StockLocationUncheckedCreateWithoutMovementsFromInput>
    connectOrCreate?: StockLocationCreateOrConnectWithoutMovementsFromInput
    upsert?: StockLocationUpsertWithoutMovementsFromInput
    disconnect?: StockLocationWhereInput | boolean
    delete?: StockLocationWhereInput | boolean
    connect?: StockLocationWhereUniqueInput
    update?: XOR<XOR<StockLocationUpdateToOneWithWhereWithoutMovementsFromInput, StockLocationUpdateWithoutMovementsFromInput>, StockLocationUncheckedUpdateWithoutMovementsFromInput>
  }

  export type StockLocationUpdateOneWithoutMovementsToNestedInput = {
    create?: XOR<StockLocationCreateWithoutMovementsToInput, StockLocationUncheckedCreateWithoutMovementsToInput>
    connectOrCreate?: StockLocationCreateOrConnectWithoutMovementsToInput
    upsert?: StockLocationUpsertWithoutMovementsToInput
    disconnect?: StockLocationWhereInput | boolean
    delete?: StockLocationWhereInput | boolean
    connect?: StockLocationWhereUniqueInput
    update?: XOR<XOR<StockLocationUpdateToOneWithWhereWithoutMovementsToInput, StockLocationUpdateWithoutMovementsToInput>, StockLocationUncheckedUpdateWithoutMovementsToInput>
  }

  export type EnumPurchaseOrderStatusFieldUpdateOperationsInput = {
    set?: $Enums.PurchaseOrderStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
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

  export type NestedEnumItemCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemCategory | EnumItemCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.ItemCategory[] | ListEnumItemCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemCategory[] | ListEnumItemCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumItemCategoryFilter<$PrismaModel> | $Enums.ItemCategory
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

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type NestedEnumItemCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemCategory | EnumItemCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.ItemCategory[] | ListEnumItemCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemCategory[] | ListEnumItemCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumItemCategoryWithAggregatesFilter<$PrismaModel> | $Enums.ItemCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemCategoryFilter<$PrismaModel>
    _max?: NestedEnumItemCategoryFilter<$PrismaModel>
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

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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

  export type NestedEnumLocationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LocationType | EnumLocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LocationType[] | ListEnumLocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LocationType[] | ListEnumLocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLocationTypeFilter<$PrismaModel> | $Enums.LocationType
  }

  export type NestedEnumLocationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LocationType | EnumLocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LocationType[] | ListEnumLocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LocationType[] | ListEnumLocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLocationTypeWithAggregatesFilter<$PrismaModel> | $Enums.LocationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLocationTypeFilter<$PrismaModel>
    _max?: NestedEnumLocationTypeFilter<$PrismaModel>
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

  export type NestedEnumMovementTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.MovementType | EnumMovementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMovementTypeFilter<$PrismaModel> | $Enums.MovementType
  }

  export type NestedEnumMovementTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MovementType | EnumMovementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMovementTypeWithAggregatesFilter<$PrismaModel> | $Enums.MovementType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMovementTypeFilter<$PrismaModel>
    _max?: NestedEnumMovementTypeFilter<$PrismaModel>
  }

  export type NestedEnumPurchaseOrderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PurchaseOrderStatus | EnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PurchaseOrderStatus[] | ListEnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PurchaseOrderStatus[] | ListEnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPurchaseOrderStatusFilter<$PrismaModel> | $Enums.PurchaseOrderStatus
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

  export type NestedEnumPurchaseOrderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PurchaseOrderStatus | EnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PurchaseOrderStatus[] | ListEnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PurchaseOrderStatus[] | ListEnumPurchaseOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPurchaseOrderStatusWithAggregatesFilter<$PrismaModel> | $Enums.PurchaseOrderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPurchaseOrderStatusFilter<$PrismaModel>
    _max?: NestedEnumPurchaseOrderStatusFilter<$PrismaModel>
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

  export type StockLevelCreateWithoutInventoryItemInput = {
    id?: string
    quantity?: Decimal | DecimalJsLike | number | string
    reservedQty?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
    location: StockLocationCreateNestedOneWithoutStockLevelsInput
  }

  export type StockLevelUncheckedCreateWithoutInventoryItemInput = {
    id?: string
    locationId: string
    quantity?: Decimal | DecimalJsLike | number | string
    reservedQty?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type StockLevelCreateOrConnectWithoutInventoryItemInput = {
    where: StockLevelWhereUniqueInput
    create: XOR<StockLevelCreateWithoutInventoryItemInput, StockLevelUncheckedCreateWithoutInventoryItemInput>
  }

  export type StockLevelCreateManyInventoryItemInputEnvelope = {
    data: StockLevelCreateManyInventoryItemInput | StockLevelCreateManyInventoryItemInput[]
    skipDuplicates?: boolean
  }

  export type StockMovementCreateWithoutInventoryItemInput = {
    id?: string
    companyId: string
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
    fromLocation?: StockLocationCreateNestedOneWithoutMovementsFromInput
    toLocation?: StockLocationCreateNestedOneWithoutMovementsToInput
  }

  export type StockMovementUncheckedCreateWithoutInventoryItemInput = {
    id?: string
    companyId: string
    fromLocationId?: string | null
    toLocationId?: string | null
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
  }

  export type StockMovementCreateOrConnectWithoutInventoryItemInput = {
    where: StockMovementWhereUniqueInput
    create: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput>
  }

  export type StockMovementCreateManyInventoryItemInputEnvelope = {
    data: StockMovementCreateManyInventoryItemInput | StockMovementCreateManyInventoryItemInput[]
    skipDuplicates?: boolean
  }

  export type StockLevelUpsertWithWhereUniqueWithoutInventoryItemInput = {
    where: StockLevelWhereUniqueInput
    update: XOR<StockLevelUpdateWithoutInventoryItemInput, StockLevelUncheckedUpdateWithoutInventoryItemInput>
    create: XOR<StockLevelCreateWithoutInventoryItemInput, StockLevelUncheckedCreateWithoutInventoryItemInput>
  }

  export type StockLevelUpdateWithWhereUniqueWithoutInventoryItemInput = {
    where: StockLevelWhereUniqueInput
    data: XOR<StockLevelUpdateWithoutInventoryItemInput, StockLevelUncheckedUpdateWithoutInventoryItemInput>
  }

  export type StockLevelUpdateManyWithWhereWithoutInventoryItemInput = {
    where: StockLevelScalarWhereInput
    data: XOR<StockLevelUpdateManyMutationInput, StockLevelUncheckedUpdateManyWithoutInventoryItemInput>
  }

  export type StockLevelScalarWhereInput = {
    AND?: StockLevelScalarWhereInput | StockLevelScalarWhereInput[]
    OR?: StockLevelScalarWhereInput[]
    NOT?: StockLevelScalarWhereInput | StockLevelScalarWhereInput[]
    id?: StringFilter<"StockLevel"> | string
    inventoryItemId?: StringFilter<"StockLevel"> | string
    locationId?: StringFilter<"StockLevel"> | string
    quantity?: DecimalFilter<"StockLevel"> | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFilter<"StockLevel"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"StockLevel"> | Date | string
  }

  export type StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput = {
    where: StockMovementWhereUniqueInput
    update: XOR<StockMovementUpdateWithoutInventoryItemInput, StockMovementUncheckedUpdateWithoutInventoryItemInput>
    create: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput>
  }

  export type StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput = {
    where: StockMovementWhereUniqueInput
    data: XOR<StockMovementUpdateWithoutInventoryItemInput, StockMovementUncheckedUpdateWithoutInventoryItemInput>
  }

  export type StockMovementUpdateManyWithWhereWithoutInventoryItemInput = {
    where: StockMovementScalarWhereInput
    data: XOR<StockMovementUpdateManyMutationInput, StockMovementUncheckedUpdateManyWithoutInventoryItemInput>
  }

  export type StockMovementScalarWhereInput = {
    AND?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
    OR?: StockMovementScalarWhereInput[]
    NOT?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
    id?: StringFilter<"StockMovement"> | string
    companyId?: StringFilter<"StockMovement"> | string
    inventoryItemId?: StringFilter<"StockMovement"> | string
    fromLocationId?: StringNullableFilter<"StockMovement"> | string | null
    toLocationId?: StringNullableFilter<"StockMovement"> | string | null
    quantity?: DecimalFilter<"StockMovement"> | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFilter<"StockMovement"> | $Enums.MovementType
    referenceId?: StringNullableFilter<"StockMovement"> | string | null
    referenceType?: StringNullableFilter<"StockMovement"> | string | null
    notes?: StringNullableFilter<"StockMovement"> | string | null
    performedBy?: StringFilter<"StockMovement"> | string
    performedByName?: StringNullableFilter<"StockMovement"> | string | null
    createdAt?: DateTimeFilter<"StockMovement"> | Date | string
  }

  export type StockLevelCreateWithoutLocationInput = {
    id?: string
    quantity?: Decimal | DecimalJsLike | number | string
    reservedQty?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
    inventoryItem: InventoryItemCreateNestedOneWithoutStockLevelsInput
  }

  export type StockLevelUncheckedCreateWithoutLocationInput = {
    id?: string
    inventoryItemId: string
    quantity?: Decimal | DecimalJsLike | number | string
    reservedQty?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type StockLevelCreateOrConnectWithoutLocationInput = {
    where: StockLevelWhereUniqueInput
    create: XOR<StockLevelCreateWithoutLocationInput, StockLevelUncheckedCreateWithoutLocationInput>
  }

  export type StockLevelCreateManyLocationInputEnvelope = {
    data: StockLevelCreateManyLocationInput | StockLevelCreateManyLocationInput[]
    skipDuplicates?: boolean
  }

  export type StockMovementCreateWithoutFromLocationInput = {
    id?: string
    companyId: string
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
    inventoryItem: InventoryItemCreateNestedOneWithoutStockMovementsInput
    toLocation?: StockLocationCreateNestedOneWithoutMovementsToInput
  }

  export type StockMovementUncheckedCreateWithoutFromLocationInput = {
    id?: string
    companyId: string
    inventoryItemId: string
    toLocationId?: string | null
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
  }

  export type StockMovementCreateOrConnectWithoutFromLocationInput = {
    where: StockMovementWhereUniqueInput
    create: XOR<StockMovementCreateWithoutFromLocationInput, StockMovementUncheckedCreateWithoutFromLocationInput>
  }

  export type StockMovementCreateManyFromLocationInputEnvelope = {
    data: StockMovementCreateManyFromLocationInput | StockMovementCreateManyFromLocationInput[]
    skipDuplicates?: boolean
  }

  export type StockMovementCreateWithoutToLocationInput = {
    id?: string
    companyId: string
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
    inventoryItem: InventoryItemCreateNestedOneWithoutStockMovementsInput
    fromLocation?: StockLocationCreateNestedOneWithoutMovementsFromInput
  }

  export type StockMovementUncheckedCreateWithoutToLocationInput = {
    id?: string
    companyId: string
    inventoryItemId: string
    fromLocationId?: string | null
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
  }

  export type StockMovementCreateOrConnectWithoutToLocationInput = {
    where: StockMovementWhereUniqueInput
    create: XOR<StockMovementCreateWithoutToLocationInput, StockMovementUncheckedCreateWithoutToLocationInput>
  }

  export type StockMovementCreateManyToLocationInputEnvelope = {
    data: StockMovementCreateManyToLocationInput | StockMovementCreateManyToLocationInput[]
    skipDuplicates?: boolean
  }

  export type StockLevelUpsertWithWhereUniqueWithoutLocationInput = {
    where: StockLevelWhereUniqueInput
    update: XOR<StockLevelUpdateWithoutLocationInput, StockLevelUncheckedUpdateWithoutLocationInput>
    create: XOR<StockLevelCreateWithoutLocationInput, StockLevelUncheckedCreateWithoutLocationInput>
  }

  export type StockLevelUpdateWithWhereUniqueWithoutLocationInput = {
    where: StockLevelWhereUniqueInput
    data: XOR<StockLevelUpdateWithoutLocationInput, StockLevelUncheckedUpdateWithoutLocationInput>
  }

  export type StockLevelUpdateManyWithWhereWithoutLocationInput = {
    where: StockLevelScalarWhereInput
    data: XOR<StockLevelUpdateManyMutationInput, StockLevelUncheckedUpdateManyWithoutLocationInput>
  }

  export type StockMovementUpsertWithWhereUniqueWithoutFromLocationInput = {
    where: StockMovementWhereUniqueInput
    update: XOR<StockMovementUpdateWithoutFromLocationInput, StockMovementUncheckedUpdateWithoutFromLocationInput>
    create: XOR<StockMovementCreateWithoutFromLocationInput, StockMovementUncheckedCreateWithoutFromLocationInput>
  }

  export type StockMovementUpdateWithWhereUniqueWithoutFromLocationInput = {
    where: StockMovementWhereUniqueInput
    data: XOR<StockMovementUpdateWithoutFromLocationInput, StockMovementUncheckedUpdateWithoutFromLocationInput>
  }

  export type StockMovementUpdateManyWithWhereWithoutFromLocationInput = {
    where: StockMovementScalarWhereInput
    data: XOR<StockMovementUpdateManyMutationInput, StockMovementUncheckedUpdateManyWithoutFromLocationInput>
  }

  export type StockMovementUpsertWithWhereUniqueWithoutToLocationInput = {
    where: StockMovementWhereUniqueInput
    update: XOR<StockMovementUpdateWithoutToLocationInput, StockMovementUncheckedUpdateWithoutToLocationInput>
    create: XOR<StockMovementCreateWithoutToLocationInput, StockMovementUncheckedCreateWithoutToLocationInput>
  }

  export type StockMovementUpdateWithWhereUniqueWithoutToLocationInput = {
    where: StockMovementWhereUniqueInput
    data: XOR<StockMovementUpdateWithoutToLocationInput, StockMovementUncheckedUpdateWithoutToLocationInput>
  }

  export type StockMovementUpdateManyWithWhereWithoutToLocationInput = {
    where: StockMovementScalarWhereInput
    data: XOR<StockMovementUpdateManyMutationInput, StockMovementUncheckedUpdateManyWithoutToLocationInput>
  }

  export type InventoryItemCreateWithoutStockLevelsInput = {
    id?: string
    companyId: string
    priceBookItemId?: string | null
    sku: string
    name: string
    description?: string | null
    category: $Enums.ItemCategory
    unit?: string
    reorderPoint?: number
    reorderQty?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockMovements?: StockMovementCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemUncheckedCreateWithoutStockLevelsInput = {
    id?: string
    companyId: string
    priceBookItemId?: string | null
    sku: string
    name: string
    description?: string | null
    category: $Enums.ItemCategory
    unit?: string
    reorderPoint?: number
    reorderQty?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockMovements?: StockMovementUncheckedCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemCreateOrConnectWithoutStockLevelsInput = {
    where: InventoryItemWhereUniqueInput
    create: XOR<InventoryItemCreateWithoutStockLevelsInput, InventoryItemUncheckedCreateWithoutStockLevelsInput>
  }

  export type StockLocationCreateWithoutStockLevelsInput = {
    id?: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    movementsFrom?: StockMovementCreateNestedManyWithoutFromLocationInput
    movementsTo?: StockMovementCreateNestedManyWithoutToLocationInput
  }

  export type StockLocationUncheckedCreateWithoutStockLevelsInput = {
    id?: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    movementsFrom?: StockMovementUncheckedCreateNestedManyWithoutFromLocationInput
    movementsTo?: StockMovementUncheckedCreateNestedManyWithoutToLocationInput
  }

  export type StockLocationCreateOrConnectWithoutStockLevelsInput = {
    where: StockLocationWhereUniqueInput
    create: XOR<StockLocationCreateWithoutStockLevelsInput, StockLocationUncheckedCreateWithoutStockLevelsInput>
  }

  export type InventoryItemUpsertWithoutStockLevelsInput = {
    update: XOR<InventoryItemUpdateWithoutStockLevelsInput, InventoryItemUncheckedUpdateWithoutStockLevelsInput>
    create: XOR<InventoryItemCreateWithoutStockLevelsInput, InventoryItemUncheckedCreateWithoutStockLevelsInput>
    where?: InventoryItemWhereInput
  }

  export type InventoryItemUpdateToOneWithWhereWithoutStockLevelsInput = {
    where?: InventoryItemWhereInput
    data: XOR<InventoryItemUpdateWithoutStockLevelsInput, InventoryItemUncheckedUpdateWithoutStockLevelsInput>
  }

  export type InventoryItemUpdateWithoutStockLevelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    sku?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumItemCategoryFieldUpdateOperationsInput | $Enums.ItemCategory
    unit?: StringFieldUpdateOperationsInput | string
    reorderPoint?: IntFieldUpdateOperationsInput | number
    reorderQty?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockMovements?: StockMovementUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemUncheckedUpdateWithoutStockLevelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    sku?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumItemCategoryFieldUpdateOperationsInput | $Enums.ItemCategory
    unit?: StringFieldUpdateOperationsInput | string
    reorderPoint?: IntFieldUpdateOperationsInput | number
    reorderQty?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockMovements?: StockMovementUncheckedUpdateManyWithoutInventoryItemNestedInput
  }

  export type StockLocationUpsertWithoutStockLevelsInput = {
    update: XOR<StockLocationUpdateWithoutStockLevelsInput, StockLocationUncheckedUpdateWithoutStockLevelsInput>
    create: XOR<StockLocationCreateWithoutStockLevelsInput, StockLocationUncheckedCreateWithoutStockLevelsInput>
    where?: StockLocationWhereInput
  }

  export type StockLocationUpdateToOneWithWhereWithoutStockLevelsInput = {
    where?: StockLocationWhereInput
    data: XOR<StockLocationUpdateWithoutStockLevelsInput, StockLocationUncheckedUpdateWithoutStockLevelsInput>
  }

  export type StockLocationUpdateWithoutStockLevelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    movementsFrom?: StockMovementUpdateManyWithoutFromLocationNestedInput
    movementsTo?: StockMovementUpdateManyWithoutToLocationNestedInput
  }

  export type StockLocationUncheckedUpdateWithoutStockLevelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    movementsFrom?: StockMovementUncheckedUpdateManyWithoutFromLocationNestedInput
    movementsTo?: StockMovementUncheckedUpdateManyWithoutToLocationNestedInput
  }

  export type InventoryItemCreateWithoutStockMovementsInput = {
    id?: string
    companyId: string
    priceBookItemId?: string | null
    sku: string
    name: string
    description?: string | null
    category: $Enums.ItemCategory
    unit?: string
    reorderPoint?: number
    reorderQty?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemUncheckedCreateWithoutStockMovementsInput = {
    id?: string
    companyId: string
    priceBookItemId?: string | null
    sku: string
    name: string
    description?: string | null
    category: $Enums.ItemCategory
    unit?: string
    reorderPoint?: number
    reorderQty?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelUncheckedCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemCreateOrConnectWithoutStockMovementsInput = {
    where: InventoryItemWhereUniqueInput
    create: XOR<InventoryItemCreateWithoutStockMovementsInput, InventoryItemUncheckedCreateWithoutStockMovementsInput>
  }

  export type StockLocationCreateWithoutMovementsFromInput = {
    id?: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelCreateNestedManyWithoutLocationInput
    movementsTo?: StockMovementCreateNestedManyWithoutToLocationInput
  }

  export type StockLocationUncheckedCreateWithoutMovementsFromInput = {
    id?: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelUncheckedCreateNestedManyWithoutLocationInput
    movementsTo?: StockMovementUncheckedCreateNestedManyWithoutToLocationInput
  }

  export type StockLocationCreateOrConnectWithoutMovementsFromInput = {
    where: StockLocationWhereUniqueInput
    create: XOR<StockLocationCreateWithoutMovementsFromInput, StockLocationUncheckedCreateWithoutMovementsFromInput>
  }

  export type StockLocationCreateWithoutMovementsToInput = {
    id?: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelCreateNestedManyWithoutLocationInput
    movementsFrom?: StockMovementCreateNestedManyWithoutFromLocationInput
  }

  export type StockLocationUncheckedCreateWithoutMovementsToInput = {
    id?: string
    companyId: string
    type: $Enums.LocationType
    name: string
    technicianId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    stockLevels?: StockLevelUncheckedCreateNestedManyWithoutLocationInput
    movementsFrom?: StockMovementUncheckedCreateNestedManyWithoutFromLocationInput
  }

  export type StockLocationCreateOrConnectWithoutMovementsToInput = {
    where: StockLocationWhereUniqueInput
    create: XOR<StockLocationCreateWithoutMovementsToInput, StockLocationUncheckedCreateWithoutMovementsToInput>
  }

  export type InventoryItemUpsertWithoutStockMovementsInput = {
    update: XOR<InventoryItemUpdateWithoutStockMovementsInput, InventoryItemUncheckedUpdateWithoutStockMovementsInput>
    create: XOR<InventoryItemCreateWithoutStockMovementsInput, InventoryItemUncheckedCreateWithoutStockMovementsInput>
    where?: InventoryItemWhereInput
  }

  export type InventoryItemUpdateToOneWithWhereWithoutStockMovementsInput = {
    where?: InventoryItemWhereInput
    data: XOR<InventoryItemUpdateWithoutStockMovementsInput, InventoryItemUncheckedUpdateWithoutStockMovementsInput>
  }

  export type InventoryItemUpdateWithoutStockMovementsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    sku?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumItemCategoryFieldUpdateOperationsInput | $Enums.ItemCategory
    unit?: StringFieldUpdateOperationsInput | string
    reorderPoint?: IntFieldUpdateOperationsInput | number
    reorderQty?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemUncheckedUpdateWithoutStockMovementsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    priceBookItemId?: NullableStringFieldUpdateOperationsInput | string | null
    sku?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumItemCategoryFieldUpdateOperationsInput | $Enums.ItemCategory
    unit?: StringFieldUpdateOperationsInput | string
    reorderPoint?: IntFieldUpdateOperationsInput | number
    reorderQty?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUncheckedUpdateManyWithoutInventoryItemNestedInput
  }

  export type StockLocationUpsertWithoutMovementsFromInput = {
    update: XOR<StockLocationUpdateWithoutMovementsFromInput, StockLocationUncheckedUpdateWithoutMovementsFromInput>
    create: XOR<StockLocationCreateWithoutMovementsFromInput, StockLocationUncheckedCreateWithoutMovementsFromInput>
    where?: StockLocationWhereInput
  }

  export type StockLocationUpdateToOneWithWhereWithoutMovementsFromInput = {
    where?: StockLocationWhereInput
    data: XOR<StockLocationUpdateWithoutMovementsFromInput, StockLocationUncheckedUpdateWithoutMovementsFromInput>
  }

  export type StockLocationUpdateWithoutMovementsFromInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUpdateManyWithoutLocationNestedInput
    movementsTo?: StockMovementUpdateManyWithoutToLocationNestedInput
  }

  export type StockLocationUncheckedUpdateWithoutMovementsFromInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUncheckedUpdateManyWithoutLocationNestedInput
    movementsTo?: StockMovementUncheckedUpdateManyWithoutToLocationNestedInput
  }

  export type StockLocationUpsertWithoutMovementsToInput = {
    update: XOR<StockLocationUpdateWithoutMovementsToInput, StockLocationUncheckedUpdateWithoutMovementsToInput>
    create: XOR<StockLocationCreateWithoutMovementsToInput, StockLocationUncheckedCreateWithoutMovementsToInput>
    where?: StockLocationWhereInput
  }

  export type StockLocationUpdateToOneWithWhereWithoutMovementsToInput = {
    where?: StockLocationWhereInput
    data: XOR<StockLocationUpdateWithoutMovementsToInput, StockLocationUncheckedUpdateWithoutMovementsToInput>
  }

  export type StockLocationUpdateWithoutMovementsToInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUpdateManyWithoutLocationNestedInput
    movementsFrom?: StockMovementUpdateManyWithoutFromLocationNestedInput
  }

  export type StockLocationUncheckedUpdateWithoutMovementsToInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    type?: EnumLocationTypeFieldUpdateOperationsInput | $Enums.LocationType
    name?: StringFieldUpdateOperationsInput | string
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockLevels?: StockLevelUncheckedUpdateManyWithoutLocationNestedInput
    movementsFrom?: StockMovementUncheckedUpdateManyWithoutFromLocationNestedInput
  }

  export type StockLevelCreateManyInventoryItemInput = {
    id?: string
    locationId: string
    quantity?: Decimal | DecimalJsLike | number | string
    reservedQty?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type StockMovementCreateManyInventoryItemInput = {
    id?: string
    companyId: string
    fromLocationId?: string | null
    toLocationId?: string | null
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
  }

  export type StockLevelUpdateWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: StockLocationUpdateOneRequiredWithoutStockLevelsNestedInput
  }

  export type StockLevelUncheckedUpdateWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLevelUncheckedUpdateManyWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementUpdateWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fromLocation?: StockLocationUpdateOneWithoutMovementsFromNestedInput
    toLocation?: StockLocationUpdateOneWithoutMovementsToNestedInput
  }

  export type StockMovementUncheckedUpdateWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    fromLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    toLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementUncheckedUpdateManyWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    fromLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    toLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLevelCreateManyLocationInput = {
    id?: string
    inventoryItemId: string
    quantity?: Decimal | DecimalJsLike | number | string
    reservedQty?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type StockMovementCreateManyFromLocationInput = {
    id?: string
    companyId: string
    inventoryItemId: string
    toLocationId?: string | null
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
  }

  export type StockMovementCreateManyToLocationInput = {
    id?: string
    companyId: string
    inventoryItemId: string
    fromLocationId?: string | null
    quantity: Decimal | DecimalJsLike | number | string
    movementType: $Enums.MovementType
    referenceId?: string | null
    referenceType?: string | null
    notes?: string | null
    performedBy: string
    performedByName?: string | null
    createdAt?: Date | string
  }

  export type StockLevelUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItem?: InventoryItemUpdateOneRequiredWithoutStockLevelsNestedInput
  }

  export type StockLevelUncheckedUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLevelUncheckedUpdateManyWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    reservedQty?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementUpdateWithoutFromLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItem?: InventoryItemUpdateOneRequiredWithoutStockMovementsNestedInput
    toLocation?: StockLocationUpdateOneWithoutMovementsToNestedInput
  }

  export type StockMovementUncheckedUpdateWithoutFromLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    toLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementUncheckedUpdateManyWithoutFromLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    toLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementUpdateWithoutToLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItem?: InventoryItemUpdateOneRequiredWithoutStockMovementsNestedInput
    fromLocation?: StockLocationUpdateOneWithoutMovementsFromNestedInput
  }

  export type StockMovementUncheckedUpdateWithoutToLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    fromLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementUncheckedUpdateManyWithoutToLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    fromLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    movementType?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceType?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    performedBy?: StringFieldUpdateOperationsInput | string
    performedByName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use InventoryItemCountOutputTypeDefaultArgs instead
     */
    export type InventoryItemCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = InventoryItemCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StockLocationCountOutputTypeDefaultArgs instead
     */
    export type StockLocationCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StockLocationCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use InventoryItemDefaultArgs instead
     */
    export type InventoryItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = InventoryItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StockLocationDefaultArgs instead
     */
    export type StockLocationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StockLocationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StockLevelDefaultArgs instead
     */
    export type StockLevelArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StockLevelDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StockMovementDefaultArgs instead
     */
    export type StockMovementArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StockMovementDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PurchaseOrderDefaultArgs instead
     */
    export type PurchaseOrderArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PurchaseOrderDefaultArgs<ExtArgs>

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