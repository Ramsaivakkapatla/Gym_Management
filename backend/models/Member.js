const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: '{VALUE} is not a valid gender',
      },
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate Member ID (e.g. MBR-1001) before validation
memberSchema.pre('validate', async function (next) {
  if (this.isNew && !this.memberId) {
    try {
      const lastMember = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
      let nextNumber = 1001;
      if (lastMember && lastMember.memberId && lastMember.memberId.startsWith('MBR-')) {
        const parts = lastMember.memberId.split('-');
        const parsed = parseInt(parts[1], 10);
        if (!isNaN(parsed)) {
          nextNumber = parsed + 1;
        }
      }
      this.memberId = `MBR-${nextNumber}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Compound search index for name, email, phone
memberSchema.index({ name: 'text', email: 'text', phone: 'text' });
memberSchema.index({ email: 1 });
memberSchema.index({ phone: 1 });

module.exports = mongoose.model('Member', memberSchema);

