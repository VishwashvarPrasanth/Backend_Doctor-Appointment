const nodemailer = require('nodemailer');
const { User } = require('../models');

// Simulating BullMQ for demonstration (No Redis required)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async (data, name = 'Task') => {
  const { userId, appointmentId, type, status } = data;
  const user = await User.findByPk(userId);
  if (!user) return console.log(`[Demo] User not found for ID: ${userId}`);

  console.log(`[Demo Process] Processing: ${name} for ${user.email}`);
  let subject = 'Appointment Update';
  let text = `Your appointment (${appointmentId}) has been updated.`;

  if (type === 'AppointmentScheduled') {
    subject = 'Appointment Scheduled';
    text = `Hello ${user.name}, your appointment ${appointmentId} is scheduled!`;
  } else if (name === 'statusChange') {
    subject = `Appointment ${status}`;
    text = `Hello ${user.name}, your appointment ${appointmentId} is ${status}.`;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Doctor App" <notifications@doctorapp.com>',
      to: user.email,
      subject,
      text,
    });
    console.log(`[Demo Process] Email Sent (Simulated): ${info.messageId}`);
  } catch (err) {
    console.error('[Demo Process] Email Log:', text);
  }
};

const mockQueue = {
  add: async (name, data) => {
    console.log(`[Mock Queue] Job added: ${name}`);
    // Simulate async execution
    setTimeout(() => sendEmail(data, name), 1000);
    return { id: 'mock-job-id' };
  }
};

module.exports = mockQueue;
