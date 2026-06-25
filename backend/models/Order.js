const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  perfumeId: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, default: '' },
  image: { type: String, default: '' }
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
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
