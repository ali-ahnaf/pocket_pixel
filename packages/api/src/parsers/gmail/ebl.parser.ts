import { BankParser, BankMessageContent, ParsedBankTransaction } from './types';
import { parseAmount, parseDate, inferType, parseAccountTail, parseMerchant } from './helpers';

/**
 * Eastern Bank (EBL) transaction-alert parser. Same shape as the BRAC parser but
 * keyed on EBL's senders/subjects; the shared helpers do the field extraction.
 */
export const eblParser: BankParser = {
  bank: 'EBL',

  matches(content: BankMessageContent): boolean {
    const from = content.from.toLowerCase();
    const subject = content.subject.toLowerCase();
    return from.includes('ebl.com') || from.includes('easternbank') || /\bebl\b/i.test(content.from) || subject.includes('ebl');
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
      title: merchant ? `EBL — ${merchant}` : 'EBL transaction',
      date: parseDate(text),
      accountTail: parseAccountTail(text),
    };
  },
};
