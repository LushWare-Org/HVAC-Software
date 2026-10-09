import { agentContext } from './context';

const req = (auth = 'Bearer jwt') => ({ headers: { authorization: auth } }) as any;
const user = (role: string) => ({ userId: 'u', companyId: 'co', role, email: 'e' }) as any;

describe('agentContext', () => {
  it('picks the assistant from the role, never from the client', () => {
    expect(agentContext(user('customer'), req()).botType).toBe('customer');
    expect(agentContext(user('technician'), req()).botType).toBe('technician');
    expect(agentContext(user('TECHNICIAN'), req()).botType).toBe('technician');
    expect(agentContext(user('dispatcher'), req()).botType).toBe('admin');
  });
});
