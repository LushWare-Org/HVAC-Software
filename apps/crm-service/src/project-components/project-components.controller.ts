import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ProjectComponentsService } from './project-components.service';
import { EquipmentService } from '../equipment/equipment.service';

class UpsertComponentDto {
  @IsOptional() @IsString() typeLabel?: string;
  @IsOptional() @IsBoolean() typeAssignable?: boolean;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() ownerCustomerId?: string;
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

class ComponentEquipmentDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() serialNo?: string;
  @IsOptional() @IsString() installDate?: string;
  @IsOptional() @IsString() warrantyEnd?: string;
  @IsOptional() @IsString() notes?: string;
}

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

// ── Nested under a project: list/create components for a templated project ──
@ApiTags('Project Components')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/components')
export class ProjectComponentsNestedController {
  constructor(private readonly components: ProjectComponentsService) {}

  @Get()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'List components for a project' })
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.components.listForProject(user.companyId, projectId);
  }

  @Post()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Add a component to a project' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpsertComponentDto & { typeLabel: string; label: string },
  ) {
    return this.components.create(user.companyId, projectId, dto);
  }
}

// ── Everything else: component detail, ownership, equipment, issues, portal ──
@ApiTags('Project Components')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('components')
export class ProjectComponentsController {
  constructor(
    private readonly components: ProjectComponentsService,
    private readonly equipmentService: EquipmentService,
  ) {}

  // Static routes MUST precede ':id'.

  @Get('mine')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Portal: components owned by the logged-in customer' })
  mine(@CurrentUser() user: AuthUser) {
    if (!user.customerId) throw new ForbiddenException('Customer account required');
    return this.components.mine(user.companyId, user.customerId);
  }

  @Get('mine/issues')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Portal: my past issue reports across all my components' })
  myIssues(@CurrentUser() user: AuthUser) {
    if (!user.customerId) throw new ForbiddenException('Customer account required');
    return this.components.listMyIssues(user.companyId, user.customerId);
  }

  @Get('issues/open')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Every open/acknowledged issue report across all components (dashboard + project alerts)' })
  openIssues(@CurrentUser() user: AuthUser) {
    return this.components.openIssuesForCompany(user.companyId);
  }

  @Get(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Component detail (owner, account status, equipment/issue counts)' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.components.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Update a component (label/tags/notes)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpsertComponentDto) {
    return this.components.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Remove a component' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.components.remove(user.companyId, id);
  }

  @Patch(':id/owner')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: "Assign or clear a component's owner (customerId: null clears)" })
  assignOwner(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AssignOwnerDto) {
    return this.components.assignOwner(user.companyId, id, dto.customerId ?? null);
  }

  @Post(':id/generate-account')
  @Roles(...STAFF_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate/send portal login for the component's owner (temp password email)" })
  generateAccount(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.components.generateOwnerAccount(user.companyId, id);
  }

  // ── Equipment (scoped to this component) ────────────────────────────────

  @Get(':id/equipment')
  @Roles(...STAFF_WRITE, Role.CUSTOMER)
  @ApiOperation({ summary: 'List equipment for a component' })
  async listEquipment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.assertReadAccess(user, id);
    return this.equipmentService.findByComponent(user.companyId, id);
  }

  @Post(':id/equipment')
  @Roles(...STAFF_WRITE, Role.CUSTOMER)
  @ApiOperation({ summary: "Add equipment to a component (owner must be assigned first)" })
  async addEquipment(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ComponentEquipmentDto) {
    if (user.role === Role.CUSTOMER) await this.assertOwnsComponent(user, id);
    return this.equipmentService.createForComponent(user.companyId, id, dto);
  }

  @Patch(':id/equipment/:equipmentId')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: "Update a component's equipment item (brand/model/serial, typically applying an AI scan suggestion)" })
  async updateEquipment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: ComponentEquipmentDto,
  ) {
    await this.assertReadAccess(user, id);
    return this.equipmentService.update(user.companyId, equipmentId, dto);
  }

  // ── Issue reports ────────────────────────────────────────────────────────

  @Get(':id/issues')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'List issue reports for a component (staff)' })
  listIssues(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.components.listIssuesForComponent(user.companyId, id);
  }

  @Post(':id/issues')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Portal: report an issue (e.g. thermostat error code) on my component' })
  createIssue(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateIssueDto,
  ) {
    if (!user.customerId) throw new ForbiddenException('Customer account required');
    return this.components.createIssue(user.companyId, user.customerId, id, dto);
  }

  @Patch(':id/issues/:issueId')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Acknowledge/resolve an issue report (staff)' })
  updateIssue(
    @CurrentUser() user: AuthUser,
    @Param('issueId') issueId: string,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.components.updateIssueStatus(user.companyId, issueId, dto);
  }

  // ── Ownership checks for customer-facing routes ─────────────────────────

  private async assertOwnsComponent(user: AuthUser, componentId: string) {
    if (!user.customerId) throw new ForbiddenException('Customer account required');
    const ownerCustomerId = await this.components.getOwnerCustomerId(user.companyId, componentId);
    if (ownerCustomerId !== user.customerId) throw new ForbiddenException('You can only manage your own component');
  }

  private async assertReadAccess(user: AuthUser, componentId: string) {
    if (user.role === Role.CUSTOMER) await this.assertOwnsComponent(user, componentId);
  }
}
