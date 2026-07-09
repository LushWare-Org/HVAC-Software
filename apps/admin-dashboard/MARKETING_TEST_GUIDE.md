# Marketing Module — Manual Test Guide

**Your test contacts**
| Channel | Value |
|---------|-------|
| Email 1 | pravishan88@gmail.com |
| Email 2 | pasinduravishan88@gmail.com |
| Email 3 | emenusha14@gmail.com |
| Email 4 | pasinduravishan.22@cse.mrt.ac.lk |
| Mobile (SMS) | +94719105181 |

---

## Pre-flight: Point 2 demo customers at your real contacts

Before running any test, update two seed customers so messages actually reach you.

**Option A — via Admin Dashboard UI**
1. Go to **Customers** → find `Nina Patel` (demo-customer-010)
2. Edit → set email to `pravishan88@gmail.com`, mobile to `+94719105181`
3. Find `Marcus Lee` (demo-customer-011)
4. Edit → set email to `pasinduravishan88@gmail.com`, mobile to `+94719105181`

**Option B — direct SQL (Supabase Dashboard SQL Editor)**
```sql
UPDATE crm.customers
SET email = 'pravishan88@gmail.com', mobile = '+94719105181'
WHERE id = 'demo-customer-010';

UPDATE crm.customers
SET email = 'pasinduravishan88@gmail.com', mobile = '+94719105181'
WHERE id = 'demo-customer-011';
```

---

## Section 1 — Settings Tab

**Purpose:** Verify defaults load correctly and toggles + caps persist.

### TEST-S1 — Open Settings tab fresh
1. Go to **Marketing → Settings**
2. **Expect:** All 4 automation toggles ON, Freq cap = 3/day, 10/week, sender name blank
3. **Pass:** No error toast, all fields rendered

### TEST-S2 — Change frequency caps
1. Set **Max per day** to `1`, **Max per week** to `3`
2. Click **Save Settings**
3. **Expect:** Green "Settings saved" toast
4. Refresh the page → go back to Settings
5. **Expect:** Values still show 1/day, 3/week
6. **Pass:** Values persisted

### TEST-S3 — Set sender name
1. Set **Default Sender Name** to `T&S Brothers`
2. Save → refresh → recheck
3. **Expect:** Name persists
4. Reset it back to blank when done (optional)

### TEST-S4 — Disable a feature toggle
1. Toggle **Win-back Campaigns** OFF
2. Save
3. **Expect:** Toggle stays OFF after refresh
4. Toggle it back ON and save — confirm it returns ON
5. **Pass:** Toggle state persists both ways

### TEST-S5 — Disable Global Marketing
1. Toggle **Global Marketing** OFF → Save
2. Run TEST-C5 (launch a campaign) → message should be silently skipped (no delivery)
3. Toggle back ON → Save
4. **Pass:** Global kill-switch works

---

## Section 2 — Templates Tab

### TEST-T1 — Seed default templates
1. Go to **Marketing → Templates**
2. Click **Seed Defaults**
3. **Expect:** 6 templates appear:
   - HVAC Tune-Up Reminder (SMS)
   - Plumbing Emergency Alert (SMS)
   - Electrical Safety Check (EMAIL)
   - Water Heater Maintenance (EMAIL)
   - Seasonal Promo (SMS)
   - Win-Back Offer (SMS)
4. Click **Seed Defaults** again
5. **Expect:** Same 6 — no duplicates (idempotent)
6. **Pass:** Count stays at 6

### TEST-T2 — Create a custom SMS template
1. Click **New Template**
2. Name: `Test SMS — Ravishan`, Channel: **SMS**
3. SMS Body:
   ```
   Hi {{customer.firstName}}, this is a test from {{company.name}}. Check our latest offers: {{trackedLink}} Reply STOP to opt out.
   ```
4. Click **Create**
5. **Expect:** Template appears in list
6. **Pass:** No error

### TEST-T3 — Create a custom EMAIL template
1. Click **New Template**
2. Name: `Test Email — Ravishan`, Channel: **EMAIL**
3. Subject: `Test from {{company.name}} for {{customer.firstName}}`
4. HTML Body:
   ```html
   <p>Hi {{customer.firstName}},</p>
   <p>This is a test marketing email from <strong>{{company.name}}</strong>.</p>
   <p><a href="{{trackedLink}}">Click here</a> to see our latest offer.</p>
   <p>To unsubscribe: <a href="{{unsubLink}}">click here</a></p>
   ```
