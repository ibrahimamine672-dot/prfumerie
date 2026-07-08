const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { exportOrdersToExcel } = require('../controllers/orderController');

// GET /api/admin/orders/export — Download all orders as an Excel file
router.get('/orders/export', protect, admin, exportOrdersToExcel);

module.exports = router;
