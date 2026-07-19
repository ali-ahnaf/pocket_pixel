import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { GmailWatchStatusDto, SetGmailWatchInput } from '@expense-tracker/shared';
import { gmailService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const setGmailWatchSchema = Joi.object<SetGmailWatchInput>({
  labelIds: Joi.array().items(Joi.string().min(1).max(200)).min(1).max(50).required(),
});

router.put(
  '/gmail/watch',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = setGmailWatchSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const status: GmailWatchStatusDto = await gmailService.setWatchedLabels(req.user!.userId, (value as SetGmailWatchInput).labelIds);
    return utilService.replyOk(res, status);
  }),
);

export default router;
