# Backend N-Layered Architecture

The backend of this project is built with **Pure PHP** using an API-first approach. It utilizes a clear N-layered architecture to ensure scalability, testability, and a strict separation of concerns.

## 🏗️ Architectural Layers

### 1. Presentation Layer
- **Directories**: `app/Http/Controllers`, `app/Http/Requests`, `app/Http/Resources`, `routes/`
- **Responsibilities**: Accept and route incoming HTTP requests, validate input payloads, and return JSON responses.

### 2. Application Layer (Use Cases)
- **Directory**: `app/Application`
- **Responsibilities**: Orchestrate business flows, manage transactions, and integrate with Infrastructure services.

### 3. Domain Layer (Core Business)
- **Directory**: `app/Domain`
- **Responsibilities**: House core business rules, entities, and define Repository Interfaces (Contracts).

### 4. Infrastructure Layer
- **Directories**: `app/Infrastructure/Persistence`, `app/Infrastructure/Services`
- **Responsibilities**: Implement Repository Interfaces using PDO, integrate with external gateways (VNPay), and handle low-level operations.

## 🔧 Core Framework (`core/`)

The custom framework provides three essential components:

| Component | File | Description |
| :--- | :--- | :--- |
| **Router** | `core/Router.php` | HTTP method routing, route groups, prefix support, middleware hooks. |
| **Database** | `core/Database.php` | PDO singleton wrapper for MySQL. Auto-initializes from `.env`. |
| **Model** | `core/Model.php` | Base model with `find()`, `all()`, `where()`, `create()`, `update()`, `delete()`. |
