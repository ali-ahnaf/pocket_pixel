import { Request, Response, Router } from 'express';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import type { SignInPayload } from '@expense-tracker/shared';
import { createAuthToken } from './shared';
import { AppDataSource } from '../../data-source';
import { User } from '../../entities/User.entity';

const router = Router();
const signInSchema = Joi.object<SignInPayload>({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().required(),
});

const authRepo = () => AppDataSource.getRepository(User);

router.post('/sign-in', async (req: Request, res: Response) => {
  const { error, value } = signInSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const payload = value as SignInPayload;

  try {
    const user = await authRepo().findOneBy({ email: payload.email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const passwordMatches = await bcrypt.compare(payload.password, user.password);
    if (!passwordMatches) return res.status(401).json({ message: 'Invalid credentials' });

    const token = createAuthToken({ userId: user.id, name: user.name, email: user.email, avatar: user.avatar });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
