## Technical Requirements for Project Setup

### 1) Monorepo & Tooling

* Use a **TurboRepo** monorepo (pnpm recommended) with shared TypeScript configuration and strict type checking.
* Enforce consistent standards via shared:

  * `eslint`, `prettier`, `tsconfig` presets
  * CI scripts for lint, typecheck, test, build

### 2) Applications

**Apps to implement:**

* `apps/web` — **Next.js** (React) web client
* `apps/mobile` — **React Native** (preferably Expo) mobile client
* `apps/desktop` — **Electron** desktop client (Windows/macOS/Linux)
* `apps/api` — **tRPC API** server with runtime adapters
* `apps/worker` — background jobs + messaging consumers (notifications, projections, reindexing)

### 3) Shared Packages

**Core shared packages:**

* `packages/core`

  * UI-agnostic business logic (domain services, constants, utilities)
  * domain events + shared types
* `packages/validations`

  * Zod schemas for inputs/outputs + runtime validation shared across server and clients
* `packages/trpc`

  * shared tRPC router contracts/types, client factory, shared middleware helpers
* `packages/config`

  * shared lint/tsconfig/build configs

> No shared UI library is required; UI stays in each app. Shared “tokens” package is optional.

### 4) API Layer (tRPC + Adapters)

* API must be implemented with **tRPC** as the primary contract and support multiple runtime deployments via adapters:

  * **Express adapter** (container/cluster deployment)
  * **Serverless adapter** (Lambda-like runtime) — optional but supported
* API responsibilities:

  * Auth (custom authentication implementation)
  * Multi-tenant enforcement (org/user scoping)
  * Validation via Zod
  * Rate limiting hooks (may use Redis later, optional)
  * Emission of domain events via Outbox/Queue integration

### 5) Primary Data Store (OLTP)

* Use **PostgreSQL** as the authoritative system of record.
* Use **Drizzle ORM** for:

  * schema definitions
  * migrations
  * typed query layer
* Data model requirements:

  * globally unique IDs (UUID/ULID)
  * `created_at`, `updated_at`, and soft delete (`deleted_at`) where relevant
  * optimistic concurrency mechanism for mutation safety (e.g., `version` or timestamp checks)

### 6) Analytics / Reporting Store (Derived, Disposable)

* Use **MongoDB** as a **derived read model** for fast reporting and dashboard queries.
* MongoDB data must be non-critical:

  * losing analytics data must not break core app workflows
  * analytics must be rebuildable from Postgres + events
* Use “projection documents” designed for fast reads:

  * time-series rollups
  * dashboard snapshots
  * pre-aggregated KPIs
* Define indexing strategy per projection to ensure predictable performance.

### 7) Messaging & Background Processing

* Use **RabbitMQ** as the primary message broker for:

  * async job queues
  * event-driven processing
  * retries + dead-letter queues (DLQ)
* `apps/worker` must handle:

  * consuming domain events / jobs
  * building/updating MongoDB projections
  * sending notifications (push/email/SMS)
  * scheduled jobs (report generation, cleanup, reindex, etc.)
* Required reliability:

  * idempotent consumers
  * message retry policy
  * DLQ + replay support
  * observability of queue depth and failures

### 8) Notifications System

Implement a unified notification subsystem supporting:

**A) In-app notifications**

* Stored in **Postgres** (authoritative user-facing notification history)
* Fields: recipient, type, payload, created_at, read_at, archived_at, delivery status metadata

**B) Push notifications**

* Mobile delivery via:

  * **FCM** (Android)
  * **APNs** (iOS)
* Device registration requirements:

  * store device tokens per user/org
  * handle token refresh and invalid tokens
  * support per-user notification preferences
* Push delivery executed asynchronously via RabbitMQ + worker.

**C) Email notifications**

* Use **Mailjet** as email provider.
* Requirements:

  * template management
  * support transactional and lifecycle emails
  * bounce/complaint handling (if supported by provider webhooks)
* Delivery executed asynchronously via worker.

**D) SMS notifications**

* Use **Twilio** as SMS provider.
* Requirements:

  * phone verification flows if needed
  * support opt-in/out preferences and region formatting
* Delivery executed asynchronously via worker.

### 9) Offline Mode Considerations (Client-Side)

* Mobile and desktop apps must be designed to support offline-capable workflows.
* Core requirement:

  * local persistence layer per client (implementation detail left open)
  * clear separation of “authoritative online state” vs “offline drafts/sync”
* Sync approach must be compatible with:

  * Postgres as source of truth
  * async processing via workers/queues
  * conflict strategy defined per module (at minimum: last-write-wins or version-based resolution)

### 10) Deployment & Portability Requirements

* Architecture must avoid hard AWS lock-in:

  * all core services should be runnable in containers (Docker Compose for dev; Kubernetes/ECS/etc. later)
* Required runtime targets:

  * API runnable as Express server in containers
  * Worker runnable as containerized service
  * Postgres/Mongo/RabbitMQ runnable as self-hosted or managed equivalents
* Environment configuration:

  * strict `.env` schema
  * secrets management strategy defined (platform-agnostic)

### 11) Observability & Operations

* Logging:

  * structured logs (JSON) across API and workers
  * correlation IDs across request → events → jobs
* Metrics:

  * queue depth, consumer lag, job success/failure rates
  * API latency and error rates
* Tracing is optional but recommended (OpenTelemetry-friendly design).

### 12) Security & Multi-tenancy Baseline

* All API calls must enforce:

  * authentication
  * org scoping / RBAC
  * input validation (Zod)
* Notification systems must enforce:

  * user preferences
  * secure storage for device tokens and phone/email identifiers
* Background workers must follow least privilege credentials and scoped access.

### 13) Minimum Deliverables for “Project Setup Complete”

* TurboRepo bootstrapped with all apps/packages wired and building.
* Working tRPC router + client integration in web/mobile/desktop.
* Postgres schema + Drizzle migrations running in local dev.
* RabbitMQ running locally with a worker consuming a sample event.
* MongoDB projections updated from a sample domain event.
* Push/email/SMS providers integrated behind adapters with dry-run mode for dev.
* CI pipeline runs: lint, typecheck, tests, builds for all apps.
