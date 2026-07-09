# Frontend Flow Testing Guide

> **Prerequisites**: Run `docker compose up -d` → then `pnpm dev` in project root → then `cd apps/admin-dashboard && npm run dev` → Open http://localhost:5173

---

## Flow 01 — Lead to Customer

**Navigate to**: Sidebar → **Customers** page → **Leads** tab

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click **"+ Add Lead"** button | Add Lead modal opens |
| 2 | Fill in: First Name, Last Name, Email, Phone, Source (e.g. "Google"), Service Interest | Form fields are editable |
| 3 | Click **"Create Lead"** | Modal closes, new lead appears in Leads table with status **NEW** |
| 4 | Click on the new lead row | Lead Detail Sidebar opens on right |
| 5 | Click **Edit** button (top-right) | Fields become editable |
| 6 | Change the **Status** dropdown from "New" → "Contacted" | Dropdown updates |
| 7 | Click **Save** | API call fires (PATCH /crm/leads/:id), sidebar exits edit mode |
| 8 | Close sidebar, verify the lead's status shows "Contacted" in the table | Status badge updates |
| 9 | Open lead again → Edit → set status to **"Won"** → Save | Lead status updates to WON |
| 10 | Go to **Customers** tab → check if a new customer appeared | When a lead is marked WON, the backend auto-creates a customer |

**API endpoints exercised**: `POST /crm/leads`, `PATCH /crm/leads/:id`, `GET /crm/customers`

---

## Flow 02 — Full Job Lifecycle

**Navigate to**: Sidebar → **Jobs** page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click **"+ Create Job"** button | Add Job modal opens |
| 2 | Fill in: Title, Customer (select from dropdown), Job Type, Priority, Description | All fields work |
| 3 | Click **"Create Job"** | Modal closes, new job appears in Jobs table with status **PENDING** |
| 4 | Click on the new job row | Job Detail modal opens |
| 5 | Click **"Schedule"** quick-action button | Job status changes to **SCHEDULED** |
| 6 | Click **"Start Work"** button | Status changes to **IN_PROGRESS** |
| 7 | Click **"Complete"** button | Status changes to **COMPLETED** |
| 8 | Click **"Mark Invoiced"** button | Status changes to **INVOICED** |

**API endpoints exercised**: `POST /jobs/jobs`, `PATCH /jobs/jobs/:id` (status transitions), `GET /jobs/jobs`

---

## Flow 03 — Quote to Payment

**Navigate to**: Sidebar → **Finance** page → **Quotes** tab

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click **"+ Create Quote"** | Add Quote modal opens |
| 2 | Fill in: Title, Customer Name (required), Customer Email (required), optionally link a Job ID | Fields editable |
| 3 | Add line items: click "Add Line Item", fill description, category, qty, unit price | Line items appear, subtotal/tax/total update in real-time |
| 4 | Click **"Create Quote"** | Modal closes, quote appears in Quotes table with status **DRAFT** |
| 5 | Click on the quote row | Quote Detail modal opens |
| 6 | Click **"Send Quote"** button (only visible when DRAFT) | Quote status changes to **SENT** |
| 7 | Click **"Approve"** button (only visible when SENT) | Quote status changes to **ACCEPTED** |
| 8 | Click **"Convert to Invoice"** button (only visible when ACCEPTED) | Quote becomes **CONVERTED**, a new invoice is auto-created |
| 9 | Switch to **Invoices** tab | New invoice appears with status **DRAFT** |
| 10 | Click on the new invoice row | Invoice Detail modal opens |
| 11 | Click **"Send Invoice"** | Invoice status → **SENT** |
| 12 | Click **"Record Payment"** tab → enter amount, method → click Record | Payment recorded, status changes to **PAID** (or PARTIALLY_PAID if partial) |

**API endpoints exercised**: `POST /finance/quotes`, `PATCH /finance/quotes/:id/send`, `POST /finance/quotes/:id/approve`, `POST /finance/quotes/:id/convert`, `PATCH /finance/invoices/:id/send`, `POST /finance/invoices/:id/payments`

---

## Flow 04 — Technician Dispatch

**Navigate to**: Sidebar → **Scheduling** page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click **"+ Add Schedule"** | Add Schedule modal opens |
| 2 | Select a Job from dropdown, select a Technician, choose date/time | Fields populate |
| 3 | Click **"Create Schedule"** | Modal closes, new dispatch assignment appears in the table |
| 4 | Click on the assignment row | Scheduling Detail modal opens showing assignment details |
| 5 | Check the Technicians tab | Lists registered technicians with their skills and availability |
| 6 | Add a new technician via **"+ Add Person"** | Technician created in the Go scheduling service |

**API endpoints exercised**: `POST /scheduling/dispatch/assign`, `GET /scheduling/dispatch/assignments/job/:jobId`, `POST /scheduling/technicians`, `GET /scheduling/technicians`

---

## Flow 05 — Automation Rules

> **Note**: Automation rules are backend-only. The frontend doesn't have a dedicated automation rules UI yet. These rules fire automatically when certain conditions are met (e.g., auto-send email when lead status changes).

