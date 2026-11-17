# Technician Mobile App — Product Specification

## 1. Purpose

The technician mobile app is the **field-facing tool** for trade technicians (HVAC, Plumbing, Electrical). It connects to the same 6 backend microservices that power the admin dashboard and customer portal.

**Core mission**: Give technicians everything they need on-site — assigned jobs, checklists, parts/labour logging, GPS tracking, customer info, navigation, expense capture, and messaging — in a mobile-first experience that works reliably in the field.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React Native + Expo SDK 51 | Cross-platform iOS/Android, OTA updates |
| Navigation | Expo Router (file-based) | Convention-based, deep linking support |
| State/Data | TanStack Query v5 + Zustand | Server cache + lightweight local state |
| HTTP | Axios | Consistent with admin dashboard & customer portal |
| Maps | react-native-maps (Google Maps) | Turn-by-turn directions, job site markers |
| Location | expo-location | Background GPS tracking |
| Camera | expo-camera + expo-image-picker | Job photos (before/after/equipment/issue) |
| Push | expo-notifications + FCM | Real-time job assignments & alerts |
| Storage | expo-secure-store | JWT token storage (encrypted) |
| Offline | @tanstack/query-persist-client + MMKV | Offline-first queue for field use |

---

## 3. Authentication

- Login: `POST /api/crm/auth/login` (email + password)
- JWT stored in `expo-secure-store` (key: `tech_token`)
- Token contains: `userId`, `companyId`, `role: "technician"`
- Auto-inject `Authorization: Bearer <token>` on all requests
- 401 response → force logout → login screen
- Password change: `POST /api/crm/auth/change-password`

**API Base URL**: Configurable per environment (dev: `http://<local-ip>:80/api`, prod: `https://api.tscrm.com/api`)

---

## 4. Screens & Features

### 4.1 Login Screen

- Email + password form
- "Remember me" (persist credentials in secure store)
- Error handling (invalid credentials, network failure)
- Company logo + branding

---

### 4.2 Home / Today's Schedule

**What it shows**: The technician's day at a glance.

**Data sources**:
- `GET /scheduling/dispatch/assignments/technician/:myTechId?status=ASSIGNED,EN_ROUTE,ON_SITE` → today's active assignments
- `GET /jobs/jobs/:id` → job details for each assignment
- `GET /scheduling/technicians/me` → own profile (rating, skills, stats)

**UI**:
- **Header**: Greeting ("Good morning, John"), today's date, profile avatar
- **Stats row**: Jobs Today (count), Completed, On Route/On Site
- **Job cards** (scrollable list, sorted by scheduledStart):
  - Job title + job number
  - Customer name + service address
  - Scheduled time window
  - Priority badge (Normal / High / Emergency)
  - Status pill (ASSIGNED → EN_ROUTE → ON_SITE → COMPLETED)
  - Trade type icon (HVAC/Plumbing/Electrical)
  - **Tap → Job Detail screen**
- **"Start Route" button** on next ASSIGNED job (triggers EN_ROUTE status + opens navigation)

---

### 4.3 Job Detail Screen

**What it shows**: Everything about a single job.

**Data sources**:
- `GET /jobs/jobs/:id` → full job with work orders, custom fields, status history
- `GET /scheduling/dispatch/assignments/job/:jobId` → assignment info (distance, score)
- `GET /crm/customers/:customerId` → customer contact details, addresses, equipment

**Tabs**:

#### Tab 1: Overview
- Job title, description, priority, trade type
- Customer card: name, phone (tap to call), email (tap to email), address
- Service address with map preview (tap → open in Google/Apple Maps)
- Assignment info: distance (km), scheduled window, estimated duration
- Status timeline (visual: PENDING → SCHEDULED → EN_ROUTE → ON_SITE → COMPLETED)

#### Tab 2: Checklist (Work Order Tasks)
- Source: work order `taskCompletions[]` (pre-populated from job template)
- Each task shows:
  - Task name + description
  - Required badge (if `isRequired: true`)
  - Safety note (red alert banner if `safetyNote` exists)
  - Photo required indicator
  - Checkbox to mark complete
  - Camera button (opens photo capture)
  - Notes input field
