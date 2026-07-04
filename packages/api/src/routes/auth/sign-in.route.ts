import { Request, Response, Router } from 'express';
import Joi from 'joi';
import type { SignInPayload } from '@expense-tracker/shared';
import { authService, utilService } from '../../services';
import { AUTH_TOKEN_KEY } from '../../services/auth.service';
import { asyncHandler } from '../../middleware/error-handler';

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
    res.cookie(AUTH_TOKEN_KEY, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    return utilService.replyOk(res, result);
  }),
);

export default router;
