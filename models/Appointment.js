const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  doctorId: { type: DataTypes.UUID, allowNull: false },
  appointmentDate: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Scheduled', validate: { isIn: [['Scheduled', 'Completed', 'Cancelled']] } },
  history: { type: DataTypes.TEXT, defaultValue: '[]', get() { const raw = this.getDataValue('history'); try { return JSON.parse(raw); } catch { return []; } }, set(val) { this.setDataValue('history', JSON.stringify(val)); } },
});

module.exports = Appointment;
