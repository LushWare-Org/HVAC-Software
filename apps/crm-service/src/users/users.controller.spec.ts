/**
 * Regression test for a real cross-tenant gap: POST /crm/users had no @Roles
 * guard at all, so any authenticated user (including technician/customer) could
 * call it and pass role: 'company_admin'. Locking in the fix via metadata
 * reflection rather than a full e2e harness — this is just checking the guard
 * is wired, not re-testing RolesGuard's own logic.
 */
import { ROLES_KEY } from '@tscrm/auth-client';
import { Role } from '@tscrm/types';
import { UsersController } from './users.controller';

describe('UsersController RBAC', () => {
  it('POST / (create) requires an admin/office/dispatcher role', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.create);
    expect(roles).toEqual(
      expect.arrayContaining([Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER]),
    );
    expect(roles).not.toContain(Role.TECHNICIAN);
    expect(roles).not.toContain(Role.CUSTOMER);
  });
});
