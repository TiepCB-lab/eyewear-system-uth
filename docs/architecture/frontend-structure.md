# Frontend Architecture & Structure

This document outlines the organization and architectural principles of the React-based frontend.

## 📂 Directory Breakdown

### 1. View Layer (Pages)
- **Directory**: `src/pages/`
- **Core Modules**: `auth`, `home`, `catalog`, `recommendation`, `prescription`, `cart`, `checkout`, `orders`, `admin`.

### 2. Component Layer
- **Directory**: `src/components/`
- **Sub-folders**: `common/`, `forms/`, `layout/`, `product/`, `charts/`.

### 3. State & System Layers
- **Directories**: `src/services/`, `src/store/`, `src/contexts/`.
- **Responsibilities**: API communication, global state (Auth, Cart), and lightweight contexts.

### 4. Support & Utilities
- **Directories**: `src/hooks/`, `src/types/`, `src/utils/`, `src/constants/`.
