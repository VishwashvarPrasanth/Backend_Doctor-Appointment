const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Use PostgreSQL when running inside Docker (DB_HOST env is set)
// Otherwise use SQLite for local development (zero setup required)
if (process.env.DB_HOST) {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'doctor_appointment',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'password',
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      port: Number(process.env.DB_PORT) || 5432,
      logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    }
  );
} else if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
} else {
  // Local development: use SQLite (no installation required)
  console.log('[DB] No PostgreSQL config found. Using SQLite for local development.');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
  });
}

module.exports = sequelize;




