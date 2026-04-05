# ⚙️ Member 5 — Operations, Logistics & Dashboard

**Module Tag**: `M5-OPS`  
**Priority**: 🔵 Medium-Low (can work on models/frontend early, full API after M4 verification)

---

## 📋 Scope Overview

This member owns the **back-office workflow** — Laboratory operations (lens cutting, frame mounting), Quality Control, Shipping/Logistics, and the Management Analytics Dashboard. This is the final stage of the order lifecycle.

---

## ✅ TODO Checklist

### Database (Migrations)
- [ ] Create `shipments` migration (id, order_id FK unique, carrier, tracking_code nullable, status enum, shipped_at nullable, delivered_at nullable, timestamps)
- [ ] Add `production_step` column to `orders` table (nullable enum: lens_cutting, frame_mounting, qc_inspection, packaging, ready_to_ship)
- [ ] Add `verified_by`, `verified_at` columns to `orders` table (for M4 integration)

### Backend — Models
- [ ] Complete `Shipment.php` — fillable, casts, relationships
- [ ] Add production step scopes to `Order.php` (scopeInProduction, scopeReadyToShip)

### Backend — Domain Layer
- [ ] Finalize `ShipmentStatus.php` enum
- [ ] Create `app/Domain/Orders/ProductionStep.php` enum (lens_cutting, frame_mounting, qc_inspection, packaging, ready_to_ship)

### Backend — Application Layer
- [ ] Implement `OperationsService.php`
  - Get production queue (verified orders → in production)
  - Advance production step (step-by-step workflow)
  - QC pass/fail logic (fail → re-enter production)
  - Create shipment with tracking code
  - Update shipment status (shipped, in_transit, delivered)
  - Restock pre-order items (update inventory, trigger M4 notifications)
- [ ] Implement `DashboardService.php`
  - Revenue stats by date range (total revenue, order count, average value)
  - Top selling products (by quantity or revenue)
  - Order statistics (completion rate, cancellation rate)
  - Low stock alerts (variants below threshold)
  - Recent activity feed (latest orders, tickets, shipments)

### Backend — Controllers & Routes
- [ ] Implement `OperationsController.php` (production queue, step advancement, QC, packaging, shipping)
- [ ] Implement `DashboardController.php` (revenue, top products, order stats, inventory alerts, activity)
- [ ] Create Form Requests: `StepRequest`, `QcFailRequest`, `ShipmentRequest`, `StatusRequest`, `DateRangeRequest`
- [ ] Create API Resources: `ProductionQueueResource`, `ShipmentResource`, `DashboardStatsResource`
- [ ] Define routes under `/api/v1/ops/*`, `/api/v1/dashboard/*`

### Frontend
- [ ] Implement `frontend/src/pages/ops/dashboard/index.html`
  - Production queue table with step progress (Lens Cutting, Mounting, QC)
  - Quality verification buttons (Pass/Fail)
  - Shipping integration (Create Shipment, Tracking Code)
- [ ] Implement `frontend/src/pages/admin/dashboard/index.html`
  - Manager Overview (KPIs: Revenue, Active Orders, Low Stock)
  - Top Selling Products table
  - Recent Activity monitor
- [ ] Implement `frontend/src/pages/admin/settings/index.html`
  - Personnel & Role management
  - Pricing & Combo rules configuration
  - System-wide policies
- [ ] Create components in `frontend/src/components/`
  - `Header.html`
  - `Footer.html`
  - `VirtualTryOn.html`

### Testing
- [ ] Verification tests for production steps
- [ ] Verification tests for shipment tracking
- [ ] Verification tests for Dashboard metrics

---

## 📁 Files Owned

### Backend
- `app/Models/Shipment.php`
- `app/Domain/Orders/ShipmentStatus.php`, `ProductionStep.php`
- `app/Application/Operations/OperationsService.php`
- `app/Application/Reports/DashboardService.php`
- `app/Http/Controllers/Api/V1/OperationsController.php`
- `app/Http/Controllers/Api/V1/DashboardController.php`
- `database/migrations/*_create_shipments_table.php`

### Frontend
- `frontend/src/pages/ops/dashboard/index.html`
- `frontend/src/pages/admin/dashboard/index.html`
- `frontend/src/pages/admin/settings/index.html`
- `frontend/src/components/VirtualTryOn.html`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (users), M2-CATALOG (products, inventory), M3-SHOPPING (orders), M4-SALES (verified orders)
- **Blocks**: Nothing (this is the final stage)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Models | 1 day |
| Operations/Lab API | 3 days |
| Shipping/Logistics API | 2 days |
| Dashboard/Reports API | 2 days |
| Frontend ops pages | 3 days |
| Frontend dashboard + charts | 3 days |
| Testing | 1 day |
| **Total** | **~15 days** |
