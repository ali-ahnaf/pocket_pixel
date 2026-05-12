import { Request, Response, Router } from "express";
import Joi from "joi";
import { vaultsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });
const updateVaultSchema = Joi.object({
  name: Joi.string().max(100),
  description: Joi.string().max(255).allow(''),
  icon: Joi.string().max(100).allow(null),
  backgroundColor: Joi.string().max(50).allow(null),
}).min(1);

router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = updateVaultSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const vault = await vaultsRepo().findOneBy({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!vault) return res.status(404).json({ message: "Vault not found" });

  Object.assign(vault, value);
  const saved = await vaultsRepo().save(vault);
  return res.json(saved);
}));

export default router;
