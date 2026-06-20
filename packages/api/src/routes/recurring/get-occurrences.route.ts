import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { recurringService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const occurrencesQuerySchema = Joi.object<{ month: number; year: number }>({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});

router.get(
  '/occurrences',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = occurrencesQuerySchema.validate(req.query);
    if (error) return utilService.replyError(res, error.message);

    const result = await recurringService.occurrences(req.user!.userId, value.year, value.month);
    return utilService.replyOk(res, result);
  }),
);

export default router;
