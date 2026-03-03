"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'roles';
/**
 * Restrict an endpoint to specific roles.
 *
 * @example
 * @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete(':id')
 * deleteCustomer(...) { ... }
 */
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
//# sourceMappingURL=roles.decorator.js.map