# Configuration Pattern

## Structure

Each package/application should have a `src/config/` directory:

- `env.ts` - Environment variables (validated with Zod)
- Other files - System-level constants, domain config, etc.

## Environment Variables

Define and validate all environment variables in `config/env.ts`:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string(),
  DATABASE_URL: z.string(),
});

export const env = envSchema.parse(process.env);
```

Import throughout the codebase:

```typescript
import { env } from './config/env';

const port = env.PORT;
```

## Adding Environment Variables

When adding a new environment variable:

1. Add to `config/env.ts` schema
2. Add to `zap.yaml` (for local development)
3. Add to `.env.example` or source file

## Other Config

Global config goes in separate files:

```typescript
// config/constants.ts
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de'] as const;
export const MAX_MESSAGE_LENGTH = 5000;
export const RATE_LIMIT_WINDOW_MS = 60000;
```

Config belongs in `config/` if it's conceptually global to the package/app. Keep local, non-global config near the code that uses it.

## System Package

Code shared across the entire system goes in `packages/system`. This includes global-level config (environment variables, constants), shared utility functions, and common API helpers. It follows the same conventions: `env.ts` for environment variables, separate files for domain config and constants.
