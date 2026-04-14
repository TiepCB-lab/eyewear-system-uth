# 💰 Member 4 — Sales, Payments & Support

**Module Tag**: `M4-SALES`  
**Priority**: 🟡 Medium (Parallel with M3/M5)

---

## 📋 Scope Overview

This member owns the **financial and customer service** side: Payment status tracking (simulated), Order verification (Staff side), and the Support Ticket system.

---

## ✅ TODO Checklist

### Database (Schema)
- [x] Create `payment` table in `database/schema.sql`
- [x] Create `supportticket` table in `database/schema.sql`
- [x] Create `ticket_replies` table in `database/schema.sql`

### Backend — Application Layer (Services)
- [ ] Complete `PaymentService.php` in `app/Application/`
  - Process simulated payment (COD, Bank Transfer)
  - Update `order.status` based on payment completion
- [ ] Complete `SalesVerificationService.php` in `app/Application/` (Staff only)
  - Verify manual orders before they go to production
- [ ] Complete `SupportTicketService.php` in `app/Application/`
  - Ticket lifecycle (Open, In-progress, Resolved, Closed)
  - Reply logic for customers and staff

### Backend — Controllers & Routes
- [ ] Implement `PaymentController.php` in `app/Http/Controllers/Api/V1/`
- [ ] Implement `SalesController.php` (for staff management)
- [ ] Implement `SupportTicketController.php`
- [ ] Define routes in `routes/api.php` under `api/v1/payments`, `api/v1/support`

### Frontend (Vanilla JS)
- [ ] Implement `src/pages/payment/index.html` (Payment selection and confirmation)
- [ ] Implement `src/pages/accounts/` (Order History view for customers)
- [ ] Implement `src/pages/dashboard/staff/` (Order verification and Support management)
- [ ] Create `src/services/paymentService.js` and `src/services/supportService.js`

### Testing
- [ ] Test API: Payment status transition (Pending -> Paid)
- [ ] Test API: Staff verification updating order status
- [ ] Test API: Multi-turn ticket replies

---

## 📁 Files Owned

### Backend
- `app/Application/PaymentService.php`
- `app/Application/SalesVerificationService.php`
- `app/Application/SupportTicketService.php`
- `app/Http/Controllers/Api/V1/PaymentController.php`

### Frontend
- `frontend/src/pages/payment/index.html`
- `frontend/src/pages/accounts/index.html` (Order tracking section)
- `frontend/src/services/paymentService.js`
- `frontend/src/services/supportService.js`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (users), M3-SHOPPING (orders)
- **Blocks**: M5-OPS (Production starts after payment verification)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| API: Payment & Orders | 3 days |
| API: Support System | 2 days |
| UI: Payment selection | 2 days |
| UI: Order status tracking | 3 days |
| UI: Staff/Support dashboard | 3 days |
| Testing | 1 day |
| **Total** | **~14 days** |
