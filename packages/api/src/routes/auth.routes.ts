import { Router } from 'express';
import postSigninRouter from './auth/sign-in.route';
import postSignoutRouter from './auth/sign-out.route';
import postSignupRouter from './auth/sign-up.route';
import getPingRouter from './auth/ping.route';

const router = Router();

router.use(postSignupRouter);
router.use(postSigninRouter);
router.use(postSignoutRouter);
router.use(getPingRouter);

export default router;
