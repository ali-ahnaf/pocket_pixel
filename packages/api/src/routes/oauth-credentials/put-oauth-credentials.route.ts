import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { userOAuthCredentialService, utilService } from '../../services';
import { SetOAuthCredentialsInput } from '../../services/user-oauth-credential.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const setCredentialsSchema = Joi.object<SetOAuthCredentialsInput>({
  clientId: Joi.string().min(1).max(500).required(),
  clientSecret: Joi.string().min(1).max(500).required(),
});

router.put(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = setCredentialsSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    await userOAuthCredentialService.setCredentials(req.user!.userId, value as SetOAuthCredentialsInput);
    const status = await userOAuthCredentialService.getStatus(req.user!.userId);
    return utilService.replyOk(res, status);
  }),
);

export default router;
