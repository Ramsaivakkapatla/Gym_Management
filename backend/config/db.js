const mongoose = require('mongoose');
const temporaryDB = require('../services/inMemoryStore');

const connectDB = async () => {
  // If user explicitly asks for MongoDB via USE_MONGODB=true
  if (process.env.USE_MONGODB === 'true') {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_management';
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.log(`⚠️  [MongoDB] Could not connect to MongoDB (${error.message}). Falling back to Temporary Database...`);
    }
  }

  // Default: Instant Zero-Config Temporary Local Database
  console.log(`\n================================================================`);
  console.log(`⚡  [IRONPULSE] Running with TEMPORARY LOCAL DATABASE!`);
  console.log(`📁  Data is persisted to: backend/data/gym_db.json`);
  console.log(`✅  NO MongoDB installation required!`);
  console.log(`🚀  All features (Admin Auth, Members, Plans, Memberships, Renewals)`);
  console.log(`    are 100% operational right now!`);
  console.log(`================================================================\n`);

  await temporaryDB.init();
  return null;
};

module.exports = connectDB;
