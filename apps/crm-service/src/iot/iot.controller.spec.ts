import { NotFoundException } from '@nestjs/common';
import type { AuthUser } from '@tscrm/types';
import { IotController } from './iot.controller';

describe('IotController portal connect URLs', () => {
  const iot = {
    buildHoneywellAuthUrl: jest.fn().mockReturnValue('https://honeywell.example/auth?x=1'),
    buildNestAuthUrl: jest.fn().mockReturnValue('https://nest.example/auth?x=2'),
  };
  const controller = new IotController(iot as never, {} as never);
  const customer = { companyId: 'co-1', customerId: 'cust-1' } as AuthUser;
  const staff = { companyId: 'co-1' } as AuthUser;

  beforeEach(() => jest.clearAllMocks());

  it('returns the Honeywell URL for a customer, tagged as portal', () => {
    expect(controller.connectHoneywellPortalUrl(customer)).toEqual({ url: 'https://honeywell.example/auth?x=1' });
    expect(iot.buildHoneywellAuthUrl).toHaveBeenCalledWith('co-1', 'cust-1', 'portal');
  });

  it('returns the Nest URL for a customer, tagged as portal', () => {
    expect(controller.connectNestPortalUrl(customer)).toEqual({ url: 'https://nest.example/auth?x=2' });
    expect(iot.buildNestAuthUrl).toHaveBeenCalledWith('co-1', 'cust-1', 'portal');
  });

  it('rejects a non-customer account on both endpoints', () => {
    expect(() => controller.connectHoneywellPortalUrl(staff)).toThrow(NotFoundException);
    expect(() => controller.connectNestPortalUrl(staff)).toThrow(NotFoundException);
    expect(iot.buildHoneywellAuthUrl).not.toHaveBeenCalled();
    expect(iot.buildNestAuthUrl).not.toHaveBeenCalled();
  });
});
