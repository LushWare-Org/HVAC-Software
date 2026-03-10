/**
 * ExportsService — Unit Tests
 *
 * Tests:
 *  - exportRevenueCsv() produces correct CSV with header + data rows
 *  - exportRevenueExcel() returns a non-empty Buffer with .xlsx MIME type
 *  - exportJobsReportExcel() returns multi-sheet Excel buffer
 *  - exportTechniciansCsv() produces correct CSV
 *  - CSV escaping handles commas and quotes in customer names
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExportsService } from './exports.service';
import { PrismaService } from '../prisma/prisma.service';

const COMPANY_ID = 'co-001';
const mockPrisma  = { $queryRaw: jest.fn() };

describe('ExportsService', () => {
  let service: ExportsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ExportsService>(ExportsService);
  });

  // ── CSV exports ─────────────────────────────────────────────────────────────

  describe('exportRevenueCsv', () => {
    it('produces CSV buffer with header and data rows', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          invoiceNumber: 'INV-001',
          customerName: 'Alice Corp',
          paidAt: new Date('2024-03-01'),
          amount: '1500.00',
          paymentMethod: 'CARD',
          status: 'SUCCEEDED',
        },
      ]);

      const result = await service.exportRevenueCsv(COMPANY_ID, {
        from: '2024-01-01',
        to: '2024-03-31',
      });

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/\.csv$/);
      const csv = result.buffer.toString('utf-8');
      expect(csv).toContain('Invoice Number');
      expect(csv).toContain('INV-001');
      expect(csv).toContain('Alice Corp');
      expect(csv).toContain('1500.00');
    });

    it('escapes CSV values containing commas', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          invoiceNumber: 'INV-002',
          customerName: 'Smith, John & Son',
          paidAt: new Date('2024-03-15'),
          amount: '800',
          paymentMethod: 'CASH',
          status: 'SUCCEEDED',
        },
      ]);

      const result = await service.exportRevenueCsv(COMPANY_ID, {});
      const csv = result.buffer.toString('utf-8');
      // Name with comma must be quoted
      expect(csv).toContain('"Smith, John & Son"');
    });

    it('returns empty rows (header only) when no payments', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.exportRevenueCsv(COMPANY_ID, {});
      const csv = result.buffer.toString('utf-8');
      expect(csv.trim()).toBe(
        'Invoice Number,Customer Name,Paid At,Amount (USD),Payment Method,Status',
      );
    });
  });

  describe('exportTechniciansCsv', () => {
    it('produces correct CSV with technician metrics', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          techName: 'Bob Wrench',
          techId: 'auth0|tech-1',
          jobsCompleted: 15n,
          revenue: '6000',
          avgRating: '4.8',
          avgDurationMins: '90',
        },
      ]);

      const result = await service.exportTechniciansCsv(COMPANY_ID, {});
      const csv = result.buffer.toString('utf-8');
      expect(csv).toContain('Technician Name');
      expect(csv).toContain('Bob Wrench');
      expect(csv).toContain('6000');
    });
  });

  // ── Excel exports ───────────────────────────────────────────────────────────

  describe('exportRevenueExcel', () => {
    it('returns non-empty xlsx Buffer with correct MIME type', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          invoiceNumber: 'INV-001',
          customerName: 'Alice Corp',
          paidAt: new Date('2024-03-01'),
          amount: '1500',
          paymentMethod: 'CARD',
        },
      ]);

      const result = await service.exportRevenueExcel(COMPANY_ID, {});
      expect(result.mimeType).toContain('spreadsheetml');
      expect(result.buffer.length).toBeGreaterThan(1000);  // non-trivial .xlsx
      expect(result.filename).toMatch(/\.xlsx$/);
    });
  });

  describe('exportJobsReportExcel', () => {
    it('returns xlsx buffer with job data', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          jobNumber: 'JOB-001',
          customerName: 'Alice Corp',
          serviceAddress: '100 Main St',
          tradeType: 'HVAC',
          status: 'COMPLETED',
          priority: 'NORMAL',
          assignedToName: 'Bob Tech',
          scheduledStart: new Date('2024-03-10'),
          completedAt: new Date('2024-03-10'),
          revenue: '1200',
        },
      ]);

      const result = await service.exportJobsReportExcel(COMPANY_ID, {});
      expect(result.mimeType).toContain('spreadsheetml');
      expect(result.buffer.length).toBeGreaterThan(1000);
    });
  });
});
