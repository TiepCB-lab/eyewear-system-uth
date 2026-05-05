# Project Architecture & Directory Structure

This document provides a comprehensive overview of the project's directory structure and the architectural patterns used for both the backend and frontend.

## 📂 High-Level Structure

```text
.
├── backend/           # Pure PHP (API-first, Custom N-Layered Framework)
├── frontend/          # Vanilla JS/HTML/CSS (SPA-style with unified shell)
├── docs/              # Detailed documentation & diagrams
└── .env.example       # Global environment template
```

---

## 🏗️ Backend Architecture (N-Layered)

The backend follows an N-layered architecture to ensure separation of concerns and maintainability.

### Layer Definitions

| Layer | Path | Responsibility |
| :--- | :--- | :--- |
| **Presentation** | `app/Http` | Handles HTTP requests, routing, validation, and JSON responses. |
| **Application** | `app/Application` | Orchestrates business flows; translates user actions into domain operations. |
| **Domain** | `app/Domain` | Core business logic, entities, and repository interfaces. |
| **Infrastructure** | `app/Infrastructure` | Infrastructure concerns: Database wrapper, Env loading, Response helpers. |
| **Persistence** | `app/Models` | Models extending `Core\Model` for database interaction. |

### Core Framework (`core/`)

| File | Description |
| :--- | :--- |
| `Router.php` | Custom routing engine with group/prefix/middleware support. |
| `Database.php` | PDO singleton wrapper for MySQL connectivity. |
| `Model.php` | Base model with CRUD helpers (find, all, where, create, update, delete). |

---

## 🏗️ Frontend Architecture (Component-Driven)

The frontend is built with HTML/CSS/JS, focusing on a modular and maintainable structure.

### Source Directory Mapping (`frontend/`)

| Folder | Description |
| :--- | :--- |
| `assets/` | Static files like images, icons, and fonts. |
| `components/` | Reusable UI components (Modals, Forms, Product, etc.). |
| `pages/` | Route-based views (Shop, Cart, Portal/Dashboard). |
| `js/services/` | API communication layer using Fetch. |
| `js/core/` | Fundamental logic (RBAC, Layout Loading, Auth). |
| `layouts/` | Shared HTML layout components (Header, Footer, Sidebar). |
| `js/dashboard/` | Specific logic for the administrative portal. |
