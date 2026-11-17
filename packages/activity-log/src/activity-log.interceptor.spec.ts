import { of, throwError } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { ActivityLogInterceptor } from './activity-log.interceptor';

function makeContext(opts: {
  method: string;
  route: string;
  user?: any;
  body?: any;
}): ExecutionContext {
  const req: any = {
    method: opts.method,
    body: opts.body ?? {},
    user: opts.user,
    route: { path: opts.route },
  };
  const res: any = { statusCode: 200 };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as any;
}

describe('ActivityLogInterceptor', () => {
  it('enqueues a SUCCESS event with actor info pulled from request.user', (done) => {
    const enqueued: any[] = [];
    const interceptor = new ActivityLogInterceptor('jobs', {
      add: async (_name: string, event: any) => enqueued.push(event),
    } as any);

    const context = makeContext({
      method: 'POST',
      route: '/jobs',
      user: { userId: 'u1', name: 'Jane', role: 'dispatcher', companyId: 'co-1' },
      body: { title: 'Fix AC' },
    });
    const handler: CallHandler = { handle: () => of({ id: 'j1', title: 'Fix AC' }) };

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(enqueued).toHaveLength(1);
        expect(enqueued[0]).toMatchObject({
          service: 'jobs',
          companyId: 'co-1',
          actorUserId: 'u1',
          actorRole: 'dispatcher',
          status: 'SUCCESS',
          statusCode: 200,
          action: 'job.created',
        });
        done();
      },
    });
  });

  it('enqueues a FAILURE event and rethrows when the handler errors', (done) => {
    const enqueued: any[] = [];
    const interceptor = new ActivityLogInterceptor('jobs', {
      add: async (_name: string, event: any) => enqueued.push(event),
    } as any);

    const context = makeContext({ method: 'POST', route: '/jobs' });
    const handler: CallHandler = {
      handle: () => throwError(() => Object.assign(new Error('boom'), { status: 400 })),
    };

    interceptor.intercept(context, handler).subscribe({
      error: (err: any) => {
        expect(err.message).toBe('boom');
        expect(enqueued).toHaveLength(1);
        expect(enqueued[0]).toMatchObject({ status: 'FAILURE', statusCode: 400, errorMessage: 'boom' });
        done();
      },
    });
  });

  it('never throws when the queue enqueue itself fails', (done) => {
    const interceptor = new ActivityLogInterceptor('jobs', {
      add: async () => { throw new Error('redis down'); },
    } as any);

    const context = makeContext({ method: 'GET', route: '/jobs' });
    const handler: CallHandler = { handle: () => of([]) };

    interceptor.intercept(context, handler).subscribe({
      next: (val: unknown) => expect(val).toEqual([]),
      complete: () => done(),
    });
  });

  it('never logs GET requests — reads are not actions', (done) => {
    const enqueued: any[] = [];
    const interceptor = new ActivityLogInterceptor('jobs', {
      add: async (_name: string, event: any) => enqueued.push(event),
    } as any);

    const context = makeContext({ method: 'GET', route: '/jobs' });
    const handler: CallHandler = { handle: () => of([{ id: 'j1' }]) };

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(enqueued).toHaveLength(0);
        done();
      },
    });
  });

  it('never self-logs comms-service\'s own /activity-log/* routes', (done) => {
    const enqueued: any[] = [];
    const interceptor = new ActivityLogInterceptor('comms', {
      add: async (_name: string, event: any) => enqueued.push(event),
    } as any);

    const context = makeContext({ method: 'POST', route: '/activity-log/ingest' });
    const handler: CallHandler = { handle: () => of({ accepted: true }) };

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(enqueued).toHaveLength(0);
        done();
      },
    });
  });
});
