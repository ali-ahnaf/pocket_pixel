import { Router } from 'express';
import googleCallbackRouter from './oauth/google-callback.route';

const router = Router();

router.use(googleCallbackRouter);

export default router;
