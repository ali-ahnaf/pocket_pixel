import { Request, Response, Router } from 'express';
import { AiCredentialStatusDto } from '@expense-tracker/shared';
import { userAiCredentialService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const status: AiCredentialStatusDto = await userAiCredentialService.getStatus(req.user!.userId);
    return utilService.replyOk(res, status);
  }),
);

export default router;
