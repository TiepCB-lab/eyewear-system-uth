# Frontend Architecture Overview

The frontend of the Eyewear System is a modern, responsive Single Page Application (SPA) built with **React** and **Vite**. The project structure is optimized for scalability and modularity.

## 📂 Source Directory Structure (`/src`)

- `pages/`: Route-based view components. Each directory represents a specific feature (Auth, Home, Catalog).
- `components/`: Atomic UI components, organized into common, layout, and domain-specific (e.g., `product/`).
- `layouts/`: Master components that define the page structure (Sidebar, Navbar, Footer).
- `services/`: API integration layer. Handles HTTP communication with the backend.
- `store/`: Global state management for persistent data (Auth state, Carts).
- `hooks/`: Reusable custom React hooks for shared component logic.
- `contexts/`: React contexts for lightweight global state (Theme, Error handling).
- `utils/`: Utility functions for formatting (Currency, Dates) and validation.
- `types/`: Comprehensive TypeScript interfaces for API responses and component props.
- `constants/`: Global configurations, API endpoints, and static values.
- `assets/`: Management of static resources (SVG icons, Logos, Placeholders).

---

## 🏗️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React 18+ (Vite) |
| **Styling** | Vanilla CSS / CSS Modules |
| **Routing** | React Router Dom |
| **State Management** | Zustand or React Context |
| **API Client** | Axios |
| **Language** | TypeScript |

---

> [!NOTE]
> This directory serves as the architecture scaffold for the UI. The complete React application source code and styling will be added in Phase 2.
