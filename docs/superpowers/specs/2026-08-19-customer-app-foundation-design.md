# Customer Mobile App Foundation — Design Spec

**Status:** Approved for planning
**Sub-project:** M2 of 5 (customer mobile app initiative)
**Depends on:** M1 (`2026-08-19-customer-realtime-push-design.md`) — customer-scoped socket events and the customer push path. M1 is complete, merged, and verified live.
**Feeds into:** M3 (core screens), M4 (secondary screens), M5 (hardening + release).

## Problem

There is no customer mobile app. The customer experience is a web portal only, which cannot receive push notifications reliably on mobile, cannot be installed, and re-fetches everything on each visit.

This sub-project builds the **foundation**: a runnable, installable Expo app with authentication, theming, navigation, an API client, a live socket consuming M1's events, a persisted query cache, push registration, biometric unlock, and over-the-air updates. It ships one real screen (Home) whose job is to prove every one of those layers actually works end to end. M3 then grows Home into the full Dashboard and adds the remaining screens.

## Scope decisions (confirmed with product owner)

- **App identity:** display name **"HVACtor.ai"**, slug `ts-customer`, deep-link scheme `tscustomer`, iOS bundle + Android package `com.tscrm.customer`. (technician-app is "HVACtor.ai Field" / `com.tscrm.technician`; the two coexist on one device.)
- **Role gating:** a non-customer login is **rejected with an explanatory message**, not silently allowed.
- **M2's deliverable:** Login (with biometric unlock on relaunch) plus a Home screen that exercises the entire stack. Not login-only.
- **Code sharing:** copy technician-app's proven patterns; the two apps stay independent. No shared package, no refactor of the live technician app.
- **Loading behaviour:** instant screens from a warm persisted cache — never eager-load-everything at startup.
- **Distribution:** downloadable Android APK via EAS internal distribution; OTA updates required; iOS distribution decided later (the app is cross-platform either way).

## Scaffold

New `apps/customer-app/`, mirroring technician-app's structure but deliberately **leaner**: the customer app needs none of the field-work native modules (maps, background location, camera, signature capture, task-manager). Omitting them keeps the binary smaller and avoids requesting permissions the app has no honest use for.

```jsonc
// app.json (essentials)
{
  "expo": {
    "name": "HVACtor.ai",
    "slug": "ts-customer",
    "scheme": "tscustomer",
    "newArchEnabled": true,
    "ios":     { "bundleIdentifier": "com.tscrm.customer" },
    "android": { "package": "com.tscrm.customer" },
    "runtimeVersion": { "policy": "fingerprint" },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-notifications", { "color": "#2563EB" }],
      "expo-local-authentication",
      "expo-updates"
    ]
  }
}
```

Two dependencies technician-app does not have, both required here: **`expo-local-authentication`** (biometric unlock) and **`expo-updates`** (OTA).

### Gateway URL correction

technician-app's `eas.json`, `api.ts`, and `SocketContext.tsx` all still default to `https://nginx-gateway-2ohuhmktua-uc.a.run.app` — the **decommissioned `tscrm-demo-2026` project**. The customer app uses the current `hvactor` gateway everywhere:

```
https://nginx-gateway-536584181394.us-central1.run.app
```

technician-app should be corrected separately (out of scope here) — as it stands its API calls and pushes point at a dead project.

## Foundation modules

Copied patterns, customer-adapted. Storage keys and cache ids are namespaced so both apps can be installed on one device without collision.

| Module | Adaptation |
|---|---|
| `src/lib/api.ts` | axios instance; hvactor gateway default; existing `/api` normalisation + error interceptor retained |
| `src/lib/storage.ts` | expo-secure-store wrapper; keys `cust_token` / `cust_user` (not `tech_*`) |
| `src/lib/queryClient.ts` | same defaults as technician-app (30 s `staleTime`, 30 min `gcTime`, `refetchOnMount`, `refetchOnReconnect`, `placeholderData: prev`, no retry on 401/403/404) |
| `src/lib/queryPersistence.ts` | MMKV id `customerapp-query-cache`; same dynamic-require guard and no-op fallback |
| `src/contexts/AuthContext.tsx` | `POST /crm/auth/login`, role gate, biometric unlock, token in secure-store |
| `src/contexts/SocketContext.tsx` | one `/chat` connection consuming M1's customer events |
| `src/hooks/usePushNotifications.ts` | Expo token → `POST /crm/users/me/push-token`; deep-link on tap |
| `src/constants/theme.ts` | portal brand tokens |

### Theme tokens

Taken from the portal's CSS variables so the two clients are visibly one product. The primary already matches technician-app exactly.

```
primary #2563EB   green #059669   amber #D97706   red #DC2626
surface #FFFFFF   surfaceAlt #F3F4F6   border #E5E7EB
text    #111827 / #4B5563 / #6B7280
```

### Role gate

`POST /crm/auth/login` authenticates **every** role — it is the same endpoint the admin dashboard and technician app use. Without a gate, a technician's credentials succeed and produce a customer UI with no `customerId`, so every screen renders empty with no explanation.

On successful login the app therefore checks the returned user before establishing a session: if `role !== 'customer'` (or `customerId` is absent), the session is **not** persisted, the token is discarded, and the user sees:

