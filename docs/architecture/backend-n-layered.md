# Backend N-Layered Architecture

The backend of this project is built on the Laravel framework using an API-first approach. It utilizes a clear N-layered architecture to ensure scalability, testability, and a strict separation of concerns.

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
- **Responsibilities**: Implement Repository Interfaces (Eloquent), integrate with external gateways (VNPay), and handle low-level operations.
