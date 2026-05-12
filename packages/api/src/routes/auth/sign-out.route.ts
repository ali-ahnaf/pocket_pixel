import { Request, Response, Router } from 'express';

const router = Router();

router.post('/sign-out', (_req: Request, res: Response) => {
  return res.json({ message: 'Signed out' });
});

export default router;
