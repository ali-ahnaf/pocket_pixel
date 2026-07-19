import { BankParser, BankMessageContent, ParsedBankTransaction } from './types';
import { parseAmount, parseDate, inferType, parseAccountTail, parseMerchant } from './helpers';

/**
 * BRAC Bank transaction-alert parser. Matches on the bank's alert senders /
 * subjects, then reads the amount, direction, date and (best-effort) merchant
 * and account tail out of the notification body.
 */
export const bracBankParser: BankParser = {
  bank: 'BRAC Bank',

  matches(content: BankMessageContent): boolean {
    const from = content.from.toLowerCase();
    const subject = content.subject.toLowerCase();
    return from.includes('bracbank') || from.includes('brac bank') || subject.includes('brac bank');
  },

  parse(content: BankMessageContent): ParsedBankTransaction | null {
    const text = `${content.subject}\n${content.bodyText}`;
    const amount = parseAmount(text);
    const type = inferType(text);
    if (amount === null || type === null) return null;

    const merchant = parseMerchant(text);
    return {
      amount,
      type,
      title: merchant ? `BRAC Bank — ${merchant}` : 'BRAC Bank transaction',
      date: parseDate(text),
      accountTail: parseAccountTail(text),
    };
  },
};
