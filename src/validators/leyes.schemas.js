import { z } from 'zod';

export const JURISDICCIONES = ['provincial', 'nacional'];
export const TIPOS = ['ley', 'decreto', 'resolucion', 'estatuto'];
export const ORDENES = ['recientes', 'numero', 'alfabetico'];

// Query params vacíos ("?tipo=") se tratan como ausentes.
const vacioAUndefined = (v) => (v === '' ? undefined : v);
const opt = (schema) => z.preprocess(vacioAUndefined, schema.optional());

export const filtrosPublicosSchema = z.object({
  jurisdiccion: opt(z.enum(JURISDICCIONES)),
  tipo: opt(z.enum(TIPOS)),
  categoria: opt(z.coerce.number().int().positive()),
  nivel: opt(z.coerce.number().int().positive()),
  anio: opt(z.coerce.number().int().min(1800).max(2100)),
  q: opt(z.string().trim().max(100)),
  orden: opt(z.enum(ORDENES)),
});

export const slugParamSchema = z.object({
  slug: z.string().trim().min(1).max(200),
});
