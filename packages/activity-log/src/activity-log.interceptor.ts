import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import type { Queue } from 'bullmq';
import { createQueue, QueueName } from '@tscrm/queue';
import type { ActivityLogEvent, ActivityLogService } from '@tscrm/types';
import { redact } from './redact';
import { describeAction } from './describe-action';

/**
 * Global interceptor that logs every request this service handles to the
 * activity-log queue. Never adds latency to the real response and never
 * fails the real request — enqueueing happens after the response value is
 * already flowing back to the caller, and any enqueue failure is logged and
 * swallowed.
 */
@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLogInterceptor.name);
  private readonly queue: Queue;

  constructor(private readonly service: ActivityLogService, queue?: Queue) {
    this.queue = queue ?? createQueue(QueueName.ACTIVITY_LOG);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req: any = context.switchToHttp().getRequest();
    const res: any = context.switchToHttp().getResponse();
    const start = Date.now();
    const method = req.method;
    const routePattern: string = req.route?.path ?? req.url ?? 'unknown';

    // comms-service's own /activity-log/* routes (the query API and the
    // Go-ingest endpoint) are the monitoring feed's plumbing, not something
    // to monitor — self-logging them would double every scheduling-service
    // event (once as the real action via ingest, again as this meta call).
    if (routePattern.startsWith('/activity-log')) {
      return next.handle();
    }

    // GET requests are reads — page loads, list views, polling. The feed is
    // for actions and scenarios that actually happened (a job created, a
    // technician assigned, an email sent), not a record of which screens a
    // super admin clicked through. Every mutating verb still gets logged.
    if (method === 'GET') {
      return next.handle();
    }

    const build = (status: 'SUCCESS' | 'FAILURE', statusCode: number, resBody: unknown, errorMessage?: string) => {
      const { action, description } = describeAction(this.service, method, routePattern, req.body, resBody);
      const event: ActivityLogEvent = {
        companyId: req.user?.companyId ?? null,
        service: this.service,
        method,
        path: routePattern,
        actorUserId: req.user?.userId ?? null,
        actorName: req.user?.name ?? null,
        actorRole: req.user?.role ?? null,
        action,
        description,
        status,
        statusCode,
        durationMs: Date.now() - start,
        requestSummary: redact(req.body),
        responseSummary: redact(resBody),
        ...(errorMessage ? { errorMessage } : {}),
      };
      return event;
    };

    const enqueue = (event: ActivityLogEvent) => {
      this.queue.add('log-event', event).catch((err: Error) => {
        this.logger.warn(`Failed to enqueue activity-log event: ${err.message}`);
      });
    };

    return next.handle().pipe(
      tap((body) => enqueue(build('SUCCESS', res.statusCode ?? 200, body))),
      catchError((err: any) => {
        const statusCode = err.status ?? err.statusCode ?? 500;
        enqueue(build('FAILURE', statusCode, undefined, err.message ?? 'Unknown error'));
        return throwError(() => err);
      }),
    );
  }
}
