import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { vaultsService, utilService } from '../../services';
import { CreateVaultInput } from '../../services/vaults.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });
const createVaultSchema = Joi.object<CreateVaultInput>({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(255).allow('').default(''),
  icon: Joi.string().max(100).optional(),
  backgroundColor: Joi.string().max(50).optional(),
  monthlyBudget: Joi.number().positive().precision(2).allow(null).optional(),
});

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createVaultSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const saved = await vaultsService.create(req.user!.userId, value as CreateVaultInput);
    return utilService.replyCreated(res, saved);
  }),
);

export default router;
