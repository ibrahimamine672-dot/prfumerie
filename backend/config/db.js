const mongoose = require('mongoose');

let connectionPromise = null;

const CONNECTION_TIMEOUT_MS = 5000;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
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
