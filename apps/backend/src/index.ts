import Fastify from "fastify";
import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { isProd, port } from "./config";
import { appRouter } from "@maplab-oss/helloworld-trpc/server";

const app = Fastify({
  trustProxy: true,
});

const frontendUrl = "https://node-monorepo-template.vercel.app";

await app.register(cors, {
  origin: isProd ? [frontendUrl] : true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

await app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter },
});

app.get("/health", (_, reply) => reply.status(200).send({ ok: true }));

try {
  await app.listen({ port, host: isProd ? "0.0.0.0" : undefined });
  console.log(`Fastify running at http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
