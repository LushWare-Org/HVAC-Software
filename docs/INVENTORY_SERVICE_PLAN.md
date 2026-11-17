# Inventory Management Service — Analysis & Plan

## Why Inventory Management?

Right now the system tracks **what parts were used** (work order line items) and **what they cost** (price book), but has **zero visibility** into:

- How many parts are actually **in stock**
- Whether a technician **can complete a job** with available parts
- When to **reorder** before running out

A technician gets dispatched to an HVAC repair, arrives on site, and discovers the compressor capacitor isn't in their van. Wasted trip. Unhappy customer. This is the core problem.

---

## Where Stock Lives (Simple — 2 Locations Only)

Equipment and parts exist in exactly **two places**:

1. **Company Warehouse** — the main storage. One per company.
2. **Technician Van** — each active technician has their own van stock.

That's it. No bins, no shelves, no sub-locations. Stock moves from warehouse → van before a job, and gets consumed from the van during the job.

Since the scheduling service already tracks **real-time GPS for every technician van**, we know exactly where each van (and its stock) is at all times — visible on the dispatch map.

---

## What Already Exists (Foundation)

| Component | What It Does | What's Missing |
|-----------|-------------|----------------|
| **Price Book** (job-service) | Catalog of parts/materials with codes, prices, categories | No stock quantities |
| **Work Order Line Items** | Records parts/labour used per job | Doesn't deduct from any inventory |
| **Equipment** (crm-service) | Tracks customer-owned equipment (boilers, AC units) | This is customer assets, not company stock |
| **GPS Tracking** (scheduling-service) | Real-time technician van location via WebSocket | Already works — shows van location on dispatch map |
| **Expenses** (finance-service) | Logs purchase costs for parts, tools, fuel | No link to stock intake |

The Price Book is the natural anchor — it already has part codes, categories, and prices. Inventory adds **quantity tracking on top of it**.

---

## Proposed Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  job-service  │────▶│  inventory   │◀────│  scheduling  │
│ (price book,  │     │   service    │     │  (tech GPS,  │
│  work orders) │     │  Port 3007   │     │   dispatch)  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
          ┌──────────┐         ┌──────────────┐
          │Warehouse  │         │ Technician   │
          │  Stock    │         │  Van Stock   │
          │(1 per co.)│         │(1 per tech)  │
          └──────────┘         └──────────────┘
