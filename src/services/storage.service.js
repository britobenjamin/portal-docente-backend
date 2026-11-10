// Abstracción del almacenamiento de PDFs.
//  - local:      guarda en ./uploads/leyes (solo desarrollo)
//  - cloudinary: producción
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

export const UPLOADS_DIR = path.resolve('uploads');
const LOCAL_SUBDIR = 'leyes';

const isCloudinary = () => env.storage.driver === 'cloudinary';

let cloudinaryReady = false;
function initCloudinary() {
  if (cloudinaryReady) return;
  const c = env.storage.cloudinary;
  if (!c.cloudName || !c.apiKey || !c.apiSecret) {
    throw new Error('STORAGE_DRIVER=cloudinary pero faltan CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET');
  }
  cloudinary.config({ cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret, secure: true });
  cloudinaryReady = true;
}

/**
 * Sube un PDF. `baseName` se usa para que el archivo tenga un nombre legible.
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadPdf(buffer, baseName = 'documento') {
  const safe = baseName.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 80) || 'documento';
  const unique = `${safe}-${crypto.randomBytes(4).toString('hex')}`;

  if (isCloudinary()) {
    initCloudinary();
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', format: 'pdf', folder: env.storage.cloudinary.folder, public_id: unique },
        (err, res) => (err ? reject(err) : resolve(res)),
      );
      stream.end(buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  const dir = path.join(UPLOADS_DIR, LOCAL_SUBDIR);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${unique}.pdf`;
  await fs.writeFile(path.join(dir, fileName), buffer);
  return {
    url: `${env.publicUrl}/uploads/${LOCAL_SUBDIR}/${fileName}`,
    publicId: `local:${LOCAL_SUBDIR}/${fileName}`,
  };
}

export async function deletePdf(publicId) {
  if (!publicId) return;
  if (publicId.startsWith('local:')) {
    const full = path.resolve(UPLOADS_DIR, publicId.slice('local:'.length));
    if (!full.startsWith(UPLOADS_DIR + path.sep)) return; // defensa ante paths raros
    await fs.rm(full, { force: true });
    return;
  }
  initCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}

/** Links derivados que usa el front: descarga forzada y miniatura de la 1ª página. */
export function pdfLinks(pdfUrl) {
  if (!pdfUrl) return { pdf_download_url: null, pdf_thumb_url: null };
  if (pdfUrl.includes('res.cloudinary.com') && pdfUrl.includes('/upload/')) {
    return {
      pdf_download_url: pdfUrl.replace('/upload/', '/upload/fl_attachment/'),
      pdf_thumb_url: pdfUrl.replace('/upload/', '/upload/pg_1,w_480,c_limit/').replace(/\.pdf$/i, '.jpg'),
    };
  }
  return { pdf_download_url: `${pdfUrl}?download=1`, pdf_thumb_url: null };
}
