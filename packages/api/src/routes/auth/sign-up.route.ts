import { Request, Response, Router } from 'express';
import Joi from 'joi';
import type { SignUpPayload } from '@expense-tracker/shared';
import { authService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();
const signUpSchema = Joi.object<SignUpPayload>({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(255).required(),
  avatar: Joi.string().max(255).optional(),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  ...(process.env.NODE_ENV === 'production' ? { sameSite: 'lax' as const } : {}),
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

router.post(
  '/sign-up',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = signUpSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const result = await authService.signUp(value as SignUpPayload);
    res.cookie('auth_token', result.token, COOKIE_OPTIONS);
    return utilService.replyCreated(res, result);
  }),
);

export default router;
