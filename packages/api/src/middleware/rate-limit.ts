import { Request, Response } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

/**
 * Rate limiter for the prompt endpoint. This route fans out to an LLM on every
 * call, so it is comparatively expensive — cap how often a single user can hit
 * it. Keyed by authenticated user id (falling back to client IP) so the limit
 * is per-account rather than shared across everyone behind a NAT.
 */
export const promptRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // max requests per window per user
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request): string => req.user?.userId ?? ipKeyGenerator(req.ip ?? ''),
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({ message: 'Too many requests, please try again later.' });
  },
});
