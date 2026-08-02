import { defineConfig } from 'vitest/config';

// Tests hit a single shared dev Postgres database (no per-test isolation),
// and some Lab 2 tests mutate table-wide state (e.g. deactivating every
// RequesterUser to exercise the "no active requesters" case) and restore it
// afterward. Running test files in parallel would race on that shared state,
// so files run sequentially.
export default defineConfig({
  test: {
    fileParallelism: false,
  },
});
