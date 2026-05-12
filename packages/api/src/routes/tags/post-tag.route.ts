import { Request, Response, Router } from "express";
import Joi from "joi";
import { tagsRepo } from "./shared";

const router = Router({ mergeParams: true });

const createTagSchema = Joi.object({
  name: Joi.string().max(100).required(),
  icon: Joi.string().max(100).optional(),
  backgroundColor: Joi.string().max(50).optional(),
});

router.post("/", async (req: Request, res: Response) => {
  const { error, value } = createTagSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const tag = tagsRepo().create({ ...value, userId: req.params.userId });
    const saved = await tagsRepo().save(tag);
    return res.status(201).json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
