const router = require('express').Router();
const cart = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', cart.getCart);
router.post('/', cart.addToCart);
router.post('/sync', cart.syncCart);
router.put('/:productId', cart.updateQty);
router.delete('/:productId', cart.removeItem);
router.delete('/', cart.clearCart);

module.exports = router;