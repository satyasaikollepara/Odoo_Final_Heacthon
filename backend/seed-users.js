const pool = require('./db');
const bcrypt = require('bcrypt');
require('dotenv').config();

const USERS = [
  { name: 'Admin User',          email: 'admin@shivfurniture.com',     password: 'admin123',    role: 'ADMIN' },
  { name: 'Business Owner',      email: 'owner@shivfurniture.com',     password: 'owner123',    role: 'OWNER' },
  { name: 'Sales Manager',       email: 'sales@shivfurniture.com',     password: 'sales123',    role: 'SALES' },
  { name: 'Purchase Manager',    email: 'purchase@shivfurniture.com',  password: 'purchase123', role: 'PURCHASE' },
  { name: 'Mfg. Manager',        email: 'mfg@shivfurniture.com',       password: 'mfg123',      role: 'MANUFACTURING' },
  { name: 'Inventory Manager',   email: 'inventory@shivfurniture.com', password: 'inv123',      role: 'INVENTORY' },
];

async function seedUsers() {
  console.log('🌱 Seeding 6 role-based users...');
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    try {
      await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET password = $3, role = $4, name = $1`,
        [u.name, u.email, hashed, u.role]
      );
      console.log(`✅ ${u.role}: ${u.email} / ${u.password}`);
    } catch (err) {
      console.error(`❌ ${u.email}:`, err.message);
    }
  }
  console.log('\n🎉 All users seeded!');
  console.log('\n📋 Login Credentials:');
  USERS.forEach(u => console.log(`  ${u.role.padEnd(15)} → ${u.email} / ${u.password}`));
  process.exit(0);
}

seedUsers();
