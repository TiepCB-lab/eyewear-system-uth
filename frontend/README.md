# Ứng Dụng Frontend (Eyewear System UTH)

Ứng dụng frontend được xây dựng trên nền tảng **Vanilla JavaScript** và **HTML/CSS nguyên bản**, tập trung vào hiệu năng cao, mã nguồn sạch và kiến trúc mô-đun hóa dễ bảo trì.

## 🏗️ Kiến Trúc Hệ Thống

Dự án sử dụng cơ chế **Unified Dashboard Shell** (Vỏ Dashboard Hợp nhất), cho phép quản lý tất cả các vai trò (Role) trong cùng một giao diện duy nhất nhưng vẫn đảm bảo bảo mật và phân tách quyền hạn tuyệt đối.

### Các thành phần cốt lõi:

*   **`js/core/`**: Chứa các logic nền tảng của toàn hệ thống.
    *   `rbac.js`: Động cơ kiểm tra quyền hạn (Role-Based Access Control).
    *   `layout-loader.js`: Tự động nạp Header, Footer, Sidebar dựa trên ngữ cảnh.
    *   `layout-guard.js`: Bảo vệ tuyến đường (Route Guard), ngăn chặn truy cập trái phép giữa Staff và Customer.
*   **`js/services/`**: Các dịch vụ kết nối API (Catalog, Auth, Order, Payment...).
*   **`pages/dashboard/`**:
    *   `index.html`: Cửa ngõ duy nhất của Dashboard Staff.
    *   `modules/`: Các phân đoạn giao diện động (Overview, Inventory, Orders, Users, Analytics...) được nạp vào Shell dựa trên quyền của người dùng.
*   **`layouts/`**: Chứa các thành phần giao diện dùng chung (Partial HTML).

## 🔐 Hệ thống Phân quyền (RBAC)

Chúng ta thực thi chiến lược **Option A (Strict Separation)**:
*   **Customer**: Giao diện mua sắm, giỏ hàng, lịch sử đơn cá nhân.
*   **Staff (Sales, Ops, Manager, Admin)**: Chỉ sử dụng `/dashboard`. Staff không được sử dụng UI của khách hàng để đặt hàng trừ khi có vai trò `customer` đi kèm.
*   **Cơ chế bảo vệ**: Nếu Staff cố truy cập trang Shop mà không có quyền Customer, hệ thống sẽ tự động điều hướng về Dashboard.

## 🛠️ Quy trình Phát triển cho Thành viên

1.  **Giao diện**: Các thành viên phát triển module của mình trong thư mục `pages/dashboard/modules/`.
2.  **Logic**: Viết logic JS tương ứng trong `js/dashboard/modules/`.
3.  **Quyền hạn**: Sử dụng thuộc tính `data-permission` trên các phần tử HTML để tự động ẩn/hiện chức năng theo Role.
4.  **Dữ liệu**: Gọi API thông qua các file trong `js/services/`.

---

*Lưu ý: Không thay đổi kiến trúc LayoutLoader và RBAC nếu không có sự thảo luận với Team Leader.*
