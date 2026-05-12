import { Request, Response, Router } from "express";
import { usersRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router();

router.get("/:userId", asyncHandler(async (req: Request, res: Response) => {
  const user = await usersRepo().findOneBy({ id: req.params.userId });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json(user);
}));

export default router;
