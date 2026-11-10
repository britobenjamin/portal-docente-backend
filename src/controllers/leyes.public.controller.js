import * as Leyes from '../models/leyes.model.js';
import { HttpError } from '../middlewares/errorHandler.js';

export async function listar(req, res) {
  const leyes = await Leyes.listar({ ...req.valid.query, estado: 'vigente' });
  res.json({ total: leyes.length, leyes });
}

export async function detalle(req, res) {
  const ley = await Leyes.obtenerPorSlug(req.valid.params.slug, { soloVigente: true });
  if (!ley) throw new HttpError(404, 'No encontramos esa ley.');
  res.json(ley);
}
