import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsInt, IsOptional, Min, Max,
} from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { ReviewsService } from './reviews.service';

class CreateReviewDto {
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() jobId?: string;
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() platform?: string;
  @IsOptional() @IsString() source?: string;   // accepted but not persisted
}

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List reviews' })
  @ApiQuery({ name: 'customerId', required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('customerId') customerId?: string,
  ) {
    return this.reviewsService.findAll(user.companyId, customerId);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Create a review' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.companyId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviewsService.findOne(user.companyId, id);
  }
}
