/**
 * RBAC regression tests: the customer-portal's My Equipment list on a house was
 * previously staff-only, silently 403ing the customer's own equipment reads.
 * Locking in that both read and the new customer-facing add-equipment endpoint
 * carry Role.CUSTOMER in their metadata, via reflection rather than a full
 * e2e harness (same approach as users.controller.spec.ts).
 */
import { ROLES_KEY } from '@tscrm/auth-client';
import { Role } from '@tscrm/types';
import { HousesController } from './houses.controller';

describe('HousesController RBAC', () => {
  it('GET :id/equipment allows staff AND the customer role (portal reads their own equipment)', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, HousesController.prototype.listEquipment);
    expect(roles).toEqual(expect.arrayContaining([Role.COMPANY_ADMIN, Role.CUSTOMER]));
  });

  it('POST :id/equipment allows staff AND the customer role (portal self-service add)', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, HousesController.prototype.addEquipment);
    expect(roles).toEqual(expect.arrayContaining([Role.COMPANY_ADMIN, Role.CUSTOMER]));
  });

  it('GET :id (staff house detail) does NOT allow the customer role', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, HousesController.prototype.findOne);
    expect(roles).not.toContain(Role.CUSTOMER);
  });

  it('PATCH :id/equipment/:equipmentId (apply AI scan suggestions) is staff-only', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, HousesController.prototype.updateEquipment);
    expect(roles).toEqual(expect.arrayContaining([Role.COMPANY_ADMIN]));
    expect(roles).not.toContain(Role.CUSTOMER);
  });
});
