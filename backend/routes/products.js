const router = require('express').Router();
const product = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../utils/upload');

router.get('/', product.getProducts);
router.get('/categories', product.getCategories);
router.get('/:id', product.getProduct);

router.post('/', protect, adminOnly, upload.array('images', 5), product.createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 5), product.updateProduct);
router.delete('/:id', protect, adminOnly, product.deleteProduct);

module.exports = router;