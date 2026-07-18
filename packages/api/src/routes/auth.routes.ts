import { Router } from 'express';
import postSigninRouter from './auth/sign-in.route';
import postSignoutRouter from './auth/sign-out.route';
import postSignupRouter from './auth/sign-up.route';
import getGoogleSignInRouter from './auth/google-sign-in.route';
import getGoogleCallbackRouter from './auth/google-callback.route';

const router = Router();

router.use(postSignupRouter);
router.use(postSigninRouter);
router.use(postSignoutRouter);
router.use(getGoogleSignInRouter);
router.use(getGoogleCallbackRouter);

export default router;
