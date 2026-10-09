import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { DirectNotifyService } from './direct-notify.service';
import { DirectNotifyDto } from './direct-notify.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class DirectNotifyController {
  constructor(private readonly service: DirectNotifyService) {}

  // Staff only, like the other send routes: it goes out under the company's own identity.
  @Post('direct')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Email and/or push one customer or team member; reports what happened on each channel' })
  send(@CurrentUser() user: AuthUser, @Body() dto: DirectNotifyDto) {
    return this.service.send(user.companyId, dto);
  }
}
