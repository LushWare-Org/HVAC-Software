import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { IsString, IsOptional, IsBoolean, IsIn, MaxLength } from 'class-validator';
import { PostsService } from './posts.service';

class PostBodyDto {
  @IsOptional() @IsString() @IsIn(['TIP', 'VIDEO', 'OFFER']) type?: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) body?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() heroImageUrl?: string;
  @IsOptional() @IsBoolean() isPinned?: boolean;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

class CreatePostDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @IsIn(['TIP', 'VIDEO', 'OFFER']) type?: string;
  @IsOptional() @IsString() @MaxLength(5000) body?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() heroImageUrl?: string;
  @IsOptional() @IsBoolean() isPinned?: boolean;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  /** Published posts — any authed role (customers read this). */
  @Get()
  @ApiOperation({ summary: 'List published posts (all roles)' })
  list(@CurrentUser() user: AuthUser, @Query('type') type?: string) {
    return this.posts.listPublished(user.companyId, type);
  }

  /** Latest published TIP/VIDEO for the dashboard card. */
  @Get('latest-tip')
  @ApiOperation({ summary: 'Latest published tip/video for dashboard card' })
  latestTip(@CurrentUser() user: AuthUser) {
    return this.posts.latestTip(user.companyId);
  }

  /** All posts (draft + published) — staff only. */
  @Get('admin')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'All posts including drafts (staff)' })
  listAll(@CurrentUser() user: AuthUser) {
    return this.posts.listAll(user.companyId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Create a post' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.posts.create(user.companyId, dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update a post' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: PostBodyDto) {
    return this.posts.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.posts.remove(user.companyId, id);
  }
}
