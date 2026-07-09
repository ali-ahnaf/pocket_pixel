import { Router } from 'express';
import exportRouter from './backup/export';
import importRouter from './backup/import';

const router = Router({ mergeParams: true });

router.use(exportRouter);
router.use(importRouter);

export default router;
