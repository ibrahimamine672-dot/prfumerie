const Order = require('../models/Order');
const Perfume = require('../models/Perfume');
const mongoose = require('mongoose');

exports.createOrder = async (req, res) => {
  try {
    let { name, email, phone, location, items, subtotal, shipping, discountCode, discountPercent, discountAmount, total } = req.body;

    // Validate required fields
    if (!name || !email || !location) {
      return res.status(400).json({ message: 'Name, email and location are required for delivery' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Server-side total verification
    const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    shipping = calculatedSubtotal >= 250 ? 0 : 15;
    let calculatedDiscountAmount = 0;
    let calculatedDiscountPercent = 0;

    if (discountCode && discountCode.startsWith('WELCOME')) {
      if (req.user) {
        // Look up user's discount code
        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        if (user && user.discountCode === discountCode) {
          calculatedDiscountPercent = 15;
          calculatedDiscountAmount = calculatedSubtotal * 0.15;
        } else {
          discountCode = null;
        }
      } else {
        discountCode = null;
      }
    }

    // --- Loyalty: Free Item Check ---
    let freeItemApplied = false;
    let freeItemDiscount = 0;
    let freeItemName = '';

    if (req.user) {
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      if (user && user.freeItemAvailable) {
        // Find the cheapest item in the cart
        const cheapest = items.reduce((min, item) =>
          (item.price * item.quantity) < (min.price * min.quantity) ? item : min
        );
        freeItemDiscount = cheapest.price * cheapest.quantity;
        freeItemName = cheapest.name;
        freeItemApplied = true;
      }
    }

    const calculatedTotal = Math.max(0, calculatedSubtotal + shipping - calculatedDiscountAmount - freeItemDiscount);

    // Verify stock for each item (only when perfumeId is a string ObjectId — skip numeric IDs)
    for (const item of items) {
      if (typeof item.perfumeId === 'string' && mongoose.Types.ObjectId.isValid(item.perfumeId)) {
        const perfume = await Perfume.findById(item.perfumeId);
        if (!perfume || !perfume.active) {
          return res.status(400).json({ message: `Product "${item.name}" is not available` });
        }
        if (perfume.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for "${item.name}". Available: ${perfume.stock}` });
        }
      }
    }

    const order = await Order.create({
      name,
      email,
      phone: phone || '',
      location,
      items,
      subtotal: calculatedSubtotal,
      shipping,
      discountCode: discountCode || null,
      discountPercent: calculatedDiscountPercent,
      discountAmount: calculatedDiscountAmount,
      freeItemApplied,
      freeItemDiscount,
      total: calculatedTotal,
      user: req.user ? req.user._id : null
    });

    // Decrement stock (only for string ObjectIds, skip numeric IDs)
    for (const item of items) {
      if (typeof item.perfumeId === 'string' && mongoose.Types.ObjectId.isValid(item.perfumeId)) {
        await Perfume.findByIdAndUpdate(item.perfumeId, { $inc: { stock: -item.quantity } });
      }
    }

    // --- Update user loyalty status ---
    if (req.user) {
      const User = require('../models/User');
      const completedOrderCount = await Order.countDocuments({
        user: req.user._id,
        status: { $ne: 'cancelled' }
      });

      const update = {
        completedOrders: completedOrderCount
      };

      if (freeItemApplied) {
        // Reset free item — it was used on this order
        update.freeItemAvailable = false;
      }

      // Every 10 completed orders earns a free item
      if (completedOrderCount > 0 && completedOrderCount % 10 === 0) {
        update.freeItemAvailable = true;
      }

      await User.findByIdAndUpdate(req.user._id, update);
    }

    res.status(201).json({
      _id: order._id,
      name: order.name,
      email: order.email,
      location: order.location,
      total: order.total,
      items: order.items.length,
      status: order.status,
      createdAt: order.createdAt,
      freeItemApplied,
      freeItemDiscount,
      freeItemName
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments()
    ]);

    res.json({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    const completedCount = await Order.countDocuments({
      user: req.user._id,
      status: { $ne: 'cancelled' }
    });
    res.json({
      orders,
      completedOrders: completedCount,
      freeItemAvailable: req.user.freeItemAvailable
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be: ' + validStatuses.join(', ') });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Export all orders to an Excel file and send it as a downloadable response.
 * Protected by auth + admin middleware — only admin users can access this.
 */
exports.exportOrdersToExcel = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');

    // Fetch all orders, sorted by newest first
    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Commandes');

    // Define columns
    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 28 },
      { header: 'Customer Name', key: 'name', width: 22 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Product', key: 'product', width: 40 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Total Price', key: 'total', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Date', key: 'date', width: 20 },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1A2E' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Add data rows
    orders.forEach((order) => {
      const productNames = order.items.map((item) => item.name).join(', ');
      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const dateFormatted = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';

      worksheet.addRow({
        id: order._id.toString(),
        name: order.name,
        email: order.email,
        phone: order.phone || '',
        product: productNames,
        quantity: totalQuantity,
        total: order.total ? order.total.toFixed(2) + ' €' : '0.00 €',
        status: order.status,
        date: dateFormatted,
      });
    });

    // Style data rows with alternating colors
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.height = 22;
        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF5F5F5' },
            };
          });
        }
      }
    });

    // Set response headers and send the workbook
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=commandes.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting orders to Excel:', error);
    res.status(500).json({ message: 'Failed to export orders: ' + error.message });
  }
};
