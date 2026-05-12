import { Request, Response, Router } from "express";
import { vaultsRepo } from "./shared";

const router = Router({ mergeParams: true });

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const vault = await vaultsRepo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    await vaultsRepo().remove(vault);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
