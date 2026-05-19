import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { QuickBooksService } from './quickbooks.service';
import { QuickBooksSyncService } from './quickbooks-sync.service';

@ApiTags('QuickBooks')
@Controller('quickbooks')
export class QuickBooksController {
  private readonly logger = new Logger(QuickBooksController.name);

  constructor(
    private readonly qbService: QuickBooksService,
    private readonly qbSync: QuickBooksSyncService,
  ) {}

  // ── Connection status ─────────────────────────────────────────────────────

  @Get('status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Check QuickBooks connection status for this company' })
  getStatus(@CurrentUser() user: AuthUser) {
    return this.qbService.getStatus(user.companyId);
  }

  // ── OAuth connect — redirects admin to Intuit auth page ──────────────────

  @Get('connect')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Initiate QuickBooks OAuth 2.0 flow' })
  async connect(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const authUri = this.qbService.getAuthUri(user.companyId);
    return res.redirect(authUri);
  }

  // ── Dev-mode connect — open this URL directly in a browser ───────────────
  // Only works when BYPASS_AUTH=true and NODE_ENV !== production

  @Get('dev-connect')
  @ApiOperation({ summary: '[DEV ONLY] Open in browser to start OAuth — no auth header needed' })
  async devConnect(
    @Query('companyId') companyId: string,
    @Res() res: Response,
  ) {
    if (process.env.BYPASS_AUTH !== 'true' || process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }
    const id = companyId || 'co-demo-001';
    const authUri = this.qbService.getAuthUri(id);
    return res.redirect(authUri);
  }

  // ── OAuth callback — Intuit redirects here after auth ────────────────────

  @Get('callback')
  @ApiOperation({ summary: 'OAuth 2.0 callback from Intuit (do not call directly)' })
  async callback(
    @Query('code') code: string,
    @Query('realmId') realmId: string,
    @Query('state') companyId: string,
    @Res() res: Response,
  ) {
    if (!code || !realmId || !companyId) {
      throw new BadRequestException('Missing required OAuth parameters');
    }

    try {
      await this.qbService.exchangeCode(code, realmId, companyId);
    } catch (err) {
      this.logger.error(`QB OAuth callback failed: ${(err as Error).message}`);
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/settings/integrations?qb=error`);
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/settings/integrations?qb=connected`);
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  @Post('disconnect')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Disconnect QuickBooks account' })
  async disconnect(@CurrentUser() user: AuthUser) {
    await this.qbService.disconnect(user.companyId);
    return { success: true, message: 'QuickBooks disconnected' };
  }

  // ── Manual re-sync ────────────────────────────────────────────────────────

  @Post('sync/invoice/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Manually push an invoice to QuickBooks' })
  async syncInvoice(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.qbSync.syncInvoice(id, user.companyId);
    return { success: true };
  }

  @Post('sync/payment/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Manually push a payment to QuickBooks' })
  async syncPayment(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.qbSync.syncPayment(id, user.companyId);
    return { success: true };
  }
}
