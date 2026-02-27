import { SetMetadata } from '@nestjs/common';
import { Role } from '@tscrm/types';

export const ROLES_KEY = 'roles';

/**
 * Restrict an endpoint to specific roles.
 *
 * @example
 * @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete(':id')
 * deleteCustomer(...) { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
