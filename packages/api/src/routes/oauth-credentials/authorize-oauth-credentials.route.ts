import { Request, Response, Router } from 'express';
import { AuthorizeUrlDto } from '@expense-tracker/shared';
import { userOAuthCredentialService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/authorize',
  asyncHandler(async (req: Request, res: Response) => {
    const dto: AuthorizeUrlDto = await userOAuthCredentialService.getAuthorizeUrl(req.user!.userId);
    return utilService.replyOk(res, dto);
  }),
);

export default router;
