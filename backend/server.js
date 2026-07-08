require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { xssSanitize } = require('./middleware/validation');
const connectDB = require('./config/db');
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

// Global rate limiter — relaxed in development, strict in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiter for auth routes (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
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
app.use('/api/admin', require('./routes/admin'));

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
