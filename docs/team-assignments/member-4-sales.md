# 💰 Member 4 — Sales, Payments & Support

**Module Tag**: `M4-SALES`  
**Priority**: 🟡 Medium (Parallel with M3/M5)

---

## 📋 Scope Overview

This member owns the **financial and customer service** side: Payment status tracking (simulated or Stripe), Order verification (Staff side), and the Support Ticket system.

---

## ✅ TODO Checklist

### Database (Migrations)
- [ ] Create `payments` migration (id, order_id FK, transaction_id, method, amount, status, timestamps)
- [ ] Create `tickets` migration (id, user_id FK, subject, message, status enum: open, closed, priority, timestamps)
- [ ] Create `ticket_replies` migration (id, ticket_id FK, user_id FK, message, timestamps)

### Backend — Models
- [ ] Complete `Payment.php`
- [ ] Complete `Ticket.php` — belongsTo User, hasMany TicketReplies
- [ ] Complete `TicketReply.php`

### Backend — Application Layer
- [ ] Implement `PaymentService.php`
  - Process simulated payment
  - Update `orders.payment_status` and `orders.status` to `verified`
- [ ] Implement `SalesService.php` (Staff only)
  - Get list of all orders (filtering by status)
  - Verify manual payments (e.g., bank transfer)
- [ ] Implement `TicketService.php`
  - Create ticket (Customer)
  - Reply to ticket (Customer/Staff)
  - Close ticket

### Backend — Controllers & Routes
- [ ] Implement `PaymentController.php` (store)
- [ ] Implement `SalesController.php` (Staff — order management)
- [ ] Implement `TicketController.php` (index, show, store, update)
- [ ] Create Form Requests: `PaymentRequest`, `TicketRequest`, `ReplyRequest`
- [ ] Create API Resources: `PaymentResource`, `OrderResource` (Sales view), `TicketResource`
- [ ] Define routes under `/api/v1/payments/*`, `/api/v1/sales/*`, `/api/v1/tickets/*`

### Frontend
- [ ] Implement `PaymentPage.html` (Summary + Mock payment buttons)
- [ ] Implement `OrderHistoryPage.html` (Customer view — track status)
- [ ] Implement `sales/dashboard/index.html` (Staff view — list of orders to verify)
- [ ] Implement `SupportTicketPage.html` (List/Create tickets)
- [ ] Implement `TicketDetailPage.html` (Chat-like reply interface)
- [ ] Create `paymentService.js`, `salesService.js`, `ticketService.js` in `src/services/`
- [ ] Create `StatusBadge.html` component (reusable for orders/tickets)

### Testing
- [ ] Feature tests for Payment flow → Order status transition
- [ ] Feature tests for Staff order verification
- [ ] Feature tests for Support ticket creation/reply
- [ ] Security test: Ensure users can't see other users' tickets

---

## 📁 Files Owned

### Backend
- `app/Models/Payment.php`, `Ticket.php`, `TicketReply.php`
- `app/Application/Sales/PaymentService.php`
- `app/Application/Helpdesk/TicketService.php`
- `app/Http/Controllers/Api/V1/PaymentController.php`
- `app/Http/Controllers/Api/V1/SalesController.php`
- `app/Http/Controllers/Api/V1/TicketController.php`
- `database/migrations/*_create_payments_table.php`, `tickets_table.php`

### Frontend
- `frontend/src/pages/payment/PaymentPage.html`
- `frontend/src/pages/orders/OrderHistoryPage.html`
- `frontend/src/pages/sales/dashboard/index.html`
- `frontend/src/pages/support/`
- `src/services/sales/`, `src/services/support/`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (users), M3-SHOPPING (orders)
- **Blocks**: M5-OPS (Production only starts after M4 verifies payment/order)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Models | 1 day |
| Payment API (Mock/Stripe) | 2 days |
| Sales/Order Mgmt API | 2 days |
| Tickets/Helpdesk API | 2 days |
| Frontend Payment/Orders | 3 days |
| Frontend Support system | 3 days |
| Testing | 1 day |
| **Total** | **~14 days** |
