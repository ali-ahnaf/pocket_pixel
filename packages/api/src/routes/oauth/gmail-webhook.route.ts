import { Request, Response, Router } from 'express';
import { gmailService, logger, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';
import { verifyPubSubOidcToken, extractBearerToken, decodePubSubMessage } from '../../utils/gmail-webhook.util';

const router = Router();

/**
 * Gmail push endpoint that Google Pub/Sub POSTs to on new matching mail. Public
 * (no `requireAuth`) — the caller is Google, authenticated by the OIDC bearer
 * token, not an app user. Mounted under `/api/oauth`.
 *
 * Order matters: verify the Google-signed token first (never trust the body
 * alone), then decode + hand off. Always ack with a 2xx; the service swallows
 * processing errors so a failure can't push Pub/Sub into a retry storm.
 */
router.post(
  '/gmail/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Gmail webhook received', JSON.stringify(req.body));

    const token = extractBearerToken(req.headers.authorization);
    await verifyPubSubOidcToken(token, process.env.GMAIL_PUBSUB_AUDIENCE);

    const notification = decodePubSubMessage(req.body?.message);
    if (notification) await gmailService.handlePushNotification(notification);

    return utilService.replyNoContent(res);
  }),
);

export default router;
