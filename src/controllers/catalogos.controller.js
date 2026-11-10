import { listarCategorias, listarNiveles } from '../models/catalogos.model.js';

export async function categorias(req, res) {
  res.json(await listarCategorias());
}

export async function niveles(req, res) {
  res.json(await listarNiveles());
}
