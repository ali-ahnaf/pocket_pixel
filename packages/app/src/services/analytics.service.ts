import { AnalyticsRepository, AnalyticsRow } from '../repositories/analytics.repository';
import { analyticsRepository } from '../repositories';

/**
 * Read-only spending analytics. The repository is injected (defaults to the
 * shared singleton) so the service can be unit-tested against a mock.
 */
export class AnalyticsService {
  constructor(private readonly analytics: AnalyticsRepository = analyticsRepository) {}

  monthly(userId: string, year: number, vaultId?: string): Promise<AnalyticsRow[]> {
    return this.analytics.monthlyByYear(userId, year, vaultId);
  }

  yearly(userId: string, vaultId?: string): Promise<AnalyticsRow[]> {
    return this.analytics.yearly(userId, vaultId);
  }

  tags(userId: string, year: number, vaultId?: string): Promise<AnalyticsRow[]> {
    return this.analytics.tagsByYear(userId, year, vaultId);
  }
}
