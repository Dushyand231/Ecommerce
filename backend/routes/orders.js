const router = require('express').Router();
const order = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', order.createOrder);
router.get('/my-orders', order.myOrders);
router.post('/:id/cancel', order.cancelOrder);
router.get('/:id', order.getOrder);

module.exports = router;