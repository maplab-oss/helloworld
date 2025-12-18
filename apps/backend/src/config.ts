export const env = process.env.APP_ENV ?? "production";
export const isProd = env === "production";
export const isDev = env === "development";
export const port = parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "3000", 10);

const frontendHost = process.env.FRONTEND_HOST;
const frontendUrl = process.env.FRONTEND_URL;

export const frontendOrigin =
  frontendUrl || (frontendHost && `https://${frontendHost}.onrender.com`) || "";
