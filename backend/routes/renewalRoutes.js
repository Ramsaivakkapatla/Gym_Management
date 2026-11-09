const express = require('express');
const router = express.Router();
const {
  processRenewal,
  getAllRenewals,
  getRenewalsByMember,
} = require('../controllers/renewalController');
const { protect } = require('../middleware/authMiddleware');

// All renewal endpoints require admin authentication
router.use(protect);

router.route('/').post(processRenewal).get(getAllRenewals);
router.get('/member/:memberId', getRenewalsByMember);

module.exports = router;

