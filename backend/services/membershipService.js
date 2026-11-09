const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Membership = require('../models/Membership');
const {
  addCalendarMonths,
  normalizeToDateOnly,
  getTodayDateOnly,
  computeMembershipStatus,
} = require('../utils/dateUtils');

/**
 * Creates a new membership for a member with plan snapshot and date calculation.
 * Prevents overlapping active memberships.
 */
async function createMembership({ memberId, planId, startDate }) {
  // 1. Validate Member
  const member = await Member.findById(memberId);
  if (!member) {
    throw new Error('Member not found');
  }
  if (!member.isActive) {
    throw new Error('Cannot assign a membership to a deactivated member');
  }

  // 2. Validate Plan
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error('Membership plan not found');
  }
  if (!plan.isActive) {
    throw new Error('Cannot assign an inactive membership plan');
  }

  // 3. Normalize Start Date & Calculate Expiry Date
  const normalizedStart = normalizeToDateOnly(startDate) || getTodayDateOnly();
  const calculatedExpiry = addCalendarMonths(normalizedStart, plan.durationMonths);

  // 4. Overlap Check: A member should not have overlapping active membership periods
  // Check existing memberships where date intervals overlap:
  // [existing.startDate, existing.expiryDate] overlaps with [normalizedStart, calculatedExpiry]
  const overlappingMemberships = await Membership.find({
    member: member._id,
    startDate: { $lte: calculatedExpiry },
    expiryDate: { $gte: normalizedStart },
  });

  if (overlappingMemberships.length > 0) {
    const existing = overlappingMemberships[0];
    const existingStart = existing.startDate.toISOString().split('T')[0];
    const existingEnd = existing.expiryDate.toISOString().split('T')[0];
    throw new Error(
      `Member already has an active or overlapping membership from ${existingStart} to ${existingEnd}. Please renew the existing membership or select a start date after the existing expiry date.`
    );
  }

  // 5. Create Membership with Snapshot
  const membership = new Membership({
    member: member._id,
    plan: plan._id,
    planSnapshot: {
      name: plan.name,
      durationMonths: plan.durationMonths,
      price: plan.price,
    },
    startDate: normalizedStart,
    expiryDate: calculatedExpiry,
  });

  await membership.save();
  return membership.populate(['member', 'plan']);
}

/**
 * Retrieves all memberships with dynamic status
 */
async function getAllMemberships() {
  const memberships = await Membership.find()
    .populate('member', 'memberId name email phone isActive')
    .populate('plan', 'name durationMonths price isActive')
    .sort({ createdAt: -1 });

  return memberships.map((m) => {
    const doc = m.toObject({ virtuals: true });
    return doc;
  });
}

/**
 * Retrieves memberships by member ID
 */
async function getMembershipsByMember(memberId) {
  const memberships = await Membership.find({ member: memberId })
    .populate('member', 'memberId name email phone isActive')
    .populate('plan', 'name durationMonths price isActive')
    .sort({ expiryDate: -1 });

  return memberships.map((m) => m.toObject({ virtuals: true }));
}

/**
 * Retrieves memberships by active or expired status dynamically
 */
async function getMembershipsByStatus(statusType) {
  const today = getTodayDateOnly();
  let query = {};

  if (statusType.toLowerCase() === 'active') {
    // Expiry date on or after today
    query = { expiryDate: { $gte: today } };
  } else if (statusType.toLowerCase() === 'expired') {
    // Expiry date before today
    query = { expiryDate: { $lt: today } };
  }

  const memberships = await Membership.find(query)
    .populate('member', 'memberId name email phone isActive')
    .populate('plan', 'name durationMonths price isActive')
    .sort({ expiryDate: -1 });

  return memberships.map((m) => m.toObject({ virtuals: true }));
}

module.exports = {
  createMembership,
  getAllMemberships,
  getMembershipsByMember,
  getMembershipsByStatus,
};

