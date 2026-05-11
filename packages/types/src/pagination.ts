/**
 * Pagination guards shared across all NestJS services.
 *
 * Why a shared util: every paginated controller in the platform was hand-rolling
 * its own `limit = 20` defaults, but only a few enforced an upper bound. A
 * caller passing `?limit=10000` could drag a service into a runaway query and
 * lock up Postgres connections. These helpers normalize page/limit input at
 * the service boundary so business logic always sees a safe (page, limit) pair.
 */

/** Hard ceiling on a single page. Tune per service via the optional max arg. */
export const DEFAULT_MAX_LIMIT = 100;

/** Default page size when callers don't specify one. */
export const DEFAULT_LIMIT = 20;

/**
 * Clamp + sanitize a page/limit pair coming off the wire.
 *
 *   - Non-numeric / NaN / undefined → defaults.
 *   - page < 1 → 1.
 *   - limit < 1 → 1.
 *   - limit > max → max (no error; we'd rather degrade than reject).
 *
 * @param input.page  raw page value (string | number | undefined)
 * @param input.limit raw limit value (string | number | undefined)
 * @param opts.defaultLimit  page size when none provided (default 20)
 * @param opts.maxLimit      hard ceiling (default 100)
 */
export function clampPagination(
  input: { page?: number | string | null; limit?: number | string | null },
  opts: { defaultLimit?: number; maxLimit?: number } = {},
): { page: number; limit: number; skip: number } {
  const defaultLimit = opts.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = opts.maxLimit ?? DEFAULT_MAX_LIMIT;

  const rawPage = Number(input.page);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : 1;

  const rawLimit = Number(input.limit);
  let limit: number;
  if (!Number.isFinite(rawLimit)) {
    limit = defaultLimit;
  } else {
    limit = Math.trunc(rawLimit);
  }
  if (limit < 1) limit = 1;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit, skip: (page - 1) * limit };
}
