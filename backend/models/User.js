const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        // Minimum 8 caractères, au moins une majuscule, un chiffre et un caractère spécial
        return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(v);
      },
      message: 'Password must be at least 8 characters with at least one uppercase letter, one number, and one special character'
    }
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  discountCode: { type: String, default: null },
  // Loyalty program
  completedOrders: { type: Number, default: 0, min: 0 },
  freeItemAvailable: { type: Boolean, default: false }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
