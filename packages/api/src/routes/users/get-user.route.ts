import { Request, Response, Router } from "express";
import { usersRepo } from "./shared";

const router = Router();

router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const user = await usersRepo().findOneBy({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
