# Frontend Architecture & Structure

This document outlines the organization and architectural principles of the Vanilla JavaScript frontend.

## 📂 Directory Breakdown

### 1. View Layer (Pages)
- **Directory**: `pages/`
- **Core Modules**: `shop`, `cart`, `checkout`, `portal` (Admin/Staff), `auth`.
- **Note**: The `portal` directory uses a modular system where content is dynamically injected into a shell.

### 2. Component Layer
- **Directory**: `components/`
- **Sub-folders**: `forms/`, `modals/`, `product/`.
- **Global Layouts**: Located in `layouts/` (header.html, footer.html, sidebar.html).

### 3. Logic Layer (JS)
- **Directory**: `js/`
- **Core**: `js/core/` (RBAC, Layout Loader, App Guard).
- **Services**: `js/services/` (API communication for Catalog, Auth, Order, etc.).
- **Dashboard**: `js/dashboard/` (Logic specific to the Staff Portal).

### 4. Assets & Styling
- **Directory**: `assets/`
- **Contents**: CSS files, images, icons, and fonts.
