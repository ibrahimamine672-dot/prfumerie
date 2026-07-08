/**
 * Central error handler middleware.
 *
 * Handles:
 * - Mongoose CastError (invalid ObjectId, number, etc.) → 400 generic
 * - Mongoose ValidationError (schema validation) → 400 generic
 * - MongoDB duplicate key (code 11000) → 400 generic
 * - Generic errors → uses res.statusCode or falls back to 500
 */
const errorHandler = (err, req, res, next) => {
  // Determine the status code: use the one already set on the response, or 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Default to original message (safe for most cases)
  let message = err.message;

  // ---- Mongoose / MongoDB known errors ----
  if (err.name === 'CastError') {
    // e.g. 'Cast to string failed for value "{}" (type Object) at path "email" for model "User"'
    return res.status(400).json({ message: 'Invalid request data' });
  }

  if (err.name === 'ValidationError') {
    // Mongoose schema validation — could leak field paths
    return res.status(400).json({ message: 'Invalid request data' });
  }

  if (err.code === 11000) {
    // MongoDB duplicate key — could leak which field is duplicated
    return res.status(400).json({ message: 'Duplicate value. This record already exists.' });
  }

  // ---- Generic error ----
  const response = {
    message,
  };

  // Only include stack trace in non-production (never leak to clients in production)
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
