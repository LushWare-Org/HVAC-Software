import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, CurrencySettings, Role } from '@tscrm/types';
import { CompanyService } from './company.service';
import { CreateTaxRatePresetDto, UpdateTaxRatePresetDto } from './dto/tax-rate-preset.dto';
import { CreatePaymentTermsPresetDto, UpdatePaymentTermsPresetDto } from './dto/payment-terms-preset.dto';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get tenant settings (currency, timezone, features, branding)' })
  getSettings(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.companyService.getSettings(user.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get current company details' })
  findOne(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.companyService.findOne(user.companyId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update company details' })
  update(
    @CurrentUser() user: AuthUser,
    @Body() body: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      website?: string;
      logoUrl?: string;
      automaticFollowupEnabled?: boolean;
    },
  ): Promise<unknown> {
    return this.companyService.update(user.companyId, body);
  }

  // ── Currencies ─────────────────────────────────────────────────────────

  @Get('currencies')
  @ApiOperation({ summary: "Get the tenant's enabled currency list and default" })
  getCurrencies(@CurrentUser() user: AuthUser) {
    return this.companyService.getCurrencies(user.companyId);
  }

  @Patch('currencies')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: "Update the tenant's enabled currency list and default" })
  updateCurrencies(@CurrentUser() user: AuthUser, @Body() body: CurrencySettings) {
    return this.companyService.updateCurrencies(user.companyId, body);
  }

  // ── Tax rate presets ──────────────────────────────────────────────────

  @Get('tax-rates')
  @ApiOperation({ summary: "List the tenant's tax rate presets" })
  listTaxRates(@CurrentUser() user: AuthUser) {
    return this.companyService.listTaxRates(user.companyId);
  }

  @Post('tax-rates')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a tax rate preset' })
  createTaxRate(@CurrentUser() user: AuthUser, @Body() body: CreateTaxRatePresetDto) {
    return this.companyService.createTaxRate(user.companyId, body);
  }

  @Patch('tax-rates/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update a tax rate preset' })
  updateTaxRate(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateTaxRatePresetDto) {
    return this.companyService.updateTaxRate(user.companyId, id, body);
  }

  @Delete('tax-rates/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete a tax rate preset' })
  deleteTaxRate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.companyService.deleteTaxRate(user.companyId, id);
  }

  // ── Payment terms presets ────────────────────────────────────────────

  @Get('payment-terms')
  @ApiOperation({ summary: "List the tenant's payment terms presets" })
  listPaymentTerms(@CurrentUser() user: AuthUser) {
    return this.companyService.listPaymentTerms(user.companyId);
  }

  @Post('payment-terms')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a payment terms preset' })
  createPaymentTerms(@CurrentUser() user: AuthUser, @Body() body: CreatePaymentTermsPresetDto) {
    return this.companyService.createPaymentTerms(user.companyId, body);
  }

  @Patch('payment-terms/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update a payment terms preset' })
  updatePaymentTerms(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdatePaymentTermsPresetDto) {
    return this.companyService.updatePaymentTerms(user.companyId, id, body);
  }

  @Delete('payment-terms/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete a payment terms preset' })
  deletePaymentTerms(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.companyService.deletePaymentTerms(user.companyId, id);
  }
}
