require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seedAdmin({ nome, email, senha, role = 'ADMIN' }) {
  try {
    // check if user already exists
    const [rows] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.log(`User with email ${email} already exists (id=${rows[0].id}). Aborting.`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(senha, 10);

    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)',
      [nome, email, hash, role]
    );

    console.log('Admin user created with id:', result.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Error inserting admin user:', err.message || err);
    process.exit(1);
  }
}

// CLI: node scripts/seedAdmin.js email senha [nome]
const argv = process.argv.slice(2);
if (argv.length < 2) {
  console.log('Usage: node scripts/seedAdmin.js <email> <senha> [nome]');
  console.log('Example: node scripts/seedAdmin.js admin@escola.com admin123 "Admin"');
  process.exit(0);
}

const [email, senha, nome = 'Admin'] = argv;

seedAdmin({ nome, email, senha }).catch(err => {
  console.error(err);
});
