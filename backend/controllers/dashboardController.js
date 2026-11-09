const mongoose = require('mongoose');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Membership = require('../models/Membership');
const { getTodayDateOnly } = require('../utils/dateUtils');
const inMemoryStore = require('../services/inMemoryStore');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const today = getTodayDateOnly();

      const [totalMembers, activeMemberships, expiredMemberships, totalPlans] = await Promise.all([
        Member.countDocuments(),
        Membership.countDocuments({ expiryDate: { $gte: today } }),
        Membership.countDocuments({ expiryDate: { $lt: today } }),
        Plan.countDocuments(),
      ]);

      const recentMemberships = await Membership.find()
        .populate('member', 'memberId name email')
        .populate('plan', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      const recentFormatted = recentMemberships.map((m) => m.toObject({ virtuals: true }));

      return res.status(200).json({
        success: true,
        data: {
          totalMembers,
          activeMemberships,
          expiredMemberships,
          totalPlans,
          recentMemberships: recentFormatted,
        },
      });
    } else {
      const stats = await inMemoryStore.getDashboardStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
