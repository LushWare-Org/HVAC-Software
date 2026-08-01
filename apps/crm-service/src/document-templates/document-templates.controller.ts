import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { IsString, IsOptional, IsBoolean, IsInt, IsIn, IsArray } from 'class-validator';
import { DocumentTemplatesService } from './document-templates.service';

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER];

class UpsertTemplateDto {
  @IsIn(['INVOICE', 'QUOTE', 'AGREEMENT']) documentType!: 'INVOICE' | 'QUOTE' | 'AGREEMENT';
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsIn(['BUILDER', 'LETTERHEAD']) mode?: 'BUILDER' | 'LETTERHEAD';
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() companyAddress?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsIn(['LEFT', 'CENTER', 'RIGHT']) logoPosition?: string;
  @IsOptional() @IsString() accentColor?: string;
  @IsOptional() @IsString() headerText?: string;
  @IsOptional() @IsString() footerText?: string;
  @IsOptional() @IsString() bankDetails?: string;
  @IsOptional() @IsBoolean() showPageNumbers?: boolean;
  @IsOptional() @IsString() letterheadImageUrl?: string;
  @IsOptional() @IsInt() letterheadTopMarginPx?: number;
  @IsOptional() @IsInt() letterheadBottomMarginPx?: number;
  @IsOptional() @IsArray() rows?: Array<{ id: string; blocks: Array<{ id: string; slot: string; widthPct: number; style?: Record<string, unknown> }> }>;
}

@ApiTags('Document Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('document-templates')
export class DocumentTemplatesController {
  constructor(private readonly templates: DocumentTemplatesService) {}

  // Static routes MUST precede ':id'.

  @Get('resolve')
  @ApiOperation({ summary: 'Resolve the active template for a document type (service-to-service + UI use)' })
  resolve(
    @CurrentUser() user: AuthUser,
    @Query('documentType') documentType: string,
    @Query('templateId') templateId?: string,
  ) {
    return this.templates.resolve(user.companyId, documentType, templateId);
  }

  @Post('letterhead-upload')
  @Roles(...STAFF_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a letterhead image or PDF (converted to an image once)' })
  uploadLetterhead(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.templates.uploadLetterhead(user.companyId, file);
  }

  @Post('logo-upload')
  @Roles(...STAFF_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a template logo image' })
  uploadLogo(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.templates.uploadLogo(user.companyId, file);
  }

  @Get()
  @ApiOperation({ summary: 'List templates, optionally filtered by documentType' })
  list(@CurrentUser() user: AuthUser, @Query('documentType') documentType?: string) {
    return this.templates.list(user.companyId, documentType);
  }

  @Post()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Create a named template' })
  create(@CurrentUser() user: AuthUser, @Body() dto: UpsertTemplateDto) {
    return this.templates.create(user.companyId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Update a template' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: Partial<UpsertTemplateDto>) {
    return this.templates.update(user.companyId, id, dto);
  }

  @Post(':id/set-default')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: "Make this the document type's default template" })
  setDefault(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.setDefault(user.companyId, id);
  }

  @Delete(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Delete a template (blocked if it is the only one for its type)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.remove(user.companyId, id);
  }
}
