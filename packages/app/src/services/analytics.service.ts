import { AnalyticsRepository, AnalyticsRow } from '../repositories/analytics.repository';
import { analyticsRepository } from '../repositories';

/**
 * Read-only spending analytics. The repository is injected (defaults to the
 * shared singleton) so the service can be unit-tested against a mock.
 */
export class AnalyticsService {
  constructor(private readonly analytics: AnalyticsRepository = analyticsRepository) {}

  monthly(userId: string, year: number, vaultIds?: string[]): Promise<AnalyticsRow[]> {
    return this.analytics.monthlyByYear(userId, year, vaultIds);
  }

  yearly(userId: string, vaultIds?: string[]): Promise<AnalyticsRow[]> {
    return this.analytics.yearly(userId, vaultIds);
  }

  vaults(userId: string, vaultIds?: string[]): Promise<AnalyticsRow[]> {
    return this.analytics.byVault(userId, vaultIds);
  }

  tags(userId: string, year: number, vaultIds?: string[]): Promise<AnalyticsRow[]> {
    return this.analytics.tagsByYear(userId, year, vaultIds);
  }
}
