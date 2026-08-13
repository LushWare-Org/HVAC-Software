import { ROLES_KEY } from '@tscrm/auth-client';
import { Role } from '@tscrm/types';
import { DocumentTemplatesController } from './document-templates.controller';

describe('DocumentTemplatesController RBAC', () => {
  it('POST / is staff-only', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, DocumentTemplatesController.prototype.create);
    expect(roles).toEqual(expect.arrayContaining([Role.COMPANY_ADMIN]));
    expect(roles).not.toContain(Role.CUSTOMER);
  });

  it('DELETE :id is staff-only', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, DocumentTemplatesController.prototype.remove);
    expect(roles).toEqual(expect.arrayContaining([Role.COMPANY_ADMIN]));
    expect(roles).not.toContain(Role.CUSTOMER);
  });

  it('POST letterhead-upload is staff-only', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, DocumentTemplatesController.prototype.uploadLetterhead);
    expect(roles).toEqual(expect.arrayContaining([Role.COMPANY_ADMIN]));
    expect(roles).not.toContain(Role.CUSTOMER);
  });
});
