import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import usersRouter from "./routes/users.routes";
import transactionsRouter from "./routes/transactions.routes";

import analyticsRouter from "./routes/analytics.routes";
import vaultsRouter from "./routes/vaults.routes";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", usersRouter);
app.use("/api/users/:userId/transactions", transactionsRouter);
app.use("/api/users/:userId/analytics", analyticsRouter);
app.use("/api/users/:userId/vaults", vaultsRouter);

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
