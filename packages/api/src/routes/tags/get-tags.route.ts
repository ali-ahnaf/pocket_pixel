import { Request, Response, Router } from 'express';
import { tagsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tags = await tagsService.list(req.user!.userId);
    return utilService.replyOk(res, tags);
  }),
);

export default router;
