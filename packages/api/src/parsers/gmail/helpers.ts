/**
 * Shared extraction primitives for Bangladeshi bank alert emails. Kept parser-
 * agnostic so each bank parser only declares its sender/subject match plus any
 * bank-specific wording, and reuses these for the common fields.
 */

/** Parses a BDT/Tk money amount (e.g. `BDT 1,500.00`, `Tk. 250`) into a number. */
export const parseAmount = (text: string): number | null => {
  const match = text.match(/(?:BDT|Tk\.?|৳|TAKA)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
};

const MONTHS: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

/** Parses a `12-Jul-2026` / `12 Jul 2026` date into `yyyy-mm-dd`. */
export const parseDate = (text: string): string | undefined => {
  const match = text.match(/(\d{1,2})[-\s]([A-Za-z]{3})[A-Za-z]*[-\s](\d{4})/);
  if (!match) return undefined;
  const month = MONTHS[match[2].toLowerCase()];
  if (!month) return undefined;
  return `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
};

/** Classifies the alert as money out (expense) or money in (income). */
export const inferType = (text: string): 'expense' | 'income' | null => {
  if (/\b(debited|debit|withdrawn|withdrawal|purchase|spent|paid|payment)\b/i.test(text)) return 'expense';
  if (/\b(credited|credit|received|deposited|deposit|refund)\b/i.test(text)) return 'income';
  return null;
};

/** Extracts the last 3-4 digits of the referenced account/card, if present. */
export const parseAccountTail = (text: string): string | undefined => {
  const match = text.match(/(?:A\/C|Account|Card)\b[^\d]*(?:[Xx*]{2,}\s*)?(\d{3,4})\b/i);
  return match ? match[1] : undefined;
};

/** Pulls a merchant/counterparty name after an `at <name>` / `to <name>` clause. */
export const parseMerchant = (text: string): string | undefined => {
  const match = text.match(/\b(?:at|to|from)\s+([A-Z0-9][^.\n,;]{2,40})/);
  return match ? match[1].trim() : undefined;
};
