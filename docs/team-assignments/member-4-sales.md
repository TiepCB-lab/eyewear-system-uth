# 💰 Member 4 — Sales, Payments & Support

**Module Tag**: `M4-SALES`  
**Priority**: 🟡 Medium (Parallel with M3/M5)

---

## 📋 Scope Overview

This member owns the **financial and customer service** side: Payment status tracking (simulated), Staff verification for prescription orders, and the Support Ticket system.

> Business rule note: the staff review screen is for new prescription orders waiting for approval. Normal orders go directly to payment. Payment options stay aligned with the customer page and use the same 3 choices.

---

## ✅ TODO Checklist
 
 ### Database (Schema)
 - [x] Create `payment`, `supportticket`, `ticket_replies` in `database/schema.sql`
 
 ### Backend — Application Layer (Services)
 - [x] Complete `PaymentService.php`:
   - Process payment confirmation with the same 3 payment choices as the customer flow.
   - Update order status (`order.status`) based on payment detection.
 - [x] Complete `SalesVerificationService.php` (Staff only):
   - Verify prescription orders before production.
   - Keep normal orders out of the staff review queue unless they require manual handling.
   - Process complaints: exchange/returns, warranty, refunds.
 - [x] Complete `SupportTicketService.php`:
   - Ticket lifecycle management (Open, In-progress, Resolved, Closed).
   - Reply logic for customers and staff.
 
 ### Backend — Controllers & Routes
 - [x] Implement `PaymentController`, `SalesController`, `SupportTicketController`.
 - [x] Define API Endpoints for payments, support system, and order tracking (`GET /orders`).
 - [x] Separate staff approval flow for prescription orders from the standard payment flow.
 
 ### Frontend (Vanilla JS)
 - [x] Implement `pages/payment/index.html`: Selection and confirmation UI.
 - [x] Integrated Order History into `pages/accounts/index.html` for customers.
 - [x] Finalized `orders.html` module in Dashboard: Prescription order management and approval.
 - [x] Create `support.html` module in Dashboard: Ticket management and support responses.
 - [x] Create `js/services/paymentService.js` and `js/services/supportService.js`.
 
 ### Testing
 - [x] Test API: Payment status transition (Pending -> Paid).
 - [x] Test API: Staff verification updating order workflow.
 - [x] Test API: Support ticket multi-turn reply flow.
 
 ### 🚀 Final Phase (Integration & Polish)
 - [x] **Production Seed Data**: Revamp `seeder.php` to generate a minimum of 30+ authentic eyewear products with correct VND pricing and imagery.
 - [x] **System Test Accounts**: Pre-generate reliable test accounts (`admin@eyewear.com`, `staff@eyewear.com`, `customer@eyewear.com`) for grading.
 - [ ] **E2E Sales Workflow**: Cross-test Member 3's frontend by logging into the Admin Dashboard to approve and verify incoming payment statuses.
 
 ---
 
 ## 📁 Files Owned
 
 ### Backend
 - `app/Application/PaymentService.php`
 - `app/Application/SalesVerificationService.php`
 - `app/Application/SupportTicketService.php`
 - `app/Application/OrderService.php`
 - `app/Http/Controllers/Api/V1/PaymentController.php`
 - `app/Http/Controllers/Api/V1/OrderController.php`

 ### Frontend
 - `frontend/pages/payment/index.html`
 - `frontend/pages/accounts/index.html` (Order tracking section)
 - `frontend/pages/portal/modules/orders.html`
 - `frontend/pages/portal/modules/support.html`
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
