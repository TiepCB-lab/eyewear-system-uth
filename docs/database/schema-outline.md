# Database Schema Outline

Co so du lieu PostgreSQL duoc phan nhom theo nghiep vu trong file scope.

## 1. User & Role

- `roles`
- `users`
- `addresses`

## 2. Product, Variant & Inventory

- `products`
- `product_variants`
- `inventories`
- `lenses`
- `promotions`

## 3. Prescription & Cart

- `prescriptions`
- `carts`
- `cart_items`

## 4. Orders, Payment & Shipment

- `orders`
- `order_items`
- `payments`
- `shipments`

## 5. Support & Warranty

- `support_tickets`
- `return_warranties`

## Quan he chinh

- `roles 1 - n users`
- `users 1 - n addresses`
- `users 1 - n prescriptions`
- `products 1 - n product_variants`
- `product_variants 1 - 1 inventories`
- `users 1 - 1 carts`
- `carts 1 - n cart_items`
- `users 1 - n orders`
- `orders 1 - n order_items`
- `orders 1 - 1 payments`
- `orders 1 - 1 shipments`
- `users 1 - n support_tickets`

## Thuoc tinh can luu y

### Prescription

- `left_sph`
- `left_cyl`
- `left_axis`
- `right_sph`
- `right_cyl`
- `right_axis`
- `pd`
- `note`
- `image_url`

### Product Variant

- `color`
- `size`
- `price`
- `image_url`
- `allow_preorder`

### Order

- `type`
- `status`
- `total_price`
- `voucher_code`

### Shipment

- `tracking_code`
- `carrier`
- `status`

## Tinh nang database nen chuan bi o phase code

- Foreign key day du
- Soft delete cho cac bang can quan ly
- Enum hoac check constraint cho status
- Index cho `email`, `tracking_code`, `status`, `created_at`
- Audit log neu can mo rong
