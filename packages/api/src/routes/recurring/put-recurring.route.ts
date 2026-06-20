import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { recurringService, utilService } from '../../services';
import { UpdateRecurringInput } from '../../services/recurring.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const updateRecurringSchema = Joi.object<UpdateRecurringInput>({
  title: Joi.string().max(200),
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid('expense', 'income'),
  interval: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly'),
  startDate: Joi.string().isoDate().allow(null),
  endDate: Joi.string().isoDate().allow(null),
  tagIds: Joi.array().items(Joi.string().uuid()).unique().allow(null),
  vaultId: Joi.string().uuid().allow(null),
}).min(1);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = updateRecurringSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const updated = await recurringService.update(req.user!.userId, req.params.id, value as UpdateRecurringInput);
    return utilService.replyOk(res, updated);
  }),
);

export default router;