5. Click **Create**
6. **Pass:** Template saved, appears in list

### TEST-T4 — Delete a template
1. Click the trash icon on `Test SMS — Ravishan`
2. **Expect:** Removed from list, success toast
3. **Pass:** Gone on refresh

---

## Section 3 — Audiences Tab

### TEST-A1 — Create audience with no filters (all customers)
1. Go to **Marketing → Audiences**
2. Click **New Audience**
3. Name: `All Active Customers`, Type: **Dynamic**
4. Leave filter rows empty → **preview shows "Add filters to see estimated reach"**
5. Click **Create**
6. **Expect:** Audience appears with `All customers` in Filters column
7. **Pass:** Created, `lastCount` = total active customer count

### TEST-A2 — Create audience filtered by State
1. Click **New Audience**
2. Name: `Texas Customers`, Type: Dynamic
3. Click **+ Add Filter** → Field: `State`, Op: `is`, Value: `TX`
4. **Expect:** Live preview shows `X customers match` (should be ~24)
5. Click **Create**
6. **Pass:** Audience saved, Filters column shows `State is TX`

### TEST-A3 — Create audience filtered by Lifecycle Stage (multi)
1. Click **New Audience**
2. Name: `Active + Lead Customers`, Type: Dynamic
3. Add Filter → `Lifecycle Stage` / `is any of` / select `ACTIVE`
4. Note: type `ACTIVE,LEAD` in the field (comma-separated)
5. Watch preview count update
6. Click **Create**
7. **Pass:** Filters column shows `Lifecycle Stage in ACTIVE, LEAD`

### TEST-A4 — Create audience with stacked filters
1. Name: `TX Active Customers`, Type: Dynamic
2. Filter 1: `State` / `is` / `TX`
3. Filter 2: `Lifecycle Stage` / `is` / `ACTIVE`
4. **Expect:** Preview count is smaller than just TX alone (intersection)
5. Click **Create**
6. **Pass:** Both filter pills visible in list row

### TEST-A5 — Create audience filtered by City
1. Name: `Houston Customers`, Type: Dynamic
2. Filter: `City` / `contains` / `Houston`
3. Check preview count
4. Create
5. **Pass:** Filter pill shows `City contains Houston`

### TEST-A6 — Delete an audience
1. Click trash on `All Active Customers`
2. Confirm dialog
3. **Pass:** Removed from list

---

## Section 4 — Campaigns Tab

> **Prerequisite:** You need at least one template and one audience. Use `Texas Customers` audience + `Test Email — Ravishan` template.

### TEST-C1 — Create a DRAFT SMS campaign
1. Go to **Marketing → Campaigns**
2. Click **New Campaign**
3. Name: `May SMS Blast`, Channel: **SMS**
4. Audience: `Texas Customers`, Template: `HVAC Tune-Up Reminder`
5. Leave Schedule At blank
6. Click **Create**
7. **Expect:** Campaign appears with status `DRAFT`
8. **Pass:** No errors

### TEST-C2 — Create a DRAFT Email campaign
1. Click **New Campaign**
2. Name: `May Email Blast`, Channel: **EMAIL**
3. Audience: `TX Active Customers`, Template: `Test Email — Ravishan`
4. Click **Create**
5. **Expect:** Status `DRAFT`
6. **Pass:** Created

### TEST-C3 — Create a SCHEDULED campaign
1. Click **New Campaign**
2. Name: `Scheduled Test Blast`, Channel: **SMS**
3. Audience: `Texas Customers`, Template: `Seasonal Promo`
4. Set **Schedule At** to a time 5 minutes in the future
5. Click **Create**
6. **Expect:** Status `SCHEDULED`
7. **Pass:** Scheduled badge visible

### TEST-C4 — Launch the Email campaign (you'll receive the email)
1. Find `May Email Blast` in the list
2. Click **Launch** → confirm prompt
3. **Expect:**
   - Status changes to `SENDING` then `SENT`
   - `pravishan88@gmail.com` and `pasinduravishan88@gmail.com` receive the email within ~30 seconds
   - Subject line has your first name merged in (`Hi Nina, ...` for Nina Patel)
   - Tracked link resolves when clicked
   - Unsubscribe link works
