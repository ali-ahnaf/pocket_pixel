import { Response } from 'express';

/**
 * Centralizes how routes write HTTP responses so the wire format stays
 * consistent. The app returns raw payloads (the frontend `ApiClient` reads
 * the body directly), so `replyOk` sends `data` as-is rather than wrapping it
 * in an envelope. Errors are always `{ message }`.
 *
 * Always call these helpers with `return`.
 */
export class UtilService {
  replyOk<T>(res: Response, data: T, status = 200): Response {
    return res.status(status).json(data ?? null);
  }

  replyCreated<T>(res: Response, data: T): Response {
    return this.replyOk(res, data, 201);
  }

  replyNoContent(res: Response): Response {
    return res.status(204).send();
  }

  replyError(res: Response, message: string, status = 400, data?: unknown): Response {
    return res.status(status).json({ message, ...(data !== undefined ? { data } : {}) });
  }
}
