import { Router } from 'express';
import publicRoutes from './public.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));
router.use('/', publicRoutes);
// Fase 2: router.use('/auth', authRoutes); router.use('/admin', adminRoutes);

export default router;
