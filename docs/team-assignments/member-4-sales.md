# 💰 Member 4 — Sales, Payments & Support

**Module Tag**: `M4-SALES`  
**Priority**: 🟡 Medium (Parallel with M3/M5)

---

## 📋 Scope Overview

This member owns the **financial and customer service** side: Payment status tracking (simulated), Order verification (Staff side), and the Support Ticket system.

---

## ✅ TODO Checklist
 
 ### Database (Schema)
 - [x] Create `payment`, `supportticket`, `ticket_replies` in `database/schema.sql`
 
 ### Backend — Application Layer (Services)
 - [ ] Complete `PaymentService.php`:
   - Process payment confirmation (simulated COD, Bank Transfer).
   - Update order status (`order.status`) based on payment detection.
 - [ ] Complete `SalesVerificationService.php` (Staff only):
   - Verify Prescription order parameters before production.
   - Process complaints: exchange/returns, warranty, refunds.
 - [ ] Complete `SupportTicketService.php`:
   - Ticket lifecycle management (Open, In-progress, Resolved, Closed).
   - Reply logic for customers and staff.
 
 ### Backend — Controllers & Routes
 - [ ] Implement `PaymentController`, `SalesController`, `SupportTicketController`.
 - [ ] Define API Endpoints for payments and support system.
 
 ### Frontend (Vanilla JS)
 - [ ] Implement `pages/payment/index.html`: Selection and confirmation UI.
 - [x] Integrated Order History into `pages/accounts/index.html` for customers.
 - [x] Finalized `orders.html` module in Dashboard: Order management and approval.
 - [ ] Create `support.html` module in Dashboard: Ticket management and support responses.
 - [ ] Create `js/services/paymentService.js` and `js/services/supportService.js`.
 
 ### Testing
 - [ ] Test API: Payment status transition (Pending -> Paid).
 - [ ] Test API: Staff verification updating order workflow.
 - [ ] Test API: Support ticket multi-turn reply flow.
 
 ### 🚀 Final Phase (Integration & Polish)
 - [ ] **Production Seed Data**: Revamp `seeder.php` to generate a minimum of 30+ authentic eyewear products with correct VND pricing and imagery.
 - [ ] **System Test Accounts**: Pre-generate reliable test accounts (`admin@eyewear.com`, `staff@eyewear.com`, `customer@eyewear.com`) for grading.
 - [ ] **E2E Sales Workflow**: Cross-test Member 3's frontend by logging into the Admin Dashboard to approve and verify incoming payment statuses.
 
 ---
 
 ## 📁 Files Owned
 
 ### Backend
 - `app/Application/PaymentService.php`
 - `app/Application/SalesVerificationService.php`
 - `app/Application/SupportTicketService.php`
 - `app/Http/Controllers/Api/V1/PaymentController.php`
 
 ### Frontend
 - `frontend/pages/payment/index.html`
 - `frontend/pages/accounts/index.html` (Order tracking section)
 - `frontend/pages/dashboard/modules/orders.html`
 - `frontend/pages/dashboard/modules/support.html`
 - `frontend/js/services/paymentService.js`
 - `frontend/js/services/supportService.js`

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
