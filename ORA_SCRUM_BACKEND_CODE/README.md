# ORA SCRUM Backend

A full-featured Golang backend API for the ORA SCRUM project management application.

## Tech Stack

- **Language**: Go 1.21+
- **Framework**: Gin (HTTP Router)
- **Database**: PostgreSQL 16
- **ORM**: Prisma (via prisma-client-go)
- **Cache**: Redis 7
- **Authentication**: JWT with refresh tokens
- **Containerization**: Docker & Docker Compose

## Project Structure

```
ORA_SCRUM_BACKEND/
├── cmd/
│   └── api/
│       └── main.go          # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/        # HTTP request handlers
│   │   └── middleware/      # Auth middleware
│   ├── config/              # Configuration management
│   ├── models/              # Request/Response DTOs
│   ├── repository/          # Database operations
│   └── service/             # Business logic layer
├── prisma/
│   └── schema.prisma        # Database schema
├── Dockerfile               # Production container
├── Dockerfile.migrate       # Migration container
├── docker-compose.yml       # Container orchestration
└── go.mod                   # Go dependencies
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Go 1.21+ (for local development)
- Node.js 18+ (for Prisma CLI)

### Running with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd ORA_SCRUM_BACKEND
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Start the services:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
docker-compose --profile migrate up migrate
```

The API will be available at `http://localhost:8080`

### Local Development

1. Install dependencies:
```bash
go mod download
```

2. Generate Prisma client:
```bash
go run github.com/steebchen/prisma-client-go generate
```

3. Start PostgreSQL and Redis (via Docker):
```bash
docker-compose up -d db redis
```

4. Run migrations:
```bash
npx prisma migrate deploy
```

5. Start the server:
```bash
go run cmd/api/main.go
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update current user |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces` | List user's workspaces |
| POST | `/api/workspaces` | Create a workspace |
| GET | `/api/workspaces/:id` | Get workspace details |
| PUT | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| POST | `/api/workspaces/:id/members` | Add member to workspace |
| DELETE | `/api/workspaces/:id/members/:userId` | Remove member |

### Spaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/:workspaceId/spaces` | List spaces |
| POST | `/api/workspaces/:workspaceId/spaces` | Create a space |
| GET | `/api/spaces/:id` | Get space details |
| PUT | `/api/spaces/:id` | Update space |
| DELETE | `/api/spaces/:id` | Delete space |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spaces/:spaceId/projects` | List projects |
| POST | `/api/spaces/:spaceId/projects` | Create a project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add project member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Sprints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/sprints` | List sprints |
| POST | `/api/projects/:projectId/sprints` | Create a sprint |
| GET | `/api/sprints/:id` | Get sprint details |
| PUT | `/api/sprints/:id` | Update sprint |
| DELETE | `/api/sprints/:id` | Delete sprint |
| POST | `/api/sprints/:id/start` | Start sprint |
| POST | `/api/sprints/:id/complete` | Complete sprint |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/tasks` | List tasks |
| POST | `/api/projects/:projectId/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |
| GET | `/api/tasks/:id/comments` | List comments |

### Labels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/labels` | List labels |
| POST | `/api/projects/:projectId/labels` | Create a label |
| PUT | `/api/labels/:id` | Update label |
| DELETE | `/api/labels/:id` | Delete label |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | PostgreSQL username | postgres |
| `DB_PASSWORD` | PostgreSQL password | postgres |
| `DB_NAME` | Database name | ora_scrum |
| `DB_PORT` | PostgreSQL port | 5432 |
| `API_PORT` | API server port | 8080 |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRY` | Access token expiry (hours) | 24 |
| `REFRESH_EXPIRY` | Refresh token expiry (days) | 7 |
| `ENVIRONMENT` | Runtime environment | development |

## Database Schema

The application uses the following main entities:

- **User**: Application users with authentication
- **Workspace**: Top-level organization unit
- **Space**: Group of related projects within a workspace
- **Project**: Container for sprints and tasks
- **Sprint**: Time-boxed iteration
- **Task**: Work items with status, priority, assignees
- **Label**: Categorization tags for tasks
- **Comment**: Discussion on tasks
- **Attachment**: File attachments on tasks

## Health Check

The API exposes a health check endpoint:
```
GET /health
```

Returns `200 OK` when the service is healthy.

## License

MIT License
