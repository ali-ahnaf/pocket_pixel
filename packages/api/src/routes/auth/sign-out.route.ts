import { Request, Response, Router } from 'express';
import { authService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();

router.post(
  '/sign-out',
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      await authService.signOut(refreshToken);
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return utilService.replyOk(res, { message: 'Signed out' });
  }),
);

export default router;
