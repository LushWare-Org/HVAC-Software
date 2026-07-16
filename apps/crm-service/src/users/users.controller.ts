import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { UsersService } from './users.service';
import { RegisterPushTokenDto } from './dto/push-token.dto';

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

  @Get(':id/login-history')
  @ApiOperation({ summary: 'Get login history for a team member (last 20)' })
  getLoginHistory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.usersService.getLoginHistory(user.companyId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
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

  @Post('me/push-token')
  @ApiOperation({
    summary: 'Register / refresh the current user\'s push notification token',
    description:
      'Idempotent. Called by the technician app at login and whenever Expo/FCM/APNs rotates the token. ' +
      'comms-service reads pushToken via the CompanyUser record when dispatching PUSH notifications.',
  })
  registerPushToken(
    @CurrentUser() user: AuthUser,
    @Body() body: RegisterPushTokenDto,
  ) {
    return this.usersService.registerPushToken(
      user.companyId,
      user.userId,
      body.token,
      body.platform,
    );
  }

  @Delete('me/push-token')
  @ApiOperation({ summary: 'Clear the current user\'s push token (called on logout)' })
  clearPushToken(@CurrentUser() user: AuthUser) {
    return this.usersService.clearPushToken(user.companyId, user.userId);
  }

  // ---- Avatar (technician photo shown to customers in en-route emails) ----
  // NOTE: 'me/avatar' must stay declared before ':id/avatar' or Express
  // matches 'me' as an :id.

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload/replace the current user\'s profile photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadMyAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No photo uploaded');
    return this.usersService.setMyAvatar(user.companyId, user.userId, file);
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove the current user\'s profile photo' })
  removeMyAvatar(@CurrentUser() user: AuthUser) {
    return this.usersService.removeMyAvatar(user.companyId, user.userId);
  }

  @Post(':id/avatar')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Upload/replace a team member\'s profile photo (admin)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadUserAvatar(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No photo uploaded');
    return this.usersService.setUserAvatar(user.companyId, id, file);
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
