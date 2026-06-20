import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { vaultsService, utilService } from '../../services';
import { UpdateVaultInput } from '../../services/vaults.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });
const updateVaultSchema = Joi.object<UpdateVaultInput>({
  name: Joi.string().max(100),
  description: Joi.string().max(255).allow(''),
  icon: Joi.string().max(100).allow(null),
  backgroundColor: Joi.string().max(50).allow(null),
}).min(1);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = updateVaultSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const saved = await vaultsService.update(req.user!.userId, req.params.id, value as UpdateVaultInput);
    return utilService.replyOk(res, saved);
  }),
);

export default router;
