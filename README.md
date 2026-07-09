# AutoQA Tester

**Automated visual regression testing, end to end.** Point it at a URL, and it captures a baseline screenshot, then re-scans on a schedule (or on demand) and flags pixel-level differences — no manual screenshot comparisons, no Percy/Chromatic subscription required.

Built as a full-stack portfolio project to demonstrate production-style engineering: async job orchestration, optimistic locking, self-healing crash recovery, OAuth, and a real CI-friendly deployment pipeline running entirely on free-tier infrastructure.

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
- [Deployment](#deployment)
- [Engineering Deep Dives](#engineering-deep-dives)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

AutoQA Tester lets a user register a website URL and a scan interval. On the first scan, the app takes a full-page screenshot with headless Chrome and stores it as the **baseline**. On every subsequent scan, it captures a fresh screenshot, diffs it pixel-by-pixel against the baseline, and records a pass/fail result along with a visual difference score and a rendered diff image.

It's the kind of tool you'd reach for to catch unintended UI regressions after a deploy — a homepage that silently lost its hero image, a CSS change that broke a layout, a broken font load — without needing a human to eyeball every release.

The project intentionally runs on a **single 512MB instance** on Render's free tier, which shaped a lot of the architectural decisions below (see [Engineering Deep Dives](#engineering-deep-dives)).

---

## Core Features

- 🔐 **Authentication** — email/password (BCrypt + JWT) and Google OAuth, with forgot/reset password flows over email
- 🖼️ **Automated baseline capture** — first scan of any site automatically becomes the reference image
- 🔁 **Scheduled scanning** — background scheduler polls for sites due for a scan based on their configured interval
- ⚡ **Manual "Check Now"** — on-demand scans with per-user rate limiting (4/minute) to prevent abuse
- 🎯 **Pixel-level diffing** — powered by `image-comparison`, producing a percentage match score and a rendered diff overlay
- 🧹 **Baseline management** — reset a site's baseline, or promote any historical scan to become the new baseline
- 📊 **Dashboard** — active/passed/failed counters, recent projects, and full paginated site + report history
- 🛡️ **Per-user data isolation** — ownership checks on every resource (IDOR protection), unique URL constraint scoped per user
- 💥 **Crash recovery** — a stuck "testing" flag left behind by an OOM-killed process is automatically cleared on the next boot
- ☁️ **Cloud-native screenshot storage** — all screenshots live in Cloudinary, not on the ephemeral container filesystem

---

## Architecture

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────────┐
│  React + Vite    │ ────────────────────────▶│   Spring Boot API     │
│  (Vercel/Netlify) │◀──────────────────────── │   (Render, 512MB)     │
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
| API hosting | Render (Docker, free tier, 512MB) |
| Frontend hosting | Vercel / Netlify |
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

---

## Environment Variables

### Backend (`application.properties` reads these from the environment)

| Variable | Description | Example |
|---|---|---|
| `DB_URL` | **Must** be JDBC-formatted, not a standard Postgres URI | `jdbc:postgresql://host:5432/dbname` |
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

> ⚠️ **`DB_URL` gotcha:** Render (and most managed Postgres providers) give you a connection string like `postgres://user:pass@host:5432/db`. Spring's datasource driver needs the `jdbc:` prefix — `jdbc:postgresql://user:pass@host:5432/db` — or the app will fail to boot with an opaque driver error.

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
| `POST` | `/test/sites/{id}/run` | Trigger a manual scan (rate-limited to 4/min/user) |
| `POST` | `/test/sites/{id}/reset` | Wipe the baseline and all reports; next scan becomes the new baseline |
| `PUT` | `/test/sites/{id}/pause` | Pause scheduled scanning |
| `PUT` | `/test/sites/{id}/resume` | Resume scheduled scanning |
| `GET` | `/test/sites/{id}/logs` | Paginated scan history for a site |
| `DELETE` | `/test/sites/{siteId}/logs/{logId}` | Delete a single report |
| `POST` | `/test/sites/{siteId}/logs/{logId}/set-baseline` | Promote a historical scan to be the new baseline |
| `GET` | `/test/logs/{id}` | Get a single report's detail |

All site/report endpoints enforce ownership — requesting a resource that belongs to another user returns a `404` (not `403`), to avoid leaking existence of other users' data (IDOR-safe by design).

---

## Deployment

The app is designed to run comfortably inside Render's **free 512MB** web service tier.

### Backend (Render)

1. Push to your connected GitHub repo — Render will build from the root `Dockerfile`
2. Set all backend environment variables listed above in the Render dashboard
3. Health checks hit `/actuator/health` (Actuator liveness/readiness probes are enabled)

**Docker build is multi-stage:**
- **Build stage** — `eclipse-temurin:17-jdk-jammy`, compiles the jar with `./mvnw clean package`
- **Runtime stage** — `eclipse-temurin:17-jre-jammy` (smaller footprint), installs `google-chrome-stable` from Google's official apt repo (not the Ubuntu snap package, which doesn't play well in headless containers), and runs the jar with explicit heap caps:

```dockerfile
ENTRYPOINT ["java", "-Xmx256m", "-XX:MaxMetaspaceSize=128m", "-jar", "app.jar"]
```

### Frontend (Vercel / Netlify)

- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` includes an SPA rewrite rule so client-side routes (`/dashboard`, `/sites/:id`, etc.) don't 404 on refresh:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

- Set `VITE_API_BASE_URL` to your deployed Render API URL and `VITE_GOOGLE_CLIENT_ID` in the Vercel/Netlify environment settings

### Database (Neon / Supabase)

- Either works; Flyway will run all migrations automatically against a fresh database on first boot (`spring.flyway.baseline-on-migrate=true`)
- Make sure the connection string is converted to `jdbc:postgresql://...` format for `DB_URL`

---

## Engineering Deep Dives

A few of the harder problems this project ran into, and how they were resolved — kept here because the "why" is more interesting than the "what" on a free-tier deployment.

### 1. Surviving 512MB of RAM

Render's free tier gives the whole container 512MB — JVM heap, Chrome, and the OS all have to fit. Chrome alone can easily blow past that if launched with default flags. The fix was a combination of:
- Explicit JVM heap caps (`-Xmx256m -XX:MaxMetaspaceSize=128m`) so the JVM doesn't try to claim headroom Chrome needs
- Aggressive Chrome flags: `--headless=new`, `--no-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`, `--disable-extensions`, plus disabling background networking, sync, translate, and metrics
- A **single-threaded async executor** (`corePoolSize=1`, `maxPoolSize=1`) — only one Chrome instance is ever alive at a time, with up to 50 pending scan jobs queued behind it

### 2. The stale `is_testing` flag problem

If Render OOM-kills the JVM mid-scan, the `finally` block in `QaExecutionService` that resets `is_testing = false` never runs — the site is left permanently "stuck" testing, blocking all future scans (both scheduled and manual). `StaleTestingResetter` listens for `ApplicationReadyEvent` and bulk-clears any stuck `is_testing` flags on every application boot, so a crash never permanently locks a site out of testing.

### 3. Scheduler burst prevention

Naively, `@Scheduled(fixedRate = 60000)` firing the instant every "due" site gets picked up and dispatched to the async executor at once. Two things prevent pile-ups:
- `initialDelay = 30000` — avoids firing immediately as the app finishes booting, before dependent beans are fully warmed up
- `findSitesDueForScan()` implicitly caps dispatch through the single-threaded executor's queue, and each site claim uses `saveAndFlush` + a caught `ObjectOptimisticLockingFailureException` — if a manual "Check Now" and the scheduler race for the same site, only one wins the `@Version`-guarded update; the loser skips cleanly instead of double-scanning

### 4. Why manual "Check Now" over scheduled background scanning for demos

Scheduled scans are unreliable to demo live — you're at the mercy of the cron interval. The dashboard's **Check Now** button gives an instant, deterministic demo flow: click it, watch the frontend poll `/test/sites/{id}` every 2 seconds until `isTesting` flips back to `false`, and see the resulting report immediately.

### 5. Why not Kubernetes or Kafka

Both were seriously considered and deliberately dropped. K8s solves multi-replica orchestration this app doesn't have (it's intentionally a single instance, by design, given the shared in-memory rate limiter and single-threaded Chrome executor). Kafka solves high-throughput event streaming — this app processes a handful of scans per minute at most. Both would add real operational cost and complexity without addressing an actual bottleneck. Free-tier hosting constraints are infrastructure limitations, not code quality gaps, and that distinction is worth being explicit about rather than papering over with tools that don't fit the problem.

