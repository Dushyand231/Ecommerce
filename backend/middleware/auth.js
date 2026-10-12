const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Not authorized, please login');
  const token = header.split(' ')[1];
  if (!token) throw new ApiError(401, 'Not authorized, please login');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) throw new ApiError(401, 'User not found or deactivated');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new ApiError(401, 'Session expired, please login again');
    throw new ApiError(401, 'Invalid token');
  }
});

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  throw new ApiError(403, 'Admin access required');
};

module.exports = { signToken, protect, adminOnly };