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
import { TemplatesService } from './templates.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  RenderTemplateDto,
  TemplateTypeEnum,
  ChannelEnum,
} from './dto/template.dto';
import { Channel, TemplateType } from '../prisma/generated';

@ApiTags('Notification Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification template' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.service.create(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List templates' })
  @ApiQuery({ name: 'type', enum: TemplateTypeEnum, required: false })
  @ApiQuery({ name: 'channel', enum: ChannelEnum, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('type') type?: TemplateType,
    @Query('channel') channel?: Channel,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll(user.companyId, {
      type,
      channel,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.service.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.companyId, id);
  }

  @Post(':id/render')
  @ApiOperation({ summary: 'Preview rendered template with a test context' })
  render(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RenderTemplateDto,
  ) {
    return this.service.render(user.companyId, id, dto.context);
  }
}
