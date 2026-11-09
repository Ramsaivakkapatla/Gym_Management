const express = require('express');
const router = express.Router();
const {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteOrDeactivateMember,
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');

// All member endpoints require admin authentication
router.use(protect);

router.route('/').post(createMember).get(getAllMembers);
router.route('/:id').get(getMemberById).put(updateMember).delete(deleteOrDeactivateMember);

module.exports = router;

