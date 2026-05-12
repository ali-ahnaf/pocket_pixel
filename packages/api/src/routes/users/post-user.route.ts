import { Request, Response, Router } from "express";
import Joi from "joi";
import { usersRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router();
const createUserSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().max(255).required(),
});

router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const existing = await usersRepo().findOneBy({ email: value.email });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const user = usersRepo().create(value);
  const saved = await usersRepo().save(user);
  return res.status(201).json(saved);
}));

export default router;
