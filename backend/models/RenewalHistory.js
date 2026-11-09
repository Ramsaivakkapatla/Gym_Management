const mongoose = require('mongoose');

const renewalHistorySchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
      index: true,
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Membership',
      required: [true, 'Membership reference is required'],
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
      amount: {
        type: Number,
        required: [true, 'Renewal amount is required'],
      },
    },
    previousExpiryDate: {
      type: Date,
      required: [true, 'Previous expiry date is required'],
    },
    newStartDate: {
      type: Date,
      required: [true, 'New start date is required'],
    },
    newExpiryDate: {
      type: Date,
      required: [true, 'New expiry date is required'],
    },
    renewalType: {
      type: String,
      required: [true, 'Renewal type is required'],
      enum: ['EARLY_EXTEND', 'LATE_RENEWAL'],
    },
    renewalDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

renewalHistorySchema.index({ member: 1, createdAt: -1 });

module.exports = mongoose.model('RenewalHistory', renewalHistorySchema);

