import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
} from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ---- Customer Portal: Get own profile ----
  @Get('me')
  @ApiOperation({ summary: 'Get current customer portal user\'s customer profile' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.customersService.findMe(user.companyId, user.userId);
  }

  // ---- Customer Portal: Update own profile ----
  @Patch('me')
  @ApiOperation({ summary: 'Update current customer portal user\'s customer profile' })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: { firstName?: string; lastName?: string; phone?: string; mobile?: string; address?: string; city?: string; state?: string; zipCode?: string },
  ) {
    return this.customersService.updateMe(user.companyId, user.userId, dto);
  }

  // ---- Create ----
  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Create a new customer' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(user.companyId, dto);
  }

  // ---- List (paginated, searchable) ----
  @Get()
  @ApiOperation({ summary: 'List all customers (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    const active = isActive === 'false' ? false : isActive === 'true' ? true : undefined;
    return this.customersService.findAll(user.companyId, page, limit, search, type, active);
  }

  // ---- Stats ----
  @Get('stats')
  @ApiOperation({ summary: 'Get customer count statistics' })
  getStats(@CurrentUser() user: AuthUser) {
    return this.customersService.getStats(user.companyId);
  }

  // ---- Win-back candidates (internal — called by comms-service automation) ----
  @Get('winback-candidates')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Return INACTIVE customers eligible for win-back automation' })
  getWinbackCandidates(
    @CurrentUser() user: AuthUser,
    @Query('companyId') queryCompanyId?: string,
    @Query('inactiveDays', new DefaultValuePipe(180), ParseIntPipe) inactiveDays?: number,
  ) {
    const companyId = user.role === Role.SUPER_ADMIN && queryCompanyId ? queryCompanyId : user.companyId;
    return this.customersService.findWinbackCandidates(companyId, inactiveDays);
  }

  // ---- Audience builder (internal — called by comms-service campaign engine) ----
  @Get('audience/count')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Count customers matching audience filters (preview)' })
  countAudience(
    @CurrentUser() user: AuthUser,
    @Query('companyId') queryCompanyId?: string,
    @Query('filters') filters?: string,
  ) {
    const companyId = user.role === Role.SUPER_ADMIN && queryCompanyId ? queryCompanyId : user.companyId;
    return this.customersService.countAudienceMembers(companyId, filters ?? '[]');
  }

  @Get('audience/members')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Resolve customer list for a saved audience' })
  resolveAudience(
    @CurrentUser() user: AuthUser,
    @Query('companyId') queryCompanyId?: string,
    @Query('filters') filters?: string,
    @Query('limit', new DefaultValuePipe(5000), ParseIntPipe) limit?: number,
  ) {
    const companyId = user.role === Role.SUPER_ADMIN && queryCompanyId ? queryCompanyId : user.companyId;
    return this.customersService.resolveAudienceMembers(companyId, filters ?? '[]', limit);
  }

  // ---- Hover summary ----
  @Get(':id/status-summary')
  @ApiOperation({ summary: 'Get customer status, churn risk, failure risk, and next step summary' })
  @ApiParam({ name: 'id', type: String })
  getStatusSummary(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.customersService.getStatusSummary(user.companyId, id);
  }

  // ---- Get one ----
  @Get(':id')
  @ApiOperation({ summary: 'Get a single customer with contacts and history' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(user.companyId, id);
  }

  // ---- Update ----
  @Put(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Update a customer' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.companyId, id, dto);
  }

  // ---- Soft delete ----
  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate (soft-delete) a customer' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.customersService.remove(user.companyId, id);
  }

  // ── Per-customer recommendation execute endpoints ────────────────────────────

  @Post(':id/followup')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Trigger an immediate follow-up action for a customer' })
  @ApiParam({ name: 'id', type: String })
  triggerFollowup(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.customersService.executeFollowup(user.companyId, id);
  }

  @Post(':id/retention')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Trigger a retention action for a customer' })
  @ApiParam({ name: 'id', type: String })
  triggerRetention(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.customersService.executeRetention(user.companyId, id);
  }

  // Equipment endpoints live in EquipmentController under customers/:customerId/equipment
  // to avoid route-registration collisions in this controller.
}
