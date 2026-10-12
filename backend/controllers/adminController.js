const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getStats = asyncHandler(async (req, res) => {
  const [totalProducts, totalUsers, paidOrdersAgg, allOrders, ordersByStatus] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments(),
    Order.aggregate([{ $match: { 'payment.status': 'paid' } }, { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const [recentOrders] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email'),
  ]);

  res.json({
    success: true,
    stats: {
      totalProducts,
      totalUsers,
      totalOrders: allOrders,
      revenue: paidOrdersAgg[0]?.revenue || 0,
      paidOrders: paidOrdersAgg[0]?.count || 0,
      ordersByStatus,
    },
    recentOrders,
  });
});

exports.getOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 15, 50);
  const filter = {};
  if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, page, pages: Math.ceil(total / limit) || 1, total });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, order });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const valid = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  const status = req.body.status;
  if (!valid.includes(status)) throw new ApiError(400, `Status must be one of: ${valid.join(', ')}`);

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status === 'Cancelled') throw new ApiError(400, 'Cancelled orders cannot be updated');
  order.status = status;
  order.statusHistory.push({ status });
  await order.save();
  res.json({ success: true, order });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const q = req.query.q || '';
  const filter = q ? { $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] } : {};
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, page, pages: Math.ceil(total / limit) || 1, total });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot deactivate an admin account');
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user: user.toSafeJSON() });
});