const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, authorize } = require('../middleware/auth');

// Public route to search doctors
router.get('/', doctorController.getDoctors);

// Protected route to update profile (only for doctors)
router.put('/profile', verifyToken, authorize(['Doctor']), doctorController.updateDoctorProfile);

module.exports = router;
