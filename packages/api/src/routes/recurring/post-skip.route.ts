import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { recurringService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const skipSchema = Joi.object<{ date: string }>({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
});

router.post(
  '/:id/skip',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = skipSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    await recurringService.skip(req.user!.userId, req.params.id, value.date);
    return utilService.replyNoContent(res);
  }),
);

export default router;
