import { Request, Response, Router } from "express";
import Joi from "joi";
import { analyticsRepo } from "./shared";

const router = Router({ mergeParams: true });
const yearSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required(),
});

router.get("/tags", async (req: Request, res: Response) => {
  const { error, value } = yearSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const rows = await analyticsRepo()
      .createQueryBuilder("e")
      .select("e.tag", "tag")
      .addSelect("e.type", "type")
      .addSelect("SUM(e.amount)", "total")
      .addSelect("COUNT(*)", "count")
      .where("e.userId = :userId", { userId: req.params.userId })
      .andWhere("strftime('%Y', e.date) = :year", { year: String(value.year) })
      .groupBy("e.tag")
      .addGroupBy("e.type")
      .orderBy("total", "DESC")
      .getRawMany();

    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
