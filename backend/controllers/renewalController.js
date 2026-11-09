const mongoose = require('mongoose');
const renewalService = require('../services/renewalService');
const inMemoryStore = require('../services/inMemoryStore');

/**
 * @desc    Process a membership renewal (Case 1 early extend or Case 2 late renewal)
 * @route   POST /api/renewals
 * @access  Private (Admin)
 */
const processRenewal = async (req, res, next) => {
  try {
    const { membershipId, planId, renewalDate } = req.body;

    if (!membershipId || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both membershipId and planId',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const result = await renewalService.processRenewal({
        membershipId,
        planId,
        renewalDateInput: renewalDate,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          renewalType: result.renewalType,
          membership: result.membership.toObject ? result.membership.toObject({ virtuals: true }) : result.membership,
          renewalRecord: result.renewalRecord,
        },
      });
    } else {
      const result = await inMemoryStore.processRenewal({
        membershipId,
        planId,
        renewalDateInput: renewalDate,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          renewalType: result.renewalType,
          membership: result.membership,
          renewalRecord: result.renewalRecord,
        },
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all renewal history records
 * @route   GET /api/renewals
 * @access  Private (Admin)
 */
const getAllRenewals = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const renewals = await renewalService.getAllRenewals();
      return res.status(200).json({
        success: true,
        count: renewals.length,
        data: renewals,
      });
    } else {
      const renewals = await inMemoryStore.getAllRenewals();
      return res.status(200).json({
        success: true,
        count: renewals.length,
        data: renewals,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get renewal history for a specific member
 * @route   GET /api/renewals/member/:memberId
 * @access  Private (Admin)
 */
const getRenewalsByMember = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const renewals = await renewalService.getRenewalsByMember(req.params.memberId);
      return res.status(200).json({
        success: true,
        count: renewals.length,
        data: renewals,
      });
    } else {
      const renewals = await inMemoryStore.getRenewalsByMember(req.params.memberId);
      return res.status(200).json({
        success: true,
        count: renewals.length,
        data: renewals,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processRenewal,
  getAllRenewals,
  getRenewalsByMember,
};
