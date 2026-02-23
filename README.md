# Digital Library API

Modern Digital Library Management System.
An elegant and performant RESTful API built with FastAPI and asynchronous Python stack.

## Feature Overview
The application handles 3 core entities (`User`, `Book`, `Loan`) managed through CRUD operations packed with complex business rules.

### Business Rules & Highlights:
- **Loan Limits**: Maximum of 3 active loans per user.
- **Duration**: 14 days deadline for returns.
- **Late Fee**: R$ 2.00 per late day, calculated automatically.
- **Cache (Redis)**: Book list endpoints are cached for high performance.
- **Rate Limit**: Preventing abuse using SlowAPI (e.g., `10 requests/minute` for main listing).
- **Structured Logging**: Custom interceptor for API call monitoring.
- **Native Documentation**: Swagger OpenAPI interface accessible directly in the browser.
- **Automated Testing**: Integrated test suite backed by strict Pydantic validators.

## Technologies & Architecture
- **FastAPI**: Backend REST Framework (`python-multipart`, `pydantic`).
- **PostgreSQL**: Data persistence managed through Docker.
- **SQLAlchemy (ORM) + Alembic**: DB Abstraction and Schema Migrations.
- **Redis**: Key-Value store for caching on the API layer.
- **Bcrypt**: Secure password hashing.
- **Docker Compose**: Multi-container orchestration.
- **Pytest**: Feature validation and Testing Suite.

## Installation and Execution Instructions

### Prerequisites
- Have **Docker** and **Docker Compose** installed on your machine.
- Free ports `8000` (API), `5432` (Postgres) and `6379` (Redis).

### Steps:
1. Clone the repository (or copy the project structure to your path).
2. **Configure Environment Variables (`.env`)**
   The project uses a `.env` file to separate **Development** and **Production** variables.
   Copy the example file:
   ```bash
   cp .env.example .env
   ```
   *(Edit the `.env` file with strong passwords for production. In dev, default values connect out-of-the-box with Docker).*

3. At the root, where the `docker-compose.yml` file is located, run the following command:
   ```bash
   docker-compose up -d --build
   ```
   *This reads the `.env` file, builds the Python image, downloads and links PostgreSQL and Redis.*

4. **Running Initial Migrations**:
   To safely scaffold the database tables, run Alembic inside the web container:
   ```bash
   docker-compose run --rm web alembic upgrade head
   ```

5. **Access the Documentation (Swagger)**:
   Open in your browser: `http://localhost:8000/docs`

## Running Tests (QA - Internal Validation)
You can run all the application tests by executing:
```bash
docker-compose run --rm web pytest tests/ -v
```

## API Usage Examples

All Data Models (`Schemas`) can be interactively validated on the `/docs` web interface, however, you can use `curl` or any HTTP client (e.g., Insomnia/Postman) to request the routes under the prefix: `http://localhost:8000/api/v1/`

| Feature | Endpoint | Method | Description |
| --- | --- | --- | --- |
| Create User | `/users/` | POST | Requires `name`, `email` and `password` |
| Create Book | `/books/` | POST | Requires `title`, `author_id` (Requires pre-existing Author) |
| List Books | `/books/?skip=0&limit=10` | GET | Paginated and Cached list! |
| Perform Loan | `/loans/` | POST | Payload: `{"user_id": 1, "book_id": 1}`. Validates availability and loan quota. |
| Return Book | `/loans/{loan_id}/return` | POST | Validates fines and releases the book to the library pool |

### Postman Collection
At the project root, you'll find the **`Digital_Library_API.postman_collection.json`** file.
You can import this file into [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) to quickly test all listed routes. The collection natively packs the `{{base_url}}` environment variable pointing to `http://localhost:8000`.
