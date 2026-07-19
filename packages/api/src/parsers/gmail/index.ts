import { BankParser, BankMessageContent, ParsedBankTransaction } from './types';
import { bracBankParser } from './brac-bank.parser';
import { eblParser } from './ebl.parser';

/**
 * Strategy registry of bank alert parsers, tried in order. Add a bank by writing
 * an isolated parser and appending it here — nothing else changes.
 */
export const bankParsers: BankParser[] = [bracBankParser, eblParser];

/** Finds the first parser whose sender/subject matches and runs it; null if none. */
export const parseBankMessage = (content: BankMessageContent): ParsedBankTransaction | null => {
  const parser = bankParsers.find((candidate) => candidate.matches(content));
  return parser ? parser.parse(content) : null;
};

export * from './types';
