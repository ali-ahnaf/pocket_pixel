import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { debtsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const querySchema = Joi.object({
  status: Joi.string().valid('incomplete', 'completed', 'all').default('incomplete'),
});

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { value } = querySchema.validate(req.query);
    const debts = await debtsService.list(req.user!.userId, value.status);
    return utilService.replyOk(res, debts);
  }),
);

export default router;