- **API**: `PATCH /jobs/work-orders/:woId/tasks/:taskCompletionId`
  - Body: `{ isCompleted: true, notes?: string, photoUrl?: string }`
- Progress bar at top: "7/12 tasks complete"

#### Tab 3: Parts & Labour
- Source: work order `lineItems[]`
- **Add item**: Button opens modal
  - Search price book: `GET /jobs/price-book?search=<query>&category=<cat>`
  - Or manual entry: description, category, quantity, unit price
  - **API**: `POST /jobs/work-orders/:woId/line-items`
- **Remove item**: Swipe to delete
  - **API**: `DELETE /jobs/work-orders/:woId/line-items/:id`
- Running total at bottom (sum of lineTotal values)
- Categories: LABOUR, PART, MATERIAL, EQUIPMENT_RENTAL, SUBCONTRACTOR, OTHER

#### Tab 4: Custom Fields (Trade-Specific)
- Source: job `customFieldValues[]` + `JobCustomFieldDef[]` from trade type
- Dynamic form rendered based on field definitions:
  - TEXT → TextInput
  - NUMBER → NumericInput
  - BOOLEAN → Switch/Toggle
  - SELECT → Picker/Dropdown (options from `options` JSON)
  - MULTI_SELECT → Multi-select chips
  - DATE → DatePicker
  - TEXTAREA → Multi-line TextInput
- Help text shown below each field
- Required fields marked with asterisk
- **API**: `PATCH /jobs/jobs/:id/custom-fields`
  - Body: `{ fields: [{ fieldDefId: string, value: any }] }`

#### Tab 5: Notes & History
- Job notes (editable by technician)
- Internal notes (editable)
- Status history timeline (read-only): who changed what, when, with notes
- **API**: `PATCH /jobs/jobs/:id` for notes updates

---

### 4.4 Job Workflow (Status Actions)

The bottom of the Job Detail screen shows **one primary action button** based on current status:

| Current Status | Button | Action |
|----------------|--------|--------|
| ASSIGNED | "Start Route" (blue) | → EN_ROUTE + open navigation to serviceAddress |
| EN_ROUTE | "Arrived" (green) | → ON_SITE + check-in work order |
| ON_SITE | "Complete Job" (green) | → COMPLETED + check-out work order |
| COMPLETED | (no action, show completion badge) | — |

**Status transition APIs** (called in sequence):

**Start Route (ASSIGNED → EN_ROUTE)**:
1. `PATCH /scheduling/dispatch/assignments/:id/status` → `{ status: "EN_ROUTE" }`
2. `PATCH /jobs/jobs/:id/status` → `{ status: "EN_ROUTE", note: "Technician en route" }`
3. Open device navigation to `serviceLatitude, serviceLongitude`

**Arrived (EN_ROUTE → ON_SITE)**:
1. `PATCH /scheduling/dispatch/assignments/:id/status` → `{ status: "ON_SITE" }`
2. `PATCH /jobs/jobs/:id/status` → `{ status: "ON_SITE", note: "Technician arrived on site" }`
3. `PATCH /jobs/work-orders/:woId/check-in` (sets checkinAt timestamp)

**Complete Job (ON_SITE → COMPLETED)**:
1. Validate: all required tasks completed, all required photos taken
2. Prompt for technician notes (optional)
3. Customer signature capture (save to MinIO, get S3 URL)
4. `PATCH /jobs/work-orders/:woId/check-out` → `{ notes: "..." }`
5. `PATCH /scheduling/dispatch/assignments/:id/status` → `{ status: "COMPLETED" }`
6. `PATCH /jobs/jobs/:id/status` → `{ status: "COMPLETED", note: "Job completed by technician" }`

---

### 4.5 Photo Capture

**Used in**: Checklist tasks (before/after/issue photos), job-level photos

**Flow**:
1. Tap camera icon → choose "Take Photo" or "Pick from Gallery"
2. Photo preview with caption input
3. Select photo type: BEFORE, AFTER, GENERAL, EQUIPMENT, ISSUE
4. Upload to MinIO: `PUT /s3/photos/{companyId}/{jobId}/{filename}`
5. Store S3 key on task completion (`photoUrl`) or as JobPhoto

