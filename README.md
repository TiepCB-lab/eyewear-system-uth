# Eyewear E-commerce System (UTH)

A modern, professional monorepo scaffold for an eyewear e-commerce platform. This project is designed as a comprehensive system for selling eyeglasses, managing prescriptions, and providing a smart shopping experience with virtual try-on features.

[![Project Status: Phase 1](https://img.shields.io/badge/Project%20Status-Phase%201%3A%20Scaffold-blue.svg)](https://github.com/your-repo/eyewear-system-uth)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

This repository serves as the foundational scaffold for the Eyewear System. It follows a monorepo structure, organizing the database, backend, and frontend into a single manageable workspace.

### Core Tech Stack

- **Database**: [MySQL](https://www.mysql.com/)
- **Backend**: [PHP Laravel](https://laravel.com/) - Organized using N-layered architecture within an MVC framework.
- **Frontend**: [React](https://react.dev/) - Modern component-based architecture with separated layers for hooks, contexts, services, and state management.
- **Infrastructure**: Local development environment (MySQL server, PHP, Node.js).

---

## 🚩 Current Project Status: Phase 1 (Scaffold)

The project is currently in the **Scaffolding Phase**.

- [x] Defined directory structure for backend, frontend, and documentation.
- [x] Pre-configured environment variables (`.env.example`).
- [x] Local MySQL configuration templates for backend and project root.
- [ ] Business logic implementation.
- [ ] Full Laravel and React app initialization (Source code to be added in Phase 2).

> [!NOTE]
> The database environment is ready for use. Backend and frontend logic will be implemented in the subsequent development phase.

---

## 🎯 Project Scope

The project covers 5 major business domains as detailed in [docs/project-scope-summary.md](docs/project-scope-summary.md):

1.  **System Admin & Identity**: User management, roles, and prescription books.
2.  **Catalog, Variant & Promotion**: Product management for frames and lenses, inventory, and marketing.
3.  **Shopping Experience & Smart Suggestion**: Face-shape-based recommendations and configuration of prescription glasses.
4.  **Sales & Customer Service**: Order processing, verification, and support ticketing.
5.  **Operations, Logistics & Dashboard**: Laboratory workflow (lens cutting), quality control, shipping, and analytics.

---

## 📂 Project Structure

For a detailed breakdown, please see [docs/project-structure.md](docs/project-structure.md).

```text
.
├── backend/           # Laravel API Core
├── frontend/          # React Single Page Application
├── docs/              # Architectural and Project Documentation
└── .env.example       # Global environment templates
```

---

## 💻 Prerequisites

To begin development, ensure you have the following installed:

- **Git**
- **MySQL Server 8.0+**
- **PHP 8.2+**
- **Composer 2.7+**
- **Node.js 22+**
- **npm 10+**

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/eyewear-system-uth.git
cd eyewear-system-uth
```

### 2. Environment Setup

Copy environment files:

```bash
# Bash
cp .env.example .env
cp backend/.env.example backend/.env

# PowerShell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

The backend `.env` controls Laravel database connectivity.

### 3. Prepare MySQL Database (Without Docker)

Create the database and application user in your local MySQL server:

```bash
mysql -u root -p -e "CREATE DATABASE eyewear_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER 'eyewear_admin'@'localhost' IDENTIFIED BY 'eyewear_secret';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON eyewear_system.* TO 'eyewear_admin'@'localhost'; FLUSH PRIVILEGES;"
```

Default connection values are configured in `backend/.env.example`:
- **Host**: `127.0.0.1`
- **Port**: `3306`
- **Database**: `eyewear_system`
- **User**: `eyewear_admin`

### 4. Backend Configuration

```bash
# Once the source code is populated in Phase 2:
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 5. Frontend Configuration

```bash
# Copy env file
cp frontend/.env.example frontend/.env

# Once the source code is populated in Phase 2:
cd frontend
npm install
npm run dev
```

---

## 🗺️ Implementation Roadmap

1.  **Identity & Core**: Authentication, User Profiles, Addresses, Prescription Management.
2.  **Catalog & Inventory**: Frames, Lenses, Variants, Stock Management, Promotions.
3.  **Checkout & Fulfillment**: Cart, Order Processing, Payment (VNPay), Shipping.
4.  **Customer Support**: Verification workflows, Support tickets, Warranty/Returns.
5.  **Advanced Features**: Lab operations, Analytics dashboards, Smart recommendations, Virtual Try-on.

---

## 📑 Documentation

Explore more detailed documentation in the `docs` folder:
- [Business Scope Summary](docs/project-scope-summary.md)
- [Directory & Architecture Details](docs/project-structure.md)
- [Backend N-Layered Architecture](docs/architecture/backend-n-layered.md)
- [Frontend Structure](docs/architecture/frontend-structure.md)
- [Database Schema Outline](docs/database/schema-outline.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

