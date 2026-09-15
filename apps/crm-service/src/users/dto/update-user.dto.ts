import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Admin edit of a team member.
 *
 * This used to be an untyped inline object on the controller, which meant two
 * things at once: class-validator had no metadata to whitelist against, so any
 * property was accepted verbatim; and the route had no role guard, so any
 * signed-in account — including a customer who had registered themselves a
 * minute earlier — could PATCH `{ role: 'company_admin' }` onto their own user
 * and become an administrator of the tenant.
 *
 * The roles here are the ones an admin may hand out. super_admin is deliberately
 * absent; the controller allows it only when the caller is already one.
 */
const ASSIGNABLE_ROLES = ['company_admin', 'office_manager', 'dispatcher', 'technician', 'customer', 'super_admin'] as const;

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @IsOptional() @IsIn(ASSIGNABLE_ROLES)
  role?: (typeof ASSIGNABLE_ROLES)[number];

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
