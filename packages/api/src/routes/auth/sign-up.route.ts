import { Request, Response, Router } from 'express';
import Joi from 'joi';
import type { SignUpPayload } from '@expense-tracker/shared';
import { authService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';
import { setAuthCookie } from './cookie-options';

const router = Router();
const signUpSchema = Joi.object<SignUpPayload>({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(255).required(),
  avatar: Joi.string().max(255).optional(),
});

router.post(
  '/sign-up',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = signUpSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);
    const result = await authService.signUp(value as SignUpPayload);
    setAuthCookie(res, result.token);
    return utilService.replyCreated(res, result);
  }),
);

export default router;