const createMock = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: createMock } },
  }));
});

import { EquipmentScanService } from './equipment-scan.service';

function makePrisma() {
  return {
    equipment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
}

const TEST_IMAGE = { buffer: Buffer.from('fake-jpeg-bytes'), mimetype: 'image/jpeg' };

describe('EquipmentScanService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: EquipmentScanService;

  const ORIGINAL_KEY = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    prisma = makePrisma();
    service = new EquipmentScanService(prisma as any);
    createMock.mockReset();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = ORIGINAL_KEY;
  });

  it('marks FAILED (never throws, never crashes the process) when OPENAI_API_KEY is not configured', async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(service.scanAndStore('co-1', 'eq-1', TEST_IMAGE)).resolves.toBeUndefined();

    expect(createMock).not.toHaveBeenCalled();
    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: { imageScanStatus: 'FAILED', imageScanError: expect.stringContaining('OPENAI_API_KEY') },
    });
  });

  it('sends the image as a base64 data URL, not a plain URL (OpenAI cannot reach localhost:9000)', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: '{}' } }] });

    await service.scanAndStore('co-1', 'eq-1', TEST_IMAGE);

    const call = createMock.mock.calls[0][0];
    const imagePart = call.messages[0].content.find((c: any) => c.type === 'image_url');
    expect(imagePart.image_url.url).toBe(`data:image/jpeg;base64,${TEST_IMAGE.buffer.toString('base64')}`);
  });

  it('parses a successful scan and stores DONE with the result', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        brand: 'Carrier', model: '58STA', serialNo: '1234ABC',
        errorCodes: [{ code: 'E4', meaning: 'Igniter failure' }],
      }) } }],
    });

    await service.scanAndStore('co-1', 'eq-1', TEST_IMAGE);

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: {
        imageScanStatus: 'DONE',
        imageScanResult: {
          brand: 'Carrier', model: '58STA', serialNo: '1234ABC',
          errorCodes: [{ code: 'E4', meaning: 'Igniter failure' }],
        },
        imageScanError: null,
      },
    });
  });

  it('defaults missing fields to null/empty when the model omits them', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: '{}' } }] });

    await service.scanAndStore('co-1', 'eq-1', TEST_IMAGE);

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: {
        imageScanStatus: 'DONE',
        imageScanResult: { brand: null, model: null, serialNo: null, errorCodes: [] },
        imageScanError: null,
      },
    });
  });

  it('marks FAILED and never throws when the OpenAI call rejects', async () => {
    createMock.mockRejectedValue(new Error('rate limited'));

    await expect(service.scanAndStore('co-1', 'eq-1', TEST_IMAGE)).resolves.toBeUndefined();

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: { imageScanStatus: 'FAILED', imageScanError: 'rate limited' },
    });
  });

  it('marks FAILED when the response content is not valid JSON', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: 'not json' } }] });

    await service.scanAndStore('co-1', 'eq-1', TEST_IMAGE);

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: expect.objectContaining({ imageScanStatus: 'FAILED' }),
    });
  });
});
