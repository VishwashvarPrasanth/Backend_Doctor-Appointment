const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { Op } = require('sequelize');

exports.checkInAvailability = async (doctorId, appointmentDate) => {
  const doctor = await Doctor.findByPk(doctorId);
  if (!doctor || !doctor.availability) return false;

  const dateObject = new Date(appointmentDate);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[dateObject.getDay()];
  const reqH = dateObject.getHours();
  const reqM = dateObject.getMinutes();
  const reqTimeVal = reqH * 100 + reqM;

  const availableSlots = doctor.availability[dayName] || [];
  
  return availableSlots.some(slot => {
    const [start, end] = slot.split('-');
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startVal = sh * 100 + sm;
    const endVal = eh * 100 + em;
    return reqTimeVal >= startVal && reqTimeVal <= endVal;
  });
};

exports.checkConflict = async (doctorId, appointmentDate) => {
  const startTime = new Date(appointmentDate);
  const endTime = new Date(new Date(appointmentDate).getTime() + 30 * 60000); // 30 min duration

  const existing = await Appointment.findOne({
    where: {
      doctorId,
      appointmentDate: {
        [Op.between]: [startTime, endTime],
      },
      status: 'Scheduled',
    },
  });

  return existing !== null;
};
