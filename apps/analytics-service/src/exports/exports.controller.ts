import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId } from '@tscrm/auth-client';
import { ExportsService } from './exports.service';
import { DateRangeDto } from '../dashboard/dto/dashboard.dto';

@ApiTags('Exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('revenue/csv')
  @ApiOperation({ summary: 'Export revenue payments as CSV' })
  async revenueCsv(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportRevenueCsv(companyId, dto);
    this.sendFile(res, result.buffer, result.filename, result.mimeType);
  }

  @Get('revenue/excel')
  @ApiOperation({ summary: 'Export revenue report as Excel (.xlsx)' })
  async revenueExcel(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportRevenueExcel(companyId, dto);
    this.sendFile(res, result.buffer, result.filename, result.mimeType);
  }

  @Get('jobs/excel')
  @ApiOperation({ summary: 'Export jobs report as multi-sheet Excel (.xlsx)' })
  async jobsExcel(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportJobsReportExcel(companyId, dto);
    this.sendFile(res, result.buffer, result.filename, result.mimeType);
  }

  @Get('technicians/csv')
  @ApiOperation({ summary: 'Export technician metrics as CSV' })
  async techniciansCsv(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportTechniciansCsv(companyId, dto);
    this.sendFile(res, result.buffer, result.filename, result.mimeType);
  }

  private sendFile(
    res: Response,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): void {
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }
}
