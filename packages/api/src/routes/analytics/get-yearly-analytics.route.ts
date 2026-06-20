import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { analyticsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });
const optionalYearSchema = Joi.object<{ year?: number }>({
  year: Joi.number().integer().min(2000).max(2100).optional(),
});

router.get(
  '/yearly',
  asyncHandler(async (req: Request, res: Response) => {
    const { error } = optionalYearSchema.validate(req.query);
    if (error) return utilService.replyError(res, error.message);

    const rows = await analyticsService.yearly(req.user!.userId);
    return utilService.replyOk(res, rows);
  }),
);

export default router;
