import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { logger, utilService } from '../services';

export function asyncHandler(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn('Handled application error', { message: err.message, statusCode: err.statusCode });
    utilService.replyError(res, err.message, err.statusCode);
    return;
  }

  logger.error('Unhandled error', { error: err instanceof Error ? err.stack : err });
  utilService.replyError(res, 'Internal server error', 500);
}
