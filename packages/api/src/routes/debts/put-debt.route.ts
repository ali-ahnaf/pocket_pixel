import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { debtsService, utilService } from '../../services';
import { UpdateDebtInput } from '../../services/debts.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const updateDebtSchema = Joi.object<UpdateDebtInput>({
  title: Joi.string().max(200).optional(),
  amount: Joi.number().positive().precision(2).optional(),
  type: Joi.string().valid('expense', 'income').optional(),
  notes: Joi.string().allow(null, '').max(2000).optional(),
  dueDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
}).min(1);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = updateDebtSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const updated = await debtsService.update(req.user!.userId, req.params.id, value as UpdateDebtInput);
    return utilService.replyOk(res, updated);
  }),
);

export default router;
