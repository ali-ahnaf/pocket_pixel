import { Request, Response, Router } from 'express';
import { authService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const OAUTH_STATE_COOKIE = 'g_oauth_state';

/**
 * Step 2: Google redirects here with `code` and the echoed `state`. Verify the
 * state against the cookie, exchange the code for a session, then bounce the
 * browser back to the UI with the JWT in the query string.
 */
router.get(
  '/google/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];

    res.clearCookie(OAUTH_STATE_COOKIE);

    if (!code || !state || !expectedState || state !== expectedState) {
      return res.redirect(`${APP_URL}/auth/google/callback/?error=1`);
    }

    try {
      const result = await authService.googleSignInWithCode(code);
      return res.redirect(`${APP_URL}/auth/google/callback/?token=${encodeURIComponent(result.token)}`);
    } catch {
      return res.redirect(`${APP_URL}/auth/google/callback/?error=1`);
    }
  }),
);

export default router;
