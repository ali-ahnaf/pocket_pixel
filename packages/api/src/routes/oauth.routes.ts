import { Router } from 'express';
import googleCallbackRouter from './oauth/google-callback.route';
import gmailWebhookRouter from './oauth/gmail-webhook.route';

const router = Router();

router.use(googleCallbackRouter);
router.use(gmailWebhookRouter);

export default router;
