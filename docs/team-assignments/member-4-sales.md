# 💼 Member 4 — Sales & Customer Service

**Module Tag**: `M4-SALES`  
**Priority**: 🟢 Medium (can work on models/frontend early, API after M3 orders exist)

---

## 📋 Scope Overview

This member owns the **Sales Staff workflow** and **Customer Service** features. Includes order verification (prescription review), pre-order management, support ticketing, and return/warranty handling.

---

## ✅ TODO Checklist

### Database (Migrations)
- [ ] Create `support_tickets` migration (id, user_id FK, order_id FK nullable, subject, description text, type enum, status enum, resolved_at nullable, timestamps)
- [ ] Create `return_warranties` migration (id, order_id FK, user_id FK, type enum, reason text, status enum, refund_amount decimal nullable, resolved_at nullable, timestamps)

### Backend — Models
- [ ] Complete `SupportTicket.php` — fillable, casts (enum), relationships
- [ ] Complete `ReturnWarranty.php` — fillable, casts (enum), relationships

### Backend — Domain Layer
- [ ] Create `app/Domain/Support/TicketType.php` enum (inquiry, complaint, return, warranty)
- [ ] Create `app/Domain/Support/TicketStatus.php` enum (open, in_progress, resolved, closed)
- [ ] Create `app/Domain/Support/ReturnStatus.php` enum (requested, approved, rejected, refunded)

### Backend — Application Layer
- [ ] Implement `SalesVerificationService.php`
  - List pending verification orders (orders with prescription type)
  - Verify order: validate prescription params against lens limits, update status
  - Reject order: set status rejected, restore inventory, notify customer
  - Pre-order management: list pre-orders, fulfill when stock restocked
- [ ] Implement `SupportTicketService.php`
  - Create ticket (customer)
  - Respond to ticket (staff)
  - Resolve/close ticket
  - Create return/warranty request
  - Process return: approve/reject, calculate refund

### Backend — Controllers & Routes
- [ ] Implement `SalesOrderController.php` (pending orders, verify, reject, pre-orders)
- [ ] Implement `SupportTicketController.php` (ticket CRUD, respond, resolve, return/warranty CRUD)
- [ ] Create Form Requests: `VerifyRequest`, `RejectRequest`, `TicketRequest`, `RespondRequest`, `ReturnRequest`
- [ ] Create API Resources: `SalesOrderResource`, `TicketResource`, `ReturnWarrantyResource`
- [ ] Define routes under `/api/v1/sales/*`, `/api/v1/support/*`

### Frontend
- [ ] Implement `SalesDashboardPage.tsx`
  - Pending orders table with prescription detail drawer
  - Verify/Reject buttons with confirmation dialog
  - Pre-order tab with fulfillment actions
  - Quick stats cards (pending count, today verified, rejection rate)
- [ ] Implement `SupportPage.tsx`
  - Customer view: create ticket form, ticket list, ticket detail
  - Staff view: all tickets, respond textarea, resolve button
  - Return/warranty request form linked to order
  - Ticket conversation thread UI
- [ ] Create `salesService.ts`, `supportService.ts` in `src/services/`

### Testing
- [ ] Feature tests for order verification flow
- [ ] Feature tests for order rejection with inventory restoration
- [ ] Feature tests for support ticket lifecycle
- [ ] Feature tests for return/warranty processing

---

## 📁 Files Owned

### Backend
- `app/Models/SupportTicket.php`, `ReturnWarranty.php`
- `app/Domain/Support/TicketType.php`, `TicketStatus.php`, `ReturnStatus.php`
- `app/Application/Sales/SalesVerificationService.php`
- `app/Application/Support/SupportTicketService.php`
- `app/Http/Controllers/Api/V1/SalesOrderController.php`
- `app/Http/Controllers/Api/V1/SupportTicketController.php`
- `database/migrations/*_create_support_tickets_table.php`
- `database/migrations/*_create_return_warranties_table.php`

### Frontend
- `src/pages/sales/SalesDashboardPage.tsx`
- `src/pages/support/SupportPage.tsx`
- `src/services/sales/`, `src/services/support/`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (users), M3-SHOPPING (orders + payments must exist)
- **Blocks**: M5-OPS (verified orders enter production)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Models + Enums | 1 day |
| Sales verification API | 3 days |
| Support ticket API | 2 days |
| Return/warranty API | 2 days |
| Frontend sales/support pages | 4 days |
| Testing | 1 day |
| **Total** | **~13 days** |
