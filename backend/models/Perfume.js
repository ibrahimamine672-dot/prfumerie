const mongoose = require('mongoose');

const perfumeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, required: true, default: 'MAISON DORÉE' },
  price: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    required: true,
    enum: ['Eau de Parfum', 'Eau de Toilette', 'Parfum', 'Eau de Cologne']
  },
  gender: {
    type: String,
    required: true,
    enum: ['Men', 'Women', 'Unisex']
  },
  image: { type: String, required: true },
  description: { type: String, required: true },
  notes: {
    top: [{ type: String }],
    middle: [{ type: String }],
    base: [{ type: String }]
  },
  size: { type: String, required: true },
  bestseller: { type: Boolean, default: false },
  stock: { type: Number, required: true, default: 0, min: 0 },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

perfumeSchema.index({ name: 'text', brand: 'text', description: 'text' });
perfumeSchema.index({ category: 1, gender: 1, price: 1 });
perfumeSchema.index({ bestseller: 1 });

module.exports = mongoose.model('Perfume', perfumeSchema);
