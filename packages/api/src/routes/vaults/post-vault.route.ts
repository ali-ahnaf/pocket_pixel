import { Request, Response, Router } from "express";
import Joi from "joi";
import { vaultsRepo } from "./shared";

const router = Router({ mergeParams: true });
const createVaultSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(255).allow('').default(''),
  icon: Joi.string().max(100).optional(),
  backgroundColor: Joi.string().max(50).optional(),
});

router.post("/", async (req: Request, res: Response) => {
  const { error, value } = createVaultSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const vault = vaultsRepo().create({ ...value, userId: req.params.userId, isDefault: false });
    const saved = await vaultsRepo().save(vault);
    return res.status(201).json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
