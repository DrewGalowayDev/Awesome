const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Protected routes
router.use(protect);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/address', userController.addAddress);
router.put('/address/:id', userController.updateAddress);
router.delete('/address/:id', userController.deleteAddress);

// Admin routes
router.get('/admin/all', authorize('admin'), userController.getAllUsers);
router.get('/admin/:id', authorize('admin'), userController.getUserById);
router.put('/admin/:id', authorize('admin'), userController.updateUser);
router.delete('/admin/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
