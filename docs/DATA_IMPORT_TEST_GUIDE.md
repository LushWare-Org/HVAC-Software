# Data Migration — Manual Testing Guide

All CSV test files are in `docs/import-test-data/`.
Start your services before testing:
```bash
pnpm --filter crm-service dev   # terminal 1
pnpm dev:admin                   # terminal 2
```
Open `http://localhost:5173/import`

---

## Overview of what's built

| Feature | Where |
|---|---|
| 6-step import wizard | `/import` |
| Import history + rollback | `/import` → scroll down |
| White-glove super-admin panel | `/import/admin` (super_admin only) |
| Settings quick-link | `/settings` → Profile tab → Data Import card |

---

## Test 1 — Generic CSV (clean, happy path)

**File:** `test-1-generic-customers-clean.csv`  
**What it tests:** 5 clean customers with all fields filled, auto-mapped as Generic platform.

### Steps
1. Go to `/import`
2. **Step 1 — Source:** Click **Generic / CSV**
3. **Step 2 — Upload:** Drag `test-1-generic-customers-clean.csv` onto the drop zone
4. The wizard auto-advances to **Step 3 — Map Columns**

### What you should see at Step 3
```
CSV Column    → Sample Data                  → Maps To
First Name       James                          First Name ✓
Last Name        Carter                         Last Name ✓
Email            james.carter@testmail.com      Email
Phone            +14085551001                   Phone
Address          12 Oak Street                  Address
City             San Jose                       City
State            CA                             State
Zip Code         95101                          Zip Code
Type             RESIDENTIAL                    Type
Notes            Regular maintenance...         Notes
```

5. Click **Next** → **Step 4 — Validate**

### What you should see at Step 4
```
✅ Will import: 5
⏭  Will skip: 0
❌ Will fail: 0
No errors
```

6. Click **Start Import**
7. Watch the live progress bar count up: `Imported: 5 | Skipped: 0 | Failed: 0`
8. **Step 6 — Done:** Click "View Customers" → confirm 5 new customers appear in `/customers`

✅ **Pass criteria:** 5 customers created, all with `importBatchId` set

---

## Test 2 — Jobber CSV (auto-detection)

**File:** `test-2-jobber-export.csv`  
**What it tests:** Jobber column names are auto-detected and pre-mapped. "Client Name" splits into First/Last name automatically.

### Steps
1. Click **Jobber** on Step 1
2. Upload `test-2-jobber-export.csv`
3. Step 3 — notice the mappings are **pre-filled**:
   ```
   Client Name    → Robert Nguyen    → First Name (auto-split)
   Client Name    → Robert Nguyen    → Last Name (auto-split)
   Client Email   → robert.n...      → Email
   Client Phone   → +14085552001     → Phone
   ```
4. Validate → should show **5 will import, 0 errors**
5. Import → verify 5 customers created with names split correctly
   - "Robert Nguyen" → firstName: "Robert", lastName: "Nguyen"
   - "Patricia Lee" → firstName: "Patricia", lastName: "Lee"

✅ **Pass criteria:** Names split correctly, all 5 imported

---

## Test 3 — HCP CSV (auto-detection)

**File:** `test-3-hcp-export.csv`  
**What it tests:** HCP-style headers (`Customer Name`, `Service Address`) auto-detected.

### Steps
1. Click **HCP (Home Care Pro)** on Step 1
2. Upload `test-3-hcp-export.csv`
3. Mapping pre-filled for HCP format:
   ```
   Customer Name  → Linda Patel    → First Name / Last Name (split)
   Customer Email →                → Email
   Service Address→                → Address
   ```
4. Validate → 5 will import
5. Import → verify

✅ **Pass criteria:** 5 HCP customers created, Customer Type mapped (Residential/Commercial)

---

## Test 4 — Equipment CSV (links to existing customers)

**File:** `test-4-equipment.csv`  
**What it tests:** Equipment rows link to customers by email. Must run **after Test 1** so james.carter@testmail.com etc. exist.

### Pre-condition
Test 1 must be completed so these emails exist:
- james.carter@testmail.com
- sophia.bennett@testmail.com
- marcus.williams@testmail.com
- david.kim@testmail.com

### Steps
1. Click **Equipment** on Step 1
2. Upload `test-4-equipment.csv`
3. Step 3 — mappings pre-filled:
   ```
   Customer Email → james.carter@testmail.com → Customer Email (link)
   Type           → Heat Pump                 → Equipment Type ✓
   Brand          → Lennox                    → Brand
   Model          → XP25-036                  → Model
   Serial Number  → LX-SN-10001               → Serial Number
   Install Date   → 2021-06-15                → Install Date
   Warranty End   → 2028-06-15                → Warranty End
   ```
4. Validate → **6 will import, 0 errors**
5. Import → verify

### Verify in app
Go to `/customers` → open James Carter → Equipment tab → should show **2 units** (Heat Pump + Air Handler)

✅ **Pass criteria:** 6 equipment records linked to correct customers

---

## Test 5 — Errors and Duplicates (validation flow)

**File:** `test-5-errors-and-duplicates.csv`  
**What it tests:** Missing required field → FAIL, duplicate email → SKIP, valid new row → IMPORT

### Pre-condition
Test 1 already ran so `james.carter@testmail.com` exists.

### Steps
1. Upload `test-5-errors-and-duplicates.csv` (Generic)
2. At Validate step you should see:

```
📊 Summary
Will import: 2
Will skip:   1
Will fail:   1

Errors (1)
─────────────────────────────────────────────
Row 2  │  firstName  │  Missing required field: firstName
```

3. The row with `james.carter@testmail.com` is skipped (already exists)
4. "Bad Data" (no email) will be imported (email not required)
5. "Emma Watson" (new email) will be imported
6. Click **Start Import**

