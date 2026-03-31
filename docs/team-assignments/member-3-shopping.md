# 🛒 Member 3 — Shopping Cart & Order Processing

**Module Tag**: `M3-SHOPPING`  
**Priority**: 🟡 Medium-High (Depends on M2)

---

## 📋 Scope Overview

This member owns the **transactional flow**: Cart management (Database-backed for logged-in users), Prescription input (OD/OS details), and the initial Order creation (Checkout).

---

## ✅ TODO Checklist

### Database (Migrations)
- [ ] Create `cart_items` migration (id, user_id FK, variant_id FK, lens_id FK nullable, quantity, timestamps)
- [ ] Create `orders` migration (id, user_id FK, total_amount, status enum: pending, verified, in_production, shipped, delivered, cancelled, payment_status, timestamps)
- [ ] Create `order_items` migration (id, order_id FK, variant_id FK, lens_id FK, quantity, unit_price, timestamps)
- [ ] Create `prescriptions` migration (id, order_item_id FK, sphere, cylinder, axis, add, pd, timestamps)

### Backend — Models
- [ ] Complete `CartItem.php`
- [ ] Complete `Order.php` — hasMany OrderItems, belongsTo User
- [ ] Complete `OrderItem.php` — belongsTo Order, hasOne Prescription
- [ ] Complete `Prescription.php`

### Backend — Application Layer
- [ ] Implement `CartService.php`
  - Sync frontend cart with DB
  - Add/Update/Remove items
  - Validate stock before adding to cart
- [ ] Implement `CheckoutService.php`
  - Validate entire cart (stock, prices)
  - Create Order & OrderItems
  - Attach Prescription details
  - **Draft** status: `pending`
- [ ] Implement `PrescriptionService.php`
  - Validation logic for optical parameters (Sphere, Cyl, etc.)

### Backend — Controllers & Routes
- [ ] Implement `CartController.php` (index, store, update, destroy)
- [ ] Implement `CheckoutController.php` (store — create order)
- [ ] Create Form Requests: `AddToCartRequest`, `PrescriptionRequest`, `CheckoutRequest`
- [ ] Create API Resources: `CartResource`, `OrderResource`
- [ ] Define routes under `/api/v1/cart/*` and `/api/v1/checkout`

### Frontend
- [ ] Implement `CartDrawer.tsx` or `CartPage.tsx`
- [ ] Implement `CheckoutPage.tsx`
  - Step 1: Shipping Address (M1 data + overrides)
  - Step 2: Prescription Entry (Form for OD/OS)
  - Step 3: Order Summary & Confirm
- [ ] Create `PrescriptionForm.tsx` component with validation
- [ ] Create `cartService.ts`, `checkoutService.ts` in `src/services/`
- [ ] Create `cartStore.ts` (Zustand) — persistent local storage + API sync

### Testing
- [ ] Feature tests for Cart logic (add same item → increment quantity)
- [ ] Feature tests for Checkout (stock reduction simulation — *M2 coordination*)
- [ ] Unit tests for Prescription validation rules
- [ ] Feature tests for Guest vs Authenticated cart behavior

---

## 📁 Files Owned

### Backend
- `app/Models/CartItem.php`, `Order.php`, `OrderItem.php`, `Prescription.php`
- `app/Application/Shopping/CartService.php`
- `app/Application/Shopping/CheckoutService.php`
- `app/Http/Controllers/Api/V1/CartController.php`
- `app/Http/Controllers/Api/V1/CheckoutController.php`
- `database/migrations/*_create_orders_table.php`, `prescriptions_table.php`, etc.

### Frontend
- `src/pages/shopping/CheckoutPage.tsx`, `CartPage.tsx`
- `src/store/cartStore.ts`
- `src/services/shopping/`
- `src/components/shopping/PrescriptionForm.tsx`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (user_id), M2-CATALOG (product variants, lenses)
- **Blocks**: M4-SALES (needs orders to verify/pay), M5-OPS (needs orders to produce)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Models | 2 days |
| Cart API | 2 days |
| Checkout/Prescription API | 3 days |
| Frontend Cart/Drawer | 2 days |
| Frontend Checkout Flow | 4 days |
| Testing | 2 days |
| **Total** | **~15 days** |
