const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Protected routes
router.use(protect);

router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.put('/:id/cancel', orderController.cancelOrder);

// Admin routes
router.get('/admin/all', authorize('admin'), orderController.getAllOrders);
router.put('/:id/status', authorize('admin'), orderController.updateOrderStatus);

module.exports = router;