---

## Known Limitations

- **Single-instance architecture** — the in-memory rate limiters (`ScanRateLimiterService`, `RateLimitFilter`) and single-threaded Chrome executor assume one running instance. Horizontal scaling would require moving rate-limit state to Redis and likely a dedicated scan-worker service.
- **50-report cap per site** — enforced in the frontend to keep Cloudinary storage and query performance predictable on the free tier; not currently enforced server-side.
- **No visual regions/ignore-zones** — the diff engine compares the full viewport; there's no way yet to mark a region (e.g., a rotating ad banner) as intentionally excluded from comparison beyond the generic ad/banner class-matching heuristic.
- **JDBC URL format friction** — Render/Neon/Supabase connection strings are not JDBC-formatted by default and require manual conversion; a startup-time validation/rewrite could remove this footgun.
- **Chrome cold-start latency** — each scan spins up a fresh Chrome process (no session reuse), which adds a few seconds of overhead per scan in exchange for isolation and stability on constrained memory.

---

## Roadmap

- [ ] README + demo video walkthrough *(in progress — prioritized over further infra work)*
- [ ] Configurable ignore-regions for known-dynamic page areas
- [ ] Email notifications on scan failure
- [ ] Multi-page monitoring per site (not just a single URL)
- [ ] Slack/webhook integration for CI pipelines

---

## License

This project is provided as-is for portfolio and educational purposes.
