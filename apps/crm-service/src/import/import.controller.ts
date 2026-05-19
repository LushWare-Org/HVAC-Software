import {
  Controller, Post, Get, Delete, Param, Body, UseGuards,
  UseInterceptors, UploadedFile, Sse, MessageEvent, Res,
  BadRequestException, HttpCode, HttpStatus, Query,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger'
import { Observable, interval } from 'rxjs'
import { map, takeWhile } from 'rxjs/operators'
import { Response } from 'express'
import { ImportService } from './import.service'
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from '@tscrm/auth-client'
import { AuthUser, Role } from '@tscrm/types'
import { type ColumnMap } from './platform-maps'
import { EQUIPMENT_TEMPLATE_CSV } from './platform-maps'

@ApiTags('import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly svc: ImportService) {}

  @Post('detect')
  @ApiOperation({ summary: 'Upload CSV and auto-detect platform + column map' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async detect(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthUser) {
    if (!file) throw new BadRequestException('No file uploaded')
    return this.svc.detect(user.companyId, file.buffer, file.originalname, user)
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate parsed rows against column map, returns counts + errors' })
  async validate(
    @Body() body: { batchId: string; columnMap: ColumnMap[] },
    @CurrentUser() user: AuthUser,
  ) {
    if (!body.batchId) throw new BadRequestException('batchId required')
    return this.svc.validate(body.batchId, user.companyId, body.columnMap ?? [])
  }

  @Post('start')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Start background import' })
  async start(
    @Body() body: { batchId: string; columnMap: ColumnMap[] },
    @CurrentUser() user: AuthUser,
  ) {
    if (!body.batchId) throw new BadRequestException('batchId required')
    return this.svc.start(body.batchId, user.companyId, body.columnMap ?? [])
  }

  @Sse('batches/:id/stream')
  @ApiOperation({ summary: 'SSE stream of import progress' })
  stream(@Param('id') id: string, @CurrentUser() user: AuthUser): Observable<MessageEvent> {
    return interval(800).pipe(
      map(() => ({
        data: { _poll: id, companyId: user.companyId },
      })),
      // We'll resolve batch in the frontend via polling the status endpoint if SSE isn't supported
      // For simplicity we use the interval + GET pattern: emit batchId and let frontend call GET /batches/:id
      takeWhile(() => true),
    ) as unknown as Observable<MessageEvent>
  }

  @Get('batches/:id/progress')
  @ApiOperation({ summary: 'Poll import batch progress' })
  getProgress(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.svc.getBatch(id, user.companyId)
  }

  @Get('batches')
  @ApiOperation({ summary: 'List import history for company' })
  list(@CurrentUser() user: AuthUser) {
    return this.svc.listBatches(user.companyId)
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get import batch details' })
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.svc.getBatch(id, user.companyId)
  }

  @Get('batches/:id/errors.csv')
  @ApiOperation({ summary: 'Download error report as CSV' })
  async downloadErrors(@Param('id') id: string, @CurrentUser() user: AuthUser, @Res() res: Response) {
    const errors = await this.svc.getErrors(id, user.companyId)
    const lines = ['Row,Entity,Error,Raw Data']
    for (const e of errors) {
      const raw = JSON.stringify(e.rawData).replace(/"/g, '""')
      lines.push(`${e.rowNumber},${e.entityType},"${e.error}","${raw}"`)
    }
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="import-errors-${id}.csv"`)
    res.send(lines.join('\n'))
  }

  @Delete('batches/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rollback import — deletes all records created in this batch' })
  rollback(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.svc.rollback(id, user.companyId)
  }

  @Get('equipment-template.csv')
  @ApiOperation({ summary: 'Download blank equipment CSV template' })
  equipmentTemplate(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="equipment-template.csv"')
    res.send(EQUIPMENT_TEMPLATE_CSV)
  }

  // ── Super-admin white-glove panel ────────────────────────────────────────

  @Get('admin/stats')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Aggregate import stats across all companies' })
  adminStats() {
    return this.svc.getAdminStats()
  }

  @Get('admin/companies')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List companies that have import history' })
  adminCompanies() {
    return this.svc.listCompanies()
  }

  @Get('admin/batches')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all import batches across all companies' })
  adminBatches(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('companyId') companyId?: string,
  ) {
    return this.svc.listAllBatches(Number(page), Number(limit), companyId)
  }

  @Delete('admin/batches/:id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super-admin rollback — no companyId restriction' })
  adminRollback(@Param('id') id: string) {
    return this.svc.adminRollback(id)
  }
}
