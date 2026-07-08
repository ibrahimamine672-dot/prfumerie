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
  // Production: relative path (nginx proxy handles /api/ -> backend)
  : nodeEnv.NODE_ENV === 'production'
  ? '/api'
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
