import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body,
  UseGuards, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { IsString, IsOptional, IsArray } from 'class-validator';
import { HousesService } from './houses.service';
import { EquipmentService } from '../equipment/equipment.service';

class UpsertHouseDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() notes?: string;
}

class AssignOwnerDto {
  @IsOptional() @IsString() customerId?: string | null;
}

class CreateIssueDto {
  @IsOptional() @IsString() equipmentId?: string;
  @IsOptional() @IsString() errorCode?: string;
  @IsOptional() @IsString() description?: string;
}

class UpdateIssueDto {
  @IsString() status!: string;
  @IsOptional() @IsString() resolvedNote?: string;
}

class HouseEquipmentDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() serialNo?: string;
  @IsOptional() @IsString() installDate?: string;
  @IsOptional() @IsString() warrantyEnd?: string;
  @IsOptional() @IsString() notes?: string;
}

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

// ── Nested under a project: list/create houses for a Housing Scheme project ──
@ApiTags('Houses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/houses')
export class ProjectHousesController {
  constructor(private readonly houses: HousesService) {}

  @Get()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'List houses for a Housing Scheme project' })
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.houses.listForProject(user.companyId, projectId);
  }

  @Post()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Add a house to a Housing Scheme project' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpsertHouseDto,
  ) {
    return this.houses.create(user.companyId, projectId, dto);
  }
}

// ── Everything else: house detail, ownership, equipment, issues, portal ──
@ApiTags('Houses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('houses')
export class HousesController {
  constructor(
    private readonly houses: HousesService,
    private readonly equipmentService: EquipmentService,
  ) {}

  // Static routes MUST precede ':id'.

  @Get('mine')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Portal: houses owned by the logged-in customer' })
  mine(@CurrentUser() user: AuthUser) {
    if (!user.customerId) throw new ForbiddenException('Customer account required');
    return this.houses.mine(user.companyId, user.customerId);
  }

  @Get('mine/issues')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Portal: my past issue reports across all my houses' })
  myIssues(@CurrentUser() user: AuthUser) {
    if (!user.customerId) throw new ForbiddenException('Customer account required');
    return this.houses.listMyIssues(user.companyId, user.customerId);
  }

  @Get('issues/open')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Every open/acknowledged issue report across all houses (dashboard + project alerts)' })
  openIssues(@CurrentUser() user: AuthUser) {
    return this.houses.openIssuesForCompany(user.companyId);
  }

  @Get(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'House detail (owner, account status, equipment/issue counts)' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.houses.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Update a house (label/address/tags/notes)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpsertHouseDto) {
    return this.houses.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Remove a house' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.houses.remove(user.companyId, id);
  }

  @Patch(':id/owner')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Assign or clear a house\'s owner (customerId: null clears)' })
  assignOwner(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AssignOwnerDto) {
    return this.houses.assignOwner(user.companyId, id, dto.customerId ?? null);
  }

  @Post(':id/generate-account')
  @Roles(...STAFF_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate/send portal login for the house\'s owner (temp password email)' })
  generateAccount(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.houses.generateOwnerAccount(user.companyId, id);
  }

  // ── Equipment (scoped to this house) ────────────────────────────────────

  @Get(':id/equipment')
  @Roles(...STAFF_WRITE, Role.CUSTOMER)
  @ApiOperation({ summary: 'List equipment for a house' })
  async listEquipment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.assertReadAccess(user, id);
    return this.equipmentService.findByHouse(user.companyId, id);
  }

  @Post(':id/equipment')
  @Roles(...STAFF_WRITE, Role.CUSTOMER)
  @ApiOperation({ summary: 'Add equipment to a house (owner must be assigned first — always true for the customer\'s own request)' })
  async addEquipment(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: HouseEquipmentDto) {
    if (user.role === Role.CUSTOMER) await this.assertOwnsHouse(user, id);
    return this.equipmentService.createForHouse(user.companyId, id, dto);
  }

  // ── Issue reports ────────────────────────────────────────────────────────

  @Get(':id/issues')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'List issue reports for a house (staff)' })
  listIssues(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.houses.listIssuesForHouse(user.companyId, id);
  }

  @Post(':id/issues')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Portal: report an issue (e.g. thermostat error code) on my house' })
  createIssue(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateIssueDto,
  ) {
    if (!user.customerId) throw new ForbiddenException('Customer account required');
    return this.houses.createIssue(user.companyId, user.customerId, id, dto);
  }

  @Patch(':id/issues/:issueId')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Acknowledge/resolve an issue report (staff)' })
  updateIssue(
    @CurrentUser() user: AuthUser,
    @Param('issueId') issueId: string,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.houses.updateIssueStatus(user.companyId, issueId, dto);
  }

  // ── Ownership checks for customer-facing routes ─────────────────────────

  private async assertOwnsHouse(user: AuthUser, houseId: string) {
    if (!user.customerId) throw new ForbiddenException('Customer account required');
    const ownerCustomerId = await this.houses.getOwnerCustomerId(user.companyId, houseId);
    if (ownerCustomerId !== user.customerId) throw new ForbiddenException('You can only manage your own house');
  }

  private async assertReadAccess(user: AuthUser, houseId: string) {
    if (user.role === Role.CUSTOMER) await this.assertOwnsHouse(user, houseId);
  }
}
