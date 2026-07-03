import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { authService, utilService } from '../../services';
import { ChangePasswordPayload } from '@expense-tracker/shared';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();
const changePasswordSchema = Joi.object<ChangePasswordPayload>({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(255).required(),
});

router.put(
  '/:userId/password',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    await authService.changePassword(req.user!.userId, value as ChangePasswordPayload);
    return utilService.replyNoContent(res);
  }),
);

export default router;
