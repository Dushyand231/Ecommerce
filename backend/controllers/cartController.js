const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function populateItems(cart) {
  if (!cart) return { items: [], totalQuantity: 0, subtotal: 0 };
  const populated = await Cart.findById(cart._id).populate('items.product');
  const items = populated.items
    .filter((i) => i.product)
    .map((i) => ({
      id: i.product._id,
      name: i.product.name,
      price: i.product.price,
      image: i.product.images?.[0] || '',
      brand: i.product.brand,
      stock: i.product.stock,
      qty: i.qty,
    }));
  return {
    items,
    totalQuantity: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.qty, 0),
  };
}

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ success: true, ...(await populateItems(cart)) });
});

exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, qty = 1 } = req.body;
  const quantity = Number(qty);
  if (!productId) throw new ApiError(400, 'productId is required');
  if (!Number.isInteger(quantity) || quantity < 1) throw new ApiError(400, 'Quantity must be a positive integer');

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) throw new ApiError(400, `Only ${product.stock} units in stock`);

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => i.product.toString() === productId);
  if (existing) {
    if (product.stock < existing.qty + quantity) throw new ApiError(400, `Only ${product.stock} units in stock`);
    existing.qty += quantity;
  } else {
    cart.items.push({ product: productId, qty: quantity });
  }
  await cart.save();
  res.json({ success: true, ...(await populateItems(cart)) });
});

exports.updateQty = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const qty = Number(req.body.qty);
  if (!Number.isInteger(qty) || qty < 1) throw new ApiError(400, 'Quantity must be a positive integer');

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < qty) throw new ApiError(400, `Only ${product.stock} units in stock`);

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw new ApiError(404, 'Item not in cart');
  item.qty = qty;
  await cart.save();
  res.json({ success: true, ...(await populateItems(cart)) });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ success: true, ...(await populateItems(cart)) });
});

exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, ...(await populateItems(cart)) });
});

exports.syncCart = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) throw new ApiError(400, 'items array is required');
  const cart = await getOrCreateCart(req.user._id);
  for (const entry of items) {
    const productId = entry.productId || entry.id;
    const qty = Number(entry.qty);
    if (!productId || !Number.isInteger(qty) || qty < 1) continue;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) continue;
    const safeQty = Math.min(qty, product.stock);
    const existing = cart.items.find((i) => i.product.toString() === productId);
    if (existing) existing.qty = Math.min(existing.qty + safeQty, product.stock);
    else cart.items.push({ product: productId, qty: safeQty });
  }
  await cart.save();
  res.json({ success: true, ...(await populateItems(cart)) });
});