**Camera settings**: Max 2MB compressed, JPEG, geo-tagged with device location

---

### 4.6 GPS Tracking (Background)

**Purpose**: Live location for dispatch board + route analytics.

**Implementation**:
- `expo-location` with background location task
- Fires every **30 seconds** when technician has an active assignment (EN_ROUTE or ON_SITE)
- Stops when no active jobs or app is explicitly paused

**API**: `POST /api/scheduling/gps`
```json
{
  "lat": 25.2048,
  "lng": 55.2708,
  "accuracyM": 12.5,
  "speedKmh": 45.2,
  "headingDeg": 180.0,
  "batteryPct": 72
}
```

**Battery optimization**:
- EN_ROUTE: high accuracy (GPS), 30s interval
- ON_SITE: balanced accuracy, 60s interval
- No active job: GPS tracking OFF
- Battery < 15%: reduce to 120s interval

---

### 4.7 My Jobs (Full List)

**Data source**: `GET /jobs/jobs?assignedToId=<myUserId>&page=1&limit=20`

**UI**:
- Tab bar: Today | Upcoming | Completed
- **Today**: jobs with scheduledStart = today, sorted by time
- **Upcoming**: jobs with scheduledStart > today, sorted by date
- **Completed**: jobs with status = COMPLETED/INVOICED/PAID, sorted by completedAt desc
- Search bar (job number, customer name, address)
- Pull-to-refresh
- Each card → tap to open Job Detail

---

### 4.8 Notifications

**Data source**: `GET /api/comms/notifications?channel=PUSH,IN_APP&page=1&limit=50`

**Push notification types** (received via FCM):
- **New Job Assigned**: "New job: AC Repair at 123 Main St — Tap to view"
- **Job Reassigned**: "Job JOB-2024-0052 has been reassigned"
- **Schedule Change**: "Your 2pm job has been moved to 4pm"
- **Message from Dispatch**: "Dispatcher: Customer called, gate code is 4521"
- **Payment Received**: "Payment received for JOB-2024-0045"

**UI**:
- Bell icon with unread badge count on header
- Notification list with read/unread styling
- Tap notification → deep link to relevant job
- Mark read: `PATCH /api/comms/notifications/:id/read`
- Mark all read: `PATCH /api/comms/notifications/read-all`

**FCM Token Registration** (needed — new endpoint):
- On login + on token refresh: save FCM token to backend
- Proposed: `PATCH /api/scheduling/technicians/:id` with `{ pushToken: string }`
- Or: `POST /api/comms/notifications/register-device` with `{ token, platform, userId }`

---

### 4.9 Messages

**Data source**: `GET /api/comms/messaging/threads`

**UI**:
- Thread list: customer name, last message preview, timestamp, unread badge
- Thread detail: chat bubble UI (outbound = right/blue, inbound = left/gray)
- Message input with send button
- Auto-scroll to latest message
- Mark thread read on open: `PATCH /api/comms/messaging/threads/:id/read`
- Send message: `POST /api/comms/messaging/threads/:id/messages` → `{ body: string }`

**Context**: Technicians can message dispatch/office about job issues, parts needs, schedule changes.

---

### 4.10 Expenses

**Data source**: `GET /api/finance/expenses?technicianId=<myUserId>`

**Create expense** (from job context or standalone):
- Category picker: PARTS, FUEL, TOOLS, SUBCONTRACTOR, OTHER
- Amount input (decimal)
- Vendor name
- Description
- Receipt photo (camera → upload to MinIO → receiptUrl)
- Link to job (optional, pre-filled if opened from job)
- **API**: `POST /api/finance/expenses`
  ```json
  {
    "jobId": "job-uuid",
    "technicianId": "my-user-id",
    "category": "PARTS",
    "description": "Replacement capacitor",
    "amount": 45.99,
    "vendor": "HVAC Parts Direct",
    "receiptUrl": "s3://receipts/...",
    "expenseDate": "2026-03-16T10:30:00Z",
    "isReimbursable": true
  }
  ```
