import { Request, Response, Router } from 'express';
import { asyncHandler } from '../../middleware/error-handler';
import { backupService } from '../../services';
import { BACKUP_FILE_CONTENT_TYPE, BACKUP_FILE_EXTENSION } from '../../types/backup';

const router = Router({ mergeParams: true });

router.get(
  '/export',
  asyncHandler(async (req: Request, res: Response) => {
    const exportFile = await backupService.exportData(req.user!.userId);
    res.setHeader('Content-Type', BACKUP_FILE_CONTENT_TYPE);
    res.setHeader('Content-Disposition', `attachment; filename="pocket-pixel-backup.${BACKUP_FILE_EXTENSION}"`);
    return res.status(200).send(exportFile);
  }),
);

export default router;
