const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const membershipService = require('../services/membershipService');
const inMemoryStore = require('../services/inMemoryStore');

/**
 * @desc    Assign a membership plan to a member
 * @route   POST /api/memberships
 * @access  Private (Admin)
 */
const createMembership = async (req, res, next) => {
  try {
    const { memberId, planId, startDate } = req.body;

    if (!memberId || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both memberId and planId',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const membership = await membershipService.createMembership({
        memberId,
        planId,
        startDate,
      });

      return res.status(201).json({
        success: true,
        message: 'Membership assigned successfully',
        data: membership.toObject({ virtuals: true }),
      });
    } else {
      const membership = await inMemoryStore.createMembership({
        memberId,
        planId,
        startDate,
      });

      return res.status(201).json({
        success: true,
        message: 'Membership assigned successfully',
        data: membership,
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
 * @desc    Get all memberships with dynamic status
 * @route   GET /api/memberships
 * @access  Private (Admin)
 */
const getAllMemberships = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const memberships = await membershipService.getAllMemberships();
      return res.status(200).json({
        success: true,
        count: memberships.length,
        data: memberships,
      });
    } else {
      const memberships = await inMemoryStore.getAllMemberships();
      return res.status(200).json({
        success: true,
        count: memberships.length,
        data: memberships,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single membership by ID
 * @route   GET /api/memberships/:id
 * @access  Private (Admin)
 */
const getMembershipById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const membership = await Membership.findById(req.params.id)
        .populate('member', 'memberId name email phone isActive')
        .populate('plan', 'name durationMonths price isActive');

      if (!membership) {
        return res.status(404).json({ success: false, message: 'Membership not found' });
      }

      return res.status(200).json({
        success: true,
        data: membership.toObject({ virtuals: true }),
      });
    } else {
      const all = await inMemoryStore.getAllMemberships();
      const membership = all.find((m) => m._id === req.params.id);
      if (!membership) {
        return res.status(404).json({ success: false, message: 'Membership not found' });
      }
      return res.status(200).json({ success: true, data: membership });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active memberships
 * @route   GET /api/memberships/status/active
 * @access  Private (Admin)
 */
const getActiveMemberships = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const activeList = await membershipService.getMembershipsByStatus('active');
      return res.status(200).json({
        success: true,
        count: activeList.length,
        data: activeList,
      });
    } else {
      const activeList = await inMemoryStore.getMembershipsByStatus('active');
      return res.status(200).json({
        success: true,
        count: activeList.length,
        data: activeList,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all expired memberships
 * @route   GET /api/memberships/status/expired
 * @access  Private (Admin)
 */
const getExpiredMemberships = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const expiredList = await membershipService.getMembershipsByStatus('expired');
      return res.status(200).json({
        success: true,
        count: expiredList.length,
        data: expiredList,
      });
    } else {
      const expiredList = await inMemoryStore.getMembershipsByStatus('expired');
      return res.status(200).json({
        success: true,
        count: expiredList.length,
        data: expiredList,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all memberships for a specific member
 * @route   GET /api/memberships/member/:memberId
 * @access  Private (Admin)
 */
const getMembershipsByMember = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const list = await membershipService.getMembershipsByMember(req.params.memberId);
      return res.status(200).json({
        success: true,
        count: list.length,
        data: list,
      });
    } else {
      const list = await inMemoryStore.getMembershipsByMember(req.params.memberId);
      return res.status(200).json({
        success: true,
        count: list.length,
        data: list,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMembership,
  getAllMemberships,
  getMembershipById,
  getActiveMemberships,
  getExpiredMemberships,
  getMembershipsByMember,
};