4. **Pass:** Email arrives with merge tags resolved, no `{{...}}` literals visible

### TEST-C5 — Launch the SMS campaign (you'll receive the SMS)
1. Find `May SMS Blast`
2. Click **Launch**
3. **Expect:**
   - `+94719105181` receives SMS within ~30 seconds
   - Text reads: `Hi Nina, it's time for your annual HVAC tune-up!...`
   - No raw `{{customer.firstName}}` or `{{trackedLink}}` in the message
4. **Pass:** SMS received with resolved content

### TEST-C6 — Verify campaign stats update after send
1. After launching, wait ~60 seconds
2. Go to **Overview** tab → switch range to `7d`
3. **Expect:** `Sent` KPI count is higher than before the launch
4. Go to **Overview** → campaign stats table shows the launched campaign with sent count
5. **Pass:** Stats reflect actual sends

---

## Section 5 — Overview Tab (Stats & Attribution)

### TEST-O1 — KPI cards load
1. Go to **Marketing → Overview**
2. **Expect:** 5 KPI cards load without `NaN` or `undefined`:
   - Messages Sent
   - Delivery Rate (%)
   - Open Rate (%)
   - Click Rate (%)
   - Review Requests
3. Toggle between `7d / 30d / 90d`
4. **Expect:** Numbers change per range
5. **Pass:** No crashes, no blank values

### TEST-O2 — Automation Activity panel
1. On Overview, scroll to **Automation Activity** panel
2. **Expect:** 5 rows: Total Clicks, Review Sends, Review Clicks, Win-back Sends, Automation Sends
3. All values should be numbers (0 is fine if no automations fired)
4. **Pass:** Panel renders, no undefined

### TEST-O3 — Campaign stats table
1. After launching a campaign (TEST-C4/C5), check the campaign table
2. **Expect:** Campaign row shows sent count > 0
3. **Pass:** Sent count matches number of audience members

---

## Section 6 — Compliance Tab (CCPA)

### TEST-CP1 — Delete a customer's marketing data
1. Go to **Marketing → Compliance**
2. In **Customer ID** field, enter `demo-customer-010` (Nina Patel — the one you updated to your email)
3. Click **Delete Marketing Data** → confirm
4. **Expect:** Green toast showing how many records were deleted (SendJobs, suppressions, review requests)
5. **Pass:** Deletion result shows counts

### TEST-CP2 — Audit log records the deletion
1. Still on Compliance tab
2. **Expect:** Deletion log table shows a new row with:
   - Customer ID: `demo-customer-010`
   - Deleted by: your user email
   - Records deleted: matches the toast count
3. **Pass:** Log entry visible

### TEST-CP3 — Deleted customer gets no more messages
1. After TEST-CP1, launch any campaign that includes Nina Patel (demo-customer-010)
2. Check server logs or wait for delivery
3. **Expect:** No email/SMS to `pravishan88@gmail.com` from this campaign
4. **Pass:** Suppression is enforced (the deletion creates a suppression record)

---

## Section 7 — Frequency Cap Enforcement

### TEST-F1 — Cap at 1 message per day
1. Go to **Settings** → set **Max per day** to `1`, **Max per week** to `3` → Save
2. Launch `May SMS Blast` (targets TX customers including Nina Patel)
3. You should receive the SMS on `+94719105181`
4. Immediately launch a second SMS campaign targeting the same audience
5. **Expect:** No second SMS arrives (capped at 1/day)
6. Check server logs for `[MarketingSendWorker] frequency cap exceeded` log line
7. Reset caps to 3/day, 10/week when done

---

## Section 8 — Automation Triggers (requires server log inspection)

These fire via background cron jobs, so you test them by manipulating DB data and watching logs.

### TEST-AU1 — Review request automation
**What it does:** After a job is completed, send SMS on day 1 + email on day 3 asking for a review.

1. In the CRM, create a booking for Nina Patel and mark it **Completed**
2. Watch comms-service logs:
   ```
   pnpm --filter comms-service dev
   ```
