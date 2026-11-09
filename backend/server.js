const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const { seedInitialData } = require('./utils/seedData');

const PORT = parseInt(process.env.PORT, 10) || 4000;

// Start server
const startServer = async () => {
  try {
    // Attempt DB connection (falls back to in-memory store if no DB is reachable)
    await connectDB();

    // If connected to real MongoDB, run seed script
    if (mongoose.connection.readyState === 1) {
      await seedInitialData();
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`🚀 Gym Management Backend running on PORT: ${PORT}`);
      console.log(`📍 API base URL: http://localhost:${PORT}/api`);
      console.log(`🔐 Admin login credentials: admin@gym.com / admin123`);
      console.log(`===============================================`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err.message);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
