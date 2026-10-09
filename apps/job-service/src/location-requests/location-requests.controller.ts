import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { LocationRequestsService, type RequestChannel } from './location-requests.service';

class RequestLocationDto {
  @IsArray() @IsIn(['message', 'email', 'push'], { each: true }) channels!: RequestChannel[];
}

class SharedLocationDto {
  @IsNumber() lat!: number;
  @IsNumber() lng!: number;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
}

/** Staff ask, customers answer from their portal. */
@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class LocationRequestsController {
  constructor(private readonly service: LocationRequestsService) {}

  @Post(':id/location-request')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ask the customer to mark the visit on a map (message, email and/or push)' })
  request(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RequestLocationDto) {
    return this.service.request(user, id, dto.channels);
  }

  @Post(':id/customer-location')
  @Roles(Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'A customer marks where their own visit is' })
  customerLocation(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SharedLocationDto) {
    return this.service.submitByCustomer(user, id, dto);
  }
}

/**
 * Public: reached from the emailed or messaged link, no login. The signed token
 * in the URL is the only key, and it only opens this one job's location.
 */
@ApiTags('Jobs')
@Controller('location-requests')
export class PublicLocationRequestsController {
  constructor(private readonly service: LocationRequestsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'The visit a share-location link is for (public)' })
  preview(@Param('token') token: string) {
    return this.service.preview(token);
  }

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save the location the customer marked (public)' })
  submit(@Param('token') token: string, @Body() dto: SharedLocationDto) {
    return this.service.submitByToken(token, dto);
  }
}
