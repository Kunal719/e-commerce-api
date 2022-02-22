const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide a rating of the product'],
    },
    title: {
      type: String,
      required: [true, 'A title is required for your review'],
      maxlength: 50,
      trim: true,
    },
    comment: {
      type: String,
      required: [true, 'Please provide your comment about the product'],
      maxlength: 200,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ product: 1, user: 1 }, { unique: true }); // Means 1 user can leave 1 review per product

// We dont use methods because this is not an instance we are using somewhere in controllers,
// we are using here it within the schema
ReviewSchema.statics.calculateAverageRating = async function (productID) {
  const result = await this.aggregate([
    { $match: { product: productID } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        numOfReviews: { $sum: 1 },
      },
    },
  ]);

  await this.model('Product').findOneAndUpdate(
    { _id: productID },
    {
      averageRating: Math.round(result[0]?.averageRating || 0),
      numOfReviews: result[0]?.numOfReviews || 0,
    }
  );
};

ReviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

ReviewSchema.post('remove', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

module.exports = mongoose.model('Review', ReviewSchema);
