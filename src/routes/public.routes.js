import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { filtrosPublicosSchema, slugParamSchema } from '../validators/leyes.schemas.js';
import * as leyes from '../controllers/leyes.public.controller.js';
import * as catalogos from '../controllers/catalogos.controller.js';

const router = Router();

router.get('/leyes', validate(filtrosPublicosSchema, 'query'), leyes.listar);
router.get('/leyes/:slug', validate(slugParamSchema, 'params'), leyes.detalle);
router.get('/categorias', catalogos.categorias);
router.get('/niveles', catalogos.niveles);

export default router;
