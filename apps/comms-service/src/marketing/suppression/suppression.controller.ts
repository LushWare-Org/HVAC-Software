import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser, Roles, JwtAuthGuard, RolesGuard } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { SuppressionService } from './suppression.service';
import { AddSuppressionDto, RemoveSuppressionDto } from './suppression.dto';

@ApiTags('Marketing — Suppression')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/suppressions')
export class SuppressionController {
  constructor(private readonly suppressionService: SuppressionService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Manually add an address to the suppression list' })
  async add(@CurrentUser() user: AuthUser, @Body() dto: AddSuppressionDto): Promise<void> {
    await this.suppressionService.addSuppression(user.companyId, dto.channel, dto.address, dto.reason);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Remove an address from the suppression list (re-subscribe)' })
  async remove(@CurrentUser() user: AuthUser, @Body() dto: RemoveSuppressionDto): Promise<void> {
    await this.suppressionService.removeSuppression(user.companyId, dto.channel, dto.address);
  }
}
