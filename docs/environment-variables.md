# Environment Variables Reference

This document provides a complete inventory of all environment variables used in the project, their purpose, data classification, and usage locations.

## Environment File Loading Strategy

The project uses a **root-based environment variable management** system:

1. All environment files are located at the repository root
2. Files are loaded in the following precedence order (later files override earlier ones):
   - `.env` (base configuration)
   - `.env.local` (local overrides, gitignored)
   - `.env.<NODE_ENV>` (e.g., `.env.development`, `.env.production`)
   - `.env.<NODE_ENV>.local` (e.g., `.env.development.local`, gitignored)
3. All apps (`apps/api`, `apps/worker`, `apps/client`) consume the same root env files

See [Runbook](./infrastructure/runbook.md) for setup instructions.

## Data Classification

Environment variables are classified according to [Data Classification Schema](./data-classification.md):

- **RESTRICTED**: Highly sensitive (secrets, API keys) - Never log these values
- **CONFIDENTIAL**: Sensitive but may be needed in logs (with sanitization)
- **INTERNAL**: Non-sensitive operational configuration
- **PUBLIC**: Safe to expose (no secrets)

## Environment Variables Inventory

### Core Runtime Configuration

| Variable | Required | Default | Used By | Classification | Description |
|----------|----------|---------|---------|----------------|-------------|
| `NODE_ENV` | No | `development` | All apps | INTERNAL | Node environment: `development`, `production`, or `test` |
| `LOG_LEVEL` | No | `info` | All apps | INTERNAL | Logging level: `debug`, `info`, `warn`, `error` |

**Usage locations:**
- `apps/api/src/config.ts`
- `apps/worker/src/config.ts`
- `packages/core/src/logger.ts`

---

### API Server Configuration

| Variable | Required | Default | Used By | Classification | Description |
|----------|----------|---------|---------|----------------|-------------|
| `PORT` | No | `3001` | API | INTERNAL | API server port |
| `API_PORT` | No | - | API | INTERNAL | Alternative port variable (used if `PORT` not set) |
| `CORS_ORIGIN` | No | `*` | API | INTERNAL | CORS allowed origin(s). Use specific domain(s) in production |

**Usage locations:**
- `apps/api/src/config.ts`
- `apps/api/src/index.ts`

---

### Database Configuration

| Variable | Required | Default | Used By | Classification | Description |
|----------|----------|---------|---------|----------------|-------------|
| `DATABASE_URL` | Yes | - | API, Worker | RESTRICTED + AUTH | PostgreSQL connection string. Format: `postgresql://user:password@host:port/database` |
| `MONGODB_URL` | Yes | - | Worker | RESTRICTED + INTEGRATIONS | MongoDB connection string. Format: `mongodb://user:password@host:port/database?authSource=admin` (when using root user from docker-compose, `authSource=admin` is required) |

**Usage locations:**
- `apps/api/src/config.ts`
- `apps/api/src/db/index.ts`
- `apps/api/src/db/migrate.ts`
- `apps/api/src/db/reset.ts`
- `apps/api/drizzle.config.ts`
- `apps/worker/src/config.ts`
- `apps/worker/src/db/index.ts`

**Security notes:**
- Contains database credentials - never log full connection strings
- Rotate credentials regularly in production
- Use different credentials per environment

---

### Message Queue Configuration

| Variable | Required | Default | Used By | Classification | Description |
|----------|----------|---------|---------|----------------|-------------|
| `RABBITMQ_URL` | Optional (API), Required (Worker) | - | API, Worker | RESTRICTED + INTEGRATIONS | RabbitMQ connection string. Format: `amqp://user:password@host:port` |

**Usage locations:**
- `apps/api/src/config.ts`
- `apps/worker/src/config.ts`
- `apps/worker/src/queue/connection.ts`

**Security notes:**
- Contains queue credentials - never log full connection strings

---

### Security & Authentication (RESTRICTED)

| Variable | Required | Default | Used By | Classification | Description |
|----------|----------|---------|---------|----------------|-------------|
| `JWT_SECRET` | Yes (production) | `dev-secret-change-in-production` (dev only) | API | RESTRICTED + AUTH | Secret key for signing JWT access tokens |
| `MFA_ENCRYPTION_KEY` | Yes (production) | `dev-mfa-key-change-in-production` (dev only) | API | RESTRICTED + AUTH | Encryption key for encrypting TOTP secrets stored in database |