3. **Expect within ~30s:**
   ```
   [ReviewRequestService] queued review-sms for customer demo-customer-010
   ```
4. `+94719105181` should receive an SMS asking for a review
5. 3 days later (or set the BullMQ delay to 1s for testing): email arrives at `pravishan88@gmail.com`
6. **Pass:** Both channels triggered, merge tags resolved

### TEST-AU2 — Equipment lifecycle automation (tune-up)
**What it does:** Daily cron at 9am scans equipment aged 183+ days → sends tune-up reminder.

1. In Supabase, set a customer's equipment `installed_date` to 185 days ago:
   ```sql
   UPDATE crm.equipment
   SET installed_date = NOW() - INTERVAL '185 days'
   WHERE customer_id = 'demo-customer-010';
   ```
2. Trigger the scan manually via BullMQ (or wait for 9am cron)
3. **Expect:** SMS arrives at `+94719105181`: `Hi Nina, it's time for your annual HVAC tune-up!...`
4. **Pass:** Automation fired, idempotency key stored (won't fire again within 90 days)

### TEST-AU3 — Win-back automation
**What it does:** Daily cron at 10am — customers inactive > 180 days + churn score > 0.7 → 3-step SMS/email/SMS.

1. In Supabase, set demo-customer-011 (Marcus Lee) as INACTIVE with last booking > 180 days ago:
   ```sql
   UPDATE crm.customers
   SET engagement_status = 'INACTIVE'
   WHERE id = 'demo-customer-011';

   UPDATE crm.bookings
   SET scheduled_date = NOW() - INTERVAL '200 days'
   WHERE customer_id = 'demo-customer-011';
   ```
2. Trigger win-back scan or wait for 10am cron
3. **Expect:**
   - Step 1: SMS immediately to `+94719105181` — `Hi Marcus, we miss you!...`
   - Step 2: Email after 3 days to `pasinduravishan88@gmail.com`
   - Step 3: SMS after 7 days to `+94719105181`
4. **Pass:** All 3 steps fire in sequence (check SendJob table for 3 rows per customer)

---

## Section 9 — Unsubscribe / Suppression

### TEST-US1 — Unsubscribe via link
1. Receive any campaign email (TEST-C4)
2. Click the **Unsubscribe** link at the bottom
3. **Expect:** Browser shows `"You have been unsubscribed"` page
4. Launch another campaign targeting the same audience
5. **Expect:** No email arrives for the unsubscribed address
6. **Pass:** Suppression enforced

### TEST-US2 — Click tracking
1. Receive any campaign email/SMS with a `{{trackedLink}}`
2. Click the tracked link
3. **Expect:** Redirects to the correct destination URL
4. On Overview tab → Automation Activity → **Total Clicks** increments by 1
5. **Pass:** Click event recorded

---

## Quick-reference: What to look for in logs

```bash
# Watch comms-service logs
pnpm --filter comms-service dev

# Key log lines to confirm
[MarketingSendWorker] processing send job <id>
[MarketingSendWorker] globally disabled — skipping         ← TEST-S5
[MarketingSendWorker] frequency cap exceeded — skipping    ← TEST-F1
[MarketingSendWorker] suppressed — skipping                ← TEST-US1 / TEST-CP3
[ReviewRequestService] queued review-sms                   ← TEST-AU1
[WinbackProcessor] queued winback step-1 SMS               ← TEST-AU3
```

---

## Checklist before calling production-ready

- [ ] TEST-S1 through S5 pass (settings persist, global kill-switch works)
- [ ] TEST-T1 seed defaults — 6 templates, no duplicates
- [ ] TEST-T2 / T3 — custom SMS + email templates created
- [ ] TEST-A2 / A3 / A4 — audience filters return real counts
- [ ] TEST-C4 — email arrives at `pravishan88@gmail.com` with resolved merge tags
- [ ] TEST-C5 — SMS arrives at `+94719105181`
- [ ] TEST-O1 — KPI cards show numbers not NaN/undefined
- [ ] TEST-F1 — second message blocked by freq cap
- [ ] TEST-CP1 + CP2 — deletion works, audit log records it
- [ ] TEST-US1 — unsubscribe suppresses future messages
- [ ] TEST-US2 — click tracking increments Overview counter
