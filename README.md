# Eyewear System UTH

Monorepo scaffold cho du an hoc tap Lap trinh Web ve website ban kinh mat, duoc to chuc theo:

- Database: PostgreSQL
- Backend: PHP Laravel, huong n-layered architecture va van giu tinh chat MVC
- Frontend: React theo cau truc frontend pho bien, tach ro `components`, `pages`, `layouts`, `routes`, `services`, `store`, `hooks`, `contexts`

## Trang thai hien tai

Repository nay dang o **phase 1: to chuc cau truc du an**.

- Da co khung thu muc cho backend, frontend, database va tai lieu kien truc
- Da co file `.env.example` cho root, backend, frontend
- Da co `docker-compose.yml` de khoi dong PostgreSQL va pgAdmin
- Chua co business logic
- Chua khoi tao day du Laravel app va React app de chay `php artisan serve` / `npm run dev`

Database co the chay ngay. Backend va frontend se di tiep o phase code tiep theo.

## Pham vi chuc nang bam theo file PDF

Tai lieu pham vi du an duoc tom tat tai [docs/project-scope-summary.md](docs/project-scope-summary.md). He thong duoc chia thanh 5 nhom nghiep vu chinh:

1. System Admin & Identity
2. Catalog, Variant & Promotion
3. Shopping Experience & Smart Suggestion
4. Sales & Customer Service
5. Operations, Logistics & Dashboard

## Cau truc tong quan

Chi tiet day du nam tai [docs/project-structure.md](docs/project-structure.md).

```text
.
|-- backend/
|-- frontend/
|-- docs/
|-- docker-compose.yml
`-- .env.example
```

## Yeu cau moi truong

De di tu scaffold sang giai doan code va run, nen chuan bi:

- Git
- Docker Desktop hoac Docker Engine
- PHP 8.2+
- Composer 2.7+
- Node.js 22+
- npm 10+

Neu khong dung Docker cho database, co the cai PostgreSQL 16 va tao database thu cong theo thong so trong file `.env`.

## Huong dan chay tu dau den cuoi

### 1. Clone repository

```bash
git clone <repo-url>
cd eyewear-system-uth
```

### 2. Cau hinh bien moi truong root cho Docker

Sao chep file mau:

```bash
copy .env.example .env
```

Hoac tren PowerShell:

```powershell
Copy-Item .env.example .env
```

File `.env` o root dung cho `docker-compose.yml`, bao gom:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `PGADMIN_PORT`

### 3. Khoi dong PostgreSQL

```bash
docker compose up -d
```

Kiem tra container:

```bash
docker compose ps
```

Thong tin mac dinh tu file mau:

- Host: `127.0.0.1`
- Port: `5432`
- Database: `eyewear_system`
- Username: `eyewear_admin`
- Password: `eyewear_secret`
- pgAdmin: `http://127.0.0.1:5050`

Dung lai he thong:

```bash
docker compose down
```

Xoa ca volume database:

```bash
docker compose down -v
```

### 4. Cau hinh backend Laravel

Sao chep file moi truong:

```powershell
Copy-Item backend/.env.example backend/.env
```

Can nhat cac gia tri quan trong trong `backend/.env`:

- `APP_NAME`
- `APP_URL`
- `FRONTEND_URL`
- `DB_CONNECTION=pgsql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `DB_DATABASE=eyewear_system`
- `DB_USERNAME=eyewear_admin`
- `DB_PASSWORD=eyewear_secret`
- `VNPAY_*`

### 5. Quy trinh chuan de chay backend o phase code tiep theo

Khi bat dau khoi tao Laravel thuc te va nap source:

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Backend du kien:

- Base URL: `http://127.0.0.1:8000`
- API prefix: `http://127.0.0.1:8000/api/v1`

### 6. Cau hinh frontend React

Sao chep file moi truong:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Can nhat cac bien trong `frontend/.env`:

- `VITE_APP_URL`
- `VITE_API_BASE_URL`
- `VITE_VNPAY_RETURN_URL`
- `VITE_ENABLE_VIRTUAL_TRY_ON`

### 7. Quy trinh chuan de chay frontend o phase code tiep theo

Khi bat dau khoi tao React app thuc te va nap source:

```bash
cd frontend
npm install
npm run dev
```

Frontend du kien:

- URL: `http://127.0.0.1:5173`

## Thu tu implement de xuat

1. User, role, auth, address, prescription book
2. Product, variant, lens, inventory, promotion
3. Cart, checkout, order, payment, shipment
4. Sales verification, support ticket, return warranty
5. Operations workflow, analytics dashboard, recommendation, virtual try-on

## Tai lieu kem theo

- [docs/project-scope-summary.md](docs/project-scope-summary.md)
- [docs/project-structure.md](docs/project-structure.md)
- [docs/architecture/backend-n-layered.md](docs/architecture/backend-n-layered.md)
- [docs/architecture/frontend-structure.md](docs/architecture/frontend-structure.md)
- [docs/database/schema-outline.md](docs/database/schema-outline.md)
- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