**Usage locations:**
- `apps/api/src/config.ts`
- `apps/api/src/router/auth.ts` (multiple locations for MFA)
- `apps/api/src/adapters/express.ts`

**Security notes:**
- **CRITICAL**: These secrets are required in production
- Never log these values
- Generate strong random strings: `openssl rand -base64 32`
- Rotate periodically (requires coordinated deployment)
- If compromised, immediately rotate and invalidate all sessions

---

### Worker Configuration

| Variable | Required | Default | Used By | Classification | Description |
|----------|----------|---------|---------|----------------|-------------|
| `WORKER_CONCURRENCY` | No | `5` | Worker | INTERNAL | Number of concurrent message consumers |
| `NOTIFICATIONS_DRY_RUN` | No | `true` | Worker | INTERNAL | If `true`, notifications are logged but not sent (dev mode) |
| `RETRY_MAX_ATTEMPTS` | No | `3` | Worker | INTERNAL | Maximum retry attempts for failed messages |
| `RETRY_INITIAL_DELAY_MS` | No | `1000` | Worker | INTERNAL | Initial retry delay in milliseconds |
| `RETRY_BACKOFF_MULTIPLIER` | No | `2` | Worker | INTERNAL | Exponential backoff multiplier |
| `DLQ_TTL_MS` | No | `60000` | Worker | INTERNAL | Dead-letter queue TTL in milliseconds |
| `APP_BASE_URL` | No | `http://localhost:3000` | Worker | INTERNAL | Base URL for email links and notifications |
| `STORAGE_BASE_PATH` | No | `./.local-storage` | Worker | INTERNAL | Base path for local file storage (GDPR exports) |

**Usage locations:**
- `apps/worker/src/config.ts`
- `apps/worker/src/consumers/auth-email-consumer.ts` (`APP_BASE_URL`)
- `apps/worker/src/consumers/gdpr-export-consumer.ts` (`STORAGE_BASE_PATH`)
- `apps/worker/src/schedulers/jobs/cleanup-expired-exports.ts` (`STORAGE_BASE_PATH`)

---

### Notification Provider Credentials (RESTRICTED)

| Variable | Required | Default | Used By | Classification | Description |
|----------|----------|---------|---------|----------------|-------------|
| `MAILJET_API_KEY` | Optional | - | Worker | RESTRICTED + INTEGRATIONS | Mailjet API key for email delivery |
| `MAILJET_SECRET_KEY` | Optional | - | Worker | RESTRICTED + INTEGRATIONS | Mailjet secret key |
| `MAILJET_TEMPLATE_EMAIL_VERIFICATION` | Optional | `''` | Worker | INTERNAL + INTEGRATIONS | Mailjet template ID for email verification |
| `MAILJET_TEMPLATE_PASSWORD_RESET` | Optional | `''` | Worker | INTERNAL + INTEGRATIONS | Mailjet template ID for password reset |
| `MAILJET_TEMPLATE_MAGIC_LINK` | Optional | `''` | Worker | INTERNAL + INTEGRATIONS | Mailjet template ID for magic link |
| `MAILJET_TEMPLATE_WELCOME` | Optional | `''` | Worker | INTERNAL + INTEGRATIONS | Mailjet template ID for welcome email |
| `MAILJET_TEMPLATE_NOTIFICATION` | Optional | `''` | Worker | INTERNAL + INTEGRATIONS | Mailjet template ID for notifications |
| `TWILIO_ACCOUNT_SID` | Optional | - | Worker | RESTRICTED + INTEGRATIONS | Twilio account SID for SMS delivery |
| `TWILIO_AUTH_TOKEN` | Optional | - | Worker | RESTRICTED + INTEGRATIONS | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Optional | - | Worker | CONFIDENTIAL + INTEGRATIONS | Twilio phone number for sending SMS |
| `FCM_SERVER_KEY` | Optional | - | Worker | RESTRICTED + INTEGRATIONS | Firebase Cloud Messaging server key (Android push) |
| `APNS_KEY_ID` | Optional | - | Worker | RESTRICTED + INTEGRATIONS | Apple Push Notification Service key ID (iOS push) |
| `APNS_TEAM_ID` | Optional | - | Worker | RESTRICTED + INTEGRATIONS | APNs team ID |
| `APNS_BUNDLE_ID` | Optional | - | Worker | INTERNAL + INTEGRATIONS | iOS app bundle ID |
| `APNS_PRIVATE_KEY_PATH` | Optional | - | Worker | RESTRICTED + INTEGRATIONS | Path to APNs private key file |
| `APNS_PRODUCTION` | No | `false` | Worker | INTERNAL | Set to `true` for production APNs, `false` for sandbox |

