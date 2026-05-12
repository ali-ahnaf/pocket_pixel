import { Request, Response, Router } from "express";
import Joi from "joi";
import { tagsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

const createTagSchema = Joi.object({
  name: Joi.string().max(100).required(),
  icon: Joi.string().max(100).optional(),
  backgroundColor: Joi.string().max(50).optional(),
});

router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createTagSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const tag = tagsRepo().create({ ...value, userId: req.params.userId });
  const saved = await tagsRepo().save(tag);
  return res.status(201).json(saved);
}));

export default router;