### Verify result
- Step 6 shows: `Imported: 2 | Skipped: 1 | Failed: 1`
- Go to `/customers` → Emma Watson exists, Bad Data exists (no email)
- james.carter@testmail.com was NOT duplicated

✅ **Pass criteria:** Correct counts shown, no duplicate created

---

## Test 6 — Large Batch (30 customers, progress bar)

**File:** `test-6-large-batch.csv`  
**What it tests:** Live progress bar updates, chunked processing every 25 rows

### Steps
1. Upload `test-6-large-batch.csv` (Generic)
2. Validate → 30 will import, 0 errors
3. **Watch Step 5 (Progress)**:
   - Bar animates from 0% to 100%
   - Counter jumps in blocks of 25: `0 → 25 → 30`
   - Total time: ~2-3 seconds
4. Step 6: `Imported: 30`

✅ **Pass criteria:** Progress bar visible, final count 30

---

## Test 7 — Custom Column Mapping (manual override)

**What it tests:** You can re-map columns that weren't auto-detected correctly.

### Steps
1. Create a small CSV with unusual headers:
   ```
   Full Name,Contact Email,Mobile Number,Street
   John Test,john.test@mail.com,555-0101,99 Test Ave
   ```
2. Upload as Generic
3. At Step 3 — the mapping dropdowns will be blank (unknown headers)
4. Manually set:
   - Full Name → `First Name`
   - Full Name → `Last Name` (add a second row or use the same field)
   - Contact Email → `Email`
   - Mobile Number → `Mobile`
   - Street → `Address`
5. Proceed through validation and import

✅ **Pass criteria:** You can override any mapping, import still works

---

## Test 8 — Rollback (undo an import)

**What it tests:** After importing, rolling back deletes all records from that batch.

### Steps
1. Complete **Test 6** (30 customers imported)
2. Scroll to **Import History** on `/import`
3. The latest batch shows status **Done**, imported **30**
4. Click **Rollback** on that row
5. Confirm the popup: "Delete 30 records?"
6. History row changes to **Rolled Back** status

### Verify cleanup
Go to `/customers` — the 30 alice.adams001, bob.baker002 … customers are **gone**

✅ **Pass criteria:** Exactly 30 records deleted, import history shows ROLLED_BACK

---

## Test 9 — White-Glove Admin Panel (super_admin only)

**URL:** `http://localhost:5173/import/admin`

### What to verify
1. Log in as a super_admin user
2. Navigate to `/import/admin` (also accessible via the "White-Glove Panel" button on `/import`)
3. **Stats row** at the top shows:
   - Total Batches: count of all imports across all companies
   - Records Imported: sum total
   - Records Skipped: sum total
   - Records Failed: sum total
4. **Company filter** dropdown shows only companies that have run imports
5. **Batch table** shows all imports with: Company name, Source (Jobber/HCP/Generic/Equipment), Status badge, row counts, date, who ran it
6. Filter by a specific company → table filters
7. Click **Rollback** on a DONE batch → confirmation modal shows company name and count → confirm → status changes to Rolled Back

### Verify access control
Log in as company_admin or office_manager and try to navigate to `/import/admin` directly — the page shows "Super Admin access required"

✅ **Pass criteria:** Cross-company data visible, rollback works, non-super-admin blocked

---

## Test 10 — Equipment Template Download

**What it tests:** The equipment template CSV download from the wizard

### Steps
1. Go to `/import`
2. Click **Equipment** on Step 1
3. Click "Download Equipment Template" link (below the platform cards)
4. A file `equipment-template.csv` downloads with these headers:
   ```
   Customer Email,Type,Brand,Model,Serial Number,Install Date,Warranty End,Notes
   ```
5. Fill in real customer emails (from your CRM) and upload to test

✅ **Pass criteria:** Template downloads, correct headers, usable for real import

---

## Cleanup Guide (reset between tests)

### Remove specific test customers
After testing, remove the test data via rollback (preferred) or run this in Supabase SQL Editor:

```sql
-- See all import batches
SELECT id, source, status, imported, "createdAt"
FROM crm.import_batches
ORDER BY "createdAt" DESC;

-- Rollback a specific batch (replace <batch-id>)
DELETE FROM crm.equipment WHERE "importBatchId" = '<batch-id>';
DELETE FROM crm.customers WHERE "importBatchId" = '<batch-id>';
UPDATE crm.import_batches SET status = 'ROLLED_BACK' WHERE id = '<batch-id>';

-- Or nuke all test data (emails ending in @testmail.com)
DELETE FROM crm.customers WHERE email LIKE '%@testmail.com';
```

### Reset everything for a clean re-run
```sql
-- Delete all import batches and their errors (cascades to import_errors)
DELETE FROM crm.import_errors WHERE "batchId" IN (
  SELECT id FROM crm.import_batches WHERE "createdBy" LIKE '%your-email%'
);
DELETE FROM crm.import_batches WHERE "createdBy" LIKE '%your-email%';

-- Delete all customers created via import
DELETE FROM crm.customers WHERE "importBatchId" IS NOT NULL;
DELETE FROM crm.equipment WHERE "importBatchId" IS NOT NULL;
```

---

## Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| "No file uploaded" error | File not attached | Make sure you drop the file onto the upload zone, not outside it |
| Validation says all rows fail with "Missing firstName" | Wrong platform selected | Go back, pick the right platform (Jobber/HCP have different column names) |
| Equipment all fail with "No customer found" | Customer emails don't exist | Import customers first, then equipment |
| Duplicate email rows show as SKIP not FAIL | Correct behavior | SKIP means "already exists, won't duplicate" |
| `/import/admin` shows "Super Admin access required" | Not logged in as super_admin | Use a super_admin account |
