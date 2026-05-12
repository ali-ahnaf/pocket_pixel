import 'reflect-metadata';
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
import { requireAuth } from './middleware/auth';

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users/:userId', requireAuth);
app.use('/api/users', usersRouter);
app.use('/api/users/:userId/transactions', transactionsRouter);
app.use('/api/users/:userId/analytics', analyticsRouter);
app.use('/api/users/:userId/vaults', vaultsRouter);
app.use('/api/users/:userId/tags', tagsRouter);
app.use('/api/users/:userId/recurring', recurringRouter);

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
