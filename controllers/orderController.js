const Order = require('../models/Order');
const Product = require('../models/Product');
const { checkPermissions } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const StripePaymentFake = ({ amount, currency }) => {
  const client_secret = 'clientsecret';
  return { client_secret, amount };
};

const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;
  if (!cartItems) {
    throw new CustomError.BadRequestError('No items in the cart');
  }
  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError(
      'Please provide both tax and shipping fee'
    );
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const dbProduct = await Product.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new CustomError.NotFoundError(
        `No product with id : ${item.product}`
      );
    }
    const { name, price, image, _id } = dbProduct;
    // added to singleCartItemSchema
    const singleOrderItem = {
      name,
      price,
      image,
      amount: item.amount,
      product: _id,
    };
    // add item to orderItems
    orderItems = [...orderItems, singleOrderItem];
    // calculate subtotal
    subtotal += price * item.amount;
  }

  // Total amount to be paid
  const total = subtotal + tax + shippingFee;

  const paymentIntent = await StripePaymentFake({
    amount: total,
    currency: 'inr',
  });

  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userID,
  });
  res.status(StatusCodes.OK).json({ order, clientSecret: order.clientSecret });
};

const getAllOrders = async (req, res) => {
  const allOrders = await Order.find({});
  res.status(StatusCodes.OK).json({ allOrders, count: allOrders.length });
};

const getSingleOrder = async (req, res) => {
  const { id: orderID } = req.params;
  const order = await Order.findOne({ _id: orderID });
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderID}`);
  }

  checkPermissions(req.user, order.user);
  res.status(StatusCodes.OK).json({ order });
};

const getCurrentUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.userID });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const updateOrder = async (req, res) => {
  const { id: orderID } = req.params;
  const { paymentIntentID } = req.body;
  const order = await Order.findOne({ _id: orderID });
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderID}`);
  }
  checkPermissions(req.user, order.user);
  order.paymentIntentID = paymentIntentID;
  order.status = 'succesful';
  await order.save();

  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
