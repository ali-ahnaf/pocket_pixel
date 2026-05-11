import { Router, Request, Response } from "express";
import Joi from "joi";
import { AppDataSource } from "../data-source";
import { RecurringTransaction } from "../entities/RecurringTransaction.entity";

const router = Router({ mergeParams: true });
const repo = () => AppDataSource.getRepository(RecurringTransaction);

const createSchema = Joi.object({
  title: Joi.string().max(200).required(),
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid("expense", "income").default("expense"),
  tag: Joi.string().max(100).allow(null, "").optional(),
  interval: Joi.string().valid("weekly", "monthly").required(),
  startDate: Joi.string().isoDate().required(),
});

const updateSchema = Joi.object({
  title: Joi.string().max(200),
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid("expense", "income"),
  tag: Joi.string().max(100).allow(null, ""),
  interval: Joi.string().valid("weekly", "monthly"),
  startDate: Joi.string().isoDate(),
}).min(1);

// GET /api/users/:userId/recurring
router.get("/", async (req: Request, res: Response) => {
  try {
    const items = await repo().find({
      where: { userId: req.params.userId },
      order: { startDate: "DESC" },
    });
    return res.json(items);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/users/:userId/recurring
router.post("/", async (req: Request, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const item = repo().create({ ...value, userId: req.params.userId });
    const saved = await repo().save(item);
    return res.status(201).json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/users/:userId/recurring/:id
router.put("/:id", async (req: Request, res: Response) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const item = await repo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!item) return res.status(404).json({ message: "Recurring transaction not found" });

    Object.assign(item, value);
    const saved = await repo().save(item);
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/users/:userId/recurring/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const item = await repo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!item) return res.status(404).json({ message: "Recurring transaction not found" });

    await repo().remove(item);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
