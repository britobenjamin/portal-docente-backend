import { pool } from '../config/db.js';
import { pdfLinks } from '../services/storage.service.js';

const ORDENES = {
  recientes: 'l.anio DESC, l.creado_en DESC',
  numero: "CAST(NULLIF(REGEXP_REPLACE(l.numero, '[^0-9]', ''), '') AS UNSIGNED), l.numero",
  alfabetico: 'l.titulo ASC',
};

const BASE_SELECT = `
  SELECT l.*,
         ac.nombre AS creado_por_nombre,
         au.nombre AS actualizado_por_nombre
  FROM leyes l
  LEFT JOIN admins ac ON ac.id = l.creado_por
  LEFT JOIN admins au ON au.id = l.actualizado_por`;

/** Agrega categorías y niveles a cada ley con 2 queries (sin N+1). */
async function adjuntarRelaciones(leyes) {
  if (leyes.length === 0) return leyes;
  const ids = leyes.map((l) => l.id);
  const [cats] = await pool.query(
    `SELECT lc.ley_id, c.id, c.nombre FROM leyes_categorias lc
     JOIN categorias c ON c.id = lc.categoria_id WHERE lc.ley_id IN (?) ORDER BY c.nombre`,
    [ids],
  );
  const [nivs] = await pool.query(
    `SELECT ln.ley_id, n.id, n.nombre FROM leyes_niveles ln
     JOIN niveles n ON n.id = ln.nivel_id WHERE ln.ley_id IN (?) ORDER BY n.id`,
    [ids],
  );
  const porLey = (rows) =>
    rows.reduce((acc, { ley_id, id, nombre }) => {
      (acc[ley_id] ||= []).push({ id, nombre });
      return acc;
    }, {});
  const c = porLey(cats);
  const n = porLey(nivs);
  return leyes.map((l) => ({ ...l, categorias: c[l.id] || [], niveles: n[l.id] || [] }));
}

/** Da forma al objeto que devuelve la API. */
function serializar(row, { auditoria = false } = {}) {
  const ley = {
    id: row.id,
    slug: row.slug,
    jurisdiccion: row.jurisdiccion,
    tipo: row.tipo,
    numero: row.numero,
    titulo: row.titulo,
    resumen: row.resumen,
    palabras_clave: row.palabras_clave
      ? row.palabras_clave.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    anio: row.anio,
    pdf_url: row.pdf_url,
    ...pdfLinks(row.pdf_url),
    estado: row.estado,
    derogada_por: row.derogada_por,
    categorias: row.categorias,
    niveles: row.niveles,
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
  };
  if (auditoria) {
    ley.pdf_public_id = row.pdf_public_id;
    ley.creado_por = row.creado_por ? { id: row.creado_por, nombre: row.creado_por_nombre } : null;
    ley.actualizado_por = row.actualizado_por ? { id: row.actualizado_por, nombre: row.actualizado_por_nombre } : null;
  }
  return ley;
}

/**
 * Lista leyes con filtros opcionales.
 * @param {object} f  { estado: 'vigente'|'derogada'|'todas', jurisdiccion, tipo, categoria, nivel, anio, q, orden }
 */
export async function listar(f = {}, { auditoria = false } = {}) {
  const where = [];
  const params = [];

  if (f.estado && f.estado !== 'todas') {
    where.push('l.estado = ?');
    params.push(f.estado);
  }
  if (f.jurisdiccion) {
    where.push('l.jurisdiccion = ?');
    params.push(f.jurisdiccion);
  }
  if (f.tipo) {
    where.push('l.tipo = ?');
    params.push(f.tipo);
  }
  if (f.anio) {
    where.push('l.anio = ?');
    params.push(f.anio);
  }
  if (f.categoria) {
    where.push('EXISTS (SELECT 1 FROM leyes_categorias x WHERE x.ley_id = l.id AND x.categoria_id = ?)');
    params.push(f.categoria);
  }
  if (f.nivel) {
    where.push('EXISTS (SELECT 1 FROM leyes_niveles x WHERE x.ley_id = l.id AND x.nivel_id = ?)');
    params.push(f.nivel);
  }
  if (f.q) {
    const like = `%${f.q}%`;
    where.push(
      `(MATCH(l.titulo, l.resumen, l.palabras_clave) AGAINST (? IN NATURAL LANGUAGE MODE)
        OR l.numero LIKE ? OR l.titulo LIKE ? OR l.palabras_clave LIKE ?)`,
    );
    params.push(f.q, like, like, like);
  }

  const sql = `${BASE_SELECT}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${ORDENES[f.orden] || ORDENES.recientes}`;

  const [rows] = await pool.query(sql, params);
  const conRel = await adjuntarRelaciones(rows);
  return conRel.map((r) => serializar(r, { auditoria }));
}

export async function obtenerPorSlug(slug, { soloVigente = true } = {}) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE l.slug = ? ${soloVigente ? "AND l.estado = 'vigente'" : ''} LIMIT 1`,
    [slug],
  );
  if (rows.length === 0) return null;
  const [conRel] = await adjuntarRelaciones(rows);
  return serializar(conRel);
}

export async function obtenerPorId(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE l.id = ? LIMIT 1`, [id]);
  if (rows.length === 0) return null;
  const [conRel] = await adjuntarRelaciones(rows);
  return serializar(conRel, { auditoria: true });
}
