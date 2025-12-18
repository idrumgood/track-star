const express = require('express');
const router = express.Router();
const weekController = require('../controllers/weekController');

router.get('/week', weekController.getWeek);
router.post('/day/:id', weekController.updateDay);

module.exports = router;
