import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@maplab-oss/helloworld-trpc";
import { apiBaseUrl } from "./config";

const baseUrl = apiBaseUrl ?? "http://localhost:8000";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${baseUrl}/trpc`,
      transformer: superjson,
    }),
  ],
});
