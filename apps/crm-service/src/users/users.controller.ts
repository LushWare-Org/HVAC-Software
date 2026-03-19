import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List company users with optional filters' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.usersService.findAll(user.companyId, {
      role,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('pending-technicians')
  @ApiOperation({ summary: 'List technicians awaiting approval' })
  getPendingTechnicians(@CurrentUser() user: AuthUser) {
    return this.usersService.getPendingTechnicians(user.companyId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findMe(user.companyId, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.usersService.findOne(user.companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new company user (invite)' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; email: string; phone?: string; role?: string },
  ) {
    return this.usersService.create(user.companyId, body);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a pending technician application' })
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.usersService.approveTechnician(user.companyId, id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a pending technician application' })
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return this.usersService.rejectTechnician(user.companyId, id, body.note);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile (name/phone)' })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() body: { name?: string; phone?: string },
  ) {
    return this.usersService.updateMe(user.companyId, user.userId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; phone?: string; role?: string; isActive?: boolean },
  ) {
    return this.usersService.update(user.companyId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.usersService.remove(user.companyId, id);
  }
}
