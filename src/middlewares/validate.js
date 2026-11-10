// Valida req[source] con un esquema zod y deja el resultado limpio en req.valid[source].
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Hay datos inválidos. Revisá los campos marcados.',
        detalles: result.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
      });
    }
    req.valid = { ...(req.valid || {}), [source]: result.data };
    next();
  };
