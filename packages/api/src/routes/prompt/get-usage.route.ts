import { Request, Response, Router } from 'express';
import { promptService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

// GET /api/users/:userId/prompt/usage
// Reports this month's OpenAI token consumption, broken down per model.
router.get(
  '/usage',
  asyncHandler(async (_req: Request, res: Response) => {
    const report = await promptService.usage();
    return utilService.replyOk(res, report);
  }),
);

export default router;
