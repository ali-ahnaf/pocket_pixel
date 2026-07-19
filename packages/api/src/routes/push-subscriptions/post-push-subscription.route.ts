import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { PushSubscriptionInput, PushSubscriptionDto } from '@expense-tracker/shared';
import { pushService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const subscribeSchema = Joi.object<PushSubscriptionInput>({
  endpoint: Joi.string().uri().max(2000).required(),
  keys: Joi.object({
    p256dh: Joi.string().min(1).max(500).required(),
    auth: Joi.string().min(1).max(500).required(),
  }).required(),
});

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = subscribeSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const subscription: PushSubscriptionDto = await pushService.subscribe(req.user!.userId, value as PushSubscriptionInput);
    return utilService.replyCreated(res, subscription);
  }),
);

export default router;
