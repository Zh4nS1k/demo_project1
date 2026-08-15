/**
 * Seed script — populates the database with demo coffees, users, and consumption logs.
 *
 * Usage:
 *   npm run seed          # seed all
 *   npm run seed:clean    # drop Day, Coffee, User collections first
 *
 * Make sure MongoDB is running and MONGODB_URI is set in .env
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const User = require('./models/User');
const Coffee = require('./models/Coffee');
const Day = require('./models/Day');

// ─── Seed Data ───

const coffees = [
  { name: 'Espresso',          taste: 'bitter',    energy_boost: 9,  milk: 0 },
  { name: 'Americano',         taste: 'bitter',    energy_boost: 7,  milk: 0 },
  { name: 'Latte',             taste: 'sweet',     energy_boost: 6,  milk: 1 },
  { name: 'Cappuccino',        taste: 'sweet',     energy_boost: 7,  milk: 1 },
  { name: 'Macchiato',         taste: 'bitter',    energy_boost: 8,  milk: 1 },
  { name: 'Mocha',             taste: 'chocolate', energy_boost: 7,  milk: 1 },
  { name: 'Flat White',        taste: 'nutty',     energy_boost: 7,  milk: 1 },
  { name: 'Cold Brew',         taste: 'chocolate', energy_boost: 8,  milk: 0 },
  { name: 'Turkish Coffee',    taste: 'bitter',    energy_boost: 10, milk: 0 },
  { name: 'Iced Latte',        taste: 'caramel',   energy_boost: 6,  milk: 1 },
  { name: 'Pour Over',         taste: 'fruity',    energy_boost: 6,  milk: 0 },
  { name: 'Cortado',           taste: 'nutty',     energy_boost: 7,  milk: 1 },
  { name: 'Affogato',          taste: 'sweet',     energy_boost: 5,  milk: 1 },
  { name: 'Irish Coffee',      taste: 'caramel',   energy_boost: 6,  milk: 1 },
  { name: 'Ristretto',         taste: 'bitter',    energy_boost: 9,  milk: 0 },
  { name: 'Frappuccino',       taste: 'caramel',   energy_boost: 4,  milk: 1 },
  { name: 'Doppio',            taste: 'bitter',    energy_boost: 9,  milk: 0 },
  { name: 'Vietnamese Coffee', taste: 'sweet',     energy_boost: 8,  milk: 1 },
];

const users = [
  {
    username: 'admin',
    email: 'admin@coffee.dev',
    password: 'admin123',
    name: 'Admin User',
    age: 35,
    gender: 'other',
    favourite_coffee: 'Espresso',
    role: 'admin',
  },
  {
    username: 'alice',
    email: 'alice@example.com',
    password: 'alice123',
    name: 'Alice Walker',
    age: 28,
    gender: 'female',
    favourite_coffee: 'Latte',
  },
  {
    username: 'bob',
    email: 'bob@example.com',
    password: 'bob123',
    name: 'Bob Smith',
    age: 32,
    gender: 'male',
    favourite_coffee: 'Cold Brew',
  },
  {
    username: 'nina',
    email: 'nina@example.com',
    password: 'nina123',
    name: 'Nina Patel',
    age: 24,
    gender: 'female',
    favourite_coffee: 'Mocha',
  },
  {
    username: 'carlos',
    email: 'carlos@example.com',
    password: 'carlos123',
    name: 'Carlos Mendez',
    age: 41,
    gender: 'male',
    favourite_coffee: 'Turkish Coffee',
  },
];

// Random day entries
function generateDays(usernames, coffeeNames) {
  const days = [];
  const now = new Date();

  for (let i = 0; i < 60; i++) {
    const user = usernames[Math.floor(Math.random() * usernames.length)];
    const coffee = coffeeNames[Math.floor(Math.random() * coffeeNames.length)];
    const cups = Math.floor(Math.random() * 4) + 1;
    const rating = Math.floor(Math.random() * 6); // 0-5
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    days.push({
      date,
      username: user,
      coffee_name: coffee,
      count_of_cups: cups,
      rating,
    });
  }

  return days;
}

// ─── Runner ───

async function seed(clean = false) {
  await connectDB();

  console.log('\n🌱 Starting seed...\n');

  if (clean) {
    console.log('🧹 Cleaning existing data...');
    await Promise.all([
      User.deleteMany({}),
      Coffee.deleteMany({}),
      Day.deleteMany({}),
    ]);
    console.log('   Dropped User, Coffee, Day collections.\n');
  }

  // ── Coffees ──
  console.log(`☕ Inserting ${coffees.length} coffees...`);
  const existingCoffees = await Coffee.countDocuments();
  if (existingCoffees > 0 && !clean) {
    console.log('   Coffees already exist — skipping. Use npm run seed:clean to re-seed.');
  } else {
    await Coffee.insertMany(coffees, { ordered: false }).catch(() => {});
    console.log(`   ✅ Inserted ${coffees.length} coffees`);
  }
  const allCoffees = await Coffee.find();
  const coffeeNames = allCoffees.map((c) => c.name);

  // ── Users ──
  console.log(`\n👤 Inserting ${users.length} users...`);
  for (const u of users) {
    const exists = await User.findOne({ $or: [{ email: u.email }, { username: u.username }] });
    if (exists) {
      console.log(`   ⏭️  ${u.username} already exists — skipping`);
      continue;
    }
    await User.create(u);
    console.log(`   ✅ ${u.username} (${u.email})  —  password: ${u.password}`);
  }

  // ── Days ──
  console.log('\n📅 Generating consumption logs...');
  const allUsers = await User.find().select('username');
  const usernames = allUsers.map((u) => u.username);
  const dayEntries = generateDays(usernames, coffeeNames);

  const existingDays = await Day.countDocuments();
  if (existingDays > 50 && !clean) {
    console.log(`   ${existingDays} entries already exist — skipping day generation.`);
  } else {
    await Day.insertMany(dayEntries, { ordered: false }).catch(() => {});
    console.log(`   ✅ Inserted ${dayEntries.length} day entries`);
  }

  // ── Summary ──
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Database Summary:');
  console.log(`   Users:   ${await User.countDocuments()}`);
  console.log(`   Coffees: ${await Coffee.countDocuments()}`);
  console.log(`   Days:    ${await Day.countDocuments()}`);
  console.log('═'.repeat(50));

  console.log('\n🔑 Demo Credentials:');
  console.log('   admin   / admin123   (admin@coffee.dev)');
  console.log('   alice   / alice123   (alice@example.com)');
  console.log('   bob     / bob123     (bob@example.com)');
  console.log('   nina    / nina123    (nina@example.com)');
  console.log('   carlos  / carlos123  (carlos@example.com)');
  console.log('\n✅ Seed complete!\n');

  await mongoose.connection.close();
  process.exit(0);
}

const clean = process.argv.includes('--clean');

seed(clean).catch((err) => {
  console.error(`\n❌ Seed error: ${err.message}\n`);
  process.exit(1);
});
