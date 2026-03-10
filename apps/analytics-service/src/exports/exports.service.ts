/**
 * ExportsService
 *
 * Generates downloadable reports:
 *  - exportRevenueCsv()       — revenue payments as CSV stream
 *  - exportRevenueExcel()     — revenue + charts as .xlsx (ExcelJS)
 *  - exportJobsReportExcel()  — jobs report with multi-sheet workbook
 *  - exportTechniciansCsv()   — technician metrics as CSV
 *
 * All exports are returned as Buffer so the controller can stream them
 * with the correct Content-Disposition headers.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeDto } from '../dashboard/dto/dashboard.dto';
import { Prisma } from '../prisma/generated';

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Revenue CSV ─────────────────────────────────────────────────────────────

  async exportRevenueCsv(companyId: string, dto: DateRangeDto): Promise<ExportResult> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        invoiceNumber: string;
        customerName: string;
        paidAt: Date;
        amount: string;
        paymentMethod: string;
        status: string;
      }[]
    >(
      Prisma.sql`
        SELECT
          i."invoiceNumber",
          i."customerName",
          p."paidAt",
          p.amount::TEXT,
          p."paymentMethod"::TEXT,
          p.status::TEXT
        FROM   finance.payments p
        JOIN   finance.invoices i ON i.id = p."invoiceId"
        WHERE  i."companyId" = ${companyId}
          AND  p."paidAt" BETWEEN ${from} AND ${to}
        ORDER  BY p."paidAt" DESC
      `,
    );

    const header = 'Invoice Number,Customer Name,Paid At,Amount (USD),Payment Method,Status\n';
    const csvRows = rows
      .map(
        (r) =>
          `${r.invoiceNumber},${this.escapeCsv(r.customerName)},${r.paidAt?.toISOString() ?? ''},${r.amount},${r.paymentMethod},${r.status}`,
      )
      .join('\n');

    const csv = header + csvRows;
    const filename = `revenue_${this.dateSlug(from, to)}.csv`;

    return {
      buffer: Buffer.from(csv, 'utf-8'),
      filename,
      mimeType: 'text/csv',
    };
  }

  // ── Revenue Excel ────────────────────────────────────────────────────────────

  async exportRevenueExcel(companyId: string, dto: DateRangeDto): Promise<ExportResult> {
    const { from, to } = this.normaliseDateRange(dto);

    const payments = await this.prisma.$queryRaw<
      {
        invoiceNumber: string;
        customerName: string;
        paidAt: Date;
        amount: string;
        paymentMethod: string;
      }[]
    >(
      Prisma.sql`
        SELECT
          i."invoiceNumber",
          i."customerName",
          p."paidAt",
          p.amount::TEXT,
          p."paymentMethod"::TEXT
        FROM   finance.payments p
        JOIN   finance.invoices i ON i.id = p."invoiceId"
        WHERE  i."companyId" = ${companyId}
          AND  p.status = 'SUCCEEDED'
          AND  p."paidAt" BETWEEN ${from} AND ${to}
        ORDER  BY p."paidAt" DESC
      `,
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'T&S CRM Analytics';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Revenue', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // Define columns
    sheet.columns = [
      { header: 'Invoice #', key: 'invoiceNumber', width: 18 },
      { header: 'Customer', key: 'customerName', width: 28 },
      { header: 'Paid At', key: 'paidAt', width: 22, style: { numFmt: 'dd-mmm-yyyy' } },
      { header: 'Amount (USD)', key: 'amount', width: 16, style: { numFmt: '#,##0.00' } },
      { header: 'Method', key: 'paymentMethod', width: 14 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    headerRow.alignment = { vertical: 'middle' };

    // Add data rows
    payments.forEach((p) => {
      sheet.addRow({
        invoiceNumber: p.invoiceNumber,
        customerName: p.customerName,
        paidAt: p.paidAt ? new Date(p.paidAt) : null,
        amount: parseFloat(p.amount),
        paymentMethod: p.paymentMethod,
      });
    });

    // Totals row
    const lastDataRow = sheet.rowCount;
    const totalRow = sheet.addRow({
      invoiceNumber: 'TOTAL',
      customerName: '',
      paidAt: null,
      amount: { formula: `SUM(D2:D${lastDataRow})` } as any,
      paymentMethod: '',
    });
    totalRow.font = { bold: true };
    totalRow.getCell('D').numFmt = '#,##0.00';

    // Auto-border all data cells
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    const filename = `revenue_${this.dateSlug(from, to)}.xlsx`;

    return { buffer, filename, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  }

  // ── Jobs Report Excel (multi-sheet) ─────────────────────────────────────────

  async exportJobsReportExcel(companyId: string, dto: DateRangeDto): Promise<ExportResult> {
    const { from, to } = this.normaliseDateRange(dto);

    const jobs = await this.prisma.$queryRaw<
      {
        jobNumber: string;
        customerName: string;
        serviceAddress: string;
        tradeType: string;
        status: string;
        priority: string;
        assignedToName: string | null;
        scheduledStart: Date | null;
        completedAt: Date | null;
        revenue: string;
      }[]
    >(
      Prisma.sql`
        SELECT
          j."jobNumber",
          j."customerName",
          j."serviceAddress",
          COALESCE(jt.name, 'General')  AS "tradeType",
          j.status::TEXT,
          j.priority::TEXT,
          j."assignedToName",
          j."scheduledStart",
          j."completedAt",
          COALESCE(SUM(p.amount), 0)::TEXT AS revenue
        FROM   jobs.jobs j
        LEFT   JOIN jobs.job_types jt  ON jt.id = j."jobTypeId"
        LEFT   JOIN finance.invoices i ON i."jobId" = j.id AND i.status = 'PAID'
        LEFT   JOIN finance.payments p ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        WHERE  j."companyId" = ${companyId}
          AND  j."createdAt" BETWEEN ${from} AND ${to}
        GROUP  BY j.id, j."jobNumber", j."customerName", j."serviceAddress",
                  jt.name, j.status, j.priority, j."assignedToName",
                  j."scheduledStart", j."completedAt"
        ORDER  BY j."createdAt" DESC
      `,
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'T&S CRM Analytics';

    // Sheet 1: All Jobs
    const jobsSheet = workbook.addWorksheet('All Jobs', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    jobsSheet.columns = [
      { header: 'Job #', key: 'jobNumber', width: 16 },
      { header: 'Customer', key: 'customerName', width: 28 },
      { header: 'Address', key: 'serviceAddress', width: 32 },
      { header: 'Trade', key: 'tradeType', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Technician', key: 'assignedToName', width: 22 },
      { header: 'Scheduled', key: 'scheduledStart', width: 20, style: { numFmt: 'dd-mmm-yyyy' } },
      { header: 'Completed', key: 'completedAt', width: 20, style: { numFmt: 'dd-mmm-yyyy' } },
      { header: 'Revenue (USD)', key: 'revenue', width: 16, style: { numFmt: '#,##0.00' } },
    ];

    this.styleHeaderRow(jobsSheet);

    jobs.forEach((j) => {
      jobsSheet.addRow({
        ...j,
        scheduledStart: j.scheduledStart ? new Date(j.scheduledStart) : null,
        completedAt: j.completedAt ? new Date(j.completedAt) : null,
        revenue: parseFloat(j.revenue),
      });
    });

    // Sheet 2: Summary by Trade
    const tradeSheet = workbook.addWorksheet('By Trade');
    const tradeCounts: Record<string, { count: number; revenue: number }> = {};
    jobs.forEach((j) => {
      if (!tradeCounts[j.tradeType]) tradeCounts[j.tradeType] = { count: 0, revenue: 0 };
      tradeCounts[j.tradeType].count++;
      tradeCounts[j.tradeType].revenue += parseFloat(j.revenue);
    });

    tradeSheet.columns = [
      { header: 'Trade Type', key: 'trade', width: 20 },
      { header: 'Job Count', key: 'count', width: 12 },
      { header: 'Revenue (USD)', key: 'revenue', width: 16, style: { numFmt: '#,##0.00' } },
    ];
    this.styleHeaderRow(tradeSheet);
    Object.entries(tradeCounts).forEach(([trade, data]) => {
      tradeSheet.addRow({ trade, ...data });
    });

    const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    return {
      buffer,
      filename: `jobs_report_${this.dateSlug(from, to)}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  // ── Technicians CSV ──────────────────────────────────────────────────────────

  async exportTechniciansCsv(companyId: string, dto: DateRangeDto): Promise<ExportResult> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        techName: string;
        techId: string;
        jobsCompleted: bigint;
        revenue: string;
        avgRating: string | null;
        avgDurationMins: string | null;
      }[]
    >(
      Prisma.sql`
        SELECT
          j."assignedToName"                                                AS "techName",
          j."assignedToId"                                                  AS "techId",
          COUNT(j.id)::BIGINT                                               AS "jobsCompleted",
          COALESCE(SUM(p.amount), 0)::TEXT                                  AS revenue,
          ROUND(AVG(r.rating)::NUMERIC, 1)::TEXT                           AS "avgRating",
          ROUND(AVG(
            EXTRACT(EPOCH FROM (j."actualEnd" - j."actualStart")) / 60.0
          )::NUMERIC, 0)::TEXT                                              AS "avgDurationMins"
        FROM   jobs.jobs j
        LEFT   JOIN finance.invoices i ON i."jobId" = j.id
        LEFT   JOIN finance.payments p ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        LEFT   JOIN crm.reviews      r ON r."jobId" = j.id
        WHERE  j."companyId" = ${companyId}
          AND  j."assignedToId" IS NOT NULL
          AND  j.status IN ('COMPLETED','INVOICED','PAID')
          AND  j."completedAt" BETWEEN ${from} AND ${to}
        GROUP  BY j."assignedToId", j."assignedToName"
        ORDER  BY SUM(COALESCE(p.amount,0)) DESC
      `,
    );

    const header = 'Technician Name,Technician ID,Jobs Completed,Revenue (USD),Avg Rating,Avg Duration (min)\n';
    const csvRows = rows
      .map(
        (r) =>
          `${this.escapeCsv(r.techName)},${r.techId},${Number(r.jobsCompleted)},${r.revenue},${r.avgRating ?? '0'},${r.avgDurationMins ?? '0'}`,
      )
      .join('\n');

    return {
      buffer: Buffer.from(header + csvRows, 'utf-8'),
      filename: `technicians_${this.dateSlug(from, to)}.csv`,
      mimeType: 'text/csv',
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private styleHeaderRow(sheet: ExcelJS.Worksheet): void {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    headerRow.alignment = { vertical: 'middle' };
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private dateSlug(from: Date, to: Date): string {
    return `${from.toISOString().slice(0, 10)}_to_${to.toISOString().slice(0, 10)}`;
  }

  private normaliseDateRange(dto: DateRangeDto): { from: Date; to: Date } {
    const now = new Date();
    return {
      from: dto.from ? new Date(dto.from) : new Date(now.getTime() - 30 * 86_400_000),
      to: dto.to ? new Date(dto.to) : now,
    };
  }
}
