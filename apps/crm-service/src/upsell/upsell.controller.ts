import { Controller, Get, Param, Post, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { UpsellAgentService } from './upsell-agent.service';

@ApiTags('Upsell')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upsell')
export class UpsellController {
  constructor(private readonly upsellAgent: UpsellAgentService) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'List upsell recommendations ranked by priority' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listRecommendations(
    @CurrentUser() user: AuthUser,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.upsellAgent.listRecommendations(user.companyId, limit);
  }

  @Post('customers/:customerId/recommendations')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Generate an upsell recommendation for a customer' })
  @ApiParam({ name: 'customerId', type: String })
  recommendForCustomer(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
  ) {
    return this.upsellAgent.recommendForCustomer(user.companyId, customerId, 'manual');
  }

  @Post('run')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Run the upsell recommendation batch' })
  runBatch() {
    return this.upsellAgent.runDailyBatch();
  }
}
