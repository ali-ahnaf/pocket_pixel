import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { ListTransactionsQuery } from '@expense-tracker/shared';
import { transactionsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });
const transactionsQuerySchema = Joi.object<ListTransactionsQuery>({
  month: Joi.number().integer().min(1).max(12),
  year: Joi.number().integer().min(2000).max(2100),
  period: Joi.string().valid('all'),
});

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = transactionsQuerySchema.validate(req.query);
    if (error) return utilService.replyError(res, error.message);

    const result = await transactionsService.list(req.user!.userId, value as ListTransactionsQuery);
    return utilService.replyOk(res, result);
  }),
);

export default router;
