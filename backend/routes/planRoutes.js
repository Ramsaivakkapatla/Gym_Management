const express = require('express');
const router = express.Router();
const {
  createPlan,
  getAllPlans,
  updatePlan,
  togglePlanStatus,
} = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

// All plan endpoints require admin authentication
router.use(protect);

router.route('/').post(createPlan).get(getAllPlans);
router.route('/:id').put(updatePlan);
router.patch('/:id/status', togglePlanStatus);

module.exports = router;