**How to verify**: Create/update leads or jobs and check the **Communications** page for auto-generated notifications or messages.

---

## Flow 06 — Two-Way Messaging

**Navigate to**: Sidebar → **Communications** page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View the **Messages** tab | Existing messaging threads load from API |
| 2 | Click **"+ New Thread"** | New Thread form/modal opens |
| 3 | Fill in subject, select channel (EMAIL/SMS/WHATSAPP), add participant | Fields editable |
| 4 | Click **"Create Thread"** | Thread is created, appears in thread list |
| 5 | Click on a thread | Thread detail view opens showing messages |
| 6 | Type a message in the reply box → Send | New message appears in thread (POST /comms/messaging/threads/:id/messages) |
| 7 | Check **Notifications** tab | Shows notification entries |

**API endpoints exercised**: `POST /comms/messaging/threads`, `GET /comms/messaging/threads`, `POST /comms/messaging/threads/:id/messages`, `GET /comms/notifications`

---

## Flow 07 — Customer Portal

> **Note**: The customer portal is a separate frontend app. The admin dashboard manages customers/leads that can later access the portal. Testing customer portal features is done through the portal app, not the admin dashboard.

**Admin dashboard contribution**: Creating customers (Flow 01), creating bookings (Flow 08), and managing jobs that customers can view.

---

## Flow 08 — Service Agreements (Bookings)

**Navigate to**: Sidebar → **Customers** page → open a customer → **Agreements** tab

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to Customers page, click on a customer row | Customer detail sidebar opens |
| 2 | Navigate to the **Agreements** tab | Lists existing agreements/bookings for that customer |
| 3 | Click **"+ Add Agreement"** button | Add Booking modal opens |
| 4 | Select Service Type (Maintenance, Repair, etc.) | Dropdown works |
| 5 | Fill in Preferred Date, optional Alternate Date, Description, Notes | Fields editable |
| 6 | Click **"Create Booking"** | Booking created via API (POST /crm/bookings), modal closes |
| 7 | New booking appears in the Agreements list | Table refreshes with new entry |

**API endpoints exercised**: `POST /crm/bookings`, `GET /crm/bookings`

---

## Flow 09 — Analytics & Reporting

**Navigate to**: Sidebar → **Analytics** page (or **Dashboard**)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open the **Dashboard** page | KPI cards load with real data from /analytics/dashboard/kpis |
| 2 | Check revenue, active jobs, upcoming appointments, outstanding invoices | Numbers reflect actual database data |
| 3 | Navigate to **Analytics** page | Charts and analytics visualizations load |
| 4 | Check the **Finance** page KPI cards at the top | Revenue and Accounts Receivable show real values |

**API endpoints exercised**: `GET /analytics/dashboard/kpis`, `GET /analytics/dashboard/recent-activity`

---

## Flow 10 — Full E2E Showcase

This flow combines all the above flows in sequence:

| Step | Flow | Action |
|------|------|--------|
| 1 | **Lead → Customer** | Create a lead → progress through statuses → mark as WON → verify customer created |
| 2 | **Create Job** | Go to Jobs → Create a job linked to the new customer |
| 3 | **Quote & Invoice** | Go to Finance → Create a quote for the job → Send → Approve → Convert to invoice |
| 4 | **Dispatch** | Go to Scheduling → Assign a technician to the job |
| 5 | **Job Lifecycle** | Go back to Jobs → progress the job: Schedule → Start → Complete |
| 6 | **Payment** | Go to Finance → Invoices → Send the invoice → Record payment |
| 7 | **Communication** | Go to Communications → Create a thread for the customer → Send a message |
| 8 | **Booking** | Go to Customers → Open the customer → Add a new service booking |
| 9 | **Verify Analytics** | Go to Dashboard → Confirm KPIs reflect all the activity |

---

## Quick Reference: Page Navigation

| Sidebar Item | Page | Key Features |
|---|---|---|
| Dashboard | `/` | KPI cards, recent activity, upcoming appointments |
| Customers | `/customers` | Customers tab + Leads tab, detail sidebars, add lead/customer |
| Jobs | `/jobs` | Job list, create job, job detail with status transitions |
| Finance | `/finance` | Invoices/Quotes/Expenses tabs, create quote/invoice, detail modals |
| Scheduling | `/scheduling` | Dispatch assignments, technician management |
| Communications | `/communications` | Messaging threads, notifications, templates |
| Analytics | `/analytics` | Charts and reporting |
| Settings | `/settings` | App configuration |

---

## Troubleshooting

- **Empty tables / "No data found"**: Make sure backend services are running (`docker compose up -d` then `pnpm dev`). Check browser DevTools → Network tab for API errors.
- **401/403 errors**: The dev mode auth bypass headers should be injected automatically. Check `src/lib/api.ts` has the interceptor.
- **CORS errors**: Ensure requests go through the Vite proxy (`/api` → nginx). Check `vite.config.ts` proxy settings.
- **Decimal display issues**: Finance amounts come as strings from Prisma. The `decimalToNumber()` helper handles conversion.
