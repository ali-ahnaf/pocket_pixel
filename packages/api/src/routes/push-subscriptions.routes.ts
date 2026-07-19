import { Router } from 'express';
import postPushSubscriptionRouter from './push-subscriptions/post-push-subscription.route';
import deletePushSubscriptionRouter from './push-subscriptions/delete-push-subscription.route';
import postTestNotificationRouter from './push-subscriptions/post-test-notification.route';

const router = Router({ mergeParams: true });

router.use(postPushSubscriptionRouter);
router.use(deletePushSubscriptionRouter);
router.use(postTestNotificationRouter);

export default router;