- Expense list: filterable by date range, category
- Status tracking: PENDING → APPROVED/REJECTED (read-only for tech)

---

### 4.11 Profile & Settings

**Data sources**:
- `GET /api/crm/users/me` → user profile
- `GET /api/scheduling/technicians/me` → technician profile (skills, rating, stats)

**Sections**:
- **Personal Info**: Name, phone, avatar (editable via `PATCH /api/crm/users/me`)
- **My Stats**: Rating (x/5 stars), total ratings, jobs completed this month
- **Skills**: List of trade skills (read-only, managed by admin)
- **Change Password**: `POST /api/crm/auth/change-password`
- **App Settings**:
  - GPS tracking toggle (on/off)
  - Notification preferences
  - Theme (light/dark)
- **Logout**: Clear secure store, navigate to login

---

## 5. Offline Support

Field technicians often work in areas with poor connectivity (basements, rural sites). The app must handle this gracefully.

**Strategy**:

| Feature | Offline Behavior |
|---------|-----------------|
| Job list | Cached via TanStack Query persist (MMKV) — last-fetched data shown |
| Job detail | Cached — full job data available offline |
| Checklist updates | Queued locally, synced when online (mutation queue) |
| Line item adds | Queued locally, synced when online |
| Status transitions | Queued locally, synced when online (show "pending sync" badge) |
| Photo uploads | Saved to device, upload queue processes when online |
| GPS tracking | Buffered locally (up to 100 points), batch-uploaded when online |
| Expense creation | Queued locally, synced when online |
| Messages | Read-only cache; new messages queued for send |

**Sync indicator**: Status bar icon showing "Synced" (green) / "Pending" (amber) / "Offline" (red)

---

## 6. Push Notifications

**Provider**: Firebase Cloud Messaging (FCM) via `expo-notifications`

**Registration flow**:
1. App launch → `expo-notifications.getExpoPushTokenAsync()` or `getDevicePushTokenAsync()`
2. Send token to backend (new endpoint or via technician profile update)
3. Backend stores token → comms-service uses it for `PushService.sendToToken()`

**Notification categories** (actionable):

| Event | Title | Body | Deep Link |
|-------|-------|------|-----------|
| Job Assigned | "New Job Assigned" | "{title} at {address} — {time}" | `/jobs/{jobId}` |
| Schedule Changed | "Schedule Updated" | "{title} moved to {newTime}" | `/jobs/{jobId}` |
| Job Cancelled | "Job Cancelled" | "{title} has been cancelled" | `/jobs` |
| Message Received | "Message from {name}" | "{preview...}" | `/messages/{threadId}` |
| Expense Approved | "Expense Approved" | "${amount} for {description}" | `/expenses` |

---

## 7. Navigation Structure

```
(Auth)
├── Login

(Main - Tab Navigator)
├── Home (Today's Schedule)
├── My Jobs (Full list with tabs: Today / Upcoming / Completed)
├── Notifications (Bell icon + list)
├── Messages (Thread list → Thread detail)
├── Profile (Settings + stats)

(Stack - pushed from any tab)
├── Job Detail (tabs: Overview / Checklist / Parts / Custom Fields / Notes)
├── Add Expense
├── Photo Capture
├── Signature Capture
```

---

## 8. API Endpoints Used (Complete List)

### Auth (CRM Service :3001)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/crm/auth/login` | Login |
| POST | `/crm/auth/change-password` | Change password |

### Profile (CRM :3001 + Scheduling :3003)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/crm/users/me` | User profile |
| PATCH | `/crm/users/me` | Update name/phone |
| GET | `/scheduling/technicians/me` | Tech profile (skills, rating) |
| PATCH | `/scheduling/technicians/:id` | Update tech profile |

