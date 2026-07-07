import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { UpdateDebtRequest } from '@expense-tracker/shared';
import { debtsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const updateDebtSchema = Joi.object<UpdateDebtRequest>({
  title: Joi.string().max(200).optional(),
  amount: Joi.number().positive().precision(2).optional(),
  type: Joi.string().valid('expense', 'income').optional(),
  notes: Joi.string().allow(null, '').max(2000).optional(),
}).min(1);

router.patch(
  '/:debtId',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = updateDebtSchema.validate(req.body);

    if (error) {
      return utilService.replyError(res, error.message);
    }

    const updated = await debtsService.update(
      req.user!.userId,
      req.params.debtId,
      value as UpdateDebtRequest,
    );

    return utilService.replyOk(res, updated);
  }),
);

export default router;