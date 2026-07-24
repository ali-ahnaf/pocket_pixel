import { Request, Response, Router } from 'express';
import Joi from 'joi';
import {  WIZARD_PROMPT_KEYS } from '@expense-tracker/shared';
import { utilService, wizardService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';
import { promptRateLimiter } from '../../middleware/rate-limit';

const router = Router({ mergeParams: true });

const chatSchema = Joi.object<any>({
  promptKey: Joi.string()
    .valid(...WIZARD_PROMPT_KEYS)
    .required(),
});

// POST /api/users/:userId/wizard/chat
// Fetches the user's real spending data, narrates it through the wizard persona.
router.post(
  '/chat',
  promptRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = chatSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const result = await wizardService.chat(req.user!.userId, value.promptKey);
    return utilService.replyOk(res, result);
  }),
);

export default router;
