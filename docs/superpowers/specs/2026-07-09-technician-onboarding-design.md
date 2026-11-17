# Tenant-Aware Technician Onboarding — Design

**Date:** 2026-07-09 · **Status:** Approved (user) · **Branch:** feat/marketing

## Problem

Each tenant's admin (KASE, Orrix, US demo) must onboard technicians from their own
dashboard. Today there are two divergent paths:

- **Dispatch board `AddTechnicianModal`** — correct (provision + temp-password email),
  but forces the admin to pick the technician's base location on a map. Admins don't
  know the tech's exact home/base location.
- **Team page `AddMemberModal` (technician branch)** — broken: creates the CRM user via
  `POST /crm/users` with **no password** (tech can't log in, no email) and registers the
  scheduling profile with hardcoded Colombo coordinates.

## Decisions (user-approved)

1. **One shared modal** used by both Team page and Dispatch board; location fields removed.
2. **Scheduling profile created at provision time with no location**; tech shows a
   "Location not set" badge and is excluded from AI auto-assignment until located
   (the candidate query already filters `current_location IS NOT NULL` — no Go change).
3. **First login in the technician app is blocking**: forced password reset → mandatory
   "Set your base location" screen (GPS one-tap / map pin / address search) → main app.

## Flow

Admin (Team or Dispatch page) → **Add Technician** (name, email w/ live duplicate check,
phone, max daily jobs, photo, skills — no location) →
`POST /crm/auth/provision-technician` (approved user, `mustResetPassword=true`, temp
password emailed) → `POST /scheduling/technicians` (no lat/lng) → ensure van → photo upload.

Technician: login with temp password → `force-reset-password` screen →
**new `setup-location` screen** (blocking, no back gesture) → save via
`PATCH /scheduling/technicians/:id { latitude, longitude }` → main tabs.

## Changes

### Backend
None. `ProvisionTechnicianDto.latitude/longitude` and the Go `CreateTechnicianRequest`
lat/lng are already optional; `scheduling.technicians.current_location` is nullable;
`FindCandidatesNearby` already excludes null locations; `/scheduling/technicians/me`
auto-creates a profile if the admin-side create ever failed.

### Admin dashboard
- `src/components/AddTechnicianModal.tsx` (new, moved from `pages/dispatch/`):
  MapPicker + lat/lng removed; provision payload omits latitude/longitude; info note
  "The technician sets their base location when they first sign in to the app."
  Keeps: email check, skills, photo, max daily jobs, ensure-van.
- `pages/dispatch/AddTechnicianModal.tsx` deleted; DispatchBoard imports the shared one.
- `pages/Team.tsx`: new "Add Technician" button opening the shared modal; the generic
  Add Member modal drops the technician role option (and its skills/MapPicker branch).
- "Location not set" badge on technicians without `currentLocation`: Dispatch board tech
  cards + Team page technician rows (Team joins `useTechnicians()` by `userId`).

### Technician app
- `app/setup-location.tsx` (new, blocking): reuses the Profile tab's base-location UX
  (MapView, tap-to-pin, Nominatim search, "Use my current location", reverse-geocode
  label). Saves with `useUpdateBaseLocation` using the id from `useTechnicianProfile()`.
  If the profile already has a location (or profile is null after auto-sync fails),
  redirects straight to tabs — never traps the tech.
- `app/force-reset-password.tsx`: on success routes to `/setup-location` instead of tabs.
- `app/index.tsx`: authenticated + no reset pending + tech profile loaded without
  location → redirect to `/setup-location` (covers app relaunch mid-onboarding).
- `app/_layout.tsx`: register the screen with `gestureEnabled: false`.

## Out of scope
Technician self-signup tenant resolver (invite codes), LK SMS gateway, deployment.

## Testing
crm-service unit tests stay green; admin-dashboard `tsc -b && vite build`;
technician-app `tsc --noEmit`; live end-to-end under KASE (provision → email →
login → reset → location → dispatch board shows located tech). No git commits (user).
