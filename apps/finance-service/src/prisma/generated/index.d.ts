
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
 * Model Quote
 * 
 */
export type Quote = $Result.DefaultSelection<Prisma.$QuotePayload>
/**
 * Model QuoteLineItem
 * 
 */
export type QuoteLineItem = $Result.DefaultSelection<Prisma.$QuoteLineItemPayload>
/**
 * Model Invoice
 * 
 */
export type Invoice = $Result.DefaultSelection<Prisma.$InvoicePayload>
/**
 * Model InvoiceLineItem
 * 
 */
export type InvoiceLineItem = $Result.DefaultSelection<Prisma.$InvoiceLineItemPayload>
/**
 * Model Payment
 * 
 */
export type Payment = $Result.DefaultSelection<Prisma.$PaymentPayload>
/**
 * Model RecurringSchedule
 * 
 */
export type RecurringSchedule = $Result.DefaultSelection<Prisma.$RecurringSchedulePayload>
/**
 * Model Expense
 * 
 */
export type Expense = $Result.DefaultSelection<Prisma.$ExpensePayload>
/**
 * Model QuickBooksConnection
 * 
 */
export type QuickBooksConnection = $Result.DefaultSelection<Prisma.$QuickBooksConnectionPayload>
/**
 * Model QuickBooksCustomerMap
 * 
 */
export type QuickBooksCustomerMap = $Result.DefaultSelection<Prisma.$QuickBooksCustomerMapPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const QuoteStatus: {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  CONVERTED: 'CONVERTED'
};

export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus]


export const DiscountType: {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED'
};

export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType]


export const LineItemCategory: {
  LABOUR: 'LABOUR',
  PARTS: 'PARTS',
  MATERIALS: 'MATERIALS',
  EQUIPMENT_RENTAL: 'EQUIPMENT_RENTAL',
  TRAVEL: 'TRAVEL',
  OTHER: 'OTHER'
};

export type LineItemCategory = (typeof LineItemCategory)[keyof typeof LineItemCategory]


export const InvoiceStatus: {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  VOID: 'VOID'
};

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus]


export const PaymentMethod: {
  CARD: 'CARD',
  ACH: 'ACH',
  CASH: 'CASH',
  CHECK: 'CHECK',
  OTHER: 'OTHER'
};

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]


export const PaymentStatus: {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]


export const RecurringFrequency: {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUALLY: 'ANNUALLY'
};

export type RecurringFrequency = (typeof RecurringFrequency)[keyof typeof RecurringFrequency]


export const ExpenseCategory: {
  PARTS: 'PARTS',
  FUEL: 'FUEL',
  TOOLS: 'TOOLS',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  OTHER: 'OTHER'
};

export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory]

}

export type QuoteStatus = $Enums.QuoteStatus

export const QuoteStatus: typeof $Enums.QuoteStatus

export type DiscountType = $Enums.DiscountType

export const DiscountType: typeof $Enums.DiscountType

export type LineItemCategory = $Enums.LineItemCategory

export const LineItemCategory: typeof $Enums.LineItemCategory

export type InvoiceStatus = $Enums.InvoiceStatus

export const InvoiceStatus: typeof $Enums.InvoiceStatus

export type PaymentMethod = $Enums.PaymentMethod

export const PaymentMethod: typeof $Enums.PaymentMethod

export type PaymentStatus = $Enums.PaymentStatus

export const PaymentStatus: typeof $Enums.PaymentStatus

export type RecurringFrequency = $Enums.RecurringFrequency

export const RecurringFrequency: typeof $Enums.RecurringFrequency

export type ExpenseCategory = $Enums.ExpenseCategory