```

**Stack**: NestJS + PostgreSQL (`inventory` schema) — same pattern as other NestJS services.
**Port**: 3007
**Nginx route**: `/api/inventory/*` → `inventory_service:3007`

---

## Core Data Model

### `inventory_items` — The catalog of stockable parts

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID PK | |
| company_id | String | Multi-tenant |
| price_book_item_id | String? | Links to existing price book entry |
| sku | String | Internal stock code |
| name | String | "Capacitor 45/5 MFD" |
| category | Enum | PART, MATERIAL, TOOL, CONSUMABLE |
| unit | String | each, ft, gallon, box |
| reorder_point | Int | Alert when warehouse stock drops below this |
| reorder_qty | Int | Suggested quantity when reordering |

### `stock_locations` — Warehouse or van

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID PK | |
| company_id | String | |
| type | Enum | **WAREHOUSE** or **VAN** |
| name | String | "Main Warehouse" or "Van — Alex Chen" |
| technician_id | String? | Populated when type = VAN |

One warehouse per company is auto-created on company setup. One van location per technician is auto-created when a technician is added to the scheduling service.

### `stock_levels` — How much of each item is at each location

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID PK | |
| inventory_item_id | UUID FK | |
| location_id | UUID FK | Warehouse or van |
| quantity | Decimal | Actual count on hand |
| reserved_qty | Decimal | Reserved for scheduled jobs not yet started |
| **available** | **computed** | **quantity − reserved_qty** |

### `stock_movements` — Every change, fully audited

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID PK | |
| inventory_item_id | UUID FK | |
| from_location_id | UUID? | null = coming from outside (purchase intake) |
| to_location_id | UUID? | null = consumed on job |
| quantity | Decimal | How much moved |
| movement_type | Enum | INTAKE, TRANSFER, CONSUME, ADJUST, RETURN |
| reference_id | String? | work_order_id or purchase_order_id |
| performed_by | String | User who did it |
| created_at | DateTime | |

### `purchase_orders` — Restock tracking

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID PK | |
| company_id | String | |
| po_number | String | "PO-2026-0042" |
| supplier_name | String | |
| status | Enum | DRAFT, ORDERED, PARTIAL, RECEIVED, CANCELLED |
| items | JSON[] | [{inventory_item_id, qty, unit_cost}] |
| total_cost | Decimal | |
| ordered_at | DateTime? | |
| received_at | DateTime? | |

---

## Key Features

### 1. Stock Tracking Across 2 Locations

Every part has a row in `stock_levels` for the warehouse and for each technician van. Quantities update via `stock_movements`. The full audit trail means you can always see who moved what, when, and why.

### 2. Auto-Deduction on Job Completion

When a technician adds a line item to a work order (`POST /jobs/work-orders/:id/line-items`), the inventory service:
1. Receives an event from job-service via BullMQ
2. Creates a `CONSUME` movement
3. Decrements stock from that technician's van location
4. If the item links to a `price_book_item_id`, the mapping is automatic

If the tech's van hits zero on an item mid-job, a low-stock alert fires immediately.

### 3. Parts Reservation for Scheduled Jobs

When a job is scheduled with required parts defined in the job template:
1. Inventory service **reserves** those quantities (`reserved_qty++`) in the assigned tech's van
2. `available = quantity - reserved_qty` drops immediately
3. Other job assignments can see the real available count

This prevents double-booking the same part for two jobs.

### 4. Scheduling Integration — Parts Score

Current AI score: `distance × 0.40 + workload × 0.35 + rating × 0.25`

**New formula**: `distance × 0.30 + workload × 0.25 + rating × 0.20 + parts_availability × 0.25`

`parts_availability` score:
- **1.0** — tech's van has all required parts → assign immediately
- **0.5** — only warehouse has them (tech needs to pick up first, adds travel time)
- **0.0** — out of stock company-wide → flag job as "Parts Pending"

The dispatcher sees this score breakdown just like the current distance/workload/rating bars in the Suggestions Panel.

### 5. Van Location + Inventory on the Dispatch Map

Since technician GPS is already real-time on the dispatch map, clicking a technician marker will show:
- Current location (already works)
- **Van inventory summary**: "12 items · 3 low stock"
- Quick link to full van stock list

This tells dispatchers immediately whether the tech heading to a job has the right parts.

### 6. Low-Stock Alerts

- Any `stock_levels.quantity` dropping below `inventory_items.reorder_point` → trigger
- BullMQ event → comms-service → push notification + email to office managers
- Dashboard shows a "Low Stock" badge on the Inventory nav item

### 7. Van Restocking Workflow

1. Office manager creates a **WAREHOUSE → VAN transfer** for a specific tech
2. Technician sees a "Pending Transfer" notification in the mobile app
3. Technician confirms receipt → `TRANSFER` movement recorded, both locations update
4. Dispatcher can see the van's updated stock immediately on the map popup

### 8. Purchase Orders

- System suggests a PO draft when warehouse stock hits reorder point
- Manager reviews and sends to supplier
- On goods receipt: `INTAKE` movement created (null → warehouse)
- Auto-creates an expense record in finance-service for cost tracking

---

## API Endpoints

```
# Stock items catalog
GET    /inventory/items                      — List items (search, category filter)
POST   /inventory/items                      — Create item (links to price book)
PATCH  /inventory/items/:id                  — Update item
GET    /inventory/items/:id/stock            — Stock levels at warehouse + all vans

# Location stock (warehouse or van)
GET    /inventory/locations                  — List warehouse + van locations
GET    /inventory/locations/:id/stock        — All items at this location

# Stock operations
POST   /inventory/movements/intake           — Receive stock into warehouse
POST   /inventory/movements/transfer         — Move warehouse → van (or back)
POST   /inventory/movements/adjust           — Manual count correction
GET    /inventory/movements                  — Full audit trail (filterable)

# Scheduling integration
GET    /inventory/check-availability         — ?items=[...] &techId=X → parts score

# Purchase orders
GET    /inventory/purchase-orders
POST   /inventory/purchase-orders
PATCH  /inventory/purchase-orders/:id/status
POST   /inventory/purchase-orders/:id/receive — Marks received + creates intake

# Alerts
GET    /inventory/alerts/low-stock           — Items below reorder point
```

---

## Integration Points

| Service | What Changes | How |
|---------|-------------|-----|
| **job-service** | Emit BullMQ event on line item add/remove | `work_order.line_item_added` event |
| **job-service** | Job templates get `required_parts[]` field | New column, optional |
| **scheduling-service** | Call inventory before scoring technician | `GET /inventory/check-availability` |
| **scheduling-service** | Add `parts_score` (25%) to AI formula | Update Go scoring function |
| **finance-service** | Auto-create expense on PO received | BullMQ: `inventory.po_received` |
| **comms-service** | Send low-stock alerts | BullMQ: `inventory.low_stock` |
| **admin-dashboard** | New Inventory page + van stock on dispatch map | New page + map popup update |
| **technician-app** | Van stock view + transfer confirm | New "Parts" tab in job detail |
| **nginx** | Add `/api/inventory` proxy block | 3 lines |
| **docker-compose** | Add inventory-service container | Copy existing NestJS service block |

---

## Implementation Phases

### Phase 1 — Core Stock Tracking (1 week)
- NestJS service scaffolded, PostgreSQL `inventory` schema
- 4 tables: `inventory_items`, `stock_locations`, `stock_levels`, `stock_movements`
- CRUD for items, intake/transfer/adjust operations
- Auto-create warehouse location on company setup
- Auto-create van location when technician added
- Admin dashboard Inventory page (stock table, movements log)

### Phase 2 — Job Integration (3-4 days)
- BullMQ consumer: auto-deduct from van on line item add
- Link price book items to inventory items
- Job templates: `required_parts[]` field
- Parts reservation on job scheduling
- "Parts Pending" flag on jobs missing required stock

### Phase 3 — Scheduling + Map (3-4 days)
- `GET /inventory/check-availability` endpoint
- Parts score added to Go scheduling AI (25% weight)
- Dispatch map popup shows van inventory summary
- Dispatcher sees "Tech has all parts" / "Tech missing 2 parts" inline

### Phase 4 — Purchase Orders + Alerts (3-4 days)
- Full PO workflow
- Low-stock alerts via comms-service
- Expense auto-creation on PO receipt
- Reorder suggestions on dashboard

---

## What Stays the Same

- Price Book: unchanged — inventory items *link to* price book, not replace it
- Work Order Line Items: unchanged — inventory deduction is a side-effect via event
- Customer Equipment (crm-service): unchanged — that's assets the customer owns, completely separate from company stock
- GPS / Technician Location: already works — inventory just reads it for the map popup

---

## Summary

Two stock locations. Warehouse holds the bulk. Vans hold what techs need for their jobs. Every movement is tracked. The dispatch map already shows where every van is — now it'll also show what's in it. The scheduling AI already knows distance, workload, and rating — now it'll also know if the tech has the right parts before assigning.
