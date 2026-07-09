require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { provisionAdminAccount } = require('../config/admin');

const run = async () => {
  try {
    await connectDB();
    await provisionAdminAccount();
    console.log('[ADMIN] Provisioning complete.');
  } catch (error) {
    console.error(`[ADMIN] Provisioning failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
