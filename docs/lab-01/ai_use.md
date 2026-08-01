# AI Agent Use — Lab 1

**Student:** นาย TA SEN, 69999901
**Agent used:** Claude Code

## Where the agent was used

- **Issue 1 (Project foundation):** Verified each acceptance criterion by actually running the frontend/backend dev servers, hitting the health endpoint, connecting Prisma to PostgreSQL, and running the Vitest/Supertest suites. Found and fixed a real environment bug: `docker-compose.yml` hardcoded the Postgres port (`15432`), which conflicted with an unrelated Postgres container already running on this machine. Made the port configurable via a `DB_PORT` env var instead.
- **Issue 2 (Health check):** Implemented the frontend "Check System" flow — a real `fetch` call to `GET /api/health` with loading, online, and error states — and added Vitest coverage for the success and failure paths. Verified both states manually in the browser (backend up, then backend killed).
- **Issue 3 (Category seed):** Wrote the idempotent Prisma seed script (`upsert`) for the four categories, wired it into `package.json`/`prisma.seed`, and ran it twice against the real database to confirm no duplicates. Also found that `server/prisma/migrations/` was excluded via `.gitignore`, which would have made the migration unreproducible for a teammate cloning the repo — removed that exclusion and committed the existing migration.
- **Issue 4 (Category list):** Added `GET /api/categories` (Prisma `findMany`, ordered by id) with a Supertest test, and extended the frontend to fetch and render the category list (with its own loading/error states) alongside the health status, matching the wireframe in the lab sheet. Verified in the browser with the backend both up and down.
- **Git/GitHub workflow:** Set up and pushed the `main` / `lab1-staging` / `feature/*` branch structure, opened all Pull Requests into `lab1-staging` with test-evidence summaries, and merged after peer approval from `ktps005`.

## What I reviewed and decided myself

- Confirmed every acceptance criterion by actually running the app and tests, not by trusting the agent's claims.
- Decided the port-conflict fix (`DB_PORT` env override) rather than accepting a fixed alternate port, since a fixed port would just move the collision risk to a different value.
- Decided to rewrite `main`/`lab1-staging` history to start from a genuinely empty commit, and reviewed the consequences (force-push, branch ancestry, PR reopening) before approving that operation.
- Reviewed and merged all Pull Requests myself after confirming peer approval on GitHub.

## Responsibility

I remain responsible for all code, tests, commands, and Git operations described above. I reviewed the diffs and test output at each step and did not merge anything I could not explain.
