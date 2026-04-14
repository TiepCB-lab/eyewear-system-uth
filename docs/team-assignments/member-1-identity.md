# 🆔 Member 1 — Identity, Access & User Profiles

**Module Tag**: `M1-IDENTITY`  
**Priority**: 🔴 Highest (Core for all other modules)

---

## 📋 Scope Overview

This member owns the entry point: Login, Registration, Session/Token protection, and User/Staff Profile management. This module provides the `user` and `role` database logic and authentication services that everyone else relies on.

---

## ✅ TODO Checklist

### Database (Schema)
- [x] Create `role` table in `database/schema.sql`
- [x] Create `user` table in `database/schema.sql`
- [x] Create `profiles` table in `database/schema.sql`
- [x] Implement seed data for roles (`database/seeder.php`)

### Backend — Application Layer (Services)
- [ ] Complete `AuthService.php` in `app/Application/`
  - Register (customer only)
  - Login (returns user data + token simulation)
  - Logout
- [ ] Complete `ProfileService.php` in `app/Application/`
  - Get current profile by user ID
  - Update profile details (phone, address, etc.)

### Backend — Controllers & Routes
- [ ] Implement `AuthController.php` in `app/Http/Controllers/Api/V1/`
  - `register()`: Validate name, email, password
  - `login()`: Verify credentials
  - `me()`: Return current authenticated user
- [ ] Implement `ProfileController.php` in `app/Http/Controllers/Api/V1/`
  - `show()`: View personal info
  - `update()`: Save profile changes
- [ ] Define routes in `routes/api.php` under `api/auth` prefix

### Frontend (Vanilla JS)
- [ ] Finalize `src/pages/auth/index.html` (Dual Login/Register form)
- [ ] Implement `src/pages/accounts/index.html` (User profile dashboard)
- [ ] Create `src/services/authService.js` (Fetch API wrappers)
- [ ] Implement `src/components/auth/PrivateRoute.js` logic to protect Dashboard pages

### Testing
- [ ] Test Registration with valid/invalid data (check `user` table)
- [ ] Test Login with existing users (check response roles)
- [ ] Test Profile Update (check `profiles` table updates)

---

## 📁 Files Owned

### Backend
- `app/Application/AuthService.php`
- `app/Application/ProfileService.php`
- `app/Http/Controllers/Api/V1/AuthController.php`
- `app/Http/Controllers/Api/V1/ProfileController.php`
- `database/schema.sql` (User/Profile/Role sections)
- `database/seeder.php` (Role seeding)

### Frontend
- `frontend/src/pages/auth/index.html`
- `frontend/src/pages/accounts/index.html`
- `frontend/src/services/authService.js`
- `frontend/src/components/auth/PrivateRoute.js`

---

## 🔗 Dependencies

- **Depends on**: Nothing (Base module)
- **Blocks**: Everything (M2, M3, M4, M5 all need `user_id` or authentication)

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Database + Seeding | 1 day |
| Auth API Logic | 2 days |
| Profile API Logic | 1 day |
| Frontend Auth UI/Logic | 2 days |
| Frontend Account UI/Logic| 2 days |
| Testing & Validation | 1 day |
| **Total** | **~9 days** |

