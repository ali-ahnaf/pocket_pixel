import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { promptService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';
import { promptRateLimiter } from '../../middleware/rate-limit';

const router = Router({ mergeParams: true });

const promptSchema = Joi.object<{ prompt: string }>({
  prompt: Joi.string().max(500).min(10).required(),
});

router.post(
  '/',
  promptRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = promptSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const result = await promptService.parseTransaction(req.user!.userId, value.prompt);
    return utilService.replyOk(res, result);
  }),
);

export default router;
