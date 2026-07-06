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

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || 'https://yourdomain.com'
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
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

app.use('/api/perfumes', require('./routes/perfumes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
