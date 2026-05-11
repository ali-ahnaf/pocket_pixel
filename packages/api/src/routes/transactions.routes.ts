import { Router, Request, Response } from "express";
import Joi from "joi";
import { AppDataSource } from "../data-source";
import { Expense } from "../entities/Expense.entity";
import { Between } from "typeorm";

const router = Router({ mergeParams: true });
const repo = () => AppDataSource.getRepository(Expense);

const createSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid("expense", "income").default("expense"),
  tag: Joi.string().max(100).allow(null, "").optional(),
  title: Joi.string().max(200).allow(null, "").optional(),
  date: Joi.string().isoDate().required(),
  vaultId: Joi.string().uuid().allow(null).optional(),
});

const updateSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid("expense", "income"),
  tag: Joi.string().max(100).allow(null, ""),
  title: Joi.string().max(200).allow(null, ""),
  date: Joi.string().isoDate(),
  vaultId: Joi.string().uuid().allow(null),
}).min(1);

const querySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});

// GET /api/users/:userId/transactions?month=&year=
router.get("/", async (req: Request, res: Response) => {
  const { error, value } = querySchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const { month, year } = value;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const endStr = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  try {
    const transactions = await repo().find({
      where: {
        userId: req.params.userId,
        date: Between(startDate, endStr),
      },
      order: { date: "DESC" },
    });
    return res.json(transactions);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/users/:userId/transactions
router.post("/", async (req: Request, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const transaction = repo().create({ ...value, userId: req.params.userId });
    const saved = await repo().save(transaction);
    return res.status(201).json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/users/:userId/transactions/:id
router.put("/:id", async (req: Request, res: Response) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const transaction = await repo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    Object.assign(transaction, value);
    const saved = await repo().save(transaction);
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/users/:userId/transactions/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const transaction = await repo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    await repo().remove(transaction);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
