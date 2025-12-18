export const env = process.env.APP_ENV ?? "production";
export const isProd = env === "production";
export const isDev = env === "development";
export const port = parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "3000", 10);

// Set FRONTEND_URL manually in Render dashboard after first deploy to restrict CORS
// Format: https://your-frontend-service.onrender.com (or custom domain)
const frontendUrl = process.env.FRONTEND_URL;

export const frontendOrigin = frontendUrl || "";
