import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { pushService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const unsubscribeSchema = Joi.object<{ endpoint: string }>({
  endpoint: Joi.string().uri().max(2000).required(),
});

router.delete(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = unsubscribeSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    await pushService.unsubscribe(req.user!.userId, (value as { endpoint: string }).endpoint);
    return utilService.replyNoContent(res);
  }),
);

export default router;
