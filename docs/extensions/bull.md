# BullMQ Background Jobs Setup

This guide covers setting up [BullMQ](https://docs.bullmq.io/) for background job processing in your application.

## Architecture

### Components

1. **Queue** - Defines job queues and enqueues jobs
2. **Worker** - Standalone process that processes jobs from queues
3. **Bull Board** - Web UI for monitoring queues (development only)

### Queue Infrastructure in Shared Config

BullMQ connection and queue definitions live in the shared config package since they're used across multiple services (backend, worker, etc).

**Important**: Following the config pattern (see `docs/config.md`), the config package validates environment variables with Zod and uses lazy initialization for queues to avoid circular dependencies.

**`packages/config/src/env.ts`** - Environment validation:

```typescript
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URL: z.string().default("mongodb://localhost:27017/myapp"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

**`packages/config/src/queue.ts`** - Redis connection:

```typescript
import Redis from "ioredis";
import { env } from "./env";

let queueConnection: Redis | null = null;

export const getQueueConnection = (): Redis => {
  if (!queueConnection) {
    queueConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,  // Required for BullMQ
      enableReadyCheck: true,
      ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
      ...(env.REDIS_USERNAME ? { username: env.REDIS_USERNAME } : {}),
    });
  }
  return queueConnection;
};

export const closeQueueConnection = async () => {
  if (queueConnection) {
    await queueConnection.quit();
    queueConnection = null;
  }
};
```

**`packages/config/src/queues.ts`** - Queue definitions (lazy initialization):

```typescript
import { Queue } from "bullmq";
import { getQueueConnection } from "./queue";

let myQueue: Queue | null = null;

export const getMyQueue = (): Queue => {
  if (!myQueue) {
    myQueue = new Queue("myQueueName", {
      connection: getQueueConnection(),
    });
  }
  return myQueue;
};
```

**Why lazy initialization?** Calling `getQueueConnection()` at module initialization time can cause circular dependency issues. Using getter functions ensures the queue is only created when first accessed.

This centralized approach means:
- All services use the same queue instances
- Connection management is in one place
- Easy to add new queues accessible everywhere
- No circular dependency issues

## Setup Steps

### 1. Install Dependencies

Add to your shared config package:
```bash
pnpm add bullmq ioredis
```

Add to your backend (for Bull Board):
```bash
pnpm add @bull-board/api @bull-board/fastify
```

### 2. Add Environment Validation to Config

Create `packages/config/src/env.ts`:
```typescript
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URL: z.string().default("mongodb://localhost:27017/myapp"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

Export from `packages/config/src/index.ts`:
```typescript
export { env } from "./env";
```

### 3. Add BullMQ to Shared Config

Add to `packages/config/package.json`:
```json
{
  "dependencies": {
    "bullmq": "^5.65.1",
    "ioredis": "^5.4.2",
    "zod": "^3.23.8"
  }
}
```

Create `packages/config/src/queue.ts`:
```typescript
import Redis from "ioredis";
import { env } from "./env";

let queueConnection: Redis | null = null;

export const getQueueConnection = (): Redis => {
  if (!queueConnection) {
    queueConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
      ...(env.REDIS_USERNAME ? { username: env.REDIS_USERNAME } : {}),
    });
  }
  return queueConnection;
};

export const closeQueueConnection = async () => {
  if (queueConnection) {
    await queueConnection.quit();
    queueConnection = null;
  }
};
```

Create `packages/config/src/queues.ts` (using lazy initialization):
```typescript
import { Queue } from "bullmq";
import { getQueueConnection } from "./queue";

let myQueue: Queue | null = null;

export const getMyQueue = (): Queue => {
  if (!myQueue) {
    myQueue = new Queue("myQueueName", {
      connection: getQueueConnection(),
    });
  }
  return myQueue;
};
```

**Critical**: Use lazy initialization (getter functions) for queues to avoid circular dependencies. Do not instantiate queues at module initialization time.

Export from `packages/config/src/index.ts`:
```typescript
export { env } from "./env";
export { getQueueConnection, closeQueueConnection } from "./queue";
export { getMyQueue } from "./queues";
```

### 4. Create Worker Logic

Create `packages/<your-package>/src/queue/`:

**worker.ts** - Worker implementation
```typescript
import { Worker, Job as BullJob } from "bullmq";
import { getQueueConnection, closeQueueConnection, getMyQueue } from "@your-org/config";

export interface MyJobData {
  // Define your job data structure
}

let worker: Worker | null = null;

export const startWorker = async (): Promise<Worker> => {
  if (worker) {
    console.log("⚠️ Worker already started");
    return worker;
  }

  const myQueue = getMyQueue();

  worker = new Worker<MyJobData>(
    myQueue.name,
    async (job: BullJob<MyJobData>) => {
      // Process job here
      console.log(`⚡ Processing job ${job.id}`);
      // Your job logic
      return { success: true };
    },
    {
      connection: getQueueConnection(),
      concurrency: 5,
      lockDuration: 60000,
      stalledInterval: 30000,
    },
  );

  worker.on("completed", (job) => {
    console.log(`✔ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`✘ Job ${job?.id} failed:`, err.message);
  });

  console.log("🚀 Worker started");
  return worker;
};

