# Frontend Architecture & Structure

This document outlines the organization and architectural principles of the React-based frontend. The structure is designed for maximum modularity, ease of testing, and clear developer hand-off.

## 🛠️ Architectural Principles

The project follows a component-driven and layer-separated approach:

- **Views (`pages`)**: Core components tied to specific routes.
- **Components**: Reusable UI blocks, categorized by scope.
- **Infrastructure (`services`, `store`, `contexts`)**: Layers handle external communication and state management.
- **Support Layer**: A collection of cross-cutting concerns (types, utils, hooks, styles).

---

## 📂 Directory Breakdown

### 1. View Layer (Pages)
- **Directory**: `src/pages/`
- **Responsibilities**:
  - Each directory corresponds to a high-level route.
  - Acts as a container for data fetching and page-level layout orchestration.
- **Core Modules**: `auth`, `home`, `catalog`, `recommendation`, `prescription`, `cart`, `checkout`, `orders`, `support`, `admin`, `sales`, `operations`.

### 2. Component Layer
- **Directory**: `src/components/`
- **Responsibilities**:
  - Houses all reusable UI components.
  - Divided by functional scope to prevent a cluttered directory.
- **Sub-folders**:
  - `common/`: Buttons, Inputs, Modals, Loaders.
  - `forms/`: Form wrappers, field validations.
  - `layout/`: Navbar, Footer, Sidebar, Breadcrumbs.
  - `product/`: Product cards, Grid views, Quick-view modals.
  - `charts/`: Data visualization components for admin dashboards.

### 3. State & System Layers
- **Directories**: `src/services/`, `src/store/`, `src/contexts/`
- **Responsibilities**:
  - **Services**: Manages API clients (e.g., Axios), endpoint definitions, and specific resource services (e.g., `OrderService`).
  - **Store**: Global state management (Auth session, Cart persistence).
  - **Contexts**: Handles lightweight global states such as Notifications or UI Theme toggles.

### 4. Support & Utilities
- **Directories**: `src/hooks/`, `src/types/`, `src/utils/`, `src/constants/`, `src/config/`, `src/styles/`
- **Responsibilities**:
  - **Hooks**: Shared React logic (e.g., `useDebounce`, `useAuth`).
  - **Types**: Unified TypeScript interfaces for domain models and API payloads.
  - **Utils**: Helper functions for currency formatting, date parsing, and math.
  - **Constants**: Fixed values like API base URLs, Route paths, and Status codes.
  - **Styles**: Global tokens, CSS variables, and shared utility classes.

---

## 🗺️ Business Logic Mapping

| Business Domain | Primary Directories |
| :--- | :--- |
| **System Admin & Identity** | `pages/auth`, `pages/prescription`, `contexts/AuthContext` |
| **Product Catalog** | `pages/home`, `pages/catalog`, `components/product` |
| **Smart Recommendation** | `pages/recommendation`, `services/AiService` |
| **Shopping & Commerce** | `pages/cart`, `pages/checkout`, `pages/orders`, `store/useCart` |
| **Support & Verification** | `pages/support`, `pages/sales` |
| **Operational Workflow** | `pages/operations`, `pages/admin` |



