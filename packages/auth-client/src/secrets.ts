/**
 * Secret resolution that cannot silently downgrade to a published default.
 *
 * Every service used to read its signing key as
 *   process.env.JWT_SECRET || 'tscrm-local-jwt-secret-change-in-production'
 * so a service deployed with the variable missing kept starting and kept
 * verifying tokens — against a string that is committed to a public repository.
 * Anyone could then mint a token for any tenant and any role. Nothing logged,
 * nothing failed; the service just quietly accepted forged tokens.
 *
 * These helpers make that impossible: outside development a missing secret is a
 * startup error, not a fallback.
 */

const DEV_ONLY_DEFAULTS = new Set([
  'tscrm-local-jwt-secret-change-in-production',
  'dev-jwt-secret-change-in-production',
  'dev-internal-key',
]);

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Reads a required secret.
 *
 * In production a missing or known-placeholder value throws. In development it
 * falls back to `devDefault` so local work and tests need no setup.
 */
export function requireSecret(name: string, devDefault: string): string {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    if (isProduction()) {
      throw new Error(
        `${name} is not set. Refusing to start: falling back to a built-in ` +
        `default would sign and verify tokens with a value that is public.`,
      );
    }
    return devDefault;
  }

  if (isProduction() && DEV_ONLY_DEFAULTS.has(value)) {
    throw new Error(
      `${name} is set to a known development placeholder. Refusing to start: ` +
      `this value is published in the repository and is not a secret.`,
    );
  }

  return value;
}

/** The token signing/verification key. Must match across every service. */
export function requireJwtSecret(): string {
  return requireSecret('JWT_SECRET', 'tscrm-local-jwt-secret-change-in-production');
}

/** Shared key for service-to-service calls that bypass user auth. */
export function requireInternalApiKey(): string {
  return requireSecret('INTERNAL_API_KEY', 'dev-internal-key');
}
