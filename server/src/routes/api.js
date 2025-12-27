const express = require('express');
const router = express.Router();
const weekController = require('../controllers/weekController');
const mockAuth = require('../middleware/auth');

// Apply mock auth to all routes
router.use(mockAuth);

router.get('/week', weekController.getWeek);
router.post('/day/:id', weekController.updateDay);

module.exports = router;
