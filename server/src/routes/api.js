const express = require('express');
const router = express.Router();
const weekController = require('../controllers/weekController');
const configController = require('../controllers/configController');
const statsController = require('../controllers/statsController');
const activityController = require('../controllers/activityController');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Unauthenticated config route
router.get('/config', configController.getConfig);

// Apply auth to all subsequent routes
router.use(auth);

router.get('/week', weekController.getWeek);
router.post('/day/:id', weekController.updateDay);
router.get('/stats', statsController.getStats);
router.get('/activities', activityController.getActivities);
router.delete('/activities/:id', activityController.deleteActivity);

router.get('/user/profile', userController.getProfile);
router.patch('/user/profile', userController.updateProfile);

module.exports = router;
