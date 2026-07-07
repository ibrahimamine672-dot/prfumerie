const API_URL = process.env.REACT_APP_API_URL
  // Docker / custom env override
  ? process.env.REACT_APP_API_URL
  // Production: relative path (nginx proxy handles /api/ -> backend)
  : process.env.NODE_ENV === 'production'
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
