const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const inMemoryStore = require('../services/inMemoryStore');

/**
 * @desc    Create a new membership plan
 * @route   POST /api/plans
 * @access  Private (Admin)
 */
const createPlan = async (req, res, next) => {
  try {
    const { name, durationMonths, price, description, isActive } = req.body;

    if (!name || durationMonths === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide plan name, duration in months, and price',
      });
    }

    if (durationMonths < 1) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be at least 1 month',
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const plan = new Plan({
        name: name.trim(),
        durationMonths: Number(durationMonths),
        price: Number(price),
        description: description ? description.trim() : '',
        isActive: isActive !== undefined ? isActive : true,
      });

      await plan.save();

      return res.status(201).json({
        success: true,
        message: 'Membership plan created successfully',
        data: plan,
      });
    } else {
      const plan = await inMemoryStore.createPlan(req.body);
      return res.status(201).json({
        success: true,
        message: 'Membership plan created successfully',
        data: plan,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all membership plans
 * @route   GET /api/plans
 * @access  Private (Admin)
 */
const getAllPlans = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (activeOnly === 'true') query.isActive = true;

      const plans = await Plan.find(query).sort({ durationMonths: 1, price: 1 });
      return res.status(200).json({
        success: true,
        count: plans.length,
        data: plans,
      });
    } else {
      const plans = await inMemoryStore.getAllPlans({ activeOnly });
      return res.status(200).json({
        success: true,
        count: plans.length,
        data: plans,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a membership plan
 * @route   PUT /api/plans/:id
 * @access  Private (Admin)
 */
const updatePlan = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const plan = await Plan.findById(req.params.id);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Membership plan not found' });
      }

      const { name, durationMonths, price, description, isActive } = req.body;
      if (name) plan.name = name.trim();
      if (durationMonths !== undefined) plan.durationMonths = Number(durationMonths);
      if (price !== undefined) plan.price = Number(price);
      if (description !== undefined) plan.description = description.trim();
      if (isActive !== undefined) plan.isActive = isActive;

      await plan.save();
      return res.status(200).json({
        success: true,
        message: 'Membership plan updated successfully',
        data: plan,
      });
    } else {
      const plan = await inMemoryStore.updatePlan(req.params.id, req.body);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Membership plan not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'Membership plan updated successfully',
        data: plan,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle plan active/inactive status
 * @route   PATCH /api/plans/:id/status
 * @access  Private (Admin)
 */
const togglePlanStatus = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const plan = await Plan.findById(req.params.id);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Membership plan not found' });
      }

      plan.isActive = !plan.isActive;
      await plan.save();

      return res.status(200).json({
        success: true,
        message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
        data: plan,
      });
    } else {
      const plan = await inMemoryStore.togglePlanStatus(req.params.id);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Membership plan not found' });
      }
      return res.status(200).json({
        success: true,
        message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
        data: plan,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  updatePlan,
  togglePlanStatus,
};
