import 'reflect-metadata';
import './env';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';
import authRouter from './routes/auth.routes';
import usersRouter from './routes/users.routes';
import transactionsRouter from './routes/transactions.routes';
import analyticsRouter from './routes/analytics.routes';
import vaultsRouter from './routes/vaults.routes';
import tagsRouter from './routes/tags.routes';
import recurringRouter from './routes/recurring.routes';
import debtsRouter from './routes/debts.routes';
import promptRouter from './routes/prompt.routes';
import { authenticate, requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { restoreAllRecurringJobs } from './scheduler/recurring-scheduler';

const app = express();
const PORT = process.env.PORT || 4000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin: isDev ? true : process.env.ALLOWED_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(authenticate);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

// authenticated endpoints below this that must have a bearer token
app.use(requireAuth);

app.use('/api/users', usersRouter);
app.use('/api/users/:userId/prompt', promptRouter);
app.use('/api/users/:userId/transactions', transactionsRouter);
app.use('/api/users/:userId/analytics', analyticsRouter);
app.use('/api/users/:userId/vaults', vaultsRouter);
app.use('/api/users/:userId/tags', tagsRouter);
app.use('/api/users/:userId/recurring', recurringRouter);
app.use('/api/users/:userId/debts', debtsRouter);

app.use(errorHandler); // global error handler

// Serve static files from the Next.js build
const uiDir = path.join(__dirname, '../../ui/out');
if (fs.existsSync(uiDir)) {
  app.use(express.static(uiDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(uiDir, 'index.html'));
  });
}

// Database connection and server startup
AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected');
    try {
      await restoreAllRecurringJobs();
    } catch (err) {
      console.error('Failed to restore recurring jobs:', err);
    }
    app.listen(PORT, () => {
      console.log(`Node env: ${process.env.NODE_ENV}`);
      console.log(`API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed during initialization:', err);
    console.error(err.stack);
    process.exit(1);
  });
