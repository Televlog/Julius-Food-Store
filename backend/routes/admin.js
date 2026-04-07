const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsers, updateUser, getOrders, approveSeller, getSalesReport } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/orders', getOrders);
router.put('/sellers/:id/approve', approveSeller);
router.get('/reports/sales', getSalesReport);

module.exports = router;
