# 🕶️ Member 2 — Product Catalog & Inventory

**Module Tag**: `M2-CATALOG`  
**Priority**: 🔴 High (Core for Shopping & Orders)

---

## 📋 Scope Overview

This member owns the **heart of the store**: Branded frames, Lens types, and the logic that combines them. You handle the inventory (stock) and the product search/filtering functionality.

---

## ✅ TODO Checklist

### Database (Schema)
- [x] Create `category` table in `database/schema.sql`
- [x] Create `product` table in `database/schema.sql`
- [x] Create `productvariant` table in `database/schema.sql`
- [x] Create `lens` table in `database/schema.sql`
- [x] Create `inventory` table in `database/schema.sql`

### Backend — Application Layer (Services)
- [ ] Complete `CatalogService.php` in `app/Application/`
  - Get products with filters (brand, category, price)
  - Get categories list for sidebar
- [ ] Complete `InventoryService.php` in `app/Application/`
  - Update stock quantities for product variants
  - Reserved stock management
- [ ] Complete `LensService.php` in `app/Application/`
  - Retrieve available lenses and pricing

### Backend — Controllers & Routes
- [ ] Implement `ProductController.php` in `app/Http/Controllers/Api/V1/`
- [ ] Implement `CategoryController.php` in `app/Http/Controllers/Api/V1/`
- [ ] Implement `InventoryController.php` in `app/Http/Controllers/Api/V1/`
- [ ] Implement `LensController.php` in `app/Http/Controllers/Api/V1/`
- [ ] Define routes in `routes/api.php` under `api/v1/products` and `api/v1/admin/inventory`

### Frontend (Vanilla JS)
- [ ] Implement `src/pages/catalog/ProductListPage.html` (Grid of products + Filter sidebar)
- [ ] Implement `src/pages/details/index.html` (Single product view + Variant selection)
- [ ] Create `src/services/catalogService.js` (Fetch API for products)
- [ ] Create `src/services/inventoryService.js` (Fetch API for stock updates)
- [ ] Update `src/pages/dashboard/staff/` (if any) for inventory management tasks

### Testing
- [ ] Test API: Filtering products by category and brand
- [ ] Test API: Updating stock and checking if `inventory` table reflects correctly
- [ ] UI Test: Selecting a variant in details page updates the UI price

---

## 📁 Files Owned

### Backend
- `app/Application/CatalogService.php`
- `app/Application/InventoryService.php`
- `app/Application/LensService.php`
- `app/Http/Controllers/Api/V1/ProductController.php`
- `app/Http/Controllers/Api/V1/CategoryController.php`
- `app/Http/Controllers/Api/V1/InventoryController.php`
- `app/Http/Controllers/Api/V1/LensController.php`

### Frontend
- `frontend/src/pages/catalog/ProductListPage.html`
- `frontend/src/pages/details/index.html`
- `frontend/src/services/catalogService.js`
- `frontend/src/services/inventoryService.js`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (for staff roles in inventory)
- **Blocks**: M3-SHOPPING (needs products to add to cart)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| API: Catalog & Filters | 3 days |
| API: Inventory & stock | 2 days |
| UI: Listing Page | 3 days |
| UI: Details Page | 3 days |
| Testing | 2 days |
| **Total** | **~13 days** |

