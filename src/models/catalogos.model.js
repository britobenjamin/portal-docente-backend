import { pool } from '../config/db.js';

export async function listarCategorias() {
  const [rows] = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre');
  return rows;
}

export async function listarNiveles() {
  const [rows] = await pool.query('SELECT id, nombre FROM niveles ORDER BY id');
  return rows;
}
