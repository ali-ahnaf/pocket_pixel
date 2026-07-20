import { GmailScriptRunnerService } from '../services/gmail-script-runner.service';
import { AppError } from '../errors/app-error';
import type { GmailMessageContent } from '../utils/gmail-message.util';

const email = (overrides: Partial<GmailMessageContent> = {}): GmailMessageContent => ({
  from: 'alerts@bank.com',
  subject: 'Transaction Alert',
  bodyText: 'You spent BDT 1,500.00 at DARAZ',
  emailDate: null,
  ...overrides,
});

describe('GmailScriptRunnerService', () => {
  const service = new GmailScriptRunnerService();

  it('returns the validated transaction for a well-formed script', () => {
    const script = `function parse(email) {
      const m = email.bodyText.match(/BDT ([\\d,]+(?:\\.\\d+)?)/);
      return { title: email.subject, amount: Number(m[1].replace(/,/g, '')), type: 'expense', date: '2026-07-12' };
    }`;

    expect(service.run(script, email())).toEqual({ title: 'Transaction Alert', amount: 1500, type: 'expense', date: '2026-07-12' });
  });

  it('defaults the date to today when the script omits it', () => {
    const today = new Date().toISOString().split('T')[0];
    const script = `function parse(email) { return { title: 't', amount: 5, type: 'income' }; }`;

    expect(service.run(script, email())).toEqual({ title: 't', amount: 5, type: 'income', date: today });
  });

  it('returns null when the script explicitly returns null (not a transaction)', () => {
    expect(service.run('function parse(email) { return null; }', email())).toBeNull();
  });

  it('returns null when the script throws at runtime', () => {
    expect(service.run('function parse(email) { throw new Error("boom"); }', email())).toBeNull();
  });

  it('returns null when the script never defines parse', () => {
    expect(service.run('const x = 1;', email())).toBeNull();
  });

  it('returns null when the script exceeds the timeout', () => {
    expect(service.run('function parse(email) { while (true) {} }', email())).toBeNull();
  });

  describe('invalid returned shape throws AppError(400)', () => {
    const cases: { name: string; script: string }[] = [
      { name: 'missing amount', script: `function parse(e){ return { title: 'x', type: 'expense' }; }` },
      { name: 'amount not > 0', script: `function parse(e){ return { title: 'x', amount: 0, type: 'expense' }; }` },
      { name: 'empty title', script: `function parse(e){ return { title: '  ', amount: 5, type: 'expense' }; }` },
      { name: 'bad type', script: `function parse(e){ return { title: 'x', amount: 5, type: 'transfer' }; }` },
      { name: 'bad date format', script: `function parse(e){ return { title: 'x', amount: 5, type: 'expense', date: '2026/07/12' }; }` },
    ];

    it.each(cases)('$name', ({ script }) => {
      expect(() => service.run(script, email())).toThrow(AppError);
    });
  });
});
