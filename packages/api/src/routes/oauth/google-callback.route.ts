import { Request, Response, Router } from 'express';
import { userOAuthCredentialService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';
import { WEB_BASE_URL } from '../../utils/google-oauth.util';

const router = Router();

const settingsUrl = (query: string): string => `${WEB_BASE_URL}/settings/google-oauth?${query}`;

/**
 * Fixed OAuth redirect URI shared by every user. Google sends the browser here
 * with `?code&state` on success or `?error` if the user declined. There is no
 * app JWT on this request — the user id is recovered from the signed `state`
 * inside the service. Not guarded by `requireAuth`; mounted under `/api/oauth`.
 */
router.get(
  '/google/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    if (typeof error === 'string') return res.redirect(settingsUrl(`error=${encodeURIComponent(error)}`));
    if (typeof code !== 'string' || typeof state !== 'string') return res.redirect(settingsUrl('error=missing_code'));

    await userOAuthCredentialService.handleOAuthCallback(code, state);
    return res.redirect(settingsUrl('connected=1'));
  }),
);

export default router;
