import axios from 'axios'
import { JobsClient } from './jobs.client'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const baseInput = {
  companyId: 'co-1',
  customerId: 'cust-1',
  customerName: 'Alice',
  customerEmail: 'a@b.com',
  customerPhone: '555-1212',
  serviceAddress: '1 Main St',
  title: 'Test',
  description: 'desc',
  priority: 'EMERGENCY' as const,
  internalNotes: 'note',
  tags: ['iot-alert'],
}

describe('JobsClient', () => {
  let client: JobsClient
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...ORIGINAL_ENV }
    client = new JobsClient()
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('sends dev-bypass headers when BYPASS_AUTH=true', async () => {
    process.env.BYPASS_AUTH = 'true'
    mockedAxios.post.mockResolvedValue({ data: { id: 'job-123' } })

    const res = await client.createJob(baseInput)

    expect(res).toEqual({ id: 'job-123' })
    const headers = mockedAxios.post.mock.calls[0][2]?.headers as Record<string, string>
    expect(headers['x-test-company-id']).toBe('co-1')
    expect(headers['x-test-user-role']).toBe('super_admin')
    expect(headers.Authorization).toBeUndefined()
  })

  it('sends SERVICE_JWT bearer header when BYPASS_AUTH is not true', async () => {
    process.env.BYPASS_AUTH = 'false'
    process.env.SERVICE_JWT = 'tok-xyz'
    mockedAxios.post.mockResolvedValue({ data: { id: 'job-456' } })

    await client.createJob(baseInput)

    const headers = mockedAxios.post.mock.calls[0][2]?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok-xyz')
    expect(headers['x-test-company-id']).toBeUndefined()
  })

  it('returns null and does not throw on HTTP failure', async () => {
    mockedAxios.post.mockRejectedValue(Object.assign(new Error('boom'), { response: { status: 500 } }))

    const res = await client.createJob(baseInput)

    expect(res).toBeNull()
  })

  it('forwards the priority and tags to job-service', async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: 'job-1' } })

    await client.createJob({ ...baseInput, priority: 'HIGH', tags: ['iot-alert', 'iot:underperforming'] })

    const body = mockedAxios.post.mock.calls[0][1] as any
    expect(body.priority).toBe('HIGH')
    expect(body.tags).toEqual(['iot-alert', 'iot:underperforming'])
  })
})
