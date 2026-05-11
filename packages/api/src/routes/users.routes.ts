import { Router, Request, Response } from "express";
import Joi from "joi";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User.entity";

const router = Router();
const repo = () => AppDataSource.getRepository(User);

const createSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().max(255).required(),
});

const updateSchema = Joi.object({
  name: Joi.string().max(100),
  email: Joi.string().email().max(255),
}).min(1);

// POST /api/users
router.post("/", async (req: Request, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const existing = await repo().findOneBy({ email: value.email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const user = repo().create(value);
    const saved = await repo().save(user);
    return res.status(201).json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/users/:userId
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const user = await repo().findOneBy({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/users/:userId
router.put("/:userId", async (req: Request, res: Response) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const user = await repo().findOneBy({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (value.email && value.email !== user.email) {
      const existing = await repo().findOneBy({ email: value.email });
      if (existing) return res.status(409).json({ message: "Email already in use" });
    }

    Object.assign(user, value);
    const saved = await repo().save(user);
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
