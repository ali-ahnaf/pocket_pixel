type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Minimal structured logger. Exported as a pre-built singleton instance
 * (per conventions, already-built instances are not wrapped in a class).
 * Swap the implementation for winston/pino later without touching call sites.
 */
export class Logger {
  private write(level: LogLevel, message: string, meta?: unknown): void {
    const entry = {
      level,
      time: new Date().toISOString(),
      message,
      ...(meta !== undefined ? { meta } : {}),
    };
    const line = JSON.stringify(entry);

    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  debug(message: string, meta?: unknown): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: unknown): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.write('error', message, meta);
  }
}
