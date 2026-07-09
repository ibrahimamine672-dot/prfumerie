const Order = require('../models/Order');
const Perfume = require('../models/Perfume');
const mongoose = require('mongoose');
const crypto = require('crypto');

const DELIVERY_PRICES = {
  standard: 20,
  express: 40,
};

const FREE_DELIVERY_THRESHOLD = 500;
const FAKE_PAYMENT_METHODS = ['card_fake', 'paypal_fake'];

const getDeliveryPrice = (productsPrice, deliveryMethod) => {
  if (productsPrice >= FREE_DELIVERY_THRESHOLD) {
    return 0;
  }
  return DELIVERY_PRICES[deliveryMethod];
};

const createTransactionId = (method) => {
  const prefix = method === 'card_fake' ? 'CARD' : 'PAYPAL';
  return `${prefix}-FAKE-${crypto.randomUUID()}`;
};

exports.createOrder = async (req, res, next) => {
  try {
    let { name, email, phone, location, items, discountCode } = req.body;
    const deliveryInput = req.body.delivery;
    const paymentMethod = req.body.payment?.method || 'cash_on_delivery';

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    const delivery = deliveryInput
      ? {
          fullName: deliveryInput.fullName?.trim(),
          phone: deliveryInput.phone?.trim(),
          address: deliveryInput.address?.trim(),
          city: deliveryInput.city?.trim(),
          postalCode: deliveryInput.postalCode?.trim(),
          deliveryMethod: deliveryInput.deliveryMethod || 'standard',
        }
      : {
          // Legacy clients used a single location field.
          fullName: name.trim(),
          phone: phone?.trim() || 'Not provided',
          address: location?.trim() || 'Not provided',
          city: location?.trim() || 'Not provided',
          postalCode: 'Not provided',
          deliveryMethod: 'standard',
        };

    if (
      !delivery.fullName
      || !delivery.phone
      || !delivery.address
      || !delivery.city
      || !delivery.postalCode
    ) {
      return res.status(400).json({ message: 'Complete delivery information is required' });
    }

    const productsPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryPrice = getDeliveryPrice(productsPrice, delivery.deliveryMethod);
    let calculatedDiscountAmount = 0;
    let calculatedDiscountPercent = 0;

    if (discountCode && discountCode.startsWith('WELCOME')) {
      if (req.user) {
        // Look up user's discount code
        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        if (user && user.discountCode === discountCode) {
          calculatedDiscountPercent = 15;
          calculatedDiscountAmount = productsPrice * 0.15;
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

    const totalPrice = Math.max(
      0,
      productsPrice + deliveryPrice - calculatedDiscountAmount - freeItemDiscount
    );
    const isFakePayment = FAKE_PAYMENT_METHODS.includes(paymentMethod);
    const now = new Date();
    const estimatedDeliveryDate = new Date(now);
    estimatedDeliveryDate.setDate(now.getDate() + (delivery.deliveryMethod === 'express' ? 2 : 5));

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
      phone: delivery.phone,
      location: `${delivery.address}, ${delivery.city} ${delivery.postalCode}`.trim(),
      items,
      subtotal: productsPrice,
      shipping: deliveryPrice,
      discountCode: discountCode || null,
      discountPercent: calculatedDiscountPercent,
      discountAmount: calculatedDiscountAmount,
      freeItemApplied,
      freeItemDiscount,
      total: totalPrice,
      productsPrice,
      deliveryPrice,
      totalPrice,
      payment: {
        method: paymentMethod,
        status: isFakePayment ? 'paid' : 'pending',
        amount: totalPrice,
        transactionId: isFakePayment ? createTransactionId(paymentMethod) : null,
        paidAt: isFakePayment ? now : null,
      },
      delivery: {
        ...delivery,
        deliveryPrice,
        status: 'pending',
        trackingNumber: null,
        estimatedDeliveryDate,
        deliveredAt: null,
      },
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
      productsPrice: order.productsPrice,
      deliveryPrice: order.deliveryPrice,
      totalPrice: order.totalPrice,
      total: order.totalPrice,
      payment: order.payment,
      delivery: order.delivery,
      items: order.items.length,
      status: order.delivery.status,
      createdAt: order.createdAt,
      freeItemApplied,
      freeItemDiscount,
      freeItemName
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
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
    res.status(500);
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = order.user && order.user.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
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
    res.status(500);
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be: ' + validStatuses.join(', ') });
    }

    const deliveryStatus = status === 'confirmed' ? 'processing' : status;
    const update = {
      status,
      'delivery.status': deliveryStatus,
    };

    if (status === 'delivered') {
      update['delivery.deliveredAt'] = new Date();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updateOrderFulfillment = async (req, res, next) => {
  try {
    const {
      paymentStatus,
      deliveryStatus,
      trackingNumber,
      estimatedDeliveryDate,
    } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (paymentStatus !== undefined) {
      order.payment.status = paymentStatus;
      if (paymentStatus === 'paid' && !order.payment.paidAt) {
        order.payment.paidAt = new Date();
      }
    }

    if (deliveryStatus !== undefined) {
      order.delivery.status = deliveryStatus;
      order.status = deliveryStatus === 'processing' ? 'confirmed' : deliveryStatus;
      if (deliveryStatus === 'delivered' && !order.delivery.deliveredAt) {
        order.delivery.deliveredAt = new Date();
      }
    }

    if (trackingNumber !== undefined) {
      order.delivery.trackingNumber = trackingNumber || null;
    }

    if (estimatedDeliveryDate !== undefined) {
      order.delivery.estimatedDeliveryDate = estimatedDeliveryDate || null;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * Export all orders to an Excel file and send it as a downloadable response.
 * Protected by auth + admin middleware — only admin users can access this.
 */
exports.exportOrdersToExcel = async (req, res, next) => {
  try {
    const ExcelJS = require('exceljs');

    // Fetch all orders, sorted by newest first
    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Commandes');

    // Define columns
    worksheet.columns = [
      { header: 'Nom client', key: 'customerName', width: 24 },
      { header: 'Email client', key: 'email', width: 30 },
      { header: 'Téléphone', key: 'phone', width: 20 },
      { header: 'Adresse', key: 'address', width: 36 },
      { header: 'Ville', key: 'city', width: 20 },
      { header: 'Produits', key: 'products', width: 45 },
      { header: 'Total produits', key: 'productsPrice', width: 18 },
      { header: 'Prix livraison', key: 'deliveryPrice', width: 18 },
      { header: 'Total final', key: 'totalPrice', width: 18 },
      { header: 'Méthode paiement', key: 'paymentMethod', width: 22 },
      { header: 'Statut paiement', key: 'paymentStatus', width: 18 },
      { header: 'Mode livraison', key: 'deliveryMethod', width: 18 },
      { header: 'Statut livraison', key: 'deliveryStatus', width: 18 },
      { header: 'Numéro de suivi', key: 'trackingNumber', width: 24 },
      { header: 'Date commande', key: 'date', width: 22 },
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
      const productsPrice = order.productsPrice ?? order.subtotal ?? 0;
      const deliveryPrice = order.deliveryPrice ?? order.shipping ?? 0;
      const totalPrice = order.totalPrice ?? order.total ?? 0;
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
        customerName: order.delivery?.fullName || order.name,
        email: order.email,
        phone: order.delivery?.phone || order.phone || '',
        address: order.delivery?.address || order.location || '',
        city: order.delivery?.city || '',
        products: productNames,
        productsPrice: `${productsPrice.toFixed(2)} MAD`,
        deliveryPrice: `${deliveryPrice.toFixed(2)} MAD`,
        totalPrice: `${totalPrice.toFixed(2)} MAD`,
        paymentMethod: order.payment?.method || 'cash_on_delivery',
        paymentStatus: order.payment?.status || 'pending',
        deliveryMethod: order.delivery?.deliveryMethod || 'standard',
        deliveryStatus: order.delivery?.status || order.status || 'pending',
        trackingNumber: order.delivery?.trackingNumber || '',
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
    res.status(500);
    next(error);
  }
};
