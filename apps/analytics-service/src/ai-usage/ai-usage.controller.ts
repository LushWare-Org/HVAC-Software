import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CompanyId, JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { Role } from '@tscrm/types';
import { AiUsageService } from './ai-usage.service';

@ApiTags('AI usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-usage')
export class AiUsageController {
  constructor(private readonly usage: AiUsageService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: "This company's AI calls, cost and budget for one month" })
  @ApiQuery({ name: 'month', required: false, description: 'YYYY-MM (UTC). Defaults to the current month.' })
  async get(@CompanyId() companyId: string, @Query('month') month?: string) {
    const summary = await this.usage.summary(companyId, month || undefined);
    if (!summary) throw new BadRequestException('month must look like 2026-10');
    return summary;
  }
}
