import { parseBankMessage, BankMessageContent } from '../parsers/gmail';
import { extractMessageContent } from '../utils/gmail-message.util';
import type { GmailMessage } from '../services/gmail.service';

const content = (overrides: Partial<BankMessageContent>): BankMessageContent => ({
  from: '',
  subject: '',
  bodyText: '',
  emailDate: null,
  ...overrides,
});

describe('parseBankMessage', () => {
  it('parses a BRAC Bank debit alert into an expense with merchant, date and account tail', () => {
    const result = parseBankMessage(
      content({
        from: 'alerts@bracbank.com',
        subject: 'BRAC Bank Transaction Alert',
        bodyText: 'Dear Customer, Your Account No. XXXX1234 has been debited BDT 1,500.00 on 12-Jul-2026 at DARAZ ONLINE. Available Balance BDT 5,000.00.',
      }),
    );

    expect(result).toEqual({
      amount: 1500,
      type: 'expense',
      title: 'BRAC Bank — DARAZ ONLINE',
      date: '2026-07-12',
      accountTail: '1234',
    });
  });

  it('parses an EBL credit alert into an income', () => {
    const result = parseBankMessage(
      content({
        from: 'notification@ebl.com.bd',
        subject: 'EBL Account Credited',
        bodyText: 'Your A/C 5678 has been credited BDT 20,000.00 on 01-Jul-2026. Salary received.',
      }),
    );

    expect(result).toMatchObject({ amount: 20000, type: 'income', title: 'EBL transaction', date: '2026-07-01', accountTail: '5678' });
  });

  it('returns null when the sender matches no bank', () => {
    expect(parseBankMessage(content({ from: 'friend@gmail.com', subject: 'lunch?', bodyText: 'BDT 500 you owe me' }))).toBeNull();
  });

  it('returns null for a matched bank email that is not a transaction alert (no amount)', () => {
    expect(parseBankMessage(content({ from: 'alerts@bracbank.com', subject: 'BRAC Bank OTP', bodyText: 'Your one-time password is 123456.' }))).toBeNull();
  });
});

describe('extractMessageContent', () => {
  const b64url = (s: string): string => Buffer.from(s).toString('base64url');

  it('reads headers and decodes a plain-text body', () => {
    const message: GmailMessage = {
      id: 'm1',
      payload: {
        mimeType: 'text/plain',
        headers: [
          { name: 'From', value: 'alerts@bracbank.com' },
          { name: 'Subject', value: 'Alert' },
          { name: 'Date', value: 'Sun, 12 Jul 2026 10:00:00 +0600' },
        ],
        body: { data: b64url('debited BDT 100.00') },
      },
    };

    expect(extractMessageContent(message)).toEqual({
      from: 'alerts@bracbank.com',
      subject: 'Alert',
      bodyText: 'debited BDT 100.00',
      emailDate: 'Sun, 12 Jul 2026 10:00:00 +0600',
    });
  });

  it('walks multipart trees and strips HTML parts to text', () => {
    const message: GmailMessage = {
      id: 'm2',
      payload: {
        mimeType: 'multipart/alternative',
        headers: [{ name: 'From', value: 'notification@ebl.com.bd' }],
        parts: [{ mimeType: 'text/html', body: { data: b64url('<p>credited <b>BDT&nbsp;250.00</b></p>') } }],
      },
    };

    const result = extractMessageContent(message);
    expect(result.from).toBe('notification@ebl.com.bd');
    expect(result.bodyText).toContain('credited BDT 250.00');
  });
});
