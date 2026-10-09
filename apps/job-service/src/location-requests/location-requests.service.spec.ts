import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { LocationRequestsService } from './location-requests.service';
import { locationToken, readLocationToken, validPoint } from './location-token';

jest.mock('axios');
const post = axios.post as jest.Mock;

beforeAll(() => { process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing'; });
beforeEach(() => post.mockReset());

const staff = { userId: 'u-admin', companyId: 'co', role: 'company_admin' } as any;
const customer = { userId: 'u-c', companyId: 'co', role: 'customer', customerId: 'c-1', name: 'Aluthge' } as any;
const openJob = { id: 'j-1', jobNumber: 'JOB-0029', title: 'Ceiling fan installation', status: 'SCHEDULED', customerId: 'c-1', customerName: 'Aluthge Pasindu' };

function make(job: any = openJob) {
  const prisma = { job: { findFirst: jest.fn(async () => job) } };
  const jobs = { setServiceLocation: jest.fn(async () => ({ jobNumber: 'JOB-0029' })) };
  return { svc: new LocationRequestsService(prisma as any, jobs as any), prisma, jobs };
}

describe('location link', () => {
  it('opens only its own job, and nothing signed for anything else', () => {
    expect(readLocationToken(locationToken('co', 'j-1'))).toEqual({ jobId: 'j-1', companyId: 'co' });
    const loginLike = jwt.sign({ jobId: 'j-1', companyId: 'co' }, process.env.JWT_SECRET!);
    expect(readLocationToken(loginLike)).toBeNull();
    expect(readLocationToken('nonsense')).toBeNull();
  });

  it('accepts only a real point on the map', () => {
    expect(validPoint(6.84, 79.9)).toEqual({ lat: 6.84, lng: 79.9 });
    expect(validPoint(0, 0)).toBeNull();
    expect(validPoint(95, 10)).toBeNull();
    expect(validPoint('x', 10)).toBeNull();
  });
});

describe('asking the customer', () => {
  it('sends the link as a message, and by email and push, and reports each', async () => {
    post
      .mockResolvedValueOnce({ data: { conversationId: 'cv' } })
      .mockResolvedValueOnce({ data: { results: { email: 'sent' } } });
    const { svc } = make();
    const out = await svc.request(staff, 'j-1', ['message', 'email', 'push']);
    expect(out.url).toMatch(/\/share-location\/[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(out.results).toEqual({ message: 'sent', email: 'sent', push: 'with-message' });
    expect(post.mock.calls[0][0]).toMatch(/\/chat\/customers\/c-1\/messages$/);
    expect(post.mock.calls[0][1]).toMatchObject({ jobId: 'j-1' });
    expect(post.mock.calls[0][1].body).toContain(out.url);
    expect(post.mock.calls[1][1]).toMatchObject({ to: 'customer', id: 'c-1', channels: ['email'], jobId: 'j-1' });
  });

  it('refuses a finished visit or a job without a customer', async () => {
    await expect(make({ ...openJob, status: 'COMPLETED' }).svc.request(staff, 'j-1', ['email'])).rejects.toThrow('already done');
    await expect(make({ ...openJob, customerId: null }).svc.request(staff, 'j-1', ['email'])).rejects.toThrow('no customer');
  });
});

describe('the customer answering', () => {
  it('saves the pin from the link', async () => {
    const { svc, jobs } = make();
    const token = locationToken('co', 'j-1');
    await svc.submitByToken(token, { lat: 6.8447, lng: 79.9019, address: '18 Lake Road' });
    expect(jobs.setServiceLocation).toHaveBeenCalledWith('co', 'j-1', { lat: 6.8447, lng: 79.9019, address: '18 Lake Road' }, expect.anything());
  });

  it('a signed-in customer can only place their own visit', async () => {
    const { svc } = make({ ...openJob, customerId: 'someone-else' });
    await expect(svc.submitByCustomer(customer, 'j-1', { lat: 6.8, lng: 79.9 })).rejects.toThrow('your own visits');
  });

  it('refuses no pin, and a dead link', async () => {
    const { svc } = make();
    await expect(svc.submitByToken(locationToken('co', 'j-1'), { lat: 0, lng: 0 })).rejects.toThrow('Drop the pin');
    await expect(svc.submitByToken('bad', { lat: 6.8, lng: 79.9 })).rejects.toThrow('no longer valid');
  });
});