export const stopWorker = async (): Promise<void> => {
  if (!worker) return;
  console.log("🛑 Stopping worker...");
  await worker.close();
  await closeQueueConnection();
  worker = null;
  console.log("✅ Worker stopped");
};
```

### 5. Create Worker App

Create `apps/worker/`:

**package.json**
```json
{
  "name": "@your-org/worker",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "tsx src/index.ts"
  },
  "dependencies": {
    "@your-org/your-queue-package": "workspace:*",
    "tsx": "^4.20.6"
  }
}
```

**src/index.ts**
```typescript
import { startWorker, stopWorker } from "@your-org/your-queue-package";

const main = async () => {
  console.log("🔧 Starting worker process...");
  try {
    await startWorker();
    console.log("✅ Worker is ready");
  } catch (error) {
    console.error("❌ Failed to start worker:", error);
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  console.log(`\n📥 Received ${signal}, shutting down...`);
  await stopWorker();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main();
```

### 6. Add Bull Board (Development UI)

First, add to your backend's `config/env.ts`:

```typescript
const envSchema = z.object({
  // ... existing vars
  BULLBOARD_PORT: z.string().transform(Number),
});
```

Create `apps/backend/src/bullboard.ts`:

```typescript
import Fastify from "fastify";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { getMyQueue } from "@your-org/config";
import { env, isProd } from "./config";

export const startBullBoard = async () => {
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath("/");

  createBullBoard({
    queues: [new BullMQAdapter(getMyQueue())],
    serverAdapter,
  });

  const app = Fastify();
  await app.register(serverAdapter.registerPlugin(), { prefix: "/" });
  
  await app.listen({ 
    port: env.BULLBOARD_PORT, 
    host: isProd ? "0.0.0.0" : undefined 
  });
  
  console.log(`📊 Bull Board running at http://localhost:${env.BULLBOARD_PORT}`);
};
```

Add to your backend's main file (dev only):
```typescript
if (!isProd) {
  const { startBullBoard } = await import("./bullboard");
  await startBullBoard();
}
```

### 7. Update Configuration

**Generate random port:**
```bash
etc/bin/randomport  # e.g., 8949
```

**Add to `.env.base`:**
```bash
BULLBOARD_PORT=8949
```

**Create `docs/bull.md`** with the Bull Board URL:
```markdown
# Bull Board

Queue monitoring UI (development only): http://localhost:8949
```

**Update `zap.yaml`:**
```yaml
bare_metal:
  backend:
    env:
      - BULLBOARD_PORT
  worker:
    aliases: [w]
    cmd: pnpm --filter=@your-org/worker dev
    env:
      - REDIS_URL
      - # Other env vars your jobs need

tasks:
  buildall:
    cmds:
      - pnpm turbo run build --filter=@your-org/worker
      # ... other builds
```

**Update `render.yaml`:**
```yaml
services:
  # worker
  - type: worker
    name: worker
    runtime: node
    repo: https://github.com/your-org/your-app
    plan: starter
    region: singapore
    buildCommand: corepack enable && pnpm install && pnpm turbo run build --filter=@your-org/worker
    startCommand: pnpm --filter=@your-org/worker start
    autoDeployTrigger: commit
    envVars:
    - key: MONGODB_URL
      sync: false
    - key: REDIS_URL
      fromService:
        name: redis
        type: redis
        property: connectionString
    buildFilter:
      paths:
      - apps/worker/**
      - packages/**
      - package.json
      - pnpm-lock.yaml

  # redis
  - type: redis
    name: redis
    region: singapore
    plan: starter
    maxmemoryPolicy: noeviction
    ipAllowList: []
```

## Usage Patterns

### Enqueue a Job

```typescript
import { getMyQueue } from "@your-org/config";

await getMyQueue().add("job-name", {
  // job data
});
```

### With Options

```typescript
import { getMyQueue } from "@your-org/config";

await getMyQueue().add("job-name", jobData, {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
});
```

## Worker Configuration

```typescript
{
  connection: getQueueConnection(),
  concurrency: 5,           // Process N jobs simultaneously
  lockDuration: 60000,      // Max time (ms) to complete a job
  stalledInterval: 30000,   // Check for stalled jobs interval
}
```

- **Concurrency**: Higher for I/O-bound jobs, lower for CPU-bound
- **Lock duration**: Increase for long-running jobs
- **Stalled interval**: How often to check if a worker died mid-job

## Best Practices

1. **Keep jobs idempotent** - Jobs may retry, ensure safe re-execution
2. **Use descriptive job names** - Makes debugging easier
3. **Add job metadata** - Include IDs, timestamps for tracing
4. **Monitor queue depth** - Alert on backlog growth
5. **Set appropriate timeouts** - Prevent infinite jobs
6. **Clean up completed jobs** - Use `removeOnComplete: true`
7. **Separate by priority** - Create different queues for critical vs. background tasks

## Development Commands

```bash
zap start worker     # Start worker
zap logs worker      # View logs
zap ps              # Check status
```

## Monitoring

- **Bull Board**: Visual queue monitoring (dev only)
- **Logs**: Check worker logs for job processing
- **Redis**: Monitor queue depth in Redis

## Adding New Job Types

1. Define job data interface in `worker.ts`
2. Create new queue in `queues.ts`
3. Add worker handler in `startWorker` function
4. Register queue with Bull Board
5. Export queue from package index

## Troubleshooting

### Jobs not processing
- Verify worker is running
- Check Redis connection
- View Bull Board for job status

### Jobs failing
- Check worker logs for errors
- Verify environment variables
- Test job handler in isolation

### Connection issues
- Ensure `maxRetriesPerRequest: null` is set
- Verify Redis URL is correct
- Check for connection leaks on shutdown
