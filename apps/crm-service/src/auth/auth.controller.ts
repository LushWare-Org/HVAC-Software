import { Body, Controller, Post, Get, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsArray, IsNumber } from 'class-validator';
import { CurrentUser, JwtAuthGuard, RolesGuard, Roles } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { AuthService } from './auth.service';

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

// ─── DTOs ──────────────────────────────────────────────────────────────────────

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

class RegisterDto {
  @IsString() companyId!: string;
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zipCode?: string;
}

class RegisterTechnicianDto {
  @IsString() companyId!: string;
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() phone!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsArray() skills?: string[];
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() notes?: string;
}

class ChangePasswordDto {
  @IsString() @MinLength(6) currentPassword!: string;
  @IsString() @MinLength(8) newPassword!: string;
}

class ForceResetPasswordDto {
  @IsString() @MinLength(8) newPassword!: string;
}

class ProvisionLeadDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() serviceInterest?: string;
}

class ProvisionTechnicianDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsArray() skills?: string[];
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsNumber() maxDailyJobs?: number;
}

// ─── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Customer self-registration — creates user + customer record + lead' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register-technician')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Technician self-registration — creates pending account awaiting admin approval' })
  registerTechnician(@Body() dto: RegisterTechnicianDto) {
    return this.authService.registerTechnician(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (authenticated)' })
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.companyId, user.userId, dto.currentPassword, dto.newPassword);
  }

  /**
   * Force reset password — called on first login when mustResetPassword=true.
   * User is authenticated (has a valid token from just logging in) but can only
   * call this endpoint until they reset; the frontend blocks navigation otherwise.
   */
  @Post('force-reset-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forced first-login password reset — clears mustResetPassword flag' })
  forceResetPassword(@CurrentUser() user: AuthUser, @Body() dto: ForceResetPasswordDto) {
    return this.authService.forceResetPassword(user.userId, user.companyId, dto.newPassword);
  }

  /**
   * Check if an email already has an account in this company.
   * Used by admin modals for real-time validation before provisioning.
   */
  @Get('check-email')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if email already has an account' })
  @ApiQuery({ name: 'email', required: true })
  @ApiQuery({ name: 'companyId', required: false, description: 'Defaults to caller company' })
  checkEmail(@CurrentUser() user: AuthUser, @Query('email') email: string) {
    return this.authService.checkEmailExists(user.companyId, email);
  }

  /**
   * Admin provisions a customer account when adding a lead.
   * Creates CompanyUser + Customer + Lead, sends welcome email with temp password.
   */
  @Post('provision-lead')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: create lead + customer portal account with temp password' })
  provisionLead(@CurrentUser() user: AuthUser, @Body() dto: ProvisionLeadDto) {
    return this.authService.provisionLeadAccount(user.companyId, dto);
  }

  /**
   * Admin provisions a technician account.
   * Creates CompanyUser (approved), sends welcome email with temp password.
   */
  @Post('provision-technician')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: create approved technician account with temp password' })
  provisionTechnician(@CurrentUser() user: AuthUser, @Body() dto: ProvisionTechnicianDto) {
    return this.authService.provisionTechnicianAccount(user.companyId, dto);
  }
}
