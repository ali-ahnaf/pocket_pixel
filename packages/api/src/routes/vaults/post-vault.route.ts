import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { vaultsRepo } from './shared';
import { usersRepo } from '../users/shared';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });
const createVaultSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(255).allow('').default(''),
  icon: Joi.string().max(100).optional(),
  backgroundColor: Joi.string().max(50).optional(),
});

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createVaultSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const user = await usersRepo().findOneBy({ id: req.params.userId });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const vault = vaultsRepo().create({ ...value, userId: req.params.userId, isDefault: false });
  const saved = await vaultsRepo().save(vault);
  return res.status(201).json(saved);
}));

export default router;
