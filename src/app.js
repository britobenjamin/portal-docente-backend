import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { UPLOADS_DIR } from './services/storage.service.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // Render está detrás de un proxy (necesario para el rate limit por IP)
  app.use(
    helmet({
      // Permite que el front (otro origen) embeba y descargue los PDFs servidos en modo local.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin(origin, cb) {
        // Sin origin = curl / herramientas del servidor
        if (!origin || env.frontendUrls.includes(origin)) return cb(null, true);
        cb(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  // PDFs en modo local. Con ?download=1 se fuerza la descarga.
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      setHeaders(res, filePath) {
        // El front (otro origen) muestra el PDF en un <iframe>: se quitan los bloqueos de helmet solo acá.
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        if (res.req.query.download) {
          res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
        }
      },
    }),
  );

  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
