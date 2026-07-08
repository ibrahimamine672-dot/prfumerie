/**
 * Distributed rate-limit store using Vercel KV (Upstash Redis).
 *
 * Falls back to the default in-memory store when KV is unavailable
 * (e.g., local development without KV env vars). This ensures the
 * app works both locally and in production without configuration changes.
 */

let redisStore = null;

/**
 * Try to initialize a Redis-backed store for express-rate-limit.
 * Returns null if Vercel KV is not configured (falls back to in-memory).
 */
function createRedisStore() {
  // Only attempt KV initialization if the required env vars are present
  const hasKvUrl = !!(
    process.env.KV_URL ||
    process.env.KV_REST_API_URL
  );
  const hasKvToken = !!process.env.KV_REST_API_TOKEN;

  if (!hasKvUrl || !hasKvToken) {
    console.log(
      '[RATE-LIMIT] Vercel KV not configured — using in-memory store ' +
      '(rate limits are per-instance, not distributed). ' +
      'Set KV_URL (or KV_REST_API_URL) and KV_REST_API_TOKEN to enable distributed rate limiting.'
    );
    return null;
  }

  try {
    const { kv } = require('@vercel/kv');
    const { RedisStore } = require('rate-limit-redis');

    const store = new RedisStore({
      sendCommand: (...args) => kv.call(...args),
    });

    console.log('[RATE-LIMIT] Using Vercel KV as distributed rate-limit store.');
    return store;
  } catch (err) {
    console.warn(
      '[RATE-LIMIT] Failed to initialize Vercel KV store:',
      err.message
    );
    return null;
  }
}

/**
 * Get the shared Redis store instance (singleton).
 */
function getStore() {
  if (redisStore === null) {
    redisStore = createRedisStore();
  }
  return redisStore;
}

module.exports = { getStore };
