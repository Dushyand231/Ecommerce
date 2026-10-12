const router = require('express').Router();
const payment = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/config', payment.getConfig);
router.post('/verify', protect, payment.verifyPayment);

module.exports = router;