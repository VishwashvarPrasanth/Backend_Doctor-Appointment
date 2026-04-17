const cron = require('node-cron');
const logger = require('../config/logger');
const { Appointment } = require('../models');

const initJobs = () => {
  // Every minute job
  cron.schedule('* * * * *', async () => {
    logger.info('Background Job: Tracking System Status (Simulation)');
    try {
      const count = await Appointment.count();
      logger.info(`System Status: Currently tracking ${count} active appointments.`);
    } catch (err) {
      logger.error('Background Job error:', err);
    }
  });

  logger.info('Cron Jobs Initialized');
};

module.exports = initJobs;

