# Inventory Seed Data — Preview for Approval
> Today: 2026-04-29 | Do NOT run yet — awaiting approval.

---

## Current State (what's already in the DB)

| Table | Count |
|---|---|
| inventory_items | 1 (Air Filter 16x20 — FILT-001) |
| stock_locations | 7 (1 warehouse + 6 vans) |
| stock_levels | 4 (Air Filter spread across warehouse + 3 vans) |
| stock_movements | 6 (INTAKE × 2, TRANSFER × 3, RETURN × 1) |

**Existing vans available for stock distribution:**
| Van | Technician |
|---|---|
| Van — newtech | newtech |
| Van — testinnnnn | testinnnnn |
| Van — test | test |
| Van — Movindu Tech | Movindu Tech |
| Van — hello | hello |
| Van — Menusha | Menusha |

---

## Items to Add — 15 new inventory items

Split across 3 trade categories matching your job types: **HVAC · Plumbing · Electrical**

---

### 🔵 HVAC — 5 items

| SKU | Name | Category | Unit | Reorder Point | Reorder Qty |
|---|---|---|---|---|---|
| `HVAC-001` | R-410A Refrigerant Gas 1kg | `PART` | each | 2 | 10 |
| `HVAC-002` | AC Start Capacitor 35/5 MFD | `PART` | each | 3 | 15 |
| `HVAC-003` | AC Coil Cleaner Foam 500ml | `CONSUMABLE` | each | 5 | 24 |
| `HVAC-004` | AC Insulation Tape 19mm×10m | `CONSUMABLE` | roll | 10 | 30 |
| `HVAC-005` | Condensate Drain Pan 24" | `PART` | each | 2 | 8 |

**Descriptions:**
- **R-410A Refrigerant Gas 1kg** — Standard refrigerant for inverter split AC systems. Used during installation, top-up, and gas recharge jobs.
- **AC Start Capacitor 35/5 MFD** — Dual run capacitor for compressor and fan motor. Common failure part replaced during AC repair call-outs.
- **AC Coil Cleaner Foam 500ml** — No-rinse foaming coil cleaner for evaporator and condenser coil deep clean. Used in every AC service job.
- **AC Insulation Tape 19mm×10m** — Self-amalgamating insulation tape for refrigerant pipe lagging and joint sealing.
- **Condensate Drain Pan 24"** — Replacement drain pan for wall-mount split units. Stocked for installation and repair jobs.

---

### 🟡 Plumbing — 5 items

| SKU | Name | Category | Unit | Reorder Point | Reorder Qty |
|---|---|---|---|---|---|
| `PLMB-001` | PVC Ball Valve 1/2" | `PART` | each | 5 | 25 |
| `PLMB-002` | Flexible Braided Hose 30cm | `PART` | each | 5 | 20 |
| `PLMB-003` | PTFE Thread Seal Tape | `CONSUMABLE` | roll | 20 | 60 |
| `PLMB-004` | PVC Solvent Cement 500ml | `MATERIAL` | tin | 3 | 12 |
| `PLMB-005` | Tap Washer Set (Assorted 20pc) | `PART` | set | 3 | 10 |

**Descriptions:**
- **PVC Ball Valve 1/2"** — Quarter-turn isolation valve for water supply lines. Used in plumbing repairs and bathroom renovations.
- **Flexible Braided Hose 30cm** — Stainless steel braided flexible connector for tap/WC cistern supply. Standard fitting on every sink and toilet job.
- **PTFE Thread Seal Tape** — Polytetrafluoroethylene thread sealant tape. Consumable used on every threaded pipe joint.
- **PVC Solvent Cement 500ml** — Solvent cement for UPVC/CPVC pipe bonding. Used in pipe replacement and drain rerouting jobs.
- **Tap Washer Set (Assorted 20pc)** — Assorted rubber washers for tap repair. Used in leak and drip repair call-outs.

---

### 🟢 Electrical — 5 items

| SKU | Name | Category | Unit | Reorder Point | Reorder Qty |
|---|---|---|---|---|---|
| `ELEC-001` | MCB 16A Single Pole | `PART` | each | 5 | 20 |
| `ELEC-002` | MCB 32A Double Pole | `PART` | each | 3 | 12 |
| `ELEC-003` | RCD 30mA Double Pole | `PART` | each | 2 | 8 |
| `ELEC-004` | Electrical Cable 2.5mm² (per metre) | `MATERIAL` | metre | 50 | 200 |
| `ELEC-005` | Duplex Power Socket Outlet | `PART` | each | 5 | 20 |

