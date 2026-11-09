const mongoose = require('mongoose');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Membership = require('../models/Membership');
const RenewalHistory = require('../models/RenewalHistory');
const {
  addCalendarMonths,
  normalizeToDateOnly,
  getTodayDateOnly,
} = require('../utils/dateUtils');

/**
 * Handles Membership Renewal with strict adherence to Case 1 and Case 2 rules.
 * 
 * Case 1: Renewal before or on expiry date
 * - Extend the membership from its existing expiry date.
 * - New expiry date = Existing expiry date + selected plan duration.
 * - Do not calculate from renewal date.
 * 
 * Case 2: Renewal after expiry date
 * - Start the new membership from the renewal date.
 * - New expiry date = Renewal date + selected plan duration.
 */
async function processRenewal({ membershipId, planId, renewalDateInput }) {
  // 1. Fetch Existing Membership
  const existingMembership = await Membership.findById(membershipId);
  if (!existingMembership) {
    throw new Error('Existing membership not found');
  }

  // 2. Validate Member
  const member = await Member.findById(existingMembership.member);
  if (!member) {
    throw new Error('Member not found');
  }
  if (!member.isActive) {
    throw new Error('Cannot renew membership for a deactivated member');
  }

  // 3. Validate Renewal Plan
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error('Selected renewal plan not found');
  }
  if (!plan.isActive) {
    throw new Error('Cannot renew using an inactive membership plan');
  }

  // 4. Determine Renewal Date and Compare to Existing Expiry Date
  const renewalDate = renewalDateInput ? normalizeToDateOnly(renewalDateInput) : getTodayDateOnly();
  const existingExpiryDate = normalizeToDateOnly(existingMembership.expiryDate);

  const isBeforeOrOnExpiry = renewalDate.getTime() <= existingExpiryDate.getTime();

  let renewalType;
  let newStartDate;
  let newExpiryDate;
  let targetMembershipId;

  if (isBeforeOrOnExpiry) {
    // === Case 1: Renewal before or on expiry date ===
    // Extend from existing expiry date
    renewalType = 'EARLY_EXTEND';
    newStartDate = existingExpiryDate;
    newExpiryDate = addCalendarMonths(existingExpiryDate, plan.durationMonths);
    targetMembershipId = existingMembership._id;
  } else {
    // === Case 2: Renewal after expiry date ===
    // Start from renewal date
    renewalType = 'LATE_RENEWAL';
    newStartDate = renewalDate;
    newExpiryDate = addCalendarMonths(renewalDate, plan.durationMonths);
  }

  // Check if transactions are supported on this MongoDB server
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (sessionErr) {
    // MongoDB standalone doesn't support transactions; fallback to safe manual failure handling
    useTransaction = false;
    session = null;
  }

  try {
    let savedMembership;
    let originalExpiryToRestore = existingMembership.expiryDate;

    if (isBeforeOrOnExpiry) {
      // Update existing membership expiry date to extended date
      existingMembership.expiryDate = newExpiryDate;
      // Also update current active plan snapshot if needed
      existingMembership.plan = plan._id;
      existingMembership.planSnapshot = {
        name: plan.name,
        durationMonths: plan.durationMonths,
        price: plan.price,
      };

      savedMembership = await existingMembership.save(useTransaction ? { session } : {});
    } else {
      // Create new membership to preserve historical expired record
      const newMembership = new Membership({
        member: member._id,
        plan: plan._id,
        planSnapshot: {
          name: plan.name,
          durationMonths: plan.durationMonths,
          price: plan.price,
        },
        startDate: newStartDate,
        expiryDate: newExpiryDate,
      });

      savedMembership = await newMembership.save(useTransaction ? { session } : {});
      targetMembershipId = savedMembership._id;
    }

    // Create RenewalHistory entry
    const renewalRecord = new RenewalHistory({
      member: member._id,
      membership: targetMembershipId,
      plan: plan._id,
      planSnapshot: {
        name: plan.name,
        durationMonths: plan.durationMonths,
        amount: plan.price,
      },
      previousExpiryDate: existingExpiryDate,
      newStartDate: newStartDate,
      newExpiryDate: newExpiryDate,
      renewalType: renewalType,
      renewalDate: renewalDate,
    });

    const savedRenewal = await renewalRecord.save(useTransaction ? { session } : {});

    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    return {
      membership: savedMembership,
      renewalRecord: savedRenewal,
      renewalType,
      message:
        renewalType === 'EARLY_EXTEND'
          ? `Membership successfully extended from existing expiry date to ${newExpiryDate.toISOString().split('T')[0]}`
          : `New membership activated from renewal date to ${newExpiryDate.toISOString().split('T')[0]}`,
    };
  } catch (error) {
    if (useTransaction && session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
}

/**
 * Retrieves all renewals with populated references
 */
async function getAllRenewals() {
  return RenewalHistory.find()
    .populate('member', 'memberId name email phone')
    .populate('plan', 'name durationMonths price')
    .sort({ createdAt: -1 });
}

/**
 * Retrieves renewals for a specific member
 */
async function getRenewalsByMember(memberId) {
  return RenewalHistory.find({ member: memberId })
    .populate('member', 'memberId name email phone')
    .populate('plan', 'name durationMonths price')
    .sort({ createdAt: -1 });
}

module.exports = {
  processRenewal,
  getAllRenewals,
  getRenewalsByMember,
};

