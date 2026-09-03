import { Reflector } from '@nestjs/core';
import { HealthController } from './health.controller';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';

describe('HealthController', () => {
  it('reports service identity', () => {
    expect(new HealthController().check()).toEqual({
      status: 'ok',
      service: 'partner-api',
    });
  });

  // Regression: the API-key guard is registered globally, so without an
  // explicit opt-out the health endpoint answers 401 and Cloud Run marks the
  // revision unhealthy.
  it('is exempt from the global API-key guard', () => {
    const isPublic = new Reflector().get<boolean>(
      IS_PUBLIC_KEY,
      HealthController.prototype.check,
    );
    expect(isPublic).toBe(true);
  });
});
