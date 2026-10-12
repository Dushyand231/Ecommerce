const Review = require('../models/Review');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw new ApiError(404, 'Product not found');
  const reviews = await Review.find({ product: product._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name');
  res.json({ success: true, reviews });
});

exports.createReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) throw new ApiError(400, 'Rating must be between 1 and 5');
  if (!comment || !comment.trim()) throw new ApiError(400, 'Review comment is required');
  if (comment.trim().length > 600) throw new ApiError(400, 'Comment too long');

  const product = await Product.findById(req.params.productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await Review.findOne({ user: req.user._id, product: product._id });
  if (existing) throw new ApiError(400, 'You have already reviewed this product');

  const review = await Review.create({
    user: req.user._id,
    product: product._id,
    rating: numRating,
    title: (title || '').trim(),
    comment: comment.trim(),
  });

  const agg = await Review.aggregate([
    { $match: { product: product._id } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (agg.length) {
    product.ratingsAverage = Math.round(agg[0].avg * 10) / 10;
    product.ratingsCount = agg[0].count;
  } else {
    product.ratingsAverage = numRating;
    product.ratingsCount = 1;
  }
  await product.save();

  res.status(201).json({ success: true, review });
});