import { Router } from 'express';
import exportRouter from './backup/export.route';
import importRouter from './backup/import.route';

const router = Router({ mergeParams: true });

router.use(exportRouter);
router.use(importRouter);

export default router;
