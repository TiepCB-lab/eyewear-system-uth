# Backend Application

The backend is built with **Pure PHP**, designed specifically for decoupled API and business logic handling:

- API Routing (Custom `Core\Router`)
- Controllers
- Business Services
- Data Models (Custom `Core\Model`)
- Middleware
- MySQL Database Connectivity (PDO)
- File Upload Management

## N-Layered Architecture

As outlined in the core documentation, the backend follows an N-layered architecture to ensure scalability and maintainability:

- **Presentation Layer** (`app/Http`): Handles HTTP requests, validation, and JSON responses.
- **Application Layer** (`app/Application`): Orchestrates business flows and use cases.
- **Domain Layer** (`app/Domain`): Contains core business logic and entities.
- **Infrastructure Layer** (`app/Infrastructure`): Handles persistence (Repositories) and external integrations.
- **Persistence Layer** (`app/Models`): Database interaction via `Core\Model` (PDO-based).

## Project Structure

- `app/Http/Controllers`: Controllers
- `app/Application`: Services and Use Cases
- `app/Domain`: Entities and Business Logic
- `app/Models`: Models (extend `Core\Model`)
- `app/Infrastructure`: Persistence and Repositories
- `config`: Configuration
- `core`: Framework core (Router, Database, Model)
- `routes`: API routes
- `database`: Schema SQL file
- `public`: Entry points
- `storage`: Log and temporary files
- `TODO.md`: Development task list
