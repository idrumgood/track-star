const express = require('express');
const router = express.Router();
const weekController = require('../controllers/weekController');
const configController = require('../controllers/configController');
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');

// Unauthenticated config route
router.get('/config', configController.getConfig);

// Apply auth to all subsequent routes
router.use(auth);

router.get('/week', weekController.getWeek);
router.post('/day/:id', weekController.updateDay);
router.get('/stats', statsController.getStats);

module.exports = router;
