const mongoose = require('mongoose');
const { computeMembershipStatus } = require('../utils/dateUtils');

const membershipSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan reference is required'],
    },
    planSnapshot: {
      name: {
        type: String,
        required: [true, 'Plan name snapshot is required'],
      },
      durationMonths: {
        type: Number,
        required: [true, 'Plan duration snapshot is required'],
      },
      price: {
        type: Number,
        required: [true, 'Plan price snapshot is required'],
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to dynamically compute status based on current date
membershipSchema.virtual('status').get(function () {
  return computeMembershipStatus(this.expiryDate);
});

// Index for quick queries
membershipSchema.index({ member: 1, expiryDate: -1 });

module.exports = mongoose.model('Membership', membershipSchema);

