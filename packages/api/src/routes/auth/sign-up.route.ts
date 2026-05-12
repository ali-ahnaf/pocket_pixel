import { Request, Response, Router } from 'express';
import Joi from 'joi';
import type { SignUpPayload } from '@expense-tracker/shared';
import { createAuthToken, hashPassword } from './shared';
import { AppDataSource } from '../../data-source';
import { User } from '../../entities/User.entity';
import { Vault } from '../../entities/Vault.entity';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();
const signUpSchema = Joi.object<SignUpPayload>({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(255).required(),
  avatar: Joi.string().max(255).optional(),
});

const authRepo = () => AppDataSource.getRepository(User);

router.post('/sign-up', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = signUpSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const payload = value as SignUpPayload;

  const existing = await authRepo().findOneBy({ email: payload.email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const user = authRepo().create({
    name: payload.name,
    email: payload.email,
    password: await hashPassword(payload.password),
    avatar: payload.avatar ?? '',
  });

  const saved = await authRepo().save(user);

  const vaultRepo = AppDataSource.getRepository(Vault);
  await vaultRepo.save(vaultRepo.create({ userId: saved.id, name: 'Main Stash', description: '', isDefault: true }));

  const token = createAuthToken({ userId: saved.id, name: saved.name, email: saved.email, avatar: saved.avatar });
  return res.status(201).json({
    id: saved.id,
    name: saved.name,
    email: saved.email,
    avatar: saved.avatar,
    token,
  });
}));

export default router;