### Jobs (Job Service :3002)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/jobs/jobs?assignedToId=X` | My jobs list |
| GET | `/jobs/jobs/:id` | Job detail |
| PATCH | `/jobs/jobs/:id` | Update notes/fields |
| PATCH | `/jobs/jobs/:id/status` | Transition job status |
| PATCH | `/jobs/jobs/:id/custom-fields` | Update trade fields |
| GET | `/jobs/trade/job-types` | Job type list |
| GET | `/jobs/trade/job-types/:id/custom-fields` | Custom field definitions |

### Work Orders (Job Service :3002)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/jobs/work-orders/by-job/:jobId` | Work orders for job |
| GET | `/jobs/work-orders/:id` | Work order detail |
| PATCH | `/jobs/work-orders/:id/check-in` | Arrive on site |
| PATCH | `/jobs/work-orders/:id/check-out` | Complete work |
| PATCH | `/jobs/work-orders/:id/tasks/:taskId` | Complete checklist task |
| POST | `/jobs/work-orders/:id/line-items` | Add part/labour |
| DELETE | `/jobs/work-orders/:id/line-items/:id` | Remove line item |
| GET | `/jobs/price-book?search=X` | Search price book |

### Scheduling (Scheduling Service :3003)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/scheduling/gps` | Send GPS location (every 30s) |
| GET | `/scheduling/dispatch/assignments/technician/:id` | My schedule |
| GET | `/scheduling/dispatch/assignments/:id` | Assignment detail |
| PATCH | `/scheduling/dispatch/assignments/:id/status` | Update EN_ROUTE/ON_SITE/COMPLETED |

### Finance (Finance Service :3004)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/finance/expenses` | Log expense |
| GET | `/finance/expenses?technicianId=X` | My expenses |
| GET | `/finance/expenses/:id` | Expense detail |

### Comms (Comms Service :3005)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/comms/notifications` | My notifications |
| PATCH | `/comms/notifications/:id/read` | Mark read |
| PATCH | `/comms/notifications/read-all` | Mark all read |
| GET | `/comms/messaging/threads` | Message threads |
| GET | `/comms/messaging/threads/:id` | Thread messages |
| POST | `/comms/messaging/threads/:id/messages` | Send message |
| PATCH | `/comms/messaging/threads/:id/read` | Mark thread read |

### Customer Info (CRM :3001)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/crm/customers/:id` | Customer contact details (for calling/emailing) |

**Total: ~30 endpoints** (all already exist in the backend — no new endpoints required except push token registration)

---

## 9. Backend Gap: What Needs Adding

Only **one** new backend endpoint is needed:

| Gap | Proposed Solution | Service |
|-----|-------------------|---------|
| FCM push token registration | Add `pushToken` field to technician update DTO, or create `POST /comms/register-device` | Scheduling or Comms |

Everything else — GPS, job management, work orders, checklists, expenses, messaging, notifications — is **already built and tested** in the existing 6 services.

---

## 10. Build Phases

### Phase 1: Core Job Flow
- Login screen
- Home (today's schedule)
- Job Detail (overview tab + status actions: Start Route → Arrived → Complete)
- GPS background tracking
- Push notification setup (FCM)

### Phase 2: Work Order Features
- Checklist tab (task completion with photos)
- Parts & Labour tab (add/remove line items, price book search)
- Custom fields tab (dynamic trade-specific form)
- Customer signature capture on completion

### Phase 3: Communication & Expenses
- Notifications screen (list + mark read + deep links)
- Messages screen (thread list + chat)
- Expenses (create + list + receipt photo)

### Phase 4: Polish & Offline
- Offline mutation queue (checklist, status, photos, GPS buffer)
- Sync indicator UI
- Profile & settings screen
- Dark mode
- App icon + splash screen

---

## 11. Key Design Principles

1. **One-hand operation**: Large tap targets, bottom navigation, swipe gestures — technicians wear gloves
2. **Speed over beauty**: Minimize taps to complete core workflow (arrive → checklist → parts → complete)
3. **Offline-resilient**: Every write operation queues locally first, syncs when online
4. **Battery-conscious**: GPS frequency adapts to job state and battery level
5. **Context-aware**: App knows what job you're on, pre-fills forms, shows relevant info first
6. **Consistent with platform**: Uses existing API contracts — same auth, same data shapes, same gateway
