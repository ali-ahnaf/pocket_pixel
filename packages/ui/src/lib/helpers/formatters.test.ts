import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatTime } from './formatters';

describe('formatCurrency', () => {
  it('formats a positive amount with 2 decimals', () => {
    expect(formatCurrency(1234.5)).toBe('⛁ 1,234.50');
  });

  it('formats a negative amount as its absolute value', () => {
    expect(formatCurrency(-50)).toBe('⛁ 50.00');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('⛁ 0.00');
  });
});

describe('formatDate', () => {
  it('formats a YYYY-MM-DD string into a short date', () => {
    expect(formatDate('2026-01-05')).toBe('Jan 5');
  });

  it('formats a mid-year date correctly', () => {
    expect(formatDate('2026-07-20')).toBe('Jul 20');
  });
});

describe('formatTime', () => {
  it('formats an ISO datetime into 12-hour time (PM)', () => {
    expect(formatTime('2026-01-05T14:30:00')).toBe('2:30 PM');
  });

  it('formats an ISO datetime into 12-hour time (AM)', () => {
    expect(formatTime('2026-01-05T09:05:00')).toBe('9:05 AM');
  });
});