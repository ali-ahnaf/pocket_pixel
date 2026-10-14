import { useEffect, useState } from 'react';
import { analyticsService, logger, usersService } from '../services';
import { useLocalUserId } from './DatabaseProvider';

interface HomeSummary {
  name: string;
  transactionCount: number;
  monthIncome: number;
  monthExpense: number;
}

/** Profile name, all-time transaction count and this month's (UTC) income and expense, from SQL aggregates. */
export function useHomeSummary(): HomeSummary {
  const userId = useLocalUserId();
  const [summary, setSummary] = useState<HomeSummary>({ name: '', transactionCount: 0, monthIncome: 0, monthExpense: 0 });

  useEffect(() => {
    const [y, m] = new Date().toISOString().slice(0, 7).split('-');
    Promise.all([usersService.getById(userId), analyticsService.monthly(userId, Number(y)), analyticsService.yearly(userId)]).then(
      ([user, monthly, yearly]) => {
        const monthTotal = (type: string): number => monthly.filter((r) => r.month === m && r.type === type).reduce((sum, r) => sum + parseFloat(String(r.total)), 0);
        setSummary({
          name: user.name,
          transactionCount: yearly.reduce((sum, r) => sum + Number(r.count), 0),
          monthIncome: monthTotal('income'),
          monthExpense: monthTotal('expense'),
        });
      },
      (err) => logger.error('Home summary failed', { err }),
    );
  }, [userId]);

  return summary;
}
