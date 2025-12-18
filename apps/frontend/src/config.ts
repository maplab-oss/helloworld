const baseUrl = import.meta.env.VITE_API_BASE_URL;
const backendHost = import.meta.env.VITE_BACKEND_HOST;

export const apiBaseUrl =
  baseUrl || (backendHost && `https://${backendHost}.onrender.com`) || "";
