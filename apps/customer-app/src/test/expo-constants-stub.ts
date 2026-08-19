/**
 * Jest stub for `expo-constants`.
 *
 * The real module ships as ESM that jest cannot parse, and it needs a native
 * runtime anyway. Unit tests here only exercise pure logic, so an empty
 * manifest is enough — code under test falls back to its own defaults.
 */
export default {
  expoConfig: { extra: {} },
  easConfig: undefined,
}
