import * as jwt from 'jsonwebtoken';
import { InternalTokenService } from './internal-token.service';

describe('InternalTokenService', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('mints an HS256 token carrying the partner’s company', () => {
    const token = new InternalTokenService().tokenFor('co-demo-001');
    const decoded = jwt.verify(token, 'test-secret') as any;

    expect(jwt.decode(token, { complete: true })?.header.alg).toBe('HS256');
    expect(decoded.company_id).toBe('co-demo-001');
    expect(decoded.sub).toBe('svc:partner-api:co-demo-001');
    expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(120);
  });

  it('will not verify against a different secret', () => {
    const token = new InternalTokenService().tokenFor('co-demo-001');
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });

  it('issues a distinct token per company', () => {
    const service = new InternalTokenService();
    const a = jwt.decode(service.tokenFor('co-a')) as any;
    const b = jwt.decode(service.tokenFor('co-b')) as any;
    expect(a.company_id).toBe('co-a');
    expect(b.company_id).toBe('co-b');
  });

  it('reuses a cached token for the same company', () => {
    const service = new InternalTokenService();
    expect(service.tokenFor('co-a')).toBe(service.tokenFor('co-a'));
  });
});
