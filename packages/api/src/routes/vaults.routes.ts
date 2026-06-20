import { Router } from 'express';
import deleteVaultRouter from './vaults/delete-vault.route';
import getVaultsRouter from './vaults/get-vaults.route';
import postVaultRouter from './vaults/post-vault.route';
import putVaultRouter from './vaults/put-vault.route';
import setDefaultVaultRouter from './vaults/set-default-vault.route';

const router = Router({ mergeParams: true });

router.use(getVaultsRouter);
router.use(postVaultRouter);
router.use(setDefaultVaultRouter);
router.use(putVaultRouter);
router.use(deleteVaultRouter);

export default router;
