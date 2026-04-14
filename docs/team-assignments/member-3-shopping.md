# 🛒 Member 3 — Shopping Cart & Checkout

**Module Tag**: `M3-SHOPPING`  
**Priority**: 🔴 High (Direct Revenue Driver)

---

## 📋 Scope Overview

This member owns the **transactional flow**: Adding items to the cart (including lens selection), managing quantities, validating prescriptions, and the checkout process where a visitor becomes a customer.

---

## ✅ TODO Checklist

### Database (Schema)
- [x] Create `cart` table in `database/schema.sql`
- [x] Create `cartitem` table in `database/schema.sql`
- [x] Create `prescription` table in `database/schema.sql`

### Backend — Application Layer (Services)
- [ ] Complete `CartService.php` in `app/Application/`
  - Add/Update/Remove items from cart session or DB
  - Calculate cart totals including lens additional prices
- [ ] Complete `PrescriptionService.php` in `app/Application/`
  - Validation of OD/OS values (Sph, Cyl, Axis, PD)
- [ ] Complete `CheckoutService.php` in `app/Application/`
  - Convert cart to pending order
  - Apply promotion codes (if any)

### Backend — Controllers & Routes
- [ ] Implement `CartController.php` in `app/Http/Controllers/Api/V1/`
- [ ] Implement `PrescriptionController.php` (if needed)
- [ ] Define routes in `routes/api.php` under `api/v1/cart` prefix

### Frontend (Vanilla JS)
- [ ] Implement `src/pages/cart/index.html` (Item list, quantity controls, subtotal)
- [ ] Implement `src/pages/checkout/index.html` (Shipping info, summary, prescription upload/entry)
- [ ] Create `src/services/cartService.js` (Fetch API for cart sync)
- [ ] Implement dynamic price updates in Cart UI

### Testing
- [ ] Test adding variants with different lenses to cart
- [ ] Test prescription validation logic
- [ ] Test checkout flow (ensuring total_amount is calculated correctly)

---

## 📁 Files Owned

### Backend
- `app/Application/CartService.php`
- `app/Application/PrescriptionService.php`
- `app/Application/CheckoutService.php`
- `app/Http/Controllers/Api/V1/CartController.php`

### Frontend
- `frontend/src/pages/cart/index.html`
- `frontend/src/pages/checkout/index.html`
- `src/services/cartService.js`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (for user_id), M2-CATALOG (for products/lenses)
- **Blocks**: M4-SALES (needs orders created from checkout)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| API: Cart & Prescription | 3 days |
| API: Checkout Logic | 2 days |
| UI: Cart Page | 3 days |
| UI: Checkout Page | 3 days |
| Testing & Edge cases | 2 days |
| **Total** | **~13 days** |
