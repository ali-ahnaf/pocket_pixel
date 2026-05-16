import { Request, Response, Router } from "express";
import { asyncHandler } from "../../middleware/error-handler";
import { debtsRepo } from "./shared";

const router = Router({ mergeParams: true });

router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const debt = await debtsRepo().findOneBy({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!debt) return res.status(404).json({ message: "Due not found" });

  await debtsRepo().remove(debt);
  return res.status(204).send();
}));

export default router;
