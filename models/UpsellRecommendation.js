const mongoose = require('mongoose');

const UpsellRecommendationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    recommendedOffer: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'accepted', 'dismissed', 'sent'],
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  },
);

module.exports =
  mongoose.models.UpsellRecommendation ||
  mongoose.model('UpsellRecommendation', UpsellRecommendationSchema);
