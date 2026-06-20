/**
 * Intentional, expected failures raised from the service layer.
 *
 * The global error handler maps an `AppError` to its `statusCode` + `message`.
 * Anything else that bubbles up is treated as an unexpected 500.
 */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