> This app is for customers. Staff should use the HVACtor.ai Field app.

### Biometric unlock

The JWT stays in secure-store between launches. On cold start, if a token exists and the device has biometrics enrolled, the app prompts for Face ID / fingerprint before restoring the session. Declining or failing returns the user to the password screen rather than logging them out server-side. Biometric unlock is a **local convenience over an existing token**, never a substitute for authentication — a device without enrolled biometrics simply skips the prompt and restores as normal.

## Realtime and cache wiring

This is what makes the app feel immediate rather than lazy.

**Cold start:** the MMKV cache hydrates at module-evaluation time, before the first render, so screens paint last-known-good data on frame 1 and refresh silently behind it. Skeletons appear only on a genuine first-ever launch.

**Live updates:** `SocketContext` connects once per authenticated session to `/chat` (JWT in `auth.token`) and maps M1's customer events to query keys:

```ts
const EVENT_TO_QUERY_KEYS: Record<string, string[][]> = {
  job_changed:     [['jobs'], ['dashboard']],
  quote_changed:   [['quotes'], ['dashboard']],
  invoice_changed: [['invoices'], ['dashboard']],
  message_new:     [['threads'], ['notifications']],
};
```

Events land in the customer's private room (M1 guarantees no other customer's events arrive), so an invalidation here is always about this user's own data.

**Reconnect durability:** listeners registered through the context are held in a set and re-attached on reconnect, so a dropped connection never silently stops updates — technician-app's proven pattern.

**Foreground refresh:** an `AppState` listener refetches on return to foreground. `refetchOnWindowFocus` is deliberately left off; it is a web concept and does not fire correctly on native.

**Warm-on-login:** after a successful login the app prefetches the Home queries so the first authenticated screen is already populated.

## OTA updates and build config

`eas.json` with three profiles, all pointed at the hvactor gateway:

| Profile | Purpose |
|---|---|
| `development` | dev client (`developmentClient: true`, internal) |
| `preview-apk` | `distribution: internal`, `android.buildType: apk` — the downloadable APK |
| `production` | store-ready, `autoIncrement: true` |

**`runtimeVersion` uses the `fingerprint` policy**, not `appVersion`. Fingerprint ties each JS bundle to the exact native module set it was built against, so an OTA update requiring a native module the installed binary lacks is simply **not offered** rather than shipped and crashing on launch. Update channels map to build profiles (`preview` / `production`), so a JS fix reaches testers without a rebuild.

**One interactive step, owned by the product owner:** creating the EAS project requires an Expo account login and cannot be scripted here.

```
cd apps/customer-app && npx eas login && npx eas init
```

This writes `extra.eas.projectId` into `app.json`. Everything before and after is automatable; the plan will pause at exactly this point.

## Screens

```
app/_layout.tsx          providers (QueryClient → Auth → Socket), splash, deep links
app/index.tsx            auth gate → redirect to /login or /(tabs)
app/login.tsx            email + password, role-gate messaging
app/(tabs)/_layout.tsx   bottom tabs — Home, Profile (M3 adds Jobs/Quotes/Invoices/Messages)
app/(tabs)/index.tsx     Home — the stack proof
app/(tabs)/profile.tsx   logout, biometric toggle, push/connection status
```

**Home** is deliberately a proof, not a placeholder. It renders real data from the same two calls the web portal's dashboard uses — `GET /jobs/jobs?customerId=…&limit=50` and `GET /finance/invoices?customerId=…&limit=50` — derived into upcoming-jobs and open-invoice counts, and it surfaces each foundation layer's true state:

- authenticated API call → real counts, or an explicit error
- socket → a live connection indicator
- realtime → counts change when a job/invoice event arrives, with **no pull-to-refresh**
- cache → on cold start the previous values appear immediately, before any network call resolves

If a layer is broken, Home shows it rather than hiding it. M3 replaces this with the full Dashboard.

## Testing

technician-app has **no test harness at all**. This app adds a minimal `jest` + `ts-jest` setup covering the pure logic that is easy to get wrong and expensive to debug on a device:

- **Role gate** — a `customer` login establishes a session; a `technician`/`company_admin` login is rejected, the token is not persisted, and the error message is the customer-facing one.
- **Event → query-key map** — each of the four M1 events invalidates its documented keys; an unknown event name is ignored rather than invalidating everything.
- **API base-URL normalisation** — with `/api`, without `/api`, and with a trailing slash all produce the same base.

UI, biometrics, push delivery, and on-device realtime are verified by a manual checklist, not automated here.

### Stated limitation

This environment has no simulator, device, or Expo account access. Type-checks (`tsc --noEmit`) and the unit tests above can be run and will be. **Building the app, running it, confirming the biometric prompt, receiving a push, and observing a live socket update on a device cannot be verified here** — those are manual steps for the product owner, and the plan marks them as such rather than implying they were checked.

## Out of scope

- All screens beyond Login/Home/Profile (M3, M4).
- Any backend change — M1 delivered everything this app consumes.
- iOS distribution setup (TestFlight/ad-hoc) — deferred; the app is cross-platform regardless.
- Correcting technician-app's stale gateway URLs (worth doing, but it is not this app's deliverable).
- Offline mutation queueing — the cache serves reads offline; queued writes are a later concern.
