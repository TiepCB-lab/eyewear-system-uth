# Repository Restructuring & Cleanup Plan

The current repository structure is a flat/traditional PHP/HTML structure, but the documentation recently pulled from the GitHub repository specifies a more mature, N-layered architecture. This plan will align the physical repository with the documentation and replace `.gitkeep` files with actual baseline files as requested.

## 🏗️ Backend Restructuring (`backend/app/`)

Goal: Align with `docs/project-structure.md` (N-Layered Architecture).

1.  **Restructure `backend/app/`**:
    - Move existing logic into `Http/`, `Application/`, `Domain/`, `Infrastructure/`, and `Models/`.
2.  **Initialize Baseline Files**:
    - Create empty/skeletal files for all controllers, services, and models mentioned in the `member-*.md` TODO lists.

## ⚛️ Frontend Restructuring (`frontend/`)

Goal: Align with `docs/project-structure.md` (React-style component architecture).

1.  **Consolidate to `src/`**:
    - Create `frontend/src/` and move core directories (`assets`, `components`, `layouts`, `pages`) into it.
    - Create additional mapped directories: `contexts`, `hooks`, `services`, `store`, `types`, `utils`.
2.  **Initialize Baseline Files**:
    - Create skeletal files for the React pages and services mentioned in the assignment docs.

## 🧹 Cleanup Tasks

-   Delete all `.gitkeep` files once directory structures are established.
-   Ensure all project-level documentation (`README.md`, `TODO.md`) is in English.
