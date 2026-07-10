/**
 * Shared test utilities for MongoDB integration tests.
 *
 * Provides reusable helpers to start/stop an in-memory MongoDB instance
 * and set up common test environment variables. Reduces boilerplate
 * across integration test files while maintaining total isolation.
 *
 * Usage:
 *
 *   const { setupTestEnvironment, teardownTestEnvironment } = require('./testUtils');
 *
 *   beforeAll(async () => {
 *     ({ mongoServer } = await setupTestEnvironment());
 *     // app = require('../server');  // require AFTER env vars are set
 *   }, 30000);
 *
 *   afterAll(async () => {
 *     await teardownTestEnvironment({ mongoServer });
 *   });
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Default JWT secret used in tests (min 32 chars).
 * Override by setting process.env.JWT_SECRET before calling this function.
 */
const DEFAULT_JWT_SECRET = 'test-jwt-secret-key-not-for-production-12345';

/**
 * Start an in-memory MongoDB instance and set the MONGODB_URI env var.
 *
 * @param {Object} [options]
 * @param {string} [options.jwtSecret]  JWT secret override (default: DEFAULT_JWT_SECRET)
 * @returns {Promise<{ mongoServer: MongoMemoryServer, uri: string }>}
 */
async function setupTestEnvironment(options = {}) {
  // Set core env vars before anything else imports them
  process.env.JWT_SECRET = options.jwtSecret || DEFAULT_JWT_SECRET;

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);

  return { mongoServer, uri };
}

/**
 * Disconnect Mongoose and stop the in-memory MongoDB instance.
 *
 * @param {Object} params
 * @param {MongoMemoryServer} params.mongoServer  The server returned by setupTestEnvironment
 */
async function teardownTestEnvironment({ mongoServer }) {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = {
  setupTestEnvironment,
  teardownTestEnvironment,
  DEFAULT_JWT_SECRET,
};
