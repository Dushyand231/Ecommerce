const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 8, 40);
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  if (req.query.q) {
    filter.$text = { $search: req.query.q };
  }
  if (req.query.category && req.query.category !== 'All') {
    filter.category = req.query.category;
  }
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.query.minPrice !== undefined && req.query.minPrice !== '') filter.price = { ...(filter.price || {}), $gte: Number(req.query.minPrice) };
  if (req.query.maxPrice !== undefined && req.query.maxPrice !== '') filter.price = { ...(filter.price || {}), $lte: Number(req.query.maxPrice) };

  let sort = { createdAt: -1 };
  if (req.query.sort === 'priceLow') sort = { price: 1 };
  if (req.query.sort === 'priceHigh') sort = { price: -1 };
  if (req.query.sort === 'rating') sort = { ratingsAverage: -1 };
  if (req.query.sort === 'newest') sort = { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).lean();
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const cats = await Product.distinct('category', { isActive: true });
  res.json({ success: true, categories: cats });
});

// --- Admin -----
const validateProduct = (body) => {
  const { name, description, price, category, stock } = body;
  if (!name || !name.trim()) return 'Product name is required';
  if (!description || !description.trim()) return 'Description is required';
  if (price === undefined || price === null || Number(price) < 0) return 'A valid price is required';
  if (!category) return 'Category is required';
  if (stock === undefined || stock === null || Number(stock) < 0) return 'A valid stock is required';
  return null;
};

exports.createProduct = asyncHandler(async (req, res) => {
  const error = validateProduct(req.body);
  if (error) throw new ApiError(400, error);
  const { name, description, price, actualPrice, category, brand, stock, featured } = req.body;
  let images = [];
  if (req.files && req.files.length) {
    const { uploadImage } = require('../services/imageService');
    for (const f of req.files) {
      const url = await uploadImage(f);
      if (url) images.push(url);
    }
  } else if (typeof req.body.images === 'string' && req.body.images) {
    images = req.body.images.split(',').map((u) => u.trim()).filter(Boolean);
  }
  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    price: Number(price),
    actualPrice: actualPrice ? Number(actualPrice) : Number(price),
    category,
    brand: brand || '',
    stock: Number(stock),
    featured: Boolean(featured),
    images: images.length ? images : ['https://picsum.photos/seed/placeholder/600/400'],
  });
  res.status(201).json({ success: true, product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const allowed = ['name', 'description', 'price', 'actualPrice', 'category', 'brand', 'stock', 'featured', 'isActive'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) product[key] = key === 'featured' || key === 'isActive' ? Boolean(req.body[key]) : req.body[key];
  });

  if (req.files && req.files.length) {
    const { uploadImage } = require('../services/imageService');
    for (const f of req.files) {
      const url = await uploadImage(f);
      if (url) product.images.push(url);
    }
  } else if (typeof req.body.images === 'string' && req.body.images) {
    product.images = req.body.images.split(',').map((u) => u.trim()).filter(Boolean);
  }

  await product.save();
  res.json({ success: true, product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, message: 'Product deleted' });
});