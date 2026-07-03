import { Request, Response, Router } from 'express';
import { authService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();

router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const cookieRefreshToken = req.cookies.refresh_token;
    if (!cookieRefreshToken) {
      return utilService.replyError(res, 'Refresh token missing', 401);
    }

    const result = await authService.refresh(cookieRefreshToken);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: result.refreshTokenExpiresAt,
    });

    const { refreshToken, refreshTokenExpiresAt, ...clientResult } = result;
    return utilService.replyOk(res, { token: clientResult.token });
  }),
);

export default router;
