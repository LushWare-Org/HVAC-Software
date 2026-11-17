# T&S CRM — Full System Testing Guide

A practical, end-to-end testing walkthrough for every feature in the system.
Work through each scenario in order — later scenarios depend on data created earlier.

---

## Before You Start

**Start all services:**
```bash
docker compose up -d          # PostgreSQL, Redis
cd apps/crm-service && pnpm dev
cd apps/job-service && pnpm dev
cd apps/scheduling-service && ./bin/server
cd apps/finance-service && pnpm dev
cd apps/comms-service && pnpm dev
cd apps/analytics-service && pnpm dev
cd apps/inventory-service && pnpm dev
cd apps/admin-dashboard && pnpm dev
```

**Open the technician app** (Expo Go or simulator):
```bash
cd apps/technician-app && pnpm dev
```

**URLs:**
- Admin Dashboard: http://localhost:5173
- Swagger (any service, e.g. job): http://localhost:3002/docs

---

## Scenario 1 — Login & Role Access

**Goal:** Verify both Admin and Technician logins work.

### Admin Login
1. Go to http://localhost:5173
2. Enter admin credentials
3. You should land on the **Dashboard** page with stats cards
4. Check the sidebar — you should see: Dashboard, Customers, Jobs, Scheduling, Dispatch, Finance, Inventory, Communications, Analytics, Team, Settings
5. Click your profile icon top-right — your name and role should show

### Technician Login (Mobile App)
1. Open the technician app
2. Log in with a technician account
3. You should see the bottom tab bar: Home, My Jobs, Van Stock, Alerts, Messages, Profile
4. Home screen should show today's assigned jobs

**What to check:**
- Admin cannot see the technician app
- Technician cannot access admin dashboard
- Wrong password shows an error message

---

## Scenario 2 — Customer Management

**Goal:** Create a customer and verify it appears everywhere.

### Create a Customer
1. Go to **Customers** in the sidebar
2. Click **+ New Customer**
3. Fill in:
   - Type: Residential
   - First Name: John, Last Name: Smith
   - Email: john.smith@test.com
   - Phone: 555-0100
   - Address: 123 Main St, Colombo
4. Save — you should see the customer in the list

### Edit a Customer
1. Click on John Smith's card
2. Click **Edit**
3. Change the phone number
4. Save — verify the change persists after refresh

### Add Equipment to Customer
1. Open John Smith's profile
2. Go to the **Equipment** tab
3. Click **+ Add Equipment**
4. Fill: Type = AC Unit, Brand = Mitsubishi, Model = SRK25, Serial = AC2024001
5. Save — equipment should appear in the list

**What to check:**
- Customer search works (type "John" in the search box)
- Filters work (filter by Residential)
- Customer count on Dashboard increases

---

## Scenario 3 — Job Templates Setup

**Goal:** Set up job types and templates before creating jobs.

1. Go to **Settings** → **Job Types** (or Templates section)
2. Create a Job Type: Name = HVAC, Slug = hvac, Color = Blue
3. Create a Template under HVAC:
   - Name = AC Annual Service
   - Duration = 90 minutes
   - Add tasks:
     - "Check refrigerant levels" (Required)
     - "Clean air filters" (Required)
     - "Test cooling performance" (Required)
     - "Check electrical connections" (Optional)
4. Under **Required Parts**, add:
   - Part Name = Refrigerant R-410A, Qty = 1
   - Part Name = Air Filter, Qty = 2
5. Save the template

**What to check:**
- Template appears in the templates list
- Tasks show in the correct order
- Required vs Optional tags display correctly

---

## Scenario 4 — Create and Manage Jobs

**Goal:** Create jobs, test filtering, and job detail views.

### Create a Job
1. Go to **Jobs** in the sidebar
2. Click **+ New Job**
3. Fill in:
   - Customer: John Smith (search and select)
   - Job Type: HVAC
   - Template: AC Annual Service
   - Title: Annual AC Service — John Smith
   - Priority: HIGH
   - Service Address: 123 Main St, Colombo
   - Latitude/Longitude: 6.9271, 79.8612 (for map testing)
4. Save — job should appear in the list

### Test Job List Filtering
1. On the Jobs page, verify **today's and future jobs** appear at the top
2. Scroll down — past jobs should be in a **collapsed section** labelled something like "Past Jobs"
3. Click the expand button — past jobs should appear
4. Use the **Priority filter** — select HIGH — only high priority jobs should show
5. Use the Status filter — try filtering by PENDING
6. Search for "John" — should find the job you created

