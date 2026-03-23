# Backend N-Layered Architecture

The backend of this project is built on the Laravel framework using an API-first approach. It utilizes a clear N-layered architecture to ensure scalability, testability, and a strict separation of concerns.

## 🎯 Objectives

- **Maintain Laravel Familiarity**: Leverage standard Laravel patterns while extending them for complex business requirements.
- **Decouple Business Logic**: Move complex logic out of Controllers and Eloquent Models.
- **Prevent "Fat" Controllers**: Keep the presentation layer thin and focused only on HTTP concerns.
- **Enable Flexibility**: Facilitate easy swapping of persistence layers (database) or external service implementations.

---

## 🏗️ Architectural Layers

### 1. Presentation Layer
- **Directories**: 
  - `app/Http/Controllers`
  - `app/Http/Requests`
  - `app/Http/Resources`
  - `routes/`
- **Responsibilities**:
  - Accept and route incoming HTTP requests.
  - Validate input payloads via Form Requests.
  - Invoke the appropriate Application services or use cases.
  - Transform and return JSON responses using API Resources.

### 2. Application Layer (Use Cases)
- **Directory**: `app/Application`
- **Responsibilities**:
  - Orchestrate business flows and multi-step use cases.
  - Manage database transactions across multiple domain operations.
  - Call onto Domain contracts (interfaces) for data persistence.
  - Integrate with Infrastructure services for cross-cutting concerns (e.g., mailing, external APIs).
- **Primary Modules**: `Auth`, `Catalog`, `Checkout`, `Identity`, `Sales`, `Operations`, `Support`, `Reports`.

### 3. Domain Layer (Core Business)
- **Directory**: `app/Domain`
- **Responsibilities**:
  - House core business rules and domain logic.
  - Define Repository Interfaces (Contracts) for data management.
  - Contain Domain Enums, Constants, and Policy rules.
- **Examples**: `RoleName`, `OrderStatus`, `PaymentMethod`, `ProductRepositoryInterface`, `OrderRepositoryInterface`.

### 4. Infrastructure Layer
- **Directories**: 
  - `app/Infrastructure/Persistence`
  - `app/Infrastructure/Services`
- **Responsibilities**:
  - Implement Repository Interfaces using Eloquent or other ORMs.
  - Integrate with external gateways (e.g., VNPay, Shipping APIs).
  - Handle low-level operations (e.g., file storage for prescription images).
  - Power advanced logic (e.g., AI Recommendation Engine, Virtual Try-on integration).

---

## 🔄 Relationship with Laravel MVC

The system remains compatible with Laravel's core MVC architecture while introducing additional structure:

- **Model**: Located in `app/Models`, serving purely as data schemas and persistence objects (Eloquent).
- **View**: Handled by the **React Frontend**; the backend serves only as a JSON API provider.
- **Controller**: Located in `app/Http/Controllers`, focusing strictly on presentation and input/output mapping.

By inserting the `Application` and `Domain` layers, we avoid overloading Controllers and Models with business logic (preventing the "Fat Model, Fat Controller" anti-pattern).

---

## 🗺️ Implementation Roadmap

1.  **Identity & Access**: Users, Roles, Addresses, and Authentication.
2.  **Prescription Management**: Digital prescription books and image handling.
3.  **Product Catalog**: Frames, Variants, Lenses, and Inventory systems.
4.  **Commerce Pipeline**: Shopping Cart, Checkout logic, Order management, and Payments.
5.  **Sales Verification**: Administrative review workflow for optical orders.
6.  **Customer Lifecycle**: Support tickets, Warranty claims, and Returns.
7.  **Logistics**: Operational workflows, Laboratory tasks, and Shipment tracking.
8.  **Analytics & Intelligence**: Management dashboards and Smart Recommendation engines.
