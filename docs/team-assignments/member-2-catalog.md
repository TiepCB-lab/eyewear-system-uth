# 🕶️ Member 2 — Product Catalog & Inventory

**Module Tag**: `M2-CATALOG`  
**Priority**: 🔴 High (Core for Shopping & Orders)

---

## 📋 Scope Overview

This member owns the **heart of the store**: Branded frames, Lens types, and the logic that combines them. You handle the inventory (stock) and the product search/filtering functionality.

---

## ✅ TODO Checklist

### Database (Migrations)
- [ ] Create `categories` migration (id, name, slug, description, timestamps)
- [ ] Create `products` migration (id, category_id FK, brand, model_name, base_price, description, gender, timestamps)
- [ ] Create `product_variants` migration (id, product_id FK, color, size_code, stock_quantity, image_2d_url, model_3d_url, additional_price, timestamps)
- [ ] Create `lenses` migration (id, name, type: single_vision/bifocal/progressive, material, price, timestamps)

### Backend — Models
- [ ] Complete `Category.php` — hasMany Products
- [ ] Complete `Product.php` — belongsTo Category, hasMany Variants, scope filters
- [ ] Complete `ProductVariant.php` — belongsTo Product
- [ ] Complete `Lens.php`

### Backend — Domain Layer
- [ ] Implement `ProductFilter.php` (logic for brand, price range, category, gender filters)

### Backend — Application Layer
- [ ] Implement `CatalogService.php`
  - Search products with filters & pagination
  - Get product details with variants
  - Get categories list
- [ ] Implement `InventoryService.php` (Staff only)
  - Update stock quantities
  - Low stock alerts logic
- [ ] Implement `LensService.php`
  - Get available lenses based on variant compatibility

### Backend — Controllers & Routes
- [ ] Implement `ProductController.php` (index, show)
- [ ] Implement `CategoryController.php` (index)
- [ ] Implement `InventoryController.php` (update stock)
- [ ] Create API Resources: `ProductListResource`, `ProductDetailResource`, `VariantResource`, `CategoryResource`
- [ ] Define routes under `/api/v1/catalog/*` and `/api/v1/admin/inventory/*`

### Frontend
- [ ] Implement `ProductListPage.html` (GridView/ListView + Sidebar filters)
- [ ] Implement `details/index.html` (Variant selection, price calculation)
- [ ] Implement `InventoryManagementPage.html` (Staff only — stock edit table)
- [ ] Create `CatalogSearch.html` component (debounced search input)
- [ ] Create `catalogService.js`, `inventoryService.js` in `src/services/`
- [ ] Create `ProductCard.html` and `FilterSidebar.html` components
- [ ] Implement `VirtualTryOn.html` (Integration for 3D/AR preview)

### Testing
- [ ] Feature tests for product listing & filtering
- [ ] Feature tests for stock updates (concurrency check)
- [ ] Unit tests for Price Calculation logic

---

## 📁 Files Owned

### Backend
- `app/Models/Product.php`, `ProductVariant.php`, `Category.php`, `Lens.php`
- `app/Application/Catalog/CatalogService.php`
- `app/Application/Inventory/InventoryService.php`
- `app/Http/Controllers/Api/V1/ProductController.php`
- `app/Http/Controllers/Api/V1/InventoryController.php`
- `database/migrations/*_create_products_table.php`, `variants_table.php`, etc.

### Frontend
- `frontend/src/pages/catalog/ProductListPage.html`, `details/index.html`
- `frontend/src/pages/admin/InventoryManagementPage.html`
- `src/services/catalogService.js`, `inventoryService.js`
- `src/components/catalog/*`

---

## 🔗 Dependencies

- **Depends on**: M1-IDENTITY (for staff-only inventory actions)
- **Blocks**: M3-SHOPPING (needs products to add to cart), M5-OPS (needs inventory to restock)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Models | 2 days |
| Catalog API (Filters/Search) | 3 days |
| Inventory API | 1 day |
| Frontend Catalog Pages | 4 days |
| Frontend Inventory Page | 2 days |
| Testing | 2 days |
| **Total** | **~14 days** |
