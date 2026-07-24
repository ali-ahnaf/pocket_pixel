import { Router } from 'express';
import getAiCredentialsRouter from './ai-credentials/get-ai-credentials.route';
import putAiCredentialsRouter from './ai-credentials/put-ai-credentials.route';
import putAiCredentialsModelRouter from './ai-credentials/put-ai-credentials-model.route';

const router = Router({ mergeParams: true });

router.use(getAiCredentialsRouter);
router.use(putAiCredentialsRouter);
router.use(putAiCredentialsModelRouter);

export default router;
