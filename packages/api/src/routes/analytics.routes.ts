import { Router, Request, Response } from "express";
import Joi from "joi";
import { AppDataSource } from "../data-source";
import { Expense } from "../entities/Expense.entity";

const router = Router({ mergeParams: true });
const repo = () => AppDataSource.getRepository(Expense);

const yearSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required(),
});

const optionalYearSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).optional(),
});

// GET /api/users/:userId/analytics/tags?year=
router.get("/tags", async (req: Request, res: Response) => {
  const { error, value } = yearSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const qb = repo()
      .createQueryBuilder("e")
      .select("e.tag", "tag")
      .addSelect("e.type", "type")
      .addSelect("SUM(e.amount)", "total")
      .addSelect("COUNT(*)", "count")
      .where("e.userId = :userId", { userId: req.params.userId })
      .andWhere("strftime('%Y', e.date) = :year", { year: String(value.year) })
      .groupBy("e.tag")
      .addGroupBy("e.type")
      .orderBy("total", "DESC");

    const rows = await qb.getRawMany();
    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/users/:userId/analytics/monthly?year=
router.get("/monthly", async (req: Request, res: Response) => {
  const { error, value } = yearSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const qb = repo()
      .createQueryBuilder("e")
      .select("strftime('%m', e.date)", "month")
      .addSelect("e.type", "type")
      .addSelect("SUM(e.amount)", "total")
      .addSelect("COUNT(*)", "count")
      .where("e.userId = :userId", { userId: req.params.userId })
      .andWhere("strftime('%Y', e.date) = :year", { year: String(value.year) })
      .groupBy("month")
      .addGroupBy("e.type")
      .orderBy("month", "ASC");

    const rows = await qb.getRawMany();
    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/users/:userId/analytics/yearly
router.get("/yearly", async (req: Request, res: Response) => {
  const { error } = optionalYearSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const qb = repo()
      .createQueryBuilder("e")
      .select("strftime('%Y', e.date)", "year")
      .addSelect("e.type", "type")
      .addSelect("SUM(e.amount)", "total")
      .addSelect("COUNT(*)", "count")
      .where("e.userId = :userId", { userId: req.params.userId })
      .groupBy("year")
      .addGroupBy("e.type")
      .orderBy("year", "DESC");

    const rows = await qb.getRawMany();
    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
