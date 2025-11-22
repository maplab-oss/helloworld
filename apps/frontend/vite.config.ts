import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.FRONTEND_VITE_PORT!, 10),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    conditions: ["import"],
    preserveSymlinks: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "scheduler"],
  },
});
