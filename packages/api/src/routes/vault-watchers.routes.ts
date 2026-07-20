import { Router } from 'express';
import getVaultWatchersRouter from './vault-watchers/get-vault-watchers.route';
import testParseScriptRouter from './vault-watchers/test-parse-script.route';
import putVaultWatcherRouter from './vault-watchers/put-vault-watcher.route';
import deleteVaultWatcherRouter from './vault-watchers/delete-vault-watcher.route';

const router = Router({ mergeParams: true });

router.use(getVaultWatchersRouter);
router.use(testParseScriptRouter);
router.use(putVaultWatcherRouter);
router.use(deleteVaultWatcherRouter);

export default router;
