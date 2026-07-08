const { body, query, param, validationResult } = require('express-validator');

/**
 * Middleware that checks validation results and returns 400 with errors if any.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(400).json({ message: messages.join('. ') });
  }
  next();
};

/**
 * Middleware to sanitize all string values in req.body against XSS.
 * Strips HTML tags and escapes special characters on all text input fields.
 */
const xssSanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
};

/**
 * Recursively sanitize an object's string values.
 * - Trims whitespace
 * - Removes HTML tags
 * - Escapes < > & " ' to prevent XSS
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      // Strip HTML tags
      let cleaned = value.replace(/<[^>]*>/g, '');
      // Escape special HTML characters
      cleaned = cleaned
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      obj[key] = cleaned;
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        if (typeof item === 'object') sanitizeObject(item);
      });
    } else if (value && typeof value === 'object') {
      sanitizeObject(value);
    }
  }
}

// ---------------------------------------------------------------------------
// Auth validators
// ---------------------------------------------------------------------------

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email must be at most 254 characters'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isLength({ max: 30 }).withMessage('Phone must be at most 30 characters'),
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location must be at most 200 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
  validate,
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate,
];

// ---------------------------------------------------------------------------
// Order validators
// ---------------------------------------------------------------------------

const createOrderValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email must be at most 254 characters'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 }).withMessage('Phone must be at most 30 characters'),
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location must be at most 200 characters'),
  body('items')
    .isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.perfumeId')
    .notEmpty().withMessage('Item perfumeId is required'),
  body('items.*.name')
    .trim()
    .notEmpty().withMessage('Item name is required')
    .isLength({ max: 200 }).withMessage('Item name must be at most 200 characters'),
  body('items.*.price')
    .isFloat({ min: 0 }).withMessage('Item price must be a positive number'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 }).withMessage('Item quantity must be between 1 and 100'),
  body('items.*.size')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Item size must be at most 50 characters'),
  body('discountCode')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 }).withMessage('Discount code must be at most 20 characters'),
  validate,
];

const updateOrderStatusValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID format'),
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status value'),
  validate,
];

const getOrderByIdValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID format'),
  validate,
];

// ---------------------------------------------------------------------------
// Perfume validators
// ---------------------------------------------------------------------------

const createPerfumeValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 200 }).withMessage('Name must be at most 200 characters'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Brand must be at most 100 characters'),
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(['Eau de Parfum', 'Eau de Toilette', 'Parfum', 'Eau de Cologne'])
    .withMessage('Invalid category'),
  body('gender')
    .trim()
    .notEmpty().withMessage('Gender is required')
    .isIn(['Men', 'Women', 'Unisex'])
    .withMessage('Invalid gender'),
  body('image')
    .trim()
    .notEmpty().withMessage('Image is required')
    .isLength({ max: 500 }).withMessage('Image URL must be at most 500 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('size')
    .trim()
    .notEmpty().withMessage('Size is required')
    .isLength({ max: 50 }).withMessage('Size must be at most 50 characters'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('bestseller')
    .optional()
    .isBoolean().withMessage('Bestseller must be a boolean'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active must be a boolean'),
  validate,
];

const updatePerfumeValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Perfume ID is required')
    .isMongoId().withMessage('Invalid perfume ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Name must be at most 200 characters'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Brand must be at most 100 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .optional()
    .trim()
    .isIn(['Eau de Parfum', 'Eau de Toilette', 'Parfum', 'Eau de Cologne'])
    .withMessage('Invalid category'),
  body('gender')
    .optional()
    .trim()
    .isIn(['Men', 'Women', 'Unisex'])
    .withMessage('Invalid gender'),
  body('image')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Image URL must be at most 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('size')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Size must be at most 50 characters'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('bestseller')
    .optional()
    .isBoolean().withMessage('Bestseller must be a boolean'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active must be a boolean'),
  validate,
];

const deletePerfumeValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Perfume ID is required')
    .isMongoId().withMessage('Invalid perfume ID format'),
  validate,
];

// ---------------------------------------------------------------------------
// General pagination / query validators
// ---------------------------------------------------------------------------

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('gender')
    .optional()
    .trim()
    .isIn(['Men', 'Women', 'Unisex', 'All']).withMessage('Invalid gender filter'),
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Invalid category filter'),
  validate,
];

module.exports = {
  validate,
  xssSanitize,
  registerValidation,
  loginValidation,
  createOrderValidation,
  updateOrderStatusValidation,
  getOrderByIdValidation,
  createPerfumeValidation,
  updatePerfumeValidation,
  deletePerfumeValidation,
  paginationValidation,
};
