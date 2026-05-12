import { Request, Response, Router } from "express";
import { vaultsRepo } from "./shared";

const router = Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response) => {
  try {
    const vaults = await vaultsRepo().find({
      where: { userId: req.params.userId },
      order: { name: "ASC" },
    });
    return res.json(vaults);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
