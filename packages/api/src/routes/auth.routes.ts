import { Router } from 'express';
import postSigninRouter from './auth/sign-in.route';
import postSignoutRouter from './auth/sign-out.route';
import postSignupRouter from './auth/sign-up.route';
import postRefreshRouter from './auth/refresh.route';

const router = Router();

router.use(postSignupRouter);
router.use(postSigninRouter);
router.use(postSignoutRouter);
router.use(postRefreshRouter);

export default router;
