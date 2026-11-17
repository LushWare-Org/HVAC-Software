import * as jwt from 'jsonwebtoken';
import { signOAuthState, verifyOAuthState } from './oauth-state';

describe('IoT OAuth state', () => {
  const payload = { companyId: 'co-1', customerId: 'cust-1', source: 'portal' as const, provider: 'honeywell' as const };

  beforeAll(() => {
    process.env.JWT_SECRET = 'unit-test-secret';
  });

  it('round-trips a signed state', () => {
    expect(verifyOAuthState(signOAuthState(payload), 'honeywell')).toEqual(payload);
  });

  it('rejects the old unsigned base64 state', () => {
    const forged = Buffer.from(JSON.stringify({ ...payload, customerId: 'victim' })).toString('base64');
    expect(() => verifyOAuthState(forged, 'honeywell')).toThrow();
  });

  it('rejects a state whose contents were changed after signing', () => {
    const [head, body, sig] = signOAuthState(payload).split('.');
    const tampered = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), customerId: 'victim' })).toString('base64url');
    expect(() => verifyOAuthState(`${head}.${tampered}.${sig}`, 'honeywell')).toThrow();
  });

  it('rejects a state signed with a different key', () => {
    const other = jwt.sign(payload, 'some-other-key', { audience: 'iot-oauth-state', expiresIn: '15m' });
    expect(() => verifyOAuthState(other, 'honeywell')).toThrow();
  });

  it('rejects a login token reused as a state', () => {
    const accessToken = jwt.sign({ ...payload }, 'unit-test-secret', { expiresIn: '24h' });
    expect(() => verifyOAuthState(accessToken, 'honeywell')).toThrow();
  });

  it('rejects an expired state', () => {
    const expired = signOAuthState(payload);
    const decoded = jwt.decode(expired) as jwt.JwtPayload;
    jest.useFakeTimers().setSystemTime((decoded.exp! + 1) * 1000);
    try {
      expect(() => verifyOAuthState(expired, 'honeywell')).toThrow();
    } finally {
      jest.useRealTimers();
    }
  });

  it('rejects a state minted for the other provider', () => {
    expect(() => verifyOAuthState(signOAuthState(payload), 'nest')).toThrow();
  });
});