**Usage locations:**
- `apps/worker/src/config.ts`
- `apps/worker/src/adapters/mailjet-templates.ts` (template IDs)

**Security notes:**
- All provider credentials are RESTRICTED - never log these values
- Rotate credentials if compromised
- Use different credentials per environment
- Template IDs are less sensitive but should not be exposed publicly

---

### Client Configuration

| Variable | Required | Default | Used By | Classification | Description |
|----------|----------|---------|---------|----------------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001/trpc` | Client | PUBLIC | Public API URL (exposed to browser via Next.js `NEXT_PUBLIC_` prefix) |

**Usage locations:**
- `apps/client/src/lib/trpc.ts`

**Notes:**
- Next.js only exposes variables prefixed with `NEXT_PUBLIC_` to the browser
- This value is public and visible in client-side code

---

### Development & CI/CD (Optional)

| Variable | Required | Default | Used By | Classification | Description |
|----------|----------|---------|---------|----------------|-------------|
| `CLIENT_DEV_SERVER_URL` | No | `http://localhost:3000` | Client (Electron) | INTERNAL | Electron dev server URL |
| `TAG` | No | - | CI scripts | INTERNAL | Git tag for versioning |
| `VERSION_CORE` | No | - | CI scripts | INTERNAL | Core version number |
| `RELEASE_CHANNEL` | No | - | CI scripts | INTERNAL | Release channel (stable, beta, etc.) |
| `GITHUB_SHA` | No | - | CI scripts | INTERNAL | GitHub commit SHA (set by CI) |
| `COMMIT_SHA` | No | - | CI scripts | INTERNAL | Commit SHA (fallback for `GITHUB_SHA`) |
| `GITHUB_REF_NAME` | No | - | CI scripts | INTERNAL | GitHub ref name (set by CI) |
| `GITHUB_OUTPUT` | No | - | CI scripts | INTERNAL | GitHub Actions output file path |

**Usage locations:**
- `apps/client/electron/main.ts` (`CLIENT_DEV_SERVER_URL`, `PORT`)
- `scripts/ci/stamp-versions.ts`
- `scripts/ci/derive-release-metadata.ts`

---

## Security Best Practices

### Secrets Management

1. **Never commit secrets**: `.env.local` and `.env.*.local` files are gitignored
2. **Use strong secrets**: Generate secrets with `openssl rand -base64 32`
3. **Rotate regularly**: Rotate `JWT_SECRET` and `MFA_ENCRYPTION_KEY` periodically
4. **Environment separation**: Use different credentials per environment
5. **Never log secrets**: RESTRICTED variables must never appear in logs

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set strong `JWT_SECRET` (not default dev value)
- [ ] Set strong `MFA_ENCRYPTION_KEY` (not default dev value)
- [ ] Set `NOTIFICATIONS_DRY_RUN=false` (if using notifications)
- [ ] Configure provider credentials (`MAILJET_*`, `TWILIO_*`, `FCM_*`, `APNS_*`)
- [ ] Set `CORS_ORIGIN` to specific domain(s), not `*`
- [ ] Use production database URLs
- [ ] Use production queue URLs
- [ ] Set `APNS_PRODUCTION=true` for iOS production push

### Rotation Procedures

**JWT_SECRET rotation:**
1. Generate new secret
2. Deploy with new secret (old tokens will be invalid)
3. Users must re-authenticate

**MFA_ENCRYPTION_KEY rotation:**
1. Generate new key
2. Decrypt existing MFA secrets with old key
3. Re-encrypt with new key
4. Deploy with new key
5. Users do not need to re-enroll MFA

**Provider credentials rotation:**
1. Generate new credentials in provider dashboard
2. Update env vars
3. Deploy (no user impact)

---

## Related Documentation

- [Data Classification Schema](./data-classification.md)
- [Runbook](./infrastructure/runbook.md)
- [Backlog: Environment Management](../backlog/v1.0.0/project_setup/requirement_env-management.md)
