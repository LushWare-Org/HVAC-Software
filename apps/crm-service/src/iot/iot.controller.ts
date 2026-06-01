import {
  Controller, Get, Delete, Post,
  Param, Query, Res, HttpCode, HttpStatus,
  NotFoundException, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import type { AuthUser } from '@tscrm/types';
import { IotService } from './iot.service';
import { IotAlertsService } from './iot-alerts.service';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const CUSTOMER_PORTAL_URL = process.env.CUSTOMER_PORTAL_URL ?? 'http://localhost:5174';

@ApiTags('IoT Devices')
@Controller('iot')
export class IotController {
  constructor(
    private readonly iot: IotService,
    private readonly alerts: IotAlertsService,
  ) {}

  // ── Honeywell OAuth (admin) ──────────────────────────────────────────────────

  @Get('honeywell/connect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Admin: start Honeywell OAuth for a customer' })
  connectHoneywell(
    @Query('customerId') customerId: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    if (!customerId) throw new NotFoundException('customerId required');
    return res.redirect(this.iot.buildHoneywellAuthUrl(user.companyId, customerId, 'admin'));
  }

  @Get('honeywell/callback')
  @ApiOperation({ summary: 'Honeywell OAuth callback — no auth guard' })
  async honeywellCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const { customerId, source } = await this.iot.handleHoneywellCallback(code, state);
      if (source === 'portal') return res.redirect(`${CUSTOMER_PORTAL_URL}/devices?connected=honeywell`);
      return res.redirect(`${FRONTEND_URL}/customers?iot_connected=${customerId}`);
    } catch {
      return res.redirect(`${FRONTEND_URL}/customers?iot_error=honeywell`);
    }
  }

  // ── Honeywell OAuth (customer portal) ────────────────────────────────────────

  @Get('honeywell/connect-portal')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Customer: start Honeywell OAuth from portal' })
  connectHoneywellPortal(@CurrentUser() user: AuthUser, @Res() res: Response) {
    if (!user.customerId) throw new NotFoundException('Not a customer account');
    return res.redirect(this.iot.buildHoneywellAuthUrl(user.companyId, user.customerId, 'portal'));
  }

  // ── Google Nest OAuth (admin) ────────────────────────────────────────────────

  @Get('nest/connect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Admin: start Google Nest OAuth for a customer' })
  connectNest(
    @Query('customerId') customerId: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    if (!customerId) throw new NotFoundException('customerId required');
    return res.redirect(this.iot.buildNestAuthUrl(user.companyId, customerId, 'admin'));
  }

  @Get('nest/callback')
  @ApiOperation({ summary: 'Google Nest OAuth callback — no auth guard' })
  async nestCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const { customerId, source } = await this.iot.handleNestCallback(code, state);
      if (source === 'portal') return res.redirect(`${CUSTOMER_PORTAL_URL}/devices?connected=nest`);
      return res.redirect(`${FRONTEND_URL}/customers?iot_connected=${customerId}`);
    } catch {
      return res.redirect(`${FRONTEND_URL}/customers?iot_error=nest`);
    }
  }

  // ── Google Nest OAuth (customer portal) ──────────────────────────────────────

  @Get('nest/connect-portal')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Customer: start Google Nest OAuth from portal' })
  connectNestPortal(@CurrentUser() user: AuthUser, @Res() res: Response) {
    if (!user.customerId) throw new NotFoundException('Not a customer account');
    return res.redirect(this.iot.buildNestAuthUrl(user.companyId, user.customerId, 'portal'));
  }

  // ── Device data ──────────────────────────────────────────────────────────────

  @Get('customers/:customerId/devices')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Admin: get all connected IoT devices with latest snapshot' })
  async getDevices(
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const isMock = process.env.BYPASS_AUTH === 'true';
    return isMock
      ? this.iot.getCachedDevices(user.companyId, customerId)
      : this.iot.getCustomerDevices(user.companyId, customerId);
  }

  @Get('devices/:deviceId/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get time-series history for a single IoT device (default 24h)' })
  async getDeviceHistory(
    @Param('deviceId') deviceId: string,
    @Query('hours') hours: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    const h = Math.min(Math.max(parseInt(hours ?? '24', 10) || 24, 1), 168);
    return this.iot.getDeviceHistory(user.companyId, deviceId, h);
  }

  @Get('my-devices')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Customer: get own IoT devices' })
  async getMyDevices(@CurrentUser() user: AuthUser) {
    if (!user.customerId) throw new NotFoundException('Not a customer account');
    const isMock = process.env.BYPASS_AUTH === 'true';
    return isMock
      ? this.iot.getCachedDevices(user.companyId, user.customerId)
      : this.iot.getCustomerDevices(user.companyId, user.customerId);
  }

  // ── Disconnect ───────────────────────────────────────────────────────────────

  @Delete('customers/:customerId/connections/:provider')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: disconnect an IoT provider for a customer' })
  async disconnect(
    @Param('customerId') customerId: string,
    @Param('provider') provider: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.iot.disconnect(user.companyId, customerId, provider);
  }

  @Delete('my-connections/:provider')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Customer: disconnect own IoT provider' })
  async disconnectMy(@Param('provider') provider: string, @CurrentUser() user: AuthUser) {
    if (!user.customerId) throw new NotFoundException('Not a customer account');
    await this.iot.disconnect(user.companyId, user.customerId, provider);
  }

  // ── Admin: send customer a connect link email ─────────────────────────────────

  @Post('customers/:customerId/connect-link')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Admin: email customer a Honeywell + Nest connect link' })
  async sendConnectLink(
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.iot.sendConnectLink(user.companyId, customerId);
  }

  // ── Dev seed ─────────────────────────────────────────────────────────────────

  @Post('dev-seed/:customerId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[DEV ONLY] Seed mock Honeywell + Nest data for a customer' })
  async devSeed(
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (process.env.BYPASS_AUTH !== 'true') {
      throw new NotFoundException();
    }
    await this.iot.devSeed(user.companyId, customerId);
    return { seeded: true };
  }

  @Post('dev-trigger-alerts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[DEV ONLY] Run the IoT alerts cron immediately (no 15-min wait)' })
  async devTriggerAlerts() {
    if (process.env.BYPASS_AUTH !== 'true') {
      throw new NotFoundException();
    }
    await this.alerts.checkAlerts();
    return { triggered: true };
  }
}
