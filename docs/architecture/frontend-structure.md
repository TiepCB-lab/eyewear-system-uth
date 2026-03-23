# Frontend Structure

Frontend duoc chinh lai theo cau truc React frontend pho bien, de de doc, de ban giao va de bat tay code giao dien.

## Nguyen tac

- `pages`: trang theo route
- `components`: component tai su dung lai
- `layouts`: khung giao dien tong
- `routes`: config route va guard
- `services`: API va xu ly giao tiep he thong
- `store`: state management
- `contexts`: context toan cuc
- `hooks`: custom hook dung chung
- `types`, `utils`, `constants`, `config`: lop support cho frontend

## Cum thu muc

### 1. Pages

Thu muc:

- `src/pages/auth`
- `src/pages/home`
- `src/pages/catalog`
- `src/pages/recommendation`
- `src/pages/prescription`
- `src/pages/cart`
- `src/pages/checkout`
- `src/pages/orders`
- `src/pages/support`
- `src/pages/admin`
- `src/pages/sales`
- `src/pages/operations`

Nhiem vu:

- Moi route ung voi mot page chinh
- Neu page lon, tach them component con trong `components`

### 2. Components

Thu muc:

- `src/components/common`
- `src/components/forms`
- `src/components/layout`
- `src/components/product`
- `src/components/charts`

Nhiem vu:

- Chua UI tai su dung
- Khong gom logic route cap cao

### 3. Layouts & Routes

Thu muc:

- `src/layouts`
- `src/routes`

Nhiem vu:

- Khai bao layout cho khach hang va admin / staff
- Khai bao route path
- Tach guard route neu can

### 4. Services, Store, Context

Thu muc:

- `src/services`
- `src/store`
- `src/contexts`

Nhiem vu:

- HTTP client, endpoint, auth service, order service
- Global state cho auth, cart, UI
- Context cho session, theme, notification neu can

### 5. Utilities

Thu muc:

- `src/hooks`
- `src/types`
- `src/utils`
- `src/constants`
- `src/config`
- `src/styles`

Nhiem vu:

- Hook dung chung
- Type model frontend
- Ham format gia, ngay gio
- Hang so route, role, status
- Bien moi truong va app config

## Mapping voi nghiep vu

- Identity: `pages/auth`, `pages/prescription`
- Catalog: `pages/home`, `pages/catalog`
- Recommendation: `pages/recommendation`
- Shopping: `pages/cart`, `pages/checkout`, `pages/orders`
- Support: `pages/support`
- Sales / Operations / Admin: `pages/sales`, `pages/operations`, `pages/admin`


