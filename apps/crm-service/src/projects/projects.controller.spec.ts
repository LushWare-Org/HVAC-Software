import { ROLES_KEY } from '@tscrm/auth-client';
import { Role } from '@tscrm/types';
import { ProjectsController } from './projects.controller';

const rolesOf = (method: keyof ProjectsController) => Reflect.getMetadata(ROLES_KEY, ProjectsController.prototype[method]) as Role[] | undefined;

describe('ProjectsController access', () => {
  it("customers can't read the company's projects: list, detail and rosters are for staff and technicians", () => {
    for (const m of ['list', 'findOne', 'rostersByDate', 'roster'] as const) {
      const roles = rolesOf(m);
      expect(roles).toBeDefined();
      expect(roles).not.toContain(Role.CUSTOMER);
      expect(roles).toEqual(expect.arrayContaining([Role.TECHNICIAN, Role.DISPATCHER, Role.OFFICE_MANAGER]));
    }
  });

  it('customers keep their own projects', () => {
    expect(rolesOf('mine')).toBeUndefined();
  });
});
