import { Request, Response, Router } from 'express';
import Joi from 'joi';
import type { SignInPayload } from '@expense-tracker/shared';
import { authService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';
import { setAuthCookie } from './cookie-options';

const router = Router();
const signInSchema = Joi.object<SignInPayload>({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().required(),
});

router.post(
  '/sign-in',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = signInSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const result = await authService.signIn(value as SignInPayload);
    setAuthCookie(res, result.token);
    return utilService.replyOk(res, result);
  }),
);

export default router;