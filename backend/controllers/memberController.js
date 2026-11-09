const mongoose = require('mongoose');
const Member = require('../models/Member');
const Membership = require('../models/Membership');
const RenewalHistory = require('../models/RenewalHistory');
const inMemoryStore = require('../services/inMemoryStore');

/**
 * @desc    Create a new member
 * @route   POST /api/members
 * @access  Private (Admin)
 */
const createMember = async (req, res, next) => {
  try {
    const { name, email, phone, gender, dob, address } = req.body;

    if (!name || !email || !phone || !gender || !dob) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, gender, dob',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const existingMember = await Member.findOne({ email: email.toLowerCase().trim() });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'A member with this email address already exists',
        });
      }

      const member = new Member({
        name,
        email,
        phone,
        gender,
        dob,
        address: address || '',
        isActive: true,
      });

      await member.save();

      return res.status(201).json({
        success: true,
        message: 'Member registered successfully',
        data: member,
      });
    } else {
      const all = await inMemoryStore.getAllMembers({});
      if (all.some((m) => m.email.toLowerCase() === email.toLowerCase().trim())) {
        return res.status(400).json({
          success: false,
          message: 'A member with this email address already exists',
        });
      }

      const member = await inMemoryStore.createMember(req.body);
      return res.status(201).json({
        success: true,
        message: 'Member registered successfully',
        data: member,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all members with search & dynamic status
 * @route   GET /api/members
 * @access  Private (Admin)
 */
const getAllMembers = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (status === 'active') query.isActive = true;
      else if (status === 'inactive') query.isActive = false;

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: regex },
          { email: regex },
          { phone: regex },
          { memberId: regex },
        ];
      }

      const members = await Member.find(query).sort({ createdAt: -1 });
      const memberIds = members.map((m) => m._id);
      const memberships = await Membership.find({ member: { $in: memberIds } })
        .populate('plan', 'name durationMonths price')
        .sort({ expiryDate: -1 });

      const latestMembershipMap = {};
      memberships.forEach((m) => {
        const mObj = m.toObject({ virtuals: true });
        if (!latestMembershipMap[m.member.toString()]) {
          latestMembershipMap[m.member.toString()] = mObj;
        }
      });

      const membersWithStatus = members.map((member) => {
        const doc = member.toObject();
        const latest = latestMembershipMap[member._id.toString()];
        doc.latestMembership = latest
          ? {
              _id: latest._id,
              planName: latest.planSnapshot?.name || latest.plan?.name,
              startDate: latest.startDate,
              expiryDate: latest.expiryDate,
              status: latest.status,
            }
          : null;
        return doc;
      });

      return res.status(200).json({
        success: true,
        count: membersWithStatus.length,
        data: membersWithStatus,
      });
    } else {
      const members = await inMemoryStore.getAllMembers({ search, status });
      return res.status(200).json({
        success: true,
        count: members.length,
        data: members,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single member details with membership & renewal history
 * @route   GET /api/members/:id
 * @access  Private (Admin)
 */
const getMemberById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const member = await Member.findById(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      const memberships = await Membership.find({ member: member._id })
        .populate('plan', 'name durationMonths price isActive')
        .sort({ expiryDate: -1 });

      const renewalHistory = await RenewalHistory.find({ member: member._id })
        .populate('plan', 'name durationMonths price')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: {
          member,
          memberships: memberships.map((m) => m.toObject({ virtuals: true })),
          renewalHistory,
        },
      });
    } else {
      const data = await inMemoryStore.getMemberById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      return res.status(200).json({ success: true, data });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update member information
 * @route   PUT /api/members/:id
 * @access  Private (Admin)
 */
const updateMember = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const member = await Member.findById(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      const { name, email, phone, gender, dob, address, isActive } = req.body;
      if (email && email.toLowerCase().trim() !== member.email) {
        const emailExists = await Member.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: member._id },
        });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use by another member',
          });
        }
        member.email = email.toLowerCase().trim();
      }

      if (name) member.name = name.trim();
      if (phone) member.phone = phone.trim();
      if (gender) member.gender = gender;
      if (dob) member.dob = dob;
      if (address !== undefined) member.address = address.trim();
      if (isActive !== undefined) member.isActive = isActive;

      await member.save();
      return res.status(200).json({
        success: true,
        message: 'Member updated successfully',
        data: member,
      });
    } else {
      const updated = await inMemoryStore.updateMember(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'Member updated successfully',
        data: updated,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate or toggle member status
 * @route   DELETE /api/members/:id
 * @access  Private (Admin)
 */
const deleteOrDeactivateMember = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const member = await Member.findById(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      member.isActive = !member.isActive;
      await member.save();

      return res.status(200).json({
        success: true,
        message: member.isActive
          ? 'Member reactivated successfully'
          : 'Member deactivated successfully (all historical records preserved)',
        data: member,
      });
    } else {
      const member = await inMemoryStore.toggleMemberStatus(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      return res.status(200).json({
        success: true,
        message: member.isActive
          ? 'Member reactivated successfully'
          : 'Member deactivated successfully (all historical records preserved)',
        data: member,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteOrDeactivateMember,
};
