const router = require('express').Router();
const review = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/product/:productId', review.getProductReviews);
router.post('/product/:productId', protect, review.createReview);

module.exports = router;