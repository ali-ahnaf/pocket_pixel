import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { analyticsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });
const yearSchema = Joi.object<{ year: number }>({
  year: Joi.number().integer().min(2000).max(2100).required(),
});

router.get(
  '/tags',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = yearSchema.validate(req.query);
    if (error) return utilService.replyError(res, error.message);

    const rows = await analyticsService.tags(req.user!.userId, value.year);
    return utilService.replyOk(res, rows);
  }),
);

export default router;
