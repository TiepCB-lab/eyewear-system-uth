# ⚙️ Member 5 — Operations, Logistics & Dashboard

**Module Tag**: `M5-OPS`  
**Priority**: 🔵 Medium-Low (Final stage of lifecycle)

---

## 📋 Scope Overview

This member owns the **back-office workflow**: Production (lens cutting, frame mounting), Quality Control, Shipping/Logistics, and the Management Analytics Dashboard.

---

## ✅ TODO Checklist
 
 ### Database (Schema)
 - [x] Create `shipment` in `database/schema.sql`
 - [x] Add production status columns (`production_status`) to `order` table.
 
 ### Backend — Application Layer (Services)
 - [ ] Complete `OperationsService.php`:
   - Manage production steps (Lens cutting -> Mounting -> QC).
   - Shipment creation and tracking assignment.
 - [ ] Complete `DashboardService.php`:
   - Aggregate statistics (Revenue, Top products, Active orders).
 - [ ] Complete `AdminService.php`:
   - Management of staff members and system configuration.
 
 ### Backend — Controllers & Routes
 - [ ] Implement `OperationsController`, `DashboardController`, `AdminController`.
 - [ ] Define API Endpoints for operations and analytics reports.
 
 ### Frontend (Vanilla JS)
 - [x] Created common Dashboard Shell (`pages/dashboard/index.html`).
 - [x] Created `analytics.html` module: Revenue charts and manager reports.
 - [x] Created `ops.html` module: Production workflow and shipping for Ops Staff.
 - [x] Created `users.html` module: Staff management and RBAC configuration (Admin).
 - [ ] Define API endpoints in `js/services/adminService.js` and `js/services/dashboardService.js`.
 
 ### Testing
 - [ ] Test API: Advancing an order through production steps.
 - [ ] Test API: Creating a shipment and verifying order status update.
 - [ ] Analytics: Ensuring revenue matches paid invoices.
 
 ---
 
 ## 📁 Files Owned
 
 ### Backend
 - `app/Application/OperationsService.php`
 - `app/Application/DashboardService.php`
 - `app/Application/AdminService.php`
 - `app/Http/Controllers/Api/V1/OperationsController.php`
 - `app/Http/Controllers/Api/V1/DashboardController.php`
 
 ### Frontend
 - `frontend/pages/dashboard/index.html` (Shell)
 - `frontend/pages/dashboard/modules/analytics.html`
 - `frontend/pages/dashboard/modules/ops.html`
 - `frontend/pages/dashboard/modules/users.html`
 - `frontend/js/services/dashboardService.js`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (users), M2-CATALOG (products), M3-SHOPPING (orders), M4-SALES (verified orders)
- **Blocks**: Nothing (End of workflow)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| API: Operations Workflow | 4 days |
| API: Dashboard Analytics | 3 days |
| UI: Admin Dashboard | 4 days |
| UI: Staff/Ops Dashboard | 2 days |
| Testing & Optimization | 2 days |
| **Total** | **~15 days** |
