# Eyewear System UTH

Dự án được tách thành **2 ứng dụng độc lập** để dễ dàng phát triển và gỡ lỗi:

- `backend/`: API (PHP), xử lý logic nghiệp vụ, cơ sở dữ liệu MySQL.
- `frontend/`: Giao diện người dùng (HTML/CSS/JS).

---

## 🛠️ Yêu cầu hệ thống (Prerequisites)

Dự án này yêu cầu các công cụ sau được cài đặt trên máy của mỗi thành viên:

1.  **PHP 8.x** & **MySQL Server**: Khuyên dùng [**XAMPP (Cho Windows)**](https://www.apachefriends.org/index.html) hoặc [**Laragon**](https://laragon.org/download/index.html) vì chúng đã bao gồm cả PHP và MySQL.
2.  **IDE / Code Editor**: Khuyên dùng các công cụ hỗ trợ AI hiện đại như [**Cursor**](https://cursor.sh/), [**Antigravity**](https://antigravity.google/) hoặc bất kỳ trình soạn thảo nào bạn thích.
3.  **Live Server (Extension)**: Dùng để xem trước Frontend (nếu dùng Cursor/VS Code thì chỉ cần cài extension cùng tên).

---

## 🚀 Hướng dẫn chạy dự án dành cho người mới

### Bước 1: Cấu hình Cơ sở dữ liệu (Database)

Bạn cần cài đặt MySQL (thường dùng XAMPP, Laragon hoặc cài rời).

1.  Mở terminal tại thư mục gốc của dự án, sau đó di chuyển vào `backend/` và chạy lệnh tạo file `.env`:
    ```powershell
    cd backend
    copy .env.example .env
    ```
2.  Mở file `.env` vừa tạo và kiểm tra thông tin kết nối (Username/Password của MySQL trên máy bạn).
3.  Truy cập **phpMyAdmin** (thường là `http://localhost/phpmyadmin`) hoặc dùng **MySQL Workbench**:
    - Tạo một Database mới tên là: `eyewear_system`.
    - Bạn có thể xem cấu trúc bảng trong [docs/database/schema-outline.md](docs/database/schema-outline.md).

4.  **Cấu hình Email (Cho chức năng Xác thực/Quên mật khẩu)**:
    - Mở file `.env`, tìm các biến `MAIL_...`.
    - Điền `MAIL_USERNAME` và `MAIL_PASSWORD` (App Password của Gmail) để hệ thống có thể gửi mail xác thực.
      \*Cách lấy `MAIL_PASSWORD`:
      -Vào my accout tài khoảng gmail của bạn.
      -Vào cài đặt bảo mật.
      -Bật xác thực 2 bước.
      -Tạo mật khẩu ứng dụng.
      -Copy mật khẩu ứng dụng vào `MAIL_PASSWORD`.
      -Xoá các khoảng cách trong `MAIL_PASSWORD`.

### Bước 2: Chạy Backend (Dành cho API)

Mở một cửa sổ Terminal mới:

1.  Di chuyển vào thư mục backend:
    ```bash
    cd backend
    ```
2.  Chạy lệnh khởi động server PHP cho Backend:
    ```bash
    php -S localhost:8000 -t public
    ```
3.  **Kiểm tra**: Mở trình duyệt web và truy cập `http://localhost:8000`. Nếu thấy dòng chữ `"Eyewear System UTH Backend API is live"` là thành công.

### Bước 3: Chạy Frontend (Dành cho Giao diện)

Mở thêm một cửa sổ Terminal khác (đừng tắt Terminal của Backend):

1.  Di chuyển vào thư mục frontend:
    ```bash
    cd frontend
    ```
2.  Chạy lệnh khởi động server cho Frontend:
    ```bash
    php -S localhost:5500
    ```
3.  **Kiểm tra**: Mở trình duyệt web và truy cập `http://localhost:5500`. Bạn sẽ thấy giao diện trang chủ cực đẹp và có thể nhấn nút để test các module.

---

## 🏗️ Cấu trúc thư mục chi tiết

### Backend (`/backend`)

- `core/`: Framework cốt lõi (Router, Database, Model) — **Pure PHP, không dùng Laravel**.
- `app/Http/`: Chứa Controller (Xử lý request) và Middleware.
- `app/Application/`: Chứa các Service (Xử lý logic nghiệp vụ).
- `app/Domain/`: Chứa các quy tắc kinh doanh cốt lõi.
- `app/Infrastructure/`: Chứa các Repository (Lưu trữ và kết nối DB).
- `app/Models/`: Chứa các thực thể dữ liệu (kế thừa `Core\Model`).
- `database/schema.sql`: Toàn bộ cấu trúc bảng SQL.

### Frontend (`/frontend/src`)

- `pages/`: Các trang giao diện chính (Login, Catalog, Cart...).
- `components/`: Các thành phần tái sử dụng (Header, Footer, ProductCard...).
- `assets/`: Chứa file CSS, Hình ảnh và JavaScript hỗ trợ.

---

## 📊 Xem dữ liệu MySQL như thế nào?

Bạn hoàn toàn có thể dùng MySQL để xem và quản lý dữ liệu. Có 3 cách phổ biến:

1.  **phpMyAdmin**: Nếu bạn dùng XAMPP, hãy truy cập `http://localhost/phpmyadmin`. Đây là cách dễ nhất cho người mới.
2.  **MySQL Workbench**: Phần mềm chuyên nghiệp của Oracle để thiết kế và xem bảng dữ liệu.
3.  **VS Code Extension**: Cài extension "MySQL" hoặc "SQLTools" để xem database trực tiếp trong VS Code.

---

## 🛠️ Quy định Commit (Git Commit Convention)

Để dự án được quản lý chuyên nghiệp, tất cả thành viên hãy tuân thủ cấu trúc Commit sau:

**Cấu trúc**: `<type>(<scope>): <description>`

- `feat`: Thêm tính năng mới (Ví dụ: `feat(auth): add google login`)
- `fix`: Sửa lỗi (Ví dụ: `fix(cart): fix price calculation error`)
- `docs`: Cập nhật tài liệu (Ví dụ: `docs(readme): update run instructions`)
- `style`: Thay đổi giao diện, CSS, format code (Ví dụ: `style(home): update hero section colors`)
- `refactor`: Tái cấu trúc mã nguồn, không làm thay đổi tính năng (Ví dụ: `refactor(db): change model structure`)
- `chore`: Các công việc phụ trợ, cài đặt môi trường (Ví dụ: `chore(git): add gitkeep files`)

---

## 📄 Documentation Links

- [Project Scope Summary](docs/project-scope-summary.md)
- [Architecture & Structure](docs/project-structure.md)
- [Team Assignments & Process](docs/team-assignments/)
