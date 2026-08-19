/**
 * Resolving the dev-time backend host.
 *
 * `localhost` is wrong on a phone (and unreliable in some simulators): it
 * resolves to the device itself, not the machine running the services, so every
 * request fails with a bare "Network Error" and no status code.
 *
 * Expo already knows the right address — Metro is served from it — and exposes
 * it as `hostUri` ("192.168.1.5:8081"). Reusing that host with the gateway port
 * works for a simulator and a physical device on the same network alike.
 */

const GATEWAY_PORT = 80

/**
 * Extracts the host from an Expo `hostUri`/`debuggerHost` value.
 * Returns null when there is nothing usable to derive from.
 */
export function hostFromHostUri(hostUri: string | undefined | null): string | null {
  if (!hostUri) return null
  const host = String(hostUri).trim().split(':')[0]
  return host ? host : null
}

/** Dev API base URL for a given Expo hostUri, falling back to localhost. */
export function devApiBaseUrl(hostUri: string | undefined | null): string {
  const host = hostFromHostUri(hostUri) ?? 'localhost'
  return `http://${host}:${GATEWAY_PORT}/api`
}

/** Dev WebSocket base URL (no /api suffix) for a given Expo hostUri. */
export function devWsBaseUrl(hostUri: string | undefined | null): string {
  const host = hostFromHostUri(hostUri) ?? 'localhost'
  return `http://${host}:${GATEWAY_PORT}`
}
