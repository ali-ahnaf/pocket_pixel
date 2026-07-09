import { Request, Response, Router } from "express";
import { asyncHandler } from "../../middleware/error-handler";
import { backupService, utilService } from "../../services";

const router = Router({ mergeParams: true });

router.get(
  '/export',
  asyncHandler(async (req: Request, res: Response) => {
    const exportData = await backupService.exportData(req.user!.userId);
    return utilService.replyOk(res, exportData);
  }),
);

export default router;
