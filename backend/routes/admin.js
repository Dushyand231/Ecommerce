const router = require('express').Router();
const admin = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', admin.getStats);
router.get('/orders', admin.getOrders);
router.get('/orders/:id', admin.getOrder);
router.patch('/orders/:id/status', admin.updateOrderStatus);
router.get('/users', admin.getUsers);
router.patch('/users/:id/status', admin.toggleUserStatus);

module.exports = router;