const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { createOrder, getOrders, getOrderById, getMyOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');
const { createOrderValidation, updateOrderStatusValidation, getOrderByIdValidation } = require('../middleware/validation');
const { getStore } = require('../lib/kv-store');

// Rate limiter for order creation — prevents abuse
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: 'Too many order attempts, please try again later.'
});

// Anyone can create an order (with or without auth) — rate limited
// Uses optional auth middleware — tries to attach user if token provided
router.post('/', orderLimiter, createOrderValidation, (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      const User = require('../models/User');
      User.findById(decoded.id).select('-password').then(user => {
        if (user) req.user = user;
        next();
      }).catch(() => next());
    } catch (e) {
      next();
    }
  } else {
    next();
  }
}, createOrder);

// Get all orders (admin only)
router.get('/', protect, admin, getOrders);

// Get my orders (authenticated user)
router.get('/mine', protect, getMyOrders);

// Update order status (admin only)
router.put('/:id/status', protect, admin, updateOrderStatusValidation, updateOrderStatus);

// Get order by ID
router.get('/:id', protect, getOrderByIdValidation, getOrderById);

module.exports = router;
