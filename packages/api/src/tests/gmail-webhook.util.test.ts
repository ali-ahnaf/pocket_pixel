import { extractBearerToken, decodePubSubMessage, verifyPubSubOidcToken } from '../utils/gmail-webhook.util';

const base64Json = (obj: unknown): string => Buffer.from(JSON.stringify(obj)).toString('base64');

describe('gmail-webhook.util', () => {
  describe('extractBearerToken', () => {
    it('returns the token from a Bearer header', () => {
      expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    });

    it('throws on a missing or malformed header', () => {
      expect(() => extractBearerToken(undefined)).toThrow('Missing Pub/Sub bearer token');
      expect(() => extractBearerToken('Basic xyz')).toThrow('Missing Pub/Sub bearer token');
    });
  });

  describe('decodePubSubMessage', () => {
    it('decodes a valid base64 Gmail notification', () => {
      const message = { data: base64Json({ emailAddress: 'me@example.com', historyId: 12345 }), messageId: 'm-1' };
      expect(decodePubSubMessage(message)).toEqual({ emailAddress: 'me@example.com', historyId: '12345' });
    });

    it('returns null when data is missing or not a string', () => {
      expect(decodePubSubMessage({})).toBeNull();
      expect(decodePubSubMessage({ data: 42 })).toBeNull();
      expect(decodePubSubMessage(null)).toBeNull();
    });

    it('returns null when the payload is not valid JSON', () => {
      expect(decodePubSubMessage({ data: Buffer.from('not json').toString('base64') })).toBeNull();
    });

    it('returns null when required fields are absent', () => {
      expect(decodePubSubMessage({ data: base64Json({ historyId: 1 }) })).toBeNull();
      expect(decodePubSubMessage({ data: base64Json({ emailAddress: 'me@example.com' }) })).toBeNull();
    });
  });

  describe('verifyPubSubOidcToken', () => {
    it('throws 500 when the expected audience is not configured', async () => {
      await expect(verifyPubSubOidcToken('any.token.here', undefined)).rejects.toThrow('Gmail Pub/Sub audience is not configured');
    });

    it('rejects a token that is not a well-formed JWT', async () => {
      await expect(verifyPubSubOidcToken('not-a-jwt', 'https://app/webhook')).rejects.toThrow('Invalid Pub/Sub OIDC token');
    });
  });
});
