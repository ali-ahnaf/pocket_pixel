import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { SetVaultGmailWatcherInput, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { vaultWatchersService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const setVaultWatcherSchema = Joi.object<SetVaultGmailWatcherInput>({
  gmailLabelId: Joi.string().min(1).max(200).required(),
  gmailLabelName: Joi.string().max(200).optional(),
  subjectFilter: Joi.string().max(500).allow('').optional(),
  parseScript: Joi.string().min(1).max(20000).required(),
});

router.put(
  '/:vaultId',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = setVaultWatcherSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const watcher: VaultGmailWatcherDto = await vaultWatchersService.upsert(req.user!.userId, req.params.vaultId, value as SetVaultGmailWatcherInput);
    return utilService.replyOk(res, watcher);
  }),
);

export default router;
