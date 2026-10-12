const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getRazorpay } = require('../services/razorpay');

const FREE_DELIVERY_ABOVE = Number(process.env.FREE_DELIVERY_ABOVE || 500);
const DELIVERY_FEE = Number(process.env.DELIVERY_FEE || 49);

async function computeOrder(items) {
  const orderItems = [];
  let subtotal = 0;
  for (const entry of items) {
    const productId = entry.productId || entry.id;
    const qty = Number(entry.qty);
    if (!productId || !Number.isInteger(qty) || qty < 1) throw new ApiError(400, 'Invalid item or quantity');
    const product = await Product.findById(productId);
    if (!product || !product.isActive) throw new ApiError(404, `Product not found: ${productId}`);
    if (product.stock < qty) throw new ApiError(400, `Insufficient stock for "${product.name}" (available: ${product.stock})`);
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      qty,
    });
    subtotal += product.price * qty;
  }
  if (!orderItems.length) throw new ApiError(400, 'Order must contain at least one item');
  const deliveryCharges = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  return { orderItems, subtotal, deliveryCharges, total: subtotal + deliveryCharges };
}

exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;
  if (!Array.isArray(items) || !items.length) throw new ApiError(400, 'Items are required');
  if (!shippingAddress) throw new ApiError(400, 'Shipping address is required');
  if (!['cod', 'razorpay'].includes(paymentMethod)) throw new ApiError(400, 'Invalid payment method');

  const requiredAddress = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];
  requiredAddress.forEach((f) => {
    if (!shippingAddress[f] || !String(shippingAddress[f]).trim()) throw new ApiError(400, `Shipping address is missing: ${f}`);
  });

  const { orderItems, subtotal, deliveryCharges, total } = await computeOrder(items);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    deliveryCharges,
    total,
    payment: { method: paymentMethod, status: paymentMethod === 'razorpay' ? 'pending' : 'pending' },
  });

  let razorpayOrder;
  let keyId = null;
  if (paymentMethod === 'razorpay') {
    const rp = getRazorpay();
    if (!rp) throw new ApiError(400, 'Razorpay is not configured on this server');
    razorpayOrder = await rp.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: order.orderId,
      notes: { orderId: order.orderId },
    });
    order.payment.razorpayOrderId = razorpayOrder.id;
    await order.save();
    keyId = process.env.RAZORPAY_KEY_ID;
  }

  await decrementStock(orderItems);
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });

  res.status(201).json({
    success: true,
    order,
    razorpay: razorpayOrder ? { orderId: razorpayOrder.id, amount: razorpayOrder.amount, keyId } : null,
  });
});

async function decrementStock(orderItems) {
  for (const item of orderItems) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.qty } });
  }
}

exports.myOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  const total = await Order.countDocuments({ user: req.user._id });
  res.json({ success: true, orders, page, pages: Math.ceil(total / limit) || 1, total });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && order.user.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized to view this order');
  res.json({ success: true, order });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }
  if (!['Pending', 'Confirmed'].includes(order.status)) throw new ApiError(400, 'Order cannot be cancelled at this stage');
  order.status = 'Cancelled';
  order.statusHistory.push({ status: 'Cancelled' });
  await order.save();
  res.json({ success: true, order });
});