import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { UpdateTransactionInput } from '@expense-tracker/shared';
import { transactionsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const updateTransactionSchema = Joi.object<UpdateTransactionInput>({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid('expense', 'income'),
  title: Joi.string().max(200).allow(null, ''),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  vaultId: Joi.string().uuid().allow(null),
  tagIds: Joi.array().items(Joi.string().uuid()),
}).min(1);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = updateTransactionSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const saved = await transactionsService.update(req.user!.userId, req.params.id, value as UpdateTransactionInput);
    return utilService.replyOk(res, saved);
  }),
);

export default router;
