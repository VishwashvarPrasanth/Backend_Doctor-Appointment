const bookingService = require('../services/bookingService');
const notificationQueue = require('../workers/notificationWorker');
const { Appointment, User, Doctor } = require('../models');

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate } = req.body;

    // 1. Check if the doctor is available at that time
    const isAvailable = await bookingService.checkInAvailability(doctorId, appointmentDate);
    if (!isAvailable) return res.status(400).json({ message: 'Doctor is not available at this time' });

    // 2. Check for conflicts
    const isBooked = await bookingService.checkConflict(doctorId, appointmentDate);
    if (isBooked) return res.status(409).json({ message: 'Time Conflict: Already Booked' });

    const appointment = await Appointment.create({ doctorId, userId: req.user.id, appointmentDate });
    
    // Enqueue notification task
    await notificationQueue.add('sendNotification', {
      userId: req.user.id,
      appointmentId: appointment.id,
      type: 'AppointmentScheduled'
    });

    res.status(201).json({ message: 'Appointment Scheduled Successfully', id: appointment.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    let where = {};
    let include = [];

    if (req.user.role === 'User') {
      where = { userId: req.user.id };
      include = [{ model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['name'] }] }];
    } else if (req.user.role === 'Doctor') {
      // Find the doctor ID for this user ID
      const doctorProfile = await Doctor.findOne({ where: { userId: req.user.id } });
      if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });
      where = { doctorId: doctorProfile.id };
      include = [{ model: User, as: 'patient', attributes: ['name', 'email'] }];
    } else if (req.user.role === 'Admin') {
      where = {}; // Admin sees all
    }

    const appointments = await Appointment.findAll({ where, include });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const appointment = await Appointment.findByPk(id);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Authorization: Doctors can update their own, patients can only cancel
    if (req.user.role === 'Doctor') {
      const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
      if (appointment.doctorId !== doctor.id) return res.status(403).json({ message: 'Unauthorized' });
    } else if (req.user.role === 'User') {
      if (appointment.userId !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
      if (status !== 'Cancelled') return res.status(400).json({ message: 'Users can only cancel appointments' });
    }

    appointment.status = status;
    await appointment.save();

    // Notify of status change
    await notificationQueue.add('statusChange', {
      userId: appointment.userId,
      appointmentId: appointment.id,
      status
    });

    res.json({ message: `Appointment marked as ${status}`, appointment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
