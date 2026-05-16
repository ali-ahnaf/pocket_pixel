import { Request, Response, Router } from "express";
import { asyncHandler } from "../../middleware/error-handler";
import { debtsRepo, serializeDebt } from "./shared";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const debts = await debtsRepo().find({
    where: { userId: req.params.userId },
    order: { createdAt: "DESC" },
  });
  return res.json(debts.map(serializeDebt));
}));

export default router;
