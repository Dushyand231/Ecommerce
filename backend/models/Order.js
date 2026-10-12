const mongoose = require('mongoose');
const crypto = require('crypto');

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        image: { type: String, default: '' },
        price: { type: Number, required: true, min: 0 },
        qty: { type: Number, required: true, min: 1 },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: [true, 'Full name is required'] },
      phone: { type: String, required: [true, 'Phone is required'] },
      line1: { type: String, required: [true, 'Address line is required'] },
      city: { type: String, required: [true, 'City is required'] },
      state: { type: String, required: [true, 'State is required'] },
      pincode: { type: String, required: [true, 'Pincode is required'] },
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: {
      method: { type: String, enum: ['cod', 'razorpay'], required: true },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

orderSchema.pre('save', function (next) {
  if (!this.orderId) this.orderId = 'SS-' + crypto.randomBytes(3).toString('hex').toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
  next();
});

module.exports = mongoose.model('Order', orderSchema);