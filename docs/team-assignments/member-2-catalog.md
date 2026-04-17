# 🕶️ Member 2 — Product Catalog & Inventory

**Module Tag**: `M2-CATALOG`  
**Priority**: 🔴 High (Core for Shopping & Orders)

---

## 📋 Scope Overview

This member owns the **heart of the store**: Branded frames, Lens types, and the logic that combines them. You handle the inventory (stock) and the product search/filtering functionality. You are also responsible for the configuration of product variants (SKUs, attributes) for the Manager.

---

## ✅ TODO Checklist
 
 ### Database (Schema)
 - [x] Create `category`, `product`, `productvariant`, `lens`, `inventory` in `database/schema.sql`
 
 ### Backend — Application Layer (Services)
 - [ ] Complete `CatalogService.php`: Filter products (brand, category, price), Get categories.
 - [ ] Complete `InventoryService.php`: Update stock quantities, Manage reserved stock (Reservation).
 - [ ] Complete `LensService.php`: Retrieve lens list and pricing by index/features.
 
 ### Backend — Controllers & Routes
 - [ ] Implement Controllers: `ProductController`, `CategoryController`, `InventoryController`, `LensController`.
 - [ ] Define API Endpoints for public catalog and internal inventory.
 
 ### Frontend (Vanilla JS)
 - [ ] Implement `pages/catalog/index.html`: Product Grid + Attribute Filters.
 - [ ] Implement `pages/details/index.html`: Single View + Variant Selection + 2D/3D demo (Placeholder).
 - [x] Create `inventory.html` module in Dashboard: Stock In/Out management.
 - [x] Create `products.html` module in Dashboard: Manager configuration for product variants and attributes.
 - [ ] Create `js/services/adminService.js` for product management API calls.
 
 ### Testing
 - [ ] Test API: Filtering products by brand and category.
 - [ ] Test API: Stock updates and verification in `inventory` table.
 - [x] UI: Internal modules correctly display product and stock lists.
 
 ---
 
 ## 📁 Files Owned
 
 ### Backend
 - `app/Application/CatalogService.php`
 - `app/Application/InventoryService.php`
 - `app/Application/LensService.php`
 - `app/Http/Controllers/Api/V1/ProductController.php`
 - `app/Http/Controllers/Api/V1/InventoryController.php`
 
 ### Frontend
 - `frontend/pages/catalog/index.html`
 - `frontend/pages/details/index.html`
 - `frontend/pages/dashboard/modules/inventory.html`
 - `frontend/pages/dashboard/modules/products.html`
 - `frontend/js/services/catalogService.js`
 - `frontend/js/pages/admin-inventory.js`

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

