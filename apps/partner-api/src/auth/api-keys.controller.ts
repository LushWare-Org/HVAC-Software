import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { PartnerPublic } from './public.decorator';
import { ALL_PARTNER_SCOPES } from './scopes';

@ApiTags('Admin — API keys')
@ApiBearerAuth()
@PartnerPublic()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/keys')
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get('scopes')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List every scope that can be granted to a partner' })
  listScopes() {
    return { scopes: ALL_PARTNER_SCOPES };
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Issue a new partner API key' })
  @ApiResponse({
    status: 201,
    description:
      'The plaintext key is returned ONCE in the `key` field and is not recoverable afterwards.',
  })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateApiKeyDto) {
    return this.apiKeys.create({
      companyId: user.companyId,
      name: dto.name,
      scopes: dto.scopes,
      environment: dto.environment,
      rateLimitPerMin: dto.rateLimitPerMin,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      createdBy: user.userId ?? user.email,
    });
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'List this company’s partner keys (secrets omitted)' })
  list(@CurrentUser() user: AuthUser) {
    return this.apiKeys.list(user.companyId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Revoke a partner API key immediately' })
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.apiKeys.revoke(user.companyId, id);
  }
}
