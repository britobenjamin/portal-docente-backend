import slugify from 'slugify';
import { pool } from '../config/db.js';

export const toSlug = (text) =>
  slugify(String(text), { lower: true, strict: true, locale: 'es', trim: true }).slice(0, 180) || 'ley';

/** Genera un slug único; `exceptId` permite conservarlo al editar. */
export async function uniqueSlug(text, exceptId = null, conn = pool) {
  const base = toSlug(text);
  let slug = base;
  for (let i = 2; ; i++) {
    const [rows] = await conn.query('SELECT id FROM leyes WHERE slug = ? AND (? IS NULL OR id <> ?)', [
      slug,
      exceptId,
      exceptId,
    ]);
    if (rows.length === 0) return slug;
    slug = `${base}-${i}`;
  }
}
