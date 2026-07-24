import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { SetAiModelInput } from '@expense-tracker/shared';
import { userAiCredentialService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const setAiModelSchema = Joi.object<SetAiModelInput>({
  selectedModel: Joi.string().min(1).max(200).required(),
});

router.put(
  '/model',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = setAiModelSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const status = await userAiCredentialService.setModel(req.user!.userId, value as SetAiModelInput);
    return utilService.replyOk(res, status);
  }),
);

export default router;
