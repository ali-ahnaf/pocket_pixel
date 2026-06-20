import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { debtsService, utilService } from '../../services';
import { ApplyDebtInput } from '../../services/debts.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const applyDebtSchema = Joi.object<ApplyDebtInput>({
  vaultId: Joi.string().uuid().allow(null).optional(),
});

router.post(
  '/:id/apply',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = applyDebtSchema.validate(req.body ?? {});
    if (error) return utilService.replyError(res, error.message);

    const result = await debtsService.apply(req.user!.userId, req.params.id, value as ApplyDebtInput);
    return utilService.replyCreated(res, result);
  }),
);

export default router;
