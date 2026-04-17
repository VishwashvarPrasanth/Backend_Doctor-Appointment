const sequelize = require('./config/db');
const { User, Doctor, Appointment } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database Synced.');

    const plainPassword = 'password123';

    // Create Admin
    await User.create({
      name: 'System Admin',
      email: 'admin@doccare.com',
      password_hash: plainPassword,
      role: 'Admin'
    });

    // Create Doctors
    const doctors = [
      { name: 'Dr. John Smith', email: 'john@doccare.com', specialization: 'Cardiology' },
      { name: 'Dr. Sarah Wilson', email: 'sarah@doccare.com', specialization: 'Pediatrics' },
      { name: 'Dr. Robert Brown', email: 'robert@doccare.com', specialization: 'Neurology' }
    ];

    for (const d of doctors) {
      const user = await User.create({
        name: d.name,
        email: d.email,
        password_hash: plainPassword,
        role: 'Doctor'
      });

      await Doctor.create({
        userId: user.id,
        specialization: d.specialization,
        availability: {
          Monday: ["09:00-17:00"], Tuesday: ["09:00-17:00"], Wednesday: ["09:00-17:00"], 
          Thursday: ["09:00-17:00"], Friday: ["09:00-17:00"], Saturday: ["09:00-13:00"], Sunday: []
        }
      });
    }

    // Create a Patient
    await User.create({
      name: 'Test Patient',
      email: 'patient@example.com',
      password_hash: plainPassword,
      role: 'User'
    });

    console.log('Seed data created successfully!');
    process.exit(0);
  } catch (err) {

    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
