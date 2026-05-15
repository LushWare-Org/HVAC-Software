import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { ComplianceService } from './compliance.service';

@ApiTags('marketing-compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('m/compliance')
export class ComplianceController {
  constructor(private readonly svc: ComplianceService) {}

  @Delete('customers/:customerId')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'CCPA right-to-delete: erase all marketing data for a customer' })
  deleteCustomerData(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
  ) {
    return this.svc.deleteCustomerData(user.companyId, customerId, user.userId);
  }

  @Get('deletion-log')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Audit log of all CCPA deletions for this company' })
  getDeletionLog(@CurrentUser() user: AuthUser) {
    return this.svc.getDeletionLog(user.companyId);
  }
}
