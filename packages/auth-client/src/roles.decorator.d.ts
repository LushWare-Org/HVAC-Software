import { Role } from '@tscrm/types';
export declare const ROLES_KEY = "roles";
/**
 * Restrict an endpoint to specific roles.
 *
 * @example
 * @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete(':id')
 * deleteCustomer(...) { ... }
 */
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
//# sourceMappingURL=roles.decorator.d.ts.map