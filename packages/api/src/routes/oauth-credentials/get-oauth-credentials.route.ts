import { Request, Response, Router } from 'express';
import { OAuthCredentialsStatusDto } from '@expense-tracker/shared';
import { userOAuthCredentialService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const status: OAuthCredentialsStatusDto = await userOAuthCredentialService.getStatus(req.user!.userId);
    return utilService.replyOk(res, status);
  }),
);

export default router;
