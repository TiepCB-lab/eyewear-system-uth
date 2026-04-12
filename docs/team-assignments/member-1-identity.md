# 🆔 Member 1 — Identity, Access & User Profiles

**Module Tag**: `M1-IDENTITY`  
**Priority**: 🔴 Highest (Core for all other modules)

---

## 📋 Scope Overview

This member owns the entry point: Login, Registration, JWT/Sanctum protection, and User/Staff Profile management. This module provides the `User` models and `auth` middleware that everyone else relies on.

---

## ✅ TODO Checklist

### Database (Migrations)
- [ ] Create `users` migration (id, name, email, password, role enum: admin, staff, customer, timestamps)
- [ ] Create `profiles` migration (id, user_id FK, phone, address, avatar, birthdate, timestamps)
- [ ] Create `password_reset_tokens` table (add to `database/schema.sql`)

### Backend — Models
- [ ] Complete `User.php` — fillable, hidden, casts, hasOne Profile
- [ ] Complete `Profile.php` — fillable, belongsTo User

### Backend — Application Layer
- [ ] Implement `AuthService.php`
  - Register (customer only)
  - Login (returns JWT/Sanctum token + user role)
  - Logout (revoke tokens)
  - Reset Password logic
- [ ] Implement `ProfileService.php`
  - Get current profile
  - Update profile details
  - Upload/Update avatar (storage integration)

### Backend — Controllers & Routes
- [ ] Implement `AuthController.php` (login, register, logout, me)
- [ ] Implement `ProfileController.php` (show, update)
- [ ] Create Form Requests: `LoginRequest`, `RegisterRequest`, `UpdateProfileRequest`
- [ ] Create API Resources: `UserResource`, `ProfileResource`
- [ ] Define routes in `api.php` under `Auth` group

### Frontend
- [ ] Implement `auth/index.html` (Formik/React Hook Form + Validation)
- [ ] Implement `auth/index.html`
- [ ] Implement `ProfilePage.html` (Read/Edit mode)
- [ ] Create `authStore.js` (Zustand) — handle token and user state
- [ ] Create `authService.js` in `src/services/` (Axios calls)
- [ ] Create `PrivateRoute.html` component to protect routes by role

### Testing
- [ ] Feature test for Registration (success/validation error)
- [ ] Feature test for Login (correct vs wrong credentials)
- [ ] Feature test for Protected routes (401 if no token)
- [ ] Feature test for Profile update

---

## 📁 Files Owned

### Backend
- `app/Models/User.php`, `Profile.php`
- `app/Application/Auth/AuthService.php`
- `app/Application/Users/ProfileService.php`
- `app/Http/Controllers/Api/V1/AuthController.php`
- `app/Http/Controllers/Api/V1/ProfileController.php`
- `database/migrations/*_create_users_table.php`, `profiles_table.php`

### Frontend
- `frontend/src/pages/auth/auth/index.html`, `auth/index.html`
- `frontend/src/pages/profile/ProfilePage.html`
- `src/store/authStore.js`
- `src/services/authService.js`, `profileService.js`
- `src/components/auth/PrivateRoute.html`

---

## 🔗 Dependencies

- **Depends on**: Nothing (Base module)
- **Blocks**: Everything (M2, M3, M4, M5 all need `user_id` or `auth` middleware)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Models | 1 day |
| Auth API (JWT/Sanctum) | 2 days |
| Profile API | 1 day |
| Frontend Auth Pages | 3 days |
| Frontend Profile Page | 2 days |
| Testing | 1 day |
| **Total** | **~10 days** |
