// Lee y valida las variables de entorno en un solo lugar.
const required = (name) => {
  const v = process.env[name];
  if (v === undefined || v === '') {
    throw new Error(`Falta la variable de entorno ${name} (ver .env.example)`);
  }
  return v;
};

const port = Number(process.env.PORT || 4000);

export const env = {
  port,
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portal_docente',
    ssl: process.env.DB_SSL === 'true',
  },
  jwt: {
    get secret() {
      return required('JWT_SECRET');
    },
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      folder: process.env.CLOUDINARY_FOLDER || 'portal-docente/leyes',
    },
  },
};
