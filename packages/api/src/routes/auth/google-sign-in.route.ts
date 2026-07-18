import { randomBytes } from 'crypto';
import { Request, Response, Router } from 'express';
import { authService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();

const OAUTH_STATE_COOKIE = 'g_oauth_state';
const isProd = process.env.NODE_ENV === 'production';

/**
 * Step 1: start the authorization-code flow. Mint an anti-CSRF `state`, remember
 * it in a short-lived httpOnly cookie, and redirect the browser to Google's
 * consent screen.
 */
router.get(
  '/google',
  asyncHandler(async (_req: Request, res: Response) => {
    const state = randomBytes(16).toString('hex');
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
    });
    return res.redirect(authService.getGoogleAuthUrl(state));
  }),
);

export default router;
