# Project Architecture & Directory Structure

This document provides a comprehensive overview of the project's directory structure and the architectural patterns used for both the backend and frontend.

## 📂 High-Level Structure

```text
.
├── backend/           # PHP Laravel (API-first)
├── frontend/          # React (Vite-based SPA)
├── docs/              # Detailed documentation & diagrams
└── .env.example       # Global environment template
```

---

## 🏗️ Backend Architecture (N-Layered)

The backend follows an N-layered architecture to ensure separation of concerns and maintainability.

### Layer Definitions

| Layer | Path | Responsibility |
| :--- | :--- | :--- |
| **Presentation** | `app/Http` | Handles HTTP requests, routing, and returns API responses. |
| **Application** | `app/Application` | Orchestrates business flows; translates user actions into domain operations. |
| **Domain** | `app/Domain` | Core business logic, entities, and repository interfaces (contracts). |
| **Infrastructure** | `app/Infrastructure` | Implementation of database repositories, external API integrations (VNPay, AI). |
| **Persistence** | `app/Models` | Eloquent models for database interaction. |

---

## 🏗️ Frontend Architecture (Component-Driven)

The frontend is built with React, focusing on a modular and scalable structure.

### Source Directory Mapping (`frontend/src/`)

| Folder | Description |
| :--- | :--- |
| `assets/` | Static files like images, icons, and fonts. |
| `components/` | Reusable UI components (Common, Forms, Layout, Product-specific). |
| `contexts/` | Global React contexts for state sharing (Auth, Theme). |
| `hooks/` | Custom React hooks for shared logic. |
| `layouts/` | Wrapper components for different page structures (Admin, Main). |
| `pages/` | Unique route-based views (Home, ProductDetail, Cart). |
| `services/` | API communication layer using Axios or Fetch. |
| `store/` | Global state management (Zustand or Redux). |
| `types/` | TypeScript interfaces and type definitions. |
| `utils/` | Helper functions and formatting utilities. |
