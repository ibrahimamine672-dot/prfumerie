const mongoose = require('mongoose');

const PAYMENT_METHODS = ['cash_on_delivery', 'card_fake', 'paypal_fake'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const DELIVERY_METHODS = ['standard', 'express'];
const DELIVERY_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const orderItemSchema = new mongoose.Schema({
  perfumeId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator(value) {
        return typeof value === 'number'
          || (typeof value === 'string' && value.trim().length > 0);
      },
      message: 'Perfume ID is required'
    }
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, default: '' },
  image: { type: String, default: '' }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: PAYMENT_METHODS,
    required: true,
    default: 'cash_on_delivery'
  },
  status: {
    type: String,
    enum: PAYMENT_STATUSES,
    required: true,
    default: 'pending'
  },
  amount: { type: Number, required: true, min: 0, default: 0 },
  transactionId: { type: String, default: null, trim: true },
  paidAt: { type: Date, default: null }
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, default: 'Not provided' },
  phone: { type: String, required: true, trim: true, default: 'Not provided' },
  address: { type: String, required: true, trim: true, default: 'Not provided' },
  city: { type: String, required: true, trim: true, default: 'Not provided' },
  postalCode: { type: String, required: true, trim: true, default: 'Not provided' },
  deliveryMethod: {
    type: String,
    enum: DELIVERY_METHODS,
    required: true,
    default: 'standard'
  },
  deliveryPrice: { type: Number, required: true, min: 0, default: 0 },
  status: {
    type: String,
    enum: DELIVERY_STATUSES,
    required: true,
    default: 'pending'
  },
  trackingNumber: { type: String, default: null, trim: true },
  estimatedDeliveryDate: { type: Date, default: null },
  deliveredAt: { type: Date, default: null }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Client info
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  location: { type: String, required: true, trim: true },

  // Order details
  items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },

  // Totals
  subtotal: { type: Number, required: true, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  discountCode: { type: String, default: null },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  productsPrice: { type: Number, required: true, min: 0, default: 0 },
  deliveryPrice: { type: Number, required: true, min: 0, default: 0 },
  totalPrice: { type: Number, required: true, min: 0, default: 0 },
  payment: { type: paymentSchema, required: true, default: () => ({}) },
  delivery: { type: deliverySchema, required: true, default: () => ({}) },

  // Loyalty — free item
  freeItemApplied: { type: Boolean, default: false },
  freeItemDiscount: { type: Number, default: 0, min: 0 },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // User reference (if logged in)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

orderSchema.index({ email: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'delivery.status': 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports.DELIVERY_METHODS = DELIVERY_METHODS;
module.exports.DELIVERY_STATUSES = DELIVERY_STATUSES;
