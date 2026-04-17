const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Doctor = sequelize.define('Doctor', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  specialization: { type: DataTypes.STRING, allowNull: false },
  availability: { type: DataTypes.TEXT, defaultValue: '{}', get() { const raw = this.getDataValue('availability'); try { return JSON.parse(raw); } catch { return {}; } }, set(val) { this.setDataValue('availability', JSON.stringify(val)); } },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
});

module.exports = Doctor;
