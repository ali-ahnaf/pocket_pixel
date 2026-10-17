import type { AdventureDto } from '@expense-tracker/shared';
import { formatDueDate } from '../debts/DebtRow';

/** "01/10/2026 to 08/10/2026", the single date when only one is set, or '' when neither is. */
export function formatAdventureDates({ startDate, endDate }: Pick<AdventureDto, 'startDate' | 'endDate'>): string {
  if (startDate && endDate) return `${formatDueDate(startDate)} to ${formatDueDate(endDate)}`;
  if (startDate) return `From ${formatDueDate(startDate)}`;
  if (endDate) return `Until ${formatDueDate(endDate)}`;
  return '';
}
