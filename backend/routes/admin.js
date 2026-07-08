const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { exportOrdersToExcel } = require('../controllers/orderController');
const { getUsers, getOrders } = require('../controllers/adminController');

// All routes in this file require both authentication and admin authorization
router.use(protect, admin);

// GET /api/admin/orders — List all orders
router.get('/orders', getOrders);

// GET /api/admin/orders/export — Download all orders as an Excel file
// Inline protect + admin middleware ensures this route is always protected
router.get('/orders/export', protect, admin, exportOrdersToExcel);

// GET /api/admin/users — List all users (passwords excluded)
router.get('/users', getUsers);

module.exports = router;
