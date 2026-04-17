# 🛒 Member 3 — Shopping Cart & Checkout

**Module Tag**: `M3-SHOPPING`  
**Priority**: 🔴 High (Direct Revenue Driver)

---

## 📋 Scope Overview

This member owns the **transactional flow**: Adding items to the cart (including lens selection), managing quantities, validating prescriptions, and the checkout process where a visitor becomes a customer.

---

## ✅ TODO Checklist
 
 ### Database (Schema)
 - [x] Create `cart`, `cartitem`, `prescription` in `database/schema.sql`
 
 ### Backend — Application Layer (Services)
 - [ ] Complete `CartService.php`:
   - Add/Update/Remove items from cart (Session or Database).
   - Calculate totals including lens additional options/pricing.
 - [ ] Complete `PrescriptionService.php`:
   - Validate prescription parameters (OD/OS: Sph, Cyl, Axis, PD).
 - [ ] Complete `CheckoutService.php`:
   - Convert cart to pending order.
   - Categorize orders: Stock, Pre-order, or Prescription Order.
 
 ### Backend — Controllers & Routes
 - [ ] Implement `CartController.php` and `PrescriptionController.php`.
 - [ ] Define API Endpoints for cart management and order placement.
 
 ### Frontend (Vanilla JS)
 - [ ] Implement `pages/cart/index.html`: Item list, quantity controls, total calculation.
 - [ ] Implement `pages/checkout/index.html`: Shipping info, prescription entry, order type selection.
 - [ ] Create `js/services/cartService.js`: Sync cart with server.
 - [ ] Implement dynamic price updates based on lens selection (Single Product Details).
 
 ### Testing
 - [ ] Test adding variants with lens options to cart.
 - [ ] Test prescription validation logic.
 - [ ] Test checkout flow (correct calculation and order type detection).
 
 ---
 
 ## 📁 Files Owned
 
 ### Backend
 - `app/Application/CartService.php`
 - `app/Application/PrescriptionService.php`
 - `app/Application/CheckoutService.php`
 - `app/Http/Controllers/Api/V1/CartController.php`
 
 ### Frontend
 - `frontend/pages/cart/index.html`
 - `frontend/pages/checkout/index.html`
 - `frontend/js/services/cartService.js`

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
