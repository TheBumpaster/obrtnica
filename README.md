# Serp

Multi-platform application with event-driven architecture, built with TypeScript, tRPC, and modern tooling.

## Architecture

This is a **TurboRepo monorepo** containing:

- **3 client apps**: web (Next.js), mobile (Expo), desktop (Electron)
- **2 server apps**: API (Express + tRPC), worker (background jobs)
- **4 shared packages**: core (business logic), validations (Zod schemas), trpc (contracts), config (tooling)

### Tech Stack

- **Language**: TypeScript (strict mode)
- **API**: tRPC + Express
- **Database**: PostgreSQL (Drizzle ORM) - system of record
- **Analytics**: MongoDB - derived projections
- **Queue**: RabbitMQ - event-driven async processing
- **Notifications**: Mailjet (email), Twilio (SMS), FCM/APNs (push)
- **Clients**: Next.js App Router, Expo, Electron + Vite

### Data Flow

```
Clients → tRPC API → Postgres (+ outbox)
                         ↓
                    Worker polls outbox
                         ↓
                    Publishes to RabbitMQ
                         ↓
                    Worker consumes events
                         ↓
            ┌────────────┴────────────┐
            ↓                         ↓
    Update MongoDB              Send Notifications
    (projections)               (email/SMS/push)
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

### Setup

1. **Install dependencies**

```bash
pnpm install
```

2. **Start infrastructure**

```bash
pnpm infra:up
```

Starts PostgreSQL, MongoDB, and RabbitMQ in Docker.

3. **Configure environment**

```bash
cp .env.example .env
```

For local dev, defaults work with `NOTIFICATIONS_DRY_RUN=true`.

4. **Run migrations**

```bash
pnpm db:migrate
```

5. **Start apps**

```bash
# Terminal 1: API
pnpm api:dev

# Terminal 2: Worker
pnpm worker:dev

# Terminal 3: Web app
pnpm web:dev
```

Web app runs on http://localhost:3000  
API runs on http://localhost:3001

## Project Structure

```
.
├── apps/
│   ├── web/          Next.js App Router (web client)
│   ├── mobile/       Expo (mobile client)
│   ├── desktop/      Electron + Vite (desktop client)
│   ├── api/          Express + tRPC (API server)
│   └── worker/       Background jobs + event consumers
├── packages/
│   ├── core/         Business logic + domain events
│   ├── validations/  Zod schemas
│   ├── trpc/         tRPC contracts + middleware
│   └── config/       Shared lint/ts/prettier configs
├── docs/             Documentation
├── backlog/          Versioned feature backlog
└── turbo.json        TurboRepo pipeline config
```

## Commands

### Development

- `pnpm dev` - Start all apps in dev mode
- `pnpm <app>:dev` - Start specific app (e.g., `pnpm api:dev`)

### Quality

- `pnpm lint` - Lint all packages
- `pnpm typecheck` - Type check all packages
- `pnpm test` - Run unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm build` - Build all apps
- `pnpm verify` - Run lint + typecheck + test + build (CI check)

### Infrastructure

- `pnpm infra:up` - Start Docker services
- `pnpm infra:down` - Stop Docker services
- `pnpm infra:reset` - Reset all data and restart

### Database

- `pnpm db:generate` - Generate migration files
- `pnpm db:migrate` - Run migrations
- `pnpm db:reset` - Drop and recreate schema

## Documentation

- [Runbook](docs/infrastructure/runbook.md) - Local setup, commands, debugging
- [Events](docs/infrastructure/events.md) - Domain event catalog
- [Projections](docs/infrastructure/mongo-projections.md) - MongoDB read models
- [Releases](docs/infrastructure/releases.md) - How to create releases and build artifacts

## Architecture Principles

1. **Postgres is authoritative** - All critical data lives in PostgreSQL
2. **MongoDB is derived** - Projections can be rebuilt from Postgres + events
3. **Multi-tenancy mandatory** - All data access scoped by org/tenant
4. **Auth enforced in middleware** - Not in handler bodies
5. **Business logic in `packages/core`** - UI apps are thin
6. **Transactional outbox** - Events written atomically with data
7. **Idempotent consumers** - Safe to process same event multiple times
8. **Offline-safe** - Core workflows continue if derived systems fail

## Testing

Run full verification before committing:

```bash
pnpm verify
```

Integration tests require infrastructure:

```bash
pnpm infra:up
pnpm db:migrate
pnpm test:integration
```

## CI/CD

### Continuous Integration

GitHub Actions pipeline runs on push/PR to `main`/`develop`:
- Lint
- Typecheck
- Tests (with Postgres/Mongo/RabbitMQ services)
- Build

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

### Release Builds

Tag-driven release pipeline builds artifacts for all platforms:
- **Development** (`vX.Y.Z-dev`): Web, Mobile(Android), Desktop(Linux/Windows), API, Worker
- **Staging** (`vX.Y.Z-stage`): All platforms including iOS and macOS
- **Production** (`vX.Y.Z`): All platforms including iOS and macOS

Artifacts are attached to GitHub Releases with auto-generated release notes.

See [docs/infrastructure/releases.md](docs/infrastructure/releases.md) for complete documentation.

## Backlog

Work items are versioned under `backlog/vX.Y.Z/`. Each requirement maps to one release note entry.

Current version: **v1.0.0 (project setup complete)**

## License

Private - All Rights Reserved
