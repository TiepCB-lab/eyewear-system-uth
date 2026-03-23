# Project Structure

Day la cay thu muc de xuat cho toan bo du an o phase scaffold.

```text
.
|-- backend/
|   |-- app/
|   |   |-- Application/
|   |   |-- Domain/
|   |   |-- Http/
|   |   |-- Infrastructure/
|   |   |-- Models/
|   |   |-- Policies/
|   |   |-- Providers/
|   |   `-- Rules/
|   |-- bootstrap/
|   |-- config/
|   |-- database/
|   |   |-- factories/
|   |   |-- migrations/
|   |   `-- seeders/
|   |-- public/
|   |-- routes/
|   |-- storage/
|   `-- tests/
|-- frontend/
|   |-- public/
|   `-- src/
|       |-- assets/
|       |-- components/
|       |-- config/
|       |-- constants/
|       |-- contexts/
|       |-- hooks/
|       |-- layouts/
|       |-- pages/
|       |-- routes/
|       |-- services/
|       |-- store/
|       |-- styles/
|       |-- types/
|       `-- utils/
|-- docs/
|   |-- architecture/
|   `-- database/
|-- docker-compose.yml
`-- .env.example
```

## Backend: file dinh huong se co o phase code

### Presentation / MVC

- `app/Http/Controllers/Api/V1/AuthController.php`
- `app/Http/Controllers/Api/V1/ProductCatalogController.php`
- `app/Http/Controllers/Api/V1/CheckoutController.php`
- `app/Http/Controllers/Api/V1/PrescriptionController.php`
- `app/Http/Controllers/Api/V1/SalesOrderController.php`
- `app/Http/Controllers/Api/V1/OperationsController.php`
- `app/Http/Controllers/Api/V1/SupportTicketController.php`
- `app/Http/Controllers/Api/V1/DashboardController.php`
- `app/Http/Controllers/Api/V1/SystemAdminController.php`

### Application layer

- `app/Application/Auth/*`
- `app/Application/Catalog/*`
- `app/Application/Checkout/*`
- `app/Application/Identity/*`
- `app/Application/Sales/*`
- `app/Application/Operations/*`
- `app/Application/Support/*`
- `app/Application/Reports/*`

### Domain layer

- `app/Domain/Auth/*`
- `app/Domain/Catalog/*`
- `app/Domain/Orders/*`
- `app/Domain/Support/*`
- `app/Domain/Shared/*`

### Infrastructure layer

- `app/Infrastructure/Persistence/Repositories/*`
- `app/Infrastructure/Services/VnpayGateway.php`
- `app/Infrastructure/Services/FaceShapeRecommendationEngine.php`
- `app/Infrastructure/Services/VirtualTryOnService.php`

### Models

- `app/Models/User.php`
- `app/Models/Role.php`
- `app/Models/Address.php`
- `app/Models/Product.php`
- `app/Models/ProductVariant.php`
- `app/Models/Inventory.php`
- `app/Models/Lens.php`
- `app/Models/Promotion.php`
- `app/Models/Prescription.php`
- `app/Models/Cart.php`
- `app/Models/CartItem.php`
- `app/Models/Order.php`
- `app/Models/OrderItem.php`
- `app/Models/Payment.php`
- `app/Models/Shipment.php`
- `app/Models/SupportTicket.php`
- `app/Models/ReturnWarranty.php`

## Frontend: file dinh huong se co o phase code

### App skeleton

- `src/main.tsx`
- `src/App.tsx`
- `src/routes/index.tsx`
- `src/routes/routePaths.ts`
- `src/layouts/MainLayout.tsx`
- `src/layouts/AdminLayout.tsx`

### Pages

- `src/pages/auth/*`
- `src/pages/home/*`
- `src/pages/catalog/*`
- `src/pages/recommendation/*`
- `src/pages/prescription/*`
- `src/pages/cart/*`
- `src/pages/checkout/*`
- `src/pages/orders/*`
- `src/pages/support/*`
- `src/pages/admin/*`
- `src/pages/sales/*`
- `src/pages/operations/*`

### Reusable frontend layers

- `src/components/common/*`
- `src/components/forms/*`
- `src/components/layout/*`
- `src/components/product/*`
- `src/components/charts/*`
- `src/contexts/*`
- `src/hooks/*`
- `src/services/api/*`
- `src/store/*`
- `src/types/*`
- `src/utils/*`
- `src/styles/*`

