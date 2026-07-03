import { Request, Response, Router } from 'express';
import Joi from 'joi';
import type { SignInPayload } from '@expense-tracker/shared';
import { authService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();
const signInSchema = Joi.object<SignInPayload>({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().required(),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  ...(process.env.NODE_ENV === 'production' ? { sameSite: 'lax' as const } : {}),
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

router.post(
  '/sign-in',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = signInSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const result = await authService.signIn(value as SignInPayload);
    res.cookie('auth_token', result.token, COOKIE_OPTIONS);
    return utilService.replyOk(res, result);
  }),
);

export default router;
