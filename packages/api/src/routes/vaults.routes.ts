import { Router, Request, Response } from "express";
import Joi from "joi";
import { AppDataSource } from "../data-source";
import { Vault } from "../entities/Vault.entity";

const router = Router({ mergeParams: true });
const repo = () => AppDataSource.getRepository(Vault);

const createSchema = Joi.object({
  name: Joi.string().max(100).required(),
});

const updateSchema = Joi.object({
  name: Joi.string().max(100).required(),
});

// GET /api/users/:userId/vaults
router.get("/", async (req: Request, res: Response) => {
  try {
    const vaults = await repo().find({
      where: { userId: req.params.userId },
      order: { name: "ASC" },
    });
    return res.json(vaults);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/users/:userId/vaults
router.post("/", async (req: Request, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const vault = repo().create({ ...value, userId: req.params.userId });
    const saved = await repo().save(vault);
    return res.status(201).json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/users/:userId/vaults/:id
router.put("/:id", async (req: Request, res: Response) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const vault = await repo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    vault.name = value.name;
    const saved = await repo().save(vault);
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/users/:userId/vaults/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const vault = await repo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    await repo().remove(vault);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
