const mongoose = require('mongoose');

let connectionPromise = null;

const CONNECTION_TIMEOUT_MS = 5000;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Support both MONGODB_URI and MONGODB_URL environment variable names
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;

  if (!uri) {
    throw new Error('Database connection string is not configured. Set MONGODB_URI or MONGODB_URL.');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT_MS,
      connectTimeoutMS: CONNECTION_TIMEOUT_MS
    }).then((conn) => {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
