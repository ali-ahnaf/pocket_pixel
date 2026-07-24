import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { SetAiCredentialInput } from '@expense-tracker/shared';
import { userAiCredentialService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const setAiCredentialSchema = Joi.object<SetAiCredentialInput>({
  salt: Joi.string().min(1).max(500).required(),
  kdfIterations: Joi.number().integer().min(1).required(),
  dekIv: Joi.string().min(1).max(500).required(),
  wrappedDek: Joi.string().min(1).max(5000).required(),
  keyIv: Joi.string().min(1).max(500).required(),
  keyCiphertext: Joi.string().min(1).max(5000).required(),
  selectedModel: Joi.string().max(200).optional(),
});

router.put(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = setAiCredentialSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const status = await userAiCredentialService.setCredential(req.user!.userId, value as SetAiCredentialInput);
    return utilService.replyOk(res, status);
  }),
);

export default router;
