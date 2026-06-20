import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { recurringService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const applySchema = Joi.object<{ date: string }>({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
});

router.post(
  '/:id/apply',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = applySchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const result = await recurringService.apply(req.user!.userId, req.params.id, value.date);
    return utilService.replyCreated(res, result);
  }),
);

export default router;
