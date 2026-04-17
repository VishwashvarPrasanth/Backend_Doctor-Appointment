const { User, Doctor } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, specialization } = req.body;
    const user = await User.create({ name, email, password_hash: password, role });

    // If registered as a doctor, create the doctor profile
    if (role === 'Doctor') {
      await Doctor.create({
        userId: user.id,
        specialization: specialization || 'General Physician',
        availability: {
          Monday: ["09:00-17:00"], Tuesday: ["09:00-17:00"], Wednesday: ["09:00-17:00"], 
          Thursday: ["09:00-17:00"], Friday: ["09:00-17:00"], Saturday: ["09:00-17:00"], Sunday: ["09:00-17:00"]
        }
      });
    }

    res.status(201).json({ message: 'User Registered Successfully', id: user.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Email or Password incorrect' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
