import { Request, Response, Router } from "express";
import { AppDataSource } from "../../data-source";
import { Vault } from "../../entities/Vault.entity";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

router.put("/:id/set-default", asyncHandler(async (req: Request, res: Response) => {
  const { userId, id } = req.params;

  const vault = await AppDataSource.getRepository(Vault).findOneBy({ id, userId });
  if (!vault) return res.status(404).json({ message: "Vault not found" });

  await AppDataSource.manager.transaction(async (em) => {
    await em.update(Vault, { userId }, { isDefault: false });
    await em.update(Vault, { id, userId }, { isDefault: true });
  });

  return res.json({ ...vault, isDefault: true });
}));

export default router;
