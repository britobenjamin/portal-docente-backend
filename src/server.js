import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const app = createApp();

try {
  await pool.query('SELECT 1');
  console.log(`✔ Conectado a MySQL (${env.db.host}:${env.db.port}/${env.db.database})`);
} catch (err) {
  console.error('✖ No se pudo conectar a MySQL:', err.message);
  console.error('  Revisá DB_HOST / DB_USER / DB_PASSWORD / DB_NAME en .env y que hayas corrido `npm run migrate`.');
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`✔ API escuchando en http://localhost:${env.port}/api`);
  console.log(`  CORS permitido para: ${env.frontendUrls.join(', ')}`);
  console.log(`  Almacenamiento de PDFs: ${env.storage.driver}`);
});
