const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const { name, email, phone, location, items, subtotal, shipping, discountCode, discountPercent, discountAmount, total } = req.body;

    // Validate required fields
    if (!name || !email || !location) {
      return res.status(400).json({ message: 'Name, email and location are required for delivery' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (total === undefined || total < 0) {
      return res.status(400).json({ message: 'Invalid total amount' });
    }

    const order = await Order.create({
      name,
      email,
      phone: phone || '',
      location,
      items,
      subtotal: subtotal || 0,
      shipping: shipping || 0,
      discountCode: discountCode || null,
      discountPercent: discountPercent || 0,
      discountAmount: discountAmount || 0,
      total,
      user: req.user ? req.user._id : null
    });

    res.status(201).json({
      _id: order._id,
      name: order.name,
      email: order.email,
      location: order.location,
      total: order.total,
      items: order.items.length,
      status: order.status,
      createdAt: order.createdAt
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
    res.json(orders);
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
    const orders = await Order.find({ email: req.user.email }).sort({ createdAt: -1 });
    res.json(orders);
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
