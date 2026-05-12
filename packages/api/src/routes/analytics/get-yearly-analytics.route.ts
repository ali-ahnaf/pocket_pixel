import { Request, Response, Router } from "express";
import Joi from "joi";
import { analyticsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });
const optionalYearSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).optional(),
});

router.get("/yearly", asyncHandler(async (req: Request, res: Response) => {
  const { error } = optionalYearSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const rows = await analyticsRepo()
    .createQueryBuilder("e")
    .select("strftime('%Y', e.date)", "year")
    .addSelect("e.type", "type")
    .addSelect("SUM(e.amount)", "total")
    .addSelect("COUNT(*)", "count")
    .where("e.userId = :userId", { userId: req.params.userId })
    .groupBy("year")
    .addGroupBy("e.type")
    .orderBy("year", "DESC")
    .getRawMany();

  return res.json(rows);
}));

export default router;
