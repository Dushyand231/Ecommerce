const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../middleware/auth');

const safeUser = (user) => user.toSafeJSON();

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
  const dup = await User.findOne({ email: email.toLowerCase() });
  if (dup) throw new ApiError(400, 'An account with that email already exists');

  const adminSeed =
    (process.env.ADMIN_SEED_EMAIL || '').toLowerCase() === email.toLowerCase()
      ? { role: 'admin' }
      : {};

  const user = await User.create({ name: name.trim(), email: email.trim(), password, ...adminSeed });
  const token = signToken(user);
  res.status(201).json({ success: true, token, user: safeUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password)) || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.isActive === false) throw new ApiError(401, 'Account deactivated');
  const token = signToken(user);
  user.password = undefined;
  res.json({ success: true, token, user: safeUser(user) });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: safeUser(req.user) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();
  if (address) user.address = address.trim();
  await user.save();
  res.json({ success: true, user: safeUser(user) });
});

exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Current and new passwords are required');
  if (newPassword.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new ApiError(401, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});