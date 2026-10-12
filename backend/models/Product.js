const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    slug: { type: String, index: { unique: true, sparse: true } },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    brand: { type: String, default: '', trim: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Toys', 'Other'],
      index: true,
      default: 'Other',
    },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    actualPrice: { type: Number, min: [0, 'Price cannot be negative'], default: 0 },
    stock: { type: Number, required: [true, 'Stock is required'], min: [0, 'Stock cannot be negative'], default: 0 },
    images: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

productSchema.pre('save', function (next) {
  if (!this.slug) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);
  next();
});

module.exports = mongoose.model('Product', productSchema);