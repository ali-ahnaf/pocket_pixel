import { Request, Response, Router } from "express";
import Joi from "joi";
import { tagsRepo } from "./shared";

const router = Router({ mergeParams: true });

const updateTagSchema = Joi.object({
  name: Joi.string().max(100),
  icon: Joi.string().max(100).allow(null),
  backgroundColor: Joi.string().max(50).allow(null),
}).min(1);

router.put("/:id", async (req: Request, res: Response) => {
  const { error, value } = updateTagSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const tag = await tagsRepo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!tag) return res.status(404).json({ message: "Tag not found" });

    Object.assign(tag, value);
    const saved = await tagsRepo().save(tag);
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
