const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, getMyOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

// Anyone can create an order (with or without auth)
// protect is optional - the controller handles user reference gracefully
router.post('/', (req, res, next) => {
  // Extract user if token provided, but don't block if not
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
router.put('/:id/status', protect, admin, updateOrderStatus);

// Get order by ID
router.get('/:id', protect, getOrderById);

module.exports = router;
