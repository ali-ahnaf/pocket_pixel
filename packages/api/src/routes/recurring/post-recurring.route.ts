import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { recurringService, utilService } from '../../services';
import { CreateRecurringInput } from '../../services/recurring.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const createRecurringSchema = Joi.object<CreateRecurringInput>({
  title: Joi.string().max(200).required(),
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid('expense', 'income').default('expense'),
  interval: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').required(),
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().optional().allow(null),
  tagIds: Joi.array().items(Joi.string().uuid()).unique().optional().allow(null),
  vaultId: Joi.string().uuid().optional().allow(null),
});

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createRecurringSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const created = await recurringService.create(req.user!.userId, value as CreateRecurringInput);
    return utilService.replyCreated(res, created);
  }),
);

export default router;
