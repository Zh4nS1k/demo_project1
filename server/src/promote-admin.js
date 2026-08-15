/**
 * Promote a user to admin (or back to regular user).
 *
 * Usage:
 *   npm run promote-admin                    # promotes admin@coffee.dev
 *   npm run promote-admin -- alice@x.com     # promotes by email
 *   npm run promote-admin -- --demote alice@x.com
 *
 * Non-destructive: does not touch any other data.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

(async () => {
  const args = process.argv.slice(2);
  const demote = args.includes('--demote');
  const email = args.filter((a) => !a.startsWith('--'))[0] || 'admin@coffee.dev';

  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`✗ No user found with email: ${email}`);
    process.exit(1);
  }

  user.role = demote ? 'user' : 'admin';
  await user.save();

  console.log(`✓ ${user.username} (${user.email}) is now role="${user.role}"`);
  await mongoose.disconnect();
  process.exit(0);
})();
