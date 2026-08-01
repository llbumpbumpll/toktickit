# Lab 1 Automated Tests

All tests listed below live under `tests/lab-01` (server) and `client/src` (client), and were passing on `lab1-staging` as of the Issue 4 merge.

## Server (Vitest + Supertest)

| Test file | Test | What it verifies |
|---|---|---|
| `server/tests/lab-01/health.test.ts` | `GET /api/health` should return 200 OK and status ok | Returns HTTP 200 with `{ status: "ok", service: "TokTickIT API" }` |
| `server/tests/lab-01/categories.test.ts` | `GET /api/categories` should return 200 with categories ordered by id | Returns an array of `{ id, name }`, ids in ascending order, and contains the four seeded categories (Account and Access, Hardware, Software, Network) |

Run with:
```bash
cd server
npm run test
```

## Client (Vitest + React Testing Library)

| Test file | Test | What it verifies |
|---|---|---|
| `client/src/App.test.tsx` | renders TokTickIT heading | The `TokTickIT` heading renders on load |
| `client/src/App.test.tsx` | shows loading then online status on a successful health check | Clicking "Check System" shows a loading state, then "System Status: Online" once the health API resolves |
| `client/src/App.test.tsx` | shows a useful error message when the backend is unavailable | Clicking "Check System" shows a clear error message when the health API call fails |
| `client/src/App.test.tsx` | loads and displays the category list from the API, not hard-coded values | Clicking "Check System" shows a loading state, then renders each category name returned by the API |
| `client/src/App.test.tsx` | shows a useful error message when the category list fails to load | Clicking "Check System" shows a clear error message when the categories API call fails |

Run with:
```bash
cd client
npm run test
```

## Summary

- **Total test files:** 3
- **Total tests:** 7 (2 server, 5 client)
- **Result:** all passing on `lab1-staging`
