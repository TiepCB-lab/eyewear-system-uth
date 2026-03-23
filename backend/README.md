# Backend Architecture Overview

The backend of the Eyewear System is built with **Laravel**, using an **API-first** approach. It adheres to an **N-layered architecture** to decouple business logic from infrastructure and presentation layers.

## 🏗️ Architectural Layers

The system is divided into four primary layers:

1.  **Presentation Layer (`Http`)**: Contains Controllers, Requests, and API Resources. It is responsible for handling HTTP routing and formatting JSON responses.
2.  **Application Layer (`Application`)**: Contains Use Case services that orchestrate business flows. This layer acts as a bridge between the API and the Domain.
3.  **Domain Layer (`Domain`)**: The "heart" of the system. Contains business rules, domain entities, Enums, and Repository contracts (interfaces).
4.  **Infrastructure Layer (`Infrastructure`)**: Handles external concerns such as Repository implementations, Third-party service integrations (VNPay, AI Services), and Mailers.

---

## 📂 Core Directories

- `app/Application`: Orchestration logic for each module.
- `app/Domain`: Pure business logic and interface definitions.
- `app/Http`: API presentation (Controllers & Middleware).
- `app/Infrastructure`: Implementation details and external integrations.
- `app/Models`: Laravel Eloquent models for database mapping.
- `database/`: Database schema migrations, factories, and seeders.
- `routes/`: Definitions for API versioned routes.
- `tests/`: Automated unit and feature testing suites.

---

## 🧩 Business Modules

The backend is logically partitioned into the following modules:
- `Auth` & `Identity`
- `Catalog` (Frames & Lenses)
- `Checkout` & `Orders`
- `Sales` (Order Verification)
- `Operations` (Laboratory & Logistics)
- `Support` (Tickets & Returns)
- `Reports` & `Administration`

---

> [!NOTE]
> This directory currently represents the architectural scaffold. Implementation of the core Laravel source code and business logic follows in Phase 2.
