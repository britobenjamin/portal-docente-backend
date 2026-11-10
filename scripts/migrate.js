// Crea la base (si no existe) y las tablas. Se puede correr varias veces sin romper nada.
import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

let conn;
try {
  conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    ssl: env.db.ssl ? { rejectUnauthorized: true } : undefined,
    multipleStatements: true,
  });
} catch (err) {
  console.error(`✖ No se pudo conectar a MySQL en ${env.db.host}:${env.db.port} como "${env.db.user}": ${err.message}`);
  console.error('  Revisá DB_HOST / DB_PORT / DB_USER / DB_PASSWORD en .env');
  process.exit(1);
}

try {
  if (!/^[A-Za-z0-9_]+$/.test(env.db.database)) throw new Error('DB_NAME solo puede tener letras, números y _');
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
  );
  await conn.query(`USE \`${env.db.database}\``);
  const sql = await fs.readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
  await conn.query(sql);
  console.log(`✔ Base "${env.db.database}" lista con todas las tablas.`);
} catch (err) {
  console.error('✖ Error en la migración:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
