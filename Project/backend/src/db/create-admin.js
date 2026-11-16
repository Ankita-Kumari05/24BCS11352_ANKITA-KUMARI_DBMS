require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.ADMIN_EMAIL;
  const fullName = args[1] || process.env.ADMIN_NAME || 'Placement Director';
  const password = args[2] || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('\nUsage:');
    console.log('  node src/db/create-admin.js <email> <full_name> <password>');
    console.log('Example:');
    console.log('  node src/db/create-admin.js tpo@university.edu "Dr. Placement Officer" SecurePass@2026\n');
    process.exit(1);
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`⚠️ User with email "${email}" already exists.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name)
       VALUES ($1, $2, 'TPO_ADMIN', $3)
       RETURNING id, email, full_name, role`,
      [email, passwordHash, fullName]
    );

    console.log('\n✅ Genuine TPO Administrator created successfully:');
    console.log(`   ID:        ${result.rows[0].id}`);
    console.log(`   Email:     ${result.rows[0].email}`);
    console.log(`   Name:      ${result.rows[0].full_name}`);
    console.log(`   Role:      ${result.rows[0].role}\n`);
  } catch (err) {
    console.error('❌ Failed to create administrator:', err.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