**Descriptions:**
- **MCB 16A Single Pole** — Miniature circuit breaker for lighting and small appliance circuits. Used in DB upgrades and fault rectification.
- **MCB 32A Double Pole** — Double pole MCB for stove/oven and heavy appliance circuits. Used in distribution board upgrades.
- **RCD 30mA Double Pole** — Residual current device for earth leakage protection. Mandatory fitting in all new DB installations.
- **Electrical Cable 2.5mm² (per metre)** — Twin & earth PVC insulated cable for general power circuits. Sold and consumed per metre.
- **Duplex Power Socket Outlet** — Standard double-gang socket outlet. Used in electrical installation and socket replacement jobs.

---

## Stock Levels to Set

Initial stock placed in **Main Warehouse** + selective transfers to **2 active vans** (newtech, testinnnnn) to reflect realistic pre-loaded van stock.

| Item | Main Warehouse | Van — newtech | Van — testinnnnn |
|---|---|---|---|
| R-410A Refrigerant Gas 1kg | **10** | **2** | — |
| AC Start Capacitor 35/5 MFD | **15** | **2** | — |
| AC Coil Cleaner Foam 500ml | **24** | **3** | — |
| AC Insulation Tape 19mm×10m | **30** | **2** | — |
| Condensate Drain Pan 24" | **8** | — | — |
| PVC Ball Valve 1/2" | **25** | — | **4** |
| Flexible Braided Hose 30cm | **20** | — | **3** |
| PTFE Thread Seal Tape | **60** | — | **5** |
| PVC Solvent Cement 500ml | **12** | — | — |
| Tap Washer Set (Assorted 20pc) | **10** | — | **2** |
| MCB 16A Single Pole | **20** | — | — |
| MCB 32A Double Pole | **12** | — | — |
| RCD 30mA Double Pole | **8** | — | — |
| Electrical Cable 2.5mm² (per metre) | **200** | — | — |
| Duplex Power Socket Outlet | **20** | — | — |

---

## Stock Movements to Create

One **INTAKE** per item (initial stock received from supplier → warehouse).
One **TRANSFER** per van line above (warehouse → van, performed by admin).

| Type | Item | From | To | Qty | Notes |
|---|---|---|---|---|---|
| INTAKE | R-410A Refrigerant Gas 1kg | — | Warehouse | 10 | Initial stock receipt |
| INTAKE | AC Start Capacitor 35/5 MFD | — | Warehouse | 15 | Initial stock receipt |
| INTAKE | AC Coil Cleaner Foam 500ml | — | Warehouse | 24 | Initial stock receipt |
| INTAKE | AC Insulation Tape 19mm×10m | — | Warehouse | 30 | Initial stock receipt |
| INTAKE | Condensate Drain Pan 24" | — | Warehouse | 8 | Initial stock receipt |
| INTAKE | PVC Ball Valve 1/2" | — | Warehouse | 25 | Initial stock receipt |
| INTAKE | Flexible Braided Hose 30cm | — | Warehouse | 20 | Initial stock receipt |
| INTAKE | PTFE Thread Seal Tape | — | Warehouse | 60 | Initial stock receipt |
| INTAKE | PVC Solvent Cement 500ml | — | Warehouse | 12 | Initial stock receipt |
| INTAKE | Tap Washer Set (Assorted 20pc) | — | Warehouse | 10 | Initial stock receipt |
| INTAKE | MCB 16A Single Pole | — | Warehouse | 20 | Initial stock receipt |
| INTAKE | MCB 32A Double Pole | — | Warehouse | 12 | Initial stock receipt |
| INTAKE | RCD 30mA Double Pole | — | Warehouse | 8 | Initial stock receipt |
| INTAKE | Electrical Cable 2.5mm² | — | Warehouse | 200 | Initial stock receipt |
| INTAKE | Duplex Power Socket Outlet | — | Warehouse | 20 | Initial stock receipt |
| TRANSFER | R-410A Refrigerant Gas 1kg | Warehouse | Van — newtech | 2 | Van stock load |
| TRANSFER | AC Start Capacitor 35/5 MFD | Warehouse | Van — newtech | 2 | Van stock load |
| TRANSFER | AC Coil Cleaner Foam 500ml | Warehouse | Van — newtech | 3 | Van stock load |
| TRANSFER | AC Insulation Tape 19mm×10m | Warehouse | Van — newtech | 2 | Van stock load |
| TRANSFER | PVC Ball Valve 1/2" | Warehouse | Van — testinnnnn | 4 | Van stock load |
| TRANSFER | Flexible Braided Hose 30cm | Warehouse | Van — testinnnnn | 3 | Van stock load |
| TRANSFER | PTFE Thread Seal Tape | Warehouse | Van — testinnnnn | 5 | Van stock load |
| TRANSFER | Tap Washer Set (Assorted 20pc) | Warehouse | Van — testinnnnn | 2 | Van stock load |

**Total: 15 new items · 22 stock level rows · 23 movement records**

---

> ✅ Reply **"go ahead"** to insert everything.
> ✏️ Or adjust anything — items, quantities, van assignments.
