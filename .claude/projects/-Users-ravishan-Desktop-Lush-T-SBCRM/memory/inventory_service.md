---
name: Inventory Service Implementation
description: Complete inventory management service (port 3007) — stock tracking, movements, POs, alerts, availability check for scheduling integration
type: project
---

Inventory Management Service fully implemented on 2026-03-24.

**Service**: `apps/inventory-service/` — NestJS + PostgreSQL (`inventory` schema), port 3007
**Nginx route**: `/api/inventory/*` → `inventory_service:3007`

## Backend Modules
- **LocationsModule**: CRUD for stock locations (WAREHOUSE + VAN only). `ensureWarehouse()` + `ensureVan()` auto-create locations.
- **InventoryItemsModule**: CRUD for stock items, linked to price book via `priceBookItemId`. Auto-creates warehouse stock level on item creation.
- **StockOperationsModule**: Transactional intake/transfer/consume/adjust with full audit trail via `stock_movements` table.
- **PurchaseOrdersModule**: PO lifecycle (DRAFT → ORDERED → RECEIVED), auto-generates PO numbers. `receive()` calls `intake()` for each item.
- **AlertsModule**: `GET /alerts/low-stock` — items where warehouse qty < reorderPoint.
- **AvailabilityModule**: `GET /check-availability` — returns partsScore (1.0=van has it, 0.5=warehouse only, 0.0=out of stock) for scheduling integration.

## Database Tables (inventory schema)
`inventory_items`, `stock_locations`, `stock_levels`, `stock_movements`, `purchase_orders`

## Frontend
- **Admin Dashboard**: New "Inventory" page at `/inventory` with 4 tabs (Stock Items, Movements Log, Purchase Orders, Low Stock Alerts)
- **Hooks**: `apps/admin-dashboard/src/hooks/useInventory.ts` — full TanStack Query hooks for all endpoints
- **Types**: Added to `apps/admin-dashboard/src/types/api.ts` (InventoryItem, StockLocation, StockLevel, StockMovement, PurchaseOrder, LowStockAlert)
- **Modals**: AddInventoryItemModal, StockDetailModal, IntakeStockModal, TransferStockModal, CreatePurchaseOrderModal
- **Sidebar**: Package icon added to nav group 3 (Finance/Comms/Analytics/Inventory)

## Infrastructure Changes
- `.env`: Added `INVENTORY_DATABASE_URL` + `INVENTORY_PORT=3007`
- `nginx.conf`: Added upstream + location block
- `infrastructure/postgres/init.sql`: Added `inventory` schema creation

## Not Yet Done (Future Phases)
- Job-service BullMQ event → auto-consume on work order line item add
- Job template `required_parts[]` field
- Scheduling Go service integration (HTTP call to check-availability + parts_score in AI formula)
- Technician app van stock view
- Low-stock push notifications via comms-service

**Why:** Company needs to track parts/materials across warehouse and technician vans, know what's available before dispatching, and manage purchase orders.
**How to apply:** When working on dispatch/scheduling, consider parts availability. When adding work order line items, consider auto-deducting from inventory.
