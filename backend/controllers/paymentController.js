const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyRazorpaySignature } = require('../services/paymentVerify');

exports.getConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
  });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, 'Missing payment verification data');
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized');
  if (order.payment.razorpayOrderId !== razorpayOrderId) throw new ApiError(400, 'Mismatched payment order');
  if (order.payment.status === 'paid') return res.json({ success: true, order });

  const valid = verifyRazorpaySignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature });
  if (!valid) throw new ApiError(400, 'Payment verification failed');

  order.payment.status = 'paid';
  order.payment.razorpayPaymentId = razorpayPaymentId;
  order.payment.razorpaySignature = razorpaySignature;
  order.status = 'Confirmed';
  order.statusHistory.push({ status: 'Confirmed' });
  await order.save();

  res.json({ success: true, order });
});

exports.codConfirm = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized');
  if (order.payment.method !== 'cod') throw new ApiError(400, 'Not a COD order');
  order.payment.status = 'paid';
  order.save();
  res.json({ success: true, order });
});