const express = require('express');
const router = express.Router();

const {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
} = require('../controllers/orderController');

const {
  authenticateUser,
  authorizePermission,
} = require('../middleware/authentication');

router
  .route('/')
  .get([authenticateUser, authorizePermission('admin')], getAllOrders)
  .post(authenticateUser, createOrder);
router.route('/showMyOrders').get(authenticateUser, getCurrentUserOrders);
router
  .route('/:id')
  .get(authenticateUser, getSingleOrder)
  .post(authenticateUser, updateOrder);

module.exports = router;
