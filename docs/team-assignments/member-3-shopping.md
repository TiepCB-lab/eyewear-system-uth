# 🛒 Member 3 — Shopping Experience & Smart Suggestion

**Module Tag**: `M3-SHOPPING`  
**Priority**: 🟡 High (can start after M1 auth + M2 products are ready)

---

## 📋 Scope Overview

This member owns the **Customer Journey** — from browsing and adding to cart, through checkout and payment, to order history. Also owns the AI-powered recommendation and virtual try-on features.

---

## ✅ TODO Checklist

### Database (Migrations)
- [ ] Create `carts` migration (id, user_id FK unique, timestamps)
- [ ] Create `cart_items` migration (id, cart_id FK, product_variant_id FK, lens_id FK nullable, prescription_id FK nullable, quantity, unit_price decimal, timestamps)
- [ ] Create `orders` migration (id, user_id FK, address_id FK, type enum, status enum, subtotal, discount, total_price decimal, voucher_code nullable, note nullable, timestamps, soft_deletes)
- [ ] Create `order_items` migration (id, order_id FK, product_variant_id FK, lens_id FK nullable, prescription_id FK nullable, quantity, unit_price, lens_price nullable, timestamps)
- [ ] Create `payments` migration (id, order_id FK unique, method enum, transaction_id nullable, amount decimal, status enum, paid_at nullable, gateway_response json nullable, timestamps)

### Backend — Models
- [ ] Complete `Cart.php` — relationships, subtotal accessor, clear method
- [ ] Complete `CartItem.php` — relationships, lineTotal accessor
- [ ] Complete `Order.php` — relationships, casts, scopes
- [ ] Complete `OrderItem.php` — relationships, lineTotal accessor
- [ ] Complete `Payment.php` — relationships, casts

### Backend — Domain Layer
- [ ] Finalize `OrderStatus.php` enum
- [ ] Finalize `PaymentMethod.php` enum
- [ ] Finalize `PaymentStatus.php` enum
- [ ] Implement `OrderRepositoryInterface.php` methods
- [ ] Create `OrderType.php` enum (standard, prescription)

### Backend — Application Layer
- [ ] Implement `CartService.php` — add/update/remove items, get summary
- [ ] Implement `CheckoutService.php` — create order, VNPay flow, cancel order
  - Inventory reservation (decrement stock on checkout)
  - Voucher application (call PromotionService from M2)
  - Payment record creation
  - Cart clearing after successful order

### Backend — Infrastructure Layer
- [ ] Implement `VnpayGateway.php` — payment URL generation, callback verification
- [ ] Implement `FaceShapeRecommendationEngine.php` — face shape analysis + suggestion mapping
- [ ] Implement `VirtualTryOnService.php` — frame overlay on face image

### Backend — Controllers & Routes
- [ ] Implement `CartController.php` (view cart, add/update/remove items, apply voucher)
- [ ] Implement `CheckoutController.php` (place order, VNPay redirect/callback, order history, cancel)
- [ ] Implement `RecommendationController.php` (face shape analysis, frame suggestions, virtual try-on)
- [ ] Create Form Requests: `CartItemRequest`, `CheckoutRequest`, `VnpayRequest`, `VoucherRequest`
- [ ] Create API Resources: `CartResource`, `OrderResource`, `OrderDetailResource`
- [ ] Define routes under `/api/v1/cart/*`, `/api/v1/checkout/*`, `/api/v1/orders/*`, `/api/v1/recommendation/*`

### Frontend
- [ ] Implement `HomePage.tsx` — hero, featured products, CTA sections
- [ ] Implement `CartPage.tsx` — item list, quantity controls, voucher, summary
- [ ] Implement `CheckoutPage.tsx` — address selection, payment method, place order
- [ ] Implement `OrdersPage.tsx` — customer order history with status badges
- [ ] Implement `RecommendationPage.tsx` — face photo upload, AI results, virtual try-on
- [ ] Create `cartService.ts`, `orderService.ts`, `recommendationService.ts`
- [ ] Create cart state in `src/store/useCartStore.ts`
- [ ] Create `MainLayout.tsx` in `src/layouts/` (header with cart icon + count)

### Testing
- [ ] Feature tests for cart operations
- [ ] Feature tests for checkout flow (COD + VNPay)
- [ ] Feature tests for order history & cancellation
- [ ] Integration test for VNPay callback

---

## 📁 Files Owned

### Backend
- `app/Models/Cart.php`, `CartItem.php`, `Order.php`, `OrderItem.php`, `Payment.php`
- `app/Domain/Orders/OrderStatus.php`, `OrderType.php`, `PaymentMethod.php`, `PaymentStatus.php`
- `app/Application/Checkout/CheckoutService.php`, `CartService.php`
- `app/Http/Controllers/Api/V1/CartController.php`, `CheckoutController.php`, `RecommendationController.php`
- `app/Infrastructure/Services/VnpayGateway.php`, `FaceShapeRecommendationEngine.php`, `VirtualTryOnService.php`

### Frontend
- `src/pages/home/HomePage.tsx`
- `src/pages/cart/CartPage.tsx`
- `src/pages/checkout/CheckoutPage.tsx`
- `src/pages/orders/OrdersPage.tsx`
- `src/pages/recommendation/RecommendationPage.tsx`
- `src/store/useCartStore.ts`
- `src/layouts/MainLayout.tsx`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (users, addresses), M2-CATALOG (products, lenses, promotions)
- **Blocks**: M4-SALES (orders must exist), M5-OPS (orders must exist)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Models | 2 days |
| Cart & Checkout API | 4 days |
| VNPay integration | 2 days |
| Recommendation/AI | 2 days |
| Frontend shopping pages | 5 days |
| Testing | 2 days |
| **Total** | **~17 days** |
