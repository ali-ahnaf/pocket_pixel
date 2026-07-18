import { Router } from 'express';
import getOAuthCredentialsRouter from './oauth-credentials/get-oauth-credentials.route';
import putOAuthCredentialsRouter from './oauth-credentials/put-oauth-credentials.route';

const router = Router({ mergeParams: true });

router.use(getOAuthCredentialsRouter);
router.use(putOAuthCredentialsRouter);

export default router;
