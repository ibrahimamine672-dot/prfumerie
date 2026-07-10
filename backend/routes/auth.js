const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, validateDiscount, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { getStore } = require('../lib/kv-store');

// Strict rate limiter for login — prevents brute-force attacks
// Uses distributed KV store so limits apply across all serverless instances
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 5 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: 'Too many login attempts. Please try again in an hour.'
});

router.post('/register', registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.post('/validate-discount', protect, validateDiscount);

module.exports = router;
