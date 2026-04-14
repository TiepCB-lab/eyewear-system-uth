# ⚙️ Member 5 — Operations, Logistics & Dashboard

**Module Tag**: `M5-OPS`  
**Priority**: 🔵 Medium-Low (Final stage of lifecycle)

---

## 📋 Scope Overview

This member owns the **back-office workflow**: Production (lens cutting, frame mounting), Quality Control, Shipping/Logistics, and the Management Analytics Dashboard.

---

## ✅ TODO Checklist

### Database (Schema)
- [x] Create `shipment` table in `database/schema.sql`
- [x] Add production columns to `order` table in `database/schema.sql`

### Backend — Application Layer (Services)
- [ ] Complete `OperationsService.php` in `app/Application/`
  - Manage production steps (Lens cutting -> Mounting -> QC)
  - Shipment creation and tracking updates
- [ ] Complete `DashboardService.php` in `app/Application/`
  - Aggregate statistics (Revenue, Top products, Active orders)
- [ ] Complete `AdminService.php` in `app/Application/`
  - Management of users and system configuration

### Backend — Controllers & Routes
- [ ] Implement `OperationsController.php` in `app/Http/Controllers/Api/V1/`
- [ ] Implement `DashboardController.php` in `app/Http/Controllers/Api/V1/`
- [ ] Define routes in `routes/api.php` under `api/v1/ops` and `api/v1/dashboard`

### Frontend (Vanilla JS)
- [ ] Implement `src/pages/dashboard/admin/index.html` (Full management view)
- [ ] Implement `src/pages/dashboard/staff/index.html` (Operations & Shipping view)
- [ ] Create `src/services/adminService.js` and `src/services/dashboardService.js`

### Testing
- [ ] Test API: Advancing an order through production steps
- [ ] Test API: Creating a shipment and checking status updates
- [ ] Analytics: verifying revenue matching with paid orders

---

## 📁 Files Owned

### Backend
- `app/Application/OperationsService.php`
- `app/Application/DashboardService.php`
- `app/Application/AdminService.php`
- `app/Http/Controllers/Api/V1/OperationsController.php`
- `app/Http/Controllers/Api/V1/DashboardController.php`

### Frontend
- `frontend/src/pages/dashboard/admin/index.html`
- `frontend/src/pages/dashboard/staff/index.html`
- `frontend/src/services/adminService.js`
- `frontend/src/services/dashboardService.js`

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