export const ExpenseCategory: typeof $Enums.ExpenseCategory

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Quotes
 * const quotes = await prisma.quote.findMany()
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
   * // Fetch zero or more Quotes
   * const quotes = await prisma.quote.findMany()
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
   * `prisma.quote`: Exposes CRUD operations for the **Quote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Quotes
    * const quotes = await prisma.quote.findMany()
    * ```
    */
  get quote(): Prisma.QuoteDelegate<ExtArgs>;

  /**
   * `prisma.quoteLineItem`: Exposes CRUD operations for the **QuoteLineItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuoteLineItems
    * const quoteLineItems = await prisma.quoteLineItem.findMany()
    * ```
    */
  get quoteLineItem(): Prisma.QuoteLineItemDelegate<ExtArgs>;

  /**
   * `prisma.invoice`: Exposes CRUD operations for the **Invoice** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Invoices
    * const invoices = await prisma.invoice.findMany()
    * ```
    */
  get invoice(): Prisma.InvoiceDelegate<ExtArgs>;

  /**
   * `prisma.invoiceLineItem`: Exposes CRUD operations for the **InvoiceLineItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more InvoiceLineItems
    * const invoiceLineItems = await prisma.invoiceLineItem.findMany()
    * ```
    */
  get invoiceLineItem(): Prisma.InvoiceLineItemDelegate<ExtArgs>;

  /**
   * `prisma.payment`: Exposes CRUD operations for the **Payment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Payments
    * const payments = await prisma.payment.findMany()
    * ```
    */
  get payment(): Prisma.PaymentDelegate<ExtArgs>;

  /**
   * `prisma.recurringSchedule`: Exposes CRUD operations for the **RecurringSchedule** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RecurringSchedules
    * const recurringSchedules = await prisma.recurringSchedule.findMany()
    * ```
    */
  get recurringSchedule(): Prisma.RecurringScheduleDelegate<ExtArgs>;

  /**
   * `prisma.expense`: Exposes CRUD operations for the **Expense** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Expenses
    * const expenses = await prisma.expense.findMany()
    * ```
    */
  get expense(): Prisma.ExpenseDelegate<ExtArgs>;

  /**
   * `prisma.quickBooksConnection`: Exposes CRUD operations for the **QuickBooksConnection** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuickBooksConnections
    * const quickBooksConnections = await prisma.quickBooksConnection.findMany()
    * ```
    */
  get quickBooksConnection(): Prisma.QuickBooksConnectionDelegate<ExtArgs>;

  /**
   * `prisma.quickBooksCustomerMap`: Exposes CRUD operations for the **QuickBooksCustomerMap** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuickBooksCustomerMaps
    * const quickBooksCustomerMaps = await prisma.quickBooksCustomerMap.findMany()
    * ```
    */
  get quickBooksCustomerMap(): Prisma.QuickBooksCustomerMapDelegate<ExtArgs>;
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
    Quote: 'Quote',
    QuoteLineItem: 'QuoteLineItem',
    Invoice: 'Invoice',
    InvoiceLineItem: 'InvoiceLineItem',
    Payment: 'Payment',
    RecurringSchedule: 'RecurringSchedule',
    Expense: 'Expense',
    QuickBooksConnection: 'QuickBooksConnection',
    QuickBooksCustomerMap: 'QuickBooksCustomerMap'
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
      modelProps: "quote" | "quoteLineItem" | "invoice" | "invoiceLineItem" | "payment" | "recurringSchedule" | "expense" | "quickBooksConnection" | "quickBooksCustomerMap"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Quote: {
        payload: Prisma.$QuotePayload<ExtArgs>
        fields: Prisma.QuoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          findFirst: {
            args: Prisma.QuoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          findMany: {
            args: Prisma.QuoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>[]
          }
          create: {
            args: Prisma.QuoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          createMany: {
            args: Prisma.QuoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>[]
          }
          delete: {
            args: Prisma.QuoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          update: {
            args: Prisma.QuoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          deleteMany: {
            args: Prisma.QuoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          aggregate: {
            args: Prisma.QuoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuote>
          }
          groupBy: {
            args: Prisma.QuoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuoteCountArgs<ExtArgs>
            result: $Utils.Optional<QuoteCountAggregateOutputType> | number
          }
        }
      }
      QuoteLineItem: {
        payload: Prisma.$QuoteLineItemPayload<ExtArgs>
        fields: Prisma.QuoteLineItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuoteLineItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuoteLineItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          findFirst: {
            args: Prisma.QuoteLineItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuoteLineItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          findMany: {
            args: Prisma.QuoteLineItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>[]
          }
          create: {
            args: Prisma.QuoteLineItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          createMany: {
            args: Prisma.QuoteLineItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuoteLineItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>[]
          }
          delete: {
            args: Prisma.QuoteLineItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          update: {
            args: Prisma.QuoteLineItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          deleteMany: {
            args: Prisma.QuoteLineItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuoteLineItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuoteLineItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          aggregate: {
            args: Prisma.QuoteLineItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuoteLineItem>
          }
          groupBy: {
            args: Prisma.QuoteLineItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuoteLineItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuoteLineItemCountArgs<ExtArgs>
            result: $Utils.Optional<QuoteLineItemCountAggregateOutputType> | number
          }
        }
      }
      Invoice: {
        payload: Prisma.$InvoicePayload<ExtArgs>
        fields: Prisma.InvoiceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InvoiceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InvoiceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          findFirst: {
            args: Prisma.InvoiceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InvoiceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          findMany: {
            args: Prisma.InvoiceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          create: {
            args: Prisma.InvoiceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          createMany: {
            args: Prisma.InvoiceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InvoiceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          delete: {
            args: Prisma.InvoiceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          update: {
            args: Prisma.InvoiceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          deleteMany: {
            args: Prisma.InvoiceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InvoiceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.InvoiceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          aggregate: {
            args: Prisma.InvoiceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInvoice>
          }
          groupBy: {
            args: Prisma.InvoiceGroupByArgs<ExtArgs>
            result: $Utils.Optional<InvoiceGroupByOutputType>[]
          }
          count: {
            args: Prisma.InvoiceCountArgs<ExtArgs>
            result: $Utils.Optional<InvoiceCountAggregateOutputType> | number
          }
        }
      }
      InvoiceLineItem: {
        payload: Prisma.$InvoiceLineItemPayload<ExtArgs>
        fields: Prisma.InvoiceLineItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InvoiceLineItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InvoiceLineItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload>
          }
          findFirst: {
            args: Prisma.InvoiceLineItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InvoiceLineItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload>
          }
          findMany: {
            args: Prisma.InvoiceLineItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload>[]
          }
          create: {
            args: Prisma.InvoiceLineItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload>
          }
          createMany: {
            args: Prisma.InvoiceLineItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InvoiceLineItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload>[]
          }
          delete: {
            args: Prisma.InvoiceLineItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload>
          }
          update: {
            args: Prisma.InvoiceLineItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload>
          }
          deleteMany: {
            args: Prisma.InvoiceLineItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InvoiceLineItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.InvoiceLineItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceLineItemPayload>
          }
          aggregate: {
            args: Prisma.InvoiceLineItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInvoiceLineItem>
          }
          groupBy: {
            args: Prisma.InvoiceLineItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<InvoiceLineItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.InvoiceLineItemCountArgs<ExtArgs>
            result: $Utils.Optional<InvoiceLineItemCountAggregateOutputType> | number
          }
        }
      }
      Payment: {
        payload: Prisma.$PaymentPayload<ExtArgs>
        fields: Prisma.PaymentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PaymentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PaymentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findFirst: {
            args: Prisma.PaymentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PaymentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findMany: {
            args: Prisma.PaymentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          create: {
            args: Prisma.PaymentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          createMany: {
            args: Prisma.PaymentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PaymentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          delete: {
            args: Prisma.PaymentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          update: {
            args: Prisma.PaymentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          deleteMany: {
            args: Prisma.PaymentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PaymentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PaymentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          aggregate: {
            args: Prisma.PaymentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayment>
          }
          groupBy: {
            args: Prisma.PaymentGroupByArgs<ExtArgs>
            result: $Utils.Optional<PaymentGroupByOutputType>[]
          }
          count: {
            args: Prisma.PaymentCountArgs<ExtArgs>
            result: $Utils.Optional<PaymentCountAggregateOutputType> | number
          }
        }
      }
      RecurringSchedule: {
        payload: Prisma.$RecurringSchedulePayload<ExtArgs>
        fields: Prisma.RecurringScheduleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RecurringScheduleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RecurringScheduleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload>
          }
          findFirst: {
            args: Prisma.RecurringScheduleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RecurringScheduleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload>
          }
          findMany: {
            args: Prisma.RecurringScheduleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload>[]
          }
          create: {
            args: Prisma.RecurringScheduleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload>
          }
          createMany: {
            args: Prisma.RecurringScheduleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RecurringScheduleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload>[]
          }
          delete: {
            args: Prisma.RecurringScheduleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload>
          }
          update: {
            args: Prisma.RecurringScheduleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload>
          }
          deleteMany: {
            args: Prisma.RecurringScheduleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RecurringScheduleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RecurringScheduleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecurringSchedulePayload>
          }
          aggregate: {
            args: Prisma.RecurringScheduleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRecurringSchedule>
          }
          groupBy: {
            args: Prisma.RecurringScheduleGroupByArgs<ExtArgs>
            result: $Utils.Optional<RecurringScheduleGroupByOutputType>[]
          }
          count: {
            args: Prisma.RecurringScheduleCountArgs<ExtArgs>
            result: $Utils.Optional<RecurringScheduleCountAggregateOutputType> | number
          }
        }
      }
      Expense: {
        payload: Prisma.$ExpensePayload<ExtArgs>
        fields: Prisma.ExpenseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ExpenseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ExpenseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          findFirst: {
            args: Prisma.ExpenseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ExpenseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          findMany: {
            args: Prisma.ExpenseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>[]
          }
          create: {
            args: Prisma.ExpenseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          createMany: {
            args: Prisma.ExpenseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ExpenseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>[]
          }
          delete: {
            args: Prisma.ExpenseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          update: {
            args: Prisma.ExpenseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          deleteMany: {
            args: Prisma.ExpenseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ExpenseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ExpenseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          aggregate: {
            args: Prisma.ExpenseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateExpense>
          }
          groupBy: {
            args: Prisma.ExpenseGroupByArgs<ExtArgs>
            result: $Utils.Optional<ExpenseGroupByOutputType>[]
          }
          count: {
            args: Prisma.ExpenseCountArgs<ExtArgs>
            result: $Utils.Optional<ExpenseCountAggregateOutputType> | number
          }
        }
      }
      QuickBooksConnection: {
        payload: Prisma.$QuickBooksConnectionPayload<ExtArgs>
        fields: Prisma.QuickBooksConnectionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuickBooksConnectionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuickBooksConnectionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload>
          }
          findFirst: {
            args: Prisma.QuickBooksConnectionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuickBooksConnectionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload>
          }
          findMany: {
            args: Prisma.QuickBooksConnectionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload>[]
          }
          create: {
            args: Prisma.QuickBooksConnectionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload>
          }
          createMany: {
            args: Prisma.QuickBooksConnectionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuickBooksConnectionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload>[]
          }
          delete: {
            args: Prisma.QuickBooksConnectionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload>
          }
          update: {
            args: Prisma.QuickBooksConnectionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload>
          }
          deleteMany: {
            args: Prisma.QuickBooksConnectionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuickBooksConnectionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuickBooksConnectionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksConnectionPayload>
          }
          aggregate: {
            args: Prisma.QuickBooksConnectionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuickBooksConnection>
          }
          groupBy: {
            args: Prisma.QuickBooksConnectionGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuickBooksConnectionGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuickBooksConnectionCountArgs<ExtArgs>
            result: $Utils.Optional<QuickBooksConnectionCountAggregateOutputType> | number
          }
        }
      }
      QuickBooksCustomerMap: {
        payload: Prisma.$QuickBooksCustomerMapPayload<ExtArgs>
        fields: Prisma.QuickBooksCustomerMapFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuickBooksCustomerMapFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuickBooksCustomerMapFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload>
          }
          findFirst: {
            args: Prisma.QuickBooksCustomerMapFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuickBooksCustomerMapFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload>
          }
          findMany: {
            args: Prisma.QuickBooksCustomerMapFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload>[]
          }
          create: {
            args: Prisma.QuickBooksCustomerMapCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload>
          }
          createMany: {
            args: Prisma.QuickBooksCustomerMapCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuickBooksCustomerMapCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload>[]
          }
          delete: {
            args: Prisma.QuickBooksCustomerMapDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload>
          }
          update: {
            args: Prisma.QuickBooksCustomerMapUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload>
          }
          deleteMany: {
            args: Prisma.QuickBooksCustomerMapDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuickBooksCustomerMapUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuickBooksCustomerMapUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuickBooksCustomerMapPayload>
          }
          aggregate: {
            args: Prisma.QuickBooksCustomerMapAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuickBooksCustomerMap>
          }
          groupBy: {
            args: Prisma.QuickBooksCustomerMapGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuickBooksCustomerMapGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuickBooksCustomerMapCountArgs<ExtArgs>
            result: $Utils.Optional<QuickBooksCustomerMapCountAggregateOutputType> | number
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
   * Count Type QuoteCountOutputType
   */

  export type QuoteCountOutputType = {
    lineItems: number
    invoices: number
  }

  export type QuoteCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lineItems?: boolean | QuoteCountOutputTypeCountLineItemsArgs
    invoices?: boolean | QuoteCountOutputTypeCountInvoicesArgs
  }

  // Custom InputTypes
  /**
   * QuoteCountOutputType without action
   */
  export type QuoteCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteCountOutputType
     */
    select?: QuoteCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * QuoteCountOutputType without action
   */
  export type QuoteCountOutputTypeCountLineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteLineItemWhereInput
  }

  /**
   * QuoteCountOutputType without action
   */
  export type QuoteCountOutputTypeCountInvoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceWhereInput
  }


  /**
   * Count Type InvoiceCountOutputType
   */

  export type InvoiceCountOutputType = {
    lineItems: number
    payments: number
  }

  export type InvoiceCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lineItems?: boolean | InvoiceCountOutputTypeCountLineItemsArgs
    payments?: boolean | InvoiceCountOutputTypeCountPaymentsArgs
  }

  // Custom InputTypes
  /**
   * InvoiceCountOutputType without action
   */
  export type InvoiceCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceCountOutputType
     */
    select?: InvoiceCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * InvoiceCountOutputType without action
   */
  export type InvoiceCountOutputTypeCountLineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceLineItemWhereInput
  }

  /**
   * InvoiceCountOutputType without action
   */
  export type InvoiceCountOutputTypeCountPaymentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentWhereInput
  }


  /**
   * Count Type RecurringScheduleCountOutputType
   */

  export type RecurringScheduleCountOutputType = {
    invoices: number
  }

  export type RecurringScheduleCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoices?: boolean | RecurringScheduleCountOutputTypeCountInvoicesArgs
  }

  // Custom InputTypes
  /**
   * RecurringScheduleCountOutputType without action
   */
  export type RecurringScheduleCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringScheduleCountOutputType
     */
    select?: RecurringScheduleCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * RecurringScheduleCountOutputType without action
   */
  export type RecurringScheduleCountOutputTypeCountInvoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Quote
   */

  export type AggregateQuote = {
    _count: QuoteCountAggregateOutputType | null
    _avg: QuoteAvgAggregateOutputType | null
    _sum: QuoteSumAggregateOutputType | null
    _min: QuoteMinAggregateOutputType | null
    _max: QuoteMaxAggregateOutputType | null
  }

  export type QuoteAvgAggregateOutputType = {
    subtotal: Decimal | null
    discountValue: Decimal | null
    discountAmount: Decimal | null
    taxRate: Decimal | null
    taxAmount: Decimal | null
    total: Decimal | null
  }

  export type QuoteSumAggregateOutputType = {
    subtotal: Decimal | null
    discountValue: Decimal | null
    discountAmount: Decimal | null
    taxRate: Decimal | null
    taxAmount: Decimal | null
    total: Decimal | null
  }

  export type QuoteMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    quoteNumber: string | null
    jobId: string | null
    customerId: string | null
    customerName: string | null
    customerEmail: string | null
    title: string | null
    description: string | null
    status: $Enums.QuoteStatus | null
    validUntil: Date | null
    subtotal: Decimal | null
    discountType: $Enums.DiscountType | null
    discountValue: Decimal | null
    discountAmount: Decimal | null
    taxRate: Decimal | null
    taxAmount: Decimal | null
    total: Decimal | null
    notes: string | null
    terms: string | null
    pdfUrl: string | null
    approvalToken: string | null
    approvedAt: Date | null
    approvedByName: string | null
    approvedByEmail: string | null
    sentAt: Date | null
    viewedAt: Date | null
    createdByUserId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuoteMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    quoteNumber: string | null
    jobId: string | null
    customerId: string | null
    customerName: string | null
    customerEmail: string | null
    title: string | null
    description: string | null
    status: $Enums.QuoteStatus | null
    validUntil: Date | null
    subtotal: Decimal | null
    discountType: $Enums.DiscountType | null
    discountValue: Decimal | null
    discountAmount: Decimal | null
    taxRate: Decimal | null
    taxAmount: Decimal | null
    total: Decimal | null
    notes: string | null
    terms: string | null
    pdfUrl: string | null
    approvalToken: string | null
    approvedAt: Date | null
    approvedByName: string | null
    approvedByEmail: string | null
    sentAt: Date | null
    viewedAt: Date | null
    createdByUserId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuoteCountAggregateOutputType = {
    id: number
    companyId: number
    quoteNumber: number
    jobId: number
    customerId: number
    customerName: number
    customerEmail: number
    title: number
    description: number
    status: number
    validUntil: number
    subtotal: number
    discountType: number
    discountValue: number
    discountAmount: number
    taxRate: number
    taxAmount: number
    total: number
    notes: number
    terms: number
    pdfUrl: number
    approvalToken: number
    approvedAt: number
    approvedByName: number
    approvedByEmail: number
    sentAt: number
    viewedAt: number
    createdByUserId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QuoteAvgAggregateInputType = {
    subtotal?: true
    discountValue?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
  }

  export type QuoteSumAggregateInputType = {
    subtotal?: true
    discountValue?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
  }

  export type QuoteMinAggregateInputType = {
    id?: true
    companyId?: true
    quoteNumber?: true
    jobId?: true
    customerId?: true
    customerName?: true
    customerEmail?: true
    title?: true
    description?: true
    status?: true
    validUntil?: true
    subtotal?: true
    discountType?: true
    discountValue?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
    notes?: true
    terms?: true
    pdfUrl?: true
    approvalToken?: true
    approvedAt?: true
    approvedByName?: true
    approvedByEmail?: true
    sentAt?: true
    viewedAt?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuoteMaxAggregateInputType = {
    id?: true
    companyId?: true
    quoteNumber?: true
    jobId?: true
    customerId?: true
    customerName?: true
    customerEmail?: true
    title?: true
    description?: true
    status?: true
    validUntil?: true
    subtotal?: true
    discountType?: true
    discountValue?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
    notes?: true
    terms?: true
    pdfUrl?: true
    approvalToken?: true
    approvedAt?: true
    approvedByName?: true
    approvedByEmail?: true
    sentAt?: true
    viewedAt?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuoteCountAggregateInputType = {
    id?: true
    companyId?: true
    quoteNumber?: true
    jobId?: true
    customerId?: true
    customerName?: true
    customerEmail?: true
    title?: true
    description?: true
    status?: true
    validUntil?: true
    subtotal?: true
    discountType?: true
    discountValue?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
    notes?: true
    terms?: true
    pdfUrl?: true
    approvalToken?: true
    approvedAt?: true
    approvedByName?: true
    approvedByEmail?: true
    sentAt?: true
    viewedAt?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QuoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Quote to aggregate.
     */
    where?: QuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotes to fetch.
     */
    orderBy?: QuoteOrderByWithRelationInput | QuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Quotes
    **/
    _count?: true | QuoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuoteAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuoteSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuoteMaxAggregateInputType
  }

  export type GetQuoteAggregateType<T extends QuoteAggregateArgs> = {
        [P in keyof T & keyof AggregateQuote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuote[P]>
      : GetScalarType<T[P], AggregateQuote[P]>
  }




  export type QuoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteWhereInput
    orderBy?: QuoteOrderByWithAggregationInput | QuoteOrderByWithAggregationInput[]
    by: QuoteScalarFieldEnum[] | QuoteScalarFieldEnum
    having?: QuoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuoteCountAggregateInputType | true
    _avg?: QuoteAvgAggregateInputType
    _sum?: QuoteSumAggregateInputType
    _min?: QuoteMinAggregateInputType
    _max?: QuoteMaxAggregateInputType
  }

  export type QuoteGroupByOutputType = {
    id: string
    companyId: string
    quoteNumber: string
    jobId: string | null
    customerId: string
    customerName: string
    customerEmail: string
    title: string
    description: string | null
    status: $Enums.QuoteStatus
    validUntil: Date | null
    subtotal: Decimal
    discountType: $Enums.DiscountType | null
    discountValue: Decimal | null
    discountAmount: Decimal
    taxRate: Decimal
    taxAmount: Decimal
    total: Decimal
    notes: string | null
    terms: string | null
    pdfUrl: string | null
    approvalToken: string | null
    approvedAt: Date | null
    approvedByName: string | null
    approvedByEmail: string | null
    sentAt: Date | null
    viewedAt: Date | null
    createdByUserId: string
    createdAt: Date
    updatedAt: Date
    _count: QuoteCountAggregateOutputType | null
    _avg: QuoteAvgAggregateOutputType | null
    _sum: QuoteSumAggregateOutputType | null
    _min: QuoteMinAggregateOutputType | null
    _max: QuoteMaxAggregateOutputType | null
  }

  type GetQuoteGroupByPayload<T extends QuoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuoteGroupByOutputType[P]>
            : GetScalarType<T[P], QuoteGroupByOutputType[P]>
        }
      >
    >


  export type QuoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    quoteNumber?: boolean
    jobId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    validUntil?: boolean
    subtotal?: boolean
    discountType?: boolean
    discountValue?: boolean
    discountAmount?: boolean
    taxRate?: boolean
    taxAmount?: boolean
    total?: boolean
    notes?: boolean
    terms?: boolean
    pdfUrl?: boolean
    approvalToken?: boolean
    approvedAt?: boolean
    approvedByName?: boolean
    approvedByEmail?: boolean
    sentAt?: boolean
    viewedAt?: boolean
    createdByUserId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lineItems?: boolean | Quote$lineItemsArgs<ExtArgs>
    invoices?: boolean | Quote$invoicesArgs<ExtArgs>
    _count?: boolean | QuoteCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quote"]>

  export type QuoteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    quoteNumber?: boolean
    jobId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    validUntil?: boolean
    subtotal?: boolean
    discountType?: boolean
    discountValue?: boolean
    discountAmount?: boolean
    taxRate?: boolean
    taxAmount?: boolean
    total?: boolean
    notes?: boolean
    terms?: boolean
    pdfUrl?: boolean
    approvalToken?: boolean
    approvedAt?: boolean
    approvedByName?: boolean
    approvedByEmail?: boolean
    sentAt?: boolean
    viewedAt?: boolean
    createdByUserId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["quote"]>

  export type QuoteSelectScalar = {
    id?: boolean
    companyId?: boolean
    quoteNumber?: boolean
    jobId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    validUntil?: boolean
    subtotal?: boolean
    discountType?: boolean
    discountValue?: boolean
    discountAmount?: boolean
    taxRate?: boolean
    taxAmount?: boolean
    total?: boolean
    notes?: boolean
    terms?: boolean
    pdfUrl?: boolean
    approvalToken?: boolean
    approvedAt?: boolean
    approvedByName?: boolean
    approvedByEmail?: boolean
    sentAt?: boolean
    viewedAt?: boolean
    createdByUserId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type QuoteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lineItems?: boolean | Quote$lineItemsArgs<ExtArgs>
    invoices?: boolean | Quote$invoicesArgs<ExtArgs>
    _count?: boolean | QuoteCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type QuoteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $QuotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Quote"
    objects: {
      lineItems: Prisma.$QuoteLineItemPayload<ExtArgs>[]
      invoices: Prisma.$InvoicePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      quoteNumber: string
      jobId: string | null
      customerId: string
      customerName: string
      customerEmail: string
      title: string
      description: string | null
      status: $Enums.QuoteStatus
      validUntil: Date | null
      subtotal: Prisma.Decimal
      discountType: $Enums.DiscountType | null
      discountValue: Prisma.Decimal | null
      discountAmount: Prisma.Decimal
      taxRate: Prisma.Decimal
      taxAmount: Prisma.Decimal
      total: Prisma.Decimal
      notes: string | null
      terms: string | null
      pdfUrl: string | null
      approvalToken: string | null
      approvedAt: Date | null
      approvedByName: string | null
      approvedByEmail: string | null
      sentAt: Date | null
      viewedAt: Date | null
      createdByUserId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["quote"]>
    composites: {}
  }

  type QuoteGetPayload<S extends boolean | null | undefined | QuoteDefaultArgs> = $Result.GetResult<Prisma.$QuotePayload, S>

  type QuoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuoteFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuoteCountAggregateInputType | true
    }

  export interface QuoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Quote'], meta: { name: 'Quote' } }
    /**
     * Find zero or one Quote that matches the filter.
     * @param {QuoteFindUniqueArgs} args - Arguments to find a Quote
     * @example
     * // Get one Quote
     * const quote = await prisma.quote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuoteFindUniqueArgs>(args: SelectSubset<T, QuoteFindUniqueArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Quote that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuoteFindUniqueOrThrowArgs} args - Arguments to find a Quote
     * @example
     * // Get one Quote
     * const quote = await prisma.quote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuoteFindUniqueOrThrowArgs>(args: SelectSubset<T, QuoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Quote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteFindFirstArgs} args - Arguments to find a Quote
     * @example
     * // Get one Quote
     * const quote = await prisma.quote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuoteFindFirstArgs>(args?: SelectSubset<T, QuoteFindFirstArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Quote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteFindFirstOrThrowArgs} args - Arguments to find a Quote
     * @example
     * // Get one Quote
     * const quote = await prisma.quote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuoteFindFirstOrThrowArgs>(args?: SelectSubset<T, QuoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Quotes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Quotes
     * const quotes = await prisma.quote.findMany()
     * 
     * // Get first 10 Quotes
     * const quotes = await prisma.quote.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quoteWithIdOnly = await prisma.quote.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuoteFindManyArgs>(args?: SelectSubset<T, QuoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Quote.
     * @param {QuoteCreateArgs} args - Arguments to create a Quote.
     * @example
     * // Create one Quote
     * const Quote = await prisma.quote.create({
     *   data: {
     *     // ... data to create a Quote
     *   }
     * })
     * 
     */
    create<T extends QuoteCreateArgs>(args: SelectSubset<T, QuoteCreateArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Quotes.
     * @param {QuoteCreateManyArgs} args - Arguments to create many Quotes.
     * @example
     * // Create many Quotes
     * const quote = await prisma.quote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuoteCreateManyArgs>(args?: SelectSubset<T, QuoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Quotes and returns the data saved in the database.
     * @param {QuoteCreateManyAndReturnArgs} args - Arguments to create many Quotes.
     * @example
     * // Create many Quotes
     * const quote = await prisma.quote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Quotes and only return the `id`
     * const quoteWithIdOnly = await prisma.quote.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuoteCreateManyAndReturnArgs>(args?: SelectSubset<T, QuoteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Quote.
     * @param {QuoteDeleteArgs} args - Arguments to delete one Quote.
     * @example
     * // Delete one Quote
     * const Quote = await prisma.quote.delete({
     *   where: {
     *     // ... filter to delete one Quote
     *   }
     * })
     * 
     */
    delete<T extends QuoteDeleteArgs>(args: SelectSubset<T, QuoteDeleteArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Quote.
     * @param {QuoteUpdateArgs} args - Arguments to update one Quote.
     * @example
     * // Update one Quote
     * const quote = await prisma.quote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuoteUpdateArgs>(args: SelectSubset<T, QuoteUpdateArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Quotes.
     * @param {QuoteDeleteManyArgs} args - Arguments to filter Quotes to delete.
     * @example
     * // Delete a few Quotes
     * const { count } = await prisma.quote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuoteDeleteManyArgs>(args?: SelectSubset<T, QuoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Quotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Quotes
     * const quote = await prisma.quote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuoteUpdateManyArgs>(args: SelectSubset<T, QuoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Quote.
     * @param {QuoteUpsertArgs} args - Arguments to update or create a Quote.
     * @example
     * // Update or create a Quote
     * const quote = await prisma.quote.upsert({
     *   create: {
     *     // ... data to create a Quote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Quote we want to update
     *   }
     * })
     */
    upsert<T extends QuoteUpsertArgs>(args: SelectSubset<T, QuoteUpsertArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Quotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteCountArgs} args - Arguments to filter Quotes to count.
     * @example
     * // Count the number of Quotes
     * const count = await prisma.quote.count({
     *   where: {
     *     // ... the filter for the Quotes we want to count
     *   }
     * })
    **/
    count<T extends QuoteCountArgs>(
      args?: Subset<T, QuoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Quote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends QuoteAggregateArgs>(args: Subset<T, QuoteAggregateArgs>): Prisma.PrismaPromise<GetQuoteAggregateType<T>>

    /**
     * Group by Quote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteGroupByArgs} args - Group by arguments.
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
      T extends QuoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuoteGroupByArgs['orderBy'] }
        : { orderBy?: QuoteGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, QuoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Quote model
   */
  readonly fields: QuoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Quote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lineItems<T extends Quote$lineItemsArgs<ExtArgs> = {}>(args?: Subset<T, Quote$lineItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findMany"> | Null>
    invoices<T extends Quote$invoicesArgs<ExtArgs> = {}>(args?: Subset<T, Quote$invoicesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the Quote model
   */ 
  interface QuoteFieldRefs {
    readonly id: FieldRef<"Quote", 'String'>
    readonly companyId: FieldRef<"Quote", 'String'>
    readonly quoteNumber: FieldRef<"Quote", 'String'>
    readonly jobId: FieldRef<"Quote", 'String'>
    readonly customerId: FieldRef<"Quote", 'String'>
    readonly customerName: FieldRef<"Quote", 'String'>
    readonly customerEmail: FieldRef<"Quote", 'String'>
    readonly title: FieldRef<"Quote", 'String'>
    readonly description: FieldRef<"Quote", 'String'>
    readonly status: FieldRef<"Quote", 'QuoteStatus'>
    readonly validUntil: FieldRef<"Quote", 'DateTime'>
    readonly subtotal: FieldRef<"Quote", 'Decimal'>
    readonly discountType: FieldRef<"Quote", 'DiscountType'>
    readonly discountValue: FieldRef<"Quote", 'Decimal'>
    readonly discountAmount: FieldRef<"Quote", 'Decimal'>
    readonly taxRate: FieldRef<"Quote", 'Decimal'>
    readonly taxAmount: FieldRef<"Quote", 'Decimal'>
    readonly total: FieldRef<"Quote", 'Decimal'>
    readonly notes: FieldRef<"Quote", 'String'>
    readonly terms: FieldRef<"Quote", 'String'>
    readonly pdfUrl: FieldRef<"Quote", 'String'>
    readonly approvalToken: FieldRef<"Quote", 'String'>
    readonly approvedAt: FieldRef<"Quote", 'DateTime'>
    readonly approvedByName: FieldRef<"Quote", 'String'>
    readonly approvedByEmail: FieldRef<"Quote", 'String'>
    readonly sentAt: FieldRef<"Quote", 'DateTime'>
    readonly viewedAt: FieldRef<"Quote", 'DateTime'>
    readonly createdByUserId: FieldRef<"Quote", 'String'>
    readonly createdAt: FieldRef<"Quote", 'DateTime'>
    readonly updatedAt: FieldRef<"Quote", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Quote findUnique
   */
  export type QuoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quote to fetch.
     */
    where: QuoteWhereUniqueInput
  }

  /**
   * Quote findUniqueOrThrow
   */
  export type QuoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quote to fetch.
     */
    where: QuoteWhereUniqueInput
  }

  /**
   * Quote findFirst
   */
  export type QuoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quote to fetch.
     */
    where?: QuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotes to fetch.
     */
    orderBy?: QuoteOrderByWithRelationInput | QuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Quotes.
     */
    cursor?: QuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Quotes.
     */
    distinct?: QuoteScalarFieldEnum | QuoteScalarFieldEnum[]
  }

  /**
   * Quote findFirstOrThrow
   */
  export type QuoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quote to fetch.
     */
    where?: QuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotes to fetch.
     */
    orderBy?: QuoteOrderByWithRelationInput | QuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Quotes.
     */
    cursor?: QuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Quotes.
     */
    distinct?: QuoteScalarFieldEnum | QuoteScalarFieldEnum[]
  }

  /**
   * Quote findMany
   */
  export type QuoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quotes to fetch.
     */
    where?: QuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotes to fetch.
     */
    orderBy?: QuoteOrderByWithRelationInput | QuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Quotes.
     */
    cursor?: QuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotes.
     */
    skip?: number
    distinct?: QuoteScalarFieldEnum | QuoteScalarFieldEnum[]
  }

  /**
   * Quote create
   */
  export type QuoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * The data needed to create a Quote.
     */
    data: XOR<QuoteCreateInput, QuoteUncheckedCreateInput>
  }

  /**
   * Quote createMany
   */
  export type QuoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Quotes.
     */
    data: QuoteCreateManyInput | QuoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Quote createManyAndReturn
   */
  export type QuoteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Quotes.
     */
    data: QuoteCreateManyInput | QuoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Quote update
   */
  export type QuoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * The data needed to update a Quote.
     */
    data: XOR<QuoteUpdateInput, QuoteUncheckedUpdateInput>
    /**
     * Choose, which Quote to update.
     */
    where: QuoteWhereUniqueInput
  }

  /**
   * Quote updateMany
   */
  export type QuoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Quotes.
     */
    data: XOR<QuoteUpdateManyMutationInput, QuoteUncheckedUpdateManyInput>
    /**
     * Filter which Quotes to update
     */
    where?: QuoteWhereInput
  }

  /**
   * Quote upsert
   */
  export type QuoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * The filter to search for the Quote to update in case it exists.
     */
    where: QuoteWhereUniqueInput
    /**
     * In case the Quote found by the `where` argument doesn't exist, create a new Quote with this data.
     */
    create: XOR<QuoteCreateInput, QuoteUncheckedCreateInput>
    /**
     * In case the Quote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuoteUpdateInput, QuoteUncheckedUpdateInput>
  }

  /**
   * Quote delete
   */
  export type QuoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter which Quote to delete.
     */
    where: QuoteWhereUniqueInput
  }

  /**
   * Quote deleteMany
   */
  export type QuoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Quotes to delete
     */
    where?: QuoteWhereInput
  }

  /**
   * Quote.lineItems
   */
  export type Quote$lineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    where?: QuoteLineItemWhereInput
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    cursor?: QuoteLineItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuoteLineItemScalarFieldEnum | QuoteLineItemScalarFieldEnum[]
  }

  /**
   * Quote.invoices
   */
  export type Quote$invoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    where?: InvoiceWhereInput
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    cursor?: InvoiceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Quote without action
   */
  export type QuoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
  }


  /**
   * Model QuoteLineItem
   */

  export type AggregateQuoteLineItem = {
    _count: QuoteLineItemCountAggregateOutputType | null
    _avg: QuoteLineItemAvgAggregateOutputType | null
    _sum: QuoteLineItemSumAggregateOutputType | null
    _min: QuoteLineItemMinAggregateOutputType | null
    _max: QuoteLineItemMaxAggregateOutputType | null
  }

  export type QuoteLineItemAvgAggregateOutputType = {
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
    sortOrder: number | null
  }

  export type QuoteLineItemSumAggregateOutputType = {
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
    sortOrder: number | null
  }

  export type QuoteLineItemMinAggregateOutputType = {
    id: string | null
    quoteId: string | null
    description: string | null
    category: $Enums.LineItemCategory | null
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
    taxable: boolean | null
    sortOrder: number | null
  }

  export type QuoteLineItemMaxAggregateOutputType = {
    id: string | null
    quoteId: string | null
    description: string | null
    category: $Enums.LineItemCategory | null
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
    taxable: boolean | null
    sortOrder: number | null
  }

  export type QuoteLineItemCountAggregateOutputType = {
    id: number
    quoteId: number
    description: number
    category: number
    quantity: number
    unitPrice: number
    lineTotal: number
    taxable: number
    sortOrder: number
    _all: number
  }


  export type QuoteLineItemAvgAggregateInputType = {
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    sortOrder?: true
  }

  export type QuoteLineItemSumAggregateInputType = {
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    sortOrder?: true
  }

  export type QuoteLineItemMinAggregateInputType = {
    id?: true
    quoteId?: true
    description?: true
    category?: true
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    taxable?: true
    sortOrder?: true
  }

  export type QuoteLineItemMaxAggregateInputType = {
    id?: true
    quoteId?: true
    description?: true
    category?: true
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    taxable?: true
    sortOrder?: true
  }

  export type QuoteLineItemCountAggregateInputType = {
    id?: true
    quoteId?: true
    description?: true
    category?: true
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    taxable?: true
    sortOrder?: true
    _all?: true
  }

  export type QuoteLineItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuoteLineItem to aggregate.
     */
    where?: QuoteLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteLineItems to fetch.
     */
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuoteLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuoteLineItems
    **/
    _count?: true | QuoteLineItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuoteLineItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuoteLineItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuoteLineItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuoteLineItemMaxAggregateInputType
  }

  export type GetQuoteLineItemAggregateType<T extends QuoteLineItemAggregateArgs> = {
        [P in keyof T & keyof AggregateQuoteLineItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuoteLineItem[P]>
      : GetScalarType<T[P], AggregateQuoteLineItem[P]>
  }




  export type QuoteLineItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteLineItemWhereInput
    orderBy?: QuoteLineItemOrderByWithAggregationInput | QuoteLineItemOrderByWithAggregationInput[]
    by: QuoteLineItemScalarFieldEnum[] | QuoteLineItemScalarFieldEnum
    having?: QuoteLineItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuoteLineItemCountAggregateInputType | true
    _avg?: QuoteLineItemAvgAggregateInputType
    _sum?: QuoteLineItemSumAggregateInputType
    _min?: QuoteLineItemMinAggregateInputType
    _max?: QuoteLineItemMaxAggregateInputType
  }

  export type QuoteLineItemGroupByOutputType = {
    id: string
    quoteId: string
    description: string
    category: $Enums.LineItemCategory
    quantity: Decimal
    unitPrice: Decimal
    lineTotal: Decimal
    taxable: boolean
    sortOrder: number
    _count: QuoteLineItemCountAggregateOutputType | null
    _avg: QuoteLineItemAvgAggregateOutputType | null
    _sum: QuoteLineItemSumAggregateOutputType | null
    _min: QuoteLineItemMinAggregateOutputType | null
    _max: QuoteLineItemMaxAggregateOutputType | null
  }

  type GetQuoteLineItemGroupByPayload<T extends QuoteLineItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuoteLineItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuoteLineItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuoteLineItemGroupByOutputType[P]>
            : GetScalarType<T[P], QuoteLineItemGroupByOutputType[P]>
        }
      >
    >


  export type QuoteLineItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    description?: boolean
    category?: boolean
    quantity?: boolean
    unitPrice?: boolean
    lineTotal?: boolean
    taxable?: boolean
    sortOrder?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quoteLineItem"]>

  export type QuoteLineItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    description?: boolean
    category?: boolean
    quantity?: boolean
    unitPrice?: boolean
    lineTotal?: boolean
    taxable?: boolean
    sortOrder?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quoteLineItem"]>

  export type QuoteLineItemSelectScalar = {
    id?: boolean
    quoteId?: boolean
    description?: boolean
    category?: boolean
    quantity?: boolean
    unitPrice?: boolean
    lineTotal?: boolean
    taxable?: boolean
    sortOrder?: boolean
  }

  export type QuoteLineItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }
  export type QuoteLineItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }

  export type $QuoteLineItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuoteLineItem"
    objects: {
      quote: Prisma.$QuotePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      quoteId: string
      description: string
      category: $Enums.LineItemCategory
      quantity: Prisma.Decimal
      unitPrice: Prisma.Decimal
      lineTotal: Prisma.Decimal
      taxable: boolean
      sortOrder: number
    }, ExtArgs["result"]["quoteLineItem"]>
    composites: {}
  }

  type QuoteLineItemGetPayload<S extends boolean | null | undefined | QuoteLineItemDefaultArgs> = $Result.GetResult<Prisma.$QuoteLineItemPayload, S>

  type QuoteLineItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuoteLineItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuoteLineItemCountAggregateInputType | true
    }

  export interface QuoteLineItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuoteLineItem'], meta: { name: 'QuoteLineItem' } }
    /**
     * Find zero or one QuoteLineItem that matches the filter.
     * @param {QuoteLineItemFindUniqueArgs} args - Arguments to find a QuoteLineItem
     * @example
     * // Get one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuoteLineItemFindUniqueArgs>(args: SelectSubset<T, QuoteLineItemFindUniqueArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one QuoteLineItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuoteLineItemFindUniqueOrThrowArgs} args - Arguments to find a QuoteLineItem
     * @example
     * // Get one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuoteLineItemFindUniqueOrThrowArgs>(args: SelectSubset<T, QuoteLineItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first QuoteLineItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemFindFirstArgs} args - Arguments to find a QuoteLineItem
     * @example
     * // Get one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuoteLineItemFindFirstArgs>(args?: SelectSubset<T, QuoteLineItemFindFirstArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first QuoteLineItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemFindFirstOrThrowArgs} args - Arguments to find a QuoteLineItem
     * @example
     * // Get one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuoteLineItemFindFirstOrThrowArgs>(args?: SelectSubset<T, QuoteLineItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more QuoteLineItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuoteLineItems
     * const quoteLineItems = await prisma.quoteLineItem.findMany()
     * 
     * // Get first 10 QuoteLineItems
     * const quoteLineItems = await prisma.quoteLineItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quoteLineItemWithIdOnly = await prisma.quoteLineItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuoteLineItemFindManyArgs>(args?: SelectSubset<T, QuoteLineItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a QuoteLineItem.
     * @param {QuoteLineItemCreateArgs} args - Arguments to create a QuoteLineItem.
     * @example
     * // Create one QuoteLineItem
     * const QuoteLineItem = await prisma.quoteLineItem.create({
     *   data: {
     *     // ... data to create a QuoteLineItem
     *   }
     * })
     * 
     */
    create<T extends QuoteLineItemCreateArgs>(args: SelectSubset<T, QuoteLineItemCreateArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many QuoteLineItems.
     * @param {QuoteLineItemCreateManyArgs} args - Arguments to create many QuoteLineItems.
     * @example
     * // Create many QuoteLineItems
     * const quoteLineItem = await prisma.quoteLineItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuoteLineItemCreateManyArgs>(args?: SelectSubset<T, QuoteLineItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuoteLineItems and returns the data saved in the database.
     * @param {QuoteLineItemCreateManyAndReturnArgs} args - Arguments to create many QuoteLineItems.
     * @example
     * // Create many QuoteLineItems
     * const quoteLineItem = await prisma.quoteLineItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuoteLineItems and only return the `id`
     * const quoteLineItemWithIdOnly = await prisma.quoteLineItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuoteLineItemCreateManyAndReturnArgs>(args?: SelectSubset<T, QuoteLineItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a QuoteLineItem.
     * @param {QuoteLineItemDeleteArgs} args - Arguments to delete one QuoteLineItem.
     * @example
     * // Delete one QuoteLineItem
     * const QuoteLineItem = await prisma.quoteLineItem.delete({
     *   where: {
     *     // ... filter to delete one QuoteLineItem
     *   }
     * })
     * 
     */
    delete<T extends QuoteLineItemDeleteArgs>(args: SelectSubset<T, QuoteLineItemDeleteArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one QuoteLineItem.
     * @param {QuoteLineItemUpdateArgs} args - Arguments to update one QuoteLineItem.
     * @example
     * // Update one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuoteLineItemUpdateArgs>(args: SelectSubset<T, QuoteLineItemUpdateArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more QuoteLineItems.
     * @param {QuoteLineItemDeleteManyArgs} args - Arguments to filter QuoteLineItems to delete.
     * @example
     * // Delete a few QuoteLineItems
     * const { count } = await prisma.quoteLineItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuoteLineItemDeleteManyArgs>(args?: SelectSubset<T, QuoteLineItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuoteLineItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuoteLineItems
     * const quoteLineItem = await prisma.quoteLineItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuoteLineItemUpdateManyArgs>(args: SelectSubset<T, QuoteLineItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one QuoteLineItem.
     * @param {QuoteLineItemUpsertArgs} args - Arguments to update or create a QuoteLineItem.
     * @example
     * // Update or create a QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.upsert({
     *   create: {
     *     // ... data to create a QuoteLineItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuoteLineItem we want to update
     *   }
     * })
     */
    upsert<T extends QuoteLineItemUpsertArgs>(args: SelectSubset<T, QuoteLineItemUpsertArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of QuoteLineItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemCountArgs} args - Arguments to filter QuoteLineItems to count.
     * @example
     * // Count the number of QuoteLineItems
     * const count = await prisma.quoteLineItem.count({
     *   where: {
     *     // ... the filter for the QuoteLineItems we want to count
     *   }
     * })
    **/
    count<T extends QuoteLineItemCountArgs>(
      args?: Subset<T, QuoteLineItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuoteLineItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuoteLineItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends QuoteLineItemAggregateArgs>(args: Subset<T, QuoteLineItemAggregateArgs>): Prisma.PrismaPromise<GetQuoteLineItemAggregateType<T>>

    /**
     * Group by QuoteLineItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemGroupByArgs} args - Group by arguments.
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
      T extends QuoteLineItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuoteLineItemGroupByArgs['orderBy'] }
        : { orderBy?: QuoteLineItemGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, QuoteLineItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuoteLineItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuoteLineItem model
   */
  readonly fields: QuoteLineItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuoteLineItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuoteLineItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quote<T extends QuoteDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuoteDefaultArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the QuoteLineItem model
   */ 
  interface QuoteLineItemFieldRefs {
    readonly id: FieldRef<"QuoteLineItem", 'String'>
    readonly quoteId: FieldRef<"QuoteLineItem", 'String'>
    readonly description: FieldRef<"QuoteLineItem", 'String'>
    readonly category: FieldRef<"QuoteLineItem", 'LineItemCategory'>
    readonly quantity: FieldRef<"QuoteLineItem", 'Decimal'>
    readonly unitPrice: FieldRef<"QuoteLineItem", 'Decimal'>
    readonly lineTotal: FieldRef<"QuoteLineItem", 'Decimal'>
    readonly taxable: FieldRef<"QuoteLineItem", 'Boolean'>
    readonly sortOrder: FieldRef<"QuoteLineItem", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * QuoteLineItem findUnique
   */
  export type QuoteLineItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItem to fetch.
     */
    where: QuoteLineItemWhereUniqueInput
  }

  /**
   * QuoteLineItem findUniqueOrThrow
   */
  export type QuoteLineItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItem to fetch.
     */
    where: QuoteLineItemWhereUniqueInput
  }

  /**
   * QuoteLineItem findFirst
   */
  export type QuoteLineItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItem to fetch.
     */
    where?: QuoteLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteLineItems to fetch.
     */
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuoteLineItems.
     */
    cursor?: QuoteLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuoteLineItems.
     */
    distinct?: QuoteLineItemScalarFieldEnum | QuoteLineItemScalarFieldEnum[]
  }

  /**
   * QuoteLineItem findFirstOrThrow
   */
  export type QuoteLineItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItem to fetch.
     */
    where?: QuoteLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteLineItems to fetch.
     */
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuoteLineItems.
     */
    cursor?: QuoteLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuoteLineItems.
     */
    distinct?: QuoteLineItemScalarFieldEnum | QuoteLineItemScalarFieldEnum[]
  }

  /**
   * QuoteLineItem findMany
   */
  export type QuoteLineItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItems to fetch.
     */
    where?: QuoteLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteLineItems to fetch.
     */
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuoteLineItems.
     */
    cursor?: QuoteLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteLineItems.
     */
    skip?: number
    distinct?: QuoteLineItemScalarFieldEnum | QuoteLineItemScalarFieldEnum[]
  }

  /**
   * QuoteLineItem create
   */
  export type QuoteLineItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * The data needed to create a QuoteLineItem.
     */
    data: XOR<QuoteLineItemCreateInput, QuoteLineItemUncheckedCreateInput>
  }

  /**
   * QuoteLineItem createMany
   */
  export type QuoteLineItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuoteLineItems.
     */
    data: QuoteLineItemCreateManyInput | QuoteLineItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuoteLineItem createManyAndReturn
   */
  export type QuoteLineItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many QuoteLineItems.
     */
    data: QuoteLineItemCreateManyInput | QuoteLineItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuoteLineItem update
   */
  export type QuoteLineItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * The data needed to update a QuoteLineItem.
     */
    data: XOR<QuoteLineItemUpdateInput, QuoteLineItemUncheckedUpdateInput>
    /**
     * Choose, which QuoteLineItem to update.
     */
    where: QuoteLineItemWhereUniqueInput
  }

  /**
   * QuoteLineItem updateMany
   */
  export type QuoteLineItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuoteLineItems.
     */
    data: XOR<QuoteLineItemUpdateManyMutationInput, QuoteLineItemUncheckedUpdateManyInput>
    /**
     * Filter which QuoteLineItems to update
     */
    where?: QuoteLineItemWhereInput
  }

  /**
   * QuoteLineItem upsert
   */
  export type QuoteLineItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * The filter to search for the QuoteLineItem to update in case it exists.
     */
    where: QuoteLineItemWhereUniqueInput
    /**
     * In case the QuoteLineItem found by the `where` argument doesn't exist, create a new QuoteLineItem with this data.
     */
    create: XOR<QuoteLineItemCreateInput, QuoteLineItemUncheckedCreateInput>
    /**
     * In case the QuoteLineItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuoteLineItemUpdateInput, QuoteLineItemUncheckedUpdateInput>
  }

  /**
   * QuoteLineItem delete
   */
  export type QuoteLineItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter which QuoteLineItem to delete.
     */
    where: QuoteLineItemWhereUniqueInput
  }

  /**
   * QuoteLineItem deleteMany
   */
  export type QuoteLineItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuoteLineItems to delete
     */
    where?: QuoteLineItemWhereInput
  }

  /**
   * QuoteLineItem without action
   */
  export type QuoteLineItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
  }


  /**
   * Model Invoice
   */

  export type AggregateInvoice = {
    _count: InvoiceCountAggregateOutputType | null
    _avg: InvoiceAvgAggregateOutputType | null
    _sum: InvoiceSumAggregateOutputType | null
    _min: InvoiceMinAggregateOutputType | null
    _max: InvoiceMaxAggregateOutputType | null
  }

  export type InvoiceAvgAggregateOutputType = {
    dueDays: number | null
    subtotal: Decimal | null
    discountAmount: Decimal | null
    taxRate: Decimal | null
    taxAmount: Decimal | null
    total: Decimal | null
    amountPaid: Decimal | null
    balanceDue: Decimal | null
  }

  export type InvoiceSumAggregateOutputType = {
    dueDays: number | null
    subtotal: Decimal | null
    discountAmount: Decimal | null
    taxRate: Decimal | null
    taxAmount: Decimal | null
    total: Decimal | null
    amountPaid: Decimal | null
    balanceDue: Decimal | null
  }

  export type InvoiceMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    invoiceNumber: string | null
    quoteId: string | null
    jobId: string | null
    workOrderId: string | null
    customerId: string | null
    customerName: string | null
    customerEmail: string | null
    status: $Enums.InvoiceStatus | null
    dueDate: Date | null
    dueDays: number | null
    subtotal: Decimal | null
    discountAmount: Decimal | null
    taxRate: Decimal | null
    taxAmount: Decimal | null
    total: Decimal | null
    amountPaid: Decimal | null
    balanceDue: Decimal | null
    notes: string | null
    terms: string | null
    pdfUrl: string | null
    stripePaymentIntentId: string | null
    stripePaymentUrl: string | null
    quickbooksId: string | null
    sentAt: Date | null
    paidAt: Date | null
    voidedAt: Date | null
    approvedAt: Date | null
    approvedByName: string | null
    approvedByEmail: string | null
    declinedAt: Date | null
    declinedByName: string | null
    declinedByEmail: string | null
    declineReason: string | null
    createdByUserId: string | null
    recurringScheduleId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    invoiceNumber: string | null
    quoteId: string | null
    jobId: string | null
    workOrderId: string | null
    customerId: string | null
    customerName: string | null
    customerEmail: string | null
    status: $Enums.InvoiceStatus | null
    dueDate: Date | null
    dueDays: number | null
    subtotal: Decimal | null
    discountAmount: Decimal | null
    taxRate: Decimal | null
    taxAmount: Decimal | null
    total: Decimal | null
    amountPaid: Decimal | null
    balanceDue: Decimal | null
    notes: string | null
    terms: string | null
    pdfUrl: string | null
    stripePaymentIntentId: string | null
    stripePaymentUrl: string | null
    quickbooksId: string | null
    sentAt: Date | null
    paidAt: Date | null
    voidedAt: Date | null
    approvedAt: Date | null
    approvedByName: string | null
    approvedByEmail: string | null
    declinedAt: Date | null
    declinedByName: string | null
    declinedByEmail: string | null
    declineReason: string | null
    createdByUserId: string | null
    recurringScheduleId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceCountAggregateOutputType = {
    id: number
    companyId: number
    invoiceNumber: number
    quoteId: number
    jobId: number
    workOrderId: number
    customerId: number
    customerName: number
    customerEmail: number
    status: number
    dueDate: number
    dueDays: number
    subtotal: number
    discountAmount: number
    taxRate: number
    taxAmount: number
    total: number
    amountPaid: number
    balanceDue: number
    notes: number
    terms: number
    pdfUrl: number
    stripePaymentIntentId: number
    stripePaymentUrl: number
    quickbooksId: number
    sentAt: number
    paidAt: number
    voidedAt: number
    approvedAt: number
    approvedByName: number
    approvedByEmail: number
    declinedAt: number
    declinedByName: number
    declinedByEmail: number
    declineReason: number
    createdByUserId: number
    recurringScheduleId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InvoiceAvgAggregateInputType = {
    dueDays?: true
    subtotal?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
    amountPaid?: true
    balanceDue?: true
  }

  export type InvoiceSumAggregateInputType = {
    dueDays?: true
    subtotal?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
    amountPaid?: true
    balanceDue?: true
  }

  export type InvoiceMinAggregateInputType = {
    id?: true
    companyId?: true
    invoiceNumber?: true
    quoteId?: true
    jobId?: true
    workOrderId?: true
    customerId?: true
    customerName?: true
    customerEmail?: true
    status?: true
    dueDate?: true
    dueDays?: true
    subtotal?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
    amountPaid?: true
    balanceDue?: true
    notes?: true
    terms?: true
    pdfUrl?: true
    stripePaymentIntentId?: true
    stripePaymentUrl?: true
    quickbooksId?: true
    sentAt?: true
    paidAt?: true
    voidedAt?: true
    approvedAt?: true
    approvedByName?: true
    approvedByEmail?: true
    declinedAt?: true
    declinedByName?: true
    declinedByEmail?: true
    declineReason?: true
    createdByUserId?: true
    recurringScheduleId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceMaxAggregateInputType = {
    id?: true
    companyId?: true
    invoiceNumber?: true
    quoteId?: true
    jobId?: true
    workOrderId?: true
    customerId?: true
    customerName?: true
    customerEmail?: true
    status?: true
    dueDate?: true
    dueDays?: true
    subtotal?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
    amountPaid?: true
    balanceDue?: true
    notes?: true
    terms?: true
    pdfUrl?: true
    stripePaymentIntentId?: true
    stripePaymentUrl?: true
    quickbooksId?: true
    sentAt?: true
    paidAt?: true
    voidedAt?: true
    approvedAt?: true
    approvedByName?: true
    approvedByEmail?: true
    declinedAt?: true
    declinedByName?: true
    declinedByEmail?: true
    declineReason?: true
    createdByUserId?: true
    recurringScheduleId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceCountAggregateInputType = {
    id?: true
    companyId?: true
    invoiceNumber?: true
    quoteId?: true
    jobId?: true
    workOrderId?: true
    customerId?: true
    customerName?: true
    customerEmail?: true
    status?: true
    dueDate?: true
    dueDays?: true
    subtotal?: true
    discountAmount?: true
    taxRate?: true
    taxAmount?: true
    total?: true
    amountPaid?: true
    balanceDue?: true
    notes?: true
    terms?: true
    pdfUrl?: true
    stripePaymentIntentId?: true
    stripePaymentUrl?: true
    quickbooksId?: true
    sentAt?: true
    paidAt?: true
    voidedAt?: true
    approvedAt?: true
    approvedByName?: true
    approvedByEmail?: true
    declinedAt?: true
    declinedByName?: true
    declinedByEmail?: true
    declineReason?: true
    createdByUserId?: true
    recurringScheduleId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InvoiceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invoice to aggregate.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Invoices
    **/
    _count?: true | InvoiceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InvoiceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InvoiceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InvoiceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InvoiceMaxAggregateInputType
  }

  export type GetInvoiceAggregateType<T extends InvoiceAggregateArgs> = {
        [P in keyof T & keyof AggregateInvoice]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInvoice[P]>
      : GetScalarType<T[P], AggregateInvoice[P]>
  }




  export type InvoiceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceWhereInput
    orderBy?: InvoiceOrderByWithAggregationInput | InvoiceOrderByWithAggregationInput[]
    by: InvoiceScalarFieldEnum[] | InvoiceScalarFieldEnum
    having?: InvoiceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InvoiceCountAggregateInputType | true
    _avg?: InvoiceAvgAggregateInputType
    _sum?: InvoiceSumAggregateInputType
    _min?: InvoiceMinAggregateInputType
    _max?: InvoiceMaxAggregateInputType
  }

  export type InvoiceGroupByOutputType = {
    id: string
    companyId: string
    invoiceNumber: string
    quoteId: string | null
    jobId: string | null
    workOrderId: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status: $Enums.InvoiceStatus
    dueDate: Date | null
    dueDays: number
    subtotal: Decimal
    discountAmount: Decimal
    taxRate: Decimal
    taxAmount: Decimal
    total: Decimal
    amountPaid: Decimal
    balanceDue: Decimal
    notes: string | null
    terms: string | null
    pdfUrl: string | null
    stripePaymentIntentId: string | null
    stripePaymentUrl: string | null
    quickbooksId: string | null
    sentAt: Date | null
    paidAt: Date | null
    voidedAt: Date | null
    approvedAt: Date | null
    approvedByName: string | null
    approvedByEmail: string | null
    declinedAt: Date | null
    declinedByName: string | null
    declinedByEmail: string | null
    declineReason: string | null
    createdByUserId: string
    recurringScheduleId: string | null
    createdAt: Date
    updatedAt: Date
    _count: InvoiceCountAggregateOutputType | null
    _avg: InvoiceAvgAggregateOutputType | null
    _sum: InvoiceSumAggregateOutputType | null
    _min: InvoiceMinAggregateOutputType | null
    _max: InvoiceMaxAggregateOutputType | null
  }

  type GetInvoiceGroupByPayload<T extends InvoiceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InvoiceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InvoiceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InvoiceGroupByOutputType[P]>
            : GetScalarType<T[P], InvoiceGroupByOutputType[P]>
        }
      >
    >


  export type InvoiceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    invoiceNumber?: boolean
    quoteId?: boolean
    jobId?: boolean
    workOrderId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    status?: boolean
    dueDate?: boolean
    dueDays?: boolean
    subtotal?: boolean
    discountAmount?: boolean
    taxRate?: boolean
    taxAmount?: boolean
    total?: boolean
    amountPaid?: boolean
    balanceDue?: boolean
    notes?: boolean
    terms?: boolean
    pdfUrl?: boolean
    stripePaymentIntentId?: boolean
    stripePaymentUrl?: boolean
    quickbooksId?: boolean
    sentAt?: boolean
    paidAt?: boolean
    voidedAt?: boolean
    approvedAt?: boolean
    approvedByName?: boolean
    approvedByEmail?: boolean
    declinedAt?: boolean
    declinedByName?: boolean
    declinedByEmail?: boolean
    declineReason?: boolean
    createdByUserId?: boolean
    recurringScheduleId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | Invoice$quoteArgs<ExtArgs>
    recurringSchedule?: boolean | Invoice$recurringScheduleArgs<ExtArgs>
    lineItems?: boolean | Invoice$lineItemsArgs<ExtArgs>
    payments?: boolean | Invoice$paymentsArgs<ExtArgs>
    _count?: boolean | InvoiceCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    invoiceNumber?: boolean
    quoteId?: boolean
    jobId?: boolean
    workOrderId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    status?: boolean
    dueDate?: boolean
    dueDays?: boolean
    subtotal?: boolean
    discountAmount?: boolean
    taxRate?: boolean
    taxAmount?: boolean
    total?: boolean
    amountPaid?: boolean
    balanceDue?: boolean
    notes?: boolean
    terms?: boolean
    pdfUrl?: boolean
    stripePaymentIntentId?: boolean
    stripePaymentUrl?: boolean
    quickbooksId?: boolean
    sentAt?: boolean
    paidAt?: boolean
    voidedAt?: boolean
    approvedAt?: boolean
    approvedByName?: boolean
    approvedByEmail?: boolean
    declinedAt?: boolean
    declinedByName?: boolean
    declinedByEmail?: boolean
    declineReason?: boolean
    createdByUserId?: boolean
    recurringScheduleId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | Invoice$quoteArgs<ExtArgs>
    recurringSchedule?: boolean | Invoice$recurringScheduleArgs<ExtArgs>
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectScalar = {
    id?: boolean
    companyId?: boolean
    invoiceNumber?: boolean
    quoteId?: boolean
    jobId?: boolean
    workOrderId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    status?: boolean
    dueDate?: boolean
    dueDays?: boolean
    subtotal?: boolean
    discountAmount?: boolean
    taxRate?: boolean
    taxAmount?: boolean
    total?: boolean
    amountPaid?: boolean
    balanceDue?: boolean
    notes?: boolean
    terms?: boolean
    pdfUrl?: boolean
    stripePaymentIntentId?: boolean
    stripePaymentUrl?: boolean
    quickbooksId?: boolean
    sentAt?: boolean
    paidAt?: boolean
    voidedAt?: boolean
    approvedAt?: boolean
    approvedByName?: boolean
    approvedByEmail?: boolean
    declinedAt?: boolean
    declinedByName?: boolean
    declinedByEmail?: boolean
    declineReason?: boolean
    createdByUserId?: boolean
    recurringScheduleId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InvoiceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | Invoice$quoteArgs<ExtArgs>
    recurringSchedule?: boolean | Invoice$recurringScheduleArgs<ExtArgs>
    lineItems?: boolean | Invoice$lineItemsArgs<ExtArgs>
    payments?: boolean | Invoice$paymentsArgs<ExtArgs>
    _count?: boolean | InvoiceCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type InvoiceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | Invoice$quoteArgs<ExtArgs>
    recurringSchedule?: boolean | Invoice$recurringScheduleArgs<ExtArgs>
  }

  export type $InvoicePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Invoice"
    objects: {
      quote: Prisma.$QuotePayload<ExtArgs> | null
      recurringSchedule: Prisma.$RecurringSchedulePayload<ExtArgs> | null
      lineItems: Prisma.$InvoiceLineItemPayload<ExtArgs>[]
      payments: Prisma.$PaymentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      invoiceNumber: string
      quoteId: string | null
      jobId: string | null
      workOrderId: string | null
      customerId: string
      customerName: string
      customerEmail: string
      status: $Enums.InvoiceStatus
      dueDate: Date | null
      dueDays: number
      subtotal: Prisma.Decimal
      discountAmount: Prisma.Decimal
      taxRate: Prisma.Decimal
      taxAmount: Prisma.Decimal
      total: Prisma.Decimal
      amountPaid: Prisma.Decimal
      balanceDue: Prisma.Decimal
      notes: string | null
      terms: string | null
      pdfUrl: string | null
      stripePaymentIntentId: string | null
      stripePaymentUrl: string | null
      quickbooksId: string | null
      sentAt: Date | null
      paidAt: Date | null
      voidedAt: Date | null
      approvedAt: Date | null
      approvedByName: string | null
      approvedByEmail: string | null
      declinedAt: Date | null
      declinedByName: string | null
      declinedByEmail: string | null
      declineReason: string | null
      createdByUserId: string
      recurringScheduleId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["invoice"]>
    composites: {}
  }

  type InvoiceGetPayload<S extends boolean | null | undefined | InvoiceDefaultArgs> = $Result.GetResult<Prisma.$InvoicePayload, S>

  type InvoiceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<InvoiceFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: InvoiceCountAggregateInputType | true
    }

  export interface InvoiceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Invoice'], meta: { name: 'Invoice' } }
    /**
     * Find zero or one Invoice that matches the filter.
     * @param {InvoiceFindUniqueArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InvoiceFindUniqueArgs>(args: SelectSubset<T, InvoiceFindUniqueArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Invoice that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {InvoiceFindUniqueOrThrowArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InvoiceFindUniqueOrThrowArgs>(args: SelectSubset<T, InvoiceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Invoice that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindFirstArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InvoiceFindFirstArgs>(args?: SelectSubset<T, InvoiceFindFirstArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Invoice that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindFirstOrThrowArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InvoiceFindFirstOrThrowArgs>(args?: SelectSubset<T, InvoiceFindFirstOrThrowArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Invoices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Invoices
     * const invoices = await prisma.invoice.findMany()
     * 
     * // Get first 10 Invoices
     * const invoices = await prisma.invoice.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const invoiceWithIdOnly = await prisma.invoice.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InvoiceFindManyArgs>(args?: SelectSubset<T, InvoiceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Invoice.
     * @param {InvoiceCreateArgs} args - Arguments to create a Invoice.
     * @example
     * // Create one Invoice
     * const Invoice = await prisma.invoice.create({
     *   data: {
     *     // ... data to create a Invoice
     *   }
     * })
     * 
     */
    create<T extends InvoiceCreateArgs>(args: SelectSubset<T, InvoiceCreateArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Invoices.
     * @param {InvoiceCreateManyArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoice = await prisma.invoice.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InvoiceCreateManyArgs>(args?: SelectSubset<T, InvoiceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Invoices and returns the data saved in the database.
     * @param {InvoiceCreateManyAndReturnArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoice = await prisma.invoice.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Invoices and only return the `id`
     * const invoiceWithIdOnly = await prisma.invoice.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InvoiceCreateManyAndReturnArgs>(args?: SelectSubset<T, InvoiceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Invoice.
     * @param {InvoiceDeleteArgs} args - Arguments to delete one Invoice.
     * @example
     * // Delete one Invoice
     * const Invoice = await prisma.invoice.delete({
     *   where: {
     *     // ... filter to delete one Invoice
     *   }
     * })
     * 
     */
    delete<T extends InvoiceDeleteArgs>(args: SelectSubset<T, InvoiceDeleteArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Invoice.
     * @param {InvoiceUpdateArgs} args - Arguments to update one Invoice.
     * @example
     * // Update one Invoice
     * const invoice = await prisma.invoice.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InvoiceUpdateArgs>(args: SelectSubset<T, InvoiceUpdateArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Invoices.
     * @param {InvoiceDeleteManyArgs} args - Arguments to filter Invoices to delete.
     * @example
     * // Delete a few Invoices
     * const { count } = await prisma.invoice.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InvoiceDeleteManyArgs>(args?: SelectSubset<T, InvoiceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Invoices
     * const invoice = await prisma.invoice.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InvoiceUpdateManyArgs>(args: SelectSubset<T, InvoiceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Invoice.
     * @param {InvoiceUpsertArgs} args - Arguments to update or create a Invoice.
     * @example
     * // Update or create a Invoice
     * const invoice = await prisma.invoice.upsert({
     *   create: {
     *     // ... data to create a Invoice
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Invoice we want to update
     *   }
     * })
     */
    upsert<T extends InvoiceUpsertArgs>(args: SelectSubset<T, InvoiceUpsertArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceCountArgs} args - Arguments to filter Invoices to count.
     * @example
     * // Count the number of Invoices
     * const count = await prisma.invoice.count({
     *   where: {
     *     // ... the filter for the Invoices we want to count
     *   }
     * })
    **/
    count<T extends InvoiceCountArgs>(
      args?: Subset<T, InvoiceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InvoiceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Invoice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends InvoiceAggregateArgs>(args: Subset<T, InvoiceAggregateArgs>): Prisma.PrismaPromise<GetInvoiceAggregateType<T>>

    /**
     * Group by Invoice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceGroupByArgs} args - Group by arguments.
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
      T extends InvoiceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InvoiceGroupByArgs['orderBy'] }
        : { orderBy?: InvoiceGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, InvoiceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvoiceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Invoice model
   */
  readonly fields: InvoiceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Invoice.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InvoiceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quote<T extends Invoice$quoteArgs<ExtArgs> = {}>(args?: Subset<T, Invoice$quoteArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    recurringSchedule<T extends Invoice$recurringScheduleArgs<ExtArgs> = {}>(args?: Subset<T, Invoice$recurringScheduleArgs<ExtArgs>>): Prisma__RecurringScheduleClient<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    lineItems<T extends Invoice$lineItemsArgs<ExtArgs> = {}>(args?: Subset<T, Invoice$lineItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "findMany"> | Null>
    payments<T extends Invoice$paymentsArgs<ExtArgs> = {}>(args?: Subset<T, Invoice$paymentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the Invoice model
   */ 
  interface InvoiceFieldRefs {
    readonly id: FieldRef<"Invoice", 'String'>
    readonly companyId: FieldRef<"Invoice", 'String'>
    readonly invoiceNumber: FieldRef<"Invoice", 'String'>
    readonly quoteId: FieldRef<"Invoice", 'String'>
    readonly jobId: FieldRef<"Invoice", 'String'>
    readonly workOrderId: FieldRef<"Invoice", 'String'>
    readonly customerId: FieldRef<"Invoice", 'String'>
    readonly customerName: FieldRef<"Invoice", 'String'>
    readonly customerEmail: FieldRef<"Invoice", 'String'>
    readonly status: FieldRef<"Invoice", 'InvoiceStatus'>
    readonly dueDate: FieldRef<"Invoice", 'DateTime'>
    readonly dueDays: FieldRef<"Invoice", 'Int'>
    readonly subtotal: FieldRef<"Invoice", 'Decimal'>
    readonly discountAmount: FieldRef<"Invoice", 'Decimal'>
    readonly taxRate: FieldRef<"Invoice", 'Decimal'>
    readonly taxAmount: FieldRef<"Invoice", 'Decimal'>
    readonly total: FieldRef<"Invoice", 'Decimal'>
    readonly amountPaid: FieldRef<"Invoice", 'Decimal'>
    readonly balanceDue: FieldRef<"Invoice", 'Decimal'>
    readonly notes: FieldRef<"Invoice", 'String'>
    readonly terms: FieldRef<"Invoice", 'String'>
    readonly pdfUrl: FieldRef<"Invoice", 'String'>
    readonly stripePaymentIntentId: FieldRef<"Invoice", 'String'>
    readonly stripePaymentUrl: FieldRef<"Invoice", 'String'>
    readonly quickbooksId: FieldRef<"Invoice", 'String'>
    readonly sentAt: FieldRef<"Invoice", 'DateTime'>
    readonly paidAt: FieldRef<"Invoice", 'DateTime'>
    readonly voidedAt: FieldRef<"Invoice", 'DateTime'>
    readonly approvedAt: FieldRef<"Invoice", 'DateTime'>
    readonly approvedByName: FieldRef<"Invoice", 'String'>
    readonly approvedByEmail: FieldRef<"Invoice", 'String'>
    readonly declinedAt: FieldRef<"Invoice", 'DateTime'>
    readonly declinedByName: FieldRef<"Invoice", 'String'>
    readonly declinedByEmail: FieldRef<"Invoice", 'String'>
    readonly declineReason: FieldRef<"Invoice", 'String'>
    readonly createdByUserId: FieldRef<"Invoice", 'String'>
    readonly recurringScheduleId: FieldRef<"Invoice", 'String'>
    readonly createdAt: FieldRef<"Invoice", 'DateTime'>
    readonly updatedAt: FieldRef<"Invoice", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Invoice findUnique
   */
  export type InvoiceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice findUniqueOrThrow
   */
  export type InvoiceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice findFirst
   */
  export type InvoiceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invoices.
     */
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice findFirstOrThrow
   */
  export type InvoiceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invoices.
     */
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice findMany
   */
  export type InvoiceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoices to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice create
   */
  export type InvoiceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * The data needed to create a Invoice.
     */
    data: XOR<InvoiceCreateInput, InvoiceUncheckedCreateInput>
  }

  /**
   * Invoice createMany
   */
  export type InvoiceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Invoices.
     */
    data: InvoiceCreateManyInput | InvoiceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Invoice createManyAndReturn
   */
  export type InvoiceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Invoices.
     */
    data: InvoiceCreateManyInput | InvoiceCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Invoice update
   */
  export type InvoiceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * The data needed to update a Invoice.
     */
    data: XOR<InvoiceUpdateInput, InvoiceUncheckedUpdateInput>
    /**
     * Choose, which Invoice to update.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice updateMany
   */
  export type InvoiceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Invoices.
     */
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyInput>
    /**
     * Filter which Invoices to update
     */
    where?: InvoiceWhereInput
  }

  /**
   * Invoice upsert
   */
  export type InvoiceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * The filter to search for the Invoice to update in case it exists.
     */
    where: InvoiceWhereUniqueInput
    /**
     * In case the Invoice found by the `where` argument doesn't exist, create a new Invoice with this data.
     */
    create: XOR<InvoiceCreateInput, InvoiceUncheckedCreateInput>
    /**
     * In case the Invoice was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InvoiceUpdateInput, InvoiceUncheckedUpdateInput>
  }

  /**
   * Invoice delete
   */
  export type InvoiceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter which Invoice to delete.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice deleteMany
   */
  export type InvoiceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invoices to delete
     */
    where?: InvoiceWhereInput
  }

  /**
   * Invoice.quote
   */
  export type Invoice$quoteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    where?: QuoteWhereInput
  }

  /**
   * Invoice.recurringSchedule
   */
  export type Invoice$recurringScheduleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    where?: RecurringScheduleWhereInput
  }

  /**
   * Invoice.lineItems
   */
  export type Invoice$lineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    where?: InvoiceLineItemWhereInput
    orderBy?: InvoiceLineItemOrderByWithRelationInput | InvoiceLineItemOrderByWithRelationInput[]
    cursor?: InvoiceLineItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InvoiceLineItemScalarFieldEnum | InvoiceLineItemScalarFieldEnum[]
  }

  /**
   * Invoice.payments
   */
  export type Invoice$paymentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    where?: PaymentWhereInput
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    cursor?: PaymentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Invoice without action
   */
  export type InvoiceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
  }


  /**
   * Model InvoiceLineItem
   */

  export type AggregateInvoiceLineItem = {
    _count: InvoiceLineItemCountAggregateOutputType | null
    _avg: InvoiceLineItemAvgAggregateOutputType | null
    _sum: InvoiceLineItemSumAggregateOutputType | null
    _min: InvoiceLineItemMinAggregateOutputType | null
    _max: InvoiceLineItemMaxAggregateOutputType | null
  }

  export type InvoiceLineItemAvgAggregateOutputType = {
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
    sortOrder: number | null
  }

  export type InvoiceLineItemSumAggregateOutputType = {
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
    sortOrder: number | null
  }

  export type InvoiceLineItemMinAggregateOutputType = {
    id: string | null
    invoiceId: string | null
    description: string | null
    category: $Enums.LineItemCategory | null
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
    taxable: boolean | null
    sortOrder: number | null
  }

  export type InvoiceLineItemMaxAggregateOutputType = {
    id: string | null
    invoiceId: string | null
    description: string | null
    category: $Enums.LineItemCategory | null
    quantity: Decimal | null
    unitPrice: Decimal | null
    lineTotal: Decimal | null
    taxable: boolean | null
    sortOrder: number | null
  }

  export type InvoiceLineItemCountAggregateOutputType = {
    id: number
    invoiceId: number
    description: number
    category: number
    quantity: number
    unitPrice: number
    lineTotal: number
    taxable: number
    sortOrder: number
    _all: number
  }


  export type InvoiceLineItemAvgAggregateInputType = {
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    sortOrder?: true
  }

  export type InvoiceLineItemSumAggregateInputType = {
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    sortOrder?: true
  }

  export type InvoiceLineItemMinAggregateInputType = {
    id?: true
    invoiceId?: true
    description?: true
    category?: true
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    taxable?: true
    sortOrder?: true
  }

  export type InvoiceLineItemMaxAggregateInputType = {
    id?: true
    invoiceId?: true
    description?: true
    category?: true
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    taxable?: true
    sortOrder?: true
  }

  export type InvoiceLineItemCountAggregateInputType = {
    id?: true
    invoiceId?: true
    description?: true
    category?: true
    quantity?: true
    unitPrice?: true
    lineTotal?: true
    taxable?: true
    sortOrder?: true
    _all?: true
  }

  export type InvoiceLineItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InvoiceLineItem to aggregate.
     */
    where?: InvoiceLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InvoiceLineItems to fetch.
     */
    orderBy?: InvoiceLineItemOrderByWithRelationInput | InvoiceLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InvoiceLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InvoiceLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InvoiceLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned InvoiceLineItems
    **/
    _count?: true | InvoiceLineItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InvoiceLineItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InvoiceLineItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InvoiceLineItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InvoiceLineItemMaxAggregateInputType
  }

  export type GetInvoiceLineItemAggregateType<T extends InvoiceLineItemAggregateArgs> = {
        [P in keyof T & keyof AggregateInvoiceLineItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInvoiceLineItem[P]>
      : GetScalarType<T[P], AggregateInvoiceLineItem[P]>
  }




  export type InvoiceLineItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceLineItemWhereInput
    orderBy?: InvoiceLineItemOrderByWithAggregationInput | InvoiceLineItemOrderByWithAggregationInput[]
    by: InvoiceLineItemScalarFieldEnum[] | InvoiceLineItemScalarFieldEnum
    having?: InvoiceLineItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InvoiceLineItemCountAggregateInputType | true
    _avg?: InvoiceLineItemAvgAggregateInputType
    _sum?: InvoiceLineItemSumAggregateInputType
    _min?: InvoiceLineItemMinAggregateInputType
    _max?: InvoiceLineItemMaxAggregateInputType
  }

  export type InvoiceLineItemGroupByOutputType = {
    id: string
    invoiceId: string
    description: string
    category: $Enums.LineItemCategory
    quantity: Decimal
    unitPrice: Decimal
    lineTotal: Decimal
    taxable: boolean
    sortOrder: number
    _count: InvoiceLineItemCountAggregateOutputType | null
    _avg: InvoiceLineItemAvgAggregateOutputType | null
    _sum: InvoiceLineItemSumAggregateOutputType | null
    _min: InvoiceLineItemMinAggregateOutputType | null
    _max: InvoiceLineItemMaxAggregateOutputType | null
  }

  type GetInvoiceLineItemGroupByPayload<T extends InvoiceLineItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InvoiceLineItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InvoiceLineItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InvoiceLineItemGroupByOutputType[P]>
            : GetScalarType<T[P], InvoiceLineItemGroupByOutputType[P]>
        }
      >
    >


  export type InvoiceLineItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invoiceId?: boolean
    description?: boolean
    category?: boolean
    quantity?: boolean
    unitPrice?: boolean
    lineTotal?: boolean
    taxable?: boolean
    sortOrder?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoiceLineItem"]>

  export type InvoiceLineItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invoiceId?: boolean
    description?: boolean
    category?: boolean
    quantity?: boolean
    unitPrice?: boolean
    lineTotal?: boolean
    taxable?: boolean
    sortOrder?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoiceLineItem"]>

  export type InvoiceLineItemSelectScalar = {
    id?: boolean
    invoiceId?: boolean
    description?: boolean
    category?: boolean
    quantity?: boolean
    unitPrice?: boolean
    lineTotal?: boolean
    taxable?: boolean
    sortOrder?: boolean
  }

  export type InvoiceLineItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }
  export type InvoiceLineItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }

  export type $InvoiceLineItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "InvoiceLineItem"
    objects: {
      invoice: Prisma.$InvoicePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      invoiceId: string
      description: string
      category: $Enums.LineItemCategory
      quantity: Prisma.Decimal
      unitPrice: Prisma.Decimal
      lineTotal: Prisma.Decimal
      taxable: boolean
      sortOrder: number
    }, ExtArgs["result"]["invoiceLineItem"]>
    composites: {}
  }

  type InvoiceLineItemGetPayload<S extends boolean | null | undefined | InvoiceLineItemDefaultArgs> = $Result.GetResult<Prisma.$InvoiceLineItemPayload, S>

  type InvoiceLineItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<InvoiceLineItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: InvoiceLineItemCountAggregateInputType | true
    }

  export interface InvoiceLineItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['InvoiceLineItem'], meta: { name: 'InvoiceLineItem' } }
    /**
     * Find zero or one InvoiceLineItem that matches the filter.
     * @param {InvoiceLineItemFindUniqueArgs} args - Arguments to find a InvoiceLineItem
     * @example
     * // Get one InvoiceLineItem
     * const invoiceLineItem = await prisma.invoiceLineItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InvoiceLineItemFindUniqueArgs>(args: SelectSubset<T, InvoiceLineItemFindUniqueArgs<ExtArgs>>): Prisma__InvoiceLineItemClient<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one InvoiceLineItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {InvoiceLineItemFindUniqueOrThrowArgs} args - Arguments to find a InvoiceLineItem
     * @example
     * // Get one InvoiceLineItem
     * const invoiceLineItem = await prisma.invoiceLineItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InvoiceLineItemFindUniqueOrThrowArgs>(args: SelectSubset<T, InvoiceLineItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InvoiceLineItemClient<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first InvoiceLineItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceLineItemFindFirstArgs} args - Arguments to find a InvoiceLineItem
     * @example
     * // Get one InvoiceLineItem
     * const invoiceLineItem = await prisma.invoiceLineItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InvoiceLineItemFindFirstArgs>(args?: SelectSubset<T, InvoiceLineItemFindFirstArgs<ExtArgs>>): Prisma__InvoiceLineItemClient<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first InvoiceLineItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceLineItemFindFirstOrThrowArgs} args - Arguments to find a InvoiceLineItem
     * @example
     * // Get one InvoiceLineItem
     * const invoiceLineItem = await prisma.invoiceLineItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InvoiceLineItemFindFirstOrThrowArgs>(args?: SelectSubset<T, InvoiceLineItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__InvoiceLineItemClient<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more InvoiceLineItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceLineItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InvoiceLineItems
     * const invoiceLineItems = await prisma.invoiceLineItem.findMany()
     * 
     * // Get first 10 InvoiceLineItems
     * const invoiceLineItems = await prisma.invoiceLineItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const invoiceLineItemWithIdOnly = await prisma.invoiceLineItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InvoiceLineItemFindManyArgs>(args?: SelectSubset<T, InvoiceLineItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a InvoiceLineItem.
     * @param {InvoiceLineItemCreateArgs} args - Arguments to create a InvoiceLineItem.
     * @example
     * // Create one InvoiceLineItem
     * const InvoiceLineItem = await prisma.invoiceLineItem.create({
     *   data: {
     *     // ... data to create a InvoiceLineItem
     *   }
     * })
     * 
     */
    create<T extends InvoiceLineItemCreateArgs>(args: SelectSubset<T, InvoiceLineItemCreateArgs<ExtArgs>>): Prisma__InvoiceLineItemClient<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many InvoiceLineItems.
     * @param {InvoiceLineItemCreateManyArgs} args - Arguments to create many InvoiceLineItems.
     * @example
     * // Create many InvoiceLineItems
     * const invoiceLineItem = await prisma.invoiceLineItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InvoiceLineItemCreateManyArgs>(args?: SelectSubset<T, InvoiceLineItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many InvoiceLineItems and returns the data saved in the database.
     * @param {InvoiceLineItemCreateManyAndReturnArgs} args - Arguments to create many InvoiceLineItems.
     * @example
     * // Create many InvoiceLineItems
     * const invoiceLineItem = await prisma.invoiceLineItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many InvoiceLineItems and only return the `id`
     * const invoiceLineItemWithIdOnly = await prisma.invoiceLineItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InvoiceLineItemCreateManyAndReturnArgs>(args?: SelectSubset<T, InvoiceLineItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a InvoiceLineItem.
     * @param {InvoiceLineItemDeleteArgs} args - Arguments to delete one InvoiceLineItem.
     * @example
     * // Delete one InvoiceLineItem
     * const InvoiceLineItem = await prisma.invoiceLineItem.delete({
     *   where: {
     *     // ... filter to delete one InvoiceLineItem
     *   }
     * })
     * 
     */
    delete<T extends InvoiceLineItemDeleteArgs>(args: SelectSubset<T, InvoiceLineItemDeleteArgs<ExtArgs>>): Prisma__InvoiceLineItemClient<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one InvoiceLineItem.
     * @param {InvoiceLineItemUpdateArgs} args - Arguments to update one InvoiceLineItem.
     * @example
     * // Update one InvoiceLineItem
     * const invoiceLineItem = await prisma.invoiceLineItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InvoiceLineItemUpdateArgs>(args: SelectSubset<T, InvoiceLineItemUpdateArgs<ExtArgs>>): Prisma__InvoiceLineItemClient<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more InvoiceLineItems.
     * @param {InvoiceLineItemDeleteManyArgs} args - Arguments to filter InvoiceLineItems to delete.
     * @example
     * // Delete a few InvoiceLineItems
     * const { count } = await prisma.invoiceLineItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InvoiceLineItemDeleteManyArgs>(args?: SelectSubset<T, InvoiceLineItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InvoiceLineItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceLineItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InvoiceLineItems
     * const invoiceLineItem = await prisma.invoiceLineItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InvoiceLineItemUpdateManyArgs>(args: SelectSubset<T, InvoiceLineItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one InvoiceLineItem.
     * @param {InvoiceLineItemUpsertArgs} args - Arguments to update or create a InvoiceLineItem.
     * @example
     * // Update or create a InvoiceLineItem
     * const invoiceLineItem = await prisma.invoiceLineItem.upsert({
     *   create: {
     *     // ... data to create a InvoiceLineItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InvoiceLineItem we want to update
     *   }
     * })
     */
    upsert<T extends InvoiceLineItemUpsertArgs>(args: SelectSubset<T, InvoiceLineItemUpsertArgs<ExtArgs>>): Prisma__InvoiceLineItemClient<$Result.GetResult<Prisma.$InvoiceLineItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of InvoiceLineItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceLineItemCountArgs} args - Arguments to filter InvoiceLineItems to count.
     * @example
     * // Count the number of InvoiceLineItems
     * const count = await prisma.invoiceLineItem.count({
     *   where: {
     *     // ... the filter for the InvoiceLineItems we want to count
     *   }
     * })
    **/
    count<T extends InvoiceLineItemCountArgs>(
      args?: Subset<T, InvoiceLineItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InvoiceLineItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a InvoiceLineItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceLineItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends InvoiceLineItemAggregateArgs>(args: Subset<T, InvoiceLineItemAggregateArgs>): Prisma.PrismaPromise<GetInvoiceLineItemAggregateType<T>>

    /**
     * Group by InvoiceLineItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceLineItemGroupByArgs} args - Group by arguments.
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
      T extends InvoiceLineItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InvoiceLineItemGroupByArgs['orderBy'] }
        : { orderBy?: InvoiceLineItemGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, InvoiceLineItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvoiceLineItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the InvoiceLineItem model
   */
  readonly fields: InvoiceLineItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InvoiceLineItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InvoiceLineItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    invoice<T extends InvoiceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InvoiceDefaultArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the InvoiceLineItem model
   */ 
  interface InvoiceLineItemFieldRefs {
    readonly id: FieldRef<"InvoiceLineItem", 'String'>
    readonly invoiceId: FieldRef<"InvoiceLineItem", 'String'>
    readonly description: FieldRef<"InvoiceLineItem", 'String'>
    readonly category: FieldRef<"InvoiceLineItem", 'LineItemCategory'>
    readonly quantity: FieldRef<"InvoiceLineItem", 'Decimal'>
    readonly unitPrice: FieldRef<"InvoiceLineItem", 'Decimal'>
    readonly lineTotal: FieldRef<"InvoiceLineItem", 'Decimal'>
    readonly taxable: FieldRef<"InvoiceLineItem", 'Boolean'>
    readonly sortOrder: FieldRef<"InvoiceLineItem", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * InvoiceLineItem findUnique
   */
  export type InvoiceLineItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceLineItem to fetch.
     */
    where: InvoiceLineItemWhereUniqueInput
  }

  /**
   * InvoiceLineItem findUniqueOrThrow
   */
  export type InvoiceLineItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceLineItem to fetch.
     */
    where: InvoiceLineItemWhereUniqueInput
  }

  /**
   * InvoiceLineItem findFirst
   */
  export type InvoiceLineItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceLineItem to fetch.
     */
    where?: InvoiceLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InvoiceLineItems to fetch.
     */
    orderBy?: InvoiceLineItemOrderByWithRelationInput | InvoiceLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InvoiceLineItems.
     */
    cursor?: InvoiceLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InvoiceLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InvoiceLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InvoiceLineItems.
     */
    distinct?: InvoiceLineItemScalarFieldEnum | InvoiceLineItemScalarFieldEnum[]
  }

  /**
   * InvoiceLineItem findFirstOrThrow
   */
  export type InvoiceLineItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceLineItem to fetch.
     */
    where?: InvoiceLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InvoiceLineItems to fetch.
     */
    orderBy?: InvoiceLineItemOrderByWithRelationInput | InvoiceLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InvoiceLineItems.
     */
    cursor?: InvoiceLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InvoiceLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InvoiceLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InvoiceLineItems.
     */
    distinct?: InvoiceLineItemScalarFieldEnum | InvoiceLineItemScalarFieldEnum[]
  }

  /**
   * InvoiceLineItem findMany
   */
  export type InvoiceLineItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceLineItems to fetch.
     */
    where?: InvoiceLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InvoiceLineItems to fetch.
     */
    orderBy?: InvoiceLineItemOrderByWithRelationInput | InvoiceLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing InvoiceLineItems.
     */
    cursor?: InvoiceLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InvoiceLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InvoiceLineItems.
     */
    skip?: number
    distinct?: InvoiceLineItemScalarFieldEnum | InvoiceLineItemScalarFieldEnum[]
  }

  /**
   * InvoiceLineItem create
   */
  export type InvoiceLineItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    /**
     * The data needed to create a InvoiceLineItem.
     */
    data: XOR<InvoiceLineItemCreateInput, InvoiceLineItemUncheckedCreateInput>
  }

  /**
   * InvoiceLineItem createMany
   */
  export type InvoiceLineItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many InvoiceLineItems.
     */
    data: InvoiceLineItemCreateManyInput | InvoiceLineItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * InvoiceLineItem createManyAndReturn
   */
  export type InvoiceLineItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many InvoiceLineItems.
     */
    data: InvoiceLineItemCreateManyInput | InvoiceLineItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * InvoiceLineItem update
   */
  export type InvoiceLineItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    /**
     * The data needed to update a InvoiceLineItem.
     */
    data: XOR<InvoiceLineItemUpdateInput, InvoiceLineItemUncheckedUpdateInput>
    /**
     * Choose, which InvoiceLineItem to update.
     */
    where: InvoiceLineItemWhereUniqueInput
  }

  /**
   * InvoiceLineItem updateMany
   */
  export type InvoiceLineItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update InvoiceLineItems.
     */
    data: XOR<InvoiceLineItemUpdateManyMutationInput, InvoiceLineItemUncheckedUpdateManyInput>
    /**
     * Filter which InvoiceLineItems to update
     */
    where?: InvoiceLineItemWhereInput
  }

  /**
   * InvoiceLineItem upsert
   */
  export type InvoiceLineItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    /**
     * The filter to search for the InvoiceLineItem to update in case it exists.
     */
    where: InvoiceLineItemWhereUniqueInput
    /**
     * In case the InvoiceLineItem found by the `where` argument doesn't exist, create a new InvoiceLineItem with this data.
     */
    create: XOR<InvoiceLineItemCreateInput, InvoiceLineItemUncheckedCreateInput>
    /**
     * In case the InvoiceLineItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InvoiceLineItemUpdateInput, InvoiceLineItemUncheckedUpdateInput>
  }

  /**
   * InvoiceLineItem delete
   */
  export type InvoiceLineItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
    /**
     * Filter which InvoiceLineItem to delete.
     */
    where: InvoiceLineItemWhereUniqueInput
  }

  /**
   * InvoiceLineItem deleteMany
   */
  export type InvoiceLineItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InvoiceLineItems to delete
     */
    where?: InvoiceLineItemWhereInput
  }

  /**
   * InvoiceLineItem without action
   */
  export type InvoiceLineItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceLineItem
     */
    select?: InvoiceLineItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceLineItemInclude<ExtArgs> | null
  }


  /**
   * Model Payment
   */

  export type AggregatePayment = {
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  export type PaymentAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type PaymentSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type PaymentMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    invoiceId: string | null
    amount: Decimal | null
    paymentMethod: $Enums.PaymentMethod | null
    status: $Enums.PaymentStatus | null
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
    quickbooksId: string | null
    paidAt: Date | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    invoiceId: string | null
    amount: Decimal | null
    paymentMethod: $Enums.PaymentMethod | null
    status: $Enums.PaymentStatus | null
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
    quickbooksId: string | null
    paidAt: Date | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentCountAggregateOutputType = {
    id: number
    companyId: number
    invoiceId: number
    amount: number
    paymentMethod: number
    status: number
    stripePaymentIntentId: number
    stripeChargeId: number
    quickbooksId: number
    paidAt: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PaymentAvgAggregateInputType = {
    amount?: true
  }

  export type PaymentSumAggregateInputType = {
    amount?: true
  }

  export type PaymentMinAggregateInputType = {
    id?: true
    companyId?: true
    invoiceId?: true
    amount?: true
    paymentMethod?: true
    status?: true
    stripePaymentIntentId?: true
    stripeChargeId?: true
    quickbooksId?: true
    paidAt?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentMaxAggregateInputType = {
    id?: true
    companyId?: true
    invoiceId?: true
    amount?: true
    paymentMethod?: true
    status?: true
    stripePaymentIntentId?: true
    stripeChargeId?: true
    quickbooksId?: true
    paidAt?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentCountAggregateInputType = {
    id?: true
    companyId?: true
    invoiceId?: true
    amount?: true
    paymentMethod?: true
    status?: true
    stripePaymentIntentId?: true
    stripeChargeId?: true
    quickbooksId?: true
    paidAt?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PaymentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payment to aggregate.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Payments
    **/
    _count?: true | PaymentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PaymentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PaymentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PaymentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PaymentMaxAggregateInputType
  }

  export type GetPaymentAggregateType<T extends PaymentAggregateArgs> = {
        [P in keyof T & keyof AggregatePayment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayment[P]>
      : GetScalarType<T[P], AggregatePayment[P]>
  }




  export type PaymentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentWhereInput
    orderBy?: PaymentOrderByWithAggregationInput | PaymentOrderByWithAggregationInput[]
    by: PaymentScalarFieldEnum[] | PaymentScalarFieldEnum
    having?: PaymentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PaymentCountAggregateInputType | true
    _avg?: PaymentAvgAggregateInputType
    _sum?: PaymentSumAggregateInputType
    _min?: PaymentMinAggregateInputType
    _max?: PaymentMaxAggregateInputType
  }

  export type PaymentGroupByOutputType = {
    id: string
    companyId: string
    invoiceId: string
    amount: Decimal
    paymentMethod: $Enums.PaymentMethod
    status: $Enums.PaymentStatus
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
    quickbooksId: string | null
    paidAt: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  type GetPaymentGroupByPayload<T extends PaymentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PaymentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PaymentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PaymentGroupByOutputType[P]>
            : GetScalarType<T[P], PaymentGroupByOutputType[P]>
        }
      >
    >


  export type PaymentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    invoiceId?: boolean
    amount?: boolean
    paymentMethod?: boolean
    status?: boolean
    stripePaymentIntentId?: boolean
    stripeChargeId?: boolean
    quickbooksId?: boolean
    paidAt?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    invoiceId?: boolean
    amount?: boolean
    paymentMethod?: boolean
    status?: boolean
    stripePaymentIntentId?: boolean
    stripeChargeId?: boolean
    quickbooksId?: boolean
    paidAt?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectScalar = {
    id?: boolean
    companyId?: boolean
    invoiceId?: boolean
    amount?: boolean
    paymentMethod?: boolean
    status?: boolean
    stripePaymentIntentId?: boolean
    stripeChargeId?: boolean
    quickbooksId?: boolean
    paidAt?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PaymentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }
  export type PaymentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }

  export type $PaymentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Payment"
    objects: {
      invoice: Prisma.$InvoicePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      invoiceId: string
      amount: Prisma.Decimal
      paymentMethod: $Enums.PaymentMethod
      status: $Enums.PaymentStatus
      stripePaymentIntentId: string | null
      stripeChargeId: string | null
      quickbooksId: string | null
      paidAt: Date | null
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["payment"]>
    composites: {}
  }

  type PaymentGetPayload<S extends boolean | null | undefined | PaymentDefaultArgs> = $Result.GetResult<Prisma.$PaymentPayload, S>

  type PaymentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PaymentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PaymentCountAggregateInputType | true
    }

  export interface PaymentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Payment'], meta: { name: 'Payment' } }
    /**
     * Find zero or one Payment that matches the filter.
     * @param {PaymentFindUniqueArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PaymentFindUniqueArgs>(args: SelectSubset<T, PaymentFindUniqueArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Payment that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PaymentFindUniqueOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PaymentFindUniqueOrThrowArgs>(args: SelectSubset<T, PaymentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Payment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PaymentFindFirstArgs>(args?: SelectSubset<T, PaymentFindFirstArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Payment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PaymentFindFirstOrThrowArgs>(args?: SelectSubset<T, PaymentFindFirstOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Payments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Payments
     * const payments = await prisma.payment.findMany()
     * 
     * // Get first 10 Payments
     * const payments = await prisma.payment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const paymentWithIdOnly = await prisma.payment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PaymentFindManyArgs>(args?: SelectSubset<T, PaymentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Payment.
     * @param {PaymentCreateArgs} args - Arguments to create a Payment.
     * @example
     * // Create one Payment
     * const Payment = await prisma.payment.create({
     *   data: {
     *     // ... data to create a Payment
     *   }
     * })
     * 
     */
    create<T extends PaymentCreateArgs>(args: SelectSubset<T, PaymentCreateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Payments.
     * @param {PaymentCreateManyArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PaymentCreateManyArgs>(args?: SelectSubset<T, PaymentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Payments and returns the data saved in the database.
     * @param {PaymentCreateManyAndReturnArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Payments and only return the `id`
     * const paymentWithIdOnly = await prisma.payment.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PaymentCreateManyAndReturnArgs>(args?: SelectSubset<T, PaymentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Payment.
     * @param {PaymentDeleteArgs} args - Arguments to delete one Payment.
     * @example
     * // Delete one Payment
     * const Payment = await prisma.payment.delete({
     *   where: {
     *     // ... filter to delete one Payment
     *   }
     * })
     * 
     */
    delete<T extends PaymentDeleteArgs>(args: SelectSubset<T, PaymentDeleteArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Payment.
     * @param {PaymentUpdateArgs} args - Arguments to update one Payment.
     * @example
     * // Update one Payment
     * const payment = await prisma.payment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PaymentUpdateArgs>(args: SelectSubset<T, PaymentUpdateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Payments.
     * @param {PaymentDeleteManyArgs} args - Arguments to filter Payments to delete.
     * @example
     * // Delete a few Payments
     * const { count } = await prisma.payment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PaymentDeleteManyArgs>(args?: SelectSubset<T, PaymentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Payments
     * const payment = await prisma.payment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PaymentUpdateManyArgs>(args: SelectSubset<T, PaymentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Payment.
     * @param {PaymentUpsertArgs} args - Arguments to update or create a Payment.
     * @example
     * // Update or create a Payment
     * const payment = await prisma.payment.upsert({
     *   create: {
     *     // ... data to create a Payment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Payment we want to update
     *   }
     * })
     */
    upsert<T extends PaymentUpsertArgs>(args: SelectSubset<T, PaymentUpsertArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentCountArgs} args - Arguments to filter Payments to count.
     * @example
     * // Count the number of Payments
     * const count = await prisma.payment.count({
     *   where: {
     *     // ... the filter for the Payments we want to count
     *   }
     * })
    **/
    count<T extends PaymentCountArgs>(
      args?: Subset<T, PaymentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PaymentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PaymentAggregateArgs>(args: Subset<T, PaymentAggregateArgs>): Prisma.PrismaPromise<GetPaymentAggregateType<T>>

    /**
     * Group by Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentGroupByArgs} args - Group by arguments.
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
      T extends PaymentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PaymentGroupByArgs['orderBy'] }
        : { orderBy?: PaymentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PaymentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPaymentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Payment model
   */
  readonly fields: PaymentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Payment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PaymentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    invoice<T extends InvoiceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InvoiceDefaultArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the Payment model
   */ 
  interface PaymentFieldRefs {
    readonly id: FieldRef<"Payment", 'String'>
    readonly companyId: FieldRef<"Payment", 'String'>
    readonly invoiceId: FieldRef<"Payment", 'String'>
    readonly amount: FieldRef<"Payment", 'Decimal'>
    readonly paymentMethod: FieldRef<"Payment", 'PaymentMethod'>
    readonly status: FieldRef<"Payment", 'PaymentStatus'>
    readonly stripePaymentIntentId: FieldRef<"Payment", 'String'>
    readonly stripeChargeId: FieldRef<"Payment", 'String'>
    readonly quickbooksId: FieldRef<"Payment", 'String'>
    readonly paidAt: FieldRef<"Payment", 'DateTime'>
    readonly notes: FieldRef<"Payment", 'String'>
    readonly createdAt: FieldRef<"Payment", 'DateTime'>
    readonly updatedAt: FieldRef<"Payment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Payment findUnique
   */
  export type PaymentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findUniqueOrThrow
   */
  export type PaymentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findFirst
   */
  export type PaymentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findFirstOrThrow
   */
  export type PaymentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findMany
   */
  export type PaymentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payments to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment create
   */
  export type PaymentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * The data needed to create a Payment.
     */
    data: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
  }

  /**
   * Payment createMany
   */
  export type PaymentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payment createManyAndReturn
   */
  export type PaymentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Payment update
   */
  export type PaymentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * The data needed to update a Payment.
     */
    data: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
    /**
     * Choose, which Payment to update.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment updateMany
   */
  export type PaymentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Payments.
     */
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyInput>
    /**
     * Filter which Payments to update
     */
    where?: PaymentWhereInput
  }

  /**
   * Payment upsert
   */
  export type PaymentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * The filter to search for the Payment to update in case it exists.
     */
    where: PaymentWhereUniqueInput
    /**
     * In case the Payment found by the `where` argument doesn't exist, create a new Payment with this data.
     */
    create: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
    /**
     * In case the Payment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
  }

  /**
   * Payment delete
   */
  export type PaymentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter which Payment to delete.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment deleteMany
   */
  export type PaymentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payments to delete
     */
    where?: PaymentWhereInput
  }

  /**
   * Payment without action
   */
  export type PaymentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
  }


  /**
   * Model RecurringSchedule
   */

  export type AggregateRecurringSchedule = {
    _count: RecurringScheduleCountAggregateOutputType | null
    _avg: RecurringScheduleAvgAggregateOutputType | null
    _sum: RecurringScheduleSumAggregateOutputType | null
    _min: RecurringScheduleMinAggregateOutputType | null
    _max: RecurringScheduleMaxAggregateOutputType | null
  }

  export type RecurringScheduleAvgAggregateOutputType = {
    amount: Decimal | null
    taxRate: Decimal | null
  }

  export type RecurringScheduleSumAggregateOutputType = {
    amount: Decimal | null
    taxRate: Decimal | null
  }

  export type RecurringScheduleMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    customerName: string | null
    customerEmail: string | null
    description: string | null
    frequency: $Enums.RecurringFrequency | null
    amount: Decimal | null
    taxRate: Decimal | null
    nextBillingDate: Date | null
    isActive: boolean | null
    jobId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecurringScheduleMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    customerId: string | null
    customerName: string | null
    customerEmail: string | null
    description: string | null
    frequency: $Enums.RecurringFrequency | null
    amount: Decimal | null
    taxRate: Decimal | null
    nextBillingDate: Date | null
    isActive: boolean | null
    jobId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecurringScheduleCountAggregateOutputType = {
    id: number
    companyId: number
    customerId: number
    customerName: number
    customerEmail: number
    description: number
    frequency: number
    amount: number
    taxRate: number
    nextBillingDate: number
    isActive: number
    jobId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type RecurringScheduleAvgAggregateInputType = {
    amount?: true
    taxRate?: true
  }

  export type RecurringScheduleSumAggregateInputType = {
    amount?: true
    taxRate?: true
  }

  export type RecurringScheduleMinAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    customerName?: true
    customerEmail?: true
    description?: true
    frequency?: true
    amount?: true
    taxRate?: true
    nextBillingDate?: true
    isActive?: true
    jobId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecurringScheduleMaxAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    customerName?: true
    customerEmail?: true
    description?: true
    frequency?: true
    amount?: true
    taxRate?: true
    nextBillingDate?: true
    isActive?: true
    jobId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecurringScheduleCountAggregateInputType = {
    id?: true
    companyId?: true
    customerId?: true
    customerName?: true
    customerEmail?: true
    description?: true
    frequency?: true
    amount?: true
    taxRate?: true
    nextBillingDate?: true
    isActive?: true
    jobId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type RecurringScheduleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecurringSchedule to aggregate.
     */
    where?: RecurringScheduleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecurringSchedules to fetch.
     */
    orderBy?: RecurringScheduleOrderByWithRelationInput | RecurringScheduleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RecurringScheduleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecurringSchedules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecurringSchedules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RecurringSchedules
    **/
    _count?: true | RecurringScheduleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RecurringScheduleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RecurringScheduleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RecurringScheduleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RecurringScheduleMaxAggregateInputType
  }

  export type GetRecurringScheduleAggregateType<T extends RecurringScheduleAggregateArgs> = {
        [P in keyof T & keyof AggregateRecurringSchedule]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRecurringSchedule[P]>
      : GetScalarType<T[P], AggregateRecurringSchedule[P]>
  }




  export type RecurringScheduleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecurringScheduleWhereInput
    orderBy?: RecurringScheduleOrderByWithAggregationInput | RecurringScheduleOrderByWithAggregationInput[]
    by: RecurringScheduleScalarFieldEnum[] | RecurringScheduleScalarFieldEnum
    having?: RecurringScheduleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RecurringScheduleCountAggregateInputType | true
    _avg?: RecurringScheduleAvgAggregateInputType
    _sum?: RecurringScheduleSumAggregateInputType
    _min?: RecurringScheduleMinAggregateInputType
    _max?: RecurringScheduleMaxAggregateInputType
  }

  export type RecurringScheduleGroupByOutputType = {
    id: string
    companyId: string
    customerId: string
    customerName: string
    customerEmail: string
    description: string
    frequency: $Enums.RecurringFrequency
    amount: Decimal
    taxRate: Decimal
    nextBillingDate: Date
    isActive: boolean
    jobId: string | null
    createdAt: Date
    updatedAt: Date
    _count: RecurringScheduleCountAggregateOutputType | null
    _avg: RecurringScheduleAvgAggregateOutputType | null
    _sum: RecurringScheduleSumAggregateOutputType | null
    _min: RecurringScheduleMinAggregateOutputType | null
    _max: RecurringScheduleMaxAggregateOutputType | null
  }

  type GetRecurringScheduleGroupByPayload<T extends RecurringScheduleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RecurringScheduleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RecurringScheduleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RecurringScheduleGroupByOutputType[P]>
            : GetScalarType<T[P], RecurringScheduleGroupByOutputType[P]>
        }
      >
    >


  export type RecurringScheduleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    description?: boolean
    frequency?: boolean
    amount?: boolean
    taxRate?: boolean
    nextBillingDate?: boolean
    isActive?: boolean
    jobId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invoices?: boolean | RecurringSchedule$invoicesArgs<ExtArgs>
    _count?: boolean | RecurringScheduleCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recurringSchedule"]>

  export type RecurringScheduleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    description?: boolean
    frequency?: boolean
    amount?: boolean
    taxRate?: boolean
    nextBillingDate?: boolean
    isActive?: boolean
    jobId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["recurringSchedule"]>

  export type RecurringScheduleSelectScalar = {
    id?: boolean
    companyId?: boolean
    customerId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    description?: boolean
    frequency?: boolean
    amount?: boolean
    taxRate?: boolean
    nextBillingDate?: boolean
    isActive?: boolean
    jobId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type RecurringScheduleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoices?: boolean | RecurringSchedule$invoicesArgs<ExtArgs>
    _count?: boolean | RecurringScheduleCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type RecurringScheduleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $RecurringSchedulePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RecurringSchedule"
    objects: {
      invoices: Prisma.$InvoicePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      customerId: string
      customerName: string
      customerEmail: string
      description: string
      frequency: $Enums.RecurringFrequency
      amount: Prisma.Decimal
      taxRate: Prisma.Decimal
      nextBillingDate: Date
      isActive: boolean
      jobId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["recurringSchedule"]>
    composites: {}
  }

  type RecurringScheduleGetPayload<S extends boolean | null | undefined | RecurringScheduleDefaultArgs> = $Result.GetResult<Prisma.$RecurringSchedulePayload, S>

  type RecurringScheduleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<RecurringScheduleFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: RecurringScheduleCountAggregateInputType | true
    }

  export interface RecurringScheduleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RecurringSchedule'], meta: { name: 'RecurringSchedule' } }
    /**
     * Find zero or one RecurringSchedule that matches the filter.
     * @param {RecurringScheduleFindUniqueArgs} args - Arguments to find a RecurringSchedule
     * @example
     * // Get one RecurringSchedule
     * const recurringSchedule = await prisma.recurringSchedule.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RecurringScheduleFindUniqueArgs>(args: SelectSubset<T, RecurringScheduleFindUniqueArgs<ExtArgs>>): Prisma__RecurringScheduleClient<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one RecurringSchedule that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {RecurringScheduleFindUniqueOrThrowArgs} args - Arguments to find a RecurringSchedule
     * @example
     * // Get one RecurringSchedule
     * const recurringSchedule = await prisma.recurringSchedule.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RecurringScheduleFindUniqueOrThrowArgs>(args: SelectSubset<T, RecurringScheduleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RecurringScheduleClient<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first RecurringSchedule that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecurringScheduleFindFirstArgs} args - Arguments to find a RecurringSchedule
     * @example
     * // Get one RecurringSchedule
     * const recurringSchedule = await prisma.recurringSchedule.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RecurringScheduleFindFirstArgs>(args?: SelectSubset<T, RecurringScheduleFindFirstArgs<ExtArgs>>): Prisma__RecurringScheduleClient<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first RecurringSchedule that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecurringScheduleFindFirstOrThrowArgs} args - Arguments to find a RecurringSchedule
     * @example
     * // Get one RecurringSchedule
     * const recurringSchedule = await prisma.recurringSchedule.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RecurringScheduleFindFirstOrThrowArgs>(args?: SelectSubset<T, RecurringScheduleFindFirstOrThrowArgs<ExtArgs>>): Prisma__RecurringScheduleClient<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more RecurringSchedules that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecurringScheduleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RecurringSchedules
     * const recurringSchedules = await prisma.recurringSchedule.findMany()
     * 
     * // Get first 10 RecurringSchedules
     * const recurringSchedules = await prisma.recurringSchedule.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const recurringScheduleWithIdOnly = await prisma.recurringSchedule.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RecurringScheduleFindManyArgs>(args?: SelectSubset<T, RecurringScheduleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a RecurringSchedule.
     * @param {RecurringScheduleCreateArgs} args - Arguments to create a RecurringSchedule.
     * @example
     * // Create one RecurringSchedule
     * const RecurringSchedule = await prisma.recurringSchedule.create({
     *   data: {
     *     // ... data to create a RecurringSchedule
     *   }
     * })
     * 
     */
    create<T extends RecurringScheduleCreateArgs>(args: SelectSubset<T, RecurringScheduleCreateArgs<ExtArgs>>): Prisma__RecurringScheduleClient<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many RecurringSchedules.
     * @param {RecurringScheduleCreateManyArgs} args - Arguments to create many RecurringSchedules.
     * @example
     * // Create many RecurringSchedules
     * const recurringSchedule = await prisma.recurringSchedule.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RecurringScheduleCreateManyArgs>(args?: SelectSubset<T, RecurringScheduleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RecurringSchedules and returns the data saved in the database.
     * @param {RecurringScheduleCreateManyAndReturnArgs} args - Arguments to create many RecurringSchedules.
     * @example
     * // Create many RecurringSchedules
     * const recurringSchedule = await prisma.recurringSchedule.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RecurringSchedules and only return the `id`
     * const recurringScheduleWithIdOnly = await prisma.recurringSchedule.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RecurringScheduleCreateManyAndReturnArgs>(args?: SelectSubset<T, RecurringScheduleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a RecurringSchedule.
     * @param {RecurringScheduleDeleteArgs} args - Arguments to delete one RecurringSchedule.
     * @example
     * // Delete one RecurringSchedule
     * const RecurringSchedule = await prisma.recurringSchedule.delete({
     *   where: {
     *     // ... filter to delete one RecurringSchedule
     *   }
     * })
     * 
     */
    delete<T extends RecurringScheduleDeleteArgs>(args: SelectSubset<T, RecurringScheduleDeleteArgs<ExtArgs>>): Prisma__RecurringScheduleClient<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one RecurringSchedule.
     * @param {RecurringScheduleUpdateArgs} args - Arguments to update one RecurringSchedule.
     * @example
     * // Update one RecurringSchedule
     * const recurringSchedule = await prisma.recurringSchedule.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RecurringScheduleUpdateArgs>(args: SelectSubset<T, RecurringScheduleUpdateArgs<ExtArgs>>): Prisma__RecurringScheduleClient<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more RecurringSchedules.
     * @param {RecurringScheduleDeleteManyArgs} args - Arguments to filter RecurringSchedules to delete.
     * @example
     * // Delete a few RecurringSchedules
     * const { count } = await prisma.recurringSchedule.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RecurringScheduleDeleteManyArgs>(args?: SelectSubset<T, RecurringScheduleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RecurringSchedules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecurringScheduleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RecurringSchedules
     * const recurringSchedule = await prisma.recurringSchedule.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RecurringScheduleUpdateManyArgs>(args: SelectSubset<T, RecurringScheduleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one RecurringSchedule.
     * @param {RecurringScheduleUpsertArgs} args - Arguments to update or create a RecurringSchedule.
     * @example
     * // Update or create a RecurringSchedule
     * const recurringSchedule = await prisma.recurringSchedule.upsert({
     *   create: {
     *     // ... data to create a RecurringSchedule
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RecurringSchedule we want to update
     *   }
     * })
     */
    upsert<T extends RecurringScheduleUpsertArgs>(args: SelectSubset<T, RecurringScheduleUpsertArgs<ExtArgs>>): Prisma__RecurringScheduleClient<$Result.GetResult<Prisma.$RecurringSchedulePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of RecurringSchedules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecurringScheduleCountArgs} args - Arguments to filter RecurringSchedules to count.
     * @example
     * // Count the number of RecurringSchedules
     * const count = await prisma.recurringSchedule.count({
     *   where: {
     *     // ... the filter for the RecurringSchedules we want to count
     *   }
     * })
    **/
    count<T extends RecurringScheduleCountArgs>(
      args?: Subset<T, RecurringScheduleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RecurringScheduleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RecurringSchedule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecurringScheduleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends RecurringScheduleAggregateArgs>(args: Subset<T, RecurringScheduleAggregateArgs>): Prisma.PrismaPromise<GetRecurringScheduleAggregateType<T>>

    /**
     * Group by RecurringSchedule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecurringScheduleGroupByArgs} args - Group by arguments.
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
      T extends RecurringScheduleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RecurringScheduleGroupByArgs['orderBy'] }
        : { orderBy?: RecurringScheduleGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, RecurringScheduleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRecurringScheduleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RecurringSchedule model
   */
  readonly fields: RecurringScheduleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RecurringSchedule.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RecurringScheduleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    invoices<T extends RecurringSchedule$invoicesArgs<ExtArgs> = {}>(args?: Subset<T, RecurringSchedule$invoicesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the RecurringSchedule model
   */ 
  interface RecurringScheduleFieldRefs {
    readonly id: FieldRef<"RecurringSchedule", 'String'>
    readonly companyId: FieldRef<"RecurringSchedule", 'String'>
    readonly customerId: FieldRef<"RecurringSchedule", 'String'>
    readonly customerName: FieldRef<"RecurringSchedule", 'String'>
    readonly customerEmail: FieldRef<"RecurringSchedule", 'String'>
    readonly description: FieldRef<"RecurringSchedule", 'String'>
    readonly frequency: FieldRef<"RecurringSchedule", 'RecurringFrequency'>
    readonly amount: FieldRef<"RecurringSchedule", 'Decimal'>
    readonly taxRate: FieldRef<"RecurringSchedule", 'Decimal'>
    readonly nextBillingDate: FieldRef<"RecurringSchedule", 'DateTime'>
    readonly isActive: FieldRef<"RecurringSchedule", 'Boolean'>
    readonly jobId: FieldRef<"RecurringSchedule", 'String'>
    readonly createdAt: FieldRef<"RecurringSchedule", 'DateTime'>
    readonly updatedAt: FieldRef<"RecurringSchedule", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * RecurringSchedule findUnique
   */
  export type RecurringScheduleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    /**
     * Filter, which RecurringSchedule to fetch.
     */
    where: RecurringScheduleWhereUniqueInput
  }

  /**
   * RecurringSchedule findUniqueOrThrow
   */
  export type RecurringScheduleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    /**
     * Filter, which RecurringSchedule to fetch.
     */
    where: RecurringScheduleWhereUniqueInput
  }

  /**
   * RecurringSchedule findFirst
   */
  export type RecurringScheduleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    /**
     * Filter, which RecurringSchedule to fetch.
     */
    where?: RecurringScheduleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecurringSchedules to fetch.
     */
    orderBy?: RecurringScheduleOrderByWithRelationInput | RecurringScheduleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecurringSchedules.
     */
    cursor?: RecurringScheduleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecurringSchedules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecurringSchedules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecurringSchedules.
     */
    distinct?: RecurringScheduleScalarFieldEnum | RecurringScheduleScalarFieldEnum[]
  }

  /**
   * RecurringSchedule findFirstOrThrow
   */
  export type RecurringScheduleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    /**
     * Filter, which RecurringSchedule to fetch.
     */
    where?: RecurringScheduleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecurringSchedules to fetch.
     */
    orderBy?: RecurringScheduleOrderByWithRelationInput | RecurringScheduleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecurringSchedules.
     */
    cursor?: RecurringScheduleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecurringSchedules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecurringSchedules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecurringSchedules.
     */
    distinct?: RecurringScheduleScalarFieldEnum | RecurringScheduleScalarFieldEnum[]
  }

  /**
   * RecurringSchedule findMany
   */
  export type RecurringScheduleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    /**
     * Filter, which RecurringSchedules to fetch.
     */
    where?: RecurringScheduleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecurringSchedules to fetch.
     */
    orderBy?: RecurringScheduleOrderByWithRelationInput | RecurringScheduleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RecurringSchedules.
     */
    cursor?: RecurringScheduleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecurringSchedules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecurringSchedules.
     */
    skip?: number
    distinct?: RecurringScheduleScalarFieldEnum | RecurringScheduleScalarFieldEnum[]
  }

  /**
   * RecurringSchedule create
   */
  export type RecurringScheduleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    /**
     * The data needed to create a RecurringSchedule.
     */
    data: XOR<RecurringScheduleCreateInput, RecurringScheduleUncheckedCreateInput>
  }

  /**
   * RecurringSchedule createMany
   */
  export type RecurringScheduleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RecurringSchedules.
     */
    data: RecurringScheduleCreateManyInput | RecurringScheduleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RecurringSchedule createManyAndReturn
   */
  export type RecurringScheduleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many RecurringSchedules.
     */
    data: RecurringScheduleCreateManyInput | RecurringScheduleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RecurringSchedule update
   */
  export type RecurringScheduleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    /**
     * The data needed to update a RecurringSchedule.
     */
    data: XOR<RecurringScheduleUpdateInput, RecurringScheduleUncheckedUpdateInput>
    /**
     * Choose, which RecurringSchedule to update.
     */
    where: RecurringScheduleWhereUniqueInput
  }

  /**
   * RecurringSchedule updateMany
   */
  export type RecurringScheduleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RecurringSchedules.
     */
    data: XOR<RecurringScheduleUpdateManyMutationInput, RecurringScheduleUncheckedUpdateManyInput>
    /**
     * Filter which RecurringSchedules to update
     */
    where?: RecurringScheduleWhereInput
  }

  /**
   * RecurringSchedule upsert
   */
  export type RecurringScheduleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    /**
     * The filter to search for the RecurringSchedule to update in case it exists.
     */
    where: RecurringScheduleWhereUniqueInput
    /**
     * In case the RecurringSchedule found by the `where` argument doesn't exist, create a new RecurringSchedule with this data.
     */
    create: XOR<RecurringScheduleCreateInput, RecurringScheduleUncheckedCreateInput>
    /**
     * In case the RecurringSchedule was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RecurringScheduleUpdateInput, RecurringScheduleUncheckedUpdateInput>
  }

  /**
   * RecurringSchedule delete
   */
  export type RecurringScheduleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
    /**
     * Filter which RecurringSchedule to delete.
     */
    where: RecurringScheduleWhereUniqueInput
  }

  /**
   * RecurringSchedule deleteMany
   */
  export type RecurringScheduleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecurringSchedules to delete
     */
    where?: RecurringScheduleWhereInput
  }

  /**
   * RecurringSchedule.invoices
   */
  export type RecurringSchedule$invoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    where?: InvoiceWhereInput
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    cursor?: InvoiceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * RecurringSchedule without action
   */
  export type RecurringScheduleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecurringSchedule
     */
    select?: RecurringScheduleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecurringScheduleInclude<ExtArgs> | null
  }


  /**
   * Model Expense
   */

  export type AggregateExpense = {
    _count: ExpenseCountAggregateOutputType | null
    _avg: ExpenseAvgAggregateOutputType | null
    _sum: ExpenseSumAggregateOutputType | null
    _min: ExpenseMinAggregateOutputType | null
    _max: ExpenseMaxAggregateOutputType | null
  }

  export type ExpenseAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type ExpenseSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type ExpenseMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobId: string | null
    technicianId: string | null
    category: $Enums.ExpenseCategory | null
    description: string | null
    amount: Decimal | null
    vendor: string | null
    receiptUrl: string | null
    expenseDate: Date | null
    isReimbursable: boolean | null
    createdByUserId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ExpenseMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    jobId: string | null
    technicianId: string | null
    category: $Enums.ExpenseCategory | null
    description: string | null
    amount: Decimal | null
    vendor: string | null
    receiptUrl: string | null
    expenseDate: Date | null
    isReimbursable: boolean | null
    createdByUserId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ExpenseCountAggregateOutputType = {
    id: number
    companyId: number
    jobId: number
    technicianId: number
    category: number
    description: number
    amount: number
    vendor: number
    receiptUrl: number
    expenseDate: number
    isReimbursable: number
    createdByUserId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ExpenseAvgAggregateInputType = {
    amount?: true
  }

  export type ExpenseSumAggregateInputType = {
    amount?: true
  }

  export type ExpenseMinAggregateInputType = {
    id?: true
    companyId?: true
    jobId?: true
    technicianId?: true
    category?: true
    description?: true
    amount?: true
    vendor?: true
    receiptUrl?: true
    expenseDate?: true
    isReimbursable?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ExpenseMaxAggregateInputType = {
    id?: true
    companyId?: true
    jobId?: true
    technicianId?: true
    category?: true
    description?: true
    amount?: true
    vendor?: true
    receiptUrl?: true
    expenseDate?: true
    isReimbursable?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ExpenseCountAggregateInputType = {
    id?: true
    companyId?: true
    jobId?: true
    technicianId?: true
    category?: true
    description?: true
    amount?: true
    vendor?: true
    receiptUrl?: true
    expenseDate?: true
    isReimbursable?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ExpenseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Expense to aggregate.
     */
    where?: ExpenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Expenses to fetch.
     */
    orderBy?: ExpenseOrderByWithRelationInput | ExpenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ExpenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Expenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Expenses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Expenses
    **/
    _count?: true | ExpenseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ExpenseAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ExpenseSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ExpenseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ExpenseMaxAggregateInputType
  }

  export type GetExpenseAggregateType<T extends ExpenseAggregateArgs> = {
        [P in keyof T & keyof AggregateExpense]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateExpense[P]>
      : GetScalarType<T[P], AggregateExpense[P]>
  }




  export type ExpenseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ExpenseWhereInput
    orderBy?: ExpenseOrderByWithAggregationInput | ExpenseOrderByWithAggregationInput[]
    by: ExpenseScalarFieldEnum[] | ExpenseScalarFieldEnum
    having?: ExpenseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ExpenseCountAggregateInputType | true
    _avg?: ExpenseAvgAggregateInputType
    _sum?: ExpenseSumAggregateInputType
    _min?: ExpenseMinAggregateInputType
    _max?: ExpenseMaxAggregateInputType
  }

  export type ExpenseGroupByOutputType = {
    id: string
    companyId: string
    jobId: string | null
    technicianId: string | null
    category: $Enums.ExpenseCategory
    description: string
    amount: Decimal
    vendor: string | null
    receiptUrl: string | null
    expenseDate: Date
    isReimbursable: boolean
    createdByUserId: string
    createdAt: Date
    updatedAt: Date
    _count: ExpenseCountAggregateOutputType | null
    _avg: ExpenseAvgAggregateOutputType | null
    _sum: ExpenseSumAggregateOutputType | null
    _min: ExpenseMinAggregateOutputType | null
    _max: ExpenseMaxAggregateOutputType | null
  }

  type GetExpenseGroupByPayload<T extends ExpenseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ExpenseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ExpenseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ExpenseGroupByOutputType[P]>
            : GetScalarType<T[P], ExpenseGroupByOutputType[P]>
        }
      >
    >


  export type ExpenseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobId?: boolean
    technicianId?: boolean
    category?: boolean
    description?: boolean
    amount?: boolean
    vendor?: boolean
    receiptUrl?: boolean
    expenseDate?: boolean
    isReimbursable?: boolean
    createdByUserId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["expense"]>

  export type ExpenseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    jobId?: boolean
    technicianId?: boolean
    category?: boolean
    description?: boolean
    amount?: boolean
    vendor?: boolean
    receiptUrl?: boolean
    expenseDate?: boolean
    isReimbursable?: boolean
    createdByUserId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["expense"]>

  export type ExpenseSelectScalar = {
    id?: boolean
    companyId?: boolean
    jobId?: boolean
    technicianId?: boolean
    category?: boolean
    description?: boolean
    amount?: boolean
    vendor?: boolean
    receiptUrl?: boolean
    expenseDate?: boolean
    isReimbursable?: boolean
    createdByUserId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $ExpensePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Expense"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      jobId: string | null
      technicianId: string | null
      category: $Enums.ExpenseCategory
      description: string
      amount: Prisma.Decimal
      vendor: string | null
      receiptUrl: string | null
      expenseDate: Date
      isReimbursable: boolean
      createdByUserId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["expense"]>
    composites: {}
  }

  type ExpenseGetPayload<S extends boolean | null | undefined | ExpenseDefaultArgs> = $Result.GetResult<Prisma.$ExpensePayload, S>

  type ExpenseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ExpenseFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ExpenseCountAggregateInputType | true
    }

  export interface ExpenseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Expense'], meta: { name: 'Expense' } }
    /**
     * Find zero or one Expense that matches the filter.
     * @param {ExpenseFindUniqueArgs} args - Arguments to find a Expense
     * @example
     * // Get one Expense
     * const expense = await prisma.expense.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ExpenseFindUniqueArgs>(args: SelectSubset<T, ExpenseFindUniqueArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Expense that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ExpenseFindUniqueOrThrowArgs} args - Arguments to find a Expense
     * @example
     * // Get one Expense
     * const expense = await prisma.expense.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ExpenseFindUniqueOrThrowArgs>(args: SelectSubset<T, ExpenseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Expense that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseFindFirstArgs} args - Arguments to find a Expense
     * @example
     * // Get one Expense
     * const expense = await prisma.expense.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ExpenseFindFirstArgs>(args?: SelectSubset<T, ExpenseFindFirstArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Expense that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseFindFirstOrThrowArgs} args - Arguments to find a Expense
     * @example
     * // Get one Expense
     * const expense = await prisma.expense.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ExpenseFindFirstOrThrowArgs>(args?: SelectSubset<T, ExpenseFindFirstOrThrowArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Expenses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Expenses
     * const expenses = await prisma.expense.findMany()
     * 
     * // Get first 10 Expenses
     * const expenses = await prisma.expense.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const expenseWithIdOnly = await prisma.expense.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ExpenseFindManyArgs>(args?: SelectSubset<T, ExpenseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Expense.
     * @param {ExpenseCreateArgs} args - Arguments to create a Expense.
     * @example
     * // Create one Expense
     * const Expense = await prisma.expense.create({
     *   data: {
     *     // ... data to create a Expense
     *   }
     * })
     * 
     */
    create<T extends ExpenseCreateArgs>(args: SelectSubset<T, ExpenseCreateArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Expenses.
     * @param {ExpenseCreateManyArgs} args - Arguments to create many Expenses.
     * @example
     * // Create many Expenses
     * const expense = await prisma.expense.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ExpenseCreateManyArgs>(args?: SelectSubset<T, ExpenseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Expenses and returns the data saved in the database.
     * @param {ExpenseCreateManyAndReturnArgs} args - Arguments to create many Expenses.
     * @example
     * // Create many Expenses
     * const expense = await prisma.expense.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Expenses and only return the `id`
     * const expenseWithIdOnly = await prisma.expense.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ExpenseCreateManyAndReturnArgs>(args?: SelectSubset<T, ExpenseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Expense.
     * @param {ExpenseDeleteArgs} args - Arguments to delete one Expense.
     * @example
     * // Delete one Expense
     * const Expense = await prisma.expense.delete({
     *   where: {
     *     // ... filter to delete one Expense
     *   }
     * })
     * 
     */
    delete<T extends ExpenseDeleteArgs>(args: SelectSubset<T, ExpenseDeleteArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Expense.
     * @param {ExpenseUpdateArgs} args - Arguments to update one Expense.
     * @example
     * // Update one Expense
     * const expense = await prisma.expense.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ExpenseUpdateArgs>(args: SelectSubset<T, ExpenseUpdateArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Expenses.
     * @param {ExpenseDeleteManyArgs} args - Arguments to filter Expenses to delete.
     * @example
     * // Delete a few Expenses
     * const { count } = await prisma.expense.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ExpenseDeleteManyArgs>(args?: SelectSubset<T, ExpenseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Expenses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Expenses
     * const expense = await prisma.expense.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ExpenseUpdateManyArgs>(args: SelectSubset<T, ExpenseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Expense.
     * @param {ExpenseUpsertArgs} args - Arguments to update or create a Expense.
     * @example
     * // Update or create a Expense
     * const expense = await prisma.expense.upsert({
     *   create: {
     *     // ... data to create a Expense
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Expense we want to update
     *   }
     * })
     */
    upsert<T extends ExpenseUpsertArgs>(args: SelectSubset<T, ExpenseUpsertArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Expenses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseCountArgs} args - Arguments to filter Expenses to count.
     * @example
     * // Count the number of Expenses
     * const count = await prisma.expense.count({
     *   where: {
     *     // ... the filter for the Expenses we want to count
     *   }
     * })
    **/
    count<T extends ExpenseCountArgs>(
      args?: Subset<T, ExpenseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ExpenseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Expense.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ExpenseAggregateArgs>(args: Subset<T, ExpenseAggregateArgs>): Prisma.PrismaPromise<GetExpenseAggregateType<T>>

    /**
     * Group by Expense.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseGroupByArgs} args - Group by arguments.
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
      T extends ExpenseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ExpenseGroupByArgs['orderBy'] }
        : { orderBy?: ExpenseGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ExpenseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetExpenseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Expense model
   */
  readonly fields: ExpenseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Expense.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ExpenseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Expense model
   */ 
  interface ExpenseFieldRefs {
    readonly id: FieldRef<"Expense", 'String'>
    readonly companyId: FieldRef<"Expense", 'String'>
    readonly jobId: FieldRef<"Expense", 'String'>
    readonly technicianId: FieldRef<"Expense", 'String'>
    readonly category: FieldRef<"Expense", 'ExpenseCategory'>
    readonly description: FieldRef<"Expense", 'String'>
    readonly amount: FieldRef<"Expense", 'Decimal'>
    readonly vendor: FieldRef<"Expense", 'String'>
    readonly receiptUrl: FieldRef<"Expense", 'String'>
    readonly expenseDate: FieldRef<"Expense", 'DateTime'>
    readonly isReimbursable: FieldRef<"Expense", 'Boolean'>
    readonly createdByUserId: FieldRef<"Expense", 'String'>
    readonly createdAt: FieldRef<"Expense", 'DateTime'>
    readonly updatedAt: FieldRef<"Expense", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Expense findUnique
   */
  export type ExpenseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Filter, which Expense to fetch.
     */
    where: ExpenseWhereUniqueInput
  }

  /**
   * Expense findUniqueOrThrow
   */
  export type ExpenseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Filter, which Expense to fetch.
     */
    where: ExpenseWhereUniqueInput
  }

  /**
   * Expense findFirst
   */
  export type ExpenseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Filter, which Expense to fetch.
     */
    where?: ExpenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Expenses to fetch.
     */
    orderBy?: ExpenseOrderByWithRelationInput | ExpenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Expenses.
     */
    cursor?: ExpenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Expenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Expenses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Expenses.
     */
    distinct?: ExpenseScalarFieldEnum | ExpenseScalarFieldEnum[]
  }

  /**
   * Expense findFirstOrThrow
   */
  export type ExpenseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Filter, which Expense to fetch.
     */
    where?: ExpenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Expenses to fetch.
     */
    orderBy?: ExpenseOrderByWithRelationInput | ExpenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Expenses.
     */
    cursor?: ExpenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Expenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Expenses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Expenses.
     */
    distinct?: ExpenseScalarFieldEnum | ExpenseScalarFieldEnum[]
  }

  /**
   * Expense findMany
   */
  export type ExpenseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Filter, which Expenses to fetch.
     */
    where?: ExpenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Expenses to fetch.
     */
    orderBy?: ExpenseOrderByWithRelationInput | ExpenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Expenses.
     */
    cursor?: ExpenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Expenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Expenses.
     */
    skip?: number
    distinct?: ExpenseScalarFieldEnum | ExpenseScalarFieldEnum[]
  }

  /**
   * Expense create
   */
  export type ExpenseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * The data needed to create a Expense.
     */
    data: XOR<ExpenseCreateInput, ExpenseUncheckedCreateInput>
  }

  /**
   * Expense createMany
   */
  export type ExpenseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Expenses.
     */
    data: ExpenseCreateManyInput | ExpenseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Expense createManyAndReturn
   */
  export type ExpenseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Expenses.
     */
    data: ExpenseCreateManyInput | ExpenseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Expense update
   */
  export type ExpenseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * The data needed to update a Expense.
     */
    data: XOR<ExpenseUpdateInput, ExpenseUncheckedUpdateInput>
    /**
     * Choose, which Expense to update.
     */
    where: ExpenseWhereUniqueInput
  }

  /**
   * Expense updateMany
   */
  export type ExpenseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Expenses.
     */
    data: XOR<ExpenseUpdateManyMutationInput, ExpenseUncheckedUpdateManyInput>
    /**
     * Filter which Expenses to update
     */
    where?: ExpenseWhereInput
  }

  /**
   * Expense upsert
   */
  export type ExpenseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * The filter to search for the Expense to update in case it exists.
     */
    where: ExpenseWhereUniqueInput
    /**
     * In case the Expense found by the `where` argument doesn't exist, create a new Expense with this data.
     */
    create: XOR<ExpenseCreateInput, ExpenseUncheckedCreateInput>
    /**
     * In case the Expense was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ExpenseUpdateInput, ExpenseUncheckedUpdateInput>
  }

  /**
   * Expense delete
   */
  export type ExpenseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Filter which Expense to delete.
     */
    where: ExpenseWhereUniqueInput
  }

  /**
   * Expense deleteMany
   */
  export type ExpenseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Expenses to delete
     */
    where?: ExpenseWhereInput
  }

  /**
   * Expense without action
   */
  export type ExpenseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
  }


  /**
   * Model QuickBooksConnection
   */

  export type AggregateQuickBooksConnection = {
    _count: QuickBooksConnectionCountAggregateOutputType | null
    _min: QuickBooksConnectionMinAggregateOutputType | null
    _max: QuickBooksConnectionMaxAggregateOutputType | null
  }

  export type QuickBooksConnectionMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    realmId: string | null
    accessToken: string | null
    refreshToken: string | null
    tokenExpiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuickBooksConnectionMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    realmId: string | null
    accessToken: string | null
    refreshToken: string | null
    tokenExpiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuickBooksConnectionCountAggregateOutputType = {
    id: number
    companyId: number
    realmId: number
    accessToken: number
    refreshToken: number
    tokenExpiresAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QuickBooksConnectionMinAggregateInputType = {
    id?: true
    companyId?: true
    realmId?: true
    accessToken?: true
    refreshToken?: true
    tokenExpiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuickBooksConnectionMaxAggregateInputType = {
    id?: true
    companyId?: true
    realmId?: true
    accessToken?: true
    refreshToken?: true
    tokenExpiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuickBooksConnectionCountAggregateInputType = {
    id?: true
    companyId?: true
    realmId?: true
    accessToken?: true
    refreshToken?: true
    tokenExpiresAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QuickBooksConnectionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuickBooksConnection to aggregate.
     */
    where?: QuickBooksConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuickBooksConnections to fetch.
     */
    orderBy?: QuickBooksConnectionOrderByWithRelationInput | QuickBooksConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuickBooksConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuickBooksConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuickBooksConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuickBooksConnections
    **/
    _count?: true | QuickBooksConnectionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuickBooksConnectionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuickBooksConnectionMaxAggregateInputType
  }

  export type GetQuickBooksConnectionAggregateType<T extends QuickBooksConnectionAggregateArgs> = {
        [P in keyof T & keyof AggregateQuickBooksConnection]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuickBooksConnection[P]>
      : GetScalarType<T[P], AggregateQuickBooksConnection[P]>
  }




  export type QuickBooksConnectionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuickBooksConnectionWhereInput
    orderBy?: QuickBooksConnectionOrderByWithAggregationInput | QuickBooksConnectionOrderByWithAggregationInput[]
    by: QuickBooksConnectionScalarFieldEnum[] | QuickBooksConnectionScalarFieldEnum
    having?: QuickBooksConnectionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuickBooksConnectionCountAggregateInputType | true
    _min?: QuickBooksConnectionMinAggregateInputType
    _max?: QuickBooksConnectionMaxAggregateInputType
  }

  export type QuickBooksConnectionGroupByOutputType = {
    id: string
    companyId: string
    realmId: string
    accessToken: string
    refreshToken: string
    tokenExpiresAt: Date
    createdAt: Date
    updatedAt: Date
    _count: QuickBooksConnectionCountAggregateOutputType | null
    _min: QuickBooksConnectionMinAggregateOutputType | null
    _max: QuickBooksConnectionMaxAggregateOutputType | null
  }

  type GetQuickBooksConnectionGroupByPayload<T extends QuickBooksConnectionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuickBooksConnectionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuickBooksConnectionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuickBooksConnectionGroupByOutputType[P]>
            : GetScalarType<T[P], QuickBooksConnectionGroupByOutputType[P]>
        }
      >
    >


  export type QuickBooksConnectionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    realmId?: boolean
    accessToken?: boolean
    refreshToken?: boolean
    tokenExpiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["quickBooksConnection"]>

  export type QuickBooksConnectionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    realmId?: boolean
    accessToken?: boolean
    refreshToken?: boolean
    tokenExpiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["quickBooksConnection"]>

  export type QuickBooksConnectionSelectScalar = {
    id?: boolean
    companyId?: boolean
    realmId?: boolean
    accessToken?: boolean
    refreshToken?: boolean
    tokenExpiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $QuickBooksConnectionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuickBooksConnection"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      realmId: string
      accessToken: string
      refreshToken: string
      tokenExpiresAt: Date
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["quickBooksConnection"]>
    composites: {}
  }

  type QuickBooksConnectionGetPayload<S extends boolean | null | undefined | QuickBooksConnectionDefaultArgs> = $Result.GetResult<Prisma.$QuickBooksConnectionPayload, S>

  type QuickBooksConnectionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuickBooksConnectionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuickBooksConnectionCountAggregateInputType | true
    }

  export interface QuickBooksConnectionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuickBooksConnection'], meta: { name: 'QuickBooksConnection' } }
    /**
     * Find zero or one QuickBooksConnection that matches the filter.
     * @param {QuickBooksConnectionFindUniqueArgs} args - Arguments to find a QuickBooksConnection
     * @example
     * // Get one QuickBooksConnection
     * const quickBooksConnection = await prisma.quickBooksConnection.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuickBooksConnectionFindUniqueArgs>(args: SelectSubset<T, QuickBooksConnectionFindUniqueArgs<ExtArgs>>): Prisma__QuickBooksConnectionClient<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one QuickBooksConnection that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuickBooksConnectionFindUniqueOrThrowArgs} args - Arguments to find a QuickBooksConnection
     * @example
     * // Get one QuickBooksConnection
     * const quickBooksConnection = await prisma.quickBooksConnection.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuickBooksConnectionFindUniqueOrThrowArgs>(args: SelectSubset<T, QuickBooksConnectionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuickBooksConnectionClient<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first QuickBooksConnection that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksConnectionFindFirstArgs} args - Arguments to find a QuickBooksConnection
     * @example
     * // Get one QuickBooksConnection
     * const quickBooksConnection = await prisma.quickBooksConnection.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuickBooksConnectionFindFirstArgs>(args?: SelectSubset<T, QuickBooksConnectionFindFirstArgs<ExtArgs>>): Prisma__QuickBooksConnectionClient<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first QuickBooksConnection that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksConnectionFindFirstOrThrowArgs} args - Arguments to find a QuickBooksConnection
     * @example
     * // Get one QuickBooksConnection
     * const quickBooksConnection = await prisma.quickBooksConnection.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuickBooksConnectionFindFirstOrThrowArgs>(args?: SelectSubset<T, QuickBooksConnectionFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuickBooksConnectionClient<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more QuickBooksConnections that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksConnectionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuickBooksConnections
     * const quickBooksConnections = await prisma.quickBooksConnection.findMany()
     * 
     * // Get first 10 QuickBooksConnections
     * const quickBooksConnections = await prisma.quickBooksConnection.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quickBooksConnectionWithIdOnly = await prisma.quickBooksConnection.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuickBooksConnectionFindManyArgs>(args?: SelectSubset<T, QuickBooksConnectionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a QuickBooksConnection.
     * @param {QuickBooksConnectionCreateArgs} args - Arguments to create a QuickBooksConnection.
     * @example
     * // Create one QuickBooksConnection
     * const QuickBooksConnection = await prisma.quickBooksConnection.create({
     *   data: {
     *     // ... data to create a QuickBooksConnection
     *   }
     * })
     * 
     */
    create<T extends QuickBooksConnectionCreateArgs>(args: SelectSubset<T, QuickBooksConnectionCreateArgs<ExtArgs>>): Prisma__QuickBooksConnectionClient<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many QuickBooksConnections.
     * @param {QuickBooksConnectionCreateManyArgs} args - Arguments to create many QuickBooksConnections.
     * @example
     * // Create many QuickBooksConnections
     * const quickBooksConnection = await prisma.quickBooksConnection.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuickBooksConnectionCreateManyArgs>(args?: SelectSubset<T, QuickBooksConnectionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuickBooksConnections and returns the data saved in the database.
     * @param {QuickBooksConnectionCreateManyAndReturnArgs} args - Arguments to create many QuickBooksConnections.
     * @example
     * // Create many QuickBooksConnections
     * const quickBooksConnection = await prisma.quickBooksConnection.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuickBooksConnections and only return the `id`
     * const quickBooksConnectionWithIdOnly = await prisma.quickBooksConnection.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuickBooksConnectionCreateManyAndReturnArgs>(args?: SelectSubset<T, QuickBooksConnectionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a QuickBooksConnection.
     * @param {QuickBooksConnectionDeleteArgs} args - Arguments to delete one QuickBooksConnection.
     * @example
     * // Delete one QuickBooksConnection
     * const QuickBooksConnection = await prisma.quickBooksConnection.delete({
     *   where: {
     *     // ... filter to delete one QuickBooksConnection
     *   }
     * })
     * 
     */
    delete<T extends QuickBooksConnectionDeleteArgs>(args: SelectSubset<T, QuickBooksConnectionDeleteArgs<ExtArgs>>): Prisma__QuickBooksConnectionClient<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one QuickBooksConnection.
     * @param {QuickBooksConnectionUpdateArgs} args - Arguments to update one QuickBooksConnection.
     * @example
     * // Update one QuickBooksConnection
     * const quickBooksConnection = await prisma.quickBooksConnection.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuickBooksConnectionUpdateArgs>(args: SelectSubset<T, QuickBooksConnectionUpdateArgs<ExtArgs>>): Prisma__QuickBooksConnectionClient<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more QuickBooksConnections.
     * @param {QuickBooksConnectionDeleteManyArgs} args - Arguments to filter QuickBooksConnections to delete.
     * @example
     * // Delete a few QuickBooksConnections
     * const { count } = await prisma.quickBooksConnection.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuickBooksConnectionDeleteManyArgs>(args?: SelectSubset<T, QuickBooksConnectionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuickBooksConnections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksConnectionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuickBooksConnections
     * const quickBooksConnection = await prisma.quickBooksConnection.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuickBooksConnectionUpdateManyArgs>(args: SelectSubset<T, QuickBooksConnectionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one QuickBooksConnection.
     * @param {QuickBooksConnectionUpsertArgs} args - Arguments to update or create a QuickBooksConnection.
     * @example
     * // Update or create a QuickBooksConnection
     * const quickBooksConnection = await prisma.quickBooksConnection.upsert({
     *   create: {
     *     // ... data to create a QuickBooksConnection
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuickBooksConnection we want to update
     *   }
     * })
     */
    upsert<T extends QuickBooksConnectionUpsertArgs>(args: SelectSubset<T, QuickBooksConnectionUpsertArgs<ExtArgs>>): Prisma__QuickBooksConnectionClient<$Result.GetResult<Prisma.$QuickBooksConnectionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of QuickBooksConnections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksConnectionCountArgs} args - Arguments to filter QuickBooksConnections to count.
     * @example
     * // Count the number of QuickBooksConnections
     * const count = await prisma.quickBooksConnection.count({
     *   where: {
     *     // ... the filter for the QuickBooksConnections we want to count
     *   }
     * })
    **/
    count<T extends QuickBooksConnectionCountArgs>(
      args?: Subset<T, QuickBooksConnectionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuickBooksConnectionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuickBooksConnection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksConnectionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends QuickBooksConnectionAggregateArgs>(args: Subset<T, QuickBooksConnectionAggregateArgs>): Prisma.PrismaPromise<GetQuickBooksConnectionAggregateType<T>>

    /**
     * Group by QuickBooksConnection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksConnectionGroupByArgs} args - Group by arguments.
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
      T extends QuickBooksConnectionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuickBooksConnectionGroupByArgs['orderBy'] }
        : { orderBy?: QuickBooksConnectionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, QuickBooksConnectionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuickBooksConnectionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuickBooksConnection model
   */
  readonly fields: QuickBooksConnectionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuickBooksConnection.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuickBooksConnectionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the QuickBooksConnection model
   */ 
  interface QuickBooksConnectionFieldRefs {
    readonly id: FieldRef<"QuickBooksConnection", 'String'>
    readonly companyId: FieldRef<"QuickBooksConnection", 'String'>
    readonly realmId: FieldRef<"QuickBooksConnection", 'String'>
    readonly accessToken: FieldRef<"QuickBooksConnection", 'String'>
    readonly refreshToken: FieldRef<"QuickBooksConnection", 'String'>
    readonly tokenExpiresAt: FieldRef<"QuickBooksConnection", 'DateTime'>
    readonly createdAt: FieldRef<"QuickBooksConnection", 'DateTime'>
    readonly updatedAt: FieldRef<"QuickBooksConnection", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QuickBooksConnection findUnique
   */
  export type QuickBooksConnectionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksConnection to fetch.
     */
    where: QuickBooksConnectionWhereUniqueInput
  }

  /**
   * QuickBooksConnection findUniqueOrThrow
   */
  export type QuickBooksConnectionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksConnection to fetch.
     */
    where: QuickBooksConnectionWhereUniqueInput
  }

  /**
   * QuickBooksConnection findFirst
   */
  export type QuickBooksConnectionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksConnection to fetch.
     */
    where?: QuickBooksConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuickBooksConnections to fetch.
     */
    orderBy?: QuickBooksConnectionOrderByWithRelationInput | QuickBooksConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuickBooksConnections.
     */
    cursor?: QuickBooksConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuickBooksConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuickBooksConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuickBooksConnections.
     */
    distinct?: QuickBooksConnectionScalarFieldEnum | QuickBooksConnectionScalarFieldEnum[]
  }

  /**
   * QuickBooksConnection findFirstOrThrow
   */
  export type QuickBooksConnectionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksConnection to fetch.
     */
    where?: QuickBooksConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuickBooksConnections to fetch.
     */
    orderBy?: QuickBooksConnectionOrderByWithRelationInput | QuickBooksConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuickBooksConnections.
     */
    cursor?: QuickBooksConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuickBooksConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuickBooksConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuickBooksConnections.
     */
    distinct?: QuickBooksConnectionScalarFieldEnum | QuickBooksConnectionScalarFieldEnum[]
  }

  /**
   * QuickBooksConnection findMany
   */
  export type QuickBooksConnectionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksConnections to fetch.
     */
    where?: QuickBooksConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuickBooksConnections to fetch.
     */
    orderBy?: QuickBooksConnectionOrderByWithRelationInput | QuickBooksConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuickBooksConnections.
     */
    cursor?: QuickBooksConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuickBooksConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuickBooksConnections.
     */
    skip?: number
    distinct?: QuickBooksConnectionScalarFieldEnum | QuickBooksConnectionScalarFieldEnum[]
  }

  /**
   * QuickBooksConnection create
   */
  export type QuickBooksConnectionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
    /**
     * The data needed to create a QuickBooksConnection.
     */
    data: XOR<QuickBooksConnectionCreateInput, QuickBooksConnectionUncheckedCreateInput>
  }

  /**
   * QuickBooksConnection createMany
   */
  export type QuickBooksConnectionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuickBooksConnections.
     */
    data: QuickBooksConnectionCreateManyInput | QuickBooksConnectionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuickBooksConnection createManyAndReturn
   */
  export type QuickBooksConnectionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many QuickBooksConnections.
     */
    data: QuickBooksConnectionCreateManyInput | QuickBooksConnectionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuickBooksConnection update
   */
  export type QuickBooksConnectionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
    /**
     * The data needed to update a QuickBooksConnection.
     */
    data: XOR<QuickBooksConnectionUpdateInput, QuickBooksConnectionUncheckedUpdateInput>
    /**
     * Choose, which QuickBooksConnection to update.
     */
    where: QuickBooksConnectionWhereUniqueInput
  }

  /**
   * QuickBooksConnection updateMany
   */
  export type QuickBooksConnectionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuickBooksConnections.
     */
    data: XOR<QuickBooksConnectionUpdateManyMutationInput, QuickBooksConnectionUncheckedUpdateManyInput>
    /**
     * Filter which QuickBooksConnections to update
     */
    where?: QuickBooksConnectionWhereInput
  }

  /**
   * QuickBooksConnection upsert
   */
  export type QuickBooksConnectionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
    /**
     * The filter to search for the QuickBooksConnection to update in case it exists.
     */
    where: QuickBooksConnectionWhereUniqueInput
    /**
     * In case the QuickBooksConnection found by the `where` argument doesn't exist, create a new QuickBooksConnection with this data.
     */
    create: XOR<QuickBooksConnectionCreateInput, QuickBooksConnectionUncheckedCreateInput>
    /**
     * In case the QuickBooksConnection was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuickBooksConnectionUpdateInput, QuickBooksConnectionUncheckedUpdateInput>
  }

  /**
   * QuickBooksConnection delete
   */
  export type QuickBooksConnectionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
    /**
     * Filter which QuickBooksConnection to delete.
     */
    where: QuickBooksConnectionWhereUniqueInput
  }

  /**
   * QuickBooksConnection deleteMany
   */
  export type QuickBooksConnectionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuickBooksConnections to delete
     */
    where?: QuickBooksConnectionWhereInput
  }

  /**
   * QuickBooksConnection without action
   */
  export type QuickBooksConnectionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksConnection
     */
    select?: QuickBooksConnectionSelect<ExtArgs> | null
  }


  /**
   * Model QuickBooksCustomerMap
   */

  export type AggregateQuickBooksCustomerMap = {
    _count: QuickBooksCustomerMapCountAggregateOutputType | null
    _min: QuickBooksCustomerMapMinAggregateOutputType | null
    _max: QuickBooksCustomerMapMaxAggregateOutputType | null
  }

  export type QuickBooksCustomerMapMinAggregateOutputType = {
    id: string | null
    companyId: string | null
    crmCustomerId: string | null
    qbCustomerId: string | null
  }

  export type QuickBooksCustomerMapMaxAggregateOutputType = {
    id: string | null
    companyId: string | null
    crmCustomerId: string | null
    qbCustomerId: string | null
  }

  export type QuickBooksCustomerMapCountAggregateOutputType = {
    id: number
    companyId: number
    crmCustomerId: number
    qbCustomerId: number
    _all: number
  }


  export type QuickBooksCustomerMapMinAggregateInputType = {
    id?: true
    companyId?: true
    crmCustomerId?: true
    qbCustomerId?: true
  }

  export type QuickBooksCustomerMapMaxAggregateInputType = {
    id?: true
    companyId?: true
    crmCustomerId?: true
    qbCustomerId?: true
  }

  export type QuickBooksCustomerMapCountAggregateInputType = {
    id?: true
    companyId?: true
    crmCustomerId?: true
    qbCustomerId?: true
    _all?: true
  }

  export type QuickBooksCustomerMapAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuickBooksCustomerMap to aggregate.
     */
    where?: QuickBooksCustomerMapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuickBooksCustomerMaps to fetch.
     */
    orderBy?: QuickBooksCustomerMapOrderByWithRelationInput | QuickBooksCustomerMapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuickBooksCustomerMapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuickBooksCustomerMaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuickBooksCustomerMaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuickBooksCustomerMaps
    **/
    _count?: true | QuickBooksCustomerMapCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuickBooksCustomerMapMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuickBooksCustomerMapMaxAggregateInputType
  }

  export type GetQuickBooksCustomerMapAggregateType<T extends QuickBooksCustomerMapAggregateArgs> = {
        [P in keyof T & keyof AggregateQuickBooksCustomerMap]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuickBooksCustomerMap[P]>
      : GetScalarType<T[P], AggregateQuickBooksCustomerMap[P]>
  }




  export type QuickBooksCustomerMapGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuickBooksCustomerMapWhereInput
    orderBy?: QuickBooksCustomerMapOrderByWithAggregationInput | QuickBooksCustomerMapOrderByWithAggregationInput[]
    by: QuickBooksCustomerMapScalarFieldEnum[] | QuickBooksCustomerMapScalarFieldEnum
    having?: QuickBooksCustomerMapScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuickBooksCustomerMapCountAggregateInputType | true
    _min?: QuickBooksCustomerMapMinAggregateInputType
    _max?: QuickBooksCustomerMapMaxAggregateInputType
  }

  export type QuickBooksCustomerMapGroupByOutputType = {
    id: string
    companyId: string
    crmCustomerId: string
    qbCustomerId: string
    _count: QuickBooksCustomerMapCountAggregateOutputType | null
    _min: QuickBooksCustomerMapMinAggregateOutputType | null
    _max: QuickBooksCustomerMapMaxAggregateOutputType | null
  }

  type GetQuickBooksCustomerMapGroupByPayload<T extends QuickBooksCustomerMapGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuickBooksCustomerMapGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuickBooksCustomerMapGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuickBooksCustomerMapGroupByOutputType[P]>
            : GetScalarType<T[P], QuickBooksCustomerMapGroupByOutputType[P]>
        }
      >
    >


  export type QuickBooksCustomerMapSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    crmCustomerId?: boolean
    qbCustomerId?: boolean
  }, ExtArgs["result"]["quickBooksCustomerMap"]>

  export type QuickBooksCustomerMapSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyId?: boolean
    crmCustomerId?: boolean
    qbCustomerId?: boolean
  }, ExtArgs["result"]["quickBooksCustomerMap"]>

  export type QuickBooksCustomerMapSelectScalar = {
    id?: boolean
    companyId?: boolean
    crmCustomerId?: boolean
    qbCustomerId?: boolean
  }


  export type $QuickBooksCustomerMapPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuickBooksCustomerMap"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyId: string
      crmCustomerId: string
      qbCustomerId: string
    }, ExtArgs["result"]["quickBooksCustomerMap"]>
    composites: {}
  }

  type QuickBooksCustomerMapGetPayload<S extends boolean | null | undefined | QuickBooksCustomerMapDefaultArgs> = $Result.GetResult<Prisma.$QuickBooksCustomerMapPayload, S>

  type QuickBooksCustomerMapCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuickBooksCustomerMapFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuickBooksCustomerMapCountAggregateInputType | true
    }

  export interface QuickBooksCustomerMapDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuickBooksCustomerMap'], meta: { name: 'QuickBooksCustomerMap' } }
    /**
     * Find zero or one QuickBooksCustomerMap that matches the filter.
     * @param {QuickBooksCustomerMapFindUniqueArgs} args - Arguments to find a QuickBooksCustomerMap
     * @example
     * // Get one QuickBooksCustomerMap
     * const quickBooksCustomerMap = await prisma.quickBooksCustomerMap.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuickBooksCustomerMapFindUniqueArgs>(args: SelectSubset<T, QuickBooksCustomerMapFindUniqueArgs<ExtArgs>>): Prisma__QuickBooksCustomerMapClient<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one QuickBooksCustomerMap that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuickBooksCustomerMapFindUniqueOrThrowArgs} args - Arguments to find a QuickBooksCustomerMap
     * @example
     * // Get one QuickBooksCustomerMap
     * const quickBooksCustomerMap = await prisma.quickBooksCustomerMap.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuickBooksCustomerMapFindUniqueOrThrowArgs>(args: SelectSubset<T, QuickBooksCustomerMapFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuickBooksCustomerMapClient<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first QuickBooksCustomerMap that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksCustomerMapFindFirstArgs} args - Arguments to find a QuickBooksCustomerMap
     * @example
     * // Get one QuickBooksCustomerMap
     * const quickBooksCustomerMap = await prisma.quickBooksCustomerMap.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuickBooksCustomerMapFindFirstArgs>(args?: SelectSubset<T, QuickBooksCustomerMapFindFirstArgs<ExtArgs>>): Prisma__QuickBooksCustomerMapClient<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first QuickBooksCustomerMap that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksCustomerMapFindFirstOrThrowArgs} args - Arguments to find a QuickBooksCustomerMap
     * @example
     * // Get one QuickBooksCustomerMap
     * const quickBooksCustomerMap = await prisma.quickBooksCustomerMap.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuickBooksCustomerMapFindFirstOrThrowArgs>(args?: SelectSubset<T, QuickBooksCustomerMapFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuickBooksCustomerMapClient<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more QuickBooksCustomerMaps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksCustomerMapFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuickBooksCustomerMaps
     * const quickBooksCustomerMaps = await prisma.quickBooksCustomerMap.findMany()
     * 
     * // Get first 10 QuickBooksCustomerMaps
     * const quickBooksCustomerMaps = await prisma.quickBooksCustomerMap.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quickBooksCustomerMapWithIdOnly = await prisma.quickBooksCustomerMap.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuickBooksCustomerMapFindManyArgs>(args?: SelectSubset<T, QuickBooksCustomerMapFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a QuickBooksCustomerMap.
     * @param {QuickBooksCustomerMapCreateArgs} args - Arguments to create a QuickBooksCustomerMap.
     * @example
     * // Create one QuickBooksCustomerMap
     * const QuickBooksCustomerMap = await prisma.quickBooksCustomerMap.create({
     *   data: {
     *     // ... data to create a QuickBooksCustomerMap
     *   }
     * })
     * 
     */
    create<T extends QuickBooksCustomerMapCreateArgs>(args: SelectSubset<T, QuickBooksCustomerMapCreateArgs<ExtArgs>>): Prisma__QuickBooksCustomerMapClient<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many QuickBooksCustomerMaps.
     * @param {QuickBooksCustomerMapCreateManyArgs} args - Arguments to create many QuickBooksCustomerMaps.
     * @example
     * // Create many QuickBooksCustomerMaps
     * const quickBooksCustomerMap = await prisma.quickBooksCustomerMap.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuickBooksCustomerMapCreateManyArgs>(args?: SelectSubset<T, QuickBooksCustomerMapCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuickBooksCustomerMaps and returns the data saved in the database.
     * @param {QuickBooksCustomerMapCreateManyAndReturnArgs} args - Arguments to create many QuickBooksCustomerMaps.
     * @example
     * // Create many QuickBooksCustomerMaps
     * const quickBooksCustomerMap = await prisma.quickBooksCustomerMap.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuickBooksCustomerMaps and only return the `id`
     * const quickBooksCustomerMapWithIdOnly = await prisma.quickBooksCustomerMap.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuickBooksCustomerMapCreateManyAndReturnArgs>(args?: SelectSubset<T, QuickBooksCustomerMapCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a QuickBooksCustomerMap.
     * @param {QuickBooksCustomerMapDeleteArgs} args - Arguments to delete one QuickBooksCustomerMap.
     * @example
     * // Delete one QuickBooksCustomerMap
     * const QuickBooksCustomerMap = await prisma.quickBooksCustomerMap.delete({
     *   where: {
     *     // ... filter to delete one QuickBooksCustomerMap
     *   }
     * })
     * 
     */
    delete<T extends QuickBooksCustomerMapDeleteArgs>(args: SelectSubset<T, QuickBooksCustomerMapDeleteArgs<ExtArgs>>): Prisma__QuickBooksCustomerMapClient<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one QuickBooksCustomerMap.
     * @param {QuickBooksCustomerMapUpdateArgs} args - Arguments to update one QuickBooksCustomerMap.
     * @example
     * // Update one QuickBooksCustomerMap
     * const quickBooksCustomerMap = await prisma.quickBooksCustomerMap.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuickBooksCustomerMapUpdateArgs>(args: SelectSubset<T, QuickBooksCustomerMapUpdateArgs<ExtArgs>>): Prisma__QuickBooksCustomerMapClient<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more QuickBooksCustomerMaps.
     * @param {QuickBooksCustomerMapDeleteManyArgs} args - Arguments to filter QuickBooksCustomerMaps to delete.
     * @example
     * // Delete a few QuickBooksCustomerMaps
     * const { count } = await prisma.quickBooksCustomerMap.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuickBooksCustomerMapDeleteManyArgs>(args?: SelectSubset<T, QuickBooksCustomerMapDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuickBooksCustomerMaps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksCustomerMapUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuickBooksCustomerMaps
     * const quickBooksCustomerMap = await prisma.quickBooksCustomerMap.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuickBooksCustomerMapUpdateManyArgs>(args: SelectSubset<T, QuickBooksCustomerMapUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one QuickBooksCustomerMap.
     * @param {QuickBooksCustomerMapUpsertArgs} args - Arguments to update or create a QuickBooksCustomerMap.
     * @example
     * // Update or create a QuickBooksCustomerMap
     * const quickBooksCustomerMap = await prisma.quickBooksCustomerMap.upsert({
     *   create: {
     *     // ... data to create a QuickBooksCustomerMap
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuickBooksCustomerMap we want to update
     *   }
     * })
     */
    upsert<T extends QuickBooksCustomerMapUpsertArgs>(args: SelectSubset<T, QuickBooksCustomerMapUpsertArgs<ExtArgs>>): Prisma__QuickBooksCustomerMapClient<$Result.GetResult<Prisma.$QuickBooksCustomerMapPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of QuickBooksCustomerMaps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksCustomerMapCountArgs} args - Arguments to filter QuickBooksCustomerMaps to count.
     * @example
     * // Count the number of QuickBooksCustomerMaps
     * const count = await prisma.quickBooksCustomerMap.count({
     *   where: {
     *     // ... the filter for the QuickBooksCustomerMaps we want to count
     *   }
     * })
    **/
    count<T extends QuickBooksCustomerMapCountArgs>(
      args?: Subset<T, QuickBooksCustomerMapCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuickBooksCustomerMapCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuickBooksCustomerMap.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksCustomerMapAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends QuickBooksCustomerMapAggregateArgs>(args: Subset<T, QuickBooksCustomerMapAggregateArgs>): Prisma.PrismaPromise<GetQuickBooksCustomerMapAggregateType<T>>

    /**
     * Group by QuickBooksCustomerMap.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuickBooksCustomerMapGroupByArgs} args - Group by arguments.
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
      T extends QuickBooksCustomerMapGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuickBooksCustomerMapGroupByArgs['orderBy'] }
        : { orderBy?: QuickBooksCustomerMapGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, QuickBooksCustomerMapGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuickBooksCustomerMapGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuickBooksCustomerMap model
   */
  readonly fields: QuickBooksCustomerMapFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuickBooksCustomerMap.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuickBooksCustomerMapClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the QuickBooksCustomerMap model
   */ 
  interface QuickBooksCustomerMapFieldRefs {
    readonly id: FieldRef<"QuickBooksCustomerMap", 'String'>
    readonly companyId: FieldRef<"QuickBooksCustomerMap", 'String'>
    readonly crmCustomerId: FieldRef<"QuickBooksCustomerMap", 'String'>
    readonly qbCustomerId: FieldRef<"QuickBooksCustomerMap", 'String'>
  }
    

  // Custom InputTypes
  /**
   * QuickBooksCustomerMap findUnique
   */
  export type QuickBooksCustomerMapFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksCustomerMap to fetch.
     */
    where: QuickBooksCustomerMapWhereUniqueInput
  }

  /**
   * QuickBooksCustomerMap findUniqueOrThrow
   */
  export type QuickBooksCustomerMapFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksCustomerMap to fetch.
     */
    where: QuickBooksCustomerMapWhereUniqueInput
  }

  /**
   * QuickBooksCustomerMap findFirst
   */
  export type QuickBooksCustomerMapFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksCustomerMap to fetch.
     */
    where?: QuickBooksCustomerMapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuickBooksCustomerMaps to fetch.
     */
    orderBy?: QuickBooksCustomerMapOrderByWithRelationInput | QuickBooksCustomerMapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuickBooksCustomerMaps.
     */
    cursor?: QuickBooksCustomerMapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuickBooksCustomerMaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuickBooksCustomerMaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuickBooksCustomerMaps.
     */
    distinct?: QuickBooksCustomerMapScalarFieldEnum | QuickBooksCustomerMapScalarFieldEnum[]
  }

  /**
   * QuickBooksCustomerMap findFirstOrThrow
   */
  export type QuickBooksCustomerMapFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksCustomerMap to fetch.
     */
    where?: QuickBooksCustomerMapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuickBooksCustomerMaps to fetch.
     */
    orderBy?: QuickBooksCustomerMapOrderByWithRelationInput | QuickBooksCustomerMapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuickBooksCustomerMaps.
     */
    cursor?: QuickBooksCustomerMapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuickBooksCustomerMaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuickBooksCustomerMaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuickBooksCustomerMaps.
     */
    distinct?: QuickBooksCustomerMapScalarFieldEnum | QuickBooksCustomerMapScalarFieldEnum[]
  }

  /**
   * QuickBooksCustomerMap findMany
   */
  export type QuickBooksCustomerMapFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
    /**
     * Filter, which QuickBooksCustomerMaps to fetch.
     */
    where?: QuickBooksCustomerMapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuickBooksCustomerMaps to fetch.
     */
    orderBy?: QuickBooksCustomerMapOrderByWithRelationInput | QuickBooksCustomerMapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuickBooksCustomerMaps.
     */
    cursor?: QuickBooksCustomerMapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuickBooksCustomerMaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuickBooksCustomerMaps.
     */
    skip?: number
    distinct?: QuickBooksCustomerMapScalarFieldEnum | QuickBooksCustomerMapScalarFieldEnum[]
  }

  /**
   * QuickBooksCustomerMap create
   */
  export type QuickBooksCustomerMapCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
    /**
     * The data needed to create a QuickBooksCustomerMap.
     */
    data: XOR<QuickBooksCustomerMapCreateInput, QuickBooksCustomerMapUncheckedCreateInput>
  }

  /**
   * QuickBooksCustomerMap createMany
   */
  export type QuickBooksCustomerMapCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuickBooksCustomerMaps.
     */
    data: QuickBooksCustomerMapCreateManyInput | QuickBooksCustomerMapCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuickBooksCustomerMap createManyAndReturn
   */
  export type QuickBooksCustomerMapCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many QuickBooksCustomerMaps.
     */
    data: QuickBooksCustomerMapCreateManyInput | QuickBooksCustomerMapCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuickBooksCustomerMap update
   */
  export type QuickBooksCustomerMapUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
    /**
     * The data needed to update a QuickBooksCustomerMap.
     */
    data: XOR<QuickBooksCustomerMapUpdateInput, QuickBooksCustomerMapUncheckedUpdateInput>
    /**
     * Choose, which QuickBooksCustomerMap to update.
     */
    where: QuickBooksCustomerMapWhereUniqueInput
  }

  /**
   * QuickBooksCustomerMap updateMany
   */
  export type QuickBooksCustomerMapUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuickBooksCustomerMaps.
     */
    data: XOR<QuickBooksCustomerMapUpdateManyMutationInput, QuickBooksCustomerMapUncheckedUpdateManyInput>
    /**
     * Filter which QuickBooksCustomerMaps to update
     */
    where?: QuickBooksCustomerMapWhereInput
  }

  /**
   * QuickBooksCustomerMap upsert
   */
  export type QuickBooksCustomerMapUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
    /**
     * The filter to search for the QuickBooksCustomerMap to update in case it exists.
     */
    where: QuickBooksCustomerMapWhereUniqueInput
    /**
     * In case the QuickBooksCustomerMap found by the `where` argument doesn't exist, create a new QuickBooksCustomerMap with this data.
     */
    create: XOR<QuickBooksCustomerMapCreateInput, QuickBooksCustomerMapUncheckedCreateInput>
    /**
     * In case the QuickBooksCustomerMap was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuickBooksCustomerMapUpdateInput, QuickBooksCustomerMapUncheckedUpdateInput>
  }

  /**
   * QuickBooksCustomerMap delete
   */
  export type QuickBooksCustomerMapDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
    /**
     * Filter which QuickBooksCustomerMap to delete.
     */
    where: QuickBooksCustomerMapWhereUniqueInput
  }

  /**
   * QuickBooksCustomerMap deleteMany
   */
  export type QuickBooksCustomerMapDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuickBooksCustomerMaps to delete
     */
    where?: QuickBooksCustomerMapWhereInput
  }

  /**
   * QuickBooksCustomerMap without action
   */
  export type QuickBooksCustomerMapDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuickBooksCustomerMap
     */
    select?: QuickBooksCustomerMapSelect<ExtArgs> | null
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


  export const QuoteScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    quoteNumber: 'quoteNumber',
    jobId: 'jobId',
    customerId: 'customerId',
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    title: 'title',
    description: 'description',
    status: 'status',
    validUntil: 'validUntil',
    subtotal: 'subtotal',
    discountType: 'discountType',
    discountValue: 'discountValue',
    discountAmount: 'discountAmount',
    taxRate: 'taxRate',
    taxAmount: 'taxAmount',
    total: 'total',
    notes: 'notes',
    terms: 'terms',
    pdfUrl: 'pdfUrl',
    approvalToken: 'approvalToken',
    approvedAt: 'approvedAt',
    approvedByName: 'approvedByName',
    approvedByEmail: 'approvedByEmail',
    sentAt: 'sentAt',
    viewedAt: 'viewedAt',
    createdByUserId: 'createdByUserId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QuoteScalarFieldEnum = (typeof QuoteScalarFieldEnum)[keyof typeof QuoteScalarFieldEnum]


  export const QuoteLineItemScalarFieldEnum: {
    id: 'id',
    quoteId: 'quoteId',
    description: 'description',
    category: 'category',
    quantity: 'quantity',
    unitPrice: 'unitPrice',
    lineTotal: 'lineTotal',
    taxable: 'taxable',
    sortOrder: 'sortOrder'
  };

  export type QuoteLineItemScalarFieldEnum = (typeof QuoteLineItemScalarFieldEnum)[keyof typeof QuoteLineItemScalarFieldEnum]


  export const InvoiceScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    invoiceNumber: 'invoiceNumber',
    quoteId: 'quoteId',
    jobId: 'jobId',
    workOrderId: 'workOrderId',
    customerId: 'customerId',
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    status: 'status',
    dueDate: 'dueDate',
    dueDays: 'dueDays',
    subtotal: 'subtotal',
    discountAmount: 'discountAmount',
    taxRate: 'taxRate',
    taxAmount: 'taxAmount',
    total: 'total',
    amountPaid: 'amountPaid',
    balanceDue: 'balanceDue',
    notes: 'notes',
    terms: 'terms',
    pdfUrl: 'pdfUrl',
    stripePaymentIntentId: 'stripePaymentIntentId',
    stripePaymentUrl: 'stripePaymentUrl',
    quickbooksId: 'quickbooksId',
    sentAt: 'sentAt',
    paidAt: 'paidAt',
    voidedAt: 'voidedAt',
    approvedAt: 'approvedAt',
    approvedByName: 'approvedByName',
    approvedByEmail: 'approvedByEmail',
    declinedAt: 'declinedAt',
    declinedByName: 'declinedByName',
    declinedByEmail: 'declinedByEmail',
    declineReason: 'declineReason',
    createdByUserId: 'createdByUserId',
    recurringScheduleId: 'recurringScheduleId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InvoiceScalarFieldEnum = (typeof InvoiceScalarFieldEnum)[keyof typeof InvoiceScalarFieldEnum]


  export const InvoiceLineItemScalarFieldEnum: {
    id: 'id',
    invoiceId: 'invoiceId',
    description: 'description',
    category: 'category',
    quantity: 'quantity',
    unitPrice: 'unitPrice',
    lineTotal: 'lineTotal',
    taxable: 'taxable',
    sortOrder: 'sortOrder'
  };

  export type InvoiceLineItemScalarFieldEnum = (typeof InvoiceLineItemScalarFieldEnum)[keyof typeof InvoiceLineItemScalarFieldEnum]


  export const PaymentScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    invoiceId: 'invoiceId',
    amount: 'amount',
    paymentMethod: 'paymentMethod',
    status: 'status',
    stripePaymentIntentId: 'stripePaymentIntentId',
    stripeChargeId: 'stripeChargeId',
    quickbooksId: 'quickbooksId',
    paidAt: 'paidAt',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PaymentScalarFieldEnum = (typeof PaymentScalarFieldEnum)[keyof typeof PaymentScalarFieldEnum]


  export const RecurringScheduleScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    customerId: 'customerId',
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    description: 'description',
    frequency: 'frequency',
    amount: 'amount',
    taxRate: 'taxRate',
    nextBillingDate: 'nextBillingDate',
    isActive: 'isActive',
    jobId: 'jobId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type RecurringScheduleScalarFieldEnum = (typeof RecurringScheduleScalarFieldEnum)[keyof typeof RecurringScheduleScalarFieldEnum]


  export const ExpenseScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    jobId: 'jobId',
    technicianId: 'technicianId',
    category: 'category',
    description: 'description',
    amount: 'amount',
    vendor: 'vendor',
    receiptUrl: 'receiptUrl',
    expenseDate: 'expenseDate',
    isReimbursable: 'isReimbursable',
    createdByUserId: 'createdByUserId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ExpenseScalarFieldEnum = (typeof ExpenseScalarFieldEnum)[keyof typeof ExpenseScalarFieldEnum]


  export const QuickBooksConnectionScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    realmId: 'realmId',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    tokenExpiresAt: 'tokenExpiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QuickBooksConnectionScalarFieldEnum = (typeof QuickBooksConnectionScalarFieldEnum)[keyof typeof QuickBooksConnectionScalarFieldEnum]


  export const QuickBooksCustomerMapScalarFieldEnum: {
    id: 'id',
    companyId: 'companyId',
    crmCustomerId: 'crmCustomerId',
    qbCustomerId: 'qbCustomerId'
  };

  export type QuickBooksCustomerMapScalarFieldEnum = (typeof QuickBooksCustomerMapScalarFieldEnum)[keyof typeof QuickBooksCustomerMapScalarFieldEnum]


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
   * Reference to a field of type 'QuoteStatus'
   */
  export type EnumQuoteStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuoteStatus'>
    


  /**
   * Reference to a field of type 'QuoteStatus[]'
   */
  export type ListEnumQuoteStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuoteStatus[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'DiscountType'
   */
  export type EnumDiscountTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DiscountType'>
    


  /**
   * Reference to a field of type 'DiscountType[]'
   */
  export type ListEnumDiscountTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DiscountType[]'>
    


  /**
   * Reference to a field of type 'LineItemCategory'
   */
  export type EnumLineItemCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LineItemCategory'>
    


  /**
   * Reference to a field of type 'LineItemCategory[]'
   */
  export type ListEnumLineItemCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LineItemCategory[]'>
    


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
   * Reference to a field of type 'InvoiceStatus'
   */
  export type EnumInvoiceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InvoiceStatus'>
    


  /**
   * Reference to a field of type 'InvoiceStatus[]'
   */
  export type ListEnumInvoiceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InvoiceStatus[]'>
    


  /**
   * Reference to a field of type 'PaymentMethod'
   */
  export type EnumPaymentMethodFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentMethod'>
    


  /**
   * Reference to a field of type 'PaymentMethod[]'
   */
  export type ListEnumPaymentMethodFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentMethod[]'>
    


  /**
   * Reference to a field of type 'PaymentStatus'
   */
  export type EnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus'>
    


  /**
   * Reference to a field of type 'PaymentStatus[]'
   */
  export type ListEnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus[]'>
    


  /**
   * Reference to a field of type 'RecurringFrequency'
   */
  export type EnumRecurringFrequencyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RecurringFrequency'>
    


  /**
   * Reference to a field of type 'RecurringFrequency[]'
   */
  export type ListEnumRecurringFrequencyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RecurringFrequency[]'>
    


  /**
   * Reference to a field of type 'ExpenseCategory'
   */
  export type EnumExpenseCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExpenseCategory'>
    


  /**
   * Reference to a field of type 'ExpenseCategory[]'
   */
  export type ListEnumExpenseCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExpenseCategory[]'>
    


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


  export type QuoteWhereInput = {
    AND?: QuoteWhereInput | QuoteWhereInput[]
    OR?: QuoteWhereInput[]
    NOT?: QuoteWhereInput | QuoteWhereInput[]
    id?: StringFilter<"Quote"> | string
    companyId?: StringFilter<"Quote"> | string
    quoteNumber?: StringFilter<"Quote"> | string
    jobId?: StringNullableFilter<"Quote"> | string | null
    customerId?: StringFilter<"Quote"> | string
    customerName?: StringFilter<"Quote"> | string
    customerEmail?: StringFilter<"Quote"> | string
    title?: StringFilter<"Quote"> | string
    description?: StringNullableFilter<"Quote"> | string | null
    status?: EnumQuoteStatusFilter<"Quote"> | $Enums.QuoteStatus
    validUntil?: DateTimeNullableFilter<"Quote"> | Date | string | null
    subtotal?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    discountType?: EnumDiscountTypeNullableFilter<"Quote"> | $Enums.DiscountType | null
    discountValue?: DecimalNullableFilter<"Quote"> | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    total?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableFilter<"Quote"> | string | null
    terms?: StringNullableFilter<"Quote"> | string | null
    pdfUrl?: StringNullableFilter<"Quote"> | string | null
    approvalToken?: StringNullableFilter<"Quote"> | string | null
    approvedAt?: DateTimeNullableFilter<"Quote"> | Date | string | null
    approvedByName?: StringNullableFilter<"Quote"> | string | null
    approvedByEmail?: StringNullableFilter<"Quote"> | string | null
    sentAt?: DateTimeNullableFilter<"Quote"> | Date | string | null
    viewedAt?: DateTimeNullableFilter<"Quote"> | Date | string | null
    createdByUserId?: StringFilter<"Quote"> | string
    createdAt?: DateTimeFilter<"Quote"> | Date | string
    updatedAt?: DateTimeFilter<"Quote"> | Date | string
    lineItems?: QuoteLineItemListRelationFilter
    invoices?: InvoiceListRelationFilter
  }

  export type QuoteOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    quoteNumber?: SortOrder
    jobId?: SortOrderInput | SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    validUntil?: SortOrderInput | SortOrder
    subtotal?: SortOrder
    discountType?: SortOrderInput | SortOrder
    discountValue?: SortOrderInput | SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    notes?: SortOrderInput | SortOrder
    terms?: SortOrderInput | SortOrder
    pdfUrl?: SortOrderInput | SortOrder
    approvalToken?: SortOrderInput | SortOrder
    approvedAt?: SortOrderInput | SortOrder
    approvedByName?: SortOrderInput | SortOrder
    approvedByEmail?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    viewedAt?: SortOrderInput | SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lineItems?: QuoteLineItemOrderByRelationAggregateInput
    invoices?: InvoiceOrderByRelationAggregateInput
  }

  export type QuoteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    approvalToken?: string
    companyId_quoteNumber?: QuoteCompanyIdQuoteNumberCompoundUniqueInput
    AND?: QuoteWhereInput | QuoteWhereInput[]
    OR?: QuoteWhereInput[]
    NOT?: QuoteWhereInput | QuoteWhereInput[]
    companyId?: StringFilter<"Quote"> | string
    quoteNumber?: StringFilter<"Quote"> | string
    jobId?: StringNullableFilter<"Quote"> | string | null
    customerId?: StringFilter<"Quote"> | string
    customerName?: StringFilter<"Quote"> | string
    customerEmail?: StringFilter<"Quote"> | string
    title?: StringFilter<"Quote"> | string
    description?: StringNullableFilter<"Quote"> | string | null
    status?: EnumQuoteStatusFilter<"Quote"> | $Enums.QuoteStatus
    validUntil?: DateTimeNullableFilter<"Quote"> | Date | string | null
    subtotal?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    discountType?: EnumDiscountTypeNullableFilter<"Quote"> | $Enums.DiscountType | null
    discountValue?: DecimalNullableFilter<"Quote"> | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    total?: DecimalFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableFilter<"Quote"> | string | null
    terms?: StringNullableFilter<"Quote"> | string | null
    pdfUrl?: StringNullableFilter<"Quote"> | string | null
    approvedAt?: DateTimeNullableFilter<"Quote"> | Date | string | null
    approvedByName?: StringNullableFilter<"Quote"> | string | null
    approvedByEmail?: StringNullableFilter<"Quote"> | string | null
    sentAt?: DateTimeNullableFilter<"Quote"> | Date | string | null
    viewedAt?: DateTimeNullableFilter<"Quote"> | Date | string | null
    createdByUserId?: StringFilter<"Quote"> | string
    createdAt?: DateTimeFilter<"Quote"> | Date | string
    updatedAt?: DateTimeFilter<"Quote"> | Date | string
    lineItems?: QuoteLineItemListRelationFilter
    invoices?: InvoiceListRelationFilter
  }, "id" | "approvalToken" | "companyId_quoteNumber">

  export type QuoteOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    quoteNumber?: SortOrder
    jobId?: SortOrderInput | SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    validUntil?: SortOrderInput | SortOrder
    subtotal?: SortOrder
    discountType?: SortOrderInput | SortOrder
    discountValue?: SortOrderInput | SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    notes?: SortOrderInput | SortOrder
    terms?: SortOrderInput | SortOrder
    pdfUrl?: SortOrderInput | SortOrder
    approvalToken?: SortOrderInput | SortOrder
    approvedAt?: SortOrderInput | SortOrder
    approvedByName?: SortOrderInput | SortOrder
    approvedByEmail?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    viewedAt?: SortOrderInput | SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QuoteCountOrderByAggregateInput
    _avg?: QuoteAvgOrderByAggregateInput
    _max?: QuoteMaxOrderByAggregateInput
    _min?: QuoteMinOrderByAggregateInput
    _sum?: QuoteSumOrderByAggregateInput
  }

  export type QuoteScalarWhereWithAggregatesInput = {
    AND?: QuoteScalarWhereWithAggregatesInput | QuoteScalarWhereWithAggregatesInput[]
    OR?: QuoteScalarWhereWithAggregatesInput[]
    NOT?: QuoteScalarWhereWithAggregatesInput | QuoteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Quote"> | string
    companyId?: StringWithAggregatesFilter<"Quote"> | string
    quoteNumber?: StringWithAggregatesFilter<"Quote"> | string
    jobId?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    customerId?: StringWithAggregatesFilter<"Quote"> | string
    customerName?: StringWithAggregatesFilter<"Quote"> | string
    customerEmail?: StringWithAggregatesFilter<"Quote"> | string
    title?: StringWithAggregatesFilter<"Quote"> | string
    description?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    status?: EnumQuoteStatusWithAggregatesFilter<"Quote"> | $Enums.QuoteStatus
    validUntil?: DateTimeNullableWithAggregatesFilter<"Quote"> | Date | string | null
    subtotal?: DecimalWithAggregatesFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    discountType?: EnumDiscountTypeNullableWithAggregatesFilter<"Quote"> | $Enums.DiscountType | null
    discountValue?: DecimalNullableWithAggregatesFilter<"Quote"> | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalWithAggregatesFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalWithAggregatesFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalWithAggregatesFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    total?: DecimalWithAggregatesFilter<"Quote"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    terms?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    pdfUrl?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    approvalToken?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    approvedAt?: DateTimeNullableWithAggregatesFilter<"Quote"> | Date | string | null
    approvedByName?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    approvedByEmail?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    sentAt?: DateTimeNullableWithAggregatesFilter<"Quote"> | Date | string | null
    viewedAt?: DateTimeNullableWithAggregatesFilter<"Quote"> | Date | string | null
    createdByUserId?: StringWithAggregatesFilter<"Quote"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Quote"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Quote"> | Date | string
  }

  export type QuoteLineItemWhereInput = {
    AND?: QuoteLineItemWhereInput | QuoteLineItemWhereInput[]
    OR?: QuoteLineItemWhereInput[]
    NOT?: QuoteLineItemWhereInput | QuoteLineItemWhereInput[]
    id?: StringFilter<"QuoteLineItem"> | string
    quoteId?: StringFilter<"QuoteLineItem"> | string
    description?: StringFilter<"QuoteLineItem"> | string
    category?: EnumLineItemCategoryFilter<"QuoteLineItem"> | $Enums.LineItemCategory
    quantity?: DecimalFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"QuoteLineItem"> | boolean
    sortOrder?: IntFilter<"QuoteLineItem"> | number
    quote?: XOR<QuoteRelationFilter, QuoteWhereInput>
  }

  export type QuoteLineItemOrderByWithRelationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
    quote?: QuoteOrderByWithRelationInput
  }

  export type QuoteLineItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QuoteLineItemWhereInput | QuoteLineItemWhereInput[]
    OR?: QuoteLineItemWhereInput[]
    NOT?: QuoteLineItemWhereInput | QuoteLineItemWhereInput[]
    quoteId?: StringFilter<"QuoteLineItem"> | string
    description?: StringFilter<"QuoteLineItem"> | string
    category?: EnumLineItemCategoryFilter<"QuoteLineItem"> | $Enums.LineItemCategory
    quantity?: DecimalFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"QuoteLineItem"> | boolean
    sortOrder?: IntFilter<"QuoteLineItem"> | number
    quote?: XOR<QuoteRelationFilter, QuoteWhereInput>
  }, "id">

  export type QuoteLineItemOrderByWithAggregationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
    _count?: QuoteLineItemCountOrderByAggregateInput
    _avg?: QuoteLineItemAvgOrderByAggregateInput
    _max?: QuoteLineItemMaxOrderByAggregateInput
    _min?: QuoteLineItemMinOrderByAggregateInput
    _sum?: QuoteLineItemSumOrderByAggregateInput
  }

  export type QuoteLineItemScalarWhereWithAggregatesInput = {
    AND?: QuoteLineItemScalarWhereWithAggregatesInput | QuoteLineItemScalarWhereWithAggregatesInput[]
    OR?: QuoteLineItemScalarWhereWithAggregatesInput[]
    NOT?: QuoteLineItemScalarWhereWithAggregatesInput | QuoteLineItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuoteLineItem"> | string
    quoteId?: StringWithAggregatesFilter<"QuoteLineItem"> | string
    description?: StringWithAggregatesFilter<"QuoteLineItem"> | string
    category?: EnumLineItemCategoryWithAggregatesFilter<"QuoteLineItem"> | $Enums.LineItemCategory
    quantity?: DecimalWithAggregatesFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalWithAggregatesFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalWithAggregatesFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolWithAggregatesFilter<"QuoteLineItem"> | boolean
    sortOrder?: IntWithAggregatesFilter<"QuoteLineItem"> | number
  }

  export type InvoiceWhereInput = {
    AND?: InvoiceWhereInput | InvoiceWhereInput[]
    OR?: InvoiceWhereInput[]
    NOT?: InvoiceWhereInput | InvoiceWhereInput[]
    id?: StringFilter<"Invoice"> | string
    companyId?: StringFilter<"Invoice"> | string
    invoiceNumber?: StringFilter<"Invoice"> | string
    quoteId?: StringNullableFilter<"Invoice"> | string | null
    jobId?: StringNullableFilter<"Invoice"> | string | null
    workOrderId?: StringNullableFilter<"Invoice"> | string | null
    customerId?: StringFilter<"Invoice"> | string
    customerName?: StringFilter<"Invoice"> | string
    customerEmail?: StringFilter<"Invoice"> | string
    status?: EnumInvoiceStatusFilter<"Invoice"> | $Enums.InvoiceStatus
    dueDate?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    dueDays?: IntFilter<"Invoice"> | number
    subtotal?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    total?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableFilter<"Invoice"> | string | null
    terms?: StringNullableFilter<"Invoice"> | string | null
    pdfUrl?: StringNullableFilter<"Invoice"> | string | null
    stripePaymentIntentId?: StringNullableFilter<"Invoice"> | string | null
    stripePaymentUrl?: StringNullableFilter<"Invoice"> | string | null
    quickbooksId?: StringNullableFilter<"Invoice"> | string | null
    sentAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    voidedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    approvedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    approvedByName?: StringNullableFilter<"Invoice"> | string | null
    approvedByEmail?: StringNullableFilter<"Invoice"> | string | null
    declinedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    declinedByName?: StringNullableFilter<"Invoice"> | string | null
    declinedByEmail?: StringNullableFilter<"Invoice"> | string | null
    declineReason?: StringNullableFilter<"Invoice"> | string | null
    createdByUserId?: StringFilter<"Invoice"> | string
    recurringScheduleId?: StringNullableFilter<"Invoice"> | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
    quote?: XOR<QuoteNullableRelationFilter, QuoteWhereInput> | null
    recurringSchedule?: XOR<RecurringScheduleNullableRelationFilter, RecurringScheduleWhereInput> | null
    lineItems?: InvoiceLineItemListRelationFilter
    payments?: PaymentListRelationFilter
  }

  export type InvoiceOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceNumber?: SortOrder
    quoteId?: SortOrderInput | SortOrder
    jobId?: SortOrderInput | SortOrder
    workOrderId?: SortOrderInput | SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    status?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    dueDays?: SortOrder
    subtotal?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    amountPaid?: SortOrder
    balanceDue?: SortOrder
    notes?: SortOrderInput | SortOrder
    terms?: SortOrderInput | SortOrder
    pdfUrl?: SortOrderInput | SortOrder
    stripePaymentIntentId?: SortOrderInput | SortOrder
    stripePaymentUrl?: SortOrderInput | SortOrder
    quickbooksId?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    voidedAt?: SortOrderInput | SortOrder
    approvedAt?: SortOrderInput | SortOrder
    approvedByName?: SortOrderInput | SortOrder
    approvedByEmail?: SortOrderInput | SortOrder
    declinedAt?: SortOrderInput | SortOrder
    declinedByName?: SortOrderInput | SortOrder
    declinedByEmail?: SortOrderInput | SortOrder
    declineReason?: SortOrderInput | SortOrder
    createdByUserId?: SortOrder
    recurringScheduleId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    quote?: QuoteOrderByWithRelationInput
    recurringSchedule?: RecurringScheduleOrderByWithRelationInput
    lineItems?: InvoiceLineItemOrderByRelationAggregateInput
    payments?: PaymentOrderByRelationAggregateInput
  }

  export type InvoiceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_invoiceNumber?: InvoiceCompanyIdInvoiceNumberCompoundUniqueInput
    AND?: InvoiceWhereInput | InvoiceWhereInput[]
    OR?: InvoiceWhereInput[]
    NOT?: InvoiceWhereInput | InvoiceWhereInput[]
    companyId?: StringFilter<"Invoice"> | string
    invoiceNumber?: StringFilter<"Invoice"> | string
    quoteId?: StringNullableFilter<"Invoice"> | string | null
    jobId?: StringNullableFilter<"Invoice"> | string | null
    workOrderId?: StringNullableFilter<"Invoice"> | string | null
    customerId?: StringFilter<"Invoice"> | string
    customerName?: StringFilter<"Invoice"> | string
    customerEmail?: StringFilter<"Invoice"> | string
    status?: EnumInvoiceStatusFilter<"Invoice"> | $Enums.InvoiceStatus
    dueDate?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    dueDays?: IntFilter<"Invoice"> | number
    subtotal?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    total?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableFilter<"Invoice"> | string | null
    terms?: StringNullableFilter<"Invoice"> | string | null
    pdfUrl?: StringNullableFilter<"Invoice"> | string | null
    stripePaymentIntentId?: StringNullableFilter<"Invoice"> | string | null
    stripePaymentUrl?: StringNullableFilter<"Invoice"> | string | null
    quickbooksId?: StringNullableFilter<"Invoice"> | string | null
    sentAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    voidedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    approvedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    approvedByName?: StringNullableFilter<"Invoice"> | string | null
    approvedByEmail?: StringNullableFilter<"Invoice"> | string | null
    declinedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    declinedByName?: StringNullableFilter<"Invoice"> | string | null
    declinedByEmail?: StringNullableFilter<"Invoice"> | string | null
    declineReason?: StringNullableFilter<"Invoice"> | string | null
    createdByUserId?: StringFilter<"Invoice"> | string
    recurringScheduleId?: StringNullableFilter<"Invoice"> | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
    quote?: XOR<QuoteNullableRelationFilter, QuoteWhereInput> | null
    recurringSchedule?: XOR<RecurringScheduleNullableRelationFilter, RecurringScheduleWhereInput> | null
    lineItems?: InvoiceLineItemListRelationFilter
    payments?: PaymentListRelationFilter
  }, "id" | "companyId_invoiceNumber">

  export type InvoiceOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceNumber?: SortOrder
    quoteId?: SortOrderInput | SortOrder
    jobId?: SortOrderInput | SortOrder
    workOrderId?: SortOrderInput | SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    status?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    dueDays?: SortOrder
    subtotal?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    amountPaid?: SortOrder
    balanceDue?: SortOrder
    notes?: SortOrderInput | SortOrder
    terms?: SortOrderInput | SortOrder
    pdfUrl?: SortOrderInput | SortOrder
    stripePaymentIntentId?: SortOrderInput | SortOrder
    stripePaymentUrl?: SortOrderInput | SortOrder
    quickbooksId?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    voidedAt?: SortOrderInput | SortOrder
    approvedAt?: SortOrderInput | SortOrder
    approvedByName?: SortOrderInput | SortOrder
    approvedByEmail?: SortOrderInput | SortOrder
    declinedAt?: SortOrderInput | SortOrder
    declinedByName?: SortOrderInput | SortOrder
    declinedByEmail?: SortOrderInput | SortOrder
    declineReason?: SortOrderInput | SortOrder
    createdByUserId?: SortOrder
    recurringScheduleId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InvoiceCountOrderByAggregateInput
    _avg?: InvoiceAvgOrderByAggregateInput
    _max?: InvoiceMaxOrderByAggregateInput
    _min?: InvoiceMinOrderByAggregateInput
    _sum?: InvoiceSumOrderByAggregateInput
  }

  export type InvoiceScalarWhereWithAggregatesInput = {
    AND?: InvoiceScalarWhereWithAggregatesInput | InvoiceScalarWhereWithAggregatesInput[]
    OR?: InvoiceScalarWhereWithAggregatesInput[]
    NOT?: InvoiceScalarWhereWithAggregatesInput | InvoiceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Invoice"> | string
    companyId?: StringWithAggregatesFilter<"Invoice"> | string
    invoiceNumber?: StringWithAggregatesFilter<"Invoice"> | string
    quoteId?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    jobId?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    workOrderId?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    customerId?: StringWithAggregatesFilter<"Invoice"> | string
    customerName?: StringWithAggregatesFilter<"Invoice"> | string
    customerEmail?: StringWithAggregatesFilter<"Invoice"> | string
    status?: EnumInvoiceStatusWithAggregatesFilter<"Invoice"> | $Enums.InvoiceStatus
    dueDate?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    dueDays?: IntWithAggregatesFilter<"Invoice"> | number
    subtotal?: DecimalWithAggregatesFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalWithAggregatesFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalWithAggregatesFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalWithAggregatesFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    total?: DecimalWithAggregatesFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalWithAggregatesFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalWithAggregatesFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    terms?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    pdfUrl?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    stripePaymentIntentId?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    stripePaymentUrl?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    quickbooksId?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    sentAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    voidedAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    approvedAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    approvedByName?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    approvedByEmail?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    declinedAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    declinedByName?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    declinedByEmail?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    declineReason?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    createdByUserId?: StringWithAggregatesFilter<"Invoice"> | string
    recurringScheduleId?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Invoice"> | Date | string
  }

  export type InvoiceLineItemWhereInput = {
    AND?: InvoiceLineItemWhereInput | InvoiceLineItemWhereInput[]
    OR?: InvoiceLineItemWhereInput[]
    NOT?: InvoiceLineItemWhereInput | InvoiceLineItemWhereInput[]
    id?: StringFilter<"InvoiceLineItem"> | string
    invoiceId?: StringFilter<"InvoiceLineItem"> | string
    description?: StringFilter<"InvoiceLineItem"> | string
    category?: EnumLineItemCategoryFilter<"InvoiceLineItem"> | $Enums.LineItemCategory
    quantity?: DecimalFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"InvoiceLineItem"> | boolean
    sortOrder?: IntFilter<"InvoiceLineItem"> | number
    invoice?: XOR<InvoiceRelationFilter, InvoiceWhereInput>
  }

  export type InvoiceLineItemOrderByWithRelationInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
    invoice?: InvoiceOrderByWithRelationInput
  }

  export type InvoiceLineItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InvoiceLineItemWhereInput | InvoiceLineItemWhereInput[]
    OR?: InvoiceLineItemWhereInput[]
    NOT?: InvoiceLineItemWhereInput | InvoiceLineItemWhereInput[]
    invoiceId?: StringFilter<"InvoiceLineItem"> | string
    description?: StringFilter<"InvoiceLineItem"> | string
    category?: EnumLineItemCategoryFilter<"InvoiceLineItem"> | $Enums.LineItemCategory
    quantity?: DecimalFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"InvoiceLineItem"> | boolean
    sortOrder?: IntFilter<"InvoiceLineItem"> | number
    invoice?: XOR<InvoiceRelationFilter, InvoiceWhereInput>
  }, "id">

  export type InvoiceLineItemOrderByWithAggregationInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
    _count?: InvoiceLineItemCountOrderByAggregateInput
    _avg?: InvoiceLineItemAvgOrderByAggregateInput
    _max?: InvoiceLineItemMaxOrderByAggregateInput
    _min?: InvoiceLineItemMinOrderByAggregateInput
    _sum?: InvoiceLineItemSumOrderByAggregateInput
  }

  export type InvoiceLineItemScalarWhereWithAggregatesInput = {
    AND?: InvoiceLineItemScalarWhereWithAggregatesInput | InvoiceLineItemScalarWhereWithAggregatesInput[]
    OR?: InvoiceLineItemScalarWhereWithAggregatesInput[]
    NOT?: InvoiceLineItemScalarWhereWithAggregatesInput | InvoiceLineItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"InvoiceLineItem"> | string
    invoiceId?: StringWithAggregatesFilter<"InvoiceLineItem"> | string
    description?: StringWithAggregatesFilter<"InvoiceLineItem"> | string
    category?: EnumLineItemCategoryWithAggregatesFilter<"InvoiceLineItem"> | $Enums.LineItemCategory
    quantity?: DecimalWithAggregatesFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalWithAggregatesFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalWithAggregatesFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolWithAggregatesFilter<"InvoiceLineItem"> | boolean
    sortOrder?: IntWithAggregatesFilter<"InvoiceLineItem"> | number
  }

  export type PaymentWhereInput = {
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    id?: StringFilter<"Payment"> | string
    companyId?: StringFilter<"Payment"> | string
    invoiceId?: StringFilter<"Payment"> | string
    amount?: DecimalFilter<"Payment"> | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFilter<"Payment"> | $Enums.PaymentMethod
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    stripePaymentIntentId?: StringNullableFilter<"Payment"> | string | null
    stripeChargeId?: StringNullableFilter<"Payment"> | string | null
    quickbooksId?: StringNullableFilter<"Payment"> | string | null
    paidAt?: DateTimeNullableFilter<"Payment"> | Date | string | null
    notes?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
    invoice?: XOR<InvoiceRelationFilter, InvoiceWhereInput>
  }

  export type PaymentOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceId?: SortOrder
    amount?: SortOrder
    paymentMethod?: SortOrder
    status?: SortOrder
    stripePaymentIntentId?: SortOrderInput | SortOrder
    stripeChargeId?: SortOrderInput | SortOrder
    quickbooksId?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    invoice?: InvoiceOrderByWithRelationInput
  }

  export type PaymentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    companyId?: StringFilter<"Payment"> | string
    invoiceId?: StringFilter<"Payment"> | string
    amount?: DecimalFilter<"Payment"> | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFilter<"Payment"> | $Enums.PaymentMethod
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    stripePaymentIntentId?: StringNullableFilter<"Payment"> | string | null
    stripeChargeId?: StringNullableFilter<"Payment"> | string | null
    quickbooksId?: StringNullableFilter<"Payment"> | string | null
    paidAt?: DateTimeNullableFilter<"Payment"> | Date | string | null
    notes?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
    invoice?: XOR<InvoiceRelationFilter, InvoiceWhereInput>
  }, "id">

  export type PaymentOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceId?: SortOrder
    amount?: SortOrder
    paymentMethod?: SortOrder
    status?: SortOrder
    stripePaymentIntentId?: SortOrderInput | SortOrder
    stripeChargeId?: SortOrderInput | SortOrder
    quickbooksId?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PaymentCountOrderByAggregateInput
    _avg?: PaymentAvgOrderByAggregateInput
    _max?: PaymentMaxOrderByAggregateInput
    _min?: PaymentMinOrderByAggregateInput
    _sum?: PaymentSumOrderByAggregateInput
  }

  export type PaymentScalarWhereWithAggregatesInput = {
    AND?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    OR?: PaymentScalarWhereWithAggregatesInput[]
    NOT?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Payment"> | string
    companyId?: StringWithAggregatesFilter<"Payment"> | string
    invoiceId?: StringWithAggregatesFilter<"Payment"> | string
    amount?: DecimalWithAggregatesFilter<"Payment"> | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodWithAggregatesFilter<"Payment"> | $Enums.PaymentMethod
    status?: EnumPaymentStatusWithAggregatesFilter<"Payment"> | $Enums.PaymentStatus
    stripePaymentIntentId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    stripeChargeId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    quickbooksId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    paidAt?: DateTimeNullableWithAggregatesFilter<"Payment"> | Date | string | null
    notes?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
  }

  export type RecurringScheduleWhereInput = {
    AND?: RecurringScheduleWhereInput | RecurringScheduleWhereInput[]
    OR?: RecurringScheduleWhereInput[]
    NOT?: RecurringScheduleWhereInput | RecurringScheduleWhereInput[]
    id?: StringFilter<"RecurringSchedule"> | string
    companyId?: StringFilter<"RecurringSchedule"> | string
    customerId?: StringFilter<"RecurringSchedule"> | string
    customerName?: StringFilter<"RecurringSchedule"> | string
    customerEmail?: StringFilter<"RecurringSchedule"> | string
    description?: StringFilter<"RecurringSchedule"> | string
    frequency?: EnumRecurringFrequencyFilter<"RecurringSchedule"> | $Enums.RecurringFrequency
    amount?: DecimalFilter<"RecurringSchedule"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFilter<"RecurringSchedule"> | Decimal | DecimalJsLike | number | string
    nextBillingDate?: DateTimeFilter<"RecurringSchedule"> | Date | string
    isActive?: BoolFilter<"RecurringSchedule"> | boolean
    jobId?: StringNullableFilter<"RecurringSchedule"> | string | null
    createdAt?: DateTimeFilter<"RecurringSchedule"> | Date | string
    updatedAt?: DateTimeFilter<"RecurringSchedule"> | Date | string
    invoices?: InvoiceListRelationFilter
  }

  export type RecurringScheduleOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    description?: SortOrder
    frequency?: SortOrder
    amount?: SortOrder
    taxRate?: SortOrder
    nextBillingDate?: SortOrder
    isActive?: SortOrder
    jobId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    invoices?: InvoiceOrderByRelationAggregateInput
  }

  export type RecurringScheduleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RecurringScheduleWhereInput | RecurringScheduleWhereInput[]
    OR?: RecurringScheduleWhereInput[]
    NOT?: RecurringScheduleWhereInput | RecurringScheduleWhereInput[]
    companyId?: StringFilter<"RecurringSchedule"> | string
    customerId?: StringFilter<"RecurringSchedule"> | string
    customerName?: StringFilter<"RecurringSchedule"> | string
    customerEmail?: StringFilter<"RecurringSchedule"> | string
    description?: StringFilter<"RecurringSchedule"> | string
    frequency?: EnumRecurringFrequencyFilter<"RecurringSchedule"> | $Enums.RecurringFrequency
    amount?: DecimalFilter<"RecurringSchedule"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFilter<"RecurringSchedule"> | Decimal | DecimalJsLike | number | string
    nextBillingDate?: DateTimeFilter<"RecurringSchedule"> | Date | string
    isActive?: BoolFilter<"RecurringSchedule"> | boolean
    jobId?: StringNullableFilter<"RecurringSchedule"> | string | null
    createdAt?: DateTimeFilter<"RecurringSchedule"> | Date | string
    updatedAt?: DateTimeFilter<"RecurringSchedule"> | Date | string
    invoices?: InvoiceListRelationFilter
  }, "id">

  export type RecurringScheduleOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    description?: SortOrder
    frequency?: SortOrder
    amount?: SortOrder
    taxRate?: SortOrder
    nextBillingDate?: SortOrder
    isActive?: SortOrder
    jobId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: RecurringScheduleCountOrderByAggregateInput
    _avg?: RecurringScheduleAvgOrderByAggregateInput
    _max?: RecurringScheduleMaxOrderByAggregateInput
    _min?: RecurringScheduleMinOrderByAggregateInput
    _sum?: RecurringScheduleSumOrderByAggregateInput
  }

  export type RecurringScheduleScalarWhereWithAggregatesInput = {
    AND?: RecurringScheduleScalarWhereWithAggregatesInput | RecurringScheduleScalarWhereWithAggregatesInput[]
    OR?: RecurringScheduleScalarWhereWithAggregatesInput[]
    NOT?: RecurringScheduleScalarWhereWithAggregatesInput | RecurringScheduleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"RecurringSchedule"> | string
    companyId?: StringWithAggregatesFilter<"RecurringSchedule"> | string
    customerId?: StringWithAggregatesFilter<"RecurringSchedule"> | string
    customerName?: StringWithAggregatesFilter<"RecurringSchedule"> | string
    customerEmail?: StringWithAggregatesFilter<"RecurringSchedule"> | string
    description?: StringWithAggregatesFilter<"RecurringSchedule"> | string
    frequency?: EnumRecurringFrequencyWithAggregatesFilter<"RecurringSchedule"> | $Enums.RecurringFrequency
    amount?: DecimalWithAggregatesFilter<"RecurringSchedule"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalWithAggregatesFilter<"RecurringSchedule"> | Decimal | DecimalJsLike | number | string
    nextBillingDate?: DateTimeWithAggregatesFilter<"RecurringSchedule"> | Date | string
    isActive?: BoolWithAggregatesFilter<"RecurringSchedule"> | boolean
    jobId?: StringNullableWithAggregatesFilter<"RecurringSchedule"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"RecurringSchedule"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"RecurringSchedule"> | Date | string
  }

  export type ExpenseWhereInput = {
    AND?: ExpenseWhereInput | ExpenseWhereInput[]
    OR?: ExpenseWhereInput[]
    NOT?: ExpenseWhereInput | ExpenseWhereInput[]
    id?: StringFilter<"Expense"> | string
    companyId?: StringFilter<"Expense"> | string
    jobId?: StringNullableFilter<"Expense"> | string | null
    technicianId?: StringNullableFilter<"Expense"> | string | null
    category?: EnumExpenseCategoryFilter<"Expense"> | $Enums.ExpenseCategory
    description?: StringFilter<"Expense"> | string
    amount?: DecimalFilter<"Expense"> | Decimal | DecimalJsLike | number | string
    vendor?: StringNullableFilter<"Expense"> | string | null
    receiptUrl?: StringNullableFilter<"Expense"> | string | null
    expenseDate?: DateTimeFilter<"Expense"> | Date | string
    isReimbursable?: BoolFilter<"Expense"> | boolean
    createdByUserId?: StringFilter<"Expense"> | string
    createdAt?: DateTimeFilter<"Expense"> | Date | string
    updatedAt?: DateTimeFilter<"Expense"> | Date | string
  }

  export type ExpenseOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrderInput | SortOrder
    technicianId?: SortOrderInput | SortOrder
    category?: SortOrder
    description?: SortOrder
    amount?: SortOrder
    vendor?: SortOrderInput | SortOrder
    receiptUrl?: SortOrderInput | SortOrder
    expenseDate?: SortOrder
    isReimbursable?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ExpenseWhereInput | ExpenseWhereInput[]
    OR?: ExpenseWhereInput[]
    NOT?: ExpenseWhereInput | ExpenseWhereInput[]
    companyId?: StringFilter<"Expense"> | string
    jobId?: StringNullableFilter<"Expense"> | string | null
    technicianId?: StringNullableFilter<"Expense"> | string | null
    category?: EnumExpenseCategoryFilter<"Expense"> | $Enums.ExpenseCategory
    description?: StringFilter<"Expense"> | string
    amount?: DecimalFilter<"Expense"> | Decimal | DecimalJsLike | number | string
    vendor?: StringNullableFilter<"Expense"> | string | null
    receiptUrl?: StringNullableFilter<"Expense"> | string | null
    expenseDate?: DateTimeFilter<"Expense"> | Date | string
    isReimbursable?: BoolFilter<"Expense"> | boolean
    createdByUserId?: StringFilter<"Expense"> | string
    createdAt?: DateTimeFilter<"Expense"> | Date | string
    updatedAt?: DateTimeFilter<"Expense"> | Date | string
  }, "id">

  export type ExpenseOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrderInput | SortOrder
    technicianId?: SortOrderInput | SortOrder
    category?: SortOrder
    description?: SortOrder
    amount?: SortOrder
    vendor?: SortOrderInput | SortOrder
    receiptUrl?: SortOrderInput | SortOrder
    expenseDate?: SortOrder
    isReimbursable?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ExpenseCountOrderByAggregateInput
    _avg?: ExpenseAvgOrderByAggregateInput
    _max?: ExpenseMaxOrderByAggregateInput
    _min?: ExpenseMinOrderByAggregateInput
    _sum?: ExpenseSumOrderByAggregateInput
  }

  export type ExpenseScalarWhereWithAggregatesInput = {
    AND?: ExpenseScalarWhereWithAggregatesInput | ExpenseScalarWhereWithAggregatesInput[]
    OR?: ExpenseScalarWhereWithAggregatesInput[]
    NOT?: ExpenseScalarWhereWithAggregatesInput | ExpenseScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Expense"> | string
    companyId?: StringWithAggregatesFilter<"Expense"> | string
    jobId?: StringNullableWithAggregatesFilter<"Expense"> | string | null
    technicianId?: StringNullableWithAggregatesFilter<"Expense"> | string | null
    category?: EnumExpenseCategoryWithAggregatesFilter<"Expense"> | $Enums.ExpenseCategory
    description?: StringWithAggregatesFilter<"Expense"> | string
    amount?: DecimalWithAggregatesFilter<"Expense"> | Decimal | DecimalJsLike | number | string
    vendor?: StringNullableWithAggregatesFilter<"Expense"> | string | null
    receiptUrl?: StringNullableWithAggregatesFilter<"Expense"> | string | null
    expenseDate?: DateTimeWithAggregatesFilter<"Expense"> | Date | string
    isReimbursable?: BoolWithAggregatesFilter<"Expense"> | boolean
    createdByUserId?: StringWithAggregatesFilter<"Expense"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Expense"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Expense"> | Date | string
  }

  export type QuickBooksConnectionWhereInput = {
    AND?: QuickBooksConnectionWhereInput | QuickBooksConnectionWhereInput[]
    OR?: QuickBooksConnectionWhereInput[]
    NOT?: QuickBooksConnectionWhereInput | QuickBooksConnectionWhereInput[]
    id?: StringFilter<"QuickBooksConnection"> | string
    companyId?: StringFilter<"QuickBooksConnection"> | string
    realmId?: StringFilter<"QuickBooksConnection"> | string
    accessToken?: StringFilter<"QuickBooksConnection"> | string
    refreshToken?: StringFilter<"QuickBooksConnection"> | string
    tokenExpiresAt?: DateTimeFilter<"QuickBooksConnection"> | Date | string
    createdAt?: DateTimeFilter<"QuickBooksConnection"> | Date | string
    updatedAt?: DateTimeFilter<"QuickBooksConnection"> | Date | string
  }

  export type QuickBooksConnectionOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    realmId?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    tokenExpiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuickBooksConnectionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId?: string
    AND?: QuickBooksConnectionWhereInput | QuickBooksConnectionWhereInput[]
    OR?: QuickBooksConnectionWhereInput[]
    NOT?: QuickBooksConnectionWhereInput | QuickBooksConnectionWhereInput[]
    realmId?: StringFilter<"QuickBooksConnection"> | string
    accessToken?: StringFilter<"QuickBooksConnection"> | string
    refreshToken?: StringFilter<"QuickBooksConnection"> | string
    tokenExpiresAt?: DateTimeFilter<"QuickBooksConnection"> | Date | string
    createdAt?: DateTimeFilter<"QuickBooksConnection"> | Date | string
    updatedAt?: DateTimeFilter<"QuickBooksConnection"> | Date | string
  }, "id" | "companyId">

  export type QuickBooksConnectionOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    realmId?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    tokenExpiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QuickBooksConnectionCountOrderByAggregateInput
    _max?: QuickBooksConnectionMaxOrderByAggregateInput
    _min?: QuickBooksConnectionMinOrderByAggregateInput
  }

  export type QuickBooksConnectionScalarWhereWithAggregatesInput = {
    AND?: QuickBooksConnectionScalarWhereWithAggregatesInput | QuickBooksConnectionScalarWhereWithAggregatesInput[]
    OR?: QuickBooksConnectionScalarWhereWithAggregatesInput[]
    NOT?: QuickBooksConnectionScalarWhereWithAggregatesInput | QuickBooksConnectionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuickBooksConnection"> | string
    companyId?: StringWithAggregatesFilter<"QuickBooksConnection"> | string
    realmId?: StringWithAggregatesFilter<"QuickBooksConnection"> | string
    accessToken?: StringWithAggregatesFilter<"QuickBooksConnection"> | string
    refreshToken?: StringWithAggregatesFilter<"QuickBooksConnection"> | string
    tokenExpiresAt?: DateTimeWithAggregatesFilter<"QuickBooksConnection"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"QuickBooksConnection"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"QuickBooksConnection"> | Date | string
  }

  export type QuickBooksCustomerMapWhereInput = {
    AND?: QuickBooksCustomerMapWhereInput | QuickBooksCustomerMapWhereInput[]
    OR?: QuickBooksCustomerMapWhereInput[]
    NOT?: QuickBooksCustomerMapWhereInput | QuickBooksCustomerMapWhereInput[]
    id?: StringFilter<"QuickBooksCustomerMap"> | string
    companyId?: StringFilter<"QuickBooksCustomerMap"> | string
    crmCustomerId?: StringFilter<"QuickBooksCustomerMap"> | string
    qbCustomerId?: StringFilter<"QuickBooksCustomerMap"> | string
  }

  export type QuickBooksCustomerMapOrderByWithRelationInput = {
    id?: SortOrder
    companyId?: SortOrder
    crmCustomerId?: SortOrder
    qbCustomerId?: SortOrder
  }

  export type QuickBooksCustomerMapWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    companyId_crmCustomerId?: QuickBooksCustomerMapCompanyIdCrmCustomerIdCompoundUniqueInput
    AND?: QuickBooksCustomerMapWhereInput | QuickBooksCustomerMapWhereInput[]
    OR?: QuickBooksCustomerMapWhereInput[]
    NOT?: QuickBooksCustomerMapWhereInput | QuickBooksCustomerMapWhereInput[]
    companyId?: StringFilter<"QuickBooksCustomerMap"> | string
    crmCustomerId?: StringFilter<"QuickBooksCustomerMap"> | string
    qbCustomerId?: StringFilter<"QuickBooksCustomerMap"> | string
  }, "id" | "companyId_crmCustomerId">

  export type QuickBooksCustomerMapOrderByWithAggregationInput = {
    id?: SortOrder
    companyId?: SortOrder
    crmCustomerId?: SortOrder
    qbCustomerId?: SortOrder
    _count?: QuickBooksCustomerMapCountOrderByAggregateInput
    _max?: QuickBooksCustomerMapMaxOrderByAggregateInput
    _min?: QuickBooksCustomerMapMinOrderByAggregateInput
  }

  export type QuickBooksCustomerMapScalarWhereWithAggregatesInput = {
    AND?: QuickBooksCustomerMapScalarWhereWithAggregatesInput | QuickBooksCustomerMapScalarWhereWithAggregatesInput[]
    OR?: QuickBooksCustomerMapScalarWhereWithAggregatesInput[]
    NOT?: QuickBooksCustomerMapScalarWhereWithAggregatesInput | QuickBooksCustomerMapScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuickBooksCustomerMap"> | string
    companyId?: StringWithAggregatesFilter<"QuickBooksCustomerMap"> | string
    crmCustomerId?: StringWithAggregatesFilter<"QuickBooksCustomerMap"> | string
    qbCustomerId?: StringWithAggregatesFilter<"QuickBooksCustomerMap"> | string
  }

  export type QuoteCreateInput = {
    id?: string
    companyId: string
    quoteNumber: string
    jobId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    title: string
    description?: string | null
    status?: $Enums.QuoteStatus
    validUntil?: Date | string | null
    subtotal?: Decimal | DecimalJsLike | number | string
    discountType?: $Enums.DiscountType | null
    discountValue?: Decimal | DecimalJsLike | number | string | null
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    approvalToken?: string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    sentAt?: Date | string | null
    viewedAt?: Date | string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemCreateNestedManyWithoutQuoteInput
    invoices?: InvoiceCreateNestedManyWithoutQuoteInput
  }

  export type QuoteUncheckedCreateInput = {
    id?: string
    companyId: string
    quoteNumber: string
    jobId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    title: string
    description?: string | null
    status?: $Enums.QuoteStatus
    validUntil?: Date | string | null
    subtotal?: Decimal | DecimalJsLike | number | string
    discountType?: $Enums.DiscountType | null
    discountValue?: Decimal | DecimalJsLike | number | string | null
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    approvalToken?: string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    sentAt?: Date | string | null
    viewedAt?: Date | string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemUncheckedCreateNestedManyWithoutQuoteInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutQuoteInput
  }

  export type QuoteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quoteNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    validUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountType?: NullableEnumDiscountTypeFieldUpdateOperationsInput | $Enums.DiscountType | null
    discountValue?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    approvalToken?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    viewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUpdateManyWithoutQuoteNestedInput
    invoices?: InvoiceUpdateManyWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quoteNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    validUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountType?: NullableEnumDiscountTypeFieldUpdateOperationsInput | $Enums.DiscountType | null
    discountValue?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    approvalToken?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    viewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUncheckedUpdateManyWithoutQuoteNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutQuoteNestedInput
  }

  export type QuoteCreateManyInput = {
    id?: string
    companyId: string
    quoteNumber: string
    jobId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    title: string
    description?: string | null
    status?: $Enums.QuoteStatus
    validUntil?: Date | string | null
    subtotal?: Decimal | DecimalJsLike | number | string
    discountType?: $Enums.DiscountType | null
    discountValue?: Decimal | DecimalJsLike | number | string | null
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    approvalToken?: string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    sentAt?: Date | string | null
    viewedAt?: Date | string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quoteNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    validUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountType?: NullableEnumDiscountTypeFieldUpdateOperationsInput | $Enums.DiscountType | null
    discountValue?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    approvalToken?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    viewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quoteNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    validUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountType?: NullableEnumDiscountTypeFieldUpdateOperationsInput | $Enums.DiscountType | null
    discountValue?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    approvalToken?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    viewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteLineItemCreateInput = {
    id?: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
    quote: QuoteCreateNestedOneWithoutLineItemsInput
  }

  export type QuoteLineItemUncheckedCreateInput = {
    id?: string
    quoteId: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type QuoteLineItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    quote?: QuoteUpdateOneRequiredWithoutLineItemsNestedInput
  }

  export type QuoteLineItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type QuoteLineItemCreateManyInput = {
    id?: string
    quoteId: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type QuoteLineItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type QuoteLineItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type InvoiceCreateInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    quote?: QuoteCreateNestedOneWithoutInvoicesInput
    recurringSchedule?: RecurringScheduleCreateNestedOneWithoutInvoicesInput
    lineItems?: InvoiceLineItemCreateNestedManyWithoutInvoiceInput
    payments?: PaymentCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUncheckedCreateInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    quoteId?: string | null
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    recurringScheduleId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: InvoiceLineItemUncheckedCreateNestedManyWithoutInvoiceInput
    payments?: PaymentUncheckedCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneWithoutInvoicesNestedInput
    recurringSchedule?: RecurringScheduleUpdateOneWithoutInvoicesNestedInput
    lineItems?: InvoiceLineItemUpdateManyWithoutInvoiceNestedInput
    payments?: PaymentUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    recurringScheduleId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: InvoiceLineItemUncheckedUpdateManyWithoutInvoiceNestedInput
    payments?: PaymentUncheckedUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceCreateManyInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    quoteId?: string | null
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    recurringScheduleId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    recurringScheduleId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceLineItemCreateInput = {
    id?: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
    invoice: InvoiceCreateNestedOneWithoutLineItemsInput
  }

  export type InvoiceLineItemUncheckedCreateInput = {
    id?: string
    invoiceId: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type InvoiceLineItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    invoice?: InvoiceUpdateOneRequiredWithoutLineItemsNestedInput
  }

  export type InvoiceLineItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoiceId?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type InvoiceLineItemCreateManyInput = {
    id?: string
    invoiceId: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type InvoiceLineItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type InvoiceLineItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoiceId?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type PaymentCreateInput = {
    id?: string
    companyId: string
    amount: Decimal | DecimalJsLike | number | string
    paymentMethod?: $Enums.PaymentMethod
    status?: $Enums.PaymentStatus
    stripePaymentIntentId?: string | null
    stripeChargeId?: string | null
    quickbooksId?: string | null
    paidAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    invoice: InvoiceCreateNestedOneWithoutPaymentsInput
  }

  export type PaymentUncheckedCreateInput = {
    id?: string
    companyId: string
    invoiceId: string
    amount: Decimal | DecimalJsLike | number | string
    paymentMethod?: $Enums.PaymentMethod
    status?: $Enums.PaymentStatus
    stripePaymentIntentId?: string | null
    stripeChargeId?: string | null
    quickbooksId?: string | null
    paidAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeChargeId?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    invoice?: InvoiceUpdateOneRequiredWithoutPaymentsNestedInput
  }

  export type PaymentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeChargeId?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentCreateManyInput = {
    id?: string
    companyId: string
    invoiceId: string
    amount: Decimal | DecimalJsLike | number | string
    paymentMethod?: $Enums.PaymentMethod
    status?: $Enums.PaymentStatus
    stripePaymentIntentId?: string | null
    stripeChargeId?: string | null
    quickbooksId?: string | null
    paidAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeChargeId?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeChargeId?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecurringScheduleCreateInput = {
    id?: string
    companyId: string
    customerId: string
    customerName: string
    customerEmail: string
    description: string
    frequency?: $Enums.RecurringFrequency
    amount: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    nextBillingDate: Date | string
    isActive?: boolean
    jobId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    invoices?: InvoiceCreateNestedManyWithoutRecurringScheduleInput
  }

  export type RecurringScheduleUncheckedCreateInput = {
    id?: string
    companyId: string
    customerId: string
    customerName: string
    customerEmail: string
    description: string
    frequency?: $Enums.RecurringFrequency
    amount: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    nextBillingDate: Date | string
    isActive?: boolean
    jobId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    invoices?: InvoiceUncheckedCreateNestedManyWithoutRecurringScheduleInput
  }

  export type RecurringScheduleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    frequency?: EnumRecurringFrequencyFieldUpdateOperationsInput | $Enums.RecurringFrequency
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nextBillingDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    invoices?: InvoiceUpdateManyWithoutRecurringScheduleNestedInput
  }

  export type RecurringScheduleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    frequency?: EnumRecurringFrequencyFieldUpdateOperationsInput | $Enums.RecurringFrequency
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nextBillingDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    invoices?: InvoiceUncheckedUpdateManyWithoutRecurringScheduleNestedInput
  }

  export type RecurringScheduleCreateManyInput = {
    id?: string
    companyId: string
    customerId: string
    customerName: string
    customerEmail: string
    description: string
    frequency?: $Enums.RecurringFrequency
    amount: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    nextBillingDate: Date | string
    isActive?: boolean
    jobId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecurringScheduleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    frequency?: EnumRecurringFrequencyFieldUpdateOperationsInput | $Enums.RecurringFrequency
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nextBillingDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecurringScheduleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    frequency?: EnumRecurringFrequencyFieldUpdateOperationsInput | $Enums.RecurringFrequency
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nextBillingDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseCreateInput = {
    id?: string
    companyId: string
    jobId?: string | null
    technicianId?: string | null
    category?: $Enums.ExpenseCategory
    description: string
    amount: Decimal | DecimalJsLike | number | string
    vendor?: string | null
    receiptUrl?: string | null
    expenseDate?: Date | string
    isReimbursable?: boolean
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExpenseUncheckedCreateInput = {
    id?: string
    companyId: string
    jobId?: string | null
    technicianId?: string | null
    category?: $Enums.ExpenseCategory
    description: string
    amount: Decimal | DecimalJsLike | number | string
    vendor?: string | null
    receiptUrl?: string | null
    expenseDate?: Date | string
    isReimbursable?: boolean
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExpenseUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumExpenseCategoryFieldUpdateOperationsInput | $Enums.ExpenseCategory
    description?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    receiptUrl?: NullableStringFieldUpdateOperationsInput | string | null
    expenseDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isReimbursable?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumExpenseCategoryFieldUpdateOperationsInput | $Enums.ExpenseCategory
    description?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    receiptUrl?: NullableStringFieldUpdateOperationsInput | string | null
    expenseDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isReimbursable?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseCreateManyInput = {
    id?: string
    companyId: string
    jobId?: string | null
    technicianId?: string | null
    category?: $Enums.ExpenseCategory
    description: string
    amount: Decimal | DecimalJsLike | number | string
    vendor?: string | null
    receiptUrl?: string | null
    expenseDate?: Date | string
    isReimbursable?: boolean
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExpenseUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumExpenseCategoryFieldUpdateOperationsInput | $Enums.ExpenseCategory
    description?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    receiptUrl?: NullableStringFieldUpdateOperationsInput | string | null
    expenseDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isReimbursable?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    technicianId?: NullableStringFieldUpdateOperationsInput | string | null
    category?: EnumExpenseCategoryFieldUpdateOperationsInput | $Enums.ExpenseCategory
    description?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    vendor?: NullableStringFieldUpdateOperationsInput | string | null
    receiptUrl?: NullableStringFieldUpdateOperationsInput | string | null
    expenseDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isReimbursable?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuickBooksConnectionCreateInput = {
    id?: string
    companyId: string
    realmId: string
    accessToken: string
    refreshToken: string
    tokenExpiresAt: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuickBooksConnectionUncheckedCreateInput = {
    id?: string
    companyId: string
    realmId: string
    accessToken: string
    refreshToken: string
    tokenExpiresAt: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuickBooksConnectionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    realmId?: StringFieldUpdateOperationsInput | string
    accessToken?: StringFieldUpdateOperationsInput | string
    refreshToken?: StringFieldUpdateOperationsInput | string
    tokenExpiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuickBooksConnectionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    realmId?: StringFieldUpdateOperationsInput | string
    accessToken?: StringFieldUpdateOperationsInput | string
    refreshToken?: StringFieldUpdateOperationsInput | string
    tokenExpiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuickBooksConnectionCreateManyInput = {
    id?: string
    companyId: string
    realmId: string
    accessToken: string
    refreshToken: string
    tokenExpiresAt: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuickBooksConnectionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    realmId?: StringFieldUpdateOperationsInput | string
    accessToken?: StringFieldUpdateOperationsInput | string
    refreshToken?: StringFieldUpdateOperationsInput | string
    tokenExpiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuickBooksConnectionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    realmId?: StringFieldUpdateOperationsInput | string
    accessToken?: StringFieldUpdateOperationsInput | string
    refreshToken?: StringFieldUpdateOperationsInput | string
    tokenExpiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuickBooksCustomerMapCreateInput = {
    id?: string
    companyId: string
    crmCustomerId: string
    qbCustomerId: string
  }

  export type QuickBooksCustomerMapUncheckedCreateInput = {
    id?: string
    companyId: string
    crmCustomerId: string
    qbCustomerId: string
  }

  export type QuickBooksCustomerMapUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    crmCustomerId?: StringFieldUpdateOperationsInput | string
    qbCustomerId?: StringFieldUpdateOperationsInput | string
  }

  export type QuickBooksCustomerMapUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    crmCustomerId?: StringFieldUpdateOperationsInput | string
    qbCustomerId?: StringFieldUpdateOperationsInput | string
  }

  export type QuickBooksCustomerMapCreateManyInput = {
    id?: string
    companyId: string
    crmCustomerId: string
    qbCustomerId: string
  }

  export type QuickBooksCustomerMapUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    crmCustomerId?: StringFieldUpdateOperationsInput | string
    qbCustomerId?: StringFieldUpdateOperationsInput | string
  }

  export type QuickBooksCustomerMapUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    crmCustomerId?: StringFieldUpdateOperationsInput | string
    qbCustomerId?: StringFieldUpdateOperationsInput | string
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

  export type EnumQuoteStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteStatus | EnumQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteStatus[] | ListEnumQuoteStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuoteStatus[] | ListEnumQuoteStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQuoteStatusFilter<$PrismaModel> | $Enums.QuoteStatus
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

  export type EnumDiscountTypeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.DiscountType | EnumDiscountTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.DiscountType[] | ListEnumDiscountTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.DiscountType[] | ListEnumDiscountTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumDiscountTypeNullableFilter<$PrismaModel> | $Enums.DiscountType | null
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

  export type QuoteLineItemListRelationFilter = {
    every?: QuoteLineItemWhereInput
    some?: QuoteLineItemWhereInput
    none?: QuoteLineItemWhereInput
  }

  export type InvoiceListRelationFilter = {
    every?: InvoiceWhereInput
    some?: InvoiceWhereInput
    none?: InvoiceWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type QuoteLineItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InvoiceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuoteCompanyIdQuoteNumberCompoundUniqueInput = {
    companyId: string
    quoteNumber: string
  }

  export type QuoteCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    quoteNumber?: SortOrder
    jobId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    validUntil?: SortOrder
    subtotal?: SortOrder
    discountType?: SortOrder
    discountValue?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    notes?: SortOrder
    terms?: SortOrder
    pdfUrl?: SortOrder
    approvalToken?: SortOrder
    approvedAt?: SortOrder
    approvedByName?: SortOrder
    approvedByEmail?: SortOrder
    sentAt?: SortOrder
    viewedAt?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteAvgOrderByAggregateInput = {
    subtotal?: SortOrder
    discountValue?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
  }

  export type QuoteMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    quoteNumber?: SortOrder
    jobId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    validUntil?: SortOrder
    subtotal?: SortOrder
    discountType?: SortOrder
    discountValue?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    notes?: SortOrder
    terms?: SortOrder
    pdfUrl?: SortOrder
    approvalToken?: SortOrder
    approvedAt?: SortOrder
    approvedByName?: SortOrder
    approvedByEmail?: SortOrder
    sentAt?: SortOrder
    viewedAt?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    quoteNumber?: SortOrder
    jobId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    validUntil?: SortOrder
    subtotal?: SortOrder
    discountType?: SortOrder
    discountValue?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    notes?: SortOrder
    terms?: SortOrder
    pdfUrl?: SortOrder
    approvalToken?: SortOrder
    approvedAt?: SortOrder
    approvedByName?: SortOrder
    approvedByEmail?: SortOrder
    sentAt?: SortOrder
    viewedAt?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteSumOrderByAggregateInput = {
    subtotal?: SortOrder
    discountValue?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
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

  export type EnumQuoteStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteStatus | EnumQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteStatus[] | ListEnumQuoteStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuoteStatus[] | ListEnumQuoteStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQuoteStatusWithAggregatesFilter<$PrismaModel> | $Enums.QuoteStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuoteStatusFilter<$PrismaModel>
    _max?: NestedEnumQuoteStatusFilter<$PrismaModel>
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

  export type EnumDiscountTypeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DiscountType | EnumDiscountTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.DiscountType[] | ListEnumDiscountTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.DiscountType[] | ListEnumDiscountTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumDiscountTypeNullableWithAggregatesFilter<$PrismaModel> | $Enums.DiscountType | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumDiscountTypeNullableFilter<$PrismaModel>
    _max?: NestedEnumDiscountTypeNullableFilter<$PrismaModel>
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

  export type EnumLineItemCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.LineItemCategory | EnumLineItemCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.LineItemCategory[] | ListEnumLineItemCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.LineItemCategory[] | ListEnumLineItemCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumLineItemCategoryFilter<$PrismaModel> | $Enums.LineItemCategory
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

  export type QuoteRelationFilter = {
    is?: QuoteWhereInput
    isNot?: QuoteWhereInput
  }

  export type QuoteLineItemCountOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
  }

  export type QuoteLineItemAvgOrderByAggregateInput = {
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    sortOrder?: SortOrder
  }

  export type QuoteLineItemMaxOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
  }

  export type QuoteLineItemMinOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
  }

  export type QuoteLineItemSumOrderByAggregateInput = {
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    sortOrder?: SortOrder
  }

  export type EnumLineItemCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LineItemCategory | EnumLineItemCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.LineItemCategory[] | ListEnumLineItemCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.LineItemCategory[] | ListEnumLineItemCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumLineItemCategoryWithAggregatesFilter<$PrismaModel> | $Enums.LineItemCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLineItemCategoryFilter<$PrismaModel>
    _max?: NestedEnumLineItemCategoryFilter<$PrismaModel>
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

  export type EnumInvoiceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusFilter<$PrismaModel> | $Enums.InvoiceStatus
  }

  export type QuoteNullableRelationFilter = {
    is?: QuoteWhereInput | null
    isNot?: QuoteWhereInput | null
  }

  export type RecurringScheduleNullableRelationFilter = {
    is?: RecurringScheduleWhereInput | null
    isNot?: RecurringScheduleWhereInput | null
  }

  export type InvoiceLineItemListRelationFilter = {
    every?: InvoiceLineItemWhereInput
    some?: InvoiceLineItemWhereInput
    none?: InvoiceLineItemWhereInput
  }

  export type PaymentListRelationFilter = {
    every?: PaymentWhereInput
    some?: PaymentWhereInput
    none?: PaymentWhereInput
  }

  export type InvoiceLineItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PaymentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InvoiceCompanyIdInvoiceNumberCompoundUniqueInput = {
    companyId: string
    invoiceNumber: string
  }

  export type InvoiceCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceNumber?: SortOrder
    quoteId?: SortOrder
    jobId?: SortOrder
    workOrderId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    status?: SortOrder
    dueDate?: SortOrder
    dueDays?: SortOrder
    subtotal?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    amountPaid?: SortOrder
    balanceDue?: SortOrder
    notes?: SortOrder
    terms?: SortOrder
    pdfUrl?: SortOrder
    stripePaymentIntentId?: SortOrder
    stripePaymentUrl?: SortOrder
    quickbooksId?: SortOrder
    sentAt?: SortOrder
    paidAt?: SortOrder
    voidedAt?: SortOrder
    approvedAt?: SortOrder
    approvedByName?: SortOrder
    approvedByEmail?: SortOrder
    declinedAt?: SortOrder
    declinedByName?: SortOrder
    declinedByEmail?: SortOrder
    declineReason?: SortOrder
    createdByUserId?: SortOrder
    recurringScheduleId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceAvgOrderByAggregateInput = {
    dueDays?: SortOrder
    subtotal?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    amountPaid?: SortOrder
    balanceDue?: SortOrder
  }

  export type InvoiceMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceNumber?: SortOrder
    quoteId?: SortOrder
    jobId?: SortOrder
    workOrderId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    status?: SortOrder
    dueDate?: SortOrder
    dueDays?: SortOrder
    subtotal?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    amountPaid?: SortOrder
    balanceDue?: SortOrder
    notes?: SortOrder
    terms?: SortOrder
    pdfUrl?: SortOrder
    stripePaymentIntentId?: SortOrder
    stripePaymentUrl?: SortOrder
    quickbooksId?: SortOrder
    sentAt?: SortOrder
    paidAt?: SortOrder
    voidedAt?: SortOrder
    approvedAt?: SortOrder
    approvedByName?: SortOrder
    approvedByEmail?: SortOrder
    declinedAt?: SortOrder
    declinedByName?: SortOrder
    declinedByEmail?: SortOrder
    declineReason?: SortOrder
    createdByUserId?: SortOrder
    recurringScheduleId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceNumber?: SortOrder
    quoteId?: SortOrder
    jobId?: SortOrder
    workOrderId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    status?: SortOrder
    dueDate?: SortOrder
    dueDays?: SortOrder
    subtotal?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    amountPaid?: SortOrder
    balanceDue?: SortOrder
    notes?: SortOrder
    terms?: SortOrder
    pdfUrl?: SortOrder
    stripePaymentIntentId?: SortOrder
    stripePaymentUrl?: SortOrder
    quickbooksId?: SortOrder
    sentAt?: SortOrder
    paidAt?: SortOrder
    voidedAt?: SortOrder
    approvedAt?: SortOrder
    approvedByName?: SortOrder
    approvedByEmail?: SortOrder
    declinedAt?: SortOrder
    declinedByName?: SortOrder
    declinedByEmail?: SortOrder
    declineReason?: SortOrder
    createdByUserId?: SortOrder
    recurringScheduleId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceSumOrderByAggregateInput = {
    dueDays?: SortOrder
    subtotal?: SortOrder
    discountAmount?: SortOrder
    taxRate?: SortOrder
    taxAmount?: SortOrder
    total?: SortOrder
    amountPaid?: SortOrder
    balanceDue?: SortOrder
  }

  export type EnumInvoiceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusWithAggregatesFilter<$PrismaModel> | $Enums.InvoiceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInvoiceStatusFilter<$PrismaModel>
    _max?: NestedEnumInvoiceStatusFilter<$PrismaModel>
  }

  export type InvoiceRelationFilter = {
    is?: InvoiceWhereInput
    isNot?: InvoiceWhereInput
  }

  export type InvoiceLineItemCountOrderByAggregateInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
  }

  export type InvoiceLineItemAvgOrderByAggregateInput = {
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    sortOrder?: SortOrder
  }

  export type InvoiceLineItemMaxOrderByAggregateInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
  }

  export type InvoiceLineItemMinOrderByAggregateInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    description?: SortOrder
    category?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    taxable?: SortOrder
    sortOrder?: SortOrder
  }

  export type InvoiceLineItemSumOrderByAggregateInput = {
    quantity?: SortOrder
    unitPrice?: SortOrder
    lineTotal?: SortOrder
    sortOrder?: SortOrder
  }

  export type EnumPaymentMethodFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentMethod | EnumPaymentMethodFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentMethodFilter<$PrismaModel> | $Enums.PaymentMethod
  }

  export type EnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type PaymentCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceId?: SortOrder
    amount?: SortOrder
    paymentMethod?: SortOrder
    status?: SortOrder
    stripePaymentIntentId?: SortOrder
    stripeChargeId?: SortOrder
    quickbooksId?: SortOrder
    paidAt?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type PaymentMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceId?: SortOrder
    amount?: SortOrder
    paymentMethod?: SortOrder
    status?: SortOrder
    stripePaymentIntentId?: SortOrder
    stripeChargeId?: SortOrder
    quickbooksId?: SortOrder
    paidAt?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    invoiceId?: SortOrder
    amount?: SortOrder
    paymentMethod?: SortOrder
    status?: SortOrder
    stripePaymentIntentId?: SortOrder
    stripeChargeId?: SortOrder
    quickbooksId?: SortOrder
    paidAt?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type EnumPaymentMethodWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentMethod | EnumPaymentMethodFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentMethodWithAggregatesFilter<$PrismaModel> | $Enums.PaymentMethod
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentMethodFilter<$PrismaModel>
    _max?: NestedEnumPaymentMethodFilter<$PrismaModel>
  }

  export type EnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type EnumRecurringFrequencyFilter<$PrismaModel = never> = {
    equals?: $Enums.RecurringFrequency | EnumRecurringFrequencyFieldRefInput<$PrismaModel>
    in?: $Enums.RecurringFrequency[] | ListEnumRecurringFrequencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.RecurringFrequency[] | ListEnumRecurringFrequencyFieldRefInput<$PrismaModel>
    not?: NestedEnumRecurringFrequencyFilter<$PrismaModel> | $Enums.RecurringFrequency
  }

  export type RecurringScheduleCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    description?: SortOrder
    frequency?: SortOrder
    amount?: SortOrder
    taxRate?: SortOrder
    nextBillingDate?: SortOrder
    isActive?: SortOrder
    jobId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecurringScheduleAvgOrderByAggregateInput = {
    amount?: SortOrder
    taxRate?: SortOrder
  }

  export type RecurringScheduleMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    description?: SortOrder
    frequency?: SortOrder
    amount?: SortOrder
    taxRate?: SortOrder
    nextBillingDate?: SortOrder
    isActive?: SortOrder
    jobId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecurringScheduleMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    customerId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    description?: SortOrder
    frequency?: SortOrder
    amount?: SortOrder
    taxRate?: SortOrder
    nextBillingDate?: SortOrder
    isActive?: SortOrder
    jobId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecurringScheduleSumOrderByAggregateInput = {
    amount?: SortOrder
    taxRate?: SortOrder
  }

  export type EnumRecurringFrequencyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RecurringFrequency | EnumRecurringFrequencyFieldRefInput<$PrismaModel>
    in?: $Enums.RecurringFrequency[] | ListEnumRecurringFrequencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.RecurringFrequency[] | ListEnumRecurringFrequencyFieldRefInput<$PrismaModel>
    not?: NestedEnumRecurringFrequencyWithAggregatesFilter<$PrismaModel> | $Enums.RecurringFrequency
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRecurringFrequencyFilter<$PrismaModel>
    _max?: NestedEnumRecurringFrequencyFilter<$PrismaModel>
  }

  export type EnumExpenseCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.ExpenseCategory | EnumExpenseCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.ExpenseCategory[] | ListEnumExpenseCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExpenseCategory[] | ListEnumExpenseCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumExpenseCategoryFilter<$PrismaModel> | $Enums.ExpenseCategory
  }

  export type ExpenseCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrder
    technicianId?: SortOrder
    category?: SortOrder
    description?: SortOrder
    amount?: SortOrder
    vendor?: SortOrder
    receiptUrl?: SortOrder
    expenseDate?: SortOrder
    isReimbursable?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type ExpenseMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrder
    technicianId?: SortOrder
    category?: SortOrder
    description?: SortOrder
    amount?: SortOrder
    vendor?: SortOrder
    receiptUrl?: SortOrder
    expenseDate?: SortOrder
    isReimbursable?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    jobId?: SortOrder
    technicianId?: SortOrder
    category?: SortOrder
    description?: SortOrder
    amount?: SortOrder
    vendor?: SortOrder
    receiptUrl?: SortOrder
    expenseDate?: SortOrder
    isReimbursable?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type EnumExpenseCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ExpenseCategory | EnumExpenseCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.ExpenseCategory[] | ListEnumExpenseCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExpenseCategory[] | ListEnumExpenseCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumExpenseCategoryWithAggregatesFilter<$PrismaModel> | $Enums.ExpenseCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumExpenseCategoryFilter<$PrismaModel>
    _max?: NestedEnumExpenseCategoryFilter<$PrismaModel>
  }

  export type QuickBooksConnectionCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    realmId?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    tokenExpiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuickBooksConnectionMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    realmId?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    tokenExpiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuickBooksConnectionMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    realmId?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    tokenExpiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuickBooksCustomerMapCompanyIdCrmCustomerIdCompoundUniqueInput = {
    companyId: string
    crmCustomerId: string
  }

  export type QuickBooksCustomerMapCountOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    crmCustomerId?: SortOrder
    qbCustomerId?: SortOrder
  }

  export type QuickBooksCustomerMapMaxOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    crmCustomerId?: SortOrder
    qbCustomerId?: SortOrder
  }

  export type QuickBooksCustomerMapMinOrderByAggregateInput = {
    id?: SortOrder
    companyId?: SortOrder
    crmCustomerId?: SortOrder
    qbCustomerId?: SortOrder
  }

  export type QuoteLineItemCreateNestedManyWithoutQuoteInput = {
    create?: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput> | QuoteLineItemCreateWithoutQuoteInput[] | QuoteLineItemUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutQuoteInput | QuoteLineItemCreateOrConnectWithoutQuoteInput[]
    createMany?: QuoteLineItemCreateManyQuoteInputEnvelope
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
  }

  export type InvoiceCreateNestedManyWithoutQuoteInput = {
    create?: XOR<InvoiceCreateWithoutQuoteInput, InvoiceUncheckedCreateWithoutQuoteInput> | InvoiceCreateWithoutQuoteInput[] | InvoiceUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutQuoteInput | InvoiceCreateOrConnectWithoutQuoteInput[]
    createMany?: InvoiceCreateManyQuoteInputEnvelope
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
  }

  export type QuoteLineItemUncheckedCreateNestedManyWithoutQuoteInput = {
    create?: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput> | QuoteLineItemCreateWithoutQuoteInput[] | QuoteLineItemUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutQuoteInput | QuoteLineItemCreateOrConnectWithoutQuoteInput[]
    createMany?: QuoteLineItemCreateManyQuoteInputEnvelope
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
  }

  export type InvoiceUncheckedCreateNestedManyWithoutQuoteInput = {
    create?: XOR<InvoiceCreateWithoutQuoteInput, InvoiceUncheckedCreateWithoutQuoteInput> | InvoiceCreateWithoutQuoteInput[] | InvoiceUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutQuoteInput | InvoiceCreateOrConnectWithoutQuoteInput[]
    createMany?: InvoiceCreateManyQuoteInputEnvelope
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumQuoteStatusFieldUpdateOperationsInput = {
    set?: $Enums.QuoteStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableEnumDiscountTypeFieldUpdateOperationsInput = {
    set?: $Enums.DiscountType | null
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type QuoteLineItemUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput> | QuoteLineItemCreateWithoutQuoteInput[] | QuoteLineItemUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutQuoteInput | QuoteLineItemCreateOrConnectWithoutQuoteInput[]
    upsert?: QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput | QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: QuoteLineItemCreateManyQuoteInputEnvelope
    set?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    disconnect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    delete?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    update?: QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput | QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: QuoteLineItemUpdateManyWithWhereWithoutQuoteInput | QuoteLineItemUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
  }

  export type InvoiceUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<InvoiceCreateWithoutQuoteInput, InvoiceUncheckedCreateWithoutQuoteInput> | InvoiceCreateWithoutQuoteInput[] | InvoiceUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutQuoteInput | InvoiceCreateOrConnectWithoutQuoteInput[]
    upsert?: InvoiceUpsertWithWhereUniqueWithoutQuoteInput | InvoiceUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: InvoiceCreateManyQuoteInputEnvelope
    set?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    disconnect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    delete?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    update?: InvoiceUpdateWithWhereUniqueWithoutQuoteInput | InvoiceUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: InvoiceUpdateManyWithWhereWithoutQuoteInput | InvoiceUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
  }

  export type QuoteLineItemUncheckedUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput> | QuoteLineItemCreateWithoutQuoteInput[] | QuoteLineItemUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutQuoteInput | QuoteLineItemCreateOrConnectWithoutQuoteInput[]
    upsert?: QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput | QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: QuoteLineItemCreateManyQuoteInputEnvelope
    set?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    disconnect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    delete?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    update?: QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput | QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: QuoteLineItemUpdateManyWithWhereWithoutQuoteInput | QuoteLineItemUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
  }

  export type InvoiceUncheckedUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<InvoiceCreateWithoutQuoteInput, InvoiceUncheckedCreateWithoutQuoteInput> | InvoiceCreateWithoutQuoteInput[] | InvoiceUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutQuoteInput | InvoiceCreateOrConnectWithoutQuoteInput[]
    upsert?: InvoiceUpsertWithWhereUniqueWithoutQuoteInput | InvoiceUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: InvoiceCreateManyQuoteInputEnvelope
    set?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    disconnect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    delete?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    update?: InvoiceUpdateWithWhereUniqueWithoutQuoteInput | InvoiceUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: InvoiceUpdateManyWithWhereWithoutQuoteInput | InvoiceUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
  }

  export type QuoteCreateNestedOneWithoutLineItemsInput = {
    create?: XOR<QuoteCreateWithoutLineItemsInput, QuoteUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutLineItemsInput
    connect?: QuoteWhereUniqueInput
  }

  export type EnumLineItemCategoryFieldUpdateOperationsInput = {
    set?: $Enums.LineItemCategory
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

  export type QuoteUpdateOneRequiredWithoutLineItemsNestedInput = {
    create?: XOR<QuoteCreateWithoutLineItemsInput, QuoteUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutLineItemsInput
    upsert?: QuoteUpsertWithoutLineItemsInput
    connect?: QuoteWhereUniqueInput
    update?: XOR<XOR<QuoteUpdateToOneWithWhereWithoutLineItemsInput, QuoteUpdateWithoutLineItemsInput>, QuoteUncheckedUpdateWithoutLineItemsInput>
  }

  export type QuoteCreateNestedOneWithoutInvoicesInput = {
    create?: XOR<QuoteCreateWithoutInvoicesInput, QuoteUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutInvoicesInput
    connect?: QuoteWhereUniqueInput
  }

  export type RecurringScheduleCreateNestedOneWithoutInvoicesInput = {
    create?: XOR<RecurringScheduleCreateWithoutInvoicesInput, RecurringScheduleUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: RecurringScheduleCreateOrConnectWithoutInvoicesInput
    connect?: RecurringScheduleWhereUniqueInput
  }

  export type InvoiceLineItemCreateNestedManyWithoutInvoiceInput = {
    create?: XOR<InvoiceLineItemCreateWithoutInvoiceInput, InvoiceLineItemUncheckedCreateWithoutInvoiceInput> | InvoiceLineItemCreateWithoutInvoiceInput[] | InvoiceLineItemUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: InvoiceLineItemCreateOrConnectWithoutInvoiceInput | InvoiceLineItemCreateOrConnectWithoutInvoiceInput[]
    createMany?: InvoiceLineItemCreateManyInvoiceInputEnvelope
    connect?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
  }

  export type PaymentCreateNestedManyWithoutInvoiceInput = {
    create?: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput> | PaymentCreateWithoutInvoiceInput[] | PaymentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: PaymentCreateOrConnectWithoutInvoiceInput | PaymentCreateOrConnectWithoutInvoiceInput[]
    createMany?: PaymentCreateManyInvoiceInputEnvelope
    connect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
  }

  export type InvoiceLineItemUncheckedCreateNestedManyWithoutInvoiceInput = {
    create?: XOR<InvoiceLineItemCreateWithoutInvoiceInput, InvoiceLineItemUncheckedCreateWithoutInvoiceInput> | InvoiceLineItemCreateWithoutInvoiceInput[] | InvoiceLineItemUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: InvoiceLineItemCreateOrConnectWithoutInvoiceInput | InvoiceLineItemCreateOrConnectWithoutInvoiceInput[]
    createMany?: InvoiceLineItemCreateManyInvoiceInputEnvelope
    connect?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
  }

  export type PaymentUncheckedCreateNestedManyWithoutInvoiceInput = {
    create?: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput> | PaymentCreateWithoutInvoiceInput[] | PaymentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: PaymentCreateOrConnectWithoutInvoiceInput | PaymentCreateOrConnectWithoutInvoiceInput[]
    createMany?: PaymentCreateManyInvoiceInputEnvelope
    connect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
  }

  export type EnumInvoiceStatusFieldUpdateOperationsInput = {
    set?: $Enums.InvoiceStatus
  }

  export type QuoteUpdateOneWithoutInvoicesNestedInput = {
    create?: XOR<QuoteCreateWithoutInvoicesInput, QuoteUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutInvoicesInput
    upsert?: QuoteUpsertWithoutInvoicesInput
    disconnect?: QuoteWhereInput | boolean
    delete?: QuoteWhereInput | boolean
    connect?: QuoteWhereUniqueInput
    update?: XOR<XOR<QuoteUpdateToOneWithWhereWithoutInvoicesInput, QuoteUpdateWithoutInvoicesInput>, QuoteUncheckedUpdateWithoutInvoicesInput>
  }

  export type RecurringScheduleUpdateOneWithoutInvoicesNestedInput = {
    create?: XOR<RecurringScheduleCreateWithoutInvoicesInput, RecurringScheduleUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: RecurringScheduleCreateOrConnectWithoutInvoicesInput
    upsert?: RecurringScheduleUpsertWithoutInvoicesInput
    disconnect?: RecurringScheduleWhereInput | boolean
    delete?: RecurringScheduleWhereInput | boolean
    connect?: RecurringScheduleWhereUniqueInput
    update?: XOR<XOR<RecurringScheduleUpdateToOneWithWhereWithoutInvoicesInput, RecurringScheduleUpdateWithoutInvoicesInput>, RecurringScheduleUncheckedUpdateWithoutInvoicesInput>
  }

  export type InvoiceLineItemUpdateManyWithoutInvoiceNestedInput = {
    create?: XOR<InvoiceLineItemCreateWithoutInvoiceInput, InvoiceLineItemUncheckedCreateWithoutInvoiceInput> | InvoiceLineItemCreateWithoutInvoiceInput[] | InvoiceLineItemUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: InvoiceLineItemCreateOrConnectWithoutInvoiceInput | InvoiceLineItemCreateOrConnectWithoutInvoiceInput[]
    upsert?: InvoiceLineItemUpsertWithWhereUniqueWithoutInvoiceInput | InvoiceLineItemUpsertWithWhereUniqueWithoutInvoiceInput[]
    createMany?: InvoiceLineItemCreateManyInvoiceInputEnvelope
    set?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
    disconnect?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
    delete?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
    connect?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
    update?: InvoiceLineItemUpdateWithWhereUniqueWithoutInvoiceInput | InvoiceLineItemUpdateWithWhereUniqueWithoutInvoiceInput[]
    updateMany?: InvoiceLineItemUpdateManyWithWhereWithoutInvoiceInput | InvoiceLineItemUpdateManyWithWhereWithoutInvoiceInput[]
    deleteMany?: InvoiceLineItemScalarWhereInput | InvoiceLineItemScalarWhereInput[]
  }

  export type PaymentUpdateManyWithoutInvoiceNestedInput = {
    create?: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput> | PaymentCreateWithoutInvoiceInput[] | PaymentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: PaymentCreateOrConnectWithoutInvoiceInput | PaymentCreateOrConnectWithoutInvoiceInput[]
    upsert?: PaymentUpsertWithWhereUniqueWithoutInvoiceInput | PaymentUpsertWithWhereUniqueWithoutInvoiceInput[]
    createMany?: PaymentCreateManyInvoiceInputEnvelope
    set?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    disconnect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    delete?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    connect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    update?: PaymentUpdateWithWhereUniqueWithoutInvoiceInput | PaymentUpdateWithWhereUniqueWithoutInvoiceInput[]
    updateMany?: PaymentUpdateManyWithWhereWithoutInvoiceInput | PaymentUpdateManyWithWhereWithoutInvoiceInput[]
    deleteMany?: PaymentScalarWhereInput | PaymentScalarWhereInput[]
  }

  export type InvoiceLineItemUncheckedUpdateManyWithoutInvoiceNestedInput = {
    create?: XOR<InvoiceLineItemCreateWithoutInvoiceInput, InvoiceLineItemUncheckedCreateWithoutInvoiceInput> | InvoiceLineItemCreateWithoutInvoiceInput[] | InvoiceLineItemUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: InvoiceLineItemCreateOrConnectWithoutInvoiceInput | InvoiceLineItemCreateOrConnectWithoutInvoiceInput[]
    upsert?: InvoiceLineItemUpsertWithWhereUniqueWithoutInvoiceInput | InvoiceLineItemUpsertWithWhereUniqueWithoutInvoiceInput[]
    createMany?: InvoiceLineItemCreateManyInvoiceInputEnvelope
    set?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
    disconnect?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
    delete?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
    connect?: InvoiceLineItemWhereUniqueInput | InvoiceLineItemWhereUniqueInput[]
    update?: InvoiceLineItemUpdateWithWhereUniqueWithoutInvoiceInput | InvoiceLineItemUpdateWithWhereUniqueWithoutInvoiceInput[]
    updateMany?: InvoiceLineItemUpdateManyWithWhereWithoutInvoiceInput | InvoiceLineItemUpdateManyWithWhereWithoutInvoiceInput[]
    deleteMany?: InvoiceLineItemScalarWhereInput | InvoiceLineItemScalarWhereInput[]
  }

  export type PaymentUncheckedUpdateManyWithoutInvoiceNestedInput = {
    create?: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput> | PaymentCreateWithoutInvoiceInput[] | PaymentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: PaymentCreateOrConnectWithoutInvoiceInput | PaymentCreateOrConnectWithoutInvoiceInput[]
    upsert?: PaymentUpsertWithWhereUniqueWithoutInvoiceInput | PaymentUpsertWithWhereUniqueWithoutInvoiceInput[]
    createMany?: PaymentCreateManyInvoiceInputEnvelope
    set?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    disconnect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    delete?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    connect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    update?: PaymentUpdateWithWhereUniqueWithoutInvoiceInput | PaymentUpdateWithWhereUniqueWithoutInvoiceInput[]
    updateMany?: PaymentUpdateManyWithWhereWithoutInvoiceInput | PaymentUpdateManyWithWhereWithoutInvoiceInput[]
    deleteMany?: PaymentScalarWhereInput | PaymentScalarWhereInput[]
  }

  export type InvoiceCreateNestedOneWithoutLineItemsInput = {
    create?: XOR<InvoiceCreateWithoutLineItemsInput, InvoiceUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: InvoiceCreateOrConnectWithoutLineItemsInput
    connect?: InvoiceWhereUniqueInput
  }

  export type InvoiceUpdateOneRequiredWithoutLineItemsNestedInput = {
    create?: XOR<InvoiceCreateWithoutLineItemsInput, InvoiceUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: InvoiceCreateOrConnectWithoutLineItemsInput
    upsert?: InvoiceUpsertWithoutLineItemsInput
    connect?: InvoiceWhereUniqueInput
    update?: XOR<XOR<InvoiceUpdateToOneWithWhereWithoutLineItemsInput, InvoiceUpdateWithoutLineItemsInput>, InvoiceUncheckedUpdateWithoutLineItemsInput>
  }

  export type InvoiceCreateNestedOneWithoutPaymentsInput = {
    create?: XOR<InvoiceCreateWithoutPaymentsInput, InvoiceUncheckedCreateWithoutPaymentsInput>
    connectOrCreate?: InvoiceCreateOrConnectWithoutPaymentsInput
    connect?: InvoiceWhereUniqueInput
  }

  export type EnumPaymentMethodFieldUpdateOperationsInput = {
    set?: $Enums.PaymentMethod
  }

  export type EnumPaymentStatusFieldUpdateOperationsInput = {
    set?: $Enums.PaymentStatus
  }

  export type InvoiceUpdateOneRequiredWithoutPaymentsNestedInput = {
    create?: XOR<InvoiceCreateWithoutPaymentsInput, InvoiceUncheckedCreateWithoutPaymentsInput>
    connectOrCreate?: InvoiceCreateOrConnectWithoutPaymentsInput
    upsert?: InvoiceUpsertWithoutPaymentsInput
    connect?: InvoiceWhereUniqueInput
    update?: XOR<XOR<InvoiceUpdateToOneWithWhereWithoutPaymentsInput, InvoiceUpdateWithoutPaymentsInput>, InvoiceUncheckedUpdateWithoutPaymentsInput>
  }

  export type InvoiceCreateNestedManyWithoutRecurringScheduleInput = {
    create?: XOR<InvoiceCreateWithoutRecurringScheduleInput, InvoiceUncheckedCreateWithoutRecurringScheduleInput> | InvoiceCreateWithoutRecurringScheduleInput[] | InvoiceUncheckedCreateWithoutRecurringScheduleInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutRecurringScheduleInput | InvoiceCreateOrConnectWithoutRecurringScheduleInput[]
    createMany?: InvoiceCreateManyRecurringScheduleInputEnvelope
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
  }

  export type InvoiceUncheckedCreateNestedManyWithoutRecurringScheduleInput = {
    create?: XOR<InvoiceCreateWithoutRecurringScheduleInput, InvoiceUncheckedCreateWithoutRecurringScheduleInput> | InvoiceCreateWithoutRecurringScheduleInput[] | InvoiceUncheckedCreateWithoutRecurringScheduleInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutRecurringScheduleInput | InvoiceCreateOrConnectWithoutRecurringScheduleInput[]
    createMany?: InvoiceCreateManyRecurringScheduleInputEnvelope
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
  }

  export type EnumRecurringFrequencyFieldUpdateOperationsInput = {
    set?: $Enums.RecurringFrequency
  }

  export type InvoiceUpdateManyWithoutRecurringScheduleNestedInput = {
    create?: XOR<InvoiceCreateWithoutRecurringScheduleInput, InvoiceUncheckedCreateWithoutRecurringScheduleInput> | InvoiceCreateWithoutRecurringScheduleInput[] | InvoiceUncheckedCreateWithoutRecurringScheduleInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutRecurringScheduleInput | InvoiceCreateOrConnectWithoutRecurringScheduleInput[]
    upsert?: InvoiceUpsertWithWhereUniqueWithoutRecurringScheduleInput | InvoiceUpsertWithWhereUniqueWithoutRecurringScheduleInput[]
    createMany?: InvoiceCreateManyRecurringScheduleInputEnvelope
    set?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    disconnect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    delete?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    update?: InvoiceUpdateWithWhereUniqueWithoutRecurringScheduleInput | InvoiceUpdateWithWhereUniqueWithoutRecurringScheduleInput[]
    updateMany?: InvoiceUpdateManyWithWhereWithoutRecurringScheduleInput | InvoiceUpdateManyWithWhereWithoutRecurringScheduleInput[]
    deleteMany?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
  }

  export type InvoiceUncheckedUpdateManyWithoutRecurringScheduleNestedInput = {
    create?: XOR<InvoiceCreateWithoutRecurringScheduleInput, InvoiceUncheckedCreateWithoutRecurringScheduleInput> | InvoiceCreateWithoutRecurringScheduleInput[] | InvoiceUncheckedCreateWithoutRecurringScheduleInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutRecurringScheduleInput | InvoiceCreateOrConnectWithoutRecurringScheduleInput[]
    upsert?: InvoiceUpsertWithWhereUniqueWithoutRecurringScheduleInput | InvoiceUpsertWithWhereUniqueWithoutRecurringScheduleInput[]
    createMany?: InvoiceCreateManyRecurringScheduleInputEnvelope
    set?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    disconnect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    delete?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    update?: InvoiceUpdateWithWhereUniqueWithoutRecurringScheduleInput | InvoiceUpdateWithWhereUniqueWithoutRecurringScheduleInput[]
    updateMany?: InvoiceUpdateManyWithWhereWithoutRecurringScheduleInput | InvoiceUpdateManyWithWhereWithoutRecurringScheduleInput[]
    deleteMany?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
  }

  export type EnumExpenseCategoryFieldUpdateOperationsInput = {
    set?: $Enums.ExpenseCategory
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

  export type NestedEnumQuoteStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteStatus | EnumQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteStatus[] | ListEnumQuoteStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuoteStatus[] | ListEnumQuoteStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQuoteStatusFilter<$PrismaModel> | $Enums.QuoteStatus
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

  export type NestedEnumDiscountTypeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.DiscountType | EnumDiscountTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.DiscountType[] | ListEnumDiscountTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.DiscountType[] | ListEnumDiscountTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumDiscountTypeNullableFilter<$PrismaModel> | $Enums.DiscountType | null
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

  export type NestedEnumQuoteStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteStatus | EnumQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteStatus[] | ListEnumQuoteStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuoteStatus[] | ListEnumQuoteStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQuoteStatusWithAggregatesFilter<$PrismaModel> | $Enums.QuoteStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuoteStatusFilter<$PrismaModel>
    _max?: NestedEnumQuoteStatusFilter<$PrismaModel>
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

  export type NestedEnumDiscountTypeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DiscountType | EnumDiscountTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.DiscountType[] | ListEnumDiscountTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.DiscountType[] | ListEnumDiscountTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumDiscountTypeNullableWithAggregatesFilter<$PrismaModel> | $Enums.DiscountType | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumDiscountTypeNullableFilter<$PrismaModel>
    _max?: NestedEnumDiscountTypeNullableFilter<$PrismaModel>
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

  export type NestedEnumLineItemCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.LineItemCategory | EnumLineItemCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.LineItemCategory[] | ListEnumLineItemCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.LineItemCategory[] | ListEnumLineItemCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumLineItemCategoryFilter<$PrismaModel> | $Enums.LineItemCategory
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumLineItemCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LineItemCategory | EnumLineItemCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.LineItemCategory[] | ListEnumLineItemCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.LineItemCategory[] | ListEnumLineItemCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumLineItemCategoryWithAggregatesFilter<$PrismaModel> | $Enums.LineItemCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLineItemCategoryFilter<$PrismaModel>
    _max?: NestedEnumLineItemCategoryFilter<$PrismaModel>
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

  export type NestedEnumInvoiceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusFilter<$PrismaModel> | $Enums.InvoiceStatus
  }

  export type NestedEnumInvoiceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusWithAggregatesFilter<$PrismaModel> | $Enums.InvoiceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInvoiceStatusFilter<$PrismaModel>
    _max?: NestedEnumInvoiceStatusFilter<$PrismaModel>
  }

  export type NestedEnumPaymentMethodFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentMethod | EnumPaymentMethodFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentMethodFilter<$PrismaModel> | $Enums.PaymentMethod
  }

  export type NestedEnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type NestedEnumPaymentMethodWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentMethod | EnumPaymentMethodFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentMethodWithAggregatesFilter<$PrismaModel> | $Enums.PaymentMethod
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentMethodFilter<$PrismaModel>
    _max?: NestedEnumPaymentMethodFilter<$PrismaModel>
  }

  export type NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type NestedEnumRecurringFrequencyFilter<$PrismaModel = never> = {
    equals?: $Enums.RecurringFrequency | EnumRecurringFrequencyFieldRefInput<$PrismaModel>
    in?: $Enums.RecurringFrequency[] | ListEnumRecurringFrequencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.RecurringFrequency[] | ListEnumRecurringFrequencyFieldRefInput<$PrismaModel>
    not?: NestedEnumRecurringFrequencyFilter<$PrismaModel> | $Enums.RecurringFrequency
  }

  export type NestedEnumRecurringFrequencyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RecurringFrequency | EnumRecurringFrequencyFieldRefInput<$PrismaModel>
    in?: $Enums.RecurringFrequency[] | ListEnumRecurringFrequencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.RecurringFrequency[] | ListEnumRecurringFrequencyFieldRefInput<$PrismaModel>
    not?: NestedEnumRecurringFrequencyWithAggregatesFilter<$PrismaModel> | $Enums.RecurringFrequency
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRecurringFrequencyFilter<$PrismaModel>
    _max?: NestedEnumRecurringFrequencyFilter<$PrismaModel>
  }

  export type NestedEnumExpenseCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.ExpenseCategory | EnumExpenseCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.ExpenseCategory[] | ListEnumExpenseCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExpenseCategory[] | ListEnumExpenseCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumExpenseCategoryFilter<$PrismaModel> | $Enums.ExpenseCategory
  }

  export type NestedEnumExpenseCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ExpenseCategory | EnumExpenseCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.ExpenseCategory[] | ListEnumExpenseCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExpenseCategory[] | ListEnumExpenseCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumExpenseCategoryWithAggregatesFilter<$PrismaModel> | $Enums.ExpenseCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumExpenseCategoryFilter<$PrismaModel>
    _max?: NestedEnumExpenseCategoryFilter<$PrismaModel>
  }

  export type QuoteLineItemCreateWithoutQuoteInput = {
    id?: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type QuoteLineItemUncheckedCreateWithoutQuoteInput = {
    id?: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type QuoteLineItemCreateOrConnectWithoutQuoteInput = {
    where: QuoteLineItemWhereUniqueInput
    create: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput>
  }

  export type QuoteLineItemCreateManyQuoteInputEnvelope = {
    data: QuoteLineItemCreateManyQuoteInput | QuoteLineItemCreateManyQuoteInput[]
    skipDuplicates?: boolean
  }

  export type InvoiceCreateWithoutQuoteInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    recurringSchedule?: RecurringScheduleCreateNestedOneWithoutInvoicesInput
    lineItems?: InvoiceLineItemCreateNestedManyWithoutInvoiceInput
    payments?: PaymentCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUncheckedCreateWithoutQuoteInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    recurringScheduleId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: InvoiceLineItemUncheckedCreateNestedManyWithoutInvoiceInput
    payments?: PaymentUncheckedCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceCreateOrConnectWithoutQuoteInput = {
    where: InvoiceWhereUniqueInput
    create: XOR<InvoiceCreateWithoutQuoteInput, InvoiceUncheckedCreateWithoutQuoteInput>
  }

  export type InvoiceCreateManyQuoteInputEnvelope = {
    data: InvoiceCreateManyQuoteInput | InvoiceCreateManyQuoteInput[]
    skipDuplicates?: boolean
  }

  export type QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput = {
    where: QuoteLineItemWhereUniqueInput
    update: XOR<QuoteLineItemUpdateWithoutQuoteInput, QuoteLineItemUncheckedUpdateWithoutQuoteInput>
    create: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput>
  }

  export type QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput = {
    where: QuoteLineItemWhereUniqueInput
    data: XOR<QuoteLineItemUpdateWithoutQuoteInput, QuoteLineItemUncheckedUpdateWithoutQuoteInput>
  }

  export type QuoteLineItemUpdateManyWithWhereWithoutQuoteInput = {
    where: QuoteLineItemScalarWhereInput
    data: XOR<QuoteLineItemUpdateManyMutationInput, QuoteLineItemUncheckedUpdateManyWithoutQuoteInput>
  }

  export type QuoteLineItemScalarWhereInput = {
    AND?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
    OR?: QuoteLineItemScalarWhereInput[]
    NOT?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
    id?: StringFilter<"QuoteLineItem"> | string
    quoteId?: StringFilter<"QuoteLineItem"> | string
    description?: StringFilter<"QuoteLineItem"> | string
    category?: EnumLineItemCategoryFilter<"QuoteLineItem"> | $Enums.LineItemCategory
    quantity?: DecimalFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFilter<"QuoteLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"QuoteLineItem"> | boolean
    sortOrder?: IntFilter<"QuoteLineItem"> | number
  }

  export type InvoiceUpsertWithWhereUniqueWithoutQuoteInput = {
    where: InvoiceWhereUniqueInput
    update: XOR<InvoiceUpdateWithoutQuoteInput, InvoiceUncheckedUpdateWithoutQuoteInput>
    create: XOR<InvoiceCreateWithoutQuoteInput, InvoiceUncheckedCreateWithoutQuoteInput>
  }

  export type InvoiceUpdateWithWhereUniqueWithoutQuoteInput = {
    where: InvoiceWhereUniqueInput
    data: XOR<InvoiceUpdateWithoutQuoteInput, InvoiceUncheckedUpdateWithoutQuoteInput>
  }

  export type InvoiceUpdateManyWithWhereWithoutQuoteInput = {
    where: InvoiceScalarWhereInput
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyWithoutQuoteInput>
  }

  export type InvoiceScalarWhereInput = {
    AND?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
    OR?: InvoiceScalarWhereInput[]
    NOT?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
    id?: StringFilter<"Invoice"> | string
    companyId?: StringFilter<"Invoice"> | string
    invoiceNumber?: StringFilter<"Invoice"> | string
    quoteId?: StringNullableFilter<"Invoice"> | string | null
    jobId?: StringNullableFilter<"Invoice"> | string | null
    workOrderId?: StringNullableFilter<"Invoice"> | string | null
    customerId?: StringFilter<"Invoice"> | string
    customerName?: StringFilter<"Invoice"> | string
    customerEmail?: StringFilter<"Invoice"> | string
    status?: EnumInvoiceStatusFilter<"Invoice"> | $Enums.InvoiceStatus
    dueDate?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    dueDays?: IntFilter<"Invoice"> | number
    subtotal?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    total?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFilter<"Invoice"> | Decimal | DecimalJsLike | number | string
    notes?: StringNullableFilter<"Invoice"> | string | null
    terms?: StringNullableFilter<"Invoice"> | string | null
    pdfUrl?: StringNullableFilter<"Invoice"> | string | null
    stripePaymentIntentId?: StringNullableFilter<"Invoice"> | string | null
    stripePaymentUrl?: StringNullableFilter<"Invoice"> | string | null
    quickbooksId?: StringNullableFilter<"Invoice"> | string | null
    sentAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    voidedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    approvedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    approvedByName?: StringNullableFilter<"Invoice"> | string | null
    approvedByEmail?: StringNullableFilter<"Invoice"> | string | null
    declinedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    declinedByName?: StringNullableFilter<"Invoice"> | string | null
    declinedByEmail?: StringNullableFilter<"Invoice"> | string | null
    declineReason?: StringNullableFilter<"Invoice"> | string | null
    createdByUserId?: StringFilter<"Invoice"> | string
    recurringScheduleId?: StringNullableFilter<"Invoice"> | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
  }

  export type QuoteCreateWithoutLineItemsInput = {
    id?: string
    companyId: string
    quoteNumber: string
    jobId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    title: string
    description?: string | null
    status?: $Enums.QuoteStatus
    validUntil?: Date | string | null
    subtotal?: Decimal | DecimalJsLike | number | string
    discountType?: $Enums.DiscountType | null
    discountValue?: Decimal | DecimalJsLike | number | string | null
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    approvalToken?: string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    sentAt?: Date | string | null
    viewedAt?: Date | string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    invoices?: InvoiceCreateNestedManyWithoutQuoteInput
  }

  export type QuoteUncheckedCreateWithoutLineItemsInput = {
    id?: string
    companyId: string
    quoteNumber: string
    jobId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    title: string
    description?: string | null
    status?: $Enums.QuoteStatus
    validUntil?: Date | string | null
    subtotal?: Decimal | DecimalJsLike | number | string
    discountType?: $Enums.DiscountType | null
    discountValue?: Decimal | DecimalJsLike | number | string | null
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    approvalToken?: string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    sentAt?: Date | string | null
    viewedAt?: Date | string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    invoices?: InvoiceUncheckedCreateNestedManyWithoutQuoteInput
  }

  export type QuoteCreateOrConnectWithoutLineItemsInput = {
    where: QuoteWhereUniqueInput
    create: XOR<QuoteCreateWithoutLineItemsInput, QuoteUncheckedCreateWithoutLineItemsInput>
  }

  export type QuoteUpsertWithoutLineItemsInput = {
    update: XOR<QuoteUpdateWithoutLineItemsInput, QuoteUncheckedUpdateWithoutLineItemsInput>
    create: XOR<QuoteCreateWithoutLineItemsInput, QuoteUncheckedCreateWithoutLineItemsInput>
    where?: QuoteWhereInput
  }

  export type QuoteUpdateToOneWithWhereWithoutLineItemsInput = {
    where?: QuoteWhereInput
    data: XOR<QuoteUpdateWithoutLineItemsInput, QuoteUncheckedUpdateWithoutLineItemsInput>
  }

  export type QuoteUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quoteNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    validUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountType?: NullableEnumDiscountTypeFieldUpdateOperationsInput | $Enums.DiscountType | null
    discountValue?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    approvalToken?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    viewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    invoices?: InvoiceUpdateManyWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quoteNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    validUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountType?: NullableEnumDiscountTypeFieldUpdateOperationsInput | $Enums.DiscountType | null
    discountValue?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    approvalToken?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    viewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    invoices?: InvoiceUncheckedUpdateManyWithoutQuoteNestedInput
  }

  export type QuoteCreateWithoutInvoicesInput = {
    id?: string
    companyId: string
    quoteNumber: string
    jobId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    title: string
    description?: string | null
    status?: $Enums.QuoteStatus
    validUntil?: Date | string | null
    subtotal?: Decimal | DecimalJsLike | number | string
    discountType?: $Enums.DiscountType | null
    discountValue?: Decimal | DecimalJsLike | number | string | null
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    approvalToken?: string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    sentAt?: Date | string | null
    viewedAt?: Date | string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemCreateNestedManyWithoutQuoteInput
  }

  export type QuoteUncheckedCreateWithoutInvoicesInput = {
    id?: string
    companyId: string
    quoteNumber: string
    jobId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    title: string
    description?: string | null
    status?: $Enums.QuoteStatus
    validUntil?: Date | string | null
    subtotal?: Decimal | DecimalJsLike | number | string
    discountType?: $Enums.DiscountType | null
    discountValue?: Decimal | DecimalJsLike | number | string | null
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    approvalToken?: string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    sentAt?: Date | string | null
    viewedAt?: Date | string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemUncheckedCreateNestedManyWithoutQuoteInput
  }

  export type QuoteCreateOrConnectWithoutInvoicesInput = {
    where: QuoteWhereUniqueInput
    create: XOR<QuoteCreateWithoutInvoicesInput, QuoteUncheckedCreateWithoutInvoicesInput>
  }

  export type RecurringScheduleCreateWithoutInvoicesInput = {
    id?: string
    companyId: string
    customerId: string
    customerName: string
    customerEmail: string
    description: string
    frequency?: $Enums.RecurringFrequency
    amount: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    nextBillingDate: Date | string
    isActive?: boolean
    jobId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecurringScheduleUncheckedCreateWithoutInvoicesInput = {
    id?: string
    companyId: string
    customerId: string
    customerName: string
    customerEmail: string
    description: string
    frequency?: $Enums.RecurringFrequency
    amount: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    nextBillingDate: Date | string
    isActive?: boolean
    jobId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecurringScheduleCreateOrConnectWithoutInvoicesInput = {
    where: RecurringScheduleWhereUniqueInput
    create: XOR<RecurringScheduleCreateWithoutInvoicesInput, RecurringScheduleUncheckedCreateWithoutInvoicesInput>
  }

  export type InvoiceLineItemCreateWithoutInvoiceInput = {
    id?: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type InvoiceLineItemUncheckedCreateWithoutInvoiceInput = {
    id?: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type InvoiceLineItemCreateOrConnectWithoutInvoiceInput = {
    where: InvoiceLineItemWhereUniqueInput
    create: XOR<InvoiceLineItemCreateWithoutInvoiceInput, InvoiceLineItemUncheckedCreateWithoutInvoiceInput>
  }

  export type InvoiceLineItemCreateManyInvoiceInputEnvelope = {
    data: InvoiceLineItemCreateManyInvoiceInput | InvoiceLineItemCreateManyInvoiceInput[]
    skipDuplicates?: boolean
  }

  export type PaymentCreateWithoutInvoiceInput = {
    id?: string
    companyId: string
    amount: Decimal | DecimalJsLike | number | string
    paymentMethod?: $Enums.PaymentMethod
    status?: $Enums.PaymentStatus
    stripePaymentIntentId?: string | null
    stripeChargeId?: string | null
    quickbooksId?: string | null
    paidAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUncheckedCreateWithoutInvoiceInput = {
    id?: string
    companyId: string
    amount: Decimal | DecimalJsLike | number | string
    paymentMethod?: $Enums.PaymentMethod
    status?: $Enums.PaymentStatus
    stripePaymentIntentId?: string | null
    stripeChargeId?: string | null
    quickbooksId?: string | null
    paidAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentCreateOrConnectWithoutInvoiceInput = {
    where: PaymentWhereUniqueInput
    create: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput>
  }

  export type PaymentCreateManyInvoiceInputEnvelope = {
    data: PaymentCreateManyInvoiceInput | PaymentCreateManyInvoiceInput[]
    skipDuplicates?: boolean
  }

  export type QuoteUpsertWithoutInvoicesInput = {
    update: XOR<QuoteUpdateWithoutInvoicesInput, QuoteUncheckedUpdateWithoutInvoicesInput>
    create: XOR<QuoteCreateWithoutInvoicesInput, QuoteUncheckedCreateWithoutInvoicesInput>
    where?: QuoteWhereInput
  }

  export type QuoteUpdateToOneWithWhereWithoutInvoicesInput = {
    where?: QuoteWhereInput
    data: XOR<QuoteUpdateWithoutInvoicesInput, QuoteUncheckedUpdateWithoutInvoicesInput>
  }

  export type QuoteUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quoteNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    validUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountType?: NullableEnumDiscountTypeFieldUpdateOperationsInput | $Enums.DiscountType | null
    discountValue?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    approvalToken?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    viewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUpdateManyWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    quoteNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    validUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountType?: NullableEnumDiscountTypeFieldUpdateOperationsInput | $Enums.DiscountType | null
    discountValue?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    approvalToken?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    viewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUncheckedUpdateManyWithoutQuoteNestedInput
  }

  export type RecurringScheduleUpsertWithoutInvoicesInput = {
    update: XOR<RecurringScheduleUpdateWithoutInvoicesInput, RecurringScheduleUncheckedUpdateWithoutInvoicesInput>
    create: XOR<RecurringScheduleCreateWithoutInvoicesInput, RecurringScheduleUncheckedCreateWithoutInvoicesInput>
    where?: RecurringScheduleWhereInput
  }

  export type RecurringScheduleUpdateToOneWithWhereWithoutInvoicesInput = {
    where?: RecurringScheduleWhereInput
    data: XOR<RecurringScheduleUpdateWithoutInvoicesInput, RecurringScheduleUncheckedUpdateWithoutInvoicesInput>
  }

  export type RecurringScheduleUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    frequency?: EnumRecurringFrequencyFieldUpdateOperationsInput | $Enums.RecurringFrequency
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nextBillingDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecurringScheduleUncheckedUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    frequency?: EnumRecurringFrequencyFieldUpdateOperationsInput | $Enums.RecurringFrequency
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nextBillingDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceLineItemUpsertWithWhereUniqueWithoutInvoiceInput = {
    where: InvoiceLineItemWhereUniqueInput
    update: XOR<InvoiceLineItemUpdateWithoutInvoiceInput, InvoiceLineItemUncheckedUpdateWithoutInvoiceInput>
    create: XOR<InvoiceLineItemCreateWithoutInvoiceInput, InvoiceLineItemUncheckedCreateWithoutInvoiceInput>
  }

  export type InvoiceLineItemUpdateWithWhereUniqueWithoutInvoiceInput = {
    where: InvoiceLineItemWhereUniqueInput
    data: XOR<InvoiceLineItemUpdateWithoutInvoiceInput, InvoiceLineItemUncheckedUpdateWithoutInvoiceInput>
  }

  export type InvoiceLineItemUpdateManyWithWhereWithoutInvoiceInput = {
    where: InvoiceLineItemScalarWhereInput
    data: XOR<InvoiceLineItemUpdateManyMutationInput, InvoiceLineItemUncheckedUpdateManyWithoutInvoiceInput>
  }

  export type InvoiceLineItemScalarWhereInput = {
    AND?: InvoiceLineItemScalarWhereInput | InvoiceLineItemScalarWhereInput[]
    OR?: InvoiceLineItemScalarWhereInput[]
    NOT?: InvoiceLineItemScalarWhereInput | InvoiceLineItemScalarWhereInput[]
    id?: StringFilter<"InvoiceLineItem"> | string
    invoiceId?: StringFilter<"InvoiceLineItem"> | string
    description?: StringFilter<"InvoiceLineItem"> | string
    category?: EnumLineItemCategoryFilter<"InvoiceLineItem"> | $Enums.LineItemCategory
    quantity?: DecimalFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFilter<"InvoiceLineItem"> | Decimal | DecimalJsLike | number | string
    taxable?: BoolFilter<"InvoiceLineItem"> | boolean
    sortOrder?: IntFilter<"InvoiceLineItem"> | number
  }

  export type PaymentUpsertWithWhereUniqueWithoutInvoiceInput = {
    where: PaymentWhereUniqueInput
    update: XOR<PaymentUpdateWithoutInvoiceInput, PaymentUncheckedUpdateWithoutInvoiceInput>
    create: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput>
  }

  export type PaymentUpdateWithWhereUniqueWithoutInvoiceInput = {
    where: PaymentWhereUniqueInput
    data: XOR<PaymentUpdateWithoutInvoiceInput, PaymentUncheckedUpdateWithoutInvoiceInput>
  }

  export type PaymentUpdateManyWithWhereWithoutInvoiceInput = {
    where: PaymentScalarWhereInput
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyWithoutInvoiceInput>
  }

  export type PaymentScalarWhereInput = {
    AND?: PaymentScalarWhereInput | PaymentScalarWhereInput[]
    OR?: PaymentScalarWhereInput[]
    NOT?: PaymentScalarWhereInput | PaymentScalarWhereInput[]
    id?: StringFilter<"Payment"> | string
    companyId?: StringFilter<"Payment"> | string
    invoiceId?: StringFilter<"Payment"> | string
    amount?: DecimalFilter<"Payment"> | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFilter<"Payment"> | $Enums.PaymentMethod
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    stripePaymentIntentId?: StringNullableFilter<"Payment"> | string | null
    stripeChargeId?: StringNullableFilter<"Payment"> | string | null
    quickbooksId?: StringNullableFilter<"Payment"> | string | null
    paidAt?: DateTimeNullableFilter<"Payment"> | Date | string | null
    notes?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
  }

  export type InvoiceCreateWithoutLineItemsInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    quote?: QuoteCreateNestedOneWithoutInvoicesInput
    recurringSchedule?: RecurringScheduleCreateNestedOneWithoutInvoicesInput
    payments?: PaymentCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUncheckedCreateWithoutLineItemsInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    quoteId?: string | null
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    recurringScheduleId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    payments?: PaymentUncheckedCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceCreateOrConnectWithoutLineItemsInput = {
    where: InvoiceWhereUniqueInput
    create: XOR<InvoiceCreateWithoutLineItemsInput, InvoiceUncheckedCreateWithoutLineItemsInput>
  }

  export type InvoiceUpsertWithoutLineItemsInput = {
    update: XOR<InvoiceUpdateWithoutLineItemsInput, InvoiceUncheckedUpdateWithoutLineItemsInput>
    create: XOR<InvoiceCreateWithoutLineItemsInput, InvoiceUncheckedCreateWithoutLineItemsInput>
    where?: InvoiceWhereInput
  }

  export type InvoiceUpdateToOneWithWhereWithoutLineItemsInput = {
    where?: InvoiceWhereInput
    data: XOR<InvoiceUpdateWithoutLineItemsInput, InvoiceUncheckedUpdateWithoutLineItemsInput>
  }

  export type InvoiceUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneWithoutInvoicesNestedInput
    recurringSchedule?: RecurringScheduleUpdateOneWithoutInvoicesNestedInput
    payments?: PaymentUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    recurringScheduleId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payments?: PaymentUncheckedUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceCreateWithoutPaymentsInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    quote?: QuoteCreateNestedOneWithoutInvoicesInput
    recurringSchedule?: RecurringScheduleCreateNestedOneWithoutInvoicesInput
    lineItems?: InvoiceLineItemCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUncheckedCreateWithoutPaymentsInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    quoteId?: string | null
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    recurringScheduleId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: InvoiceLineItemUncheckedCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceCreateOrConnectWithoutPaymentsInput = {
    where: InvoiceWhereUniqueInput
    create: XOR<InvoiceCreateWithoutPaymentsInput, InvoiceUncheckedCreateWithoutPaymentsInput>
  }

  export type InvoiceUpsertWithoutPaymentsInput = {
    update: XOR<InvoiceUpdateWithoutPaymentsInput, InvoiceUncheckedUpdateWithoutPaymentsInput>
    create: XOR<InvoiceCreateWithoutPaymentsInput, InvoiceUncheckedCreateWithoutPaymentsInput>
    where?: InvoiceWhereInput
  }

  export type InvoiceUpdateToOneWithWhereWithoutPaymentsInput = {
    where?: InvoiceWhereInput
    data: XOR<InvoiceUpdateWithoutPaymentsInput, InvoiceUncheckedUpdateWithoutPaymentsInput>
  }

  export type InvoiceUpdateWithoutPaymentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneWithoutInvoicesNestedInput
    recurringSchedule?: RecurringScheduleUpdateOneWithoutInvoicesNestedInput
    lineItems?: InvoiceLineItemUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateWithoutPaymentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    recurringScheduleId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: InvoiceLineItemUncheckedUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceCreateWithoutRecurringScheduleInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    quote?: QuoteCreateNestedOneWithoutInvoicesInput
    lineItems?: InvoiceLineItemCreateNestedManyWithoutInvoiceInput
    payments?: PaymentCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUncheckedCreateWithoutRecurringScheduleInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    quoteId?: string | null
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: InvoiceLineItemUncheckedCreateNestedManyWithoutInvoiceInput
    payments?: PaymentUncheckedCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceCreateOrConnectWithoutRecurringScheduleInput = {
    where: InvoiceWhereUniqueInput
    create: XOR<InvoiceCreateWithoutRecurringScheduleInput, InvoiceUncheckedCreateWithoutRecurringScheduleInput>
  }

  export type InvoiceCreateManyRecurringScheduleInputEnvelope = {
    data: InvoiceCreateManyRecurringScheduleInput | InvoiceCreateManyRecurringScheduleInput[]
    skipDuplicates?: boolean
  }

  export type InvoiceUpsertWithWhereUniqueWithoutRecurringScheduleInput = {
    where: InvoiceWhereUniqueInput
    update: XOR<InvoiceUpdateWithoutRecurringScheduleInput, InvoiceUncheckedUpdateWithoutRecurringScheduleInput>
    create: XOR<InvoiceCreateWithoutRecurringScheduleInput, InvoiceUncheckedCreateWithoutRecurringScheduleInput>
  }

  export type InvoiceUpdateWithWhereUniqueWithoutRecurringScheduleInput = {
    where: InvoiceWhereUniqueInput
    data: XOR<InvoiceUpdateWithoutRecurringScheduleInput, InvoiceUncheckedUpdateWithoutRecurringScheduleInput>
  }

  export type InvoiceUpdateManyWithWhereWithoutRecurringScheduleInput = {
    where: InvoiceScalarWhereInput
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyWithoutRecurringScheduleInput>
  }

  export type QuoteLineItemCreateManyQuoteInput = {
    id?: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type InvoiceCreateManyQuoteInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    recurringScheduleId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteLineItemUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type QuoteLineItemUncheckedUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type QuoteLineItemUncheckedUpdateManyWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type InvoiceUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recurringSchedule?: RecurringScheduleUpdateOneWithoutInvoicesNestedInput
    lineItems?: InvoiceLineItemUpdateManyWithoutInvoiceNestedInput
    payments?: PaymentUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    recurringScheduleId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: InvoiceLineItemUncheckedUpdateManyWithoutInvoiceNestedInput
    payments?: PaymentUncheckedUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateManyWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    recurringScheduleId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceLineItemCreateManyInvoiceInput = {
    id?: string
    description: string
    category?: $Enums.LineItemCategory
    quantity: Decimal | DecimalJsLike | number | string
    unitPrice: Decimal | DecimalJsLike | number | string
    lineTotal: Decimal | DecimalJsLike | number | string
    taxable?: boolean
    sortOrder?: number
  }

  export type PaymentCreateManyInvoiceInput = {
    id?: string
    companyId: string
    amount: Decimal | DecimalJsLike | number | string
    paymentMethod?: $Enums.PaymentMethod
    status?: $Enums.PaymentStatus
    stripePaymentIntentId?: string | null
    stripeChargeId?: string | null
    quickbooksId?: string | null
    paidAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceLineItemUpdateWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type InvoiceLineItemUncheckedUpdateWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type InvoiceLineItemUncheckedUpdateManyWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    category?: EnumLineItemCategoryFieldUpdateOperationsInput | $Enums.LineItemCategory
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    lineTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxable?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type PaymentUpdateWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeChargeId?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentUncheckedUpdateWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeChargeId?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentUncheckedUpdateManyWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeChargeId?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceCreateManyRecurringScheduleInput = {
    id?: string
    companyId: string
    invoiceNumber: string
    quoteId?: string | null
    jobId?: string | null
    workOrderId?: string | null
    customerId: string
    customerName: string
    customerEmail: string
    status?: $Enums.InvoiceStatus
    dueDate?: Date | string | null
    dueDays?: number
    subtotal?: Decimal | DecimalJsLike | number | string
    discountAmount?: Decimal | DecimalJsLike | number | string
    taxRate?: Decimal | DecimalJsLike | number | string
    taxAmount?: Decimal | DecimalJsLike | number | string
    total?: Decimal | DecimalJsLike | number | string
    amountPaid?: Decimal | DecimalJsLike | number | string
    balanceDue?: Decimal | DecimalJsLike | number | string
    notes?: string | null
    terms?: string | null
    pdfUrl?: string | null
    stripePaymentIntentId?: string | null
    stripePaymentUrl?: string | null
    quickbooksId?: string | null
    sentAt?: Date | string | null
    paidAt?: Date | string | null
    voidedAt?: Date | string | null
    approvedAt?: Date | string | null
    approvedByName?: string | null
    approvedByEmail?: string | null
    declinedAt?: Date | string | null
    declinedByName?: string | null
    declinedByEmail?: string | null
    declineReason?: string | null
    createdByUserId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceUpdateWithoutRecurringScheduleInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneWithoutInvoicesNestedInput
    lineItems?: InvoiceLineItemUpdateManyWithoutInvoiceNestedInput
    payments?: PaymentUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateWithoutRecurringScheduleInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: InvoiceLineItemUncheckedUpdateManyWithoutInvoiceNestedInput
    payments?: PaymentUncheckedUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateManyWithoutRecurringScheduleInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyId?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    quoteId?: NullableStringFieldUpdateOperationsInput | string | null
    jobId?: NullableStringFieldUpdateOperationsInput | string | null
    workOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueDays?: IntFieldUpdateOperationsInput | number
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    discountAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    taxAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    amountPaid?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    balanceDue?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    terms?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePaymentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    quickbooksId?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    voidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvedByName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    declinedByName?: NullableStringFieldUpdateOperationsInput | string | null
    declinedByEmail?: NullableStringFieldUpdateOperationsInput | string | null
    declineReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdByUserId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use QuoteCountOutputTypeDefaultArgs instead
     */
    export type QuoteCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuoteCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use InvoiceCountOutputTypeDefaultArgs instead
     */
    export type InvoiceCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = InvoiceCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RecurringScheduleCountOutputTypeDefaultArgs instead
     */
    export type RecurringScheduleCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RecurringScheduleCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use QuoteDefaultArgs instead
     */
    export type QuoteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuoteDefaultArgs<ExtArgs>
    /**
     * @deprecated Use QuoteLineItemDefaultArgs instead
     */
    export type QuoteLineItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuoteLineItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use InvoiceDefaultArgs instead
     */
    export type InvoiceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = InvoiceDefaultArgs<ExtArgs>
    /**
     * @deprecated Use InvoiceLineItemDefaultArgs instead
     */
    export type InvoiceLineItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = InvoiceLineItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PaymentDefaultArgs instead
     */
    export type PaymentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PaymentDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RecurringScheduleDefaultArgs instead
     */
    export type RecurringScheduleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RecurringScheduleDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ExpenseDefaultArgs instead
     */
    export type ExpenseArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ExpenseDefaultArgs<ExtArgs>
    /**
     * @deprecated Use QuickBooksConnectionDefaultArgs instead
     */
    export type QuickBooksConnectionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuickBooksConnectionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use QuickBooksCustomerMapDefaultArgs instead
     */
    export type QuickBooksCustomerMapArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuickBooksCustomerMapDefaultArgs<ExtArgs>

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