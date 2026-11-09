const express = require('express');
const router = express.Router();
const {
  createMembership,
  getAllMemberships,
  getMembershipById,
  getActiveMemberships,
  getExpiredMemberships,
  getMembershipsByMember,
} = require('../controllers/membershipController');
const { protect } = require('../middleware/authMiddleware');

// All membership endpoints require admin authentication
router.use(protect);

router.route('/').post(createMembership).get(getAllMemberships);
router.get('/status/active', getActiveMemberships);
router.get('/status/expired', getExpiredMemberships);
router.get('/member/:memberId', getMembershipsByMember);
router.get('/:id', getMembershipById);

module.exports = router;

