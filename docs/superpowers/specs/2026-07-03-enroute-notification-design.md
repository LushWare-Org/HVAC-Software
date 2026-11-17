# En-Route Customer Notification — Design Spec

**Date:** 2026-07-03 · **Status:** Approved by user (chat)

## Goal

When a technician taps **Mark En Route**, the customer receives an email (with the
technician's photo, name, and a calculated arrival window) and a short SMS. To make
that possible, technicians get an optional profile photo: at registration, from the
admin Add Technician flow, and from the technician app profile — with a per-launch
reminder banner while missing.

## Decisions (user-confirmed)

- **Photo storage:** real object storage — MinIO in dev, GCS (S3-interop HMAC) in prod,
  one S3-compatible client. Public-read bucket; email references the photo by URL.
- **ETA display:** arrival window ("between 2:40–3:00 PM") = OSRM drive time + 15%
  buffer, rounded to a 20-minute window.
- **Reminder:** banner on tech-app Home + Profile each launch while no photo;
  session-dismissible. No push nagging.
- **Channels:** email + SMS in this build. Live-tracking link / MMS = phase 2.

## Architecture

```
Tech app "Mark En Route"
  → scheduling-service UpdateAssignmentStatus (unchanged, sync)
      └─ goroutine (EN_ROUTE only, fire-and-forget):
           1. read job (jobs.jobs): customer name/email/phone, title, address, coords
           2. read tech: name, user_id, current GPS
           3. ETA: OSRM → +15% → 20-min window
              fallbacks: OSRM down → haversine @30km/h; no GPS → scheduled window; none → no time
           4. POST comms-service /notifications/en-route
  comms-service EnRouteNotification:
      - dedupe per assignmentId (in-memory TTL cache)
      - fetch tech avatarUrl from crm-service (CrmClient pattern)
      - email: photo (or initials circle), tech name, window, job/address, company footer
      - SMS via Twilio: "{Tech} from {Company} is on the way — expected {window}."
      - each channel skips gracefully if address missing; failures logged only
```

## Components

### 1. crm-service — storage + avatar
- `StorageService` (`src/storage/`): `@aws-sdk/client-s3`; env `S3_ENDPOINT`,
  `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_AVATARS`, `S3_PUBLIC_BASE_URL`,
  `S3_FORCE_PATH_STYLE`. On module init (dev/MinIO): create bucket if missing +
  public-read policy. Methods: `putAvatar(buffer, mime, key)`, `delete(key)`.
- Prisma: `CompanyUser.avatarUrl String?`.
- Endpoints (users module):
  - `POST /users/me/avatar` — multipart `file`, ≤2 MB, jpeg/png/webp; replaces + deletes old object.
  - `DELETE /users/me/avatar`
  - `POST /users/:id/avatar` — admin/office_manager/dispatcher RBAC, for Add Technician.
  - `avatarUrl` included in `findMe`, `findAll`, and internal tech lookup.
  - `GET /users/internal/:userId/profile?companyId=` — internal (service headers), returns `{name, avatarUrl}`.
- Object key: `avatars/{companyId}/{userId}-{uuid}.jpg` (unguessable).

### 2. comms-service — en-route notification
- `POST /notifications/en-route` (internal service headers/JWT like CrmClient callers):
  body `{companyId, assignmentId, jobId, jobTitle, serviceAddress, customerName,
  customerEmail?, customerPhone?, techUserId, techName, etaStart?, etaEnd?}` (ISO times).
- Dedupe: in-memory TTL map keyed `assignmentId` (30 min) — double-tap guard.
- Email via existing `EmailService`; SMS via existing `SmsService`. Photo URL fetched
  from crm internal profile endpoint; initials avatar (styled div) when absent.

### 3. scheduling-service (Go)
- `internal/service/eta.go`: `EstimateETA(techLat/Lng, jobLat/Lng, scheduled *time.Time) (start, end *time.Time)` —
  OSRM `router.project-osrm.org` (5 s timeout) → buffer → window; fallback chain per above.
- `internal/client/comms_client.go`: POST to `COMMS_SERVICE_URL /notifications/en-route`
  with dev bypass headers (`BYPASS_AUTH`) or `SERVICE_JWT`.
- `UpdateAssignmentStatus`: on `EN_ROUTE`, `go notifyEnRoute(...)` — never blocks/errors the transition.
- New repo read: job fields from `jobs.jobs` by id+companyId.

### 4. technician-app (Expo)
- Profile: photo card — avatar or initials, "Add / Change photo" (camera or gallery via
  expo-image-picker), resize to 512×512 JPEG q0.7 (`expo-image-manipulator`, add dep),
  upload FormData → `/crm/users/me/avatar`; remove option.
- Signup: optional photo pick; uploaded right after account creation succeeds (best-effort).
- Banner component on Home + Profile when `me.avatarUrl` null: "Add your photo —
  customers see who's coming." Dismiss = session only (module state), tap → profile.

### 5. admin-dashboard
- AddTechnicianModal: optional photo file input (preview + clear); after tech creation,
  POST `/crm/users/:id/avatar` best-effort (toast warning on failure, tech still created).

## Error handling

Email/SMS/notify failures are logged and never surface to the technician's status
update. ETA failure degrades to scheduled window or timeless copy. Avatar upload
validation: reject >2 MB and non-image mimes with 400.

## Testing

- crm: Jest — upload validation (mime/size), replace deletes old key, internal profile endpoint scoping.
- comms: Jest — en-route service: both channels, email-only, sms-only, no-contact skip, dedupe.
- Go: `go test` — ETA window math, OSRM failure fallback, no-GPS fallback (OSRM mocked via httptest).
- Frontends: `tsc -b` / expo type-check; manual flow test per testing guide.

## Prod deploy notes (one-time, documented not automated)

GCS bucket `tscrm-avatars` (public read), HMAC key for interop, Cloud Run env vars on
crm-service (`S3_ENDPOINT=https://storage.googleapis.com`, keys, bucket, public base
URL); `COMMS_SERVICE_URL` + `SERVICE_JWT` on scheduling-service.

## Out of scope (phase 2)

Live-tracking link in email, MMS photo in SMS, avatars on dispatch-board UI, push nag.
