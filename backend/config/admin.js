const User = require('../models/User');

const LEGACY_ADMIN_EMAIL = 'admin@parfum.com';

const getAdminConfig = () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return {
    email,
    password,
    name: process.env.ADMIN_NAME?.trim() || 'Admin',
    phone: process.env.ADMIN_PHONE?.trim() || 'Not provided',
    location: process.env.ADMIN_LOCATION?.trim() || 'Not provided',
    legacyEmail: process.env.ADMIN_LEGACY_EMAIL?.trim().toLowerCase() || LEGACY_ADMIN_EMAIL,
  };
};

const provisionAdminAccount = async () => {
  const config = getAdminConfig();

  if (!config) {
    console.warn('[ADMIN] ADMIN_EMAIL and ADMIN_PASSWORD are not configured; provisioning skipped.');
    return null;
  }

  if (config.password.length < 8 || config.password.length > 128) {
    throw new Error('ADMIN_PASSWORD must be between 8 and 128 characters.');
  }

  let user = await User.findOne({ email: config.email });

  if (!user && config.legacyEmail !== config.email) {
    user = await User.findOne({ email: config.legacyEmail });
  }

  if (!user) {
    user = await User.findOne({ role: 'admin' });
  }

  if (!user) {
    user = new User();
  }

  const passwordMatches = user.password
    ? await user.comparePassword(config.password)
    : false;

  user.name = config.name;
  user.email = config.email;
  user.phone = config.phone;
  user.location = config.location;
  user.role = 'admin';

  if (!passwordMatches) {
    user.password = config.password;
  }

  await user.save();

  // If both the new account and the legacy account existed, the old login
  // must no longer retain admin access.
  if (config.legacyEmail !== config.email) {
    await User.updateMany(
      { _id: { $ne: user._id }, email: config.legacyEmail, role: 'admin' },
      { $set: { role: 'user' } }
    );
  }

  console.log(`[ADMIN] Admin account ready: ${config.email}`);
  return user;
};

let provisioningPromise;

const ensureAdminAccount = () => {
  if (!provisioningPromise) {
    provisioningPromise = provisionAdminAccount().catch((error) => {
      provisioningPromise = null;
      throw error;
    });
  }

  return provisioningPromise;
};

module.exports = {
  ensureAdminAccount,
  provisionAdminAccount,
};
