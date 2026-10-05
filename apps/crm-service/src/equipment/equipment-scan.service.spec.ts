import type { AiGateway } from '@tscrm/ai';
import { EquipmentScanService } from './equipment-scan.service';

function makePrisma() {
  return {
    equipment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
}

const TEST_IMAGE = { buffer: Buffer.from('fake-jpeg-bytes'), mimetype: 'image/jpeg' };
const answer = (data: unknown) => ({ data, provider: 'openai', model: 'gpt-4o', attempts: 1, latencyMs: 5 });

describe('EquipmentScanService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let generateJson: jest.Mock;
  let service: EquipmentScanService;
  const ORIGINAL = { openai: process.env.OPENAI_API_KEY, gemini: process.env.GEMINI_API_KEY };

  beforeEach(() => {
    prisma = makePrisma();
    generateJson = jest.fn();
    service = new EquipmentScanService(prisma as any, { generateJson } as unknown as AiGateway);
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = ORIGINAL.openai;
    process.env.GEMINI_API_KEY = ORIGINAL.gemini;
  });

  it('marks FAILED (never throws, never crashes the process) when no AI key is configured', async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(service.scanAndStore('co-1', 'eq-1', TEST_IMAGE)).resolves.toBeUndefined();

    expect(generateJson).not.toHaveBeenCalled();
    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: { imageScanStatus: 'FAILED', imageScanError: expect.stringContaining('OPENAI_API_KEY') },
    });
  });

  it('sends the photo inline as base64, OpenAI vision first and Gemini as the backup', async () => {
    generateJson.mockResolvedValue(answer({}));

    await service.scanAndStore('co-1', 'eq-1', TEST_IMAGE);

    const req = generateJson.mock.calls[0][0];
    expect(req).toMatchObject({
      task: 'equipment-scan',
      companyId: 'co-1',
      images: [{ mimeType: 'image/jpeg', base64: TEST_IMAGE.buffer.toString('base64') }],
    });
    expect(req.routes.map((r: { provider: string }) => r.provider)).toEqual(['openai', 'gemini']);
  });

  it('parses a successful scan and stores DONE with the result', async () => {
    generateJson.mockResolvedValue(answer({
      brand: 'Carrier', model: '58STA', serialNo: '1234ABC',
      errorCodes: [{ code: 'E4', meaning: 'Igniter failure' }, { code: 7 }],
    }));

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
    generateJson.mockResolvedValue(answer({}));

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

  it('marks FAILED with a readable reason when every model failed', async () => {
    generateJson.mockResolvedValue(null);

    await expect(service.scanAndStore('co-1', 'eq-1', TEST_IMAGE)).resolves.toBeUndefined();

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: { imageScanStatus: 'FAILED', imageScanError: expect.stringContaining('No AI model could read the photo') },
    });
  });

  it('marks FAILED and never throws when the gateway itself throws', async () => {
    generateJson.mockRejectedValue(new Error('unexpected'));

    await expect(service.scanAndStore('co-1', 'eq-1', TEST_IMAGE)).resolves.toBeUndefined();

    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'eq-1', companyId: 'co-1' },
      data: { imageScanStatus: 'FAILED', imageScanError: 'unexpected' },
    });
  });
});
