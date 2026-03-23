# Database Schema Outline (Revised)

The MySQL database is structured to support the modular business requirements of the Eyewear System. Tables are grouped into logical clusters based on their functional domains.

> [!IMPORTANT]
> In eyewear e-commerce, a finished pair of glasses = **Frame** (from `products`) + **Lens** (from `lenses`) + **Prescription** (from `prescriptions`). The `products` table represents Frames. Customers who buy **sunglasses** or **fashion frames** do NOT select a lens or prescription.

---

## 🏗️ Table Clusters

### 1. Identity & Access Management (IAM)
- `roles` — System roles (Admin, Customer, Sales, Ops).
- `users` — Core user accounts with role FK.
- `addresses` — User shipping and billing addresses (multiple per user).

### 2. Product Catalog & Inventory
- `categories` — ⭐ **NEW** — Product categories (Prescription Frames, Sunglasses, Accessories).
- `products` — Base frame information (name, category, brand string, material, shape).
- `product_variants` — Color-size-price combinations per product.
- `product_images` — ⭐ **NEW** — Multiple images per product/variant (gallery).
- `inventories` — Real-time stock levels per variant.
- `lenses` — Catalog of optical lenses (index, material, features, prescription limits).
- `promotions` — Marketing vouchers and discount rules.

### 3. Prescription & Commerce
- `prescriptions` — Optical metrics (SPH, CYL, AXIS, PD for L/R) and scanned images.
- `carts` — User shopping cart headers (one per user).
- `cart_items` — Items in cart: **variant** + optional **lens** + optional **prescription**.

### 4. Order Management & Fulfillment
- `orders` — Transaction headers with type (standard/prescription), status lifecycle.
- `order_items` — Price snapshots: frame price + lens price at time of purchase.
- `payments` — Transaction records (VNPay, COD) with gateway response.
- `shipments` — Tracking codes, carrier info, and delivery status.

### 5. Post-Sales & Support
- `support_tickets` — Customer inquiries and staff conversation threads.
- `return_warranties` — Claims for returns, repairs, or warranty service.

---

## 📊 Complete Entity-Relationship Diagram

```text
┌──────────┐    ┌──────────┐
│  roles   │1──n│  users   │
└──────────┘    └────┬─────┘
                     │1
          ┌──────────┼──────────┬──────────────┐
          │n         │n         │1             │n
    ┌─────┴────┐ ┌───┴────┐ ┌──┴───┐  ┌───────┴────────┐
    │addresses │ │prescrip│ │carts │  │support_tickets │
    └──────────┘ │tions   │ └──┬───┘  └────────────────┘
                 └────────┘    │1
                               │n
                          ┌────┴─────┐
                          │cart_items │──→ product_variant (FK)
                          └──────────┘──→ lens (FK, nullable)
                                      ──→ prescription (FK, nullable)

┌────────────┐    ┌──────────┐    ┌─────────────────┐
│ categories │1──n│ products │1──n│ product_variants │
└────────────┘    └────┬─────┘    └───────┬─────────┘
                       │1                 │1
┌────────────┐    ┌────┴──────────┐  ┌────┴───────┐
│  brands    │1──n│product_images │  │inventories │
└────────────┘    └───────────────┘  └────────────┘

┌────────┐      (independent catalog)
│ lenses │      - chiết suất, tính năng, giới hạn độ
└────────┘      - referenced by cart_items & order_items

┌────────┐    ┌─────────────┐    ┌──────────┐    ┌───────────┐
│ orders │1──n│ order_items  │    │ payments │    │ shipments │
└───┬────┘    └─────────────┘    └──────────┘    └───────────┘
    │1──1─────────────────────────────┘1                │1
    │1──1──────────────────────────────────────────────┘

┌────────────┐
│ promotions │  (standalone, referenced by voucher_code on orders)
└────────────┘

┌───────────────────┐
│ return_warranties │  (linked to orders + users)
└───────────────────┘
```

---

## 🔗 Complete Relationships

### IAM
- `roles (1) ↔ users (n)`
- `users (1) ↔ addresses (n)`

### Catalog
- `categories (1) ↔ products (n)` ⭐ NEW
- `products (1) ↔ product_variants (n)`
- `products (1) ↔ product_images (n)` ⭐ NEW
- `product_variants (1) ↔ product_images (n)` (optional, for variant-specific photos)
- `product_variants (1) ↔ inventories (1)`

### Optical
- `users (1) ↔ prescriptions (n)`
- `lenses` → standalone catalog, referenced via FK in `cart_items` and `order_items`

### Commerce
- `users (1) ↔ carts (1)`
- `carts (1) ↔ cart_items (n)`
- `cart_items → product_variants (FK)`
- `cart_items → lenses (FK, nullable)` — only for prescription orders
- `cart_items → prescriptions (FK, nullable)` — only for prescription orders

### Orders
- `users (1) ↔ orders (n)`
- `orders (1) ↔ order_items (n)`
- `orders (1) ↔ payments (1)`
- `orders (1) ↔ shipments (1)`

### Support
- `users (1) ↔ support_tickets (n)`
- `orders (1) ↔ return_warranties (n)`

---

## 📝 Critical Attributes

### Categories ⭐ NEW
- `name`, `slug` (unique), `parent_id` (nullable, for subcategories)
- `description`, `image_url`, `sort_order`

### Products (= Frames)
- `category_id` (FK)
- `name`, `slug` (unique), `brand` (string), `description`
- `material` (metal, plastic, titanium, acetate)
- `shape` (oval, rectangle, aviator, cat_eye, round, square)
- `gender` (male, female, unisex)
- `is_active`, timestamps, soft_deletes

### Product Variants
- `product_id` (FK), `sku` (unique)
- `color`, `size` (e.g. 50-18-140 = lens width - bridge - temple)
- `price` (decimal), `image_url`
- `allow_preorder` (boolean)

### Product Images ⭐ NEW
- `product_id` (FK), `product_variant_id` (FK, nullable)
- `image_url`, `sort_order`, `is_primary`

### Lenses (= Tròng kính)
- `name`, `index_value` (1.50, 1.56, 1.61, 1.67, 1.74)
- `material`, `features` (JSON: blue_light, photochromic, anti_scratch)
- `min_sph`, `max_sph`, `min_cyl`, `max_cyl` (prescription limits)
- `price` (decimal), `is_active`

### Prescriptions
- `user_id` (FK), `name` (label)
- `left_sph`, `left_cyl`, `left_axis`
- `right_sph`, `right_cyl`, `right_axis`
- `pd` (Pupillary Distance)
- `note`, `image_url`

### Orders
- `type`: standard (sunglasses/accessories) vs prescription (needs lens + Rx)
- `status`: full lifecycle enum
- `production_step`: for lab workflow tracking
- `voucher_code`, `subtotal`, `discount`, `total_price`

---

## 🛠️ Persistence Best Practices (Phase 2)

- **Referential Integrity**: Strict foreign key constraints across all modules.
- **Soft Deletes**: Implement for Products, Orders, and Users.
- **Data Validation**: MySQL ENUM or CHECK constraints for status fields.
- **Performance**: Indexes on `email`, `slug`, `sku`, `tracking_code`, `status`, `created_at`.
- **Audit Logging**: Track changes on price updates and order status transitions.
