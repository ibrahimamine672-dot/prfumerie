require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Request timeout — prevents hanging serverless functions on Vercel
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '9000', 10);
app.use((req, res, next) => {
  // Only apply timeout to /api/ routes (not needed for static assets)
  if (!req.path.startsWith('/api/') && req.path !== '/api') {
    return next();
  }
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    res.status(504).json({
      message: 'Request timed out. Please try again.'
    });
  });
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : process.env.NODE_ENV === 'production'
    ? ['https://prfumerie-79sf.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(morgan('dev'));

// Global rate limiter — relaxed in development, strict in production
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20,
  message: 'Too many auth attempts, please try again later.'
});
app.use('/api/auth/', authLimiter);

app.get('/', (req, res) => {
  res.json({
    message: 'Parfumerie API is running',
    status: 'ok'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'parfumerie-backend',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/perfumes', require('./routes/perfumes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));

app.use(errorHandler);

// Catch-all 404 — ensure unmatched /api/* routes always return JSON
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = app;
