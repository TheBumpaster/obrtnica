# Runbook

## Local Development Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

### Initial Setup

1. **Clone and install dependencies**

```bash
pnpm install
```

2. **Start infrastructure services**

```bash
pnpm infra:up
```

This starts:
- PostgreSQL on port 5432
- MongoDB on port 27017
- RabbitMQ on ports 5672 (AMQP) and 15672 (management UI)

3. **Configure environment**

Copy `.env.example` to `.env` and fill in required values:

```bash
cp .env.example .env
```

For local development, the defaults work with `NOTIFICATIONS_DRY_RUN=true`.

4. **Run database migrations**

```bash
pnpm db:migrate
```

5. **Start applications**

In separate terminals:

```bash
pnpm api:dev      # API server on port 3001
pnpm worker:dev   # Background worker
pnpm web:dev      # Next.js web app on port 3000
```

### Project Scripts

All scripts defined in root `package.json`:

- `pnpm lint` - Run ESLint across all packages
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm build` - Build all apps and packages
- `pnpm verify` - Run lint + typecheck + test + build (full verification)

Infrastructure:
- `pnpm infra:up` - Start Docker Compose services
- `pnpm infra:down` - Stop Docker Compose services
- `pnpm infra:reset` - Reset all data and restart services

Database:
- `pnpm db:generate` - Generate Drizzle migration files
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:reset` - Drop all tables and reset schema

Per-app scripts:
- `pnpm <app>:dev` - Start app in dev mode (e.g., `pnpm api:dev`)
- `pnpm <app>:build` - Build app for production

## Architecture Overview

### Data Flow

```
Client Apps (web/mobile/desktop)
  ↓ tRPC
API Server (Express + tRPC)
  ↓ writes to
PostgreSQL (system of record + outbox table)
  ↓ polled by
Worker (outbox dispatcher)
  ↓ publishes to
RabbitMQ
  ↓ consumed by
Worker (event consumers)
  ↓ updates
MongoDB (derived projections)
  ↓ delivers via
Notification Providers (Mailjet/Twilio/FCM/APNs)
```

### Core Principles

1. **Postgres is authoritative** - All critical data lives in Postgres
2. **MongoDB is derived** - Projections can be rebuilt from Postgres + events
3. **Transactional outbox** - Events written atomically with data changes
4. **Idempotent consumers** - Events tracked in `processed_events` table
5. **Retry + DLQ** - Failed messages retry then move to dead-letter queue

## Failure Modes & Recovery

### MongoDB Down

**Impact**: Dashboard/analytics queries fail; read models unavailable.

**Core app behavior**: API and core workflows continue normally. Only analytics/reporting is affected.

**Recovery**:
1. Restart MongoDB: `docker restart serp-mongodb`
2. Rebuild projections if data was lost (see Projection Rebuild below)

### RabbitMQ Down

**Impact**: Events are not dispatched; notifications delayed.

**Core app behavior**: API writes continue; events accumulate in `outbox_events` table.

**Recovery**:
1. Restart RabbitMQ: `docker restart serp-rabbitmq`
2. Outbox dispatcher automatically publishes queued events once queue is available

### Provider Failures

**Impact**: Specific notification channel (email/SMS/push) fails.

**Core app behavior**: Worker logs error, retries per policy, then moves to DLQ. Other channels unaffected.

**Recovery**:
1. Check provider status and credentials
2. Fix configuration if needed
3. Replay messages from DLQ if required

### Worker Crash

**Impact**: Event processing stops; projections become stale.

**Core app behavior**: API continues; events accumulate in RabbitMQ queue.

**Recovery**:
1. Restart worker: `pnpm worker:dev`
2. Worker resumes consuming from queue
3. Idempotency ensures no duplicate processing

## Projection Rebuild

If MongoDB data is lost or corrupt:

1. Stop worker to prevent conflicts
2. Drop MongoDB collections
3. Replay events from `outbox_events` table chronologically
4. Restart worker

(Automation script TBD in future iterations.)

## Debugging

### View RabbitMQ Management UI

Open: http://localhost:15672
- Username: `serp`
- Password: `serp_dev`

Check queue depths, message rates, and DLQ contents.

### Query Outbox Table

```sql
SELECT * FROM outbox_events WHERE published_at IS NULL ORDER BY created_at DESC LIMIT 10;
```

Shows unpublished events waiting to be dispatched.

### Query Processed Events

```sql
SELECT * FROM processed_events ORDER BY processed_at DESC LIMIT 10;
```

Shows recently processed events by worker.

### Check MongoDB Projections

```bash
docker exec -it serp-mongodb mongosh -u serp -p serp_dev --authenticationDatabase admin
```

```js
use serp
db.sample_projections.find().limit(10)
```

## Testing

Run full verification suite before committing:

```bash
pnpm verify
```

For integration tests (requires running infra):

```bash
pnpm infra:up
pnpm db:migrate
pnpm test:integration
```

## Deployment

The architecture is designed for containerized deployment (Docker, Kubernetes, ECS).

- API and Worker are stateless and can scale horizontally
- Postgres, MongoDB, RabbitMQ can be self-hosted or managed services
- Environment variables control all runtime configuration

See `.env.example` for required configuration in production.
