// Crea o actualiza los 3 admins a partir de ADMIN{1,2,3}_NOMBRE / _EMAIL / _PASSWORD.
// Uso directo en producción: `npm run seed:admins`
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { pool } from '../src/config/db.js';

export async function seedAdmins() {
  const ids = [];
  for (const n of [1, 2, 3]) {
    const nombre = process.env[`ADMIN${n}_NOMBRE`]?.trim();
    const email = process.env[`ADMIN${n}_EMAIL`]?.trim().toLowerCase();
    const password = process.env[`ADMIN${n}_PASSWORD`];
    if (!nombre || !email || !password) {
      console.warn(`⚠ ADMIN${n}: faltan NOMBRE, EMAIL o PASSWORD en .env → no se crea.`);
      continue;
    }
    if (password.length < 8) {
      console.warn(`⚠ ADMIN${n}: la contraseña debe tener al menos 8 caracteres → no se crea.`);
      continue;
    }
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO admins (nombre, email, password_hash) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password_hash = VALUES(password_hash)`,
      [nombre, email, hash],
    );
    const [[row]] = await pool.query('SELECT id FROM admins WHERE email = ?', [email]);
    ids.push(row.id);
    console.log(`✔ Admin ${n}: ${nombre} <${email}>`);
  }
  return ids;
}

// Ejecutado directamente
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await seedAdmins();
  } finally {
    await pool.end();
  }
}
