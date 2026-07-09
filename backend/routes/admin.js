const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { exportOrdersToExcel, updateOrderFulfillment } = require('../controllers/orderController');
const { getUsers, getOrders } = require('../controllers/adminController');
const { updateOrderFulfillmentValidation } = require('../middleware/validation');

// All routes in this file require both authentication and admin authorization
router.use(protect, admin);

// GET /api/admin/orders — List all orders
router.get('/orders', getOrders);

// GET /api/admin/orders/export — Download all orders as an Excel file
// Inline protect + admin middleware ensures this route is always protected
router.get('/orders/export', protect, admin, exportOrdersToExcel);

// PATCH /api/admin/orders/:id/fulfillment — Update payment and delivery details
router.patch('/orders/:id/fulfillment', updateOrderFulfillmentValidation, updateOrderFulfillment);

// GET /api/admin/users — List all users (passwords excluded)
router.get('/users', getUsers);

module.exports = router;
