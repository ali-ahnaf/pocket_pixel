import { Request, Response, Router } from "express";
import { vaultsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const vault = await vaultsRepo().findOneBy({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!vault) return res.status(404).json({ message: "Vault not found" });

  await vaultsRepo().remove(vault);
  return res.status(204).send();
}));

export default router;
