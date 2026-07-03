import { Router } from 'express';
import getUserRouter from './users/get-user.route';
import postUserRouter from './users/post-user.route';
import putUserRouter from './users/put-user.route';
import changePasswordRouter from './users/change-password.route';

const router = Router();

router.use(postUserRouter);
router.use(getUserRouter);
router.use(putUserRouter);
router.use(changePasswordRouter);

export default router;
