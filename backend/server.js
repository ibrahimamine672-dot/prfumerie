require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { xssSanitize } = require('./middleware/validation');
const { getStore } = require('./lib/kv-store');
const connectDB = require('./config/db');
const { ensureAdminAccount } = require('./config/admin');
const errorHandler = require('./middleware/errorHandler');

// --------------------------------------------------------------------------
// Startup security checks
// --------------------------------------------------------------------------

const JWT_SECRET_MIN_LENGTH = 32;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < JWT_SECRET_MIN_LENGTH) {
  console.error(
    `[SECURITY] JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters long. ` +
    `Current length: ${(process.env.JWT_SECRET || '').length}. ` +
    'Generate a strong secret with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
  process.exit(1);
}

// Warn if running in production without NODE_ENV=production
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV === 'production') {
  console.warn('[SECURITY] Running on Vercel production but NODE_ENV is not set to "production".');
}

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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:', 'http://localhost:5002'],
      connectSrc: ["'self'", 'https://api.mongodb.com'],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  // Strict-Transport-Security: force HTTPS for 1 year, include subdomains, preload
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Prevent MIME-type sniffing
  noSniff: true,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Prevent IE from executing downloaded files in the site's context
  ieNoOpen: true,
  // Block cross-domain requests for better privacy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
// Always allow localhost origins in addition to any configured CLIENT_URL
const defaultProdOrigins = ['https://prfumerie.vercel.app', 'https://prfumerie-79sf.vercel.app'];
const configuredProdOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : [];
const prodOrigins = [...configuredProdOrigins, ...defaultProdOrigins];

// Local development origins that are always permitted
const devOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

const allowedOrigins = [...new Set([...prodOrigins, ...devOrigins])];

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

// XSS sanitization — strip/escape HTML from all text inputs in request body
app.use('/api/', xssSanitize);

app.use(morgan('dev'));

// --------------------------------------------------------------------------
// Rate limiting
// --------------------------------------------------------------------------

const isDev = process.env.NODE_ENV !== 'production';

// Trust the Vercel / proxy headers so rate limiter sees real client IPs
app.set('trust proxy', 1);

// Distributed store (shared across Vercel serverless instances) or in-memory fallback
const kvStore = getStore();

// Global rate limiter — relaxed in development, strict in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: kvStore,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiter for auth routes (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: kvStore,
  message: 'Too many auth attempts, please try again later.'
});
app.use('/api/auth/', authLimiter);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Prfumerie API is running'
  });
});

// Safe health check — returns minimal info, never exposes secrets or internal paths
// Does not require a database connection — returns 200 even if DB is unavailable
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ensure DB connection is available for API routes and admin account exists.
// ensureAdminAccount() is called here (not just in startServer) because Vercel
// serverless functions may never run startServer() — the middleware is the only
// guaranteed execution path in production. The internal provisioningPromise
// cache makes subsequent calls a no-op after the first success.
//
// This runs for ALL paths (not just /api) because Vercel's serverless function
// routing may strip the /api prefix before passing the request to Express.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await ensureAdminAccount();
    next();
  } catch (error) {
    next(error);
  }
});

// ── Route mounting ───────────────────────────────────────────
//
// Each router is mounted at BOTH:
//   /api/name  — used when Vercel preserves the /api prefix (local dev, Docker)
//   /name      — fallback when Vercel strips the /api prefix (serverless routing)
//
// Express processes mounts in order; only the matching one fires.

const perfumesRouter = require('./routes/perfumes');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

app.use('/api/perfumes', perfumesRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// Duplicate mounts without /api prefix for Vercel serverless compatibility
app.use('/perfumes', perfumesRouter);
app.use('/auth', authRouter);
app.use('/orders', ordersRouter);
app.use('/admin', adminRouter);

// Catch-all 404 for unmatched /api/* routes (before error handler — Express skips
// regular middleware when next(err) is called, so 404 handlers must come first)
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Also catch unmatched routes when Vercel strips the /api prefix
app.use('/admin/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use('/orders/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use('/auth/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use('/perfumes/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Catch-all 404 for all other unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — must be the LAST middleware in Express
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  await connectDB();
  await ensureAdminAccount();
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
