# Backend Application

The backend is built with PHP, designed specifically for decoupled API and business logic handling:

- API Routing
- Controllers
- Business Services
- Data Models
- Middleware
- MySQL Database Connectivity
- File Upload Management

## N-Layered Architecture (Revised)

As outlined in the core documentation, the backend follows an N-layered architecture to ensure scalability and maintainability:

- **Presentation Layer** (`app/Http`): Handles HTTP requests, validation, and JSON responses.
- **Application Layer** (`app/Application`): Orchestrates business flows and use cases.
- **Domain Layer** (`app/Domain`): Contains core business logic and entities.
- **Infrastructure Layer** (`app/Infrastructure`): Handles persistence (Repositories) and external integrations.
- **Persistence Layer** (`app/Models`): Database interaction via Eloquent (or equivalent models).

## Project Structure

- `app/Http/Controllers`: Controllers
- `app/Application`: Services and Use Cases
- `app/Domain`: Entities and Business Logic
- `app/Models`: Models
- `app/Infrastructure`: Persistence and Repositories
- `config`: Configuration
- `core`: Framework core/helpers
- `routes`: API routes
- `database`: Migrations and factories
- `public`: Entry points
- `storage`: Log and temporary files
- `TODO.md`: Development task list
