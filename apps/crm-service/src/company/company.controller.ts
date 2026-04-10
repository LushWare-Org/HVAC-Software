import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { CompanyService } from './company.service';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

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
}
