import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentTemplatesService } from './document-templates.service';

const CO = 'co-1';

function makePrisma() {
  return {
    documentTemplate: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
  };
}

function makeStorage() {
  return { putPublicObject: jest.fn().mockResolvedValue('https://cdn.example.com/documents/co-1/letterhead-abc.png') };
}

describe('DocumentTemplatesService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: DocumentTemplatesService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new DocumentTemplatesService(prisma as any, makeStorage() as any);
  });

  describe('create', () => {
    it('requires a name', async () => {
      await expect(
        service.create(CO, { documentType: 'INVOICE', name: '  ', mode: 'BUILDER' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid documentType', async () => {
      await expect(
        service.create(CO, { documentType: 'BOGUS', name: 'X', mode: 'BUILDER' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('the first template for a type is made default automatically', async () => {
      prisma.documentTemplate.count.mockResolvedValue(0);
      prisma.documentTemplate.create.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      await service.create(CO, { documentType: 'INVOICE', name: 'Formal', mode: 'BUILDER' });
      expect(prisma.documentTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) }),
      );
    });

    it('persists a companyName/companyAddress override for Builder mode', async () => {
      prisma.documentTemplate.count.mockResolvedValue(0);
      prisma.documentTemplate.create.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      await service.create(CO, {
        documentType: 'INVOICE', name: 'Formal', mode: 'BUILDER',
        companyName: 'Orrix Engineering (Pvt) Ltd', companyAddress: '12 Galle Rd, Colombo',
      });
      expect(prisma.documentTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyName: 'Orrix Engineering (Pvt) Ltd', companyAddress: '12 Galle Rd, Colombo',
          }),
        }),
      );
    });

    it('persists a custom rows/blocks layout', async () => {
      prisma.documentTemplate.count.mockResolvedValue(0);
      prisma.documentTemplate.create.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      const rows = [{ id: 'r1', blocks: [{ id: 'b1', slot: 'invoice/logo', widthPct: 40 }, { id: 'b2', slot: 'invoice/companyName', widthPct: 60 }] }];
      await service.create(CO, { documentType: 'INVOICE', name: 'Formal', mode: 'BUILDER', rows });
      expect(prisma.documentTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ rows }) }),
      );
    });

    it('update persists a changed rows layout', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't1', companyId: CO });
      prisma.documentTemplate.update.mockResolvedValue({ id: 't1' });
      const rows = [{ id: 'r1', blocks: [{ id: 'b1', slot: 'invoice/billTo', widthPct: 100, style: { color: '#ff0000' } }] }];
      await service.update(CO, 't1', { rows });
      expect(prisma.documentTemplate.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { rows } });
    });

    it('subsequent templates default to non-default', async () => {
      prisma.documentTemplate.count.mockResolvedValue(1);
      prisma.documentTemplate.create.mockResolvedValue({ id: 't2', companyId: CO, documentType: 'INVOICE', isDefault: false });
      await service.create(CO, { documentType: 'INVOICE', name: 'Friendly', mode: 'BUILDER' });
      expect(prisma.documentTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isDefault: false }) }),
      );
    });
  });

  describe('setDefault', () => {
    it('404s for a template outside the company', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue(null);
      await expect(service.setDefault(CO, 't1')).rejects.toThrow(NotFoundException);
    });

    it('clears the previous default and sets the new one, scoped to the same documentType', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't2', companyId: CO, documentType: 'INVOICE' });
      await service.setDefault(CO, 't2');
      expect(prisma.documentTemplate.updateMany).toHaveBeenCalledWith({
        where: { companyId: CO, documentType: 'INVOICE', isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.documentTemplate.update).toHaveBeenCalledWith({
        where: { id: 't2' },
        data: { isDefault: true },
      });
    });
  });

  describe('remove', () => {
    it('404s for a template outside the company', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue(null);
      await expect(service.remove(CO, 't1')).rejects.toThrow(NotFoundException);
    });

    it('rejects deleting the last template of a type', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      prisma.documentTemplate.count.mockResolvedValue(1);
      await expect(service.remove(CO, 't1')).rejects.toThrow(BadRequestException);
    });

    it('when deleting the default with others remaining, promotes another to default', async () => {
      prisma.documentTemplate.count.mockResolvedValue(2);
      (prisma.documentTemplate.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true })
        .mockResolvedValueOnce({ id: 't2', companyId: CO, documentType: 'INVOICE' });
      await service.remove(CO, 't1');
      expect(prisma.documentTemplate.update).toHaveBeenCalledWith({ where: { id: 't2' }, data: { isDefault: true } });
      expect(prisma.documentTemplate.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });
  });

  describe('resolve', () => {
    it('returns the named template when templateId is given and found', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE' });
      const result = await service.resolve(CO, 'INVOICE', 't1');
      expect(result?.id).toBe('t1');
    });

    it('falls back to the default template when templateId is omitted', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 'default-1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      const result = await service.resolve(CO, 'INVOICE', undefined);
      expect(prisma.documentTemplate.findFirst).toHaveBeenCalledWith({
        where: { companyId: CO, documentType: 'INVOICE', isDefault: true },
      });
      expect(result?.id).toBe('default-1');
    });

    it('returns null when nothing resolves (no template created yet — caller falls back to hardcoded look)', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue(null);
      const result = await service.resolve(CO, 'INVOICE', undefined);
      expect(result).toBeNull();
    });
  });

  describe('uploadLetterhead', () => {
    let storage: ReturnType<typeof makeStorage>;

    beforeEach(() => {
      prisma = makePrisma();
      storage = makeStorage();
      service = new DocumentTemplatesService(prisma as any, storage as any);
    });

    it('uploads a PNG directly without conversion', async () => {
      const result = await service.uploadLetterhead(CO, {
        buffer: Buffer.from('fake-png'), mimetype: 'image/png', size: 1000,
      });
      expect(storage.putPublicObject).toHaveBeenCalledWith(
        expect.stringContaining('documents/co-1/'),
        expect.any(Buffer),
        'image/png',
      );
      expect(result.url).toBe('https://cdn.example.com/documents/co-1/letterhead-abc.png');
    });

    it('rejects an unsupported mimetype', async () => {
      await expect(
        service.uploadLetterhead(CO, { buffer: Buffer.from('x'), mimetype: 'text/plain', size: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a file over the size limit', async () => {
      await expect(
        service.uploadLetterhead(CO, { buffer: Buffer.from('x'), mimetype: 'image/png', size: 11 * 1024 * 1024 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadLogo', () => {
    let storage: ReturnType<typeof makeStorage>;

    beforeEach(() => {
      prisma = makePrisma();
      storage = makeStorage();
      service = new DocumentTemplatesService(prisma as any, storage as any);
    });

    it('uploads a PNG logo and returns its public URL', async () => {
      const result = await service.uploadLogo(CO, {
        buffer: Buffer.from('fake-png'), mimetype: 'image/png', size: 1000,
      });
      expect(storage.putPublicObject).toHaveBeenCalledWith(
        expect.stringContaining('documents/co-1/logo-'),
        expect.any(Buffer),
        'image/png',
      );
      expect(result.url).toBe('https://cdn.example.com/documents/co-1/letterhead-abc.png');
    });

    it('rejects a PDF — logos are images only, no PDF conversion', async () => {
      await expect(
        service.uploadLogo(CO, { buffer: Buffer.from('x'), mimetype: 'application/pdf', size: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an unsupported mimetype', async () => {
      await expect(
        service.uploadLogo(CO, { buffer: Buffer.from('x'), mimetype: 'text/plain', size: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a file over the size limit', async () => {
      await expect(
        service.uploadLogo(CO, { buffer: Buffer.from('x'), mimetype: 'image/png', size: 11 * 1024 * 1024 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
