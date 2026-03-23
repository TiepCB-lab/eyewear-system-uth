# Backend N-Layered Architecture

Backend duoc to chuc theo Laravel API-first, nhung tach ro cac layer de de mo rong va de test.

## Muc tieu

- Giu duoc tinh quen thuoc cua Laravel MVC
- Tach nghiep vu ra khoi controller
- Han che controller phinh to
- Cho phep doi persistence hoac external service de dang

## So do layer

### 1. Presentation layer

Thu muc:

- `app/Http/Controllers`
- `app/Http/Requests`
- `app/Http/Resources`
- `routes`

Nhiem vu:

- Nhan request
- Validate input
- Goi Application service / use case
- Tra response JSON

### 2. Application layer

Thu muc:

- `app/Application`

Nhiem vu:

- Dieu phoi use case
- Orchestrate transaction
- Goi Domain contracts
- Goi Infrastructure services khi can

Module de xuat:

- `Auth`
- `Catalog`
- `Checkout`
- `Identity`
- `Sales`
- `Operations`
- `Support`
- `Reports`

### 3. Domain layer

Thu muc:

- `app/Domain`

Nhiem vu:

- Chua rule nghiep vu cot loi
- Chua interface repository
- Chua enum, constant, policy rule nghiep vu

Vi du:

- `RoleName`
- `OrderStatus`
- `PaymentMethod`
- `ProductRepositoryInterface`
- `OrderRepositoryInterface`

### 4. Infrastructure layer

Thu muc:

- `app/Infrastructure/Persistence`
- `app/Infrastructure/Services`

Nhiem vu:

- Hien thuc repository bang Eloquent
- Tich hop VNPay
- Xu ly luu file anh don thuoc
- Engine goi y khuon mat
- Tich hop virtual try-on

## Moi quan he voi MVC

- Model: `app/Models`
- View: React frontend, backend chu yeu dong vai tro API
- Controller: `app/Http/Controllers`

Noi cach khac, backend van giu tinh than MVC, nhung chen them `Application` va `Infrastructure` de tranh dua toan bo nghiep vu vao controller va model.

## Thu tu code backend de xuat

1. User, Role, Address, Auth
2. Prescription Book
3. Catalog, Variant, Lens, Inventory
4. Cart, Checkout, Order, Payment
5. Sales verification
6. Support ticket, return warranty
7. Operations workflow, shipment
8. Dashboard, recommendation, virtual try-on
