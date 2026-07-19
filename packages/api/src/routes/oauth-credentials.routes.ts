import { Router } from 'express';
import getOAuthCredentialsRouter from './oauth-credentials/get-oauth-credentials.route';
import putOAuthCredentialsRouter from './oauth-credentials/put-oauth-credentials.route';
import authorizeOAuthCredentialsRouter from './oauth-credentials/authorize-oauth-credentials.route';
import getGmailLabelsRouter from './oauth-credentials/get-gmail-labels.route';
import getGmailWatchRouter from './oauth-credentials/get-gmail-watch.route';
import putGmailWatchRouter from './oauth-credentials/put-gmail-watch.route';
import deleteGmailWatchRouter from './oauth-credentials/delete-gmail-watch.route';

const router = Router({ mergeParams: true });

router.use(getOAuthCredentialsRouter);
router.use(putOAuthCredentialsRouter);
router.use(authorizeOAuthCredentialsRouter);
router.use(getGmailLabelsRouter);
router.use(getGmailWatchRouter);
router.use(putGmailWatchRouter);
router.use(deleteGmailWatchRouter);

export default router;
