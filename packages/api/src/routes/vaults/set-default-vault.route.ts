import { Request, Response, Router } from "express";
import { AppDataSource } from "../../data-source";
import { Vault } from "../../entities/Vault.entity";

const router = Router({ mergeParams: true });

router.put("/:id/set-default", async (req: Request, res: Response) => {
  const { userId, id } = req.params;
  try {
    const vault = await AppDataSource.getRepository(Vault).findOneBy({ id, userId });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    await AppDataSource.manager.transaction(async (em) => {
      await em.update(Vault, { userId }, { isDefault: false });
      await em.update(Vault, { id, userId }, { isDefault: true });
    });

    return res.json({ ...vault, isDefault: true });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
