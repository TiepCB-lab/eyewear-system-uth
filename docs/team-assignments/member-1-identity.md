# 🆔 Member 1 — Identity, Access & User Profiles

**Module Tag**: `M1-IDENTITY`  
**Priority**: 🔴 Highest (Core for all other modules)

---

## 📋 Scope Overview

This member owns the entry point: Login, Registration, Session/Token protection, and User/Staff Profile management. This module provides the `user` and `role` database logic and authentication services that everyone else relies on.

---

## ✅ TODO Checklist
 
 ### Database (Schema)
 - [x] Create `role`, `user`, `profiles` tables in `database/schema.sql`
 - [x] Implement seed data for roles (`database/seeder.php`)
 
 ### Backend — Application Layer (Services)
 - [ ] Complete `AuthService.php`: Register, Login, Logout.
 - [x] Complete `ProfileService.php`: Get info & Update Profile.
 
 ### Backend — Controllers & Routes
 - [ ] Implement `AuthController.php`: `register()`, `login()`, `me()`.
 - [x] Implement `ProfileController.php`: `show()`, `update()`.
 - [ ] Define API Endpoints in `routes/api.php` under `api/auth` prefix.
 
 ### Frontend (Vanilla JS)
 - [x] Finalize `auth/index.html`: Dual Login/Register form.
 - [x] Implement `js/core/rbac.js`: RBAC permission engine.
 - [x] Implement `js/core/layout-guard.js`: Access protection & Layout switching (Staff vs Customer).
 - [x] Finalize login redirection logic in `js/pages/auth.js`.
 - [x] Create `profile.html` module in Dashboard.
 
 ### Testing
 - [ ] Test new user registration (must have default `customer` role).
 - [ ] Test login for each role (Staff to Dashboard, Customer to Shop).
 - [x] Test Route Protection: Staff without Customer role cannot access Shop.
 
 ### 🚀 Final Phase (Integration & Polish)
 - [ ] **Global Error Handling**: Implement persistent 401 (Unauthorized) redirection across all API calls to force re-authentication.
 - [ ] **Missing UI Implementation**: Develop missing static pages (`404.html`, `pages/about/index.html`, `pages/contact/index.html`).
 - [ ] **Profile Purge**: In `pages/accounts/index.html`, replace mock static HTML data for Billing Addresses and Orders with actual Profile API calls.
 
 ---
 
 ## 📁 Files Owned
 
 ### Backend
 - `app/Application/AuthService.php`
 - `app/Application/ProfileService.php`
 - `app/Http/Controllers/Api/V1/AuthController.php`
 - `app/Http/Controllers/Api/V1/ProfileController.php`
 - `database/schema.sql` (User/Profile/Role sections)
 
 ### Frontend
 - `frontend/pages/auth/index.html`
 - `frontend/js/core/rbac.js`
 - `frontend/js/core/layout-guard.js`
 - `frontend/js/pages/auth.js`
 - `frontend/pages/dashboard/modules/profile.html`
 - `frontend/js/services/authService.js`
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

