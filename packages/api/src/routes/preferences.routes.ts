import { Router } from 'express';
import getPreferencesRouter from './preferences/get-preferences.route';
import putPreferencesRouter from './preferences/put-preferences.route';

const router = Router({ mergeParams: true });

router.use(getPreferencesRouter);
router.use(putPreferencesRouter);

export default router;
