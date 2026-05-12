import { Request, Response, Router } from "express";
import Joi from "joi";
import { usersRepo } from "./shared";

const router = Router();
const updateUserSchema = Joi.object({
  name: Joi.string().max(100),
  email: Joi.string().email().max(255),
  avatar: Joi.string().max(255).allow(''),
}).min(1);

router.put("/:userId", async (req: Request, res: Response) => {
  const { error, value } = updateUserSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const user = await usersRepo().findOneBy({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (value.email && value.email !== user.email) {
      const existing = await usersRepo().findOneBy({ email: value.email });
      if (existing) return res.status(409).json({ message: "Email already in use" });
    }

    Object.assign(user, value);
    const saved = await usersRepo().save(user);
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
