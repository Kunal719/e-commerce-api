const Review = require('../models/Review');
const Product = require('../models/Product');
const { checkPermissions } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const createReview = async (req, res) => {
  const { product: productID } = req.body;

  const isValidProduct = await Product.findOne({ _id: productID });
  if (!isValidProduct) {
    throw new CustomError.NotFoundError(`No product with ID : ${productID}`);
  }

  const alreadySubmitted = await Review.findOne({
    product: productID,
    user: req.user.userID,
  });
  if (alreadySubmitted) {
    throw new CustomError.BadRequestError(
      'Cannot submit more than 1 review for a single product'
    );
  }

  req.body.user = req.user.userID;
  const review = await Review.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};
const getAllReviews = async (req, res) => {
  const review = await Review.find({}).populate({
    path: 'product',
    select: 'name company price',
  });
  res.status(StatusCodes.OK).json({ review, count: review.length });
};
const getSingleReview = async (req, res) => {
  const { id: reviewID } = req.params;
  const singleReview = await Review.findOne({ _id: reviewID }).populate({
    path: 'product',
    select: 'name company price',
  });
  if (!singleReview) {
    throw new CustomError.NotFoundError(`No Review with id : ${reviewID}`);
  }

  res.status(StatusCodes.OK).json({ singleReview });
};
const updateReview = async (req, res) => {
  const { id: reviewID } = req.params;
  const { title, rating, comment } = req.body;

  const review = await Review.findOne({ _id: reviewID });
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id : ${reviewID}`);
  }

  checkPermissions(req.user, review.user);
  review.title = title;
  review.rating = rating;
  review.comment = comment;

  await review.save();
  res.status(StatusCodes.OK).json({ review });
};
const deleteReview = async (req, res) => {
  const { id: reviewID } = req.params;
  const deleteReview = await Review.findOne({ _id: reviewID });
  if (!deleteReview) {
    throw new CustomError.NotFoundError(`No Review with id : ${reviewID}`);
  }

  checkPermissions(req.user, deleteReview.user);
  await deleteReview.remove();
  res.status(StatusCodes.OK).json({ msg: 'Review Deleted' });
};

const getSingleProductReviews = async (req, res) => {
  const { id: productID } = req.params;
  const reviews = await Review.find({ product: productID });
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
};
