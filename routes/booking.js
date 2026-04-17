const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, authorize } = require('../middleware/auth');

router.use(verifyToken);
router.post('/', authorize(['User']), bookingController.bookAppointment);
router.get('/', authorize(['User', 'Doctor', 'Admin']), bookingController.getAppointments);
router.patch('/:id/status', authorize(['User', 'Doctor', 'Admin']), bookingController.updateAppointmentStatus);

module.exports = router;
