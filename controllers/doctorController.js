const { Doctor, User } = require('../models');
const { Op } = require('sequelize');

exports.getDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;
    const query = { 
      where: { status: 'Active' }, 
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] 
    };

    // Only apply filter if specialization is a non-empty string
    if (specialization && specialization.trim() !== "") {
      query.where.specialization = { [Op.like]: `%${specialization}%` };
    }

    const doctors = await Doctor.findAll(query);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDoctorProfile = async (req, res) => {
  try {
    const { specialization, availability } = req.body;
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });

    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    doctor.specialization = specialization || doctor.specialization;
    doctor.availability = availability || doctor.availability;
    await doctor.save();

    res.json({ message: 'Doctor profile updated', doctor });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
