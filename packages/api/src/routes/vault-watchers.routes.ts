import { Router } from 'express';
import getVaultWatchersRouter from './vault-watchers/get-vault-watchers.route';
import putVaultWatcherRouter from './vault-watchers/put-vault-watcher.route';
import deleteVaultWatcherRouter from './vault-watchers/delete-vault-watcher.route';
import testExtractRouter from './vault-watchers/test-extract.route';

const router = Router({ mergeParams: true });

router.use(getVaultWatchersRouter);
router.use(putVaultWatcherRouter);
router.use(deleteVaultWatcherRouter);
router.use(testExtractRouter);

export default router;
