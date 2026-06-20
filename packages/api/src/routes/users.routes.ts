import { Router } from 'express';
import getUserRouter from './users/get-user.route';
import postUserRouter from './users/post-user.route';
import putUserRouter from './users/put-user.route';

const router = Router();

router.use(postUserRouter);
router.use(getUserRouter);
router.use(putUserRouter);

export default router;
