const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const inMemoryStore = require('../services/inMemoryStore');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hackathon_secret_jwt_key_2026');

      let admin;
      if (mongoose.connection.readyState === 1) {
        admin = await Admin.findById(decoded.id).select('-password');
      } else {
        admin = await inMemoryStore.findAdminById(decoded.id);
      }

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin account not found or deactivated',
        });
      }

      req.admin = admin;
      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }
};

module.exports = { protect };
