const express = require('express');
const helmet = require('helmet');
const apiLimiter = require('./middleware/rateLimiter');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const doctorRoutes = require('./routes/doctor');
require('./models'); // Ensure associations are loaded
require('dotenv').config();

const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false })); // Fix for local demo script blocking
app.use((req, res, next) => {
    console.log(`[Backend Log] ${req.method} ${req.url}`);
    next();
});
app.use(express.static('public'));
app.use('/api/', apiLimiter);

// Services
app.use('/api/auth', authRoutes);
app.use('/api/appointments', bookingRoutes);
app.use('/api/doctors', doctorRoutes);

const initJobs = require('./jobs/cronJobs');

const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false }).then(() => {
  console.log('PostgreSQL Database Connected & Synced.');
  initJobs();
  app.listen(PORT, () => console.log(`Doctor Appointment System Running on Port: ${PORT}`));
}).catch(err => {
  console.error('Database Sync Error:', err);
});




