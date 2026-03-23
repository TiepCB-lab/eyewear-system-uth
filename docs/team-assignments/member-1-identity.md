# 👤 Member 1 — System Admin & Identity

**Module Tag**: `M1-IDENTITY`  
**Priority**: 🔴 Critical (must be done first — all other modules depend on this)

---

## 📋 Scope Overview

This member owns the **foundation** of the entire system: Authentication, User Management, Role-Based Access, Address Book, and Prescription Book. Every other module depends on the User/Auth system working correctly.

---

## ✅ TODO Checklist

### Database (Migrations & Seeders)
- [ ] Create `roles` migration (id, name, display_name, description, timestamps)
- [ ] Create `users` migration (id, role_id FK, name, email unique, phone, password, avatar_url, email_verified_at, timestamps)
- [ ] Create `addresses` migration (id, user_id FK, label, recipient_name, phone, street, ward, district, city, is_default, timestamps)
- [ ] Create `prescriptions` migration (id, user_id FK, name, left_sph, left_cyl, left_axis, right_sph, right_cyl, right_axis, pd, note, image_url, timestamps)
- [ ] Create RoleSeeder with 5 default roles (admin, manager, sales, operations, customer)
- [ ] Create AdminUserSeeder with default admin account

### Backend — Models
- [ ] Complete `Role.php` — fillable, relationships
- [ ] Complete `User.php` — fillable, hidden, casts, all relationships
- [ ] Complete `Address.php` — fillable, relationships, scopeDefault
- [ ] Complete `Prescription.php` — fillable, relationships, accessors

### Backend — Domain Layer
- [ ] Finalize `RoleName.php` enum
- [ ] Create `app/Domain/Auth/AuthRepositoryInterface.php`

### Backend — Application Layer
- [ ] Implement `AuthService.php` — register, login, logout, forgot/reset password
- [ ] Implement `PrescriptionBookService.php` — CRUD + image upload

### Backend — Controllers & Routes
- [ ] Implement `AuthController.php` endpoints (register, login, logout, me, forgot/reset)
- [ ] Implement `UserProfileController.php` (profile CRUD, address CRUD)
- [ ] Implement `PrescriptionController.php` (prescription CRUD, image upload)
- [ ] Implement `SystemAdminController.php` (user list, create staff, update role)
- [ ] Define routes in `routes/api.php` under `/api/v1/auth/*`, `/api/v1/profile/*`, etc.
- [ ] Create Form Requests: `RegisterRequest`, `LoginRequest`, `AddressRequest`, `PrescriptionRequest`

### Backend — Middleware & Auth
- [ ] Set up Laravel Sanctum or JWT for API token authentication
- [ ] Create RoleMiddleware to protect admin/staff routes
- [ ] Configure CORS for frontend origin

### Frontend
- [ ] Implement `LoginPage.tsx` with form validation
- [ ] Implement `RegisterPage.tsx` with form validation
- [ ] Implement `ProfilePage.tsx` with edit profile + avatar upload
- [ ] Implement `PrescriptionPage.tsx` with CRUD prescription book
- [ ] Create `AuthContext` or auth store for session management
- [ ] Create `authService.ts` in `services/auth/`
- [ ] Implement protected route guard component

### Testing
- [ ] Write Feature tests for auth endpoints (register, login, me)
- [ ] Write Feature tests for address CRUD
- [ ] Write Feature tests for prescription CRUD

---

## 📁 Files Owned

### Backend
- `app/Models/User.php`, `Role.php`, `Address.php`, `Prescription.php`
- `app/Domain/Shared/RoleName.php`
- `app/Application/Auth/AuthService.php`
- `app/Application/Identity/PrescriptionBookService.php`
- `app/Http/Controllers/Api/V1/AuthController.php`
- `app/Http/Controllers/Api/V1/UserProfileController.php`
- `app/Http/Controllers/Api/V1/PrescriptionController.php`
- `app/Http/Controllers/Api/V1/SystemAdminController.php`
- `database/migrations/*_create_roles_table.php`
- `database/migrations/*_create_users_table.php`
- `database/migrations/*_create_addresses_table.php`
- `database/migrations/*_create_prescriptions_table.php`

### Frontend
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/RegisterPage.tsx`
- `src/pages/auth/ProfilePage.tsx`
- `src/pages/prescription/PrescriptionPage.tsx`
- `src/services/auth/`
- `src/contexts/AuthContext.tsx` (or `src/store/useAuthStore.ts`)

---

## 🔗 Dependencies

- **Depends on**: Nothing (this is the first module)
- **Blocks**: All other modules (everyone needs User & Auth)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Models | 2 days |
| Auth + Profile API | 3 days |
| Admin user management | 1 day |
| Frontend auth pages | 3 days |
| Testing & Integration | 1 day |
| **Total** | **~10 days** |
