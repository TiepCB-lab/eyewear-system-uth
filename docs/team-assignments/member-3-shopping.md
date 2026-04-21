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
 - [x] Complete `CartService.php`:
   - Add/Update/Remove items from cart (Session or Database).
   - Calculate totals including lens additional options/pricing.
 - [x] Complete `PrescriptionService.php`:
   - Validate prescription parameters (OD/OS: Sph, Cyl, Axis, PD).
 - [x] Complete `CheckoutService.php`:
   - Convert cart to pending order.
   - Categorize orders: Stock, Pre-order, or Prescription Order.
 
 ### Backend — Controllers & Routes
 - [x] Implement `CartController.php` and `PrescriptionController.php`.
 - [x] Define API Endpoints for cart management and order placement.
 
 ### Frontend (Vanilla JS)
 - [x] Implement `pages/cart/index.html`: Item list, quantity controls, total calculation.
 - [x] Implement `pages/checkout/index.html`: Shipping info, prescription entry, order type selection.
 - [x] Create `js/services/cartService.js`: Sync cart with server.
 - [x] Implement dynamic price updates based on lens selection (Single Product Details).
 
 ### Testing
 - [x] Test adding variants with lens options to cart.
 - [x] Test prescription validation logic.
 - [x] Test checkout flow (correct calculation and order type detection).
 
 ### 🚀 Final Phase (Integration & Polish)
 - [ ] **Homepage Dynamic Data**: Remove mock placeholder backgrounds and banners in `index.html`.
 - [ ] **E2E Customer Journey**: Simulate the primary funnel: Registration -> Configure Lens Types -> Add to Cart -> Successful Checkout.
 - [x] **Edge Case Handling**: Enforce robust UI states (e.g., disable "Add to Cart" when `stock_quantity <= 0`, empty cart fallback messages).
 
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
