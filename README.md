# AutoQA Tester

**Automated visual regression testing, end to end.** Point it at a URL, and it captures a baseline screenshot, then re-scans on a schedule (or on demand) and flags pixel-level differences — no manual screenshot comparisons, no Percy/Chromatic subscription required.

Built as a full-stack portfolio project to demonstrate production-style engineering: async job orchestration, optimistic locking, idempotent job claiming, rate limiting, self-healing crash recovery, OAuth, and a real deployment pipeline.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [How Visual Regression Detection Works](#how-visual-regression-detection-works)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema & Migrations](#database-schema--migrations)
- [API Reference](#api-reference)
- [Concurrency, Idempotency & Rate Limiting](#concurrency-idempotency--rate-limiting)
- [Deployment](#deployment)
- [Engineering Deep Dives](#engineering-deep-dives)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Overview

AutoQA Tester lets a user register a website URL and a scan interval. On the first scan, the app takes a full-page screenshot with headless Chrome and stores it as the **baseline**. On every subsequent scan, it captures a fresh screenshot, diffs it pixel-by-pixel against the baseline, and records a pass/fail result along with a visual difference score and a rendered diff image.

It's the kind of tool you'd reach for to catch unintended UI regressions after a deploy — a homepage that silently lost its hero image, a CSS change that broke a layout, a broken font load — without needing a human to eyeball every release.

---

## Core Features

- **Authentication** — email/password (BCrypt + JWT) and Google OAuth, with forgot/reset password flows over email
- **Automated baseline capture** — first scan of any site automatically becomes the reference image
- **Scheduled scanning** — background scheduler polls for sites due for a scan based on their configured interval
- **Manual "Check Now"** — on-demand scans with per-user rate limiting to prevent abuse
- **Pixel-level diffing** — powered by `image-comparison`, producing a percentage match score and a rendered diff overlay
- **Baseline management** — reset a site's baseline, or promote any historical scan to become the new baseline
- **Dashboard** — active/passed/failed counters, recent projects, and full paginated site + report history
- **Per-user data isolation** — ownership checks on every resource (IDOR protection), unique URL constraint scoped per user
- **Crash recovery** — a stuck "testing" flag left behind by a killed or restarted process is automatically cleared on the next boot
- **Cloud-native screenshot storage** — all screenshots live in Cloudinary, not on the ephemeral container filesystem

---

## Architecture

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────────┐
│  React + Vite     │ ────────────────────────▶│   Spring Boot API     │
│  (Vercel)           │◀──────────────────────── │   (Render)             │
└─────────────────┘                           └──────────┬────────────┘
                                                           │
                        ┌──────────────────────────────────┼───────────────────────────────┐
                        │                                  │                                │
                 ┌──────▼───────┐                 ┌────────▼─────────┐            ┌─────────▼─────────┐
                 │  PostgreSQL   │                 │  Headless Chrome  │            │     Cloudinary      │
                 │ (Neon/Supabase)│                │   (Selenium 4)    │            │  (screenshot store)  │
                 └───────────────┘                 └───────────────────┘            └─────────────────────┘
```

**Request flow for a scan:**

1. Scheduler (or a manual `POST /sites/{id}/run`) claims a site with an optimistic-locked `is_testing` flag
2. An async worker thread spins up headless Chrome, injects CSS to freeze animations/ads/videos, and takes a full-page screenshot
3. The screenshot is uploaded to Cloudinary and compared against the stored baseline URL
4. A `QaLog` row is written with status (`PASS` / `FAIL` / `BASELINE_CREATED`), diff score, and screenshot URLs
5. The `is_testing` flag is cleared in a `finally` block — even on driver crashes or timeouts

---

## Tech Stack

### Backend
| Layer | Choice |
|---|---|
| Framework | Spring Boot 3.2 (Java 17) |
| Persistence | Spring Data JPA / Hibernate |
| Migrations | Flyway |
| Security | Spring Security, JWT (jjwt), Google OAuth (`google-api-client`) |
| Browser automation | Selenium 4.19 + Selenium Manager (auto-resolves ChromeDriver) |
| Image diffing | `image-comparison` (romankh3) |
| Storage | Cloudinary SDK |
| Rate limiting | Bucket4j |
| Email | Spring Mail (Gmail SMTP) |
| Observability | Spring Boot Actuator (health probes) |

### Frontend
| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 |
| Auth | `@react-oauth/google` |

### Infrastructure
| Concern | Choice |
|---|---|
| API hosting | Render (Docker, free tier) |
| Frontend hosting | Vercel |
| Database | Neon or Supabase (managed Postgres) |
| Image storage | Cloudinary |
| Containerization | Docker (multi-stage build) |

---

## How Visual Regression Detection Works

1. **First scan of a site** → no baseline exists yet. The screenshot taken is stored as `baseline_screenshot_path` on the `MonitoredSite`, and the log is marked `BASELINE_CREATED` with a 0% diff score.
2. **Every subsequent scan** → the current baseline image is fetched from its Cloudinary URL and compared pixel-by-pixel against the freshly captured screenshot using `ImageComparison`.
3. If the images match within tolerance → status `PASS`, and the log stores the fresh screenshot (in case you want to inspect a passing scan).
4. If they don't match → status `FAIL`. A rendered diff image (visually highlighting the changed regions) is generated, uploaded to Cloudinary, and linked from the log.
5. **Baseline reset** — you can wipe the baseline entirely (next scan becomes the new baseline) or promote any historical scan's screenshot directly to baseline status via "Set As Default," instantly discarding all reports made against the old baseline.

Before every screenshot, a small JS payload is injected into the page to:
- Disable CSS animations, transitions, and smooth scrolling
- Hide iframes, videos, ads, banners, carousels, and popups (via loose class/id matching)
- Pause any playing media
- Make the caret transparent (avoids flaky diffs from a blinking cursor)

This significantly reduces false positives from dynamic content that has nothing to do with an actual regression.

---

## Project Structure

```
.
├── src/main/java/com/autoqa/
│   ├── config/              # CORS, async executor, stale-flag crash recovery
│   ├── controller/          # AuthController, TestController
│   ├── dto/                 # Request/response payloads
│   ├── entity/               # User, MonitoredSite, QaLog, PasswordResetToken
│   ├── repository/           # Spring Data repositories + StorageService interface
│   ├── security/              # JWT filter/util, rate limiting, user details service
│   └── service/                # Scheduler, execution engine, Cloudinary storage, email
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/          # Flyway V1–V9
├── autoqa-frontend/
│   ├── src/
│   │   ├── api/fetchClient.js  # Centralized fetch wrapper (auth headers, 401 handling)
│   │   ├── components/
│   │   │   ├── auth/             # Login, Signup, ForgotPassword, ResetPassword, ProtectedRoute
│   │   │   └── dashboard/        # Dashboard, Sidebar, Sites, SiteDetails, ReportDetails
│   │   └── context/AuthContext.jsx
│   └── vite.config.js
├── Dockerfile
└── pom.xml
```

---

## Getting Started

### Prerequisites

- Java 17
- Node.js 20+
- A PostgreSQL instance (local, Neon, or Supabase)
- A Cloudinary account (free tier works)
- A Google Cloud OAuth Client ID (for Google Sign-In)
- Google Chrome installed locally (Selenium Manager will resolve the matching driver automatically)

### Backend Setup

```bash
git clone https://github.com/pavlmarg/github_api_scanner.git
cd github_api_scanner

# Configure environment variables (see below), then:
./mvnw spring-boot:run
```

The API will start on `http://localhost:8080`. Flyway will run all pending migrations automatically on startup.

### Frontend Setup

```bash
cd autoqa-frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173` and proxy API calls to `http://localhost:8080/api` by default (configurable via `VITE_API_BASE_URL`).

> Running locally is the recommended way to see scanning actually work — see [The Free-Tier Deployment Attempt](#the-free-tier-deployment-attempt) for why the hosted Render instance can't run Selenium reliably.

---

## Environment Variables

### Backend (`application.properties` reads these from the environment)

| Variable | Description | Example |
|---|---|---|
| `DB_URL` | JDBC-formatted database URL | `jdbc:postgresql://host:5432/dbname` |
| `DB_USERNAME` | Database user | `autoqa_user` |
| `DB_PASSWORD` | Database password | `••••••••` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `••••••••` |
| `JWT_SECRET` | Base64-encoded HMAC signing key | (generate with `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_USERNAME` | Gmail address used for SMTP | `you@gmail.com` |
| `GOOGLE_PASSWORD` | Gmail App Password (not your account password) | `••••••••` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173` |
| `FRONTEND_URL` | Used to build password reset links | `http://localhost:5173` |

Note: `DB_URL` must be JDBC-formatted (`jdbc:postgresql://...`). Managed Postgres providers typically hand you a plain `postgres://` connection string, which needs the `jdbc:` prefix added manually or the app fails to boot with an opaque driver error.

### Frontend (`.env` in `autoqa-frontend/`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api` |
| `VITE_GOOGLE_CLIENT_ID` | Same Google OAuth client ID as backend | `xxxx.apps.googleusercontent.com` |

---

## Database Schema & Migrations

Schema is managed entirely through Flyway migrations (`spring.jpa.hibernate.ddl-auto=validate` — Hibernate never mutates the schema itself).

| Migration | Purpose |
|---|---|
| `V1__init.sql` | Core tables: `users`, `monitored_sites`, `qa_logs` |
| `V2__add_testing_state.sql` | Adds `is_testing` flag to prevent concurrent scans of the same site |
| `V3__add_version_for_optimistic_locking.sql` | Adds `version` column for `@Version`-based optimistic locking |
| `V4__create_password_reset_tokens.sql` | Password reset token table with FK cascade on user deletion |
| `V5__add_provider_column.sql` | Adds `provider` (`LOCAL` / `GOOGLE`) to support dual auth methods |
| `V6__add_isActive_field.sql` | Adds pause/resume capability per site |
| `V7__add_clean_screenshot_path.sql` | Separates the "clean" (undiffed) screenshot from the diff-rendered one |
| `V8__scope_url_unique_per_user.sql` | Moves the URL uniqueness constraint from global to per-user (`user_id, url`) |
| `V9__add_expected_load_time.sql` | Adds column for expected load time comparisons |

### Entity Relationships

```
User (1) ──────< (N) MonitoredSite (1) ──────< (N) QaLog
User (1) ──────< (1) PasswordResetToken
```

- `MonitoredSite` uniqueness is enforced per user (`user_id`, `url`) — two different users can monitor the same URL independently
- `QaLog` cascades on `MonitoredSite` deletion; screenshots are explicitly deleted from Cloudinary before the DB rows are dropped (`StorageService.deleteScreenshot`), avoiding orphaned cloud assets

---

## API Reference

Base path: `/api`

### Auth (`/auth`) — public

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a local account |
| `POST` | `/auth/login` | Authenticate, returns JWT |
| `POST` | `/auth/google/signup` | Create an account from a verified Google ID token |
| `POST` | `/auth/google/login` | Authenticate an existing Google-linked account |
| `POST` | `/auth/forgot-password` | Sends a reset link (always returns 200 to prevent email enumeration) |
| `POST` | `/auth/reset-password` | Consumes a reset token, sets a new password |

### Sites & Scans (`/test`) — requires `Authorization: Bearer <jwt>`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/test/sites` | List all sites owned by the current user, with last scan status |
| `POST` | `/test/sites` | Register a new site (`url`, `scanFrequencyMinutes`) |
| `GET` | `/test/sites/{id}` | Get a single site's details |
| `PUT` | `/test/sites/{id}` | Update scan frequency |
| `DELETE` | `/test/sites/{id}` | Delete a site and all associated reports/screenshots |
| `POST` | `/test/sites/{id}/run` | Trigger a manual scan (rate-limited per user) |
| `POST` | `/test/sites/{id}/reset` | Wipe the baseline and all reports; next scan becomes the new baseline |
| `PUT` | `/test/sites/{id}/pause` | Pause scheduled scanning |
| `PUT` | `/test/sites/{id}/resume` | Resume scheduled scanning |
| `GET` | `/test/sites/{id}/logs` | Paginated scan history for a site |
| `DELETE` | `/test/sites/{siteId}/logs/{logId}` | Delete a single report |
| `POST` | `/test/sites/{siteId}/logs/{logId}/set-baseline` | Promote a historical scan to be the new baseline |
| `GET` | `/test/logs/{id}` | Get a single report's detail |

All site/report endpoints enforce ownership — requesting a resource that belongs to another user returns a `404` (not `403`), to avoid leaking existence of other users' data (IDOR-safe by design).

---

## Concurrency, Idempotency & Rate Limiting

Because scans can be triggered from two independent sources — the scheduler and a manual "Check Now" click — the system needed a way to guarantee a site is never scanned twice at once, and to protect the (single) Chrome worker from being overwhelmed. Three mechanisms work together here.

### Idempotent job claiming

Every `MonitoredSite` has an `is_testing` boolean and a `@Version` column. Before dispatching a scan, both the scheduler (`QaSchedulerService`) and the manual trigger endpoint (`TestController#runTestForSite`) follow the same pattern:

1. Check `is_testing` — if it's already `true`, reject immediately (`409 Conflict` on the manual endpoint; a silent skip in the scheduler's loop)
2. Set `is_testing = true` and call `saveAndFlush()` — this is where the `@Version` column does its job
3. If another thread already claimed the site between steps 1 and 2, the version mismatch throws `ObjectOptimisticLockingFailureException`, which both call sites catch and treat as "someone else got there first," not an error

This means a manual click and a scheduler tick racing for the same site can never both succeed — exactly one claim wins, and the loser backs off cleanly instead of dispatching a duplicate Chrome process. The `is_testing` flag is always released in a `finally` block in `QaExecutionService`, so even a mid-scan crash doesn't leave the site permanently locked (see [Crash recovery](#engineering-deep-dives) below).

### Threading model

`AsyncConfig` originally provisioned a small thread pool sized for **4 concurrent Selenium workers** (`corePoolSize` / `maxPoolSize` = 4, backed by a 50-slot queue) so that multiple scans could run in parallel. In practice, each headless Chrome instance is memory-heavy enough that running more than one at a time isn't viable inside a memory-constrained container — see [The Free-Tier Deployment Attempt](#the-free-tier-deployment-attempt). The pool was dialed back to a single worker (`corePoolSize` / `maxPoolSize` = 1) so that at most one Chrome process is ever alive at once; everything else queues behind it (up to 50 pending jobs) rather than being dispatched in parallel.

This is a straightforward lever to pull back in the other direction — bumping the pool size to 2–4 workers is a one-line change — but it only makes sense once the underlying memory budget can actually support multiple concurrent Chrome processes (i.e., off the smallest free-tier container).

### Rate limiting (Bucket4j)

Two independent limiters exist for two different threat models:

| Limiter | Scope | Limit | Protects |
|---|---|---|---|
| `ScanRateLimiterService` | Per authenticated user | 4 manual scan triggers / minute, across all of that user's sites | Prevents a user from flooding the single-worker queue with "Check Now" clicks |
| `RateLimitFilter` | Per IP address | 10 requests / minute on `/auth/login`, `/auth/register`, `/auth/forgot-password` | Basic brute-force / credential-stuffing / email-bombing mitigation on unauthenticated endpoints |

Both use in-memory `ConcurrentHashMap<String, Bucket>` token buckets rather than a shared store like Redis — a reasonable simplification for a single-instance deployment, but a known limitation if the app were ever scaled horizontally (see [Known Limitations](#known-limitations)).

---

## Deployment

### The Free-Tier Deployment Attempt

The stack is deployed using entirely free-tier infrastructure: **Render** for the Spring Boot API (Docker), **Vercel** for the React frontend, and **Neon/Supabase** for managed Postgres. The frontend and auth flows work exactly as intended — that's what's live at [github-api-scanner.vercel.app](https://github-api-scanner.vercel.app/signup).

Automated scanning does not currently work reliably on this deployment, and it's worth documenting exactly why rather than glossing over it.

Render's free tier caps the container at **512MB of RAM**, shared between the JVM and everything else the process spawns. The JVM's own footprint is kept intentionally small (`-Xmx256m -XX:MaxMetaspaceSize=128m`), but a scan doesn't just run inside the JVM — it also spawns a **headless Chrome process** via Selenium to actually load and screenshot the target page. Even with aggressive flags (`--headless=new`, `--disable-gpu`, `--disable-extensions`, `--disable-dev-shm-usage`, background networking/sync/translate all disabled), a single Chrome instance typically needs several hundred MB to render a real webpage — more if the target site is JS- or image-heavy. JVM baseline plus one Chrome process comfortably exceeds 512MB, and Render kills the container with an out-of-memory error mid-scan.

This is why the threading model above was dialed back from 4 concurrent workers to 1 — running even a single Chrome instance is already right at the memory ceiling, so running multiple in parallel was never going to fit. Reducing concurrency bought some stability for lightweight scans, but doesn't fix the underlying problem: one full Chrome instance is, by itself, too much for this container size once you account for everything else already resident in memory.

The other Render/Neon/Vercel-specific friction encountered along the way (JDBC URL formatting, Ubuntu's snap-packaged Chromium not working headlessly in a container, CORS/env var wiring across three separate platforms) is all resolved and documented inline in the codebase — the memory ceiling is the one constraint that isn't a matter of configuration and would require a different infrastructure shape to fully resolve. The realistic paths forward:

1. **Decouple the scan worker** — keep the API on Render, but run the actual Selenium/Chrome execution on a separate service with more available memory, triggered via webhook or queue.
2. **Use a hosted screenshot API** (e.g., Browserless, ScreenshotOne, urlbox.io) instead of running Chrome in-process — trades a per-request cost for removing the memory problem entirely.
3. **Upgrade the container tier** — the simplest fix, at the cost of it no longer being a fully free deployment.

For now, the honest state of the project is: **fully functional locally, and functional in the cloud except for the scanning pipeline itself**, which is a known, well-understood infrastructure limitation rather than an application bug.

### Backend (Render)

The `Dockerfile` uses a multi-stage build:

- **Build stage** — `eclipse-temurin:17-jdk-jammy`, compiles the jar with `./mvnw clean package`
- **Runtime stage** — `eclipse-temurin:17-jre-jammy`, installs `google-chrome-stable` from Google's official apt repository (not the Ubuntu snap package, which doesn't run headlessly inside a container), and runs the jar with explicit heap caps:

```dockerfile
ENTRYPOINT ["java", "-Xmx256m", "-XX:MaxMetaspaceSize=128m", "-jar", "app.jar"]
```

Set all backend environment variables listed above in the Render dashboard. Health checks hit `/actuator/health` (Actuator liveness/readiness probes are enabled).

### Frontend (Vercel)

- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` includes an SPA rewrite rule so client-side routes (`/dashboard`, `/sites/:id`, etc.) don't 404 on refresh:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

- Set `VITE_API_BASE_URL` to the deployed Render API URL and `VITE_GOOGLE_CLIENT_ID` in Vercel's environment settings

### Database (Neon / Supabase)

Flyway runs all migrations automatically against a fresh database on first boot (`spring.flyway.baseline-on-migrate=true`). The connection string from either provider needs converting to `jdbc:postgresql://...` format for `DB_URL` — see [Environment Variables](#environment-variables).

---

## Engineering Deep Dives

A few of the more interesting problems this project ran into, kept here because the "why" is more useful than the "what."

### Crash recovery for the `is_testing` flag

If the backend process dies mid-scan (an OOM kill, a restart, a crashed container), the `finally` block in `QaExecutionService` that resets `is_testing = false` never runs — the site is left permanently "stuck" testing, blocking both scheduled and manual scans indefinitely. `StaleTestingResetter` listens for `ApplicationReadyEvent` and bulk-clears any stuck `is_testing` flags on every application boot, so a crash never permanently locks a site out of testing.

### Why manual "Check Now" for demos

Scheduled scans are unreliable to demo live since you're at the mercy of the cron interval. The dashboard's "Check Now" button gives an instant, deterministic flow instead: click it, watch the frontend poll `/test/sites/{id}` every 2 seconds until `isTesting` flips back to `false`, and see the resulting report immediately.

### Why not Kubernetes or Kafka

Both were seriously considered and deliberately dropped. Kubernetes solves multi-replica orchestration this app doesn't have (it's intentionally a single instance, given the shared in-memory rate limiter and single-threaded Chrome executor). Kafka solves high-throughput event streaming — this app processes a handful of scans per minute at most. Both would add real operational cost and complexity without addressing the app's actual bottleneck, which is memory per scan, not throughput.

### Screenshot capture stability

Each scan injects a small JS payload before capturing (see [How Visual Regression Detection Works](#how-visual-regression-detection-works)) and uses `PageLoadStrategy.EAGER` with a bounded timeout, so a single slow-loading page can't hang a scan indefinitely. The WebDriver is always torn down in a `finally` block, and any failure along the way still produces a `FAIL` log with a reason, rather than silently losing the scan.

---

## Known Limitations

- **Scanning is non-functional on the hosted Render deployment** due to the memory ceiling described in [The Free-Tier Deployment Attempt](#the-free-tier-deployment-attempt). Run the project locally to exercise the full scanning pipeline.
- **Single-instance architecture** — the in-memory rate limiters (`ScanRateLimiterService`, `RateLimitFilter`) and single-threaded Chrome executor assume one running instance. Horizontal scaling would require moving rate-limit state to Redis and likely a dedicated scan-worker service.
- **50-report cap per site** — enforced in the frontend to keep Cloudinary storage and query performance predictable; not currently enforced server-side.
- **No visual regions/ignore-zones** — the diff engine compares the full viewport; there's no way yet to mark a region (e.g., a rotating ad banner) as intentionally excluded from comparison beyond the generic ad/banner class-matching heuristic.
- **Chrome cold-start latency** — each scan spins up a fresh Chrome process (no session reuse), which adds a few seconds of overhead per scan in exchange for isolation and stability.

---

## Live Demo

**[github-api-scanner.vercel.app](https://github-api-scanner.vercel.app/signup)**

The frontend is deployed and fully functional — you can register, log in, explore the dashboard/UI, add sites and play around with them. The backend API is deployed on Render, but **automated scanning is currently non-functional in this deployment** due to a memory ceiling on Render's free tier. See [Getting Started](#getting-started) if you want to run the whole stack locally, where scanning works end to end.

## License

This project is provided as-is for portfolio and educational purposes.
