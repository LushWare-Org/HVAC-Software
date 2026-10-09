import * as jwt from 'jsonwebtoken';
import { viewerFromHandshake } from './chat.gateway';

const SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';
const ENV = { ...process.env };
beforeEach(() => { process.env = { ...ENV, JWT_SECRET: SECRET }; delete process.env.BYPASS_AUTH; process.env.NODE_ENV = 'test'; });
afterAll(() => { process.env = ENV; });

const hs = (h: any) => ({ headers: {}, query: {}, auth: {}, ...h }) as any;

describe('who is on the socket', () => {
  it('takes identity only from a valid login token', () => {
    const token = jwt.sign({ sub: 'cu-1', company_id: 'co', role: 'customer', name: 'Aluthge', customer_id: 'c-1' }, SECRET);
    expect(viewerFromHandshake(hs({ auth: { token } }))).toEqual({ userId: 'cu-1', companyId: 'co', role: 'customer', name: 'Aluthge', customerId: 'c-1' });
    expect(viewerFromHandshake(hs({ auth: { token: jwt.sign({ sub: 'x', company_id: 'co', role: 'company_admin' }, 'wrong-secret-wrong-secret-wrong-secret') } }))).toBeNull();
  });

  it('ignores identity in the URL unless the local test shortcut is on, and never in production', () => {
    const q = { query: { companyId: 'co', userId: 'u-1', role: 'company_admin' } };
    expect(viewerFromHandshake(hs(q))).toBeNull();
    process.env.BYPASS_AUTH = 'true';
    expect(viewerFromHandshake(hs(q))).toMatchObject({ userId: 'u-1', role: 'company_admin' });
    process.env.NODE_ENV = 'production';
    expect(viewerFromHandshake(hs(q))).toBeNull();
  });
});
