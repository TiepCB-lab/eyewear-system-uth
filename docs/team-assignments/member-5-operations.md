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
- [ ] Implement `OperationsDashboardPage.tsx`
  - Production queue table with step progress indicator
  - Step advancement buttons per order
  - QC pass/fail with fail reason input
  - Packaging confirmation
  - Shipping: create shipment form (carrier, tracking code)
  - Shipment status update dropdown
- [ ] Implement `AdminDashboardPage.tsx`
  - Revenue line/bar chart (use a chart library like Chart.js or Recharts)
  - Top products horizontal bar chart
  - Order success/cancel pie chart
  - Low stock alert cards with quick-restock action
  - Recent activity timeline
- [ ] Create chart components in `src/components/charts/`
  - `RevenueChart.tsx`
  - `TopProductsChart.tsx`
  - `OrderStatsChart.tsx`
- [ ] Create `operationsService.ts`, `dashboardService.ts` in `src/services/`
- [ ] Create `AdminLayout.tsx` in `src/layouts/` (sidebar for admin/staff navigation)

### Testing
- [ ] Feature tests for production step advancement
- [ ] Feature tests for QC pass/fail workflow
- [ ] Feature tests for shipment creation & status tracking
- [ ] Feature tests for dashboard statistics APIs
- [ ] Feature tests for low stock alerts

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
- `src/pages/operations/OperationsDashboardPage.tsx`
- `src/pages/admin/AdminDashboardPage.tsx`
- `src/components/charts/*`
- `src/layouts/AdminLayout.tsx`
- `src/services/operations/`, `src/services/dashboard/`

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
