const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Génère un code promo unique de -15%
const generateDiscountCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WELCOME';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, location } = req.body;

    if (!phone || !location) {
      return res.status(400).json({ message: 'Phone number and location are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const discountCode = generateDiscountCode();

    const user = await User.create({ name, email, password, phone, location, discountCode });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      role: user.role,
      discountCode: user.discountCode,
      discountPercent: 15,
      completedOrders: user.completedOrders,
      freeItemAvailable: user.freeItemAvailable,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        completedOrders: user.completedOrders,
        freeItemAvailable: user.freeItemAvailable,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.getMe = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    completedOrders: req.user.completedOrders,
    freeItemAvailable: req.user.freeItemAvailable
  });
};