### Open Job Detail
1. Click on the AC Service job
2. A side panel / modal should open with tabs:
   - **Overview** — customer info, address, scheduled time
   - **Checklist** — should show 4 tasks from the template
   - **Equipment** — customer's AC unit should appear here
   - **Notes** — internal notes field
3. All tabs should be visible without overflowing horizontally

**What to check:**
- Today/future jobs appear above past jobs
- Priority sort (EMERGENCY > HIGH > NORMAL > LOW) within the active jobs section
- Job detail tabs fit inside the panel without horizontal overflow

---

## Scenario 5 — Scheduling & Dispatch

**Goal:** Assign a technician to the job and see them on the map.

### Create a Technician Profile
1. Go to **Team** → **Technicians**
2. Add a technician with skills: HVAC, Electrical
3. Set max daily jobs = 5

### Assign the Job
1. Go to **Scheduling** in the sidebar
2. Find the AC Service job
3. Click **Smart Assign** — the system scores nearby technicians
4. You should see up to 3 suggestions with scores:
   - Distance Score
   - Workload Score
   - Rating Score
   - **Parts Score** (new — shows if technician's van has the required parts)
5. Click **Assign** on the best-scored technician
6. Job status should change to SCHEDULED

### Check the Dispatch Map
1. Go to **Dispatch** in the sidebar
2. The map should show:
   - Purple markers = technicians with GPS
   - Green markers = assigned jobs
   - Amber markers = unassigned jobs
3. Click a technician marker — popup should show:
   - Name, rating, skills
   - Speed / battery / heading (if GPS active)
   - **Van Stock section** (new) — shows "📦 Van Stock: X items · Y low"
   - Click the ▼ arrow to expand — see item list with quantities

**What to check:**
- Smart assign suggestions show parts score
- Map shows technician location if GPS is active from the mobile app
- Van stock expands/collapses in the popup

---

## Scenario 6 — Inventory Management (New Feature)

**Goal:** Test the full inventory workflow — add items, receive stock, transfer to van, consume.

### Add Inventory Items
1. Go to **Inventory** in the sidebar
2. Go to the **Stock Items** tab
3. Click **+ Add Item**
4. Fill in:
   - SKU: FILT-001
   - Name: Air Filter 16x20
   - Category: CONSUMABLE
   - Unit: each
   - Reorder Point: 5
   - Reorder Qty: 20
5. Save — item appears in the Stock Items table
6. Add a second item:
   - SKU: REF-R410A
   - Name: Refrigerant R-410A
   - Category: MATERIAL
   - Unit: can
   - Reorder Point: 3
   - Reorder Qty: 10

### Receive Stock (Purchase Order)
1. Go to the **Purchase Orders** tab
2. Click **+ New Purchase Order**
3. Fill in:
   - Supplier: HVAC Supplies Co
   - Add line: Air Filter 16x20, Qty = 20, Unit Cost = 5.00
   - Add line: Refrigerant R-410A, Qty = 10, Unit Cost = 45.00
   - Total should auto-calculate = $550.00
4. Save — PO is created with status DRAFT
5. Click the PO → Change status to **ORDERED**
6. Click **Receive PO** — all stock should move to warehouse
7. Check the **Low Stock Alerts** tab — items should NOT be there (you just stocked up)
8. Check **Movements Log** — you should see INTAKE movements for both items

**What to check:**
- PO status transitions: DRAFT → ORDERED → RECEIVED
- After receiving, warehouse stock increases
- A new expense record auto-creates in Finance (check Finance → Expenses — you should see "PO PO-2026-0001 - HVAC Supplies Co")

### Transfer Stock to Van
1. Still in Inventory, click the **Transfer** button (or find it in the Stock Items tab)
2. Select:
   - Item: Air Filter 16x20
   - From: Main Warehouse
   - To: [Technician Name]'s Van
   - Quantity: 5
3. Transfer — check the Movements Log for a TRANSFER entry
4. Repeat for Refrigerant R-410A, transfer 3 cans to van

### Check Stock Detail
1. Click the eye icon on Air Filter 16x20
2. Stock Detail Modal should show:
   - Warehouse: 15 (you received 20, transferred 5)
   - [Tech]'s Van: 5
3. Close modal

### Test Low Stock Alert
1. Click **Adjust** on Air Filter 16x20
2. Set warehouse quantity to **3** (below reorder point of 5)
3. Save — check the **Low Stock Alerts** tab — Air Filter should now appear in red
4. Check Communications → you should receive an in-app notification: "Low Stock Alert"

**What to check:**
- Stock numbers are accurate after each operation
- Low stock alert appears when qty < reorderPoint
- Notification fires in Communications

---

## Scenario 7 — Work Orders (Technician Side)

**Goal:** Technician checks in, completes checklist, adds parts — verify inventory auto-deducts.

### Mobile App — Start the Job
1. Open the technician app
2. Go to **My Jobs** — the AC Service job should be listed
3. Tap the job → Job Detail screen opens
4. Tap **Start Route** — status changes to EN_ROUTE
5. Map navigation should offer to open Google Maps / Apple Maps
6. Tap **Arrived** — status changes to ON_SITE

### Complete the Checklist
1. In the job detail, go to the **Checklist** tab
2. Tick each task:
   - "Check refrigerant levels" ✓
   - "Clean air filters" ✓
   - "Test cooling performance" ✓
   - "Check electrical connections" ✓ (optional)
3. Add a note on one task
4. Progress indicator should show 4/4

### Add Parts Used (Line Items)
1. Go to the **Parts** tab in the job detail
2. Tap **+ Add Part**
3. Search price book for "Air Filter" — select it
4. Quantity = 2, price auto-fills
5. Add — line item appears
6. Add another: Refrigerant R-410A, Qty = 1

**What to check (after adding parts):**
- Go back to admin dashboard → Inventory → Movements Log
- You should see **CONSUME** movements:
  - Air Filter 16x20: 2 consumed from [Tech]'s Van
  - Refrigerant R-410A: 1 consumed from [Tech]'s Van
- Van stock in the dispatch map popup should have decreased
- If van stock of refrigerant drops below 3, a low-stock notification fires

### Check Out
1. Tap **Complete Job** in the mobile app
2. Confirm completion — job status changes to COMPLETED
3. Back in admin dashboard, the job should now show COMPLETED status

---

## Scenario 8 — Van Stock (Technician App — New Feature)

**Goal:** Technician can see their van inventory from the mobile app.

1. In the technician app, tap the **Van Stock** tab (📦)
2. You should see:
   - Stats at top: Items count, Total Qty, Low Stock count
3. Tab shows **Stock Items** by default
   - Air Filter should show: On Hand = 3, Reserved = 0, Available = 3
   - Refrigerant should show: On Hand = 2, Reserved = 0, Available = 2
4. Items below reorder point should have a red border + ⚠️ Low Stock badge
5. Use the **search bar** — type "filter" — only Air Filter should show
6. Switch to the **History** tab
   - Should show the CONSUME and TRANSFER movements from earlier

**What to check:**
- Quantities match what was consumed on the work order
- Low stock items are visually highlighted
- Search works correctly

---

## Scenario 9 — Finance

**Goal:** Generate an invoice from the completed job and test payment flow.

### Create Invoice
1. Go to **Finance** in the admin dashboard
2. Click **+ New Invoice**
3. Select the completed AC Service job
4. Line items from the work order should auto-populate
5. Review subtotal and tax
6. Save — invoice created with status DRAFT

### Approve and Send
1. Open the invoice
2. Change status to SENT
3. A Stripe payment link should be generated
4. Copy the payment link and open it in a browser
5. Test payment with Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
6. Return to Finance — invoice status should change to PAID

### Check Expenses
1. Go to the **Expenses** tab in Finance
2. You should see the auto-created expense from Scenario 6:
   - "PO PO-2026-0001 - HVAC Supplies Co" — $550.00 — Category: PARTS
3. Click **+ Add Expense** manually
   - Description: Fuel for service call
   - Amount: 15.00
   - Category: FUEL
   - Job: AC Service job
4. Save — expense appears in list

**What to check:**
- Invoice line items pulled from work order correctly
- Auto-created PO expense exists
- Expense totals show in Analytics

---

## Scenario 10 — Communications

**Goal:** Test messaging and notifications.

### In-App Notifications
1. Go to **Communications** in the sidebar → **Notifications** tab
2. You should see notifications from earlier:
   - "New Job Assigned" (from Scenario 5)
   - "Low Stock Alert" (from Scenario 6, if triggered)
3. Click a notification — mark as read
4. Click "Mark all read"

### Customer Messaging
1. Go to **Communications** → **Messages** tab
2. Click **+ New Conversation**
3. Select a customer (John Smith) and channel (SMS or In-App)
4. Type a message: "Your AC service is scheduled for today"
5. Send — message appears in the thread

### Internal Staff Message
1. Still in Messages
2. Create an internal thread — select another staff member
3. Send a message — the recipient should see it in their notifications

### Mobile App Notifications
1. In the technician app, tap the **Alerts** tab (🔔)
2. "New Job Assigned" notification should be there
3. Tap it to read it
4. Badge count should decrease

**What to check:**
- Unread count badge on the Alerts tab in mobile app
- Message threads persist after refresh
- SMS notifications show as SENT/DELIVERED if Twilio is configured

---

## Scenario 11 — Analytics

**Goal:** Verify analytics data reflects activity from all previous scenarios.

1. Go to **Analytics** in the sidebar
2. Check the overview stats:
   - Jobs Completed: should include your AC Service job
   - Revenue: should include your invoice amount
   - Active Technicians: should include your technician
3. Click on your technician's performance card
4. You should see:
   - Jobs completed: 1
   - Avg job time
   - Rating (if rated)
5. Use the date filter — change to "This Week" — stats should still show

**What to check:**
- Numbers match what you actually did
- Charts render without errors
- Date range filter works

---

## Scenario 12 — Scheduling Integration with Parts Score

**Goal:** Verify the new parts availability score affects technician ranking.

### Setup
1. Make sure your technician's van has **some** stock (from Scenario 6 transfers)
2. Make sure another technician's van has **no stock**
3. Create a new job with required parts (use the AC Annual Service template which has requiredParts set)

### Run Smart Assign
1. Go to **Scheduling** → assign the new job
2. In the suggestions panel, compare the two technicians:
   - Technician WITH van stock: Parts Score should be higher (closer to 100)
   - Technician WITHOUT van stock: Parts Score = 0 or 50
3. Total score should be higher for the technician with parts
4. The dispatcher suggestion order should favour the tech with parts

**What to check:**
- Parts Score column/bar appears in suggestions
- Tech with van stock scores higher
- Auto-assign picks the tech with parts if score ≥ 90

---

## Scenario 13 — Team Management

**Goal:** Test user and technician management.

1. Go to **Team** in the sidebar
2. View current team members
3. Invite a new user:
   - Email: newtech@company.com
   - Role: Technician
4. Check that the invite is sent (or a temporary password is shown)
5. Edit an existing technician's skills — add "Electrical"
6. Verify the skill shows up in dispatch suggestions for electrical jobs

---

## Scenario 14 — Settings

**Goal:** Verify company settings save correctly.

1. Go to **Settings**
2. Update company name or logo
3. Save — refresh the page and verify it persists
4. Check **Job Types** — the HVAC type you created in Scenario 3 should be listed
5. Try to add a custom field to the HVAC job type:
   - Field: Refrigerant Type (SELECT: R-410A, R-22, R-32)
6. Create a new job with HVAC type — the custom field should appear in the job form

---

## Quick Smoke Test Checklist

Run this after any code change to quickly verify nothing is broken:

| Area | Test | Pass? |
|------|------|-------|
| Auth | Login with admin account | |
| Auth | Login with technician account (mobile) | |
| Customers | Create a customer | |
| Jobs | Create a job | |
| Jobs | Job list shows today/future first, past collapsed | |
| Jobs | Priority filter works | |
| Jobs | Job detail tabs don't overflow | |
| Scheduling | Smart assign returns suggestions | |
| Scheduling | Suggestions show parts score | |
| Dispatch | Map shows technician marker | |
| Dispatch | Technician popup shows van stock | |
| Inventory | Add item | |
| Inventory | Receive PO → stock increases | |
| Inventory | Transfer warehouse → van | |
| Inventory | Low stock alert triggers when qty < reorderPoint | |
| Inventory | PO receipt auto-creates expense in Finance | |
| Work Orders | Add line item (PART) → van stock decreases | |
| Technician App | Van Stock tab shows correct quantities | |
| Technician App | Low stock items highlighted in red | |
| Finance | Create invoice | |
| Comms | Notification received after job assignment | |
| Comms | Low stock notification fires | |
| Analytics | Dashboard stats load | |

---

## Known Things to Look Out For

- **Map not showing technician:** GPS only updates when the technician app is actively sending location. Open the tech app and the location should start broadcasting.
- **Parts score = 0:** This is expected if the technician has no van location set up yet. Ensure `POST /inventory/locations/ensure-van` has been called for the technician.
- **Inventory auto-consume not firing:** The price book item must have a matching inventory item via `priceBookItemId`. Link them when creating the inventory item.
- **PO expense not appearing:** Check that the inventory service and finance service are both running. The call is fire-and-forget — check service logs for warnings.

---

*Testing guide last updated: 2026-03-24*
*Covers: CRM, Jobs, Scheduling, Dispatch, Finance, Communications, Analytics, Inventory (all phases)*
