const PRODUCTION_API_URL = 'https://prfumerie-backend.vercel.app/api';

// Detect if we're running in a production environment
const isProductionHostname = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0';
};

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};
const nodeEnv = typeof process !== 'undefined' && process.env ? process.env : {};

const normalizeApiUrl = (value) => {
  const trimmed = value.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const configuredApiUrl = viteEnv?.VITE_API_URL || nodeEnv.REACT_APP_API_URL;

const API_URL = configuredApiUrl
  // Vite / CRA / custom env override. Accepts either the backend base URL or a URL ending in /api.
  ? normalizeApiUrl(configuredApiUrl)
  // Production: call the backend deployment directly so admin APIs do not depend on frontend rewrites.
  : nodeEnv.NODE_ENV === 'production' || isProductionHostname()
  ? PRODUCTION_API_URL
  // Local dev: direct backend access
  : 'http://localhost:5002/api';

/**
 * Safely parse JSON from a fetch Response.
 * If the body is empty or not valid JSON, returns an object with a default error message
 * so the calling code never crashes with "Unexpected end of JSON input".
 */
export async function parseJSON(res) {
  try {
    const text = await res.text();
    if (!text) {
      return { message: res.ok ? 'Empty response' : `Request failed with status ${res.status}` };
    }
    return JSON.parse(text);
  } catch {
    return { message: `Request failed with status ${res.status}` };
  }
}

export default API_URL;
