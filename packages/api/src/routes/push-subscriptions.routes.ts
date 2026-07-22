import { Router } from 'express';
import postPushSubscriptionRouter from './push-subscriptions/post-push-subscription.route';
import deletePushSubscriptionRouter from './push-subscriptions/delete-push-subscription.route';

const router = Router({ mergeParams: true });

router.use(postPushSubscriptionRouter);
router.use(deletePushSubscriptionRouter);

export default router;
