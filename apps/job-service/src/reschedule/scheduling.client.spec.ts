import axios from 'axios';
import { SchedulingClient } from './scheduling.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SchedulingClient', () => {
  let client: SchedulingClient;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BYPASS_AUTH = 'true';
    client = new SchedulingClient();
  });

  it('cancels the live assignment for a job', async () => {
    // The Go handler returns { data: [...] } — see dispatch_handler.go:92.
    mockedAxios.get.mockResolvedValue({ data: { data: [{ id: 'assign-1', status: 'ASSIGNED' }] } });
    mockedAxios.patch.mockResolvedValue({ data: {} });

    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(true);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/dispatch/assignments/job/job-1'),
      expect.anything(),
    );
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/dispatch/assignments/assign-1/status'),
      { status: 'CANCELLED' },
      expect.anything(),
    );
  });

  it('tolerates a bare array response', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ id: 'a1', status: 'EN_ROUTE' }] });
    mockedAxios.patch.mockResolvedValue({ data: {} });
    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(true);
  });

  it('returns false and does not PATCH when the job has no assignment', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: [] } });
    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(false);
    expect(mockedAxios.patch).not.toHaveBeenCalled();
  });

  it('ignores already-terminal assignments', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: [{ id: 'a1', status: 'COMPLETED' }] } });
    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(false);
    expect(mockedAxios.patch).not.toHaveBeenCalled();
  });

  it('swallows a scheduling-service outage rather than failing the caller', async () => {
    // The calendar write has already committed by this point — throwing here
    // would make a completed reschedule look like a failure.
    mockedAxios.get.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(false);
  });

  it('swallows a failure on the PATCH too', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: [{ id: 'a1', status: 'ASSIGNED' }] } });
    mockedAxios.patch.mockRejectedValue(new Error('500'));
    await expect(client.cancelAssignmentForJob('co-1', 'job-1')).resolves.toBe(false);
  });
});
