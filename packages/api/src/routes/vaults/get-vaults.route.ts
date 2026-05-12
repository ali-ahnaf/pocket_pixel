import { Request, Response, Router } from "express";
import { vaultsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const vaults = await vaultsRepo().find({
    where: { userId: req.params.userId },
    order: { name: "ASC" },
  });
  return res.json(vaults);
}));

export default router;
