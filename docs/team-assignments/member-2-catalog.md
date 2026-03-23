# 🛍️ Member 2 — Catalog, Variant & Promotion

**Module Tag**: `M2-CATALOG`  
**Priority**: 🟠 High (can start after M1 migrations are done)

---

## 📋 Scope Overview

This member owns the **Product Catalog** — the core data layer that customers interact with. Includes Frames, Lenses, Variants, Inventory management, and Promotion/Voucher systems.

---

## ✅ TODO Checklist

### Database (Migrations & Seeders)
- [ ] Create `categories` migration (id, name, slug unique, parent_id FK nullable self-ref, description, image_url, sort_order, timestamps)
- [ ] Create `products` migration (id, category_id FK, name, slug unique, brand, description, material, shape, gender, is_active, timestamps, soft_deletes)
- [ ] Create `product_variants` migration (id, product_id FK, sku unique, color, size, price decimal, image_url, allow_preorder boolean default false, timestamps)
- [ ] Create `product_images` migration (id, product_id FK, product_variant_id FK nullable, image_url, sort_order, is_primary boolean, timestamps)
- [ ] Create `inventories` migration (id, product_variant_id FK unique, quantity integer, warehouse_location nullable, timestamps)
- [ ] Create `lenses` migration (id, name, index_value decimal, material, features json, min_sph, max_sph, min_cyl, max_cyl, price decimal, is_active, timestamps)
- [ ] Create `promotions` migration (id, code unique, type enum, value decimal, min_order_amount, max_uses, used_count default 0, starts_at datetime, expires_at datetime, is_active, timestamps)
- [ ] Create CategorySeeder with default categories (Prescription Frames, Sunglasses, Accessories)
- [ ] Create ProductSeeder with sample eyewear data (10-20 products with variants + images)
- [ ] Create LensSeeder with common lens types
- [ ] Create PromotionSeeder with sample vouchers

### Backend — Models
- [ ] Complete `Category.php` — fillable, self-referencing parent/children relationships, products relationship
- [ ] Complete `Product.php` — fillable, relationships (category, variants, images), scopes, slug accessor
- [ ] Complete `ProductVariant.php` — fillable, relationships, isInStock accessor
- [ ] Complete `ProductImage.php` — fillable, relationships (product, variant)
- [ ] Complete `Inventory.php` — fillable, relationships, reserve/restock methods
- [ ] Complete `Lens.php` — fillable, JSON cast, isCompatibleWith method
- [ ] Complete `Promotion.php` — fillable, scopes, calculateDiscount method

### Backend — Domain Layer
- [ ] Implement `ProductRepositoryInterface.php` contract methods
- [ ] Create `app/Domain/Catalog/ProductShape.php` enum (oval, rectangle, aviator, cat_eye, round, square)

### Backend — Application Layer
- [ ] Implement `CatalogService.php` — product CRUD, variant management, lens queries
- [ ] Implement `PromotionService.php` — voucher validation & application logic

### Backend — Infrastructure Layer
- [ ] Implement `app/Infrastructure/Persistence/Repositories/EloquentProductRepository.php`
- [ ] Register repository binding in ServiceProvider

### Backend — Controllers & Routes
- [ ] Implement `ProductCatalogController.php` (public product listing, detail, lens compatibility)
- [ ] Implement `AdminCatalogController.php` (admin CRUD for products, variants, inventory, lenses, promotions)
- [ ] Create Form Requests: `ProductRequest`, `VariantRequest`, `InventoryRequest`, `ProductFilterRequest`
- [ ] Create API Resources: `ProductResource`, `ProductVariantResource`, `LensResource`, `PromotionResource`
- [ ] Define routes under `/api/v1/products/*`, `/api/v1/lenses/*`, `/api/v1/admin/products/*`

### Frontend
- [ ] Implement `CatalogPage.tsx` — product grid, filters, sort, search, pagination
- [ ] Implement `ProductDetailPage.tsx` — gallery, variant selector, lens config, add-to-cart
- [ ] Create `ProductCard` component in `src/components/product/`
- [ ] Create `ProductFilter` sidebar component
- [ ] Create `catalogService.ts` in `src/services/catalog/`
- [ ] Admin: Product management CRUD pages in `src/pages/admin/`

### Testing
- [ ] Feature tests for product listing & filtering
- [ ] Feature tests for admin product CRUD
- [ ] Feature tests for lens compatibility check
- [ ] Feature tests for voucher validation

---

## 📁 Files Owned

### Backend
- `app/Models/Category.php`, `Product.php`, `ProductVariant.php`, `ProductImage.php`, `Inventory.php`, `Lens.php`, `Promotion.php`
- `app/Domain/Catalog/ProductRepositoryInterface.php`, `ProductShape.php`
- `app/Application/Catalog/CatalogService.php`, `PromotionService.php`
- `app/Http/Controllers/Api/V1/ProductCatalogController.php`
- `app/Http/Controllers/Api/V1/AdminCatalogController.php`
- `app/Infrastructure/Persistence/Repositories/EloquentProductRepository.php`
- `database/migrations/*_create_categories_table.php`, `*_create_products_table.php` (and variants, images, inventories, lenses, promotions)

### Frontend
- `src/pages/catalog/CatalogPage.tsx`
- `src/pages/catalog/ProductDetailPage.tsx`
- `src/components/product/*`
- `src/services/catalog/`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (users table must exist)
- **Blocks**: M3-SHOPPING (cart needs products), M5-OPS (inventory management)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Models + Seeders | 3 days |
| Catalog API (public + admin) | 3 days |
| Promotion/Voucher system | 2 days |
| Frontend catalog pages | 4 days |
| Testing | 1 day |
| **Total** | **~13 days** |
