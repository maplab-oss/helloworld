# Playwright Setup

This document explains how to set up Playwright E2E tests in the monorepo.

## Package Structure

Create `packages/e2e-tests/` with:

```
packages/e2e-tests/
├── helpers/
│   ├── auth.ts       # Test user login helpers
│   ├── config.ts     # URLs and env config
│   ├── dbReset.ts    # Database reset utilities
│   ├── seed.ts       # Test data seeding
│   ├── testUsers.ts  # Test user definitions
│   └── index.ts
├── tests/
│   └── *.spec.ts
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

### package.json

```json
{
  "name": "@maplab-oss/e2e-tests",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/node": "^20.19.25",
    "mongodb": "^6.8.0"
  }
}
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4185",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "@playwright/test"]
  },
  "include": ["**/*.ts"]
}
```

## Zap Task

Add to `zap.yaml`:

```yaml
tasks:
  e2e:
    cmds:
      - pnpm --filter=@maplab-oss/e2e-tests test
```

Run with: `zap t e2e`

## Database Reset

Tests should reset and seed the database in `beforeAll`:

```typescript
test.beforeAll(async () => {
  await resetDatabase();
  await seedTestUser(TEST_USERS.alice);
});
```

## Multi-User Testing

Playwright supports multiple browser contexts for testing multi-user scenarios:

```typescript
const aliceContext = await browser.newContext();
const alicePage = await aliceContext.newPage();

const bobContext = await browser.newContext();
const bobPage = await bobContext.newPage();
```

Each context has isolated cookies, localStorage, and session state.

## Clerk Integration

When using Clerk for authentication, real Clerk login flows are problematic for E2E tests due to email verification, 2FA, and rate limiting. The recommended approach is to mock Clerk entirely in non-production environments.

### Backend

Read a test user header in non-prod mode (`apps/backend/src/plugins.ts`):

```typescript
const createContext = ({ req }: { req: FastifyRequest }) => {
  let userId: string | undefined;
  if (!isProd) {
    userId = req.headers["x-test-user-id"] as string | undefined;
  }
  return { db, redis, agentQueue, userId };
};
```

### Frontend

Create wrapper hooks that return mock data in test mode:

```typescript
// lib/e2e-mocks/testMode.ts
export const getTestUserId = () => localStorage.getItem("x-test-user-id");
export const isTestMode = () => import.meta.env.DEV && !!getTestUserId();

// lib/e2e-mocks/useAppUser.ts
export const useAppUser = () => {
  const clerkResult = useUser();
  if (isTestMode()) {
    return { isLoaded: true, isSignedIn: true, user: getTestUser() };
  }
  return clerkResult;
};
```

Replace `useUser` imports with `useAppUser` across the frontend.

Update tRPC client to include the header:

```typescript
httpBatchLink({
  url: `${baseUrl}/trpc`,
  headers: () => {
    const testUserId = getTestUserId();
    if (testUserId) return { "x-test-user-id": testUserId };
    return {};
  },
})
```

### Test Helper

```typescript
export async function loginAsTestUser(page: Page, user: TestUser) {
  await page.addInitScript((userId) => {
    window.localStorage.setItem("x-test-user-id", userId);
  }, user.id);

  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.includes("localhost:8421") || url.includes("/trpc")) {
      await route.continue({
        headers: { ...route.request().headers(), "x-test-user-id": user.id },
      });
    } else {
      await route.continue();
    }
  });
}
```

### Key Learnings

- WebSocket connections pass userId via URL query param, not headers
- `page.addInitScript` runs before page scripts load, setting localStorage early
- `page.route` intercepts HTTP requests to inject headers
- Real-time websocket message delivery may require page reloads in tests; this is acceptable for verifying message persistence

